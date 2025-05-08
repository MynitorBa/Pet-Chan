// Variable global para el audio
let audioBackground = null;

// Función para inicializar y reproducir la música
function inicializarMusica() {
    // Crear nuevo objeto de audio cada vez que se necesite
    audioBackground = new Audio("archivos_de_minijuegos/sounds/bailarina.mp3");
    audioBackground.loop = true;  // Reproducci�n en bucle
    audioBackground.volume = 0.5; // Volumen al 50%
    
    // Intentar reproducir inmediatamente
    const reproducirAudio = () => {
        audioBackground.play().catch(error => {
            console.log('Error al reproducir audio:', error);
            // Si hay error (ej: navegador bloquea autoplay), reintentar al hacer clic
            document.addEventListener('click', reproducirAudio, { once: true });
        });
    };
    
    reproducirAudio();
}

// Función para garantizar que la música siempre esté reproduciéndose
function verificarMusica() {
    if (!audioBackground || audioBackground.paused) {
        inicializarMusica();
    }
}

// Elementos del DOM
const elements = {
    player: document.getElementById('player'),
    playerShadow: document.getElementById('playerShadow'),
    movementArea: document.getElementById('movementArea'),
    drawingArea: document.getElementById('drawingArea'),
    ribbon: document.getElementById('ribbon'),
    catchArea: document.getElementById('catchArea'),
    scoreElement: document.getElementById('score'),
    comboMeter: document.getElementById('comboMeter'),
    comboCounter: document.getElementById('comboCounter'),
    keys: {
        w: document.getElementById('keyW'),
        a: document.getElementById('keyA'),
        s: document.getElementById('keyS'),
        d: document.getElementById('keyD')
    },
    patterns: {
        circle: document.getElementById('circlePattern'),
        zigzag: document.getElementById('zigzagPattern'),
        spiral: document.getElementById('spiralPattern')
    },
    canvas: document.getElementById('patternTrace')
};

const ctx = elements.canvas?.getContext('2d');

// Variables del juego
const game = {
    dimensions: {
        drawing: { width: 500, height: 600 },
        movement: { width: 500, height: 600 },
        floorY: 580
    },
    player: { x: 235, y: 270 },
    ribbon: { x: 250, y: 370, inAir: false, velocityY: 0, dropped: false },
    mouse: { x: 0, y: 0, lastX: 0, lastY: 0, isDrawing: false },
    score: 0,
    combo: { current: 1, timeout: null },
    targets: [],
    pattern: { points: [], timeout: null },
    timers: { targetSpawn: 0, lastTarget: Date.now() },
    keys: { w: false, a: false, s: false, d: false }
};

// Control de teclas
['keydown', 'keyup'].forEach(event => {
    document.addEventListener(event, e => {
        const key = e.key.toLowerCase();
        if (key in game.keys) {
            game.keys[key] = event === 'keydown';
            elements.keys[key]?.classList.toggle('active', game.keys[key]);
        }
    });
});

// Control del mouse
elements.drawingArea?.addEventListener('mousedown', e => {
    // Verificar música al hacer clic
    verificarMusica();
    
    const rect = elements.drawingArea.getBoundingClientRect();
    game.mouse = {
        ...game.mouse,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        lastX: e.clientX - rect.left,
        lastY: e.clientY - rect.top
    };
    
    // Iniciar dibujo en canvas
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(game.mouse.x, game.mouse.y);
        ctx.strokeStyle = 'rgba(216, 88, 136, 0.5)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
    }
    
    // Intentar atrapar cinta
    if (game.ribbon.inAir && getDistance(game.mouse, game.ribbon) < 40) {
        catchRibbon();
        return;
    }
    
    // Recoger cinta del suelo
    if (game.ribbon.dropped && getDistance(game.mouse, game.ribbon) < 40) {
        game.ribbon.dropped = false;
        showNotification("¡Cinta recuperada!", game.ribbon.x, game.ribbon.y);
        createSimpleEffect(game.ribbon.x, game.ribbon.y, 5);
        return;
    }
    
    // Iniciar dibujo normal
    game.mouse.isDrawing = true;
    game.pattern.points = [];
    if (ctx) ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
});

