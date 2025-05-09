// Elementos del juego
const game = document.getElementById('game');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart');
const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');
const levelElement = document.getElementById('level-value');
const speedElement = document.getElementById('speed-value');

// Variables del juego
let score = 0;
let level = 1;
let isGameOver = false;
let obstacleSpeed = 5;
let obstacleFrequency = 1500; // milisegundos
let playerSpeed = 10;
let baseSpeed = 40; // velocidad en km/h (visual)
let currentSpeed = baseSpeed;
let lastObstacleTime = 0;
let gameLoop;
let obstacles = [];
let stars = [];
let isSafeZone = true; // Para período de seguridad inicial
let safeZoneTimer = 10; // 10 segundos de seguridad inicial
let playerVerticalMovement = 0; // Para movimiento vertical
let audioLoaded = false;

// Crear elementos de sonido
const sounds = {
    background: new Audio(),
    crash: new Audio(),
    skid: new Audio(),
    levelUp: new Audio(),
    point: new Audio()
};

// Definir rutas para los sonidos
const soundPaths = {
    background: [
        "archivos_de_minijuegos/sounds/carrera.mp3",
        "sounds/carrera.mp3",
        "../sounds/carrera.mp3",
        "carrera.mp3"
    ],
    crash: [
        "archivos_de_minijuegos/sounds/explosion.mp3",
        "sounds/explosion.mp3",
        "../sounds/explosion.mp3",
        "explosion.mp3"
    ],
    skid: [
        "archivos_de_minijuegos/sounds/derrape.mp3",
        "sounds/derrape.mp3",
        "../sounds/derrape.mp3",
        "derrape.mp3"
    ],
    levelUp: [
        "archivos_de_minijuegos/sounds/levelup.mp3",
        "sounds/levelup.mp3",
        "../sounds/levelup.mp3",
        "levelup.mp3"
    ],
    point: [
        "archivos_de_minijuegos/sounds/point.mp3",
        "sounds/point.mp3",
        "../sounds/point.mp3",
        "point.mp3"
    ]
};

// Cargar sonidos
function loadSounds() {
    for (const [soundKey, soundObj] of Object.entries(sounds)) {
        const paths = soundPaths[soundKey];
        
        // Inicializar propiedades de audio
        soundObj.volume = soundKey === "background" ? 0.7 : 0.5;
        soundObj.loop = soundKey === "background";
        
        // Función de carga para cada sonido
        function tryLoadSound(pathIndex) {
            if (pathIndex >= paths.length) {
                console.log(`No se pudo cargar el sonido: ${soundKey}`);
                return;
            }
            
            soundObj.src = paths[pathIndex];
            
            soundObj.oncanplaythrough = function() {
                console.log(`Sonido cargado: ${soundKey} - ${paths[pathIndex]}`);
                // Reproducir música de fondo automáticamente
                if (soundKey === "background" && !audioLoaded) {
                    audioLoaded = true;
                    // Intentar reproducir automáticamente
                    startBackgroundMusic();
                }
            };
            
            soundObj.onerror = function() {
                console.log(`Error al cargar sonido ${soundKey} con ruta: ${paths[pathIndex]}`);
                tryLoadSound(pathIndex + 1);
            };
            
            soundObj.load();
        }
        
        tryLoadSound(0);
    }
}

// Función para iniciar la música de fondo
function startBackgroundMusic() {
    sounds.background.play().catch(e => {
        console.log("Autoplay bloqueado, esperando interacción del usuario");
        enablePlayOnFirstInteraction();
    });
}

// Activar sonido con la primera interacción
function enablePlayOnFirstInteraction() {
    const startPlayback = function() {
        if (sounds.background.paused) {
            sounds.background.play().catch(e => console.log("No se pudo reproducir en interacción:", e));
        }
        
        // Eliminar todos los event listeners una vez que se reproduzca
        game.removeEventListener('click', startPlayback);
        leftButton.removeEventListener('click', startPlayback);
        rightButton.removeEventListener('click', startPlayback);
        document.removeEventListener('keydown', startPlayback);
        document.removeEventListener('touchstart', startPlayback);
    };
    
    // Agregar eventos a elementos interactivos
    game.addEventListener('click', startPlayback);
    leftButton.addEventListener('click', startPlayback);
    rightButton.addEventListener('click', startPlayback);
    document.addEventListener('keydown', startPlayback);
    document.addEventListener('touchstart', startPlayback);
}

