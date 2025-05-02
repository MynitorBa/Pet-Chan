import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';

// Configuración
const CONFIG = {
    WORLD_SIZE: 10000,
    INITIAL_POSITION: 5000,
    ACCELERATION: 0.3,
    MAX_SPEED: 6,
    FRICTION: 0.85,
    MIN_VELOCITY: 0.05,
    POSITION_UPDATE_INTERVAL: 50,
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 1000,
    VOICE_MAX_DISTANCE: 800,
    VOICE_FULL_VOLUME_DISTANCE: 200,
    AUDIO_CONTEXT: null,
    RECONNECT_MEDIA_ATTEMPTS: 3,
    RECONNECT_MEDIA_DELAY: 3000,
    BLACK_SCREEN_TIMEOUT: 5000,
    PEER_RECONNECT_DELAY: 2000,
    FULL_RECONNECT_INTERVAL: 5000, 
    BLACK_SCREEN_THRESHOLD: 10, // Valor de brillo para considerar pantalla negra
    BLACK_SCREEN_RETRY_DELAY: 3000, // Tiempo entre reintentos
    MAX_BLACK_SCREEN_RETRIES: 3 // Máximo de reintentos antes de notificar al usuario
};

// Estado del cliente
const state = {
    socket: null,
    roomId: window.location.pathname.split('/')[2],
    userId: `user_${Math.random().toString(36).substring(2, 8)}`,
    users: new Map(),
    peerConnections: new Map(),
    movement: { up: false, down: false, left: false, right: false },
    position: { x: CONFIG.INITIAL_POSITION, y: CONFIG.INITIAL_POSITION },
    velocity: { x: 0, y: 0 },
    lastUpdate: 0,
    mediaStream: null,
    audioStream: null,
    lastPositionUpdateTime: 0,
    audioEnabled: true,
    userGainNodes: new Map(),
    mediaRetryCount: 0,
    blackScreenCheckInterval: null,
    pendingIceCandidates: new Map(),
    lastFullReconnect: 0,
    blackScreenRetries: new Map(), // Contador de reintentos por usuario
    activeVideoChecks: new Map() // Referencias a intervalos activos
};

// Elementos del DOM
const elements = {
    world: document.getElementById('world'),
    viewport: document.getElementById('viewport'),
    positionDisplay: document.getElementById('position-display'),
    roomInfo: document.getElementById('room-info'),
    connectionStatus: document.getElementById('connection-status'),
    controlsInfo: document.getElementById('controls-info'),
    muteButton: document.getElementById('mute-button')
};

// Inicializar la aplicación
async function init() {
    setupSocket();
    setupEventListeners();
    await initMedia();
    startGameLoop();
    updateConnectionStatus('connected');
    
    try {
        CONFIG.AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.error('Error al crear AudioContext:', e);
    }
}

