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
    // Clear community context before redirecting
    localStorage.removeItem('currentCommunityId');
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
        etiquetaHTML = `<span class="etiqueta principal" data-categoria="${mensaje.etiqueta}"><i class="fas fa-tag"></i> ${mensaje.etiqueta}</span>`;
      }
      
      if (mensaje.subcategoria) {
        etiquetaHTML += `<span class="subetiqueta" data-subcategoria="${mensaje.subcategoria}"><i class="fas fa-tag"></i> ${mensaje.subcategoria}</span>`;
      }
      
      if (mensaje.extrasubcategoria) {
        etiquetaHTML += `<span class="subetiqueta extra" data-extrasubcategoria="${mensaje.extrasubcategoria}"><i class="fas fa-tags"></i> ${mensaje.extrasubcategoria}</span>`;
      }
      
      // Determinar si el mensaje pertenece al usuario actual
      const isOwnMessage = (mensaje.user_id && currentUsername && String(mensaje.user_id) === String(currentUsername)) || 
                          (mensaje.autor && currentUsername && mensaje.autor === currentUsername);
      
      // Preparar los botones de editar y eliminar solo si es un mensaje propio
      const botonesAccion = isOwnMessage ? 
        `<button class="btn-editar" data-id="${mensaje.id}"><i class="fas fa-edit"></i></button>
         <button class="btn-eliminar" data-id="${mensaje.id}"><i class="fas fa-trash"></i></button>` : '';
      
      // Preparar los rangos HTML
      const rangosHTML = `
        <div class="rangos-wrapper">
          <div class="rango-item"><span class="rango-valor">${mensaje.rango1 || 'Ninguno'}</span></div>
          <div class="rango-item"><span class="rango-valor">${mensaje.rango2 || 'Ninguno'}</span></div>
          <div class="rango-item"><span class="rango-valor">${mensaje.rango3 || 'Ninguno'}</span></div>
        </div>
      `;
      
      mensajeElement.innerHTML = `
      <div class="mensaje-cabecera">
        <span class="autor">${mensaje.autor}</span>
        <div class="mensaje-acciones">
          ${botonesAccion}
          <button class="btn-comentar" data-id="${mensaje.id}"><i class="fas fa-comment"></i></button>
        </div>
      </div>
      
      <div class="rangos-container">
        <div class="rangos-wrapper">
          ${rangosHTML}
        </div>
      </div>
      
      <div class="etiquetas-container">
        <div class="etiquetas-wrapper">
          ${etiquetaHTML}
        </div>
      </div>
      
      <div class="mensaje-contenido">${mensaje.mensaje}</div>
      ${imagenesHTML}
      
      <div class="mensaje-pie">
        <div class="ranking-container" data-mensaje-id="${mensaje.id}">
          <button class="btn-votar upvote" data-valor="1">
            &#x2191;
          </button>
          <span class="ranking-valor ${mensaje.ranking < 0 ? 'negativo' : ''}">
            ${mensaje.ranking}
          </span>
          <button class="btn-votar downvote" data-valor="-1">
            &#x2193;
          </button>
        </div>
        <span class="fecha mensaje-fecha-pie">${mensaje.fechaStr || mensaje.fecha}</span>
      </div>
    `;
      
  // Añadir el mensaje a la lista primero
    listaMensajes.appendChild(mensajeElement);
    
    // DESPUÉS creamos la sección de comentarios como un elemento separado
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
    
    if (mensaje.comentarios && mensaje.comentarios.length > 0) {
      mensaje.comentarios.forEach(comentario => {
        const comentarioElement = createCommentElement(comentario, mensaje.id, currentUsername);
        comentariosLista.appendChild(comentarioElement);
      });
    }

       comentariosContenedor.appendChild(comentariosLista);
    comentariosSeccion.appendChild(comentariosContenedor);
    
    // Añadir la sección de comentarios DESPUÉS del mensaje
    listaMensajes.appendChild(comentariosSeccion);


      
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
  
  // Modificación de la función createCommentElement para incluir rangos
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
  
    // Preparar HTML para los rangos del comentario
    const rangosComentarioHTML = `
      <div class="rangos-wrapper">
        <div class="rango-item"><span class="rango-valor">${comentario.rango1 || 'Ninguno'}</span></div>
        <div class="rango-item"><span class="rango-valor">${comentario.rango2 || 'Ninguno'}</span></div>
        <div class="rango-item"><span class="rango-valor">${comentario.rango3 || 'Ninguno'}</span></div>
      </div>
    `;
  
    // Estructura HTML del comentario
    comentarioElement.innerHTML = `
      <div class="comentario-cabecera">
        <span class="comentario-autor">${comentario.autor}</span>
        ${rangosComentarioHTML}
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
  
  // Comunidad
  const comunidadSeleccionada = document.querySelector('input[name="comunidad_id"]:checked');
  if (comunidadSeleccionada && comunidadSeleccionada.value) {
    params.append('comunidad_id', comunidadSeleccionada.value);
    // Removed localStorage.setItem('currentCommunityId', comunidadSeleccionada.value);
    console.log(`Setting community filter: ${comunidadSeleccionada.value}`);
  } else {
    // Removed localStorage.removeItem('currentCommunityId');
    console.log('No community filter selected');
  }
  
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
  
  // Extra Subcategorías
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

  const todasComunidadesRadio = document.getElementById('comunidad-todas');
  if (todasComunidadesRadio) {
    todasComunidadesRadio.checked = true;
  }
  // Removed localStorage.removeItem('currentCommunityId');
  
  filterExpanded.forEach(section => section.classList.remove('active'));
  filterButtons.forEach(button => button.classList.remove('active'));

  // Recargar todos los mensajes
  cargarMensajesFiltrados(new URLSearchParams());
});


// Initial loading of messages (with default params)
const initialParams = new URLSearchParams();
// Removed localStorage check for community context
cargarMensajesFiltrados(initialParams);
});












// Second part - Filter application and related functionality
document.addEventListener('DOMContentLoaded', () => {
  const filterForm = document.getElementById('filtro-form');
  const mensajesContainer = document.querySelector('.lista-mensajes');
  const mensajes = document.querySelectorAll('.mensaje');
  const filtrosBusquedaContainer = document.getElementById('filtros-busqueda-container');
  const filtrosAplicadosContainer = document.getElementById('filtros-aplicados-container');
  const filtrosAplicadosTags = document.getElementById('filtros-aplicados-tags');
  const resultadosMensaje = document.getElementById('resultados-filtrados-mensaje');
  
  // Get community ID from various sources
  let comunidadId = getCommunityId();
  

  
  // If community ID exists, apply community context
  if (comunidadId) {
    
    // Add community context to form if needed
    const existingInput = filterForm?.querySelector('input[name="comunidad_id"]');
    if (filterForm && !existingInput) {
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = 'comunidad_id';
      hiddenInput.value = comunidadId;
      filterForm.appendChild(hiddenInput);
    }
    
    // Pre-select community radio button if available
    const communityRadio = document.querySelector(`input[name="comunidad_id"][value="${comunidadId}"]`);
    if (communityRadio) {
      communityRadio.checked = true;
    }
  }
  
  // Set up all filter button handlers
  const setupFilterButtons = () => {
    // Get all filter buttons by their common class
    const allFilterButtons = document.querySelectorAll('.filter-button, [id^="btn-"]');
    const allFilterPanels = document.querySelectorAll('.filtros-expanded');
    
    allFilterButtons.forEach(button => {
      // Remove any existing event listeners first to prevent duplicates
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // Add new event listener
      newButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Determine the target panel
        let targetPanel;
        if (this.getAttribute('data-target')) {
          targetPanel = document.getElementById(this.getAttribute('data-target'));
        } else if (this.id === 'btn-comunidad') {
          targetPanel = document.getElementById('filtros-comunidad');
        } else if (this.id === 'btn-etiquetas') {
          targetPanel = document.getElementById('filtros-etiquetas');
        } else if (this.id === 'btn-subetiquetas') {
          targetPanel = document.getElementById('filtros-subetiquetas');
        } else if (this.id === 'btn-orden') {
          targetPanel = document.getElementById('filtros-orden');
        } else if (this.id === 'btn-ranking') {
          targetPanel = document.getElementById('filtros-ranking');
        } else if (this.id === 'btn-tipo') {
          targetPanel = document.getElementById('filtros-tipo');
        }
        
        if (targetPanel) {
          // Close all other panels first
          allFilterPanels.forEach(panel => {
            if (panel !== targetPanel) {
              panel.style.display = 'none';
            }
          });
          
          // Toggle this panel
          targetPanel.style.display = targetPanel.style.display === 'block' ? 'none' : 'block';
        }
      });
    });
  };
  
  // Call this setup function to ensure all buttons are configured
  setupFilterButtons();
  


  // Listen for form submission
  if (filterForm) {
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      aplicarFiltros();
      
      // Hide all filter panels after form submission
      document.querySelectorAll('.filtros-expanded').forEach(panel => {
        panel.style.display = 'none';
      });
    });
  }

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

  
  // Display applied filters as tags
  function mostrarFiltrosAplicados(etiquetas, orden, ranking, tipo, comunidadId) {
      const filtrosAplicados = [
          ...etiquetas.map(etiqueta => `Etiqueta: ${etiqueta}`),
          `Orden: ${obtenerTextoOrden(orden)}`,
          `Ranking: ${obtenerTextoRanking(ranking)}`,
          `Tipo: ${obtenerTextoTipo(tipo)}`
      ];
      
      // Add community filter tag if selected
      if (comunidadId && comunidadId !== '') {
          const comunidadNombre = obtenerNombreComunidad(comunidadId);
          filtrosAplicados.push(`Comunidad: ${comunidadNombre}`);
      }

      filtrosAplicados.forEach(filtro => {
          const tagElement = document.createElement('div');
          tagElement.className = 'filtro-tag';
          tagElement.innerHTML = `
              ${filtro}
              <span class="remove-tag">&times;</span>
          `;
          tagElement.querySelector('.remove-tag').addEventListener('click', () => {
              tagElement.remove();
              // Reset specific filter if it's a community filter
              if (filtro.startsWith('Comunidad:')) {
                  const todasComunidadesRadio = document.getElementById('comunidad-todas');
                  if (todasComunidadesRadio) {
                      todasComunidadesRadio.checked = true;
                  }
                  localStorage.removeItem('currentCommunityId');
                  aplicarFiltros();
              }
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
  
  // Obtener el nombre de la comunidad basado en su ID
  function obtenerNombreComunidad(comunidadId) {
      const comunidadElement = document.querySelector(`input[name="comunidad_id"][value="${comunidadId}"]`);
      if (comunidadElement && comunidadElement.parentElement) {
          const label = comunidadElement.parentElement.textContent.trim();
          return label;
      }
      return `Comunidad ${comunidadId}`;
  }

// Obtener IDs de mis comunidades (simulado)
function getMisComunidadesIds() {
  // En un caso real, esto podría ser obtenido de una API o del estado del usuario
  // Por ahora, devolvemos un array vacío o hardcodeado para pruebas
  return localStorage.getItem('misComunidadesIds') ? 
      JSON.parse(localStorage.getItem('misComunidadesIds')) : 
      [];
}

// Helper para obtener ID de comunidad desde varios orígenes
function getCommunityId() {
  const path = window.location.pathname.split('/');
  // Check URL path for community ID
  if (path[1] === 'foro' && path[2]) {
      return path[2];
  }
  // Check query params for community ID
  const urlParams = new URLSearchParams(location.search);
  const communityParam = urlParams.get('comunidad_id');
  if (communityParam) {
      return communityParam;
  }
  return null;
}
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

function createConfetti(milestone) {
  // Determinar si debemos mostrar confeti normal o monedas de Mario
  const showMarioCoins = milestone % 100 === 0 && milestone > 0;
  
  // Creamos un contenedor para el confeti a pantalla completa
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  document.body.appendChild(confettiContainer);
  
  // Número total de fichas/confeti a crear
  const totalElements = 200;
  
  // Dividir la pantalla en secciones para asegurar distribución uniforme
  const numColumns = 20; // Dividimos horizontalmente en 20 secciones
  const numRows = 40;   // Dividimos verticalmente en 5 filas iniciales
  
  // Variables para rastrear la duración máxima
  let maxDuration = 0;
  let maxDelay = 0;
  
  if (showMarioCoins) {
    // Crear monedas de Mario Bros distribuidas por toda la pantalla
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numColumns; col++) {
        // Calcular cuántas monedas crear por cada celda para alcanzar aproximadamente totalElements
        const coinsPerCell = Math.ceil(totalElements / (numColumns * numRows));
        
        for (let i = 0; i < coinsPerCell; i++) {
          const coin = document.createElement('div');
          coin.className = 'mario-coin confetti';
          
          // Posicionamiento por toda la pantalla:
          // Base horizontal: distribuir en columnas + variación aleatoria
          const baseX = (col / numColumns) * 100;
          const randomOffsetX = (Math.random() * (100/numColumns)) - (50/numColumns);
          coin.style.left = (baseX + randomOffsetX) + '%';
          
          // Posición vertical: distribuir en distintas "alturas" iniciales fuera de la pantalla
          // Algunas monedas empiezan arriba (-10% a -30%) para caer gradualmente
          const startY = -30 + (row * 5) + (Math.random() * 20);
          coin.style.top = startY + '%';
          
          // Desplazamiento aleatorio durante la caída
          const horizontalOffset = (Math.random() - 0.5) * 150;
          coin.style.setProperty('--horizontal-offset', horizontalOffset + 'px');
          
          // Colores dorados para las monedas
          const goldColors = ['#FFD700', '#FFDF00', '#F0E68C', '#DAA520', '#FFC000'];
          coin.style.backgroundColor = goldColors[Math.floor(Math.random() * goldColors.length)];
          
          // Tamaños variados para las monedas
          const size = Math.random() * 15 + 10;
          coin.style.width = size + 'px';
          coin.style.height = size + 'px';
          
          // Forma circular para las monedas
          coin.style.borderRadius = '50%';
          
          // Borde para dar efecto de moneda
          coin.style.border = '2px solid rgba(218, 165, 32, 0.8)';
          
          // Añadir símbolo $ en el centro
          coin.innerHTML = `<span style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #8B4513;
            font-weight: bold;
            font-size: ${size * 0.6}px;
          ">$</span>`;
          
          // Velocidades variadas
          const duration = Math.random() * 3 + 3;
          // Retrasos aleatorios para que no aparezcan todas a la vez
          const delay = Math.random() * 3;
          coin.style.animationDelay = delay + 's';
          coin.style.animationDuration = duration + 's';
          
          // Actualizar máximos para calcular la duración total
          maxDuration = Math.max(maxDuration, duration);
          maxDelay = Math.max(maxDelay, delay);
          
          // Añadir al contenedor
          confettiContainer.appendChild(coin);
        }
      }
    }
  } else {
    // Confeti normal distribuido por toda la pantalla
    const colors = ['#FFD700', '#FF4500', '#9370DB', '#32CD32', '#00BFFF', '#FF69B4', '#FF6347'];
    
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numColumns; col++) {
        // Calcular confeti por celda
        const confettiPerCell = Math.ceil(totalElements / (numColumns * numRows));
        
        for (let i = 0; i < confettiPerCell; i++) {
          const confetti = document.createElement('div');
          confetti.className = 'confetti';
          
          // Formas variadas
          const shape = Math.random() > 0.6 ? 'circle' : Math.random() > 0.5 ? 'square' : 'rectangle';
          
          // Distribuir horizontalmente por toda la pantalla
          const baseX = (col / numColumns) * 100;
          const randomOffsetX = (Math.random() * (100/numColumns)) - (50/numColumns);
          confetti.style.left = (baseX + randomOffsetX) + '%';
          
          // Distribuir verticalmente en diferentes puntos de inicio
          const startY = -30 + (row * 5) + (Math.random() * 20);
          confetti.style.top = startY + '%';
          
          // Color aleatorio
          confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          
          // Desplazamiento aleatorio durante la caída
          const horizontalOffset = (Math.random() - 0.5) * 150;
          confetti.style.setProperty('--horizontal-offset', horizontalOffset + 'px');
          
          // Tamaños variados
          const size = Math.random() * 12 + 5;
          confetti.style.width = size + 'px';
          confetti.style.height = shape === 'rectangle' ? size * 1.5 + 'px' : size + 'px';
          
          // Formas diferentes
          confetti.style.borderRadius = shape === 'circle' ? '50%' : '0';
          
          // Velocidades variadas
          const duration = Math.random() * 3 + 3;
          const delay = Math.random() * 3;
          confetti.style.animationDelay = delay + 's';
          confetti.style.animationDuration = duration + 's';
          
          // Actualizar máximos para calcular la duración total
          maxDuration = Math.max(maxDuration, duration);
          maxDelay = Math.max(maxDelay, delay);
          
          // Rotación aleatoria
          confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
          
          confettiContainer.appendChild(confetti);
        }
      }
    }
  }
  
  // Calculamos el tiempo total basado en la duración máxima y el delay máximo
  // Convertimos segundos a milisegundos para setTimeout
  const totalAnimationTime = (maxDelay + maxDuration) * 1000;
  
  // Eliminamos el confeti después de que termine la animación,
  // agregando un pequeño margen para asegurar que todas las animaciones completen
  setTimeout(() => {
    confettiContainer.remove();
  }, totalAnimationTime + 200); // Añadimos 200ms como margen de seguridad
  
  return confettiContainer;
}

