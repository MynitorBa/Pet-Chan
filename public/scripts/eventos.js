// Carrusel principal
const carrusel = document.querySelector('.carrusel');
const imagenes = document.querySelectorAll('.carrusel-imagen');
let indiceActual = 0;
let intervaloCarrusel;

function cambiarImagen(direccion = 1) {
    imagenes[indiceActual].classList.remove('activa');
    
    if (direccion === 1) {
        indiceActual = (indiceActual + 1) % imagenes.length;
    } else {
        indiceActual = (indiceActual - 1 + imagenes.length) % imagenes.length;
    }
    
    imagenes[indiceActual].classList.add('activa');
}

function iniciarCarrusel() {
    detenerCarrusel();
    intervaloCarrusel = setInterval(() => cambiarImagen(1), 5000);
}

function detenerCarrusel() {
    if (intervaloCarrusel) {
        clearInterval(intervaloCarrusel);
    }
}

// Iniciar el carrusel automáticamente
iniciarCarrusel();

// Pausar el carrusel al pasar el mouse por encima
carrusel.addEventListener('mouseenter', detenerCarrusel);
carrusel.addEventListener('mouseleave', iniciarCarrusel);

// Agregar botones de navegación al carrusel (crear elementos si no existen en HTML)
function agregarControlesCarrusel() {
    const controles = document.createElement('div');
    controles.className = 'controles-carrusel';
    controles.innerHTML = `
        <button class="control-carrusel prev">❮</button>
        <button class="control-carrusel next">❯</button>
    `;
    carrusel.appendChild(controles);
    
    document.querySelector('.control-carrusel.prev').addEventListener('click', () => {
        detenerCarrusel();
        cambiarImagen(-1);
        iniciarCarrusel();
    });
    
    document.querySelector('.control-carrusel.next').addEventListener('click', () => {
        detenerCarrusel();
        cambiarImagen(1);
        iniciarCarrusel();
    });
}

// Agregar controles si no existen
if (!document.querySelector('.controles-carrusel')) {
    agregarControlesCarrusel();
}

// Funcionalidad para eventos
document.addEventListener('DOMContentLoaded', function() {
    // Agregar sección de filtros si no existe
    const seccionEventos = document.querySelector('.seccion-eventos');
    if (!document.querySelector('.filtros-eventos') && seccionEventos) {
        const filtros = document.createElement('div');
        filtros.className = 'filtros-eventos';
        filtros.innerHTML = `
            <button class="filtro-btn activo" data-filtro="todos">Todos</button>
            <button class="filtro-btn" data-filtro="competitivo">Competitivos</button>
            <button class="filtro-btn" data-filtro="creatividad">Creativos</button>
            <button class="filtro-btn" data-filtro="fiesta">Fiestas</button>
        `;
        seccionEventos.insertBefore(filtros, document.querySelector('.lista-eventos'));
    }
    
    // Agregar paginación si no existe
    if (!document.querySelector('.paginacion') && seccionEventos) {
        const paginacion = document.createElement('div');
        paginacion.className = 'paginacion';
        paginacion.innerHTML = `
            <div class="pagina activa">1</div>
            <div class="pagina">2</div>
            <div class="pagina">3</div>
            <div class="pagina">...</div>
        `;
        seccionEventos.appendChild(paginacion);
    }
    
    // Mejorar eventos existentes
    mejorarEventos();
    
    // Agregar funcionalidad a los filtros
    const filtrosBtns = document.querySelectorAll('.filtro-btn');
    if (filtrosBtns.length > 0) {
        filtrosBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Quitar la clase activa de todos los botones
                filtrosBtns.forEach(b => b.classList.remove('activo'));
                
                // Agregar la clase activa al botón clickeado
                this.classList.add('activo');
                
                // Filtrar eventos
                const filtro = this.getAttribute('data-filtro');
                filtrarEventos(filtro);
            });
        });
    }
    
    // Agregar funcionalidad a la paginación
    const paginaBtns = document.querySelectorAll('.paginacion .pagina');
    if (paginaBtns.length > 0) {
        paginaBtns.forEach(pagina => {
            pagina.addEventListener('click', function() {
                paginaBtns.forEach(p => p.classList.remove('activa'));
                this.classList.add('activa');
                
                // Aquí iría la lógica para cargar más eventos
                // Simulamos una carga
                const listaEventos = document.querySelector('.lista-eventos');
                if (listaEventos) {
                    listaEventos.style.opacity = '0.5';
                    setTimeout(() => {
                        listaEventos.style.opacity = '1';
                    }, 300);
                }
            });
        });
    }
    
    // Crear modal para detalles de evento si no existe
    if (!document.querySelector('.modal')) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-contenido">
                <span class="cerrar-modal">×</span>
                <h2 class="modal-titulo">Detalles del Evento</h2>
                <div class="modal-cuerpo"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Cerrar modal
        document.querySelector('.cerrar-modal').addEventListener('click', function() {
            document.querySelector('.modal').style.display = 'none';
        });
        
        // Cerrar modal haciendo clic fuera
        window.addEventListener('click', function(e) {
            if (e.target === document.querySelector('.modal')) {
                document.querySelector('.modal').style.display = 'none';
            }
        });
    }
});