// Agregar efectos visuales al jugador
function setupPlayerEffects() {
    // Indicador de zona segura
    const safeZoneIndicator = document.createElement('div');
    safeZoneIndicator.className = 'safe-zone-indicator';
    safeZoneIndicator.textContent = 'PREPARADOS...';
    game.appendChild(safeZoneIndicator);
    
    return {
        safeZoneIndicator
    };
}

// Posición inicial del jugador
let playerX = 180;
let playerY = game.offsetHeight - 130; // Posición vertical inicial

// Teclas presionadas
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

// Control de teclado
document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
    
    // Simular derrape con cambios bruscos de dirección
    if ((e.key === 'ArrowLeft' && keys.ArrowRight) || (e.key === 'ArrowRight' && keys.ArrowLeft)) {
        playSkidSound();
        player.classList.add('skidding');
        setTimeout(() => {
            player.classList.remove('skidding');
        }, 300);
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// Control táctil
leftButton.addEventListener('mousedown', () => {
    keys.ArrowLeft = true;
});
leftButton.addEventListener('mouseup', () => keys.ArrowLeft = false);
leftButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.ArrowLeft = true;
    // Comprobar si hay cambio brusco de dirección
    if (keys.ArrowRight) {
        playSkidSound();
        player.classList.add('skidding');
        setTimeout(() => {
            player.classList.remove('skidding');
        }, 300);
    }
});
leftButton.addEventListener('touchend', () => keys.ArrowLeft = false);

rightButton.addEventListener('mousedown', () => {
    keys.ArrowRight = true;
    if (keys.ArrowLeft) {
        playSkidSound();
        player.classList.add('skidding');
        setTimeout(() => {
            player.classList.remove('skidding');
        }, 300);
    }
});
rightButton.addEventListener('mouseup', () => keys.ArrowRight = false);
rightButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.ArrowRight = true;
    if (keys.ArrowLeft) {
        playSkidSound();
        player.classList.add('skidding');
        setTimeout(() => {
            player.classList.remove('skidding');
        }, 300);
    }
});
rightButton.addEventListener('touchend', () => keys.ArrowRight = false);

// Sonidos
function playCrashSound() {
    sounds.crash.currentTime = 0;
    sounds.crash.play().catch(e => console.log("Error al reproducir sonido de choque:", e));
}

function playSkidSound() {
    sounds.skid.currentTime = 0;
    sounds.skid.play().catch(e => console.log("Error al reproducir sonido de derrape:", e));
}

function playLevelUpSound() {
    sounds.levelUp.currentTime = 0;
    sounds.levelUp.play().catch(e => console.log("Error al reproducir sonido de nivel:", e));
}

function playPointSound() {
    sounds.point.currentTime = 0;
    sounds.point.play().catch(e => console.log("Error al reproducir sonido de punto:", e));
}

// Función para ajustar el juego al tamaño actual
function adjustGameSize() {
    // Reajustar posición del jugador
    const gameWidth = game.offsetWidth;
    const gameHeight = game.offsetHeight;
    playerX = Math.min(playerX, gameWidth - player.offsetWidth);
    playerY = Math.min(playerY, gameHeight - player.offsetHeight - 20);
    player.style.left = playerX + 'px';
    player.style.bottom = (gameHeight - playerY - player.offsetHeight) + 'px';
}