// Función modificada para el frontend que muestra la recompensa
function showStarReward(coins, milestone, type, bonusAwarded) {
  // Crear overlay para oscurecer el fondo y bloquear interacciones
  const overlay = document.createElement('div');
  overlay.className = 'star-reward-overlay';
  document.body.appendChild(overlay);
  
  // Crear confeti a pantalla completa - ahora pasamos el milestone
  createConfetti(milestone);
  
  // Crear el contenedor principal de la notificación
  const notification = document.createElement('div');
  notification.className = 'star-reward-notification';
  
  // Personalizar mensaje según el tipo de recompensa
  let rewardTitle = '¡RECOMPENSA!';
  let milestoneText;
  
  // Adaptar mensaje según el tipo de actividad
  if (type === 'post') {
    // Recompensa por publicaciones
    milestoneText = `Por alcanzar ${milestone} publicaciones`;
    if (bonusAwarded && milestone % 100 === 0) {
      rewardTitle = '¡SUPER RECOMPENSA!';
      milestoneText = `¡Felicidades por alcanzar ${milestone} publicaciones!`;
    }
  } 
  else if (type === 'comment') {
    // Recompensa por comentarios
    milestoneText = `Por alcanzar ${milestone} comentarios`;
    if (bonusAwarded && milestone % 100 === 0) {
      rewardTitle = '¡SUPER RECOMPENSA!';
      milestoneText = `¡Felicidades por alcanzar ${milestone} comentarios!`;
    }
  }
  else if (type === 'vote') {
    // Recompensa por votos
    milestoneText = `Por alcanzar ${milestone} votos`;
    if (bonusAwarded && milestone % 100 === 0) {
      rewardTitle = '¡SUPER RECOMPENSA!';
      milestoneText = `¡Felicidades por alcanzar ${milestone} votos!`;
    }
  }
  
  // Crear el HTML para la estrella y el mensaje
  notification.innerHTML = `
  <div class="star-container">
    <div class="reward-title">${rewardTitle}</div>
    <div class="star"></div>
    <div class="star-inner">
      <div class="coins-amount">${coins} Ficha${coins > 1 ? 's' : ''}</div>
      <div class="milestone-text">${milestoneText}</div>
    </div>
  </div>
  `;
  
  // Añadir al documento
  document.body.appendChild(notification);
  
  // Mostrar la notificación y el overlay gradualmente
  requestAnimationFrame(() => {
    overlay.style.display = 'block';
    notification.style.display = 'block';
    
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 50);
  });
  
  // Cerrar automáticamente después de 5 segundos
  const animationDuration = 5000;
  setTimeout(() => {
    notification.style.opacity = '0';
    overlay.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
      overlay.remove();
    }, 1000);
  }, animationDuration);
}

