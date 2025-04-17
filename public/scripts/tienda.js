
// ----------------------
// PAGINACIÓN
// ----------------------
// Configuración inicial
const productosPorPagina = 8;
let paginaActual = 1;
let productosVisibles = [];

// Cambiar categorías activas
document.querySelectorAll('.tienda-categoria').forEach(categoria => {
    categoria.addEventListener('click', function() {
        // Quitar clase activo de todas las categorías
        document.querySelectorAll('.tienda-categoria').forEach(cat => {
            cat.classList.remove('activo');
        });

        // Agregar clase activo a la categoría clicada
        this.classList.add('activo');

        // Obtener categoría seleccionada
        const categoriaSeleccionada = this.getAttribute('data-categoria');

        // Filtrar productos
        filtrarProductos(categoriaSeleccionada);
    });
});

// Función para filtrar productos por categoría
function filtrarProductos(categoria) {
    const todosProductos = document.querySelectorAll('.tienda-producto');
    
    // Actualizar lista de productos visibles
    productosVisibles = Array.from(todosProductos).filter(producto => {
        return categoria === 'todos' || producto.getAttribute('data-categoria') === categoria;
    });

    // Mostrar u ocultar productos según categoría
    todosProductos.forEach(producto => {
        producto.style.display = 'none'; // Primero ocultamos todos
    });

    // Reiniciar a página 1
    paginaActual = 1;
    actualizarVistaPagina();
}

// Función para comprar producto directamente
document.querySelectorAll('.tienda-producto-boton').forEach(boton => {
    boton.addEventListener('click', function() {
        const producto = this.closest('.tienda-producto');
        const nombreProducto = producto.querySelector('.tienda-producto-titulo').textContent;
        const precioProducto = producto.querySelector('.tienda-producto-precio').textContent;

        // Obtener cantidad de monedas
        const monedas = document.getElementById('monedas');
        const moneyNumber = parseFloat(monedas.textContent);

        // Actualizar stock (opcional)
        const stockElement = producto.querySelector('.tienda-producto-stock');
        if (stockElement) {
            let stock = parseInt(stockElement.textContent.match(/\d+/)[0]);
            stock--;
            stockElement.textContent = `Stock: ${stock}`;
            if (stock <= 0) {
                this.disabled = true;
                this.textContent = "Agotado";
                stockElement.textContent = "Sin stock";
            }
        }
    });
});

// ----------------------
// PAGINACIÓN MEJORADA
// ----------------------

function actualizarVistaPagina() {
    // Ocultar todos los productos primero
    document.querySelectorAll('.tienda-producto').forEach(p => {
        p.style.display = 'none';
    });

    // Calcular rango de productos a mostrar
    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = paginaActual * productosPorPagina;

    // Mostrar solo los productos de la página actual
    productosVisibles.slice(inicio, fin).forEach(producto => {
        producto.style.display = 'flex';
    });

    // Actualizar botones de paginación
    generarBotonesPaginacion();
    actualizarPaginacionActiva(paginaActual);
}

function actualizarPaginacionActiva(pagina) {
    document.querySelectorAll('.tienda-pagina').forEach(p => {
        p.classList.remove('activo');
        if (p.textContent == pagina.toString()) {
            p.classList.add('activo');
        }
    });
}

function generarBotonesPaginacion() {
    const contenedor = document.querySelector('.tienda-paginacion');
    if (!contenedor) return;

    const totalPaginas = Math.ceil(productosVisibles.length / productosPorPagina);

    contenedor.innerHTML = '';

    // Botón de anterior si no estamos en la primera página
    if (paginaActual > 1) {
        const anterior = document.createElement('div');
        anterior.className = 'tienda-pagina';
        anterior.textContent = '←';
        anterior.addEventListener('click', () => {
            paginaActual--;
            actualizarVistaPagina();
        });
        contenedor.appendChild(anterior);
    }

    // Botones de páginas numeradas
    for (let i = 1; i <= totalPaginas; i++) {
        const pagina = document.createElement('div');
        pagina.className = 'tienda-pagina';
        pagina.textContent = i;
        if (i === paginaActual) pagina.classList.add('activo');
        
        pagina.addEventListener('click', () => {
            paginaActual = i;
            actualizarVistaPagina();
        });
        
        contenedor.appendChild(pagina);
    }

    // Botón de siguiente si no estamos en la última página
    if (paginaActual < totalPaginas) {
        const siguiente = document.createElement('div');
        siguiente.className = 'tienda-pagina';
        siguiente.textContent = '→';
        siguiente.addEventListener('click', () => {
            paginaActual++;
            actualizarVistaPagina();
        });
        contenedor.appendChild(siguiente);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Activar categoría "todos" por defecto
    document.querySelector('.tienda-categoria[data-categoria="todos"]').classList.add('activo');
    
    // Inicializar con todos los productos visibles
    productosVisibles = Array.from(document.querySelectorAll('.tienda-producto'));
    actualizarVistaPagina();
});