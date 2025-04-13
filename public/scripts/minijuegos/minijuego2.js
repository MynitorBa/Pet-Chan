let buttonColors = ["red", "blue", "green", "yellow"];
let gamePattern = [];
let userClickedPattern = [];
let started = false;
let level = 0;

document.addEventListener('keypress', function() {    
    if (!started) { 
      document.getElementById("level-title").textContent = "Level " + level;
      nextSequence();
      started = true;
    }
});

// Seleccionar todos los botones con clase .btn y añadirles un event listener
document.querySelectorAll(".btn").forEach(function(btn) {
    btn.addEventListener('click', function() {
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