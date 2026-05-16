// date.js - dynamic copyright year and last modified date

const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const modEl = document.getElementById('lastModified');
if (modEl) modEl.textContent = 'Last Modification: ' + document.lastModified;
