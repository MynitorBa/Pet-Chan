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
    
    // La función no reordena, eso lo hará ordenarComunidadesPorRangos después

 
 // Llamar a la función de ordenamiento después de cargar las comunidades
 ordenarComunidadesPorRangos();
 
 // También ordenar después de filtrar
 const filtroCategoria = document.getElementById('filtro-categoria');
 const filtroSubcategoria = document.getElementById('filtro-subcategoria');
 const buscarComunidad = document.getElementById('buscar-comunidad');
 
 if (filtroCategoria) {
     filtroCategoria.addEventListener('change', function() {
         // Llamar al filtro original y luego reordenar
         filtrarComunidades();
         ordenarComunidadesPorRangos();
     });
 }
 
 if (filtroSubcategoria) {
     filtroSubcategoria.addEventListener('change', function() {
         filtrarComunidades();
         ordenarComunidadesPorRangos();
     });
 }
 
 if (buscarComunidad) {
     buscarComunidad.addEventListener('input', function() {
         filtrarComunidades();
         ordenarComunidadesPorRangos();
     });
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


// Función para ordenar comunidades por rangos
function ordenarComunidadesPorRangos() {
    const container = document.querySelector('.comunidades-grid');
    if (!container) return;
    
    const tarjetas = Array.from(container.querySelectorAll('.tarjeta-comunidad'));
    
    // Definir el orden de prioridad para cada rango
    const prioridadRango3 = {
        'Premium': 6,
        'Administrador': 5,
        'VIP': 4,
        'Fundador': 3,
        'Moderador': 2,
        'Ninguno': 1
    };
    
    const prioridadRango2 = {
        'Experto': 6,
        'Crítico': 5,
        'Escritor': 4,
        'Artista': 3,
        'Colaborador': 2,
        'Ninguno': 1
    };
    
    const prioridadRango1 = {
        'Maestro': 6,
        'Veterano': 5,
        'Experimentado': 4,
        'Aprendiz': 3,
        'Novato': 2,
        'Ninguno': 1
    };
    
    // Ordenar las tarjetas según la jerarquía de rangos
    tarjetas.sort((a, b) => {
        // Obtener rangos de cada tarjeta
        const rangoA3 = a.getAttribute('data-rango3') || 'Ninguno';
        const rangoB3 = b.getAttribute('data-rango3') || 'Ninguno';
        
        const rangoA2 = a.getAttribute('data-rango2') || 'Ninguno';
        const rangoB2 = b.getAttribute('data-rango2') || 'Ninguno';
        
        const rangoA1 = a.getAttribute('data-rango1') || 'Ninguno';
        const rangoB1 = b.getAttribute('data-rango1') || 'Ninguno';
        
        // Comparar primero por rango3
        if (prioridadRango3[rangoA3] !== prioridadRango3[rangoB3]) {
            return prioridadRango3[rangoB3] - prioridadRango3[rangoA3]; // Orden descendente
        }
        
        // Si rango3 es igual, comparar por rango2
        if (prioridadRango2[rangoA2] !== prioridadRango2[rangoB2]) {
            return prioridadRango2[rangoB2] - prioridadRango2[rangoA2]; // Orden descendente
        }
        
        // Si rango2 es igual, comparar por rango1
        return prioridadRango1[rangoB1] - prioridadRango1[rangoA1]; // Orden descendente
    });
    
    // Volver a insertar las tarjetas en el orden correcto
    tarjetas.forEach(tarjeta => {
        container.appendChild(tarjeta);
    });
}







































document.addEventListener('DOMContentLoaded', function() {
    // Referencia al formulario y al campo de reglas
    const formCrearComunidad = document.querySelector('#modal-crear-comunidad form');
    const reglasInput = document.getElementById('reglas');
    
    if (reglasInput) {
        // Función para validar el número de saltos de línea consecutivos
        function validarSaltosDeLinea(texto) {
            // Buscar más de 5 saltos de línea consecutivos
            const demasiadosSaltos = /(\n\s*){5,}/.test(texto);
            return !demasiadosSaltos;
        }
        
        // Validar mientras el usuario escribe
        reglasInput.addEventListener('input', function() {
            const toggleBar = document.querySelector('.toggle-bar'); // Ajusta el selector según sea necesario
            
            // Remover clases de error previas
            this.classList.remove('campo-error');
            const errorTextPrevio = this.parentNode.querySelector('.texto-error');
            if (errorTextPrevio) {
                errorTextPrevio.remove();
            }
            
            // Validar los saltos de línea
            if (!validarSaltosDeLinea(this.value)) {
                // Mostrar error
                this.classList.add('campo-error');
                
                // Añadir mensaje de error
                const errorText = document.createElement('p');
                errorText.className = 'texto-error';
                errorText.textContent = 'No se permiten más de 5 saltos de línea consecutivos';
                this.parentNode.appendChild(errorText);
                
                // Desactivar toggle bar si existe
                if (toggleBar) {
                    toggleBar.classList.add('desactivado');
                    toggleBar.disabled = true;
                }
            } else {
                // Reactivar toggle bar si existe
                if (toggleBar) {
                    toggleBar.classList.remove('desactivado');
                    toggleBar.disabled = false;
                }
            }
            
            // Verificar longitud
            if (this.value.length > 391) {
                // Truncar el texto a 391 caracteres
                this.value = this.value.substring(0, 391);
                
                // Mostrar notificación
                mostrarNotificacion('El texto no puede superar los 391 caracteres', 'error');
            }
        });
    }
    
    // Agregar validación al submit del formulario
    if (formCrearComunidad) {
        const submitOriginal = formCrearComunidad.onsubmit;
        
        formCrearComunidad.addEventListener('submit', function(e) {
            // Si no hay campo de reglas, continuamos normalmente
            if (!reglasInput) return true;
            
            // Validar los saltos de línea antes de enviar
            if (!validarSaltosDeLinea(reglasInput.value)) {
                e.preventDefault(); // Prevenir el envío del formulario
                mostrarNotificacion('No se permiten más de 5 saltos de línea consecutivos', 'error');
                reglasInput.focus();
                return false;
            }
            
            // Verificar longitud
            if (reglasInput.value.length > 391) {
                e.preventDefault();
                mostrarNotificacion('El texto no puede superar los 391 caracteres', 'error');
                reglasInput.focus();
                return false;
            }
            
            // Si todo está bien, continuar con la validación original si existe
            return true;
        }, true); // Usar true para que se ejecute antes que otros event listeners
    }
    
    // Añadir estilos adicionales para el toggle bar desactivado
    const styleToggle = document.createElement('style');
    styleToggle.textContent = `
        .toggle-bar.desactivado {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(styleToggle);
});


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
            if (texto.scrollHeight > texto.clientHeight) {
                const contenedor = texto.parentElement;
                const tarjeta = contenedor.closest('.tarjeta-comunidad');
                
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
                        document.getElementById('form-extrasubcategoria').scrollIntoView();
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














// Añadir botón para mostrar/ocultar panel lateral en móviles
document.addEventListener('DOMContentLoaded', function() {
    // Solo crear el botón si estamos en dispositivo móvil
    if (window.innerWidth <= 768) {
        // Crear botón toggle para panel lateral
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn-toggle-panel';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i> Menú';
        
        // Insertar el botón al inicio del contenedor principal
        const container = document.querySelector('.contenedor-principal');
        const panelLateral = document.querySelector('.panel-lateral');
        container.insertBefore(toggleBtn, container.firstChild);
        
        // Ocultar panel lateral por defecto en móvil
        panelLateral.style.display = 'none';
        
        // Añadir funcionalidad de toggle
        toggleBtn.addEventListener('click', function() {
            if (panelLateral.style.display === 'none') {
                panelLateral.style.display = 'flex';
                toggleBtn.innerHTML = '<i class="fas fa-times"></i> Cerrar';
            } else {
                panelLateral.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fas fa-bars"></i> Menú';
            }
        });
    }
    
    // Evitar desplazamiento horizontal indeseado
    document.body.addEventListener('touchmove', function(e) {
        if (document.body.scrollWidth > window.innerWidth) {
            e.preventDefault();
        }
    }, { passive: false });
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
                // Eliminar la solicitud del DOM
                const solicitudElement = document.querySelector(`.solicitud-admin-item[data-id="${solicitudId}"]`);
                if (solicitudElement) {
                    solicitudElement.remove();
                }
                
                // Mostrar mensaje de éxito
                mostrarNotificacion(`Solicitud ${estado === 'aceptada' ? 'aceptada' : 'rechazada'} correctamente`, 'exito');
                
                // Si no quedan solicitudes, mostrar mensaje
                const listaSolicitudes = document.querySelector('.lista-solicitudes-admin');
                if (listaSolicitudes && document.querySelectorAll('.solicitud-admin-item:not([style*="display: none"])').length === 0) {
                    listaSolicitudes.innerHTML = '<p class="sin-solicitudes">No hay solicitudes pendientes para tus comunidades.</p>';
                }
                
                // Si se filtra y no quedan solicitudes visibles
                actualizarVisibilidadMensajeSinSolicitudes();
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

































































