// Mascota interactiva
const mascota = document.querySelector('.mascota-ayudante');
const burbuja = document.querySelector('.burbuja-dialogo');
const carta = document.querySelector('.carta');
const contenedorPrincipal = document.getElementById('contenedor-principal');
const areaAnimacion = document.getElementById('area-animacion');
const contenedorAnimacion = document.getElementById('contenedor-animacion');

// Obtener la configuración de email.js inyectada en la página
const EMAILJS_SERVICE_ID = document.getElementById('emailjs-service-id').value;
const EMAILJS_TEMPLATE_ID = document.getElementById('emailjs-template-id').value;
const EMAILJS_TO_EMAIL = document.getElementById('emailjs-to-email').value;

// Mostrar la burbuja al cargar
window.addEventListener('load', () => {
    setTimeout(() => {
        burbuja.classList.add('visible');
        
        // Ocultar la burbuja después de 5 segundos
        setTimeout(() => {
            burbuja.classList.remove('visible');
        }, 5000);
    }, 1000);
});

mascota.addEventListener('click', () => {
    burbuja.classList.toggle('visible');
    
    // Ocultar la burbuja después de 5 segundos
    if (burbuja.classList.contains('visible')) {
        setTimeout(() => {
            burbuja.classList.remove('visible');
        }, 5000);
    }
});

// Crear elementos de píxel para decoración
function crearPixeles() {
    const tarjeta = document.querySelector('.tarjeta-soporte');
    const cantidadPixeles = 50;
    
    for (let i = 0; i < cantidadPixeles; i++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixel-decoracion');
        
        // Posición aleatoria
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        
        pixel.style.left = `${posX}%`;
        pixel.style.top = `${posY}%`;
        
        // Tamaño aleatorio
        const tamanio = Math.random() * 4 + 2;
        pixel.style.width = `${tamanio}px`;
        pixel.style.height = `${tamanio}px`;
        
        // Color aleatorio
        const colores = ['#d304c5', '#a304fa', '#cf7cfc'];
        const colorAleatorio = colores[Math.floor(Math.random() * colores.length)];
        pixel.style.backgroundColor = colorAleatorio;
        
        // Opacidad aleatoria
        pixel.style.opacity = Math.random() * 0.5 + 0.1;
        
        tarjeta.appendChild(pixel);
    }
}

// Llamar a la función para crear los píxeles
crearPixeles();

// Función para mostrar la animación completa
function mostrarAnimacionFinal() {
    // Clonar la mascota para la animación final
    const mascotaClone = mascota.cloneNode(true);
    const cartaClone = document.createElement('div');
    cartaClone.className = 'carta visible';
    
    // Limpiar y preparar el contenedor de animación
    contenedorAnimacion.innerHTML = '';
    contenedorAnimacion.appendChild(cartaClone);
    contenedorAnimacion.appendChild(mascotaClone);
    
    // Posicionar elementos para la animación
    mascotaClone.style.position = 'absolute';
    mascotaClone.style.left = '40%';
    mascotaClone.style.top = '50%';
    mascotaClone.style.transform = 'translate(-50%, -50%)';
    mascotaClone.style.animation = 'none';
    
    cartaClone.style.position = 'absolute';
    cartaClone.style.left = '40%';
    cartaClone.style.top = '50%';
    cartaClone.style.transform = 'translate(0%, -50%)';
    
    // Mostrar el área de animación
    areaAnimacion.classList.add('visible');
    
    // Iniciar la animación después de un breve retraso
    setTimeout(() => {
        // Animar la mascota recogiendo la carta
        mascotaClone.style.animation = 'tomarCarta 2s forwards';
        
        // Ocultar la carta cuando la mascota la recoge
        setTimeout(() => {
            cartaClone.style.opacity = '0';
        }, 1000);
        
        // Cerrar la animación y volver al formulario después de completarse
        setTimeout(() => {
            areaAnimacion.classList.remove('visible');
            
            // Restablecer el formulario y mostrar mensaje de éxito
            const formulario = document.getElementById('formulario-contacto');
            formulario.reset();
            
            // Crear y mostrar mensaje de éxito
            const mensajeExito = document.createElement('div');
            mensajeExito.className = 'mensaje-exito';
            mensajeExito.style.textAlign = 'center';
            mensajeExito.style.padding = '20px';
            mensajeExito.style.backgroundColor = 'rgba(98, 2, 150, 0.8)';
            mensajeExito.style.border = '2px solid #cf7cfc';
            mensajeExito.style.borderRadius = '10px';
            mensajeExito.style.marginTop = '20px';
            mensajeExito.innerHTML = `
                <h3 style="color: #d304c5; margin-bottom: 10px;">✧✧ ¡Mensaje Enviado! ✧✧</h3>
                <p>Tu mensaje ha sido entregado por nuestra mascota a <strong>${EMAILJS_TO_EMAIL}</strong>. Pronto recibirás una respuesta.</p>
            `;
            
            // Reemplazar el formulario con el mensaje de éxito
            formulario.parentNode.replaceChild(mensajeExito, formulario);
            
            // Ocultar la mascota después de la animación
            document.querySelector('.contenedor-mascota').style.display = 'none';
            
            // Volver a mostrar el formulario después de 5 segundos
            setTimeout(() => {
                location.reload();
            }, 5000);
        }, 3000);
    }, 500);
}

