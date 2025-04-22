import express from 'express';
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
    password: "csgoisgoodgames123",
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













































import { urlencoded } from 'express';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);



const uploadDir = join(__dirname, 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    cb(null, `imagen-${uniqueSuffix}.${extension}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imágenes'));
    }
    cb(null, true);
  }
});

app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, 'public')));
app.use(express.json());
app.use(urlencoded({ extended: true }));

// Estructura de etiquetas
const etiquetasDisponibles = [
  'Ninguna','Videojuegos', 'Música', 'Cine', 'Tecnología', 
  'Literatura', 'Ciencia', 'Deportes', 'Moda', 'Gastronomía'
];

const subetiquetasDisponibles = [
  'Ninguna','Minecraft', 'Terraria', 'Roblox',
  'Rock', 'Pop', 'Electrónica',
  'Terror', 'Comedia', 'Acción',
  'Smartphones', 'Laptops', 'Gadgets',
  'Novela', 'Poesía', 'Ensayo',
  'Física', 'Biología', 'Astronomía',
  'Fútbol', 'Baloncesto', 'Tenis',
  'Casual', 'Formal', 'Vintage',
  'Guatemalteca', 'Estadounidense', 'Japonesa'
];

const extrasubetiquetasDisponibles = [
  'Ninguna','Minecraft', 'Terraria', 'Roblox',
  'Rock', 'Pop', 'Electrónica',
  'Terror', 'Comedia', 'Acción',
  'Smartphones', 'Laptops', 'Gadgets',
  'Novela', 'Poesía', 'Ensayo',
  'Física', 'Biología', 'Astronomía',
  'Fútbol', 'Baloncesto', 'Tenis',
  'Casual', 'Formal', 'Vintage',
  'Guatemalteca', 'Estadounidense', 'Japonesa'
];
let mensajes = [];
let nextId = 1;
let votos = {};
let comentarioNextId = 1;

// Ruta para obtener el estado de voto mejorada
app.get('/voto-estado/:tipo/:id', async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        mensaje: 'Usuario no autenticado' 
      });
    }
    
    let query, params;
    
    if (tipo === 'mensaje') {
      query = `SELECT valor FROM post_votes WHERE post_id = $1 AND user_id = $2`;
    } else if (tipo === 'comentario') {
      query = `SELECT valor FROM comment_votes WHERE comment_id = $1 AND user_id = $2`;
    } else {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Tipo inválido' 
      });
    }
    
    params = [parseInt(id), userId];
    
    const result = await db.query(query, params);
    const valorVoto = result.rows.length > 0 ? result.rows[0].valor : 0;
    
    return res.json({
      success: true,
      voto: valorVoto
    });
  } catch (error) {
    console.error('Error al obtener estado del voto:', error);
    return res.status(500).json({ 
      success: false, 
      mensaje: 'Error interno del servidor' 
    });
  }
});

// Ruta para obtener mensaje para edición
app.get('/mensaje/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const mensaje = mensajes.find(m => m.id === id);
  
  if (mensaje) {
    // Preparar datos para la edición, preservando toda la información
    const responseData = {
      id: mensaje.id,
      autor: mensaje.autor,
      mensaje: mensaje.mensaje,
      etiqueta: mensaje.etiqueta || '',
      subcategoria: mensaje.subcategoria || '',
      extrasubcategoria: mensaje.extrasubcategoria || '',
      imagenes: mensaje.imagenes || []
    };
    
    res.json(responseData);
  } else {
    res.status(404).json({ error: 'Mensaje no encontrado' });
  }
});


// Ruta para votar mensajes (corregida)
app.post('/votar/:id', async (req, res) => {
  try {
    const mensajeId = parseInt(req.params.id);
    const { valor } = req.body;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }
    
    // Encontrar el mensaje
    const mensajeIndex = mensajes.findIndex(m => m.id === mensajeId);
    
    if (mensajeIndex === -1) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }
    
    // Inicializar ranking si no existe
    if (!mensajes[mensajeIndex].ranking) {
      mensajes[mensajeIndex].ranking = 0;
    }
    
    // Siempre consultar el voto actual directamente desde la base de datos
    const votoActualQuery = await db.query(`
      SELECT valor FROM post_votes 
      WHERE post_id = $1 AND user_id = $2
    `, [mensajeId, userId]);
    
    // Si no hay filas, significa que no hay un voto (podría haber sido eliminado manualmente)
    const votoActual = votoActualQuery.rows.length > 0 ? votoActualQuery.rows[0].valor : 0;
    
    // Si el voto actual es igual al nuevo voto, cancelamos el voto
    let valorFinal = valor;
    if (votoActual === valor) {
      valorFinal = 0; // Cancelamos el voto
    }
    
    // Actualizar o insertar voto en la base de datos
    if (valorFinal === 0) {
      // Eliminar voto
      await db.query(`
        DELETE FROM post_votes 
        WHERE post_id = $1 AND user_id = $2
      `, [mensajeId, userId]);
      
      // Actualizar ranking en la base de datos
      await db.query(`
        UPDATE forum_posts 
        SET ranking = ranking - $1 
        WHERE id = $2
      `, [votoActual, mensajeId]);
    } else {
      // Verificar si ya existe un voto de este usuario
      if (votoActualQuery.rows.length > 0) {
        // Actualizar voto existente
        await db.query(`
          UPDATE post_votes 
          SET valor = $1 
          WHERE post_id = $2 AND user_id = $3
        `, [valorFinal, mensajeId, userId]);
        
        // Actualizar ranking en la base de datos
        await db.query(`
          UPDATE forum_posts 
          SET ranking = ranking - $1 + $2 
          WHERE id = $3
        `, [votoActual, valorFinal, mensajeId]);
      } else {
        // Insertar nuevo voto (como si fuera la primera vez)
        await db.query(`
          INSERT INTO post_votes (post_id, user_id, valor) 
          VALUES ($1, $2, $3)
        `, [mensajeId, userId, valorFinal]);
        
        // Actualizar ranking en la base de datos (solo sumamos el nuevo valor)
        await db.query(`
          UPDATE forum_posts 
          SET ranking = ranking + $1 
          WHERE id = $2
        `, [valorFinal, mensajeId]);
      }
    }
    
    // Consultar el nuevo ranking directamente desde la base de datos para asegurar consistencia
    const nuevoRankingQuery = await db.query(`
      SELECT ranking FROM forum_posts WHERE id = $1
    `, [mensajeId]);
    
    if (nuevoRankingQuery.rows.length > 0) {
      mensajes[mensajeIndex].ranking = nuevoRankingQuery.rows[0].ranking;
    }
    
    // Devolver el nuevo ranking y el valor del voto del usuario
    return res.json({ 
      success: true, 
      nuevoRanking: mensajes[mensajeIndex].ranking,
      valorVoto: valorFinal // Devolver el valor final del voto
    });
  } catch (error) {
    console.error('Error al votar mensaje:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error del servidor al procesar el voto: ' + error.message 
    });
  }
});

// Ruta para obtener todos los votos del usuario
app.get('/mis-votos', async (req, res) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }
    
    // Obtener todos los votos de mensajes del usuario
    const postVotesQuery = await db.query(`
      SELECT post_id, valor FROM post_votes WHERE user_id = $1
    `, [userId]);
    
    // Crear un objeto con los votos de mensajes
    const postVotos = {};
    postVotesQuery.rows.forEach(voto => {
      postVotos[voto.post_id] = voto.valor;
    });
    
    // Obtener todos los votos de comentarios del usuario
    const commentVotesQuery = await db.query(`
      SELECT comment_id, valor FROM comment_votes WHERE user_id = $1
    `, [userId]);
    
    // Crear un objeto con los votos de comentarios
    const commentVotos = {};
    commentVotesQuery.rows.forEach(voto => {
      commentVotos[voto.comment_id] = voto.valor;
    });
    
    return res.json({
      success: true,
      votos: postVotos,
      votosComentarios: commentVotos
    });
  } catch (error) {
    console.error('Error al obtener votos del usuario:', error);
    return res.status(500).json({
      success: false,
      error: 'Error del servidor al obtener votos: ' + error.message
    });
  }
});

// Ruta para votar comentarios (corregida)
app.post('/votar-comentario', async (req, res) => {
  try {
    const { comentarioId, valor } = req.body;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }
    
    if (!comentarioId || valor === undefined) {
      return res.json({ 
        success: false,
        mensaje: "Datos incompletos"
      });
    }
    
    // Convertir a números
    const comentarioIdNum = parseInt(comentarioId);
    const valorNum = parseInt(valor);
    
    console.log('Recibida petición de voto para comentario:', comentarioIdNum, 'con valor:', valorNum);
    
    // Buscar el comentario en todos los mensajes
    let comentarioEncontrado = null;
    let mensajeContenedor = null;
    
    // Recorrer todos los mensajes para encontrar el comentario
    for (const mensaje of mensajes) {
      if (mensaje.comentarios && mensaje.comentarios.length > 0) {
        const comentarioIndex = mensaje.comentarios.findIndex(c => c.id === comentarioIdNum);
        
        if (comentarioIndex !== -1) {
          comentarioEncontrado = mensaje.comentarios[comentarioIndex];
          mensajeContenedor = mensaje;
          break;
        }
      }
    }
    
    // Si no encuentra el comentario, retorna error
    if (!comentarioEncontrado) {
      console.log('Comentario no encontrado:', comentarioIdNum);
      return res.json({ 
        success: false, 
        mensaje: 'Comentario no encontrado' 
      });
    }

    // Inicializar ranking si no existe
    if (comentarioEncontrado.ranking === undefined) {
      comentarioEncontrado.ranking = 0;
    }
    
    // Obtener el voto actual del usuario para este comentario
    const votoActualQuery = await db.query(`
      SELECT valor FROM comment_votes 
      WHERE comment_id = $1 AND user_id = $2
    `, [comentarioIdNum, userId]);
    
    const votoActual = votoActualQuery.rows.length > 0 ? votoActualQuery.rows[0].valor : 0;
    
    // Si el voto actual es igual al nuevo voto, cancelamos el voto
    let valorFinal = valorNum;
    if (votoActual === valorNum) {
      valorFinal = 0; // Cancelamos el voto
    }
    
    // Actualizar el voto en la base de datos
    if (valorFinal === 0) {
      // Eliminar voto
      await db.query(`
        DELETE FROM comment_votes 
        WHERE comment_id = $1 AND user_id = $2
      `, [comentarioIdNum, userId]);
      
      // Actualizar ranking del comentario en la base de datos
      await db.query(`
        UPDATE forum_comments
        SET ranking = ranking - $1 
        WHERE id = $2
      `, [votoActual, comentarioIdNum]);
    } else {
      if (votoActual !== 0) {
        // Actualizar voto existente
        await db.query(`
          UPDATE comment_votes 
          SET valor = $1 
          WHERE comment_id = $2 AND user_id = $3
        `, [valorFinal, comentarioIdNum, userId]);
        
        // Actualizar ranking en la base de datos
        await db.query(`
          UPDATE forum_comments 
          SET ranking = ranking - $1 + $2 
          WHERE id = $3
        `, [votoActual, valorFinal, comentarioIdNum]);
      } else {
        // Insertar nuevo voto
        await db.query(`
          INSERT INTO comment_votes (comment_id, user_id, valor) 
          VALUES ($1, $2, $3)
        `, [comentarioIdNum, userId, valorFinal]);
        
        // Actualizar ranking en la base de datos
        await db.query(`
          UPDATE forum_comments 
          SET ranking = ranking + $1 
          WHERE id = $2
        `, [valorFinal, comentarioIdNum]);
      }
    }
    
    // Consultar el ranking actualizado de la base de datos
    const rankingQuery = await db.query(`
      SELECT ranking FROM forum_comments WHERE id = $1
    `, [comentarioIdNum]);
    
    const nuevoRanking = rankingQuery.rows.length > 0 ? rankingQuery.rows[0].ranking : comentarioEncontrado.ranking;
    
    // Actualizar el ranking en memoria
    comentarioEncontrado.ranking = nuevoRanking;
    
    console.log('Comentario actualizado:', comentarioIdNum, 'nuevo ranking:', nuevoRanking);
    
    return res.json({ 
      success: true, 
      nuevoRanking: nuevoRanking,
      valorVoto: valorFinal
    });

  } catch (error) {
    console.error('Error al votar comentario:', error);
    return res.status(500).json({ 
      success: false, 
      mensaje: "Error interno: " + error.message
    });
  }
});

// Eliminar este endpoint duplicado y sus referencias
// app.get('/voto-estado/:tipo/:id', async (req, res) => { ... });

// Ruta para publicar comentario
app.post('/publicar-comentario', upload.array('imagenes', 4), async (req, res) => {
    try {
      const { autor, comentario, mensaje_padre_id } = req.body;
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      }
      
      if (autor && comentario && mensaje_padre_id) {
        // Insert the comment into the database
        const commentResult = await db.query(
          `INSERT INTO forum_comments 
           (post_id, user_id, autor, comentario, fecha_str) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id, fecha`,
          [
            parseInt(mensaje_padre_id),
            userId,
            autor,
            comentario,
            new Date().toLocaleString()
          ]
        );
        
        const commentId = commentResult.rows[0].id;
        const fecha = commentResult.rows[0].fecha;
        
        // Handle image uploads for the comment
        const imagenes = [];
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            const imageId = Date.now() + Math.floor(Math.random() * 1000);
            await db.query(
              `INSERT INTO comment_images (comment_id, url, filename) VALUES ($1, $2, $3)`,
              [commentId, `/uploads/${file.filename}`, file.filename]
            );
            
            imagenes.push({
              id: imageId,
              url: `/uploads/${file.filename}`
            });
          }
        }
        
        // Update in-memory data
        const nuevoComentario = {
          id: commentId,
          autor,
          comentario,
          fecha,
          fechaStr: new Date().toLocaleString(),
          imagenes,
          ranking: 0,
          votoActual: 0
        };
        
        const mensajeIndex = mensajes.findIndex(m => m.id === parseInt(mensaje_padre_id));
        
        if (mensajeIndex === -1) {
          return res.status(404).json({ success: false, error: 'Mensaje padre no encontrado' });
        }
        
        if (!mensajes[mensajeIndex].comentarios) {
          mensajes[mensajeIndex].comentarios = [];
        }
        
        mensajes[mensajeIndex].comentarios.push(nuevoComentario);
        
        res.json({ 
          success: true, 
          mensaje: "Comentario publicado correctamente", 
          comentario: nuevoComentario 
        });
      } else {
        res.status(400).json({ success: false, error: 'Datos incompletos' });
      }
    } catch (error) {
      console.error('Error al publicar comentario:', error);
      res.status(500).json({ success: false, error: 'Error al publicar el comentario' });
    }
  });


// Function to load forum posts from the database
async function loadForumPosts() {
    try {
      // Load all posts
      const postResult = await db.query(`
        SELECT fp.*, u.username 
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.id
        ORDER BY fp.fecha DESC
      `);
      
      // Create an empty array to store the posts
      const dbMensajes = [];
      
      // Process each post
      for (const post of postResult.rows) {
        // Load images for this post
        const imageResult = await db.query(`
          SELECT id, url FROM post_images WHERE post_id = $1
        `, [post.id]);
        
        // Load comments for this post
        const commentResult = await db.query(`
          SELECT fc.*, u.username 
          FROM forum_comments fc
          JOIN users u ON fc.user_id = u.id
          WHERE fc.post_id = $1
          ORDER BY fc.fecha ASC
        `, [post.id]);
        
        // Process comments
        const comments = [];
        for (const comment of commentResult.rows) {
          // Load images for this comment
          const commentImageResult = await db.query(`
            SELECT id, url FROM comment_images WHERE comment_id = $1
          `, [comment.id]);
          
          comments.push({
            id: comment.id,
            autor: comment.autor,
            comentario: comment.comentario,
            fecha: comment.fecha,
            fechaStr: comment.fecha_str,
            imagenes: commentImageResult.rows.map(img => ({
              id: img.id,
              url: img.url
            })),
            ranking: comment.ranking || 0,
            votoActual: 0 // This will be updated per user session
          });
        }
        
        // Add the post to our array
        dbMensajes.push({
          id: post.id,
          user_id: post.user_id,
          autor: post.autor,
          mensaje: post.mensaje,
          etiqueta: post.etiqueta || "Ninguna",
          subcategoria: post.subcategoria || "Ninguna",
          extrasubcategoria: post.extrasubcategoria || "Ninguna",
          fecha: post.fecha,
          fechaStr: post.fecha_str,
          ranking: post.ranking || 0,
          imagenes: imageResult.rows.map(img => ({
            id: img.id,
            url: img.url
          })),
          comentarios: comments
        });
      }
      
      return dbMensajes;
    } catch (error) {
      console.error('Error loading forum posts:', error);
      return [];
    }
  }
  
  app.get('/foro', requireLogin, async (req, res) => {
    try {
      // Load posts from database
      mensajes = await loadForumPosts();
      nextId = mensajes.length > 0 ? Math.max(...mensajes.map(m => m.id)) + 1 : 1;
      
      // Load user votes to update votoActual values
      if (req.session.userId) {
        const userVotesResult = await db.query(`
          SELECT post_id, valor FROM post_votes WHERE user_id = $1
        `, [req.session.userId]);
        
        // Resto del código...
      }
      
      res.render('foro', { 
        username: req.session.username,
        userId: req.session.userId, // Añadimos el ID del usuario a la plantilla
        descripcion: req.session.descripcion,
        money: req.session.money,
        mascotaActual: req.session.mascotaActual || null,
        mensajes,
        etiquetasDisponibles,
        subetiquetasDisponibles,
        extrasubetiquetasDisponibles,
        rutaImagen: req.session.mascotaActual ? req.session.mascotaActual.rutaImagen : null,
        accesorios: req.session.accesorios
      });
    } catch (error) {
      console.error('Error rendering forum page:', error);
      res.status(500).send('Error loading forum page');
    }
  });

  // NUEVA RUTA: Obtener comentario para edición
app.get('/comentario/:mensajeId/:comentarioId', (req, res) => {
  try {
    const mensajeId = parseInt(req.params.mensajeId);
    const comentarioId = parseInt(req.params.comentarioId);
    
    const mensaje = mensajes.find(m => m.id === mensajeId);
    
    if (!mensaje || !mensaje.comentarios) {
      return res.status(404).json({ success: false, error: 'Mensaje o comentarios no encontrados' });
    }
    
    const comentario = mensaje.comentarios.find(c => c.id === comentarioId);
    
    if (!comentario) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }
    
    const datosComentario = {
      id: comentario.id,
      autor: comentario.autor,
      comentario: comentario.comentario,
      imagenes: comentario.imagenes || [],
      fecha: comentario.fecha,
      fechaStr: comentario.fechaStr
    };
    
    res.json({
      success: true,
      comentario: datosComentario
    });
  } catch (error) {
    console.error('Error al obtener comentario:', error);
    return res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});

// NUEVA RUTA: Actualizar comentario
app.put('/actualizar-comentario/:mensajeId/:comentarioId', upload.array('imagenes', 4), async (req, res) => {
  try {
    const mensajeId = parseInt(req.params.mensajeId);
    const comentarioId = parseInt(req.params.comentarioId);
    const { autor, comentario, mantener_imagenes } = req.body;
    
    // Validar datos básicos
    if (!autor || !comentario) {
      return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }
    
    // Buscar el mensaje en memoria para actualización local
    const mensajeIndex = mensajes.findIndex(m => m.id === mensajeId);
    
    if (mensajeIndex === -1 || !mensajes[mensajeIndex].comentarios) {
      return res.status(404).json({ success: false, error: 'Mensaje o comentarios no encontrados' });
    }
    
    // Buscar el comentario en memoria
    const comentarioIndex = mensajes[mensajeIndex].comentarios.findIndex(c => c.id === comentarioId);
    
    if (comentarioIndex === -1) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }
    
    // Obtener la fecha actual formateada
    const fechaActual = new Date();
    const fechaStr = fechaActual.toLocaleString() + ' (editado)';
    
    // Actualizar en la base de datos
    await db.query(`
      UPDATE forum_comments 
      SET autor = $1, comentario = $2, fecha_str = $3
      WHERE id = $4 AND post_id = $5
    `, [autor, comentario, fechaStr, comentarioId, mensajeId]);
    
    // Gestionar imágenes en la base de datos
    if (mantener_imagenes) {
      const mantenerArray = Array.isArray(mantener_imagenes) ? mantener_imagenes : [mantener_imagenes];
      const idsAMantener = mantenerArray.map(id => parseInt(id));
      
      // Obtener imágenes actuales de la base de datos
      const imagenesResult = await db.query(`
        SELECT id, url FROM comment_images WHERE comment_id = $1
      `, [comentarioId]);
      
      // Identificar imágenes a eliminar
      for (const imagen of imagenesResult.rows) {
        if (!idsAMantener.includes(imagen.id)) {
          // Eliminar de la base de datos
          await db.query(`DELETE FROM comment_images WHERE id = $1`, [imagen.id]);
          
          // Eliminar archivo físico
          const filename = imagen.url.split('/').pop();
          const imagePath = join(uploadDir, filename);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      }
    } else {
      // Si no hay imágenes a mantener, eliminar todas
      const imagenesResult = await db.query(`
        SELECT id, url FROM comment_images WHERE comment_id = $1
      `, [comentarioId]);
      
      // Eliminar archivos físicos
      for (const imagen of imagenesResult.rows) {
        const filename = imagen.url.split('/').pop();
        const imagePath = join(uploadDir, filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Eliminar todas las imágenes de la base de datos
      await db.query(`DELETE FROM comment_images WHERE comment_id = $1`, [comentarioId]);
    }
    
    // Añadir nuevas imágenes si hay
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // SOLUCIÓN: Incluir el filename en la inserción
        await db.query(`
          INSERT INTO comment_images (comment_id, url, filename)
          VALUES ($1, $2, $3)
        `, [comentarioId, `/uploads/${file.filename}`, file.filename]);
      }
    }
    
    // Actualizar la versión en memoria
    mensajes[mensajeIndex].comentarios[comentarioIndex].autor = autor;
    mensajes[mensajeIndex].comentarios[comentarioIndex].comentario = comentario;
    mensajes[mensajeIndex].comentarios[comentarioIndex].fechaStr = fechaStr;
    
    // Actualizar imágenes en memoria
    if (mantener_imagenes) {
      const mantenerArray = Array.isArray(mantener_imagenes) ? mantener_imagenes : [mantener_imagenes];
      const idsAMantener = mantenerArray.map(id => parseInt(id));
      
      mensajes[mensajeIndex].comentarios[comentarioIndex].imagenes = 
        mensajes[mensajeIndex].comentarios[comentarioIndex].imagenes.filter(imagen => 
          idsAMantener.includes(imagen.id)
        );
    } else {
      mensajes[mensajeIndex].comentarios[comentarioIndex].imagenes = [];
    }
    
    // Añadir nuevas imágenes en memoria
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Usar un ID único para las nuevas imágenes
        const newImageId = Date.now() + Math.floor(Math.random() * 1000);
        
        mensajes[mensajeIndex].comentarios[comentarioIndex].imagenes.push({
          id: newImageId,
          url: `/uploads/${file.filename}`
        });
      }
    }
    
    // Cargar la versión actualizada desde la base de datos para mantener consistencia
    await loadForumPosts();
    
    res.json({ 
      success: true, 
      comentario: mensajes[mensajeIndex].comentarios[comentarioIndex] 
    });
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});

// Ruta para actualizar mensaje
app.put('/actualizar/:id', upload.array('imagenes', 9), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { 
      autor, 
      mensaje, 
      etiqueta, 
      subcategoria, 
      extrasubcategoria, 
      mantener_imagenes 
    } = req.body;
    
    const index = mensajes.findIndex(m => m.id === id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }
    
    if (!autor || !mensaje) {
      return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }
    
    // Fecha formateada para la actualización
    const fechaStr = new Date().toLocaleString() + ' (editado)';
    
    // SOLUCIÓN: Actualizar en la base de datos
    await db.query(`
      UPDATE forum_posts 
      SET autor = $1, mensaje = $2, etiqueta = $3, subcategoria = $4, 
          extrasubcategoria = $5, fecha_str = $6
      WHERE id = $7
    `, [
      autor, 
      mensaje, 
      etiqueta || "Ninguna", 
      subcategoria || "Ninguna", 
      extrasubcategoria || "Ninguna", 
      fechaStr,
      id
    ]);
    
    // Actualizar datos básicos en memoria
    mensajes[index].autor = autor;
    mensajes[index].mensaje = mensaje;
    mensajes[index].fechaStr = fechaStr;
    mensajes[index].etiqueta = etiqueta || "Ninguna";
    mensajes[index].subcategoria = subcategoria || "Ninguna";
    mensajes[index].extrasubcategoria = extrasubcategoria || "Ninguna";
    
    // Gestionar imágenes en la base de datos
    const imagenesAntiguas = [...mensajes[index].imagenes];
    
    if (mantener_imagenes) {
      const mantenerArray = Array.isArray(mantener_imagenes) ? mantener_imagenes : [mantener_imagenes];
      const idsAMantener = mantenerArray.map(id => parseInt(id));
      
      // Obtener imágenes actuales
      const imagenesResult = await db.query(`
        SELECT id, url FROM post_images WHERE post_id = $1
      `, [id]);
      
      // Eliminar imágenes no seleccionadas para mantener
      for (const imagen of imagenesResult.rows) {
        if (!idsAMantener.includes(imagen.id)) {
          // Eliminar de la base de datos
          await db.query(`DELETE FROM post_images WHERE id = $1`, [imagen.id]);
          
          // Eliminar archivo físico
          const filename = imagen.url.split('/').pop();
          const imagePath = join(uploadDir, filename);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      }
      
      // Actualizar en memoria
      mensajes[index].imagenes = imagenesAntiguas.filter(imagen => 
        idsAMantener.includes(imagen.id)
      );
    } else {
      // Eliminar todas las imágenes de la base de datos
      const imagenesResult = await db.query(`
        SELECT id, url FROM post_images WHERE post_id = $1
      `, [id]);
      
      for (const imagen of imagenesResult.rows) {
        await db.query(`DELETE FROM post_images WHERE id = $1`, [imagen.id]);
        
        // Eliminar archivo físico
        const filename = imagen.url.split('/').pop();
        const imagePath = join(uploadDir, filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      mensajes[index].imagenes = [];
    }
    
    // Añadir nuevas imágenes
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Insertar en la base de datos
        const result = await db.query(`
          INSERT INTO post_images (post_id, url, filename)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [id, `/uploads/${file.filename}`, file.filename]);
        
        const newImageId = result.rows[0].id;
        
        // Añadir a la versión en memoria
        mensajes[index].imagenes.push({
          id: newImageId,
          url: `/uploads/${file.filename}`
        });
      }
    }
    
    // Refrescar todos los mensajes desde la base de datos
    await loadForumPosts();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar:', error);
    res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});

