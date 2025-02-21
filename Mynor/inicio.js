// Funcionalidad del menú
const botonMenu = document.querySelector('.boton-menu');
const navegacion = document.querySelector('.navegacion-principal');

botonMenu.addEventListener('click', () => {
    botonMenu.classList.toggle('activo');
    navegacion.classList.toggle('activo');
});

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.boton-menu') && !evento.target.closest('.navegacion-principal')) {
        botonMenu.classList.remove('activo');
        navegacion.classList.remove('activo');
    }
});

// Funcionalidad del menú de usuario
const iconoPerfil = document.querySelector('.icono-perfil');
const menuUsuario = document.createElement('div');
menuUsuario.className = 'menu-usuario';
menuUsuario.innerHTML = `
    <ul>
        <li><a href="#">Mi Perfil</a></li>
        <li><a href="#">Configuración</a></li>
        <li><a href="#">Cerrar Sesión</a></li>
    </ul>
`;

// Insertar el menú de usuario en el DOM
iconoPerfil.appendChild(menuUsuario);

// Manejar clics en el ícono de perfil
iconoPerfil.addEventListener('click', (evento) => {
    evento.stopPropagation();
    // Cerrar otros menús abiertos
    document.querySelectorAll('.menu-usuario.mostrar').forEach(menu => {
        if (menu !== menuUsuario) menu.classList.remove('mostrar');
    });
    menuUsuario.classList.toggle('mostrar');
});

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (evento) => {
    if (!iconoPerfil.contains(evento.target) && !menuUsuario.contains(evento.target)) {
        menuUsuario.classList.remove('mostrar');
    }
});

// Cerrar menú al hacer scroll
window.addEventListener('scroll', () => {
    menuUsuario.classList.remove('mostrar');
});