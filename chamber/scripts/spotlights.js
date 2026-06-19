// spotlights.js
// Fetches members.json and displays 2 or 3 random Gold or Silver members
// as spotlight advertisement cards on the home page.

const spotlightwrap = document.getElementById('spotlights-wrap');

const LEVEL_LABELS = {
  3: 'Gold Member',
  2: 'Silver Member',
};

// Build one spotlight card element
function buildSpotlight(member) {
  const card = document.createElement('article');
  card.classList.add('spotlight-card');

  const levelLabel = LEVEL_LABELS[member.level] || 'Member';
  const levelClass = member.level === 3 ? 'level-gold' : 'level-silver';

  card.innerHTML = `
    <img
      src="images/${member.image}"
      alt="${member.name} logo"
      width="300"
      height="160"
      loading="lazy"
      class="spotlight-img"
    >
    <div class="spotlight-body">
      <h2>${member.name}</h2>
      <p class="spotlight-detail">${member.phone}</p>
      <p class="spotlight-detail">${member.address}</p>
      <a
        href="${member.website}"
        target="_blank"
        rel="noopener noreferrer"
        class="spotlight-link"
      >${member.website.replace('https://', '')}</a>
      <span class="level-badge ${levelClass}">${levelLabel}</span>
    </div>
  `;
  return card;
}

// Shuffle an array randomly (Fisher-Yates algorithm)
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Fetch members, filter for gold/silver, pick 2 or 3 randomly
async function loadSpotlights() {
  try {
    const res  = await fetch('data/members.json');
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();

    // Keep only gold (3) and silver (2) members
    const eligible = data.members.filter(m => m.level >= 2);

    // Randomly pick 2 or 3
    const count    = Math.random() < 0.5 ? 2 : 3;
    const selected = shuffle(eligible).slice(0, count);

    if (!spotlightwrap) return;
    spotlightwrap.innerHTML = '';
    selected.forEach(member => {
      spotlightwrap.appendChild(buildSpotlight(member));
    });
  } catch (err) {
    console.error('Spotlight load failed:', err);
    if (spotlightwrap) {
      spotlightwrap.innerHTML = '<p class="load-error">Spotlight members could not be loaded.</p>';
    }
  }
}

loadSpotlights();
