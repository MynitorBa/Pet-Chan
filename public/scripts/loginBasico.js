  // Referencias a elementos del DOM
  const loginButton = document.getElementById('login-button');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const loginMessage = document.getElementById('login-message');
  const portal = document.getElementById('portal');
  const starsBg = document.getElementById('stars-bg');
  const loginForm = document.querySelector('.login-form');

  // Crear estrellas de fondo
  function createStars() {
      const starsCount = 50;
      
      for (let i = 0; i < starsCount; i++) {
          const star = document.createElement('div');
          star.classList.add('star');
          
          // Posición aleatoria
          star.style.top = `${Math.random() * 100}%`;
          star.style.left = `${Math.random() * 100}%`;
          
          // Tamaño aleatorio
          const size = Math.random() * 3 + 1;
          star.style.width = `${size}px`;
          star.style.height = `${size}px`;
          
          // Retraso aleatorio en la animación
          star.style.animationDelay = `${Math.random() * 3}s`;
          
          starsBg.appendChild(star);
      }
  }

  // Crear partículas para el efecto portal
  function createParticles() {
      const container = document.querySelector('.login-container');
      const particlesCount = 30;
      
      for (let i = 0; i < particlesCount; i++) {
          const particle = document.createElement('div');
          particle.classList.add('particle');
          container.appendChild(particle);
      }
  }

  // Animar partículas hacia el portal
  function animateParticlesToPortal() {
      const particles = document.querySelectorAll('.particle');
      const portalRect = portal.getBoundingClientRect();
      const portalCenterX = portalRect.left + portalRect.width / 2;
      const portalCenterY = portalRect.top + portalRect.height / 2;
      
      particles.forEach((particle, index) => {
          // Posición inicial aleatoria en el viewport
          const startX = Math.random() * window.innerWidth;
          const startY = Math.random() * window.innerHeight;
          
          particle.style.left = `${startX}px`;
          particle.style.top = `${startY}px`;
          
          // Color aleatorio entre rosa y púrpura
          const colors = ['#d304c5', '#a304fa', '#cf7cfc'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          particle.style.backgroundColor = randomColor;
          
          // Tamaño aleatorio
          const size = Math.random() * 8 + 2;
          particle.style.width = `${size}px`;
          particle.style.height = `${size}px`;
          
          // Animación con retraso basado en el índice
          setTimeout(() => {
              particle.style.opacity = '1';
              particle.style.transition = `all 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)`;
              particle.style.transform = 'scale(0.5)';
              
              // Mover partícula hacia el centro del portal
              particle.style.left = `${portalCenterX}px`;
              particle.style.top = `${portalCenterY}px`;
              
              // Hacer desaparecer la partícula cuando llega al portal
              setTimeout(() => {
                  particle.style.opacity = '0';
                  particle.style.transform = 'scale(0)';
              }, 1200);
          }, index * 50);
      });
  }

  function validateForm() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!username) {
        loginMessage.textContent = 'Por favor, ingresa un nombre de usuario';
        loginMessage.style.display = 'block';
        return false;
    }

    if (username.length < 5) {
        loginMessage.textContent = 'El nombre de usuario debe tener al menos 5 caracteres';
        loginMessage.style.display = 'block';
        return false;
    }

    if (!password) {
        loginMessage.textContent = 'Por favor, ingresa una contraseña';
        loginMessage.style.display = 'block';
        return false;
    }

    if (password.length < 8) {
        loginMessage.textContent = 'La contraseña debe tener al menos 8 caracteres';
        loginMessage.style.display = 'block';
        return false;
    }

    if (password !== confirmPassword) {
        loginMessage.textContent = 'Las contraseñas no coinciden';
        loginMessage.style.display = 'block';
        return false;
    }

    loginMessage.style.display = 'none';
    return true;
}


  // Activar el portal mejorado y redirigir
  function activateEnhancedPortal() {
      // Aplicar efecto de desvanecimiento al formulario
      loginForm.style.transition = 'all 0.8s ease';
      loginForm.style.opacity = '0';
      loginForm.style.transform = 'scale(0.9) translateY(-30px)';
      
      // Crear y animar partículas hacia el portal
      createParticles();
      animateParticlesToPortal();
      
      // Activar el portal con efectos mejorados
      setTimeout(() => {
          portal.classList.add('active');
          
          // Agregar sonido de portal (opcional)
          // const portalSound = new Audio('portal-sound.mp3');
          // portalSound.play();
          
          // Redirigir después de que se complete la animación del portal
          setTimeout(() => {
              window.location.href = '/minijuegomascota';
          }, 2300); // Tiempo ajustado a la duración de la animación del portal
      }, 800);
  }

  // Event Listener para el botón de login
  loginButton.addEventListener('click', function() {
      if (validateForm()) {
          // Guardar el nombre de usuario en sessionStorage para utilizarlo en la siguiente página
          sessionStorage.setItem('username', usernameInput.value);
          
          // Activar el efecto de portal mejorado y redirigir
          activateEnhancedPortal();
      }
  });

  // Inicializar estrellas al cargar la página
  document.addEventListener('DOMContentLoaded', function() {
      createStars();
  });

