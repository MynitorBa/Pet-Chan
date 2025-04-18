let dataItemActual = null;
const corralEscenario = document.getElementById('corral-escenario');
const mascota = document.getElementById('mascota');

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

// Drag and Drop
document.querySelectorAll('.item-inventario').forEach(item => {
    item.addEventListener('dragstart', (e) => {
        const tipo = item.getAttribute('data-tipo');
        const id = item.getAttribute('data-id');

        dataItemActual = { tipo, id };

        const jsonData = JSON.stringify(dataItemActual);
        e.dataTransfer.setData('application/json', jsonData);
        item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        dataItemActual = null;
    });
});

mascota.addEventListener('dragover', (e) => {
    e.preventDefault();
});

mascota.addEventListener('drop', (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    const tipoItem = data.tipo;
    const indiceItem = data.id;

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
});

// Agregar animación de salto
const style = document.createElement('style');
style.innerHTML = `
    @keyframes saltar {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-50px); }
    }
`;
document.head.appendChild(style);