// Manejar el envío del formulario
document.getElementById('formulario-contacto').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validar formulario
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const categoria = document.getElementById('categoria').value;
    const mensaje = document.getElementById('mensaje').value;
    
    // Obtener el valor de prioridad seleccionado
    const prioridadSeleccionada = document.querySelector('input[name="prioridad"]:checked');
    const prioridad = prioridadSeleccionada ? prioridadSeleccionada.value : 'media';
    
    if (!nombre || !email || !mensaje) {
        alert('Por favor completa los campos obligatorios: nombre, email y mensaje.');
        return;
    }
    
    // Preparar los parámetros para el correo
    const params = {
        from_name: nombre,
        from_email: email,
        categoria: categoria || "No especificada",
        prioridad: prioridad,
        mensaje: mensaje,
        to_email: EMAILJS_TO_EMAIL
    };
    
    // Cambiar la apariencia del botón enviar para indicar que está en proceso
    const botonEnviar = document.querySelector('.Boton.enviar');
    const textoOriginal = botonEnviar.innerHTML;
    botonEnviar.innerHTML = '<span>✧ Enviando... ✧</span>';
    botonEnviar.disabled = true;
    botonEnviar.style.opacity = "0.7";
    
    // Enviar el correo utilizando las variables de entorno
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params) 
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            
            // Animar el proceso de envío
            contenedorPrincipal.classList.add('modo-animacion');
            
            // Mostrar la carta (como si fuera el mensaje)
            carta.classList.add('visible');
            
            // Mostrar burbuja con mensaje de envío
            burbuja.textContent = `¡Está muy bien! ¡Voy a entregar tu mensaje ahora a ${EMAILJS_TO_EMAIL}!`;
            burbuja.classList.add('visible');
            
            // Iniciar la animación de la mascota tomando la carta
            setTimeout(() => {
                mascota.classList.add('tomando-carta');
                document.getElementById('formulario-contacto').classList.add('formulario-enviado');
                
                // Iniciar la animación final después de un tiempo
                setTimeout(() => {
                    mostrarAnimacionFinal();
                }, 2000);
            }, 2000);
        })
        .catch(function(error) {
            console.log('FAILED...', error);
            alert('Hubo un error al enviar el mensaje. Por favor, intenta nuevamente.');
            
            // Restaurar el botón
            botonEnviar.innerHTML = textoOriginal;
            botonEnviar.disabled = false;
            botonEnviar.style.opacity = "1";
        });
});

// Destacar campos al enfocarlos
const inputs = document.querySelectorAll('input, textarea, select');
inputs.forEach(input => {
    input.addEventListener('focus', () => {
        input.style.boxShadow = '0 0 15px rgba(211, 4, 197, 0.5)';
    });
    
    input.addEventListener('blur', () => {
        input.style.boxShadow = 'none';
    });
});