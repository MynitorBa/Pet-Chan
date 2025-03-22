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
  const modalImagen = document.getElementById('modal-imagen');
  const modalImagenContenido = document.getElementById('modal-imagen-contenido');
  const cerrarModalImagen = document.getElementById('cerrar-modal-imagen');
  
  let mensajeIdAEliminar = null;
  let isSubmitting = false;
  let imagenesActuales = []; // Almacena las imágenes actuales
  let imagenesEliminadas = []; // Almacena los IDs de imágenes eliminadas (para edición)
  const MAX_IMAGENES = 9; // Límite de 9 imágenes

  // Default author name
  autorInput.value = "meme";

  // Console debug
  console.log('Script foro.js cargado');

  // Función para resetear el formulario
  function resetForm() {
    form.action = '/publicar';
    form.method = 'POST';
    formTitle.textContent = 'Nuevo Mensaje';
    submitBtn.textContent = 'Publicar';
    cancelBtn.style.display = 'none';
    autorInput.value = 'meme';
    mensajeInput.value = '';
    mensajeIdInput.value = '';
    imagenesContainer.innerHTML = '';
    imagenesInput.value = '';
    imagenesActuales = [];
    imagenesEliminadas = [];
    // Eliminar todos los campos ocultos para imágenes eliminadas
    document.querySelectorAll('input[name="imagenes_eliminar"]').forEach(el => el.remove());
    isSubmitting = false;
  }

  // Actualizar contador de mensajes
  function actualizarContadorMensajes() {
    const cantidadMensajes = document.querySelectorAll('.mensaje').length;
    if (contador) {
      contador.textContent = cantidadMensajes;
    }
  }

  // Efecto fade-in para mensajes
  document.querySelectorAll('.mensaje').forEach(mensaje => {
    mensaje.style.opacity = '0';
    setTimeout(() => {
      mensaje.style.transition = 'opacity 0.5s ease-in';
      mensaje.style.opacity = '1';
    }, 100);
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
        // Si es un objeto con url, o simplemente una string
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
        
        // Añadir event listener para expandir
        celda.addEventListener('click', function() {
          expandirImagen(typeof imagen === 'object' ? imagen.url : imagen);
        });
      });
      
      imagenesContainer.appendChild(gridContainer);
      
      // Añadir contador de imágenes
      const contadorImagenes = document.createElement('div');
      contadorImagenes.className = 'contador-imagenes';
      contadorImagenes.textContent = `${imagenesActuales.length}/${MAX_IMAGENES} imágenes`;
      imagenesContainer.appendChild(contadorImagenes);
    }
  }

  // Función para expandir imagen
  function expandirImagen(src) {
    const imgElement = document.createElement('img');
    imgElement.src = src;
    modalImagenContenido.innerHTML = '';
    modalImagenContenido.appendChild(imgElement);
    modalImagen.classList.add('activo');
  }

  // Función para eliminar una imagen
  function eliminarImagen(index) {
    const imagen = imagenesActuales[index];
    
    // Si estamos en modo edición y la imagen tiene ID, guardarla para eliminarla en el servidor
    if (mensajeIdInput.value && typeof imagen === 'object' && imagen.id) {
      imagenesEliminadas.push(imagen.id);
    }
    
    // Eliminar del array de imágenes actuales
    imagenesActuales.splice(index, 1);
    
    // Actualizar la vista previa
    actualizarVistaPrevia();
    
    // Para nuevas imágenes, necesitamos reconstruir el input file
    if (!mensajeIdInput.value || (typeof imagen === 'object' && !imagen.id)) {
      // Si tenemos soporte para DataTransfer, recreamos el input de archivos
      if (typeof DataTransfer !== 'undefined') {
        const dataTransfer = new DataTransfer();
        
        // Obtenemos los archivos actuales
        const files = Array.from(imagenesInput.files || []);
        
        // Convertimos el array de imágenes actuales a un array de Files
        // Solo añadimos archivos que estén todavía en imagenesActuales
        const imagenesNuevas = imagenesActuales.filter(img => typeof img === 'object' && img.file);
        
        // Añadimos al DataTransfer todos los archivos que debemos mantener
        imagenesNuevas.forEach(img => {
          if (img.file) {
            dataTransfer.items.add(img.file);
          }
        });
        
        // Actualizamos el input file
        imagenesInput.value = ''; // Limpiamos primero
        imagenesInput.files = dataTransfer.files;
      }
    }
  }

  // Crear la estructura para el modal de imagen ampliada si no existe
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

  // Manejar selección de imágenes
  imagenesInput.addEventListener('change', function(e) {
    if (!this.files || this.files.length === 0) return;
    
    const nuevasImagenes = Array.from(this.files);
    
    // Verificar si se excede el límite
    if (imagenesActuales.length + nuevasImagenes.length > MAX_IMAGENES) {
      alert(`No puedes subir más de ${MAX_IMAGENES} imágenes en total`);
      this.value = ''; // Reseteamos el input para evitar inconsistencias
      return;
    }
    
    // Verificar cada archivo y añadirlo
    nuevasImagenes.forEach(file => {
      if (!file.type.match('image.*')) {
        alert('Por favor, selecciona solo imágenes válidas');
        return;
      }
      
      // Añadir a vista previa
      const reader = new FileReader();
      reader.onload = function(e) {
        // Añadir la imagen al array con toda la información necesaria
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

  // Cerrar modal de imagen al hacer clic fuera
  modalImagen.addEventListener('click', function(e) {
    if (e.target === modalImagen) {
      modalImagen.classList.remove('activo');
    }
  });

  // Validación y envío del formulario
  form.addEventListener('submit', function(event) {
    // Prevenir múltiples envíos
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
    
    // Modo edición
    if (mensajeIdInput.value) {
      event.preventDefault();
      
      // Marcar como enviando
      isSubmitting = true;
      
      const formData = new FormData();
      formData.append('autor', autor);
      formData.append('mensaje', mensaje);
      
      // Añadir imágenes nuevas (las que tienen propiedad 'file')
      imagenesActuales.forEach(img => {
        if (typeof img === 'object' && img.file) {
          formData.append('imagenes', img.file);
        }
      });
      
      // Añadir IDs de imágenes existentes a mantener
      imagenesActuales.forEach(img => {
        if (typeof img === 'object' && img.id) {
          formData.append('mantener_imagenes[]', img.id);
        }
      });
      
      // Añadir IDs de imágenes a eliminar
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
        console.error('Error:', error);
        alert('Error al actualizar: ' + error.message);
        isSubmitting = false;
      })
      .finally(() => {
        submitBtn.textContent = 'Actualizar';
        submitBtn.disabled = false;
      });
    } else {
      // Nuevo mensaje - usar el form action normal
      isSubmitting = true;
      submitBtn.textContent = 'Enviando...';
      submitBtn.disabled = true;
      
      // Para asegurarnos de que se envíen las imágenes correctas en el formulario
      // no necesitamos hacer nada aquí, ya que las imágenes seleccionadas ya están en el input de archivo
    }
  });

  // Botón cancelar
  cancelBtn.addEventListener('click', resetForm);

  // Delegación de eventos para interacciones con mensajes
  document.addEventListener('click', function(event) {
    // Botón editar mensaje
    if (event.target.closest('.btn-editar')) {
      const button = event.target.closest('.btn-editar');
      const mensajeId = button.dataset.id;
      
      fetch(`/mensaje/${mensajeId}`)
        .then(response => {
          if (!response.ok) throw new Error('Error: ' + response.status);
          return response.json();
        })
        .then(data => {
          // Resetear el formulario primero para limpiar todo
          resetForm();
          
          // Configurar el formulario para edición
          formTitle.textContent = 'Editar Mensaje';
          submitBtn.textContent = 'Actualizar';
          cancelBtn.style.display = 'block';
          autorInput.value = data.autor;
          mensajeInput.value = data.mensaje;
          mensajeIdInput.value = data.id;
          
          // Limpiar array de imágenes eliminadas
          imagenesEliminadas = [];
          
          // Mostrar imágenes existentes
          if (data.imagenes && data.imagenes.length > 0) {
            imagenesActuales = data.imagenes;
            actualizarVistaPrevia();
          }
          
          form.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Error al cargar el mensaje: ' + error.message);
        });
    }
    
    // Botón eliminar mensaje
    if (event.target.closest('.btn-eliminar')) {
      mensajeIdAEliminar = event.target.closest('.btn-eliminar').dataset.id;
      modal.classList.add('active');
    }

    // Expandir imagen de mensajes
    if (event.target.closest('.imagen-mensaje-celda')) {
      const img = event.target.closest('.imagen-mensaje-celda').querySelector('img');
      if (img) {
        expandirImagen(img.src);
      }
    }
  });

  // Confirmación de eliminación de mensaje
  btnConfirmarEliminar.addEventListener('click', function() {
    if (mensajeIdAEliminar) {
      btnConfirmarEliminar.textContent = 'Eliminando...';
      btnConfirmarEliminar.disabled = true;
      
      fetch(`/eliminar/${mensajeIdAEliminar}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          document.querySelector(`.mensaje[data-id="${mensajeIdAEliminar}"]`)?.remove();
          actualizarContadorMensajes();
          
          const mensajesContainer = document.querySelector('.lista-mensajes');
          if (document.querySelectorAll('.mensaje').length === 0 && mensajesContainer) {
            mensajesContainer.innerHTML = '<p class="no-mensajes">No hay mensajes aún. ¡Sé el primero en publicar!</p>';
          }
        }
        modal.classList.remove('active');
      })
      .catch(error => alert('Error al eliminar: ' + error.message))
      .finally(() => {
        btnConfirmarEliminar.textContent = 'Eliminar';
        btnConfirmarEliminar.disabled = false;
      });
    }
  });
  
  // Botón cancelar del modal
  btnCancelarEliminar.addEventListener('click', () => modal.classList.remove('active'));

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
        // Verificar el límite
        if (imagenesActuales.length + files.length > MAX_IMAGENES) {
          alert(`No puedes subir más de ${MAX_IMAGENES} imágenes en total`);
          return;
        }
        
        // Verificar archivos y añadirlos al input y a la vista previa
        Array.from(files).forEach(file => {
          if (file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = function(e) {
              // Añadir al array de imágenes
              imagenesActuales.push({
                url: e.target.result,
                file: file,
                name: file.name
              });
              actualizarVistaPrevia();
            };
            reader.readAsDataURL(file);
            
            // Añadir al input de archivos
            if (typeof DataTransfer !== 'undefined') {
              const dataTransfer = new DataTransfer();
              
              // Obtener archivos actuales
              if (imagenesInput.files) {
                Array.from(imagenesInput.files).forEach(f => {
                  dataTransfer.items.add(f);
                });
              }
              
              // Añadir nuevo archivo
              dataTransfer.items.add(file);
              
              // Actualizar input
              imagenesInput.files = dataTransfer.files;
            }
          }
        });
      }
    }
  }
});