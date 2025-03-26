

// Función para alternar la visibilidad de las respuestas
document.addEventListener('DOMContentLoaded', function () {
    const preguntas = document.querySelectorAll('.pregunta');

    preguntas.forEach(pregunta => {
        pregunta.addEventListener('click', function () {
            const respuesta = this.nextElementSibling;
            const boton = this.querySelector('.toggle-respuesta');

            respuesta.classList.toggle('activo');
            boton.classList.toggle('activo');
        });
    });
});


document.querySelectorAll('.boton-inscribirse').forEach(button => {
    button.addEventListener('click', function(e) {
        // Crear efecto de burbuja
        const bubble = this.querySelector('.efecto-burbuja');
        if (bubble) {
            bubble.style.left = (e.pageX - this.getBoundingClientRect().left - window.scrollX) + 'px';
            bubble.style.top = (e.pageY - this.getBoundingClientRect().top - window.scrollY) + 'px';
            bubble.style.animation = 'efectoBurbuja 0.6s ease-out';
            
            // Reiniciar la animación
            setTimeout(() => {
                bubble.style.animation = 'none';
                void bubble.offsetWidth; // Trigger reflow
                bubble.style.animation = null;
            }, 600);
        }
    });
});