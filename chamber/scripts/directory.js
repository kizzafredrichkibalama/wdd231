// directory.js - fetch members from JSON and display as grid or list

const wrap  = document.getElementById('members-wrap');
const gridbutton    = document.getElementById('grid-button');
const listbutton    = document.getElementById('list-button');

// Membership level number maps to a label and CSS class
const LEVELS = {
  3: { label: 'Gold Member',   cls: 'level-gold'   },
  2: { label: 'Silver Member', cls: 'level-silver'  },
  1: { label: 'Member',        cls: 'level-member'  },
};

// Build one member card element from a member data object
function buildCard(member) {
  const levelInfo = LEVELS[member.level] || LEVELS[1];

  const card = document.createElement('article');
  card.classList.add('member-card');
  card.setAttribute('role', 'listitem');

  card.innerHTML = `
    <img
      class="card-img"
      src="images/${member.image}"
      alt="${member.name} business logo"
      width="300"
      height="140"
      loading="lazy"
    >
    <div class="card-body">
      <h2>${member.name}</h2>
      <p class="tagline">${member.tagline}</p>
      <p class="card-detail"><strong>Address:</strong> ${member.address}</p>
      <p class="card-detail"><strong>Phone:</strong> ${member.phone}</p>
      <p class="card-detail"><strong>Email:</strong> ${member.email}</p>
      <p class="card-detail">
        <strong>Web:</strong>
        <a class="website-link" href="${member.website}" target="_blank" rel="noopener noreferrer">
          ${member.website.replace('https://', '')}
        </a>
      </p>
      <span class="level-badge ${levelInfo.cls}">${levelInfo.label}</span>
    </div>
  `;

  return card;
}

// Fetch members.json and render all cards
async function loadMembers() {
  try {
    const response = await fetch('data/members.json');
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();

    wrap.setAttribute('role', 'list');
    wrap.innerHTML = '';

    data.members.forEach(member => {
      wrap.appendChild(buildCard(member));
    });
  } catch (error) {
    wrap.innerHTML = `<p class="load-error">Could not load member data: ${error.message}</p>`;
    console.error('Member load error:', error);
  }
}

// Switch to grid layout
function showGrid() {
  wrap.classList.remove('list-view');
  gridbutton.classList.add('active');
  listbutton.classList.remove('active');
  gridbutton.setAttribute('aria-pressed', 'true');
  listbutton.setAttribute('aria-pressed', 'false');
}

// Switch to list layout (hides images and taglines via CSS)
function showList() {
  wrap.classList.add('list-view');
  listbutton.classList.add('active');
  gridbutton.classList.remove('active');
  listbutton.setAttribute('aria-pressed', 'true');
  gridbutton.setAttribute('aria-pressed', 'false');
}

gridbutton.addEventListener('click', showGrid);
listbutton.addEventListener('click', showList);

// Load members when the page is ready
loadMembers();
