// Variables del juego
let chickens = [];
let feedTimeout = null;

// Reproducción automática de la música de fondo con múltiples enfoques
(function() {
    // Crear el elemento de audio
    const backgroundMusic = new Audio('archivos_de_minijuegos/sounds/granja.mp3'); // Cambiar por archivo de granja
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
    window.reproducirLoopGranja = function() {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(e => console.error("Error al reproducir:", e));
        }
    };
})();

// Función para obtener las dimensiones correctas del contenedor
function getSceneDimensions() {
    const sceneElement = document.getElementById('scene');
    return {
        width: sceneElement.clientWidth,
        height: sceneElement.clientHeight
    };
}

// Crear la escena
const scene = new THREE.Scene();

// Configurar la cámara con las dimensiones del contenedor
let { width, height } = getSceneDimensions();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

// Crear el renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setClearColor(0x87CEEB); // Color de fondo azul cielo
document.getElementById('scene').appendChild(renderer.domElement);

// Configurar iluminación
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Crear el suelo
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x55aa55,
    roughness: 0.8
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Crear el comedero
const feeder = new THREE.Group();
const baseGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.3, 8);
const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513
});
const base = new THREE.Mesh(baseGeometry, baseMaterial);
feeder.add(base);

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

// Función para crear la casa
function createHouse() {
    const house = new THREE.Group();
    const wallsGeometry = new THREE.BoxGeometry(3, 2, 2);
    const wallsMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc8855
    });
    const walls = new THREE.Mesh(wallsGeometry, wallsMaterial);
    house.add(walls);
    
    const roofGeometry = new THREE.ConeGeometry(2.2, 1.5, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x884422
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 1.75;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);
    
    const doorGeometry = new THREE.PlaneGeometry(0.6, 1.2);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x664422
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(1.51, 0, 0);
    door.rotation.y = Math.PI / 2;
    house.add(door);
    
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

// Definir tipos de dinosaurios
const DinoType = {
    TREX: 'trex',
    RAPTOR: 'raptor',
    STEGO: 'stego',
    TRICERA: 'tricera',
    BRONTO: 'bronto',
    SPINO: 'spino'
};

// Clase Chicken
class Chicken {
    constructor(x, z) {
        this.createChickenMesh(x, z);
        this.direction = Math.random() * Math.PI * 2;
        this.speed = 0.02;
        this.isEating = false;
        this.foodEaten = 0;
        this.isDinosaur = false;
        this.dinoType = null;
    }
    