// Función para mejorar los eventos existentes
function mejorarEventos() {
    const eventos = document.querySelectorAll('.evento');
    
    eventos.forEach((evento, index) => {
        // Añadir clase "popular" a algunos eventos
        if (index === 0 || index === 2) {
            evento.classList.add('evento-popular');
        }
        
        // Añadir contador regresivo si no existe
        const fechaEvento = evento.querySelector('.fecha-evento');
        if (fechaEvento && !evento.querySelector('.contador-regresivo')) {
            const contador = document.createElement('div');
            contador.className = 'contador-regresivo';
            contador.innerHTML = 'Faltan: 3d 7h 45m';
            fechaEvento.appendChild(contador);
        }
        
        // Añadir detalles adicionales si no existen
        const infoEvento = evento.querySelector('.info-evento');
        if (infoEvento && !infoEvento.querySelector('.detalles-evento')) {
            const detalles = document.createElement('div');
            detalles.className = 'detalles-evento';
            detalles.innerHTML = `
                <div class="detalle"><svg viewBox="0 0 24 24"><path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"></path></svg> Virtual</div>
                <div class="detalle"><svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"></path></svg> 2 horas</div>
            `;
            infoEvento.appendChild(detalles);
        }
        
        // Añadir botones adicionales
        const botonInscribirse = evento.querySelector('.boton-inscribirse');
        if (botonInscribirse && !evento.querySelector('.acciones-evento')) {
            // Crear contenedor para los botones
            const acciones = document.createElement('div');
            acciones.className = 'acciones-evento';
            
            // Mover el botón de inscripción
            botonInscribirse.remove();
            acciones.appendChild(botonInscribirse);
            
            // Añadir botón de compartir
            const botonCompartir = document.createElement('button');
            botonCompartir.className = 'boton-compartir';
            botonCompartir.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z"></path></svg> Compartir';
            acciones.appendChild(botonCompartir);
            
            // Añadir botón de recordatorio
            const botonRecordatorio = document.createElement('button');
            botonRecordatorio.className = 'boton-recordatorio';
            botonRecordatorio.textContent = '🔔 Recordatorio';
            acciones.appendChild(botonRecordatorio);
            
            infoEvento.appendChild(acciones);
        }
        
        // Añadir contador de participantes
        if (infoEvento && !infoEvento.querySelector('.participantes')) {
            const participantes = document.createElement('div');
            participantes.className = 'participantes';
            participantes.innerHTML = `
                <div>Asistentes: 128 personas</div>
                <div class="participantes-avatars">
                    <div class="avatar">A</div>
                    <div class="avatar">B</div>
                    <div class="avatar">C</div>
                    <div class="avatar">+</div>
                </div>
            `;
            infoEvento.appendChild(participantes);
        }
        
        // Añadir funcionalidad para abrir el modal de detalles
        evento.addEventListener('click', function(e) {
            // No abrir el modal si se hace clic en los botones
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            
            const titulo = evento.querySelector('.titulo-evento').textContent;
            const descripcion = evento.querySelector('.descripcion-evento').textContent;
            const fecha = evento.querySelector('.dia').textContent + ' ' + 
                          evento.querySelector('.mes').textContent + ' ' + 
                          evento.querySelector('.año').textContent;
            
            // Llenar modal con datos del evento
            const modal = document.querySelector('.modal');
            const modalTitulo = modal.querySelector('.modal-titulo');
            const modalCuerpo = modal.querySelector('.modal-cuerpo');
            
            modalTitulo.textContent = titulo;
            modalCuerpo.innerHTML = `
                <div class="modal-imagen" style="background-image: url('${evento.style.backgroundImage.replace(/url\(['"](.+)['"]\)/, '$1')}'); height: 200px; background-size: cover; background-position: center; border-radius: 8px; margin-bottom: 15px;"></div>
                <div class="modal-fecha"><strong>Fecha:</strong> ${fecha}</div>
                <div class="modal-descripcion"><strong>Descripción:</strong> ${descripcion}</div>
                <div class="modal-info-adicional">
                    <p><strong>Organizador:</strong> Pet-Chan Team</p>
                    <p><strong>Plataforma:</strong> Discord y Twitch</p>
                    <p><strong>Duración:</strong> 2 horas</p>
                    <p><strong>Modalidad:</strong> Virtual en vivo</p>
                </div>
            `;
            modal.style.display = 'block';
        });
    });
}

// Función para filtrar eventos
function filtrarEventos(filtro) {
    const eventos = document.querySelectorAll('.evento');
    
    eventos.forEach(evento => {
        const etiquetas = Array.from(evento.querySelectorAll('.etiqueta')).map(etiqueta => etiqueta.textContent.toLowerCase());
        
        if (filtro === 'todos' || etiquetas.includes(filtro)) {
            evento.style.display = 'flex';
        } else {
            evento.style.display = 'none';
        }
    });
}