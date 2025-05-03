document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM (mantengo las mismas que ya tenías)
    const btnAbrirModal = document.getElementById('btn-abrir-modal');
    const modalCrearComunidad = document.getElementById('modal-crear-comunidad');
    const cerrarModal = document.getElementById('cerrar-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const btnAdminCategorias = document.getElementById('btn-admin-categorias');
    const modalAdminCategorias = document.getElementById('modal-admin-categorias');
    const cerrarModalCategorias = document.getElementById('cerrar-modal-categorias');
    const pestanas = document.querySelectorAll('.pestana');
    const contenidoPestanas = document.querySelectorAll('.contenido-pestana');
    const pestanasAdmin = document.querySelectorAll('.pestana-admin');
    const panelesAdmin = document.querySelectorAll('.panel-admin');
    const filtroCategoriaSelect = document.getElementById('filtro-categoria');
    const filtroSubcategoriaSelect = document.getElementById('filtro-subcategoria');
    const buscarComunidadInput = document.getElementById('buscar-comunidad');
    const btnUnirse = document.getElementById('btn-unirse');
    const formCategoria = document.getElementById('form-categoria');
    const formSubcategoria = document.getElementById('form-subcategoria');
    const cancelarCategoriaBtn = document.getElementById('cancelar-categoria-btn');
    const cancelarSubcategoriaBtn = document.getElementById('cancelar-subcategoria-btn');
    const categoriaSelect = document.getElementById('categoria');
    const subcategoriaSelect = document.getElementById('subcategoria');
    const subcategoriaExtraSelect = document.getElementById('subcategoria-extra');
    const categoriaPadreSelect = document.getElementById('categoria-padre');


    const userRango3 = document.querySelector('meta[name="user-rango3"]')?.content;
    
    // Ocultar el botón si no es administrador
    if (btnAdminCategorias && userRango3 !== 'Administrador') {
        btnAdminCategorias.style.display = 'none';
    }

    // Cargar categorías y subcategorías al inicio
    cargarCategorias();
    cargarSubcategorias();

    // NUEVO: Manejo de selectores dependientes para creación de comunidad
    if (categoriaSelect && subcategoriaSelect && subcategoriaExtraSelect) {
        // Cuando cambia la categoría principal
        categoriaSelect.addEventListener('change', function() {
            const categoriaSeleccionada = this.value.toLowerCase();
            
            // Limpiar y reiniciar los selectores dependientes
            subcategoriaSelect.innerHTML = '<option value="">Seleccione una subcategoría</option>';
            subcategoriaExtraSelect.innerHTML = '<option value="">Seleccione una subcategoría extra (opcional)</option>';
            
            if (categoriaSeleccionada) {
                // Cargar todas las subcategorías disponibles
                fetch('/admin/subcategorias')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.subcategorias) {
                            // Filtrar subcategorías que pertenecen a la categoría seleccionada
                            const subcategoriasRelacionadas = data.subcategorias.filter(subcategoria => {
                                // Aquí asumimos que tienes un campo que relaciona la subcategoría con su categoría
                                // Si no es así, deberás ajustar esta condición
                                return subcategoria.categoria && subcategoria.categoria.toLowerCase() === categoriaSeleccionada;
                            });
                            
                            // Añadir las subcategorías filtradas al selector
                            subcategoriasRelacionadas.forEach(subcategoria => {
                                const option = document.createElement('option');
                                option.value = subcategoria.nombre;
                                option.textContent = subcategoria.nombre;
                                subcategoriaSelect.appendChild(option);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error al cargar subcategorías:', error);
                    });
            }
        });
        
        // Cuando cambia la subcategoría principal
        subcategoriaSelect.addEventListener('change', function() {
            const subcategoriaSeleccionada = this.value;
            const categoriaSeleccionada = categoriaSelect.value.toLowerCase();
            
            // Limpiar y reiniciar el selector de subcategoría extra
            subcategoriaExtraSelect.innerHTML = '<option value="">Seleccione una subcategoría extra (opcional)</option>';
            
            if (categoriaSeleccionada && subcategoriaSeleccionada) {
                // Cargar todas las subcategorías disponibles
                fetch('/admin/subcategorias')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.subcategorias) {
                            // Filtrar subcategorías relacionadas con la misma categoría pero diferentes a la ya seleccionada
                            const subcategoriasDisponibles = data.subcategorias.filter(subcategoria => {
                                return subcategoria.categoria && 
                                       subcategoria.categoria.toLowerCase() === categoriaSeleccionada && 
                                       subcategoria.nombre !== subcategoriaSeleccionada;
                            });
                            
                            // Añadir las subcategorías filtradas al selector de subcategoría extra
                            subcategoriasDisponibles.forEach(subcategoria => {
                                const option = document.createElement('option');
                                option.value = subcategoria.nombre;
                                option.textContent = subcategoria.nombre;
                                subcategoriaExtraSelect.appendChild(option);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error al cargar subcategorías:', error);
                    });
            }
        });
    }

    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo = 'exito') {
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;
        
        // Añadir al DOM
        document.body.appendChild(notificacion);
        
        // Mostrar con animación
        setTimeout(() => {
            notificacion.classList.add('visible');
        }, 10);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            notificacion.classList.remove('visible');
            setTimeout(() => {
                document.body.removeChild(notificacion);
            }, 300);
        }, 3000);
    }

    // Abrir modal de creación de comunidad
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', function(e) {
            e.preventDefault();
            modalCrearComunidad.style.display = 'block';
        });
    }

    // Cerrar modal de creación
    if (cerrarModal) {
        cerrarModal.addEventListener('click', function() {
            modalCrearComunidad.style.display = 'none';
            window.location.reload(); // Recargar la página al cerrar
        });
    }

    // Botón cancelar creación
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modalCrearComunidad.style.display = 'none';
            window.location.reload(); // Recargar la página al cancelar
        });
    }

    // Abrir modal de administración de categorías
    if (btnAdminCategorias) {
        btnAdminCategorias.addEventListener('click', function(e) {
            e.preventDefault();
            modalAdminCategorias.style.display = 'block';
            // Actualizar listas al abrir el modal
            actualizarListaCategorias();
            actualizarListaSubcategorias();
        });
    }

    // Cerrar modal de categorías
    if (cerrarModalCategorias) {
        cerrarModalCategorias.addEventListener('click', function() {
            modalAdminCategorias.style.display = 'none';
            window.location.reload(); // Recargar la página al cerrar
        });
    }

    // Botón cancelar categoría
    if (cancelarCategoriaBtn) {
        cancelarCategoriaBtn.addEventListener('click', function() {
            window.location.reload();
        });
    }

    // Botón cancelar subcategoría
    if (cancelarSubcategoriaBtn) {
        cancelarSubcategoriaBtn.addEventListener('click', function() {
            window.location.reload();
        });
    }

    // Manejar pestañas principales
    pestanas.forEach(pestana => {
        pestana.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Desactivar todas las pestañas
            pestanas.forEach(p => p.classList.remove('activa'));
            
            // Activar la pestaña actual
            this.classList.add('activa');
            
            // Ocultar todos los contenidos
            contenidoPestanas.forEach(contenido => contenido.classList.add('oculto'));
            
            // Mostrar el contenido seleccionado
            document.getElementById('tab-' + tabId).classList.remove('oculto');
        });
    });

    // Manejar pestañas de administración
    pestanasAdmin.forEach(pestana => {
        pestana.addEventListener('click', function() {
            const tabAdminId = this.getAttribute('data-tab-admin');
            
            // Desactivar todas las pestañas admin
            pestanasAdmin.forEach(p => p.classList.remove('activa'));
            
            // Activar la pestaña admin actual
            this.classList.add('activa');
            
            // Ocultar todos los paneles admin
            panelesAdmin.forEach(panel => panel.classList.add('oculto'));
            
            // Mostrar el panel admin seleccionado
            document.getElementById('panel-' + tabAdminId).classList.remove('oculto');
        });
    });

    // Filtrar comunidades por categoría y subcategoría
    if (filtroCategoriaSelect) {
        filtroCategoriaSelect.addEventListener('change', filtrarComunidades);
    }
    
    if (filtroSubcategoriaSelect) {
        filtroSubcategoriaSelect.addEventListener('change', filtrarComunidades);
    }

    // Buscar comunidades por nombre
    if (buscarComunidadInput) {
        buscarComunidadInput.addEventListener('input', filtrarComunidades);
    }

    // Función corregida para filtrar comunidades incluyendo subcategorías
    // Modificación de la función filtrarComunidades existente para que no altere el orden
