document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const loginButton = document.getElementById('login-button');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const loginMessage = document.getElementById('login-message');
    const portal = document.getElementById('portal');
    const starsBg = document.getElementById('stars-bg');
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.formulario-registro');
  
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
  
    // Función para limpiar mensajes de error
    function clearErrorMessages() {
        loginMessage.style.display = 'none';
        loginMessage.textContent = '';
    }
  
    // Función para validar nombre de usuario
    function validateUsername() {
        const username = usernameInput.value.trim();
        usernameInput.classList.remove('error', 'valid');
        
        if (!username) {
            displayError('Por favor, ingresa un nombre de usuario');
            usernameInput.classList.add('error');
            return false;
        }
  
        if (username.length < 5) {
            displayError('El nombre de usuario debe tener al menos 5 caracteres');
            usernameInput.classList.add('error');
            return false;
        }
  
        if (username.length > 12) {
            displayError('El nombre de usuario debe tener máximo 12 caracteres');
            usernameInput.classList.add('error');
            return false;
        }
  
        usernameInput.classList.add('valid');
        return true;
    }
  
    // Función para validar contraseña
    function validatePassword() {
        const password = passwordInput.value;
        passwordInput.classList.remove('error', 'valid');
        
        if (!password) {
            displayError('Por favor, ingresa una contraseña');
            passwordInput.classList.add('error');
            return false;
        }
  
        if (password.length < 8) {
            displayError('La contraseña debe tener al menos 8 caracteres');
            passwordInput.classList.add('error');
            return false;
        }
  
        // Verificar si la contraseña tiene al menos una letra mayúscula
        if (!/[A-Z]/.test(password)) {
            displayError('La contraseña debe contener al menos una letra mayúscula');
            passwordInput.classList.add('error');
            return false;
        }
  
        // Verificar si la contraseña tiene al menos un símbolo
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            displayError('La contraseña debe contener al menos un símbolo');
            passwordInput.classList.add('error');
            return false;
        }
  
        passwordInput.classList.add('valid');
        return true;
    }
  
    // Función para validar confirmación de contraseña
    function validateConfirmPassword() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        confirmPasswordInput.classList.remove('error', 'valid');
        
        if (!confirmPassword) {
            displayError('Por favor, confirma tu contraseña');
            confirmPasswordInput.classList.add('error');
            return false;
        }
  
        if (password !== confirmPassword) {
            displayError('Las contraseñas no coinciden');
            confirmPasswordInput.classList.add('error');
            return false;
        }
  
        confirmPasswordInput.classList.add('valid');
        return true;
    }
    
    // Función para mostrar mensajes de error
    function displayError(message) {
        loginMessage.textContent = message;
        loginMessage.style.display = 'block';
    }
  
    // Función para validar todo el formulario
    function validateForm() {
        clearErrorMessages();
        
        // Primero validamos el usuario
        if (!validateUsername()) {
            return false;
        }
        
        // Luego la contraseña
        if (!validatePassword()) {
            return false;
        }
        
        // Finalmente la confirmación
        if (!validateConfirmPassword()) {
            return false;
        }
  
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
            
            // El formulario se enviará normalmente - no redirigimos aquí ya que
            // la redirección la maneja el servidor después del registro exitoso
        }, 800);
    }
  
    // Event Listeners para validaciones al cambiar el valor del campo
    usernameInput.addEventListener('input', function() {
        // Solo validamos si el campo no está vacío
        if (usernameInput.value.trim() !== '') {
            validateUsername();
        } else {
            clearErrorMessages();
            usernameInput.classList.remove('error', 'valid');
        }
    });
  
    passwordInput.addEventListener('input', function() {
        // Solo validamos si el campo no está vacío
        if (passwordInput.value !== '') {
            validatePassword();
            
            // Si hay valor en confirmPasswordInput, validamos también para mantener sincronizados los mensajes
            if (confirmPasswordInput.value !== '') {
                validateConfirmPassword();
            }
        } else {
            clearErrorMessages();
            passwordInput.classList.remove('error', 'valid');
        }
    });
  
    confirmPasswordInput.addEventListener('input', function() {
        // Solo validamos si el campo no está vacío
        if (confirmPasswordInput.value !== '') {
            validateConfirmPassword();
        } else {
            clearErrorMessages();
            confirmPasswordInput.classList.remove('error', 'valid');
        }
    });
    
    // Event Listener para el formulario de registro
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevenir envío del formulario para validar primero
            
            // Validamos el formulario completo antes del envío
            if (validateForm()) {
                // Guardar el nombre de usuario en sessionStorage para utilizarlo en la siguiente página
                sessionStorage.setItem('username', usernameInput.value);
                
                // Activar el efecto de portal
                activateEnhancedPortal();
                
                // Enviar el formulario después de la animación
                setTimeout(() => {
                    this.submit();
                }, 2300);
            }
        });
    }
  
    // Inicializar estrellas al cargar la página
    createStars();
});