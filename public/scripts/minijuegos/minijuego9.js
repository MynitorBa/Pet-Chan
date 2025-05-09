// Variables del juego
let chickens = [];
let feedTimeout = null;

// Sistema de gestión de sonidos mejorado
const SoundManager = {
    sounds: {},
    activeEatSounds: 0,
    soundQueue: [],
    backgroundMusic: null,
    MAX_EAT_SOUNDS: 1, // Solo permitir 1 sonido de comer a la vez
    lastEatTime: 0,
    lastRoarTime: 0,     // Para controlar sonidos de dinosaurios
    roarInterval: 7000,  // Intervalo de 7 segundos entre rugidos
    
    init: function() {
        // Crear y configurar música de fondo
        this.backgroundMusic = new Audio('archivos_de_minijuegos/sounds/granja.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.3;
        
        // Crear objetos de audio para cada tipo de sonido
        this.loadSound('cluck', 'archivos_de_minijuegos/sounds/cluck.mp3', 0.7);
        this.loadSound('eat', 'archivos_de_minijuegos/sounds/eat.mp3', 0.8);
        this.loadSound('feed', 'archivos_de_minijuegos/sounds/feed.mp3', 0.8);
        this.loadSound('transform', 'archivos_de_minijuegos/sounds/transform.mp3', 1.0);
        this.loadSound('roar', 'archivos_de_minijuegos/sounds/roar.mp3', 0.4);  // Volumen reducido para rugidos
        
        // Intentar reproducir música de fondo
        this.tryPlayMusic();
        
        // Exponer función global
        window.reproducirLoopGranja = () => this.tryPlayMusic();
        
        // Configurar eventos para iniciar música
        this.setupMusicEvents();
        
        // Demorar el inicio del sistema de rugidos para evitar rugidos inmediatos tras transformación
        setTimeout(() => {
            this.startPeriodicRoars();
        }, 5000);  // Esperar 5 segundos antes de iniciar el sistema de rugidos
    },
    
    loadSound: function(name, src, volume = 1.0) {
        // Crear varios objetos de audio para permitir solapamiento limitado
        this.sounds[name] = {
            instances: [new Audio(src), new Audio(src)], // Dos instancias para alternar
            currentIndex: 0,
            isPlaying: false,
            lastPlayed: 0,
            volume: volume
        };
        
        // Configurar volumen para todas las instancias
        this.sounds[name].instances.forEach(audio => {
            audio.volume = volume;
            
            // Evento al finalizar reproducción
            audio.onended = () => {
                if (name === 'eat') {
                    this.activeEatSounds--;
                    this.processEatSoundQueue();
                }
                this.sounds[name].isPlaying = false;
            };
        });
    },
    
    tryPlayMusic: function() {
        if (this.backgroundMusic.paused) {
            this.backgroundMusic.play().catch(e => {});
        }
    },
    
    setupMusicEvents: function() {
        const startAudio = () => {
            this.tryPlayMusic();
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };
        
        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
        document.addEventListener('touchstart', startAudio);
        document.addEventListener('DOMContentLoaded', () => this.tryPlayMusic());
    },
    
    // Iniciar sistema de rugidos periódicos para dinosaurios
    startPeriodicRoars: function() {
        setInterval(() => {
            // Solo si hay dinosaurios, intentar reproducir un rugido
            if (this.hasDinosaurs()) {
                this.playRandomDinoRoar();
            }
        }, this.roarInterval);
    },
    
    // Verificar si hay dinosaurios en el juego
    hasDinosaurs: function() {
        return chickens.some(chicken => chicken.isDinosaur);
    },
    
    // Reproducir rugido de un dinosaurio aleatorio
    playRandomDinoRoar: function() {
        // Obtener todos los dinosaurios
        const dinosaurs = chickens.filter(chicken => chicken.isDinosaur);
        if (dinosaurs.length === 0) return;
        
        // Verificar si hay algún dinosaurio recién transformado
        const recentlyTransformed = dinosaurs.some(dino => {
            return Date.now() - dino.transformationTime < 10000; // 10 segundos después de transformación
        });
        
        // No rugir si hay dinosaurios recién transformados
        if (recentlyTransformed) return;
        
        // Seleccionar un dinosaurio aleatorio
        const randomDino = dinosaurs[Math.floor(Math.random() * dinosaurs.length)];
        
        // Reproducir el rugido
        this.play('roar', true);
    },
    
    play: function(name, force = false) {
        // Caso especial para el sonido "eat"
        if (name === 'eat') {
            return this.playEatSound();
        }
        
        // Caso especial para rugidos de dinosaurio
        if (name === 'roar' && !force) {
            const now = Date.now();
            if (now - this.lastRoarTime < this.roarInterval) {
                return false; // Demasiado pronto para otro rugido
            }
            this.lastRoarTime = now;
        }
        
        // Para otros sonidos
        const sound = this.sounds[name];
        if (!sound) return false;
        
        const now = Date.now();
        
        // Evitar reproducir el mismo sonido muy seguido (excepto transform que siempre suena)
        if (!force && name !== 'transform' && now - sound.lastPlayed < 1000) {
            return false;
        }
        
        // Para sonidos de transformación o rugidos forzados, siempre reproducir
        if (name === 'transform' || name === 'roar' || !sound.isPlaying) {
            sound.currentIndex = (sound.currentIndex + 1) % sound.instances.length;
            const audio = sound.instances[sound.currentIndex];
            audio.currentTime = 0;
            audio.play().catch(e => {});
            sound.isPlaying = true;
            sound.lastPlayed = now;
            
            // Actualizar tiempo del último rugido
            if (name === 'roar') {
                this.lastRoarTime = now;
            }
            
            return true;
        }
        
        return false;
    },
    
    playEatSound: function() {
        // Sistema especial para sonidos de comer
        const now = Date.now();
        const sound = this.sounds['eat'];
        
        // No reproducir si ya hay demasiados sonidos de comer activos
        if (this.activeEatSounds >= this.MAX_EAT_SOUNDS) {
            // Agregar a la cola si han pasado al menos 500ms desde el último
            if (now - this.lastEatTime > 500) {
                this.soundQueue.push({
                    name: 'eat',
                    time: now
                });
            }
            return false;
        }
        
        // Reproducir sonido de comer
        sound.currentIndex = (sound.currentIndex + 1) % sound.instances.length;
        const audio = sound.instances[sound.currentIndex];
        audio.currentTime = 0;
        audio.play().catch(e => {});
        sound.isPlaying = true;
        sound.lastPlayed = now;
        this.lastEatTime = now;
        this.activeEatSounds++;
        
        return true;
    },
    
    processEatSoundQueue: function() {
        // Procesar cola de sonidos de comer cuando termina uno
        if (this.soundQueue.length > 0 && this.activeEatSounds < this.MAX_EAT_SOUNDS) {
            const nextSound = this.soundQueue.shift();
            if (nextSound.name === 'eat') {
                this.playEatSound();
            }
        }
    }
};

// Inicializar el sistema de sonido
SoundManager.init();

// Función simplificada para reproducir sonidos (interfaz pública)
function playSound(name) {
    return SoundManager.play(name);
}

// El sistema de sonido ya está inicializado con SoundManager.init()

// Obtener dimensiones de escena
function getSceneDimensions() {
    const sceneElement = document.getElementById('scene');
    return {
        width: sceneElement.clientWidth,
        height: sceneElement.clientHeight
    };
}

// Crear escena Three.js
const scene = new THREE.Scene();
let { width, height } = getSceneDimensions();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setClearColor(0x87CEEB); // Cielo azul
document.getElementById('scene').appendChild(renderer.domElement);

// Iluminación básica
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Crear suelo
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x55aa55,
    roughness: 0.8
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Crear comedero
const feeder = new THREE.Group();
const baseGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.3, 8);
const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513
});
const base = new THREE.Mesh(baseGeometry, baseMaterial);
feeder.add(base);

