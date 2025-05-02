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

document.addEventListener('DOMContentLoaded', function() {
    // Inicialización de accesorios
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

    // Aplicar accesorios activos
    if (typeof accesoriosActivos !== 'undefined' && accesoriosActivos) {
        const indicesActivos = accesoriosActivos.map(acc => acc.indice.toString());

        document.querySelectorAll('.accesorio').forEach(accesorioElem => {
            const indice = accesorioElem.getAttribute('data-accesorio');

            if (indicesActivos.includes(indice)) {
                accesorioElem.click(); // Simula el clic para marcarlo como seleccionado y mostrarlo
            }
        });
    }

    // FIX: Configuración correcta de los botones de cancelar
    const botonesDeCancel = document.querySelectorAll('.boton.cancelar');
    console.log("Botones de cancelar encontrados:", botonesDeCancel.length);
    
    botonesDeCancel.forEach(boton => {
        boton.addEventListener('click', function(e) {
            console.log("Botón cancelar clickeado");
            e.preventDefault(); // Prevenir cualquier acción por defecto
            window.location.href = window.location.href; // Recargar la página actual
        });
    });

    // Referencias a elementos
    const usernameInput = document.getElementById('nombre-usuario');
    const mascotaInput = document.getElementById('nombre-mascota');
    const passwordActual = document.getElementById('password-actual');
    const passwordNueva = document.getElementById('password-nueva');
    const passwordConfirmar = document.getElementById('password-confirmar');
    
    // Referencias a mensajes
    const mensajeUsuario = document.getElementById('mensaje-usuario');
    const mensajeMascota = document.getElementById('mensaje-mascota');
    const mensajePasswordActual = document.getElementById('mensaje-password-actual');
    const mensajePassword = document.getElementById('mensaje-password');
    const mensajePasswordConfirmar = document.getElementById('mensaje-password-confirmar');
    
    // Referencias a botones
    const btnActualizarPerfil = document.getElementById('btn-actualizar-perfil');
    const btnGuardarMascota = document.getElementById('btn-guardar-mascota');
    const btnCambiarPassword = document.getElementById('btn-cambiar-password');
    
    // Validación de nombre de usuario
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            validarUsername();
        });
    }
    
    // Validación de nombre de mascota
    if (mascotaInput) {
        mascotaInput.addEventListener('input', function() {
            validarMascota();
        });
    }
    
    // Validaciones de contraseñas
    if (passwordNueva) {
        passwordNueva.addEventListener('input', function() {
            validarNuevaPassword();
            if (passwordConfirmar && passwordConfirmar.value) {
                validarConfirmarPassword();
            }
        });
    }
    
    if (passwordConfirmar) {
        passwordConfirmar.addEventListener('input', function() {
            validarConfirmarPassword();
        });
    }
    
    if (passwordActual) {
        passwordActual.addEventListener('input', function() {
            validarPasswordActual();
        });
    }
    
    // Función para validar el nombre de usuario
    function validarUsername() {
        if (!usernameInput || !mensajeUsuario) return false;
        
        const username = usernameInput.value.trim();
        
        // Limpiar estilos previos
        usernameInput.classList.remove('error', 'valid');
        mensajeUsuario.classList.remove('valido');
        mensajeUsuario.textContent = '';
        
        if (username.length < 5) {
            usernameInput.classList.add('error');
            mensajeUsuario.textContent = '⚠️ Mínimo 5 caracteres';
            if (btnActualizarPerfil) btnActualizarPerfil.classList.add('deshabilitado');
            return false;
        } else if (username.length > 12) {
            usernameInput.classList.add('error');
            mensajeUsuario.textContent = '⚠️ Máximo 12 caracteres';
            if (btnActualizarPerfil) btnActualizarPerfil.classList.add('deshabilitado');
            return false;
        } else {
            usernameInput.classList.add('valid');
            mensajeUsuario.classList.add('valido');
            mensajeUsuario.textContent = '✓ Nombre válido';
            if (btnActualizarPerfil) btnActualizarPerfil.classList.remove('deshabilitado');
            return true;
        }
    }
    
    // Función para validar el nombre de la mascota
    function validarMascota() {
        if (!mascotaInput || !mensajeMascota) return false;
        
        const mascota = mascotaInput.value.trim();
        
        // Limpiar estilos previos
        mascotaInput.classList.remove('error', 'valid');
        mensajeMascota.classList.remove('valido');
        mensajeMascota.textContent = '';
        
        if (mascota.length < 3) {
            mascotaInput.classList.add('error');
            mensajeMascota.textContent = '⚠️ Mínimo 3 caracteres';
            if (btnGuardarMascota) btnGuardarMascota.classList.add('deshabilitado');
            return false;
        } else if (mascota.length > 12) {
            mascotaInput.classList.add('error');
            mensajeMascota.textContent = '⚠️ Máximo 12 caracteres';
            if (btnGuardarMascota) btnGuardarMascota.classList.add('deshabilitado');
            return false;
        } else {
            mascotaInput.classList.add('valid');
            mensajeMascota.classList.add('valido');
            mensajeMascota.textContent = '✓ Nombre válido';
            if (btnGuardarMascota) btnGuardarMascota.classList.remove('deshabilitado');
            return true;
        }
    }
    
    // Función para validar contraseña actual
    function validarPasswordActual() {
        if (!passwordActual || !mensajePasswordActual) return false;
        
        if (!passwordActual.value) {
            mensajePasswordActual.textContent = '⚠️ Ingresa tu contraseña actual';
            passwordActual.classList.add('error');
            return false;
        } else {
            mensajePasswordActual.textContent = '';
            passwordActual.classList.remove('error');
            return true;
        }
    }
    
    // Función para validar nueva contraseña
    function validarNuevaPassword() {
        if (!passwordNueva || !mensajePassword) return false;
        
        const password = passwordNueva.value;
        
        // Limpiar estilos previos
        passwordNueva.classList.remove('error', 'valid');
        mensajePassword.classList.remove('valido');
        mensajePassword.textContent = '';
        
        if (password.length < 8) {
            passwordNueva.classList.add('error');
            mensajePassword.textContent = '⚠️ Mínimo 8 caracteres';
            return false;
        } else if (!/[A-Z]/.test(password)) {
            passwordNueva.classList.add('error');
            mensajePassword.textContent = '⚠️ Incluye al menos una mayúscula';
            return false;
        } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            passwordNueva.classList.add('error');
            mensajePassword.textContent = '⚠️ Incluye al menos un símbolo';
            return false;
        } else {
            passwordNueva.classList.add('valid');
            mensajePassword.classList.add('valido');
            mensajePassword.textContent = '✓ Contraseña válida';
            return true;
        }
    }
    
    // Función para validar confirmación de contraseña
    function validarConfirmarPassword() {
        if (!passwordConfirmar || !mensajePasswordConfirmar || !passwordNueva) return false;
        
        const password1 = passwordNueva.value;
        const password2 = passwordConfirmar.value;
        
        // Limpiar estilos previos
        passwordConfirmar.classList.remove('error', 'valid');
        mensajePasswordConfirmar.classList.remove('valido');
        mensajePasswordConfirmar.textContent = '';
        
        if (!password2) {
            passwordConfirmar.classList.add('error');
            mensajePasswordConfirmar.textContent = '⚠️ Confirma tu contraseña';
            return false;
        } else if (password1 !== password2) {
            passwordConfirmar.classList.add('error');
            mensajePasswordConfirmar.textContent = '⚠️ Las contraseñas no coinciden';
            return false;
        } else {
            passwordConfirmar.classList.add('valid');
            mensajePasswordConfirmar.classList.add('valido');
            mensajePasswordConfirmar.textContent = '✓ Contraseñas coinciden';
            return true;
        }
    }
    
    // Validar formularios al enviar
    const formPersonal = document.getElementById('modificar-info-personal');
    if (formPersonal) {
        formPersonal.addEventListener('submit', function(e) {
            if (!validarUsername()) {
                e.preventDefault();
            }
        });
    }
    
    const formMascota = document.getElementById('form-mascota');
    if (formMascota) {
        formMascota.addEventListener('submit', function(e) {
            if (!validarMascota()) {
                e.preventDefault();
            }
        });
    }
    
    const formPassword = document.getElementById('form-password');
    if (formPassword) {
        formPassword.addEventListener('submit', function(e) {
            const validPassword = validarPasswordActual() && validarNuevaPassword() && validarConfirmarPassword();
            if (!validPassword) {
                e.preventDefault();
            }
        });
    }
    
    // Ejecutar validaciones iniciales si los elementos existen
    if (usernameInput) validarUsername();
    if (mascotaInput) validarMascota();
});