// Configurar Socket.IO con manejo mejorado de nuevos usuarios
function setupSocket() {
    state.socket = io({
        reconnectionAttempts: CONFIG.RECONNECTION_ATTEMPTS,
        reconnectionDelay: CONFIG.RECONNECTION_DELAY
    });

    state.socket.on('connect', () => {
        console.log('Conectado al servidor Socket.IO');
        state.socket.emit('join-room', state.roomId, state.userId);
        updateConnectionStatus('connected');
        
        // Forzar una reconexión completa al conectarse
        setTimeout(() => {
            fullReconnect();
        }, 1000);
    });

    state.socket.on('current-users', (users) => {
        console.log('Usuarios actuales en la sala:', users);
        users.forEach(user => {
            if (!state.users.has(user.id) && user.id !== state.userId) {
                createUserContainer(user.id);
                updateUserPosition(user.id, user.x, user.y);
                createPeerConnection(user.id, true);
            }
        });
    });

    state.socket.on('user-connected', (userId) => {
        console.log(`Nuevo usuario conectado: ${userId}`);
        if (userId !== state.userId && !state.users.has(userId)) {
            createUserContainer(userId);
            
            // Forzar reconexión con todos los usuarios
            setTimeout(() => {
                fullReconnect();
            }, 500);
        }
    });

    state.socket.on('user-disconnected', (userId) => {
        console.log(`Usuario desconectado: ${userId}`);
        closePeerConnection(userId);
        removeUserContainer(userId);
    });

    state.socket.on('user-moved', ({ userId, x, y }) => {
        if (userId !== state.userId && state.users.has(userId)) {
            updateUserPosition(userId, x, y);
            updateVoiceVolume(userId);
        }
    });

    state.socket.on('webrtc-offer', async ({ from, offer }) => {
        console.log(`Oferta recibida de ${from}`);
        if (from !== state.userId) {
            await handleWebRTCOffer(from, offer);
        }
    });

    state.socket.on('webrtc-answer', async ({ from, answer }) => {
        console.log(`Respuesta recibida de ${from}`);
        if (from !== state.userId) {
            await handleWebRTCAnswer(from, answer);
        }
    });

    state.socket.on('webrtc-ice-candidate', async ({ from, candidate }) => {
        if (from !== state.userId) {
            await handleICECandidate(from, candidate);
        }
    });

    state.socket.on('request-connection', async ({ from }) => {
        console.log(`Solicitud de conexión de ${from}`);
        if (from !== state.userId && (state.mediaStream || state.audioStream)) {
            createPeerConnection(from, true);
        }
    });

    state.socket.on('room-full', () => {
        alert('La sala está llena. No se pueden unir más participantes.');
        window.location.href = '/';
    });

    state.socket.on('disconnect', () => {
        console.log('Desconectado del servidor');
        updateConnectionStatus('disconnected');
    });

    state.socket.on('connect_error', (error) => {
        console.error('Error de conexión:', error);
        updateConnectionStatus('error');
    });
}

// Función para reconectar completamente con todos los usuarios
async function fullReconnect() {
    const now = Date.now();
    if (now - state.lastFullReconnect < CONFIG.FULL_RECONNECT_INTERVAL) {
        return;
    }
    state.lastFullReconnect = now;
    
    console.log('Iniciando reconexión completa con todos los usuarios');
    
    // Cerrar todas las conexiones existentes
    state.peerConnections.forEach((pc, userId) => {
        closePeerConnection(userId);
    });
    
    // Esperar un breve momento antes de reconectar
    setTimeout(() => {
        state.users.forEach((user, userId) => {
            if (userId !== state.userId) {
                createPeerConnection(userId, true);
            }
        });
    }, 500);
}

