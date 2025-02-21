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
