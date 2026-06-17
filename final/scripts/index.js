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
let allSpacecraft = [];
let activeFilter = localStorage.getItem('filter-choice') || 'All';
let currentSpacecraftId = null;
let nasaImagesCache = {}; // Cache NASA image results

// ── DOM REFERENCES ───────────────────────────────────────────
const grid = document.getElementById('spacecraft-grid');
const filtersEl = document.getElementById('filters');
const countEl = document.getElementById('spacecraft-count');
const overlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalImage = document.getElementById('modal-image');
const modalDesc = document.getElementById('modal-desc');
const modalSpecs = document.getElementById('modal-specs');
const modalNotable = document.getElementById('modal-notable');
const modalFavBtn = document.getElementById('modal-fav-btn');
const closeBtn = document.getElementById('modal-close');

// ── HELPER: status → CSS class ────────────────────────────────
function getStatusClass(status) {
  const map = {
    'Active': 'status-active',
    'Retired': 'status-retired',
    'Deorbited': 'status-deorbited',
    'In Development': 'status-development',
    'Signal Lost': 'status-signal'
  };
  return map[status] || 'status-retired';
}

// ── LOCAL STORAGE: Favorites ──────────────────────────────────
function getFavorites() {
  try {
    const raw = localStorage.getItem('favorites');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);

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
async function fetchNasaImage(searchTerm) {
  if (nasaImagesCache[searchTerm] !== undefined) {
    return nasaImagesCache[searchTerm];
  }

  try {
    const response = await fetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(searchTerm)}&media_type=image&page_size=1`
    );

    if (!response.ok) throw new Error(`NASA API error: ${response.status}`);

    const data = await response.json();

    let imageUrl = null;

    if (data.collection?.items?.length > 0) {
      const item = data.collection.items[0];
      if (item.links?.length > 0) {
        imageUrl = item.links[0].href;
      }
    }

    nasaImagesCache[searchTerm] = imageUrl;
    return imageUrl;

  } catch (error) {
    console.warn(`NASA API failed for "${searchTerm}"`);
    nasaImagesCache[searchTerm] = null;
    return null;
  }
}

// ── BUILD CARD ────────────────────────────────────────────────
function buildCard(s) {
  const sc = getStatusClass(s.status);
  const star = isFavorite(s.id) ? '★' : '';

  let imageUrl = s.image;

  // FIXED CACHE ACCESS
  if (nasaImagesCache[s.name] !== undefined && nasaImagesCache[s.name] !== null) {
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
          <span class="card-meta-item">⚖️ ${
            s.mass_kg >= 1000 ? (s.mass_kg / 1000).toFixed(1) + 't' : s.mass_kg + 'kg'
          }</span>
          <span class="card-meta-item">${
            s.crew === 0 ? '🤖 Uncrewed' : '👨‍🚀 Crew: ' + s.crew
          }</span>
        </div>
      </div>

      <div class="card-footer">${s.notable}</div>
    </article>`;
}

// ── RENDER GRID ───────────────────────────────────────────────
function renderGrid(spacecraft) {
  if (!spacecraft.length) {
    grid.innerHTML = '<p class="loading">No spacecraft match this filter.</p>';
    countEl.textContent = '0';
    return;
  }

  grid.innerHTML = spacecraft.map(buildCard).join('');
  countEl.textContent = spacecraft.length;

  spacecraft.forEach(s => {
    fetchNasaImage(s.name).then(url => {
      if (!url) return;

      const img = grid.querySelector(`[data-id="${s.id}"] img`);
      if (img) {
        img.classList.add('nasa-loading');
        img.src = url;

        setTimeout(() => {
          img.classList.remove('nasa-loading');
          img.classList.add('nasa-loaded');
        }, 50);
      }
    });
  });

  grid.querySelectorAll('.spacecraft-card').forEach(card => {
    const id = parseInt(card.dataset.id);
    const craft = allSpacecraft.find(s => s.id === id);

    card.addEventListener('click', () => openModal(craft));
  });
}

// ── FILTERS ───────────────────────────────────────────────────
function buildFilters(types) {
  filtersEl.innerHTML = types
    .map(
      t => `
    <button class="filter-btn ${t === activeFilter ? 'active' : ''}"
            data-type="${t}">${t}</button>`
    )
    .join('');

  filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.type;
      localStorage.setItem('filter-choice', activeFilter);

      const filtered =
        activeFilter === 'All'
          ? allSpacecraft
          : allSpacecraft.filter(s => s.type === activeFilter);

      renderGrid(filtered);
    });
  });
}

// ── MODAL ─────────────────────────────────────────────────────
function openModal(s) {
  currentSpacecraftId = s.id;

  modalTitle.textContent = s.name;
  modalSubtitle.textContent = `${s.type} — ${s.agency}`;
  modalImage.src = s.image;
  modalDesc.textContent = s.description;
  modalNotable.innerHTML = `<strong>Notable:</strong> ${s.notable}`;

  overlay.classList.add('open');
}

// ── INIT (FIXED CRITICAL ISSUE) ───────────────────────────────
async function init() {
  grid.innerHTML = '<p class="loading">Loading spacecraft data…</p>';

  try {
    // FIX: correct path (MOST COMMON FAILURE FIX)
    const response = await fetch('data/spacecraft.json');

    if (!response.ok) {
      throw new Error('Cannot load JSON file');
    }

    allSpacecraft = await response.json();

    const types = ['All', ...new Set(allSpacecraft.map(s => s.type))];
    buildFilters(types);

    const filtered =
      activeFilter === 'All'
        ? allSpacecraft
        : allSpacecraft.filter(s => s.type === activeFilter);

    renderGrid(filtered);

    // Stats
    document.getElementById('stat-total').textContent = allSpacecraft.length;
    document.getElementById('stat-active').textContent =
      allSpacecraft.filter(s => s.status === 'Active').length;
    document.getElementById('stat-agencies').textContent =
      new Set(allSpacecraft.map(s => s.agency)).size;

    // preload NASA images
    allSpacecraft.forEach(s => fetchNasaImage(s.name));

  } catch (err) {
    console.error(err);
    grid.innerHTML =
      '<p class="error-msg">Failed to load spacecraft data.</p>';
  }
}

// ── EVENTS ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') overlay.classList.remove('open');
});

init();