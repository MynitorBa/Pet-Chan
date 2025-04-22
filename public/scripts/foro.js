document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const form = document.getElementById('mensaje-form');
  const formTitle = document.getElementById('form-title');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const autorInput = document.getElementById('autor');
  const mensajeInput = document.getElementById('mensaje');
  const mensajeIdInput = document.getElementById('mensaje-id');
  const imagenesInput = document.getElementById('imagenes-input');
  const imagenesContainer = document.getElementById('imagenes-preview-container');
  const contador = document.getElementById('contador');
  const modal = document.getElementById('modal-confirmacion');
  const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
  const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
  const filtroForm = document.getElementById('filtro-form');
  const clearFieldsBtn = document.getElementById('clear-fields-btn');
  const etiquetaSelect = document.getElementById('etiqueta');
  
  // Variables de estado
  let mensajeIdAEliminar = null;
  let isSubmitting = false;
  let imagenesActuales = [];
  let imagenesEliminadas = [];
  const MAX_IMAGENES = 9;

  // Get current logged in username from session
  const currentUsername = document.querySelector('meta[name="username"]')?.content || 'usuario';

  // Inicialización del modal de imagen si no existe
  let modalImagen = document.getElementById('modal-imagen');
  let modalImagenContenido = document.getElementById('modal-imagen-contenido');
  let cerrarModalImagen = document.getElementById('cerrar-modal-imagen');

  if (!modalImagen) {
    const modalHTML = `
      <div id="modal-imagen" class="modal-imagen">
        <div id="modal-imagen-contenido" class="modal-imagen-contenido">
          <button id="cerrar-modal-imagen" class="cerrar-modal-imagen"><i class="fas fa-times"></i></button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    modalImagen = document.getElementById('modal-imagen');
    modalImagenContenido = document.getElementById('modal-imagen-contenido');
    cerrarModalImagen = document.getElementById('cerrar-modal-imagen');
    
    cerrarModalImagen.addEventListener('click', function() {
      modalImagen.classList.remove('activo');
    });
  }

  // Configuración inicial - use logged in username instead of hardcoded "meme"
  autorInput.value = currentUsername;
  
  // Make autor field read-only to prevent users from changing their identity
  autorInput.readOnly = true;

  // Función para resetear el formulario
  function resetForm() {
    form.action = '/publicar';
    form.method = 'POST';
    formTitle.textContent = 'Nuevo Mensaje';
    submitBtn.textContent = 'Publicar';
    cancelBtn.style.display = 'none';
    autorInput.value = currentUsername; // Reset to current username, not "meme"
    mensajeInput.value = '';
    mensajeIdInput.value = '';
    imagenesContainer.innerHTML = '';
    imagenesInput.value = '';
    imagenesActuales = [];
    imagenesEliminadas = [];
    
    if (etiquetaSelect) {
      etiquetaSelect.value = '';
    }
    
    document.querySelectorAll('input[name="imagenes_eliminar"]').forEach(el => el.remove());
    isSubmitting = false;
  }

  // Función para expandir una imagen
  function expandirImagen(src) {
    const imgElement = document.createElement('img');
    imgElement.src = src;
    modalImagenContenido.innerHTML = '';
    modalImagenContenido.appendChild(imgElement);
    modalImagen.classList.add('activo');
  }

  // Event listener para cerrar el modal al hacer clic fuera
  modalImagen.addEventListener('click', function(e) {
    if (e.target === modalImagen) {
      modalImagen.classList.remove('activo');
    }
  });

  // Función para actualizar la vista previa de imágenes
  function actualizarVistaPrevia() {
    imagenesContainer.innerHTML = '';
    
    if (imagenesActuales.length > 0) {
      const gridContainer = document.createElement('div');
      gridContainer.className = 'imagenes-grid-container';
      
      imagenesActuales.forEach((imagen, index) => {
        const celda = document.createElement('div');
        celda.className = 'imagen-preview-celda';
        
        const img = document.createElement('img');
        img.src = typeof imagen === 'object' ? imagen.url : imagen;
        img.alt = `Imagen ${index + 1}`;
        
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn-eliminar-imagen';
        btnEliminar.innerHTML = '<i class="fas fa-times"></i>';
        btnEliminar.setAttribute('data-index', index);
        btnEliminar.onclick = function(e) {
          e.stopPropagation();
          eliminarImagen(index);
        };
        
        celda.appendChild(img);
        celda.appendChild(btnEliminar);
        gridContainer.appendChild(celda);
        
        // Evento para expandir la imagen
        celda.addEventListener('click', function() {
          expandirImagen(typeof imagen === 'object' ? imagen.url : imagen);
        });
      });
      
      imagenesContainer.appendChild(gridContainer);
      
      const contadorImagenes = document.createElement('div');
      contadorImagenes.className = 'contador-imagenes';
      contadorImagenes.textContent = `${imagenesActuales.length}/${MAX_IMAGENES} imágenes`;
      imagenesContainer.appendChild(contadorImagenes);
    }
  }

  // Función para eliminar una imagen
  function eliminarImagen(index) {
    const imagen = imagenesActuales[index];
    
    if (mensajeIdInput.value && typeof imagen === 'object' && imagen.id) {
      imagenesEliminadas.push(imagen.id);
    }
    
    imagenesActuales.splice(index, 1);
    actualizarVistaPrevia();
    
    if (!mensajeIdInput.value || (typeof imagen === 'object' && !imagen.id)) {
      if (typeof DataTransfer !== 'undefined') {
        const dataTransfer = new DataTransfer();
        const files = Array.from(imagenesInput.files || []);
        const imagenesNuevas = imagenesActuales.filter(img => typeof img === 'object' && img.file);
        
        imagenesNuevas.forEach(img => {
          if (img.file) {
            dataTransfer.items.add(img.file);
          }
        });
        
        imagenesInput.value = '';
        imagenesInput.files = dataTransfer.files;
      }
    }
  }

  // Drag and drop para imágenes
  const dropZone = document.getElementById('drop-zone');
  if (dropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
      dropZone.classList.add('active');
    }
    
    function unhighlight() {
      dropZone.classList.remove('active');
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      
      if (files.length > 0) {
        if (imagenesActuales.length + files.length > MAX_IMAGENES) {
          // Cambio de 'error' a 'warning' para coincidir con la imagen de muestra
          showOverlayNotification(`No se pueden subir más de ${MAX_IMAGENES} imágenes por comentario. Por favor, selecciona un máximo de ${MAX_IMAGENES} archivos.`, 'warning');
          return;
        }
          Array.from(files).forEach(file => {
          if (file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = function(e) {
              imagenesActuales.push({
                url: e.target.result,
                file: file,
                name: file.name
              });
              actualizarVistaPrevia();
            };
            reader.readAsDataURL(file);
            
            if (typeof DataTransfer !== 'undefined') {
              const dataTransfer = new DataTransfer();
              
              if (imagenesInput.files) {
                Array.from(imagenesInput.files).forEach(f => {
                  dataTransfer.items.add(f);
                });
              }
              
              dataTransfer.items.add(file);
              imagenesInput.files = dataTransfer.files;
            }
          }
        });
      }
    }
  }

// También modifica el event listener de imagenesInput
imagenesInput.addEventListener('change', function(e) {
  if (!this.files || this.files.length === 0) return;
  
  const nuevasImagenes = Array.from(this.files);
  
  if (imagenesActuales.length + nuevasImagenes.length > MAX_IMAGENES) {
    // Cambio de 'error' a 'warning' y texto actualizado para coincidir con la imagen
    showOverlayNotification(`No se pueden subir más de ${MAX_IMAGENES} imágenes por comentario. Por favor, selecciona un máximo de ${MAX_IMAGENES} archivos.`, 'warning');
    this.value = '';
    return;
  }
  
  nuevasImagenes.forEach(file => {
    if (!file.type.match('image.*')) {
      showOverlayNotification('Por favor, selecciona solo imágenes válidas', 'warning');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      imagenesActuales.push({
        url: e.target.result,
        file: file,
        name: file.name
      });
      actualizarVistaPrevia();
    };
    reader.readAsDataURL(file);
  });
});

// La función showOverlayNotification permanece igual
function showOverlayNotification(message, type = 'warning') {
  // Crear el contenedor principal
  const notificationOverlay = document.createElement('div');
  notificationOverlay.classList.add('notification-overlay');
  
  // Crear el contenedor de la notificación
  const notificationContainer = document.createElement('div');
  notificationContainer.classList.add('notification-container', `notification-${type}`);
  
  // Crear el contenido de la notificación
  const notificationContent = document.createElement('div');
  notificationContent.classList.add('notification-content');
  
  // Icono según el tipo
  let icon = 'exclamation-triangle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'times-circle';
  if (type === 'info') icon = 'info-circle';
  
  // Agregar icono y mensaje
  notificationContent.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="notification-message">${message}</div>
  `;
  
  // Botón para cerrar
  const closeButton = document.createElement('button');
  closeButton.classList.add('notification-close');
  closeButton.innerHTML = 'Entendido';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(notificationOverlay);
  });
  
  // Ensamblar todos los elementos
  notificationContainer.appendChild(notificationContent);
  notificationContainer.appendChild(closeButton);
  notificationOverlay.appendChild(notificationContainer);
  
  // Agregar al body
  document.body.appendChild(notificationOverlay);
  
  // Añadir evento para cerrar al hacer clic fuera (opcional)
  notificationOverlay.addEventListener('click', (e) => {
    if (e.target === notificationOverlay) {
      document.body.removeChild(notificationOverlay);
    }
  });
}

  // Configuración de eventos para imágenes en mensajes existentes
  function setupImageClickEvents() {
    document.querySelectorAll('.mensaje').forEach(mensaje => {
      const imagenes = mensaje.querySelectorAll('.imagen-mensaje-celda img, .imagen-mensaje img');
      
      imagenes.forEach(img => {
        img.addEventListener('click', function(e) {
          e.stopPropagation();
          expandirImagen(this.src);
        });
      });
    });
  }

  // Inicializar eventos de imágenes al cargar la página
  setupImageClickEvents();

  // Event listener para el botón cancelar
  cancelBtn.addEventListener('click', resetForm);

  // Función para actualizar contador de mensajes
  function actualizarContadorMensajes() {
    const cantidadMensajes = document.querySelectorAll('.mensaje').length;
    if (contador) {
      contador.textContent = cantidadMensajes;
    }
  }

  function limpiarCampos() {
    window.location.href = '/';
  }
  
  if (clearFieldsBtn) {
    clearFieldsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      limpiarCampos();
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    const mensajesConImagenes = document.querySelectorAll('.mensaje-imagenes');
    
    mensajesConImagenes.forEach(mensajeImagenes => {
      const imagenesOriginales = mensajeImagenes.querySelectorAll('img');
      
      if (imagenesOriginales.length > 0) {
        // Clear existing content
        mensajeImagenes.innerHTML = '';
        
        // Add images in a horizontal layout
        imagenesOriginales.forEach(img => {
          const cellWrapper = document.createElement('div');
          cellWrapper.className = 'imagen-mensaje';
          
          const imgClone = img.cloneNode(true);
          cellWrapper.appendChild(imgClone);
          
          // Add click event to expand image
          cellWrapper.addEventListener('click', function() {
            expandirImagen(imgClone.src);
          });
          
          mensajeImagenes.appendChild(cellWrapper);
        });
      }
    });
  });
  














