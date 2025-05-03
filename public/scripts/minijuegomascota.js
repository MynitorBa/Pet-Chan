// Referencias a elementos del DOM
const gameArea = document.getElementById('game-area');
const giftBox = document.getElementById('gift-box');
const pet = document.getElementById('pet');
const instructions = document.getElementById('instructions');
const adoptButton = document.getElementById('adopt-button');
const petNameContainer = document.getElementById('pet-name-container');
const petNameInput = document.getElementById('pet-name-input');
const spinCounter = document.getElementById('spin-counter');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const spaceKeyIndicator = document.getElementById('space-key-indicator');
const gameHeader = document.getElementById('game-header');
const explosion = document.getElementById('explosion');

// Estado del juego (SOLO LÓGICA, sin arrays de mascotas)
let gameState = 'waiting'; // waiting, falling, ready, spinning, opening, complete
let rotations = 0;
let rotationSpeed = 0;
let completedRotations = 0;
let targetRotations = 15; // Vueltas necesarias para abrir el regalo
let spinPower = 0; // Acumulador de potencia de giro
let isSpinning = false;

// =============================================
// Funciones del juego (MISMA JUGABILIDAD)
// =============================================

// Crear estrellas de fondo (igual)
function createStars() {
    const starsCount = 50;
    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        gameArea.appendChild(star);
    }
}

// Mostrar u ocultar elementos (igual)
function showElement(element, show = true) {
    element.style.opacity = show ? '1' : '0';
    if (show) {
        element.style.display = 'block';
    } else {
        setTimeout(() => {
            if (element.style.opacity === '0') {
                element.style.display = 'none';
            }
        }, 500);
    }
}

// Animación de caída del regalo (igual)
function startGiftFall() {
    gameState = 'falling';
    giftBox.style.animation = 'fallDown 1.5s forwards';
    instructions.textContent = 'El regalo está cayendo, ¡prepárate para girarlo!';
    
    giftBox.addEventListener('animationend', function() {
        if (gameState === 'falling') {
            gameState = 'ready';
            giftBox.style.animation = 'glow 2s infinite';
            instructions.textContent = '¡Presiona ESPACIO o haz clic para girar el regalo!';
            instructions.style.display = 'none';
            showElement(spinCounter);
            showElement(progressContainer);
            showElement(spaceKeyIndicator);
            showElement(gameHeader, false);
            updateProgress();
        }
    });
}

// Efecto de partículas (igual)
function createParticles() {
    const colors = ['#ff9ff3', '#ff7675', '#ffeaa7', '#a29bfe', '#74b9ff', '#1dd1a1', '#feca57', '#ff6b6b', '#48dbfb'];
    const giftRect = giftBox.getBoundingClientRect();
    const giftCenterX = giftRect.left + giftRect.width / 2;
    const giftCenterY = giftRect.top + giftRect.height / 2;
    
    for (let i = 0; i < 100; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = `${giftCenterX}px`;
        particle.style.top = `${giftCenterY}px`;
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 300;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        particle.style.setProperty('--x', `${x}px`);
        particle.style.setProperty('--y', `${y}px`);
        const size = Math.random() * 15 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        if (Math.random() > 0.5) {
            particle.style.borderRadius = '0';
            particle.style.transform = `rotate(${Math.random() * 360}deg)`;
        }
        const duration = 0.8 + Math.random() * 1.2;
        particle.style.animation = `particleMove ${duration}s forwards`;
        document.body.appendChild(particle);
        particle.addEventListener('animationend', function() {
            particle.remove();
        });
    }
}

// Efecto de explosión (igual)
function createExplosion() {
    explosion.style.animation = 'none';
    void explosion.offsetHeight;
    explosion.style.animation = 'explosion 0.8s forwards';
}

// Abrir el regalo (SIMPLIFICADO: ya no hay selección aleatoria)
function openGift() {
    gameState = 'opening';
    isSpinning = false;
    showElement(spinCounter, false);
    showElement(progressContainer, false);
    showElement(spaceKeyIndicator, false);
    showElement(instructions, false);
    createExplosion();
    createParticles();
    
    // La imagen y tipo de mascota ya están definidos en el EJS (no hay array)
    pet.style.opacity = '1';
    pet.style.animation = 'petAppear 1s forwards';
    giftBox.style.animation = 'openGift 1s forwards';
    
    setTimeout(() => {
        showElement(petNameContainer);
        // Usa el nombre de la mascota desde el EJS (ej: "Gato Pixel" -> "Gato123")
        const petType = pet.alt.split(' ')[0]; // Asume que el alt está en el EJS
        petNameInput.value = `${petType}${Math.floor(Math.random() * 100)}`;
        showElement(adoptButton);
        gameState = 'complete';
    }, 1000);
}

