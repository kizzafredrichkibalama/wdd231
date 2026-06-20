/**
 * helpers.js — Shared JavaScript for all pages
 * Beyond Earth: A Spacecraft Encyclopedia
 * Author: Kizza Fredrich Kibalama | BYU-Idaho WDD 231
 *
 * Included on every page via: <script src="scripts/helpers.js" defer>
 * Runs after the DOM is fully loaded (defer attribute).
 *
 * PROVIDES:
 *  1. initNav()  — hamburger toggle + wayfinding (aria-current)
 *  2. Year footer — sets current year dynamically
 */

// ── SET CURRENT YEAR IN FOOTER ────────────────────────────────
// DOM MANIPULATION: update the <span id="year"> on every page
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ── NAVIGATION ────────────────────────────────────────────────
function initNav() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  // HAMBURGER TOGGLE (small screens only — hidden via CSS on desktop)
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open'); // Toggle CSS class
      hamburger.setAttribute('aria-expanded', isOpen); // Update ARIA state
      hamburger.textContent = isOpen ? '✕' : '☰';     // Update icon
    });

    // Close menu when any nav link is tapped (mobile UX)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.textContent = '☰';
      });
    });
  }

  // WAYFINDING — mark the active page link with aria-current="page"
  // This satisfies rubric criterion 5 (wayfinding) and helps screen readers
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-links a').forEach(link => {
    const linkFile = link.getAttribute('href').split('/').pop();
    if (linkFile === currentFile) {
      link.setAttribute('aria-current', 'page'); // ARIA attribute for screen readers
      link.classList.add('active');              // CSS class for visual styling
    }
  });
}

// Run nav setup immediately — DOM is ready because of defer
initNav();