// WebRTC: Crear conexión peer mejorada
async function createPeerConnection(userId, isInitiator = false) {
    try {
        console.log(`Creando conexión con ${userId}, iniciador: ${isInitiator}`);
        
        if (state.peerConnections.has(userId)) {
            console.log(`Cerrando conexión existente con ${userId}`);
            closePeerConnection(userId);
        }
        
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceTransportPolicy: 'all',
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require'
        });

        state.peerConnections.set(userId, peerConnection);

        // Añadir tracks existentes
        if (state.mediaStream) {
            state.mediaStream.getTracks().forEach(track => {
                if (track.kind === 'video') {
                    peerConnection.addTrack(track, state.mediaStream);
                }
            });
        }
        
        if (state.audioStream) {
            state.audioStream.getTracks().forEach(track => {
                if (track.kind === 'audio') {
                    peerConnection.addTrack(track, state.audioStream);
                }
            });
        }

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`Enviando ICE candidate a ${userId}`);
                state.socket.emit('webrtc-ice-candidate', {
                    to: userId,
                    candidate: event.candidate
                });
            }
        };

        peerConnection.onconnectionstatechange = () => {
            console.log(`Estado de conexión con ${userId}: ${peerConnection.connectionState}`);
            
            if (peerConnection.connectionState === 'failed' || 
                peerConnection.connectionState === 'disconnected') {
                console.log(`Reconectando con ${userId}...`);
                setTimeout(() => {
                    closePeerConnection(userId);
                    createPeerConnection(userId, true);
                }, CONFIG.PEER_RECONNECT_DELAY);
            }
        };
        
        peerConnection.oniceconnectionstatechange = () => {
            console.log(`Estado ICE con ${userId}: ${peerConnection.iceConnectionState}`);
            
            if (peerConnection.iceConnectionState === 'failed') {
                console.log(`Reconectando ICE con ${userId}...`);
                setTimeout(() => {
                    closePeerConnection(userId);
                    createPeerConnection(userId, true);
                }, CONFIG.PEER_RECONNECT_DELAY);
            }
        };

        peerConnection.onsignalingstatechange = () => {
            console.log(`Estado de señalización con ${userId}: ${peerConnection.signalingState}`);
        };

        peerConnection.ontrack = (event) => {
            console.log(`Track recibido de ${userId}: ${event.track.kind}`);
            
            if (event.track.kind === 'video') {
                handleVideoTrack(userId, event);
            } else if (event.track.kind === 'audio') {
                handleAudioTrack(userId, event);
            }
        };

        // Manejar candidatos pendientes
        if (state.pendingIceCandidates.has(userId)) {
            const candidates = state.pendingIceCandidates.get(userId);
            console.log(`Aplicando ${candidates.length} ICE candidates pendientes para ${userId}`);
            
            for (const candidate of candidates) {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error(`Error añadiendo ICE candidate pendiente:`, error);
                }
            }
            
            state.pendingIceCandidates.delete(userId);
        }

        if (isInitiator) {
            console.log(`Creando oferta para ${userId}`);
            try {
                const offer = await peerConnection.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true,
                    iceRestart: true
                });
                
                await peerConnection.setLocalDescription(offer);
                
                console.log(`Enviando oferta a ${userId}`);
                state.socket.emit('webrtc-offer', {
                    to: userId,
                    offer: peerConnection.localDescription
                });
            } catch (error) {
                console.error(`Error creando oferta para ${userId}:`, error);
                closePeerConnection(userId);
                setTimeout(() => createPeerConnection(userId, true), 1000);
            }
        }

        return peerConnection;
    } catch (error) {
        console.error(`Error creando conexión WebRTC con ${userId}:`, error);
        
        setTimeout(() => {
            closePeerConnection(userId);
            createPeerConnection(userId, isInitiator);
        }, 1000);
        
        return null;
    }
}
// Función mejorada para manejar video tracks
function handleVideoTrack(userId, event) {
    const remoteStream = event.streams[0] || new MediaStream([event.track]);
    console.log(`Stream de video recibido de ${userId}`);

    const userContainer = state.users.get(userId)?.element;
    if (!userContainer) return;

    let videoEl = userContainer.querySelector('.webcam');
    if (!videoEl) {
        videoEl = document.createElement('video');
        videoEl.className = 'webcam';
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        userContainer.appendChild(videoEl);
    }

    // Limpiar cualquier verificación previa
    stopBlackScreenCheck(userId);

    videoEl.srcObject = remoteStream;
    videoEl.onloadedmetadata = () => {
        console.log(`Video de ${userId} listo para reproducir`);
        videoEl.play().catch(e => console.error('Error reproduciendo video:', e));
        startBlackScreenCheck(userId, videoEl);
    };

    videoEl.onerror = () => {
        console.error(`Error en video de ${userId}`);
        handleBlackScreen(userId);
    };
}

// Función mejorada para iniciar la verificación
function startBlackScreenCheck(userId, videoEl) {
    // Limpiar cualquier verificación previa
    stopBlackScreenCheck(userId);

    console.log(`Iniciando verificación de pantalla negra para ${userId}`);
    const checkInterval = setInterval(() => {
        if (isBlackScreen(videoEl)) {
            console.log(`Pantalla negra detectada para ${userId}`);
            handleBlackScreen(userId);
        }
    }, CONFIG.BLACK_SCREEN_TIMEOUT);

    state.activeVideoChecks.set(userId, checkInterval);
    state.blackScreenRetries.set(userId, 0); // Resetear contador de reintentos
}

