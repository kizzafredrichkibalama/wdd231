// join.js - Handles membership form and modal interactions

// Set timestamp when form loads
const timestampField = document.getElementById('form-timestamp');
if (timestampField) {
  timestampField.value = new Date().toLocaleString('en-UG');
}

// Modal handling
const modalButtons = document.querySelectorAll('.membership-info-button');
const modals = {
  np: document.getElementById('np-modal'),
  bronze: document.getElementById('bronze-modal'),
  silver: document.getElementById('silver-modal'),
  gold: document.getElementById('gold-modal')
};

// Open modal when Learn More button clicked
modalButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    const level = button.dataset.level;
    if (modals[level]) {
      modals[level].showModal();
    }
  });
});

// Close modal with X button or Close button
Object.values(modals).forEach(modal => {
  if (!modal) return;
  
  const closebutton = modal.querySelector('.modal-close');
  const closebuttonSecondary = modal.querySelector('.modal-close-button');
  
  if (closebutton) {
    closebutton.addEventListener('click', () => modal.close());
  }
  
  if (closebuttonSecondary) {
    closebuttonSecondary.addEventListener('click', () => modal.close());
  }
  
  // Close modal when clicking outside (on backdrop)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.close();
    }
  });
});

// Close modal with Escape key (browser default)
// No need to add this - it's built into the dialog element

console.log('Join form initialized');
