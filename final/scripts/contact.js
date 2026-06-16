// contact.js - Contact page favorites functionality

const favList = document.getElementById('fav-list');
const favEmpty = document.getElementById('fav-empty');
const favCount = document.getElementById('fav-count');

function getFavorites() {
  try {
    const raw = localStorage.getItem('favorites');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function removeFavorite(id) {
  const favs = getFavorites().filter(f => f !== id);
  localStorage.setItem('favorites', JSON.stringify(favs));
}

async function renderFavorites(allSpacecraft) {
  const ids = getFavorites();
  const favs = allSpacecraft.filter(s => ids.includes(s.id));

  favCount.textContent = '(' + favs.length + ')';

  if (favs.length === 0) {
    favList.innerHTML = '';
    favEmpty.style.display = 'block';
    return;
  }

  favEmpty.style.display = 'none';
  favList.innerHTML = favs.map(s => `
    <li>
      <span>${s.name}</span>
      <button class="fav-remove" data-id="${s.id}" 
              aria-label="Remove ${s.name} from favorites">✕</button>
    </li>
  `).join('');

  favList.querySelectorAll('.fav-remove').forEach(btn => {
    btn.addEventListener('click', function() {
      removeFavorite(parseInt(btn.dataset.id));
      renderFavorites(allSpacecraft);
    });
  });
}

async function init() {
  try {
    const response = await fetch('./data/spacecraft.json');
    if (!response.ok) {
      throw new Error('HTTP error — status: ' + response.status);
    }
    const allSpacecraft = await response.json();
    renderFavorites(allSpacecraft);
  } catch (error) {
    favList.innerHTML = '<li class="fav-empty">Could not load favorites.</li>';
    console.error('Error loading favorites:', error);
  }
}

init();