// Edit ar mensaje
document.addEventListener('click', function(event) {
  if (event.target.closest('.btn-editar')) {
    const button = event.target.closest('.btn-editar');
    const mensajeId = button.dataset.id;
    const overlay = document.querySelector('.new-message-overlay');
    
    fetch(`/mensaje/${mensajeId}`)
      .then(response => {
        if (!response.ok) throw new Error('Error: ' + response.status);
        return response.json();
      })
      .then(data => {
        resetForm();
        formTitle.textContent = 'Editar Mensaje';
        submitBtn.textContent = 'Actualizar';
        cancelBtn.style.display = 'block';
        autorInput.value = data.autor;
        mensajeInput.value = data.mensaje;
        mensajeIdInput.value = data.id;
        
        // Configurar contador de caracteres - NUEVO CÓDIGO
        // Agregar el contenedor del contador si no existe
// Modified version of the character counter code
let contadorContainer = document.querySelector('.contador-caracteres-mensaje');
if (!contadorContainer) {
  contadorContainer = document.createElement('div');
  contadorContainer.classList.add('contador-caracteres-mensaje');
  
  // Better positioning to avoid overlap
  contadorContainer.style.position = 'absolute';
  contadorContainer.style.bottom = '10px';
  contadorContainer.style.right = '10px';
  contadorContainer.style.fontSize = '12px';
  contadorContainer.style.color = '#666';
  contadorContainer.style.padding = '2px 5px';
  contadorContainer.style.borderRadius = '3px';
  contadorContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent background
  contadorContainer.style.zIndex = '5'; // Ensure it appears above other elements
  
  contadorContainer.innerHTML = `
    <span id="contador-actual-mensaje">${mensajeInput.value.length}</span>/<span id="contador-maximo-mensaje">391</span>
  `;
  
  // Ensure the textarea container has relative positioning
  const textareaContainer = mensajeInput.parentElement;
  textareaContainer.style.position = 'relative';
  
  // Add more bottom padding to the textarea to make room for the counter
  mensajeInput.style.paddingBottom = '30px';
  
  textareaContainer.appendChild(contadorContainer);
}

// Initialize counter with current value
const contadorActual = document.getElementById('contador-actual-mensaje');
contadorActual.textContent = mensajeInput.value.length;

// Update counter styling for better visibility
const updateContadorStyle = (length) => {
  contadorActual.textContent = length;
  
  // Cambiar color del contador según se acerque al límite
  if (length >= 351) { // A partir del 90% del límite (391*0.9)
    contadorContainer.style.color = '#d9534f'; // Rojo
    contadorContainer.style.fontWeight = 'bold';
  } else if (length >= 293) { // A partir del 75% del límite (391*0.75)
    contadorContainer.style.color = '#f0ad4e'; // Naranja/amarillo
  } else {
    contadorContainer.style.color = '#666'; // Color normal
    contadorContainer.style.fontWeight = 'normal';
  }
};

// Initial style update
updateContadorStyle(mensajeInput.value.length);

// Update counter when the user types
mensajeInput.addEventListener('input', () => {
  const longitud = mensajeInput.value.length;
  updateContadorStyle(longitud);
  
  // Verificar si excede el límite - simplemente truncar sin notificación
  if (longitud > 391) {
    mensajeInput.value = mensajeInput.value.substring(0, 391);
    updateContadorStyle(391);
  }
});
        
        // Etiqueta Select with explicit handling
        const etiquetaSelect = document.getElementById('etiqueta-comentario');
        if (etiquetaSelect) {
          // Prioritize the original etiqueta if it exists
          if (data.etiqueta) {
            // Find the option that matches the original etiqueta
            const matchingOption = Array.from(etiquetaSelect.options)
              .find(option => option.value === data.etiqueta);
            
            if (matchingOption) {
              etiquetaSelect.value = data.etiqueta;
            } else {
              // If no exact match, fall back to the first valid option
              const validOptions = Array.from(etiquetaSelect.options)
                .filter(option => option.value && option.value !== 'Seleccione categoria');
              
              if (validOptions.length > 0) {
                etiquetaSelect.value = validOptions[0].value;
              }
            }
          } else {
            // If no original etiqueta, select first valid option
            const validOptions = Array.from(etiquetaSelect.options)
              .filter(option => option.value && option.value !== 'Seleccione categoria');
            
            if (validOptions.length > 0) {
              etiquetaSelect.value = validOptions[0].value;
            }
          }
          
          // Trigger change event to update dependent dropdowns
          etiquetaSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Subcategoria Select with similar logic
        const subcategoriaSelect = document.getElementById('subcategoria-comentario');
        if (subcategoriaSelect) {
          if (data.subcategoria) {
            // Find the option that matches the original subcategoria
            const matchingOption = Array.from(subcategoriaSelect.options)
              .find(option => option.value === data.subcategoria);
            
            if (matchingOption) {
              subcategoriaSelect.value = data.subcategoria;
            } else {
              // If no exact match, fall back to the first valid option
              const validOptions = Array.from(subcategoriaSelect.options)
                .filter(option => option.value !== '');
              
              if (validOptions.length > 0) {
                subcategoriaSelect.value = validOptions[0].value;
              }
            }
          } else {
            // If no original subcategoria, select first valid option
            const validOptions = Array.from(subcategoriaSelect.options)
              .filter(option => option.value !== '');
            
            if (validOptions.length > 0) {
              subcategoriaSelect.value = validOptions[0].value;
            }
          }
          
          // Trigger change event
          subcategoriaSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Extra Subcategoria Select with similar logic
        const extraSubcategoriaSelect = document.getElementById('extrasubcategoria-comentario');
        if (extraSubcategoriaSelect) {
          if (data.extrasubcategoria) {
            // Find the option that matches the original extrasubcategoria
            const matchingOption = Array.from(extraSubcategoriaSelect.options)
              .find(option => option.value === data.extrasubcategoria);
            
            if (matchingOption) {
              extraSubcategoriaSelect.value = data.extrasubcategoria;
            } else {
              // If no exact match, fall back to the first valid option
              const validOptions = Array.from(extraSubcategoriaSelect.options)
                .filter(option => option.value !== '');
              
              if (validOptions.length > 0) {
                extraSubcategoriaSelect.value = validOptions[0].value;
              }
            }
          } else {
            // If no original extrasubcategoria, select first valid option
            const validOptions = Array.from(extraSubcategoriaSelect.options)
              .filter(option => option.value !== '');
            
            if (validOptions.length > 0) {
              extraSubcategoriaSelect.value = validOptions[0].value;
            }
          }
          
          // Trigger change event
          extraSubcategoriaSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        imagenesEliminadas = [];
        if (data.imagenes && data.imagenes.length > 0) {
          imagenesActuales = data.imagenes;
          actualizarVistaPrevia();
        }
        
        if (overlay) {
          overlay.classList.add('active');
        }
      })
      .catch(error => {
        alert('Error al cargar el mensaje: ' + error.message);
      });
  }
});

// Agregar validación de caracteres al formulario para evitar envío de mensaje demasiado largo
document.getElementById('mensaje-form').addEventListener('submit', function(event) {
  const mensajeInput = document.getElementById('mensaje');
  if (mensajeInput.value.length > 391) {
    event.preventDefault();
    // Simplemente truncar sin mostrar notificación
    mensajeInput.value = mensajeInput.value.substring(0, 391);
    if (document.getElementById('contador-actual-mensaje')) {
      document.getElementById('contador-actual-mensaje').textContent = '391';
    }
  }
});


    function cargarMensajesFiltrados(params) {
    const listaMensajes = document.querySelector('.lista-mensajes');
    const contador = document.getElementById('contador');
    
    if (listaMensajes) {
      listaMensajes.innerHTML = '<p class="cargando">Cargando mensajes...</p>';
    }
    
    const currentUser = document.getElementById('autor')?.value || 'anonymous';
    
    if (params.get('tipo') === 'mios') {
      params.set('autor', currentUser);
    }
    
    let apiUrl = '/filtrar?';
    
    for (let [key, value] of params.entries()) {
      apiUrl += `${key}=${encodeURIComponent(value)}&`;
    }
    
    if (apiUrl.endsWith('&')) {
      apiUrl = apiUrl.slice(0, -1);
    }
    
    if (apiUrl === '/filtrar?') {
      apiUrl = '/filtrar';
    }
    
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (contador) {
          contador.textContent = data.mensajes ? data.mensajes.length : 0;
        }
        
        if (data.mensajes && data.mensajes.length > 0) {
          actualizarListaMensajes(data.mensajes);
        } else {
          listaMensajes.innerHTML = '<p class="no-mensajes">No se encontraron mensajes con los filtros seleccionados.</p>';
        }
      })
      .catch(error => {
        listaMensajes.innerHTML = `<p class="error">Error al cargar los mensajes: ${error.message}. Por favor, intenta de nuevo.</p>`;
        
        if (contador) {
          contador.textContent = "0";
        }
      });
  }

// THEN modify actualizarListaMensajes to properly use createCommentElement
function actualizarListaMensajes(mensajes) {
  const listaMensajes = document.querySelector('.lista-mensajes');
  const contador = document.getElementById('contador');
  if (!listaMensajes) return;
  
  listaMensajes.innerHTML = '';
  
  if (contador) {
    contador.textContent = mensajes ? mensajes.length : 0;
  }
  
  if (!mensajes || mensajes.length === 0) {
    listaMensajes.innerHTML = '<p class="no-mensajes">No se encontraron mensajes con los filtros seleccionados.</p>';
    return;
  }
  
  // Obtener el ID del usuario actual desde el meta tag
  const metaUsername = document.querySelector('meta[name="username"]');
  const currentUsername = metaUsername ? metaUsername.content : null;
  
  mensajes.forEach(mensaje => {
    const mensajeElement = document.createElement('div');
    mensajeElement.className = 'mensaje';
    mensajeElement.dataset.id = mensaje.id;
    mensajeElement.dataset.userId = mensaje.user_id;
    
    let imagenesHTML = '';
    if (mensaje.imagenes && mensaje.imagenes.length > 0) {
      imagenesHTML = `
        <div class="mensaje-imagenes">
          ${mensaje.imagenes.map(imagen => `
            <div class="imagen-mensaje-celda">
              <img src="${imagen.url}" alt="Imagen adjunta">
            </div>
          `).join('')}
        </div>
      `;
    }
    
    let etiquetaHTML = '';
    
    if (mensaje.etiqueta) {
      etiquetaHTML = `<span class="etiqueta principal" data-categoria="${mensaje.etiqueta}">${mensaje.etiqueta}</span>`;
    }
    
    if (mensaje.subcategoria) {
      etiquetaHTML += `<span class="subetiqueta" data-subcategoria="${mensaje.subcategoria}"><i class="fas fa-tag"></i> ${mensaje.subcategoria}</span>`;
    }
    
    if (mensaje.extrasubcategoria) {
      etiquetaHTML += `<span class="subetiqueta extra" data-extrasubcategoria="${mensaje.extrasubcategoria}"><i class="fas fa-tags"></i> ${mensaje.extrasubcategoria}</span>`;
    }
    
    // Determinar si el mensaje pertenece al usuario actual
    // También verificamos por autor en caso que la aplicación use este campo como identificador
    const isOwnMessage = (mensaje.user_id && currentUsername && String(mensaje.user_id) === String(currentUsername)) || 
                        (mensaje.autor && currentUsername && mensaje.autor === currentUsername);
    
    // Preparar los botones de editar y eliminar solo si es un mensaje propio
    const botonesAccion = isOwnMessage ? 
      `<button class="btn-editar" data-id="${mensaje.id}"><i class="fas fa-edit"></i></button>
       <button class="btn-eliminar" data-id="${mensaje.id}"><i class="fas fa-trash"></i></button>` : '';
    
    mensajeElement.innerHTML = `
      <div class="mensaje-cabecera">
        <span class="autor">${mensaje.autor}</span>
        <div class="etiquetas-container">
          ${etiquetaHTML}
        </div>
        <div class="mensaje-acciones">
          ${botonesAccion}
          <button class="btn-comentar" data-id="${mensaje.id}"><i class="fas fa-comment"></i></button>
        </div>
      </div>
      <div class="mensaje-contenido">${mensaje.mensaje}</div>
      ${imagenesHTML}
      <div class="mensaje-pie">
        <span class="fecha">${mensaje.fechaStr || mensaje.fecha}</span>
        <div class="ranking-container" data-mensaje-id="${mensaje.id}">
          <button class="btn-votar upvote" data-valor="1">
            &#x2191;  <!-- Flecha hacia arriba (Unicode) -->
          </button>
          <span class="ranking-valor ${mensaje.ranking < 0 ? 'negativo' : ''}">
            ${mensaje.ranking}
          </span>
          <button class="btn-votar downvote" data-valor="-1">
            &#x2193;  <!-- Flecha hacia abajo (Unicode) -->
          </button>
        </div>
      </div>      
    `;
    
    listaMensajes.appendChild(mensajeElement);
    
    
   
    // Añadir sección de comentarios con toggle para colapsar/expandir
    const comentariosSeccion = document.createElement('div');
    comentariosSeccion.classList.add('comentarios-seccion');
    
    // Contador de comentarios y botón para mostrar/ocultar
    const totalComentarios = mensaje.comentarios ? mensaje.comentarios.length : 0;
    
    const comentariosHeader = document.createElement('div');
    comentariosHeader.classList.add('comentarios-header');
    comentariosHeader.innerHTML = `
      <button class="toggle-comentarios" aria-expanded="false">
        <i class="fas fa-chevron-down"></i>
        <span class="comentarios-contador">${totalComentarios} comentarios</span>
      </button>
    `;
    comentariosSeccion.appendChild(comentariosHeader);
    
    // Contenedor de comentarios (inicialmente oculto)
    const comentariosContenedor = document.createElement('div');
    comentariosContenedor.classList.add('comentarios-contenedor');
    comentariosContenedor.style.display = 'none';
    
    // Lista de comentarios
    const comentariosLista = document.createElement('div');
    comentariosLista.classList.add('comentarios-lista');
    
    // Agregar comentarios existentes a la lista
    if (mensaje.comentarios && mensaje.comentarios.length > 0) {
      mensaje.comentarios.forEach(comentario => {
        const comentarioElement = createCommentElement(comentario, mensaje.id, currentUsername);
        comentariosLista.appendChild(comentarioElement);
      });
    }
    
    comentariosContenedor.appendChild(comentariosLista);
    comentariosSeccion.appendChild(comentariosContenedor);
    mensajeElement.appendChild(comentariosSeccion);
    
    // Manejo de eventos para las imágenes
    const imagenesCeldas = mensajeElement.querySelectorAll('.imagen-mensaje-celda');
    imagenesCeldas.forEach(celda => {
      celda.addEventListener('click', function() {
        const img = this.querySelector('img');
        if (img) {
          expandirImagen(img.src);
        }
      });
    });
    
    // Efecto de aparición gradual
    mensajeElement.style.opacity = '0';
    setTimeout(() => {
      mensajeElement.style.transition = 'opacity 0.5s ease-in';
      mensajeElement.style.opacity = '1';
    }, 50);
    
    // Marcar botón de voto si ya se ha votado este mensaje
    const mensajeId = mensaje.id;
    const votoGuardado = localStorage.getItem(`voto_${mensajeId}`);
    if (votoGuardado) {
      const valor = parseInt(votoGuardado);
      const selector = valor > 0 ? '.upvote' : '.downvote';
      const btnVoto = mensajeElement.querySelector(selector);
      if (btnVoto) btnVoto.classList.add('activo');
    }
  });
}

function createCommentElement(comentario, mensajeId, currentUsername) {
  const comentarioElement = document.createElement('div');
  comentarioElement.className = 'comentario';
  comentarioElement.dataset.id = comentario.id;
  comentarioElement.dataset.userId = comentario.user_id;
  
  // Obtener el ID del usuario actual desde el meta tag si no está disponible
  if (!currentUsername) {
    const metaUsername = document.querySelector('meta[name="username"]');
    currentUsername = metaUsername ? metaUsername.content : null;
    
    // Meta tag alternativo para el ID de usuario
    if (!currentUsername) {
      const metaUserId = document.querySelector('meta[name="userId"]');
      currentUsername = metaUserId ? metaUserId.content : null;
    }
  }
  
  console.log(`Creando comentario - Usuario actual: ${currentUsername}, Autor comentario: ${comentario.user_id || comentario.autor}`);
  
  // Determinar si el comentario pertenece al usuario actual
  // Comparación de IDs de usuario - garantizamos una comparación correcta de strings o números
  const isOwnComment = (comentario.user_id && currentUsername && 
                      String(comentario.user_id) === String(currentUsername)) || 
                      (comentario.autor && currentUsername && 
                      comentario.autor === currentUsername);
  
  // Botones solo si el comentario es del usuario actual
  const comentarioAcciones = isOwnComment ? `
    <div class="comentario-acciones">
      <button class="btn-editar-comentario" data-id="${comentario.id}" data-mensaje-id="${mensajeId}">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn-eliminar-comentario" data-id="${comentario.id}" data-mensaje-id="${mensajeId}">
        <i class="fas fa-trash"></i>
      </button>
    </div>` : '';

  // Imágenes del comentario, si existen
  let imagenesHTML = '';
  if (comentario.imagenes && comentario.imagenes.length > 0) {
    imagenesHTML = `
      <div class="comentario-imagenes">
        ${comentario.imagenes.map(imagen => `
          <div class="imagen-comentario">
            <img src="${imagen.url}" alt="Imagen de comentario">
          </div>
        `).join('')}
      </div>`;
  }

  // Sistema de votación del comentario
  const votacionHTML = `
    <div class="ranking-container" data-comentario-id="${comentario.id}">
      <button class="btn-votar-comentario upvote" data-valor="1">
        &#x2191;
      </button>
      <span class="ranking-valor ${(comentario.ranking || 0) < 0 ? 'negativo' : ''}">
        ${comentario.ranking || 0}
      </span>
      <button class="btn-votar-comentario downvote" data-valor="-1">
        &#x2193;
      </button>
    </div>
  `;

  // Estructura HTML del comentario
  comentarioElement.innerHTML = `
    <div class="comentario-cabecera">
      <span class="comentario-autor">${comentario.autor}</span>
      ${comentarioAcciones}
    </div>
    <div class="comentario-contenido">${comentario.comentario}</div>
    ${imagenesHTML}
    <div class="comentario-pie">
      <span class="comentario-fecha">${comentario.fechaStr || comentario.fecha}</span>
      ${votacionHTML}
    </div>
  `;

  // Marcar botones de voto activos si ya hay un voto previo
  const votoGuardadoComentario = localStorage.getItem(`voto_comentario_${comentario.id}`);
  if (votoGuardadoComentario) {
    const valor = parseInt(votoGuardadoComentario);
    const selector = valor > 0 ? '.upvote' : '.downvote';
    const btnVoto = comentarioElement.querySelector(`${selector}.btn-votar-comentario`);
    if (btnVoto) btnVoto.classList.add('activo');
  }

  return comentarioElement;
}

form.addEventListener('submit', function(event) {
  if (isSubmitting) {
    event.preventDefault();
    return false;
  }
  
  const autor = autorInput.value.trim();
  const mensaje = mensajeInput.value.trim();
  
  if (!autor || !mensaje) {
    event.preventDefault();
    alert('Por favor, completa todos los campos obligatorios');
    return false;
  }

  if (mensajeIdInput.value) {
    event.preventDefault();
    
    isSubmitting = true;
    
    const formData = new FormData();
    formData.append('autor', autor);
    formData.append('mensaje', mensaje);
    
    // Get the original message data before modifications
    const originalMessage = document.querySelector(`.mensaje[data-id="${mensajeIdInput.value}"]`);
    
    // Select elements for etiquetas
    const etiquetaSelect = document.getElementById('etiqueta-comentario');
    const subcategoriaSelect = document.getElementById('subcategoria-comentario');
    const extraSubcategoriaSelect = document.getElementById('extrasubcategoria-comentario');
    
    // Check original etiquetas from the message display
    const originalEtiquetaSpan = originalMessage.querySelector('.etiqueta');
    const originalSubcategoriaSpan = originalMessage.querySelector('.subetiqueta:not(.extra)');
    const originalExtraSubcategoriaSpan = originalMessage.querySelector('.subetiqueta.extra');
    
    // Etiqueta principal
    let etiquetaValue = '';
    if (etiquetaSelect && etiquetaSelect.value !== '') {
      etiquetaValue = etiquetaSelect.value;
    } else if (originalEtiquetaSpan) {
      etiquetaValue = originalEtiquetaSpan.textContent.trim();
    }
    
    if (etiquetaValue) {
      formData.append('etiqueta', etiquetaValue);
    }
    
    // Subcategoría
    let subcategoriaValue = '';
    if (subcategoriaSelect && subcategoriaSelect.value) {
      subcategoriaValue = subcategoriaSelect.value;
    } else if (originalSubcategoriaSpan) {
      subcategoriaValue = originalSubcategoriaSpan.textContent.trim();
    }
    
    if (subcategoriaValue) {
      formData.append('subcategoria', subcategoriaValue);
    }
    
    // Extra subcategoría
    let extraSubcategoriaValue = '';
    if (extraSubcategoriaSelect && extraSubcategoriaSelect.value) {
      extraSubcategoriaValue = extraSubcategoriaSelect.value;
    } else if (originalExtraSubcategoriaSpan) {
      extraSubcategoriaValue = originalExtraSubcategoriaSpan.textContent.trim();
    }
    
    if (extraSubcategoriaValue) {
      formData.append('extrasubcategoria', extraSubcategoriaValue);
    }
    
    // Handle images
    imagenesActuales.forEach(img => {
      if (typeof img === 'object' && img.file) {
        formData.append('imagenes', img.file);
      }
    });
    
    imagenesActuales.forEach(img => {
      if (typeof img === 'object' && img.id) {
        formData.append('mantener_imagenes[]', img.id);
      }
    });
    
    imagenesEliminadas.forEach(id => {
      formData.append('imagenes_eliminar[]', id);
    });
    
    submitBtn.textContent = 'Actualizando...';
    submitBtn.disabled = true;
    
    fetch(`/actualizar/${mensajeIdInput.value}`, {
      method: 'PUT',
      body: formData
    })
    .then(response => {
      if (!response.ok) throw new Error('Error: ' + response.status);
      return response.json();
    })
    .then(data => {
      if (data.success) {
        window.location.reload();
      } else {
        alert('Error al actualizar: ' + (data.error || 'Error desconocido'));
        isSubmitting = false;
      }
    })
    .catch(error => {
      alert('Error al actualizar: ' + error.message);
      isSubmitting = false;
    })
    .finally(() => {
      submitBtn.textContent = 'Actualizar';
      submitBtn.disabled = false;
    });
  } else {
    // Original new message submission logic remains the same
    const formData = new FormData(this);
    
    if (etiquetaSelect && etiquetaSelect.value) {
      formData.set('etiqueta', etiquetaSelect.value);
      
      const subcategoriaSelect = document.getElementById('subcategoria');
      const subetiquetasOpciones = document.getElementById('subetiquetas-opciones');
      const extraSubcategoriaSelect = document.getElementById('extrasubcategoria');
      
      if (subcategoriaSelect && subcategoriaSelect.value) {
        formData.set('subcategoria', subcategoriaSelect.value);
      } else if (subetiquetasOpciones) {
        const checkedSubtag = subetiquetasOpciones.querySelector('input[type="checkbox"]:checked');
        if (checkedSubtag) {
          formData.set('subcategoria', checkedSubtag.value.split(':').pop());
        }
      }
      
      if (extraSubcategoriaSelect && extraSubcategoriaSelect.value) {
        formData.set('extrasubcategoria', extraSubcategoriaSelect.value);
      }
    }
    
    isSubmitting = true;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
  }
});

   // Toggle buttons functionality
   const filterForm = document.getElementById('filter-form');
   const filterButtons = document.querySelectorAll('.filtro-boton');
   const filterExpanded = document.querySelectorAll('.filtros-expanded');
 
   filterButtons.forEach(button => {
     if (button.id.startsWith('btn-')) {
       button.addEventListener('click', (event) => {
         event.stopPropagation(); // Prevent event from bubbling
 
         const targetSection = document.getElementById(`filtros-${button.id.split('-')[1]}`);
         
         // If the clicked button is already active, toggle it off
         if (button.classList.contains('active')) {
           button.classList.remove('active');
           if (targetSection) {
             targetSection.classList.remove('active');
           }
         } else {
           // Remove active state from all buttons and sections
           filterButtons.forEach(btn => btn.classList.remove('active'));
           filterExpanded.forEach(section => section.classList.remove('active'));
 
           // Add active state to the clicked button and its section
           button.classList.add('active');
           if (targetSection) {
             targetSection.classList.add('active');
           }
         }
       });
     }
   });

 // Apply filters functionality
 const aplicarFiltros = document.getElementById('aplicar-filtros');
 aplicarFiltros.addEventListener('click', (e) => {
   e.preventDefault();
   const params = new URLSearchParams();

   // Ordenar
   const ordenSeleccionado = document.querySelector('input[name="orden"]:checked');
   if (ordenSeleccionado) {
     params.append('orden', ordenSeleccionado.value);
   }

   // Ranking
   const rankingSeleccionado = document.querySelector('input[name="ranking"]:checked');
   if (rankingSeleccionado) {
     params.append('ranking', rankingSeleccionado.value);
   }

   // Tipo
   const tipoSeleccionado = document.querySelector('input[name="tipo"]:checked');
   if (tipoSeleccionado) {
     params.append('tipo', tipoSeleccionado.value);
   }

   // Etiquetas
   const etiquetasSeleccionadas = document.querySelectorAll('input[name="etiquetas"]:checked');
   etiquetasSeleccionadas.forEach(etiqueta => {
     params.append('etiquetas', etiqueta.value);
   });

   // Subetiquetas
   const subetiquetasContainers = document.querySelectorAll('input[name^="subetiquetas-"]:checked');
   subetiquetasContainers.forEach(subetiqueta => {
     params.append('subetiquetas', subetiqueta.value);
   });

   // Extra Subcategorías (Nueva sección)
   const extraSubetiquetasContainers = document.querySelectorAll('input[name^="extrasubetiquetas-"]:checked');
   extraSubetiquetasContainers.forEach(extraSubetiqueta => {
     params.append('extrasubetiquetas', extraSubetiqueta.value);
   });

   // Ejecutar búsqueda
   cargarMensajesFiltrados(params);
 });















  // Clear filters functionality
  const limpiarFiltros = document.getElementById('limpiar-filtros');
  limpiarFiltros.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked').forEach(input => {
      input.checked = false;
    });

    filterExpanded.forEach(section => section.classList.remove('active'));
    filterButtons.forEach(button => button.classList.remove('active'));

    // Recargar todos los mensajes
    cargarMensajesFiltrados(new URLSearchParams());
  });

  // Initial loading of messages (with default params)
  cargarMensajesFiltrados(new URLSearchParams());
});