    createChickenMesh(x, z) {
        const body = new THREE.Group();
        const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF
        });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.add(bodyMesh);
        
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF
        });
        const headMesh = new THREE.Mesh(headGeometry, headMaterial);
        headMesh.position.set(0.25, 0.3, 0);
        body.add(headMesh);
        
        const beakGeometry = new THREE.ConeGeometry(0.05, 0.1, 4);
        const beakMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFAA00
        });
        const beakMesh = new THREE.Mesh(beakGeometry, beakMaterial);
        beakMesh.rotation.z = Math.PI / 2;
        beakMesh.position.set(0.4, 0.3, 0);
        body.add(beakMesh);
        
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
        
        switch (this.dinoType) {
            case DinoType.TREX:
                const bodyGeo = new THREE.SphereGeometry(0.6, 8, 8);
                const bodyMat = new THREE.MeshStandardMaterial({
                    color: 0x8B0000
                });
                const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
                body.add(bodyMesh);
                
                const headGeo = new THREE.BoxGeometry(0.5, 0.4, 0.3);
                const headMat = new THREE.MeshStandardMaterial({
                    color: 0x8B0000
                });
                const headMesh = new THREE.Mesh(headGeo, headMat);
                headMesh.position.set(0.5, 0.5, 0);
                body.add(headMesh);
                
                const jawGeo = new THREE.ConeGeometry(0.2, 0.4, 4);
                const jawMat = new THREE.MeshStandardMaterial({
                    color: 0x800000
                });
                const jawMesh = new THREE.Mesh(jawGeo, jawMat);
                jawMesh.rotation.z = Math.PI / 2;
                jawMesh.position.set(0.8, 0.5, 0);
                body.add(jawMesh);
                break;
                
            case DinoType.RAPTOR:
                const raptorBody = new THREE.CylinderGeometry(0.3, 0.4, 0.8);
                const raptorMat = new THREE.MeshStandardMaterial({
                    color: 0x006400
                });
                const raptorMesh = new THREE.Mesh(raptorBody, raptorMat);
                raptorMesh.rotation.z = Math.PI / 2;
                body.add(raptorMesh);
                
                const raptorHead = new THREE.ConeGeometry(0.2, 0.4, 4);
                const raptorHeadMesh = new THREE.Mesh(raptorHead, raptorMat);
                raptorHeadMesh.rotation.z = -Math.PI / 2;
                raptorHeadMesh.position.set(0.6, 0.2, 0);
                body.add(raptorHeadMesh);
                break;
                
            case DinoType.STEGO:
                const stegoBody = new THREE.BoxGeometry(1, 0.5, 0.4);
                const stegoMat = new THREE.MeshStandardMaterial({
                    color: 0x808000
                });
                const stegoMesh = new THREE.Mesh(stegoBody, stegoMat);
                body.add(stegoMesh);
                
                for (let i = 0; i < 5; i++) {
                    const plate = new THREE.ConeGeometry(0.15, 0.3, 3);
                    const plateMesh = new THREE.Mesh(plate, stegoMat);
                    plateMesh.position.set(-0.3 + i * 0.15, 0.4, 0);
                    plateMesh.rotation.z = 0;
                    body.add(plateMesh);
                }
                break;
                
            case DinoType.TRICERA:
                const triBody = new THREE.BoxGeometry(0.8, 0.5, 0.5);
                const triMat = new THREE.MeshStandardMaterial({
                    color: 0x4B0082
                });
                const triMesh = new THREE.Mesh(triBody, triMat);
                body.add(triMesh);
                
                const shield = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 5);
                const shieldMesh = new THREE.Mesh(shield, triMat);
                shieldMesh.rotation.z = Math.PI / 2;
                shieldMesh.position.set(0.5, 0.3, 0);
                body.add(shieldMesh);
                
                for (let i = -1; i <= 1; i++) {
                    const horn = new THREE.ConeGeometry(0.05, 0.3, 4);
                    const hornMesh = new THREE.Mesh(horn, triMat);
                    hornMesh.position.set(0.6, 0.4, i * 0.2);
                    hornMesh.rotation.z = -Math.PI / 4;
                    body.add(hornMesh);
                }
                break;
                
            case DinoType.BRONTO:
                const brontoBody = new THREE.SphereGeometry(0.5, 8, 8);
                const brontoMat = new THREE.MeshStandardMaterial({
                    color: 0x696969
                });
                const brontoMesh = new THREE.Mesh(brontoBody, brontoMat);
                body.add(brontoMesh);
                
                const neck = new THREE.CylinderGeometry(0.1, 0.2, 1);
                const neckMesh = new THREE.Mesh(neck, brontoMat);
                neckMesh.position.set(0.3, 0.6, 0);
                neckMesh.rotation.z = -Math.PI / 4;
                body.add(neckMesh);
                
                const brontoHead = new THREE.BoxGeometry(0.2, 0.1, 0.1);
                const brontoHeadMesh = new THREE.Mesh(brontoHead, brontoMat);
                brontoHeadMesh.position.set(0.7, 0.9, 0);
                body.add(brontoHeadMesh);
                break;
                
            case DinoType.SPINO:
                const spinoBody = new THREE.CylinderGeometry(0.4, 0.5, 1, 8);
                const spinoMat = new THREE.MeshStandardMaterial({
                    color: 0x483D8B
                });
                const spinoMesh = new THREE.Mesh(spinoBody, spinoMat);
                spinoMesh.rotation.z = Math.PI / 2;
                body.add(spinoMesh);
                
                for (let i = 0; i < 7; i++) {
                    const sailPlate = new THREE.ConeGeometry(0.2, 0.5, 3);
                    const sailMesh = new THREE.Mesh(sailPlate, spinoMat);
                    sailMesh.position.set(-0.3 + i * 0.1, 0.5, 0);
                    sailMesh.rotation.x = Math.PI;
                    body.add(sailMesh);
                }
                
                const snoutGeo = new THREE.BoxGeometry(0.8, 0.2, 0.2);
                const snoutMesh = new THREE.Mesh(snoutGeo, spinoMat);
                snoutMesh.position.set(0.8, 0.2, 0);
                body.add(snoutMesh);
                
                for (let i = 0; i < 4; i++) {
                    const toothGeo = new THREE.ConeGeometry(0.03, 0.1, 4);
                    const toothMat = new THREE.MeshStandardMaterial({
                        color: 0xFFFFFF
                    });
                    const toothMesh = new THREE.Mesh(toothGeo, toothMat);
                    toothMesh.position.set(0.6 + i * 0.15, 0.1, 0);
                    toothMesh.rotation.z = Math.PI;
                    body.add(toothMesh);
                }
                break;
        }
        
        const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: this.mesh.children[0].material.color
        });
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
        
        // Reproducir sonido de transformación
        playSound('transform');
    }
    
    update() {
        if (food.visible && !this.isEating) {
            const targetX = -5;
            const targetZ = -5;
            const dx = targetX - this.mesh.position.x;
            const dz = targetZ - this.mesh.position.z;
            this.direction = Math.atan2(dz, dx);
            this.speed = this.isDinosaur ? 0.06 : 0.05;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < 1 && this.foodEaten < 3) {
                this.isEating = true;
                this.foodEaten++;
                if (this.foodEaten >= 3 && !this.isDinosaur) {
                    this.transformToDinosaur();
                }
                
                // Reproducir sonido de comer
                playSound('eat');
            }
        } else if (!food.visible) {
            this.isEating = false;
            this.speed = this.isDinosaur ? 0.04 : 0.02;
            if (Math.random() < 0.02) {
                this.direction += (Math.random() - 0.5) * Math.PI / 2;
                
                // Ocasionalmente reproducir sonido de gallo/dinosaurio
                if (Math.random() < 0.01) {
                    if (this.isDinosaur) {
                        playSound('roar');
                    } else {
                        playSound('cluck');
                    }
                }
            }
        }
        
        if (!this.isEating) {
            const newX = this.mesh.position.x + Math.cos(this.direction) * this.speed;
            const newZ = this.mesh.position.z + Math.sin(this.direction) * this.speed;
            const distanceToHouse = Math.sqrt(Math.pow(newX - 7, 2) + Math.pow(newZ - 7, 2));
            
            if (Math.abs(newX) < 9 && Math.abs(newZ) < 9 && distanceToHouse > 3) {
                this.mesh.position.x = newX;
                this.mesh.position.z = newZ;
            } else {
                this.direction += Math.PI;
            }
        }
        
        updateChickenStats();
        this.mesh.rotation.y = this.direction;
    }
}

// Función para reproducir sonidos
function playSound(name) {
    let audio = new Audio("archivos_de_minijuegos/sounds/" + name + ".mp3");
    audio.play();
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
    if (window.reproducirLoopGranja) {
        window.reproducirLoopGranja();
    }
    
    food.visible = true;
    updateChickenStats();
    if (feedTimeout) clearTimeout(feedTimeout);
    feedTimeout = setTimeout(() => {
        food.visible = false;
    }, 10000);
    
    // Reproducir sonido de poner comida
    playSound('feed');
});

// Función de animación
function animate() {
    requestAnimationFrame(animate);
    chickens.forEach(chicken => chicken.update());
    renderer.render(scene, camera);
}

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

// Intentar reproducir la música cuando se hace click en algún elemento del juego
document.addEventListener('click', function() {
    if (window.reproducirLoopGranja) {
        window.reproducirLoopGranja();
    }
});

// También intentar reproducir al hacer click específicamente en la escena
document.getElementById('scene').addEventListener('click', function() {
    if (window.reproducirLoopGranja) {
        window.reproducirLoopGranja();
    }
});