// Función mejorada para manejar pantalla negra
function handleBlackScreen(userId) {
    // Detener la verificación actual
    stopBlackScreenCheck(userId);

    // Incrementar contador de reintentos
    const retryCount = state.blackScreenRetries.get(userId) || 0;
    state.blackScreenRetries.set(userId, retryCount + 1);

    if (retryCount >= CONFIG.MAX_BLACK_SCREEN_RETRIES) {
        console.log(`Máximo de reintentos alcanzado para ${userId}`);
        notifyUserAboutBlackScreen(userId);
        return;
    }

    console.log(`Reconectando video de ${userId} (intento ${retryCount + 1})`);
    reconnectUserMedia(userId);
}

// Función para notificar al usuario
function notifyUserAboutBlackScreen(userId) {
    const user = state.users.get(userId);
    if (!user) return;

    const container = user.element;
    const notification = document.createElement('div');
    notification.className = 'video-error-notification';
    notification.textContent = 'Problema con la video llamada. Recargue la página si persiste.';
    container.appendChild(notification);
}

// Función para detener la verificación
function stopBlackScreenCheck(userId) {
    if (state.activeVideoChecks.has(userId)) {
        clearInterval(state.activeVideoChecks.get(userId));
        state.activeVideoChecks.delete(userId);
    }
}

// Función mejorada de detección de pantalla negra
function isBlackScreen(videoEl) {
    if (!videoEl || videoEl.readyState < 2) return false;

    const canvas = document.createElement('canvas');
    canvas.width = 32; // Aumentar tamaño para mejor precisión
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    try {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
            sum += data[i] + data[i + 1] + data[i + 2];
        }
        
        const avg = sum / (data.length / 4 * 3);
        return avg < CONFIG.BLACK_SCREEN_THRESHOLD;
    } catch (e) {
        console.error('Error analizando video:', e);
        return true; // Considerar error como pantalla negra
    }
}

// Función para reconexión de medios
function reconnectUserMedia(userId) {
    if (!state.peerConnections.has(userId)) {
        console.log(`No hay conexión activa para ${userId}`);
        return;
    }

    // Cerrar conexión existente
    closePeerConnection(userId);

    // Esperar un momento antes de reconectar
    setTimeout(() => {
        if (state.mediaStream || state.audioStream) {
            createPeerConnection(userId, true);
        }
    }, CONFIG.BLACK_SCREEN_RETRY_DELAY);
}

// Configuración del AudioContext y manejo de volumen mejorado
function handleAudioTrack(userId, event) {
    try {
        console.log(`Procesando stream de audio de ${userId}`);
        
        if (!CONFIG.AUDIO_CONTEXT) {
            CONFIG.AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)();
            // Solución para navegadores que requieren interacción del usuario
            document.addEventListener('click', () => {
                if (CONFIG.AUDIO_CONTEXT.state === 'suspended') {
                    CONFIG.AUDIO_CONTEXT.resume();
                }
            }, { once: true });
        }

        const audioTrack = event.track;
        const audioStream = event.streams[0] || new MediaStream([audioTrack]);
        
        // Crear elementos de audio
        const audioElement = new Audio();
        audioElement.srcObject = audioStream;
        audioElement.autoplay = true;
        audioElement.volume = 0; // Establecer volumen a 0 inicialmente
        
        // Crear nodos de audio para control de volumen
        const source = CONFIG.AUDIO_CONTEXT.createMediaStreamSource(audioStream);
        const gainNode = CONFIG.AUDIO_CONTEXT.createGain();
        
        // Configurar valores iniciales
        gainNode.gain.value = 0; // Inicializar en 0
        source.connect(gainNode);
        gainNode.connect(CONFIG.AUDIO_CONTEXT.destination);
        
        // Almacenar el nodo de ganancia
        state.userGainNodes.set(userId, gainNode);
        
        // Actualizar volumen basado en distancia
        updateVoiceVolume(userId);
        
        console.log(`Audio de ${userId} configurado correctamente`);
    } catch (error) {
        console.error(`Error procesando audio de ${userId}:`, error);
    }
}