// Las demás funciones permanecen igual
function checkForRewards() {
  fetch('/check-rewards')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.hasReward) {
        const { coins, milestone, type, bonusAwarded } = data.notification;
        showStarReward(coins, milestone, type, bonusAwarded);
      }
    })
    .catch(error => console.error('Error checking rewards:', error));
}

document.addEventListener('DOMContentLoaded', function() {
  checkForRewards();
  setInterval(checkForRewards, 10000);
});


































document.addEventListener('DOMContentLoaded', async () => {
  // Get the community ID from various possible sources
  let comunidadId = getCommunityId();
  
  // Check if we're on the main forum page without community context
  const isMainForumPage = window.location.pathname === '/foro' && !window.location.search.includes('comunidad_id');
  
  // Handle main forum page display
  if (isMainForumPage) {
    localStorage.removeItem('currentCommunityId');
    // Show main forum header
    document.getElementById('main-forum-header')?.style.setProperty('display', 'block');
    // Hide community header
    document.getElementById('community-header')?.style.setProperty('display', 'none');
    // Remove community context class from container
    document.querySelector('.container')?.classList.remove('community-context');
    return; // Exit early
  }
  
  // If we don't have a community ID in the URL, check localStorage
  if (!comunidadId) {
    comunidadId = localStorage.getItem('currentCommunityId');
  }
  
  // If we still don't have a community ID, exit early
  if (!comunidadId) return;
  
  // Store the community ID for persistence across page navigation
  localStorage.setItem('currentCommunityId', comunidadId);
  
  // Add community context class
  document.querySelector('.container')?.classList.add('community-context');
  
  // Hide main forum header and show community header
  document.getElementById('main-forum-header')?.style.setProperty('display', 'none');
  document.getElementById('community-header')?.style.setProperty('display', 'block');

  try {
    const res = await fetch(`/api/comunidad/${comunidadId}`);
    if (!res.ok) throw new Error();
    const c = await res.json();

    // Update page with community info
    document.getElementById('community-title').textContent = c.nombre;
    document.getElementById('community-description').textContent = c.descripcion || 'Esta comunidad no tiene descripción.';
    document.getElementById('community-category').textContent = c.categoria || '';
    document.getElementById('community-subcategory').textContent = c.subcategoria || '';
    document.getElementById('community-subcategory-extra').textContent = c.subcategoria_extra || '';

    const banner = document.getElementById('community-banner-image');
    banner.style.backgroundImage = c.imagen_url ? `url(${c.imagen_url})` : '';
    if (!c.imagen_url) banner.innerHTML = createSVGBackground(c.id);

    const reglas = document.getElementById('community-rules');
    reglas.innerHTML = c.reglas?.trim() || '<p class="no-rules">Esta comunidad no tiene reglas definidas.</p>';

    // Load community stats
    const stats = await fetch(`/api/comunidad/${c.id}/stats`).then(r => r.json()).catch(() => ({ members: 0, posts: 0 }));
    document.getElementById('community-members').textContent = stats.members;
    document.getElementById('community-posts').textContent = stats.posts;

    // Check if user is member
    const isMember = await fetch(`/api/comunidad/${c.id}/is-member`).then(r => r.json()).then(d => d.isMember).catch(() => false);
    const joinBtn = document.getElementById('btn-join-community');
    if (joinBtn) {
      joinBtn.textContent = isMember ? 'Miembro' : 'Unirse a la comunidad';
      joinBtn.classList.toggle('is-member', isMember);
      joinBtn.disabled = isMember;
      if (!isMember) joinBtn.onclick = () => joinCommunity(c.id);
    }

    // Add community parameter to all internal links
    addCommunityParamToLinks(c.id);

    // Add hidden input to the form for community ID
    const messageForm = document.getElementById('mensaje-form');
    if (messageForm) {
      // Remove any existing community_id input first to avoid duplicates
      const existingInput = messageForm.querySelector('input[name="comunidad_id"]');
      if (existingInput) existingInput.remove();
      
      // Add the new hidden input
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = 'comunidad_id';
      hiddenInput.value = c.id;
      messageForm.appendChild(hiddenInput);
    }

    // Also add to the comentario form if it exists
    const commentForm = document.getElementById('comentario-form');
    if (commentForm) {
      // Remove any existing community_id input first
      const existingInput = commentForm.querySelector('input[name="comunidad_id"]');
      if (existingInput) existingInput.remove();
      
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = 'comunidad_id';
      hiddenInput.value = c.id;
      commentForm.appendChild(hiddenInput);
    }

    preSelectOptions(c);
  } catch (error) {
    console.error('Error cargando datos de la comunidad:', error);
  }
});

