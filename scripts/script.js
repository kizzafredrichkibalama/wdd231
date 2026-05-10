const menuBtn = document.getElementById("menuBTN");
const navMenu = document.getElementById("navMenu");

menuBtn.addEventListener('click',()=>{
    navMenu.classList.toggle('open');
})