// WebRTC: Manejar ofertas con manejo de estado mejorado
async function handleWebRTCOffer(userId, offer) {
    try {
        console.log(`Manejando oferta de ${userId}`);
        let peerConnection = state.peerConnections.get(userId);
        
        if (!peerConnection) {
            console.log(`Creando nueva conexión para responder a ${userId}`);
            peerConnection = await createPeerConnection(userId, false);
        }
        
        if (!peerConnection) {
            console.error(`No se pudo crear conexión para ${userId}`);
            return;
        }
        
        if (peerConnection.signalingState !== 'stable') {
            console.log(`Restableciendo estado de señalización con ${userId}`);
            await peerConnection.setLocalDescription({type: "rollback"});
        }
        
        console.log(`Estableciendo descripción remota de ${userId}`);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        
        console.log(`Creando respuesta para ${userId}`);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        console.log(`Enviando respuesta a ${userId}`);
        state.socket.emit('webrtc-answer', {
            to: userId,
            answer: peerConnection.localDescription
        });
    } catch (error) {
        console.error(`Error manejando oferta WebRTC de ${userId}:`, error);
        
        if (error.name === 'InvalidStateError') {
            console.log(`Reintentando conexión con ${userId}...`);
            setTimeout(async () => {
                closePeerConnection(userId);
                await createPeerConnection(userId, false);
            }, 1000);
        }
    }
}

// WebRTC: Manejar respuestas con manejo de estado robusto
async function handleWebRTCAnswer(userId, answer) {
    try {
        console.log(`Manejando respuesta de ${userId}`);
        const peerConnection = state.peerConnections.get(userId);
        
        if (!peerConnection) {
            console.error(`No existe conexión con ${userId} para establecer respuesta`);
            return;
        }

        // Verificar el estado de señalización antes de proceder
        if (peerConnection.signalingState !== 'have-local-offer') {
            console.warn(`Estado de señalización inesperado para ${userId}: ${peerConnection.signalingState}, reiniciando conexión...`);
            
            closePeerConnection(userId);
            await createPeerConnection(userId, true);
            return;
        }

        console.log(`Estableciendo descripción remota para ${userId}`);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        
        console.log(`Respuesta de ${userId} establecida correctamente`);
    } catch (error) {
        console.error(`Error manejando respuesta WebRTC de ${userId}:`, error);
        
        if (error.name === 'InvalidStateError' || error.name === 'OperationError') {
            console.log(`Reintentando conexión con ${userId} debido a error de estado...`);
            setTimeout(async () => {
                closePeerConnection(userId);
                await createPeerConnection(userId, true);
            }, 1000);
        }
    }
}

// WebRTC: Manejar ICE candidates con buffer para candidatos tempranos
async function handleICECandidate(userId, candidate) {
    try {
        console.log(`Recibido ICE candidate de ${userId}`);
        const peerConnection = state.peerConnections.get(userId);
        
        if (peerConnection) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.warn(`Error añadiendo ICE candidate a ${userId}, almacenando para intento posterior...`);
                
                // Almacenar candidatos pendientes si hay un error
                if (!state.pendingIceCandidates.has(userId)) {
                    state.pendingIceCandidates.set(userId, []);
                }
                state.pendingIceCandidates.get(userId).push(candidate);
            }
        } else {
            console.log(`No hay conexión para ${userId} aún, almacenando ICE candidate...`);
            
            if (!state.pendingIceCandidates.has(userId)) {
                state.pendingIceCandidates.set(userId, []);
            }
            state.pendingIceCandidates.get(userId).push(candidate);
        }
    } catch (error) {
        console.error(`Error manejando ICE candidate de ${userId}:`, error);
    }
}