elements.drawingArea?.addEventListener('mousemove', e => {
    const rect = elements.drawingArea.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
    
    // Actualizar área de captura SOLO cuando la cinta está en el aire Y el cursor está cerca
    if (game.ribbon.inAir && elements.catchArea) {
        const distance = getDistance(game.mouse, game.ribbon);
        
        if (distance < 60) {
            // Mostrar área de captura en la posición del cursor
            elements.catchArea.style.display = "block";
            elements.catchArea.style.left = (game.mouse.x - 30) + "px";
            elements.catchArea.style.top = (game.mouse.y - 30) + "px";
        } else {
            elements.catchArea.style.display = "none";
        }
    } else if (elements.catchArea) {
        elements.catchArea.style.display = "none";
    }
    
    if (game.mouse.isDrawing && !game.ribbon.inAir && !game.ribbon.dropped) {
        // Actualizar posición de la cinta
        game.ribbon.x = Math.max(10, Math.min(490, game.mouse.x));
        game.ribbon.y = Math.max(10, Math.min(590, game.mouse.y));
        
        // Dibujar en canvas
        if (ctx) {
            ctx.lineTo(game.ribbon.x, game.ribbon.y);
            ctx.stroke();
        }
        
        // Registrar punto del patrón
        game.pattern.points.push({ x: game.ribbon.x, y: game.ribbon.y });
        
        // Detectar lanzamiento (simplificado)
        if (game.mouse.lastY - game.ribbon.y > 10) {
            game.ribbon.inAir = true;
            game.ribbon.velocityY = -12;
        }
        
        // Crear rastro simple
        createTrail(game.ribbon.x, game.ribbon.y);
        
        game.mouse.lastX = game.ribbon.x;
        game.mouse.lastY = game.ribbon.y;
    }
});

document.addEventListener('mouseup', () => {
    game.mouse.isDrawing = false;
    evaluatePattern();
    
    if (ctx) {
        setTimeout(() => {
            ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
        }, 500);
    }
});

// Funciones simplificadas
function getDistance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

function createTrail(x, y) {
    const trail = document.createElement('div');
    trail.className = 'trail';
    trail.style.left = x + 'px';
    trail.style.top = y + 'px';
    
    elements.drawingArea.appendChild(trail);
    
    // Fade out simple
    setTimeout(() => {
        trail.style.opacity = '0';
    }, 100);
    
    setTimeout(() => trail.remove(), 400);
}

function createSimpleEffect(x, y, count) {
    for (let i = 0; i < count; i++) {
        const effect = document.createElement('div');
        effect.className = 'confetti';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        
        const size = 6 + Math.random() * 4;
        effect.style.width = size + 'px';
        effect.style.height = size + 'px';
        
        const moveX = (Math.random() - 0.5) * 100;
        const moveY = -Math.random() * 60;
        
        elements.drawingArea.appendChild(effect);
        
        // Movimiento simple
        setTimeout(() => {
            effect.style.transform = `translate(${moveX}px, ${moveY}px)`;
            effect.style.opacity = '0';
            effect.style.transition = 'all 0.8s ease';
        }, 10);
        
        setTimeout(() => effect.remove(), 850);
    }
}

function catchRibbon() {
    if (!game.ribbon.inAir) return;
    
    game.ribbon.inAir = false;
    createSimpleEffect(game.ribbon.x, game.ribbon.y, 8);
    
    const points = 5 * game.combo.current;
    game.score += points;
    updateScore();
    showScorePopup(points, game.ribbon.x, game.ribbon.y - 30);
    increaseCombo();
    showNotification("¡Atrapada!", game.ribbon.x, game.ribbon.y - 30);
    
    if (elements.catchArea) elements.catchArea.style.display = "none";
}

