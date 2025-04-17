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





import { especieMascotas, comidasFavoritas, habilidadesEspeciales, accesorios, juguetes, corralesDisponibles } from './informacion/informacion.js'; //exportamos las especies de mascotas

import { preciosJuguetes, preciosAccesorios, preciosComidas, preciosCorrales } from './informacion/precios.js';

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
            'INSERT INTO users (username, password, description, money) VALUES ($1, $2, $3, $4) RETURNING id, username',
            [username, hashedPassword, "Descripción del usuario", 0]
        );
        const newUser = result.rows[0];
        req.session.userId = newUser.id;
        req.session.username = newUser.username;
        req.session.descripcion = "Descripción del usuario";
        req.session.money = 0;
        req.session.corral = null;

        // vamos a poner los accesorios en null
        req.session.accesorios = null;

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
        req.session.money = user.money;
        req.session.corral = user.corral;

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

        //vamos a hacer un array con todos los accesorios del usuario
        const accesoriosResult = await db.query('SELECT * FROM accesorios WHERE "id_users" = $1', [user.id]);

        if (accesoriosResult.rows.length > 0) {
            req.session.accesorios = accesoriosResult.rows;
        }else{
            req.session.accesorios = null;
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

//este post nos ayudara a modificar las mascotas y sus accesorios
app.post('/modificarMascota', requireLogin, async (req, res) => {
    const nuevoNombre = req.body['nombre-mascota'];
    const mascota = req.session.mascotaActual;
    const userId = req.session.userId;

    //obtenemos los accesorios
    const accesoriosTexto = req.body['accesorio-mascota']; // nombres separados por coma

    if (!mascota) {
        return res.status(400).send("No tienes una mascota para modificar.");
    }

    

    try {
        // Parsear y limpiar los nombres
        let nombresSeleccionados = accesoriosTexto
            .split(',')
            .map(nombre => nombre.trim())
            .filter(Boolean);
    
        // Si no se seleccionó nada útil (solo "Ninguno" o vacío), limpiar accesorios y salir
        if (
            nombresSeleccionados.length === 0 ||
            (nombresSeleccionados.length === 1 && nombresSeleccionados[0].toLowerCase() === 'ninguno')
        ) {
            await db.query('DELETE FROM accesorios WHERE id_users = $1', [userId]);
            // Actualizar accesorios en la sesión
            req.session.accesorios = null;
        }else{
            
        // Mapear nombres a índices reales
        const indicesSeleccionados = nombresSeleccionados.map(nombre => {
            const indice = accesorios.indexOf(nombre);
            if (indice === -1) {
                throw new Error(`Accesorio no válido: ${nombre}`);
            }
            return indice;
        });
    
        // Verificar que todos estén en la tabla items para el usuario
        const placeholders = indicesSeleccionados.map((_, i) => `$${i + 1}`).join(', ');
        const query = `
            SELECT indice FROM items
            WHERE categoria = 'accesorios' AND id_users = $${indicesSeleccionados.length + 1}
              AND indice IN (${placeholders})
        `;
    
        const result = await db.query(query, [...indicesSeleccionados, userId]);
        const validos = result.rows.map(r => r.indice);
    
        const invalidos = indicesSeleccionados.filter(i => !validos.includes(i));
        if (invalidos.length > 0) {
            return res.status(400).send('Algunos accesorios no te pertenecen: ' + invalidos.join(', '));
        }
    
        // Reemplazar accesorios actuales
        await db.query('DELETE FROM accesorios WHERE id_users = $1', [userId]);
    
        const insertQuery = `
            INSERT INTO accesorios (indice, id_users)
            VALUES ${indicesSeleccionados.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}
        `;
        const insertValues = indicesSeleccionados.flatMap(indice => [indice, userId]);
    
        if (insertValues.length > 0) {
            await db.query(insertQuery, insertValues);
        }

        // Actualizar accesorios en la sesión
        //vamos a hacer un array con todos los accesorios del usuario
        const accesoriosResult1 = await db.query('SELECT * FROM accesorios WHERE "id_users" = $1', [userId]);

        if (accesoriosResult1.rows.length > 0) {
            req.session.accesorios = accesoriosResult1.rows;
        }else{
            req.session.accesorios = null;
        }
    }
    } catch (error) {
        console.error('Error al modificar los accesorios:', error);
        res.status(500).send('Error al modificar los accesorios');
    }

    try {
        await db.query(
            `UPDATE pets SET petname = $1 WHERE id = $2`,
            [nuevoNombre, mascota.id]
        );

        // ✅ Actualizamos el nombre en la sesión
        req.session.mascotaActual.nombre = nuevoNombre;

        console.log('Mascota modificada:', nuevoNombre);
        res.redirect('/perfil_personalizado');
    } catch (error) {
        console.error('Error al modificar el nombre de la mascota:', error);
        res.status(500).send('Error al modificar la mascota');
    }
});



app.post('/cambiarPassword', requireLogin, async (req, res) => {
    const { passwordActual, nuevaPassword, confirmarPassword } = req.body;
    const userId = req.session.userId;

    try {
        // 1. Traer la contraseña actual de la base de datos
        const userResult = await db.query(`SELECT password FROM users WHERE id = $1`, [userId]);
        if (userResult.rows.length === 0) {
            req.session.mensajeDeContra = '⚠️ Usuario no encontrado.';
            return res.redirect('/perfil_personalizado');
        }

        const passwordHashActual = userResult.rows[0].password;

        // 2. Verificar contraseña actual
        const passwordValida = await verifyPassword(passwordActual, passwordHashActual);
        if (!passwordValida) {
            req.session.mensajeDeContra = '⚠️ La contraseña actual no es correcta';
            return res.redirect('/perfil_personalizado');
        }

        // 3. Verificar que las nuevas contraseñas coincidan
        if (nuevaPassword !== confirmarPassword) {
            req.session.mensajeDeContra = '⚠️ Las nuevas contraseñas no coinciden';
            return res.redirect('/perfil_personalizado');
        }

        // 4. Hashear y guardar nueva contraseña
        const nuevaPasswordHash = await hashPassword(nuevaPassword);
        await db.query(`UPDATE users SET password = $1 WHERE id = $2`, [nuevaPasswordHash, userId]);

        req.session.mensajeDeContra = '✅ Contraseña cambiada exitosamente';
        res.redirect('/perfil_personalizado');
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        req.session.mensajeDeContra = '⚠️ Error al cambiar la contraseña';
        res.redirect('/perfil_personalizado');
    }
});

//post para realizar las compras
app.post('/comprarItem', requireLogin, async (req, res) => {
        
    //obtenemos el indice y la categoria
    const { index, categoria} = req.body;
    const userId = req.session.userId;

    console.log('Comprando item:', index, categoria);

    let precio = 0;

    //ahora vamos a obtener el precio de los arrays
    try {
        if (categoria === 'accesorios' && index >= 0 && index < accesorios.length) {
            precio = preciosAccesorios[index];
        } else if (categoria === 'comida' && index >= 0 && index < preciosComidas.length) {
            precio = preciosComidas[index]; 
        } else if (categoria === 'juguetes' && index >= 0 && index < juguetes.length) {
            precio = preciosJuguetes[index];
        } else if (categoria === 'corrales' && index >= 0 && index < corralesDisponibles.length) {
            precio = preciosCorrales[index];
        } else {
            console.error("Índice o categoría inválido");
            return res.json({ success: false, mensaje: 'Índice o categoría inválido' });
        }
    } catch (error) {
        console.error("Error al obtener el precio:", error);
        return res.json({ success: false, mensaje: 'Error al obtener el precio' });
    }

    console.log(index, precio, categoria);

    try {

        const userResult = await db.query(`SELECT money FROM users WHERE id = $1`, [userId]);

        const dineroActual = userResult.rows[0].money;

        if (dineroActual < precio) {
            return res.json({ success: false, mensaje: 'Dinero insuficiente' });    
        }

        //si el item es accesorios o corrales, veremos que el usuario no lo tenga ya
        if (categoria === 'accesorios' || categoria === 'corrales') {
            const userHasItem = await db.query(`SELECT * FROM items WHERE id_users = $1 AND indice = $2 AND categoria = $3`, [userId, index, categoria]);
            if (userHasItem.rows.length > 0) {
                console.log('El usuario ya tiene ese item');
                return res.json({ success: false, mensaje: 'El usuario ya tiene ese item' });
            }
        }

        await db.query(`UPDATE users SET money = $1 WHERE id = $2`, [dineroActual - precio, userId]);
        req.session.money = dineroActual - precio;

        await db.query(`INSERT INTO items (id_users, indice, categoria) VALUES ($1, $2, $3)`, [userId, index, categoria]);

        res.json({ success: true, mensaje: 'Item comprado exitosamente' });
    } catch (error) {
        console.error("Error al comprar accesorio:", error);
        res.json({ success: false, mensaje: 'Error al comprar accesorio' });
    }
    
})

//vamos a realizar el post para que la mascota pueda comer
app.post('/mascota/comer', requireLogin, async (req, res) => {
    //obetenemos el indice de la comida y el indice del usuario
    const userId = req.session.userId;
    const {indice} = req.body;

    try {

        //verificamos si la comida con dicho indice pertenece al usuario
        const userResult = await db.query(`SELECT * FROM items WHERE id_users = $1 AND indice = $2 AND categoria = 'comida'`, [userId, indice]);
        if (userResult.rows.length === 0) {

            console.log('No tienes esa comida');

            return res.json({ success: false, error: 'No tienes esa comida' });
        }

       // vamos a crear un porcentaje para el nivel de energía que aumentará a la mascota
    let porcentaje = 0;
    // mensaje base para el usuario
    let mensaje1 = "Mascota comiendo...";

    // obtenemos la comida y la favorita de la mascota
    const comidaDada = comidasFavoritas[indice];
    const favorita = req.session.mascotaActual.comidaFavorita;

    // Mensajes posibles
    const mensajesFavorita = [
        "¡Ñam ñam! Esta es su favorita, ¡la devoró feliz!",
        "Mascota comiendo... ¡brilla de felicidad con su platillo favorito!",
        "¡Le encantó! Ganó +{p}% de energía con su comida favorita 🍖",
        "Mascota comiendo su favorita... ¡qué delicia! +{p}% de energía"
    ];

    const mensajesNormal = [
        "Mascota comiendo... parece que le gustó un poco.",
        "No es su favorita, pero la aceptó. Energía +{p}%",
        "Comió sin entusiasmo... pero le dio algo de fuerza. +{p}%",
        "Mascota comiendo... meh, al menos no se quejó. +{p}%"
    ];

    const mensajesBaja = [
        "Mascota comiendo... hizo una mueca. Perdió -{p}% de energía 😟",
        "¡Oh no! No le cayó bien, energía -{p}%",
        "Mascota comiendo... parece que no le gustó. -{p}% de energía",
        "Ups... esa comida no era de su agrado. -{p}%"
    ];

    if (favorita === comidaDada) {
        // Si es favorita, generamos un aumento de entre 20% a 40%
        porcentaje = Math.random() * (0.40 - 0.20) + 0.20;
        
        const aumento = Math.round(porcentaje * 100);
        const mensajeRandom = mensajesFavorita[Math.floor(Math.random() * mensajesFavorita.length)];
        
        mensaje1 = mensajeRandom.replace("{p}", aumento);
    } else {
        // Rango entre -10% y +15%
        porcentaje = Math.random() * (0.25) - 0.10;

        const cambio = Math.round(Math.abs(porcentaje * 100)); // positivo para mostrar

        if (porcentaje > 0) {
            const mensajeRandom = mensajesNormal[Math.floor(Math.random() * mensajesNormal.length)];
            mensaje1 = mensajeRandom.replace("{p}", cambio);
        } else {
            const mensajeRandom = mensajesBaja[Math.floor(Math.random() * mensajesBaja.length)];
            mensaje1 = mensajeRandom.replace("{p}", cambio);
        }
    }

        // Actualizamos el nivel de energía de la mascota
        const energiaActual = req.session.mascotaActual.niveldeEnergia;
        let energiaNueva = Math.round((porcentaje * 100)) + parseInt(energiaActual);

        console.log('Energía actual de la mascota:', energiaActual);
        console.log('Porcentaje de aumento:', Math.round(Math.abs(porcentaje * 100)));
        console.log('Nueva energía de la mascota:', energiaNueva);

        //veremos si la energía queda negativa
        if (energiaNueva < 0) {
            energiaNueva = 0;
        }

        //veremos si el nivel de energía supera el 100
        if (energiaNueva > 100) {
            energiaNueva = 100;
        }

        await db.query(`UPDATE pets SET "nivelEnergia" = $1 WHERE id_users = $2`, [energiaNueva, userId]);

        //actualizamos el nivel de energia en el session
        req.session.mascotaActual.niveldeEnergia = energiaNueva;
        console.log('Nueva energía de la mascota:', req.session.mascotaActual.niveldeEnergia);


        //eliminamos unicamente una comida con dicho indice
        await db.query(`
            WITH fila_a_borrar AS (
                SELECT ctid
                FROM items
                WHERE id_users = $1 AND indice = $2 AND categoria = 'comida'
                ORDER BY id ASC
                LIMIT 1
            )
            DELETE FROM items
            WHERE ctid IN (SELECT ctid FROM fila_a_borrar)
        `, [userId, indice]);
        
    

        console.log('Mascota comiendo...');

        return res.json({
            success: true,
            mensaje: mensaje1,
        });
    } catch (error) {
        console.error("Error al comer:", error);
        return res.json({ success: false, error: 'Error al comer' });
    }
})

//ahora vamos a hacer la ruta para que la mascota pueda jugar
app.post('/mascota/jugar', requireLogin, async (req, res) => {
    //obtenemos el indice del usuario y el indice del item
    const { indice } = req.body;
    const userId = req.session.userId;

    //hacemos nuestro try
    try {
        //verificamos si el juguete con dicho indice pertenece al usuario
        const juguete = await db.query(`SELECT * FROM items WHERE id_users = $1 AND indice = $2 AND categoria = 'juguetes'`, [userId, indice]);

        if (juguete.rows.length === 0) {
            console.log('No tienes ese juguete');
            return res.json({ success: false, error: 'No tienes ese juguete' });
        }

        // Vamos a crear un porcentaje para el nivel de felicidad que aumentará o disminuirá
        let porcentaje = 0;
        let mensaje1 = "Mascota jugando...";

        // Mensajes posibles para felicidad positiva
        const mensajesFelices = [
            "¡Qué divertido! La mascota se ve feliz. +{p}% de felicidad 🧸",
            "Mascota jugando... se la pasó increíble. +{p}%",
            "Corrió, saltó y ladró de alegría. +{p}% de felicidad 🎾",
            "Jugó como si no hubiera un mañana. +{p}%"
        ];

        // Mensajes posibles para bajada leve
        const mensajesAburridos = [
            "Mascota jugando... parece que se aburrió un poco. -{p}%",
            "No estaba de humor para ese juguete. -{p}% de felicidad 😐",
            "Jugó un rato, pero perdió interés. -{p}%",
            "Mascota jugando... se distrajo, pero no mucho. -{p}%"
        ];

        // Generar porcentaje aleatorio
        const chance = Math.random();

        if (chance > 0.2) {
            // 80% de probabilidad de subir felicidad (10% a 30%)
            porcentaje = Math.random() * (0.30 - 0.10) + 0.10;
            const aumento = Math.round(porcentaje * 100);
            const mensajeRandom = mensajesFelices[Math.floor(Math.random() * mensajesFelices.length)];
            mensaje1 = mensajeRandom.replace("{p}", aumento);
        } else {
            // 20% de probabilidad de bajada leve (-1% a -5%)
            porcentaje = Math.random() * (-0.05 + 0.01) - 0.01; // negativo
            const reduccion = Math.round(Math.abs(porcentaje * 100));
            const mensajeRandom = mensajesAburridos[Math.floor(Math.random() * mensajesAburridos.length)];
            mensaje1 = mensajeRandom.replace("{p}", reduccion);
        }

         // Actualizamos el nivel de felicidad de la mascota
        const nivelFelicidadActual = req.session.mascotaActual.niveldeFelicidad;
        let nivelFelicidadNuevo = Math.round((porcentaje * 100)) + parseInt(nivelFelicidadActual);

        //vemos si el nivel de feclicidad nuevo queda negativo
        if (nivelFelicidadNuevo < 0) {
            nivelFelicidadNuevo = 0;
        }

        //vemos si el nivel de feclicidad nuevo es mayor a 100
        if (nivelFelicidadNuevo > 100) {
            nivelFelicidadNuevo = 100;
        }

        // Actualizamos el nivel de felicidad en la base de datos
        await db.query(`UPDATE pets SET "nivelFelicidad" = $1 WHERE id_users = $2`, [nivelFelicidadNuevo, userId]);
        // Actualizamos el nivel de felicidad en la sesión
        req.session.mascotaActual.niveldeFelicidad = nivelFelicidadNuevo;

        console.log('Felicidad actual de la mascota:', req.session.mascotaActual.niveldeFelicidad);

        //eliminamos unicamente una comida con dicho indice
        await db.query(`
            WITH fila_a_borrar AS (
                SELECT ctid
                FROM items
                WHERE id_users = $1 AND indice = $2 AND categoria = 'juguetes'
                ORDER BY id ASC
                LIMIT 1
            )
            DELETE FROM items
            WHERE ctid IN (SELECT ctid FROM fila_a_borrar)
        `, [userId, indice]);

        return res.json({
            success: true,
            mensaje: mensaje1,
        });
    } catch (error) {
        console.error("Error al jugar:", error);
        return res.json({ success: false, error: 'Error al jugar: ' + error.message });
    }
});

//vamos a hacer un post para guardar el fondo del corral
app.post('/corral/guardar', requireLogin, async (req, res) => {
    //obtenemos el indice del usuario y el indice del item
    const { indice } = req.body;
    const userId = req.session.userId;

    console.log('Guardando fondo del corral:', indice);

    try {
        //primero veremos si el usuario tiene ese corral en sus items
        const item = await db.query(`SELECT * FROM items WHERE id_users = $1 AND indice = $2 AND categoria = 'corrales'`, [userId, indice]);

        if (item.rows.length === 0) {
            return res.json({ success: false, error: 'No tienes ese corral en tus items' });
        }

        //actualizamos el fondo del corral en la tabla de users
        await db.query(`UPDATE users SET corral = $1 WHERE id = $2`, [indice, userId]);

        //actualizamos el fondo del corral en la sesion
        req.session.corral = parseInt(indice);

        console.log('Fondo del corral guardado correctamente', req.session.corral);

        return res.json({
            success: true,
            mensaje: "Fondo del corral guardado correctamente",
        });
    } catch (error) {
        console.error("Error al guardar el fondo del corral:", error);
        return res.json({ success: false, error: 'Error al guardar el fondo del corral: ' + error.message });
    }
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
            accesorios: req.session.accesorios
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
        accesorios: req.session.accesorios
    });
});