// WebRTC: Cerrar conexión peer completamente
function closePeerConnection(userId) {
    console.log(`Cerrando conexión con ${userId}`);
    const peerConnection = state.peerConnections.get(userId);
    
    if (peerConnection) {
        peerConnection.ontrack = null;
        peerConnection.onicecandidate = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onconnectionstatechange = null;
        peerConnection.onsignalingstatechange = null;
        peerConnection.close();
        state.peerConnections.delete(userId);
    }
    
    if (state.userGainNodes.has(userId)) {
        state.userGainNodes.delete(userId);
    }
    
    if (state.pendingIceCandidates.has(userId)) {
        state.pendingIceCandidates.delete(userId);
    }
    
    if (state.peerConnections.size === 0 && state.blackScreenCheckInterval) {
        clearInterval(state.blackScreenCheckInterval);
        state.blackScreenCheckInterval = null;
    }

     // Limpiar verificaciones de pantalla negra
     stopBlackScreenCheck(userId);
     state.blackScreenRetries.delete(userId);
}

// Actualizar estado de conexión
function updateConnectionStatus(status) {
    elements.connectionStatus.className = status;
    elements.connectionStatus.textContent = 
        status === 'connected' ? 'Conectado' :
        status === 'disconnected' ? 'Desconectado' : 'Error de conexión';
}

// Configurar event listeners
function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('resize', updateWorldPosition);
    
    if (elements.muteButton) {
        elements.muteButton.addEventListener('click', toggleMicrophone);
    }
}

// Activar/desactivar micrófono
function toggleMicrophone() {
    if (!state.audioStream) return;
    
    state.audioEnabled = !state.audioEnabled;
    
    state.audioStream.getAudioTracks().forEach(track => {
        track.enabled = state.audioEnabled;
    });
    
    if (elements.muteButton) {
        elements.muteButton.innerHTML = state.audioEnabled ? 
            '<i class="fas fa-microphone"></i>' : 
            '<i class="fas fa-microphone-slash"></i>';
        elements.muteButton.classList.toggle('muted', !state.audioEnabled);
    }
    
    console.log(`Micrófono ${state.audioEnabled ? 'activado' : 'desactivado'}`);
}

// Inicializar cámara y micrófono con reintentos
async function initMedia() {
    try {
        console.log('Solicitando acceso a la cámara y micrófono...');
        
        state.mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 }, 
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        });
        
        state.audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        console.log('Media accedida correctamente');
        state.mediaRetryCount = 0;
        
        const container = createUserContainer(state.userId);
        const video = container.querySelector('.webcam');
        
        video.srcObject = state.mediaStream;
        video.onloadedmetadata = () => {
            console.log('Resolución de video:', video.videoWidth, 'x', video.videoHeight);
            video.play().catch(e => console.error('Error reproduciendo video local:', e));
        };
        
        updateUserPosition(state.userId, state.position.x, state.position.y);
    } catch (error) {
        console.error('Error al acceder a los dispositivos multimedia:', error);
        state.mediaRetryCount++;
        
        if (state.mediaRetryCount < CONFIG.RECONNECT_MEDIA_ATTEMPTS) {
            console.log(`Reintentando obtener medios (intento ${state.mediaRetryCount})...`);
            setTimeout(initMedia, CONFIG.RECONNECT_MEDIA_DELAY);
        } else {
            alert('No se pudo acceder a la cámara o micrófono después de varios intentos. Por favor recarga la página y permite el acceso.');
            createUserContainer(state.userId);
        }
    }
}

// Crear contenedor de usuario
function createUserContainer(userId) {
    if (state.users.has(userId)) return state.users.get(userId).element;

    console.log(`Creando contenedor para ${userId}`);
    const container = document.createElement('div');
    container.className = 'webcam-container';
    container.id = `user-${userId}`;
    
    const video = document.createElement('video');
    video.className = 'webcam';
    video.autoplay = true;
    video.playsInline = true;
    video.muted = (userId === state.userId);
    video.poster = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23111'/%3E%3Ctext x='100' y='75' font-family='Arial' font-size='12' fill='%23ddd' text-anchor='middle'%3ECargando video...%3C/text%3E%3C/svg%3E";
    video.controls = false;
    
    const nameTag = document.createElement('div');
    nameTag.className = 'user-name';
    nameTag.textContent = userId === state.userId ? 'Tú' : userId;
    
    const voiceIndicator = document.createElement('div');
    voiceIndicator.className = 'voice-indicator';
    
    video.onerror = (e) => {
        console.error(`Error en video de ${userId}:`, e);
        reconnectUserMedia(userId);
    };
    
    container.appendChild(video);
    container.appendChild(nameTag);
    container.appendChild(voiceIndicator);
    elements.world.appendChild(container);
    
    state.users.set(userId, {
        element: container,
        x: CONFIG.INITIAL_POSITION,
        y: CONFIG.INITIAL_POSITION
    });
    
    return container;
}

