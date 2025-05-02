// Variables globales
let isAdmin = false;
let adminPanelVisible = false;
let eventosData = []; // This will be populated from the database

// Carrusel principal
document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    fetchEventosFromServer();
    checkAdminStatus();
    
    const carrusel = document.querySelector('.carrusel');
    if (!carrusel) return; // Salir si no hay carrusel
    
    const imagenes = document.querySelectorAll('.carrusel-imagen');
    let indiceActual = 0;
    let intervaloCarrusel;
    
    // Función para cambiar imágenes
    function cambiarImagen(direccion = 1) {
        imagenes[indiceActual].classList.remove('activa');
        
        if (direccion === 1) {
            indiceActual = (indiceActual + 1) % imagenes.length;
        } else {
            indiceActual = (indiceActual - 1 + imagenes.length) % imagenes.length;
        }
        
        imagenes[indiceActual].classList.add('activa');
    }
    
    // Iniciar/detener carrusel
    function iniciarCarrusel() {
        if (intervaloCarrusel) clearInterval(intervaloCarrusel);
        intervaloCarrusel = setInterval(() => cambiarImagen(1), 5000);
    }
    
    function detenerCarrusel() {
        if (intervaloCarrusel) clearInterval(intervaloCarrusel);
    }
    
    // Iniciar automáticamente
    iniciarCarrusel();
    
    // Pausar al pasar el mouse
    carrusel.addEventListener('mouseenter', detenerCarrusel);
    carrusel.addEventListener('mouseleave', iniciarCarrusel);
    
    // Agregar botones de navegación
    const controles = document.createElement('div');
    controles.className = 'controles-carrusel';
    controles.innerHTML = `
        <button class="control-carrusel prev"><i class="fas fa-chevron-left"></i></button>
        <button class="control-carrusel next"><i class="fas fa-chevron-right"></i></button>
    `;
    carrusel.appendChild(controles);
    
    document.querySelector('.control-carrusel.prev')?.addEventListener('click', () => {
        detenerCarrusel();
        cambiarImagen(-1);
        iniciarCarrusel();
    });
    
    document.querySelector('.control-carrusel.next')?.addEventListener('click', () => {
        detenerCarrusel();
        cambiarImagen(1);
        iniciarCarrusel();
    });
    
    // Configurar los botones de filtro
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('activo'));
            this.classList.add('activo');
            filtrarEventos(this.dataset.filtro);
        });
    });
    
    // Cerrar modal haciendo clic fuera
    const modal = document.querySelector('.modal');
    if (modal) {
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Manejar botones de inscripción
    setupInscripcionButtons();
    
    // Iniciar verificador automático de eventos
    iniciarVerificadorDeEventos();
});

// Función para validar el formato de duración
function validarFormatoDuracion(duracion) {
    // Formato válido: un número seguido de "hora", "horas", "minuto" o "minutos"
    const regex = /^\d+\s*(hora|horas|minuto|minutos)$/i;
    return regex.test(duracion);
}

// Función mejorada para verificar si un evento ha finalizado
function esEventoPasado(evento) {
    const fechaEvento = new Date(evento.fecha);
    
    // Configurar la hora del evento
    if (evento.hora) {
        const [horas, minutos] = evento.hora.split(':').map(Number);
        fechaEvento.setHours(horas, minutos, 0);
    }
    
    // Calcular la fecha y hora de finalización considerando la duración
    let fechaFinEvento = new Date(fechaEvento);
    
    if (evento.duracion) {
        // Extraer datos de duración con el formato normalizado
        const duracionStr = evento.duracion.toString().toLowerCase().trim();
        
        // Buscar horas o minutos con regex adecuado para el formato restringido
        const horasMatch = duracionStr.match(/^(\d+)\s*(hora|horas)$/);
        const minutosMatch = duracionStr.match(/^(\d+)\s*(minuto|minutos)$/);
        
        if (horasMatch) {
            // Añadir horas a la fecha de finalización
            const horasDuracion = parseInt(horasMatch[1]);
            fechaFinEvento.setHours(fechaFinEvento.getHours() + horasDuracion);
        } else if (minutosMatch) {
            // Añadir minutos a la fecha de finalización
            const minutosDuracion = parseInt(minutosMatch[1]);
            fechaFinEvento.setMinutes(fechaFinEvento.getMinutes() + minutosDuracion);
        } else {
            // Si el formato no coincide exactamente, asumimos 2 horas por defecto
            console.warn('Formato de duración no reconocido:', duracionStr);
            fechaFinEvento.setHours(fechaFinEvento.getHours() + 2);
        }
    } else {
        // Si no hay duración especificada, asumimos 2 horas por defecto
        fechaFinEvento.setHours(fechaFinEvento.getHours() + 2);
    }
    
    // Comparar con la fecha y hora actual
    const ahora = new Date();
    return ahora > fechaFinEvento;
}