// Comida para los pollos
const foodGeometry = new THREE.CylinderGeometry(0.4, 0.6, 0.1, 8);
const foodMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFF00
});
const food = new THREE.Mesh(foodGeometry, foodMaterial);
food.position.y = 0.2;
food.visible = false;
feeder.add(food);
feeder.position.set(-5, 0.15, -5);
scene.add(feeder);

// Función para crear casa simple
function createHouse() {
    const house = new THREE.Group();
    
    // Paredes
    const wallsGeometry = new THREE.BoxGeometry(3, 2, 2);
    const wallsMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc8855
    });
    const walls = new THREE.Mesh(wallsGeometry, wallsMaterial);
    house.add(walls);
    
    // Techo
    const roofGeometry = new THREE.ConeGeometry(2.2, 1.5, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x884422
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 1.75;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);
    
    // Puerta
    const doorGeometry = new THREE.PlaneGeometry(0.6, 1.2);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x664422
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(1.51, 0, 0);
    door.rotation.y = Math.PI / 2;
    house.add(door);
    
    // Ventana
    const windowGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x88ccff
    });
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(0, 0.5, 1.01);
    house.add(window);
    
    house.position.set(7, 1, 7);
    house.rotation.y = -Math.PI / 4;
    return house;
}

const house = createHouse();
scene.add(house);

