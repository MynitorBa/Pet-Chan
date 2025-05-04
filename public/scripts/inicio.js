// Variable global para almacenar el ID del usuario actual
let currentUserId = null;

// Función para obtener el ID del usuario actual
async function obtenerUsuarioActual() {
    try {
        const response = await fetch('/api/usuario/actual');
        if (response.ok) {
            const data = await response.json();
            currentUserId = data.userId;
        }
    } catch (error) {
        console.error('Error al obtener usuario actual:', error);
    }
}

// Llamar a esta función al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await obtenerUsuarioActual();
    
    // Cargar publicaciones
    cargarPublicaciones();
    
    // Cargar comunidades
    cargarComunidades();

    // Animación sutil de entrada para los elementos
    setTimeout(() => {
        document.querySelector('.banner-principal').classList.add('visible');
    }, 100);
});

// Función para cargar las publicaciones desde el servidor
async function cargarPublicaciones() {
    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error('Error al obtener publicaciones');
        }
        
        const posts = await response.json();
        // Ordenar por ranking (votos) y limitar a 8
        const postsDestacados = posts
            .sort((a, b) => b.ranking - a.ranking)
            .slice(0, 8);
            
        renderizarPublicaciones(postsDestacados);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('publicaciones-container').innerHTML = 
            '<div class="error-mensaje">Error al cargar publicaciones. Intenta nuevamente más tarde.</div>';
    }
}