// Iniciar juego
function startGame() {
    score = 0;
    level = 1;
    isGameOver = false;
    obstacleSpeed = 5;
    obstacleFrequency = 1500;
    playerSpeed = 10;
    baseSpeed = 40;
    currentSpeed = baseSpeed;
    playerX = 180;
    playerY = game.offsetHeight - 130;
    isSafeZone = true;
    safeZoneTimer = 10;
    
    scoreElement.textContent = score;
    levelElement.textContent = level;
    speedElement.textContent = currentSpeed;
    
    // Crear los efectos visuales del jugador
    const effects = setupPlayerEffects();
    effects.safeZoneIndicator.classList.add('active');
    
    // Actualizar el contador de la zona segura
    const safeZoneCountdown = setInterval(() => {
        safeZoneTimer--;
        effects.safeZoneIndicator.textContent = `¡PREPARADOS! ${safeZoneTimer}`;
        
        if (safeZoneTimer <= 0) {
            clearInterval(safeZoneCountdown);
            effects.safeZoneIndicator.textContent = "¡CORRE!";
            setTimeout(() => {
                effects.safeZoneIndicator.classList.remove('active');
                isSafeZone = false;
            }, 1000);
        }
    }, 1000);
    
    // Asegurar que la música suena
    if (sounds.background) {
        if (sounds.background.paused) {
            sounds.background.currentTime = 0;
            startBackgroundMusic();
        }
        sounds.background.loop = true;
        sounds.background.volume = 0.7;
    }
    
    // Eliminar obstáculos anteriores
    obstacles.forEach(obstacle => obstacle.remove());
    obstacles = [];
    
    // Eliminar estrellas anteriores
    stars.forEach(star => star.remove());
    stars = [];
    
    // Crear estrellas iniciales
    createStars(50);
    
    // Ocultar pantalla de game over
    gameOverScreen.style.display = 'none';
    
    // Iniciar bucle de juego
    if (gameLoop) cancelAnimationFrame(gameLoop);
    update();
}

// Crear estrellas (efecto de fondo)
function createStars(count) {
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * game.offsetWidth + 'px';
        star.style.top = Math.random() * game.offsetHeight + 'px';
        star.style.opacity = Math.random() * 0.8 + 0.2;
        
        // Estrellas de diferentes tamaños
        const size = Math.random() * 3 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        
        game.appendChild(star);
        stars.push(star);
    }
}

// Mover estrellas
function updateStars() {
    stars.forEach((star, i) => {
        const starY = parseFloat(star.style.top) + 2;
        
        if (starY > game.offsetHeight) {
            star.style.top = -5 + 'px';
            star.style.left = Math.random() * game.offsetWidth + 'px';
        } else {
            star.style.top = starY + 'px';
        }
    });
}

// Crear obstáculo
function createObstacle() {
    // No crear obstáculos durante la zona segura
    if (isSafeZone) return;
    
    const obstacle = document.createElement('div');
    obstacle.className = 'obstacle';
    
    // Diferentes tipos de obstáculos
    const obstacleType = Math.floor(Math.random() * 3) + 1;
    obstacle.classList.add(`type${obstacleType}`);
    
    // Posición aleatoria en el eje X
    const obstacleX = Math.floor(Math.random() * (game.offsetWidth - 40));
    obstacle.style.left = obstacleX + 'px';
    
    game.appendChild(obstacle);
    obstacles.push(obstacle);
    
    lastObstacleTime = Date.now();
}

// Mostrar indicador de puntos
function showPointsIndicator(points, x, y) {
    const indicator = document.createElement('div');
    indicator.className = 'points-indicator';
    indicator.textContent = '+' + points;
    indicator.style.left = x + 'px';
    indicator.style.top = y + 'px';
    
    game.appendChild(indicator);
    
    // Eliminar después de la animación
    setTimeout(() => {
        indicator.remove();
    }, 1000);
}