function showNotification(text, x, y) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = text;
    notification.style.left = x + 'px';
    notification.style.top = y + 'px';
    elements.drawingArea.appendChild(notification);
    
    // Fade out simple
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-30px)';
    }, 10);
    
    setTimeout(() => notification.remove(), 500);
}

function showScorePopup(points, x, y) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = points > 0 ? `+${points}` : points;
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
    elements.drawingArea.appendChild(popup);
    
    // Efecto simple
    setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transform = 'translateY(-30px)';
    }, 10);
    
    setTimeout(() => popup.remove(), 500);
}

function increaseCombo() {
    game.combo.current++;
    if (elements.comboCounter) elements.comboCounter.textContent = `x${game.combo.current}`;
    
    clearTimeout(game.combo.timeout);
    game.combo.timeout = setTimeout(() => {
        game.combo.current = 1;
        if (elements.comboCounter) elements.comboCounter.textContent = 'x1';
    }, 3000);
}

function createTarget() {
    const target = document.createElement('div');
    target.className = 'target';
    
    const x = Math.random() * (game.dimensions.movement.width - 50) + 25;
    const y = Math.random() * (game.dimensions.movement.height - 50) + 25;
    
    target.style.left = x + 'px';
    target.style.top = y + 'px';
    
    elements.movementArea.appendChild(target);
    game.targets.push({ element: target, x, y });
}

function highlightPatternIcon(type) {
    Object.values(elements.patterns).forEach(icon => icon?.classList.remove('active'));
    
    if (elements.patterns[type]) {
        elements.patterns[type].classList.add('active');
    }
    
    clearTimeout(game.pattern.timeout);
    game.pattern.timeout = setTimeout(() => {
        Object.values(elements.patterns).forEach(icon => icon?.classList.remove('active'));
    }, 1000);
}

function evaluatePattern() {
    if (game.pattern.points.length < 10 || game.ribbon.dropped) return;
    
    const pattern = analyzePattern();
    const patternBonuses = { circle: 10, zigzag: 7, spiral: 12 };
    
    if (pattern.type) {
        const points = patternBonuses[pattern.type] * game.combo.current;
        game.score += points;
        updateScore();
        showScorePopup(points, game.ribbon.x, game.ribbon.y - 30);
        showNotification(`¡${pattern.type}!`, game.ribbon.x, game.ribbon.y - 60);
        createSimpleEffect(game.ribbon.x, game.ribbon.y, 10);
        increaseCombo();
        highlightPatternIcon(pattern.type);
    }
}

function analyzePattern() {
    const points = game.pattern.points;
    if (points.length < 20) return { type: null };
    
    const start = points[0];
    const end = points[points.length - 1];
    
    // Círculo simple
    if (getDistance(start, end) < 40 && points.length > 25) {
        return { type: 'circle' };
    }
    
    // Zigzag simple
    let corners = 0;
    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
        
        if (Math.abs(angle1 - angle2) > 1) corners++;
    }
    
    if (corners > 4) {
        return { type: 'zigzag' };
    }
    
    // Espiral simple
    let spiralChecks = 0;
    for (let i = 0; i < points.length - 10; i += 10) {
        if (getDistance(points[i], start) > i / 2) spiralChecks++;
    }
    
    if (spiralChecks > 3 && points.length > 30) {
        return { type: 'spiral' };
    }
    
    return { type: null };
}

function updatePlayerPosition() {
    const speed = 3;
    
    if (game.keys.w && game.player.y > 15) {
        game.player.y -= speed;
    }
    if (game.keys.s && game.player.y < game.dimensions.movement.height - 30) {
        game.player.y += speed;
    }
    if (game.keys.a && game.player.x > 15) {
        game.player.x -= speed;
    }
    if (game.keys.d && game.player.x < game.dimensions.movement.width - 15) {
        game.player.x += speed;
    }
    
    if (elements.player) {
        elements.player.style.left = game.player.x + 'px';
        elements.player.style.top = game.player.y + 'px';
    }
    
    if (elements.playerShadow) {
        elements.playerShadow.style.left = (game.player.x - 2) + 'px';
        elements.playerShadow.style.top = (game.player.y + 28) + 'px';
    }
    
    checkTargetCollisions();
}

