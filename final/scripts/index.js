/**
 * index.js — Home Page JavaScript (ES Module)
 * Beyond Earth: A Spacecraft Encyclopedia
 */

import {
  getStatusClass,
  getFavorites,
  isFavorite,
  toggleFavorite
} from './helpers.js';

// ── STATE ───────────────────────────────────────────────
let allSpacecraft = [];
let activeFilter = localStorage.getItem('filter-choice') || 'All';
let currentSpacecraftId = null;
let nasaImagesCache = {};

// ── DOM REFERENCES ───────────────────────────────────────
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
const modalFavBtn = document.getElementById('modal-fav-button'); // FIXED
const closeBtn = document.getElementById('modal-close');

// ── SAFETY CHECK (prevents silent crashes) ───────────────
if (!grid || !filtersEl || !overlay) {
  console.error("Missing required DOM elements. Check HTML IDs.");
}

// ── NASA IMAGE FETCH ─────────────────────────────────────
async function fetchNasaImage(searchTerm) {
  if (nasaImagesCache[searchTerm] !== undefined) {
    return nasaImagesCache[searchTerm];
  }

  try {
    const response = await fetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(searchTerm)}&media_type=image&page_size=1`
    );

    if (!response.ok) throw new Error(`NASA API error ${response.status}`);

    const data = await response.json();

    let imageUrl = null;

    if (data.collection?.items?.length) {
      const item = data.collection.items[0];
      if (item.links?.length) {
        imageUrl = item.links[0].href;
      }
    }

    nasaImagesCache[searchTerm] = imageUrl;
    return imageUrl;

  } catch (err) {
    console.warn("NASA API failed:", err.message);
    nasaImagesCache[searchTerm] = null;
    return null;
  }
}

// ── CARD BUILDER ─────────────────────────────────────────
function buildCard(s) {
  const statusClass = getStatusClass(s.status);
  const star = isFavorite(s.id) ? '★' : '';

  const imageUrl = s.image;

  return `
    <article class="spacecraft-card" tabindex="0" data-id="${s.id}">
      <div class="card-image">
        <img src="${imageUrl}" alt="${s.name}" loading="lazy">
        <span class="card-status ${statusClass}">${s.status}</span>
      </div>
      <div class="card-body">
        <div class="card-type">${s.type}</div>
        <div class="card-name">${s.name} <span class="fav-star">${star}</span></div>
        <div class="card-agency">${s.agency}</div>
      </div>
    </article>
  `;
}

// ── RENDER GRID ──────────────────────────────────────────
function renderGrid(spacecraft) {
  if (!grid) return;

  if (!spacecraft.length) {
    grid.innerHTML = `<p class="loading">No spacecraft found.</p>`;
    countEl.textContent = "0";
    return;
  }

  grid.innerHTML = spacecraft.map(buildCard).join('');
  countEl.textContent = spacecraft.length;

  // attach events safely
  grid.querySelectorAll('.spacecraft-card').forEach(card => {
    const id = Number(card.dataset.id);
    const craft = allSpacecraft.find(s => s.id === id);

    card.addEventListener('click', () => openModal(craft));
  });
}

// ── FILTERS ──────────────────────────────────────────────
function buildFilters(types) {
  filtersEl.innerHTML = types.map(t => `
    <button class="filter-btn ${t === activeFilter ? 'active' : ''}"
      data-type="${t}">
      ${t}
    </button>
  `).join('');

  filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.type;
      localStorage.setItem('filter-choice', activeFilter);

      const filtered = activeFilter === 'All'
        ? allSpacecraft
        : allSpacecraft.filter(s => s.type === activeFilter);

      renderGrid(filtered);
    });
  });
}

// ── MODAL OPEN ───────────────────────────────────────────
function openModal(s) {
  currentSpacecraftId = s.id;

  modalTitle.textContent = s.name;
  modalSubtitle.textContent = `${s.type} — ${s.agency}`;
  modalImage.src = s.image;
  modalDesc.textContent = s.description;
  modalNotable.innerHTML = s.notable;

  overlay.classList.add('open');
}

// ── MODAL CLOSE ──────────────────────────────────────────
function closeModal() {
  overlay.classList.remove('open');
  currentSpacecraftId = null;
}

// ── FAVORITES BUTTON (SAFE) ──────────────────────────────
function updateFavBtn() {
  if (!modalFavBtn || currentSpacecraftId === null) return;

  const saved = isFavorite(currentSpacecraftId);
  modalFavBtn.textContent = saved
    ? '★ Saved'
    : '☆ Save to Favorites';
}

// only attach if exists
if (modalFavBtn) {
  modalFavBtn.addEventListener('click', () => {
    if (currentSpacecraftId === null) return;

    const nowSaved = toggleFavorite(currentSpacecraftId);
    updateFavBtn();

    const card = grid.querySelector(`[data-id="${currentSpacecraftId}"]`);
    const star = card?.querySelector('.fav-star');

    if (star) star.textContent = nowSaved ? '★' : '';
  });
}

// ── INIT ────────────────────────────────────────────────
async function init() {
  try {
    grid.innerHTML = `<p class="loading">Loading spacecraft data…</p>`;

    const res = await fetch('./data/spacecraft.json');
    if (!res.ok) throw new Error("Failed to load JSON");

    allSpacecraft = await res.json();

    const types = ['All', ...new Set(allSpacecraft.map(s => s.type))];
    buildFilters(types);

    renderGrid(allSpacecraft);

    countEl.textContent = allSpacecraft.length;

  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="error-msg">Failed to load data.</p>`;
  }
}

// ── EVENTS ──────────────────────────────────────────────
if (closeBtn) closeBtn.addEventListener('click', closeModal);

if (overlay) {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ── START APP ───────────────────────────────────────────
init();