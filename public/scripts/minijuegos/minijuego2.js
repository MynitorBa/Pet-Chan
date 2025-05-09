// Seleccionar los elementos de la batería
let numerosDeTambor = document.querySelectorAll(".drum").length;

// Reproducción automática de la música de fondo con múltiples enfoques
(function() {
    // Crear el elemento de audio
    const backgroundMusic = new Audio('archivos_de_minijuegos/sounds/rock.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5; // Volumen al 50% para no sobrepasar los sonidos de la batería
    
    // Intentar reproducir inmediatamente
    backgroundMusic.play().catch(error => {
        console.error("Error al reproducir automáticamente:", error);
        
        // Intentar reproducir con cualquier interacción del usuario
        const startAudio = function() {
            backgroundMusic.play().catch(e => console.error("Error al reproducir:", e));
            // Remover listeners después del primer intento
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };
        
        // Añadir listeners para capturar cualquier interacción
        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
        document.addEventListener('touchstart', startAudio);
    });
    
    // También intentar reproducir cuando el documento esté listo
    document.addEventListener('DOMContentLoaded', function() {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(e => {});
        }
    });

    // Función global para asegurar que la música esté sonando
    window.reproducirLoopSpaceman = function() {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(e => console.error("Error al reproducir:", e));
        }
    };
})();

// Event listeners para los botones de batería
for (let inde = 0; inde < numerosDeTambor; inde++) {    
    document.querySelectorAll(".drum")[inde].addEventListener("click", function() {
        let buttonInnerHTML = this.innerHTML.toLowerCase();
        makeSound(buttonInnerHTML);
        buttonAnimation(buttonInnerHTML);
    });
}

// Event listener para cuando se presiona una tecla
document.addEventListener("keypress", function(evento){
    makeSound(evento.key.toLowerCase());
    buttonAnimation(evento.key.toLowerCase());
});

// Función para producir sonidos según la tecla/botón
function makeSound(key){
    switch (key) {
        case "w":
        case "W":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/tom-1.mp3');
            ton1.play();
            break;
        case "a":
        case "A":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/tom-2.mp3');
            ton1.play();
            break;
        case "s":
        case "S":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/tom-3.mp3');
            ton1.play();
            break;
        case "d":
        case "D":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/tom-4.mp3');
            ton1.play();
            break;
        case "j":
        case "J":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/snare.mp3');
            ton1.play();
            break;
        case "k":
        case "K":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/crash.mp3');
            ton1.play();
            break;
        case "l":
        case "L":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/kick-bass.mp3');
            ton1.play();
            break;
        default:
            console.log(key);       
    }
}

// Animación para los botones
function buttonAnimation(currentKey){
    // Asegurarse de que currentKey está en minúsculas para coincidir con las clases
    currentKey = currentKey.toLowerCase();
    var activeButton = document.querySelector("." + currentKey);
    
    if (activeButton) {  // Solo si activeButton existe
        // Guardar el estado actual de los eventos
        const oldPointerEvents = activeButton.style.pointerEvents;
        
        // Asegurar que siempre sea clicable
        activeButton.style.pointerEvents = 'auto';
        
        activeButton.classList.add("pressed");
        setTimeout(function(){
            activeButton.classList.remove("pressed");
            // Restaurar el estado anterior
            activeButton.style.pointerEvents = oldPointerEvents;
        }, 100);
    }
}

// Si existe un botón de inicio, también podemos agregar el evento allí
const startButton = document.querySelector('#startButton');
if (startButton) {
    startButton.addEventListener('click', function() {
        if (window.reproducirLoopSpaceman) {
            window.reproducirLoopSpaceman();  // Reproducir música cuando se presiona Start
        }
        if (typeof initGame === 'function') {
            initGame();  // Iniciar el juego (si existe la función)
        }
    });
}