// Definir tipos de dinosaurios (simplificados)
const DinoType = {
    TREX: 'trex',
    RAPTOR: 'raptor',
    STEGO: 'stego',
    TRICERA: 'tricera',
    BRONTO: 'bronto',
    SPINO: 'spino'
};

// Colores de dinosaurios
const DinoColors = {
    [DinoType.TREX]: 0x8B0000,     // Rojo oscuro
    [DinoType.RAPTOR]: 0x006400,   // Verde oscuro
    [DinoType.STEGO]: 0x808000,    // Verde oliva
    [DinoType.TRICERA]: 0x4B0082,  // Índigo
    [DinoType.BRONTO]: 0x696969,   // Gris oscuro
    [DinoType.SPINO]: 0x483D8B     // Azul pizarra oscuro
};

// Clase Chicken simplificada
class Chicken {
    constructor(x, z) {
        this.createChickenMesh(x, z);
        this.direction = Math.random() * Math.PI * 2;
        this.speed = 0.02;
        this.isEating = false;
        this.foodEaten = 0;
        this.isDinosaur = false;
        this.dinoType = null;
        
        // Para comportamiento más natural
        this.hungerLevel = Math.random() * 0.5;
        this.hungerIncrease = 0.0005 + Math.random() * 0.0005;
        this.lastSoundTime = 0;
        this.targetDirection = this.direction;
        
        // Para control de alimentación
        this.eatingStartTime = 0;      // Cuándo empezó a comer
        this.eatingDuration = 3000;    // Cuánto tiempo permanece comiendo (3 segundos)
        this.lastEatingTime = 0;       // Última vez que comió
        this.eatingCooldown = 7000;    // Periodo de espera entre comidas (7 segundos)
    }
    
