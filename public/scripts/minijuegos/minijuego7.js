        // Game Constants
        const TILE_SIZE = 64;
        const FOV = Math.PI / 3;
        const HALF_FOV = FOV / 2;
        const MAX_DEPTH = 1600;
        const MAP_SIZE = 40;
        const FRUIT_COUNT = 5;
        const AMMO_BOX_COUNT = 3;
        
        // Game State
        const gameState = {
            player: {
                x: TILE_SIZE * 1.5,
                y: TILE_SIZE * 1.5,
                angle: 0,
                speed: 0,
                rotationSpeed: 0,
                moveSpeed: 2.5,
                turnSpeed: 0.04,
                ammo: 6,
                maxAmmo: 12,
                canShoot: true,
                health: 100,
                maxHealth: 100,
                isMoving: false
            },
            enemy: {
                x: 0, 
                y: 0,
                speed: 1.5,
                chaseSpeed: 2.5,
                active: false,
                detected: false, 
                wasShot: false,
                shotFlashDuration: 200,
                stunDuration: 2000, 
                isStunned: false,
                stunTimeout: null,
                hasJumpscared: false,
                damage: 10,
                attackCooldown: 1000,
                lastAttack: 0
            },
            flashlight: {
                active: false,
                battery: 100, 
                drainRate: 0.15, 
                rechargeRate: 0.08, 
                minBatteryToActivate: 10 
            },
            fruits: [],
            ammoBoxes: [],
            fruitsInCauldron: 0,
            muzzleFlash: false,
            muzzleFlashDuration: 100,
            lastShootTime: 0,
            map: [],
            discoveredTiles: Array(MAP_SIZE).fill().map(() => Array(MAP_SIZE).fill(false)),
            cauldron: {
                x: 0,
                y: 0,
                size: TILE_SIZE/2,
                particles: []
            },
            sounds: {
                footstepsPlaying: false,
                heartbeatPlaying: false
            },
            gameOver: false
        };

        // DOM Elements
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const minimapCanvas = document.getElementById('minimap');
        const minimapCtx = minimapCanvas.getContext('2d');
        const ammoDisplay = document.getElementById('ammoCount');
        const radarIndicator = document.getElementById('radarIndicator');
        const enemyAlert = document.getElementById('enemyAlert');
        const winMessage = document.getElementById('winMessage');
        const jumpscare = document.getElementById('jumpscare');
        const bloodEffect = document.getElementById('bloodEffect');
        const fruitCountDisplay = document.getElementById('fruitCount');
        const cauldronCountDisplay = document.getElementById('cauldronCount');
        const batteryDisplay = document.getElementById('batteryLevel');
        const healthBar = document.getElementById('healthBar');

        // Initialize canvas
        canvas.width = 800;
        canvas.height = 600;

        // Colors
        const COLORS = {
            floor: '#222',
            ceiling: '#111',
            wallDark: 'rgba(0,0,0,0.8)',
            muzzleFlash: 'rgba(255, 200, 0, 0.3)',
            lightingGradient: 'radial-gradient(circle, rgba(255,255,200,0.2) 0%, rgba(0,0,0,1) 100%)',
            lampLight: 'rgba(255, 220, 150, 0.2)',
            blood: 'rgba(255, 0, 0, 0.3)'
        };

        // FRUIT COLORS
        const FRUIT_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

        // Particle class
        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = -Math.random() * 0.5 - 0.5;
                this.life = 1.0;
                this.color = `hsl(${120 + Math.random() * 60}, 100%, 50%)`;
            }

            update(deltaTime) {
                this.x += this.vx * (deltaTime/16);
                this.y += this.vy * (deltaTime/16);
                this.life -= 0.01 * (deltaTime/16);
            }
        }

        // Create stone texture
        function createStoneTexture() {
            const textureCanvas = document.createElement('canvas');
            textureCanvas.width = TILE_SIZE;
            textureCanvas.height = TILE_SIZE;
            const texCtx = textureCanvas.getContext('2d');
            
            texCtx.fillStyle = '#ffd700';  
            texCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            
            const numBlocks = 4;
            const blockSize = TILE_SIZE / numBlocks;
            
            for(let y = 0; y < numBlocks; y++) {
                for(let x = 0; x < numBlocks; x++) {
                    const brightness = Math.random() * 30 - 15;
                    texCtx.fillStyle = `rgb(${255 + brightness}, ${215 + brightness}, ${0 + brightness})`;
                    
                    const variation = Math.random() * 4 - 2;
                    texCtx.fillRect(
                        x * blockSize + variation, 
                        y * blockSize + variation, 
                        blockSize - variation * 2, 
                        blockSize - variation * 2
                    );
                    
                    texCtx.strokeStyle = '#cc9900';
                    texCtx.strokeRect(
                        x * blockSize + variation, 
                        y * blockSize + variation, 
                        blockSize - variation * 2, 
                        blockSize - variation * 2
                    );
                }
            }
            
            const imageData = texCtx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
            const data = imageData.data;
            for(let i = 0; i < data.length; i += 4) {
                const noise = Math.random() * 20 - 10;
                data[i] = Math.max(0, Math.min(255, (data[i] + noise) * 0.8));
                data[i+1] = Math.max(0, Math.min(255, (data[i+1] + noise) * 0.7));
                data[i+2] = Math.max(0, Math.min(255, (data[i+2] + noise) * 0.2));
            }
            texCtx.putImageData(imageData, 0, 0);
            
            return textureCanvas;
        }

        const wallTexture = createStoneTexture();

        // Light canvas for lighting effects
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = canvas.width;
        lightCanvas.height = canvas.height;
        const lightCtx = lightCanvas.getContext('2d');

        // Hand light canvas for flashlight effect
        const handLightCanvas = document.createElement('canvas');
        handLightCanvas.width = canvas.width;
        handLightCanvas.height = canvas.height;
        const handLightCtx = handLightCanvas.getContext('2d');

        // Generate dungeon with rooms and corridors
        function generateDungeon() {
            // Reset player stats
            gameState.player.ammo = 6;
            gameState.player.health = 100;
            gameState.player.x = TILE_SIZE * 1.5;
            gameState.player.y = TILE_SIZE * 1.5;
            gameState.player.angle = 0;
            ammoDisplay.textContent = gameState.player.ammo;
            healthBar.style.width = '100%';
            
            // Create empty map filled with walls
            const newMap = Array(MAP_SIZE).fill().map(() => Array(MAP_SIZE).fill(1));
            const rooms = [];
            const numRooms = 15;
            
            // Function to create a room
            function createRoom(x, y, width, height) {
                for(let i = y; i < y + height; i++) {
                    for(let j = x; j < x + width; j++) {
                        if(i > 0 && i < MAP_SIZE-1 && j > 0 && j < MAP_SIZE-1) {
                            newMap[i][j] = 0;
                        }
                    }
                }
                return {x, y, width, height};
            }
            
            // Generate rooms
            for(let i = 0; i < numRooms; i++) {
                const roomWidth = 4 + Math.floor(Math.random() * 5);
                const roomHeight = 4 + Math.floor(Math.random() * 5);
                const x = 1 + Math.floor(Math.random() * (MAP_SIZE - roomWidth - 2));
                const y = 1 + Math.floor(Math.random() * (MAP_SIZE - roomHeight - 2));
                
                let overlaps = false;
                const newRoom = {x, y, width: roomWidth, height: roomHeight};
                
                for(const room of rooms) {
                    if(newRoom.x < room.x + room.width + 1 &&
                       newRoom.x + newRoom.width + 1 > room.x &&
                       newRoom.y < room.y + room.height + 1 &&
                       newRoom.y + newRoom.height + 1 > room.y) {
                        overlaps = true;
                        break;
                    }
                }
                
                if(!overlaps) {
                    rooms.push(newRoom);
                    createRoom(x, y, roomWidth, roomHeight);
                    
                    // Add some obstacles in the room
                    const numObstacles = Math.floor(Math.random() * 4); 
                    for(let o = 0; o < numObstacles; o++) {
                        const obstacleX = x + 1 + Math.floor(Math.random() * (roomWidth - 2));
                        const obstacleY = y + 1 + Math.floor(Math.random() * (roomHeight - 2));
                        if(newMap[obstacleY][obstacleX] === 0) {
                            newMap[obstacleY][obstacleX] = 1;
                        }
                    }
                }
            }
            
            // Connect rooms with corridors
            for(let i = 0; i < rooms.length - 1; i++) {
                const room1 = rooms[i];
                const room2 = rooms[i + 1];
                
                const x1 = room1.x + Math.floor(room1.width/2);
                const y1 = room1.y + Math.floor(room1.height/2);
                const x2 = room2.x + Math.floor(room2.width/2);
                const y2 = room2.y + Math.floor(room2.height/2);
                
                for(let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                    newMap[y1][x] = 0;
                }
                
                for(let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                    newMap[y][x2] = 0;
                }
            }
            
            // Place player in first room
            gameState.player.x = (rooms[0].x + Math.floor(rooms[0].width/2)) * TILE_SIZE;
            gameState.player.y = (rooms[0].y + Math.floor(rooms[0].height/2)) * TILE_SIZE;
            
            // Reset discovered tiles
            gameState.discoveredTiles.forEach(row => row.fill(false));
            
            // Mark starting room as discovered
            for(let y = rooms[0].y; y < rooms[0].y + rooms[0].height; y++) {
                for(let x = rooms[0].x; x < rooms[0].x + rooms[0].width; x++) {
                    gameState.discoveredTiles[y][x] = true;
                }
            }
            
            // Place enemy in a random room (not the first one)
            if (rooms.length > 1) {
                const enemyRoom = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
                gameState.enemy.x = (enemyRoom.x + Math.floor(enemyRoom.width/2)) * TILE_SIZE;
                gameState.enemy.y = (enemyRoom.y + Math.floor(enemyRoom.height/2)) * TILE_SIZE;
                gameState.enemy.active = true;
                gameState.enemy.detected = false;
                gameState.enemy.hasJumpscared = false;
            }
            
            // Generate fruits
            gameState.fruits = [];
            const usedPositions = new Set();
            let fruitsPlaced = 0;

            while (fruitsPlaced < FRUIT_COUNT) {
                const x = Math.floor(Math.random() * MAP_SIZE);
                const y = Math.floor(Math.random() * MAP_SIZE);
                const posKey = `${x},${y}`;

                if (newMap[y][x] === 0 && !usedPositions.has(posKey)) {
                    gameState.fruits.push({
                        x: (x + 0.5) * TILE_SIZE,
                        y: (y + 0.5) * TILE_SIZE,
                        color: FRUIT_COLORS[fruitsPlaced % FRUIT_COLORS.length],
                        collected: false,
                        deposited: false
                    });
                    usedPositions.add(posKey);
                    fruitsPlaced++;
                }
            }
            
            // Generate ammo boxes
            gameState.ammoBoxes = [];
            usedPositions.clear();
            let ammoPlaced = 0;

            while (ammoPlaced < AMMO_BOX_COUNT) {
                const x = Math.floor(Math.random() * MAP_SIZE);
                const y = Math.floor(Math.random() * MAP_SIZE);
                const posKey = `${x},${y}`;

                if (newMap[y][x] === 0 && !usedPositions.has(posKey)) {
                    gameState.ammoBoxes.push({
                        x: (x + 0.5) * TILE_SIZE,
                        y: (y + 0.5) * TILE_SIZE,
                        collected: false,
                        ammo: 3 + Math.floor(Math.random() * 3)
                    });
                    usedPositions.add(posKey);
                    ammoPlaced++;
                }
            }

            // Reset counters
            fruitCountDisplay.textContent = '0';
            cauldronCountDisplay.textContent = '0';
            gameState.fruitsInCauldron = 0;
            
            // Place cauldron near the player
            gameState.cauldron.x = gameState.player.x + TILE_SIZE;
            gameState.cauldron.y = gameState.player.y + TILE_SIZE;
            gameState.cauldron.particles = [];
            
            return newMap;
        }

        // Initialize game map
        gameState.map = generateDungeon();

        // Normalize angle to be between -PI and PI
        function normalizeAngle(angle) {
            while (angle < -Math.PI) angle += Math.PI * 2;
            while (angle > Math.PI) angle -= Math.PI * 2;
            return angle;
        }

        // Raycasting function
        function castRay(angle) {
            let rayX = gameState.player.x;
            let rayY = gameState.player.y;
            let distance = 0;
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);
            
            const rayStepSize = 1;

            while (distance < MAX_DEPTH) {
                distance += rayStepSize;
                rayX = gameState.player.x + distance * cos;
                rayY = gameState.player.y + distance * sin;

                const mapX = Math.floor(rayX / TILE_SIZE);
                const mapY = Math.floor(rayY / TILE_SIZE);

                if (mapY >= 0 && mapY < gameState.map.length && mapX >= 0 && mapX < gameState.map[0].length) {
                    if (gameState.map[mapY][mapX] === 1 && (gameState.discoveredTiles[mapY][mapX] || true)) {
                        const correctedDistance = distance * Math.cos(angle - gameState.player.angle);
                        return {
                            distance: correctedDistance,
                            vertical: Math.abs(rayX % TILE_SIZE) < rayStepSize,
                            discovered: gameState.discoveredTiles[mapY][mapX]
                        };
                    }
                }
            }
            return { distance: MAX_DEPTH, vertical: false };
        }

        // Draw minimap
        function drawMinimap() {
            const scale = minimapCanvas.width / (MAP_SIZE * TILE_SIZE);
            
            minimapCtx.fillStyle = '#000';
            minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
            
            for(let y = 0; y < gameState.map.length; y++) {
                for(let x = 0; x < gameState.map[y].length; x++) {
                    if(gameState.discoveredTiles[y][x]) {
                        if(gameState.map[y][x] === 1) {
                            minimapCtx.fillStyle = 'rgba(255,255,255,0.4)';
                        } else {
                            minimapCtx.fillStyle = 'rgba(51,51,51,0.4)';
                        }
                        minimapCtx.fillRect(
                            x * TILE_SIZE * scale,
                            y * TILE_SIZE * scale,
                            TILE_SIZE * scale,
                            TILE_SIZE * scale
                        );
                    }
                }
            }
            
            // Draw player
            minimapCtx.fillStyle = 'rgba(255,200,100,0.6)';
            minimapCtx.beginPath();
            minimapCtx.arc(
                gameState.player.x * scale,
                gameState.player.y * scale,
                3,
                0,
                Math.PI * 2
            );
            minimapCtx.fill();
            
            // Draw player direction
            minimapCtx.strokeStyle = 'rgba(255,200,100,0.4)';
            minimapCtx.beginPath();
            minimapCtx.moveTo(gameState.player.x * scale, gameState.player.y * scale);
            minimapCtx.lineTo(
                (gameState.player.x + Math.cos(gameState.player.angle) * 20) * scale,
                (gameState.player.y + Math.sin(gameState.player.angle) * 20) * scale
            );
            minimapCtx.stroke();
            
            // Draw enemy if detected or visible
            if (gameState.enemy.active && (gameState.enemy.detected || 
                gameState.discoveredTiles[Math.floor(gameState.enemy.y/TILE_SIZE)][Math.floor(gameState.enemy.x/TILE_SIZE)])) {
                minimapCtx.fillStyle = 'rgba(255,0,0,0.8)';
                minimapCtx.beginPath();
                minimapCtx.arc(
                    gameState.enemy.x * scale,
                    gameState.enemy.y * scale,
                    3,
                    0,
                    Math.PI * 2
                );
                minimapCtx.fill();
            }
            
            // Draw cauldron
            minimapCtx.fillStyle = '#333';
            minimapCtx.fillRect(
                gameState.cauldron.x * scale - 2,
                gameState.cauldron.y * scale - 2,
                4,
                4
            );
            
            // Draw fruits
            gameState.fruits.forEach(fruit => {
                if (!fruit.collected && gameState.discoveredTiles[Math.floor(fruit.y/TILE_SIZE)][Math.floor(fruit.x/TILE_SIZE)]) {
                    minimapCtx.fillStyle = fruit.color;
                    minimapCtx.beginPath();
                    minimapCtx.arc(
                        fruit.x * scale,
                        fruit.y * scale,
                        2,
                        0,
                        Math.PI * 2
                    );
                    minimapCtx.fill();
                }
            });
            
            // Draw ammo boxes
            gameState.ammoBoxes.forEach(ammoBox => {
                if (!ammoBox.collected && gameState.discoveredTiles[Math.floor(ammoBox.y/TILE_SIZE)][Math.floor(ammoBox.x/TILE_SIZE)]) {
                    minimapCtx.fillStyle = '#ffff00';
                    minimapCtx.beginPath();
                    minimapCtx.arc(
                        ammoBox.x * scale,
                        ammoBox.y * scale,
                        2,
                        0,
                        Math.PI * 2
                    );
                    minimapCtx.fill();
                }
            });
        }

        // Render 3D view
        function render() {
            // Clear canvas
            ctx.fillStyle = COLORS.ceiling;
            ctx.fillRect(0, 0, canvas.width, canvas.height/2);
            ctx.fillStyle = COLORS.floor;
            ctx.fillRect(0, canvas.height/2, canvas.width, canvas.height/2);

            // Raycasting
            const NUM_RAYS = canvas.width;
            const STEP_SIZE = FOV / NUM_RAYS;
            
            for (let i = 0; i < NUM_RAYS; i++) {
                const rayAngle = gameState.player.angle - HALF_FOV + STEP_SIZE * i;
                const { distance, vertical, discovered } = castRay(rayAngle);
                const wallHeight = (TILE_SIZE * canvas.height) / distance;
                
                if (discovered || true) {
                    const brightness = vertical ? 0.7 : 1;  
                    ctx.globalAlpha = brightness;
                    ctx.drawImage(
                        wallTexture,
                        vertical ? TILE_SIZE - 1 : 0,  
                        0,
                        1,
                        TILE_SIZE,
                        i,
                        (canvas.height - wallHeight) / 2,
                        1,
                        wallHeight
                    );
                    ctx.globalAlpha = 1;
                }
            }

            // Muzzle flash effect
            if (gameState.muzzleFlash) {
                ctx.fillStyle = COLORS.muzzleFlash;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // Enemy hit effect
            if (gameState.enemy.active && gameState.enemy.wasShot) {
                const angleToEnemy = Math.atan2(gameState.enemy.y - gameState.player.y, gameState.enemy.x - gameState.player.x);
                const distanceToEnemy = Math.sqrt(
                    Math.pow(gameState.enemy.x - gameState.player.x, 2) + 
                    Math.pow(gameState.enemy.y - gameState.player.y, 2)
                );
                const enemyScreenX = Math.tan(angleToEnemy - gameState.player.angle) * canvas.width / 2 + canvas.width / 2;
                const enemyHeight = (TILE_SIZE * 2 * canvas.height) / distanceToEnemy;
                
                if (enemyScreenX > 0 && enemyScreenX < canvas.width) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                    ctx.fillRect(
                        enemyScreenX - 20, 
                        (canvas.height - enemyHeight) / 2,
                        40,
                        enemyHeight
                    );
                }

                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // Render fruits
            gameState.fruits.forEach(fruit => {
                if (!fruit.collected) {
                    const distanceToFruit = Math.sqrt(
                        Math.pow(fruit.x - gameState.player.x, 2) + 
                        Math.pow(fruit.y - gameState.player.y, 2)
                    );
                    
                    if (distanceToFruit < TILE_SIZE * 3) {
                        const angleToFruit = Math.atan2(fruit.y - gameState.player.y, fruit.x - gameState.player.x);
                        const fruitScreenX = Math.tan(angleToFruit - gameState.player.angle) * canvas.width / 2 + canvas.width / 2;
                        const fruitHeight = (TILE_SIZE/2 * canvas.height) / distanceToFruit;
                        
                        if (fruitScreenX > 0 && fruitScreenX < canvas.width) {
                            ctx.fillStyle = fruit.color;
                            ctx.beginPath();
                            ctx.arc(
                                fruitScreenX,
                                (canvas.height - fruitHeight) / 2,
                                fruitHeight/2,
                                0,
                                Math.PI * 2
                            );
                            ctx.fill();
                        }
                    }
                }
            });
            
            // Render ammo boxes
            gameState.ammoBoxes.forEach(ammoBox => {
                if (!ammoBox.collected) {
                    const distanceToAmmo = Math.sqrt(
                        Math.pow(ammoBox.x - gameState.player.x, 2) + 
                        Math.pow(ammoBox.y - gameState.player.y, 2)
                    );
                    
                    if (distanceToAmmo < TILE_SIZE * 3) {
                        const angleToAmmo = Math.atan2(ammoBox.y - gameState.player.y, ammoBox.x - gameState.player.x);
                        const ammoScreenX = Math.tan(angleToAmmo - gameState.player.angle) * canvas.width / 2 + canvas.width / 2;
                        const ammoHeight = (TILE_SIZE/2 * canvas.height) / distanceToAmmo;
                        
                        if (ammoScreenX > 0 && ammoScreenX < canvas.width) {
                            ctx.fillStyle = '#ffff00';
                            ctx.fillRect(
                                ammoScreenX - ammoHeight/2,
                                (canvas.height - ammoHeight) / 2,
                                ammoHeight,
                                ammoHeight/2
                            );
                            
                            ctx.fillStyle = '#000';
                            ctx.font = `${Math.max(10, ammoHeight/3)}px Arial`;
                            ctx.textAlign = 'center';
                            ctx.fillText(
                                'AMMO',
                                ammoScreenX,
                                (canvas.height - ammoHeight) / 2 + ammoHeight/2
                            );
                        }
                    }
                }
            });
            
            // Render cauldron
            const angleToCauldron = Math.atan2(gameState.cauldron.y - gameState.player.y, gameState.cauldron.x - gameState.player.x);
            const distanceToCauldron = Math.sqrt(
                Math.pow(gameState.cauldron.x - gameState.player.x, 2) + 
                Math.pow(gameState.cauldron.y - gameState.player.y, 2)
            );
            const cauldronScreenX = Math.tan(angleToCauldron - gameState.player.angle) * canvas.width / 2 + canvas.width / 2;
            const cauldronHeight = (gameState.cauldron.size * canvas.height) / distanceToCauldron;

            if (cauldronScreenX > 0 && cauldronScreenX < canvas.width) {
                ctx.fillStyle = '#333';
                ctx.fillRect(
                    cauldronScreenX - cauldronHeight/2,
                    canvas.height/2,
                    cauldronHeight,
                    cauldronHeight
                );

                // Render cauldron particles
                gameState.cauldron.particles.forEach(particle => {
                    const particleAngle = Math.atan2(particle.y - gameState.player.y, particle.x - gameState.player.x);
                    const particleDistance = Math.sqrt(
                        Math.pow(particle.x - gameState.player.x, 2) + 
                        Math.pow(particle.y - gameState.player.y, 2)
                    );
                    const particleScreenX = Math.tan(particleAngle - gameState.player.angle) * canvas.width / 2 + canvas.width / 2;
                    const particleSize = (TILE_SIZE/8 * canvas.height) / particleDistance;

                    if (particleScreenX > 0 && particleScreenX < canvas.width) {
                        ctx.globalAlpha = particle.life;
                        ctx.fillStyle = particle.color;
                        ctx.beginPath();
                        ctx.arc(
                            particleScreenX,
                            (canvas.height - particleSize) / 2,
                            particleSize/2,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                });
            }
            
            // Lighting effects
            lightCtx.clearRect(0, 0, canvas.width, canvas.height);
            const ambientBrightness = gameState.flashlight.active ? 0.2 : 0.1;
            const gradient = lightCtx.createRadialGradient(
                canvas.width/2, canvas.height/2, 0,
                canvas.width/2, canvas.height/2, canvas.width/2
            );
            gradient.addColorStop(0, `rgba(255,255,200,${ambientBrightness})`);
            gradient.addColorStop(0.2, `rgba(255,255,200,${ambientBrightness/4})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0.98)');
            lightCtx.fillStyle = gradient;
            lightCtx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(lightCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
            
            // Flashlight effect
            if (gameState.flashlight.active && gameState.flashlight.battery > 0) {
                handLightCtx.clearRect(0, 0, canvas.width, canvas.height);
                
                const time = performance.now() / 1000;
                const offsetX = Math.sin(time * 2) * 10;
                const offsetY = Math.cos(time * 3) * 5;
                
                const lampBrightness = (gameState.flashlight.battery / 100) * 0.3; 
                const lampGradient = handLightCtx.createRadialGradient(
                    canvas.width/2 + offsetX, canvas.height/2 + offsetY, 0,
                    canvas.width/2 + offsetX, canvas.height/2 + offsetY, canvas.width/3
                );
                lampGradient.addColorStop(0, `rgba(255, 220, 150, ${lampBrightness})`);
                lampGradient.addColorStop(0.5, `rgba(255, 220, 150, ${lampBrightness/3})`);
                lampGradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                handLightCtx.fillStyle = lampGradient;
                handLightCtx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.globalCompositeOperation = 'lighter';
                ctx.drawImage(handLightCanvas, 0, 0);
                ctx.globalCompositeOperation = 'source-over';
            }
            
            // Draw minimap
            drawMinimap();
            
            // Enemy alert
            enemyAlert.style.display = gameState.enemy.detected ? 'block' : 'none';
            
            // Blood effect when health is low
            if (gameState.player.health < 30) {
                bloodEffect.style.opacity = (30 - gameState.player.health) / 30 * 0.7;
            } else {
                bloodEffect.style.opacity = 0;
            }
        }

        // Shoot function
        function shoot() {
            if (gameState.player.ammo > 0 && gameState.player.canShoot) {
                const gunSound = document.getElementById('gunSound');
                gunSound.currentTime = 0;
                gunSound.play().catch(e => console.log("Audio play prevented:", e));
                gameState.player.ammo--;
                ammoDisplay.textContent = gameState.player.ammo;
                gameState.muzzleFlash = true;
                gameState.player.canShoot = false;
                gameState.lastShootTime = performance.now();
                
                // Check if enemy was hit
                const angleToEnemy = Math.atan2(gameState.enemy.y - gameState.player.y, gameState.enemy.x - gameState.player.x);
                const angleDiff = Math.abs(normalizeAngle(angleToEnemy - gameState.player.angle));
                const distanceToEnemy = Math.sqrt(
                    Math.pow(gameState.enemy.x - gameState.player.x, 2) + 
                    Math.pow(gameState.enemy.y - gameState.player.y, 2)
                );
                
                if (angleDiff < FOV/2 && distanceToEnemy < TILE_SIZE * 8) {
                    gameState.enemy.wasShot = true;
                    gameState.enemy.isStunned = true;
                    
                    clearTimeout(gameState.enemy.stunTimeout);
                    
                    setTimeout(() => {
                        gameState.enemy.wasShot = false;
                    }, gameState.enemy.shotFlashDuration);
                    
                    gameState.enemy.stunTimeout = setTimeout(() => {
                        gameState.enemy.isStunned = false;
                    }, gameState.enemy.stunDuration);
                }
                
                setTimeout(() => {
                    gameState.muzzleFlash = false;
                    setTimeout(() => {
                        gameState.player.canShoot = true;
                    }, 500);
                }, gameState.muzzleFlashDuration);
            } else {
                const emptyGunSound = document.getElementById('emptyGunSound');
                emptyGunSound.currentTime = 0;
                emptyGunSound.play().catch(e => console.log("Audio play prevented:", e));
            }
        }

        // Reload gun
        function reloadGun() {
            if (gameState.player.ammo < gameState.player.maxAmmo) {
                const reloadSound = document.getElementById('reloadSound');
                reloadSound.currentTime = 0;
                reloadSound.play().catch(e => console.log("Audio play prevented:", e));
                gameState.player.ammo = gameState.player.maxAmmo;
                ammoDisplay.textContent = gameState.player.ammo;
            }
        }

        // Regenerate level
        function regenerateLevel() {
            // Stop all sounds
            const footstepSound = document.getElementById('footstepSound');
            const chaseMusic = document.getElementById('chaseMusic');
            const backgroundMusic = document.getElementById('backgroundMusic');
            const heartbeatSound = document.getElementById('heartbeatSound');

            footstepSound.pause();
            chaseMusic.pause();
            backgroundMusic.pause();
            heartbeatSound.pause();

            footstepSound.currentTime = 0;
            chaseMusic.currentTime = 0;
            backgroundMusic.currentTime = 0;
            heartbeatSound.currentTime = 0;

            gameState.sounds.footstepsPlaying = false;
            gameState.sounds.heartbeatPlaying = false;
            
            // Reset game state
            gameState.gameOver = false;
            
            // Generate new level
            gameState.map = generateDungeon();
            winMessage.style.display = 'none';
            jumpscare.style.display = 'none';
            
            // Play background music
            setTimeout(() => {
                backgroundMusic.volume = 0.2;
                backgroundMusic.play().catch(e => console.log("Audio play prevented:", e));
            }, 100);
        }

        // Take damage
        function takeDamage(amount) {
            gameState.player.health = Math.max(0, gameState.player.health - amount);
            healthBar.style.width = `${gameState.player.health}%`;
            
            const damageSound = document.getElementById('damageSound');
            damageSound.currentTime = 0;
            damageSound.play().catch(e => console.log("Audio play prevented:", e));
            
            // Blood effect
            bloodEffect.style.opacity = 0.7;
            setTimeout(() => {
                bloodEffect.style.opacity = gameState.player.health < 30 ? (30 - gameState.player.health) / 30 * 0.7 : 0;
            }, 300);
            
            // Check if player died
            if (gameState.player.health <= 0) {
                gameState.gameOver = true;
                const screamSound = document.getElementById('screamSound');
                jumpscare.style.display = 'block';
                screamSound.play().catch(e => console.log("Audio play prevented:", e));
                
                setTimeout(() => {
                    regenerateLevel();
                }, 2000);
            }
        }

        // Input handling
        const keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };

        document.addEventListener('keydown', (e) => {
            if (gameState.gameOver) return;
            
            if (e.key in keys) {
                keys[e.key] = true;
                e.preventDefault();
            }
            
            // Regenerate level
            if (e.key === 'e' || e.key === 'E') {
                regenerateLevel();
            }
            
            if (e.code === 'Space') {
                shoot();
                e.preventDefault();  // Esta línea es la que faltaba
            }
            
            // Deposit fruits in cauldron
            if (e.key === 'z' || e.key === 'Z') {
                const distanceToCauldron = Math.sqrt(
                    Math.pow(gameState.player.x - gameState.cauldron.x, 2) + 
                    Math.pow(gameState.player.y - gameState.cauldron.y, 2)
                );
                
                if (distanceToCauldron < TILE_SIZE) {
                    const collectedFruits = gameState.fruits.filter(f => f.collected && !f.deposited).length;
                    
                    if (collectedFruits > 0) {
                        gameState.fruits.forEach(fruit => {
                            if (fruit.collected && !fruit.deposited) {
                                fruit.deposited = true;
                                gameState.fruitsInCauldron++;
                                
                                // Add particles
                                for (let i = 0; i < 10; i++) {
                                    gameState.cauldron.particles.push(new Particle(
                                        gameState.cauldron.x + (Math.random() - 0.5) * gameState.cauldron.size/2,
                                        gameState.cauldron.y - gameState.cauldron.size/4
                                    ));
                                }
                            }
                        });
                        
                        cauldronCountDisplay.textContent = gameState.fruitsInCauldron;
                        
                        const collectSound = document.getElementById('collectSound');
                        collectSound.currentTime = 0;
                        collectSound.play().catch(e => console.log("Audio play prevented:", e));
                        
                        if (gameState.fruitsInCauldron >= FRUIT_COUNT) {
                            winMessage.style.display = 'block';
                            gameState.enemy.active = false;
                            const footstepSound = document.getElementById('footstepSound');
                            const chaseMusic = document.getElementById('chaseMusic');
                            footstepSound.pause();
                            chaseMusic.pause();
                        }
                    }
                }
            }
            
            // Toggle flashlight
            if (e.key === 'x' || e.key === 'X') {
                if (!gameState.flashlight.active && gameState.flashlight.battery >= gameState.flashlight.minBatteryToActivate) {
                    gameState.flashlight.active = true;
                } else {
                    gameState.flashlight.active = false;
                }
            }
            
            // Reload gun
            if (e.key === 'r' || e.key === 'R') {
                reloadGun();
            }
            
            // Pick up ammo
            if (e.key === 'f' || e.key === 'F') {
                gameState.ammoBoxes.forEach(ammoBox => {
                    if (!ammoBox.collected) {
                        const distanceToAmmo = Math.sqrt(
                            Math.pow(gameState.player.x - ammoBox.x, 2) + 
                            Math.pow(gameState.player.y - ammoBox.y, 2)
                        );
                        
                        if (distanceToAmmo < TILE_SIZE) {
                            ammoBox.collected = true;
                            gameState.player.ammo = Math.min(gameState.player.maxAmmo, gameState.player.ammo + ammoBox.ammo);
                            ammoDisplay.textContent = gameState.player.ammo;
                            
                            const collectSound = document.getElementById('collectSound');
                            collectSound.currentTime = 0;
                            collectSound.play().catch(e => console.log("Audio play prevented:", e));
                        }
                    }
                });
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key in keys) {
                keys[e.key] = false;
                e.preventDefault();
            }
        });

        // Mouse controls
        document.addEventListener('click', () => {
            if (!gameState.gameOver) shoot();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!gameState.gameOver) {
                // Simple mouse look (left/right)
                const sensitivity = 0.002;
                gameState.player.angle += e.movementX * sensitivity;
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === canvas) {
                // Pointer locked, enable mouse look
            } else {
                // Pointer unlocked
            }
        });
        
        canvas.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                canvas.requestPointerLock();
            }
        });

        // Game loop
        let lastTime = performance.now();
        const targetFPS = 60;
        const frameTime = 1000 / targetFPS;

        function update(deltaTime) {
            if (gameState.gameOver) return;
            
            // Footstep sounds
            const footstepSound = document.getElementById('footstepSound');
            const isMoving = keys.ArrowUp || keys.ArrowDown;
            
            if (isMoving && !gameState.sounds.footstepsPlaying) {
                footstepSound.volume = 0.3;
                footstepSound.play().catch(e => console.log("Audio play prevented:", e));
                gameState.sounds.footstepsPlaying = true;
            } else if (!isMoving && gameState.sounds.footstepsPlaying) {
                footstepSound.pause();
                footstepSound.currentTime = 0;
                gameState.sounds.footstepsPlaying = false;
            }
            
            // Heartbeat sound when health is low
            const heartbeatSound = document.getElementById('heartbeatSound');
            if (gameState.player.health < 30 && !gameState.sounds.heartbeatPlaying) {
                heartbeatSound.volume = 0.5 * (1 - gameState.player.health / 30);
                heartbeatSound.play().catch(e => console.log("Audio play prevented:", e));
                gameState.sounds.heartbeatPlaying = true;
            } else if (gameState.player.health >= 30 && gameState.sounds.heartbeatPlaying) {
                heartbeatSound.pause();
                heartbeatSound.currentTime = 0;
                gameState.sounds.heartbeatPlaying = false;
            }

            // Player movement
            const moveSpeedDelta = gameState.player.moveSpeed * (deltaTime / frameTime);
            const turnSpeedDelta = gameState.player.turnSpeed * (deltaTime / frameTime);

            if (keys.ArrowUp) gameState.player.speed = moveSpeedDelta;
            else if (keys.ArrowDown) gameState.player.speed = -moveSpeedDelta;
            else gameState.player.speed = 0;

            if (keys.ArrowLeft) gameState.player.rotationSpeed = -turnSpeedDelta;
            else if (keys.ArrowRight) gameState.player.rotationSpeed = turnSpeedDelta;
            else gameState.player.rotationSpeed = 0;

            const newX = gameState.player.x + Math.cos(gameState.player.angle) * gameState.player.speed;
            const newY = gameState.player.y + Math.sin(gameState.player.angle) * gameState.player.speed;
            
            const cellX = Math.floor(newX / TILE_SIZE);
            const cellY = Math.floor(newY / TILE_SIZE);
            
            if (cellY >= 0 && cellY < gameState.map.length && cellX >= 0 && cellX < gameState.map[0].length) {
                const canMoveX = gameState.map[Math.floor(gameState.player.y / TILE_SIZE)][cellX] === 0;
                const canMoveY = gameState.map[cellY][Math.floor(gameState.player.x / TILE_SIZE)] === 0;

                if (canMoveX) gameState.player.x = newX;
                if (canMoveY) gameState.player.y = newY;
            }
            
            gameState.player.angle += gameState.player.rotationSpeed;
            
            // Update discovered tiles
            const playerTileX = Math.floor(gameState.player.x / TILE_SIZE);
            const playerTileY = Math.floor(gameState.player.y / TILE_SIZE);

            for(let y = playerTileY - 1; y <= playerTileY + 1; y++) {
                for(let x = playerTileX - 1; x <= playerTileX + 1; x++) {
                    if(y >= 0 && y < MAP_SIZE && x >= 0 && x < MAP_SIZE) {
                        gameState.discoveredTiles[y][x] = true;
                    }
                }
            }
            
            // Enemy behavior
            if (gameState.enemy.active) {
                const distanceToPlayer = Math.sqrt(
                    Math.pow(gameState.player.x - gameState.enemy.x, 2) + 
                    Math.pow(gameState.player.y - gameState.enemy.y, 2)
                );

                // Enemy detection
                if (distanceToPlayer < TILE_SIZE * 5) {
                    if (!gameState.enemy.detected) {
                        const enemyDetectedSound = document.getElementById('enemyDetectedSound');
                        const chaseMusic = document.getElementById('chaseMusic');
                        
                        enemyDetectedSound.currentTime = 0;
                        enemyDetectedSound.play().catch(e => console.log("Audio play prevented:", e));
                        
                        chaseMusic.volume = 0.3; 
                        chaseMusic.play().catch(e => console.log("Audio play prevented:", e));
                    }
                    gameState.enemy.detected = true;
                }

                // Enemy movement
                if (gameState.enemy.detected && !gameState.enemy.isStunned) { 
                    const angle = Math.atan2(gameState.player.y - gameState.enemy.y, gameState.player.x - gameState.enemy.x);
                    const currentSpeed = gameState.enemy.detected ? gameState.enemy.chaseSpeed : gameState.enemy.speed;
                    gameState.enemy.x += Math.cos(angle) * currentSpeed;
                    gameState.enemy.y += Math.sin(angle) * currentSpeed;

                    // Enemy attack
                    if (distanceToPlayer < TILE_SIZE/2 && 
                        performance.now() - gameState.enemy.lastAttack > gameState.enemy.attackCooldown) {
                        takeDamage(gameState.enemy.damage);
                        gameState.enemy.lastAttack = performance.now();
                        
                        // Jumpscare if health reaches 0
                        if (gameState.player.health <= 0 && !gameState.enemy.hasJumpscared) {
                            gameState.enemy.hasJumpscared = true;
                            jumpscare.style.display = 'block';
                            const screamSound = document.getElementById('screamSound');
                            screamSound.play().catch(e => console.log("Audio play prevented:", e));
                            
                            setTimeout(() => {
                                regenerateLevel();
                            }, 2000);
                        }
                    }
                }
                
                // Update radar
                const maxRange = TILE_SIZE * 10;
                const proximityPercentage = Math.max(0, Math.min(100, (1 - distanceToPlayer / maxRange) * 100));
                radarIndicator.style.width = `${proximityPercentage}%`;
            }
            
            // Collect fruits
            gameState.fruits.forEach(fruit => {
                if (!fruit.collected) {
                    const distanceToFruit = Math.sqrt(
                        Math.pow(gameState.player.x - fruit.x, 2) + 
                        Math.pow(gameState.player.y - fruit.y, 2)
                    );
                    
                    if (distanceToFruit < TILE_SIZE/2) {
                        fruit.collected = true;
                        const collectSound = document.getElementById('collectSound');
                        collectSound.currentTime = 0;
                        collectSound.play().catch(e => console.log("Audio play prevented:", e));
                        
                        const fruitCount = gameState.fruits.filter(f => f.collected).length;
                        fruitCountDisplay.textContent = fruitCount.toString();
                    }
                }
            });
            
            // Update cauldron particles
            gameState.cauldron.particles.forEach((particle, index) => {
                particle.update(deltaTime);
                if (particle.life <= 0) {
                    gameState.cauldron.particles.splice(index, 1);
                }
            });
            
            // Add random particles to cauldron
            if (Math.random() < 0.2 && gameState.fruitsInCauldron > 0) {
                gameState.cauldron.particles.push(new Particle(
                    gameState.cauldron.x + (Math.random() - 0.5) * gameState.cauldron.size/2,
                    gameState.cauldron.y - gameState.cauldron.size/4
                ));
            }
            
            // Flashlight battery management
            if (gameState.flashlight.active && gameState.flashlight.battery > 0) {
                gameState.flashlight.battery = Math.max(0, gameState.flashlight.battery - gameState.flashlight.drainRate * (deltaTime/16));
                if (gameState.flashlight.battery === 0) {
                    gameState.flashlight.active = false;
                }
            } else if (!gameState.flashlight.active && gameState.flashlight.battery < 100) {
                gameState.flashlight.battery = Math.min(100, gameState.flashlight.battery + gameState.flashlight.rechargeRate * (deltaTime/16));
            }

            batteryDisplay.textContent = Math.round(gameState.flashlight.battery);
        }

     // Crear pantalla de inicio
const startScreen = document.createElement('div');
startScreen.style.position = 'absolute';
startScreen.style.top = 0;
startScreen.style.left = 0;
startScreen.style.width = '100%';
startScreen.style.height = '100%';
startScreen.style.background = 'black';
startScreen.style.color = 'white';
startScreen.style.display = 'flex';
startScreen.style.justifyContent = 'center';
startScreen.style.alignItems = 'center';
startScreen.style.fontSize = '2rem';
startScreen.style.cursor = 'pointer';
startScreen.style.zIndex = '1000';
startScreen.innerText = 'Presiona cualquier tecla para comenzar';

// Changed to append to game container instead of body
const gameContainer = document.querySelector('.seccion-del_juego');
gameContainer.appendChild(startScreen);

// Block ALL game inputs while start screen is visible
let gameStarted = false;

// Block all mouse and keyboard events on the game
function blockGameInputs(event) {
    if (!gameStarted) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
}

// Block mouse events on the entire game container
gameContainer.addEventListener('click', blockGameInputs, true);
gameContainer.addEventListener('mousedown', blockGameInputs, true);
gameContainer.addEventListener('mouseup', blockGameInputs, true);
gameContainer.addEventListener('contextmenu', blockGameInputs, true);

// Esperar interacción - ANY KEY starts the game
function iniciarJuego() {
    // Set flag that game has started
    gameStarted = true;
    
    // Quitar pantalla de inicio
    gameContainer.removeChild(startScreen);
    
    // Reproducir música y comenzar loop
    const backgroundMusic = document.getElementById('backgroundMusic');
    backgroundMusic.volume = 0.2;
    backgroundMusic.play().catch(e => console.log("Audio play prevented:", e));
    gameLoop(performance.now());
}

// Listen for ANY keydown to start the game
document.addEventListener('keydown', function(event) {
    if (!gameStarted) {
        event.preventDefault();
        iniciarJuego();
    } else {
        // Only block inputs after game has not started
        blockGameInputs(event);
    }
}, true);

// Tu gameLoop aquí
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    update(deltaTime);
    render();

    if (gameState.enemy.hasJumpscared) {
        const backgroundMusic = document.getElementById('backgroundMusic');
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }

    requestAnimationFrame(gameLoop);
}