document.addEventListener('DOMContentLoaded', () => {
  const filterForm = document.getElementById('filtro-form');
  const mensajesContainer = document.querySelector('.lista-mensajes');
  const mensajes = document.querySelectorAll('.mensaje');
  const filtrosBusquedaContainer = document.getElementById('filtros-busqueda-container');
  const filtrosAplicadosContainer = document.getElementById('filtros-aplicados-container');
  const filtrosAplicadosTags = document.getElementById('filtros-aplicados-tags');
  const resultadosMensaje = document.getElementById('resultados-filtrados-mensaje');

  // Listen for form submission
  filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      aplicarFiltros();
  });

  // Improved function to get current user - add debugging
  function getCurrentUser() {
    const userElement = document.getElementById('usuario-actual');
    let username = 'unknown_user';
    
    if (userElement && userElement.dataset.nombre) {
      username = userElement.dataset.nombre;
    }
    
    console.log('Current user identified as:', username);
    return username;
  }

  // Main filter application function
  function aplicarFiltros() {
    // Reset previous filtering
    mensajes.forEach(mensaje => mensaje.style.display = 'block');
    filtrosBusquedaContainer.style.display = 'block';
    filtrosAplicadosTags.innerHTML = '';
    resultadosMensaje.style.display = 'none';

    // Get current logged user
    const currentUser = getCurrentUser();
    console.log('Filtering with current user:', currentUser);

    // Get filter values
    const etiquetasSeleccionadas = Array.from(
        document.querySelectorAll('input[name="etiquetas"]:checked')
    ).map(el => el.value);

    // Include both subcategory and extra subcategory filters
    const subetiquetasSeleccionadas = Array.from(
        document.querySelectorAll('input[name^="subetiquetas-"]:checked, input[name^="extrasubetiquetas-"]:checked')
    ).map(el => el.value);

    const orden = document.getElementById('orden').value;
    const ranking = document.getElementById('ranking').value;
    const tipo = document.getElementById('tipo').value;
    
    console.log('Selected filter type:', tipo);

    // Apply filters
    let mensajesFiltrados = Array.from(mensajes).filter(mensaje => {
        // Etiquetas filter
        const etiquetaMensaje = mensaje.querySelector('.etiqueta');
        const etiquetaValida = etiquetasSeleccionadas.length === 0 || 
            (etiquetaMensaje && etiquetasSeleccionadas.includes(etiquetaMensaje.textContent.trim()));

        // Subcategory filter (including extra subcategories)
        const subcategoriaMensaje = mensaje.querySelector('.subetiqueta:not(.extra)');
        const extraSubcategoriaMensaje = mensaje.querySelector('.subetiqueta.extra');
        
        const subcategoriaValida = subetiquetasSeleccionadas.length === 0 || 
            (subcategoriaMensaje && subetiquetasSeleccionadas.some(subetiqueta => 
                subcategoriaMensaje.textContent.toLowerCase().includes(subetiqueta.toLowerCase())
            )) ||
            (extraSubcategoriaMensaje && subetiquetasSeleccionadas.some(subetiqueta => 
                extraSubcategoriaMensaje.textContent.toLowerCase().includes(subetiqueta.toLowerCase())
            ));

        // Ranking filter
        const rankingValor = parseInt(mensaje.querySelector('.ranking-valor').textContent);
        let rankingValido = true;
        switch(ranking) {
            case 'populares':
                rankingValido = rankingValor > 100;
                break;
            case 'medios':
                rankingValido = rankingValor > 10 && rankingValor <= 100;
                break;
            case 'menos_populares':
                rankingValido = rankingValor <= 10; // This includes negative values
                break;
        }

        // Tipo de mensajes filter - FIXED IMPLEMENTATION
        const autorMensaje = mensaje.querySelector('.autor').textContent.trim();
        let tipoValido = true;
        
        if (tipo === 'mios') {
            tipoValido = autorMensaje === currentUser;
            console.log(`Mensaje de ${autorMensaje}, es mío? ${tipoValido}`);
        } 
        // For 'todos', tipoValido remains true

        return etiquetaValida && subcategoriaValida && rankingValido && tipoValido;
    });

    // Ordenar mensajes
    const ahora = new Date();
    const treintaMinutosAtras = new Date(ahora - 30 * 60 * 1000);
    const unaSemanaAtras = new Date(ahora - 7 * 24 * 60 * 60 * 1000);
    const unDiaAtras = new Date(ahora - 24 * 60 * 60 * 1000);

    switch(orden) {
        case 'recientes':
            // Mensajes de los últimos 30 minutos
            mensajesFiltrados = mensajesFiltrados.filter(mensaje => {
                const fechaMensaje = new Date(mensaje.querySelector('.fecha').textContent);
                return fechaMensaje >= treintaMinutosAtras;
            });
            mensajesFiltrados.sort((a, b) => {
                const fechaA = new Date(a.querySelector('.fecha').textContent);
                const fechaB = new Date(b.querySelector('.fecha').textContent);
                return fechaB - fechaA;
            });
            break;
        case 'antiguos':
            // Mensajes de hace más de una semana
            mensajesFiltrados = mensajesFiltrados.filter(mensaje => {
                const fechaMensaje = new Date(mensaje.querySelector('.fecha').textContent);
                return fechaMensaje <= unaSemanaAtras;
            });
            mensajesFiltrados.sort((a, b) => {
                const fechaA = new Date(a.querySelector('.fecha').textContent);
                const fechaB = new Date(b.querySelector('.fecha').textContent);
                return fechaA - fechaB;
            });
            break;
        case 'nuevos_24h':
            // Mensajes del último día
            mensajesFiltrados = mensajesFiltrados.filter(mensaje => {
                const fechaMensaje = new Date(mensaje.querySelector('.fecha').textContent);
                return fechaMensaje >= unDiaAtras;
            });
            mensajesFiltrados.sort((a, b) => {
                const fechaA = new Date(a.querySelector('.fecha').textContent);
                const fechaB = new Date(b.querySelector('.fecha').textContent);
                return fechaB - fechaA;
            });
            break;
        case 'mas_valorados':
            // Mensajes con más de 100 votos
            mensajesFiltrados = mensajesFiltrados.filter(mensaje => {
                const rankingValor = parseInt(mensaje.querySelector('.ranking-valor').textContent);
                return rankingValor > 100;
            });
            mensajesFiltrados.sort((a, b) => {
                const rankingA = parseInt(a.querySelector('.ranking-valor').textContent);
                const rankingB = parseInt(b.querySelector('.ranking-valor').textContent);
                return rankingB - rankingA; // Ordenar por mayor cantidad de votos
            });
            break;
        default:
            // Orden por defecto: más recientes primero
            mensajesFiltrados.sort((a, b) => {
                const fechaA = new Date(a.querySelector('.fecha').textContent);
                const fechaB = new Date(b.querySelector('.fecha').textContent);
                return fechaB - fechaA;
            });
    }

    // Logging filtered results
    console.log(`Total mensajes filtrados: ${mensajesFiltrados.length}`);

    // Mostrar/ocultar mensajes
    mensajes.forEach(mensaje => mensaje.style.display = 'none');
    mensajesFiltrados.forEach(mensaje => mensaje.style.display = 'block');

    // Mostrar mensaje si no hay resultados
    if (mensajesFiltrados.length === 0) {
        resultadosMensaje.style.display = 'block';
    }

    // Mostrar etiquetas de filtros aplicados
    mostrarFiltrosAplicados(etiquetasSeleccionadas, orden, ranking, tipo);
  }

  // Display applied filters as tags
  function mostrarFiltrosAplicados(etiquetas, orden, ranking, tipo) {
      const filtrosAplicados = [
          ...etiquetas.map(etiqueta => `Etiqueta: ${etiqueta}`),
          `Orden: ${obtenerTextoOrden(orden)}`,
          `Ranking: ${obtenerTextoRanking(ranking)}`,
          `Tipo: ${obtenerTextoTipo(tipo)}`
      ];

      filtrosAplicados.forEach(filtro => {
          const tagElement = document.createElement('div');
          tagElement.className = 'filtro-tag';
          tagElement.innerHTML = `
              ${filtro}
              <span class="remove-tag">&times;</span>
          `;
          tagElement.querySelector('.remove-tag').addEventListener('click', () => {
              tagElement.remove();
              // Potentially reset specific filter
          });
          filtrosAplicadosTags.appendChild(tagElement);
      });
  }

  // Helper functions for text display
  function obtenerTextoOrden(orden) {
      const ordenTextos = {
          'recientes': 'Recientes (últimos 30 minutos)',
          'antiguos': 'Antiguos (más de una semana)',
          'nuevos_24h': 'Nuevos (últimas 24h)',
          'nuevos_semana': 'Nuevos (última semana)',
          'mas_valorados': 'Mejor valorados (más de 100 votos)'
      };
      return ordenTextos[orden] || orden;
  }

  function obtenerTextoRanking(ranking) {
      const rankingTextos = {
          'todos': 'Todos los mensajes',
          'populares': 'Populares (más de 100 likes)',
          'medios': 'Medios (10-100 likes)',
          'menos_populares': 'Menos populares (10 o menos likes)'
      };
      return rankingTextos[ranking] || ranking;
  }

  function obtenerTextoTipo(tipo) {
      const tipoTextos = {
          'todos': 'Todos los mensajes',
          'mios': 'Solo mis mensajes',
      };
      return tipoTextos[tipo] || tipo;
  }

  // Reset filters
  document.getElementById('limpiar-filtros').addEventListener('click', () => {
      mensajes.forEach(mensaje => mensaje.style.display = 'block');
      filtrosBusquedaContainer.style.display = 'none';
      filtrosAplicadosTags.innerHTML = '';
      resultadosMensaje.style.display = 'none';
  });
});



