/**
 * helpers.js — Shared JavaScript for all pages
 * Beyond Earth: A Spacecraft Encyclopedia
 */

export function getStatusClass(status) {
  const map = {
    'Active': 'status-active',
    'Retired': 'status-retired',
    'Deorbited': 'status-deorbited',
    'In Development': 'status-development',
    'Signal Lost': 'status-signal'
  };
  return map[status] || 'status-retired';
}

export function getFavorites() {
  try {
    const raw = localStorage.getItem('favorites');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id) {
  return getFavorites().includes(id);
}

export function toggleFavorite(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);

  if (idx === -1) {
    favs.push(id);
  } else {
    favs.splice(idx, 1);
  }

  localStorage.setItem('favorites', JSON.stringify(favs));
  return idx === -1;
}

/* ── NAV (not exported unless needed elsewhere) ── */
function initNav() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      hamburger.textContent = isOpen ? '✕' : '☰';
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.textContent = '☰';
      });
    });
  }

  const currentFile = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-links a').forEach(link => {
    const linkFile = link.getAttribute('href').split('/').pop();
    if (linkFile === currentFile) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('active');
    }
  });
}

initNav();