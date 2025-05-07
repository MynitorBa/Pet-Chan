let dataItemActual = null;
const corralEscenario = document.getElementById('corral-escenario');
const mascota = document.getElementById('mascota');
let tiempoPresionado = null;
let presionandoItem = null;
let esMobile = false;

// Detectar si es dispositivo móvil
function detectarMobile() {
    return (
        navigator.userAgent.match(/Android/i) ||
        navigator.userAgent.match(/webOS/i) ||
        navigator.userAgent.match(/iPhone/i) ||
        navigator.userAgent.match(/iPad/i) ||
        navigator.userAgent.match(/iPod/i) ||
        navigator.userAgent.match(/BlackBerry/i) ||
        navigator.userAgent.match(/Windows Phone/i)
    );
}

// Establecer flag móvil al cargar
document.addEventListener('DOMContentLoaded', () => {
    esMobile = detectarMobile();
    console.log("¿Es dispositivo móvil?", esMobile);
});

// Función para mostrar el popup
function mostrarPopup(jsonData) {
    const popup = document.getElementById('popup-mensaje');
    popup.textContent = JSON.stringify(jsonData, null, 2);
    popup.style.display = 'block';
    popup.style.opacity = '1';

    setTimeout(() => {
        popup.style.opacity = '0';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 500);
    }, 5000);
}

// Función para procesar la acción
function procesarAccion(tipoItem, indiceItem) {
    const itemVisual = document.querySelector(`.item-inventario[data-tipo="${tipoItem}"][data-id="${indiceItem}"]`);

    const eliminarVisual = () => {
        if (itemVisual) {
            itemVisual.remove();
            console.log('Elemento eliminado:', itemVisual);
        }
        else {
            console.log('Elemento no encontrado:', itemVisual);
        }
    };

    // Mostrar feedback visual de selección
    if (itemVisual) {
        itemVisual.classList.remove('item-seleccionado');
        
        // Añadir clase de animación según el tipo
        if (tipoItem === 'comida') {
            itemVisual.classList.add('usado-comida');
        } else if (tipoItem === 'juguete') {
            itemVisual.classList.add('usado-juguete');
        } else {
            itemVisual.classList.add('usado-decoracion');
        }
        
        // Eliminar clase después de la animación
        setTimeout(() => {
            itemVisual.classList.remove('usado-comida', 'usado-juguete', 'usado-decoracion');
        }, 500);
    }

    switch (tipoItem) {
        case 'comida':
            mascota.style.transform = 'scale(1.1)';
            setTimeout(() => {
                mascota.style.transform = 'scale(1)';
            }, 500);

            fetch('/mascota/comer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo: tipoItem, indice: indiceItem })
            })
            .then(res => {
                if (!res.ok) throw new Error('Error en la respuesta del servidor');
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    eliminarVisual();
                }
                mostrarPopup(data.mensaje);
            })
            .catch(err => console.error('Error al comer:', err));
            break;

        case 'juguete':
            mascota.style.animation = 'saltar 0.5s ease-in-out 2';
            setTimeout(() => {
                mascota.style.animation = 'none';
            }, 1000);

            fetch('/mascota/jugar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo: tipoItem, indice: indiceItem })
            })
            .then(res => {
                if (!res.ok) throw new Error('Error en la respuesta del servidor');
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    eliminarVisual();
                }
                mostrarPopup(data.mensaje);
            })
            .catch(err => console.error('Error al jugar:', err));
            break;

        default:
            corralEscenario.style.background = `url('imagenes_de_corrales/${tipoItem}.png')`;
            corralEscenario.style.backgroundSize = 'cover';
            corralEscenario.style.backgroundPosition = 'center';

            fetch('/corral/guardar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ indice: indiceItem })
            })
            .then(res => res.json())
            .then(data => {
                mostrarPopup(data.mensaje);
            });
            break;
    }
}

// Configuración para ambos: móvil y desktop
document.querySelectorAll('.item-inventario').forEach(item => {

    // Eventos para dispositivos móviles (presionar y mantener)
    item.addEventListener('touchstart', (e) => {
        if (!esMobile) return;
        
        presionandoItem = item;
        const tipo = item.getAttribute('data-tipo');
        const id = item.getAttribute('data-id');
        
        item.classList.add('item-seleccionado');
        
        // Establecer un temporizador para activar después de mantener presionado
        tiempoPresionado = setTimeout(() => {
            // Vibrar si el dispositivo lo soporta (feedback táctil)
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
            
            // Procesar la acción después de mantener presionado
            procesarAccion(tipo, id);
            presionandoItem = null;
        }, 800); // 800ms = tiempo para considerar "mantener presionado"
    });

    item.addEventListener('touchend', () => {
        if (!esMobile) return;
        
        // Cancelar el temporizador si se suelta antes
        clearTimeout(tiempoPresionado);
        if (presionandoItem) {
            presionandoItem.classList.remove('item-seleccionado');
        }
        presionandoItem = null;
    });

    item.addEventListener('touchmove', (e) => {
        if (!esMobile) return;
        
        // Cancelar si el usuario desliza (para evitar activaciones accidentales)
        clearTimeout(tiempoPresionado);
        if (presionandoItem) {
            presionandoItem.classList.remove('item-seleccionado');
        }
        presionandoItem = null;
    });

    // Eventos Drag & Drop tradicionales para PC
    item.addEventListener('dragstart', (e) => {
        if (esMobile) {
            e.preventDefault();
            return;
        }
        
        const tipo = item.getAttribute('data-tipo');
        const id = item.getAttribute('data-id');

        dataItemActual = { tipo, id };

        const jsonData = JSON.stringify(dataItemActual);
        e.dataTransfer.setData('application/json', jsonData);
        item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
        if (esMobile) return;
        
        item.classList.remove('dragging');
        dataItemActual = null;
    });
});

// Eventos de mascota para PC (Drag & Drop)
mascota.addEventListener('dragover', (e) => {
    if (esMobile) return;
    e.preventDefault();
});

mascota.addEventListener('drop', (e) => {
    if (esMobile) return;
    
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    procesarAccion(data.tipo, data.id);
});

// Agregar estilos necesarios
const style = document.createElement('style');
style.innerHTML = `
    @keyframes saltar {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-50px); }
    }
    
    /* Estilos para feedback visual */
    .item-seleccionado {
        opacity: 0.7;
        transform: scale(0.95);
        box-shadow: 0 0 10px rgba(0, 0, 255, 0.5);
        transition: all 0.3s ease;
    }
    
    /* Animaciones de uso */
    .usado-comida {
        animation: usar-comida 0.5s ease;
    }
    
    .usado-juguete {
        animation: usar-juguete 0.5s ease;
    }
    
    .usado-decoracion {
        animation: usar-decoracion 0.5s ease;
    }
    
    @keyframes usar-comida {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes usar-juguete {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(15deg); }
        75% { transform: rotate(-15deg); }
        100% { transform: rotate(0deg); }
    }
    
    @keyframes usar-decoracion {
        0% { filter: brightness(1); }
        50% { filter: brightness(1.5); }
        100% { filter: brightness(1); }
    }
`;
document.head.appendChild(style);