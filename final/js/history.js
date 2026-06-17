// History Page JavaScript

// history.js

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  setYear();
});

function setYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}
