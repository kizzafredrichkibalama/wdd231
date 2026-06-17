// Home Page JavaScript
let allSpacecraft = [];
let activeFilter = localStorage.getItem('filter-preference') || 'All';

// DOM Elements
const grid = document.getElementById('spacecraft-grid');
const filtersContainer = document.getElementById('filters');
const countEl = document.getElementById('spacecraft-count');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalFavBtn = document.getElementById('modal-fav-btn');

// Fetch spacecraft data
async function fetchSpacecraft() {
  try {
    const response = await fetch('data/spacecraft.json');
    if (!response.ok) {
      throw new Error(`HTTP error — status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch spacecraft data:', error);
    grid.innerHTML = '<p class="error-msg">Failed to load spacecraft data. Please refresh the page.</p>';
    throw error;
  }
}

// Build spacecraft card HTML
function buildCard(spacecraft) {
  const statusClass = getStatusClass(spacecraft.status);
  const isFav = getFavorite(spacecraft.id);
  const favIcon = isFav ? '★' : '';

  return `
    <article class="spacecraft-card" data-id="${spacecraft.id}" role="button" tabindex="0">
      <div class="card-image">
        <img src="${spacecraft.image}" alt="${spacecraft.name}" loading="lazy" width="300" height="160" />
        <span class="card-status ${statusClass}">${spacecraft.status}</span>
      </div>
      <div class="card-body">
        <div class="card-type">${spacecraft.type}</div>
        <div class="card-name">${spacecraft.name} <span style="color: var(--accent2); font-size: 0.9rem;">${favIcon}</span></div>
        <div class="card-agency">${spacecraft.agency}</div>
        <div class="card-meta">
          <span class="card-meta-item">📅 ${spacecraft.launched}</span>
          <span class="card-meta-item">⚖️ ${spacecraft.mass_kg >= 1000 ? (spacecraft.mass_kg / 1000).toFixed(1) + 't' : spacecraft.mass_kg + 'kg'}</span>
          <span class="card-meta-item">${spacecraft.crew === 0 ? '🤖 Uncrewed' : `👨‍🚀 ${spacecraft.crew} crew`}</span>
        </div>
      </div>
      <div class="card-footer">${spacecraft.notable}</div>
    </article>
  `;
}

// Get status CSS class
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

// Render spacecraft grid
function renderGrid(spacecraft) {
  if (spacecraft.length === 0) {
    grid.innerHTML = '<p class="loading">No spacecraft match this filter.</p>';
    countEl.textContent = '0';
    return;
  }

  grid.innerHTML = spacecraft.map(s => buildCard(s)).join('');
  countEl.textContent = spacecraft.length;

  // Add event listeners to cards
  grid.querySelectorAll('.spacecraft-card').forEach(card => {
    const id = parseInt(card.dataset.id);
    const craft = allSpacecraft.find(s => s.id === id);

    card.addEventListener('click', () => openModal(craft));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(craft);
      }
    });
  });
}

// Get unique types
function getTypes(spacecraft) {
  const types = ['All', ...new Set(spacecraft.map(s => s.type))];
  return types;
}

// Filter spacecraft by type
function filterByType(spacecraft, type) {
  if (type === 'All') return spacecraft;
  return spacecraft.filter(s => s.type === type);
}

// Build filter buttons
function buildFilters(types) {
  filtersContainer.innerHTML = types.map(type => `
    <button class="filter-btn${type === activeFilter ? ' active' : ''}" data-type="${type}">
      ${type}
    </button>
  `).join('');

  filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.type;
      localStorage.setItem('filter-preference', activeFilter);

      filtersContainer.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === activeFilter);
      });

      renderGrid(filterByType(allSpacecraft, activeFilter));
    });
  });
}

// Modal functions
function openModal(spacecraft) {
  document.getElementById('modal-title').textContent = spacecraft.name;
  document.getElementById('modal-subtitle').textContent = `${spacecraft.type} — ${spacecraft.agency}`;
  document.getElementById('modal-image').src = spacecraft.image;
  document.getElementById('modal-image').alt = spacecraft.name;
  document.getElementById('modal-desc').textContent = spacecraft.description;
  document.getElementById('modal-notable').innerHTML = `<strong>Notable:</strong> ${spacecraft.notable}`;

  document.getElementById('modal-specs').innerHTML = `
    <div class="spec-item">
      <div class="spec-label">Launched</div>
      <div class="spec-value">${spacecraft.launched}</div>
    </div>
    <div class="spec-item">
      <div class="spec-label">Status</div>
      <div class="spec-value"><span class="card-status ${getStatusClass(spacecraft.status)}" style="position:static;font-size:0.75rem;">${spacecraft.status}</span></div>
    </div>
    <div class="spec-item">
      <div class="spec-label">Mass</div>
      <div class="spec-value">${spacecraft.mass_kg.toLocaleString()} kg</div>
    </div>
    <div class="spec-item">
      <div class="spec-label">Crew</div>
      <div class="spec-value">${spacecraft.crew === 0 ? 'Uncrewed' : spacecraft.crew + ' astronauts'}</div>
    </div>
  `;

  updateFavBtn(spacecraft.id);
  modalOverlay.classList.add('open');
  modalClose.focus();

  modalFavBtn.onclick = () => {
    toggleFavorite(spacecraft.id);
    updateFavBtn(spacecraft.id);
    // Update card icon
    const card = grid.querySelector(`[data-id="${spacecraft.id}"] .card-name span`);
    if (card) {
      card.textContent = isFavorite(spacecraft.id) ? '★' : '';
    }
  };
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

function updateFavBtn(id) {
  const saved = isFavorite(id);
  modalFavBtn.textContent = saved ? '★ Saved to Favorites' : '☆ Save to Favorites';
  modalFavBtn.classList.toggle('saved', saved);
}

// Local Storage Functions
function getFavorite(id) {
  const favs = JSON.parse(localStorage.getItem('favorites')) || [];
  return favs.includes(id);
}

function isFavorite(id) {
  return getFavorite(id);
}

function toggleFavorite(id) {
  const favs = JSON.parse(localStorage.getItem('favorites')) || [];
  const idx = favs.indexOf(id);
  if (idx === -1) {
    favs.push(id);
  } else {
    favs.splice(idx, 1);
  }
  localStorage.setItem('favorites', JSON.stringify(favs));
}

// Modal event listeners
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
});

// Initialize
async function init() {
  initNav();
  grid.innerHTML = '<p class="loading">Loading spacecraft data…</p>';

  try {
    allSpacecraft = await fetchSpacecraft();
    const types = getTypes(allSpacecraft);
    buildFilters(types);
    renderGrid(filterByType(allSpacecraft, activeFilter));

    // Update hero stats
    const activeCount = allSpacecraft.filter(s => s.status === 'Active').length;
    const agencyCount = new Set(allSpacecraft.map(s => s.agency)).size;
    document.getElementById('stat-total').textContent = allSpacecraft.length;
    document.getElementById('stat-active').textContent = activeCount;
    document.getElementById('stat-agencies').textContent = agencyCount;
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

init();
