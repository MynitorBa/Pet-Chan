const mascota = document.getElementById('mascota');
        const corralEscenario = document.getElementById('corral-escenario');

        // Drag and Drop Logic
        document.querySelectorAll('.item-inventario').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.closest('.item-inventario').getAttribute('data-tipo'));
                e.target.closest('.item-inventario').classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                e.target.closest('.item-inventario').classList.remove('dragging');
            });
        });

        mascota.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        mascota.addEventListener('drop', (e) => {
            e.preventDefault();
            const tipoItem = e.dataTransfer.getData('text/plain');
            
            switch(tipoItem) {
                case 'comida':
                    // Lógica para dar de comer
                    const cantidadComida = document.querySelector('.item-inventario[data-tipo="comida"] .cantidad-item');
                    let cantidad = parseInt(cantidadComida.textContent);
                    
                    if (cantidad > 0) {
                        cantidadComida.textContent = cantidad - 1;
                        // Animación de comer
                        mascota.style.transform = 'scale(1.1)';
                        setTimeout(() => {
                            mascota.style.transform = 'scale(1)';
                        }, 500);
                    } else {
                        alert('¡No queda comida en el inventario!');
                    }
                    break;
                
                case 'juguete1':
                case 'juguete2':
                    // Lógica para jugar
                    mascota.style.animation = 'saltar 0.5s ease-in-out 2';
                    setTimeout(() => {
                        mascota.style.animation = 'none';
                    }, 1000);
                    break;
                
                case '1':
                case '2':
                    // Cambiar fondo
                    corralEscenario.style.background = `url('imagenes_de_corrales/${tipoItem}.jpg')`;
                    corralEscenario.style.backgroundSize = 'cover';
                    corralEscenario.style.backgroundPosition = 'center';
                    break;
            }
        });

        // Animación de salto
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes saltar {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-50px); }
            }
        `;
        document.head.appendChild(style);