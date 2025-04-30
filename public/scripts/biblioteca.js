document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const pestanas = document.querySelectorAll('.pestana');
    const contenidoPestanas = document.querySelectorAll('.contenido-pestana');
    const modalDetalles = document.getElementById('modal-detalles');
    const modalResultadoSobre = document.getElementById('modal-resultado-sobre');
    const cerrarModales = document.querySelectorAll('.cerrar-modal');
    const formNombrarMascota = document.getElementById('form-nombrar-mascota');
    const btnSobreBasico = document.getElementById('comprar-sobre-basico');
    const btnSobrePremium = document.getElementById('comprar-sobre-premium');
    const buscadorMascota = document.getElementById('buscar-mascota');
    const filtroEspecie = document.getElementById('filtro-especie');
    const filtroRareza = document.getElementById('filtro-rareza');

    // Funcionalidad de pestañas
    pestanas.forEach(pestana => {
        pestana.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Desactivar todas las pestañas
            pestanas.forEach(p => p.classList.remove('activa'));
            
            // Activar la pestaña actual
            this.classList.add('activa');
            
            // Ocultar todos los contenidos
            contenidoPestanas.forEach(contenido => contenido.classList.remove('activo'));
            
            // Mostrar el contenido seleccionado
            document.getElementById('tab-' + tabId).classList.add('activo');
        });
    });

    // Funcionalidad para cerrar modales
    cerrarModales.forEach(cerrar => {
        cerrar.addEventListener('click', function() {
            modalDetalles.classList.remove('mostrar');
            modalResultadoSobre.classList.remove('mostrar');
        });
    });

    // Cerrar modales al hacer clic fuera del contenido
    window.addEventListener('click', function(e) {
        if (e.target === modalDetalles) {
            modalDetalles.classList.remove('mostrar');
        }
        if (e.target === modalResultadoSobre) {
            modalResultadoSobre.classList.remove('mostrar');
        }
    });

    // Activar mascota al hacer clic en el botón
    document.querySelectorAll('.btn-activar').forEach(btn => {
        btn.addEventListener('click', function() {
            const mascotaId = this.getAttribute('data-id');
            activarMascota(mascotaId);
        });
    });

    // Ver detalles de mascota
    document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
        btn.addEventListener('click', function() {
            const mascotaId = this.getAttribute('data-id');
            mostrarDetallesMascota(mascotaId);
        });
    });

    // Comprar sobre básico
    if (btnSobreBasico) {
        btnSobreBasico.addEventListener('click', function() {
            const precio = parseInt(this.getAttribute('data-precio'));
            comprarSobre('basico', precio, this);
        });
    }

    // Comprar sobre premium
    if (btnSobrePremium) {
        btnSobrePremium.addEventListener('click', function() {
            const precio = parseInt(this.getAttribute('data-precio'));
            comprarSobre('premium', precio, this);
        });
    }

    // Manejar envío del formulario para nombrar mascota
    if (formNombrarMascota) {
        formNombrarMascota.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarNuevaMascota();
        });
    }

    // Filtrar mascotas
    if (buscadorMascota) {
        buscadorMascota.addEventListener('input', filtrarMascotas);
    }

    if (filtroEspecie) {
        filtroEspecie.addEventListener('change', filtrarMascotas);
    }

    if (filtroRareza) {
        filtroRareza.addEventListener('change', filtrarMascotas);
    }

    // Función para activar una mascota
    function activarMascota(mascotaId) {
        fetch('/biblioteca/activar-mascota', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mascotaId: mascotaId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarNotificacion('¡Mascota activada correctamente!', 'exito');
                // Recargar la página después de 1.5 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                mostrarNotificacion('Error: ' + data.mensaje, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarNotificacion('Error al activar la mascota', 'error');
        });
    }

    // Función para mostrar detalles de mascota
    function mostrarDetallesMascota(mascotaId) {
        fetch(`/biblioteca/detalle-mascota/${mascotaId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const detallesContainer = document.querySelector('.detalles-mascota');
                    const rareza = data.mascota.rareza || 'comun';
                    
                    // Montar el HTML de los detalles
                    let html = `
                        <div class="detalles-imagen">
                            <img src="imagenes_de_mascotas/${data.mascota.indice}.gif" alt="${data.mascota.petname}" class="pixeleado">
                            <div class="rareza-banner ${rareza}">${rareza}</div>
                        </div>
                        <div class="detalles-info">
                            <h2>${data.mascota.petname}</h2>
                            <p>Especie: ${data.especie}</p>
                            <p>Género: ${data.mascota.genero}</p>
                            <p>Nivel: ${data.mascota.nivel || 1}</p>
                            
                            <div class="mascota-stats">
                                <div class="mascota-stat">
                                    <span class="stat-label">Amor</span>
                                    <div class="stat-barra">
                                        <div class="stat-valor" style="width: ${data.mascota.nivelAmor}%;"></div>
                                    </div>
                                    <span class="stat-numero">${data.mascota.nivelAmor}%</span>
                                </div>
                                
                                <div class="mascota-stat">
                                    <span class="stat-label">Felicidad</span>
                                    <div class="stat-barra">
                                        <div class="stat-valor felicidad" style="width: ${data.mascota.nivelFelicidad}%;"></div>
                                    </div>
                                    <span class="stat-numero">${data.mascota.nivelFelicidad}%</span>
                                </div>
                                
                                <div class="mascota-stat">
                                    <span class="stat-label">Energía</span>
                                    <div class="stat-barra">
                                        <div class="stat-valor energia" style="width: ${data.mascota.nivelEnergia}%;"></div>
                                    </div>
                                    <span class="stat-numero">${data.mascota.nivelEnergia}%</span>
                                </div>
                            </div>
                            
                            <div class="mascota-detalles">
                                <p><span class="detalle-label">✧ Habilidad Especial:</span> ${data.mascota.habilidad}</p>
                                <p><span class="detalle-label">✧ Comida Favorita:</span> ${data.mascota.comidaFavorita}</p>
                                <p><span class="detalle-label">✧ Fecha de obtención:</span> ${data.mascota.fechaObtencion || 'Desconocida'}</p>
                            </div>
                        </div>
                    `;
                    
                    // Actualizar el contenido y mostrar el modal
                    detallesContainer.innerHTML = html;
                    modalDetalles.classList.add('mostrar');
                } else {
                    mostrarNotificacion('Error al cargar los detalles de la mascota', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                mostrarNotificacion('Error al cargar los detalles', 'error');
            });
    }

    // Función para crear un elemento de luz para el sobre
    function crearLuzSobre(sobre) {
        const luz = document.createElement('div');
        luz.className = 'luz-sobre';
        sobre.appendChild(luz);
        return luz;
    }

    // Función para crear confeti al obtener una mascota
    function crearConfeti() {
        const confeti = document.createElement('div');
        confeti.className = 'confeti';
        document.body.appendChild(confeti);
        
        const colores = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff9900', '#9900ff'];
        
        // Crear 100 piezas de confeti
        for (let i = 0; i < 100; i++) {
            const pieza = document.createElement('div');
            pieza.className = 'confeti-pieza';
            
            // Establecer color aleatorio
            const color = colores[Math.floor(Math.random() * colores.length)];
            pieza.style.setProperty('--color', color);
            
            // Establecer posición inicial aleatoria (a lo ancho de la pantalla)
            pieza.style.left = Math.random() * 100 + 'vw';
            
            // Establecer tiempo de caída aleatorio
            pieza.style.setProperty('--tiempo', (Math.random() * 3 + 2) + 's');
            
            // Establecer tamaño aleatorio
            const size = Math.random() * 10 + 5;
            pieza.style.width = size + 'px';
            pieza.style.height = size + 'px';
            
            confeti.appendChild(pieza);
        }
        
        // Eliminar el confeti después de 5 segundos
        setTimeout(() => {
            confeti.remove();
        }, 5000);
    }

    // Función para comprar un sobre
    function comprarSobre(tipo, precio, boton) {
        // Verificar si el user puede pagar el sobre
        const dineroActual = parseInt(document.querySelector('.monedas-cantidad').textContent.replace(/[^\d]/g, ''));
        
        if (dineroActual < precio) {
            mostrarNotificacion('No tienes suficientes monedas para comprar este sobre', 'error');
            return;
        }
        
        // Deshabilitar el botón durante el proceso
        boton.disabled = true;
        boton.textContent = 'Abriendo...';
        
        // Efecto visual del sobre abriéndose
        const sobre = boton.closest('.sobre');
        
        // Crear elemento de luz si no existe
        let luz = sobre.querySelector('.luz-sobre');
        if (!luz) {
            luz = crearLuzSobre(sobre);
        }
        
        // Agregar clase de animación
        sobre.classList.add('abriendo');
        
        fetch('/biblioteca/comprar-sobre', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tipo: tipo, precio: precio })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Actualizar el contador de monedas
                document.querySelector('.monedas-cantidad').textContent = new Intl.NumberFormat().format(data.moneyRestante);
                
                // Llenar el modal de resultado
                document.getElementById('nueva-mascota-img').src = `imagenes_de_mascotas/${data.mascota.indice}.gif`;
                document.getElementById('especie-resultado').textContent = data.mascota.especie;
                document.getElementById('indice-nueva-mascota').value = data.mascota.indice;
                document.getElementById('genero-nueva-mascota').value = data.mascota.genero;
                document.getElementById('rareza-nueva-mascota').value = data.mascota.rareza;
                
                // Configurar la clase de rareza en el banner
                const rarezaBanner = document.getElementById('rareza-banner');
                rarezaBanner.textContent = data.mascota.rareza.charAt(0).toUpperCase() + data.mascota.rareza.slice(1);
                rarezaBanner.className = 'rareza-banner ' + data.mascota.rareza;
                
                // Crear efecto de confeti si es una rareza épica o legendaria
                if (data.mascota.rareza === 'epico' || data.mascota.rareza === 'legendario') {
                    setTimeout(() => {
                        crearConfeti();
                    }, 1500);
                }
                
                // Mostrar el modal de resultado después de completar la animación
                setTimeout(() => {
                    sobre.classList.remove('abriendo');
                    modalResultadoSobre.classList.add('mostrar');
                    // Resetear el botón
                    boton.disabled = false;
                    boton.textContent = `Comprar por ${precio} 💰`;
                }, 1800);
            } else {
                sobre.classList.remove('abriendo');
                mostrarNotificacion('Error: ' + data.mensaje, 'error');
                // Resetear el botón
                boton.disabled = false;
                boton.textContent = `Comprar por ${precio} 💰`;
            }
        })
        .catch(error => {
            sobre.classList.remove('abriendo');
            console.error('Error:', error);
            mostrarNotificacion('Error al procesar la compra', 'error');
            // Resetear el botón
            boton.disabled = false;
            boton.textContent = `Comprar por ${precio} 💰`;
        });
    }

    // Función para guardar la nueva mascota
    function guardarNuevaMascota() {
        const btnGuardar = document.querySelector('.btn-guardar-mascota');
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';
        
        const nombre = document.getElementById('nombre-nueva-mascota').value;
        const indice = document.getElementById('indice-nueva-mascota').value;
        const genero = document.getElementById('genero-nueva-mascota').value;
        const rareza = document.getElementById('rareza-nueva-mascota').value;
        
        fetch('/biblioteca/guardar-mascota', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombre,
                indice: indice,
                genero: genero,
                rareza: rareza
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarNotificacion('¡Mascota guardada correctamente!', 'exito');
                // Recargar la página después de 1.5 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                mostrarNotificacion('Error: ' + data.mensaje, 'error');
                btnGuardar.disabled = false;
                btnGuardar.textContent = 'Guardar mascota';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarNotificacion('Error al guardar la mascota', 'error');
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar mascota';
        });
    }

    // Función para filtrar mascotas
    function filtrarMascotas() {
        const textoBusqueda = buscadorMascota.value.toLowerCase();
        const especieSeleccionada = filtroEspecie.value;
        const rarezaSeleccionada = filtroRareza.value;
        
        const mascotaCards = document.querySelectorAll('.mascota-card');
        let mascotasVisibles = 0;
        
        mascotaCards.forEach(card => {
            const nombre = card.querySelector('.card-nombre').textContent.toLowerCase();
            const indice = card.getAttribute('data-indice');
            const rareza = card.getAttribute('data-rareza');
            
            // Filtros
            const coincideNombre = nombre.includes(textoBusqueda);
            const coincideEspecie = !especieSeleccionada || indice === especieSeleccionada;
            const coincideRareza = !rarezaSeleccionada || rareza === rarezaSeleccionada;
            
            // Mostrar u ocultar según coincidencias
            if (coincideNombre && coincideEspecie && coincideRareza) {
                card.style.display = '';
                mascotasVisibles++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Mostrar mensaje si no hay resultados
        const sinResultados = document.querySelector('.sin-resultados');
        if (mascotasVisibles === 0 && !sinResultados) {
            const grid = document.querySelector('.mascota-grid');
            const mensaje = document.createElement('div');
            mensaje.className = 'sin-mascotas sin-resultados';
            mensaje.innerHTML = '<p>No se encontraron mascotas con esos filtros.</p><p>Intenta con otros criterios de búsqueda.</p>';
            grid.appendChild(mensaje);
        } else if (mascotasVisibles > 0 && sinResultados) {
            sinResultados.remove();
        }
    }

    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo) {
        // Eliminar notificaciones existentes
        const notificacionesExistentes = document.querySelectorAll('.notificacion-biblioteca');
        notificacionesExistentes.forEach(notif => {
            notif.remove();
        });
        
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion-biblioteca ${tipo}`;
        notificacion.textContent = mensaje;
        
        // Añadir al DOM
        document.body.appendChild(notificacion);
        
        // Mostrar con fade in
        setTimeout(() => {
            notificacion.classList.add('mostrar');
        }, 10);
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notificacion.classList.remove('mostrar');
            setTimeout(() => {
                notificacion.remove();
            }, 500);
        }, 3000);
    }
    
    // Función para ajustar el tamaño de las imágenes de mascotas (solución para escalado)
    function ajustarTamanoImagenes() {
        // Ajustar imágenes en las tarjetas
        document.querySelectorAll('.card-imagen').forEach(img => {
            if (img.naturalWidth > img.naturalHeight) {
                img.style.width = '85%';
                img.style.height = 'auto';
            } else {
                img.style.height = '85%';
                img.style.width = 'auto';
            }
        });
        
        // Ajustar imágenes en la mascota activa
        const mascotaActiva = document.querySelector('.mascota-activa-img');
        if (mascotaActiva) {
            mascotaActiva.onload = function() {
                if (this.naturalWidth > this.naturalHeight) {
                    this.style.width = '65%';
                    this.style.height = 'auto';
                } else {
                    this.style.height = '65%';
                    this.style.width = 'auto';
                }
            };
            // Forzar recarga de imagen para aplicar estilos
            const src = mascotaActiva.src;
            mascotaActiva.src = '';
            setTimeout(() => {
                mascotaActiva.src = src;
            }, 10);
        }
    }
    
    // Llamar a la función de ajuste de imágenes cuando la página está cargada
    ajustarTamanoImagenes();
    
    // También ajustar cuando se cambia de pestaña
    pestanas.forEach(pestana => {
        pestana.addEventListener('click', function() {
            setTimeout(ajustarTamanoImagenes, 100);
        });
    });
    
    // Modificar los sobres para asegurar que los botones sean visibles
    function mejorarSobres() {
        document.querySelectorAll('.sobre-container').forEach(container => {
            const sobre = container.querySelector('.sobre');
            const frontal = container.querySelector('.sobre-frontal');
            const boton = container.querySelector('.btn-comprar-sobre');
            
            if (frontal && boton) {
                // Asegurar que el botón esté colocado en la parte inferior del sobre
                boton.style.position = 'relative';
                boton.style.zIndex = '10';
                boton.style.marginTop = 'auto';
                frontal.style.paddingBottom = '30px';
                
                // Agregar elemento para el efecto de luz
                if (!sobre.querySelector('.luz-sobre')) {
                    const luz = document.createElement('div');
                    luz.className = 'luz-sobre';
                    sobre.appendChild(luz);
                }
            }
        });
    }
    
    // Mejorar los sobres al cargar la página
    mejorarSobres();
});