// Helper function to get community ID from various sources
function getCommunityId() {
  const path = window.location.pathname.split('/');
  // Check URL path for community ID
  if (path[1] === 'foro' && path[2]) {
    return path[2];
  }
  // Check query params for community ID
  const urlParams = new URLSearchParams(location.search);
  const communityParam = urlParams.get('comunidad_id');
  if (communityParam) {
    return communityParam;
  }
  return null;
}

// Add community parameter to all internal links to maintain context
function addCommunityParamToLinks(communityId) {
  const internalLinks = document.querySelectorAll('a[href^="/"]');
  internalLinks.forEach(link => {
    // Skip links that already have the community parameter or are to the community page itself
    if (link.href.includes('comunidad_id=') || link.href.includes(`/foro/${communityId}`)) {
      return;
    }
    
    // Skip links to the main forum page to allow exiting community context
    if (link.href.endsWith('/foro')) {
      return;
    }
    
    const url = new URL(link.href);
    // Don't modify logout, profile, etc. links
    if (!url.pathname.startsWith('/foro') && !url.pathname.startsWith('/crear-post')) {
      return;
    }
    
    // Add community ID parameter
    url.searchParams.set('comunidad_id', communityId);
    link.href = url.toString();
  });
  
  // Also handle form actions to maintain context
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    if (!form.action || form.action.includes('comunidad_id=')) return;
    
    // Skip adding to the filtrar form as it's handled separately
    if (form.id === 'filter-form') return;
    
    // Remove any existing community_id input first
    const existingInput = form.querySelector('input[name="comunidad_id"]');
    if (existingInput) existingInput.remove();
    
    // Add hidden input with community ID
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'comunidad_id';
    hiddenInput.value = communityId;
    form.appendChild(hiddenInput);
  });
  
  // Specially handle the filter form to add community context
  const filterForm = document.getElementById('filter-form');
  if (filterForm) {
    const existingInput = filterForm.querySelector('input[name="comunidad_id"]');
    if (existingInput) existingInput.remove();
    
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'comunidad_id';
    hiddenInput.value = communityId;
    filterForm.appendChild(hiddenInput);
  }
}

function createSVGBackground(id) {
  return `<svg class="svg-bg" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#3d0099;stop-opacity:0.8"/><stop offset="100%" style="stop-color:#6f42ff;stop-opacity:0.6"/></linearGradient><pattern id="pat${id}" width="50" height="50" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="12" fill="rgba(0,234,255,0.15)"/></pattern></defs><rect width="100%" height="100%" fill="url(#grad${id})"/><rect width="100%" height="100%" fill="url(#pat${id})"/></svg>`;
}