// Edit comment functionality - Modified to hide the new message trigger
document.addEventListener('DOMContentLoaded', function() {
  // Get reference to the new message trigger button
  const newMessageTrigger = document.querySelector('.new-message-trigger');
  
  // Crear el overlay para editar comentarios
  const editCommentOverlay = document.createElement('div');
  editCommentOverlay.classList.add('edit-comment-overlay');
  document.body.appendChild(editCommentOverlay);

  // Función para crear una notificación superpuesta
  function showOverlayNotification(message, type = 'warning') {
    // Crear el contenedor principal
    const notificationOverlay = document.createElement('div');
    notificationOverlay.classList.add('notification-overlay');
    
    // Crear el contenedor de la notificación
    const notificationContainer = document.createElement('div');
    notificationContainer.classList.add('notification-container', `notification-${type}`);
    
    // Crear el contenido de la notificación
    const notificationContent = document.createElement('div');
    notificationContent.classList.add('notification-content');
    
    // Icono según el tipo
    let icon = 'exclamation-triangle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'info') icon = 'info-circle';
    
    // Agregar icono y mensaje
    notificationContent.innerHTML = `
      <div class="notification-icon">
        <i class="fas fa-${icon}"></i>
      </div>
      <div class="notification-message">${message}</div>
    `;
    
    // Botón para cerrar
    const closeButton = document.createElement('button');
    closeButton.classList.add('notification-close');
    closeButton.innerHTML = 'Entendido';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(notificationOverlay);
    });
    
    // Ensamblar todos los elementos
    notificationContainer.appendChild(notificationContent);
    notificationContainer.appendChild(closeButton);
    notificationOverlay.appendChild(notificationContainer);
    
    // Agregar al body
    document.body.appendChild(notificationOverlay);
    
    // Añadir evento para cerrar al hacer clic fuera (opcional)
    notificationOverlay.addEventListener('click', (e) => {
      if (e.target === notificationOverlay) {
        document.body.removeChild(notificationOverlay);
      }
    });
  }
  
 // Manejar el click en el botón de editar comentario
