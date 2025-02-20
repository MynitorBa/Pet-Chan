// Funcionalidad del menú hamburguesa
const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('.main-nav');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    nav.classList.toggle('active');
});

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (event) => {
    if (!event.target.closest('.hamburger') && !event.target.closest('.main-nav')) {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
    }
});

// Funcionalidad del menú de perfil
const profileIcon = document.querySelector('.profile-icon');
const profileMenu = document.createElement('div');
profileMenu.className = 'profile-menu';
profileMenu.innerHTML = `
    <ul>
        <li><a href="#">Mi Perfil</a></li>
        <li><a href="#">Configuración</a></li>
        <li><a href="#">Cerrar Sesión</a></li>
    </ul>
`;

// Insertar el menú de perfil en el DOM
profileIcon.appendChild(profileMenu);

// Manejar clics en el ícono de perfil
profileIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    // Cerrar otros menús abiertos
    document.querySelectorAll('.profile-menu.show').forEach(menu => {
        if (menu !== profileMenu) menu.classList.remove('show');
    });
    profileMenu.classList.toggle('show');
});

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!profileIcon.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove('show');
    }
});

// Cerrar menú al hacer scroll
window.addEventListener('scroll', () => {
    profileMenu.classList.remove('show');
});
