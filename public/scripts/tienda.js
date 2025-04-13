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

// Función para filtrar productos
function filtrarProductos(categoria) {
    const productos = document.querySelectorAll('.tienda-producto');
    
    productos.forEach(producto => {
        if (categoria === 'todos' || producto.getAttribute('data-categoria') === categoria) {
            producto.style.display = 'flex';
        } else {
            producto.style.display = 'none';
        }
    });
}

// Gestión del carrito
let cantidadCarrito = 0;
const contadorCarrito = document.querySelector('.tienda-carrito-contador');

document.querySelectorAll('.tienda-producto-boton').forEach(boton => {
    boton.addEventListener('click', function() {
        // Incrementar contador
        cantidadCarrito++;
        contadorCarrito.textContent = cantidadCarrito;
        
        // Obtener información del producto
        const producto = this.closest('.tienda-producto');
        const nombreProducto = producto.querySelector('.tienda-producto-titulo').textContent;
        const precioProducto = producto.querySelector('.tienda-producto-precio').textContent;
        
        // Crear etiqueta flotante
        const etiqueta = document.createElement('div');
        etiqueta.classList.add('tienda-etiqueta-flotante');
        etiqueta.textContent = `${nombreProducto} añadido`;
        producto.appendChild(etiqueta);
        
        // Mostrar y luego ocultar etiqueta
        setTimeout(() => {
            etiqueta.style.opacity = '1';
            etiqueta.style.top = '-30px';
        }, 10);
        
        setTimeout(() => {
            etiqueta.style.opacity = '0';
        }, 1500);
        
        setTimeout(() => {
            etiqueta.remove();
        }, 1800);
        
        // Animar carrito
        const carrito = document.querySelector('.tienda-carrito-flotante');
        carrito.classList.add('tienda-animacion-pulso');
        
        setTimeout(() => {
            carrito.classList.remove('tienda-animacion-pulso');
        }, 1000);
        
        // Actualizar stock
        const stockElement = producto.querySelector('.tienda-producto-stock');
        let stock = parseInt(stockElement.textContent.match(/\d+/)[0]);
        stock--;
        stockElement.textContent = `Stock: ${stock}`;
        
        // Deshabilitar botón si stock llega a 0
if (stock <= 0) {
this.disabled = true;
this.textContent = "Agotado";
stockElement.textContent = "Sin stock";
this.classList.remove('tienda-animacion-pulso');
}
    });
});

// Funcionalidad del carrito flotante
document.querySelector('.tienda-carrito-flotante').addEventListener('click', function() {
    if (cantidadCarrito > 0) {
        alert(`¡Tienes ${cantidadCarrito} productos en tu carrito! \nPronto podrás completar tu compra.`);
    } else {
        alert("Tu carrito está vacío. ¡Añade algunos productos increíbles para tu mascota virtual!");
    }
});

// Animación para páginas de paginación
document.querySelectorAll('.tienda-pagina').forEach(pagina => {
    pagina.addEventListener('click', function() {
        document.querySelectorAll('.tienda-pagina').forEach(p => {
            p.classList.remove('activo');
        });
        this.classList.add('activo');
        
        // Aquí iría la funcionalidad para cambiar de página
        if (this.textContent !== '→') {
            alert(`Has navegado a la página ${this.textContent}`);
        } else {
            alert("Navegando a la siguiente página...");
        }
    });
});