function renderizarPublicaciones(posts) {
    const container = document.getElementById('publicaciones-container');
    container.innerHTML = ''; // Limpiar contenedor
    
    // Contenedor para título y botón ver todos
    const headerContainer = document.createElement('div');
    headerContainer.classList.add('seccion-header');
    
    // Agregar título
    const titulo = document.createElement('h2');
    titulo.classList.add('titulo-seccion');
    titulo.innerHTML = `<i class="fas fa-fire"></i> Publicaciones destacadas`;
    headerContainer.appendChild(titulo);
    
    // Agregar botón ver todos
    const verTodosBtn = document.createElement('a');
    verTodosBtn.classList.add('ver-todos-btn');
    verTodosBtn.href = '/foro';
    verTodosBtn.innerHTML = 'Ver todas <i class="fas fa-arrow-right"></i>';
    headerContainer.appendChild(verTodosBtn);
    
    container.appendChild(headerContainer);
    
    // Contenedor de tarjetas
    const cardsGrid = document.createElement('div');
    cardsGrid.classList.add('cards-grid');
    container.appendChild(cardsGrid);
    
    posts.forEach((post, index) => {
        const postCard = document.createElement('div');
        postCard.classList.add('publicacion-card');
        postCard.dataset.ranking = post.ranking; // Para aplicar estilos según ranking
        
        // Añadir clases de destacado según posición
        if (index === 0) {
            postCard.classList.add('destacado-oro', 'glowing-effect');
        } else if (index === 1) {
            postCard.classList.add('destacado-oro');
        } else if (index === 2) {
            postCard.classList.add('destacado-plata');
        } else if (index === 3) {
            postCard.classList.add('destacado-plata');
        } else if (index < 8) {
            postCard.classList.add('destacado-bronce');
        }
        
        // Agregar SVG de fondo para todas las publicaciones
        const backgroundContainer = document.createElement('div');
        backgroundContainer.classList.add('publicacion-background');
        
        // Crear SVG para el fondo de la publicación
        const svg = crearSVGFondo(index, post.id || index);
        backgroundContainer.appendChild(svg);
        postCard.appendChild(backgroundContainer);
        
        // Acortar mensaje si es muy largo
        const mensajeCorto = post.mensaje.length > 100 
            ? post.mensaje.substring(0, 100) + '...' 
            : post.mensaje;
        
        // Crear elementos para el autor y mensaje con clases específicas para manejar overflow
        const autorSpan = document.createElement('span');
        autorSpan.classList.add('publicacion-autor', 'texto-ellipsis');
        autorSpan.textContent = post.autor_nombre || post.autor;
        
        const mensajeDiv = document.createElement('div');
        mensajeDiv.classList.add('publicacion-mensaje', 'texto-ellipsis');
        mensajeDiv.textContent = mensajeCorto;
        
        // Header con autor
        const headerDiv = document.createElement('div');
        headerDiv.classList.add('publicacion-header');
        headerDiv.appendChild(autorSpan);
        
        // Contenido con mensaje y ranking
        const contenidoDiv = document.createElement('div');
        contenidoDiv.classList.add('publicacion-contenido');
        
        // Agregar el mensaje al contenido
        contenidoDiv.appendChild(mensajeDiv);
        
        // Crear y agregar el elemento de ranking
        const rankingDiv = document.createElement('div');
        rankingDiv.classList.add('publicacion-ranking');
        rankingDiv.innerHTML = `<i class="fas fa-star"></i> ${post.ranking || 0}`;
        contenidoDiv.appendChild(rankingDiv);
        
        // Footer con etiquetas y comunidad
        const footerDiv = document.createElement('div');
        footerDiv.classList.add('publicacion-footer');
        
        // Contenedor de etiquetas
        const etiquetasDiv = document.createElement('div');
        etiquetasDiv.classList.add('etiquetas-container');
        
        // Agregar etiquetas si existen
        if (post.etiqueta) {
            const etiquetaSpan = document.createElement('span');
            etiquetaSpan.classList.add('etiqueta', 'texto-ellipsis');
            etiquetaSpan.textContent = post.etiqueta;
            etiquetasDiv.appendChild(etiquetaSpan);
        }
        
        if (post.subcategoria && post.subcategoria !== 'Ninguna') {
            const subcategoriaSpan = document.createElement('span');
            subcategoriaSpan.classList.add('etiqueta', 'texto-ellipsis');
            subcategoriaSpan.textContent = post.subcategoria;
            etiquetasDiv.appendChild(subcategoriaSpan);
        }
        
        footerDiv.appendChild(etiquetasDiv);
        
        // Agregar badge de comunidad si existe
        if (post.comunidad_nombre) {
            const comunidadDiv = document.createElement('div');
            comunidadDiv.classList.add('comunidad-badge', 'texto-ellipsis');
            comunidadDiv.textContent = post.comunidad_nombre;
            footerDiv.appendChild(comunidadDiv);
        }
        
        // Añadir medallas o cintas según posición
        if (index === 0) {
            const cintaDiv = document.createElement('div');
            cintaDiv.classList.add('cinta-top', 'oro');
            cintaDiv.textContent = 'TOP #1';
            postCard.appendChild(cintaDiv);
            
            const medallaDiv = document.createElement('div');
            medallaDiv.classList.add('medalla-badge', 'medalla-oro');
            medallaDiv.innerHTML = '<i class="fas fa-trophy"></i>';
            postCard.appendChild(medallaDiv);
        } else if (index === 1) {
            const medallaDiv = document.createElement('div');
            medallaDiv.classList.add('medalla-badge', 'medalla-oro');
            medallaDiv.innerHTML = '<i class="fas fa-trophy"></i>';
            postCard.appendChild(medallaDiv);
        } else if (index === 2) {
            const medallaDiv = document.createElement('div');
            medallaDiv.classList.add('medalla-badge', 'medalla-plata');
            medallaDiv.innerHTML = '<i class="fas fa-medal"></i>';
            postCard.appendChild(medallaDiv);
        } else if (index === 3) {
            const medallaDiv = document.createElement('div');
            medallaDiv.classList.add('medalla-badge', 'medalla-plata');
            medallaDiv.innerHTML = '<i class="fas fa-medal"></i>';
            postCard.appendChild(medallaDiv);
        } else if (index < 8) {
            const medallaDiv = document.createElement('div');
            medallaDiv.classList.add('medalla-badge', 'medalla-bronce');
            medallaDiv.innerHTML = '<i class="fas fa-award"></i>';
            postCard.appendChild(medallaDiv);
        }
        
        // Ensamblar la tarjeta
        postCard.appendChild(headerDiv);
        postCard.appendChild(contenidoDiv);
        postCard.appendChild(footerDiv);
        
        // CAMBIO: Hacer que la tarjeta sea clickeable y redirija a la página de foro
        postCard.style.cursor = 'pointer';
        postCard.addEventListener('click', () => {
            window.location.href = '/foro';
        });
        
        cardsGrid.appendChild(postCard);
    });
    
    // Agregar animaciones después de renderizar
    setTimeout(() => {
        const cards = document.querySelectorAll('.publicacion-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.4s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 100);
        });
    }, 200);
}

