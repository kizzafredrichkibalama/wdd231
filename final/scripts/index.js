// index.js - Home page functionality with fetch, DOM manipulation, arrays, templates, localStorage

let allSpacecraft = [];
let activeFilter = localStorage.getItem('filter-choice') || 'All';
let currentSpacecraftId = null;

const grid = document.getElementById('spacecraft-grid');
const filtersContainer = document.getElementById('filters');
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

function buildCard(s) {
  const statusClass = getStatusClass(s.status);
  const favIcon = isFavorite(s.id) ? '★' : '';
  return `
    <article class="spacecraft-card" role="button" tabindex="0" 
             aria-label="View details for ${s.name}" data-id="${s.id}">
      <div class="card-image">
        <img src="${s.image}" alt="${s.name}" loading="lazy" 
             width="300" height="160">
        <span class="card-status ${statusClass}">${s.status}</span>
      </div>
      <div class="card-body">
        <div class="card-type">${s.type}</div>
        <div class="card-name">${s.name} <span style="color:var(--accent2);font-size:0.9rem;">${favIcon}</span></div>
        <div class="card-agency">${s.agency}</div>
        <div class="card-meta">
          <span class="card-meta-item">📅 ${s.launched}</span>
          <span class="card-meta-item">⚖️ ${s.mass_kg >= 1000 ? (s.mass_kg / 1000).toFixed(1) + 't' : s.mass_kg + 'kg'}</span>
          <span class="card-meta-item">${s.crew === 0 ? '🤖 Uncrewed' : '👨‍🚀 ' + s.crew}</span>
        </div>
      </div>
      <div class="card-footer">${s.notable}</div>
    </article>
  `;
}

function renderGrid(spacecraft) {
  if (spacecraft.length === 0) {
    grid.innerHTML = '<p class="loading">No spacecraft match this filter.</p>';
    countEl.textContent = '0';
    return;
  }

  grid.innerHTML = spacecraft.map(buildCard).join('');
  countEl.textContent = spacecraft.length;

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

function buildFilters(types) {
  filtersContainer.innerHTML = types.map(type => `
    <button class="filter-btn${type === activeFilter ? ' active' : ''}" 
            data-type="${type}" aria-pressed="${type === activeFilter}">
      ${type}
    </button>
  `).join('');

  filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      activeFilter = btn.dataset.type;
      localStorage.setItem('filter-choice', activeFilter);

      filtersContainer.querySelectorAll('.filter-btn').forEach(b => {
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

function openModal(spacecraft) {
  currentSpacecraftId = spacecraft.id;
  
  modalTitle.textContent = spacecraft.name;
  modalSubtitle.textContent = spacecraft.type + ' — ' + spacecraft.agency;
  modalImage.src = spacecraft.image;
  modalImage.alt = spacecraft.name;
  modalDesc.textContent = spacecraft.description;
  modalNotable.innerHTML = '<strong>Notable:</strong> ' + spacecraft.notable;

  const statusClass = getStatusClass(spacecraft.status);
  modalSpecs.innerHTML = `
    <div class="spec-item">
      <div class="spec-label">Launched</div>
      <div class="spec-value">${spacecraft.launched}</div>
    </div>
    <div class="spec-item">
      <div class="spec-label">Status</div>
      <div class="spec-value">
        <span class="card-status ${statusClass}" style="position:static;font-size:0.75rem;">
          ${spacecraft.status}
        </span>
      </div>
    </div>
    <div class="spec-item">
      <div class="spec-label">Mass</div>
      <div class="spec-value">${spacecraft.mass_kg.toLocaleString()} kg</div>
    </div>
    <div class="spec-item">
      <div class="spec-label">Crew</div>
      <div class="spec-value">${spacecraft.crew === 0 ? 'Uncrewed' : spacecraft.crew}</div>
    </div>
  `;

  updateFavBtn();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  closeBtn.focus();
}

function closeModal() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentSpacecraftId = null;
}

function updateFavBtn() {
  const saved = isFavorite(currentSpacecraftId);
  modalFavBtn.textContent = saved ? '★ Saved to Favorites' : '☆ Save to Favorites';
  modalFavBtn.classList.toggle('saved', saved);
}

async function init() {
  grid.innerHTML = '<p class="loading">Loading spacecraft data…</p>';

  try {
    const response = await fetch('./data/spacecraft.json');
    if (!response.ok) {
      throw new Error('HTTP error — status: ' + response.status);
    }
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

  } catch (error) {
    grid.innerHTML = '<p class="error-msg">⚠ Could not load spacecraft data. Please try refreshing.</p>';
    console.error('Init error:', error);
  }
}

closeBtn.addEventListener('click', closeModal);

overlay.addEventListener('click', function(e) {
  if (e.target === overlay) closeModal();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && overlay.classList.contains('open')) {
    closeModal();
  }
});

modalFavBtn.addEventListener('click', function() {
  if (currentSpacecraftId === null) return;
  const nowSaved = toggleFavorite(currentSpacecraftId);
  updateFavBtn();
  
  const card = grid.querySelector('[data-id="' + currentSpacecraftId + '"]');
  if (card) {
    const nameEl = card.querySelector('.card-name span');
    if (nameEl) nameEl.textContent = nowSaved ? '★' : '';
  }
});

init();