// Actualizar progreso (igual)
function updateProgress() {
    const progress = Math.min(completedRotations / targetRotations, 1);
    progressBar.style.width = `${progress * 100}%`;
    spinCounter.textContent = `Vueltas: ${completedRotations}/${targetRotations}`;
    if (progress < 0.33) {
        progressBar.style.background = 'linear-gradient(90deg, #ff6b6b, #ff9ff3)';
    } else if (progress < 0.66) {
        progressBar.style.background = 'linear-gradient(90deg, #ff9ff3, #feca57)';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #feca57, #1dd1a1)';
    }
}

// Añadir potencia de giro (igual)
function addSpinPower() {
    if (gameState !== 'ready') return;
    spinPower += 5;
    rotationSpeed += spinPower * 0.3;
    rotationSpeed = Math.min(rotationSpeed, 80);
    giftBox.style.transform = `translateX(-50%) translateY(-50%) rotate(${rotations}deg) scale(1.1)`;
    setTimeout(() => {
        giftBox.style.transform = `translateX(-50%) translateY(-50%) rotate(${rotations}deg) scale(1)`;
    }, 100);
    isSpinning = true;
    setTimeout(() => {
        isSpinning = false;
    }, 200);
}

// Bucle del juego (igual)
function gameLoop() {
    if (gameState === 'ready') {
        rotationSpeed *= 0.97;
        if (Math.abs(rotationSpeed) < 0.1) rotationSpeed = 0;
        rotations += rotationSpeed;
        giftBox.style.transform = `translateX(-50%) translateY(-50%) rotate(${rotations}deg)`;
        const newCompletedRotations = Math.floor(Math.abs(rotations) / 360);
        if (newCompletedRotations > completedRotations) {
            completedRotations = newCompletedRotations;
            updateProgress();
        }
        if (completedRotations >= targetRotations) {
            openGift();
            return;
        }
    }
    requestAnimationFrame(gameLoop);
}

// Eventos (igual)
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && gameState === 'ready') {
        e.preventDefault();
        addSpinPower();
    }
});

giftBox.addEventListener('click', function() {
    if (gameState === 'ready') {
        addSpinPower();
    }
});

/* JavaScript to replace alert with custom notifications */
function showPetNotification(message, type = 'success', duration = 4000) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.pet-notification');
    existingNotifications.forEach(notification => {
      notification.remove();
    });
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `pet-notification ${type}`;
    
    // Icon based on type
    let icon = type === 'success' ? 
      '<i class="fas fa-paw"></i>' : 
      '<i class="fas fa-exclamation-circle"></i>';
    
    notification.innerHTML = `
      <div class="pet-notification-content">
        <div class="pet-notification-icon">${icon}</div>
        <div class="pet-notification-message">${message}</div>
        <button class="pet-notification-close">&times;</button>
      </div>
    `;
    
    // Add confetti for success messages
    if (type === 'success') {
      const confettiContainer = document.createElement('div');
      confettiContainer.className = 'confetti-container';
      
      const colors = ['#ff9ff3', '#ff7675', '#ffeaa7', '#a29bfe', '#74b9ff', '#1dd1a1'];
      
      for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = `confetti ${Math.random() > 0.5 ? 'square' : 'circle'}`;
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confettiContainer.appendChild(confetti);
      }
      
      notification.appendChild(confettiContainer);
    }
    
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeButton = notification.querySelector('.pet-notification-close');
    closeButton.addEventListener('click', () => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto close after duration
    if (duration > 0) {
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.style.opacity = '0';
          setTimeout(() => {
            notification.remove();
          }, 300);
        }
      }, duration);
    }
    
    return notification;
  }
  
  // Modified adoption button event listener
  adoptButton.addEventListener('click', function(e) {
    const petName = petNameInput.value.trim();
    if (!petName) {
      e.preventDefault(); // Prevent form submission
      showPetNotification('Por favor, dale un nombre a tu mascota', 'error');
      return;
    }
    
    // For successful adoption
    e.preventDefault(); // Prevent immediate form submission
    showPetNotification(`¡Felicidades! Has adoptado a ${petName}. ¡Bienvenido a Mundo Mascota Virtual!`, 'success', 3000);
    
    // Submit the form after showing the notification
    setTimeout(() => {
      document.querySelector('.pet-nombre-formulario').submit();
    }, 2000);
  });

// Inicialización (igual)
window.addEventListener('DOMContentLoaded', function() {
    createStars();
    setTimeout(startGiftFall, 1000);
    gameLoop();
    giftBox.addEventListener('animationend', function() {
        if (gameState === 'falling') {
            giftBox.style.top = '50%';
            giftBox.style.left = '50%';
            giftBox.style.transform = 'translateX(-50%) translateY(-50%)';
        }
    });
});