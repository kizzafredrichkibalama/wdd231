import attractions from '../data/attractions.mjs';

// ===== VISITOR MESSAGE (localStorage) =====
function displayVisitorMessage() {
  const messageEl = document.getElementById('visitor-message');
  const lastVisit = localStorage.getItem('lastVisitDate');
  const currentDate = Date.now();
  let message = '';

  if (!lastVisit) {
    // First visit
    message = 'Welcome! Let us know if you have any questions.';
  } else {
    const lastVisitTime = parseInt(lastVisit);
    const timeDiff = currentDate - lastVisitTime;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Less than a day
      message = 'Back so soon! Awesome!';
    } else {
      // More than a day
      const dayWord = daysDiff === 1 ? 'day' : 'days';
      message = `You last visited ${daysDiff} ${dayWord} ago.`;
    }
  }

  // Update stored date
  localStorage.setItem('lastVisitDate', currentDate);

  // Display message
  messageEl.innerHTML = `<p>${message}</p>`;
  messageEl.setAttribute('aria-label', message);
}

// ===== RENDER ATTRACTION CARDS =====
function renderAttractions() {
  const container = document.getElementById('attractions-container');
  
  attractions.forEach((attraction, index) => {
    const card = document.createElement('article');
    card.className = 'attraction-card';
    card.setAttribute('role', 'listitem');
    card.style.gridArea = `card${index + 1}`;

    card.innerHTML = `
      <h2>${attraction.title}</h2>
      <figure class="attraction-image">
        <img 
          src="images/${attraction.image}" 
          alt="${attraction.title}, ${attraction.address}"
          loading="lazy"
          width="300"
          height="200"
        >
      </figure>
      <address>${attraction.address}</address>
      <p class="attraction-description">${attraction.description}</p>
      <button class="learn-more-btn" aria-label="Learn more about ${attraction.title}">Learn More</button>
    `;

    container.appendChild(card);
  });
}

// ===== LAZY LOADING ENHANCEMENT =====
function setupLazyLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.style.opacity = '1';
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });

    images.forEach(img => {
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.4s ease-in-out';
      imageObserver.observe(img);
    });
  }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
  displayVisitorMessage();
  renderAttractions();
  setupLazyLoading();
});