    createChickenMesh(x, z) {
        const body = new THREE.Group();
        
        // Cuerpo principal (amarillo)
        const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700
        });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.add(bodyMesh);
        
        // Cabeza
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700
        });
        const headMesh = new THREE.Mesh(headGeometry, headMaterial);
        headMesh.position.set(0.25, 0.3, 0);
        body.add(headMesh);
        
        // Cresta
        const crestGeometry = new THREE.BoxGeometry(0.1, 0.08, 0.05);
        const crestMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF4500
        });
        const crestMesh = new THREE.Mesh(crestGeometry, crestMaterial);
        crestMesh.position.set(0.25, 0.42, 0);
        body.add(crestMesh);
        
        // Pico
        const beakGeometry = new THREE.ConeGeometry(0.05, 0.1, 4);
        const beakMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFAA00
        });
        const beakMesh = new THREE.Mesh(beakGeometry, beakMaterial);
        beakMesh.rotation.z = Math.PI / 2;
        beakMesh.position.set(0.4, 0.3, 0);
        body.add(beakMesh);
        
        // Ojos
        const eyeGeometry = new THREE.SphereGeometry(0.03, 6, 6);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.33, 0.33, 0.12);
        body.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.33, 0.33, -0.12);
        body.add(rightEye);
        
        // Patas
        const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFAA00
        });
        
        const leg1 = new THREE.Mesh(legGeometry, legMaterial);
        leg1.position.set(0, -0.2, 0.1);
        body.add(leg1);
        
        const leg2 = new THREE.Mesh(legGeometry, legMaterial);
        leg2.position.set(0, -0.2, -0.1);
        body.add(leg2);
        
        body.position.set(x, 0.5, z);
        this.mesh = body;
        scene.add(this.mesh);
    }
    
    createDinosaurMesh(x, z) {
        if (this.mesh) scene.remove(this.mesh);
        const body = new THREE.Group();
        
        // Color base según tipo de dinosaurio
        const dinoColor = DinoColors[this.dinoType];
        
        // Características básicas según tipo
        switch (this.dinoType) {
            case DinoType.TREX:
                // Cuerpo
                const bodyGeo = new THREE.SphereGeometry(0.6, 8, 8);
                const bodyMat = new THREE.MeshStandardMaterial({ color: dinoColor });
                const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
                body.add(bodyMesh);
                
                // Cabeza
                const headGeo = new THREE.BoxGeometry(0.5, 0.4, 0.3);
                const headMat = new THREE.MeshStandardMaterial({ color: dinoColor });
                const headMesh = new THREE.Mesh(headGeo, headMat);
                headMesh.position.set(0.5, 0.5, 0);
                body.add(headMesh);
                
                // Mandíbula
                const jawGeo = new THREE.ConeGeometry(0.2, 0.4, 4);
                const jawMat = new THREE.MeshStandardMaterial({ color: dinoColor });
                const jawMesh = new THREE.Mesh(jawGeo, jawMat);
                jawMesh.rotation.z = Math.PI / 2;
                jawMesh.position.set(0.8, 0.5, 0);
                body.add(jawMesh);
                break;
                
            case DinoType.RAPTOR:
                // Cuerpo esbelto
                const raptorBody = new THREE.CylinderGeometry(0.3, 0.4, 0.8);
                const raptorMat = new THREE.MeshStandardMaterial({ color: dinoColor });
                const raptorMesh = new THREE.Mesh(raptorBody, raptorMat);
                raptorMesh.rotation.z = Math.PI / 2;
                body.add(raptorMesh);
                
                // Cabeza puntiaguda
                const raptorHead = new THREE.ConeGeometry(0.2, 0.4, 4);
                const raptorHeadMesh = new THREE.Mesh(raptorHead, raptorMat);
                raptorHeadMesh.rotation.z = -Math.PI / 2;
                raptorHeadMesh.position.set(0.6, 0.2, 0);
                body.add(raptorHeadMesh);
                break;
                
            case DinoType.STEGO:
                // Cuerpo ancho
                const stegoBody = new THREE.BoxGeometry(1, 0.5, 0.4);
                const stegoMat = new THREE.MeshStandardMaterial({ color: dinoColor });
                const stegoMesh = new THREE.Mesh(stegoBody, stegoMat);
                body.add(stegoMesh);
                
                // Placas dorsales
                for (let i = 0; i < 5; i++) {
                    const plate = new THREE.ConeGeometry(0.15, 0.3, 3);
                    const plateMesh = new THREE.Mesh(plate, stegoMat);
                    plateMesh.position.set(-0.3 + i * 0.15, 0.4, 0);
                    plateMesh.rotation.z = 0;
                    body.add(plateMesh);
                }
                break;
                
            case DinoType.TRICERA:
                // Cuerpo robusto
                const triBody = new THREE.BoxGeometry(0.8, 0.5, 0.5);
                const triMat = new THREE.MeshStandardMaterial({ color: dinoColor });
                const triMesh = new THREE.Mesh(triBody, triMat);
                body.add(triMesh);
                
                // Escudo
                const shield = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 5);
                const shieldMesh = new THREE.Mesh(shield, triMat);
                shieldMesh.rotation.z = Math.PI / 2;
                shieldMesh.position.set(0.5, 0.3, 0);
                body.add(shieldMesh);
                
                // Cuernos
                for (let i = -1; i <= 1; i++) {
                    const horn = new THREE.ConeGeometry(0.05, 0.3, 4);
                    const hornMesh = new THREE.Mesh(horn, triMat);
                    hornMesh.position.set(0.6, 0.4, i * 0.2);
                    hornMesh.rotation.z = -Math.PI / 4;
                    body.add(hornMesh);
                }
                break;
                
            case DinoType.BRONTO:
                // Cuerpo grande
                const brontoBody = new THREE.SphereGeometry(0.5, 8, 8);
                const brontoMat = new THREE.MeshStandardMaterial({ color: dinoColor });
                const brontoMesh = new THREE.Mesh(brontoBody, brontoMat);
                body.add(brontoMesh);
                
                // Cuello largo
                const neck = new THREE.CylinderGeometry(0.1, 0.2, 1);
                const neckMesh = new THREE.Mesh(neck, brontoMat);
                neckMesh.position.set(0.3, 0.6, 0);
                neckMesh.rotation.z = -Math.PI / 4;
                body.add(neckMesh);
                
                // Cabeza pequeña
                const brontoHead = new THREE.BoxGeometry(0.2, 0.1, 0.1);
                const brontoHeadMesh = new THREE.Mesh(brontoHead, brontoMat);
                brontoHeadMesh.position.set(0.7, 0.9, 0);
                body.add(brontoHeadMesh);
                break;
                
            case DinoType.SPINO:
                // Cuerpo
                const spinoBody = new THREE.CylinderGeometry(0.4, 0.5, 1, 8);
                const spinoMat = new THREE.MeshStandardMaterial({ color: dinoColor });
                const spinoMesh = new THREE.Mesh(spinoBody, spinoMat);
                spinoMesh.rotation.z = Math.PI / 2;
                body.add(spinoMesh);
                
                // Vela dorsal
                for (let i = 0; i < 7; i++) {
                    const sailPlate = new THREE.ConeGeometry(0.2, 0.5, 3);
                    const sailMesh = new THREE.Mesh(sailPlate, spinoMat);
                    sailMesh.position.set(-0.3 + i * 0.1, 0.5, 0);
                    sailMesh.rotation.x = Math.PI;
                    body.add(sailMesh);
                }
                
                // Hocico
                const snoutGeo = new THREE.BoxGeometry(0.8, 0.2, 0.2);
                const snoutMesh = new THREE.Mesh(snoutGeo, spinoMat);
                snoutMesh.position.set(0.8, 0.2, 0);
                body.add(snoutMesh);
                break;
        }
        
        // Ojos (comunes a todos)
        const eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(0.7, 0.5, 0.15);
        body.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.7, 0.5, -0.15);
        body.add(rightEye);
        
        // Patas (comunes a todos)
        const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4);
        const legMaterial = new THREE.MeshStandardMaterial({ color: dinoColor });
        
        const leg1 = new THREE.Mesh(legGeometry, legMaterial);
        leg1.position.set(0, -0.3, 0.2);
        body.add(leg1);
        
        const leg2 = new THREE.Mesh(legGeometry, legMaterial);
        leg2.position.set(0, -0.3, -0.2);
        body.add(leg2);
        
        body.position.set(x, 0.7, z);
        this.mesh = body;
        scene.add(this.mesh);
    }
    
    transformToDinosaur() {
        const currentPos = this.mesh.position.clone();
        const dinoTypes = Object.values(DinoType);
        this.dinoType = dinoTypes[Math.floor(Math.random() * dinoTypes.length)];
        this.createDinosaurMesh(currentPos.x, currentPos.z);
        this.isDinosaur = true;
        this.speed = 0.04;
        
        // Registrar el tiempo de transformación
        this.transformationTime = Date.now();
        
        // Reproducir sonido de transformación (prioridad)
        playSound('transform');
    }
    
    update() {
        // Actualizar nivel de hambre
        this.hungerLevel += this.hungerIncrease;
        if (this.hungerLevel > 1) this.hungerLevel = 1;
        
        const now = Date.now();
        
        // Si está comiendo, verificar si ha terminado el tiempo de alimentación
        if (this.isEating) {
            if (now - this.eatingStartTime > this.eatingDuration) {
                this.isEating = false;
                this.lastEatingTime = now; // Registrar cuándo terminó de comer
            } else {
                // Mantener al pollo en el comedero mientras come
                // No hacer nada más en este ciclo de actualización
                return;
            }
        }
        
        // Lógica para determinar si debe ir a comer
        if (food.visible && !this.isDinosaur) { // Solo pollos, no dinosaurios
            const targetX = -5;
            const targetZ = -5;
            const dx = targetX - this.mesh.position.x;
            const dz = targetZ - this.mesh.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Verificar cooldown de alimentación
            const canEatAgain = now - this.lastEatingTime > this.eatingCooldown;
            
            // Si el pollo tiene hambre, la comida está visible, y ha pasado el tiempo de espera
            if (distance < 6 && this.hungerLevel > 0.4 && canEatAgain && !this.isEating) {
                // A mayor hambre, mayor velocidad hacia la comida
                this.targetDirection = Math.atan2(dz, dx);
                this.speed = 0.04; // Velocidad aumentada para ir a comer
                
                // Si está cerca, comenzar a comer
                if (distance < 1) {
                    this.startEating();
                }
            } else {
                // Comportamiento normal
                this.normalBehavior();
            }
        } else {
            // No hay comida o es un dinosaurio, comportamiento normal
            this.normalBehavior();
        }
        
        // Movimiento suavizado y actualización de posición
        this.smoothRotation();
        this.updatePosition();
        
        // Actualizar estadísticas en la interfaz
        updateChickenStats();
    }
    
    startEating() {
        if (!this.isEating) {
            this.isEating = true;
            this.eatingStartTime = Date.now(); // Registrar cuando empieza a comer
            this.hungerLevel = 0; // Restablecer hambre
            this.foodEaten++;
            
            // Intentar reproducir sonido de comer
            playSound('eat');
            
            // Comprobar si debe transformarse
            if (this.foodEaten >= 3 && !this.isDinosaur) {
                this.transformToDinosaur();
            }
        }
    }
    
    // Ya no se necesita este método ya que la lógica de comer ha cambiado
    /*continueEating() {
        // El pollo permanece en el comedero mientras come
        this.speed = 0;
    }*/
    
    normalBehavior() {
        this.speed = this.isDinosaur ? 0.04 : 0.02;
        
        // Cambios aleatorios de dirección
        if (Math.random() < 0.02) {
            this.targetDirection += (Math.random() - 0.5) * Math.PI / 2;
            
            // Los sonidos de gallos se hacen individualmente pero no los de dinosaurios
            // (los dinosaurios tienen sistema automático de rugidos)
            if (!this.isDinosaur && Math.random() < 0.2) {
                const now = Date.now();
                if (now - this.lastSoundTime > 5000) { // Limitar frecuencia
                    this.lastSoundTime = now;
                    playSound('cluck');
                }
            }
        }
    }
    
    smoothRotation() {
        // Rotar suavemente hacia la dirección objetivo
        const angleDiff = this.targetDirection - this.direction;
        
        // Normalizar la diferencia de ángulos
        let normalizedDiff = angleDiff;
        while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
        while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
        
        // Aplicar rotación suave
        this.direction += normalizedDiff * 0.1;
        
        // Normalizar dirección final
        while (this.direction > Math.PI * 2) this.direction -= Math.PI * 2;
        while (this.direction < 0) this.direction += Math.PI * 2;
    }
    
    updatePosition() {
        if (this.isEating) return; // Si está comiendo, no moverse
        
        const newX = this.mesh.position.x + Math.cos(this.direction) * this.speed;
        const newZ = this.mesh.position.z + Math.sin(this.direction) * this.speed;
        
        // Comprobar límites del mapa y proximidad a la casa
        const distanceToHouse = Math.sqrt(Math.pow(newX - 7, 2) + Math.pow(newZ - 7, 2));
        
        if (Math.abs(newX) < 9 && Math.abs(newZ) < 9 && distanceToHouse > 3) {
            this.mesh.position.x = newX;
            this.mesh.position.z = newZ;
        } else {
            // Dar la vuelta si está en el límite
            this.targetDirection += Math.PI;
        }
        
        // Actualizar rotación visual
        this.mesh.rotation.y = this.direction;
    }
}

