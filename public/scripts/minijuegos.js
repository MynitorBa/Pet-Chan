// Función para cargar un minijuego específico
function cargarMinijuego(numeroJuego) {
    fetch(` /minijuego${numeroJuego} `)        .then(response => response.text()) 
        .then(data => {
            let contenedor = document.querySelector(".seccion-del_juego");
            document.getElementById("nombre-juego").textContent = ` Minijuego ${numeroJuego} `;
            
            // Insertar el HTML en el contenedor
            contenedor.innerHTML = data;

            // Buscar y ejecutar los scripts dentro del HTML cargado
            let scripts = contenedor.querySelectorAll("script");
            scripts.forEach(script => {
                let nuevoScript = document.createElement("script");
                if (script.src) {
                    nuevoScript.src = script.src;
                    nuevoScript.async = true;
                } else {
                    nuevoScript.textContent = script.textContent;
                }
                document.body.appendChild(nuevoScript);
            });
        })
        .catch(error => console.error("Error al cargar el juego:", error));
}

// Cargar el minijuego inicial (puedes cambiar el default)
cargarMinijuego(2);

// Event listener para el selector de minijuegos
document.getElementById("seleccion-juego").addEventListener("change", function() {
    const juegoSeleccionado = this.value;
    cargarMinijuego(juegoSeleccionado);
});