// Función para crear SVGs personalizados según la posición - Versión Mejorada
function crearSVGFondo(index, postId) {
    // Crear un elemento SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add('publicacion-svg-fondo');
    svg.setAttribute('viewBox', '0 0 300 150');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    
    // Colores y configuraciones basadas en la posición
    const configs = {
        0: { // TOP #1 Oro - Efecto premium
            colors: {
                primary: '#FFD700',
                secondary: '#FFA500',
                accent1: '#FFEB3B',
                accent2: '#FF6F00',
                glow: 'rgba(255, 215, 0, 0.8)'
            },
            pattern: {
                size: 15,
                opacity: 0.3,
                shape: 'hex' // hexágono para el número 1
            },
            effects: {
                bubbles: true, 
                shine: true,
                starfield: true,
                radialGlow: true
            },
            waves: {
                count: 3,
                amplitude: 20,
                thickness: 8,
                opacity: 0.4
            }
        },
        1: { // #2 Oro
            colors: {
                primary: '#FFC107',
                secondary: '#FF9800',
                accent1: '#FFE082',
                accent2: '#F57C00',
                glow: 'rgba(255, 193, 7, 0.6)'
            },
            pattern: {
                size: 12,
                opacity: 0.25,
                shape: 'diamond'
            },
            effects: {
                bubbles: true,
                shine: true,
                starfield: true
            },
            waves: {
                count: 2,
                amplitude: 15,
                thickness: 6,
                opacity: 0.35
            }
        },
        2: { // #3 Plata
            colors: {
                primary: '#C0C0C0',
                secondary: '#A0A0A0',
                accent1: '#E0E0E0',
                accent2: '#757575',
                glow: 'rgba(192, 192, 192, 0.5)'
            },
            pattern: {
                size: 10,
                opacity: 0.2,
                shape: 'triangle'
            },
            effects: {
                bubbles: true,
                shine: true
            },
            waves: {
                count: 2,
                amplitude: 12,
                thickness: 5,
                opacity: 0.3
            }
        },
        3: { // #4 Plata
            colors: {
                primary: '#BDBDBD',
                secondary: '#9E9E9E',
                accent1: '#E0E0E0',
                accent2: '#616161',
                glow: 'rgba(189, 189, 189, 0.4)'
            },
            pattern: {
                size: 8,
                opacity: 0.2,
                shape: 'square'
            },
            effects: {
                bubbles: true
            },
            waves: {
                count: 1,
                amplitude: 10,
                thickness: 5,
                opacity: 0.25
            }
        },
        default: { // Bronce para posiciones 5-8
            colors: {
                primary: '#CD7F32',
                secondary: '#A05A2C',
                accent1: '#E8A068',
                accent2: '#884400',
                glow: 'rgba(205, 127, 50, 0.3)'
            },
            pattern: {
                size: 6,
                opacity: 0.15,
                shape: 'dot'
            },
            effects: {
                bubbles: false
            },
            waves: {
                count: 1,
                amplitude: 8,
                thickness: 4,
                opacity: 0.2
            }
        }
    };
    
    // Obtener configuración según índice
    const config = index < 4 ? configs[index] : configs.default;
    
    // Crear definiciones (defs) para gradientes, patrones y efectos
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    // Crear gradiente principal
    const mainGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    mainGradient.setAttribute('id', `grad-post-main-${postId}`);
    mainGradient.setAttribute('x1', '0%');
    mainGradient.setAttribute('y1', '0%');
    mainGradient.setAttribute('x2', '100%');
    mainGradient.setAttribute('y2', '100%');
    
    const mainStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    mainStop1.setAttribute('offset', '0%');
    mainStop1.setAttribute('stop-color', config.colors.primary);
    mainStop1.setAttribute('stop-opacity', '0.4');
    
    const mainStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    mainStop2.setAttribute('offset', '100%');
    mainStop2.setAttribute('stop-color', config.colors.secondary);
    mainStop2.setAttribute('stop-opacity', '0.2');
    
    mainGradient.appendChild(mainStop1);
    mainGradient.appendChild(mainStop2);
    defs.appendChild(mainGradient);
    
    // Gradiente radial para efecto de resplandor (solo para top posiciones)
    if (config.effects.radialGlow) {
        const radialGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
        radialGradient.setAttribute('id', `grad-post-radial-${postId}`);
        radialGradient.setAttribute('cx', '50%');
        radialGradient.setAttribute('cy', '50%');
        radialGradient.setAttribute('r', '70%');
        radialGradient.setAttribute('fx', '50%');
        radialGradient.setAttribute('fy', '50%');
        
        const radialStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        radialStop1.setAttribute('offset', '0%');
        radialStop1.setAttribute('stop-color', config.colors.glow);
        radialStop1.setAttribute('stop-opacity', '0.7');
        
        const radialStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        radialStop2.setAttribute('offset', '70%');
        radialStop2.setAttribute('stop-color', config.colors.glow);
        radialStop2.setAttribute('stop-opacity', '0.2');
        
        const radialStop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        radialStop3.setAttribute('offset', '100%');
        radialStop3.setAttribute('stop-color', config.colors.glow);
        radialStop3.setAttribute('stop-opacity', '0');
        
        radialGradient.appendChild(radialStop1);
        radialGradient.appendChild(radialStop2);
        radialGradient.appendChild(radialStop3);
        defs.appendChild(radialGradient);
    }
    
    // Crear filtros para efectos de iluminación
    if (config.effects.shine) {
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute('id', `shine-${postId}`);
        filter.setAttribute('x', '-50%');
        filter.setAttribute('y', '-50%');
        filter.setAttribute('width', '200%');
        filter.setAttribute('height', '200%');
        
        // Añadir efectos de brillo
        const feSpecularLighting = document.createElementNS("http://www.w3.org/2000/svg", "feSpecularLighting");
        feSpecularLighting.setAttribute('result', 'specOut');
        feSpecularLighting.setAttribute('specularExponent', '20');
        feSpecularLighting.setAttribute('lighting-color', 'white');
        
        const fePointLight = document.createElementNS("http://www.w3.org/2000/svg", "fePointLight");
        fePointLight.setAttribute('x', '150');
        fePointLight.setAttribute('y', '60');
        fePointLight.setAttribute('z', '20');
        
        feSpecularLighting.appendChild(fePointLight);
        filter.appendChild(feSpecularLighting);
        
        const feComposite = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
        feComposite.setAttribute('in', 'specOut');
        feComposite.setAttribute('in2', 'SourceGraphic');
        feComposite.setAttribute('operator', 'arithmetic');
        feComposite.setAttribute('k1', '0');
        feComposite.setAttribute('k2', '1');
        feComposite.setAttribute('k3', '1');
        feComposite.setAttribute('k4', '0');
        
        filter.appendChild(feComposite);
        defs.appendChild(filter);
    }
    
    // Crear patrones según la forma configurada
    const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    pattern.setAttribute('id', `pattern-post-${postId}`);
    pattern.setAttribute('width', config.pattern.size * 2);
    pattern.setAttribute('height', config.pattern.size * 2);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('patternTransform', 'rotate(45)');
    
    // Crear forma según configuración
    switch(config.pattern.shape) {
        case 'hex':
            const hex = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            const size = config.pattern.size;
            hex.setAttribute('points', `
                ${size},${size/2} 
                ${size*0.75},${size*0.93} 
                ${size*0.25},${size*0.93} 
                ${0},${size/2} 
                ${size*0.25},${size*0.07} 
                ${size*0.75},${size*0.07}
            `);
            hex.setAttribute('fill', config.colors.accent1);
            hex.setAttribute('fill-opacity', config.pattern.opacity);
            pattern.appendChild(hex);
            break;
            
        case 'diamond':
            const diamond = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            const dSize = config.pattern.size;
            diamond.setAttribute('points', `
                ${dSize},0 
                ${dSize*2},${dSize} 
                ${dSize},${dSize*2} 
                0,${dSize}
            `);
            diamond.setAttribute('fill', config.colors.accent1);
            diamond.setAttribute('fill-opacity', config.pattern.opacity);
            pattern.appendChild(diamond);
            break;
            
        case 'triangle':
            const triangle = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            const tSize = config.pattern.size;
            triangle.setAttribute('points', `
                ${tSize},0 
                ${tSize*2},${tSize*1.732} 
                0,${tSize*1.732}
            `);
            triangle.setAttribute('fill', config.colors.accent1);
            triangle.setAttribute('fill-opacity', config.pattern.opacity);
            pattern.appendChild(triangle);
            break;
            
        case 'square':
            const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            square.setAttribute('x', config.pattern.size * 0.2);
            square.setAttribute('y', config.pattern.size * 0.2);
            square.setAttribute('width', config.pattern.size * 0.6);
            square.setAttribute('height', config.pattern.size * 0.6);
            square.setAttribute('fill', config.colors.accent1);
            square.setAttribute('fill-opacity', config.pattern.opacity);
            pattern.appendChild(square);
            break;
            
        case 'dot':
        default:
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute('cx', config.pattern.size);
            dot.setAttribute('cy', config.pattern.size);
            dot.setAttribute('r', config.pattern.size * 0.3);
            dot.setAttribute('fill', config.colors.accent1);
            dot.setAttribute('fill-opacity', config.pattern.opacity);
            pattern.appendChild(dot);
            break;
    }
    
    defs.appendChild(pattern);
    svg.appendChild(defs);
    
    // Crear el fondo base con el gradiente principal
    const baseRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    baseRect.setAttribute('width', '100%');
    baseRect.setAttribute('height', '100%');
    baseRect.setAttribute('fill', `url(#grad-post-main-${postId})`);
    svg.appendChild(baseRect);
    
    // Añadir efecto de resplandor radial para top posiciones
    if (config.effects.radialGlow) {
        const glowRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        glowRect.setAttribute('width', '100%');
        glowRect.setAttribute('height', '100%');
        glowRect.setAttribute('fill', `url(#grad-post-radial-${postId})`);
        svg.appendChild(glowRect);
    }
    
    // Añadir el patrón como capa
    const patternRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    patternRect.setAttribute('width', '100%');
    patternRect.setAttribute('height', '100%');
    patternRect.setAttribute('fill', `url(#pattern-post-${postId})`);
    svg.appendChild(patternRect);
    
    // Añadir ondas decorativas con efecto de animación
    for (let i = 0; i < config.waves.count; i++) {
        const wave = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const amp = config.waves.amplitude * (1 - i * 0.2); // Amplitud decreciente
        const yOffset = 75 + i * 20; // Posición Y variable
        
        // Crear una onda sinusoidal
        wave.setAttribute('d', `M0,${yOffset} Q75,${yOffset-amp} 150,${yOffset} T300,${yOffset}`);
        wave.setAttribute('stroke', config.colors.accent1);
        wave.setAttribute('stroke-width', config.waves.thickness - i);
        wave.setAttribute('fill', 'none');
        wave.setAttribute('stroke-opacity', config.waves.opacity);
        
        // Añadir efecto de brillo si está configurado
        if (config.effects.shine) {
            wave.setAttribute('filter', `url(#shine-${postId})`);
        }
        
        svg.appendChild(wave);
    }
    
    // Añadir círculos decorativos (burbujas)
    if (config.effects.bubbles) {
        // Círculos grandes decorativos con gradiente
        const circle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle1.setAttribute('cx', '50');
        circle1.setAttribute('cy', '30');
        circle1.setAttribute('r', index === 0 ? '45' : '35');
        circle1.setAttribute('fill', config.colors.accent1);
        circle1.setAttribute('fill-opacity', '0.2');
        svg.appendChild(circle1);
        
        const circle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle2.setAttribute('cx', '250');
        circle2.setAttribute('cy', '100');
        circle2.setAttribute('r', index === 0 ? '50' : '40');
        circle2.setAttribute('fill', config.colors.accent2);
        circle2.setAttribute('fill-opacity', '0.15');
        svg.appendChild(circle2);
        
        // Añadir pequeñas burbujas adicionales
        const bubblesCount = index === 0 ? 12 : index < 3 ? 8 : 5;
        for (let i = 0; i < bubblesCount; i++) {
            const bubble = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            const bubbleX = Math.random() * 280 + 10; // Posición X aleatoria
            const bubbleY = Math.random() * 130 + 10; // Posición Y aleatoria
            const bubbleSize = Math.random() * 5 + 2; // Tamaño aleatorio
            
            bubble.setAttribute('cx', bubbleX);
            bubble.setAttribute('cy', bubbleY);
            bubble.setAttribute('r', bubbleSize);
            bubble.setAttribute('fill', i % 2 === 0 ? config.colors.accent1 : config.colors.accent2);
            bubble.setAttribute('fill-opacity', '0.3');
            svg.appendChild(bubble);
        }
    }
    
    // Añadir campo de estrellas para top posiciones
    if (config.effects.starfield) {
        const starsCount = index === 0 ? 15 : index === 1 ? 10 : 5;
        for (let i = 0; i < starsCount; i++) {
            const star = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            const starX = Math.random() * 280 + 10;
            const starY = Math.random() * 130 + 10;
            const starSize = index === 0 ? Math.random() * 4 + 3 : Math.random() * 3 + 2;
            
            // Crear estrella con puntas
            star.setAttribute('points', `
                ${starX},${starY-starSize} 
                ${starX+starSize/4},${starY-starSize/4} 
                ${starX+starSize},${starY} 
                ${starX+starSize/4},${starY+starSize/4} 
                ${starX},${starY+starSize} 
                ${starX-starSize/4},${starY+starSize/4} 
                ${starX-starSize},${starY} 
                ${starX-starSize/4},${starY-starSize/4}
            `);
            star.setAttribute('fill', 'white');
            star.setAttribute('fill-opacity', Math.random() * 0.3 + 0.4);
            svg.appendChild(star);
        }
    }
    
    // Para el TOP #1, añadir elementos especiales adicionales
    if (index === 0) {
        // Destellos especiales
        for (let i = 0; i < 4; i++) {
            const destello = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            const destelloX = 30 + i * 80;
            const destelloY = 30 + (i % 2) * 90;
            const destelloSize = Math.random() * 8 + 8;
            
            destello.setAttribute('points', `
                ${destelloX},${destelloY-destelloSize} 
                ${destelloX+destelloSize/3},${destelloY-destelloSize/3} 
                ${destelloX+destelloSize},${destelloY} 
                ${destelloX+destelloSize/3},${destelloY+destelloSize/3} 
                ${destelloX},${destelloY+destelloSize} 
                ${destelloX-destelloSize/3},${destelloY+destelloSize/3} 
                ${destelloX-destelloSize},${destelloY} 
                ${destelloX-destelloSize/3},${destelloY-destelloSize/3}
            `);
            destello.setAttribute('fill', 'white');
            destello.setAttribute('fill-opacity', '0.8');
            svg.appendChild(destello);
        }
    }
    
    return svg;
}

