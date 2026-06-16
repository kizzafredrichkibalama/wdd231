/**
 * index.js — Home Page JavaScript
 * Beyond Earth: A Spacecraft Encyclopedia
 * Author: Kizza Fredrich Kibalama | BYU-Idaho WDD 231
 *
 * DEMONSTRATES:
 *  1. LOCAL JSON DATA INTEGRATION (API-style fetch from data/spacecraft.json)
 *  2. ASYNCHRONOUS functionality with async/await and try...catch
 *  3. DOM MANIPULATION — creating and updating elements with innerHTML / textContent
 *  4. ARRAY METHODS — .map(), .filter(), .find(), .splice(), Set
 *  5. TEMPLATE LITERALS — backtick strings with ${} expressions
 *  6. LOCAL STORAGE — persisting user favorites and filter preference
 *  7. EVENT LISTENERS — click, keydown, Escape key
 *  8. MODAL DIALOG — open/close with full accessibility (ARIA, focus management)
 */

// ── STATE ────────────────────────────────────────────────────
let allSpacecraft   = [];   // Full array of 18 spacecraft objects loaded from JSON
let activeFilter    = localStorage.getItem('filter-choice') || 'All'; // Persisted filter
let currentSpacecraftId = null;  // Which card's modal is currently open

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
const modalFavBtn   = document.getElementById('modal-fav-btn');
const closeBtn      = document.getElementById('modal-close');

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
// localStorage stores strings only — we convert with JSON.parse / JSON.stringify