function checkTargetCollisions() {
    for (let i = game.targets.length - 1; i >= 0; i--) {
        const target = game.targets[i];
        
        if (getDistance(game.player, target) < 25) {
            target.element.remove();
            game.targets.splice(i, 1);
            
            const points = 10 * game.combo.current;
            game.score += points;
            updateScore();
            
            showScorePopup(points, game.player.x, game.player.y - 30);
            createSimpleEffect(game.player.x, game.player.y, 8);
            increaseCombo();
            
            game.timers.targetSpawn = setTimeout(createTarget, 1000);
            break;
        }
    }
}

function updateRibbonPosition() {
    if (game.ribbon.inAir) {
        game.ribbon.velocityY += 0.4;
        game.ribbon.y += game.ribbon.velocityY;
        
        // No actualizar el área de captura aquí - se actualiza en mousemove
        
        if (game.ribbon.y >= game.dimensions.floorY - 10 && !game.ribbon.dropped) {
            game.ribbon.inAir = false;
            game.ribbon.dropped = true;
            game.ribbon.y = game.dimensions.floorY - 10;
            
            if (elements.catchArea) elements.catchArea.style.display = "none";
            
            // Penalización
            const penalty = Math.min(10, game.score);
            game.score = Math.max(0, game.score - penalty);
            updateScore();
            
            game.combo.current = 1;
            if (elements.comboCounter) elements.comboCounter.textContent = 'x1';
            
            showScorePopup(-penalty, game.ribbon.x, game.ribbon.y - 30);
            showNotification("¡Cinta caída!", game.ribbon.x, game.ribbon.y - 50);
        }
    }
    
    if (elements.ribbon) {
        elements.ribbon.style.left = game.ribbon.x + 'px';
        elements.ribbon.style.top = game.ribbon.y + 'px';
    }
}

function updateScore() {
    if (elements.scoreElement) {
        elements.scoreElement.textContent = game.score;
    }
}

function gameLoop() {
    updatePlayerPosition();
    updateRibbonPosition();
    
    // Verificar que la música siga reproduciéndose cada segundo
    if (Math.floor(Date.now() / 1000) % 5 === 0) {
        verificarMusica();
    }
    
    const currentTime = Date.now();
    if (currentTime - game.timers.lastTarget > 2000 && game.targets.length < 5) {
        createTarget();
        game.timers.lastTarget = currentTime;
    }
    
    requestAnimationFrame(gameLoop);
}

function initializeGame() {
    if (ctx) {
        elements.canvas.width = 500;
        elements.canvas.height = 600;
    }
    
    // Crear objetivos iniciales
    for (let i = 0; i < 3; i++) {
        setTimeout(createTarget, i * 500);
    }
    game.timers.lastTarget = Date.now();
    
    // Iniciar música automáticamente
    inicializarMusica();
    
    // Iniciar juego
    gameLoop();
}

// Eventos para garantizar que la música siempre esté activa
window.addEventListener('focus', verificarMusica);
window.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        verificarMusica();
    }
});

// Eventos globales
window.addEventListener('load', initializeGame);
window.addEventListener('resize', () => {
    if (ctx) {
        elements.canvas.width = 500;
        elements.canvas.height = 600;
    }
});

document.addEventListener('touchmove', e => {
    if (e.scale !== 1) e.preventDefault();
}, { passive: false });

// Iniciar juego
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}

// Función para crear el objeto Audio global (reemplaza la anterior)
function reproducirLoopSpaceman() {
    // Esta función ya no es necesaria, pero la mantenemos por compatibilidad
    inicializarMusica();
}