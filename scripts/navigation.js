// navigation.js — responsive hamburger menu

const menubutton = document.getElementById('menu-button');
const nav = document.querySelector('nav');

if (menubutton && nav) {
  menubutton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menubutton.classList.toggle('open', isOpen);
    menubutton.setAttribute('aria-expanded', isOpen);
  });

  // Close menu on link click (mobile)
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menubutton.classList.remove('open');
      menubutton.setAttribute('aria-expanded', false);
    });
  });
}
