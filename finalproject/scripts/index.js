/**
 * index.js — Home Page JavaScript (ES Module)
 * Beyond Earth: A Spacecraft Encyclopedia
 * Author: Kizza Fredrich Kibalama | BYU-Idaho WDD 231
 */

// ── HELPER FUNCTIONS (moved here from helpers.js) ──────────────

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

// ── STATE ────────────────────────────────────────────────────────

let allSpacecraft   = [];
let activeFilter    = localStorage.getItem('filter-choice') || 'All';
let currentSpacecraftId = null;
let nasaImagesCache = {};

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
const modalFavBtn   = document.getElementById('modal-fav-button');
const closeBtn      = document.getElementById('modal-close');

// ── FETCH NASA IMAGE (progressive enhancement) ──────────────────

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
      const firstItem = data.collection.items[0];
      if (firstItem.links?.length > 0) {
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

// ── BUILD CARD ──────────────────────────────────────────────────

function buildCard(s) {
  const sc = getStatusClass(s.status);
  const star = isFavorite(s.id) ? '★' : '';

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

// ── RENDER GRID ─────────────────────────────────────────────────

function renderGrid(spacecraft) {
  if (spacecraft.length === 0) {
    grid.innerHTML = '<p class="loading">No spacecraft match this filter.</p>';
    countEl.textContent = '0';
    return;
  }

  grid.innerHTML = spacecraft.map(buildCard).join('');
  countEl.textContent = spacecraft.length;

  // Upgrade images with NASA API (non-blocking)
  spacecraft.forEach(s => {
    fetchNasaImage(s.name).then(nasaImageUrl => {
      if (nasaImageUrl) {
        const img = grid.querySelector(`[data-id="${s.id}"] img`);
        if (img) {
          img.classList.add('nasa-loading');
          img.src = nasaImageUrl;
          setTimeout(() => {
            img.classList.remove('nasa-loading');
            img.classList.add('nasa-loaded');
          }, 10);
        }
      }
    });
  });

  // Attach click/keydown events
  grid.querySelectorAll('.spacecraft-card').forEach(card => {
    const id = parseInt(card.dataset.id);
    const craft = allSpacecraft.find(s => s.id === id);
    card.addEventListener('click', () => openModal(craft));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(craft);
      }
    });
  });
}

// ── BUILD FILTERS ───────────────────────────────────────────────

function buildFilters(types) {
  filtersEl.innerHTML = types.map(t => `
    <button class="filter-button${t === activeFilter ? ' active' : ''}"
            data-type="${t}" aria-pressed="${t === activeFilter}">${t}</button>
  `).join('');

  filtersEl.querySelectorAll('.filter-button').forEach(btn => {
    btn.addEventListener('click', function () {
      activeFilter = btn.dataset.type;
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

// ── MODAL ───────────────────────────────────────────────────────

function openModal(s) {
  currentSpacecraftId = s.id;

  let displayImage = s.image;
  if (nasaImagesCache[s.name] && nasaImagesCache[s.name] !== null) {
    displayImage = nasaImagesCache[s.name];
  }

  modalTitle.textContent = s.name;
  modalSubtitle.textContent = `${s.type} — ${s.agency}`;
  modalImage.src = displayImage;
  modalImage.alt = s.name;
  modalDesc.textContent = s.description;
  modalNotable.innerHTML = `<strong>Notable:</strong> ${s.notable}`;

  const sc = getStatusClass(s.status);
  modalSpecs.innerHTML = `
    <div class="spec-item"><div class="spec-label">Launched</div><div class="spec-value">${s.launched}</div></div>
    <div class="spec-item"><div class="spec-label">Status</div><div class="spec-value"><span class="card-status ${sc}">${s.status}</span></div></div>
    <div class="spec-item"><div class="spec-label">Mass</div><div class="spec-value">${s.mass_kg.toLocaleString()} kg</div></div>
    <div class="spec-item"><div class="spec-label">Crew</div><div class="spec-value">${s.crew === 0 ? 'Uncrewed' : s.crew}</div></div>
  `;

  updateFavBtn();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  closeBtn.focus();
}

function closeModal() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  currentSpacecraftId = null;
}

function updateFavBtn() {
  const saved = isFavorite(currentSpacecraftId);
  modalFavBtn.textContent = saved ? '★ Saved to Favorites' : '☆ Save to Favorites';
  modalFavBtn.classList.toggle('saved', saved);
}

// ── MODAL EVENT LISTENERS ──────────────────────────────────────

closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
});

modalFavBtn.addEventListener('click', function () {
  if (currentSpacecraftId === null) return;
  const nowSaved = toggleFavorite(currentSpacecraftId);
  updateFavBtn();
  const card = grid.querySelector(`[data-id="${currentSpacecraftId}"]`);
  const starEl = card ? card.querySelector('.fav-star') : null;
  if (starEl) starEl.textContent = nowSaved ? '★' : '';
});

// ── INIT ────────────────────────────────────────────────────────

async function initPage() {
  grid.innerHTML = '<p class="loading">Loading spacecraft data…</p>';

  try {
    const response = await fetch('./data/spacecraft.json');
    if (!response.ok) throw new Error(`HTTP error — status: ${response.status}`);
    allSpacecraft = await response.json();

    const types = ['All', ...new Set(allSpacecraft.map(s => s.type))];
    buildFilters(types);

    const filtered = activeFilter === 'All'
      ? allSpacecraft
      : allSpacecraft.filter(s => s.type === activeFilter);
    renderGrid(filtered);

    const activeCount = allSpacecraft.filter(s => s.status === 'Active').length;
    const agencyCount = new Set(allSpacecraft.map(s => s.agency)).size;
    document.getElementById('stat-total').textContent = allSpacecraft.length;
    document.getElementById('stat-active').textContent = activeCount;
    document.getElementById('stat-agencies').textContent = agencyCount;

    // Pre-fetch NASA images in background
    allSpacecraft.forEach(s => fetchNasaImage(s.name));
  } catch (error) {
    grid.innerHTML = '<p class="error-msg">⚠ Could not load spacecraft data. Please refresh.</p>';
    console.error('Data load error:', error);
  }
}

initPage();