function getFavorites() {
  try {
    const raw = localStorage.getItem('favorites');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function isFavorite(id) {
  return getFavorites().includes(id); // ARRAY METHOD: .includes()
}

function toggleFavorite(id) {
  const favs = getFavorites();
  const idx  = favs.indexOf(id); // ARRAY METHOD: .indexOf() returns -1 if not found
  if (idx === -1) {
    favs.push(id);
    localStorage.setItem('favorites', JSON.stringify(favs));
    return true;  // now saved
  } else {
    favs.splice(idx, 1); // ARRAY METHOD: .splice() removes 1 item at index
    localStorage.setItem('favorites', JSON.stringify(favs));
    return false; // now removed
  }
}

// ── BUILD CARD (TEMPLATE LITERAL) ────────────────────────────
// Called by .map() to turn each spacecraft object into an HTML string

function buildCard(s) {
  const sc = getStatusClass(s.status);
  const star = isFavorite(s.id) ? '★' : '';
  // TEMPLATE LITERAL: backtick string — ${} injects live JS values
  return `
    <article class="spacecraft-card" role="button" tabindex="0"
             aria-label="View details for ${s.name}" data-id="${s.id}">
      <div class="card-image">
        <img src="${s.image}" alt="${s.name}" loading="lazy" width="300" height="180">
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
  // DOM MANIPULATION: setting innerHTML inserts all 18 cards at once
  grid.innerHTML = spacecraft.map(buildCard).join('');
  countEl.textContent = spacecraft.length;

  // Attach events to every rendered card (DOM MANIPULATION)
  grid.querySelectorAll('.spacecraft-card').forEach(card => {
    const id    = parseInt(card.dataset.id);
    const craft = allSpacecraft.find(s => s.id === id); // ARRAY METHOD: .find()
    card.addEventListener('click', () => openModal(craft));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(craft); }
    });
  });
}

// ── BUILD FILTER BUTTONS ──────────────────────────────────────
function buildFilters(types) {
  // ARRAY METHOD + TEMPLATE LITERAL: .map() builds a button per type
  filtersEl.innerHTML = types.map(t => `
    <button class="filter-btn${t === activeFilter ? ' active' : ''}"
            data-type="${t}" aria-pressed="${t === activeFilter}">${t}</button>
  `).join('');

  filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      activeFilter = btn.dataset.type;
      localStorage.setItem('filter-choice', activeFilter); // PERSIST choice
      filtersEl.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === activeFilter);
        b.setAttribute('aria-pressed', b.dataset.type === activeFilter);
      });
      // ARRAY METHOD: .filter() returns only spacecraft matching the type
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
  // DOM MANIPULATION: update every field in the modal with this spacecraft's data
  modalTitle.textContent    = s.name;
  modalSubtitle.textContent = `${s.type} — ${s.agency}`;
  modalImage.src            = s.image;
  modalImage.alt            = s.name;
  modalDesc.textContent     = s.description;
  modalNotable.innerHTML    = `<strong>Notable:</strong> ${s.notable}`;
  const sc = getStatusClass(s.status);
  // TEMPLATE LITERAL: build the 4-cell spec grid
  modalSpecs.innerHTML = `
    <div class="spec-item"><div class="spec-label">Launched</div><div class="spec-value">${s.launched}</div></div>
    <div class="spec-item"><div class="spec-label">Status</div><div class="spec-value">
      <span class="card-status ${sc}" style="position:static;font-size:.75rem;">${s.status}</span></div></div>
    <div class="spec-item"><div class="spec-label">Mass</div><div class="spec-value">${s.mass_kg.toLocaleString()} kg</div></div>
    <div class="spec-item"><div class="spec-label">Crew</div><div class="spec-value">${s.crew === 0 ? 'Uncrewed' : s.crew}</div></div>`;
  updateFavBtn();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Lock scroll
  closeBtn.focus(); // Move keyboard focus into modal (accessibility)
}

// ── MODAL: CLOSE ──────────────────────────────────────────────
function closeModal() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentSpacecraftId = null;
}

// Update Save/Unsave button text and style
function updateFavBtn() {
  const saved = isFavorite(currentSpacecraftId);
  modalFavBtn.textContent = saved ? '★ Saved to Favorites' : '☆ Save to Favorites';
  modalFavBtn.classList.toggle('saved', saved);
}

// ── DATA INTEGRATION ──────────────────────────────────────────
/**
 * HOW API / LOCAL JSON INTEGRATION WORKS:
 *
 * The file `data/spacecraft.json` is our data source — it works
 * exactly like a REST API endpoint. When we call fetch(), the
 * browser sends an HTTP GET request to the file URL.
 *
 * ASYNCHRONOUS FLOW with async/await:
 *   1. `async function init()` marks this function as asynchronous
 *   2. `await fetch(...)` sends the request without freezing the page.
 *      JavaScript continues to run (the UI stays responsive) while
 *      waiting for the file to load.
 *   3. When the response arrives, `await response.json()` parses it
 *      from a raw JSON string into a live JavaScript array of objects.
 *   4. We now have 18 spacecraft objects and can render them.
 *
 * THE TRY...CATCH BLOCK:
 *   Network errors, 404s, and malformed JSON all throw exceptions.
 *   The catch() block intercepts them and shows a friendly error
 *   instead of crashing the page or showing a blank grid.
 *
 * OUTPUT (what allSpacecraft looks like after step 3):
 * [
 *   { id:1, name:"Apollo 11 CSM Columbia", type:"Crewed Capsule",
 *     agency:"NASA", launched:"1969", status:"Retired",
 *     mass_kg:30320, crew:3, notable:"First Moon landing",
 *     image:"images/apollo-11.jpg" },
 *   { id:2, name:"Voyager 1", type:"Space Probe", ... },
 *   ... 16 more objects
 * ]
 */
async function init() {
  grid.innerHTML = '<p class="loading">Loading spacecraft data…</p>';

  try {
    // STEP 1 — Send GET request to our local JSON file (acts as an API)
    const response = await fetch('./data/spacecraft.json');

    // STEP 2 — Check HTTP status: 404 doesn't throw, it returns ok:false
    if (!response.ok) {
      throw new Error(`HTTP error — status: ${response.status}`);
    }

    // STEP 3 — Parse JSON body into a JavaScript array of objects
    allSpacecraft = await response.json();

    // STEP 4 — Build unique type filters using Set (removes duplicates)
    // ARRAY METHOD: .map() extracts just the 'type' field from each object
    // new Set() keeps only unique values → spread into array with [...]
    const types = ['All', ...new Set(allSpacecraft.map(s => s.type))];
    buildFilters(types);

    // STEP 5 — Render the grid (all 18 or the persisted filter subset)
    const filtered = activeFilter === 'All'
      ? allSpacecraft
      : allSpacecraft.filter(s => s.type === activeFilter); // ARRAY METHOD: .filter()
    renderGrid(filtered);

    // STEP 6 — Update hero stats with array-derived counts
    const activeCount = allSpacecraft.filter(s => s.status === 'Active').length;
    const agencyCount = new Set(allSpacecraft.map(s => s.agency)).size;
    // DOM MANIPULATION: update the 3 stat numbers in the hero
    document.getElementById('stat-total').textContent    = allSpacecraft.length;
    document.getElementById('stat-active').textContent   = activeCount;
    document.getElementById('stat-agencies').textContent = agencyCount;

  } catch (error) {
    // CATCH: shown if fetch fails (bad network, file missing, invalid JSON)
    grid.innerHTML = '<p class="error-msg">⚠ Could not load spacecraft data. Please refresh.</p>';
    console.error('Data load error:', error);
  }
}

// ── EVENT LISTENERS ───────────────────────────────────────────
closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
});
modalFavBtn.addEventListener('click', function () {
  if (currentSpacecraftId === null) return;
  const nowSaved = toggleFavorite(currentSpacecraftId);
  updateFavBtn();
  // DOM MANIPULATION: update the star on the card behind the modal
  const card   = grid.querySelector(`[data-id="${currentSpacecraftId}"]`);
  const starEl = card ? card.querySelector('.fav-star') : null;
  if (starEl) starEl.textContent = nowSaved ? '★' : '';
});

// ── START ──────────────────────────────────────────────────────
init();
