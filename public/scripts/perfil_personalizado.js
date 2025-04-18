// Función para crear confeti
function crearConfeti() {
    const escenario = document.getElementById('escenario');
    const colors = ['#d304c5', '#a304fa', '#cf7cfc', '#ff9ff3', '#feca57'];
    
    // Crear 30 partículas de confeti
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const confeti = document.createElement('div');
            confeti.classList.add('confeti');
            
            // Posición aleatoria en el eje X
            const posX = Math.random() * escenario.offsetWidth;
            confeti.style.left = `${posX}px`;
            
            // Color aleatorio
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            confeti.style.backgroundColor = randomColor;
            
            // Tamaño aleatorio
            const size = Math.random() * 8 + 5;
            confeti.style.width = `${size}px`;
            confeti.style.height = `${size}px`;
            
            // Forma aleatoria
            const formas = ['circle', 'square', 'rectangle'];
            const forma = formas[Math.floor(Math.random() * formas.length)];
            
            if (forma === 'circle') {
                confeti.style.borderRadius = '50%';
            } else if (forma === 'rectangle') {
                confeti.style.height = `${size / 2}px`;
            }
            
            // Duración aleatoria
            const duracion = Math.random() * 2 + 2;
            confeti.style.animation = `caer ${duracion}s linear forwards`;
            
            // Retraso aleatorio
            const retraso = Math.random() * 1.5;
            confeti.style.animationDelay = `${retraso}s`;
            
            escenario.appendChild(confeti);
            
            // Eliminar el confeti después de la animación
            setTimeout(() => {
                confeti.remove();
            }, (duracion + retraso) * 1000);
        }, i * 50);
    }
}

// Gestión de accesorios
const accesoriosSeleccionados = [];

document.querySelectorAll('.accesorio').forEach(accesorio => {
    accesorio.addEventListener('click', function() {
        const tipoAccesorio = this.getAttribute('data-accesorio');
        
        // Toggle selección visual
        this.classList.toggle('seleccionado');
        
        // Actualizar lista de accesorios
        if (this.classList.contains('seleccionado')) {
            // Añadir accesorio
            accesoriosSeleccionados.push(tipoAccesorio);
            
            // Crear elemento visual para la mascota
            const accesorioElement = document.createElement('div');
            accesorioElement.classList.add('accesorio-equipado');
            accesorioElement.classList.add('no-transition');
            accesorioElement.id = 'accesorio-' + tipoAccesorio;
            
            // Crear imagen dentro del contenedor
            const accesorioImg = document.createElement('img');
            accesorioImg.src = this.querySelector('img').src;
            accesorioImg.classList.add('pixeleado');
            accesorioElement.appendChild(accesorioImg);
            
            // Estilos del contenedor del accesorio
            accesorioElement.style.position = 'absolute';
            accesorioElement.style.zIndex = '2';
            accesorioElement.style.pointerEvents = 'none';
            
            // Tamaño del accesorio
            accesorioElement.style.width = '40px';
            accesorioElement.style.height = '40px';
            
            // Reemplaza el switch por esto:
            accesorioElement.style.scale = '4';
            accesorioElement.style.imageRendering = 'pixelated';
            accesorioElement.style.transform = 'translateX(-10%) translateY(50%)';

            
            
            // Añadir el accesorio como hijo del escenario (no de la mascota)
            document.getElementById('escenario').appendChild(accesorioElement);
            
            // Crear efecto de confeti
            crearConfeti();
        } else {
            // Eliminar accesorio
            const index = accesoriosSeleccionados.indexOf(tipoAccesorio);
            if (index > -1) {
                accesoriosSeleccionados.splice(index, 1);
            }
            
            // Eliminar elemento visual
            const accesorioElement = document.getElementById('accesorio-' + tipoAccesorio);
            if (accesorioElement) {
                accesorioElement.remove();
            }
        }
        
        // Actualizar campo de formulario
        if (accesoriosSeleccionados.length === 0) {
            document.getElementById('accesorio-mascota').value = 'Ninguno';
        } else {
            document.getElementById('accesorio-mascota').value = accesoriosSeleccionados.map(tipo => {
                // Encontrar el nombre del accesorio por su tipo
                const elem = document.querySelector(`.accesorio[data-accesorio="${tipo}"]`);
                return elem ? elem.querySelector('span').textContent : tipo;
            }).join(', ');
        }
    });
});

// Animación para mover los accesorios junto con la mascota
function animarAccesorios() {
    const mascota = document.getElementById('mascota-preview');
    const mascotaRect = mascota.getBoundingClientRect();
    const escenarioRect = document.getElementById('escenario').getBoundingClientRect();
    
    // Calcular posición relativa de la mascota dentro del escenario
    const mascotaX = mascotaRect.left - escenarioRect.left;
    const mascotaY = mascotaRect.top - escenarioRect.top;
    
    // Mover cada accesorio
    accesoriosSeleccionados.forEach(tipo => {
        const accesorio = document.getElementById('accesorio-' + tipo);
        if (accesorio) {
            // Aplicar transformación basada en la posición de la mascota
            const transform = window.getComputedStyle(accesorio).transform;
            const originalTransform = transform === 'none' ? '' : transform;
            
            // Calcular nueva posición
            let left = mascotaX + mascotaRect.width / 2;
            let top = mascotaY;
            
           
            
            accesorio.style.left = `${left}px`;
            accesorio.style.top = `${top}px`;
            accesorio.style.transform = originalTransform;
        }
    });
    
    
    requestAnimationFrame(animarAccesorios);
}

// Iniciar la animación de los accesorios
requestAnimationFrame(animarAccesorios);

window.addEventListener('DOMContentLoaded', () => {
    const indicesActivos = accesoriosActivos.map(acc => acc.indice.toString());

    document.querySelectorAll('.accesorio').forEach(accesorioElem => {
        const indice = accesorioElem.getAttribute('data-accesorio');

        if (indicesActivos.includes(indice)) {
            accesorioElem.click(); // Simula el clic para marcarlo como seleccionado y mostrarlo
        }
    });
});

// Botones de cancelar
document.querySelectorAll('.boton.cancelar').forEach(boton => {
    boton.addEventListener('click', function() {
        const form = this.closest('form');
        form.reset();
    });
});

