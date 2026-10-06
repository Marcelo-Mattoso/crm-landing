const nav = document.querySelector('.nav');
const update = () => nav.classList.toggle('nav-scrolled', window.scrollY > 8);
update();
window.addEventListener('scroll', update, { passive: true });
