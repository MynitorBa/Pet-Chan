// Código para reproducir la música automáticamente
(function() {
    // Crear el elemento de audio
    const backgroundAudio = new Audio("archivos_de_minijuegos/sounds/apuestas.mp3");
    backgroundAudio.loop = true;
    backgroundAudio.volume = 1.0;
    
    // Intentar reproducir inmediatamente
    backgroundAudio.play().catch(error => {
        console.error("Error al reproducir automáticamente:", error);
        
        // Intentar reproducir con cualquier interacción del usuario
        const startAudio = function() {
            backgroundAudio.play().catch(e => console.error("Error al reproducir:", e));
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
        if (backgroundAudio.paused) {
            backgroundAudio.play().catch(e => {});
        }
    });
})();

// === CÓDIGO ORIGINAL SIN MODIFICAR ===
window.onload = function() {
    resetGame();
};

function rollDice() {
    document.getElementById("dice1").style.display = "none";
    document.getElementById("dice2").style.display = "none";
    
    document.querySelector(".img1").style.display = "block";
    document.querySelector(".img2").style.display = "block";
    
    const randomNumber1 = Math.floor(Math.random() * 6) + 1;
    const randomNumber2 = Math.floor(Math.random() * 6) + 1;
    
    const randomImage1 = "archivos_de_minijuegos/images/dice" + randomNumber1 + ".png";
    const randomImage2 = "archivos_de_minijuegos/images/dice" + randomNumber2 + ".png";
    
    document.querySelector(".img1").setAttribute("src", randomImage1);
    document.querySelector(".img2").setAttribute("src", randomImage2);
    
    if (randomNumber1 > randomNumber2) {
        document.querySelector("h2").innerHTML = "Player 1 Wins!";
    } else if (randomNumber2 > randomNumber1) {
        document.querySelector("h2").innerHTML = "Player 2 Wins!";
    } else {
        document.querySelector("h2").innerHTML = "Draw!";
    }
}

function resetGame() {
    document.getElementById("dice1").style.display = "block";
    document.getElementById("dice2").style.display = "block";
    
    document.querySelector(".img1").style.display = "none";
    document.querySelector(".img2").style.display = "none";
    
    document.querySelector("h2").innerHTML = "Refresh Me";
}

document.getElementById("roll-button").addEventListener("click", rollDice);
document.getElementById("reset-button").addEventListener("click", resetGame);