// Ruta para obtener comentarios
app.get('/comentarios/:messageId', (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const mensaje = mensajes.find(m => m.id === messageId);
    
    if (!mensaje) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }
    
    // Make sure we're returning comments in chronological order
    const comentarios = mensaje.comentarios || [];
    
    // Sort comments by date/id if needed
    // This ensures older comments appear first, newer comments at the bottom
    comentarios.sort((a, b) => a.id - b.id);
    
    // Return all comments for this message
    res.json({ 
      success: true,
      comentarios: comentarios
    });
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ success: false, error: 'Error al obtener comentarios' });
  }
});

app.get('/foro', requireLogin, (req, res) => {
    res.render('foro', { 
      username: req.session.username,
      descripcion: req.session.descripcion,
      money: req.session.money,
      mascotaActual: req.session.mascotaActual || null,
      mensajes,
      etiquetasDisponibles,
      subetiquetasDisponibles,
      extrasubetiquetasDisponibles,
      rutaImagen: req.session.mascotaActual ? req.session.mascotaActual.rutaImagen : null,
      accesorios: req.session.accesorios
    });
  });


// Ruta para eliminar mensajes con verificación de permisos
app.delete('/eliminar-mensaje/:id', requireLogin, async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.session.userId;
  
  try {
    // Buscar el mensaje para verificar que el usuario sea el autor
    const mensaje = mensajes.find(m => m.id === id);
    
    if (!mensaje) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }
    
    // Verificar que el usuario actual sea el autor del mensaje
    if (mensaje.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para eliminar este mensaje' });
    }
    
    // Eliminar el mensaje de la base de datos
    await db.query('DELETE FROM forum_posts WHERE id = $1 AND user_id = $2', [id, userId]);
    
    // Resto del código de eliminación...
    await db.query('DELETE FROM post_images WHERE post_id = $1', [id]);
    await db.query('DELETE FROM forum_comments WHERE post_id = $1', [id]);
    
    // Eliminar las imágenes del sistema de archivos si existen
    if (mensaje.imagenes && mensaje.imagenes.length > 0) {
      mensaje.imagenes.forEach(imagen => {
        const filename = imagen.url.split('/').pop();
        const imagePath = join(uploadDir, filename);
        
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }
    
    // Eliminar votos asociados al mensaje
    await db.query('DELETE FROM post_votes WHERE post_id = $1', [id]);
    
    // Filtrar el mensaje a eliminar de la memoria
    mensajes = mensajes.filter(m => m.id !== id);
    
    // Eliminar votos asociados al mensaje en memoria
    delete votos[id];
    
    return res.json({ 
      success: true,
      totalMensajes: mensajes.length
    });
  } catch (error) {
    console.error('Error al eliminar:', error);
    return res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});

// SOLUCIÓN AVANZADA EN BACKEND: Añadiendo más depuración y análisis detallado
app.delete('/eliminar-comentario/:mensajeId/:comentarioId', requireLogin, async (req, res) => {
  try {
    const mensajeId = parseInt(req.params.mensajeId);
    const comentarioId = parseInt(req.params.comentarioId);
    const userId = req.session.userId;

    console.log(`DEBUG: Intento de eliminar comentario - Mensaje ID: ${mensajeId}, Comentario ID: ${comentarioId}`);
    console.log(`DEBUG: Usuario en sesión - ID: ${userId}, Tipo: ${typeof userId}`);
    
    // Verificar que userId es válido
    if (!userId) {
      console.log('ERROR: No hay usuario en sesión');
      return res.status(401).json({ success: false, error: 'Debes iniciar sesión para eliminar comentarios' });
    }
    
    // Buscar el mensaje
    const mensaje = mensajes.find(m => m.id === mensajeId);
    
    if (!mensaje || !mensaje.comentarios) {
      console.log(`ERROR: Mensaje ${mensajeId} no encontrado o sin comentarios`);
      return res.status(404).json({ success: false, error: 'Mensaje o comentarios no encontrados' });
    }
    
    // Buscar el comentario
    const comentarioIndex = mensaje.comentarios.findIndex(c => c.id === comentarioId);
    
    if (comentarioIndex === -1) {
      console.log(`ERROR: Comentario ${comentarioId} no encontrado en mensaje ${mensajeId}`);
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }
    
    const comentario = mensaje.comentarios[comentarioIndex];
    
    // Verificación exhaustiva del autor del comentario
    console.log(`DEBUG: Datos del comentario - ID: ${comentarioId}`);
    console.log(`DEBUG: ID autor comentario: ${comentario.user_id}, Tipo: ${typeof comentario.user_id}`);
    console.log(`DEBUG: Nombre autor comentario: ${comentario.autor}`);
    
    // Comprobemos también los datos de la sesión completa
    console.log(`DEBUG: Datos de sesión:`, req.session);
    
    // SOLUCIÓN 1: Verificación multi-nivel de permisos
    let tienePermiso = false;
    
    // Verificación 1: Comparar user_id directamente (convertidos a string)
    if (String(userId) === String(comentario.user_id)) {
      console.log(`DEBUG: COINCIDENCIA DIRECTA DE IDs - Usuario ${userId} es autor ${comentario.user_id}`);
      tienePermiso = true;
    } 
    // Verificación 2: Comprobar si el usuario actual es administrador
    else if (req.session.isAdmin) {
      console.log(`DEBUG: PERMISO ADMIN - Usuario ${userId} es administrador`);
      tienePermiso = true;
    }
    // Verificación 3: Verificar también por nombre de usuario si está disponible
    else if (req.session.username && comentario.autor && 
             req.session.username.toLowerCase() === comentario.autor.toLowerCase()) {
      console.log(`DEBUG: COINCIDENCIA POR NOMBRE - ${req.session.username} es ${comentario.autor}`);
      tienePermiso = true;
    }
    
    if (!tienePermiso) {
      console.log(`ERROR: PERMISO DENEGADO - Usuario ${userId} intenta eliminar comentario de ${comentario.user_id}`);
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permiso para eliminar este comentario',
        debug: {
          userIdSession: userId,
          commentAuthorId: comentario.user_id,
          userIdType: typeof userId,
          authorIdType: typeof comentario.user_id
        }
      });
    }
    
    console.log('DEBUG: Verificación correcta, procediendo con eliminación');
    
    // MODIFICADO: Eliminar el comentario sin restricción de user_id para diagnóstico
    await db.query('DELETE FROM forum_comments WHERE id = $1', [comentarioId]);
    
    // Resto del código de eliminación...
    await db.query('DELETE FROM comment_images WHERE comment_id = $1', [comentarioId]);
    await db.query('DELETE FROM comment_votes WHERE comment_id = $1', [comentarioId]);
    
    // Eliminar las imágenes del comentario si existen
    if (comentario.imagenes && comentario.imagenes.length > 0) {
      comentario.imagenes.forEach(imagen => {
        const filename = imagen.url.split('/').pop();
        const imagePath = join(uploadDir, filename);
        
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }
    
    // Eliminar el comentario del array en memoria
    mensaje.comentarios.splice(comentarioIndex, 1);
    
    return res.json({ 
      success: true,
      totalComentarios: mensaje.comentarios.length
    });
  } catch (error) {
    console.error('ERROR GRAVE al eliminar comentario:', error);
    return res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});


// Ruta para publicar mensaje
app.post('/publicar', upload.array('imagenes', 9), async (req, res) => {
    try {
      const { autor, mensaje, etiqueta, subcategoria, extrasubcategoria } = req.body;
      const userId = req.session.userId; // Get user ID from session
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      }
      
      if (autor && mensaje) {
        // Insert the post into the database
        const postResult = await db.query(
          `INSERT INTO forum_posts 
           (user_id, autor, mensaje, etiqueta, subcategoria, extrasubcategoria, fecha_str) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING id, fecha`,
          [
            userId,
            autor,
            mensaje,
            etiqueta || "Ninguna",
            subcategoria || "Ninguna",
            extrasubcategoria || "Ninguna",
            new Date().toLocaleString()
          ]
        );
        
        const postId = postResult.rows[0].id;
        const fecha = postResult.rows[0].fecha;
        
        // Handle image uploads
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            await db.query(
              `INSERT INTO post_images (post_id, url, filename) VALUES ($1, $2, $3)`,
              [postId, `/uploads/${file.filename}`, file.filename]
            );
          }
        }
        
        // Update in-memory array for the current session
        const nuevoMensaje = {
          id: postId,
          user_id: userId,
          autor,
          mensaje,
          etiqueta: etiqueta || "Ninguna",
          subcategoria: subcategoria || "Ninguna",
          extrasubcategoria: extrasubcategoria || "Ninguna",
          fecha,
          fechaStr: new Date().toLocaleString(),
          ranking: 0,
          imagenes: req.files ? req.files.map(file => ({
            id: Date.now() + Math.floor(Math.random() * 1000),
            url: `/uploads/${file.filename}`
          })) : [],
          comentarios: []
        };
        
        votos[postId] = {};
        mensajes.push(nuevoMensaje);
        
        res.redirect('/foro');
      } else {
        res.status(400).json({ success: false, error: 'Datos incompletos' });
      }
    } catch (error) {
      console.error('Error al publicar:', error);
      res.status(500).send('Error al publicar el mensaje');
    }
  });


  app.get('/filtrar', (req, res) => {
    try {
      const { etiquetas, subetiquetas, extrasubetiquetas, orden, ranking, tipo } = req.query;
      const autor = req.session.usuario || req.query.autor; // Get current user from session or query
      
      // Clonar array de mensajes para no modificar el original
      let mensajesFiltrados = [...mensajes];
      
      // Comprobar si tenemos algún filtro activo
      const hayFiltrosActivos = etiquetas || subetiquetas || extrasubetiquetas || orden || ranking || tipo;
      
      // Si no hay filtros activos, devolver todos los mensajes ordenados por fecha
      if (!hayFiltrosActivos) {
        mensajesFiltrados.sort((a, b) => b.fecha - a.fecha);
        return res.json({
          success: true,
          mensajes: mensajesFiltrados,
          total: mensajesFiltrados.length
        });
      }
      
      // Filtrar por etiquetas principales
      if (etiquetas && etiquetas.length > 0) {
        const etiquetasArray = Array.isArray(etiquetas) ? etiquetas : [etiquetas];
        mensajesFiltrados = mensajesFiltrados.filter(m => 
          m.etiqueta && etiquetasArray.includes(m.etiqueta)
        );
      }
      
      // Filtrar por subetiquetas (subcategorías) - EXPANDIDO PARA INCLUIR EXTRA SUBCATEGORÍAS
      if (subetiquetas && subetiquetas.length > 0) {
        const subetiquetasArray = Array.isArray(subetiquetas) ? subetiquetas : [subetiquetas];
        mensajesFiltrados = mensajesFiltrados.filter(m => 
          // Verificar tanto subcategoria como extrasubcategoria
          (m.subcategoria && subetiquetasArray.some(subt => 
            m.subcategoria.toLowerCase().includes(subt.toLowerCase())
          )) ||
          (m.extrasubcategoria && subetiquetasArray.some(subt => 
            m.extrasubcategoria.toLowerCase().includes(subt.toLowerCase())
          ))
        );
      }
      
      // Filtrar por extra subetiquetas (con mayor flexibilidad)
      if (extrasubetiquetas && extrasubetiquetas.length > 0) {
        const extraSubetiquetasArray = Array.isArray(extrasubetiquetas) ? extrasubetiquetas : [extrasubetiquetas];
        mensajesFiltrados = mensajesFiltrados.filter(m => 
          m.extrasubcategoria && 
          extraSubetiquetasArray.some(extrasubt => 
            m.extrasubcategoria.toLowerCase().includes(extrasubt.toLowerCase())
          )
        );
      }
      
// Filtrar por tipo de publicación
if (tipo) {
  const usuarioActual = req.session.usuario || req.query.autor;
  console.log('Usuario actual (backend):', usuarioActual);
  
  switch (tipo) {
    case 'mios':
      mensajesFiltrados = mensajesFiltrados.filter(m => m.autor === usuarioActual);
      break;
    // caso 'todos' no requiere filtro
  }
}
      
      // Filtrar por ranking - FIXED thresholds
      if (ranking) {
        switch (ranking) {
          case 'populares':
            mensajesFiltrados = mensajesFiltrados.filter(m => m.ranking > 100);
            break;
          case 'medios':
            mensajesFiltrados = mensajesFiltrados.filter(m => m.ranking > 10 && m.ranking <= 100);
            break;
          case 'menos_populares':
            mensajesFiltrados = mensajesFiltrados.filter(m => m.ranking <= 10); // Includes negative values
            break;
          // 'todos' no requiere filtrado
        }
      }
      
      // Current date for time-based filtering
      const ahora = new Date();
      const treintaMinutosAtras = new Date(ahora - 30 * 60 * 1000);
      const unaSemanaAtras = new Date(ahora - 7 * 24 * 60 * 60 * 1000);
      const unDiaAtras = new Date(ahora - 24 * 60 * 60 * 1000);
      
      // Ordenar resultados - FIXED time-based filtering
      if (orden) {
        switch (orden) {
          case 'recientes':
            // Mensajes de los últimos 30 minutos
            mensajesFiltrados = mensajesFiltrados.filter(m => m.fecha >= treintaMinutosAtras);
            mensajesFiltrados.sort((a, b) => b.fecha - a.fecha);
            break;
          case 'antiguos':
            // Mensajes de hace más de una semana
            mensajesFiltrados = mensajesFiltrados.filter(m => m.fecha <= unaSemanaAtras);
            mensajesFiltrados.sort((a, b) => a.fecha - b.fecha);
            break;
          case 'nuevos_24h':
            // Mensajes del último día
            mensajesFiltrados = mensajesFiltrados.filter(m => m.fecha >= unDiaAtras);
            mensajesFiltrados.sort((a, b) => b.fecha - a.fecha);
            break;
          case 'mas_valorados':
            // Mensajes con más de 100 votos
            mensajesFiltrados = mensajesFiltrados.filter(m => m.ranking > 100);
            mensajesFiltrados.sort((a, b) => b.ranking - a.ranking);
            break;
          default:
            mensajesFiltrados.sort((a, b) => b.fecha - a.fecha);
        }
      } else {
        // Orden predeterminado: recientes primero
        mensajesFiltrados.sort((a, b) => b.fecha - a.fecha);
      }
      
      res.json({
        success: true,
        mensajes: mensajesFiltrados,
        total: mensajesFiltrados.length
      });
      
    } catch (error) {
      console.error('Error al filtrar:', error);
      res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
    }
  });

// Ruta para obtener subcategorías basadas en una etiqueta principal
app.get('/subcategorias/:etiqueta', (req, res) => {
  const { etiqueta } = req.params;
  const subcategoriasDisponibles = subetiquetasDisponibles[etiqueta] || [];
  
  res.json({
    success: true,
    subcategorias: subcategoriasDisponibles
  });
});