// Función para verificar periódicamente si algún evento ha finalizado
function iniciarVerificadorDeEventos() {
    // Verificar cada minuto
    setInterval(() => {
        const eventos = document.querySelectorAll('.evento');
        let cambiosDetectados = false;

        eventos.forEach(eventoElement => {
            const eventoId = eventoElement.dataset.id;
            if (!eventoId) return;

            const evento = eventosData.find(e => e.id == eventoId);
            if (!evento) return;

            const esPasadoAhora = esEventoPasado(evento);
            const tieneMarcaPasado = eventoElement.classList.contains('evento-pasado');

            // Si el estado ha cambiado, marcar que se necesita actualizar
            if (esPasadoAhora && !tieneMarcaPasado) {
                cambiosDetectados = true;
            }
        });

        // Si algún evento cambió de estado, regenerar todos los eventos
        if (cambiosDetectados) {
            console.log('Algunos eventos han finalizado, actualizando interfaz...');
            generarEventos();
            mostrarNotificacion('Algunos eventos han finalizado', 'info');
        }
    }, 60000); // Verificar cada minuto
}

// Función para agregar el botón de mostrar/ocultar eventos pasados
function agregarToggleEventosPasados() {
    const filtrosContainer = document.querySelector('.filtros-eventos');
    if (!filtrosContainer) return;
    
    // Crear botón toggle si no existe ya
    if (!document.querySelector('.filtro-eventos-pasados')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'filtro-btn filtro-eventos-pasados';
        toggleBtn.innerHTML = '<i class="fas fa-history"></i> Mostrar eventos pasados';
        toggleBtn.dataset.showing = 'true'; // Por defecto los mostramos
        
        // Agregar botón al contenedor de filtros
        filtrosContainer.appendChild(toggleBtn);
        
        // Manejar clic
        toggleBtn.addEventListener('click', function() {
            const showingPast = this.dataset.showing === 'true';
            const newState = !showingPast;
            
            // Actualizar estado
            this.dataset.showing = newState.toString();
            this.innerHTML = newState 
                ? '<i class="fas fa-history"></i> Ocultar eventos pasados' 
                : '<i class="fas fa-history"></i> Mostrar eventos pasados';
            
            // Actualizar visualización
            document.querySelectorAll('.evento-pasado').forEach(evento => {
                evento.style.display = newState ? 'flex' : 'none';
            });
        });
    }
    
    // Verificar si hay eventos pasados
    const hayEventosPasados = document.querySelectorAll('.evento-pasado').length > 0;
    const btnEventosPasados = document.querySelector('.filtro-eventos-pasados');
    
    if (btnEventosPasados) {
        // Mostrar u ocultar el botón según si hay eventos pasados
        btnEventosPasados.style.display = hayEventosPasados ? 'inline-block' : 'none';
    }
}

// Function to check if user is admin
function checkAdminStatus() {
    fetch('/api/check-admin')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.isAdmin) {
                isAdmin = true;
                // Show admin controls
                const panelAdmin = document.getElementById('panel-admin');
                const botonFlotante = document.getElementById('boton-flotante');
                
                if (panelAdmin) panelAdmin.style.display = 'block';
                if (botonFlotante) botonFlotante.style.display = 'flex';
                
                // Add event listener for toggle button
                document.getElementById('toggle-admin-panel')?.addEventListener('click', function() {
                    var adminTools = document.getElementById('admin-tools');
                    if (adminTools) {
                        if (adminTools.style.display === 'none') {
                            adminTools.style.display = 'block';
                        } else {
                            adminTools.style.display = 'none';
                        }
                    }
                });
                
                // Add events to admin panel buttons
                document.getElementById('nuevo-evento')?.addEventListener('click', function() {
                    abrirFormularioEvento('crear');
                });
                
                document.getElementById('gestionar-eventos')?.addEventListener('click', function() {
                    mostrarListaEventosAdmin();
                });
                
                // Add event to floating button
                document.getElementById('boton-flotante')?.addEventListener('click', function() {
                    abrirFormularioEvento('crear');
                });
                
                // Re-render eventos to ensure admin buttons are properly displayed
                if (eventosData.length > 0) {
                    generarEventos();
                }
            }
        })
        .catch(error => {
            console.error('Error checking admin status:', error);
        });
}

