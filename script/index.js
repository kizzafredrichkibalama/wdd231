/**
 * index.js — Home Page JavaScript
 * Beyond Earth: A Spacecraft Encyclopedia
 * Author: Kizza Fredrich Kibalama | BYU-Idaho WDD 231
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
 */

// ── STATE ────────────────────────────────────────────────────
let allSpacecraft   = [];
let activeFilter    = localStorage.getItem('filter-choice') || 'All';
let currentSpacecraftId = null;
let nasaImagesCache = {}; // Cache NASA image results

// ── DOM REFERENCES ───────────────────────────────────────────
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
const modalFavbutton   = document.getElementById('modal-fav-button');
const closebutton      = document.getElementById('modal-close');

// ── HELPER: status → CSS class ────────────────────────────────
function getStatusClass(status) {
  const map = {
    'Active'         : 'status-active',
    'Retired'        : 'status-retired',
    'Deorbited'      : 'status-deorbited',
    'In Development' : 'status-development',
    'Signal Lost'    : 'status-signal'
  };
  return map[status] || 'status-retired';
}

// ── LOCAL STORAGE: Favorites ──────────────────────────────────
function getFavorites() {
  try {
    const raw = localStorage.getItem('favorites');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id) {
  const favs = getFavorites();
  const idx  = favs.indexOf(id);
  if (idx === -1) {
    favs.push(id);
    localStorage.setItem('favorites', JSON.stringify(favs));
    return true;
  } else {
    favs.splice(idx, 1);
    localStorage.setItem('favorites', JSON.stringify(favs));
    return false;
  }
}

// ── FETCH IMAGES FROM NASA API ────────────────────────────────
/**
 * NASA IMAGES API INTEGRATION
 * 
 * The NASA Images API (https://images-api.nasa.gov) is FREE and
 * requires no authentication for basic searches. It returns beautiful,
 * high-quality NASA imagery.
 * 
 * This function searches for spacecraft images and caches results
 * to avoid hammering the API with multiple requests.
 */
async function fetchNasaImage(searchTerm) {
  // Return cached result if we've already fetched it
  if (nasaImagesCache[searchTerm]) {
    return nasaImagesCache[searchTerm];
  }

  try {
    // ⭐ NASA IMAGES API CALL ⭐
    // GET /search endpoint returns search results in Collection+JSON format
    // Parameters: q=search term, media_type=image (only images, not videos)
    const response = await fetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(searchTerm)}&media_type=image&page_size=1`
    );

    // Check if the request was successful (200 = OK, 404 = not found, etc.)
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    // Parse the JSON response from NASA
    const data = await response.json();

    // Extract the first image URL from the results
    // NASA response structure: { collection: { items: [ { href, links: [{href, render}] } ] } }
    let imageUrl = null;
    if (data.collection && data.collection.items && data.collection.items.length > 0) {
      const firstItem = data.collection.items[0];
      // NASA provides preview links that we can use
      if (firstItem.links && firstItem.links.length > 0) {
        imageUrl = firstItem.links[0].href;
      }
    }

    // Cache the result so we don't fetch it again
    nasaImagesCache[searchTerm] = imageUrl;

    console.log(`✓ NASA API: Found image for "${searchTerm}"`);
    return imageUrl;

  } catch (error) {
    // If NASA API fails (network error, rate limit, etc.), 
    // we'll fall back to the local image in buildCard()
    console.warn(`NASA API failed for "${searchTerm}": ${error.message}`);
    nasaImagesCache[searchTerm] = null; // Cache the failure
    return null;
  }
}

// ── BUILD CARD (TEMPLATE LITERAL) ────────────────────────────
// This function gets called by .map() for each spacecraft
// It can use either NASA API image or local fallback image

function buildCard(s) {
  const sc = getStatusClass(s.status);
  const star = isFavorite(s.id) ? '★' : '';
  
  // Use local image as fallback (NASA images load asynchronously later)
  let imageUrl = s.image;
  
  // Try to use NASA image if we've already fetched it
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

// ── RENDER GRID (DOM MANIPULATION + ARRAY METHODS) ────────────
function renderGrid(spacecraft) {
  if (spacecraft.length === 0) {
    grid.innerHTML = '<p class="loading">No spacecraft match this filter.</p>';
    countEl.textContent = '0';
    return;
  }

  // ARRAY METHOD: .map() transforms each object into an HTML string
  // DOM MANIPULATION: setting innerHTML inserts all cards at once
  grid.innerHTML = spacecraft.map(buildCard).join('');
  countEl.textContent = spacecraft.length;

  // Fetch NASA images in background (non-blocking)
  // This runs after the cards are displayed so page feels fast
  spacecraft.forEach(s => {
    fetchNasaImage(s.name).then(nasaImageUrl => {
      if (nasaImageUrl) {
        // Update the card's image if we got a NASA image
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

// ── BUILD FILTER BUTTONS ──────────────────────────────────────
function buildFilters(types) {
  filtersEl.innerHTML = types.map(t => `
    <button class="filter-button${t === activeFilter ? ' active' : ''}"
            data-type="${t}" aria-pressed="${t === activeFilter}">${t}</button>
  `).join('');

  filtersEl.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', function () {
      activeFilter = button.dataset.type;
      localStorage.setItem('filter-choice', activeFilter);
      filtersEl.querySelectorAll('.filter-button').forEach(b => {
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

// ── MODAL: OPEN ───────────────────────────────────────────────
function openModal(s) {
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
  updateFavbutton();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  closebutton.focus();
}

// ── MODAL: CLOSE ──────────────────────────────────────────────
function closeModal() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  currentSpacecraftId = null;
}

function updateFavbutton() {
  const saved = isFavorite(currentSpacecraftId);
  modalFavbutton.textContent = saved ? '★ Saved to Favorites' : '☆ Save to Favorites';
  modalFavbutton.classList.toggle('saved', saved);
}

// ── DATA INTEGRATION: LOCAL JSON + NASA API ───────────────────
/**
 * HOW THIS WORKS:
 *
 * PRIMARY SOURCE: Local JSON file (data/spacecraft.json)
 *  - Always available, no network dependency
 *  - Fast loading (bundled with the app)
 *  - Contains 18 spacecraft with full metadata
 *
 * SECONDARY SOURCE: NASA Images API
 *  - Fetches real, high-quality NASA images
 *  - Async fetch (doesn't block page load)
 *  - Gracefully falls back to local images if API fails
 *  - Cached results to avoid duplicate requests
 *
 * FLOW:
 * 1. Load local JSON immediately → render cards with local images
 * 2. Fetch NASA images in background → update card images as they arrive
 * 3. If NASA fails → local images remain (no broken page)
 */
async function init() {
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
    // This improves the user experience by enriching the cards
    // with real NASA imagery over time
    console.log('ℹ NASA Images loading in background...');
    allSpacecraft.forEach(spacecraft => {
      fetchNasaImage(spacecraft.name); // Fire and forget
    });

  } catch (error) {
    grid.innerHTML = '<p class="error-msg">⚠ Could not load spacecraft data. Please refresh.</p>';
    console.error('Data load error:', error);
  }
}

// ── EVENT LISTENERS ───────────────────────────────────────────
closebutton.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
});
modalFavbutton.addEventListener('click', function () {
  if (currentSpacecraftId === null) return;
  const nowSaved = toggleFavorite(currentSpacecraftId);
  updateFavbutton();
  const card   = grid.querySelector(`[data-id="${currentSpacecraftId}"]`);
  const starEl = card ? card.querySelector('.fav-star') : null;
  if (starEl) starEl.textContent = nowSaved ? '★' : '';
});

// ── START ──────────────────────────────────────────────────────
init();
