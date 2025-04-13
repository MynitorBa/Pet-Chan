import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { log } from 'console';

/*---------------------------importaciones necesarias para la base de datos------------------------------------------------ */
/*necesario para la base de datos*/
import pg from "pg";
import session from "express-session";
import { hashPassword, verifyPassword } from "cryptography-password-js";
/*librerias necesarias*/
/*---------------------------importaciones de otros js------------------------------------------------ */





import { especieMascotas, comidasFavoritas, habilidadesEspeciales } from './informacion/informacion.js'; //exportamos las especies de mascotas

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname + '/public'));


app.set('view engine', 'ejs');





/*---------------------------variable necesarias para la base de datos------------------------------------------------ */
//configuracion de la base de datos
app.use(session({
    secret: 'Ayer_me_econtre_con_sabrina_corazoncitos',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
    }
}));

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "pet_chan",
    password: "123456",
    port: 5432,
})

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    next();
};
//configuracion de la base de datos
/*---------------------------variable necesarias para la base de datos------------------------------------------------ */





/*---------------------------variable para ayudarnos en las mascotas------------------------------------------------ */

const rutaBase = "imagenes_de_mascotas/";
const totalMascotas = especieMascotas.length;; // Número total de índices de mascotas
let indiceAleatorio = Math.floor(Math.random() * totalMascotas) + 1; // Genera un índice entre 1 y 38
let rutaImagen = `${rutaBase}${indiceAleatorio}.gif`;
let especieDeMascota; // Variable para almacenar la especie de la mascota
let generoDeMascota; // Variable para almacenar el género de la mascota


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
    res.redirect('/login');
});


/*---------------------------creamos rutas generales------------------------------------------------*/
app.get('/register', (req, res) => {
    res.render('register.ejs', { error: null });
})

app.get('/login', (req, res) => {
    res.render('login.ejs', { error: null });
})

app.post('/register', async (req, res) => {

    const { username, password, confirmPassword } = req.body;


    try {
        if (password !== confirmPassword) {
            return res.render("register.ejs", { error: "Las contraseñas no coinciden" });
        }

        const hashedPassword = await hashPassword(password, { 
            keyLen: 64,
            N: 16384,
            r: 8,
            p: 1,
            maxmem: 64 * 1024 * 1024,
        });

        const result = await db.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );
        const newUser = result.rows[0];
        req.session.userId = newUser.id;
        req.session.username = newUser.username;
        req.session.descripcion = "Descripción del usuario";

        res.redirect("/minijuegomascota");
    } catch (error) {
        console.error(error);
        res.status(500).render("register.ejs", { error: "Error al registrar el usuario" });
    }

})

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.render("login.ejs", { error: "Usuario no encontrado" });
        }

        const user = userResult.rows[0];
        const isPasswordValid = await verifyPassword(password, user.password);

        if (!isPasswordValid) {
            return res.render("login.ejs", { error: "Contraseña incorrecta" });
        }

        // ✅ Guardamos los datos del usuario en sesión
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.descripcion = user.description;

        // ✅ Buscamos si el usuario ya tiene una mascota
        const petResult = await db.query('SELECT * FROM pets WHERE "id_users" = $1 LIMIT 1', [user.id]);


        if (petResult.rows.length === 0) {
            return res.redirect("/minijuegomascota");
        }

        if (petResult.rows.length > 0) {
            const mascota = petResult.rows[0];
            const rutaImagen = `${rutaBase}${mascota.indice}.gif`;
            const especieDeMascota = especieMascotas[mascota.indice - 1];
            const pronombre = mascota.genero === "macho" ? "el" : "la";

            // Guardamos la mascota en sesión
            req.session.mascotaActual = {
                id: mascota.id,
                nombre: mascota.petname,
                genero: mascota.genero,
                especie: especieDeMascota,
                indice: mascota.indice,
                rutaImagen,
                pronombre,
                niveldeAmor: mascota.nivelAmor,
                niveldeFelicidad: mascota.nivelFelicidad,
                niveldeEnergia: mascota.nivelEnergia,
                habilidad: mascota.habilidad,
                comidaFavorita: mascota.comidaFavorita
            };
        }

        res.redirect("/inicio");
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).render("login.ejs", { error: "Error al iniciar sesión" });
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        }
        res.redirect("/login");
    });
})

