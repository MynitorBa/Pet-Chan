import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { log } from 'console';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname + '/public'));


app.set('view engine', 'ejs');







/*---------------------------variable para ayudarnos en las mascotas------------------------------------------------ */

const rutaBase = "imagenes_de_mascotas/";
const totalMascotas = 37; // Número total de índices de mascotas
let indiceAleatorio = Math.floor(Math.random() * totalMascotas) + 1; // Genera un índice entre 1 y 37
let rutaImagen = `${rutaBase}${indiceAleatorio}.gif`;


/*---------------------------creamos el nombre de la mascota y el usuario------------------------------------------------ */
let mascotaNombre = "nombre";
let usuario = "usuario";
let contra = "1";

/*---------------------------variable para ayudarnos en las mascotas------------------------------------------------ */


/*---------------------------creamos variables para body parser------------------------------------------------*/
// Middleware para datos en formato JSON
app.use(bodyParser.json());
// Middleware para datos codificados en URL
app.use(bodyParser.urlencoded({ extended: true }));
/*---------------------------creamos variables para body parser------------------------------------------------*/




/*---------------------------creamos rutas generales------------------------------------------------*/
app.get('/', (req, res) => {
    res.render('loginBasico.ejs');
});

app.get('/minijuegomascota', (req, res) => {

    /*---------------------------borrar esta lineas despues ------------------------------------------------ */
indiceAleatorio = Math.floor(Math.random() * totalMascotas) + 1; // Genera un índice entre 1 y 37
rutaImagen = `${rutaBase}${indiceAleatorio}.gif`;

/*---------------------------borrar esta lineas despues ------------------------------------------------ */

    res.render('minijuegomascota.ejs', {
        rutaImagen 
    });
});


/*---------------------------creamos post de prueba necesario------------------------------------------------*/
app.post('/NombreMascota', (req, res) => {

    mascotaNombre = req.body.mascota;
    console.log(mascotaNombre);
    res.redirect('/inicio');
});

app.post('/loginBasico', (req, res) => {

    usuario = req.body.username;
    contra = req.body.password;
    let contraCorrecta = req.body.confirmPassword;

    if (contra === contraCorrecta) {
        res.redirect('/minijuegomascota');
    } else {
        console.log('Contraseñas no coinciden');
    }

})

app.post('/modificarPerfil', (req, res) => {

    usuario = req.body['nombre-usuario'];

    console.log('Usuario modificado:', usuario);

    res.redirect('/perfil_personalizado');


})

app.post('/modificarMascota', (req, res) => {

    mascotaNombre = req.body['nombre-mascota'];

    console.log('Mascota modificado:', mascotaNombre);

    res.redirect('/perfil_personalizado');
    
})

let mensajeDeContra = '';
app.post('/cambiarPassword', (req, res) => {
    const passwordActual = req.body.passwordActual;
    const nuevaPassword = req.body.nuevaPassword;
    const confirmarPassword = req.body.confirmarPassword;

    if (passwordActual !== contra) {
        mensajeDeContra ='⚠️ La contraseña actual no es correcta';
        return res.redirect('/perfil_personalizado');
    }

    if (nuevaPassword !== confirmarPassword) {
        mensajeDeContra = '⚠️ Las nuevas contraseñas no coinciden';
        return res.redirect('/perfil_personalizado');
    }

    // Simulamos que actualizamos la contraseña
    contra = nuevaPassword;

    mensajeDeContra = '✅ Contraseña cambiada exitosamente';

    res.redirect('/perfil_personalizado');
});
/*---------------------------creamos post de prueba necesario------------------------------------------------*/

app.get('/inicio', (req, res) => {


        //Create a mensaje object with the data you need
        const mensaje = {
            imagenesUrl: [] // Empty array or populate with actual image URLs
        };
        
        res.render('inicio.ejs', {
            mensaje,
            rutaImagen 
        });
    
    });

app.get('/eventos', (req, res) => {

    //Create a mensaje object with the data you need
    const mensaje = {
        imagenesUrl: [] // Empty array or populate with actual image URLs
    };
    
    res.render('eventos.ejs', {
        mensaje,
        rutaImagen 
    });
});

app.get('/formularioSoporte', (req, res) => {

    res.render('formularioSoporte.ejs', {
        rutaImagen 
    });
});

app.get('/perfil', (req, res) => {


    res.render('perfil.ejs', {
        rutaImagen,
        mascotaNombre,
        usuario
    });
});

app.get('/perfil_personalizado', (req, res) => {

    res.render('perfil_personalizado.ejs', {
        rutaImagen,
        mascotaNombre ,
        usuario,
        mensajeDeContra
    });
});

app.get('/corral_mascota', (req, res) => {

    res.render('corral.ejs', {
        rutaImagen,
        mascotaNombre
    });
});

app.get('/ayuda', (req, res) => {

    res.render('FAQ.ejs', {
        rutaImagen 
    });
});

/*---------------------------creamos rutas generales------------------------------------------------*/



app.listen(3000, () => {
    console.log('Server is running on port 3000');
})