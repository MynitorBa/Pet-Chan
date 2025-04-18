// API de eventos - Datos simulados pero con fechas reales
const eventosData = [
    {
        id: 1,
        titulo: "Torneo de Mascotas Virtuales",
        descripcion: "Participa en el torneo más grande de mascotas virtuales. ¡Gana premios exclusivos!",
        imagen: "https://i.pinimg.com/originals/ae/0a/a1/ae0aa14707e1b4bb35fe11b8f00a9956.gif",
        fecha: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 5), // 5 días desde hoy
        hora: "18:00",
        duracion: "2 horas",
        plataforma: "Discord",
        etiquetas: ["Competitivo", "Premios", "Mascotas"],
        organizador: "Equipo Pet-Chan",
        asistentes: 128,
        popular: true,
        historialFechas: [],
        esEspecial: false // No es evento especial (como fin de año)
    },
    {
        id: 2,
        titulo: "Concurso de Diseño de Mascotas",
        descripcion: "Diseña la mascota más creativa y gana reconocimiento en la comunidad.",
        imagen: "https://i.pinimg.com/originals/f0/ae/4d/f0ae4d94c7e930bc50632d4c7d79b59d.gif",
        fecha: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15), // 15 del próximo mes
        hora: "16:00",
        duracion: "3 horas",
        plataforma: "Zoom",
        etiquetas: ["Creatividad", "Diseño", "Reconocimiento"],
        organizador: "Artistas Pet-Chan",
        asistentes: 75,
        popular: false,
        historialFechas: [],
        esEspecial: false
    },
    {
        id: 3,
        titulo: "Fiesta de Fin de Año",
        descripcion: "Celebra el fin de año con una gran fiesta virtual y sorpresas especiales.",
        imagen: "https://favim.com/pd/p/orig/2019/02/11/8bit-city-8-bit-Favim.com-6875655.gif",
        fecha: new Date(new Date().getFullYear(), 11, 31), // 31 de diciembre
        hora: "22:00",
        duracion: "4 horas",
        plataforma: "Twitch",
        etiquetas: ["Fiesta", "Sorpresas", "Celebración"],
        organizador: "Comunidad Pet-Chan",
        asistentes: 210,
        popular: true,
        historialFechas: [],
        esEspecial: true // Evento especial (fin de año)
    },
    {
        id: 4,
        titulo: "Taller de Cuidado Virtual",
        descripcion: "Aprende los mejores tips para cuidar a tus mascotas virtuales.",
        imagen: "https://i.pinimg.com/originals/ff/01/76/ff0176290d1c7092aecb42168eed0348.gif",
        fecha: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 10), // 10 días desde hoy
        hora: "15:00",
        duracion: "1.5 horas",
        plataforma: "YouTube Live",
        etiquetas: ["Educativo", "Taller", "Cuidado"],
        organizador: "Expertos Pet-Chan",
        asistentes: 92,
        popular: false,
        historialFechas: [],
        esEspecial: false
    },
    {
        id: 5,
        titulo: "Maratón de Juegos Retro",
        descripcion: "Juegos retro para mascotas virtuales con premios sorpresa.",
        imagen: "https://i.imgur.com/pnztT1T.gif",
        fecha: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 5), // 5 del mes siguiente
        hora: "20:00",
        duracion: "5 horas",
        plataforma: "Twitch",
        etiquetas: ["Juegos", "Retro", "Diversión"],
        organizador: "Gamers Pet-Chan",
        asistentes: 156,
        popular: true,
        historialFechas: [],
        esEspecial: false
    }
];