document.addEventListener('click', async (e) => {
  const editButton = e.target.closest('.btn-editar-comentario');
  
  if (editButton) {
    e.preventDefault();
    
    // Hide the new message trigger button
    const newMessageTrigger = document.querySelector('.new-message-trigger');
    if (newMessageTrigger) {
      newMessageTrigger.style.display = 'none';
    }
    
    // Obtener IDs necesarios
    const comentarioId = editButton.dataset.id;
    const comentarioElement = editButton.closest('.comentario');
    const mensajeElement = editButton.closest('.mensaje');
    
    if (!mensajeElement || !comentarioElement) {
      console.error('No se pudo encontrar el mensaje o comentario');
      return;
    }
    
    const mensajeId = mensajeElement.dataset.id;
    
    if (!mensajeId) {
      console.error('No se pudo obtener el ID del mensaje');
      return;
    }
    
    try {
      // Obtener datos del comentario actual
      const response = await fetch(`/comentario/${mensajeId}/${comentarioId}`);
      const result = await response.json();
      
      if (result.success) {
        const comentario = result.comentario;
        
        // Crear el formulario de edición con estilo similar a "Editar Mensaje"
        const editForm = document.createElement('form');
        editForm.classList.add('editar-comentario-form');
        editForm.dataset.comentarioId = comentarioId;
        editForm.dataset.mensajeId = mensajeId;

        // Título del formulario con estilo consistente
        const formTitle = document.createElement('h2');
        formTitle.id = 'form-edit-comment-title';
        formTitle.textContent = 'Editar Comentario';

        // Botón de cerrar
        const closeEditButton = document.createElement('div');
        closeEditButton.classList.add('close-edit-overlay');
        closeEditButton.innerHTML = '<i class="fas fa-times"></i>';

        // Primero insertamos el título al formulario
        editForm.appendChild(formTitle);
        
        // Estructura básica del formulario con el div para autor (sin incluir el input todavía)
        editForm.innerHTML += `
          <div class="form-group author-field" id="autor-container">
            <div class="field-label">Autor:</div>
            <div class="autor-display">${comentario.autor}</div>
          </div>
          <div class="form-group">
            <div class="field-label">Mensaje:</div>
            <div class="textarea-container" style="position: relative;">
              <textarea id="comentario-edit" name="comentario" required class="textarea-comentario" maxlength="391">${comentario.comentario}</textarea>
<div class="contador-caracteres" style="position: absolute; bottom: 5px; right: 10px; font-size: 12px; color: #666; padding: 2px 5px; border-radius: 3px;">
                <span id="contador-actual">0</span>/<span id="contador-maximo">391</span>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <div class="imagen-upload-container">
              <button type="button" class="btn-seleccionar-imagenes">
                <i class="fas fa-image"></i> Seleccionar imágenes
              </button>
              <input type="file" id="nuevas-imagenes" name="imagenes" multiple accept="image/*" style="display: none;">
            </div>
            <p class="limite-imagenes">Máximo 4 imágenes por comentario</p>
            <div class="todas-imagenes">
              ${comentario.imagenes && comentario.imagenes.length > 0 ? 
                comentario.imagenes.map(img => `
                  <div class="imagen-container imagen-actual-container" data-imagen-id="${img.id}">
                    <img src="${img.url}" alt="Imagen actual" class="imagen-actual">
                    <button type="button" class="btn-eliminar-imagen" data-imagen-id="${img.id}">
                      <i class="fas fa-times"></i>
                    </button>
                    <input type="hidden" name="mantener_imagenes" value="${img.id}" class="mantener-imagen">
                  </div>
                `).join('') : ''
              }
            </div>
          </div>
          
          <div class="form-botones">
            <button type="submit" class="btn-actualizar-comentario">Actualizar Comentario</button>
            <button type="button" class="btn-cancelar-edicion">Cancelar</button>
          </div>
        `;
        
        // SOLUCIÓN PARA CARACTERES ESPECIALES: Crear el input del autor separadamente
        const autorInput = document.createElement('input');
        autorInput.type = 'hidden';
        autorInput.id = 'autor-edit';
        autorInput.name = 'autor';
        autorInput.value = comentario.autor; // Esto manejará correctamente los caracteres especiales
        
        // Insertar el input en el contenedor
        const autorContainer = editForm.querySelector('#autor-container');
        autorContainer.appendChild(autorInput);
        
        // Agregar botón de cerrar y formulario directamente al overlay
        const editCommentOverlay = document.querySelector('.edit-comment-overlay');
        editCommentOverlay.innerHTML = '';
        editCommentOverlay.appendChild(closeEditButton);
        editCommentOverlay.appendChild(editForm);
        
        // Mostrar el overlay
        editCommentOverlay.classList.add('active');
        
        // Estilos adicionales para el textarea y contador
// Find this code section in your JavaScript that creates the counter
const textareaContainer = editForm.querySelector('.textarea-container');
const comentarioTextarea = editForm.querySelector('#comentario-edit');
comentarioTextarea.style.height = '150px'; // Puedes ajustar este valor según lo que necesites

// Modify the position of the counter by adjusting the bottom value
const contadorCaracteres = editForm.querySelector('.contador-caracteres');
if (contadorCaracteres) {
  contadorCaracteres.style.bottom = '10px'; // Changed from 5px to 10px
}

// Make sure there's enough padding at the bottom of the textarea
comentarioTextarea.style.paddingBottom = '30px'; // Increased from 25px to 30px
        
        // Configurar contador de caracteres
        const contadorActual = editForm.querySelector('#contador-actual');
        
        // Inicializar el contador con el texto actual
        contadorActual.textContent = comentarioTextarea.value.length;
        
        // Actualizar contador al escribir
        comentarioTextarea.addEventListener('input', () => {
          const longitud = comentarioTextarea.value.length;
          contadorActual.textContent = longitud;
          
          // Cambiar color del contador según se acerque al límite
          const contadorElement = editForm.querySelector('.contador-caracteres');
          if (longitud >= 351) { // A partir del 90% del límite (391*0.9)
            contadorElement.style.color = '#d9534f'; // Rojo
            contadorElement.style.fontWeight = 'bold';
          } else if (longitud >= 293) { // A partir del 75% del límite (391*0.75)
            contadorElement.style.color = '#f0ad4e'; // Naranja/amarillo
          } else {
            contadorElement.style.color = '#666'; // Color normal
            contadorElement.style.fontWeight = 'normal';
          }
          
          // Verificar si excede el límite
          if (longitud > 391) {
            showOverlayNotification('No es válido, el máximo son 391 caracteres. Debe reducir su texto.', 'warning');
            // Truncar el texto al límite permitido
            comentarioTextarea.value = comentarioTextarea.value.substring(0, 391);
            contadorActual.textContent = 391;
          }
        });
        
        // Manejar la selección de imágenes
        const btnSeleccionarImagenes = editForm.querySelector('.btn-seleccionar-imagenes');
        const inputImagenes = editForm.querySelector('#nuevas-imagenes');
        const todasImagenes = editForm.querySelector('.todas-imagenes');
        
        btnSeleccionarImagenes.addEventListener('click', () => {
          inputImagenes.click();
        });
        
        // Función para contar todas las imágenes (actuales + nuevas)
        const contarTodasLasImagenes = () => {
          return todasImagenes.querySelectorAll('.imagen-container').length;
        };
        
        // Controlar el límite de imágenes (máximo 4)
        inputImagenes.addEventListener('change', (e) => {
          // Contar imágenes actuales
          const totalImagenesActuales = contarTodasLasImagenes();
          
          // Si el usuario selecciona más de 4 imágenes en total, mostrar notificación y no procesar ninguna
          if (totalImagenesActuales + e.target.files.length > 4) {
            showOverlayNotification('Solo puedes seleccionar un máximo de 4 imágenes en total. Por favor, elimina algunas imágenes antes de añadir más.', 'warning');
            
            // Limpiar el input de archivos para que no se procese ninguna imagen
            inputImagenes.value = "";
            return; // Salir de la función sin procesar imágenes
          }
          
          // Calcular cuántas imágenes nuevas podemos añadir
          const maxNuevasImagenes = 4 - totalImagenesActuales;
          
          if (maxNuevasImagenes <= 0) {
            return; // No procesamos más imágenes si ya tenemos el máximo
          }
          
          const nuevasImagenes = Array.from(e.target.files).slice(0, maxNuevasImagenes);
          
          // Crear un nuevo FileList con solo las imágenes que vamos a usar
          const dt = new DataTransfer();
          for (let i = 0; i < nuevasImagenes.length; i++) {
            dt.items.add(nuevasImagenes[i]);
          }
          inputImagenes.files = dt.files;
          
          // Mostrar las nuevas imágenes
          for (const file of nuevasImagenes) {
            const previewContainer = document.createElement('div');
            previewContainer.classList.add('imagen-container', 'imagen-preview-container');
            
            const img = document.createElement('img');
            img.classList.add('imagen-preview');
            img.src = URL.createObjectURL(file);
            
            const removeBtn = document.createElement('button');
            removeBtn.classList.add('btn-remover-imagen');
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', () => {
              // Eliminar esta imagen del FileList
              const dt = new DataTransfer();
              const files = inputImagenes.files;
              
              for (let i = 0; i < files.length; i++) {
                if (files[i] !== file) {
                  dt.items.add(files[i]);
                }
              }
              
              inputImagenes.files = dt.files;
              
              // Eliminar el contenedor de vista previa
              previewContainer.remove();
            });
            
            previewContainer.appendChild(img);
            previewContainer.appendChild(removeBtn);
            todasImagenes.appendChild(previewContainer);
          }
        });
        
        // Manejar eliminación de imágenes existentes
        editForm.querySelectorAll('.btn-eliminar-imagen').forEach(btn => {
          btn.addEventListener('click', () => {
            const container = btn.closest('.imagen-actual-container');
            const input = container.querySelector('.mantener-imagen');
            
            // Marcar para eliminar e iconos visuales
            container.remove();
            input.value = '';
            
            // Añadir el input hidden al formulario para que se envíe aún después de quitar el contenedor
            if (!input.parentElement) {
              editForm.appendChild(input);
            }
          });
        });
        
        // Manejar envío del formulario
        editForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          // Validar longitud del comentario antes de enviar
          const comentarioText = comentarioTextarea.value;
          if (comentarioText.length > 391) {
            showOverlayNotification('No es válido, el máximo son 391 caracteres. Debe reducir su texto.', 'warning');
            return;
          }
          
          const formData = new FormData(editForm);
          
          try {
            const updateResponse = await fetch(`/actualizar-comentario/${mensajeId}/${comentarioId}`, {
              method: 'PUT',
              body: formData
            });
            
            const updateResult = await updateResponse.json();
            
            if (updateResult.success) {
              // Cerrar el overlay y recargar la página
              editCommentOverlay.classList.remove('active');
              
              // Show new message trigger again
              if (newMessageTrigger) {
                newMessageTrigger.style.display = 'flex';
              }
              
              window.location.reload();
            } else {
              showNotification('Error: ' + (updateResult.error || 'No se pudo actualizar el comentario'), 'error');
            }
          } catch (error) {
            console.error('Error al actualizar comentario:', error);
            showNotification('Error al actualizar el comentario', 'error');
          }
        });
        
        // Manejar botón de cerrar (X)
        closeEditButton.addEventListener('click', () => {
          editCommentOverlay.classList.remove('active');
          
          // Show new message trigger again
          if (newMessageTrigger) {
            newMessageTrigger.style.display = 'flex';
          }
        });
        
// Manejar botón de cancelar 
const cancelButton = editForm.querySelector('.btn-cancelar-edicion');
if (cancelButton) {
  cancelButton.addEventListener('click', () => {
    editCommentOverlay.classList.remove('active');

    // Show new message trigger again
    if (newMessageTrigger) {
      newMessageTrigger.style.display = 'flex';
    }

    // Recargar la página al cancelar
    window.location.reload();
  });
}

      } else {
        showNotification('Error: ' + (result.error || 'No se pudo obtener los datos del comentario'), 'error');
      }
    } catch (error) {
      console.error('Error al obtener datos del comentario:', error);
      showNotification('Error al actualizar el comentario', 'error');
    }
  }
});

  // Función para mostrar notificaciones
  function showNotification(message, type) {
    // Crear elemento de notificación si no existe
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      document.body.appendChild(notification);
    }
    
    // Establecer contenido y estilo de la notificación
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Mostrar notificación
    notification.classList.add('show');
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
});