function mejorarModalResultado() {
    const modalResultado = document.getElementById('modal-resultado-sobre');
    const modalContenido = modalResultado.querySelector('.modal-contenido');
    
    // Asegurar que el modal tenga la clase correcta
    modalResultado.classList.add('modal');
    
    // Agregar event listener para mostrar el modal correctamente
    document.querySelectorAll('.btn-comprar-sobre').forEach(btn => {
        btn.addEventListener('click', function() {
            // Resetear la posición de scroll del modal cuando se abre
            setTimeout(() => {
                if (modalContenido) {
                    modalContenido.scrollTop = 0;
                }
            }, 100);
        });
    });
    
    // Ajustar la altura máxima del contenido del modal
    if (modalContenido) {
        modalContenido.style.maxHeight = '80vh';
        modalContenido.style.overflowY = 'auto';
    }
    
    // Asegurarse de que el formulario se muestre completo
    const formulario = document.getElementById('form-nombrar-mascota');
    if (formulario) {
        formulario.style.display = 'block';
        formulario.style.width = '100%';
    }
}

// Función para centrar el modal en la pantalla
function centrarModal(modal) {
    if (!modal) return;
    
    const ajustarPosicion = () => {
        const windowHeight = window.innerHeight;
        const modalHeight = modal.querySelector('.modal-contenido')?.offsetHeight || 0;
        
        if (modalHeight > windowHeight * 0.8) {
            // Si el modal es muy alto, permitir scroll
            modal.style.alignItems = 'flex-start';
            modal.querySelector('.modal-contenido').style.margin = '5vh auto';
        } else {
            // Centrar verticalmente si cabe
            modal.style.alignItems = 'center';
            modal.querySelector('.modal-contenido').style.margin = '0 auto';
        }
    };
    
    // Ejecutar cuando se muestra el modal
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (modal.classList.contains('mostrar')) {
                    ajustarPosicion();
                }
            }
        });
    });
    
    observer.observe(modal, { attributes: true });
    
    // También ajustar en resize
    window.addEventListener('resize', () => {
        if (modal.classList.contains('mostrar')) {
            ajustarPosicion();
        }
    });
}

// Llamar a estas funciones después de que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // El código existente va aquí...
    
    // Agregar nuestras nuevas funciones al final
    mejorarModalResultado();
    centrarModal(document.getElementById('modal-resultado-sobre'));
});