// Esta función ha sido eliminada ya que los estilos se incluyen en un archivo CSS separado

// Ejecutar esta función cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    // El código existente sin inyectar los estilos CSS
    cargarPublicaciones();
    cargarComunidades();
    
    setTimeout(() => {
        document.querySelector('.banner-principal').classList.add('visible');
    }, 100);
});



// Función para cargar las comunidades desde el servidor
async function cargarComunidades() {
    try {
        // Modificar la URL para incluir el usuario actual en la consulta
        const response = await fetch('/api/comunidades?incluir_membresia=true');
        if (!response.ok) {
            throw new Error('Error al obtener comunidades');
        }
        
        const comunidades = await response.json();
        
        // Primero ordenamos por total_miembros y luego por total_posts
        const comunidadesOrdenadas = comunidades
            .sort((a, b) => b.total_miembros - a.total_miembros || b.total_posts - a.total_posts)
            .slice(0, 6); // Limitar a 6 comunidades destacadas
            
        renderizarComunidades(comunidadesOrdenadas);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('comunidades-container').innerHTML = 
            '<div class="error-mensaje">Error al cargar comunidades. Intenta nuevamente más tarde.</div>';
    }
}
// Función para renderizar las comunidades
function renderizarComunidades(comunidades) {
    const container = document.getElementById('comunidades-container');
    container.innerHTML = ''; // Limpiar contenedor
    
    // Contenedor para título y botón ver todos
    const headerContainer = document.createElement('div');
    headerContainer.classList.add('seccion-header');
    
    // Agregar título
    const titulo = document.createElement('h2');
    titulo.classList.add('titulo-seccion');
    titulo.innerHTML = `<i class="fas fa-users"></i> Comunidades populares`;
    headerContainer.appendChild(titulo);
    
    // Agregar botón ver todos
    const verTodosBtn = document.createElement('a');
    verTodosBtn.classList.add('ver-todos-btn');
    verTodosBtn.href = '/comunidad';
    verTodosBtn.innerHTML = 'Ver todas <i class="fas fa-arrow-right"></i>';
    headerContainer.appendChild(verTodosBtn);
    
    container.appendChild(headerContainer);
    
    // Contenedor de tarjetas
    const cardsGrid = document.createElement('div');
    cardsGrid.classList.add('cards-grid', 'comunidades-grid');
    container.appendChild(cardsGrid);
    
    comunidades.forEach((comunidad, index) => {
        const comunidadCard = document.createElement('div');
        comunidadCard.classList.add('comunidad-card');
        
        // Aplicar clases de destacado según posición
        if (index === 0) {
            comunidadCard.classList.add('destacado-oro', 'glowing-effect');
        } else if (index === 1) {
            comunidadCard.classList.add('destacado-oro');
        } else if (index === 2) {
            comunidadCard.classList.add('destacado-plata');
        } else if (index === 3) {
            comunidadCard.classList.add('destacado-plata');
        } else if (index < 6) {
            comunidadCard.classList.add('destacado-bronce');
        }
        
        // Acortar descripción
        const descripcionCorta = comunidad.descripcion?.length > 80 
            ? comunidad.descripcion.substring(0, 80) + '...' 
            : comunidad.descripcion || '';

        // Crear contenedor para la imagen
        const imagenContainer = document.createElement('div');
        imagenContainer.classList.add('comunidad-imagen-container');
        
        // Añadir cinta Top #1 para la primera comunidad
        if (index === 0) {
            const cintaTop = document.createElement('div');
            cintaTop.classList.add('cinta-top', 'oro');
            cintaTop.textContent = 'TOP #1';
            comunidadCard.appendChild(cintaTop);
        }
        
        // Si la comunidad no tiene imagen, mostrar SVG
        if (!comunidad.imagen_url) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.classList.add('tarjeta-comunidad-imagen');
            svg.setAttribute('viewBox', '0 0 800 500');
            svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            
            // Crear los elementos SVG (defs, gradientes, etc.)
            svg.innerHTML = `
                <defs>
                    <linearGradient id="grad${comunidad.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#3d0099;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#6f42ff;stop-opacity:0.6" />
                    </linearGradient>
                    <pattern id="pattern${comunidad.id}" width="50" height="50" patternUnits="userSpaceOnUse">
                        <circle cx="25" cy="25" r="12" fill="rgba(0, 234, 255, 0.15)" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad${comunidad.id})" />
                <rect width="100%" height="100%" fill="url(#pattern${comunidad.id})" />
            
                <circle cx="150" cy="100" r="80" fill="rgba(111, 66, 255, 0.3)" />
                <circle cx="650" cy="400" r="120" fill="rgba(0, 178, 255, 0.2)" />
                <path d="M0,250 Q200,150 400,250 T800,250" stroke="rgba(0, 234, 255, 0.3)" stroke-width="20" fill="none" />
            
                <g transform="translate(400, 250) scale(0.8)">
                    <circle cx="0" cy="0" r="50" fill="rgba(255, 255, 255, 0.1)" />
                    <circle cx="-20" cy="-15" r="15" fill="rgba(255, 255, 255, 0.2)" />
                    <circle cx="20" cy="-15" r="15" fill="rgba(255, 255, 255, 0.2)" />
                    <circle cx="0" cy="20" r="15" fill="rgba(255, 255, 255, 0.2)" />
                </g>
            `;
            
            imagenContainer.appendChild(svg);
        } else {
            // Si la comunidad tiene imagen, mostrarla
            const img = document.createElement('img');
            img.src = comunidad.imagen_url;
            img.alt = comunidad.nombre;
            img.classList.add('comunidad-img');
            imagenContainer.appendChild(img);
        }
        
        // Agregar la medalla según posición
        imagenContainer.appendChild(getBadgeElement(index));
        comunidadCard.appendChild(imagenContainer);
        
        // Crear el contenedor de información
        const infoContainer = document.createElement('div');
        infoContainer.classList.add('comunidad-info');
        
        // Nombre de la comunidad
        const nombreH3 = document.createElement('h3');
        nombreH3.classList.add('comunidad-nombre', 'texto-ellipsis');
        nombreH3.textContent = comunidad.nombre;
        infoContainer.appendChild(nombreH3);
        
        // Descripción
        const descripcionP = document.createElement('p');
        descripcionP.classList.add('comunidad-descripcion', 'texto-ellipsis-multiple');
        descripcionP.textContent = descripcionCorta;
        infoContainer.appendChild(descripcionP);
        
        // Estadísticas
        const statsDiv = document.createElement('div');
        statsDiv.classList.add('comunidad-stats');
        
        // Posts
        const postsSpan = document.createElement('span');
        postsSpan.classList.add('texto-ellipsis');
        postsSpan.innerHTML = `<i class="fas fa-file-alt"></i> ${comunidad.total_posts || 0} posts`;
        statsDiv.appendChild(postsSpan);
        
        // Miembros
        const miembrosSpan = document.createElement('span');
        miembrosSpan.classList.add('texto-ellipsis');
        miembrosSpan.innerHTML = `<i class="fas fa-users"></i> ${comunidad.total_miembros || 0} miembros`;
        statsDiv.appendChild(miembrosSpan);
        
        // Badge de privacidad
        const privacidadSpan = document.createElement('span');
        privacidadSpan.classList.add('privacidad-badge', comunidad.es_privada ? 'privada' : 'publica');
        privacidadSpan.innerHTML = `<i class="fas ${comunidad.es_privada ? 'fa-lock' : 'fa-lock-open'}"></i>`;
        statsDiv.appendChild(privacidadSpan);
        
        infoContainer.appendChild(statsDiv);
        comunidadCard.appendChild(infoContainer);
        
        // CAMBIO IMPORTANTE: Verificación correcta de acceso a la comunidad
        // Una comunidad es accesible si:
        // 1. Es pública
        // 2. El usuario es el creador de la comunidad
        // 3. El usuario es miembro de la comunidad
        const esPublica = !comunidad.es_privada;
        const esCreador = comunidad.creador_id === currentUserId; // Asumimos que currentUserId es una variable global
        const esMiembro = comunidad.es_miembro === true; // Asegurarse de que sea un booleano
        
        const tieneAcceso = esPublica || esCreador || esMiembro;
        
        if (tieneAcceso) {
            // Si tiene acceso, hacer clickeable
            comunidadCard.style.cursor = 'pointer';
            comunidadCard.addEventListener('click', () => {
                window.location.href = `/foro?comunidad_id=${comunidad.id}`;
            });
        } else {
            // Si no tiene acceso (es privada y no es miembro ni creador)
            comunidadCard.style.cursor = 'default';
            
            // Mostrar un overlay con información de que es una comunidad privada
            const lockOverlay = document.createElement('div');
            lockOverlay.classList.add('comunidad-lock-overlay');
            lockOverlay.innerHTML = '<i class="fas fa-lock"></i><span>Comunidad privada</span>';
            comunidadCard.appendChild(lockOverlay);
        }
        
        cardsGrid.appendChild(comunidadCard);
    });
    
    // Agregar animaciones después de renderizar
    setTimeout(() => {
        const cards = document.querySelectorAll('.comunidad-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.4s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 100);
        });
    }, 200);
}

// Función auxiliar para obtener el elemento de medalla según posición
function getBadgeElement(index) {
    const badgeDiv = document.createElement('div');
    
    if (index === 0) {
        badgeDiv.classList.add('medalla-badge', 'medalla-oro');
        badgeDiv.innerHTML = '<i class="fas fa-trophy"></i>';
    } else if (index === 1) {
        badgeDiv.classList.add('medalla-badge', 'medalla-oro');
        badgeDiv.innerHTML = '<i class="fas fa-trophy"></i>';
    } else if (index === 2 || index === 3) {
        badgeDiv.classList.add('medalla-badge', 'medalla-plata');
        badgeDiv.innerHTML = '<i class="fas fa-medal"></i>';
    } else if (index < 6) {
        badgeDiv.classList.add('medalla-badge', 'medalla-bronce');
        badgeDiv.innerHTML = '<i class="fas fa-award"></i>';
    }
    
    return badgeDiv;
}
