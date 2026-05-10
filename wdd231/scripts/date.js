// date.js — dynamic copyright year and last modified date

const yearEl = document.getElementById('copyright-year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const lastModEl = document.getElementById('lastModified');
if (lastModEl) {
  lastModEl.textContent = 'Last Modification: ' + document.lastModified;
}
