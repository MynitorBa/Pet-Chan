document.addEventListener('DOMContentLoaded', function() {
    // Datos iniciales de comentarios
    const comentariosIniciales = [
        {
            id: 1,
            avatar: 'https://i.pinimg.com/474x/c3/b9/c6/c3b9c65ed0c48f8a6b9a88b1e4ade9d3.jpg',
            autor: 'Lillie',
            texto: '¡Me encanta esta comunidad!',
            fecha: 'Hace 2 horas',
            likes: 24,
            compartido: 5,
            comentarios: 3,
            liked: false,
            shared: false,
            imagen: 'https://media0.giphy.com/media/6Cd73g46Wj2ztqQUFd/giphy.gif?cid=6c09b952uf8f8z8uhvx513tabxvgmvszwlsgj1szdhv2gyq8&ep=v1_gifs_search&rid=giphy.gif&ct=g'
        },
        {
            id: 2,
            avatar: 'https://i.pinimg.com/236x/ab/96/6a/ab966ad001bc6e83e0a688b80c737c64.jpg',
            autor: 'Miku',
            texto: '¿Alguien quiere jugar con mi mascota virtual?',
            fecha: 'Hace 5 horas',
            likes: 42,
            compartido: 12,
            comentarios: 8,
            liked: false,
            shared: false,
            imagen: 'https://i.pinimg.com/originals/7b/0b/81/7b0b8158c64bbf2854f1bdc7729afa8d.gif'
        },

        {
            id: 3,
            avatar: 'https://i.pinimg.com/564x/cc/65/fd/cc65fdc6496b1f27c23e118108ea1ea0.jpg',
            autor: 'Tifa',
            texto: 'Estoy buscando un compañero de aventuras',
            fecha: 'Hace 15 horas',
            likes: 62,
            compartido: 22,
            comentarios: 38,
            liked: false,
            shared: false,
            imagen: false
        }
    ];

    // Datos iniciales de foros
    const forosIniciales = [
        {
            id: 1,
            votos: 156,
            titulo: 'Guía completa: Cómo derrotar a Moon Lord',
            autor: 'MoonLordSlayer',
            actividad: 'alta',
            badge: 'Experto',
            contenido: 'Después de más de 500 horas de juego, he desarrollado la estrategia perfecta para derrotar al Moon Lord...',
            etiquetas: ['Guía', 'Boss Fight', 'End Game'],
            destacado: true,
            votado: null
        },
        {
            id: 2,
            votos: 145,
            titulo: 'Guía de pesca definitiva 2024',
            autor: 'FishingMaster',
            actividad: 'alta',
            badge: 'Experto',
            contenido: 'Todo lo que necesitas saber sobre pesca: mejores cebos, potenciadores, clima, tiempo, biomas y recompensas...',
            etiquetas: ['Guía', 'Pesca', 'Actualizado'],
            destacado: true,
            votado: null
        },
        {
            id: 3,
            votos: 92,
            titulo: 'La mejor granja de Soul of Light',
            autor: 'FarmKing99',
            actividad: 'media',
            badge: 'Veterano',
            contenido: 'He optimizado la granja definitiva para Soul of Light. Usando hoiks y trampas de lava...',
            imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUOL9umLPrnFDzpuDusgiA6e2qe7cC6XvuaQ&s',
            etiquetas: ['Farming', 'Tutorial', 'Hardmode'],
            destacado: false,
            votado: null
        },
        {
            id: 4,
            votos: 110,
            titulo: 'The Legend of Zelda: Breath of the Wild - Guía de Juegos',
            autor: 'ZeldaMaster',
            actividad: 'media',
            badge: 'Veterano',
            contenido: 'Logré clonar las flechas ancestrales en Kakariko...',
            imagen: 'https://rukminim2.flixcart.com/image/850/1000/kyvvtzk0/poster/r/j/j/medium-zelda-breath-of-the-wild-hyrule-landscape-video-game-original-imagbygdfjcpvmrg.jpeg?q=20&crop=false',
            etiquetas: ['Adventure', 'Legend', 'Fantasy'],
            destacado: false,
            votado: null
        }
    ];

    // Elementos del DOM
    const listaComentarios = document.querySelector('.lista-comentarios');
    const gridMensajes = document.querySelector('.grid-mensajes');
    const botonPublicar = document.querySelector('.boton-publicar');
    const entradaPublicacion = document.querySelector('.entrada-publicacion');
    const subirImagen = document.getElementById('subir-imagen');
    const previewImagen = document.getElementById('preview-imagen');
    let imagenSeleccionada = null;

    // Función para optimizar tamaño de imagen
    function optimizarImagen(src, callback) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Tamaño máximo deseado
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 600;
            let width = img.width;
            let height = img.height;
            
            // Redimensionar si es necesario
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            callback(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = src;
    }

    // Función para renderizar comentarios
    function renderizarComentarios(comentarios) {
        listaComentarios.innerHTML = '';
        comentarios.forEach(comentario => {
            const elementoComentario = document.createElement('div');
            elementoComentario.className = 'comentario';
            elementoComentario.dataset.id = comentario.id;
            
            let imagenHTML = '';
            if (comentario.imagen) {
                imagenHTML = `
                    <div class="imagen-comentario-container">
                        <div class="marco-dorado">
                            <img src="${comentario.imagen}" alt="Imagen del comentario" 
                                 class="imagen-comentario"
                                 onload="this.style.opacity=1; this.parentElement.classList.add('cargado')"
                                 style="opacity:0;transition:opacity 0.3s">
                        </div>
                    </div>
                `;
            }

            elementoComentario.innerHTML = `
                <img src="${comentario.avatar}" alt="Avatar de ${comentario.autor}" class="avatar-comentario">
                <div class="contenido-comentario">
                    <p class="autor-comentario">${comentario.autor} <span class="fecha-comentario">${comentario.fecha}</span></p>
                    <p class="texto-comentario">${comentario.texto}</p>
                    ${imagenHTML}
                    <div class="acciones-comentario">
                        <div class="accion-comentario ${comentario.liked ? 'activo' : ''}" data-action="like">
                            <i class="fas fa-heart"></i>
                            <span class="contador-likes">${comentario.likes}</span>
                        </div>
                        <div class="accion-comentario" data-action="comment">
                            <i class="fas fa-comment"></i>
                            <span>${comentario.comentarios}</span>
                        </div>
                        <div class="accion-comentario ${comentario.shared ? 'activo' : ''}" data-action="share">
                            <i class="fas fa-share"></i>
                            <span>${comentario.compartido}</span>
                        </div>
                    </div>
                </div>
            `;
            listaComentarios.prepend(elementoComentario);
        });

        // Agregar eventos a las acciones de comentarios
        document.querySelectorAll('.accion-comentario').forEach(accion => {
            accion.addEventListener('click', function() {
                const accionTipo = this.dataset.action;
                const comentarioId = parseInt(this.closest('.comentario').dataset.id);
                const comentario = comentariosIniciales.find(c => c.id === comentarioId);
                
                switch(accionTipo) {
                    case 'like':
                        comentario.liked = !comentario.liked;
                        comentario.likes += comentario.liked ? 1 : -1;
                        break;
                    case 'share':
                        comentario.shared = true;
                        comentario.compartido += 1;
                        if (navigator.share) {
                            navigator.share({
                                title: `Comentario de ${comentario.autor}`,
                                text: comentario.texto,
                                url: window.location.href
                            }).catch(err => {
                                console.log('Error al compartir:', err);
                                mostrarFeedback('¡Comentario compartido!');
                            });
                        } else {
                            mostrarFeedback('¡Comentario compartido!');
                        }
                        break;
                    case 'comment':
                        const respuesta = prompt("Escribe tu respuesta:");
                        if (respuesta && respuesta.trim()) {
                            mostrarFeedback('¡Respuesta enviada!');
                            comentario.comentarios += 1;
                        }
                        break;
                }
                
                renderizarComentarios(comentariosIniciales);
            });
        });

        // Agregar evento para imágenes de comentarios
        document.querySelectorAll('.imagen-comentario').forEach(img => {
            img.addEventListener('click', function() {
                mostrarImagenAmpliada(this.src);
            });
        });
    }

    // Función para mostrar feedback al usuario
    function mostrarFeedback(mensaje) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback';
        feedback.textContent = mensaje;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.classList.add('mostrar');
        }, 10);
        
        setTimeout(() => {
            feedback.classList.remove('mostrar');
            setTimeout(() => feedback.remove(), 300);
        }, 3000);
    }

    // Función para renderizar foros
    function renderizarForos(foros) {
        gridMensajes.innerHTML = '';
        foros.forEach(foro => {
            const elementoForo = document.createElement('div');
            elementoForo.className = `mensaje-foro ${foro.destacado ? 'mensaje-destacado' : ''}`;
            elementoForo.dataset.id = foro.id;

            let imagenHTML = '';
            if (foro.imagen) {
                imagenHTML = `
                    <div class="imagen-foro-container">
                        <div class="marco-dorado">
                            <img src="${foro.imagen}" alt="${foro.titulo}" 
                                 class="imagen-foro"
                                 onload="this.style.opacity=1; this.parentElement.classList.add('cargado')"
                                 style="opacity:0;transition:opacity 0.3s">
                        </div>
                    </div>
                `;
            }

            elementoForo.innerHTML = `
                <div class="votos">
                    <button class="btn-voto btn-voto-up ${foro.votado === 'up' ? 'activo' : ''}" 
                            title="Votar positivo" ${foro.votado === 'up' ? 'disabled' : ''}>↑</button>
                    <span class="contador-votos">${foro.votos}</span>
                    <button class="btn-voto btn-voto-down ${foro.votado === 'down' ? 'activo' : ''}" 
                            title="Votar negativo" ${foro.votado === 'down' ? 'disabled' : ''}>↓</button>
                </div>
                <h3 class="titulo-mensaje">${foro.titulo}</h3>
                <p class="autor-mensaje">
                    <span class="indicador-actividad actividad-${foro.actividad}"></span>
                    <span>${foro.autor}</span>
                    <span class="autor-badge">${foro.badge}</span>
                </p>
                <p class="contenido-mensaje">${foro.contenido}</p>
                ${imagenHTML}
                <div class="etiquetas">
                    ${foro.etiquetas.map(etiqueta => `<span class="etiqueta">${etiqueta}</span>`).join('')}
                </div>
                <div class="acciones-mensaje">
                    <button class="btn-accion"><i class="fas fa-comment"></i> Comentar</button>
                    <button class="btn-accion"><i class="fas fa-bookmark"></i> Guardar</button>
                    <button class="btn-accion"><i class="fas fa-share"></i> Compartir</button>
                </div>
            `;
            gridMensajes.appendChild(elementoForo);
        });

        // Agregar eventos a los botones de votación
        document.querySelectorAll('.btn-voto-up').forEach(btn => {
            btn.addEventListener('click', function() {
                const foroId = parseInt(this.closest('.mensaje-foro').dataset.id);
                const foro = forosIniciales.find(f => f.id === foroId);
                
                const incremento = foro.votado === 'down' ? 2 : 1;
                foro.votos += incremento;
                foro.votado = 'up';
                
                renderizarForos(forosIniciales);
                mostrarFeedback('¡Voto positivo registrado!');
            });
        });

        document.querySelectorAll('.btn-voto-down').forEach(btn => {
            btn.addEventListener('click', function() {
                const foroId = parseInt(this.closest('.mensaje-foro').dataset.id);
                const foro = forosIniciales.find(f => f.id === foroId);
                
                const decremento = foro.votado === 'up' ? 2 : 1;
                foro.votos -= decremento;
                foro.votado = 'down';
                
                renderizarForos(forosIniciales);
                mostrarFeedback('¡Voto negativo registrado!');
            });
        });

        // Agregar evento para imágenes de foros
        document.querySelectorAll('.imagen-foro').forEach(img => {
            img.addEventListener('click', function() {
                mostrarImagenAmpliada(this.src);
            });
        });

        // Agregar eventos a los botones de acciones
        document.querySelectorAll('.btn-accion').forEach(btn => {
            btn.addEventListener('click', function() {
                const accion = this.querySelector('i').className;
                const foroId = parseInt(this.closest('.mensaje-foro').dataset.id);
                const foro = forosIniciales.find(f => f.id === foroId);
                
                if (accion.includes('fa-comment')) {
                    const comentario = prompt(`Responder a "${foro.titulo}":`);
                    if (comentario && comentario.trim()) {
                        mostrarFeedback('¡Comentario enviado!');
                    }
                } else if (accion.includes('fa-bookmark')) {
                    mostrarFeedback(`Foro "${foro.titulo}" guardado`);
                } else if (accion.includes('fa-share')) {
                    if (navigator.share) {
                        navigator.share({
                            title: foro.titulo,
                            text: foro.contenido.substring(0, 100) + '...',
                            url: window.location.href
                        }).catch(err => {
                            console.log('Error al compartir:', err);
                            mostrarFeedback('¡Foro compartido!');
                        });
                    } else {
                        mostrarFeedback('¡Foro compartido!');
                    }
                }
            });
        });
    }

    // Función para mostrar imagen ampliada
    function mostrarImagenAmpliada(src) {
        const modal = document.createElement('div');
        modal.className = 'modal-imagen';
        modal.innerHTML = `
            <span class="cerrar-modal">&times;</span>
            <div class="marco-dorado marco-modal">
                <img src="${src}" class="modal-contenido">
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.style.display = 'flex';
        
        modal.querySelector('.cerrar-modal').addEventListener('click', function() {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                setTimeout(() => modal.remove(), 300);
            }
        });
    }

    // Subir imagen
    subirImagen.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                mostrarFeedback('La imagen es demasiado grande (máximo 5MB)');
                return;
            }
            
            // Validar tipo de archivo
            if (!file.type.match('image.*')) {
                mostrarFeedback('Por favor, sube solo imágenes');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                optimizarImagen(event.target.result, function(imagenOptimizada) {
                    imagenSeleccionada = imagenOptimizada;
                    
                    const img = new Image();
                    img.onload = function() {
                        previewImagen.innerHTML = `
                            <div class="marco-dorado">
                                <img src="${imagenSeleccionada}" alt="Previsualización" 
                                     style="max-width:100%;max-height:300px;display:block;margin:0 auto;opacity:0;transition:opacity 0.3s"
                                     onload="this.style.opacity=1; this.parentElement.classList.add('cargado')">
                                <button class="eliminar-imagen">&times;</button>
                            </div>
                        `;
                        previewImagen.style.display = 'block';
                        
                        previewImagen.querySelector('.eliminar-imagen').addEventListener('click', function(e) {
                            e.stopPropagation();
                            imagenSeleccionada = null;
                            previewImagen.style.display = 'none';
                            subirImagen.value = '';
                        });
                    };
                    img.src = imagenOptimizada;
                });
            };
            reader.readAsDataURL(file);
        }
    });

    // Función para agregar un nuevo comentario
    function agregarComentario(texto) {
        if (!texto.trim() && !imagenSeleccionada) {
            mostrarFeedback('Por favor, escribe algo o sube una imagen');
            return;
        }
        
        const nuevoComentario = {
            id: Date.now(),
            avatar: 'https://th.bing.com/th/id/OIP.rIsI3TvodysyTi_2VOGK3gHaHa?rs=1&pid=ImgDetMain',
            autor: sessionStorage.getItem('username') || 'Usuario',

            texto: texto || '',
            fecha: 'Hace unos momentos',
            likes: 0,
            compartido: 0,
            comentarios: 0,
            liked: false,
            shared: false,
            imagen: imagenSeleccionada || null
        };
        
        comentariosIniciales.unshift(nuevoComentario);
        renderizarComentarios(comentariosIniciales);
        
        // Resetear el formulario
        entradaPublicacion.value = '';
        imagenSeleccionada = null;
        previewImagen.style.display = 'none';
        subirImagen.value = '';
        
        mostrarFeedback('¡Publicación creada con éxito!');
    }

    // Evento para publicar comentario
    botonPublicar.addEventListener('click', function() {
        agregarComentario(entradaPublicacion.value);
    });

    // Evento para publicar con Enter
    entradaPublicacion.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            agregarComentario(entradaPublicacion.value);
        }
    });

    // Inicializar la página
    renderizarComentarios(comentariosIniciales);
    renderizarForos(forosIniciales);

    // Efecto especial para foros destacados
    setInterval(() => {
        document.querySelectorAll('.mensaje-destacado').forEach(foro => {
            foro.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.7)';
            setTimeout(() => {
                foro.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
            }, 1000);
        });
    }, 3000);
});