// Función para reprogramar eventos cuando llega su fecha
// Función para reprogramar eventos cuando llega su fecha
function verificarYReprogramarEventos() {
    const ahora = new Date();
    
    eventosData.forEach(evento => {
        // Si la fecha del evento ya pasó
        if (evento.fecha < ahora) {
            // Agregar la fecha actual al historial
            evento.historialFechas.push(new Date(evento.fecha));
            
            // Reprogramar el evento
            if (evento.esEspecial) {
                // Eventos especiales (como fin de año) se reprograman para exactamente 1 año después
                const nuevaFecha = new Date(evento.fecha);
                nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1);
                evento.fecha = nuevaFecha;
            } else {
                // Eventos normales se reprograman para 1 mes después
                const nuevaFecha = new Date(evento.fecha);
                nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);  // Cambiado de +3 a +1
                evento.fecha = nuevaFecha;
            }
            
            console.log(`Evento "${evento.titulo}" reprogramado para ${evento.fecha}`);
        }
    });
    
    // Volver a generar los eventos en la página
    generarEventos();
}

// Verificar y reprogramar eventos cada hora (3600000 ms = 1 hora)
setInterval(verificarYReprogramarEventos, 60 * 60 * 1000);

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

// Agregar botones de navegación al carrusel
function agregarControlesCarrusel() {
    const controles = document.createElement('div');
    controles.className = 'controles-carrusel';
    controles.innerHTML = `
        <button class="control-carrusel prev"><i class="fas fa-chevron-left"></i></button>
        <button class="control-carrusel next"><i class="fas fa-chevron-right"></i></button>
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

// Función para formatear fechas
function formatearFecha(fecha) {
    const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Función para calcular la diferencia de tiempo
function calcularTiempoRestante(fechaEvento) {
    const ahora = new Date();
    const diferencia = fechaEvento - ahora;
    
    if (diferencia <= 0) {
        return "¡Evento en progreso!";
    }
    
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    return `Faltan: ${dias}d ${horas}h ${minutos}m`;
}

// Función para actualizar los contadores de tiempo
function actualizarContadores() {
    document.querySelectorAll('.contador-regresivo').forEach((contador, index) => {
        const fechaEvento = eventosData[index].fecha;
        contador.textContent = calcularTiempoRestante(fechaEvento);
    });
}

// Función para generar eventos dinámicamente
function generarEventos() {
    const listaEventos = document.querySelector('.lista-eventos');
    listaEventos.innerHTML = '';
    
    eventosData.sort((a, b) => a.fecha - b.fecha).forEach((evento, index) => {
        const eventoElement = document.createElement('div');
        eventoElement.className = `evento ${evento.popular ? 'evento-popular' : ''}`;
        eventoElement.style.backgroundImage = `url('${evento.imagen}')`;
        eventoElement.dataset.id = evento.id;
        
        const dia = evento.fecha.getDate();
        const mes = evento.fecha.toLocaleString('es-ES', { month: 'short' });
        const año = evento.fecha.getFullYear();
        
        eventoElement.innerHTML = `
            <div class="marco-dorado"></div>
            <div class="fecha-evento">
                <span class="dia">${dia}</span>
                <span class="mes">${mes}</span>
                <span class="año">${año}</span>
                <div class="contador-regresivo">${calcularTiempoRestante(evento.fecha)}</div>
            </div>
            <div class="info-evento">
                <h3 class="titulo-evento">${evento.titulo}</h3>
                <p class="descripcion-evento">${evento.descripcion}</p>
                <div class="detalles-evento">
                    <div class="detalle"><i class="fas fa-clock"></i> ${evento.hora}</div>
                    <div class="detalle"><i class="fas fa-stopwatch"></i> ${evento.duracion}</div>
                    <div class="detalle"><i class="fas fa-laptop"></i> ${evento.plataforma}</div>
                </div>
                <div class="etiquetas-evento">
                    ${evento.etiquetas.map(etiqueta => `<span class="etiqueta">${etiqueta}</span>`).join('')}
                </div>
                <div class="acciones-evento">
                    <button class="boton-inscribirse"><i class="fas fa-user-plus"></i> Inscribirse</button>
                    <button class="boton-compartir"><i class="fas fa-share-alt"></i> Compartir</button>
                    <button class="boton-recordatorio"><i class="fas fa-bell"></i> Recordatorio</button>
                </div>
                <div class="participantes">
                    <div>Asistentes: ${evento.asistentes} personas</div>
                    <div class="participantes-avatars">
                        <div class="avatar">A</div>
                        <div class="avatar">B</div>
                        <div class="avatar">C</div>
                        <div class="avatar">+</div>
                    </div>
                </div>
            </div>
            <div class="brillo-evento"></div>
            <div class="reflejo"></div>
        `;
        
        listaEventos.appendChild(eventoElement);
    });
    
    // Agregar funcionalidad a los botones
    agregarFuncionalidadBotones();
}

// Función para agregar funcionalidad a los botones
function agregarFuncionalidadBotones() {
    // Botón de inscripción
    document.querySelectorAll('.boton-inscribirse').forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.stopPropagation();
            const eventoId = this.closest('.evento').dataset.id;
            const evento = eventosData.find(e => e.id == eventoId);
            
            // Crear formulario de inscripción
            const modal = document.querySelector('.modal');
            modal.innerHTML = `
                <div class="modal-contenido">
                    <span class="cerrar-modal">×</span>
                    <h2 class="modal-titulo">Inscripción: ${evento.titulo}</h2>
                    <div class="modal-cuerpo">
                        <form id="formulario-inscripcion" class="formulario-inscripcion">
                            <div class="form-group">
                                <label for="nombre"><i class="fas fa-user"></i> Nombre completo</label>
                                <input type="text" id="nombre" name="nombre" required>
                            </div>
                            <div class="form-group">
                                <label for="email"><i class="fas fa-envelope"></i> Correo electrónico</label>
                                <input type="email" id="email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="mascota"><i class="fas fa-paw"></i> Nombre de tu mascota virtual</label>
                                <input type="text" id="mascota" name="mascota" required>
                            </div>
                            <div class="form-group">
                                <label for="comentarios"><i class="fas fa-comment"></i> Comentarios adicionales</label>
                                <textarea id="comentarios" name="comentarios" rows="3"></textarea>
                            </div>
                            <button type="submit" class="boton-enviar"><i class="fas fa-paper-plane"></i> Enviar inscripción</button>
                        </form>
                    </div>
                </div>
            `;
            
            modal.style.display = 'block';
            
            // Cerrar modal
            document.querySelector('.cerrar-modal').addEventListener('click', function() {
                modal.style.display = 'none';
            });
            
            // Enviar formulario
            document.getElementById('formulario-inscripcion')?.addEventListener('submit', function(e) {
                e.preventDefault();
                alert('¡Inscripción exitosa! Te hemos enviado un correo con los detalles.');
                modal.style.display = 'none';
            });
        });
    });
    
    // Botón de compartir
    document.querySelectorAll('.boton-compartir').forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.stopPropagation();
            const eventoId = this.closest('.evento').dataset.id;
            const evento = eventosData.find(e => e.id == eventoId);
            
            // Mostrar opciones de compartir
            const modal = document.querySelector('.modal');
            modal.innerHTML = `
                <div class="modal-contenido">
                    <span class="cerrar-modal">×</span>
                    <h2 class="modal-titulo">Compartir evento</h2>
                    <div class="modal-cuerpo">
                        <p>¡Comparte "${evento.titulo}" con tus amigos!</p>
                        <div class="redes-sociales">
                            <button class="boton-red-social facebook"><i class="fab fa-facebook-f"></i> Facebook</button>
                            <button class="boton-red-social twitter"><i class="fab fa-twitter"></i> Twitter</button>
                            <button class="boton-red-social whatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</button>
                            <button class="boton-red-social copiar"><i class="fas fa-copy"></i> Copiar enlace</button>
                        </div>
                    </div>
                </div>
            `;
            
            modal.style.display = 'block';
            
            // Cerrar modal
            document.querySelector('.cerrar-modal').addEventListener('click', function() {
                modal.style.display = 'none';
            });
            
            // Funcionalidad de compartir
            const url = `https://pet-chan.com/eventos/${evento.id}`;
            const texto = `¡Mira este evento en Pet-Chan: ${evento.titulo} - ${evento.descripcion.substring(0, 100)}...`;
            
            document.querySelector('.boton-red-social.facebook').addEventListener('click', function() {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
            });
            
            document.querySelector('.boton-red-social.twitter').addEventListener('click', function() {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`, '_blank');
            });
            
            document.querySelector('.boton-red-social.whatsapp').addEventListener('click', function() {
                window.open(`https://wa.me/?text=${encodeURIComponent(texto + ' ' + url)}`, '_blank');
            });
            
            document.querySelector('.boton-red-social.copiar').addEventListener('click', function() {
                navigator.clipboard.writeText(url);
                alert('¡Enlace copiado al portapapeles!');
            });
        });
    });
    
    // Botón de recordatorio
    document.querySelectorAll('.boton-recordatorio').forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.stopPropagation();
            const eventoId = this.closest('.evento').dataset.id;
            const evento = eventosData.find(e => e.id == eventoId);
            
            // Verificar si el navegador soporta notificaciones
            if (!("Notification" in window)) {
                alert("Este navegador no soporta notificaciones del sistema");
                return;
            }
            
            // Pedir permiso si no lo tenemos
            if (Notification.permission !== "granted") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        configurarRecordatorio(evento);
                    }
                });
            } else {
                configurarRecordatorio(evento);
            }
            
            function configurarRecordatorio(evento) {
                const ahora = new Date();
                const tiempoRestante = evento.fecha - ahora;
                
                if (tiempoRestante <= 0) {
                    alert("Este evento ya ha ocurrido");
                    return;
                }
                
                // Notificación inmediata de confirmación
                new Notification("Recordatorio configurado", {
                    body: `Te notificaremos 1 hora antes del evento "${evento.titulo}"`,
                    icon: "https://i.imgur.com/JQ9aiGu.png"
                });
                
                // Configurar notificación para 1 hora antes del evento
                setTimeout(() => {
                    new Notification(`¡El evento "${evento.titulo}" comenzará pronto!`, {
                        body: `El evento comienza a las ${evento.hora} en ${evento.plataforma}`,
                        icon: "https://i.imgur.com/JQ9aiGu.png"
                    });
                }, tiempoRestante - (60 * 60 * 1000)); // 1 hora antes
                
                alert("Recordatorio configurado. Te notificaremos 1 hora antes del evento.");
            }
        });
    });
    
    // Click en el evento para ver detalles
    document.querySelectorAll('.evento').forEach(evento => {
        evento.addEventListener('click', function(e) {
            // No abrir el modal si se hace clic en los botones
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            
            const eventoId = this.dataset.id;
            const evento = eventosData.find(e => e.id == eventoId);
            
            // Llenar modal con datos del evento
            const modal = document.querySelector('.modal');
            modal.innerHTML = `
                <div class="modal-contenido">
                    <span class="cerrar-modal">×</span>
                    <h2 class="modal-titulo">${evento.titulo}</h2>
                    <div class="modal-cuerpo">
                        <div class="modal-imagen" style="background-image: url('${evento.imagen}'); height: 200px; background-size: cover; background-position: center; border-radius: 8px; margin-bottom: 15px;"></div>
                        <div class="modal-fecha"><i class="far fa-calendar-alt"></i> <strong>Fecha:</strong> ${formatearFecha(evento.fecha)} a las ${evento.hora}</div>
                        <div class="modal-descripcion"><i class="far fa-comment-dots"></i> <strong>Descripción:</strong> ${evento.descripcion}</div>
                        <div class="modal-info-adicional">
                            <p><i class="fas fa-user-tie"></i> <strong>Organizador:</strong> ${evento.organizador}</p>
                            <p><i class="fas fa-laptop"></i> <strong>Plataforma:</strong> ${evento.plataforma}</p>
                            <p><i class="fas fa-stopwatch"></i> <strong>Duración:</strong> ${evento.duracion}</p>
                            <p><i class="fas fa-tags"></i> <strong>Etiquetas:</strong> ${evento.etiquetas.join(', ')}</p>
                            <p><i class="fas fa-users"></i> <strong>Asistentes registrados:</strong> ${evento.asistentes}</p>
                            ${evento.historialFechas.length > 0 ? 
                              `<p><i class="fas fa-history"></i> <strong>Fechas anteriores:</strong> ${evento.historialFechas.map(f => formatearFecha(f)).join(', ')}</p>` : ''}
                        </div>
                        <div class="modal-acciones">
                            <button class="boton-inscribirse"><i class="fas fa-user-plus"></i> Inscribirse</button>
                            <button class="boton-compartir"><i class="fas fa-share-alt"></i> Compartir</button>
                        </div>
                    </div>
                </div>
            `;
            
            modal.style.display = 'block';
            
            // Cerrar modal
            document.querySelector('.cerrar-modal').addEventListener('click', function() {
                modal.style.display = 'none';
            });
            
            // Funcionalidad de los botones en el modal
            document.querySelector('.modal .boton-inscribirse')?.addEventListener('click', function() {
                modal.style.display = 'none';
                const botonInscripcion = document.querySelector(`.evento[data-id="${eventoId}"] .boton-inscribirse`);
                botonInscripcion.click();
            });
            
            document.querySelector('.modal .boton-compartir')?.addEventListener('click', function() {
                modal.style.display = 'none';
                const botonCompartir = document.querySelector(`.evento[data-id="${eventoId}"] .boton-compartir`);
                botonCompartir.click();
            });
        });
    });
}

