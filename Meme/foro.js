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

















// Animaciones para mensajes del foro cuando aparecen en viewport
const observador = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

// Aplicar observador a todos los mensajes
document.querySelectorAll('.mensaje-foro').forEach(mensaje => {
    mensaje.style.opacity = '0';
    mensaje.style.transform = 'translateY(20px)';
    mensaje.style.transition = 'all 0.5s ease-out';
    observador.observe(mensaje);
});

// Efecto hover mejorado para las etiquetas
document.querySelectorAll('.etiqueta').forEach(etiqueta => {
    etiqueta.addEventListener('mouseenter', (e) => {
        const x = e.clientX - e.target.offsetLeft;
        const y = e.clientY - e.target.offsetTop;
        
        const ripple = document.createElement('div');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.className = 'ripple';
        e.target.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 1000);
    });
});



// Animación para los votos
document.querySelectorAll('.votos button').forEach(boton => {
    boton.addEventListener('click', function(e) {
        e.preventDefault();
        
        const contador = this.parentElement.querySelector('.contador-votos');
        const valor = parseInt(contador.textContent);
        const esIncremento = this.classList.contains('incrementar');
        
        // Animación del contador
        contador.style.transform = 'scale(1.2)';
        contador.style.color = esIncremento ? '#4CAF50' : '#f44336';
        
        setTimeout(() => {
            contador.style.transform = 'scale(1)';
            contador.style.color = '#fff';
        }, 200);
        
        // Efecto de partículas
        crearParticulasVoto(e.clientX, e.clientY, esIncremento);
    });
});

// Función para crear partículas en los votos
function crearParticulasVoto(x, y, esPositivo) {
    for (let i = 0; i < 8; i++) {
        const particula = document.createElement('div');
        particula.className = 'particula-voto';
        particula.style.backgroundColor = esPositivo ? '#4CAF50' : '#f44336';
        particula.style.left = `${x}px`;
        particula.style.top = `${y}px`;
        
        const angulo = (i * 45) * Math.PI / 180;
        const velocidad = 8;
        const vx = Math.cos(angulo) * velocidad;
        const vy = Math.sin(angulo) * velocidad;
        
        document.body.appendChild(particula);
        
        let posX = x;
        let posY = y;
        let opacidad = 1;
        
        const animar = () => {
            if (opacidad <= 0) {
                particula.remove();
                return;
            }
            
            posX += vx;
            posY += vy;
            opacidad -= 0.05;
            
            particula.style.left = `${posX}px`;
            particula.style.top = `${posY}px`;
            particula.style.opacity = opacidad;
            
            requestAnimationFrame(animar);
        };
        
        requestAnimationFrame(animar);
    }
}

// Animación para mensajes destacados
document.querySelectorAll('.mensaje-destacado').forEach(mensaje => {
    let anguloRotacion = 0;
    
    function animarEstrella() {
        const estrella = mensaje.querySelector('::before');
        if (estrella) {
            anguloRotacion += 1;
            estrella.style.transform = `rotate(${anguloRotacion}deg)`;
        }
        requestAnimationFrame(animarEstrella);
    }
    
    animarEstrella();
    
    // Efecto de brillo al hover
    mensaje.addEventListener('mouseenter', () => {
        const brilloEfecto = document.createElement('div');
        brilloEfecto.className = 'brillo-destacado';
        mensaje.appendChild(brilloEfecto);
        
        setTimeout(() => brilloEfecto.remove(), 1000);
    });
});


// Efecto de desplazamiento suave para la paginación
document.querySelectorAll('.btn-pagina').forEach(boton => {
    boton.addEventListener('click', function(e) {
        e.preventDefault();
        
        const contenedorForo = document.querySelector('.contenedor-foro');
        contenedorForo.style.opacity = '0';
        contenedorForo.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            contenedorForo.style.opacity = '1';
            contenedorForo.style.transform = 'translateY(0)';
        }, 300);
    });
});

// Animación para el indicador de actividad
document.querySelectorAll('.indicador-actividad').forEach(indicador => {
    setInterval(() => {
        indicador.style.transform = 'scale(1.2)';
        setTimeout(() => {
            indicador.style.transform = 'scale(1)';
        }, 500);
    }, 2000);
});


        document.querySelectorAll('[data-comentarios]').forEach(btn => {
            btn.addEventListener('click', () => {
                const mensajeId = btn.getAttribute('data-comentarios');
                const comentariosSeccion = document.querySelector(`#${mensajeId} .comentarios-seccion`);
                if (comentariosSeccion) {
                    comentariosSeccion.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Preview de imagen antes de subir
        document.getElementById('subir-imagen').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'comentario-imagen';
                    document.querySelector('.subir-imagen').appendChild(img);
                }
                reader.readAsDataURL(file);
            }
        });