app.get('/formularioSoporte', requireLogin, (req, res) => {

    const mascota = req.session.mascotaActual;

    res.render('formularioSoporte.ejs', {
        rutaImagen: mascota.rutaImagen,
        accesorios: req.session.accesorios
    });
});

app.get('/perfil',  requireLogin, (req, res) => {


    const mascota = req.session.mascotaActual;

    
    res.render('perfil.ejs', {
        rutaImagen: mascota.rutaImagen,
        accesorios: req.session.accesorios,
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

app.get('/perfil_personalizado', requireLogin, async (req, res) => {


    const mascota = req.session.mascotaActual;
    const mensaje = req.session.mensajeDeContra || '';
    delete req.session.mensajeDeContra;

    let items;
    try{
        items = await db.query(`SELECT * FROM items WHERE id_users = $1 ORDER BY indice`, [req.session.userId]);
    } catch (error) {
        console.error('Error al obtener los items:', error);
        return res.status(500).send('Error al obtener los items');
    }

    //vamos a hacer un array con todos los accesorios del usuario
    //veamos que items del usuario tienen el tipo accesorio
    let accesoriosdiponibles = null;
    if(items.rows.length > 0){
     accesoriosdiponibles = items.rows.filter(item => item.categoria === 'accesorios');
    }

    res.render('perfil_personalizado.ejs', {
        rutaImagen: mascota.rutaImagen,
        accesorios: req.session.accesorios,
        mascotaNombre: mascota.nombre,
        usuario: req.session.username,
        mensajeDeContra: mensaje,
        descripcion: req.session.descripcion,
        Nombresaccesorios: accesorios,
        itemsaccesorios: accesoriosdiponibles
    });
});

app.get('/corral_mascota', requireLogin, async (req, res) => {

    const mascota = req.session.mascotaActual;
    let items;
    try{
        items = await db.query(`SELECT * FROM items WHERE id_users = $1 ORDER BY indice`, [req.session.userId]);
    } catch (error) {
        console.error('Error al obtener los items:', error);
        return res.status(500).send('Error al obtener los items');
    }



    res.render('corral.ejs', {
        rutaImagen: mascota.rutaImagen,
        accesorios: req.session.accesorios,
        mascotaNombre: mascota.nombre,
        especieDeMascota: mascota.especie,
        pronombre: mascota.pronombre,
        items: items.rows,
        juguetes: juguetes,
        comidasFavoritas: comidasFavoritas,
        corralesDisponibles: corralesDisponibles,
        fondoCorral: req.session.corral
    });
});

app.get('/ayuda',  requireLogin, (req, res) => {


    const mascota = req.session.mascotaActual;

    res.render('FAQ.ejs', {
        rutaImagen: mascota.rutaImagen,
        accesorios: req.session.accesorios
    });
});

app.get('/minijuegos', requireLogin, (req, res) => {
 
    const mascota = req.session.mascotaActual;

    res.render('minijuegos.ejs', {
        rutaImagen: mascota.rutaImagen,
        accesorios: req.session.accesorios
    });
});

app.get('/tienda', requireLogin, (req, res) => {

    const mascota = req.session.mascotaActual;

    res.render('tienda.ejs', {
        rutaImagen: mascota.rutaImagen,
        preciosAccesorios: preciosAccesorios,
        preciosComidas: preciosComidas,
        preciosJuguetes: preciosJuguetes,
        preciosCorrales: preciosCorrales,
        comidasFavoritas: comidasFavoritas,
        accesoriosVarios: accesorios,
        juguetes: juguetes,
        corralesDisponibles: corralesDisponibles,
        money: req.session.money,
        accesorios: req.session.accesorios
    });
});

/*---------------------------creamos rutas generales para los get necesarios-------------------------------------------*/


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