// Eliminar contenedor de usuario
function removeUserContainer(userId) {
    console.log(`Eliminando contenedor de ${userId}`);
    const user = state.users.get(userId);
    if (user) {
        const video = user.element.querySelector('.webcam');
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            if (tracks) {
                tracks.forEach(track => track.stop());
            }
        }
        user.element.remove();
        state.users.delete(userId);
    }
}

// Actualizar posición de usuario
function updateUserPosition(userId, x, y) {
    const user = state.users.get(userId);
    if (!user) return;

    user.x = x;
    user.y = y;
    
    user.element.style.left = `${x}px`;
    user.element.style.top = `${y}px`;
    
    if (userId === state.userId) {
        updateWorldPosition();
        updatePositionDisplay();
        
        state.users.forEach((otherUser, otherUserId) => {
            if (otherUserId !== state.userId) {
                updateVoiceVolume(otherUserId);
            }
        });
    }
}

// Función mejorada para actualizar volumen
function updateVoiceVolume(userId) {
    const gainNode = state.userGainNodes.get(userId);
    if (!gainNode) {
        console.log(`No hay nodo de ganancia para ${userId}`);
        return;
    }
    
    const localUser = state.users.get(state.userId);
    const remoteUser = state.users.get(userId);
    
    if (!localUser || !remoteUser) {
        console.log(`Usuarios no encontrados para cálculo de volumen`);
        return;
    }
    
    // Calcular distancia
    const dx = localUser.x - remoteUser.x;
    const dy = localUser.y - remoteUser.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calcular volumen basado en distancia
    let volume = 0;
    
    if (distance <= CONFIG.VOICE_FULL_VOLUME_DISTANCE) {
        volume = 1.0; // Volumen máximo
    } else if (distance <= CONFIG.VOICE_MAX_DISTANCE) {
        // Reducción lineal del volumen
        volume = 1 - ((distance - CONFIG.VOICE_FULL_VOLUME_DISTANCE) / 
                     (CONFIG.VOICE_MAX_DISTANCE - CONFIG.VOICE_FULL_VOLUME_DISTANCE));
    }
    
    // Asegurarse de que el volumen esté en el rango correcto
    volume = Math.max(0, Math.min(1, volume));
    
    // Aplicar suavizado al cambio de volumen para evitar clicks
    if (CONFIG.AUDIO_CONTEXT) {
        gainNode.gain.setTargetAtTime(
            volume, 
            CONFIG.AUDIO_CONTEXT.currentTime, 
            0.1 // Tiempo de suavizado
        );
    } else {
        gainNode.gain.value = volume;
    }
    
    // Actualizar indicador visual
    updateVoiceIndicator(userId, volume);
    
    console.log(`Volumen actualizado para ${userId}: ${volume.toFixed(2)} (distancia: ${Math.round(distance)})`);
}

// Función para actualizar el indicador visual de voz
function updateVoiceIndicator(userId, volume) {
    const user = state.users.get(userId);
    if (!user) return;
    
    const voiceIndicator = user.element.querySelector('.voice-indicator');
    if (!voiceIndicator) return;
    
    if (volume > 0.01) { // Umbral mínimo para considerar que hay audio
        voiceIndicator.style.display = 'block';
        voiceIndicator.style.opacity = volume;
        voiceIndicator.style.width = `${20 + (volume * 20)}px`;
        voiceIndicator.style.height = `${20 + (volume * 20)}px`;
    } else {
        voiceIndicator.style.display = 'none';
    }
}

