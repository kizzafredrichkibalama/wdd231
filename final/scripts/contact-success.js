/**
 * contact-success.js — Form Action Page JavaScript
 * Beyond Earth: A Spacecraft Encyclopedia
 * Author: Kizza Fredrich Kibalama | BYU-Idaho WDD 231
 *
 * PURPOSE:
 *  Reads the URL query string produced by the contact form
 *  (method="get") and displays each field value on the page.
 *
 *  When a form uses method="get", the browser appends all
 *  field values to the URL as a query string, e.g.:
 *  contact-success.html?name=Fred&email=fred@test.com&category=General&message=Hello
 *
 *  URLSearchParams parses that string so we can read each value by name.
 *
 * DEMONSTRATES:
 *  - URLSearchParams API
 *  - DOM manipulation (createElement, appendChild)
 *  - Template literals
 */

//  READ FORM DATA FROM URL 
// window.location.search returns the "?name=...&email=..." part of the URL
const params = new URLSearchParams(window.location.search);

// The fields we expect — must match the `name` attributes in contact.html
const fields = ['name', 'email', 'category', 'message'];

const container = document.getElementById('submission-data');

if (container) {
  fields.forEach(fieldName => {
    // Get the value submitted for this field (or 'N/A' if missing)
    const value = params.get(fieldName) || 'N/A';

    // DOM MANIPULATION: create a display card for each field
    const div = document.createElement('div');
    div.className = 'spec-item';

    // TEMPLATE LITERAL: build the card content
    div.innerHTML = `
      <div class="spec-label">${fieldName.toUpperCase()}</div>
      <div class="spec-value" style="font-family:Barlow,sans-serif;font-weight:400;">
        ${value}
      </div>`;

    container.appendChild(div); // DOM MANIPULATION: add to page
  });
}
