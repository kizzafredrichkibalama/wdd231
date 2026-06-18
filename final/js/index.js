/**
 * index.js — Home Page JavaScript (ES Module)
 * Beyond Earth: A Spacecraft Encyclopedia
 * Author: Kizza Fredrich Kibalama | BYU-Idaho WDD 231
 *
 * THIS FILE DEMONSTRATES ES MODULES:
 *  • import { function } from 'module'  — imports exported functions
 *  • export function                    — exports reusable functions
 *  • Modular organization               — separates concerns
 *  • Code reusability                   — imports helpers from other module
 *
 * DEMONSTRATES:
 *  1. DUAL DATA INTEGRATION — NASA API + Local JSON fallback
 *  2. ASYNCHRONOUS functionality with async/await and try...catch
 *  3. DOM MANIPULATION — creating and updating elements
 *  4. ARRAY METHODS — .map(), .filter(), .find(), .splice(), Set
 *  5. TEMPLATE LITERALS — backtick strings with ${} expressions
 *  6. LOCAL STORAGE — persisting user favorites and filter preference
 *  7. EVENT LISTENERS — click, keydown, Escape key
 *  8. MODAL DIALOG — open/close with full accessibility
 *  9. ES MODULES — importing and exporting functions
 */

// ═══════════════════════════════════════════════════════════════════
// ★ IMPORTS — Demonstrates ES Modules ★
// These utility functions are exported from helpers.js and used here
// ═══════════════════════════════════════════════════════════════════
import { 
  getStatusClass, 
  getFavorites, 
  isFavorite, 
  toggleFavorite 
} from './helpers.js';

// ── STATE ────────────────────────────────────────────────────────
let allSpacecraft   = [];
let activeFilter    = localStorage.getItem('filter-choice') || 'All';
let currentSpacecraftId = null;
let nasaImagesCache = {}; // Cache NASA image results

// ── DOM REFERENCES ───────────────────────────────────────────────
const grid          = document.getElementById('spacecraft-grid');
const filtersEl     = document.getElementById('filters');
const countEl       = document.getElementById('spacecraft-count');
const overlay       = document.getElementById('modal-overlay');
const modalTitle    = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalImage    = document.getElementById('modal-image');
const modalDesc     = document.getElementById('modal-desc');
const modalSpecs    = document.getElementById('modal-specs');
const modalNotable  = document.getElementById('modal-notable');
const modalFavBtn   = document.getElementById('modal-fav-btn');
const closeBtn      = document.getElementById('modal-close');

// ═══════════════════════════════════════════════════════════════════
// EXPORTED FUNCTIONS — Can be imported by other modules
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetches spacecraft data and initializes the page
 * DEMONSTRATES: async/await with try/catch error handling
 */
export async function initPage() {
  grid.innerHTML = '<p class="loading">Loading spacecraft data…</p>';

  try {
    // STEP 1: Fetch and parse local JSON (fast, always works)
    const response = await fetch('./data/spacecraft.json');
    if (!response.ok) throw new Error(`HTTP error — status: ${response.status}`);
    allSpacecraft = await response.json();

    // STEP 2: Build filters and render cards (with local images)
    const types = ['All', ...new Set(allSpacecraft.map(s => s.type))];
    buildFilters(types);

    const filtered = activeFilter === 'All'
      ? allSpacecraft
      : allSpacecraft.filter(s => s.type === activeFilter);
    renderGrid(filtered);

    // STEP 3: Update stats
    const activeCount = allSpacecraft.filter(s => s.status === 'Active').length;
    const agencyCount = new Set(allSpacecraft.map(s => s.agency)).size;
    document.getElementById('stat-total').textContent    = allSpacecraft.length;
    document.getElementById('stat-active').textContent   = activeCount;
    document.getElementById('stat-agencies').textContent = agencyCount;

    // STEP 4: Pre-fetch NASA images in background (non-blocking)
    console.log('ℹ NASA Images loading in background...');
    allSpacecraft.forEach(spacecraft => {
      fetchNasaImage(spacecraft.name);
    });

  } catch (error) {
    grid.innerHTML = '<p class="error-msg">⚠ Could not load spacecraft data. Please refresh.</p>';
    console.error('Data load error:', error);
  }
}

/**
 * Opens the spacecraft detail modal
 */
export function openModal(s) {
  currentSpacecraftId = s.id;

  // Use NASA image if cached, otherwise use local image
  let displayImage = s.image;
  if (nasaImagesCache[s.name] && nasaImagesCache[s.name] !== null) {
    displayImage = nasaImagesCache[s.name];
  }

  modalTitle.textContent    = s.name;
  modalSubtitle.textContent = `${s.type} — ${s.agency}`;
  modalImage.src            = displayImage;
  modalImage.alt            = s.name;
  modalDesc.textContent     = s.description;
  modalNotable.innerHTML    = `<strong>Notable:</strong> ${s.notable}`;
  const sc = getStatusClass(s.status);
  modalSpecs.innerHTML = `
    <div class="spec-item"><div class="spec-label">Launched</div><div class="spec-value">${s.launched}</div></div>
    <div class="spec-item"><div class="spec-label">Status</div><div class="spec-value">
      <span class="card-status ${sc}">${s.status}</span></div></div>
    <div class="spec-item"><div class="spec-label">Mass</div><div class="spec-value">${s.mass_kg.toLocaleString()} kg</div></div>
    <div class="spec-item"><div class="spec-label">Crew</div><div class="spec-value">${s.crew === 0 ? 'Uncrewed' : s.crew}</div></div>`;
  updateFavBtn();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  closeBtn.focus();
}

/**
 * Closes the spacecraft detail modal
 */
export function closeModal() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  currentSpacecraftId = null;
}