// Function to fetch events from server
function fetchEventosFromServer() {
    fetch('/api/eventos-data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                eventosData = data.eventos.map(event => {
                    // Convert date strings to Date objects
                    return {
                        ...event,
                        fecha: new Date(event.fecha)
                    };
                });
                // Generate events
                generarEventos();
            } else {
                console.error('Error fetching events:', data.error);
                mostrarNotificacion('Error al cargar eventos', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching events:', error);
            mostrarNotificacion('Error de conexión al cargar eventos', 'error');
        });
}

// Función para configurar botones de inscripción
function setupInscripcionButtons() {
    document.querySelectorAll('.boton-inscribirse').forEach(boton => {
        // Saltar si el botón tiene el atributo disabled
        if (boton.hasAttribute('disabled')) return;
        
        boton.addEventListener('click', function(e) {
            e.stopPropagation();
            const eventoElement = this.closest('.evento');
            const eventoId = eventoElement ? eventoElement.dataset.id : null;
            
            // Buscar el evento
            let evento;
            if (eventoId) {
                evento = eventosData.find(e => e.id == eventoId);
            } else {
                // Si no hay ID, usar el título del evento desde el DOM
                const titulo = eventoElement.querySelector('.titulo-evento').innerText;
                evento = eventosData.find(e => e.titulo === titulo) || {
                    titulo: titulo,
                    plataforma: "Discord"
                };
            }
            
            // Mostrar formulario de inscripción
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
            
            // Enviar formulario (registro a evento)
            document.getElementById('formulario-inscripcion')?.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Here you would send a request to register the user for the event
                // For now, we'll just show a success message
                
                // Increase attendance count
                if (eventoId) {
                    fetch(`/api/eventos/${eventoId}/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nombre: document.getElementById('nombre').value,
                            email: document.getElementById('email').value,
                            mascota: document.getElementById('mascota').value,
                            comentarios: document.getElementById('comentarios').value
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            mostrarNotificacion('¡Inscripción exitosa!', 'success');
                            
                            // Actualizar los datos del evento para reflejar el nuevo asistente
                            fetchEventosFromServer();
                            
                        } else {
                            mostrarNotificacion('Error al registrarse: ' + data.error, 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error registering for event:', error);
                        mostrarNotificacion('Error de conexión al registrarse', 'error');
                    });
                } else {
                    // Fallback for static events without IDs
                    mostrarNotificacion('¡Inscripción exitosa! Te hemos enviado un correo con los detalles.', 'success');
                }
                
                modal.style.display = 'none';
            });
        });
    });
}

// Función para filtrar eventos
function filtrarEventos(filtro) {
    const eventos = document.querySelectorAll('.evento');
    
    eventos.forEach(evento => {
        const etiquetas = Array.from(evento.querySelectorAll('.etiqueta'))
            .map(e => e.innerText.toLowerCase());
        
        if (filtro === 'todos' || etiquetas.some(e => e.includes(filtro.toLowerCase()))) {
            evento.style.display = 'flex';
        } else {
            evento.style.display = 'none';
        }
    });
}

// Función para formatear fechas
function formatearFecha(fecha) {
    if (!(fecha instanceof Date)) {
        fecha = new Date(fecha);
    }
    const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Función para generar eventos dinámicamente (usada para renovar la lista de eventos)
function generarEventos() {
    const listaEventos = document.querySelector('.lista-eventos');
    if (!listaEventos) return;
    
    // Limpiar lista actual
    listaEventos.innerHTML = '';
    
    // Verificar si hay eventos
    if (!eventosData || eventosData.length === 0) {
        listaEventos.innerHTML = `
            <div class="evento">
                <div class="info-evento">
                    <h3 class="titulo-evento">No hay eventos programados</h3>
                    <p class="descripcion-evento">No hay eventos disponibles en este momento. ¡Vuelve pronto!</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Ordenar eventos por fecha
    const eventosOrdenados = [...eventosData].sort((a, b) => {
        // First sort by date
        const dateComparison = new Date(a.fecha) - new Date(b.fecha);
        if (dateComparison !== 0) return dateComparison;
        
        // If same date, sort by time
        return a.hora.localeCompare(b.hora);
    });
    
    // Generar HTML para cada evento
    eventosOrdenados.forEach(evento => {
        // Check if the event date is valid
        if (!evento.fecha) {
            console.error('Invalid date for event:', evento);
            return; // Skip this event
        }
        
        const fechaObj = new Date(evento.fecha);
        const dia = fechaObj.getDate();
        const mes = fechaObj.toLocaleString('es-ES', { month: 'short' });
        const año = fechaObj.getFullYear();
        
        // Verificar si el evento ya ha finalizado
        const isPast = esEventoPasado(evento);
        
        // CAMBIO: Determinar si es popular (10 o más asistentes)
        const asistentes = parseInt(evento.asistentes) || 0;
        const isPopular = asistentes >= 10; // Ahora es popular si tiene 10 o más asistentes
        
        // CSS classes for the event
        let eventClasses = 'evento';
        if (isPopular) eventClasses += ' evento-popular';
        if (isPast) eventClasses += ' evento-pasado';
        
        const eventoElement = document.createElement('div');
        eventoElement.className = eventClasses;
        eventoElement.style.backgroundImage = `url('${evento.imagen || "https://i.pinimg.com/originals/ae/0a/a1/ae0aa14707e1b4bb35fe11b8f00a9956.gif"}')`;
        eventoElement.dataset.id = evento.id;
        
        // Format etiquetas
        const etiquetasHTML = Array.isArray(evento.etiquetas) 
            ? evento.etiquetas.map(etiqueta => `<span class="etiqueta">${etiqueta}</span>`).join('')
            : '';
        
        // Añadir propiedad style para asegurar que el elemento es visible
        eventoElement.style.display = 'flex';
        
        // Generar el HTML para el evento
        eventoElement.innerHTML = `
            ${isPopular ? '<div class="marco-dorado"></div>' : ''}
            <div class="fecha-evento">
                <span class="dia">${dia}</span>
                <span class="mes">${mes}</span>
                <span class="año">${año}</span>
            </div>
            <div class="info-evento">
                <h3 class="titulo-evento">${evento.titulo}</h3>
                <p class="descripcion-evento">${evento.descripcion}</p>
                <div class="detalles-evento">
                    <div class="detalle"><i class="fas fa-clock"></i> ${evento.hora}</div>
                    <div class="detalle"><i class="fas fa-stopwatch"></i> ${evento.duracion || '2 horas'}</div>
                    <div class="detalle"><i class="fas fa-laptop"></i> ${evento.plataforma}</div>
                    <div class="detalle"><i class="fas fa-users"></i> ${asistentes} asistente${asistentes !== 1 ? 's' : ''}</div>
                </div>
                <div class="etiquetas-evento">
                    ${etiquetasHTML}
                </div>
                ${isPast ? 
                    `<button class="boton-inscribirse" disabled><i class="fas fa-calendar-times"></i> Evento finalizado</button>` : 
                    `<button class="boton-inscribirse"><i class="fas fa-user-plus"></i> Inscribirse</button>`
                }
                ${isAdmin ? `
                <div class="admin-buttons">
                    <button class="boton-editar" data-id="${evento.id}"><i class="fas fa-edit"></i> Editar</button>
                    <button class="boton-eliminar" data-id="${evento.id}"><i class="fas fa-trash"></i> Eliminar</button>
                </div>
                ` : ''}
            </div>
            <div class="brillo-evento"></div>
            <div class="reflejo"></div>
            ${isPopular ? '<div class="evento-popular-badge">🔥 Popular</div>' : ''}
        `;
        
        listaEventos.appendChild(eventoElement);
    });
    
    // Reconfigurar botones de inscripción
    setupInscripcionButtons();
    
    // Configurar botones de admin si es necesario
    if (isAdmin) {
        document.querySelectorAll('.boton-editar').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const eventoId = this.dataset.id;
                abrirFormularioEvento('editar', eventoId);
            });
        });
        
        document.querySelectorAll('.boton-eliminar').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const eventoId = this.dataset.id;
                const evento = eventosData.find(e => e.id == eventoId);
                
                if (confirm(`¿Estás seguro de que deseas eliminar el evento "${evento.titulo}"?`)) {
                    // Llamar a la API para eliminar
                    fetch(`/api/eventos/${eventoId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Actualizar datos y UI
                            fetchEventosFromServer();
                            mostrarNotificacion('Evento eliminado correctamente', 'success');
                        } else {
                            mostrarNotificacion('Error: ' + data.error, 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        mostrarNotificacion('Error al comunicarse con el servidor', 'error');
                    });
                }
            });
        });
    }
    
    // Agregar toggle para eventos pasados
    agregarToggleEventosPasados();
}

function abrirFormularioEvento(modo, eventoId = null) {
    let evento = null;
    let titulo = 'Crear nuevo evento';
    
    if (modo === 'editar' && eventoId) {
        evento = eventosData.find(e => e.id == eventoId);
        if (!evento) {
            mostrarNotificacion('Evento no encontrado', 'error');
            return;
        }
        titulo = `Editar evento: ${evento.titulo}`;
    }
    
    // Formatear la fecha para el input date (YYYY-MM-DD)
    let fechaFormateada = '';
    if (evento) {
        const fecha = evento.fecha;
        fechaFormateada = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}`;
    }
    
    const modal = document.querySelector('.modal');
    
    // First, check if user is system admin or community admin
    const fetchPromises = [
        fetch('/api/check-admin').then(res => res.json()),
        fetch('/api/comunidades/administradas').then(res => res.json())
    ];
    
    Promise.all(fetchPromises)
        .then(([sysAdminData, commAdminData]) => {
            const isSysAdmin = sysAdminData.success && sysAdminData.isAdmin;
            const adminCommunities = commAdminData.exito ? commAdminData.comunidades : [];
            
            // Build community selector HTML if user is a community admin
            let comunidadSelectorHTML = '';
            if (adminCommunities.length > 0) {
                comunidadSelectorHTML = `
                    <div class="form-group">
                        <label for="comunidad"><i class="fas fa-users"></i> Comunidad asociada</label>
                        <select id="comunidad" name="comunidad" ${isSysAdmin ? '' : 'required'}>
                            ${isSysAdmin ? '<option value="">Sin asociación (Evento global)</option>' : ''}
                            ${adminCommunities.map(c => `
                                <option value="${c.id}" ${evento && evento.comunidad_id == c.id ? 'selected' : ''}>${c.nombre}</option>
                            `).join('')}
                        </select>
                        <div class="help-text">Elige la comunidad a la que pertenece este evento.</div>
                    </div>
                `;
            }
            
            modal.innerHTML = `
                <div class="modal-contenido modal-grande">
                    <span class="cerrar-modal">×</span>
                    <h2 class="modal-titulo">${titulo}</h2>
                    <div class="modal-cuerpo">
                        <form id="formulario-evento" class="formulario-evento">
                            <input type="hidden" id="evento-id" value="${evento ? evento.id : ''}">
                            <div class="form-group">
                                <label for="titulo"><i class="fas fa-heading"></i> Título del evento *</label>
                                <input type="text" id="titulo" name="titulo" value="${evento ? evento.titulo : ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="descripcion"><i class="fas fa-align-left"></i> Descripción del evento *</label>
                                <textarea id="descripcion" name="descripcion" rows="3" required>${evento ? evento.descripcion : ''}</textarea>
                            </div>
                            
                            ${comunidadSelectorHTML}
                            
                            <div class="form-row">
                                <div class="form-group half">
                                    <label for="fecha"><i class="fas fa-calendar"></i> Fecha *</label>
                                    <input type="date" id="fecha" name="fecha" value="${fechaFormateada}" required>
                                </div>
                                <div class="form-group half">
                                    <label for="hora"><i class="fas fa-clock"></i> Hora *</label>
                                    <input type="time" id="hora" name="hora" value="${evento ? evento.hora : '18:00'}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group half">
                                    <label for="duracion"><i class="fas fa-hourglass"></i> Duración *</label>
                                    <input type="text" id="duracion" name="duracion" value="${evento ? evento.duracion : '2 horas'}" 
                                        placeholder="Ej: 2 horas, 30 minutos" required>
                                    <div class="help-text">Formato válido: número seguido de "hora", "horas", "minuto" o "minutos".</div>
                                    <div class="help-text">Ejemplos: "2 horas", "30 minutos", "1 hora", "45 minutos"</div>
                                    <div id="duracion-error" class="error-text" style="color: #ff6b6b; display: none;">
                                        <i class="fas fa-exclamation-circle"></i> Formato inválido. Use un número seguido de "hora", "horas", "minuto" o "minutos".
                                    </div>
                                </div>
                                <div class="form-group half">
                                    <label for="plataforma"><i class="fas fa-laptop"></i> Plataforma *</label>
                                    <select id="plataforma" name="plataforma" required>
                                        <option value="Discord" ${evento && evento.plataforma === 'Discord' ? 'selected' : ''}>Discord</option>
                                        <option value="Zoom" ${evento && evento.plataforma === 'Zoom' ? 'selected' : ''}>Zoom</option>
                                        <option value="Twitch" ${evento && evento.plataforma === 'Twitch' ? 'selected' : ''}>Twitch</option>
                                        <option value="YouTube Live" ${evento && evento.plataforma === 'YouTube Live' ? 'selected' : ''}>YouTube Live</option>
                                        <option value="Pet-Chan App" ${evento && evento.plataforma === 'Pet-Chan App' ? 'selected' : ''}>Pet-Chan App</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="imagen"><i class="fas fa-image"></i> URL de la imagen</label>
                                <input type="url" id="imagen" name="imagen" value="${evento ? evento.imagen : ''}" placeholder="https://ejemplo.com/imagen.gif">
                                <div class="help-text">Deja en blanco para usar una imagen predeterminada.</div>
                            </div>
                            <div class="form-group">
                                <label for="etiquetas"><i class="fas fa-tags"></i> Etiquetas (separadas por coma)</label>
                                <input type="text" id="etiquetas" name="etiquetas" value="${evento ? (evento.etiquetas && evento.etiquetas.join ? evento.etiquetas.join(', ') : evento.etiquetas) : ''}" placeholder="Ej: Competitivo, Premios, Mascotas">
                            </div>
                            <div class="form-group">
                                <label for="es-especial" class="checkbox-label">
                                    <input type="checkbox" id="es-especial" name="esEspecial" ${evento && evento.es_especial ? 'checked' : ''}>
                                    <span><i class="fas fa-star"></i> Evento especial (anual)</span>
                                </label>
                                <div class="help-text">Los eventos especiales se reprograman automáticamente para el año siguiente.</div>
                            </div>
                            <div class="form-group buttons-group">
                                <button type="submit" class="boton-enviar">${modo === 'editar' ? '<i class="fas fa-save"></i> Guardar cambios' : '<i class="fas fa-plus"></i> Crear evento'}</button>
                                <button type="button" class="boton-cancelar" id="cancelar-evento"><i class="fas fa-times"></i> Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            modal.style.display = 'block';
            
            // Add event listeners and validation
            setupEventFormListeners(evento);
        })
        .catch(error => {
            console.error('Error obtaining admin data:', error);
            mostrarNotificacion('Error al cargar el formulario', 'error');
        });
}
  
   // Separate function for event listeners setup to reduce complexity
function setupEventFormListeners(evento) {
    const modal = document.querySelector('.modal');
    
    // Validación en tiempo real del campo de duración
    const duracionInput = document.getElementById('duracion');
    const duracionError = document.getElementById('duracion-error');
    
    // Validar al escribir en el campo
    duracionInput.addEventListener('input', function() {
        const valor = this.value.trim();
        if (valor && !validarFormatoDuracion(valor)) {
            duracionError.style.display = 'block';
            this.classList.add('campo-error');
        } else {
            duracionError.style.display = 'none';
            this.classList.remove('campo-error');
        }
    });
    
    // Cerrar modal
    document.querySelector('.cerrar-modal').addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Botón cancelar
    document.getElementById('cancelar-evento').addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Enviar formulario
    document.getElementById('formulario-evento')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar formato de duración antes de enviar
        const duracionValor = duracionInput.value.trim();
        if (!validarFormatoDuracion(duracionValor)) {
            duracionError.style.display = 'block';
            duracionInput.classList.add('campo-error');
            duracionInput.focus();
            mostrarNotificacion('El formato de duración no es válido.', 'error');
            return;
        }
        
        // Recopilar datos del formulario
        const eventoId = document.getElementById('evento-id').value;
        const formData = {
            titulo: document.getElementById('titulo').value,
            descripcion: document.getElementById('descripcion').value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            duracion: duracionValor,
            plataforma: document.getElementById('plataforma').value,
            imagen: document.getElementById('imagen').value,
            etiquetas: document.getElementById('etiquetas').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            esEspecial: document.getElementById('es-especial').checked
        };
        
        // Add comunidad_id if present
        const comunidadSelect = document.getElementById('comunidad');
        if (comunidadSelect && comunidadSelect.value) {
            formData.comunidad_id = parseInt(comunidadSelect.value);
        }
        
        // Validar campos obligatorios
        if (!formData.titulo || !formData.descripcion || !formData.fecha || !formData.hora || !formData.plataforma) {
            mostrarNotificacion('Por favor, completa todos los campos obligatorios', 'error');
            return;
        }
        
        // Determinar si es crear o actualizar
        const method = eventoId ? 'PUT' : 'POST';
        const url = eventoId ? `/api/eventos/${eventoId}` : '/api/eventos';
        
        // Llamar a la API
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Refresh events from server
                fetchEventosFromServer();
                
                // Show success message
                mostrarNotificacion(
                    eventoId ? 'Evento actualizado correctamente' : 'Evento creado correctamente', 
                    'success'
                );
                
                // Close modal
                modal.style.display = 'none';
            } else {
                mostrarNotificacion('Error: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarNotificacion('Error al comunicarse con el servidor', 'error');
        });
    });
}

function mostrarListaEventosAdmin() {
    const modal = document.querySelector('.modal');
    
    // Ordenar eventos por fecha
    const eventosOrdenados = [...eventosData].sort((a, b) => a.fecha - b.fecha);
    
    let eventosHTML = '';
    eventosOrdenados.forEach(evento => {
        const fechaFormateada = formatearFecha(evento.fecha);
        const asistentes = parseInt(evento.asistentes) || 0;
        const isPopular = asistentes >= 10;
        
        const estadoEvento = esEventoPasado(evento) ? 
            '<span class="estado estado-finalizado">Finalizado</span>' : 
            '<span class="estado estado-activo">Activo</span>';
        
        eventosHTML += `
            <tr>
                <td>${evento.id}</td>
                <td>
                    <div class="evento-info-admin">
                        <span class="evento-titulo-admin">${evento.titulo}</span>
                        ${isPopular ? '<span class="badge-popular">🔥</span>' : ''}
                    </div>
                </td>
                <td>${fechaFormateada}</td>
                <td>${evento.hora}</td>
                <td>${evento.plataforma}</td>
                <td class="asistentes-column">
                    <span class="asistentes-badge">${asistentes}</span>
                </td>
                <td>${estadoEvento}</td>
                <td class="acciones-column">
                    <button class="btn-admin-editar" data-id="${evento.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-admin-eliminar" data-id="${evento.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    
    modal.innerHTML = `
        <div class="modal-contenido modal-grande">
            <span class="cerrar-modal">×</span>
            <h2 class="modal-titulo">Gestión de Eventos</h2>
            <div class="modal-cuerpo">
                <div class="acciones-admin">
                    <button id="btn-crear-evento" class="boton-primario">
                        <i class="fas fa-plus"></i> Nuevo Evento
                    </button>
                    <div class="admin-stats">
                        <div class="stat-box">
                            <span class="stat-number">${eventosOrdenados.length}</span>
                            <span class="stat-label">Total Eventos</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-number">${eventosOrdenados.filter(e => !esEventoPasado(e)).length}</span>
                            <span class="stat-label">Eventos Activos</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-number">${eventosOrdenados.filter(e => parseInt(e.asistentes) >= 10).length}</span>
                            <span class="stat-label">Eventos Populares</span>
                        </div>
                    </div>
                </div>
                <div class="tabla-container">
                    <table class="tabla-admin">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Plataforma</th>
                                <th>Asistentes</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${eventosHTML}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    
    // Cerrar modal
    document.querySelector('.cerrar-modal').addEventListener('click', function() {
        modal.style.display = 'none';
    });
    

    // Botón para crear nuevo evento
document.getElementById('btn-crear-evento').addEventListener('click', function() {
    modal.style.display = 'none';
    abrirFormularioEvento('crear');
});

// Y en el manejador del formulario de eventos (dentro de la función abrirFormularioEvento):
document.getElementById('formulario-evento')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validar formato de duración antes de enviar
    const duracionValor = duracionInput.value.trim();
    if (!validarFormatoDuracion(duracionValor)) {
        duracionError.style.display = 'block';
        duracionInput.classList.add('campo-error');
        duracionInput.focus();
        mostrarNotificacion('El formato de duración no es válido.', 'error');
        return;
    }
    
    // Recopilar datos del formulario
    const eventoId = document.getElementById('evento-id').value;
    const formData = {
        titulo: document.getElementById('titulo').value,
        descripcion: document.getElementById('descripcion').value,
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        duracion: duracionValor,
        plataforma: document.getElementById('plataforma').value,
        imagen: document.getElementById('imagen').value,
        etiquetas: document.getElementById('etiquetas').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        esEspecial: document.getElementById('es-especial').checked
    };
    
    // Validar campos obligatorios
    if (!formData.titulo || !formData.descripcion || !formData.fecha || !formData.hora || !formData.plataforma) {
        mostrarNotificacion('Por favor, completa todos los campos obligatorios', 'error');
        return;
    }
    
    // Determinar si es crear o actualizar
    const method = eventoId ? 'PUT' : 'POST';
    const url = eventoId ? `/api/eventos/${eventoId}` : '/api/eventos';
    
    // Llamar a la API
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Mostrar mensaje de éxito
            mostrarNotificacion(
                eventoId ? 'Evento actualizado correctamente' : 'Evento creado correctamente', 
                'success'
            );
            
            // Cerrar modal
            modal.style.display = 'none';
            
            // AÑADIR RECARGA DE PÁGINA DESPUÉS DE CREAR UN EVENTO
            if (!eventoId) { // Solo recargamos si es un evento nuevo (crear, no editar)
                // Breve retraso para que el usuario vea la notificación
                setTimeout(() => {
                    window.location.reload();
                }, 1500); // Recargar después de 1.5 segundos
            } else {
                // Si es edición, actualizamos los datos sin recargar
                fetchEventosFromServer();
            }
        } else {
            mostrarNotificacion('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al comunicarse con el servidor', 'error');
    });

            
        
    });
}

// Función para mostrar notificaciones al usuario
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Si no existe el contenedor de notificaciones, crearlo
    let notificacionesContainer = document.querySelector('.notificaciones-container');
    
    if (!notificacionesContainer) {
        notificacionesContainer = document.createElement('div');
        notificacionesContainer.className = 'notificaciones-container';
        document.body.appendChild(notificacionesContainer);
    }
    
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    
    // Icono según el tipo
    let icono = '';
    switch (tipo) {
        case 'success':
            icono = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icono = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icono = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icono = '<i class="fas fa-info-circle"></i>';
    }
    
    notificacion.innerHTML = `
        ${icono}
        <p>${mensaje}</p>
        <button class="cerrar-notificacion"><i class="fas fa-times"></i></button>
    `;
    
    // Agregar al contenedor
    notificacionesContainer.appendChild(notificacion);
    
    // Cerrar botón
    notificacion.querySelector('.cerrar-notificacion').addEventListener('click', () => {
        notificacion.classList.add('desvaneciendo');
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    });
    
    // Eliminar automáticamente después de 5 segundos
    setTimeout(() => {
        notificacion.classList.add('desvaneciendo');
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 5000);
}










// Function to check if user is admin or community admin
function checkAdminStatus() {
    // First check if user is a system administrator
    fetch('/api/check-admin')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.isAdmin) {
                isAdmin = true;
                showAdminControls();
            } else {
                // If not system admin, check if user is a community admin
                checkCommunityAdminStatus();
            }
        })
        .catch(error => {
            console.error('Error checking admin status:', error);
            // If error, still check community admin status as fallback
            checkCommunityAdminStatus();
        });
}

// New function to check if user is admin of any community
function checkCommunityAdminStatus() {
    fetch('/api/comunidades/administradas')
        .then(response => response.json())
        .then(data => {
            if (data.exito && data.comunidades && data.comunidades.length > 0) {
                // User is admin of at least one community
                isAdmin = true;
                showAdminControls();
            }
        })
        .catch(error => {
            console.error('Error checking community admin status:', error);
        });
}

// Function to show admin controls
function showAdminControls() {
    const panelAdmin = document.getElementById('panel-admin');
    const botonFlotante = document.getElementById('boton-flotante');
    
    if (panelAdmin) panelAdmin.style.display = 'block';
    if (botonFlotante) botonFlotante.style.display = 'flex';
    
    // Add event listener for toggle button
    document.getElementById('toggle-admin-panel')?.addEventListener('click', function() {
        var adminTools = document.getElementById('admin-tools');
        if (adminTools) {
            if (adminTools.style.display === 'none') {
                adminTools.style.display = 'block';
            } else {
                adminTools.style.display = 'none';
            }
        }
    });
    
    // Add events to admin panel buttons
    document.getElementById('nuevo-evento')?.addEventListener('click', function() {
        abrirFormularioEvento('crear');
    });
    
    document.getElementById('gestionar-eventos')?.addEventListener('click', function() {
        mostrarListaEventosAdmin();
    });
    
    // Add event to floating button
    document.getElementById('boton-flotante')?.addEventListener('click', function() {
        abrirFormularioEvento('crear');
    });
    
    // Re-render eventos to ensure admin buttons are properly displayed
    if (eventosData.length > 0) {
        generarEventos();
    }
}