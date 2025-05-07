// Script mejorado para manejar la expansión a pantalla completa
document.addEventListener('DOMContentLoaded', function() {
    const contenedorJuego = document.getElementById('contenedor-juego');
    const seccionJuego = document.querySelector('.seccion-del_juego');
    const botonFullscreen = document.getElementById('toggle-fullscreen');
    const tituloJuego = contenedorJuego.querySelector('h1');
    const botonesSuperiores = document.querySelector('.botones-superiores');
    
    let enPantallaCompleta = false;
    
    // Función para reorganizar elementos en modo fullscreen
    function reorganizarElementos() {
        if (enPantallaCompleta) {
            // Crear contenedor para el título y moverlo a la izquierda
            if (!document.querySelector('.titulo-container')) {
                const tituloContainer = document.createElement('div');
                tituloContainer.className = 'titulo-container';
                
                // Mover el título existente dentro del nuevo contenedor
                tituloJuego.parentNode.removeChild(tituloJuego);
                tituloContainer.appendChild(tituloJuego);
                
                // Crear contenedor para los botones a la derecha
                const botonesControl = document.createElement('div');
                botonesControl.className = 'botones-control';
                
                // Mover los botones existentes al nuevo contenedor
                const botonRegresar = document.querySelector('.boton-regresar');
                const botonFullscreen = document.getElementById('toggle-fullscreen');
                
                botonRegresar.parentNode.removeChild(botonRegresar);
                botonFullscreen.parentNode.removeChild(botonFullscreen);
                
                botonesControl.appendChild(botonRegresar);
                botonesControl.appendChild(botonFullscreen);
                
                // Limpiar el contenedor original de botones superiores
                while (botonesSuperiores.firstChild) {
                    botonesSuperiores.removeChild(botonesSuperiores.firstChild);
                }
                
                // Agregar los nuevos contenedores en el orden correcto
                botonesSuperiores.appendChild(tituloContainer);
                botonesSuperiores.appendChild(botonesControl);
            }
        } else {
            // Restaurar la estructura original
            if (document.querySelector('.titulo-container')) {
                const tituloContainer = document.querySelector('.titulo-container');
                const botonesControl = document.querySelector('.botones-control');
                
                // Sacar el título del contenedor y ponerlo de vuelta en su posición original
                const titulo = tituloContainer.querySelector('h1');
                tituloContainer.removeChild(titulo);
                
                // Sacar los botones del contenedor
                const botonRegresar = botonesControl.querySelector('.boton-regresar');
                const botonFullscreen = botonesControl.querySelector('.boton-fullscreen');
                
                botonesControl.removeChild(botonRegresar);
                botonesControl.removeChild(botonFullscreen);
                
                // Limpiar los contenedores superiores
                while (botonesSuperiores.firstChild) {
                    botonesSuperiores.removeChild(botonesSuperiores.firstChild);
                }
                
                // Reconstruir la estructura original
                botonesSuperiores.appendChild(botonRegresar);
                botonesSuperiores.appendChild(botonFullscreen);
                
                // Colocar el título de nuevo después de los botones superiores
                botonesSuperiores.parentNode.insertBefore(titulo, botonesSuperiores.nextSibling);
            }
        }
    }
    
    botonFullscreen.addEventListener('click', function() {
        enPantallaCompleta = !enPantallaCompleta;
        
        if (enPantallaCompleta) {
            // Cambiar a pantalla completa
            contenedorJuego.classList.add('modo-fullscreen');
            seccionJuego.classList.add('seccion-fullscreen');
            botonFullscreen.innerHTML = '<i class="fas fa-compress"></i> Salir';
            
            // Reorganizar los elementos para el modo fullscreen
            reorganizarElementos();
            
            // Solicitar API fullscreen del navegador si está disponible
            if (contenedorJuego.requestFullscreen) {
                contenedorJuego.requestFullscreen();
            } else if (contenedorJuego.mozRequestFullScreen) { /* Firefox */
                contenedorJuego.mozRequestFullScreen();
            } else if (contenedorJuego.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                contenedorJuego.webkitRequestFullscreen();
            } else if (contenedorJuego.msRequestFullscreen) { /* IE/Edge */
                contenedorJuego.msRequestFullscreen();
            }
        } else {
            // Salir de pantalla completa
            contenedorJuego.classList.remove('modo-fullscreen');
            seccionJuego.classList.remove('seccion-fullscreen');
            botonFullscreen.innerHTML = '<i class="fas fa-expand"></i> Pantalla Completa';
            
            // Restaurar la estructura original
            reorganizarElementos();
            
            // Salir de API fullscreen si está activa
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) { /* Firefox */
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE/Edge */
                document.msExitFullscreen();
            }
        }
    });
    
    // Detectar cuando se sale de pantalla completa con ESC
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    function handleFullscreenChange() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && !document.msFullscreenElement) {
            // Se ha salido de la pantalla completa del navegador
            if (enPantallaCompleta) {
                enPantallaCompleta = false;
                contenedorJuego.classList.remove('modo-fullscreen');
                seccionJuego.classList.remove('seccion-fullscreen');
                botonFullscreen.innerHTML = '<i class="fas fa-expand"></i> Pantalla Completa';
                
                // Restaurar la estructura original
                reorganizarElementos();
            }
        }
    }
});