/*---------------------------creamos rutas generales------------------------------------------------*/


app.get('/minijuegomascota', requireLogin, async (req, res) => {
    const userId = req.session.userId;

    try {
        const result = await db.query(
            `SELECT id FROM pets WHERE "id_users" = $1 LIMIT 1`,
            [userId]
        );

        if (result.rows.length > 0) {
            // Ya tiene una mascota, no se permite acceder al minijuego
            return res.redirect('/inicio'); // o renderizar una página de aviso
        }

        // Si no tiene mascota, seguimos con la lógica normal del juego
        let indicesValidos = [1, 4, 7, 10, 11, 13, 16, 18, 21, 23, 27, 29, 32, 35, 37];
        const indiceMascota = indicesValidos[Math.floor(Math.random() * indicesValidos.length)];
        const rutaImagen = `${rutaBase}${indiceMascota}.gif`;
        const especieDeMascota = especieMascotas[indiceMascota - 1];
        const generoDeMascota = Math.random() < 0.5 ? "macho" : "hembra";

        // Guardamos en sesión
        req.session.mascotaPendiente = {
            indice: indiceMascota,
            genero: generoDeMascota,
            rutaImagen,
            especie: especieDeMascota
        };

        setTimeout(() => {
            res.render('minijuegomascota.ejs', {
                rutaImagen,
                generoDeMascota,
                especieDeMascota,
            });
        }, 2700);
    } catch (error) {
        console.error("Error al verificar existencia de mascota:", error);
        res.status(500).send("Error interno al cargar el minijuego.");
    }
});