function joinCommunity(id) {
  fetch(`/api/comunidad/${id}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        const btn = document.getElementById('btn-join-community');
        btn.textContent = 'Miembro';
        btn.classList.add('is-member');
        btn.disabled = true;
        const count = document.getElementById('community-members');
        count.textContent = parseInt(count.textContent) + 1;
      }
    })
    .catch(() => alert('No se pudo unir a la comunidad.'));
}

function preSelectOptions(comunidad) {
  // Si estamos en la página de crear nuevo post, preseleccionamos las categorías según la comunidad
  const categoriaSelect = document.getElementById('categoria');
  const subcategoriaSelect = document.getElementById('subcategoria');
  const subcategoriaExtraSelect = document.getElementById('extrasubcategoria');
  
  if (!categoriaSelect || !subcategoriaSelect) return;
  
  // Implementar la lógica para preseleccionar las opciones basadas en la comunidad
  if (comunidad.categoria) {
    for (let i = 0; i < categoriaSelect.options.length; i++) {
      if (categoriaSelect.options[i].value === comunidad.categoria) {
        categoriaSelect.selectedIndex = i;
        break;
      }
    }
    
    // Cargar las subcategorías basadas en la categoría seleccionada
    fetch(`/subcategorias/${comunidad.categoria}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Poblar el select de subcategorías
          subcategoriaSelect.innerHTML = '';
          data.subcategorias.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subcategoriaSelect.appendChild(option);
          });
          
          // Seleccionar la subcategoría de la comunidad si existe
          if (comunidad.subcategoria) {
            for (let i = 0; i < subcategoriaSelect.options.length; i++) {
              if (subcategoriaSelect.options[i].value === comunidad.subcategoria) {
                subcategoriaSelect.selectedIndex = i;
                break;
              }
            }
            
            // Cargar las extrasubcategorías si hay una subcategoría seleccionada
            if (comunidad.subcategoria !== 'Ninguna') {
              fetch(`/extrasubcategorias/${comunidad.subcategoria}`)
                .then(res => res.json())
                .then(data => {
                  if (data.success && subcategoriaExtraSelect) {
                    // Poblar el select de extrasubcategorías
                    subcategoriaExtraSelect.innerHTML = '';
                    data.extrasubcategorias.forEach(extra => {
                      const option = document.createElement('option');
                      option.value = extra;
                      option.textContent = extra;
                      subcategoriaExtraSelect.appendChild(option);
                    });
                    
                    // Seleccionar la extrasubcategoría de la comunidad si existe
                    if (comunidad.subcategoria_extra) {
                      for (let i = 0; i < subcategoriaExtraSelect.options.length; i++) {
                        if (subcategoriaExtraSelect.options[i].value === comunidad.subcategoria_extra) {
                          subcategoriaExtraSelect.selectedIndex = i;
                          break;
                        }
                      }
                    }
                  }
                })
                .catch(err => console.error('Error cargando extrasubcategorías:', err));
            }
          }
        }
      })
      .catch(err => console.error('Error cargando subcategorías:', err));
  }
}

// Función para manejar el toggle de los acordeones
function toggleAccordion(element) {
  const content = element.nextElementSibling;
  const icon = element.querySelector('.accordion-icon');
  
  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    icon.classList.remove('fa-chevron-down');
    icon.classList.add('fa-chevron-up');
  } else {
    content.style.display = 'none';
    icon.classList.remove('fa-chevron-up');
    icon.classList.add('fa-chevron-down');
  }
}
































document.addEventListener('DOMContentLoaded', function() {
  // Load subcategories when a main category is selected
  const etiquetaSelect = document.getElementById('etiqueta-comentario');
  const subcategoriaSelect = document.getElementById('subcategoria-comentario');
  const extrasubcategoriaSelect = document.getElementById('extrasubcategoria-comentario');
  
  if (etiquetaSelect) {
    etiquetaSelect.addEventListener('change', function() {
      const selectedEtiqueta = this.value;
      console.log('Selected main category:', selectedEtiqueta);
      
      // Reset subcategories dropdown
      subcategoriaSelect.innerHTML = '<option value="">Seleccione subcategoría</option>';
      extrasubcategoriaSelect.innerHTML = '<option value="">Seleccione subcategoría extra</option>';
      
      if (selectedEtiqueta) {
        // Fetch subcategories for the selected main category
        fetch(`/subcategorias/${encodeURIComponent(selectedEtiqueta)}`)
          .then(response => response.json())
          .then(data => {
            console.log('Received subcategories:', data);
            
            if (data.success && data.subcategorias) {
              data.subcategorias.forEach(subcat => {
                const option = document.createElement('option');
                option.value = subcat;
                option.textContent = subcat;
                subcategoriaSelect.appendChild(option);
              });
            } else {
              console.error('Failed to load subcategories:', data.error);
            }
          })
          .catch(error => {
            console.error('Error fetching subcategories:', error);
          });
      }
    });
  }
  
  // Load extra subcategories when a subcategory is selected
  if (subcategoriaSelect) {
    subcategoriaSelect.addEventListener('change', function() {
      const selectedSubcategoria = this.value;
      console.log('Selected subcategory:', selectedSubcategoria);
      
      // Reset extra subcategories dropdown
      extrasubcategoriaSelect.innerHTML = '<option value="">Seleccione subcategoría extra</option>';
      
      if (selectedSubcategoria) {
        // Fetch extra subcategories for the selected subcategory
        fetch(`/extrasubcategorias/${encodeURIComponent(selectedSubcategoria)}`)
          .then(response => response.json())
          .then(data => {
            console.log('Received extra subcategories:', data);
            
            if (data.success && data.extrasubcategorias) {
              data.extrasubcategorias.forEach(extrasubcat => {
                const option = document.createElement('option');
                option.value = extrasubcat;
                option.textContent = extrasubcat;
                extrasubcategoriaSelect.appendChild(option);
              });
            } else {
              console.error('Failed to load extra subcategories:', data.error);
            }
          })
          .catch(error => {
            console.error('Error fetching extra subcategories:', error);
          });
      }
    });
  }
  
  // Code for filter checkboxes
  const etiquetasFilters = document.querySelectorAll('input[name="etiquetas"]');
  if (etiquetasFilters.length > 0) {
    etiquetasFilters.forEach(checkbox => {
 
    });
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // Initialize category selection handlers
  initCategorySelectors();
  
  initFilterCategories();
  
  // Validar estructura de categorías
  validateCategoryStructure();
});


// Function to load extrasubcategories based on the main category
// and filter out the selected subcategory
function loadExtraSubcategories(category) {
  const subcategorySelect = document.getElementById('subcategoria-comentario');
  const extraSubcategorySelect = document.getElementById('extrasubcategoria-comentario');
  
  if (!extraSubcategorySelect) {
    console.error('Extra subcategory select element not found');
    return;
  }
  
  // Reset extra subcategory dropdown
  extraSubcategorySelect.innerHTML = '<option value="">Cargando subcategorías extras...</option>';
  
  if (!category || category === 'Ninguna' || category === '') {
    extraSubcategorySelect.innerHTML = '<option value="">Seleccione subcategoría extra</option>';
    return;
  }
  
  console.log(`Solicitando subcategorías extras para la categoría principal: "${category}"`);
  
  // Use the same endpoint but duplicate it for extrasubcategories
  const url = `/subcategorias/${encodeURIComponent(category)}`;
  console.log('URL de solicitud para extrasubcategorías:', url);
  
  fetch(url)
    .then(response => {
      console.log('Estado de respuesta para extrasubcategorías:', response.status);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Respuesta completa recibida para extrasubcategorías:', data);
      if (data.success) {
        // Populate extra subcategory dropdown
        extraSubcategorySelect.innerHTML = '<option value="">Seleccione subcategoría extra</option>';
        
        if (data.subcategorias && data.subcategorias.length > 0) {
          // Get current selected subcategory to filter it out
          const selectedSubcategory = subcategorySelect.value;
          console.log(`Se cargarán opciones para subcategorías extras, excluyendo "${selectedSubcategory}"`);
          
          data.subcategorias.forEach(extraSubcategoria => {
            // Skip adding the option if it matches the selected subcategory
            if (extraSubcategoria !== selectedSubcategory) {
              const option = document.createElement('option');
              option.value = extraSubcategoria;
              option.textContent = extraSubcategoria;
              extraSubcategorySelect.appendChild(option);
            }
          });
        } else {
          console.warn('No se encontraron opciones para subcategorías extras');
          extraSubcategorySelect.innerHTML = '<option value="">No hay opciones disponibles</option>';
        }
      } else {
        console.error('Error loading extra subcategories:', data.error);
        extraSubcategorySelect.innerHTML = '<option value="">Error al cargar opciones</option>';
      }
    })
    .catch(error => {
      console.error('Error fetching extra subcategories:', error);
      extraSubcategorySelect.innerHTML = '<option value="">Error al cargar opciones</option>';
    });
}
function initCategorySelectors() {
  // Main category selector for new posts
  const mainCategorySelect = document.getElementById('etiqueta-comentario');
  const subcategorySelect = document.getElementById('subcategoria-comentario');
  const extraSubcategorySelect = document.getElementById('extrasubcategoria-comentario');
  
  if (!mainCategorySelect || !subcategorySelect || !extraSubcategorySelect) {
      console.error('Category selectors not found');
      return;
  }
  
  // Set default values
  subcategorySelect.innerHTML = '<option value="">Seleccione subcategoría</option>';
  extraSubcategorySelect.innerHTML = '<option value="">Seleccione subcategoría extra</option>';
  
  // Log to verify event listeners are being attached
  console.log('Configurando event listeners para selectores de categorías');
  
  // Event listener for main category change
  mainCategorySelect.addEventListener('change', function() {
      const selectedCategory = this.value;
      console.log('Categoría seleccionada:', selectedCategory);
      
      // Load subcategories based on the main category
      loadSubcategories(selectedCategory);
  });
  
  // Add event listener for subcategory change to update extrasubcategories
  subcategorySelect.addEventListener('change', function() {
      const selectedMainCategory = mainCategorySelect.value;
      console.log('Subcategoría seleccionada:', this.value);
      
      // Reload extrasubcategories to filter out the selected subcategory
      loadExtraSubcategories(selectedMainCategory);
  });
}


// Function to load all subcategories for filtering, regardless of parent category
function loadAllSubcategories() {
  const subetiquetasGrid = document.getElementById('subetiquetas-grid');
  if (!subetiquetasGrid) return;
  
  console.log('Loading all subcategories for independent filtering');
  
  // Reset the subcategories grid but keep the "Ninguna" option if it exists
  const initialOption = subetiquetasGrid.querySelector('.initial-option');
  subetiquetasGrid.innerHTML = '';
  if (initialOption) subetiquetasGrid.appendChild(initialOption);
  
  // Fetch all subcategories from the server
  fetch('/todas-subcategorias')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.subcategorias) {
        console.log(`Loaded ${data.subcategorias.length} subcategories from all categories`);
        
        // Sort subcategories alphabetically
        const sortedSubcategorias = data.subcategorias.sort();
        
        // Add each subcategory as a filter option
        sortedSubcategorias.forEach(subcat => {
          if (subcat !== 'Ninguna') {
            const filterItem = document.createElement('div');
            filterItem.className = 'filtro-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `filtro-${subcat.toLowerCase().replace(/\s+/g, '-')}`;
            checkbox.name = 'subetiquetas-global';
            checkbox.value = subcat;
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = subcat;
            
            filterItem.appendChild(checkbox);
            filterItem.appendChild(label);
            subetiquetasGrid.appendChild(filterItem);
          }
        });
        
        // Add event listeners to the new checkboxes
        subetiquetasGrid.querySelectorAll('input[name="subetiquetas-global"]').forEach(checkbox => {
          checkbox.addEventListener('change', function() {
            console.log(`Subcategory filter "${this.value}" ${this.checked ? 'selected' : 'deselected'}`);
            // Trigger filter application when a subcategory is selected
            if (typeof aplicarFiltros === 'function') {
              aplicarFiltros();
            }
          });
        });
      } else {
        console.error('Failed to load all subcategories:', data.error || 'Unknown error');
      }
    })
    .catch(error => {
      console.error('Error fetching all subcategories:', error);
    });
}