// ═══════════════════════════════════════════════════════════════════
// PRIVATE FUNCTIONS — Used internally, not exported
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetches images from NASA Images API
 * DEMONSTRATES: async/await with try/catch error handling
 */
async function fetchNasaImage(searchTerm) {
  if (nasaImagesCache[searchTerm]) {
    return nasaImagesCache[searchTerm];
  }

  try {
    const response = await fetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(searchTerm)}&media_type=image&page_size=1`
    );

    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    const data = await response.json();

    let imageUrl = null;
    if (data.collection && data.collection.items && data.collection.items.length > 0) {
      const firstItem = data.collection.items[0];
      if (firstItem.links && firstItem.links.length > 0) {
        imageUrl = firstItem.links[0].href;
      }
    }

    nasaImagesCache[searchTerm] = imageUrl;
    console.log(`✓ NASA API: Found image for "${searchTerm}"`);
    return imageUrl;

  } catch (error) {
    console.warn(`NASA API failed for "${searchTerm}": ${error.message}`);
    nasaImagesCache[searchTerm] = null;
    return null;
  }
}

/**
 * Builds a spacecraft card from a spacecraft object
 * DEMONSTRATES: TEMPLATE LITERALS with complex expressions
 */
function buildCard(s) {
  const sc = getStatusClass(s.status);  // ← Imported function
  const star = isFavorite(s.id) ? '★' : ''; // ← Imported function
  
  let imageUrl = s.image;
  if (nasaImagesCache[s.name] && nasaImagesCache[s.name] !== null) {
    imageUrl = nasaImagesCache[s.name];
  }

  return `
    <article class="spacecraft-card" role="button" tabindex="0"
             aria-label="View details for ${s.name}" data-id="${s.id}">
      <div class="card-image">
        <img src="${imageUrl}" alt="${s.name}" loading="lazy" width="300" height="180">
        <span class="card-status ${sc}">${s.status}</span>
      </div>
      <div class="card-body">
        <div class="card-type">${s.type}</div>
        <div class="card-name">${s.name} <span class="fav-star">${star}</span></div>
        <div class="card-agency">${s.agency}</div>
        <div class="card-meta">
          <span class="card-meta-item">📅 ${s.launched}</span>
          <span class="card-meta-item">⚖️ ${s.mass_kg >= 1000 ? (s.mass_kg/1000).toFixed(1)+'t' : s.mass_kg+'kg'}</span>
          <span class="card-meta-item">${s.crew === 0 ? '🤖 Uncrewed' : '👨‍🚀 Crew: '+s.crew}</span>
        </div>
      </div>
      <div class="card-footer">${s.notable}</div>
    </article>`;
}

/**
 * Renders the spacecraft grid
 * DEMONSTRATES: DOM MANIPULATION + ARRAY METHODS (.map(), .forEach(), .find())
 */
function renderGrid(spacecraft) {
  if (spacecraft.length === 0) {
    grid.innerHTML = '<p class="loading">No spacecraft match this filter.</p>';
    countEl.textContent = '0';
    return;
  }

  grid.innerHTML = spacecraft.map(buildCard).join('');
  countEl.textContent = spacecraft.length;

  // Fetch NASA images in background (non-blocking)
  spacecraft.forEach(s => {
    fetchNasaImage(s.name).then(nasaImageUrl => {
      if (nasaImageUrl) {
        const card = grid.querySelector(`[data-id="${s.id}"] img`);
        if (card) {
          card.classList.add('nasa-loading');
          card.src = nasaImageUrl;
          setTimeout(() => { 
            card.classList.remove('nasa-loading');
            card.classList.add('nasa-loaded');
          }, 10);
        }
      }
    });
  });

  // Attach events to rendered cards
  grid.querySelectorAll('.spacecraft-card').forEach(card => {
    const id    = parseInt(card.dataset.id);
    const craft = allSpacecraft.find(s => s.id === id);
    card.addEventListener('click', () => openModal(craft));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(craft); }
    });
  });
}

/**
 * Builds filter buttons
 * DEMONSTRATES: ARRAY METHODS and EVENT LISTENERS
 */
function buildFilters(types) {
  filtersEl.innerHTML = types.map(t => `
    <button class="filter-btn${t === activeFilter ? ' active' : ''}"
            data-type="${t}" aria-pressed="${t === activeFilter}">${t}</button>
  `).join('');

  filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      activeFilter = btn.dataset.type;
      localStorage.setItem('filter-choice', activeFilter);
      filtersEl.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === activeFilter);
        b.setAttribute('aria-pressed', b.dataset.type === activeFilter);
      });
      const filtered = activeFilter === 'All'
        ? allSpacecraft
        : allSpacecraft.filter(s => s.type === activeFilter);
      renderGrid(filtered);
    });
  });
}

/**
 * Updates the favorite button text based on current state
 * DEMONSTRATES: CONDITIONAL RENDERING
 */
function updateFavBtn() {
  const saved = isFavorite(currentSpacecraftId);  // ← Imported function
  modalFavBtn.textContent = saved ? '★ Saved to Favorites' : '☆ Save to Favorites';
  modalFavBtn.classList.toggle('saved', saved);
}

// ─────────────────────────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────────────────────────
closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
});
modalFavBtn.addEventListener('click', function () {
  if (currentSpacecraftId === null) return;
  const nowSaved = toggleFavorite(currentSpacecraftId);  // ← Imported function
  updateFavBtn();
  const card   = grid.querySelector(`[data-id="${currentSpacecraftId}"]`);
  const starEl = card ? card.querySelector('.fav-star') : null;
  if (starEl) starEl.textContent = nowSaved ? '★' : '';
});

// ─────────────────────────────────────────────────────────────────
// START — Initialize the page
// ─────────────────────────────────────────────────────────────────
initPage();