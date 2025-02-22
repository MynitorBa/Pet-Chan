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
    const botonMenu = document.querySelector('.boton-menu');
    const navegacion = document.querySelector('.navegacion-principal');
    const menuOverlay = document.getElementById('menu-overlay');
    const iconoPerfil = document.querySelector('.icono-perfil');
    const botonTraducir = document.querySelector(".boton-traducir");
    const botonSesion = document.querySelector(".boton-sesion");

    const menuUsuario = document.createElement('div');
    menuUsuario.className = 'menu-usuario';
    menuUsuario.innerHTML = `
        <ul>
            <li><a href="#">Mi Perfil</a></li>
            <li><a href="#">Configuración</a></li>
            <li><a href="#">Cerrar Sesión</a></li>
        </ul>
    `;
    document.body.appendChild(menuUsuario);

    // Función de rebote al hacer clic (sin animaciones extra)
    function efectoRebote(boton) {
        boton.style.transition = "transform 0.2s ease";
        boton.style.transform = "scale(1.2)";

        setTimeout(() => {
            boton.style.transform = "scale(1)";
        }, 150);
    }

    // Agregar animación de rebote a los botones indicados
    function agregarAnimacionRebote(boton, callback = null) {
        if (boton) {
            boton.addEventListener('click', function (evento) {
                efectoRebote(boton);
                if (callback) callback(evento);
            });
        }
    }

    // Asignar animación y funcionalidad
    agregarAnimacionRebote(botonMenu, () => {
        botonMenu.classList.toggle('activo');
        navegacion.classList.toggle('activo');

        if (menuOverlay.classList.contains('activo')) {
            menuOverlay.classList.remove('activo');
            document.body.style.overflow = '';
        } else {
            menuOverlay.classList.add('activo');
            document.body.style.overflow = 'hidden';
        }
    });

    // Aplicar rebote al ícono de perfil pero SIN efecto extra de agrandamiento
    agregarAnimacionRebote(iconoPerfil, (evento) => {
        evento.stopPropagation();
        menuUsuario.classList.toggle('mostrar');
    });

    agregarAnimacionRebote(botonTraducir);
    agregarAnimacionRebote(botonSesion);

    // Cerrar menú al hacer clic en el overlay
    menuOverlay.addEventListener('click', () => {
        botonMenu.classList.remove('activo');
        navegacion.classList.remove('activo');
        menuOverlay.classList.remove('activo');
        document.body.style.overflow = '';
    });

    // Cerrar menú de usuario al hacer clic afuera
    document.addEventListener('click', (evento) => {
        if (!iconoPerfil.contains(evento.target) && !menuUsuario.contains(evento.target)) {
            menuUsuario.classList.remove('mostrar');
        }
    });

    // Cerrar menús al hacer scroll
    window.addEventListener('scroll', () => {
        menuUsuario.classList.remove('mostrar');

        if (window.innerWidth > 980) {
            botonMenu.classList.remove('activo');
            navegacion.classList.remove('activo');
            menuOverlay.classList.remove('activo');
            document.body.style.overflow = '';
        }
    });

    // Manejo responsivo
    window.addEventListener('resize', () => {
        if (window.innerWidth > 980 && navegacion.classList.contains('activo')) {
            botonMenu.classList.remove('activo');
            navegacion.classList.remove('activo');
            menuOverlay.classList.remove('activo');
            document.body.style.overflow = '';
        }
    });
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