// Función para actualizar las estadísticas
function updateChickenStats() {
    const statsDiv = document.getElementById('chickenStats');
    statsDiv.innerHTML = '<h3>Alimentación</h3>';
    
    chickens.forEach((chicken, index) => {
        const dinoEmoji = chicken.isDinosaur ? {
            [DinoType.TREX]: '🦖',
            [DinoType.RAPTOR]: '🦖',
            [DinoType.STEGO]: '🦕',
            [DinoType.TRICERA]: '🦕',
            [DinoType.BRONTO]: '🦕',
            [DinoType.SPINO]: '🦖'
        }[chicken.dinoType] : '🐔';
        
        statsDiv.innerHTML += `
            <div>Gallina ${index + 1} ${dinoEmoji}
                <div class="statBar">
                    <div class="statFill" style="width: ${Math.min(chicken.foodEaten / 3 * 100, 100)}%"></div>
                </div>
            </div>
        `;
    });
}

// Crear las gallinas
for (let i = 0; i < 10; i++) {
    const x = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10;
    chickens.push(new Chicken(x, z));
}

// Posicionar la cámara
camera.position.set(0, 10, 15);
camera.lookAt(0, 0, 0);

// Event listener para el botón de alimentar
document.getElementById('feedButton').addEventListener('click', () => {
    // Intentar reproducir música si aún no está sonando
    SoundManager.tryPlayMusic();
    
    food.visible = true;
    updateChickenStats();
    
    // Reiniciar el temporizador si ya hay uno activo
    if (feedTimeout) clearTimeout(feedTimeout);
    
    feedTimeout = setTimeout(() => {
        food.visible = false;
    }, 10000);
    
    // Reproducir sonido de poner comida (siempre se reproduce)
    playSound('feed');
});