// Actualizar juego
function update() {
    if (isGameOver) return;
    
    // Mover jugador horizontalmente
    if (keys.ArrowLeft) {
        playerX = Math.max(0, playerX - playerSpeed);
    }
    if (keys.ArrowRight) {
        playerX = Math.min(game.offsetWidth - player.offsetWidth, playerX + playerSpeed);
    }
    
    // Mover jugador verticalmente
    if (keys.ArrowUp) {
        playerY = Math.max(50, playerY - playerSpeed);
    }
    if (keys.ArrowDown) {
        playerY = Math.min(game.offsetHeight - player.offsetHeight - 20, playerY + playerSpeed);
    }
    
    player.style.left = playerX + 'px';
    player.style.bottom = (game.offsetHeight - playerY - player.offsetHeight) + 'px';
    
    // Actualizar estrellas
    updateStars();
    
    // Crear obstáculos
    const currentTime = Date.now();
    if (currentTime - lastObstacleTime > obstacleFrequency) {
        createObstacle();
    }
    
    // Mover obstáculos y verificar colisiones
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        const obstacleY = parseFloat(obstacle.style.top || 0) + obstacleSpeed;
        obstacle.style.top = obstacleY + 'px';
        
        // Eliminar obstáculos fuera de pantalla
        if (obstacleY > game.offsetHeight) {
            // Puntos base por esquivar
            const pointsGained = 10;
            score += pointsGained;
            
            // Mostrar indicador de puntos
            showPointsIndicator(pointsGained, obstacle.offsetLeft, game.offsetHeight - 20);
            playPointSound();
            
            scoreElement.textContent = score;
            
            // Aumentar nivel y dificultad
            if (score >= level * 100) {
                level++;
                levelElement.textContent = level;
                obstacleSpeed += 0.5;
                obstacleFrequency = Math.max(500, obstacleFrequency - 100);
                baseSpeed += 5;
                currentSpeed = baseSpeed;
                speedElement.textContent = currentSpeed;
                playLevelUpSound();
                
                // Efecto visual de subida de nivel
                const levelUp = document.createElement('div');
                levelUp.className = 'points-indicator';
                levelUp.textContent = '¡NIVEL ' + level + '!';
                levelUp.style.left = '50%';
                levelUp.style.top = '50%';
                levelUp.style.transform = 'translate(-50%, -50%)';
                levelUp.style.fontSize = '30px';
                levelUp.style.color = 'yellow';
                game.appendChild(levelUp);
                
                setTimeout(() => {
                    levelUp.remove();
                }, 1500);
            }
            
            obstacle.remove();
            obstacles.splice(i, 1);
        }
        
    // Verificar colisión si no estamos en zona segura
// Verificar colisión si no estamos en zona segura
// Verificar colisión si no estamos en zona segura
if (!isSafeZone) {
    const obstacleRect = obstacle.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();
    
    // Margen muy grande para permitir que los obstáculos bajen mucho más
    const collisionMarginTop = 70; // píxeles de margen superior (ajusta según necesites)
    
    // También podemos ajustar los márgenes laterales si lo deseas
    const collisionMarginSides = 15; // margen lateral para hacer la colisión menos estricta
    
    if (
        obstacleRect.right - collisionMarginSides > playerRect.left + collisionMarginSides &&
        obstacleRect.left + collisionMarginSides < playerRect.right - collisionMarginSides &&
        obstacleRect.bottom > playerRect.top + collisionMarginTop && // Gran margen superior
        obstacleRect.top < playerRect.bottom
    ) {
        // Explosion visual
        obstacle.classList.add('exploding');
        playCrashSound();
        
        // Game over después de la animación
        setTimeout(() => {
            gameOver();
        }, 500);
        return;
    }
}
    }
    
    gameLoop = requestAnimationFrame(update);
}

// Game over
function gameOver() {
    isGameOver = true;
    finalScoreElement.textContent = 'Puntuación: ' + score;
    gameOverScreen.style.display = 'flex';
    
    // No pausar la música, solo bajar el volumen
    if (sounds.background) {
        sounds.background.volume = 0.3;
        // Asegurar que sigue en bucle
        sounds.background.loop = true;
    }
}

// Evento para reiniciar juego
restartButton.addEventListener('click', () => {
    startGame();
    
    // Restaurar volumen
    if (sounds.background) {
        sounds.background.volume = 0.7;
        sounds.background.loop = true;
    }
});

// Ajustar juego en caso de cambio de tamaño
window.addEventListener('resize', () => {
    adjustGameSize();
});

// Cargar sonidos al iniciar
loadSounds();

// Iniciar juego cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    startGame();
});

// También iniciar el juego inmediatamente por si DOMContentLoaded ya pasó
startGame();