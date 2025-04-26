import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

/*---------------------------variable para ayudarnos en las mascotas------------------------------------------------ */
const rutaBase = "imagenes_de_mascotas/";
const totalMascotas = 37; // Número total de índices de mascotas
let indiceAleatorio = Math.floor(Math.random() * totalMascotas) + 1; // Genera un índice entre 1 y 37
let rutaImagen = `${rutaBase}${indiceAleatorio}.gif`;
/*---------------------------variable para ayudarnos en las mascotas------------------------------------------------ */

/*---------------------------redirigimos a eventos------------------------------------------------*/
app.get('/', (req, res) => {
    res.redirect('/eventos');
});

/*---------------------------creamos ruta para eventos------------------------------------------------*/
app.get('/eventos', (req, res) => {
    /*---------------------------borrar esta lineas despues ------------------------------------------------ */
    indiceAleatorio = Math.floor(Math.random() * totalMascotas) + 1; // Genera un índice entre 1 y 37
    rutaImagen = `${rutaBase}${indiceAleatorio}.gif`;
    /*---------------------------borrar esta lineas despues ------------------------------------------------ */

    //Create a mensaje object with the data you need
    const mensaje = {
        imagenesUrl: [] // Empty array or populate with actual image URLs
    };
    
    res.render('eventos.ejs', {
        mensaje,
        rutaImagen 
    });
});

/*---------------------------mantenemos las rutas originales------------------------------------------------*/
app.get('/formularioSoporte', (req, res) => {
    /*---------------------------borrar esta lineas despues ------------------------------------------------ */
    indiceAleatorio = Math.floor(Math.random() * totalMascotas) + 1; // Genera un índice entre 1 y 37
    rutaImagen = `${rutaBase}${indiceAleatorio}.gif`;
    /*---------------------------borrar esta lineas despues ------------------------------------------------ */

    res.render('formularioSoporte.ejs', {
        rutaImagen 
    });
});

app.get('/perfil', (req, res) => {
    /*---------------------------borrar esta lineas despues ------------------------------------------------ */
    indiceAleatorio = Math.floor(Math.random() * totalMascotas) + 1; // Genera un índice entre 1 y 37
    rutaImagen = `${rutaBase}${indiceAleatorio}.gif`;
    /*---------------------------borrar esta lineas despues ------------------------------------------------ */

    res.render('perfil.ejs', {
        rutaImagen 
    });
});

app.get('/perfil_personalizado', (req, res) => {
    /*---------------------------borrar esta lineas despues ------------------------------------------------ */
    indiceAleatorio = Math.floor(Math.random() * totalMascotas) + 1; // Genera un índice entre 1 y 37
    rutaImagen = `${rutaBase}${indiceAleatorio}.gif`;
    /*---------------------------borrar esta lineas despues ------------------------------------------------ */

    res.render('perfil_personalizado.ejs', {
        rutaImagen 
    });
});

app.get('/corral_mascota', (req, res) => {
    /*---------------------------borrar esta lineas despues ------------------------------------------------ */
    indiceAleatorio = Math.floor(Math.random() * totalMascotas) + 1; // Genera un índice entre 1 y 37
    rutaImagen = `${rutaBase}${indiceAleatorio}.gif`;
    /*---------------------------borrar esta lineas despues ------------------------------------------------ */

    res.render('corral.ejs', {
        rutaImagen 
    });
});

/*---------------------------creamos rutas generales------------------------------------------------*/

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})