// Función de animación
function animate() {
    requestAnimationFrame(animate);
    chickens.forEach(chicken => chicken.update());
    renderer.render(scene, camera);
}

// Iniciar animación
animate();

// Función para manejar el resize de la ventana
function handleResize() {
    const sceneElement = document.getElementById('scene');
    const newWidth = sceneElement.clientWidth;
    const newHeight = sceneElement.clientHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
}

// Agregar el event listener para resize
window.addEventListener('resize', handleResize);

// También agregar un ResizeObserver para detectar cambios en el tamaño del contenedor #scene
const resizeObserver = new ResizeObserver(handleResize);
resizeObserver.observe(document.getElementById('scene'));

// Ajustar el tamaño inicial correctamente
handleResize();

// Activar música con interacciones
document.addEventListener('click', () => SoundManager.tryPlayMusic());
document.getElementById('scene').addEventListener('click', () => SoundManager.tryPlayMusic());

// Script simple para botón de iniciar que desaparece al pulsarlo

// Función auto-ejecutable para no contaminar el espacio global
(function() {
    // Función para inicializar el botón de inicio
    function inicializarBotonInicio() {
        // Obtener el contenedor del juego (normalmente sería el elemento que contiene la escena)
        const contenedorJuego = document.getElementById('scene').parentElement;
        
        // Marcar el juego como no iniciado
        document.body.classList.add('juego-no-iniciado');
        
        // Crear el overlay y el botón
        const overlay = document.createElement('div');
        overlay.id = 'inicioOverlay';
        
        // Crear el botón
        const botonIniciar = document.createElement('button');
        botonIniciar.id = 'iniciarButton';
        botonIniciar.textContent = 'Iniciar';
        
        // Añadir el botón al overlay
        overlay.appendChild(botonIniciar);
        
        // Añadir el overlay al contenedor del juego
        contenedorJuego.appendChild(overlay);
        
        // Añadir evento de clic al botón
        botonIniciar.addEventListener('click', function() {
            // Eliminar la clase de juego no iniciado
            document.body.classList.remove('juego-no-iniciado');
            
            // Eliminar completamente el overlay
            overlay.remove();
            
            // Activar sonidos si están disponibles
            if (window.SoundManager && typeof window.SoundManager.tryPlayMusic === 'function') {
                window.SoundManager.tryPlayMusic();
            }
            
            // Simular clic en el botón de alimentar para comenzar con comida
            const feedButton = document.getElementById('feedButton');
            if (feedButton) {
                feedButton.click();
            }
        });
    }
    
    // Asegurarse de que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarBotonInicio);
    } else {
        // El DOM ya está cargado, inicializar ahora
        setTimeout(inicializarBotonInicio, 100);
    }
})();

