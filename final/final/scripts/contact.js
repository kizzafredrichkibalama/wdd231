/**
 * contact.js — Contact Page JavaScript
 * Beyond Earth: A Spacecraft Encyclopedia
 * Author: Kizza Fredrich Kibalama | BYU-Idaho WDD 231
 *
 * PURPOSE:
 *  Loads spacecraft.json to look up names, then reads the
 *  user's saved favorites from localStorage and displays them
 *  in the sidebar panel on the contact page.
 *
 * DEMONSTRATES:
 *  - async/await with try...catch
 *  - localStorage read
 *  - Array methods: .filter(), .map()
 *  - DOM manipulation: innerHTML, style, textContent
 *  - Template literals
 */

// ── DOM REFERENCES ────────────────────────────────────────────
const favList  = document.getElementById('fav-list');
const favEmpty = document.getElementById('fav-empty');
const favCount = document.getElementById('fav-count');

// ── READ FAVORITES FROM LOCAL STORAGE ────────────────────────
function getFavorites() {
  try {
    const raw = localStorage.getItem('favorites');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// Remove a single ID and re-render
function removeFavorite(id) {
  // ARRAY METHOD: .filter() keeps everything except the removed ID
  const updated = getFavorites().filter(f => f !== id);
  localStorage.setItem('favorites', JSON.stringify(updated));
}

// ── RENDER FAVORITES LIST ─────────────────────────────────────
function renderFavorites(allSpacecraft) {
  const ids  = getFavorites();
  // ARRAY METHOD: .filter() keeps only spacecraft whose IDs are saved
  const favs = allSpacecraft.filter(s => ids.includes(s.id));

  // DOM MANIPULATION: update count badge
  favCount.textContent = '(' + favs.length + ')';

  if (favs.length === 0) {
    favList.innerHTML    = '';
    favEmpty.style.display = 'block';
    return;
  }

  favEmpty.style.display = 'none';

  // ARRAY METHOD + TEMPLATE LITERAL: .map() builds each list item
  favList.innerHTML = favs.map(s => `
    <li>
      <span>${s.name}</span>
      <button class="fav-remove" data-id="${s.id}"
              aria-label="Remove ${s.name} from favorites">✕</button>
    </li>
  `).join('');

  // EVENT LISTENERS: each remove button re-renders the list
  favList.querySelectorAll('.fav-remove').forEach(btn => {
    btn.addEventListener('click', function () {
      removeFavorite(parseInt(btn.dataset.id));
      renderFavorites(allSpacecraft); // Re-render after removal
    });
  });
}

// ── ASYNC DATA LOAD ───────────────────────────────────────────
async function init() {
  try {
    const response = await fetch('./data/spacecraft.json');
    if (!response.ok) throw new Error('Status: ' + response.status);
    const allSpacecraft = await response.json();
    renderFavorites(allSpacecraft);
  } catch (error) {
    favList.innerHTML = '<li class="fav-empty">Could not load data.</li>';
    console.error('Contact page error:', error);
  }
}

init();