//New message and comment
document.addEventListener('DOMContentLoaded', () => {
  // Create the floating button
  const triggerButton = document.createElement('div');
  triggerButton.classList.add('new-message-trigger');
  triggerButton.innerHTML = '<i class="fas fa-plus"></i>';
  document.body.appendChild(triggerButton);

  // Create the overlay container
  const overlay = document.createElement('div');
  overlay.classList.add('new-message-overlay');
  
  // Get both form containers
  const messageFormContainer = document.querySelector('.nuevo-mensaje-section');
  const commentFormContainer = document.querySelector('.nuevo-comentario-section');

  // Create content container for forms
  const newContentContainer = document.createElement('div');
  newContentContainer.classList.add('new-message-content');

  // Create close button
  const closeButton = document.createElement('div');
  closeButton.classList.add('close-overlay');
  closeButton.innerHTML = '<i class="fas fa-times"></i>';

  // Assemble overlay
  newContentContainer.appendChild(messageFormContainer);
  newContentContainer.appendChild(commentFormContainer);
  overlay.appendChild(newContentContainer);
  overlay.appendChild(closeButton);
  document.body.appendChild(overlay);

  // Function to switch form types
  function switchFormType(type) {
    const messageForm = document.querySelector('.nuevo-mensaje-section');
    const commentForm = document.querySelector('.nuevo-comentario-section');
    
    if (type === 'message') {
      messageForm.style.display = 'block';
      commentForm.style.display = 'none';
      document.getElementById('form-title').textContent = 'Nuevo Mensaje';
    } else if (type === 'comment') {
      messageForm.style.display = 'none';
      commentForm.style.display = 'block';
      document.getElementById('form-comment-title').textContent = 'Nuevo Comentario';
    }
  }

  // Toggle overlay for new message
  triggerButton.addEventListener('click', () => {
    switchFormType('message');
    overlay.classList.add('active');
  });

  // Event delegation for comment buttons
  document.addEventListener('click', (e) => {
    const commentButton = e.target.closest('.btn-comentar');
    const editButton = e.target.closest('.btn-editar');
    const closeButton = document.querySelector('.close-overlay');
    const overlay = document.querySelector('.new-message-overlay');
  
    function switchFormType(type) {
      const messageForm = document.querySelector('.nuevo-mensaje-section');
      const commentForm = document.querySelector('.nuevo-comentario-section');
      const formTitle = document.getElementById('form-title');
      const commentFormTitle = document.getElementById('form-comment-title');
      
      // Reset all forms
      messageForm.style.display = 'none';
      commentForm.style.display = 'none';
      
      if (type === 'message') {
        messageForm.style.display = 'block';
        formTitle.textContent = 'Nuevo Mensaje';
      } else if (type === 'comment') {
        commentForm.style.display = 'block';
        commentFormTitle.textContent = 'Nuevo Comentario';
      }
    }
  
    // Close button logic - Reload page when closed
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        // Reset form display state when closing
        const messageForm = document.querySelector('.nuevo-mensaje-section');
        const commentForm = document.querySelector('.nuevo-comentario-section');
        messageForm.style.display = 'block';
        commentForm.style.display = 'none';
        
        overlay.classList.remove('active');
        window.location.reload();
      });
    }
  
    // Comment button logic
    if (commentButton) {
      const messageId = commentButton.dataset.id;
      
      // Set the parent message ID in the comment form
      const parentIdInput = document.getElementById('mensaje-padre-id');
      if (parentIdInput) {
        parentIdInput.value = messageId;
      }
      
      // Get categories from the parent message
      const parentMessage = commentButton.closest('.mensaje');
      const principalCategory = parentMessage.querySelector('.etiqueta');
      const subcategory = parentMessage.querySelector('.subetiqueta:not(.extra)');
      const extraSubcategory = parentMessage.querySelector('.subetiqueta.extra');
  
      // Set comment form categories
      const comentarioEtiqueta = document.getElementById('etiqueta-comentario');
      const comentarioSubcategoria = document.getElementById('subcategoria-comentario');
      const comentarioExtrasubcategoria = document.getElementById('extrasubcategoria-comentario');
  
      // Reset and set categories
      if (comentarioEtiqueta) {
        comentarioEtiqueta.value = principalCategory ? principalCategory.textContent.trim() : '';
      }
      if (comentarioSubcategoria) {
        comentarioSubcategoria.value = subcategory ? subcategory.textContent.trim() : '';
      }
      if (comentarioExtrasubcategoria) {
        comentarioExtrasubcategoria.value = extraSubcategory ? extraSubcategory.textContent.trim() : '';
      }
      
      switchFormType('comment');
      overlay.classList.add('active');
    }
  
    // Edit button logic
    if (editButton) {
      // Explicitly set to message form type when editing
      switchFormType('message');
    }
  });

  // Close overlay with reload - X button
  closeButton.addEventListener('click', () => {
    overlay.classList.remove('active');
    window.location.reload();
  });

  // Close buttons for both forms with reload
  document.getElementById('cancel-btn').addEventListener('click', (e) => {
    e.preventDefault();
    overlay.classList.remove('active');
    window.location.reload();
  });

  document.getElementById('cancel-comentario-btn').addEventListener('click', (e) => {
    e.preventDefault();
    overlay.classList.remove('active');
    window.location.reload();
  });
  
  // Reload page after successful submission
  const mensajeForm = document.getElementById('nuevo-mensaje-form');
  if (mensajeForm) {
    const originalSubmit = mensajeForm.onsubmit;
    mensajeForm.onsubmit = function(e) {
      if (typeof originalSubmit === 'function') {
        const result = originalSubmit.call(this, e);
        if (result !== false) {
          setTimeout(() => window.location.reload(), 500);
        }
        return result;
      } else {
        setTimeout(() => window.location.reload(), 500);
      }
    };
  }
  
  // Solución mejorada para el formulario de comentarios
  const comentarioForm = document.getElementById('nuevo-comentario-form');
  if (comentarioForm) {
    // Remover cualquier event listener existente para evitar duplicados
    const newForm = comentarioForm.cloneNode(true);
    comentarioForm.parentNode.replaceChild(newForm, comentarioForm);
    
    newForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const messageId = this.dataset.mensajeId || document.getElementById('mensaje-padre-id').value;
      
      if (messageId) {
        formData.append('mensaje_padre_id', messageId);
      }
      
      fetch('/publicar-comentario', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          // Forzar recarga de la página después de éxito
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          alert('Error: ' + result.error);
        }
      })
      .catch(error => {
        console.error('Error al enviar comentario:', error);
        alert('Error al enviar comentario');
      });
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Create a comments popup overlay
  const commentsPopup = document.createElement('div');
  commentsPopup.classList.add('comments-popup-overlay');
  
  const commentsPopupContent = document.createElement('div');
  commentsPopupContent.classList.add('comments-popup-content');
  
  const closePopupButton = document.createElement('div');
  closePopupButton.classList.add('close-comments-popup');
  closePopupButton.innerHTML = '<i class="fas fa-times"></i>';
  
  const commentsContainer = document.createElement('div');
  commentsContainer.classList.add('all-comments-container');
  
  commentsPopupContent.appendChild(closePopupButton);
  commentsPopupContent.appendChild(commentsContainer);
  commentsPopup.appendChild(commentsPopupContent);
  document.body.appendChild(commentsPopup);
  
  // Handle comment form submissions - VERSIÓN CORREGIDA
  document.addEventListener('submit', async (e) => {
    // Check if this is a comment form submission
    if (e.target.matches('.nuevo-comentario-form, #comentario-form, #nuevo-comentario-form')) {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const messageId = e.target.dataset.mensajeId || document.getElementById('mensaje-padre-id').value;
      
      if (!messageId) {
        console.error('No message ID found');
        return;
      }
      
      formData.append('mensaje_padre_id', messageId);
      
      try {
        const response = await fetch('/publicar-comentario', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Clear the form
          e.target.reset();
          
          // Si el envío fue exitoso, recargar la página después de un breve retraso
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          alert('Error: ' + result.error);
        }
      } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Error al enviar comentario');
      }
    }
  });
});

// Función para actualizar los comentarios en el popup (añadida para completitud)
function updateCommentsPopup(messageId) {
  // Obtener todos los comentarios para este mensaje
  fetch(`/obtener-comentarios/${messageId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const commentsContainer = document.querySelector('.all-comments-container');
        commentsContainer.innerHTML = '';
        
        data.comentarios.forEach(comentario => {
          const commentElement = createCommentElement(comentario);
          commentsContainer.appendChild(commentElement);
        });
      }
    })
    .catch(error => {
      console.error('Error al cargar comentarios:', error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
  // Get reference to comment form image upload input
  const commentImageInput = document.getElementById('imagenes-comentario');
  
  if (commentImageInput) {
    // Add change event listener to monitor file selection
    commentImageInput.addEventListener('change', function(e) {
      // Check if more than 4 files are selected
      if (this.files.length > 4) {
        // Show notification
        showOverlayNotification('No se pueden subir más de 4 imágenes por comentario. Por favor, selecciona un máximo de 4 archivos.', 'warning');
        
        // Reset the file input to clear selection
        this.value = '';
      }
    });
  }
  
  // Also add the same validation to the nuevo-comentario form
  const nuevoComentarioImageInput = document.querySelector('.nuevo-comentario-section input[type="file"]');
  
  if (nuevoComentarioImageInput) {
    nuevoComentarioImageInput.addEventListener('change', function(e) {
      if (this.files.length > 4) {
        showOverlayNotification('No se pueden subir más de 4 imágenes por comentario. Por favor, selecciona un máximo de 4 archivos.', 'warning');
        this.value = '';
      }
    });
  }
  
  // Function for displaying overlay notifications
  function showOverlayNotification(message, type = 'warning') {
    // Create main container
    const notificationOverlay = document.createElement('div');
    notificationOverlay.classList.add('notification-overlay');
    
    // Create notification container
    const notificationContainer = document.createElement('div');
    notificationContainer.classList.add('notification-container', `notification-${type}`);
    
    // Create notification content
    const notificationContent = document.createElement('div');
    notificationContent.classList.add('notification-content');
    
    // Icon based on notification type
    let icon = 'exclamation-triangle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'info') icon = 'info-circle';
    
    // Add icon and message
    notificationContent.innerHTML = `
      <div class="notification-icon">
        <i class="fas fa-${icon}"></i>
      </div>
      <div class="notification-message">${message}</div>
    `;
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.classList.add('notification-close');
    closeButton.innerHTML = 'Entendido';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(notificationOverlay);
    });
    
    // Assemble all elements
    notificationContainer.appendChild(notificationContent);
    notificationContainer.appendChild(closeButton);
    notificationOverlay.appendChild(notificationContainer);
    
    // Add to body
    document.body.appendChild(notificationOverlay);
    
    // Add event to close when clicking outside
    notificationOverlay.addEventListener('click', (e) => {
      if (e.target === notificationOverlay) {
        document.body.removeChild(notificationOverlay);
      }
    });
  }
});

// Image dropzone functionality
document.addEventListener('DOMContentLoaded', () => {
  // Setup image preview and dropzone (your existing code)
  setupImagePreview('imagenes-input-comentario', 'imagenes-preview-container-comentario');
  setupDropZone('drop-zone-comentario', 'imagenes-input-comentario');
  
  // Setup image expansion functionality
  setupImageExpansion();
  
  // Handle image preview for individual message comment forms
  document.querySelectorAll('.mensaje').forEach(mensaje => {
    const messageId = mensaje.dataset.id;
    const imageInput = document.getElementById(`imagenes-comentario-${messageId}`);
    if (imageInput) {
      const previewContainer = imageInput.closest('.imagenes-input-container').querySelector('.imagenes-preview-container');
      setupImagePreviewForElement(imageInput, previewContainer);
      
      // Setup drop zone for each message's comment form
      const dropZone = imageInput.closest('.imagenes-input-container').querySelector('.drop-zone-comentario');
      if (dropZone) {
        setupDropZoneForElement(dropZone, imageInput);
      }
    }
  });
});

// Function to set up image preview for a specific input and container
function setupImagePreview(inputId, containerId) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(containerId);
  
  if (input && container) {
    setupImagePreviewForElement(input, container);
  }
}

// Function to set up image preview logic for any element
function setupImagePreviewForElement(input, container) {
  input.addEventListener('change', function() {
    container.innerHTML = ''; // Clear previous previews
    
    const maxImages = input.closest('.nuevo-comentario-section') ? 4 : 9;
    const files = Array.from(this.files).slice(0, maxImages);
    
    if (files.length > 0) {
      container.style.display = 'grid';
    }
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const previewWrapper = document.createElement('div');
        previewWrapper.className = 'image-preview-wrapper';
        
        const preview = document.createElement('img');
        preview.src = e.target.result;
        preview.className = 'image-preview';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener('click', function(e) {
          e.preventDefault();
          previewWrapper.remove();
          
          // Create a new FileList without this file
          const dataTransfer = new DataTransfer();
          const currentFiles = Array.from(input.files);
          currentFiles.forEach(f => {
            if (f !== file) {
              dataTransfer.items.add(f);
            }
          });
          input.files = dataTransfer.files;
          
          // Hide container if empty
          if (container.children.length === 0) {
            container.style.display = 'none';
          }
        });
        
        previewWrapper.appendChild(preview);
        previewWrapper.appendChild(removeBtn);
        container.appendChild(previewWrapper);
      };
      
      reader.readAsDataURL(file);
    });
  });
}

// Function to set up drop zone for a specific element
function setupDropZone(dropZoneId, inputId) {
  const dropZone = document.getElementById(dropZoneId);
  const input = document.getElementById(inputId);
  
  if (dropZone && input) {
    setupDropZoneForElement(dropZone, input);
  }
}

// Function to set up drop zone functionality for any element
function setupDropZoneForElement(dropZone, input) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('highlight');
    });
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('highlight');
    });
  });
  
  dropZone.addEventListener('drop', function(e) {
    const maxImages = input.closest('.nuevo-comentario-section') ? 4 : 9;
    const dt = e.dataTransfer;
    const files = dt.files;
    
    // Create a new FileList with max allowed images
    const dataTransfer = new DataTransfer();
    // Add existing files first
    if (input.files) {
      Array.from(input.files).slice(0, maxImages).forEach(file => {
        dataTransfer.items.add(file);
      });
    }
    
    // Add new files up to the max limit
    const remainingSlots = maxImages - (input.files ? input.files.length : 0);
    Array.from(files).slice(0, remainingSlots).forEach(file => {
      if (file.type.startsWith('image/')) {
        dataTransfer.items.add(file);
      }
    });
    
    input.files = dataTransfer.files;
    
    // Trigger change event to update preview
    const event = new Event('change');
    input.dispatchEvent(event);
  });
}

// Modify the setupImageExpansion function to include the edit preview images
function setupImageExpansion() {
  // Use event delegation to handle all possible image clicks
  document.addEventListener('click', function(event) {
    // Check if the clicked element is any type of image we want to expand
    if (event.target && (
        event.target.classList.contains('image-preview') ||
        event.target.classList.contains('comentario-imagen') || 
        event.target.classList.contains('mensaje-imagen') ||
        event.target.classList.contains('imagen-preview') ||  // Added for edit form preview
        event.target.classList.contains('imagen-actual')      // Added for existing images in edit form
    )) {
      toggleImageExpansion(event.target);
    }
  });
  
  // Close expanded image when clicking outside
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('expanded-image-overlay')) {
      closeExpandedImage(event.target);
    }
  });
  
  // Close expanded image with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      const overlay = document.querySelector('.expanded-image-overlay');
      if (overlay) {
        closeExpandedImage(overlay);
      }
    }
  });
}

function toggleImageExpansion(imageElement) {
  // Check if image is already expanded
  const existingOverlay = document.querySelector('.expanded-image-overlay');
  if (existingOverlay) {
    closeExpandedImage(existingOverlay);
    // If we're closing the current image, don't open a new one if it's the same image
    if (existingOverlay.querySelector('img').src === imageElement.src) {
      return;
    }
  }
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'expanded-image-overlay';
  
  // Create expanded image container
  const expandedContainer = document.createElement('div');
  expandedContainer.className = 'expanded-image-container';
  
  // Create expanded image
  const expandedImg = document.createElement('img');
  expandedImg.src = imageElement.src;
  expandedImg.className = 'expanded-image';
  
  // Assemble everything
  expandedContainer.appendChild(expandedImg);
  overlay.appendChild(expandedContainer);
  document.body.appendChild(overlay);
  
  // Prevent scrolling on body when overlay is open
  document.body.style.overflow = 'hidden';
  
  // Animate the overlay appearance
  setTimeout(() => {
    overlay.style.opacity = '1';
  }, 10);
}

function closeExpandedImage(overlay) {
  overlay.style.opacity = '0';
  
  // Wait for fade out animation to complete before removing
  setTimeout(() => {
    overlay.remove();
    document.body.style.overflow = '';
  }, 300);
}

// Objeto global para almacenar el estado de los votos del usuario
const estadoVotos = {
  mensajes: {},      // Formato: {mensajeId: valor}
  comentarios: {}    // Formato: {comentarioId: valor}
};

// Función para cargar el estado de los votos del usuario desde el servidor
async function cargarEstadoVotos() {
  try {
    const response = await fetch('/mis-votos');
    if (!response.ok) {
      throw new Error('Error al cargar el estado de votos');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Guardar el estado de los votos
      estadoVotos.mensajes = data.votos || {};
      estadoVotos.comentarios = data.votosComentarios || {};
      
      // Actualizar la UI para reflejar los votos existentes
      actualizarUIVotos();
    } else {
      console.error('Error al cargar votos:', data.error);
    }
  } catch (error) {
    console.error('Error al cargar el estado de votos:', error);
  }
}

// Función para actualizar la UI según el estado de votos
function actualizarUIVotos() {
  // Actualizar UI para votos de mensajes
  document.querySelectorAll('.ranking-container[data-mensaje-id]').forEach(container => {
    const mensajeId = container.dataset.mensajeId;
    const valor = estadoVotos.mensajes[mensajeId] || 0;
    
    // Quitar clase activo de todos los botones
    container.querySelectorAll('.btn-votar').forEach(btn => {
      btn.classList.remove('activo');
    });
    
    // Activar el botón correspondiente al voto
    if (valor > 0) {
      container.querySelector('.btn-votar.upvote')?.classList.add('activo');
    } else if (valor < 0) {
      container.querySelector('.btn-votar.downvote')?.classList.add('activo');
    }
  });
  
  // Actualizar UI para votos de comentarios
  document.querySelectorAll('.ranking-container[data-comentario-id]').forEach(container => {
    const comentarioId = container.dataset.comentarioId;
    const valor = estadoVotos.comentarios[comentarioId] || 0;
    
    // Quitar clase activo de todos los botones
    container.querySelectorAll('.btn-votar-comentario').forEach(btn => {
      btn.classList.remove('activo');
    });
    
    // Activar el botón correspondiente al voto
    if (valor > 0) {
      container.querySelector('.btn-votar-comentario.upvote')?.classList.add('activo');
    } else if (valor < 0) {
      container.querySelector('.btn-votar-comentario.downvote')?.classList.add('activo');
    }
  });
}

// Función mejorada para votar mensajes
async function enviarVoto(mensajeId, valor) {
  try {
    // Determinar el valor a enviar basado en el estado actual
    const votoActual = estadoVotos.mensajes[mensajeId] || 0;
    let valorAEnviar = valor;
    
    // Si el voto actual es el mismo que el nuevo, lo cancelamos enviando un 0
    if (votoActual === valor) {
      valorAEnviar = 0;
    }
    
    const response = await fetch(`/votar/${mensajeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ valor: valorAEnviar })
    });
    
    if (!response.ok) {
      throw new Error('Error al enviar el voto');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Actualizar el objeto de estado de votos
      if (data.valorVoto === 0) {
        delete estadoVotos.mensajes[mensajeId];
      } else {
        estadoVotos.mensajes[mensajeId] = data.valorVoto;
      }
      
      // Actualizar la UI
      const rankingContainer = document.querySelector(`.ranking-container[data-mensaje-id="${mensajeId}"]`);
      
      if (rankingContainer) {
        // Actualizar el valor del ranking
        const rankingValor = rankingContainer.querySelector('.ranking-valor');
        if (rankingValor) {
          rankingValor.textContent = data.nuevoRanking;
          rankingValor.classList.toggle('negativo', data.nuevoRanking < 0);
        }
        
        // Actualizar botones
        const upvoteBtn = rankingContainer.querySelector('.btn-votar.upvote');
        const downvoteBtn = rankingContainer.querySelector('.btn-votar.downvote');
        
        if (upvoteBtn && downvoteBtn) {
          // Quitar clase activo de ambos botones
          upvoteBtn.classList.remove('activo');
          downvoteBtn.classList.remove('activo');
          
          // Activar el botón correspondiente al voto actual
          if (data.valorVoto > 0) {
            upvoteBtn.classList.add('activo');
          } else if (data.valorVoto < 0) {
            downvoteBtn.classList.add('activo');
          }
        }
      }
      
      return data;
    } else {
      console.error('Error en la respuesta:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error al votar mensaje:', error);
    throw error;
  }
}