function filtrarComunidades() {
    const categoriaSeleccionada = filtroCategoriaSelect.value.toLowerCase();
    const subcategoriaSeleccionada = filtroSubcategoriaSelect ? filtroSubcategoriaSelect.value.toLowerCase() : '';
    const textoBusqueda = buscarComunidadInput.value.toLowerCase();
    const tarjetasComunidad = document.querySelectorAll('.tarjeta-comunidad');
    
    tarjetasComunidad.forEach(tarjeta => {
        const categoria = tarjeta.getAttribute('data-categoria') ? tarjeta.getAttribute('data-categoria').toLowerCase() : '';
        const subcategoria = tarjeta.getAttribute('data-subcategoria') ? tarjeta.getAttribute('data-subcategoria').toLowerCase() : '';
        const subcategoriaExtra = tarjeta.getAttribute('data-subcategoria-extra') ? tarjeta.getAttribute('data-subcategoria-extra').toLowerCase() : '';
        
        // Buscar en los elementos de texto de la tarjeta
        const nombre = tarjeta.querySelector('h3') ? tarjeta.querySelector('h3').textContent.toLowerCase() : '';
        const descripcion = tarjeta.querySelector('.descripcion-texto') ? tarjeta.querySelector('.descripcion-texto').textContent.toLowerCase() : '';
        
        // Comprobar coincidencias
        const coincideCategoria = categoriaSeleccionada === '' || categoria === categoriaSeleccionada;
        const coincideSubcategoria = subcategoriaSeleccionada === '' || 
                                    subcategoria === subcategoriaSeleccionada || 
                                    subcategoriaExtra === subcategoriaSeleccionada;
        const coincideTexto = textoBusqueda === '' || 
                            nombre.includes(textoBusqueda) || 
                            descripcion.includes(textoBusqueda);
        
        // Mostrar u ocultar tarjeta según coincidencias
        if (coincideCategoria && coincideSubcategoria && coincideTexto) {
            tarjeta.style.display = '';
        } else {
            tarjeta.style.display = 'none';
        }
    });
    

    ordenarComunidades();
    ordenarPorPublicaciones();
 ordenarPorMiembros();


 
 // También ordenar después de filtrar
 const filtroCategoria = document.getElementById('filtro-categoria');
 const filtroSubcategoria = document.getElementById('filtro-subcategoria');
 const buscarComunidad = document.getElementById('buscar-comunidad');
 
 if (filtroCategoria) {
     filtroCategoria.addEventListener('change', function() {
         // Llamar al filtro original y luego reordenar
         filtrarComunidades();
         ordenarComunidades();
         ordenarPorPublicaciones();
      ordenarPorMiembros();  });
 }
 
 if (filtroSubcategoria) {
     filtroSubcategoria.addEventListener('change', function() {
         filtrarComunidades();
         ordenarComunidades();
         ordenarPorPublicaciones();
      ordenarPorMiembros(); });
 }
 
 if (buscarComunidad) {
     buscarComunidad.addEventListener('input', function() {
         filtrarComunidades();
         ordenarComunidades();
         ordenarPorPublicaciones();
      ordenarPorMiembros();  });
 }
        
        tarjetasComunidad.forEach(tarjeta => {
            const categoria = tarjeta.getAttribute('data-categoria') ? tarjeta.getAttribute('data-categoria').toLowerCase() : '';
            const subcategoria = tarjeta.getAttribute('data-subcategoria') ? tarjeta.getAttribute('data-subcategoria').toLowerCase() : '';
            const subcategoriaExtra = tarjeta.getAttribute('data-subcategoria-extra') ? tarjeta.getAttribute('data-subcategoria-extra').toLowerCase() : '';
            
            // Buscar en los elementos de texto de la tarjeta
            const nombre = tarjeta.querySelector('h3') ? tarjeta.querySelector('h3').textContent.toLowerCase() : '';
            const descripcion = tarjeta.querySelector('.descripcion-texto') ? tarjeta.querySelector('.descripcion-texto').textContent.toLowerCase() : '';
            
            // Comprobar coincidencias
            const coincideCategoria = categoriaSeleccionada === '' || categoria === categoriaSeleccionada;
            const coincideSubcategoria = subcategoriaSeleccionada === '' || 
                                        subcategoria === subcategoriaSeleccionada || 
                                        subcategoriaExtra === subcategoriaSeleccionada;
            const coincideTexto = textoBusqueda === '' || 
                                nombre.includes(textoBusqueda) || 
                                descripcion.includes(textoBusqueda);
            
            // Mostrar u ocultar tarjeta según coincidencias
            if (coincideCategoria && coincideSubcategoria && coincideTexto) {
                tarjeta.style.display = '';
            } else {
                tarjeta.style.display = 'none';
            }
        });
    }

    // Botón unirse a comunidad
    if (btnUnirse) {
        btnUnirse.addEventListener('click', function() {
            document.querySelector('[data-tab="todas"]').click();
        });
    }

    // Manejar formulario de categoría
    if (formCategoria) {
        formCategoria.addEventListener('submit', function(e) {
            e.preventDefault();
            const categoriaId = document.getElementById('categoria-id').value;
            const nombre = document.getElementById('nombre-categoria').value;
            const descripcion = document.getElementById('descripcion-categoria').value;
            
            if (!nombre.trim()) {
                mostrarNotificacion('El nombre de la categoría es obligatorio', 'error');
                return;
            }
            
            fetch(categoriaId ? `/admin/categorias/actualizar/${categoriaId}` : '/admin/categorias/crear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombre, descripcion }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Actualizar la lista de categorías en la interfaz
                    actualizarListaCategorias();
                    cargarCategorias();
                    
                    // Mostrar notificación de éxito
                    mostrarNotificacion(data.mensaje || 'Categoría guardada correctamente');
                    
                    // Limpiar el formulario
                    formCategoria.reset();
                    document.getElementById('categoria-id').value = '';
                } else {
                    mostrarNotificacion('Error: ' + (data.mensaje || 'Ocurrió un error al guardar la categoría'), 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                mostrarNotificacion('Ha ocurrido un error al procesar la solicitud', 'error');
            });
        });
    }

    // Manejar formulario de subcategoría
    if (formSubcategoria) {
        formSubcategoria.addEventListener('submit', function(e) {
            e.preventDefault();
            const subcategoriaId = document.getElementById('subcategoria-id').value;
            const nombre = document.getElementById('nombre-subcategoria').value;
            const descripcion = document.getElementById('descripcion-subcategoria').value;
            const categoriaPadre = document.getElementById('categoria-padre').value;
            
            if (!nombre.trim()) {
                mostrarNotificacion('El nombre de la subcategoría es obligatorio', 'error');
                return;
            }
            
            if (!categoriaPadre) {
                mostrarNotificacion('Debe seleccionar una categoría padre', 'error');
                return;
            }
            
            fetch(subcategoriaId ? `/admin/subcategorias/actualizar/${subcategoriaId}` : '/admin/subcategorias/crear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    nombre: nombre,
                    descripcion: descripcion, 
                    categoriaPadre: categoriaPadre 
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Actualizar la lista de subcategorías en la interfaz
                    actualizarListaSubcategorias();
                    cargarSubcategorias();
                    
                    // Mostrar notificación de éxito
                    mostrarNotificacion(data.mensaje || 'Subcategoría guardada correctamente');
                    
                    // Limpiar el formulario
                    formSubcategoria.reset();
                    document.getElementById('subcategoria-id').value = '';
                } else {
                    mostrarNotificacion('Error: ' + (data.mensaje || 'Ocurrió un error al guardar la subcategoría'), 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                mostrarNotificacion('Ha ocurrido un error al procesar la solicitud', 'error');
            });
        });
    }

    // Delegación de eventos para botones de editar y eliminar
    document.addEventListener('click', function(e) {
        // Editar categoría
        if (e.target.classList.contains('btn-editar-categoria') || 
            e.target.closest('.btn-editar-categoria')) {
            const btn = e.target.classList.contains('btn-editar-categoria') ? 
                        e.target : e.target.closest('.btn-editar-categoria');
            const categoriaId = btn.getAttribute('data-id');
            
            // Cambiar a la pestaña de categorías si no está activa
            document.querySelector('[data-tab-admin="categorias"]').click();
            
            // Obtener info completa de la categoría
            fetch(`/admin/categorias/${categoriaId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.categoria) {
                        document.getElementById('categoria-id').value = categoriaId;
                        document.getElementById('nombre-categoria').value = data.categoria.nombre;
                        document.getElementById('descripcion-categoria').value = data.categoria.descripcion || '';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarNotificacion('Error al cargar la información de la categoría', 'error');
                });
        }
        
        // Eliminar categoría
        if (e.target.classList.contains('btn-eliminar-categoria') || 
            e.target.closest('.btn-eliminar-categoria')) {
            const btn = e.target.classList.contains('btn-eliminar-categoria') ? 
                        e.target : e.target.closest('.btn-eliminar-categoria');
            const categoriaId = btn.getAttribute('data-id');
            
            if (confirm('¿Está seguro de que desea eliminar esta categoría? Esta acción no se puede deshacer.')) {
                fetch(`/admin/categorias/${categoriaId}`, {
                    method: 'DELETE',
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        actualizarListaCategorias();
                        cargarCategorias();
                        mostrarNotificacion(data.mensaje || 'Categoría eliminada correctamente');
                    } else {
                        mostrarNotificacion('Error: ' + (data.mensaje || 'No se pudo eliminar la categoría'), 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarNotificacion('Ha ocurrido un error al eliminar la categoría', 'error');
                });
            }
        }
        
        // Editar subcategoría
        if (e.target.classList.contains('btn-editar-subcategoria') || 
            e.target.closest('.btn-editar-subcategoria')) {
            const btn = e.target.classList.contains('btn-editar-subcategoria') ? 
                        e.target : e.target.closest('.btn-editar-subcategoria');
            const subcategoriaId = btn.getAttribute('data-id');
            
            // Cambiar a la pestaña de subcategorías si no está activa
            document.querySelector('[data-tab-admin="subcategorias"]').click();
            
            // Obtener info completa de la subcategoría
            fetch(`/admin/subcategorias/${subcategoriaId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.subcategoria) {
                        document.getElementById('subcategoria-id').value = subcategoriaId;
                        document.getElementById('nombre-subcategoria').value = data.subcategoria.nombre;
                        document.getElementById('descripcion-subcategoria').value = data.subcategoria.descripcion || '';
                        // Seleccionar la categoría padre en el select
                        const categoriaPadreSelect = document.getElementById('categoria-padre');
                        if (categoriaPadreSelect) {
                            for (let i = 0; i < categoriaPadreSelect.options.length; i++) {
                                if (categoriaPadreSelect.options[i].value === data.subcategoria.categoria) {
                                    categoriaPadreSelect.selectedIndex = i;
                                    break;
                                }
                            }
                        }
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarNotificacion('Error al cargar la información de la subcategoría', 'error');
                });
        }
        
        // Eliminar subcategoría
        if (e.target.classList.contains('btn-eliminar-subcategoria') || 
            e.target.closest('.btn-eliminar-subcategoria')) {
            const btn = e.target.classList.contains('btn-eliminar-subcategoria') ? 
                        e.target : e.target.closest('.btn-eliminar-subcategoria');
            const subcategoriaId = btn.getAttribute('data-id');
            
            if (confirm('¿Está seguro de que desea eliminar esta subcategoría? Esta acción no se puede deshacer.')) {
                fetch(`/admin/subcategorias/${subcategoriaId}`, {
                    method: 'DELETE',
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        actualizarListaSubcategorias();
                        cargarSubcategorias();
                        mostrarNotificacion(data.mensaje || 'Subcategoría eliminada correctamente');
                    } else {
                        mostrarNotificacion('Error: ' + (data.mensaje || 'No se pudo eliminar la subcategoría'), 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarNotificacion('Ha ocurrido un error al eliminar la subcategoría', 'error');
                });
            }
        }
    });

    // Funciones para cargar y actualizar categorías/subcategorías
    function cargarCategorias() {
        fetch('/admin/categorias')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.categorias) {
                    actualizarSelectsCategorias(data.categorias);
                }
            })
            .catch(error => {
                console.error('Error al cargar categorías:', error);
            });
    }

    function cargarSubcategorias() {
        fetch('/admin/subcategorias')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.subcategorias) {
                    actualizarSelectSubcategorias(data.subcategorias);
                }
            })
            .catch(error => {
                console.error('Error al cargar subcategorías:', error);
            });
    }

    // Actualizar selectores de categorías
    function actualizarSelectsCategorias(categorias) {
        const selectsCategorias = [
            document.getElementById('filtro-categoria'),
            document.getElementById('categoria'),
            document.getElementById('categoria-padre')
        ];
        
        selectsCategorias.forEach(select => {
            if (select) {
                const valorActual = select.value;
                
                // Guardar la primera opción (normalmente "Seleccione una categoría")
                const primeraOpcion = select.options[0];
                
                // Limpiar el select
                select.innerHTML = '';
                
                // Añadir la primera opción de nuevo
                select.appendChild(primeraOpcion);
                
                // Añadir las categorías actualizadas
                categorias.forEach(categoria => {
                    const option = document.createElement('option');
                    option.value = categoria.nombre;
                    option.textContent = categoria.nombre;
                    select.appendChild(option);
                });
                
                // Intentar restaurar el valor seleccionado previamente
                if (valorActual) {
                    select.value = valorActual;
                }
            }
        });
    }

    // Actualizar selectores de subcategorías
    function actualizarSelectSubcategorias(subcategorias) {
        const selectsSubcategorias = [
            document.getElementById('subcategoria'),
            document.getElementById('subcategoria-extra'),
            document.getElementById('filtro-subcategoria')
        ];
        
        selectsSubcategorias.forEach(select => {
            if (select) {
                const valorActual = select.value;
                
                // Guardar la primera opción
                const primeraOpcion = select.options[0];
                
                // Limpiar el select
                select.innerHTML = '';
                
                // Añadir la primera opción de nuevo
                select.appendChild(primeraOpcion);
                
                // Añadir las subcategorías actualizadas
                subcategorias.forEach(subcategoria => {
                    const option = document.createElement('option');
                    option.value = subcategoria.nombre;
                    option.textContent = subcategoria.nombre;
                    select.appendChild(option);
                });
                
                // Intentar restaurar el valor seleccionado previamente
                if (valorActual) {
                    select.value = valorActual;
                }
            }
        });
    }
    
    // Actualizar lista de categorías en el panel de administración
    function actualizarListaCategorias() {
        fetch('/admin/categorias')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.categorias) {
                    const categoriasContainer = document.getElementById('categorias-container');
                    
                    if (categoriasContainer) {
                        let html = '';
                        
                        if (data.categorias.length === 0) {
                            html = '<p>No hay categorías disponibles.</p>';
                        } else {
                            data.categorias.forEach(categoria => {
                                html += `
                                <div class="categoria-item">
                                    <span>${categoria.nombre}</span>
                                    <div class="categoria-acciones">
                                        <button class="btn-editar-categoria" data-id="${categoria.id}" data-nombre="${categoria.nombre}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-eliminar-categoria" data-id="${categoria.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>`;
                            });
                        }
                        
                        categoriasContainer.innerHTML = html;
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    // Actualizar lista de subcategorías en el panel de administración
    function actualizarListaSubcategorias() {
        fetch('/admin/subcategorias')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.subcategorias) {
                    const subcategoriasContainer = document.getElementById('subcategorias-container');
                    
                    if (subcategoriasContainer) {
                        let html = '';
                        
                        if (data.subcategorias.length === 0) {
                            html = '<p>No hay subcategorías disponibles.</p>';
                        } else {
                            data.subcategorias.forEach(subcategoria => {
                                html += `
                                <div class="categoria-item">
                                    <span>${subcategoria.nombre} <small>(Categoría: ${subcategoria.categoria})</small></span>
                                    <div class="categoria-acciones">
                                        <button class="btn-editar-subcategoria" data-id="${subcategoria.id}" data-nombre="${subcategoria.nombre}" data-categoria="${subcategoria.categoria}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-eliminar-subcategoria" data-id="${subcategoria.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>`;
                            });
                        }
                        
                        subcategoriasContainer.innerHTML = html;
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }


});

// Código para ajustes visuales y mejoras de la interfaz
document.addEventListener('DOMContentLoaded', function() {
    // Aplicar clases de estilo al filtro de subcategorías
    const subcategoriaDropdown = document.getElementById('filtro-subcategoria');
    if (subcategoriaDropdown) {
        subcategoriaDropdown.classList.add('formulario-control');
    }
    
    // Procesar las tarjetas de comunidad para mostrar/ocultar etiquetas correctamente
    const tarjetasComunidad = document.querySelectorAll('.tarjeta-comunidad');
    
    tarjetasComunidad.forEach(tarjeta => {
        // Gestión de etiquetas de categoría y subcategorías
        const etiquetaCategoria = tarjeta.querySelector('.categoria');
        const etiquetaSubcategoria = tarjeta.querySelector('.subcategoria');
        const etiquetaSubcategoriaExtra = tarjeta.querySelector('.subcategoria-extra');
        
        // Ocultar etiquetas vacías o con texto predeterminado
        if (etiquetaCategoria && (etiquetaCategoria.textContent.includes('Sin categoría') || etiquetaCategoria.textContent.trim() === '<i class="fas fa-tag"></i>')) {
            etiquetaCategoria.style.display = 'none';
        }
        
        if (etiquetaSubcategoria && (etiquetaSubcategoria.textContent.includes('Sin subcategoría') || etiquetaSubcategoria.textContent.trim() === '<i class="fas fa-tag"></i>')) {
            etiquetaSubcategoria.style.display = 'none';
        }
        
        if (etiquetaSubcategoriaExtra && (etiquetaSubcategoriaExtra.textContent.includes('Sin subcategoría extra') || etiquetaSubcategoriaExtra.textContent.trim() === '<i class="fas fa-tag"></i>')) {
            etiquetaSubcategoriaExtra.style.display = 'none';
        }
        
        // Mostrar la clase privada/pública en la tarjeta
        const esPrivada = tarjeta.getAttribute('data-privada') === 'true';
        const privacidadEtiqueta = tarjeta.querySelector('.privacidad');
        
        if (!privacidadEtiqueta && esPrivada === false) {
            // Si no es privada pero no tiene etiqueta de privacidad, agregar etiqueta "Pública"
            const encabezado = tarjeta.querySelector('.tarjeta-comunidad-encabezado');
            if (encabezado) {
                const etiquetaPublica = document.createElement('span');
                etiquetaPublica.classList.add('privacidad', 'publica');
                etiquetaPublica.innerHTML = '<i class="fas fa-globe"></i> Pública';
                encabezado.appendChild(etiquetaPublica);
            }
        }
    });
});


// Función para ordenar comunidades por número de miembros y publicaciones
function ordenarComunidades() {
    const container = document.querySelector('.comunidades-grid');
    if (!container) return;
    
    const tarjetas = Array.from(container.querySelectorAll('.tarjeta-comunidad'));
    
    // Ordenar las tarjetas por total de miembros (principal) y total de publicaciones (secundario)
    tarjetas.sort((a, b) => {
        // Obtener total de miembros y publicaciones de cada tarjeta
        const miembrosA = parseInt(a.getAttribute('data-miembros') || '0');
        const miembrosB = parseInt(b.getAttribute('data-miembros') || '0');
        
        const publicacionesA = parseInt(a.getAttribute('data-publicaciones') || '0');
        const publicacionesB = parseInt(b.getAttribute('data-publicaciones') || '0');
        
        // Comparar primero por número de miembros (orden descendente)
        if (miembrosA !== miembrosB) {
            return miembrosB - miembrosA;
        }
        
        // Si tienen el mismo número de miembros, comparar por número de publicaciones
        return publicacionesB - publicacionesA;
    });
    
    // Volver a insertar las tarjetas en el orden correcto
    tarjetas.forEach(tarjeta => {
        container.appendChild(tarjeta);
    });
}

// Ejecutar la función cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', ordenarComunidades);

// También permitir ordenar bajo demanda si es necesario
function ordenarPorMiembros() {
    const container = document.querySelector('.comunidades-grid');
    if (!container) return;
    
    const tarjetas = Array.from(container.querySelectorAll('.tarjeta-comunidad'));
    
    tarjetas.sort((a, b) => {
        const miembrosA = parseInt(a.getAttribute('data-miembros') || '0');
        const miembrosB = parseInt(b.getAttribute('data-miembros') || '0');
        return miembrosB - miembrosA;
    });
    
    tarjetas.forEach(tarjeta => {
        container.appendChild(tarjeta);
    });
}

function ordenarPorPublicaciones() {
    const container = document.querySelector('.comunidades-grid');
    if (!container) return;
    
    const tarjetas = Array.from(container.querySelectorAll('.tarjeta-comunidad'));
    
    tarjetas.sort((a, b) => {
        const publicacionesA = parseInt(a.getAttribute('data-publicaciones') || '0');
        const publicacionesB = parseInt(b.getAttribute('data-publicaciones') || '0');
        return publicacionesB - publicacionesA;
    });
    
    tarjetas.forEach(tarjeta => {
        container.appendChild(tarjeta);
    });
}




































// Parte 1: Front-end - Carga de categorías y subcategorías al crear una comunidad

document.addEventListener('DOMContentLoaded', function() {
    // Referencia al formulario de crear comunidad
    const formCrearComunidad = document.querySelector('#modal-crear-comunidad form');
    
    // Validación del formulario de crear comunidad
    if (formCrearComunidad) {
        // Marcar visualmente el campo de reglas como obligatorio
        const reglasLabel = document.querySelector('label[for="reglas"]');
        if (reglasLabel) {
            // Añadir asterisco para indicar campo obligatorio
            reglasLabel.innerHTML = 'Reglas de la comunidad <span class="campo-obligatorio">*</span>';
            
            // Añadir pequeño texto de ayuda
            const hintText = document.createElement('p');
            hintText.className = 'hint-text';
            hintText.textContent = 'Las reglas son obligatorias y ayudan a mantener el orden en la comunidad';
            reglasLabel.parentNode.insertBefore(hintText, reglasLabel.nextSibling);
        }
        
        // Validar el formulario antes de enviar
        formCrearComunidad.addEventListener('submit', function(e) {
            // Obtener el campo de reglas
            const reglasInput = document.getElementById('reglas');
            
            // Validar que el campo reglas no esté vacío
            if (!reglasInput || !reglasInput.value.trim()) {
                e.preventDefault(); // Prevenir el envío del formulario
                mostrarNotificacion('Las reglas de la comunidad son obligatorias', 'error');
                
                // Agregar clase de error visual y enfocar
                reglasInput.classList.add('campo-error');
                reglasInput.focus();
                
                // Agregar texto de ayuda
                const errorText = document.createElement('p');
                errorText.className = 'texto-error';
                errorText.textContent = 'Este campo es obligatorio';
                
                // Añadir mensaje de error después del textarea si no existe ya
                if (!reglasInput.parentNode.querySelector('.texto-error')) {
                    reglasInput.parentNode.appendChild(errorText);
                }
                
                return false;
            }
            
            // Si pasa la validación, continuar con el envío
            return true;
        });
        
        // Remover clase de error cuando el usuario comience a escribir
        const reglasInput = document.getElementById('reglas');
        if (reglasInput) {
            reglasInput.addEventListener('input', function() {
                this.classList.remove('campo-error');
                const errorText = this.parentNode.querySelector('.texto-error');
                if (errorText) {
                    errorText.remove();
                }
            });
        }

        // Cargar categorías administradas
        cargarCategorias();
    }
    
    // Variables para almacenar todas las subcategorías
    let todasLasSubcategorias = [];
    
    // Función para cargar categorías desde la API
    function cargarCategorias() {
        fetch('/api/categorias')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const selectCategoria = document.getElementById('categoria');
                    if (selectCategoria) {
                        // Limpiar opciones existentes
                        selectCategoria.innerHTML = '<option value="">Selecciona una categoría</option>';
                        
                        // Añadir nuevas opciones
                        data.categorias.forEach(categoria => {
                            const option = document.createElement('option');
                            option.value = categoria.nombre;
                            option.textContent = categoria.nombre;
                            selectCategoria.appendChild(option);
                        });
                        
                        // Configurar evento para cargar subcategorías al cambiar la categoría
                        selectCategoria.addEventListener('change', function() {
                            if (this.value) {
                                cargarSubcategorias(this.value);
                            } else {
                                // Limpiar subcategorías si no hay categoría seleccionada
                                const selectSubcategoria = document.getElementById('subcategoria');
                                const selectExtraSubcategoria = document.getElementById('subcategoria-extra');
                                
                                if (selectSubcategoria) {
                                    selectSubcategoria.innerHTML = '<option value="">Selecciona una subcategoría</option>';
                                    selectSubcategoria.disabled = true;
                                }
                                
                                if (selectExtraSubcategoria) {
                                    selectExtraSubcategoria.innerHTML = '<option value="">Selecciona una sub-etiqueta extra</option>';
                                    selectExtraSubcategoria.disabled = true;
                                }
                            }
                        });
                    }
                } else {
                    console.error('Error al cargar categorías:', data.mensaje);
                    mostrarNotificacion('Error al cargar categorías', 'error');
                }
            })
            .catch(error => {
                console.error('Error al cargar categorías:', error);
                mostrarNotificacion('Error al cargar categorías', 'error');
            });
    }
    
    // Función para cargar subcategorías basadas en la categoría seleccionada
    function cargarSubcategorias(categoria) {
        fetch(`/api/subcategorias?categoria=${encodeURIComponent(categoria)}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Guardar todas las subcategorías
                    todasLasSubcategorias = data.subcategorias;
                    
                    const selectSubcategoria = document.getElementById('subcategoria');
                    const selectExtraSubcategoria = document.getElementById('subcategoria-extra');
                    
                    if (selectSubcategoria) {
                        // Limpiar opciones existentes
                        selectSubcategoria.innerHTML = '<option value="">Selecciona una subcategoría</option>';
                        
                        // Añadir nuevas opciones
                        todasLasSubcategorias.forEach(subcategoria => {
                            const option = document.createElement('option');
                            option.value = subcategoria.nombre;
                            option.textContent = subcategoria.nombre;
                            selectSubcategoria.appendChild(option);
                        });
                        
                        // Habilitar el selector de subcategorías
                        selectSubcategoria.disabled = false;
                        
                        // Configurar evento para actualizar las subcategorías extras
                        selectSubcategoria.addEventListener('change', function() {
                            actualizarExtraSubcategorias(this.value);
                        });
                    }
                    
                    // Limpiar y deshabilitar el selector de subcategorías extra
                    if (selectExtraSubcategoria) {
                        selectExtraSubcategoria.innerHTML = '<option value="">Selecciona una sub-etiqueta extra</option>';
                        selectExtraSubcategoria.disabled = true;
                    }
                } else {
                    console.error('Error al cargar subcategorías:', data.mensaje);
                    mostrarNotificacion('Error al cargar subcategorías', 'error');
                }
            })
            .catch(error => {
                console.error('Error al cargar subcategorías:', error);
                mostrarNotificacion('Error al cargar subcategorías', 'error');
            });
    }
    
    // Función para actualizar las subcategorías extras basadas en la subcategoría seleccionada
    function actualizarExtraSubcategorias(subcategoriaSeleccionada) {
        const selectExtraSubcategoria = document.getElementById('subcategoria-extra');
        
        if (selectExtraSubcategoria) {
            // Limpiar opciones existentes
            selectExtraSubcategoria.innerHTML = '<option value="">Selecciona una sub-etiqueta extra</option>';
            
            // Si hay una subcategoría seleccionada, mostrar las demás como opciones
            if (subcategoriaSeleccionada) {
                // Filtrar para mostrar solo las subcategorías que no son la seleccionada
                const subcategoriasRestantes = todasLasSubcategorias.filter(
                    subcategoria => subcategoria.nombre !== subcategoriaSeleccionada
                );
                
                // Añadir opciones filtradas
                subcategoriasRestantes.forEach(subcategoria => {
                    const option = document.createElement('option');
                    option.value = subcategoria.nombre;
                    option.textContent = subcategoria.nombre;
                    selectExtraSubcategoria.appendChild(option);
                });
                
                // Habilitar el selector si hay opciones disponibles
                selectExtraSubcategoria.disabled = subcategoriasRestantes.length === 0;
            } else {
                // Si no hay subcategoría seleccionada, deshabilitar el selector
                selectExtraSubcategoria.disabled = true;
            }
        }
    }
    
    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notificacion ${tipo}`;
        notification.textContent = mensaje;
        
        // Añadir al cuerpo del documento
        document.body.appendChild(notification);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }
    
    // Añadir estilos dinámicamente para los elementos de error
    const style = document.createElement('style');
    style.textContent = `
        .campo-error {
            border: 1px solid #ff3333 !important;
            background-color: #fff8f8;
        }
        .texto-error {
            color: #ff3333;
            font-size: 0.8em;
            margin-top: 5px;
            margin-bottom: 0;
        }
        .campo-obligatorio {
            color: #ff3333;
        }
        .hint-text {
            color: #666;
            font-size: 0.8em;
            margin-top: 2px;
            margin-bottom: 8px;
        }
        .notificacion {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 9999;
            opacity: 1;
            transition: opacity 0.5s;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .notificacion.error {
            background-color: #ff4d4d;
        }
        .notificacion.exito {
            background-color: #4CAF50;
        }
    `;
    document.head.appendChild(style);
    
    // Verificar y mostrar mensajes de error o éxito pasados por URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const exito = urlParams.get('exito');
    const mensaje = urlParams.get('mensaje');
    
    if ((error || exito) && mensaje) {
        mostrarNotificacion(mensaje, error ? 'error' : 'exito');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    function inicializarBotonesExpandir() {
        const textosLargos = document.querySelectorAll('.descripcion-texto.truncado, .reglas-texto.truncado');
        
        textosLargos.forEach(texto => {
         
                if (!contenedor.querySelector('.btn-expandir')) {
                    const boton = document.createElement('button');
                    boton.className = 'btn-expandir';
                    boton.textContent = 'Ver más';
                    boton.addEventListener('click', function() {
                        if (texto.classList.contains('truncado')) {
                            texto.classList.remove('truncado');
                            boton.textContent = 'Ver menos';
                            // Ajustar la tarjeta padre para que se expanda
                            tarjeta.style.height = 'auto';
                        } else {
                            texto.classList.add('truncado');
                            boton.textContent = 'Ver más';
                            // Volver a la altura mínima cuando se contrae
                            tarjeta.style.height = '';
                        }
                    });
                    
                    contenedor.appendChild(boton);
                }
            
        });
    }
    
    inicializarBotonesExpandir();
    
    const pestanas = document.querySelectorAll('.pestana');
    pestanas.forEach(pestana => {
        pestana.addEventListener('click', function() {
            setTimeout(() => {
                inicializarBotonesExpandir();
                // Resetear la altura de todas las tarjetas al cambiar pestaña
                document.querySelectorAll('.tarjeta-comunidad').forEach(tarjeta => {
                    tarjeta.style.height = '';
                });
            }, 100);
        });
    });
});

