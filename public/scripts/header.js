//menu
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeBtn');
    const slideMenu = document.getElementById('slideMenu');
    const overlay = document.getElementById('overlay');

    // Función para abrir el menú
    menuBtn.addEventListener('click', function() {
        slideMenu.classList.add('active');
        overlay.style.display = 'block';
        menuBtn.classList.add('hidden');
    });

    // Función para cerrar el menú
    function closeMenu() {
        slideMenu.classList.remove('active');
        overlay.style.display = 'none';
        menuBtn.classList.remove('hidden');
    }

    // Cerrar al hacer click en el botón X
    closeBtn.addEventListener('click', closeMenu);

    // Cerrar al hacer click en el overlay
    overlay.addEventListener('click', closeMenu);
});


document.addEventListener("DOMContentLoaded", function () {
    // Elementos del menú principal
    const botonMenu = document.querySelector('.boton-menu');
    const navegacion = document.querySelector('.navegacion-principal');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuItems = document.querySelectorAll('.navegacion-principal ul li a');

    // Elementos del perfil
    const iconoPerfil = document.querySelector('.icono-perfil img');
    const perfilDropdown = document.querySelector('.perfil-dropdown');

    // Función para cerrar el menú de navegación
    function cerrarMenuNavegacion() {
        botonMenu.classList.remove('activo');
        navegacion.classList.remove('activo');
        menuOverlay.classList.remove('activo');
        document.body.style.overflow = '';
    }

    // Función para cerrar el dropdown del perfil
    function cerrarPerfilDropdown() {
        if (perfilDropdown) {
            perfilDropdown.classList.remove('activo');
        }
    }

    // Función para toggle del menú con animación mejorada
    function toggleMenu() {
        cerrarPerfilDropdown(); // Cerrar perfil si está abierto
        
        const estaActivo = !navegacion.classList.contains('activo');
        
        botonMenu.classList.toggle('activo');
        navegacion.classList.toggle('activo');
        menuOverlay.classList.toggle('activo');
        document.body.style.overflow = estaActivo ? 'hidden' : '';

        // Removemos las animaciones individuales para que aparezcan todos los items juntos
        menuItems.forEach(item => {
            item.style.opacity = estaActivo ? "1" : "0";
            item.style.transform = estaActivo ? "translateX(0)" : "translateX(-20px)";
            // Eliminamos el setTimeout para que no haya retraso
        });
    }

    // Toggle del perfil
    if (iconoPerfil) {
        iconoPerfil.addEventListener('click', function(e) {
            e.stopPropagation();
            cerrarMenuNavegacion(); // Cerrar menú si está abierto
            perfilDropdown.classList.toggle('activo');
        });
    }

    // Event listeners del menú
    botonMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMenu();
    });
    
    menuOverlay.addEventListener('click', toggleMenu);

    // Manejar click en items del menú
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            menuItems.forEach(i => i.classList.remove('activo'));
            this.classList.add('activo');
            
            if (window.innerWidth < 1280) {
                setTimeout(cerrarMenuNavegacion, 300);
            }
        });
    });

    // Cerrar todo al hacer click fuera
    document.addEventListener('click', function(e) {
        const clickFueraMenu = !navegacion.contains(e.target) && 
                              !botonMenu.contains(e.target);
        const clickFueraPerfil = !perfilDropdown?.contains(e.target) && 
                                !iconoPerfil?.contains(e.target);

        if (clickFueraMenu && clickFueraPerfil) {
            cerrarMenuNavegacion();
            cerrarPerfilDropdown();
        }
    });

    // Cerrar menú al hacer scroll con debounce
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(() => {
            cerrarMenuNavegacion();
            cerrarPerfilDropdown();
        }, 150);
    }, { passive: true });

    // Cerrar menú al redimensionar con debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        
        resizeTimeout = setTimeout(() => {
            cerrarMenuNavegacion();
            cerrarPerfilDropdown();
        }, 150);
    }, { passive: true });

    // Cerrar menú al presionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarMenuNavegacion();
            cerrarPerfilDropdown();
        }
    });

    // Detectar gestos de swipe en móviles
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        const delta = touchEndX - touchStartX;

        if (Math.abs(delta) > swipeThreshold) {
            if (delta > 0 && !navegacion.classList.contains('activo')) {
                toggleMenu(); // Abrir menú
            } else if (delta < 0 && navegacion.classList.contains('activo')) {
                toggleMenu(); // Cerrar menú
            }
        }
    }, { passive: true });
});




document.addEventListener('DOMContentLoaded', () => {
    // Notification Bell Setup
    const notificationBell = document.createElement('div');
    notificationBell.classList.add('notificacion-campana');
    notificationBell.innerHTML = `
        <i class="fas fa-bell"></i>
        <span class="badge-notificacion">5</span>
    `;

    // Insert the notification bell before the profile icon
    const profileIcon = document.querySelector('.icono-perfil');
    profileIcon.parentNode.insertBefore(notificationBell, profileIcon);

    // Notification Bell Click Animation
    notificationBell.addEventListener('click', () => {
        notificationBell.classList.add('animating');
        
        // Remove animation class after it completes
        setTimeout(() => {
            notificationBell.classList.remove('animating');
        }, 500);
    });
});







document.addEventListener('DOMContentLoaded', () => {
    // Ensure only one notification bell exists
    const existingBells = document.querySelectorAll('.notificacion-campana');
    if (existingBells.length > 1) {
        // Remove extra bells
        for (let i = 1; i < existingBells.length; i++) {
            existingBells[i].remove();
        }
    }

    const notificationBell = document.querySelector('.notificacion-campana');

    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            notificationBell.classList.add('animating');
            
            // Remove animation class after it completes
            setTimeout(() => {
                notificationBell.classList.remove('animating');
            }, 500);
        });
    }
});