// Create a new endpoint on the server to get all subcategories
// This would be implemented on the server-side, but here's how to use it:
function setupIndependentFiltering() {
  document.addEventListener('DOMContentLoaded', () => {
    // Load all subcategories when the page loads
    loadAllSubcategories();
    
    // Modify the existing filter application function to work with our new independent subcategory filters
    const originalAplicarFiltros = window.aplicarFiltros || function() {};
    
    window.aplicarFiltros = function() {
      // Get selected subcategories from our new global subcategory filters
      const subetiquetasSeleccionadasGlobal = Array.from(
        document.querySelectorAll('input[name="subetiquetas-global"]:checked')
      ).map(el => el.value);
      
      console.log('Selected subcategories (global):', subetiquetasSeleccionadasGlobal);
      
      // Get all messages
      const mensajes = document.querySelectorAll('.mensaje');
      
      // Get other filter values (from the original function)
      const etiquetasSeleccionadas = Array.from(
        document.querySelectorAll('input[name="etiquetas"]:checked')
      ).map(el => el.value);
      
      const ordenSelect = document.getElementById('orden');
      const rankingSelect = document.getElementById('ranking');
      const tipoSelect = document.getElementById('tipo');
      
      const orden = ordenSelect ? ordenSelect.value : 'recientes';
      const ranking = rankingSelect ? rankingSelect.value : 'todos';
      const tipo = tipoSelect ? tipoSelect.value : 'todos';
      
      // Community Filter - Get selected community
      const comunidadSeleccionada = document.querySelector('input[name="comunidad_id"]:checked');
      let comunidadId = comunidadSeleccionada ? comunidadSeleccionada.value : null;
      
      // Check if "Mis comunidades" is checked
      const misComunidadesCheckbox = document.getElementById('mis-comunidades-checkbox');
      const filtrarPorMisComunidades = misComunidadesCheckbox && misComunidadesCheckbox.checked;
      
      // Apply filters
      let mensajesFiltrados = Array.from(mensajes).filter(mensaje => {
        // Original category filter
        const etiquetaMensaje = mensaje.querySelector('.etiqueta');
        const etiquetaValida = etiquetasSeleccionadas.length === 0 || 
          (etiquetaMensaje && etiquetasSeleccionadas.includes(etiquetaMensaje.textContent.trim()));
        
        // New independent subcategory filter
        let subcategoriaValida = true;
        if (subetiquetasSeleccionadasGlobal.length > 0) {
          const subcategoriaMensaje = mensaje.querySelector('.subetiqueta:not(.extra)');
          const extraSubcategoriaMensaje = mensaje.querySelector('.subetiqueta.extra');
          
          subcategoriaValida = 
            (subcategoriaMensaje && subetiquetasSeleccionadasGlobal.includes(subcategoriaMensaje.textContent.trim())) ||
            (extraSubcategoriaMensaje && subetiquetasSeleccionadasGlobal.includes(extraSubcategoriaMensaje.textContent.trim()));
        }
        
        // Rest of the original filter logic...
        // Ranking filter
        const rankingElement = mensaje.querySelector('.ranking-valor');
        let rankingValor = 0;
        if (rankingElement) {
          rankingValor = parseInt(rankingElement.textContent);
        }
        
        let rankingValido = true;
        switch(ranking) {
          case 'populares':
            rankingValido = rankingValor > 100;
            break;
          case 'medios':
            rankingValido = rankingValor > 10 && rankingValor <= 100;
            break;
          case 'menos_populares':
            rankingValido = rankingValor <= 10;
            break;
        }
        
        // Message type filter
        const autorElement = mensaje.querySelector('.autor');
        const autorMensaje = autorElement ? autorElement.textContent.trim() : '';
        const currentUser = getCurrentUser();
        let tipoValido = true;
        
        if (tipo === 'mios') {
          tipoValido = autorMensaje === currentUser;
        }
        
        // Community filter
        let comunidadValida = true;
        
        if (comunidadId && comunidadId !== '') {
          const mensajeComunidadId = mensaje.getAttribute('data-comunidad-id');
          comunidadValida = mensajeComunidadId === comunidadId;
        }
        
        // Filter by "My communities"
        if (filtrarPorMisComunidades) {
          const mensajeComunidadId = mensaje.getAttribute('data-comunidad-id');
          const misComunidadesIds = getMisComunidadesIds();
          comunidadValida = misComunidadesIds.includes(mensajeComunidadId);
        }
        
        return etiquetaValida && subcategoriaValida && rankingValido && tipoValido && comunidadValida;
      });
      
      // Apply sorting as in the original function
      const ahora = new Date();
      const treintaMinutosAtras = new Date(ahora - 30 * 60 * 1000);
      const unaSemanaAtras = new Date(ahora - 7 * 24 * 60 * 60 * 1000);
      const unDiaAtras = new Date(ahora - 24 * 60 * 60 * 1000);
      
      switch(orden) {
        case 'recientes':
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
          mensajesFiltrados = mensajesFiltrados.filter(mensaje => {
            const rankingValor = parseInt(mensaje.querySelector('.ranking-valor').textContent);
            return rankingValor > 100;
          });
          mensajesFiltrados.sort((a, b) => {
            const rankingA = parseInt(a.querySelector('.ranking-valor').textContent);
            const rankingB = parseInt(b.querySelector('.ranking-valor').textContent);
            return rankingB - rankingA;
          });
          break;
        default:
          mensajesFiltrados.sort((a, b) => {
            const fechaA = new Date(a.querySelector('.fecha').textContent);
            const fechaB = new Date(b.querySelector('.fecha').textContent);
            return fechaB - fechaA;
          });
      }
      
      // Hide/show messages based on filters
      mensajes.forEach(mensaje => mensaje.style.display = 'none');
      mensajesFiltrados.forEach(mensaje => mensaje.style.display = 'block');
      
      // Show message if no results
      const resultadosMensaje = document.getElementById('resultados-filtrados-mensaje');
      if (resultadosMensaje) {
        resultadosMensaje.style.display = mensajesFiltrados.length === 0 ? 'block' : 'none';
      }
      
      // Update applied filters display
      const filtrosAplicadosTags = document.getElementById('filtros-aplicados-tags');
      if (filtrosAplicadosTags) {
        filtrosAplicadosTags.innerHTML = '';
        
        // Include subcategory filters in the applied filters display
        const allAppliedFilters = [
          ...etiquetasSeleccionadas.map(etiqueta => `Etiqueta: ${etiqueta}`),
          ...subetiquetasSeleccionadasGlobal.map(subetiqueta => `Subetiqueta: ${subetiqueta}`),
          `Orden: ${obtenerTextoOrden(orden)}`,
          `Ranking: ${obtenerTextoRanking(ranking)}`,
          `Tipo: ${obtenerTextoTipo(tipo)}`
        ];
        
        // Add community filter tag if selected
        if (comunidadId && comunidadId !== '') {
          const comunidadNombre = obtenerNombreComunidad(comunidadId);
          allAppliedFilters.push(`Comunidad: ${comunidadNombre}`);
        }
        
        allAppliedFilters.forEach(filtro => {
          const tagElement = document.createElement('div');
          tagElement.className = 'filtro-tag';
          tagElement.innerHTML = `
            ${filtro}
            <span class="remove-tag">&times;</span>
          `;
          
          tagElement.querySelector('.remove-tag').addEventListener('click', () => {
            tagElement.remove();
            
            // Handle removing specific filters
            if (filtro.startsWith('Etiqueta:')) {
              const etiquetaValor = filtro.replace('Etiqueta: ', '');
              const checkbox = document.querySelector(`input[name="etiquetas"][value="${etiquetaValor}"]`);
              if (checkbox) checkbox.checked = false;
            } else if (filtro.startsWith('Subetiqueta:')) {
              const subetiquetaValor = filtro.replace('Subetiqueta: ', '');
              const checkbox = document.querySelector(`input[name="subetiquetas-global"][value="${subetiquetaValor}"]`);
              if (checkbox) checkbox.checked = false;
            } else if (filtro.startsWith('Comunidad:')) {
              const todasComunidadesRadio = document.getElementById('comunidad-todas');
              if (todasComunidadesRadio) {
                todasComunidadesRadio.checked = true;
              }
              localStorage.removeItem('currentCommunityId');
            }
            
            // Reapply filters
            aplicarFiltros();
          });
          
          filtrosAplicadosTags.appendChild(tagElement);
        });
      }
      
      console.log(`Total mensajes filtrados: ${mensajesFiltrados.length}`);
    };
  });
}