// Solución inmediata para los botones de cancelar
document.addEventListener('DOMContentLoaded', function() {
    // Enfoque directo: reemplazar todos los botones de cancelar por nuevos botones
    const botonesCancel = document.querySelectorAll('.boton.cancelar');
    
    botonesCancel.forEach(botonOriginal => {
        // Crear un nuevo botón con las mismas características
        const nuevoBoton = document.createElement('button');
        nuevoBoton.textContent = botonOriginal.textContent;
        nuevoBoton.className = botonOriginal.className;
        nuevoBoton.type = 'button';
        
        // Agregar el evento de manera directa y explícita
        nuevoBoton.onclick = function() {
            console.log("Botón cancelar clickeado (nuevo botón)");
            // Usar varios métodos para asegurar la recarga
            try {
                window.location = window.location.href;
            } catch(e) {
                try {
                    window.location.replace(window.location.href);
                } catch(e2) {
                    try {
                        window.location.reload(true);
                    } catch(e3) {
                        alert("No se pudo recargar la página. Por favor, recárgala manualmente.");
                    }
                }
            }
            return false; // Prevenir cualquier propagación
        };
        
        // Reemplazar el botón original con el nuevo
        if (botonOriginal.parentNode) {
            botonOriginal.parentNode.replaceChild(nuevoBoton, botonOriginal);
        }
    });
    
    // Alternativa: Agregar un evento global para detectar clics en botones cancelar
    document.body.addEventListener('click', function(event) {
        if (event.target && (
            event.target.classList.contains('cancelar') || 
            (event.target.parentElement && event.target.parentElement.classList.contains('cancelar'))
        )) {
            console.log("Botón cancelar detectado por delegación de eventos");
            event.preventDefault();
            event.stopPropagation();
            window.location.reload(true);
            return false;
        }
    });
});