// Add this code to your existing comunidades.js file

document.addEventListener('DOMContentLoaded', function() {
    // Existing event listeners...
    
    // Tab switching for admin categories
    const pestanasAdmin = document.querySelectorAll('.pestana-admin');
    pestanasAdmin.forEach(pestana => {
        pestana.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.pestana-admin').forEach(p => p.classList.remove('activa'));
            // Add active class to clicked tab
            this.classList.add('activa');
            
            // Hide all panels
            document.querySelectorAll('.panel-admin').forEach(panel => panel.classList.add('oculto'));
            // Show the selected panel
            const panelId = 'panel-' + this.getAttribute('data-tab-admin');
            document.getElementById(panelId).classList.remove('oculto');
        });
    });
    
    // Handle dynamic loading of subcategories based on selected category
    const categoriaPadreSelect = document.getElementById('categoria-padre');
    const subcategoriaPadreSelect = document.getElementById('subcategoria-padre');
    
    if (categoriaPadreSelect && subcategoriaPadreSelect) {
        categoriaPadreSelect.addEventListener('change', function() {
            const selectedCategoria = this.value;
            
            // Clear current options
            subcategoriaPadreSelect.innerHTML = '<option value="">Seleccione una subcategoría</option>';
            
            if (!selectedCategoria) return;
            
            // Fetch subcategories for selected category
            fetch(`/api/subcategorias?categoria=${selectedCategoria}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.subcategorias) {
                        data.subcategorias.forEach(subcategoria => {
                            const option = document.createElement('option');
                            option.value = subcategoria.nombre;
                            option.textContent = subcategoria.nombre;
                            subcategoriaPadreSelect.appendChild(option);
                        });
                    }
                })
                .catch(error => console.error('Error al cargar subcategorías:', error));
        });
    }
    
    // Handle extrasubcategories form
    const formExtrasubcategoria = document.getElementById('form-extrasubcategoria');
    if (formExtrasubcategoria) {
        formExtrasubcategoria.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const extrasubcategoriaId = document.getElementById('extrasubcategoria-id').value;
            const url = extrasubcategoriaId ? 
                `/admin/extrasubcategorias/actualizar/${extrasubcategoriaId}` : 
                '/admin/extrasubcategorias/crear';
            
            const formData = {
                nombre: document.getElementById('nombre-extrasubcategoria').value,
                descripcion: document.getElementById('descripcion-extrasubcategoria').value,
                categoriaPadre: document.getElementById('categoria-padre-extra').value,
                subcategoriaPadre: document.getElementById('subcategoria-padre').value
            };
            
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Reload the page or update the UI
                    window.location.reload();
                } else {
                    alert('Error: ' + data.mensaje);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Ha ocurrido un error al guardar la extrasubcategoría');
            });
        });
    }
    
    // Handle extrasubcategory edit buttons
    const editExtrasubBtns = document.querySelectorAll('.btn-editar-extrasubcategoria');
    editExtrasubBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const extrasubcategoriaId = this.getAttribute('data-id');
            
            // Fetch extrasubcategory data
            fetch(`/admin/extrasubcategorias/${extrasubcategoriaId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const extrasubcategoria = data.extrasubcategoria;
                        
                        // Populate form
                        document.getElementById('extrasubcategoria-id').value = extrasubcategoria.id;
                        document.getElementById('nombre-extrasubcategoria').value = extrasubcategoria.nombre;
                        document.getElementById('descripcion-extrasubcategoria').value = extrasubcategoria.descripcion || '';
                        
                        // Set categoria-padre and load subcategories
                        const categoriaPadreExtraSelect = document.getElementById('categoria-padre-extra');
                        categoriaPadreExtraSelect.value = extrasubcategoria.categoria;
                        
                        // Trigger change event to load subcategories
                        const event = new Event('change');
                        categoriaPadreExtraSelect.dispatchEvent(event);
                        
                        // Need to wait for subcategories to load before setting value
                        setTimeout(() => {
                            document.getElementById('subcategoria-padre').value = extrasubcategoria.subcategoria;
                        }, 500);
                        
                        // Scroll to form
                    } else {
                        alert('Error: ' + data.mensaje);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Ha ocurrido un error al cargar la extrasubcategoría');
                });
        });
    });
    
    // Handle extrasubcategory delete buttons
    const deleteExtrasubBtns = document.querySelectorAll('.btn-eliminar-extrasubcategoria');
    deleteExtrasubBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('¿Está seguro de eliminar esta extrasubcategoría? Esta acción no se puede deshacer.')) {
                const extrasubcategoriaId = this.getAttribute('data-id');
                
                fetch(`/admin/extrasubcategorias/${extrasubcategoriaId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Reload the page or update the UI
                        window.location.reload();
                    } else {
                        alert('Error: ' + data.mensaje);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Ha ocurrido un error al eliminar la extrasubcategoría');
                });
            }
        });
    });
    
    // Handle dynamic loading in community create form
    const categoriaSelect = document.getElementById('categoria');
    const subcategoriaSelect = document.getElementById('subcategoria');
    const extrasubcategoriaSelect = document.getElementById('subcategoria-extra');
    
    if (categoriaSelect && subcategoriaSelect && extrasubcategoriaSelect) {
        categoriaSelect.addEventListener('change', function() {
            const selectedCategoria = this.value;
            
            // Clear current options
            subcategoriaSelect.innerHTML = '<option value="">Seleccione una subcategoría</option>';
            extrasubcategoriaSelect.innerHTML = '<option value="">Seleccione una extra subcategoría</option>';
            
            if (!selectedCategoria) return;
            
            // Fetch subcategories for selected category
            fetch(`/api/subcategorias?categoria=${selectedCategoria}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.subcategorias) {
                        data.subcategorias.forEach(subcategoria => {
                            const option = document.createElement('option');
                            option.value = subcategoria.nombre;
                            option.textContent = subcategoria.nombre;
                            subcategoriaSelect.appendChild(option);
                        });
                    }
                })
                .catch(error => console.error('Error al cargar subcategorías:', error));
        });
        
        subcategoriaSelect.addEventListener('change', function() {
            const selectedCategoria = categoriaSelect.value;
            const selectedSubcategoria = this.value;
            
            // Clear current options
            extrasubcategoriaSelect.innerHTML = '<option value="">Seleccione una extra subcategoría</option>';
            
            if (!selectedCategoria || !selectedSubcategoria) return;
            
            // Fetch extrasubcategories for selected category and subcategory
            fetch(`/api/extrasubcategorias?categoria=${selectedCategoria}&subcategoria=${selectedSubcategoria}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.extrasubcategorias) {
                        data.extrasubcategorias.forEach(extrasubcategoria => {
                            const option = document.createElement('option');
                            option.value = extrasubcategoria.nombre;
                            option.textContent = extrasubcategoria.nombre;
                            option.setAttribute('data-categoria', extrasubcategoria.categoria);
                            option.setAttribute('data-subcategoria', extrasubcategoria.subcategoria);
                            extrasubcategoriaSelect.appendChild(option);
                        });
                    }
                })
                .catch(error => console.error('Error al cargar extrasubcategorías:', error));
        });
    }
    
    // Handle cancel buttons for each form
    const cancelExtrasubBtn = document.getElementById('cancelar-extrasubcategoria-btn');
    if (cancelExtrasubBtn) {
        cancelExtrasubBtn.addEventListener('click', function() {
            // Reset the form
            document.getElementById('form-extrasubcategoria').reset();
            document.getElementById('extrasubcategoria-id').value = '';
        });
    }
});


document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const btnEliminarComunidad = document.getElementById('btn-eliminar-comunidad');
    let modalEliminar = null;
    let comunidadSeleccionada = null;

    // Crear el modal solo cuando se necesite (lazy loading)
    function crearModalEliminarComunidad() {
        // Si ya existe el modal, no lo creamos de nuevo
        if (document.querySelector('.modal-eliminar-comunidad')) {
            return document.querySelector('.modal-eliminar-comunidad');
        }

        // Crear el modal
        const modal = document.createElement('div');
        modal.className = 'modal-eliminar-comunidad';
        modal.innerHTML = `
            <div class="modal-contenido-eliminar">
                <span class="cerrar-modal-eliminar">&times;</span>
                <h2><i class="fas fa-trash"></i> Eliminar Comunidad</h2>
                
                <div class="loading-spinner">
                    <i class="fas fa-spinner"></i>
                </div>
                
                <div class="lista-comunidades">
                    <!-- Aquí se cargarán las comunidades -->
                </div>
                
                <div class="confirmacion-eliminar">
                    <p>¿Estás seguro de que deseas eliminar esta comunidad? Esta acción no se puede deshacer.</p>
                    <div class="btns-confirmacion">
                        <button class="btn-cancelar">Cancelar</button>
                        <button class="btn-confirmar">Eliminar</button>
                    </div>
                </div>
                
                <div class="mensaje-resultado"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Agregar eventos al modal
        const cerrarModal = modal.querySelector('.cerrar-modal-eliminar');
        cerrarModal.addEventListener('click', () => {
            modal.style.display = 'none';
            // Recargar la página al cerrar el modal
            window.location.reload();
        });
        
        // Cerrar modal al hacer clic fuera del contenido
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                // Recargar la página al cerrar el modal
                window.location.reload();
            }
        });
        
        // Eventos para los botones de confirmación
        const btnCancelar = modal.querySelector('.btn-cancelar');
        btnCancelar.addEventListener('click', () => {
            modal.querySelector('.confirmacion-eliminar').style.display = 'none';
            comunidadSeleccionada = null;
            // Recargar la página al cancelar
            window.location.reload();
        });
        
        const btnConfirmar = modal.querySelector('.btn-confirmar');
        btnConfirmar.addEventListener('click', () => {
            if (comunidadSeleccionada) {
                eliminarComunidad(comunidadSeleccionada);
            }
        });
        
        return modal;
    }

    // Cargar las comunidades del usuario
    async function cargarComunidadesUsuario() {
        const listaComunidades = modalEliminar.querySelector('.lista-comunidades');
        const loadingSpinner = modalEliminar.querySelector('.loading-spinner');
        const mensajeResultado = modalEliminar.querySelector('.mensaje-resultado');
        
        // Ocultar mensajes previos
        mensajeResultado.style.display = 'none';
        mensajeResultado.className = 'mensaje-resultado';
        
        // Mostrar spinner de carga
        loadingSpinner.style.display = 'block';
        listaComunidades.innerHTML = '';
        
        try {
            console.log('Cargando comunidades administradas...');
            const response = await fetch('/api/comunidades/administradas', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin' // Asegura que se envíen las cookies de sesión
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar las comunidades');
            }
            
            const data = await response.json();
            console.log('Comunidades cargadas:', data);
            
            // Ocultar spinner
            loadingSpinner.style.display = 'none';
            
            if (data.error) {
                listaComunidades.innerHTML = `
                    <div class="sin-comunidades">
                        <p>${data.mensaje || 'Ocurrió un error al cargar las comunidades'}</p>
                    </div>
                `;
                return;
            }
            
            if (!data.comunidades || data.comunidades.length === 0) {
                listaComunidades.innerHTML = `
                    <div class="sin-comunidades">
                        <p>No administras ninguna comunidad que puedas eliminar</p>
                    </div>
                `;
                return;
            }
            
            // Mostrar las comunidades - solo con el nombre como solicitaste
            let html = '';
            data.comunidades.forEach(comunidad => {
                html += `
                    <div class="comunidad-item" data-id="${comunidad.id}">
                        <div class="comunidad-info">
                            <div class="comunidad-nombre">${comunidad.nombre}</div>
                        </div>
                        <button class="btn-eliminar" data-id="${comunidad.id}">
<i class="fas fa-check"></i> Seleccionar
                        </button>
                    </div>
                `;
            });
            
            listaComunidades.innerHTML = html;
            
            // Agregar eventos a los botones de eliminar
            const btnsEliminar = listaComunidades.querySelectorAll('.btn-eliminar');
            btnsEliminar.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const comunidadId = btn.getAttribute('data-id');
                    const confirmacion = modalEliminar.querySelector('.confirmacion-eliminar');
                    
                    // Guardar el ID de la comunidad seleccionada
                    comunidadSeleccionada = comunidadId;
                    
                    // Mostrar la confirmación
                    confirmacion.style.display = 'block';
                    
                    // Hacer scroll hasta la confirmación
                    confirmacion.scrollIntoView({ behavior: 'smooth' });
                });
            });
            
        } catch (error) {
            console.error('Error:', error);
            loadingSpinner.style.display = 'none';
            listaComunidades.innerHTML = `
                <div class="sin-comunidades">
                    <p>Ocurrió un error al cargar las comunidades. Por favor, inténtalo de nuevo más tarde.</p>
                    <p class="error-detalle" style="font-size: 0.8rem; color: #e74c3c; margin-top: 10px;">Error técnico: ${error.message}</p>
                </div>
            `;
        }
    }

   // Función modificada para recargar la página después de eliminar
   async function eliminarComunidad(comunidadId) {
        const confirmacion = modalEliminar.querySelector('.confirmacion-eliminar');
        const loadingSpinner = modalEliminar.querySelector('.loading-spinner');
        const mensajeResultado = modalEliminar.querySelector('.mensaje-resultado');
        
        // Ocultar confirmación y mostrar spinner
        confirmacion.style.display = 'none';
        loadingSpinner.style.display = 'block';
        mensajeResultado.style.display = 'none';
        
        try {
            console.log('Eliminando comunidad con ID:', comunidadId);
            
            const response = await fetch(`/api/comunidades/${comunidadId}/eliminar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin' // Asegura que se envíen las cookies de sesión
            });
            
            console.log('Respuesta recibida:', response);
            
            let data;
            try {
                data = await response.json();
                console.log('Datos de respuesta:', data);
            } catch (jsonError) {
                console.error('Error al procesar JSON:', jsonError);
                throw new Error('Respuesta no válida del servidor');
            }
            
            // Ocultar spinner
            loadingSpinner.style.display = 'none';
            
            if (data.error) {
                // Mostrar mensaje de error
                mensajeResultado.className = 'mensaje-resultado mensaje-error';
                mensajeResultado.style.display = 'block';
                mensajeResultado.textContent = data.mensaje || 'Error al eliminar la comunidad';
            } else {
                // Mostrar mensaje de éxito (opcional, si no se recarga antes de que el usuario lo vea)
                mensajeResultado.className = 'mensaje-resultado mensaje-exito';
                mensajeResultado.style.display = 'block';
                mensajeResultado.textContent = data.mensaje || 'Comunidad eliminada correctamente';
            
                // Recargar la página inmediatamente
                window.location.reload();
            }
            
        } catch (error) {
            console.error('Error:', error);
            loadingSpinner.style.display = 'none';
            mensajeResultado.className = 'mensaje-resultado mensaje-error';
            mensajeResultado.style.display = 'block';
            mensajeResultado.textContent = 'Ocurrió un error al eliminar la comunidad';
        }
    }

    // Evento para abrir el modal
    if (btnEliminarComunidad) {
        btnEliminarComunidad.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Crear el modal si no existe
            if (!modalEliminar) {
                modalEliminar = crearModalEliminarComunidad();
            }
            
            // Mostrar el modal
            modalEliminar.style.display = 'block';
            
            // Cargar las comunidades
            cargarComunidadesUsuario();
        });
    }
});



// Existing code in comunidades.js remains the same

// Add event listeners for destacados links
document.addEventListener('DOMContentLoaded', function() {
    // Get all links in the destacados list
    const destacadosLinks = document.querySelectorAll('.lista-destacados li a');
    
    // Add click event listener to each link
    destacadosLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Extract the community ID from the href attribute
            // The href format is "/comunidad/[id]"
            const href = this.getAttribute('href');
            const communityId = href.split('/').pop();
            
            // Redirect to the forum page with the community ID as a query parameter
            window.location.href = `/foro?comunidad_id=${communityId}`;
        });
    });
});







































// Función para manejar el clic en "Ver Foro"
function verForo(comunidadId, esPrivada) {
    event.preventDefault(); // Detener la navegación predeterminada
    
    if (esPrivada) {
        // Si es privada, verificamos si tiene acceso
        verificarAccesoComunidadPrivada(comunidadId);
    } else {
        // Si no es privada, redirigir directamente al foro
        window.location.href = `/foro?comunidad_id=${comunidadId}`;
    }
}

// Verificar si el usuario puede acceder a una comunidad privada
function verificarAccesoComunidadPrivada(comunidadId) {
    fetch(`/comunidad/${comunidadId}/verificar-acceso`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.puedeAcceder) {
            // Si puede acceder, redirigimos al foro
            window.location.href = `/foro?comunidad_id=${comunidadId}`;
        } else if (data.solicitudPendiente) {
            // Si ya tiene una solicitud pendiente
            mostrarNotificacion('Ya tienes una solicitud pendiente para esta comunidad. Espera la respuesta del administrador.', 'info');
        } else {
            // Si no tiene acceso ni solicitud, mostrar modal para enviar solicitud
            mostrarModalSolicitudPrivada(comunidadId);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al verificar el acceso a la comunidad', 'error');
    });
}

// Mostrar modal para enviar solicitud a comunidad privada
function mostrarModalSolicitudPrivada(comunidadId) {
    // Establecer el ID de la comunidad en el formulario
    const comunidadIdPrivada = document.getElementById('comunidad-id-privada');
    comunidadIdPrivada.value = comunidadId;
    
    // Mostrar el modal
    const modalComunidadPrivada = document.getElementById('modal-comunidad-privada');
    modalComunidadPrivada.style.display = 'flex';
}




















// Funcionalidad para solicitudes de comunidades (comunidades.js)

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos DOM
    const btnMisSolicitudes = document.getElementById('btn-mis-solicitudes');
    const btnAdminSolicitudes = document.getElementById('btn-admin-solicitudes');
    const modalMisSolicitudes = document.getElementById('modal-mis-solicitudes');
    const modalAdminSolicitudes = document.getElementById('modal-admin-solicitudes');
    const cerrarModalMisSolicitudes = document.getElementById('cerrar-modal-mis-solicitudes');
    const cerrarModalAdminSolicitudes = document.getElementById('cerrar-modal-admin-solicitudes');
    const modalComunidadPrivada = document.getElementById('modal-comunidad-privada');
    const cerrarModalPrivada = document.getElementById('cerrar-modal-privada');
    const cancelarSolicitudBtn = document.getElementById('cancelar-solicitud-btn');
    const formSolicitudPrivada = document.getElementById('form-solicitud-privada');
    const comunidadIdPrivada = document.getElementById('comunidad-id-privada');
    
    // Variable para almacenar temporalmente el ID de la comunidad privada
    let comunidadPrivadaSeleccionada = null;

    // Mostrar modal de mis solicitudes pendientes
    if (btnMisSolicitudes) {
        btnMisSolicitudes.addEventListener('click', function(e) {
            e.preventDefault();
            modalMisSolicitudes.style.display = 'flex';
        });
    }
    
    // Mostrar modal de administración de solicitudes (para moderadores/admins)
    if (btnAdminSolicitudes) {
        btnAdminSolicitudes.addEventListener('click', function(e) {
            e.preventDefault();
            modalAdminSolicitudes.style.display = 'flex';
        });
    }
    
    // Cerrar modales
    if (cerrarModalMisSolicitudes) {
        cerrarModalMisSolicitudes.addEventListener('click', function() {
            modalMisSolicitudes.style.display = 'none';
        });
    }
    
    if (cerrarModalAdminSolicitudes) {
        cerrarModalAdminSolicitudes.addEventListener('click', function() {
            modalAdminSolicitudes.style.display = 'none';
        });
    }
    
    if (cerrarModalPrivada) {
        cerrarModalPrivada.addEventListener('click', function() {
            modalComunidadPrivada.style.display = 'none';
        });
    }
    
    if (cancelarSolicitudBtn) {
        cancelarSolicitudBtn.addEventListener('click', function() {
            modalComunidadPrivada.style.display = 'none';
        });
    }
    
    // Cerrar modales al hacer clic fuera del contenido
    window.addEventListener('click', function(e) {
        if (e.target === modalMisSolicitudes) {
            modalMisSolicitudes.style.display = 'none';
        }
        if (e.target === modalAdminSolicitudes) {
            modalAdminSolicitudes.style.display = 'none';
        }
        if (e.target === modalComunidadPrivada) {
            modalComunidadPrivada.style.display = 'none';
        }
    });
    
    // Filtro de solicitudes por comunidad (para admins/moderadores)
    const filtroComunidad = document.getElementById('filtro-comunidad');
    if (filtroComunidad) {
        filtroComunidad.addEventListener('change', function() {
            const comunidadId = this.value;
            const solicitudes = document.querySelectorAll('.solicitud-admin-item');
            
            solicitudes.forEach(solicitud => {
                if (!comunidadId || solicitud.dataset.comunidad === comunidadId) {
                    solicitud.style.display = 'flex';
                } else {
                    solicitud.style.display = 'none';
                }
            });
        });
    }
    
    // Gestionar evento para cancelar solicitudes pendientes
    const btnsCancelarSolicitud = document.querySelectorAll('.btn-cancelar-solicitud');
    btnsCancelarSolicitud.forEach(btn => {
        btn.addEventListener('click', function() {
            const solicitudId = this.dataset.id;
            
            if (confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) {
                cancelarSolicitud(solicitudId);
            }
        });
    });
    
    // Gestionar eventos para aceptar/rechazar solicitudes (admin)
    const btnsAceptarSolicitud = document.querySelectorAll('.btn-aceptar-solicitud');
    const btnsRechazarSolicitud = document.querySelectorAll('.btn-rechazar-solicitud');
    
    btnsAceptarSolicitud.forEach(btn => {
        btn.addEventListener('click', function() {
            const solicitudId = this.dataset.id;
            const respuesta = this.closest('.solicitud-admin-item').querySelector('.respuesta-textarea').value;
            
            responderSolicitud(solicitudId, 'aceptada', respuesta);
        });
    });
    
    btnsRechazarSolicitud.forEach(btn => {
        btn.addEventListener('click', function() {
            const solicitudId = this.dataset.id;
            const respuesta = this.closest('.solicitud-admin-item').querySelector('.respuesta-textarea').value;
            
            responderSolicitud(solicitudId, 'rechazada', respuesta);
        });
    });
    
    // Manejar el envío del formulario de solicitud para comunidad privada
    if (formSolicitudPrivada) {
        formSolicitudPrivada.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const comunidadId = comunidadIdPrivada.value;
            const mensaje = document.getElementById('mensaje-solicitud').value;
            
            enviarSolicitudPrivada(comunidadId, mensaje);
        });
    }
    
    
    // Funciones para realizar peticiones AJAX
    
    // Cancelar una solicitud pendiente
    function cancelarSolicitud(solicitudId) {
        fetch(`/solicitudes/cancelar/${solicitudId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Eliminar la solicitud del DOM
                const solicitudElement = document.querySelector(`.solicitud-item[data-id="${solicitudId}"]`);
                if (solicitudElement) {
                    solicitudElement.remove();
                }
                
                // Mostrar mensaje de éxito
                mostrarNotificacion('Solicitud cancelada correctamente', 'exito');
                
                // Si no quedan solicitudes, mostrar mensaje
                const listaSolicitudes = document.querySelector('.lista-solicitudes');
                if (listaSolicitudes && listaSolicitudes.children.length === 0) {
                    listaSolicitudes.innerHTML = '<p class="sin-solicitudes">No tienes solicitudes pendientes para unirte a comunidades.</p>';
                }
            } else {
                mostrarNotificacion('Error al cancelar la solicitud: ' + data.mensaje, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarNotificacion('Error al procesar la solicitud', 'error');
        });
    }
    
   // Responder a una solicitud (aceptar/rechazar)
function responderSolicitud(solicitudId, estado, respuesta) {
    fetch('/solicitudes/responder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            solicitudId: solicitudId,
            estado: estado,
            respuesta: respuesta
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Mostrar mensaje de éxito
            mostrarNotificacion(`Solicitud ${estado === 'aceptada' ? 'aceptada' : 'rechazada'} correctamente`, 'exito');
            
            // Si fue aceptada, recargar la página automáticamente
            if (estado === 'aceptada') {
                setTimeout(() => {
                    window.location.reload();
                }, 1500); // Recargar después de 1.5 segundos para que se vea la notificación
            } else {
                // Si fue rechazada, solo eliminar la solicitud del DOM
                const solicitudElement = document.querySelector(`.solicitud-admin-item[data-id="${solicitudId}"]`);
                if (solicitudElement) {
                    solicitudElement.remove();
                }
                
                // Si no quedan solicitudes, mostrar mensaje
                const listaSolicitudes = document.querySelector('.lista-solicitudes-admin');
                if (listaSolicitudes && document.querySelectorAll('.solicitud-admin-item:not([style*="display: none"])').length === 0) {
                    listaSolicitudes.innerHTML = '<p class="sin-solicitudes">No hay solicitudes pendientes para tus comunidades.</p>';
                }
                
                // Si se filtra y no quedan solicitudes visibles
                actualizarVisibilidadMensajeSinSolicitudes();
            }
        } else {
            mostrarNotificacion('Error al procesar la solicitud: ' + data.mensaje, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al procesar la solicitud', 'error');
    });
}
    
    // Verificar si el usuario puede acceder a una comunidad privada
    function verificarAccesoComunidadPrivada(comunidadId, url) {
        fetch(`/comunidad/${comunidadId}/verificar-acceso`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.puedeAcceder) {
                // Si puede acceder, redirigimos al foro
                window.location.href = url;
            } else if (data.solicitudPendiente) {
                // Si ya tiene una solicitud pendiente
                mostrarNotificacion('Ya tienes una solicitud pendiente para esta comunidad. Espera la respuesta del administrador.', 'info');
            } else {
                // Si no tiene acceso ni solicitud, mostrar modal para enviar solicitud
                mostrarModalSolicitudPrivada(comunidadId);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarNotificacion('Error al verificar el acceso a la comunidad', 'error');
        });
    }
    
   // Enviar solicitud para unirse a comunidad privada
function enviarSolicitudPrivada(comunidadId, mensaje) {
    fetch(`/comunidad/${comunidadId}/unirse`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            mensaje: mensaje
        })
    })
    .then(response => response.json())
    .then(data => {
        // Ocultar modal
        modalComunidadPrivada.style.display = 'none';
        
        if (data.success) {
            mostrarNotificacion(data.mensaje, 'exito');
            
            // Limpiar el formulario
            document.getElementById('mensaje-solicitud').value = '';
            
            // Recargar la página después de un breve retraso
            setTimeout(() => {
                window.location.reload();
            }, 500); // Recargar después de 1.5 segundos para que se vea la notificación
        } else {
            mostrarNotificacion(data.mensaje, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al enviar la solicitud', 'error');
        modalComunidadPrivada.style.display = 'none';
    });
}
    
    // Mostrar modal para enviar solicitud a comunidad privada
    function mostrarModalSolicitudPrivada(comunidadId) {
        // Establecer el ID de la comunidad en el formulario
        comunidadIdPrivada.value = comunidadId;
        
        // Mostrar el modal
        modalComunidadPrivada.style.display = 'flex';
    }
    
    // Actualizar visibilidad del mensaje "sin solicitudes" según filtros
    function actualizarVisibilidadMensajeSinSolicitudes() {
        const listaSolicitudes = document.querySelector('.lista-solicitudes-admin');
        const solicitudesVisibles = document.querySelectorAll('.solicitud-admin-item:not([style*="display: none"])');
        const mensajeSinSolicitudes = document.querySelector('.lista-solicitudes-admin .sin-solicitudes');
        
        if (listaSolicitudes && solicitudesVisibles.length === 0) {
            if (!mensajeSinSolicitudes) {
                const mensaje = document.createElement('p');
                mensaje.className = 'sin-solicitudes';
                mensaje.textContent = 'No hay solicitudes pendientes para esta comunidad.';
                listaSolicitudes.appendChild(mensaje);
            }
        } else if (mensajeSinSolicitudes && solicitudesVisibles.length > 0) {
            mensajeSinSolicitudes.remove();
        }
    }
    
    // Función para mostrar notificaciones al usuario
    function mostrarNotificacion(mensaje, tipo) {
        // Crear el elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;
        
        // Añadir al DOM
        document.body.appendChild(notificacion);
        
        // Mostrar con animación
        setTimeout(() => {
            notificacion.classList.add('mostrar');
        }, 10);
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            notificacion.classList.remove('mostrar');
            setTimeout(() => {
                notificacion.remove();
            }, 300);
        }, 5000);
    }
});



























































document.addEventListener("DOMContentLoaded", function () {
    const btnAbrir = document.getElementById("btn-admin-categorias");
    const modal = document.getElementById("modal-categorias");
    const btnCerrar = document.getElementById("cerrar-modal-categorias");

    // Abrir modal
    btnAbrir.addEventListener("click", function (e) {
        e.preventDefault();
        modal.classList.add("activo");
    });

    // Cerrar modal
    btnCerrar.addEventListener("click", function () {
        modal.classList.remove("activo");
    });

    // Cerrar al hacer clic fuera del contenido
    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            modal.classList.remove("activo");
        }
    });
});