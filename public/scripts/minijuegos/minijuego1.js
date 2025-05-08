// Variables del juego Simon
let buttonColors = ["red", "blue", "green", "yellow"];
let gamePattern = [];
let userClickedPattern = [];
let started = false;
let level = 0;

// Reproducción automática de la música de fondo con múltiples enfoques
(function() {
    // Crear el elemento de audio
    const backgroundMusic = new Audio('archivos_de_minijuegos/sounds/simon.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3; // Volumen más bajo para que no interfiera con los sonidos del juego
    
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

// Iniciar el juego con cualquier tecla
document.addEventListener('keypress', function() {    
    if (!started) { 
      document.getElementById("level-title").textContent = "Level " + level;
      // Intentar reproducir música si aún no está sonando
      if (window.reproducirLoopSpaceman) {
          window.reproducirLoopSpaceman();
      }
      nextSequence();
      started = true;
    }
});

// Seleccionar todos los botones con clase .btn y añadirles un event listener
document.querySelectorAll(".btn").forEach(function(btn) {
    btn.addEventListener('click', function() {
        // También intentar reproducir música en el primer clic
        if (window.reproducirLoopSpaceman && !started) {
            window.reproducirLoopSpaceman();
        }
        
        let userChosenColor = this.getAttribute("id");
        userClickedPattern.push(userChosenColor);
        playSound(userChosenColor);
        animatePress(userChosenColor);    
        checkAnswer(userClickedPattern.length-1);
    });
});

function nextSequence() {
    userClickedPattern = [];
    level++;
    document.getElementById("level-title").textContent = "Level " + level;
    let randomNumber = Math.floor(Math.random() * 4);
    let randomChosenColor = buttonColors[randomNumber];
    gamePattern.push(randomChosenColor);
    
    // Recrear la animación de fadeIn/fadeOut/fadeIn con JS puro
    let element = document.getElementById(randomChosenColor);
    fadeInOut(element);
    
    playSound(randomChosenColor);
}

function fadeInOut(element) {
    // Simular fadeIn/fadeOut/fadeIn
    element.style.opacity = 0;
    setTimeout(() => {
        element.style.opacity = 1;
        setTimeout(() => {
            element.style.opacity = 0;
            setTimeout(() => {
                element.style.opacity = 1;
            }, 100);
        }, 100);
    }, 100);
}

function playSound(name) {
    let audio = new Audio("archivos_de_minijuegos/sounds/" + name + ".mp3");
    audio.play();
}

function animatePress(currentColor) {
    let button = document.getElementById(currentColor);
    button.classList.add("pressed");
    setTimeout(function () {
      button.classList.remove("pressed");
    }, 100);
}

function checkAnswer(currentLevel) {
    if (gamePattern[currentLevel] === userClickedPattern[currentLevel]) {
      if (userClickedPattern.length === gamePattern.length){
        setTimeout(function () {
          nextSequence();
        }, 1000);
      }
    } else {
        playSound("wrong");
        document.body.classList.add("game-over");
        setTimeout(function () {
          document.body.classList.remove("game-over");
        }, 200);
        document.getElementById("level-title").textContent = "Game Over, Press Any Key to Restart";
        startOver();
      }
}

function startOver() {
    level = 0;
    gamePattern = [];
    started = false; 
}