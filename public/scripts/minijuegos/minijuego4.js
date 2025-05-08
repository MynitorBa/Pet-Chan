        // Configuración del juego
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        // Ajustar tamaño del canvas al tamaño de la pantalla
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const scoreElement = document.getElementById('score');
        const timeElement = document.getElementById('time');
        const livesElement = document.getElementById('lives');
        const startScreen = document.getElementById('startScreen');
        const startButton = document.getElementById('startButton');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const restartButton = document.getElementById('restartButton');
        const finalScoreElement = document.getElementById('finalScore');
        
        // Controles móviles
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const fireBtn = document.getElementById('fireBtn');
        
        let score = 0;
        let gameTime = 0;
        let gameStarted = false;
        let audioContext;
        let backgroundMusic;
        let musicStarted = false;
        let crazyMode = false;
        let crazyModeActivated = false;
        let gameOverState = false;
        
        // Jugador
        const player = {
            x: canvas.width / 2 - 25,
            y: canvas.height - 80,
            width: 50,
            height: 40,
            speed: 8,
            color: '#00fffc',
            bullets: [],
            lastShot: 0,
            shootDelay: 300,
            lives: 3,
            invulnerable: false,
            invulnerableTime: 0,
            trail: [],
            powerUp: null,
            powerUpTime: 0
        };
        
        // Enemigos (ajustados para móvil)
        const enemies = [];
        const enemyTypes = [
            { // Tipo 0 - Clásico
                width: 40, height: 40, 
                colors: ['#ff0033', '#ff3366'], 
                score: 10, speed: 0.5, health: 1,
                pattern: (time, i) => ({ x: Math.sin(time/800 + i) * 100, y: time/1500 * 50 })
            },
            { // Tipo 1 - Rápido
                width: 30, height: 30, 
                colors: ['#ffcc00', '#ff9900'], 
                score: 20, speed: 1.2, health: 1,
                pattern: (time, i) => ({ x: Math.sin(time/500 + i*2) * 150, y: time/1200 * 50 })
            },
            { // Tipo 2 - Tanque
                width: 50, height: 50, 
                colors: ['#9900ff', '#cc66ff'], 
                score: 30, speed: 0.4, health: 3,
                pattern: (time, i) => ({ x: Math.cos(time/900 + i) * 80, y: time/1800 * 50 })
            },
            { // Tipo 3 - Cazador
                width: 35, height: 35, 
                colors: ['#00ff99', '#66ffcc'], 
                score: 40, speed: 1.0, health: 1,
                pattern: (time, i) => ({ 
                    x: Math.sin(time/600 + i) * 120,
                    y: Math.min(time/900 * 50, 100) + Math.sin(time/500) * 20
                })
            },
            { // Tipo 4 - Jefe (enemigos celestes que forman círculo)
                width: 70, height: 70, 
                colors: ['#ff0066', '#ff3399', '#ff66cc'], 
                score: 100, speed: 0.3, health: 5,
                pattern: (time, i) => ({ 
                    x: Math.sin(time/1500 * 2 + i) * (canvas.width/2 - 70),
                    y: Math.sin(time/1000) * 50 + time/2000 * 30
                })
            }
        ];
        
        // Efectos y partículas
        const explosions = [];
        const particles = [];
        const powerUps = [];
        const stars = [];
        const nebulas = [];
        
        // Inicializar estrellas de fondo
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2,
                speed: 0.2 + Math.random() * 0.8,
                alpha: 0.1 + Math.random() * 0.9
            });
        }
        
        // Inicializar nebulosas
        for (let i = 0; i < 5; i++) {
            nebulas.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 100 + Math.random() * 200,
                color: `hsla(${Math.random() * 60 + 240}, 80%, 50%, ${0.02 + Math.random() * 0.03})`,
                speed: 0.1 + Math.random() * 0.3
            });
        }
        
        // Controles
        const keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ' ': false
        };
        
        // Inicializar juego
        function initGame() {
            // Reiniciar estado del juego
            score = 0;
            gameTime = 0;
            player.lives = 10;
            player.x = canvas.width / 2 - 25;
            player.y = canvas.height - 80;
            player.bullets = [];
            player.trail = [];
            player.shootDelay = 300;
            player.powerUp = null;
            player.powerUpTime = 0;
            enemies.length = 0;
            explosions.length = 0;
            particles.length = 0;
            powerUps.length = 0;
            crazyMode = false;
            crazyModeActivated = false;
            gameOverState = false;
            
            // Actualizar UI
            updateScore();
            updateLives();
            startScreen.style.display = 'none';
            gameOverScreen.style.display = 'none';
            gameStarted = true;
            
            // Iniciar música
            initAudio();
            
            // Iniciar bucle del juego
            gameLoop();
        }
        
        // Audio
        function initAudio() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                const audioElement = new Audio();
                audioElement.src = './mu1.mp3';
                audioElement.loop = true;
                
                if (audioContext) {
                    backgroundMusic = audioContext.createMediaElementSource(audioElement);
                    
                    const compressor = audioContext.createDynamicsCompressor();
                    compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
                    compressor.knee.setValueAtTime(40, audioContext.currentTime);
                    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
                    compressor.attack.setValueAtTime(0, audioContext.currentTime);
                    compressor.release.setValueAtTime(0.25, audioContext.currentTime);
                    
                    const delay = audioContext.createDelay();
                    delay.delayTime.setValueAtTime(0.15, audioContext.currentTime);
                    
                    const feedback = audioContext.createGain();
                    feedback.gain.setValueAtTime(0.3, audioContext.currentTime);
                    
                    const filter = audioContext.createBiquadFilter();
                    filter.type = "lowpass";
                    filter.frequency.setValueAtTime(1000, audioContext.currentTime);
                    
                    backgroundMusic.connect(compressor);
                    compressor.connect(delay);
                    delay.connect(feedback);
                    feedback.connect(delay);
                    delay.connect(filter);
                    filter.connect(audioContext.destination);
                    
                    audioElement.play().then(() => {
                        musicStarted = true;
                    }).catch(e => {
                        console.log("La reproducción automática falló:", e);
                    });
                }
            } catch (e) {
                console.log("Error con el audio:", e);
            }
        }
        
        // Bucle principal del juego
        function gameLoop() {
            if (!gameStarted) return;
            
            update();
            render();
            
            requestAnimationFrame(gameLoop);
        }
        
        // Actualizar estado del juego
        function update() {
            // Actualizar tiempo
            gameTime += 16.666;
            updateTimeDisplay();
            
            // Activar modo caótico a los 1:16 (76 segundos)
            if (gameTime >= 76000 && !crazyModeActivated) {
                activateCrazyMode();
                crazyModeActivated = true;
            }
            
            // Mover jugador
            if (keys.ArrowLeft && player.x > 0) {
                player.x -= player.speed;
            }
            if (keys.ArrowRight && player.x < canvas.width - player.width) {
                player.x += player.speed;
            }
            
            // Disparar
            if (keys[' '] && Date.now() - player.lastShot > player.shootDelay) {
                shoot();
                player.lastShot = Date.now();
            }
            
            // Actualizar estela del jugador
            player.trail.push({ x: player.x + player.width/2, y: player.y + player.height });
            if (player.trail.length > 20) {
                player.trail.shift();
            }
            
            // Verificar si el power-up ha expirado
            if (player.powerUp && Date.now() > player.powerUpTime) {
                player.powerUp = null;
                player.shootDelay = 300;
            }
            
            // Mover balas del jugador
            for (let i = player.bullets.length - 1; i >= 0; i--) {
                const bullet = player.bullets[i];
                bullet.y -= bullet.speed;
                
                // Actualizar posición de balas especiales
                if (bullet.special) {
                    if (bullet.type === 'spread') {
                        bullet.x += bullet.vx;
                    } else if (bullet.type === 'laser') {
                        bullet.height = canvas.height - bullet.y;
                    }
                }
                
                // Eliminar balas que salen de la pantalla
                if (bullet.y < 0) {
                    player.bullets.splice(i, 1);
                    continue;
                }
                
                // Detectar colisiones con enemigos
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    
                    if (bullet.special && bullet.type === 'laser') {
                        if (bullet.x < enemy.x + enemy.width && 
                            bullet.x + bullet.width > enemy.x) {
                            enemy.health--;
                            createExplosion(
                                enemy.x + enemy.width/2, 
                                enemy.y + enemy.height/2, 
                                5, 
                                enemy.colors[0]
                            );
                            
                            if (enemy.health <= 0) {
                                score += enemy.score;
                                updateScore();
                                createExplosion(
                                    enemy.x + enemy.width/2, 
                                    enemy.y + enemy.height/2, 
                                    15, 
                                    enemy.colors[1]
                                );
                                enemies.splice(j, 1);
                            }
                        }
                    } 
                    else if (checkCollision(bullet, enemy)) {
                        enemy.health--;
                        createExplosion(
                            enemy.x + enemy.width/2, 
                            enemy.y + enemy.height/2, 
                            5, 
                            enemy.colors[0]
                        );
                        
                        if (enemy.health <= 0) {
                            score += enemy.score;
                            updateScore();
                            createExplosion(
                                enemy.x + enemy.width/2, 
                                enemy.y + enemy.height/2, 
                                15, 
                                enemy.colors[1]
                            );
                            
                            if (Math.random() < 0.15) {
                                createPowerUp(
                                    enemy.x + enemy.width/2, 
                                    enemy.y + enemy.height/2
                                );
                            }
                            
                            enemies.splice(j, 1);
                        }
                        
                        if (!bullet.special || bullet.type !== 'laser') {
                            player.bullets.splice(i, 1);
                        }
                        break;
                    }
                }
            }
            
            // Generar nuevos enemigos (más enemigos tipo 4 en modo locura)
            if (Math.random() < (crazyMode ? 0.08 : 0.025)) {
                // En modo locura, mayor probabilidad de enemigos tipo 4 (círculo)
                const type = crazyMode ? 
                    (Math.random() < 0.4 ? 4 : Math.floor(Math.random() * 4)) : 
                    Math.floor(Math.random() * (enemyTypes.length - 1));
                
                spawnEnemy(type);
            }
            
            // Mover enemigos
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                const pattern = enemyTypes[enemy.type].pattern(gameTime, i);
                
                enemy.targetX = pattern.x + canvas.width/2 - enemy.width/2;
                enemy.targetY = pattern.y;
                
                enemy.x += (enemy.targetX - enemy.x) * 0.05;
                enemy.y += enemy.speed + (enemy.targetY - enemy.y) * 0.02;
                
                if (crazyMode) {
                    enemy.x += Math.sin(gameTime/300 + i) * 2;
                    enemy.y += Math.cos(gameTime/400 + i) * 1.5;
                }
                
                if (enemy.y > canvas.height + enemy.height) {
                    enemies.splice(i, 1);
                    continue;
                }
                
                if (!player.invulnerable && checkCollision(player, enemy)) {
                    player.lives--;
                    player.invulnerable = true;
                    player.invulnerableTime = Date.now() + 2000;
                    
                    createExplosion(
                        enemy.x + enemy.width/2, 
                        enemy.y + enemy.height/2, 
                        20, 
                        enemy.colors[1]
                    );
                    createExplosion(
                        player.x + player.width/2, 
                        player.y + player.height/2, 
                        30, 
                        player.color
                    );
                    
                    enemies.splice(i, 1);
                    updateLives();
                    
                    if (player.lives <= 0) {
                        gameOver();
                    }
                }
            }
            
            // Actualizar invulnerabilidad
            if (player.invulnerable && Date.now() > player.invulnerableTime) {
                player.invulnerable = false;
            }
            
            // Actualizar explosiones
            for (let i = explosions.length - 1; i >= 0; i--) {
                explosions[i].radius += explosions[i].growth;
                explosions[i].alpha -= 0.02;
                
                if (explosions[i].alpha <= 0) {
                    explosions.splice(i, 1);
                }
            }
            
            // Actualizar partículas
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].x += particles[i].vx;
                particles[i].y += particles[i].vy;
                particles[i].vy += 0.05;
                particles[i].alpha -= particles[i].decay;
                
                if (particles[i].alpha <= 0) {
                    particles.splice(i, 1);
                }
            }
            
            // Actualizar power-ups
            for (let i = powerUps.length - 1; i >= 0; i--) {
                const powerUp = powerUps[i];
                powerUp.y += 2;
                powerUp.angle += 0.05;
                
                // Detección de colisión mejorada para móvil
                const powerUpRadius = powerUp.radius + 15;
                const playerCenterX = player.x + player.width/2;
                const playerCenterY = player.y + player.height/2;
                const distance = Math.sqrt(
                    Math.pow(playerCenterX - powerUp.x, 2) + 
                    Math.pow(playerCenterY - powerUp.y, 2)
                );
                
                if (distance < powerUpRadius + Math.max(player.width, player.height)/2) {
                    applyPowerUp(powerUp.type);
                    createExplosion(
                        powerUp.x, 
                        powerUp.y, 
                        20, 
                        powerUp.color
                    );
                    powerUps.splice(i, 1);
                }
                
                if (powerUp.y > canvas.height + powerUp.radius) {
                    powerUps.splice(i, 1);
                }
            }
            
            // Mover estrellas de fondo
            for (let i = 0; i < stars.length; i++) {
                stars[i].y += stars[i].speed;
                if (stars[i].y > canvas.height) {
                    stars[i].y = 0;
                    stars[i].x = Math.random() * canvas.width;
                }
            }
            
            // Mover nebulosas
            for (let i = 0; i < nebulas.length; i++) {
                nebulas[i].y += nebulas[i].speed;
                if (nebulas[i].y > canvas.height + nebulas[i].radius) {
                    nebulas[i].y = -nebulas[i].radius;
                    nebulas[i].x = Math.random() * canvas.width;
                }
            }
        }
        
        // Renderizar el juego
        function render() {
            // Limpiar canvas
            const gradient = ctx.createRadialGradient(
                canvas.width/2, canvas.height/2, 0,
                canvas.width/2, canvas.height/2, canvas.width
            );
            gradient.addColorStop(0, '#0a0e24');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Dibujar nebulosas
            nebulas.forEach(nebula => {
                ctx.beginPath();
                ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
                ctx.fillStyle = nebula.color;
                ctx.fill();
            });
            
            // Dibujar estrellas
            stars.forEach(star => {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.fillRect(star.x, star.y, star.size, star.size);
                
                if (Math.random() < 0.01) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * 2})`;
                    ctx.fillRect(star.x - 1, star.y - 1, star.size + 2, star.size + 2);
                }
            });
            
            // Dibujar estela del jugador
            if (player.trail.length > 1) {
                ctx.strokeStyle = `${player.color}80`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(player.trail[0].x, player.trail[0].y);
                
                for (let i = 1; i < player.trail.length; i++) {
                    ctx.lineTo(player.trail[i].x, player.trail[i].y);
                }
                
                ctx.stroke();
                
                player.trail.forEach((point, i) => {
                    const alpha = i / player.trail.length;
                    ctx.fillStyle = `${player.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 2 * alpha, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
            
            // Dibujar jugador
            if (!player.invulnerable || Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.fillStyle = player.color;
                ctx.beginPath();
                ctx.moveTo(player.x + player.width/2, player.y);
                ctx.lineTo(player.x + player.width, player.y + player.height);
                ctx.lineTo(player.x, player.y + player.height);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(player.x + player.width/2 - 5, player.y - 10, 10, 10);
                
                if (player.powerUp) {
                    const timeLeft = (player.powerUpTime - Date.now()) / 1000;
                    if (timeLeft > 0) {
                        ctx.fillStyle = player.powerUp === 'spread' ? '#00ffff' : '#ff00ff';
                        ctx.font = 'bold 12px Orbitron';
                        ctx.textAlign = 'center';
                        ctx.fillText(
                            `${player.powerUp.toUpperCase()} ${timeLeft.toFixed(1)}s`, 
                            player.x + player.width/2, 
                            player.y - 20
                        );
                    }
                }
                
                if (keys.ArrowLeft || keys.ArrowRight) {
                    ctx.fillStyle = '#ff6600';
                    ctx.beginPath();
                    ctx.moveTo(player.x + player.width/2 - 10, player.y + player.height);
                    ctx.lineTo(player.x + player.width/2 + 10, player.y + player.height);
                    ctx.lineTo(player.x + player.width/2, player.y + player.height + 15);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            
            // Dibujar balas del jugador
            ctx.shadowBlur = 10;
            player.bullets.forEach(bullet => {
                if (bullet.special) {
                    if (bullet.type === 'spread') {
                        ctx.fillStyle = '#00ffff';
                        ctx.shadowColor = '#00ffff';
                        ctx.beginPath();
                        ctx.arc(bullet.x, bullet.y, bullet.width/2, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (bullet.type === 'laser') {
                        ctx.fillStyle = '#ff00ff';
                        ctx.shadowColor = '#ff00ff';
                        ctx.fillRect(
                            bullet.x, 
                            bullet.y, 
                            bullet.width, 
                            bullet.height
                        );
                        
                        const gradient = ctx.createLinearGradient(
                            bullet.x, bullet.y, 
                            bullet.x + bullet.width, bullet.y
                        );
                        gradient.addColorStop(0, 'rgba(255, 0, 255, 0.1)');
                        gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.7)');
                        gradient.addColorStop(1, 'rgba(255, 0, 255, 0.1)');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(
                            bullet.x - 5, 
                            bullet.y, 
                            bullet.width + 10, 
                            bullet.height
                        );
                    }
                } else {
                    ctx.fillStyle = '#00ffff';
                    ctx.shadowColor = '#00ffff';
                    ctx.beginPath();
                    ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, bullet.width/2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.shadowBlur = 0;
            
            // Dibujar enemigos
            enemies.forEach(enemy => {
                const gradient = ctx.createRadialGradient(
                    enemy.x + enemy.width/2, enemy.y + enemy.height/2, 0,
                    enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2
                );
                gradient.addColorStop(0, enemy.colors[0]);
                gradient.addColorStop(1, enemy.colors[1] || enemy.colors[0]);
                
                ctx.fillStyle = gradient;
                
                switch(enemy.type) {
                    case 0:
                        ctx.beginPath();
                        ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    case 1:
                        ctx.beginPath();
                        ctx.moveTo(enemy.x + enemy.width/2, enemy.y);
                        ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
                        ctx.lineTo(enemy.x, enemy.y + enemy.height);
                        ctx.closePath();
                        ctx.fill();
                        break;
                    case 2:
                        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                        break;
                    case 3:
                        ctx.beginPath();
                        ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI);
                        ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2 + 10, enemy.width/2, Math.PI, 0, true);
                        ctx.closePath();
                        ctx.fill();
                        break;
                    case 4:
                        ctx.beginPath();
                        for (let i = 0; i < 8; i++) {
                            const angle = i * Math.PI * 2 / 8;
                            const radius = i % 2 === 0 ? enemy.width/2 : enemy.width/3;
                            const x = enemy.x + enemy.width/2 + Math.cos(angle) * radius;
                            const y = enemy.y + enemy.height/2 + Math.sin(angle) * radius;
                            
                            if (i === 0) {
                                ctx.moveTo(x, y);
                            } else {
                                ctx.lineTo(x, y);
                            }
                        }
                        ctx.closePath();
                        ctx.fill();
                        break;
                }
                
                if (enemy.health > 1) {
                    ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(Date.now()/200) * 0.3})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(
                        enemy.x + enemy.width/2, 
                        enemy.y + enemy.height/2, 
                        enemy.width/2 + 5, 
                        0, 
                        Math.PI * 2 * (enemy.health / enemyTypes[enemy.type].health)
                    );
                    ctx.stroke();
                }
            });
            
            // Dibujar explosiones
            explosions.forEach(explosion => {
                const gradient = ctx.createRadialGradient(
                    explosion.x, explosion.y, 0,
                    explosion.x, explosion.y, explosion.radius
                );
                gradient.addColorStop(0, explosion.color);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.globalAlpha = explosion.alpha;
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });
            
            // Dibujar partículas
            particles.forEach(particle => {
                ctx.globalAlpha = particle.alpha;
                ctx.fillStyle = particle.color;
                ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
                ctx.globalAlpha = 1;
            });
            
            // Dibujar power-ups
            ctx.shadowBlur = 15;
            powerUps.forEach(powerUp => {
                ctx.save();
                ctx.translate(powerUp.x, powerUp.y);
                ctx.rotate(powerUp.angle);
                
                ctx.strokeStyle = powerUp.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, powerUp.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = powerUp.color;
                
                if (powerUp.type === 'spread') {
                    ctx.beginPath();
                    ctx.arc(0, 0, 5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    for (let i = 0; i < 3; i++) {
                        const angle = i * Math.PI * 2 / 3 - Math.PI/2;
                        ctx.beginPath();
                        ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
                        ctx.lineTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                } else if (powerUp.type === 'laser') {
                    ctx.fillRect(-3, -10, 6, 20);
                }
                
                ctx.restore();
            });
            ctx.shadowBlur = 0;
            
            // Efectos de modo caótico
            if (crazyMode) {
                ctx.save();
                ctx.globalAlpha = 0.2;
                ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
                
                for (let i = 0; i < 10; i++) {
                    ctx.strokeStyle = `hsla(${Math.random() * 360}, 100%, 50%, 0.7)`;
                    ctx.lineWidth = 1 + Math.random() * 3;
                    ctx.beginPath();
                    const x1 = Math.random() * canvas.width;
                    const y1 = Math.random() * canvas.height;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(
                        x1 + (Math.random() - 0.5) * 200,
                        y1 + (Math.random() - 0.5) * 200
                    );
                    ctx.stroke();
                }
                
                if (Math.floor(Date.now() / 500) % 2 === 0) {
                    ctx.fillStyle = '#ff0000';
                    ctx.font = 'bold 36px Orbitron';
                    ctx.textAlign = 'center';
                    ctx.fillText('¡MODO CAÓTICO ACTIVADO!', canvas.width/2, 50);
                }
            }
        }
        
        // Disparar bala
        function shoot() {
            if (player.powerUp === 'spread') {
                for (let i = 0; i < 3; i++) {
                    const angle = i * Math.PI/6 - Math.PI/12;
                    player.bullets.push({
                        x: player.x + player.width/2 - 2.5,
                        y: player.y,
                        width: 5,
                        height: 15,
                        speed: 8,
                        vx: Math.sin(angle) * 3,
                        special: true,
                        type: 'spread'
                    });
                }
            } else if (player.powerUp === 'laser') {
                player.bullets.push({
                    x: player.x + player.width/2 - 7.5,
                    y: player.y,
                    width: 15,
                    height: 10,
                    speed: 15,
                    special: true,
                    type: 'laser'
                });
            } else {
                player.bullets.push({
                    x: player.x + player.width/2 - 2.5,
                    y: player.y,
                    width: 5,
                    height: 15,
                    speed: crazyMode ? 15 : 10
                });
            }
            
            playSound(100, 0.02, 0.1, 'sawtooth', 1200, 100);
        }
        
        // Generar enemigo
        function spawnEnemy(type = null) {
            if (type === null) {
                type = Math.floor(Math.random() * (crazyMode ? enemyTypes.length : Math.min(4, enemyTypes.length)));
            }
            
            const enemy = {
                x: Math.random() * (canvas.width - enemyTypes[type].width),
                y: -enemyTypes[type].height,
                width: enemyTypes[type].width,
                height: enemyTypes[type].height,
                colors: enemyTypes[type].colors,
                score: enemyTypes[type].score,
                speed: enemyTypes[type].speed * (crazyMode ? 1.5 : 1),
                health: enemyTypes[type].health,
                type: type,
                targetX: 0,
                targetY: 0
            };
            
            enemies.push(enemy);
        }
        
        // Crear explosión
        function createExplosion(x, y, size, color = '#ff6600') {
            explosions.push({
                x: x,
                y: y,
                radius: 5,
                growth: size / 5,
                alpha: 1,
                color: color
            });
            
            const particleCount = crazyMode ? size * 10 : size * 5;
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * size / 2;
                
                particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: color,
                    size: 1 + Math.random() * 3,
                    alpha: 0.5 + Math.random() * 0.5,
                    decay: 0.01 + Math.random() * 0.02
                });
            }
            
            playSound(60, 0.1, 0.3, 'square', 100, 50);
        }
        
        // Crear power-up
        function createPowerUp(x, y) {
            const types = ['spread', 'laser'];
            const type = types[Math.floor(Math.random() * types.length)];
            const colors = {
                'spread': '#00ffff',
                'laser': '#ff00ff'
            };
            
            powerUps.push({
                x: x,
                y: y,
                radius: 15,
                type: type,
                color: colors[type],
                angle: 0
            });
        }
        
        // Aplicar power-up
        function applyPowerUp(type) {
            player.powerUp = type;
            player.powerUpTime = Date.now() + 10000;
            
            if (type === 'spread') {
                player.shootDelay = 500;
                
                for (let i = 0; i < 360; i += 120) {
                    const angle = i * Math.PI / 180;
                    particles.push({
                        x: player.x + player.width/2,
                        y: player.y + player.height/2,
                        vx: Math.cos(angle) * 3,
                        vy: Math.sin(angle) * 3,
                        color: '#00ffff',
                        size: 2,
                        alpha: 1,
                        decay: 0.02
                    });
                }
                
                playSound(523.25, 0.1, 0.5, 'sine', 1200, 200);
            } else if (type === 'laser') {
                player.shootDelay = 600;
                
                for (let i = 0; i < 50; i++) {
                    particles.push({
                        x: player.x + player.width/2,
                        y: player.y + player.height/2,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -Math.random() * 6,
                        color: '#ff00ff',
                        size: 1 + Math.random() * 3,
                        alpha: 0.8,
                        decay: 0.01
                    });
                }
                
                playSound(659.25, 0.1, 0.5, 'sine', 800, 200);
            }
        }
        
        // Activar modo caótico
        function activateCrazyMode() {
            crazyMode = true;
            
            player.colorInterval = setInterval(() => {
                player.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
            }, 200);
            
            // Generar más enemigos tipo 4 (círculo)
            for (let i = 0; i < 30; i++) {
                setTimeout(() => {
                    spawnEnemy(4); // Forzar enemigo tipo 4
                }, i * 300);
            }
            
            // Efectos visuales
            for (let i = 0; i < 30; i++) {
                setTimeout(() => {
                    createExplosion(
                        Math.random() * canvas.width,
                        Math.random() * canvas.height,
                        30 + Math.random() * 30,
                        `hsl(${Math.random() * 360}, 100%, 50%)`
                    );
                }, i * 50);
            }
            
            playChaoticSound();
            
            setInterval(() => {
                nebulas.forEach(nebula => {
                    nebula.color = `hsla(${Math.random() * 360}, 80%, 50%, ${0.02 + Math.random() * 0.03})`;
                });
            }, 1000);
        }
        
        // Reproducir sonido
        function playSound(freq, attack, release, type, freqEnd = null, duration = 500) {
            if (!audioContext) return;
            
            try {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.type = type;
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                
                if (freqEnd) {
                    oscillator.frequency.exponentialRampToValueAtTime(
                        freqEnd, 
                        audioContext.currentTime + duration / 1000
                    );
                }
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + attack);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + release);
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + duration / 1000);
            } catch (e) {
                console.log("Error con el sonido:", e);
            }
        }
        
        // Reproducir sonido caótico
        function playChaoticSound() {
            if (!audioContext) return;
            
            try {
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.type = ['sine', 'square', 'sawtooth', 'triangle'][Math.floor(Math.random() * 4)];
                        oscillator.frequency.setValueAtTime(50 + Math.random() * 1000, audioContext.currentTime);
                        
                        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1 + Math.random());
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 1 + Math.random());
                    }, i * 100);
                }
            } catch (e) {
                console.log("Error con el sonido caótico:", e);
            }
        }
        
        // Comprobar colisión
        function checkCollision(obj1, obj2) {
            return obj1.x < obj2.x + obj2.width &&
                   obj1.x + obj1.width > obj2.x &&
                   obj1.y < obj2.y + obj2.height &&
                   obj1.y + obj1.height > obj2.y;
        }
        
        // Actualizar marcador
        function updateScore() {
            scoreElement.textContent = `SCORE: ${score}`;
        }
        
        // Actualizar tiempo
        function updateTimeDisplay() {
            const seconds = Math.floor(gameTime / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            timeElement.textContent = `TIME: ${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        }
        
        // Actualizar vidas
        function updateLives() {
            livesElement.innerHTML = '';
            for (let i = 0; i < player.lives; i++) {
                const life = document.createElement('div');
                life.className = 'life';
                livesElement.appendChild(life);
            }
        }
        
        // Game over
        function gameOver() {
            gameStarted = false;
            gameOverState = true;
            
            if (audioContext) {
                audioContext.close();
            }
            
            finalScoreElement.textContent = `SCORE: ${score}`;
            gameOverScreen.style.display = 'flex';
            
            for (let i = 0; i < 100; i++) {
                setTimeout(() => {
                    createExplosion(
                        Math.random() * canvas.width,
                        Math.random() * canvas.height,
                        10 + Math.random() * 30,
                        `hsl(${Math.random() * 360}, 100%, 50%)`
                    );
                }, i * 50);
            }
        }
        
        // Event listeners
        startButton.addEventListener('click', initGame);
        restartButton.addEventListener('click', initGame);
        
        // Controles de teclado
        document.addEventListener('keydown', (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = true;
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = false;
                e.preventDefault();
            }
        });
        
        // Controles táctiles mejorados
        function setupMobileControls() {
            // Izquierda
            leftBtn.addEventListener('mousedown', () => { keys.ArrowLeft = true; });
            leftBtn.addEventListener('mouseup', () => { keys.ArrowLeft = false; });
            leftBtn.addEventListener('mouseleave', () => { keys.ArrowLeft = false; });
            leftBtn.addEventListener('touchstart', (e) => {
                keys.ArrowLeft = true;
                e.preventDefault();
            }, { passive: false });
            leftBtn.addEventListener('touchend', () => { keys.ArrowLeft = false; });
            leftBtn.addEventListener('touchcancel', () => { keys.ArrowLeft = false; });
            
            // Derecha
            rightBtn.addEventListener('mousedown', () => { keys.ArrowRight = true; });
            rightBtn.addEventListener('mouseup', () => { keys.ArrowRight = false; });
            rightBtn.addEventListener('mouseleave', () => { keys.ArrowRight = false; });
            rightBtn.addEventListener('touchstart', (e) => {
                keys.ArrowRight = true;
                e.preventDefault();
            }, { passive: false });
            rightBtn.addEventListener('touchend', () => { keys.ArrowRight = false; });
            rightBtn.addEventListener('touchcancel', () => { keys.ArrowRight = false; });
            
            // Disparo
            fireBtn.addEventListener('mousedown', () => { keys[' '] = true; });
            fireBtn.addEventListener('mouseup', () => { keys[' '] = false; });
            fireBtn.addEventListener('mouseleave', () => { keys[' '] = false; });
            fireBtn.addEventListener('touchstart', (e) => {
                keys[' '] = true;
                e.preventDefault();
            }, { passive: false });
            fireBtn.addEventListener('touchend', () => { keys[' '] = false; });
            fireBtn.addEventListener('touchcancel', () => { keys[' '] = false; });
        }
        
        // Inicializar controles móviles
        setupMobileControls();
        
        // Permitir al usuario agregar su propia música
        document.addEventListener('click', () => {
            if (!musicStarted && audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });
        
        // Precargar vidas
        updateLives();
        
        // Manejar redimensionamiento
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            player.x = canvas.width / 2 - 25;
            player.y = canvas.height - 80;
        });

        // Función para reproducir el audio en loop
function reproducirLoopSpaceman() {
    let audio = new Audio("archivos_de_minijuegos/sounds/spaceman.mp3");
    audio.loop = true;  // Asegura que el audio se reproduzca en loop
    audio.play();  // Inicia la reproducción del audio
}

// Modificar el listener del botón Start para que reproduzca música
startButton.addEventListener('click', function() {
    reproducirLoopSpaceman();  // Reproducir música cuando se presiona Start
    initGame();  // Iniciar el juego (función original)
});