/*---------------------------creamos post de prueba necesario------------------------------------------------*/
app.post('/NombreMascota', requireLogin, async (req, res) => {
    const mascotaNombre = req.body.mascota;
    const userId = req.session.userId;
    const datos = req.session.mascotaPendiente;

    if (!datos) {
        return res.status(400).send("No hay datos de mascota pendiente en sesión.");
    }

    let indice = Math.floor(Math.random() * 10); // número entre 0 y 9
    const comida = comidasFavoritas[indice];
    indice = Math.floor(Math.random() * 10); // número entre 0 y 9
    const habilidad = habilidadesEspeciales[indice];

    try {
        const result = await db.query(
            `INSERT INTO pets ("petname", "genero", "indice", "nivelAmor", "nivelFelicidad", "nivelEnergia", "habilidad", "comidaFavorita", "id_users")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [
                mascotaNombre,
                datos.genero,
                datos.indice,
                0, // nivelAmor
                50, // nivelFelicidad
                50, // nivelEnergia
                habilidad, // habilidad
                comida, // comida favorita
                userId
            ]
        );

        const idMascota = result.rows[0].id;

        // 🧠 Guardamos en sesión la mascota actual para uso en otras vistas
        req.session.mascotaActual = {
            id: idMascota,
            nombre: mascotaNombre,
            genero: datos.genero,
            especie: datos.especie,
            indice: datos.indice,
            rutaImagen: datos.rutaImagen,
            pronombre: datos.genero === "macho" ? "el" : "la",
            niveldeAmor: 0,
            niveldeFelicidad: 50,
            niveldeEnergia: 50,
            habilidad: habilidad,
            comidaFavorita: comida
        };

        // Guardamos también el ID por separado si lo necesitas
        req.session.idMascotaReciente = idMascota;

        // Limpiamos la sesión temporal
        delete req.session.mascotaPendiente;

        console.log(`Mascota creada con ID ${idMascota} y nombre ${mascotaNombre}`);
        res.redirect('/inicio');
    } catch (error) {
        console.error('Error al crear mascota:', error);
        res.status(500).send("Error al guardar la mascota");
    }
});



app.post('/modificarPerfil', requireLogin, async (req, res) => {
    const nuevoUsername = req.body['nombre-usuario'];
    const nuevaDescripcion = req.body['biografia'];
    const userId = req.session.userId;

    try {
        await db.query(
            `UPDATE users SET username = $1, description = $2 WHERE id = $3`,
            [nuevoUsername, nuevaDescripcion, userId]
        );

        // Actualizamos la sesión si cambió el username
        req.session.username = nuevoUsername;
        req.session.descripcion = nuevaDescripcion;

        console.log('Perfil actualizado:', nuevoUsername);
        res.redirect('/perfil_personalizado');
    } catch (error) {
        console.error('Error al modificar perfil:', error);
        res.status(500).send('Error al actualizar el perfil');
    }
});


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

app.get('/inicio', requireLogin, (req, res) => {

    const mascota = req.session.mascotaActual;


        //Create a mensaje object with the data you need
        const mensaje = {
            imagenesUrl: [] // Empty array or populate with actual image URLs
        };
        
        res.render('inicio.ejs', {
            mensaje,
            rutaImagen: mascota.rutaImagen,
        });
    
    });

app.get('/eventos', requireLogin, (req, res) => {

    const mascota = req.session.mascotaActual;

    //Create a mensaje object with the data you need
    const mensaje = {
        imagenesUrl: [] // Empty array or populate with actual image URLs
    };
    
    res.render('eventos.ejs', {
        mensaje,
        rutaImagen: mascota.rutaImagen,
    });
});

app.get('/formularioSoporte', requireLogin, (req, res) => {

    const mascota = req.session.mascotaActual;

    res.render('formularioSoporte.ejs', {
        rutaImagen: mascota.rutaImagen
    });
});

app.get('/perfil',  requireLogin, (req, res) => {


    const mascota = req.session.mascotaActual;

    
    res.render('perfil.ejs', {
        rutaImagen: mascota.rutaImagen,
        mascotaNombre: mascota.nombre,
        usuario: req.session.username,
        especieDeMascota: mascota.especie,
        pronombre: mascota.pronombre,
        nivelAmor: mascota.niveldeAmor,
        nivelEnergia: mascota.niveldeEnergia,
        nivelFelicidad: mascota.niveldeFelicidad,
        comidaFavorita: mascota.comidaFavorita,
        habilidadesEspeciales: mascota.habilidad,
        descripcion: req.session.descripcion
    });
});

app.get('/perfil_personalizado', requireLogin, (req, res) => {


    const mascota = req.session.mascotaActual;



    res.render('perfil_personalizado.ejs', {
        rutaImagen: mascota.rutaImagen,
        mascotaNombre: mascota.nombre,
        usuario: req.session.username,
        mensajeDeContra,
        descripcion: req.session.descripcion
    });
});

app.get('/corral_mascota', requireLogin, (req, res) => {

    const mascota = req.session.mascotaActual;



    res.render('corral.ejs', {
        rutaImagen: mascota.rutaImagen,
        mascotaNombre: mascota.nombre,
        especieDeMascota: mascota.especie,
        pronombre: mascota.pronombre
    });
});

app.get('/ayuda',  requireLogin, (req, res) => {


    const mascota = req.session.mascotaActual;

    res.render('FAQ.ejs', {
        rutaImagen: mascota.rutaImagen
    });
});

app.get('/minijuegos', requireLogin, (req, res) => {
 
    const mascota = req.session.mascotaActual;

    res.render('minijuegos.ejs', {
        rutaImagen: mascota.rutaImagen
    });
});

app.get('/tienda', requireLogin, (req, res) => {

    const mascota = req.session.mascotaActual;

    res.render('tienda.ejs', {
        rutaImagen: mascota.rutaImagen 
    });
});

/*---------------------------creamos rutas generales------------------------------------------------*/


/*---------------------------creamos rutas individuales para los juegos------------------------------------------------*/
app.get('/minijuego1', (req, res) => {  
    res.render('minijuegos/minijuego1');  
});

app.get('/minijuego2', (req, res) => {  
    res.render('minijuegos/minijuego2');  
});
/*---------------------------creamos rutas individuales para los juegos------------------------------------------------*/



app.listen(3000, () => {
    console.log('Server is running on port 3000');
})