// Función para filtrar eventos
function filtrarEventos(filtro) {
    const eventos = document.querySelectorAll('.evento');
    
    eventos.forEach(evento => {
        const eventoId = evento.dataset.id;
        const eventoData = eventosData.find(e => e.id == eventoId);
        const etiquetas = eventoData.etiquetas.map(e => e.toLowerCase());
        
        if (filtro === 'todos' || etiquetas.includes(filtro.toLowerCase())) {
            evento.style.display = 'flex';
        } else {
            evento.style.display = 'none';
        }
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Verificar y reprogramar eventos al cargar la página
    verificarYReprogramarEventos();
    
    // Agregar controles al carrusel
    if (!document.querySelector('.controles-carrusel')) {
        agregarControlesCarrusel();
    }
    
    // Generar eventos dinámicamente
    generarEventos();
    
    // Actualizar contadores cada minuto
    setInterval(actualizarContadores, 60000);
    
    // Agregar sección de filtros
    const seccionEventos = document.querySelector('.seccion-eventos');
    if (!document.querySelector('.filtros-eventos') && seccionEventos) {
        const filtros = document.createElement('div');
        filtros.className = 'filtros-eventos';
        filtros.innerHTML = `
            <button class="filtro-btn activo" data-filtro="todos">Todos</button>
            <button class="filtro-btn" data-filtro="competitivo">Competitivos</button>
            <button class="filtro-btn" data-filtro="diseño">Diseño</button>
            <button class="filtro-btn" data-filtro="fiesta">Fiestas</button>
            <button class="filtro-btn" data-filtro="juegos">Juegos</button>
            <button class="filtro-btn" data-filtro="educativo">Educativos</button>
        `;
        seccionEventos.insertBefore(filtros, document.querySelector('.lista-eventos'));
        
        // Agregar funcionalidad a los filtros
        document.querySelectorAll('.filtro-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('activo'));
                this.classList.add('activo');
                filtrarEventos(this.dataset.filtro);
            });
        });
    }
    
    // Crear modal si no existe
    if (!document.querySelector('.modal')) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    // Cerrar modal haciendo clic fuera
    window.addEventListener('click', function(e) {
        if (e.target === document.querySelector('.modal')) {
            document.querySelector('.modal').style.display = 'none';
        }
    });
});