// Execute the setup function
setupIndependentFiltering();
// Function to load subcategories based on selected main category


// Función para cargar categorías desde la base de datos
async function loadCategoriesFromDB() {
  try {
    // Get main categories
    const categoriasResult = await db.query(`
      SELECT nombre FROM categories_metadata 
      WHERE tipo = 'categoria' AND activo = TRUE 
      ORDER BY nombre
    `);
    
    const etiquetasDisponibles = ['Ninguna'];
    categoriasResult.rows.forEach(row => {
      if (!etiquetasDisponibles.includes(row.nombre)) {
        etiquetasDisponibles.push(row.nombre);
      }
    });
    
    // Para debug
    console.log('Categorías principales cargadas:', etiquetasDisponibles);
    
    // Cargar algunas subcategorías para debug
    if (etiquetasDisponibles.length > 1) {
      const primeraCategoria = etiquetasDisponibles[1]; // Primera categoría después de "Ninguna"
      
      // Verificar las subcategorías asociadas a esta categoría
      const testSubcategoriasResult = await db.query(`
        SELECT nombre 
        FROM categories_metadata 
        WHERE tipo = 'subcategoria' 
        AND categoria = $1 
        AND activo = TRUE
      `, [primeraCategoria]);
      
      console.log(`Subcategorías para "${primeraCategoria}" (debug):`, 
                 testSubcategoriasResult.rows.map(row => row.nombre));
    }
    
    // Get all subcategories
    const subcategoriasResult = await db.query(`
      SELECT nombre FROM categories_metadata 
      WHERE tipo = 'subcategoria' AND activo = TRUE 
      ORDER BY nombre
    `);
    
    const subetiquetasDisponibles = ['Ninguna'];
    subcategoriasResult.rows.forEach(row => {
      if (!subetiquetasDisponibles.includes(row.nombre)) {
        subetiquetasDisponibles.push(row.nombre);
      }
    });
    
    // Get all extra subcategories
    const extrasubcategoriasResult = await db.query(`
      SELECT nombre FROM categories_metadata 
      WHERE tipo = 'extrasubcategoria' AND activo = TRUE 
      ORDER BY nombre
    `);
    
    const extrasubetiquetasDisponibles = ['Ninguna'];
    extrasubcategoriasResult.rows.forEach(row => {
      if (!extrasubetiquetasDisponibles.includes(row.nombre)) {
        extrasubetiquetasDisponibles.push(row.nombre);
      }
    });
    
    return {
      etiquetasDisponibles,
      subetiquetasDisponibles,
      extrasubetiquetasDisponibles
    };
  } catch (error) {
    console.error('Error loading categories from database:', error);
    
    // Fallback to only "Ninguna" if database loading fails
    return {
      etiquetasDisponibles: ['Ninguna'],
      subetiquetasDisponibles: ['Ninguna'],
      extrasubetiquetasDisponibles: ['Ninguna']
    };
  }
}






















