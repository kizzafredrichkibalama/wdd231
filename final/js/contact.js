// Contact Page JavaScript

let allSpacecraft = [];
const favList = document.getElementById('favorites-list');
const favEmpty = document.getElementById('favorites-empty');
const favCount = document.getElementById('favorites-count');

async function fetchSpacecraft() {
  try {
    const response = await fetch('data/spacecraft.json');
    if (!response.ok) {
      throw new Error(`HTTP error — status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch spacecraft data:', error);
    return [];
  }
}

function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites')) || [];
}

function removeFavorite(id) {
  let favs = JSON.parse(localStorage.getItem('favorites')) || [];
  favs = favs.filter(f => f !== id);
  localStorage.setItem('favorites', JSON.stringify(favs));
}

function renderFavorites() {
  const ids = getFavorites();
  const favs = allSpacecraft.filter(s => ids.includes(s.id));

  favCount.textContent = favs.length;

  if (favs.length === 0) {
    favList.innerHTML = '';
    favEmpty.style.display = 'block';
    return;
  }

  favEmpty.style.display = 'none';
  favList.innerHTML = favs.map(s => `
    <li>
      <span>${s.name}</span>
      <button class="fav-remove" data-id="${s.id}">✕</button>
    </li>
  `).join('');

  favList.querySelectorAll('.fav-remove').forEach(button => {
    button.addEventListener('click', () => {
      removeFavorite(parseInt(button.dataset.id));
      renderFavorites();
    });
  });
}

async function init() {
  initNav();
  allSpacecraft = await fetchSpacecraft();
  renderFavorites();
}

init();
