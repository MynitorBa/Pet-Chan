
fetch("minijuego_base/j1.html") 
.then(response => response.text()) 
.then(data => {
    let contenedor = document.querySelector(".seccion-del_juego");

    // Insertar el HTML en el contenedor
    contenedor.innerHTML = data;

    // Buscar y ejecutar los scripts dentro del HTML cargado
    let scripts = contenedor.querySelectorAll("script");
    scripts.forEach(script => {
        let nuevoScript = document.createElement("script");
        if (script.src) {
            // Si el script tiene src, recargarlo desde su fuente
            nuevoScript.src = script.src;
            nuevoScript.async = true; // Asegura que no bloquee la carga
        } else {
            // Si el script es inline, copiar su contenido
            nuevoScript.textContent = script.textContent;
        }
        document.body.appendChild(nuevoScript);
    });
})
.catch(error => console.error("Error al cargar el juego:", error));