document.addEventListener('DOMContentLoaded', function() {
  // Function to generate a consistent color based on string
  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate vibrant colors with good contrast against white text
    const hue = Math.abs(hash % 360);
    const saturation = 65 + (hash % 20); // Between 65-85% saturation
    const lightness = 30 + (hash % 20);  // Between 30-50% lightness
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  
  // Apply colors to main categories
  document.querySelectorAll('.etiqueta:not([data-categoria="Ninguna"])').forEach(el => {
    const category = el.getAttribute('data-categoria');
    if (category && category !== 'Ninguna') {
      el.style.setProperty('--category-color', stringToColor(category));
    }
  });
  
  // Apply colors to subcategories
  document.querySelectorAll('.subetiqueta:not([data-subcategoria="Ninguna"])').forEach(el => {
    const subcategory = el.getAttribute('data-subcategoria');
    if (subcategory && subcategory !== 'Ninguna') {
      el.style.setProperty('--subcategory-color', stringToColor(subcategory));
    }
  });
  
  // Apply colors to extra subcategories
  document.querySelectorAll('.subetiqueta.extra:not([data-extrasubcategoria="Ninguna"])').forEach(el => {
    const extraSubcategory = el.getAttribute('data-extrasubcategoria');
    if (extraSubcategory && extraSubcategory !== 'Ninguna') {
      el.style.setProperty('--extrasubcategory-color', stringToColor(extraSubcategory));
    }
  });
  
  // Apply color to new elements as they are added to the DOM
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach(function(node) {
          // Check if the added node is an element
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Apply color to main categories
            if (node.classList.contains('etiqueta') && node.hasAttribute('data-categoria')) {
              const category = node.getAttribute('data-categoria');
              if (category && category !== 'Ninguna') {
                node.style.setProperty('--category-color', stringToColor(category));
              }
            }
            
            // Apply color to subcategories
            if (node.classList.contains('subetiqueta') && node.hasAttribute('data-subcategoria')) {
              const subcategory = node.getAttribute('data-subcategoria');
              if (subcategory && subcategory !== 'Ninguna') {
                node.style.setProperty('--subcategory-color', stringToColor(subcategory));
              }
            }
            
            // Apply color to extra subcategories
            if (node.classList.contains('subetiqueta') && 
                node.classList.contains('extra') && 
                node.hasAttribute('data-extrasubcategoria')) {
              const extraSubcategory = node.getAttribute('data-extrasubcategoria');
              if (extraSubcategory && extraSubcategory !== 'Ninguna') {
                node.style.setProperty('--extrasubcategory-color', stringToColor(extraSubcategory));
              }
            }
            
            // Check children elements too
            if (node.querySelectorAll) {
              // Apply to category elements
              node.querySelectorAll('.etiqueta:not([data-categoria="Ninguna"])').forEach(el => {
                const category = el.getAttribute('data-categoria');
                if (category && category !== 'Ninguna') {
                  el.style.setProperty('--category-color', stringToColor(category));
                }
              });
              
              // Apply to subcategory elements
              node.querySelectorAll('.subetiqueta:not([data-subcategoria="Ninguna"])').forEach(el => {
                const subcategory = el.getAttribute('data-subcategoria');
                if (subcategory && subcategory !== 'Ninguna') {
                  el.style.setProperty('--subcategory-color', stringToColor(subcategory));
                }
              });
              
              // Apply to extra subcategory elements
              node.querySelectorAll('.subetiqueta.extra:not([data-extrasubcategoria="Ninguna"])').forEach(el => {
                const extraSubcategory = el.getAttribute('data-extrasubcategoria');
                if (extraSubcategory && extraSubcategory !== 'Ninguna') {
                  el.style.setProperty('--extrasubcategory-color', stringToColor(extraSubcategory));
                }
              });
            }
          }
        });
      }
    });
  });
  
  // Observe changes in the entire document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Estilos para las imágenes circulares y la expansión
const style = document.createElement('style');
style.textContent = `
/* Estilo para las miniaturas (antes de hacer clic) */
.imagen-comentario img {
    width: 100%;
    height: 100%;
    border-radius: 2%; /* Borde ligeramente redondeado */
    object-fit: cover;
    background-color: white;
    border: 2px solid white;
}

.imagen-comentario {
    width: 100px;
    height: 100px;
    border-radius: 2%;
    overflow: hidden;
    display: inline-block;
    margin: 5px;
    background-color: white;
}

/* Estilo para la imagen expandida */
.modal-imagen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999999;
    cursor: pointer;
    display: none;
    background-color: rgba(0, 0, 0, 0.8);
}

.imagen-expandida-contenedor {
    border-radius: 4px;
    overflow: hidden;
    border: 2px solid white;
    background-color: white;
    max-width: 90%;
    max-height: 90vh;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.imagen-expandida {
    display: block;
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain; /* Cambiado a contain para mostrar la imagen completa */
    background-color: white;
}
`;
document.head.appendChild(style);

// Crear el modal para la imagen expandida
const modal = document.createElement('div');
modal.className = 'modal-imagen';
modal.innerHTML = '<div class="imagen-expandida-contenedor"><img class="imagen-expandida" src="" alt="Imagen expandida"></div>';
document.body.appendChild(modal);

// Función para cerrar el modal al hacer clic
modal.addEventListener('click', function(e) {
    // Solo cerrar si se hace clic fuera de la imagen
    if (e.target === modal) {
        this.style.display = 'none';
    }
});

// Evitar que los clics en la imagen cierren el modal
document.querySelector('.imagen-expandida-contenedor').addEventListener('click', function(e) {
    e.stopPropagation();
});

// Agregar evento a todas las imágenes de comentarios
document.addEventListener('click', function(e) {
    if (e.target && e.target.matches('.imagen-comentario img')) {
        // Prevenir comportamiento predeterminado
        e.stopPropagation();
        
        // Obtener la URL de la imagen
        const imagenSrc = e.target.src;
        
        // Establecer la imagen expandida
        document.querySelector('.imagen-expandida').src = imagenSrc;
        
        // Mostrar el modal
        modal.style.display = 'flex';
    }
});