// Actualizar vista del mundo
function updateWorldPosition() {
    const user = state.users.get(state.userId);
    if (!user) return;

    const viewportWidth = elements.viewport.clientWidth;
    const viewportHeight = elements.viewport.clientHeight;
    
    const offsetX = viewportWidth / 2 - user.x;
    const offsetY = viewportHeight / 2 - user.y;
    
    elements.world.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
}

// Actualizar display de posición
function updatePositionDisplay() {
    const user = state.users.get(state.userId);
    if (user) {
        elements.positionDisplay.textContent = 
            `Posición: (${Math.round(user.x)}, ${Math.round(user.y)})`;
    }
}

// Manejar teclas presionadas
function handleKeyDown(e) {
    switch(e.key.toLowerCase()) {
        case 'arrowup': case 'w': state.movement.up = true; break;
        case 'arrowdown': case 's': state.movement.down = true; break;
        case 'arrowleft': case 'a': state.movement.left = true; break;
        case 'arrowright': case 'd': state.movement.right = true; break;
        case 'm': toggleMicrophone(); break;
    }
}

// Manejar teclas liberadas
function handleKeyUp(e) {
    switch(e.key.toLowerCase()) {
        case 'arrowup': case 'w': state.movement.up = false; break;
        case 'arrowdown': case 's': state.movement.down = false; break;
        case 'arrowleft': case 'a': state.movement.left = false; break;
        case 'arrowright': case 'd': state.movement.right = false; break;
    }
}

// Bucle de juego
function gameLoop(timestamp) {
    const deltaTime = timestamp - state.lastUpdate;
    state.lastUpdate = timestamp;

    if (state.movement.up) state.velocity.y -= CONFIG.ACCELERATION;
    if (state.movement.down) state.velocity.y += CONFIG.ACCELERATION;
    if (state.movement.left) state.velocity.x -= CONFIG.ACCELERATION;
    if (state.movement.right) state.velocity.x += CONFIG.ACCELERATION;
    
    state.velocity.x = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, state.velocity.x));
    state.velocity.y = Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, state.velocity.y));
    
    if (!state.movement.left && !state.movement.right) state.velocity.x *= CONFIG.FRICTION;
    if (!state.movement.up && !state.movement.down) state.velocity.y *= CONFIG.FRICTION;
    
    if (Math.abs(state.velocity.x) < CONFIG.MIN_VELOCITY) state.velocity.x = 0;
    if (Math.abs(state.velocity.y) < CONFIG.MIN_VELOCITY) state.velocity.y = 0;
    
    const newX = Math.max(0, Math.min(CONFIG.WORLD_SIZE, state.position.x + state.velocity.x));
    const newY = Math.max(0, Math.min(CONFIG.WORLD_SIZE, state.position.y + state.velocity.y));
    
    if (newX !== state.position.x || newY !== state.position.y) {
        state.position.x = newX;
        state.position.y = newY;
        
        updateUserPosition(state.userId, state.position.x, state.position.y);
        
        const now = performance.now();
        if (now - state.lastPositionUpdateTime > CONFIG.POSITION_UPDATE_INTERVAL) {
            state.socket.emit('move', { 
                x: state.position.x, 
                y: state.position.y 
            });
            state.lastPositionUpdateTime = now;
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Limpiar antes de salir
function cleanup() {
    if (state.mediaStream) {
        state.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    if (state.audioStream) {
        state.audioStream.getTracks().forEach(track => track.stop());
    }
    
    state.peerConnections.forEach((connection, userId) => {
        closePeerConnection(userId);
    });
    
    if (state.blackScreenCheckInterval) {
        clearInterval(state.blackScreenCheckInterval);
    }
    
    if (state.fullReconnectInterval) {
        clearInterval(state.fullReconnectInterval);
    }
    
    state.socket.disconnect();
}

// Iniciar bucle de juego
function startGameLoop() {
    state.lastUpdate = performance.now();
    state.lastPositionUpdateTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Inicializar la aplicación
init();