// Sistema para detectar la transformación completa a dinosaurios
// Función auto-ejecutable para evitar conflictos con variables globales
(function() {
    // Variables para controlar el estado del logro
    let achievementShown = false;
    let checkInterval;
    let confettiContainer = null;

    // Iniciar el intervalo de comprobación
    function initDinosaurCompletion() {
        // Comprobar cada 2 segundos si todos son dinosaurios
        checkInterval = setInterval(checkAllDinosaurs, 2000);
        
        // Agregar al window para poder reiniciar el juego
        window.reiniciarJuego = reiniciarJuego;
    }

    // Función para crear confeti
    function createConfetti() {
        // Eliminar confeti anterior si existe
        if (confettiContainer) {
            confettiContainer.remove();
        }
        
        // Creamos un contenedor para el confeti dentro del contenedor del juego
        confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        // Añadimos al contenedor del juego en lugar del body
        document.getElementById('scene').parentNode.appendChild(confettiContainer);
        
        // Número total de confeti a crear
        const totalElements = 200;
        
        // Dividir la pantalla en secciones para asegurar distribución uniforme
        const numColumns = 20; // Dividimos horizontalmente en 20 secciones
        const numRows = 40;   // Dividimos verticalmente en 40 filas iniciales
        
        // Variables para rastrear la duración máxima
        let maxDuration = 0;
        let maxDelay = 0;
        
        // Colores para el confeti
        const colors = ['#FFD700', '#FF4500', '#9370DB', '#32CD32', '#00BFFF', '#FF69B4', '#FF6347'];
        
        // Crear confeti distribuido por toda la pantalla
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numColumns; col++) {
                // Calcular confeti por celda
                const confettiPerCell = Math.ceil(totalElements / (numColumns * numRows));
                
                for (let i = 0; i < confettiPerCell; i++) {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    
                    // Formas variadas
                    const shape = Math.random() > 0.6 ? 'circle' : Math.random() > 0.5 ? 'square' : 'rectangle';
                    
                    // Distribuir horizontalmente por toda la pantalla
                    const baseX = (col / numColumns) * 100;
                    const randomOffsetX = (Math.random() * (100/numColumns)) - (50/numColumns);
                    confetti.style.left = (baseX + randomOffsetX) + '%';
                    
                    // Distribuir verticalmente en diferentes puntos de inicio
                    // Altura inicial relativa al contenedor
                    const startY = -10 + (row * 2) + (Math.random() * 10);
                    confetti.style.top = startY + '%';
                    
                    // Color aleatorio
                    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    
                    // Desplazamiento aleatorio durante la caída
                    const horizontalOffset = (Math.random() - 0.5) * 150;
                    confetti.style.setProperty('--horizontal-offset', horizontalOffset + 'px');
                    
                    // Tamaños variados
                    const size = Math.random() * 12 + 5;
                    confetti.style.width = size + 'px';
                    confetti.style.height = shape === 'rectangle' ? size * 1.5 + 'px' : size + 'px';
                    
                    // Formas diferentes
                    confetti.style.borderRadius = shape === 'circle' ? '50%' : '0';
                    
                    // Velocidades variadas
                    const duration = Math.random() * 3 + 3;
                    const delay = Math.random() * 3;
                    confetti.style.animationDelay = delay + 's';
                    confetti.style.animationDuration = duration + 's';
                    
                    // Actualizar máximos para calcular la duración total
                    maxDuration = Math.max(maxDuration, duration);
                    maxDelay = Math.max(maxDelay, delay);
                    
                    // Rotación aleatoria
                    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                    
                    confettiContainer.appendChild(confetti);
                }
            }
        }
        
        // Calculamos el tiempo total basado en la duración máxima y el delay máximo
        // Convertimos segundos a milisegundos para setTimeout
        const totalAnimationTime = (maxDelay + maxDuration) * 1000;
        
        // Eliminamos el confeti después de que termine la animación,
        // agregando un pequeño margen para asegurar que todas las animaciones completen
        setTimeout(() => {
            confettiContainer.remove();
            confettiContainer = null;
        }, totalAnimationTime + 200); // Añadimos 200ms como margen de seguridad
    }

    // Función para comprobar si todos los pollos son dinosaurios
    function checkAllDinosaurs() {
        // No comprobar si ya se mostró el logro
        if (achievementShown) return;
        
        // Acceder a la variable chickens del scope global
        if (typeof chickens === 'undefined' || chickens.length === 0) return;
        
        // Comprobar si todos los pollos son dinosaurios
        const allDinosaurs = chickens.every(chicken => chicken.isDinosaur);
        
        // Si todos son dinosaurios, mostrar mensaje de felicitación
        if (allDinosaurs) {
            showDinosaurCompletion();
        }
    }

    // Función para mostrar el mensaje de felicitación
    function showDinosaurCompletion() {
        // Marcar como mostrado para evitar repeticiones
        achievementShown = true;
        
        // Detener el intervalo de comprobación
        clearInterval(checkInterval);
        
        // Crear confeti para celebrar
        createConfetti();
        
        // Reproducir sonido de rugido si está disponible
        if (typeof playSound === 'function') {
            playSound('roar');
            setTimeout(() => playSound('roar'), 700);
            setTimeout(() => playSound('roar'), 1500);
        }
        
        // Crear el contenedor del mensaje
        const messageContainer = document.createElement('div');
        messageContainer.className = 'dinosaur-completion-message';
        
        // Crear el contenido
        messageContainer.innerHTML = `
            <div class="dinosaur-completion-title">¡Increíble!</div>
            <div class="dino-master-badge"></div>
            <div class="dinosaur-completion-text">
                ¡Te has convertido en el Maestro del Dino Rex! 
                Has transformado a todas tus gallinas en dinosaurios.
                ¿Qué quieres hacer ahora?
            </div>
            <div class="dinosaur-completion-buttons">
                <button class="dinosaur-completion-button button-continue">Continuar</button>
                <button class="dinosaur-completion-button button-restart">Reiniciar</button>
            </div>
        `;
        
        // Añadir al DOM
        document.getElementById('scene').parentNode.appendChild(messageContainer);
        
        // Añadir event listeners a los botones
        messageContainer.querySelector('.button-continue').addEventListener('click', () => {
            messageContainer.remove();
            achievementShown = true; // Mantener como mostrado
        });
        
        messageContainer.querySelector('.button-restart').addEventListener('click', () => {
            messageContainer.remove();
            reiniciarJuego();
        });
    }

    // Función para reiniciar el juego
    function reiniciarJuego() {
        // Eliminar todos los pollos/dinosaurios actuales
        chickens.forEach(chicken => {
            if (chicken.mesh) {
                scene.remove(chicken.mesh);
            }
        });
        
        // Limpiar array de chickens
        chickens = [];
        
        // Crear nuevos pollos
        for (let i = 0; i < 10; i++) {
            const x = (Math.random() - 0.5) * 10;
            const z = (Math.random() - 0.5) * 10;
            chickens.push(new Chicken(x, z));
        }
        
        // Ocultar comida
        food.visible = false;
        
        // Reiniciar indicador de logro
        achievementShown = false;
        
        // Reiniciar intervalo de comprobación
        clearInterval(checkInterval);
        checkInterval = setInterval(checkAllDinosaurs, 2000);
        
        // Actualizar estadísticas
        updateChickenStats();
    }

    // Iniciar después de que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDinosaurCompletion);
    } else {
        // El DOM ya está cargado, inicializar con un pequeño retraso
        setTimeout(initDinosaurCompletion, 500);
    }
})();