// Actualizar el listener para votos de mensajes
document.addEventListener('click', function(event) {
  // Verificar si es un botón de votar mensaje y NO un botón de comentario
  if (event.target.closest('.btn-votar') && !event.target.closest('.btn-votar-comentario')) {
    const boton = event.target.closest('.btn-votar');
    const rankingContainer = boton.closest('.ranking-container');
    const mensajeId = rankingContainer.dataset.mensajeId;
    const valorBoton = parseInt(boton.dataset.valor);
    
    // Enviar el voto directamente, la lógica de cancelación está en la función enviarVoto
    enviarVoto(mensajeId, valorBoton).catch(error => {
      console.error('Error al procesar voto:', error);
    });
  }
});

// Función mejorada para votar comentarios
async function votarComentario(comentarioId, valor) {
  try {
    // Obtener el voto actual desde el estado global
    const votoActual = estadoVotos.comentarios[comentarioId] || 0;
    
    // Determinar el valor a enviar
    let valorAEnviar = valor;
    if (votoActual === valor) {
      valorAEnviar = 0; // Cancelar voto si presiona el mismo botón
    }
    
    // Enviar la solicitud al servidor
    const response = await fetch('/votar-comentario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        comentarioId: parseInt(comentarioId), 
        valor: valorAEnviar 
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Actualizar el estado global
      if (data.valorVoto === 0) {
        delete estadoVotos.comentarios[comentarioId];
      } else {
        estadoVotos.comentarios[comentarioId] = data.valorVoto;
      }
      
      // Actualizar la UI
      const container = document.querySelector(`.ranking-container[data-comentario-id="${comentarioId}"]`);
      if (container) {
        // Actualizar valor de ranking
        const rankingElement = container.querySelector('.ranking-valor');
        if (rankingElement) {
          rankingElement.textContent = data.nuevoRanking;
          rankingElement.classList.toggle('negativo', data.nuevoRanking < 0);
        }
        
        // Actualizar botones
        const upvoteBtn = container.querySelector('.btn-votar-comentario.upvote');
        const downvoteBtn = container.querySelector('.btn-votar-comentario.downvote');
        
        if (upvoteBtn && downvoteBtn) {
          // Quitar clase activo de ambos botones
          upvoteBtn.classList.remove('activo');
          downvoteBtn.classList.remove('activo');
          
          // Activar botón según el valor del voto
          if (data.valorVoto > 0) {
            upvoteBtn.classList.add('activo');
          } else if (data.valorVoto < 0) {
            downvoteBtn.classList.add('activo');
          }
        }
      }
    } else if (data.mensaje) {
      console.error('Error al votar:', data.mensaje);
    }
  } catch (error) {
    console.error('Error al votar comentario:', error);
  }
}

// Actualizar el listener para votos de comentarios
document.addEventListener('click', (e) => {
  // Verificar si el elemento clickeado es un botón de voto para comentarios
  const botonVoto = e.target.closest('.btn-votar-comentario');
  if (!botonVoto) return;
  
  // Verificar si pertenece a un comentario
  const comentarioElement = botonVoto.closest('.comentario');
  if (!comentarioElement) return;
  
  // Obtener el contenedor de ranking
  const container = botonVoto.closest('.ranking-container');
  if (!container) return;
  
  // Obtener el ID del comentario
  const comentarioId = container.dataset.comentarioId;
  if (!comentarioId) return;
  
  // Obtener el valor del voto
  const valor = parseInt(botonVoto.dataset.valor);
  if (isNaN(valor)) {
    console.error('Valor de voto inválido');
    return;
  }
  
  // Llamar a la función para votar comentario
  votarComentario(comentarioId, valor);
  
  // Prevenir que el evento siga propagándose
  e.stopPropagation();
});

