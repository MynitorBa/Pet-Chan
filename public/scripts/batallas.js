export function iniciarJuego(miRolParam, socketParam, salaIdParam, data) {
    const estadoJuego = {
        fase: 'esperando',
        turno: null,
        ronda: 1,
        bloqueado: false,
        turnos: 0
      };
      

  const jugadores = {
    jugador1: { tipo: null, vida: 500 },
    jugador2: { tipo: null, vida: 500 }
  };

  const elements = {
    typeSelectionScreen: document.getElementById("type-selection-screen"),
    battleScreen: document.getElementById("battle-screen"),
    currentPlayerTypes: document.getElementById("current-player-types"),
    battleLog: document.getElementById("battle-log"),
    battleActions: document.getElementById("battle-actions"),
    jugador1Tipo: document.getElementById("jugador1-tipo"),
    jugador1HealthBar: document.getElementById("jugador1-health-bar"),
    jugador1HealthText: document.getElementById("jugador1-health-text"),
    jugador2Tipo: document.getElementById("jugador2-tipo"),
    jugador2HealthBar: document.getElementById("jugador2-health-bar"),
    jugador2HealthText: document.getElementById("jugador2-health-text"),
    juego: document.getElementById("juego")
  };

  let miRol = miRolParam;
  let socket = socketParam;
  let salaId = salaIdParam;
  let ataquesDeJugador = [];
  let tiposDeJugador = data.tiposDisponibles[miRol];

  mostrarSeleccionTipo(tiposDeJugador);

  socket.on('tipo-seleccionado', ({ jugador, tipo, color }) => {
    jugadores[jugador].tipo = tipo;
    elements[`${jugador}Tipo`].textContent = tipo.toUpperCase();
    elements[`${jugador}Tipo`].style.color = color;
  });

  socket.on('ronda-iniciada', ({ turno, ronda, ataques, vida }) => {
    estadoJuego.turno = turno;
    estadoJuego.ronda = ronda;
    estadoJuego.fase = 'ataque';
    estadoJuego.bloqueado = false;
    ataquesDeJugador = ataques[miRol];
    jugadores.jugador1.vida = vida.jugador1;
    jugadores.jugador2.vida = vida.jugador2;
    actualizarUI();
    mostrarPantallaBatalla();
  });

  socket.on('ataque-procesado', ({ atacante, oponente, ataque, danio, mensajeEfectividad, vida }) => {
    jugadores.jugador1.vida = vida.jugador1;
    jugadores.jugador2.vida = vida.jugador2;
    log(`${atacante} usó ${ataque.name} - ${mensajeEfectividad} - ${danio} daño`);
    actualizarUI();

    if (vida.jugador1 <= 0 || vida.jugador2 <= 0) {
      const ganador = vida.jugador1 <= 0 ? 'jugador2' : 'jugador1';
      finalizarBatalla(ganador);
    }
  });

  socket.on('cambio-turno', (data) => {
    estadoJuego.turno = data.turno;
    jugadores.jugador1.vida = data.vida.jugador1;
    jugadores.jugador2.vida = data.vida.jugador2;
    actualizarUI();
  
    if (estadoJuego.fase === 'ataque') {
      estadoJuego.turnos += 1;
    }
  
    if (estadoJuego.turno === miRol) {
      mostrarBotonesDeAtaque();
      log('¡Es tu turno!');
    } else {
      elements.battleActions.innerHTML = '<div class="waiting-message">Esperando al oponente...</div>';
      log('Turno del oponente.');
    }
  
    // Esperar 2 segundos antes de cambiar de ronda (solo si ambos jugadores atacaron)
    if (estadoJuego.turnos >= 2 && estadoJuego.fase === 'ataque') {
      estadoJuego.turnos = 0;
      estadoJuego.fase = 'seleccion';
      estadoJuego.bloqueado = true;
  
      // ⏳ Delay para leer los mensajes
      setTimeout(() => {
        socket.emit('solicitar-nueva-ronda', { salaId }, (respuesta) => {
          if (!respuesta?.success) {
            log(`Error: ${respuesta?.error || 'Error desconocido'}`);
            estadoJuego.bloqueado = false;
            return;
          }
  
          tiposDeJugador = respuesta.tipos[miRol];
          ataquesDeJugador = respuesta.ataques[miRol];
          estadoJuego.ronda = respuesta.ronda;
          estadoJuego.bloqueado = false;
          mostrarSeleccionTipo(tiposDeJugador);
          log(`¡Ronda ${respuesta.ronda} comenzando!`); // Mensaje opcional
        });
      }, 2000); // 2000 ms = 2 segundos
    }
  });

  socket.on('batalla-terminada', (data) => {
    const ganador = data.ganador;
    finalizarBatalla(ganador, data);
  });
  socket.on('oponente-abandono', () => finalizarBatalla(miRol));
  socket.on('error-batalla', ({ mensaje }) => log(`ERROR: ${mensaje}`));

  function mostrarSeleccionTipo(tipos) {
    estadoJuego.fase = 'seleccion';
  
    // 👇 Esta línea es clave
    elements.juego.style.display = 'block';
  
    elements.typeSelectionScreen.style.display = 'block';
    elements.battleScreen.style.display = 'none';
    elements.currentPlayerTypes.innerHTML = '';
  
    tipos.forEach(tipo => {
      const btn = document.createElement('button');
      btn.className = 'type-btn';
      btn.textContent = tipo.toUpperCase();
      btn.style.backgroundColor = getColorTipo(tipo);
      btn.onclick = () => seleccionarTipo(tipo);
      elements.currentPlayerTypes.appendChild(btn);
    });
  }
  

  function seleccionarTipo(tipo) {
    if (estadoJuego.bloqueado) return;
    socket.emit('seleccionar-tipo-batalla', { salaId, tipo });
    elements.currentPlayerTypes.innerHTML = `<div class="selected-type">${tipo.toUpperCase()}</div>`;
  }

  function mostrarPantallaBatalla() {
    elements.typeSelectionScreen.style.display = 'none';
    elements.battleScreen.style.display = 'block';

    if (estadoJuego.turno === miRol) {
      mostrarBotonesDeAtaque();
    } else {
      elements.battleActions.innerHTML = 'Esperando al oponente...';
    }
  }

  function mostrarBotonesDeAtaque() {
    if (estadoJuego.bloqueado) return;
    elements.battleActions.innerHTML = '';
    ataquesDeJugador.forEach(ataque => {
      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.textContent = `${ataque.name} (${ataque.power})`;
      btn.style.backgroundColor = getColorTipo(ataque.type);
      btn.onclick = () => realizarAtaque(ataque);
      elements.battleActions.appendChild(btn);
    });
  }

  function realizarAtaque(ataque) {
    if (estadoJuego.bloqueado || estadoJuego.turno !== miRol) return;
    socket.emit('realizar-ataque', { salaId, ataque });
    estadoJuego.bloqueado = true;
    elements.battleActions.innerHTML = 'Procesando ataque...';
  }

  function actualizarUI() {
    elements.jugador1HealthBar.style.width = `${(jugadores.jugador1.vida / 500) * 100}%`;
    elements.jugador1HealthText.textContent = `${jugadores.jugador1.vida}/500`;
    elements.jugador2HealthBar.style.width = `${(jugadores.jugador2.vida / 500) * 100}%`;
    elements.jugador2HealthText.textContent = `${jugadores.jugador2.vida}/500`;
  }

  async function finalizarBatalla(ganador) {
    estadoJuego.fase = 'fin';
    estadoJuego.bloqueado = true;
    
    const esGanador = ganador === miRol;
    log(esGanador ? '¡Ganaste! (+5❤️ +20💰)' : 'Perdiste... (+1❤️ +4💰)');
  
    // Mostrar recompensas básicas
    elements.battleActions.innerHTML = `
      <button onclick="location.reload()">Volver</button>
      <div class="recompensa">
        ${esGanador ? '🎉 +5❤️ +20💰' : '💔 +1❤️ +4💰'}
      </div>
      <div id="evolucion-container" style="margin-top:20px;"></div>
    `;
  
    // Esperar 1s y verificar evolución
    setTimeout(async () => {
      try {
        const response = await fetch('/actualizar-sesion-batalla', {
          method: 'POST',
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.evoluciono) {
          mostrarAnimacionEvolucion(data.nuevaImagen);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }, 1000);
  }
  
  // Variable para controlar el estado de la animación
let estaMostrandoEvolucion = false;

function mostrarAnimacionEvolucion(nuevaImagen) {
  if (estaMostrandoEvolucion) return;
  estaMostrandoEvolucion = true;
  
  // Crear overlay
  const overlay = document.createElement('div');
  overlay.className = 'animacion-evolucion-overlay';
  
  // Contenido de la animación
  overlay.innerHTML = `
    <div class="destello-epico"></div>
    <div class="efecto-confeti" id="confeti-container"></div>
    <div class="evolucion-contenido">
      <img src="/${nuevaImagen}" class="mascota-evolucionando"
          style="image-rendering: pixelated;
            image-rendering: crisp-edges;">
      <div class="mensaje-evolucion">¡EVOLUCIÓN!</div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Generar confeti
  generarConfeti();
  
  // Actualizar la imagen permanente después de la animación
  setTimeout(() => {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
      estaMostrandoEvolucion = false;
      
      // Solo actualizamos la imagen cuando el usuario haga click en "Volver"
      // La imagen se actualizará al recargar la página
    }, 1000);
  }, 7000); // 7 segundos totales (6s animación + 1s fade out)
}

function generarConfeti() {
  const container = document.getElementById('confeti-container');
  if (!container) return;
  
  const colores = [
    '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#ff00ff', '#00ffff',
    '#ff9900', '#9900ff', '#00ff99',
    '#ff3366', '#66ff33', '#3366ff'
  ];
  
  const formas = ['circle', 'square', 'triangle'];
  const count = 150; // Más partículas de confeti

  // Limpiar confeti existente
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const confeti = document.createElement('div');
    confeti.className = 'confeti';
    
    // Estilo aleatorio
    const color = colores[Math.floor(Math.random() * colores.length)];
    confeti.style.setProperty('--random-x', (Math.random() * 2 - 1)); // Para movimiento horizontal
    
    const forma = formas[Math.floor(Math.random() * formas.length)];
    
    if (forma === 'circle') {
      confeti.style.borderRadius = '50%';
      confeti.style.backgroundColor = color;
    } 
    else if (forma === 'square') {
      confeti.style.backgroundColor = color;
    }
    else { // triangle
      confeti.style.width = '0';
      confeti.style.height = '0';
      confeti.style.borderLeft = '8px solid transparent';
      confeti.style.borderRight = '8px solid transparent';
      confeti.style.borderBottom = `16px solid ${color}`;
      confeti.style.backgroundColor = 'transparent';
    }
    
    confeti.style.left = `${Math.random() * 100}%`;
    confeti.style.width = `${8 + Math.random() * 12}px`;
    confeti.style.height = `${8 + Math.random() * 12}px`;
    confeti.style.animationDelay = `${Math.random() * 2}s`;
    confeti.style.animationDuration = `${4 + Math.random() * 3}s`;
    
    container.appendChild(confeti);
  }
}

// Manejador del socket
socket.on('mascota-evolucionada', ({ nuevaImagen }) => {
  mostrarAnimacionEvolucion(nuevaImagen);
});

  function log(mensaje) {
    const e = document.createElement('div');
    e.textContent = mensaje;
    elements.battleLog.appendChild(e);
    elements.battleLog.scrollTop = elements.battleLog.scrollHeight;
  }

  function getColorTipo(tipo) {
    const colores = {
      fuego: '#f39c12', agua: '#3498db', planta: '#2ecc71', electrico: '#f1c40f',
      tierra: '#d35400', hielo: '#98d8d8', volador: '#a890f0', veneno: '#a040a0',
      psiquico: '#f85888', lucha: '#c03028', fantasma: '#705898', acero: '#b8b8d0',
      dragon: '#7038f8', siniestro: '#705848', normal: '#a8a878'
    };
    return colores[tipo.toLowerCase()] || '#95a5a6';
  }
}
