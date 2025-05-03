// Sistema de notificaciones para la tienda de mascotas
class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Crear el contenedor de notificaciones si no existe
        if (!document.querySelector('.notification-container')) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.notification-container');
        }
    }

    show(options) {
        const defaults = {
            title: '',
            message: '',
            type: 'success', // success, error
            duration: 4000,
            closable: true
        };

        const settings = { ...defaults, ...options };

        // Crear la notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${settings.type}`;
        
        // Crear el ícono
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        
        if (settings.type === 'success') {
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        } else {
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        }
        
        // Crear el contenido
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        if (settings.title) {
            const title = document.createElement('div');
            title.className = 'notification-title';
            title.textContent = settings.title;
            content.appendChild(title);
        }
        
        const message = document.createElement('div');
        message.className = 'notification-message';
        message.textContent = settings.message;
        content.appendChild(message);
        
        // Crear el botón de cerrar
        let close = null;
        if (settings.closable) {
            close = document.createElement('div');
            close.className = 'notification-close';
            close.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            close.addEventListener('click', () => this.close(notification));
        }
        
        // Crear la barra de progreso
        const progress = document.createElement('div');
        progress.className = 'notification-progress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'notification-progress-bar';
        progress.appendChild(progressBar);
        
        // Ensamblar la notificación
        notification.appendChild(icon);
        notification.appendChild(content);
        if (close) notification.appendChild(close);
        notification.appendChild(progress);
        
        // Añadir al contenedor
        this.container.appendChild(notification);
        
        // Animar la entrada
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Animación de la barra de progreso
        progressBar.style.transition = `width ${settings.duration}ms linear`;
        setTimeout(() => progressBar.style.width = '0%', 10);
        
        // Temporizador para quitar la notificación
        const timer = setTimeout(() => this.close(notification), settings.duration);
        
        // Pausar el temporizador al pasar el mouse
        notification.addEventListener('mouseenter', () => {
            clearTimeout(timer);
            progressBar.style.transition = 'none';
        });
        
        notification.addEventListener('mouseleave', () => {
            const remainingTime = parseFloat(getComputedStyle(progressBar).width) / parseFloat(getComputedStyle(progress).width) * settings.duration;
            progressBar.style.transition = `width ${remainingTime}ms linear`;
            progressBar.style.width = '0%';
            setTimeout(() => this.close(notification), remainingTime);
        });
        
        return notification;
    }
    
    close(notification) {
        notification.classList.remove('show');
        notification.style.opacity = '0';
        notification.style.height = notification.offsetHeight + 'px';
        
        setTimeout(() => {
            notification.style.height = '0px';
            notification.style.margin = '0px';
            notification.style.padding = '0px';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 300);
    }
    
    success(message, title = 'Éxito') {
        return this.show({
            title: title,
            message: message,
            type: 'success'
        });
    }
    
    error(message, title = 'Error') {
        return this.show({
            title: title,
            message: message,
            type: 'error'
        });
    }
}

// Iniciar el sistema de notificaciones
const notifications = new NotificationSystem();

// Función de confirmación personalizada
function showConfirmation(options) {
    const defaults = {
        title: '¿Estás seguro?',
        message: '',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        onConfirm: () => {},
        onCancel: () => {}
    };

    const settings = { ...defaults, ...options };

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    // Crear panel de confirmación
    const panel = document.createElement('div');
    panel.className = 'confirmation-panel';
    
    // Título
    const title = document.createElement('h3');
    title.textContent = settings.title;
    panel.appendChild(title);
    
    // Mensaje
    if (settings.message) {
        const message = document.createElement('p');
        message.textContent = settings.message;
        panel.appendChild(message);
    }
    
    // Botones
    const buttons = document.createElement('div');
    buttons.className = 'confirmation-buttons';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'action-button confirmation-cancel';
    cancelBtn.textContent = settings.cancelText;
    cancelBtn.addEventListener('click', () => {
        closeConfirmation();
        settings.onCancel();
    });
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'action-button';
    confirmBtn.textContent = settings.confirmText;
    confirmBtn.addEventListener('click', () => {
        closeConfirmation();
        settings.onConfirm();
    });
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(confirmBtn);
    panel.appendChild(buttons);
    
    document.body.appendChild(panel);
    
    // Mostrar con animación
    setTimeout(() => {
        overlay.classList.add('show');
        panel.classList.add('show');
    }, 10);
    
    function closeConfirmation() {
        overlay.classList.remove('show');
        panel.classList.remove('show');
        
        setTimeout(() => {
            document.body.removeChild(overlay);
            document.body.removeChild(panel);
        }, 300);
    }
}

// Modificar funciones AJAX para usar las notificaciones
function setupNotifications() {
    // Adjuntar el sistema de notificaciones al objeto window
    window.notifications = notifications;
    window.showConfirmation = showConfirmation;
    
    // Reemplazar la funcionalidad de las respuestas AJAX
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options) {
        return originalFetch(url, options).then(response => {
            return response.clone().json().then(data => {
                // Para rutas específicas, mostrar notificaciones
                if (url.includes('/comprarItem') || 
                    url.includes('/mascota/comer') || 
                    url.includes('/mascota/jugar') || 
                    url.includes('/corral/guardar')) {
                    
                    if (data.success) {
                        if (data.mensaje) {
                            notifications.success(data.mensaje);
                        }
                    } else {
                        if (data.error || data.mensaje) {
                            notifications.error(data.error || data.mensaje);
                        }
                    }
                }
                
                return response;
            }).catch(() => {
                // Si no es JSON, simplemente devolver la respuesta original
                return response;
            });
        });
    };
    
    // Interceptar llamadas a alert() y confirm()
    const originalAlert = window.alert;
    window.alert = function(message) {
        notifications.show({
            message: message
        });
    };
    
    const originalConfirm = window.confirm;
    window.confirm = function(message) {
        return new Promise((resolve) => {
            showConfirmation({
                message: message,
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            });
        });
    };
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setupNotifications();
});