// Función para cargar votos específicos por ID y tipo
async function cargarVotoPorId(tipo, id) {
  try {
    const response = await fetch(`/voto-estado/${tipo}/${id}`);
    if (!response.ok) return;
    
    const data = await response.json();
    
    if (data.success) {
      // Actualizar el estado global
      if (tipo === 'mensaje') {
        if (data.voto === 0) {
          delete estadoVotos.mensajes[id];
        } else {
          estadoVotos.mensajes[id] = data.voto;
        }
      } else if (tipo === 'comentario') {
        if (data.voto === 0) {
          delete estadoVotos.comentarios[id];
        } else {
          estadoVotos.comentarios[id] = data.voto;
        }
      }
      
      // Actualizar la UI para este elemento específico
      const selector = tipo === 'mensaje' 
        ? `.ranking-container[data-mensaje-id="${id}"]` 
        : `.ranking-container[data-comentario-id="${id}"]`;
        
      const container = document.querySelector(selector);
      if (container) {
        const upvoteBtn = tipo === 'mensaje' 
          ? container.querySelector('.btn-votar.upvote')
          : container.querySelector('.btn-votar-comentario.upvote');
          
        const downvoteBtn = tipo === 'mensaje'
          ? container.querySelector('.btn-votar.downvote')
          : container.querySelector('.btn-votar-comentario.downvote');
          
        if (upvoteBtn && downvoteBtn) {
          upvoteBtn.classList.remove('activo');
          downvoteBtn.classList.remove('activo');
          
          if (data.voto > 0) {
            upvoteBtn.classList.add('activo');
          } else if (data.voto < 0) {
            downvoteBtn.classList.add('activo');
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error al cargar voto para ${tipo} ${id}:`, error);
  }
}

// Cargar el estado de votos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarEstadoVotos();
  
  // Observar cambios en el DOM para mantener actualizada la UI de votos
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        // Si se añaden nuevos elementos, actualizar la UI de votos
        actualizarUIVotos();
      }
    }
  });
  
  // Observar cambios en el cuerpo del documento
  observer.observe(document.body, { childList: true, subtree: true });
});

// Evento para cuando el contenido se actualiza
document.addEventListener('contentUpdated', cargarEstadoVotos);

// MEJORADO: Frontend con soporte para depuración
document.addEventListener('DOMContentLoaded', function() {
  // Añadir meta tag temporal para depuración si no existe
  if (!document.querySelector('meta[name="debug"]')) {
    const metaDebug = document.createElement('meta');
    metaDebug.name = 'debug';
    metaDebug.content = 'enabled';
    document.head.appendChild(metaDebug);
  }
  
  const DEBUG = document.querySelector('meta[name="debug"]')?.content === 'enabled';
  
  // Función de registro que solo imprime en modo debug
  function debugLog(...args) {
    if (DEBUG) console.log('[DEBUG]', ...args);
  }
  
  // Get modal elements
  const modalConfirmacionComentario = document.getElementById('modal-confirmacion-comentario');
  const btnConfirmarEliminarComentario = document.getElementById('btn-confirmar-eliminar-comentario');
  const btnCancelarEliminarComentario = document.getElementById('btn-cancelar-eliminar-comentario');
  
  // Variables to store the current comment and message IDs
  let currentCommentId = null;
  let currentMessageId = null;
  
  // Add event listeners for comment deletion buttons
  document.addEventListener('click', function(e) {
    const deleteCommentBtn = e.target.closest('.btn-eliminar-comentario');
    
    if (deleteCommentBtn) {
      e.preventDefault();
      
      // Store the comment and message IDs
      currentCommentId = parseInt(deleteCommentBtn.dataset.id);
      currentMessageId = parseInt(deleteCommentBtn.dataset.mensajeId || deleteCommentBtn.closest('.mensaje')?.dataset.id);
      
      // Guardar también el elemento comentario para uso posterior
      const commentElement = deleteCommentBtn.closest('.comentario');
      if (commentElement) {
        debugLog('Datos del comentario elemento:', {
          id: commentElement.dataset.id,
          userId: commentElement.dataset.userId,
          autor: commentElement.querySelector('.comentario-autor')?.textContent
        });
      }
      
      if (!currentMessageId) {
        console.error('No se pudo obtener el ID del mensaje');
        return;
      }
      
      debugLog(`Preparando eliminación - Mensaje ID: ${currentMessageId}, Comentario ID: ${currentCommentId}`);
      
      // Show the confirmation modal with animation
      modalConfirmacionComentario.style.display = 'flex';
      setTimeout(() => {
        modalConfirmacionComentario.classList.add('active');
        modalConfirmacionComentario.querySelector('.modal-contenido').classList.add('active');
      }, 10);
    }
  });
  
  // Función para cerrar el modal de comentarios
  function closeCommentModal() {
    modalConfirmacionComentario.classList.remove('active');
    modalConfirmacionComentario.querySelector('.modal-contenido').classList.remove('active');
    setTimeout(() => {
      modalConfirmacionComentario.style.display = 'none';
    }, 300);
  }
  
  // Botón cancelar eliminación de comentario
  btnCancelarEliminarComentario.addEventListener('click', function() {
    closeCommentModal();
  });
  
  // Función para mostrar notificaciones con opción de depuración
  function showNotification(message, type, debugData = null) {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    
    // Si hay datos de depuración y estamos en modo debug
    if (DEBUG && debugData && type === 'error') {
      message += '<details><summary>Detalles técnicos</summary>';
      message += `<pre>${JSON.stringify(debugData, null, 2)}</pre>`;
      message += '</details>';
      notif.innerHTML = message;
    } else {
      notif.textContent = message;
    }
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
      notif.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notif);
      }, 300);
    }, 5000); // Tiempo aumentado para poder leer detalles
  }
  
// SOLUCIÓN: Actualización del manejo de eliminación de comentarios
btnConfirmarEliminarComentario.addEventListener('click', async function() {
  if (currentCommentId && currentMessageId) {
    try {
      debugLog(`Enviando solicitud: /eliminar-comentario/${currentMessageId}/${currentCommentId}`);
      
      // Obtener información del usuario actual para depuración
      const userInfo = {
        username: document.querySelector('meta[name="username"]')?.content,
        userId: document.querySelector('meta[name="userId"]')?.content
      };
      
      debugLog('Información del usuario actual:', userInfo);
      
      const response = await fetch(`/eliminar-comentario/${currentMessageId}/${currentCommentId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Debug': DEBUG ? 'true' : 'false'
        },
        credentials: 'same-origin' // Importante para enviar las cookies de sesión
      });
      
      const result = await response.json();
      
      if (result.success) {
        debugLog('Comentario eliminado con éxito');
        
        // Eliminar visualmente el comentario del DOM
        const comentarioElement = document.querySelector(`.comentario[data-id="${currentCommentId}"]`);
        if (comentarioElement) {
          comentarioElement.style.opacity = '0';
          setTimeout(() => {
            comentarioElement.remove();
            // Recargar la página después de eliminar visualmente
            window.location.reload();
          }, 300); // Espera que la animación termine
        } else {
          // Si no encuentra el comentario, igual recargar
          window.location.reload();
        }

        // Cerrar el modal con animación
        closeCommentModal();
        
        // (Opcional) Mostrar mensaje de éxito
        // showNotification('Comentario eliminado correctamente', 'success');

      } else {
        closeCommentModal();
        console.error('Error del servidor:', result);
        
        // SOLUCIÓN ALTERNATIVA: Si el error es de permisos pero sabemos que es el dueño
        if (result.error?.includes('No tienes permiso') && DEBUG) {
          debugLog('Intentando solución alternativa para eliminación...');
          
          showNotification(
            'Error: ' + result.error, 
            'error', 
            {
              userInfo,
              commentInfo: result.debug,
              suggestion: "Revisar si los tipos de datos coinciden en la DB y en la sesión"
            }
          );
        } else {
          // Mostrar mensaje de error estándar
          showNotification('Error: ' + (result.error || 'No se pudo eliminar el comentario'), 'error');
        }
      }
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      closeCommentModal();
      showNotification('Error al eliminar el comentario: ' + error.message, 'error');
    }
  }
});

  // Añadir estilos para mensaje de error con detalles
  document.head.insertAdjacentHTML('beforeend', `
    <style>
      .notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .notification.show {
        opacity: 1;
      }
      
      .notification.error {
        background-color: #f44336;
        color: white;
      }
      
      .notification.success {
        background-color: #4CAF50;
        color: white;
      }
      
      .notification details {
        margin-top: 8px;
        background: rgba(0,0,0,0.1);
        padding: 8px;
        border-radius: 4px;
      }
      
      .notification pre {
        white-space: pre-wrap;
        font-size: 12px;
      }
    </style>
  `);
});

document.addEventListener('DOMContentLoaded', function() {
  // Get modal elements for message deletion
  const modalConfirmacion = document.getElementById('modal-confirmacion');
  const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
  const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
  
  // Variable to store the current message ID
  let currentMessageId = null;
  
  // Add event listeners for message deletion buttons
  document.addEventListener('click', function(e) {
    const deleteMessageBtn = e.target.closest('.btn-eliminar');
    
    if (deleteMessageBtn) {
      e.preventDefault();
      
      // Store the message ID
      currentMessageId = deleteMessageBtn.dataset.id;
      
      // Show the confirmation modal with animation
      modalConfirmacion.style.display = 'flex';
      setTimeout(() => {
        modalConfirmacion.classList.add('active');
        modalConfirmacion.querySelector('.modal-contenido').classList.add('active');
      }, 10);
    }
  });
  
// Update the message deletion handler
btnConfirmarEliminar.addEventListener('click', async function() {
  if (currentMessageId) {
    try {
      const response = await fetch(`/eliminar-mensaje/${currentMessageId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });

      const result = await response.json();

      if (result.success) {
        closeMessageModal();
        showNotification('Mensaje eliminado correctamente', 'success');
        
        // Recargar la página después de eliminar el mensaje
        setTimeout(() => {
          window.location.reload();
        }, 500); // Pequeño retraso para que se muestre la notificación
      } else {
        closeMessageModal();
        showNotification('Error: ' + (result.error || 'No se pudo eliminar el mensaje'), 'error');
      }
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
      closeMessageModal();
      showNotification('Error al eliminar el mensaje', 'error');
    }
  }
});


  
  // Cancel delete message
  btnCancelarEliminar.addEventListener('click', function() {
    closeMessageModal();
  });
  
  // Also close modal when clicking outside
  modalConfirmacion.addEventListener('click', function(e) {
    if (e.target === modalConfirmacion) {
      closeMessageModal();
    }
  });
  
  // Function to close the message confirmation modal with animation
  function closeMessageModal() {
    modalConfirmacion.classList.remove('active');
    modalConfirmacion.querySelector('.modal-contenido').classList.remove('active');
    setTimeout(() => {
      modalConfirmacion.style.display = 'none';
    }, 300);
    
    // Reset current ID
    currentMessageId = null;
  }
  
  // Function to show notification (defined as a global function to be used by both event handlers)
  window.showNotification = function(message, type) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      document.body.appendChild(notification);
    }
    
    // Set notification content and style
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
  
  // Animation for messages and comments
  document.head.insertAdjacentHTML('beforeend', `
    <style>
      .mensaje.fade-out, .comentario.fade-out {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
      }
    </style>
  `);
});

// Añade este código al final de tu archivo foro.js

document.addEventListener('DOMContentLoaded', function() {
  // Inicializar los botones de toggle para comentarios
  const toggleButtons = document.querySelectorAll('.toggle-comentarios');
  
  toggleButtons.forEach(button => {
      button.addEventListener('click', function() {
          const expanded = this.getAttribute('aria-expanded') === 'true';
          const commentContainer = this.closest('.comentarios-seccion').querySelector('.comentarios-contenedor');
          
          if (expanded) {
              // Colapsar comentarios
              commentContainer.style.display = 'none';
              this.setAttribute('aria-expanded', 'false');
          } else {
              // Expandir comentarios
              commentContainer.style.display = 'block';
              this.setAttribute('aria-expanded', 'true');
          }
      });
  });
  
  // Para los nuevos mensajes que se creen dinámicamente
  document.addEventListener('click', function(e) {
      if (e.target && e.target.closest('.toggle-comentarios')) {
          const button = e.target.closest('.toggle-comentarios');
          const expanded = button.getAttribute('aria-expanded') === 'true';
          const commentContainer = button.closest('.comentarios-seccion').querySelector('.comentarios-contenedor');
          
          if (expanded) {
              commentContainer.style.display = 'none';
              button.setAttribute('aria-expanded', 'false');
          } else {
              commentContainer.style.display = 'block';
              button.setAttribute('aria-expanded', 'true');
          }
      }
  });
  
  // Código para manejar el botón de comentar
  const botonesComentarMensaje = document.querySelectorAll('.btn-comentar');
  botonesComentarMensaje.forEach(boton => {
      boton.addEventListener('click', function() {
          const mensajeId = this.getAttribute('data-id');
          const comentariosSeccion = this.closest('.mensaje').querySelector('.comentarios-seccion');
          const toggleButton = comentariosSeccion.querySelector('.toggle-comentarios');
          const comentariosContenedor = comentariosSeccion.querySelector('.comentarios-contenedor');
          
          // Expandir los comentarios si están colapsados
          if (toggleButton.getAttribute('aria-expanded') === 'false') {
              toggleButton.setAttribute('aria-expanded', 'true');
              comentariosContenedor.style.display = 'block';
          }
          
          // Enfocar el área de texto para comentar
          const textareaComentario = comentariosSeccion.querySelector('textarea[name="comentario"]');
          if (textareaComentario) {
              textareaComentario.focus();
          }
      });
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const nuevoMensajeTextarea = document.querySelector('.nuevo-mensaje-section textarea[name="mensaje"]');
  if (nuevoMensajeTextarea) {
    setupCharacterCounter(nuevoMensajeTextarea, 391);
  }

  const nuevoComentarioTextarea = document.querySelector('.nuevo-comentario-section textarea[name="comentario"]');
  if (nuevoComentarioTextarea) {
    setupCharacterCounter(nuevoComentarioTextarea, 391);
  }

  function setupCharacterCounter(textarea, maxLength) {
    textarea.style.paddingBottom = '30px';
    textarea.style.height = '150px';

    let textareaContainer = textarea.parentElement;
    if (!textareaContainer.classList.contains('textarea-container')) {
      textareaContainer = document.createElement('div');
      textareaContainer.classList.add('textarea-container');
      textareaContainer.style.position = 'relative';

      textarea.parentNode.replaceChild(textareaContainer, textarea);
      textareaContainer.appendChild(textarea);
    }

    const contadorDiv = document.createElement('div');
    contadorDiv.classList.add('contador-caracteres');
    contadorDiv.style.position = 'absolute';
    contadorDiv.style.bottom = '10px';
    contadorDiv.style.right = '10px';
    contadorDiv.style.fontSize = '12px';
    contadorDiv.style.color = '#666';
    contadorDiv.style.padding = '2px 5px';
    contadorDiv.style.borderRadius = '3px';

    const contadorActual = document.createElement('span');
    contadorActual.id = 'contador-actual-' + Math.random().toString(36).substr(2, 9);
    contadorActual.textContent = textarea.value.length;

    const separador = document.createTextNode('/');

    const contadorMaximo = document.createElement('span');
    contadorMaximo.id = 'contador-maximo-' + Math.random().toString(36).substr(2, 9);
    contadorMaximo.textContent = maxLength;

    contadorDiv.appendChild(contadorActual);
    contadorDiv.appendChild(separador);
    contadorDiv.appendChild(contadorMaximo);
    textareaContainer.appendChild(contadorDiv);

    contadorActual.textContent = textarea.value.length;

    textarea.addEventListener('input', () => {
      let longitud = textarea.value.length;

      if (longitud > maxLength) {
        textarea.value = textarea.value.substring(0, maxLength);
        longitud = maxLength;
      }

      contadorActual.textContent = longitud;

      if (longitud >= maxLength * 0.9) {
        contadorDiv.style.color = '#d9534f';
        contadorDiv.style.fontWeight = 'bold';
      } else if (longitud >= maxLength * 0.75) {
        contadorDiv.style.color = '#f0ad4e';
        contadorDiv.style.fontWeight = 'normal';
      } else {
        contadorDiv.style.color = '#666';
        contadorDiv.style.fontWeight = 'normal';
      }
    });

    const inputEvent = new Event('input');
    textarea.dispatchEvent(inputEvent);
  }
});
