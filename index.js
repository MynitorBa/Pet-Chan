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

// Modifica también la ruta de login para cargar los rangos del usuario en la sesión
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

      // ✅ Guardamos los datos del usuario en sesión, incluyendo rangos
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.descripcion = user.description;
      req.session.money = user.money;
      req.session.corral = user.corral;
      
      // Añadir los rangos a la sesión
      req.session.rango1 = user.rango1 || 'Ninguno';
      req.session.rango2 = user.rango2 || 'Ninguno';
      req.session.rango3 = user.rango3 || 'Ninguno';

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
      } else {
          req.session.accesorios = null;
      }

      res.redirect("/inicio");
  } catch (error) {
      console.error("Error en login:", error);
      res.status(500).render("login.ejs", { error: "Error al iniciar sesión" });
  }
});
app.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  try {
      // Validar longitud del nombre de usuario
      if (username.length < 5) {
          return res.render("register.ejs", { error: "El nombre de usuario debe tener al menos 5 caracteres" });
      }

      // Validar contraseña
      if (password.length < 8) {
          return res.render("register.ejs", { error: "La contraseña debe tener al menos 8 caracteres" });
      }

      // Verificar si la contraseña tiene al menos una letra mayúscula
      if (!/[A-Z]/.test(password)) {
          return res.render("register.ejs", { error: "La contraseña debe contener al menos una letra mayúscula" });
      }

      // Verificar si la contraseña tiene al menos un símbolo
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
          return res.render("register.ejs", { error: "La contraseña debe contener al menos un símbolo" });
      }

      if (password !== confirmPassword) {
          return res.render("register.ejs", { error: "Las contraseñas no coinciden" });
      }

      // Verificamos que el nombre de usuario no exista
      const existingUserResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      if (existingUserResult.rows.length > 0) {
          return res.render("register.ejs", { error: "El nombre de usuario ya existe" });
      }
            
      const hashedPassword = await hashPassword(password, { 
          keyLen: 64,
          N: 16384,
          r: 8,
          p: 1,
          maxmem: 64 * 1024 * 1024,
      });

      // Modificamos la consulta para incluir los rangos por defecto
      const result = await db.query(
          'INSERT INTO users (username, password, description, money, rango1, rango2, rango3) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username',
          [username, hashedPassword, "Descripción del usuario", 0, 'Ninguno', 'Ninguno', 'Ninguno']
      );
      
      const newUser = result.rows[0];
      req.session.userId = newUser.id;
      req.session.username = newUser.username;
      req.session.descripcion = "Descripción del usuario";
      req.session.money = 0;
      req.session.corral = null;
      
      // Inicializar rangos en la sesión
      req.session.rango1 = 'Ninguno';
      req.session.rango2 = 'Ninguno';
      req.session.rango3 = 'Ninguno';

      // vamos a poner los accesorios en null
      req.session.accesorios = null;

      res.redirect("/minijuegomascota");
  } catch (error) {
      console.error(error);
      res.status(500).render("register.ejs", { error: "Error al registrar el usuario" });
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
      descripcion: req.session.descripcion,
      // Añadimos los rangos desde la sesión
      rango1: req.session.rango1,
      rango2: req.session.rango2,
      rango3: req.session.rango3
  });
});

// Modificar la ruta '/perfil_personalizado' para obtener rangos directamente de la tabla users
app.get('/perfil_personalizado', requireLogin, async (req, res) => {
  const mascota = req.session.mascotaActual;
  const mensaje = req.session.mensajeDeContra || '';
  delete req.session.mensajeDeContra;

  try {
    // Obtener información del usuario incluyendo rangos directamente de la tabla users
    const userResult = await db.query(
      `SELECT username, description, rango1, rango2, rango3 FROM users WHERE id = $1`,
      [req.session.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).send('Usuario no encontrado');
    }

    const user = userResult.rows[0];
    
    // Si los rangos son NULL, establecerlos como 'Ninguno' por defecto
    const userRangos = {
      rango1: user.rango1 || 'Ninguno',
      rango2: user.rango2 || 'Ninguno',
      rango3: user.rango3 || 'Ninguno'
    };

    // Obtener items del usuario para los accesorios
    let items;
    try {
      items = await db.query(`SELECT * FROM items WHERE id_users = $1 ORDER BY indice`, [req.session.userId]);
    } catch (error) {
      console.error('Error al obtener los items:', error);
      return res.status(500).send('Error al obtener los items');
    }

    // Filtrar accesorios disponibles
    let accesoriosdiponibles = null;
    if (items.rows.length > 0) {
      accesoriosdiponibles = items.rows.filter(item => item.categoria === 'accesorios');
    }

    res.render('perfil_personalizado.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios,
      mascotaNombre: mascota.nombre,
      usuario: user.username,
      mensajeDeContra: mensaje,
      descripcion: user.description,
      Nombresaccesorios: accesorios,
      itemsaccesorios: accesoriosdiponibles,
      userRangos: userRangos
    });
    
  } catch (error) {
    console.error('Error al obtener datos del perfil:', error);
    return res.status(500).send('Error al cargar el perfil');
  }
});

// Implementar la ruta para guardar rangos directamente en la tabla users
app.post('/guardarRangos', requireLogin, async (req, res) => {
  const { rango1, rango2, rango3 } = req.body;
  const userId = req.session.userId;

  try {
    // Iniciar una transacción para asegurar que todas las actualizaciones sean consistentes
    await db.query('BEGIN');
    
    // Actualizar rangos en la tabla users
    await db.query(
      `UPDATE users SET rango1 = $1, rango2 = $2, rango3 = $3 WHERE id = $4`,
      [rango1, rango2, rango3, userId]
    );
    
    // Actualizar rangos en todos los posts anteriores del usuario
    await db.query(
      `UPDATE forum_posts SET rango1 = $1, rango2 = $2, rango3 = $3 WHERE user_id = $4`,
      [rango1, rango2, rango3, userId]
    );
    
    // Actualizar rangos en todos los comentarios anteriores del usuario
    await db.query(
      `UPDATE forum_comments SET rango1 = $1, rango2 = $2, rango3 = $3 WHERE user_id = $4`,
      [rango1, rango2, rango3, userId]
    );
    
    // Confirmar la transacción
    await db.query('COMMIT');
    
    // Actualizar la sesión para reflejar los cambios inmediatamente
    req.session.rango1 = rango1;
    req.session.rango2 = rango2;
    req.session.rango3 = rango3;
    
    // Recargar los mensajes del foro para que reflejen los cambios
    await loadForumPosts();
    
    res.redirect('/perfil_personalizado');
  } catch (error) {
    // Si algo falla, revertir la transacción
    await db.query('ROLLBACK');
    console.error('Error al guardar los rangos:', error);
    res.status(500).send('Error al guardar los rangos');
  }
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



app.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000');
})






















// Endpoint para obtener información básica de una comunidad
app.get('/api/comunidad/:id', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    
    // Obtener información de la comunidad
    const comunidadResult = await db.query(`
      SELECT * FROM comunidades WHERE id = $1
    `, [comunidadId]);
    
    if (comunidadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    
    res.json(comunidadResult.rows[0]);
  } catch (error) {
    console.error('Error al obtener información de la comunidad:', error);
    res.status(500).json({ error: 'Error al obtener información de la comunidad' });
  }
});

// Endpoint para obtener estadísticas de la comunidad
app.get('/api/comunidad/:id/stats', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    
    // Contar miembros
    const miembrosResult = await db.query(`
      SELECT COUNT(*) as members FROM comunidades_usuarios 
      WHERE comunidad_id = $1
    `, [comunidadId]);
    
    // Contar publicaciones
    const postsResult = await db.query(`
      SELECT COUNT(*) as posts FROM forum_posts 
      WHERE comunidad_id = $1
    `, [comunidadId]);
    
    res.json({
      members: parseInt(miembrosResult.rows[0].members) || 0,
      posts: parseInt(postsResult.rows[0].posts) || 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de la comunidad:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de la comunidad' });
  }
});

// Endpoint para verificar si el usuario es miembro
app.get('/api/comunidad/:id/is-member', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    const userId = req.session.userId;
    
    // Verificar en comunidades_usuarios
    const memberResult = await db.query(`
      SELECT * FROM comunidades_usuarios 
      WHERE comunidad_id = $1 AND user_id = $2
    `, [comunidadId, userId]);
    
    // Verificar si es creador
    const comunidadResult = await db.query(`
      SELECT * FROM comunidades 
      WHERE id = $1 AND creador_id = $2
    `, [comunidadId, userId]);
    
    const isMember = memberResult.rows.length > 0 || comunidadResult.rows.length > 0;
    
    res.json({ isMember });
  } catch (error) {
    console.error('Error al verificar membresía en la comunidad:', error);
    res.status(500).json({ error: 'Error al verificar membresía' });
  }
});

// Endpoint para unirse a una comunidad (versión API)
app.post('/api/comunidad/:id/join', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    const userId = req.session.userId;
    
    // Verificar si la comunidad existe
    const comunidadResult = await db.query(`
      SELECT * FROM comunidades WHERE id = $1
    `, [comunidadId]);
    
    if (comunidadResult.rows.length === 0) {
      return res.status(404).json({ success: false, mensaje: 'Comunidad no encontrada' });
    }
    
    const comunidad = comunidadResult.rows[0];
    
    // Verificar si ya es miembro (creador)
    if (comunidad.creador_id === userId) {
      return res.status(400).json({ success: false, mensaje: 'Ya eres el administrador de esta comunidad' });
    }
    
    // Verificar si ya es miembro
    const isMemberResult = await db.query(`
      SELECT * FROM comunidades_usuarios 
      WHERE comunidad_id = $1 AND user_id = $2
    `, [comunidadId, userId]);
    
    if (isMemberResult.rows.length > 0) {
      return res.status(400).json({ success: false, mensaje: 'Ya eres miembro de esta comunidad' });
    }
    
    // Si la comunidad es privada, crear solicitud
    if (comunidad.es_privada) {
      await db.query(`
        INSERT INTO solicitudes_comunidad 
        (usuario_id, comunidad_id, mensaje) 
        VALUES ($1, $2, $3)
        ON CONFLICT (usuario_id, comunidad_id) DO NOTHING
      `, [userId, comunidadId, req.body.mensaje || '']);
      
      return res.json({ 
        success: true, 
        mensaje: 'Solicitud enviada correctamente. Espera la aprobación de un administrador.',
        pending: true
      });
    }
    
    // Si la comunidad es pública, agregar directamente como miembro
    await db.query(`
      INSERT INTO comunidades_usuarios
      (comunidad_id, user_id, rol, fecha_union)
      VALUES ($1, $2, 'miembro', NOW())
    `, [comunidadId, userId]);
    
    return res.json({ 
      success: true, 
      mensaje: 'Te has unido a la comunidad correctamente', 
      pending: false 
    });
  } catch (error) {
    console.error('Error al unirse a la comunidad:', error);
    res.status(500).json({ success: false, mensaje: 'Error al procesar la solicitud' });
  }
});













import { urlencoded } from 'express';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);

// Inicialización de variables globales para las categorías
let etiquetasDisponibles = ['Ninguna'];
let subetiquetasDisponibles = ['Ninguna'];
let extrasubetiquetasDisponibles = ['Ninguna'];

// Variables globales para el foro
let mensajes = [];
let nextId = 1;
let votos = {};
let comentarioNextId = 1;

// Asegúrate de que esta función se llama al iniciar el servidor
initializeCategories();

// Configuración de almacenamiento para subida de archivos
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

// Configuración básica de Express
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, 'public')));
app.use(express.json());
app.use(urlencoded({ extended: true }));

// Función para cargar categorías desde la base de datos
async function loadCategoriesFromDB() {
  try {
    // Get main categories
    const categoriasResult = await db.query(`
      SELECT nombre FROM categories_metadata 
      WHERE tipo = 'categoria' AND activo = TRUE 
      ORDER BY nombre
    `);
    
    const etiquetasDisponibles = ['Ninguna'];
    categoriasResult.rows.forEach(row => {
      if (!etiquetasDisponibles.includes(row.nombre)) {
        etiquetasDisponibles.push(row.nombre);
      }
    });
    
    // Get subcategories
    const subcategoriasResult = await db.query(`
      SELECT nombre FROM categories_metadata 
      WHERE tipo = 'subcategoria' AND activo = TRUE 
      ORDER BY nombre
    `);
    
    const subetiquetasDisponibles = ['Ninguna'];
    subcategoriasResult.rows.forEach(row => {
      if (!subetiquetasDisponibles.includes(row.nombre)) {
        subetiquetasDisponibles.push(row.nombre);
      }
    });
    
    // Get extra subcategories
    const extrasubcategoriasResult = await db.query(`
      SELECT nombre FROM categories_metadata 
      WHERE tipo = 'extrasubcategoria' AND activo = TRUE 
      ORDER BY nombre
    `);
    
    const extrasubetiquetasDisponibles = ['Ninguna'];
    extrasubcategoriasResult.rows.forEach(row => {
      if (!extrasubetiquetasDisponibles.includes(row.nombre)) {
        extrasubetiquetasDisponibles.push(row.nombre);
      }
    });
    
    return {
      etiquetasDisponibles,
      subetiquetasDisponibles,
      extrasubetiquetasDisponibles
    };
  } catch (error) {
    console.error('Error loading categories from database:', error);
    
    // Fallback to only "Ninguna" if database loading fails
    return {
      etiquetasDisponibles: ['Ninguna'],
      subetiquetasDisponibles: ['Ninguna'],
      extrasubetiquetasDisponibles: ['Ninguna']
    };
  }
}

// Inicializar categorías al iniciar el servidor
async function initializeCategories() {
  try {
    const categories = await loadCategoriesFromDB();
    etiquetasDisponibles = categories.etiquetasDisponibles;
    subetiquetasDisponibles = categories.subetiquetasDisponibles;
    extrasubetiquetasDisponibles = categories.extrasubetiquetasDisponibles;
    console.log('Categories loaded from database successfully');
    console.log('Etiquetas disponibles:', etiquetasDisponibles);
    console.log('Subetiquetas disponibles:', subetiquetasDisponibles);
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
}

app.get('/extrasubcategorias/:subcategoria', async (req, res) => {
  try {
    const { subcategoria } = req.params;
    console.log(`Solicitando extra subcategorías para: ${subcategoria}`);
    
    if (subcategoria === 'Ninguna' || !subcategoria) {
      return res.json({
        success: true,
        extrasubcategorias: ['Ninguna']
      });
    }
    
    // Modificar esta consulta para obtener correctamente las extrasubcategorías
    const extrasubcategoriasResult = await db.query(`
      SELECT cm.nombre 
      FROM categories_metadata cm
      WHERE cm.tipo = 'extrasubcategoria' 
      AND cm.subcategoria = $1
      AND cm.activo = TRUE
      ORDER BY cm.nombre
    `, [subcategoria]);
    
    const extrasubcategorias = ['Ninguna'];
    extrasubcategoriasResult.rows.forEach(row => {
      if (!extrasubcategorias.includes(row.nombre)) {
        extrasubcategorias.push(row.nombre);
      }
    });
    
    console.log(`Extra subcategorías encontradas para ${subcategoria}:`, extrasubcategorias);
    
    res.json({
      success: true,
      extrasubcategorias: extrasubcategorias
    });
  } catch (error) {
    console.error('Error getting extra subcategories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error del servidor al obtener extra subcategorías: ' + error.message, 
      extrasubcategorias: ['Ninguna'] 
    });
  }
});

// Endpoint para depuración de categorías
app.get('/debug/categories', (req, res) => {
  res.json({
    etiquetasDisponibles,
    subetiquetasDisponibles,
    extrasubetiquetasDisponibles
  });
});







// Ruta para obtener subcategorías
app.get('/subcategorias/:etiqueta', async (req, res) => {
  try {
    const { etiqueta } = req.params;
    console.log(`Solicitando subcategorías para: ${etiqueta}`);
    
    if (etiqueta === 'Ninguna' || !etiqueta) {
      return res.json({
        success: true,
        subcategorias: ['Ninguna']
      });
    }
    
    // Modificar esta consulta para obtener correctamente las subcategorías
    const subcategoriasResult = await db.query(`
      SELECT cm.nombre 
      FROM categories_metadata cm
      WHERE cm.tipo = 'subcategoria' 
      AND cm.categoria = $1
      AND cm.activo = TRUE
      ORDER BY cm.nombre
    `, [etiqueta]);
    
    const subcategorias = ['Ninguna'];
    subcategoriasResult.rows.forEach(row => {
      if (!subcategorias.includes(row.nombre)) {
        subcategorias.push(row.nombre);
      }
    });
    
    console.log(`Subcategorías encontradas para ${etiqueta}:`, subcategorias);
    
    res.json({
      success: true,
      subcategorias: subcategorias
    });
  } catch (error) {
    console.error('Error getting subcategories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error del servidor al obtener subcategorías: ' + error.message, 
      subcategorias: ['Ninguna'] 
    });
  }
});







app.get('/filtrar', (req, res) => {
  try {
    // Añadir logs detallados para ver todos los parámetros recibidos
    console.log('REQUEST QUERY PARAMS:', req.query);
    console.log('REQUEST BODY:', req.body);
    
    // Obtener todos los parámetros de consulta
    const { etiquetas, subetiquetas, extrasubetiquetas, orden, ranking, tipo } = req.query;
    const comunidadId = req.query.comunidad_id ? parseInt(req.query.comunidad_id) : null;
    const autor = req.session.usuario || req.query.autor;
    
    // Logs detallados para comunidad_id
    console.log('Filtrado por comunidad_id:', comunidadId, typeof comunidadId);
    console.log('comunidad_id original:', req.query.comunidad_id, typeof req.query.comunidad_id);
    console.log('¿comunidad_id es nulo?:', comunidadId === null);
    console.log('¿comunidad_id está definido?:', comunidadId !== undefined);
    
    // Clonar array de mensajes para no modificar el original
    let mensajesFiltrados = [...mensajes];
    console.log('Total mensajes antes de filtrar:', mensajesFiltrados.length);
    
    // Comprobar si tenemos algún filtro activo (incluido comunidad_id)
    const hayFiltrosActivos = etiquetas || subetiquetas || extrasubetiquetas || orden || ranking || tipo || comunidadId !== null;
    console.log('¿Hay filtros activos?:', hayFiltrosActivos);
    
    // Si no hay filtros activos, devolver todos los mensajes ordenados por fecha
    if (!hayFiltrosActivos) {
      console.log('No hay filtros activos, devolviendo todos los mensajes ordenados por fecha');
      mensajesFiltrados.sort((a, b) => b.fecha - a.fecha);
      return res.json({
        success: true,
        mensajes: mensajesFiltrados,
        total: mensajesFiltrados.length
      });
    }
    
// Filtrar por comunidad_id si se proporciona
if (comunidadId !== null) {
  console.log(`Aplicando filtro por comunidad_id = ${comunidadId}`);
  const mensajesAntes = mensajesFiltrados.length;
  
  mensajesFiltrados = mensajesFiltrados.filter(m => {
    // Convertir ambos a número para la comparación
    return parseInt(m.comunidad_id) === comunidadId;
  });
  
  console.log(`Filtrando por comunidad_id = ${comunidadId}, encontrados ${mensajesFiltrados.length} mensajes de ${mensajesAntes} originales`);
}
    
    // Filtrar por etiquetas principales
    if (etiquetas && etiquetas.length > 0) {
      const etiquetasArray = Array.isArray(etiquetas) ? etiquetas : [etiquetas];
      console.log('Aplicando filtro por etiquetas:', etiquetasArray);
      mensajesFiltrados = mensajesFiltrados.filter(m => 
        m.etiqueta && etiquetasArray.includes(m.etiqueta)
      );
      console.log(`Después de filtrar por etiquetas: ${mensajesFiltrados.length} mensajes`);
    }

    // Filtrar por subetiquetas (subcategorías)
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
    
    // Filtrar por extra subetiquetas
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
    
    // Filtrar por ranking
    if (ranking) {
      switch (ranking) {
        case 'populares':
          mensajesFiltrados = mensajesFiltrados.filter(m => m.ranking > 100);
          break;
        case 'medios':
          mensajesFiltrados = mensajesFiltrados.filter(m => m.ranking > 10 && m.ranking <= 100);
          break;
        case 'menos_populares':
          mensajesFiltrados = mensajesFiltrados.filter(m => m.ranking <= 10);
          break;
      }
    }
    
    // Current date for time-based filtering
    const ahora = new Date();
    const treintaMinutosAtras = new Date(ahora - 30 * 60 * 1000);
    const unaSemanaAtras = new Date(ahora - 7 * 24 * 60 * 60 * 1000);
    const unDiaAtras = new Date(ahora - 24 * 60 * 60 * 1000);
    
    // Ordenar resultados
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
        case 'nuevos_semana':
          // Mensajes de la última semana
          mensajesFiltrados = mensajesFiltrados.filter(m => m.fecha >= unaSemanaAtras);
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
    
      // Justo antes de devolver los resultados
    console.log(`Total mensajes después de todos los filtros: ${mensajesFiltrados.length}`);
    
    // Devolver resultados con información adicional sobre el filtro de comunidad
    res.json({
      success: true,
      mensajes: mensajesFiltrados,
      total: mensajesFiltrados.length,
      filtros: {
        comunidadId: comunidadId,
        etiquetas: etiquetas,
        subetiquetas: subetiquetas,
        extrasubetiquetas: extrasubetiquetas,
        orden: orden,
        ranking: ranking,
        tipo: tipo
      }
    });
    
  } catch (error) {
    console.error('Error al filtrar:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});


// Modificación para la ruta de publicar post
app.post('/publicar', upload.array('imagenes', 9), async (req, res) => {
  try {
    const { autor, mensaje, etiqueta, subcategoria, extrasubcategoria, comunidad_id } = req.body;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }
    
    if (autor && mensaje) {
      // Agregar los rangos del usuario al post
      const rango1 = req.session.rango1 || 'Ninguno';
      const rango2 = req.session.rango2 || 'Ninguno';
      const rango3 = req.session.rango3 || 'Ninguno';
      
// Más adelante:
const postResult = await db.query(
  `INSERT INTO forum_posts 
   (user_id, autor, mensaje, etiqueta, subcategoria, extrasubcategoria, fecha_str, rango1, rango2, rango3, comunidad_id) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
   RETURNING id, fecha`,
  [
    userId,
    autor,
    mensaje,
    etiqueta || "Ninguna",
    subcategoria || "Ninguna",
    extrasubcategoria || "Ninguna",
    new Date().toLocaleString(),
    rango1,
    rango2,
    rango3,
    comunidad_id || null // Añadimos el comunidad_id si existe
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
      
      // Actualizar el objeto nuevoMensaje para incluir rangos y comunidad_id
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
        rango1: rango1,
        rango2: rango2,
        rango3: rango3,
        comunidad_id: comunidad_id || null,
        imagenes: req.files ? req.files.map(file => ({
          id: Date.now() + Math.floor(Math.random() * 1000),
          url: `/uploads/${file.filename}`
        })) : [],
        comentarios: [],
        comunidad_id: comunidad_id || null
      };
      
      votos[postId] = {};
      mensajes.push(nuevoMensaje);
      
      // Check and award coins for posting activity
      const rewardResult = await checkAndAwardCoins(userId, req.session.username, 'post', req);
      
      // If coins were awarded, send a notification
      if (rewardResult.awarded) {
        req.session.rewardNotification = {
          type: 'post',
          coins: rewardResult.coins,
          milestone: rewardResult.milestone,
          timestamp: Date.now(),
          bonusAwarded: rewardResult.bonusAwarded
        };
      }
      
 // Redirect to the appropriate context
if (comunidad_id) {
  res.redirect(`/foro?comunidad_id=${comunidad_id}`);
} else {
  res.redirect('/foro');
}
    } else {
      res.status(400).json({ success: false, error: 'Datos incompletos' });
    }
  } catch (error) {
    console.error('Error al publicar:', error);
    res.status(500).send('Error al publicar el mensaje');
  }
});














// Ruta principal del foro
app.get('/foro', requireLogin, async (req, res) => {
  try {
    // Load categories first to ensure they're available
    const categories = await loadCategoriesFromDB();
    etiquetasDisponibles = categories.etiquetasDisponibles;
    subetiquetasDisponibles = categories.subetiquetasDisponibles;
    extrasubetiquetasDisponibles = categories.extrasubetiquetasDisponibles;
    
    // Load posts from database
    mensajes = await loadForumPosts();
    nextId = mensajes.length > 0 ? Math.max(...mensajes.map(m => m.id)) + 1 : 1;
    
    // Load user votes to update votoActual values
    if (req.session.userId) {
      const userVotesResult = await db.query(`
        SELECT post_id, valor FROM post_votes WHERE user_id = $1
      `, [req.session.userId]);
      
      // Process user votes here
    }
    
    // Get all communities for the filter dropdown - ONLY PUBLIC ONES
    const communitiesResult = await db.query(
      'SELECT id, nombre, es_privada FROM comunidades WHERE es_privada = false ORDER BY nombre'
    );
    const communities = communitiesResult.rows;
    
    // Obtener las comunidades del usuario (tanto públicas como privadas a las que pertenece)
    const userCommunitiesResult = await db.query(`
      SELECT c.*
      FROM comunidades c
      WHERE c.creador_id = $1
      UNION
      SELECT c.*
      FROM comunidades c
      JOIN comunidades_usuarios cu ON c.id = cu.comunidad_id
      WHERE cu.user_id = $1
      ORDER BY nombre
    `, [req.session.userId]);
    const userCommunities = userCommunitiesResult.rows;
    
    res.render('foro', { 
      username: req.session.username,
      userId: req.session.userId,
      descripcion: req.session.descripcion,
      money: req.session.money,
      mascotaActual: req.session.mascotaActual || null,
      mensajes,
      etiquetasDisponibles,
      subetiquetasDisponibles,
      extrasubetiquetasDisponibles,
      rutaImagen: req.session.mascotaActual ? req.session.mascotaActual.rutaImagen : null,
      accesorios: req.session.accesorios,
      userRangos: {
        rango1: req.session.rango1 || 'Ninguno',
        rango2: req.session.rango2 || 'Ninguno',
        rango3: req.session.rango3 || 'Ninguno'
      },
      communities: communities,
      userCommunities: userCommunities,
      filtros: {
        showAllCommunities: true
      }
    });
  } catch (error) {
    console.error('Error rendering forum page:', error);
    res.status(500).send('Error loading forum page');
  }
});























async function loadForumPosts() {
  try {
    // Load all posts
    const postResult = await db.query(`
      SELECT fp.*, u.username,
             COALESCE(SUM(v.valor), 0) as ranking 
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      LEFT JOIN post_votes v ON fp.id = v.post_id
      GROUP BY fp.id, u.username
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
        SELECT fc.*, u.username,
               COALESCE(SUM(cv.valor), 0) as ranking
        FROM forum_comments fc
        JOIN users u ON fc.user_id = u.id
        LEFT JOIN comment_votes cv ON fc.id = cv.comment_id
        WHERE fc.post_id = $1
        GROUP BY fc.id, u.username
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
          user_id: comment.user_id,
          autor: comment.username,
          comentario: comment.comentario,
          fecha: comment.fecha,
          fechaStr: comment.fecha_str,
          rango1: comment.rango1 || 'Ninguno',
          rango2: comment.rango2 || 'Ninguno',
          rango3: comment.rango3 || 'Ninguno',
          imagenes: commentImageResult.rows.map(img => ({
            id: img.id,
            url: img.url
          })),
          ranking: comment.ranking || 0,
          votoActual: 0
        });
      }


      // Add the post to our array
      dbMensajes.push({
        id: post.id,
        user_id: post.user_id,
        autor: post.username,
        mensaje: post.mensaje,
        etiqueta: post.etiqueta || "Ninguna",
        subcategoria: post.subcategoria || "Ninguna",
        extrasubcategoria: post.extrasubcategoria || "Ninguna",
        fecha: post.fecha,
        fechaStr: post.fecha_str,
        comunidad_id: post.comunidad_id,
        ranking: post.ranking || 0,
        rango1: post.rango1 || 'Ninguno',
        rango2: post.rango2 || 'Ninguno',
        rango3: post.rango3 || 'Ninguno',
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


// Add this endpoint to your server code (app.js, server.js, or routes file)

// Route to get all subcategories from all categories
app.get('/todas-subcategorias', async (req, res) => {
  try {
    // Query all subcategories from the database
    const subcategoriasResult = await db.query(`
      SELECT nombre FROM categories_metadata 
      WHERE tipo = 'subcategoria' AND activo = TRUE 
      ORDER BY nombre
    `);
    
    const allSubcategorias = ['Ninguna'];
    subcategoriasResult.rows.forEach(row => {
      if (!allSubcategorias.includes(row.nombre)) {
        allSubcategorias.push(row.nombre);
      }
    });
    
    // Also include extra subcategories
    const extraSubcategoriasResult = await db.query(`
      SELECT nombre FROM categories_metadata 
      WHERE tipo = 'extrasubcategoria' AND activo = TRUE 
      ORDER BY nombre
    `);
    
    extraSubcategoriasResult.rows.forEach(row => {
      if (!allSubcategorias.includes(row.nombre)) {
        allSubcategorias.push(row.nombre);
      }
    });
    
    console.log(`Returning ${allSubcategorias.length} total subcategories`);
    
    res.json({
      success: true,
      subcategorias: allSubcategorias
    });
  } catch (error) {
    console.error('Error fetching all subcategories:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cargar las subcategorías'
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






app.get('/voto-estado/:tipo/:id', async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const userId = req.session.userId;
    // Obtener el comunidad_id desde la sesión o parámetros
    const comunidadId = req.query.comunidad_id || req.session.comunidadId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        mensaje: 'Usuario no autenticado' 
      });
    }
    
    let query, params;
    
    if (tipo === 'mensaje') {
      query = `SELECT valor FROM post_votes WHERE post_id = $1 AND user_id = $2 AND comunidad_id = $3`;
      params = [parseInt(id), userId, comunidadId];
    } else if (tipo === 'comentario') {
      query = `SELECT valor FROM comment_votes WHERE comment_id = $1 AND user_id = $2 AND comunidad_id = $3`;
      params = [parseInt(id), userId, comunidadId];
    } else {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Tipo inválido' 
      });
    }
    
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


app.post('/publicar-comentario', upload.array('imagenes', 4), async (req, res) => {
  try {
    const { autor, comentario, mensaje_padre_id, comunidad_id } = req.body;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }
    
    if (autor && comentario && mensaje_padre_id) {
      // Agregar los rangos del usuario al comentario
      const rango1 = req.session.rango1 || 'Ninguno';
      const rango2 = req.session.rango2 || 'Ninguno';
      const rango3 = req.session.rango3 || 'Ninguno';
      
      // Insert the comment into the database con comunidad_id
      const commentResult = await db.query(
        `INSERT INTO forum_comments 
         (post_id, user_id, autor, comentario, fecha_str, rango1, rango2, rango3, comunidad_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING id, fecha`,
        [
          parseInt(mensaje_padre_id),
          userId,
          autor,
          comentario,
          new Date().toLocaleString(),
          rango1,
          rango2,
          rango3,
          comunidad_id || null // Valor de comunidad_id, puede ser nulo
        ]
      );
      
      const commentId = commentResult.rows[0].id;
      const fecha = commentResult.rows[0].fecha;
      
      // Handle image uploads for the comment con comunidad_id
      const imagenes = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const imageId = Date.now() + Math.floor(Math.random() * 1000);
          await db.query(
            `INSERT INTO comment_images (comment_id, url, filename, comunidad_id) VALUES ($1, $2, $3, $4)`,
            [commentId, `/uploads/${file.filename}`, file.filename, comunidad_id || null]
          );
          
          imagenes.push({
            id: imageId,
            url: `/uploads/${file.filename}`
          });
        }
      }
      
      // Actualizar el objeto nuevoComentario para incluir rangos y comunidad_id
      const nuevoComentario = {
        id: commentId,
        autor,
        comentario,
        fecha,
        fechaStr: new Date().toLocaleString(),
        rango1: rango1,
        rango2: rango2,
        rango3: rango3,
        comunidad_id: comunidad_id || null,
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
      
      // Check and award coins for commenting activity - ESPECIFICANDO TIPO 'comment'
      const rewardResult = await checkAndAwardCoins(userId, req.session.username, 'comment', req);
      
      const response = { 
        success: true, 
        mensaje: "Comentario publicado correctamente", 
        comentario: nuevoComentario 
      };
      
      if (rewardResult.awarded) {
        // Añadir la recompensa a la respuesta JSON
        response.reward = {
          coins: rewardResult.coins,
          milestone: rewardResult.milestone,
          newTotal: rewardResult.newTotal,
          bonusAwarded: rewardResult.bonusAwarded,
          type: 'comment' // Aseguramos que el tipo sea comentario
        };
        
        // Y también guardar en la sesión para el sistema de notificaciones
        req.session.rewardNotification = {
          type: 'comment',
          coins: rewardResult.coins,
          milestone: rewardResult.milestone,
          bonusAwarded: rewardResult.bonusAwarded,
          timestamp: Date.now()
        };
      }
      
      res.json(response);
    } else {
      res.status(400).json({ success: false, error: 'Datos incompletos' });
    }
  } catch (error) {
    console.error('Error al publicar comentario:', error);
    res.status(500).json({ success: false, error: 'Error al publicar el comentario' });
  }
});

// Add a route to check for reward notifications
app.get('/check-rewards', requireLogin, (req, res) => {
  if (req.session.rewardNotification) {
    const notification = req.session.rewardNotification;
    // Clear the notification so it's only shown once
    req.session.rewardNotification = null;
    res.json({
      success: true,
      hasReward: true,
      notification
    });
  } else {
    res.json({
      success: true,
      hasReward: false
    });
  }
});

// Function to initialize user activity counts from database on server start

async function initializeUserActivityCounts() {
  try {
    const users = await db.query(`SELECT id FROM users`);
    
    for (const user of users.rows) {
      const userId = user.id;
      
      // Obtener también las comunidades asociadas con los posts/comments de este usuario
      const comunidadesResult = await db.query(`
        SELECT DISTINCT comunidad_id 
        FROM (
          SELECT comunidad_id FROM forum_posts WHERE user_id = $1
          UNION
          SELECT comunidad_id FROM forum_comments WHERE user_id = $1
        ) AS user_comunidades 
        WHERE comunidad_id IS NOT NULL`,
        [userId]
      );
      
      const comunidades = comunidadesResult.rows.map(row => row.comunidad_id);
      
      // Count posts for this user
      const postCountResult = await db.query(`
        SELECT COUNT(*) as count FROM forum_posts WHERE user_id = $1
      `, [userId]);
      
      // Count comments for this user
      const commentCountResult = await db.query(`
        SELECT COUNT(*) as count FROM forum_comments WHERE user_id = $1
      `, [userId]);
      
      const postCount = parseInt(postCountResult.rows[0].count);
      const commentCount = parseInt(commentCountResult.rows[0].count);
      
      // Calculate last awarded milestone for each type
      const lastPostAwardedAt = Math.floor(postCount / 5) * 5;
      const lastCommentAwardedAt = Math.floor(commentCount / 5) * 5;
      const lastPostBonusAwardedAt = Math.floor(postCount / 100) * 100;
      const lastCommentBonusAwardedAt = Math.floor(commentCount / 100) * 100;
      
      userActivityCounts[userId] = {
        postCount,
        commentCount,
        lastPostAwardedAt,
        lastCommentAwardedAt,
        lastPostBonusAwardedAt,
        lastCommentBonusAwardedAt,
        comunidades  // Nueva propiedad

      };
    }
    
    console.log('User activity counts initialized with separate post/comment tracking and communities');
  } catch (error) {
    console.error('Error initializing user activity counts:', error);
  }
}
// Call this function when the server starts
// Add this line near your other initialization code
app.use(async (req, res, next) => {
  // Initialize user activity counts if not already done
  if (Object.keys(userActivityCounts).length === 0) {
    await initializeUserActivityCounts();
  }
  next();
});

// Add a client-side notification system for frontend
// Add this to your public JS file or embed in your EJS template
/* 

*/


app.get('/comentario/:mensajeId/:comentarioId', async (req, res) => {
  try {
    const mensajeId = parseInt(req.params.mensajeId);
    const comentarioId = parseInt(req.params.comentarioId);
    
    // También podemos obtener el comentario directamente de la base de datos
    // para asegurar que incluya el comunidad_id
    const comentarioResult = await db.query(
      `SELECT c.*, array_agg(json_build_object('id', ci.id, 'url', ci.url)) as imagenes 
       FROM forum_comments c
       LEFT JOIN comment_images ci ON c.id = ci.comment_id
       WHERE c.id = $1 AND c.post_id = $2
       GROUP BY c.id`,
      [comentarioId, mensajeId]
    );
    
    if (comentarioResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }
    
    const comentarioDB = comentarioResult.rows[0];
    
    const datosComentario = {
      id: comentarioDB.id,
      autor: comentarioDB.autor,
      comentario: comentarioDB.comentario,
      imagenes: comentarioDB.imagenes[0].id ? comentarioDB.imagenes : [],
      fecha: comentarioDB.fecha,
      fechaStr: comentarioDB.fecha_str,
      comunidad_id: comentarioDB.comunidad_id
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


    
app.put('/actualizar-comentario/:mensajeId/:comentarioId', upload.array('imagenes', 4), async (req, res) => {
  try {
    const mensajeId = parseInt(req.params.mensajeId);
    const comentarioId = parseInt(req.params.comentarioId);
    const { autor, comentario, mantener_imagenes, comunidad_id } = req.body;
    
    // Validar datos básicos
    if (!autor || !comentario) {
      return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }
    
    // Actualizar en la base de datos incluyendo comunidad_id
    await db.query(`
      UPDATE forum_comments 
      SET autor = $1, comentario = $2, fecha_str = $3, comunidad_id = $4
      WHERE id = $5 AND post_id = $6
    `, [autor, comentario, new Date().toLocaleString() + ' (editado)', comunidad_id || null, comentarioId, mensajeId]);
    
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
      
      // Eliminar archivos físicos y registros
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
    
    // Añadir nuevas imágenes si hay, incluyendo comunidad_id
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Incluir el filename y comunidad_id en la inserción
        await db.query(`
          INSERT INTO comment_images (comment_id, url, filename, comunidad_id)
          VALUES ($1, $2, $3, $4)
        `, [comentarioId, `/uploads/${file.filename}`, file.filename, comunidad_id || null]);
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
      mantener_imagenes,
      comunidad_id  // Nuevo campo

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
    
     // Actualizar en la base de datos incluyendo comunidad_id
     await db.query(`
       UPDATE forum_posts 
       SET autor = $1, mensaje = $2, etiqueta = $3, subcategoria = $4, 
           extrasubcategoria = $5, fecha_str = $6, comunidad_id = $7
       WHERE id = $8
     `, [
       autor, 
       mensaje, 
       etiqueta || "Ninguna", 
       subcategoria || "Ninguna", 
       extrasubcategoria || "Ninguna", 
       fechaStr,
       comunidad_id || null,  // Nuevo parámetro
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
        // Insertar en la base de datos con comunidad_id
        const result = await db.query(`
          INSERT INTO post_images (post_id, url, filename, comunidad_id)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [id, `/uploads/${file.filename}`, file.filename, comunidad_id || null]);
        
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












// Agregar al archivo de rutas del servidor
app.get('/api/mis-comunidades', requireLogin, async (req, res) => {
  try {
    // Obtener las comunidades del usuario actual
    const result = await db.query(`
      SELECT c.id, c.nombre
      FROM comunidades c
      JOIN comunidad_miembros cm ON c.id = cm.comunidad_id
      WHERE cm.user_id = $1 AND cm.estado = 'aceptado'
      ORDER BY c.nombre
    `, [req.session.userId]);
    
    res.json({
      success: true,
      comunidades: result.rows
    });
  } catch (error) {
    console.error('Error al obtener las comunidades del usuario:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener las comunidades'
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

// Función para verificar y otorgar recompensas por votos
async function checkAndAwardVoteCoins(userId, username, req, isNewVote) {
  try {
    // Solo incrementamos el contador si es un voto genuinamente nuevo
    if (!isNewVote) {
      return { awarded: false };
    }
    
    // Inicializar contador si no existe
    if (!userVoteCounts[userId]) {
      userVoteCounts[userId] = {
        voteCount: 0,
        rewardedMilestones: [],
        bonusRewardedMilestones: [], // Añadimos seguimiento de bonos
        // Rastrear los IDs específicos de elementos que ya han sido votados
        votedItems: new Set()
      };
      
      // Cargar conteo de votos existente desde la base de datos
      const existingVotes = await db.query(
        `SELECT COUNT(*) as post_vote_count FROM post_votes WHERE user_id = $1
        UNION ALL
        SELECT COUNT(*) as comment_vote_count FROM comment_votes WHERE user_id = $1`
      , [userId]);
      
      if (existingVotes.rows.length === 2) {
        userVoteCounts[userId].voteCount = 
          parseInt(existingVotes.rows[0].post_vote_count) + 
          parseInt(existingVotes.rows[1].post_vote_count);
        
        // Inicializar los hitos ya recompensados basados en el conteo actual
        for (let i = 5; i <= userVoteCounts[userId].voteCount; i += 5) {
          if (i % 5 === 0) {
            userVoteCounts[userId].rewardedMilestones.push(i);
          }
          // Añadir seguimiento de bonos por múltiplos de 100
          if (i % 100 === 0 && i > 0) {
            userVoteCounts[userId].bonusRewardedMilestones.push(i);
          }
        }
        
        // Cargar elementos específicos que ya han sido votados
        const votedPostsQuery = await db.query(
          `SELECT post_id FROM post_votes WHERE user_id = $1`, [userId]
        );
        
        const votedCommentsQuery = await db.query(
          `SELECT comment_id FROM comment_votes WHERE user_id = $1`, [userId]
        );
        
        // Añadir los posts votados al set con un prefijo para distinguirlos
        votedPostsQuery.rows.forEach(row => {
          userVoteCounts[userId].votedItems.add(`post_${row.post_id}`);
        });
        
        // Añadir los comentarios votados al set con un prefijo para distinguirlos
        votedCommentsQuery.rows.forEach(row => {
          userVoteCounts[userId].votedItems.add(`comment_${row.comment_id}`);
        });
      }
    }
    
    // Incrementar el contador de votos
    userVoteCounts[userId].voteCount++;
    const currentCount = userVoteCounts[userId].voteCount;
    
    let coinsToAward = 0;
    let bonusAwarded = false;
    
    // Verificar si ha alcanzado un múltiplo de 5 y NO está ya en la lista de hitos recompensados
    if (currentCount % 5 === 0 && !userVoteCounts[userId].rewardedMilestones.includes(currentCount)) {
      // Añadir este hito a la lista de recompensados
      userVoteCounts[userId].rewardedMilestones.push(currentCount);
      
      // Otorgar 5 fichas por múltiplo de 5
      coinsToAward += 5;
    }
    
    // Verificar si ha alcanzado un múltiplo de 100 y NO está ya en la lista de bonos recompensados
    if (currentCount % 100 === 0 && currentCount > 0 && !userVoteCounts[userId].bonusRewardedMilestones.includes(currentCount)) {
      // Añadir este hito a la lista de bonos recompensados
      userVoteCounts[userId].bonusRewardedMilestones.push(currentCount);
      
      // Otorgar 50 fichas adicionales por múltiplo de 100
      coinsToAward += 50;
      bonusAwarded = true;
    }
    
    // Si hay fichas para otorgar, actualizar la base de datos
    if (coinsToAward > 0) {
      // Actualizar dinero del usuario en la base de datos
      const result = await db.query(
        `UPDATE users 
        SET money = money + $1 
        WHERE id = $2
        RETURNING money`
      , [coinsToAward, userId]);
      
      // Actualizar dinero en la sesión si está disponible
      let newTotal = null;
      if (req && req.session) {
        req.session.money = (req.session.money || 0) + coinsToAward;
        newTotal = req.session.money;
      }
      
      console.log(`Usuario ${username} (ID: ${userId}) recibió ${coinsToAward} fichas por alcanzar ${currentCount} votos!`);
      
      if (bonusAwarded) {
        console.log(`Incluyendo un bono de 50 fichas por alcanzar un múltiplo de 100 votos!`);
      }
      
      // Crear notificación de recompensa
      if (req && req.session) {
        req.session.rewardNotification = {
          type: 'vote',
          coins: coinsToAward,
          milestone: currentCount,
          bonusAwarded: bonusAwarded, // Indicar si se otorgó bono
          timestamp: Date.now()
        };
      }
      
      return {
        awarded: true,
        coins: coinsToAward,
        newTotal: newTotal,
        milestone: currentCount,
        bonusAwarded: bonusAwarded,
        type: 'vote'
      };
    }
    
    return { awarded: false };
  } catch (error) {
    console.error('Error otorgando fichas por votos:', error);
    return { awarded: false, error: error.message };
  }
}



// Inicialización mejorada para cargar elementos ya votados
async function initializeUserVoteCounts() {
  try {
    const users = await db.query(`SELECT id FROM users`);
    
    for (const user of users.rows) {
      const userId = user.id;
      
      // Contar votos de este usuario
      const postVotesResult = await db.query(`
        SELECT COUNT(*) as count FROM post_votes WHERE user_id = $1
      `, [userId]);
      
      const commentVotesResult = await db.query(`
        SELECT COUNT(*) as count FROM comment_votes WHERE user_id = $1
      `, [userId]);
      
      const totalVotes = parseInt(postVotesResult.rows[0].count) + parseInt(commentVotesResult.rows[0].count);
      
      // Inicializar la estructura con los hitos ya recompensados
      const rewardedMilestones = [];
      const bonusRewardedMilestones = []; // Añadir seguimiento de bonos
      
      for (let i = 5; i <= totalVotes; i += 5) {
        if (i % 5 === 0) {
          rewardedMilestones.push(i);
        }
        // Añadir seguimiento de bonos por múltiplos de 100
        if (i % 100 === 0 && i > 0) {
          bonusRewardedMilestones.push(i);
        }
      }
      
      // Cargar los elementos específicos que ya han sido votados
      const votedPostsQuery = await db.query(
        `SELECT post_id FROM post_votes WHERE user_id = $1`, [userId]
      );
      
      const votedCommentsQuery = await db.query(
        `SELECT comment_id FROM comment_votes WHERE user_id = $1`, [userId]
      );
      
      // Crear un Set para almacenar los elementos votados
      const votedItems = new Set();
      
      // Añadir los posts votados al set con un prefijo para distinguirlos
      votedPostsQuery.rows.forEach(row => {
        votedItems.add(`post_${row.post_id}`);
      });
      
      // Añadir los comentarios votados al set con un prefijo para distinguirlos
      votedCommentsQuery.rows.forEach(row => {
        votedItems.add(`comment_${row.comment_id}`);
      });
      
      userVoteCounts[userId] = {
        voteCount: totalVotes,
        rewardedMilestones,
        bonusRewardedMilestones, // Añadir al objeto
        votedItems
      };
    }
    
    console.log('User vote counts initialized with vote tracking');
  } catch (error) {
    console.error('Error initializing user vote counts:', error);
  }
}

// Llamar a esta función al iniciar el servidor
app.use(async (req, res, next) => {
  // Inicializar contadores de votos si no se ha hecho ya
  if (Object.keys(userVoteCounts).length === 0) {
    await initializeUserVoteCounts();
  }
  next();
});

// Ruta para votar mensajes
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
    
    // Obtener la comunidad_id del mensaje
    const comunidadId = mensajes[mensajeIndex].comunidad_id || null;
    
    // Inicializar ranking si no existe
    if (!mensajes[mensajeIndex].ranking) {
      mensajes[mensajeIndex].ranking = 0;
    }
    
    // Siempre consultar el voto actual directamente desde la base de datos
    const votoActualQuery = await db.query(`
      SELECT valor FROM post_votes 
      WHERE post_id = $1 AND user_id = $2 AND (comunidad_id = $3 OR comunidad_id IS NULL)
    `, [mensajeId, userId, comunidadId]);
    
    // Si no hay filas, significa que no hay un voto (podría haber sido eliminado manualmente)
    const votoActual = votoActualQuery.rows.length > 0 ? votoActualQuery.rows[0].valor : 0;
    
    // Si el voto actual es igual al nuevo voto, cancelamos el voto
    let valorFinal = valor;
    if (votoActual === valor) {
      valorFinal = 0; // Cancelamos el voto
    }
    
    // VERIFICACIÓN CLAVE: Comprobar si este elemento ya ha sido votado previamente
    // Usar el objeto userVoteCounts si existe
    let isNewVote = false;
    const itemKey = `post_${mensajeId}`;
    
    if (userVoteCounts[userId] && !userVoteCounts[userId].votedItems.has(itemKey)) {
      // Este es un voto genuinamente nuevo
      isNewVote = true;
      // Agregar a los elementos votados
      userVoteCounts[userId].votedItems.add(itemKey);
    }
    
    // Actualizar o insertar voto en la base de datos
    if (valorFinal === 0) {
      // Eliminar voto
      await db.query(`
        DELETE FROM post_votes 
        WHERE post_id = $1 AND user_id = $2 AND (comunidad_id = $3 OR comunidad_id IS NULL)
      `, [mensajeId, userId, comunidadId]);
      
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
          SET valor = $1, comunidad_id = $4
          WHERE post_id = $2 AND user_id = $3
        `, [valorFinal, mensajeId, userId, comunidadId]);
        
        // Actualizar ranking en la base de datos
        await db.query(`
          UPDATE forum_posts 
          SET ranking = ranking - $1 + $2 
          WHERE id = $3
        `, [votoActual, valorFinal, mensajeId]);
      } else {
        // Insertar nuevo voto (como si fuera la primera vez)
        await db.query(`
          INSERT INTO post_votes (post_id, user_id, valor, comunidad_id) 
          VALUES ($1, $2, $3, $4)
        `, [mensajeId, userId, valorFinal, comunidadId]);
        
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
    
    // Si es un voto nuevo, verificar recompensas - PASAR isNewVote
    let rewardResult = { awarded: false };
    if (isNewVote) {
      rewardResult = await checkAndAwardVoteCoins(userId, req.session.username, req, isNewVote);
    }
    
    // Preparar respuesta
    const response = {
      success: true,
      nuevoRanking: mensajes[mensajeIndex].ranking,
      valorVoto: valorFinal // Devolver el valor final del voto
    };
    
    // Añadir información de recompensa si se otorgó
    if (rewardResult.awarded) {
      response.reward = {
        coins: rewardResult.coins,
        milestone: rewardResult.milestone,
        newTotal: rewardResult.newTotal,
        type: 'vote'
      };
    }
    
    return res.json(response);
  } catch (error) {
    console.error('Error al votar mensaje:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error del servidor al procesar el voto: ' + error.message 
    });
  }
});

// Ruta para votar comentarios
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
    
    // Obtener la comunidad_id del comentario o del mensaje contenedor
    const comunidadId = comentarioEncontrado.comunidad_id || mensajeContenedor.comunidad_id || null;

    // Inicializar ranking si no existe
    if (comentarioEncontrado.ranking === undefined) {
      comentarioEncontrado.ranking = 0;
    }
    
    // Obtener el voto actual del usuario para este comentario
    const votoActualQuery = await db.query(`
      SELECT valor FROM comment_votes 
      WHERE comment_id = $1 AND user_id = $2 AND (comunidad_id = $3 OR comunidad_id IS NULL)
    `, [comentarioIdNum, userId, comunidadId]);
    
    const votoActual = votoActualQuery.rows.length > 0 ? votoActualQuery.rows[0].valor : 0;
    
    // Si el voto actual es igual al nuevo voto, cancelamos el voto
    let valorFinal = valorNum;
    if (votoActual === valorNum) {
      valorFinal = 0; // Cancelamos el voto
    }
    
    // VERIFICACIÓN CLAVE: Comprobar si este elemento ya ha sido votado previamente
    let isNewVote = false;
    const itemKey = `comment_${comentarioIdNum}`;
    
    if (userVoteCounts[userId] && !userVoteCounts[userId].votedItems.has(itemKey)) {
      // Este es un voto genuinamente nuevo
      isNewVote = true;
      // Agregar a los elementos votados
      userVoteCounts[userId].votedItems.add(itemKey);
    }
    
    // Actualizar el voto en la base de datos
    if (valorFinal === 0) {
      // Eliminar voto
      await db.query(`
        DELETE FROM comment_votes 
        WHERE comment_id = $1 AND user_id = $2 AND (comunidad_id = $3 OR comunidad_id IS NULL)
      `, [comentarioIdNum, userId, comunidadId]);
      
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
          SET valor = $1, comunidad_id = $4
          WHERE comment_id = $2 AND user_id = $3
        `, [valorFinal, comentarioIdNum, userId, comunidadId]);
        
        // Actualizar ranking en la base de datos
        await db.query(`
          UPDATE forum_comments 
          SET ranking = ranking - $1 + $2 
          WHERE id = $3
        `, [votoActual, valorFinal, comentarioIdNum]);
      } else {
        // Insertar nuevo voto
        await db.query(`
          INSERT INTO comment_votes (comment_id, user_id, valor, comunidad_id) 
          VALUES ($1, $2, $3, $4)
        `, [comentarioIdNum, userId, valorFinal, comunidadId]);
        
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
    
    // Si es un voto nuevo, verificar recompensas - PASAR isNewVote
    let rewardResult = { awarded: false };
    if (isNewVote) {
      rewardResult = await checkAndAwardVoteCoins(userId, req.session.username, req, isNewVote);
    }
    
    // Preparar respuesta
    const response = {
      success: true,
      nuevoRanking: nuevoRanking,
      valorVoto: valorFinal
    };
    
    // Añadir información de recompensa si se otorgó
    if (rewardResult.awarded) {
      response.reward = {
        coins: rewardResult.coins,
        milestone: rewardResult.milestone,
        newTotal: rewardResult.newTotal,
        type: 'vote'
      };
    }
    
    return res.json(response);
  } catch (error) {
    console.error('Error al votar comentario:', error);
    return res.status(500).json({ 
      success: false, 
      mensaje: "Error interno: " + error.message
    });
  }
});





// Variables para rastrear la actividad de los usuarios
let userActivityCounts = {}; // Almacenará conteos de posts/comentarios para cada usuario
let userVoteCounts = {}; // Almacenará conteos de votos para cada usuario

// Función para verificar y otorgar recompensas por publicaciones y comentarios
async function checkAndAwardCoins(userId, username, type, req) {
  try {
    // Inicializar seguimiento de actividad del usuario si es necesario
    if (!userActivityCounts[userId]) {
      userActivityCounts[userId] = {
        postCount: 0,
        commentCount: 0,
        lastPostAwardedAt: 0,
        lastCommentAwardedAt: 0,
        lastPostBonusAwardedAt: 0,
        lastCommentBonusAwardedAt: 0
      };
      
      // Cargar conteos existentes desde la base de datos
      const postCountQuery = await db.query(
        `SELECT COUNT(*) as post_count FROM forum_posts WHERE user_id = $1`,
        [userId]
      );
      
      const commentCountQuery = await db.query(
        `SELECT COUNT(*) as comment_count FROM forum_comments WHERE user_id = $1`,
        [userId]
      );
      
      userActivityCounts[userId].postCount = parseInt(postCountQuery.rows[0].post_count);
      userActivityCounts[userId].commentCount = parseInt(commentCountQuery.rows[0].comment_count);
    }
    
    // Determinar qué contador incrementar basado en el tipo
    let currentCount, lastAwardedAt, lastBonusAwardedAt;
    
    if (type === 'post') {
      // Incrementar contador de publicaciones
      userActivityCounts[userId].postCount++;
      currentCount = userActivityCounts[userId].postCount;
      lastAwardedAt = userActivityCounts[userId].lastPostAwardedAt;
      lastBonusAwardedAt = userActivityCounts[userId].lastPostBonusAwardedAt || 0;
    } else if (type === 'comment') {
      // Incrementar contador de comentarios
      userActivityCounts[userId].commentCount++;
      currentCount = userActivityCounts[userId].commentCount;
      lastAwardedAt = userActivityCounts[userId].lastCommentAwardedAt;
      lastBonusAwardedAt = userActivityCounts[userId].lastCommentBonusAwardedAt || 0;
    } else {
      return { awarded: false, error: 'Tipo de actividad inválido' };
    }
    
    let coinsToAward = 0;
    let bonusAwarded = false;
    let regularAwarded = false;
    
    // Verificar si el usuario ha alcanzado un múltiplo de 5
    if (currentCount % 5 === 0) {
      // Otorgar 5 fichas por cada múltiplo de 5
      coinsToAward += 5;
      regularAwarded = true;
      
      // Actualizar el último punto de recompensa regular según el tipo
      if (type === 'post') {
        userActivityCounts[userId].lastPostAwardedAt = currentCount;
      } else {
        userActivityCounts[userId].lastCommentAwardedAt = currentCount;
      }
    }
    
    // Verificar si el usuario ha alcanzado un múltiplo de 100
    if (currentCount % 100 === 0 && currentCount > 0) {
      // Solo otorgar bono si aún no se ha otorgado para este hito
      if (lastBonusAwardedAt < currentCount) {
        // Otorgar 50 fichas adicionales por múltiplos de 100
        coinsToAward += 50;
        bonusAwarded = true;
        
        // Actualizar el último bono otorgado según el tipo
        if (type === 'post') {
          userActivityCounts[userId].lastPostBonusAwardedAt = currentCount;
        } else {
          userActivityCounts[userId].lastCommentBonusAwardedAt = currentCount;
        }
      }
    }
    
    // Si hay fichas para otorgar, actualizar la base de datos
    if (coinsToAward > 0) {
      // Actualizar el dinero del usuario en la base de datos
      const result = await db.query(
        `UPDATE users 
        SET money = money + $1 
        WHERE id = $2
        RETURNING money`,
        [coinsToAward, userId]
      );
      
      // También actualizar en la sesión si está disponible
      let newTotal = null;
      if (req && req.session) {
        req.session.money = (req.session.money || 0) + coinsToAward;
        newTotal = req.session.money;
      }
      
      const activityType = type === 'post' ? 'publicaciones' : 'comentarios';
      console.log(`Usuario ${username} (ID: ${userId}) recibió ${coinsToAward} fichas por alcanzar ${currentCount} ${activityType}!`);
      
      if (bonusAwarded) {
        console.log(`Incluyendo un bono de 50 fichas por alcanzar un múltiplo de 100 ${activityType}!`);
      }
      
      return {
        awarded: true,
        coins: coinsToAward,
        newTotal: newTotal,
        milestone: currentCount,
        bonusAwarded: bonusAwarded,
        type: type
      };
    }
    
    return { awarded: regularAwarded || bonusAwarded };
  } catch (error) {
    console.error('Error al otorgar fichas:', error);
    return { awarded: false, error: error.message };
  }
}


















































































app.get('/comunidad', requireLogin, async (req, res) => {
  try {
    // Obtener todas las comunidades (ahora incluyendo subcategorías)
    const comunidadesResult = await db.query(`
      SELECT * FROM comunidades ORDER BY fecha_creacion DESC
    `);

    // Obtener las comunidades creadas por el usuario
// Obtener todas las comunidades donde el usuario es creador o miembro
const misComunidadesResult = await db.query(`
  SELECT c.*
  FROM comunidades c
  WHERE c.creador_id = $1
  UNION
  SELECT c.*
  FROM comunidades c
  JOIN comunidades_usuarios cu ON c.id = cu.comunidad_id
  WHERE cu.user_id = $1
  ORDER BY fecha_creacion DESC
`, [req.session.userId]);

    // Obtener categorías para el filtro
    const categoriasResult = await db.query(`
      SELECT DISTINCT nombre FROM categories_metadata 
      WHERE tipo = 'categoria' AND activo = TRUE
      ORDER BY nombre
    `);

    // Obtener subcategorías para el filtro
    const subcategoriasResult = await db.query(`
      SELECT DISTINCT nombre FROM categories_metadata 
      WHERE tipo = 'subcategoria' AND activo = TRUE
      ORDER BY nombre
    `);

    // Obtener publicaciones recientes
    const publicacionesRecientesResult = await db.query(`
      SELECT p.*, u.username as autor_nombre, c.nombre as comunidad_nombre
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      JOIN comunidades c ON p.comunidad_id = c.id
      ORDER BY p.fecha DESC
      LIMIT 5
    `);

    // Obtener mis solicitudes pendientes
    const misSolicitudesResult = await db.query(`
      SELECT s.*, c.nombre as nombre_comunidad, c.id as comunidad_id
      FROM solicitudes_comunidad s
      JOIN comunidades c ON s.comunidad_id = c.id
      WHERE s.usuario_id = $1
      ORDER BY s.fecha_solicitud DESC
    `, [req.session.userId]);

    // Verificar si el usuario es administrador o moderador en alguna comunidad
    const misComunidadesAdminResult = await db.query(`
      SELECT c.*
      FROM comunidades c
      WHERE c.creador_id = $1
      UNION
      SELECT c.*
      FROM comunidades c
      JOIN comunidades_usuarios cu ON c.id = cu.comunidad_id
      WHERE cu.user_id = $1 AND cu.rol IN ('administrador', 'moderador')
    `, [req.session.userId]);

    // Si es admin/mod, obtener solicitudes pendientes para esas comunidades
    let solicitudesAdmin = [];
    if (misComunidadesAdminResult.rows.length > 0) {
      const comunidadesIds = misComunidadesAdminResult.rows.map(c => c.id);

      const solicitudesAdminResult = await db.query(`
        SELECT s.*, u.username, c.nombre as nombre_comunidad, c.id as comunidad_id
        FROM solicitudes_comunidad s
        JOIN users u ON s.usuario_id = u.id
        JOIN comunidades c ON s.comunidad_id = c.id
        WHERE s.comunidad_id = ANY($1) AND s.estado = 'pendiente'
        ORDER BY s.fecha_solicitud ASC
      `, [comunidadesIds]);

      solicitudesAdmin = solicitudesAdminResult.rows;
    }

    // Comprobar si hay mensajes de éxito
    const mensaje = req.query.mensaje || null;
    const exito = req.query.exito === 'true';

    // Renderizar vista con todos los datos
    res.render('comunidades', {
      username: req.session.username,
      userId: req.session.userId,
      descripcion: req.session.descripcion || '',
      money: req.session.money || 0,
      mascotaActual: req.session.mascotaActual || null,
      rutaImagen: req.session.mascotaActual ? req.session.mascotaActual.rutaImagen : null,
      accesorios: req.session.accesorios || [],
      userRangos: {
        rango1: req.session.rango1 || 'Ninguno',
        rango2: req.session.rango2 || 'Ninguno',
        rango3: req.session.rango3 || 'Ninguno'
      },
      etiquetasDisponibles: [],
      subetiquetasDisponibles: {},
      extrasubetiquetasDisponibles: [],
      mensajes: [],
      categorias: categoriasResult.rows,
      subcategorias: subcategoriasResult.rows,
      comunidades: comunidadesResult.rows,
      misComunidades: misComunidadesResult.rows,
      publicacionesRecientes: publicacionesRecientesResult.rows,
      misSolicitudes: misSolicitudesResult.rows,
      misComunidadesAdmin: misComunidadesAdminResult.rows,
      solicitudesAdmin: solicitudesAdmin,
      mensaje: mensaje,
      exito: exito
    });
  } catch (error) {
    console.error('Error al cargar la página de comunidades:', error);
    console.error(error.stack);
    res.status(500).send('Error al cargar la página de comunidades');
  }
});


app.get('/comunidad/:id', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    
    // Obtener información de la comunidad (ahora incluyendo subcategorías)
    const comunidadResult = await db.query(`
      SELECT * FROM comunidades WHERE id = $1
    `, [comunidadId]);
    
    if (comunidadResult.rows.length === 0) {
      return res.status(404).send('Comunidad no encontrada');
    }
    
    // Verificar si el usuario es miembro de esta comunidad
    const esMiembroResult = await db.query(`
      SELECT * FROM comunidades_usuarios 
      WHERE comunidad_id = $1 AND user_id = $2
    `, [comunidadId, req.session.userId]);
    
    const esMiembro = esMiembroResult.rows.length > 0;
    
    // Obtener rol del usuario en la comunidad
    let rolUsuario = 'visitante';
    if (esMiembro) {
      const rolResult = await db.query(`
        SELECT rol FROM comunidades_usuarios
        WHERE comunidad_id = $1 AND user_id = $2
      `, [comunidadId, req.session.userId]);
      
      rolUsuario = rolResult.rows[0].rol;
    }
    
    // Obtener publicaciones de la comunidad
    const publicacionesResult = await db.query(`
      SELECT p.*, u.username as autor_nombre,
             u.rango1, u.rango2, u.rango3
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.comunidad_id = $1
      ORDER BY p.fecha DESC
    `, [comunidadId]);
    
    // Obtener miembros de la comunidad
    const miembrosResult = await db.query(`
      SELECT u.id, u.username, cu.rol
      FROM users u
      JOIN comunidades_usuarios cu ON u.id = cu.user_id
      WHERE cu.comunidad_id = $1
      ORDER BY CASE
        WHEN cu.rol = 'administrador' THEN 1
        WHEN cu.rol = 'moderador' THEN 2
        ELSE 3
      END, u.username
    `, [comunidadId]);
    
    // Obtener categorías para la vista
    const categoriasResult = await db.query(`
      SELECT DISTINCT categoria FROM categorias ORDER BY categoria
    `);
    
    // Convertir resultados a formato para etiquetasDisponibles
    const etiquetasDisponibles = categoriasResult.rows.map(cat => cat.categoria);
    
    // Obtener subcategorías para la vista
    const subcategoriasResult = await db.query(`
      SELECT DISTINCT subcategoria, categoria
      FROM categorias 
      WHERE subcategoria <> 'Ninguna'
      ORDER BY subcategoria
    `);
    
    // Organizar subcategorías por categoría
    const subetiquetasDisponibles = {};
    categoriasResult.rows.forEach(cat => {
      subetiquetasDisponibles[cat.categoria] = subcategoriasResult.rows
        .filter(sub => sub.categoria === cat.categoria)
        .map(sub => sub.subcategoria);
    });
    
    // Para mantener compatibilidad, crear una lista plana de subcategorías
    const extrasubetiquetasDisponibles = subcategoriasResult.rows.map(sub => sub.subcategoria);
    
    // Procesar las publicaciones para obtener los comentarios
    const publicacionesConComentarios = [];
    for (const publicacion of publicacionesResult.rows) {
      // Obtener comentarios para esta publicación
      const comentariosResult = await db.query(`
        SELECT c.*, u.username as autor
        FROM forum_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1
        ORDER BY c.fecha ASC
      `, [publicacion.id]);
      
      // Obtener imágenes para esta publicación
      const imagenesResult = await db.query(`
        SELECT * FROM post_images WHERE post_id = $1
      `, [publicacion.id]);
      
      publicacionesConComentarios.push({
        ...publicacion,
        comentarios: comentariosResult.rows,
        imagenes: imagenesResult.rows
      });
    }

    res.render('comunidad_detalle', { 
      username: req.session.username,
      userId: req.session.userId,
      descripcion: req.session.descripcion || '',
      money: req.session.money || 0,
      mascotaActual: req.session.mascotaActual || null,
      rutaImagen: req.session.mascotaActual ? req.session.mascotaActual.rutaImagen : null,
      accesorios: req.session.accesorios || [],
      userRangos: {
        rango1: req.session.rango1 || 'Ninguno',
        rango2: req.session.rango2 || 'Ninguno',
        rango3: req.session.rango3 || 'Ninguno'
      },
      etiquetasDisponibles: etiquetasDisponibles,
      subetiquetasDisponibles: subetiquetasDisponibles,
      extrasubetiquetasDisponibles: extrasubetiquetasDisponibles,
      mensajes: publicacionesConComentarios,
      categorias: categoriasResult.rows,
      subcategorias: subcategoriasResult.rows,
      comunidad: comunidadResult.rows[0],
      publicaciones: publicacionesConComentarios,
      miembros: miembrosResult.rows,
      esMiembro: esMiembro,
      rolUsuario: rolUsuario
    });
  } catch (error) {
    console.error('Error al cargar los detalles de la comunidad:', error);
    res.status(500).send('Error al cargar los detalles de la comunidad');
  }
});

app.post('/comunidad/crear', requireLogin, upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, descripcion, categoria, subcategoria, subcategoria_extra, reglas } = req.body;
    const es_privada = req.body.es_privada ? true : false;
    const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Validar campos obligatorios
    if (!nombre || !reglas || reglas.trim() === '') {
      return res.redirect('/comunidad?error=true&mensaje=El nombre y las reglas de la comunidad son obligatorios');
    }
    
    // Insertar la nueva comunidad con subcategorías
    const result = await db.query(`
      INSERT INTO comunidades 
      (nombre, descripcion, categoria, subcategoria, subcategoria_extra, imagen_url, creador_id, reglas, es_privada) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [nombre, descripcion, categoria, subcategoria, subcategoria_extra, imagen_url, req.session.userId, reglas, es_privada]);
    
    const comunidadId = result.rows[0].id;
    
    // Redirigir al listado de comunidades
    res.redirect('/comunidad?exito=true&mensaje=Comunidad creada correctamente');
  } catch (error) {
    console.error('Error al crear comunidad:', error);
    res.redirect('/comunidad?error=true&mensaje=Error al crear la comunidad');
  }
});


// Ruta para unirse a una comunidad
app.post('/comunidad/:id/unirse', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    
    // Verificar si la comunidad existe
    const comunidadResult = await db.query(`
      SELECT * FROM comunidades WHERE id = $1
    `, [comunidadId]);
    
    if (comunidadResult.rows.length === 0) {
      return res.status(404).json({ success: false, mensaje: 'Comunidad no encontrada' });
    }
    
    const comunidad = comunidadResult.rows[0];
    
    // Verificar si ya es miembro (creador)
    if (comunidad.creador_id === req.session.userId) {
      return res.status(400).json({ success: false, mensaje: 'Ya eres el administrador de esta comunidad' });
    }
    
    // Si la comunidad es privada, crear solicitud
    if (comunidad.es_privada) {
      await db.query(`
        INSERT INTO solicitudes_comunidad 
        (usuario_id, comunidad_id, mensaje) 
        VALUES ($1, $2, $3)
        ON CONFLICT (usuario_id, comunidad_id) DO NOTHING
      `, [req.session.userId, comunidadId, req.body.mensaje || '']);
      
      return res.json({ success: true, mensaje: 'Solicitud enviada correctamente. Espera la aprobación de un administrador.' });
    }
    
    // Si la comunidad es pública, se considera unido cuando participa
    return res.json({ success: true, mensaje: 'Ahora puedes participar en la comunidad.' });
  } catch (error) {
    console.error('Error al unirse a la comunidad:', error);
    res.status(500).json({ success: false, mensaje: 'Error al procesar la solicitud' });
  }
});



































// Agregar estas rutas al archivo index.js

// Ruta para obtener mis solicitudes pendientes (usado en la precarga del modal)
app.get('/mis-solicitudes', requireLogin, async (req, res) => {
  try {
    // Obtener todas las solicitudes del usuario
    const solicitudesResult = await db.query(`
      SELECT s.*, c.nombre as nombre_comunidad, c.id as comunidad_id
      FROM solicitudes_comunidad s
      JOIN comunidades c ON s.comunidad_id = c.id
      WHERE s.usuario_id = $1
      ORDER BY s.fecha_solicitud DESC
    `, [req.session.userId]);
    
    res.json({
      success: true,
      solicitudes: solicitudesResult.rows
    });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al obtener las solicitudes'
    });
  }
});

// Ruta para obtener solicitudes pendientes como administrador
app.get('/solicitudes-admin', requireLogin, async (req, res) => {
  try {
    // Verificar si el usuario es administrador o moderador en alguna comunidad
    const comunidadesAdminResult = await db.query(`
      SELECT c.*
      FROM comunidades c
      WHERE c.creador_id = $1
      UNION
      SELECT c.*
      FROM comunidades c
      JOIN comunidades_usuarios cu ON c.id = cu.comunidad_id
      WHERE cu.user_id = $1 AND cu.rol IN ('administrador', 'moderador')
    `, [req.session.userId]);
    
    // Si no es admin de ninguna comunidad
    if (comunidadesAdminResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        mensaje: 'No tienes permisos para ver solicitudes'
      });
    }
    
    // Obtener IDs de comunidades donde es admin/moderador
    const comunidadesIds = comunidadesAdminResult.rows.map(c => c.id);
    
    // Obtener todas las solicitudes pendientes para esas comunidades
    const solicitudesResult = await db.query(`
      SELECT s.*, u.username, c.nombre as nombre_comunidad
      FROM solicitudes_comunidad s
      JOIN users u ON s.usuario_id = u.id
      JOIN comunidades c ON s.comunidad_id = c.id
      WHERE s.comunidad_id = ANY($1) AND s.estado = 'pendiente'
      ORDER BY s.fecha_solicitud ASC
    `, [comunidadesIds]);
    
    res.json({
      success: true,
      solicitudes: solicitudesResult.rows,
      comunidades: comunidadesAdminResult.rows
    });
  } catch (error) {
    console.error('Error al obtener solicitudes de admin:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al obtener las solicitudes'
    });
  }
});

// Ruta para verificar acceso a una comunidad privada
app.get('/comunidad/:id/verificar-acceso', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    
    // Verificar si la comunidad existe
    const comunidadResult = await db.query(`
      SELECT * FROM comunidades WHERE id = $1
    `, [comunidadId]);
    
    if (comunidadResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        mensaje: 'Comunidad no encontrada'
      });
    }
    
    const comunidad = comunidadResult.rows[0];
    
    // Si no es privada, cualquiera puede acceder
    if (!comunidad.es_privada) {
      return res.json({ puedeAcceder: true });
    }
    
    // Verificar si es el creador
    if (comunidad.creador_id === req.session.userId) {
      return res.json({ puedeAcceder: true });
    }
    
    // Verificar si ya es miembro
    const esMiembroResult = await db.query(`
      SELECT * FROM comunidades_usuarios 
      WHERE comunidad_id = $1 AND user_id = $2
    `, [comunidadId, req.session.userId]);
    
    if (esMiembroResult.rows.length > 0) {
      return res.json({ puedeAcceder: true });
    }
    
    // Verificar si ya tiene una solicitud pendiente
    const solicitudResult = await db.query(`
      SELECT * FROM solicitudes_comunidad 
      WHERE comunidad_id = $1 AND usuario_id = $2
    `, [comunidadId, req.session.userId]);
    
    if (solicitudResult.rows.length > 0) {
      return res.json({ 
        puedeAcceder: false, 
        solicitudPendiente: true 
      });
    }
    
    // No puede acceder y no tiene solicitud
    res.json({ 
      puedeAcceder: false, 
      solicitudPendiente: false 
    });
  } catch (error) {
    console.error('Error al verificar acceso:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al verificar el acceso'
    });
  }
});

// Ruta para cancelar una solicitud pendiente
app.post('/solicitudes/cancelar/:id', requireLogin, async (req, res) => {
  try {
    const solicitudId = req.params.id;
    
    // Verificar que la solicitud exista y pertenezca al usuario
    const verificarResult = await db.query(`
      SELECT * FROM solicitudes_comunidad 
      WHERE id = $1 AND usuario_id = $2
    `, [solicitudId, req.session.userId]);
    
    if (verificarResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        mensaje: 'Solicitud no encontrada o no tienes permisos para cancelarla'
      });
    }
    
    // Solo se pueden cancelar solicitudes pendientes
    if (verificarResult.rows[0].estado !== 'pendiente') {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Solo se pueden cancelar solicitudes pendientes'
      });
    }
    
    // Eliminar la solicitud
    await db.query(`
      DELETE FROM solicitudes_comunidad WHERE id = $1
    `, [solicitudId]);
    
    res.json({ 
      success: true, 
      mensaje: 'Solicitud cancelada correctamente'
    });
  } catch (error) {
    console.error('Error al cancelar solicitud:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al cancelar la solicitud'
    });
  }
});

// Ruta para responder a una solicitud (aceptar/rechazar)
app.post('/solicitudes/responder', requireLogin, async (req, res) => {
  try {
    const { solicitudId, estado, respuesta } = req.body;
    
    if (!solicitudId || !estado || (estado !== 'aceptada' && estado !== 'rechazada')) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Parámetros inválidos'
      });
    }
    
    // Obtener información de la solicitud
    const solicitudResult = await db.query(`
      SELECT s.*, c.creador_id 
      FROM solicitudes_comunidad s
      JOIN comunidades c ON s.comunidad_id = c.id
      WHERE s.id = $1
    `, [solicitudId]);
    
    if (solicitudResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        mensaje: 'Solicitud no encontrada'
      });
    }
    
    const solicitud = solicitudResult.rows[0];
    
    // Verificar que el usuario tenga permisos para responder
    // Es el creador de la comunidad o es moderador/admin
    const permisosResult = await db.query(`
      SELECT * FROM comunidades c
      WHERE c.id = $1 AND c.creador_id = $2
      UNION
      SELECT c.* FROM comunidades c
      JOIN comunidades_usuarios cu ON c.id = cu.comunidad_id
      WHERE c.id = $1 AND cu.user_id = $2 AND cu.rol IN ('administrador', 'moderador')
    `, [solicitud.comunidad_id, req.session.userId]);
    
    if (permisosResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        mensaje: 'No tienes permisos para responder a esta solicitud'
      });
    }
    
    // Actualizar el estado de la solicitud
    await db.query(`
      UPDATE solicitudes_comunidad
      SET estado = $1, 
          respuesta = $2,
          fecha_respuesta = CURRENT_TIMESTAMP,
          respondido_por = $3
      WHERE id = $4
    `, [estado, respuesta || null, req.session.userId, solicitudId]);
    
    // Si fue aceptada, agregar al usuario a la comunidad
    if (estado === 'aceptada') {
      await db.query(`
        INSERT INTO comunidades_usuarios (comunidad_id, user_id, rol, fecha_union)
        VALUES ($1, $2, 'miembro', CURRENT_TIMESTAMP)
        ON CONFLICT (comunidad_id, user_id) DO NOTHING
      `, [solicitud.comunidad_id, solicitud.usuario_id]);
    }
    
    res.json({ 
      success: true, 
      mensaje: `Solicitud ${estado === 'aceptada' ? 'aceptada' : 'rechazada'} correctamente`
    });
  } catch (error) {
    console.error('Error al responder solicitud:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al procesar la solicitud'
    });
  }
});






























// Función para verificar si el usuario es administrador basado en el rango3
const isAdmin = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, mensaje: 'Debes iniciar sesión' });
    }
    
    // Verificar si el usuario tiene el rango3 = 'Administrador'
    const isAdminResult = await db.query(`
      SELECT * FROM users 
      WHERE id = $1 AND rango3 = 'Administrador'
    `, [req.session.userId]);
    
    if (isAdminResult.rows.length === 0) {
      return res.status(403).json({ success: false, mensaje: 'No tienes permisos de administrador' });
    }
    
    next();
  } catch (error) {
    console.error('Error al verificar permisos de administrador:', error);
    res.status(500).json({ success: false, mensaje: 'Error al verificar permisos' });
  }
};

// Updated admin routes for category management

// Get all categories
app.get('/admin/categorias', requireLogin, isAdmin, async (req, res) => {
  try {
    const categoriasResult = await db.query(`
      SELECT * FROM categories_metadata 
      WHERE tipo = 'categoria' AND activo = TRUE
      ORDER BY nombre
    `);
    
    res.json({ success: true, categorias: categoriasResult.rows });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ success: false, mensaje: 'Error al obtener categorías', error: error.message });
  }
});

// Get all subcategories
app.get('/admin/subcategorias', requireLogin, isAdmin, async (req, res) => {
  try {
    const subcategoriasResult = await db.query(`
      SELECT s.*, c.nombre as categoria
      FROM categories_metadata s
      JOIN categories_metadata c ON s.categoria = c.nombre
      WHERE s.tipo = 'subcategoria' AND s.activo = TRUE
      ORDER BY s.nombre
    `);
    
    res.json({ success: true, subcategorias: subcategoriasResult.rows });
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    res.status(500).json({ success: false, mensaje: 'Error al obtener subcategorías', error: error.message });
  }
});

// Get specific category by ID
app.get('/admin/categorias/:id', requireLogin, isAdmin, async (req, res) => {
  try {
    const categoriaId = req.params.id;
    
    const categoriaResult = await db.query(`
      SELECT * FROM categories_metadata WHERE id = $1 AND activo = TRUE
    `, [categoriaId]);
    
    if (categoriaResult.rows.length === 0) {
      return res.status(404).json({ success: false, mensaje: 'Categoría no encontrada' });
    }
    
    res.json({ success: true, categoria: categoriaResult.rows[0] });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ success: false, mensaje: 'Error al obtener la categoría', error: error.message });
  }
});

// Create new category
app.post('/admin/categorias/crear', requireLogin, isAdmin, async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ success: false, mensaje: 'El nombre de la categoría es obligatorio' });
    }
    
    // Check if category already exists
    const existeResult = await db.query(`
      SELECT * FROM categories_metadata 
      WHERE tipo = 'categoria' AND LOWER(nombre) = LOWER($1) AND activo = TRUE
    `, [nombre]);
    
    if (existeResult.rows.length > 0) {
      return res.status(400).json({ success: false, mensaje: 'Ya existe una categoría con ese nombre' });
    }
    
    // Get admin info
    const adminResult = await db.query(`
      SELECT id, username FROM users WHERE id = $1
    `, [req.session.userId]);
    
    if (adminResult.rows.length === 0) {
      return res.status(400).json({ success: false, mensaje: 'Error al obtener información del administrador' });
    }
    
    const admin = adminResult.rows[0];
    
    // Insert new category
    const result = await db.query(`
      INSERT INTO categories_metadata 
      (nombre, descripcion, tipo, categoria, admin_id, admin_username)
      VALUES ($1, $2, 'categoria', $1, $3, $4)
      RETURNING id
    `, [nombre, descripcion || '', admin.id, admin.username]);
    
    res.status(201).json({ 
      success: true, 
      mensaje: 'Categoría creada correctamente',
      categoriaId: result.rows[0].id
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ success: false, mensaje: 'Error al crear la categoría', error: error.message });
  }
});

// Update category
app.post('/admin/categorias/actualizar/:id', requireLogin, isAdmin, async (req, res) => {
  try {
    const categoriaId = req.params.id;
    const { nombre, descripcion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ success: false, mensaje: 'El nombre de la categoría es obligatorio' });
    }
    
    // Check if category exists
    const categoriaResult = await db.query(`
      SELECT * FROM categories_metadata WHERE id = $1 AND activo = TRUE
    `, [categoriaId]);
    
    if (categoriaResult.rows.length === 0) {
      return res.status(404).json({ success: false, mensaje: 'Categoría no encontrada' });
    }
    
    const categoriaOriginal = categoriaResult.rows[0];
    
    // Check if another category has the same name
    const existeResult = await db.query(`
      SELECT * FROM categories_metadata 
      WHERE tipo = 'categoria' AND LOWER(nombre) = LOWER($1) AND id != $2 AND activo = TRUE
    `, [nombre, categoriaId]);
    
    if (existeResult.rows.length > 0) {
      return res.status(400).json({ success: false, mensaje: 'Ya existe otra categoría con ese nombre' });
    }
    
    // Get admin info
    const adminResult = await db.query(`
      SELECT id, username FROM users WHERE id = $1
    `, [req.session.userId]);
    
    if (adminResult.rows.length === 0) {
      return res.status(400).json({ success: false, mensaje: 'Error al obtener información del administrador' });
    }
    
    const admin = adminResult.rows[0];
    
    // Update category
    await db.query(`
      UPDATE categories_metadata
      SET nombre = $1, 
          descripcion = $2, 
          categoria = $1,
          admin_id = $3, 
          admin_username = $4,
          ultima_modificacion = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [nombre, descripcion || '', admin.id, admin.username, categoriaId]);
    
    // Update related subcategories to reference the new category name
    if (categoriaOriginal.nombre !== nombre) {
      await db.query(`
        UPDATE categories_metadata
        SET categoria = $1
        WHERE categoria = $2 AND tipo != 'categoria'
      `, [nombre, categoriaOriginal.nombre]);
    }
    
    res.json({ success: true, mensaje: 'Categoría actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ success: false, mensaje: 'Error al actualizar la categoría', error: error.message });
  }
});

// Delete category
app.delete('/admin/categorias/:id', requireLogin, isAdmin, async (req, res) => {
  try {
    const categoriaId = req.params.id;
    
    // Check if category exists
    const categoriaResult = await db.query(`
      SELECT * FROM categories_metadata WHERE id = $1 AND activo = TRUE
    `, [categoriaId]);
    
    if (categoriaResult.rows.length === 0) {
      return res.status(404).json({ success: false, mensaje: 'Categoría no encontrada' });
    }
    
    const categoria = categoriaResult.rows[0];
    
    // Check if there are subcategories using this category
    const subcategoriasResult = await db.query(`
      SELECT COUNT(*) as total FROM categories_metadata 
      WHERE categoria = $1 AND tipo = 'subcategoria' AND activo = TRUE
    `, [categoria.nombre]);
    
    if (parseInt(subcategoriasResult.rows[0].total) > 0) {
      return res.status(400).json({ 
        success: false, 
        mensaje: `No se puede eliminar. Hay ${subcategoriasResult.rows[0].total} subcategorías asociadas a esta categoría.`
      });
    }
    
    // Check if there are communities using this category
    const comunidadesResult = await db.query(`
      SELECT COUNT(*) as total FROM comunidades 
      WHERE categoria = $1
    `, [categoria.nombre]);
    
    if (parseInt(comunidadesResult.rows[0].total) > 0) {
      return res.status(400).json({ 
        success: false, 
        mensaje: `No se puede eliminar. Hay ${comunidadesResult.rows[0].total} comunidades usando esta categoría.`
      });
    }
    
    // Soft delete by marking as inactive instead of hard delete
    await db.query(`
      UPDATE categories_metadata 
      SET activo = FALSE, ultima_modificacion = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [categoriaId]);
    
    res.json({ success: true, mensaje: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ success: false, mensaje: 'Error al eliminar la categoría', error: error.message });
  }
});

// Get specific subcategory by ID
app.get('/admin/subcategorias/:id', requireLogin, isAdmin, async (req, res) => {
  try {
    const subcategoriaId = req.params.id;
    
    const subcategoriaResult = await db.query(`
      SELECT * FROM categories_metadata WHERE id = $1 AND activo = TRUE
    `, [subcategoriaId]);
    
    if (subcategoriaResult.rows.length === 0) {
      return res.status(404).json({ success: false, mensaje: 'Subcategoría no encontrada' });
    }
    
    res.json({ success: true, subcategoria: subcategoriaResult.rows[0] });
  } catch (error) {
    console.error('Error al obtener subcategoría:', error);
    res.status(500).json({ success: false, mensaje: 'Error al obtener la subcategoría', error: error.message });
  }
});

// Create new subcategory
app.post('/admin/subcategorias/crear', requireLogin, isAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, categoriaPadre } = req.body;
    
    if (!nombre || !categoriaPadre) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'El nombre de la subcategoría y la categoría padre son obligatorios' 
      });
    }
    
    // Check if parent category exists
    const categoriaResult = await db.query(`
      SELECT * FROM categories_metadata 
      WHERE tipo = 'categoria' AND nombre = $1 AND activo = TRUE
    `, [categoriaPadre]);
    
    if (categoriaResult.rows.length === 0) {
      return res.status(400).json({ success: false, mensaje: 'La categoría padre no existe' });
    }
    
    // Check if subcategory already exists in this category
    const existeResult = await db.query(`
      SELECT * FROM categories_metadata 
      WHERE tipo = 'subcategoria' AND categoria = $1 AND LOWER(nombre) = LOWER($2) AND activo = TRUE
    `, [categoriaPadre, nombre]);
    
    if (existeResult.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Ya existe una subcategoría con ese nombre en esta categoría' 
      });
    }
    
    // Get admin info
    const adminResult = await db.query(`
      SELECT id, username FROM users WHERE id = $1
    `, [req.session.userId]);
    
    if (adminResult.rows.length === 0) {
      return res.status(400).json({ success: false, mensaje: 'Error al obtener información del administrador' });
    }
    
    const admin = adminResult.rows[0];
    
    // Insert new subcategory
    const result = await db.query(`
      INSERT INTO categories_metadata 
      (nombre, descripcion, tipo, categoria, subcategoria, admin_id, admin_username)
      VALUES ($1, $2, 'subcategoria', $3, $1, $4, $5)
      RETURNING id
    `, [nombre, descripcion || '', categoriaPadre, admin.id, admin.username]);
    
    res.status(201).json({ 
      success: true, 
      mensaje: 'Subcategoría creada correctamente',
      subcategoriaId: result.rows[0].id
    });
  } catch (error) {
    console.error('Error al crear subcategoría:', error);
    res.status(500).json({ success: false, mensaje: 'Error al crear la subcategoría', error: error.message });
  }
});

// Update subcategory
app.post('/admin/subcategorias/actualizar/:id', requireLogin, isAdmin, async (req, res) => {
  try {
    const subcategoriaId = req.params.id;
    const { nombre, descripcion, categoriaPadre } = req.body;
    
    if (!nombre || !categoriaPadre) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'El nombre de la subcategoría y la categoría padre son obligatorios' 
      });
    }
    
    // Check if subcategory exists
    const subcategoriaResult = await db.query(`
      SELECT * FROM categories_metadata WHERE id = $1 AND activo = TRUE
    `, [subcategoriaId]);
    
    if (subcategoriaResult.rows.length === 0) {
      return res.status(404).json({ success: false, mensaje: 'Subcategoría no encontrada' });
    }
    
    // Check if parent category exists
    const categoriaResult = await db.query(`
      SELECT * FROM categories_metadata 
      WHERE tipo = 'categoria' AND nombre = $1 AND activo = TRUE
    `, [categoriaPadre]);
    
    if (categoriaResult.rows.length === 0) {
      return res.status(400).json({ success: false, mensaje: 'La categoría padre no existe' });
    }
    
    // Check if another subcategory has the same name in this category
    const existeResult = await db.query(`
      SELECT * FROM categories_metadata 
      WHERE tipo = 'subcategoria' AND categoria = $1 AND LOWER(nombre) = LOWER($2) AND id != $3 AND activo = TRUE
    `, [categoriaPadre, nombre, subcategoriaId]);
    
    if (existeResult.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Ya existe otra subcategoría con ese nombre en esta categoría' 
      });
    }
    
    // Get admin info
    const adminResult = await db.query(`
      SELECT id, username FROM users WHERE id = $1
    `, [req.session.userId]);
    
    if (adminResult.rows.length === 0) {
      return res.status(400).json({ success: false, mensaje: 'Error al obtener información del administrador' });
    }
    
    const admin = adminResult.rows[0];
    
    // Update subcategory
    await db.query(`
      UPDATE categories_metadata
      SET nombre = $1, 
          descripcion = $2, 
          categoria = $3,
          subcategoria = $1,
          admin_id = $4, 
          admin_username = $5,
          ultima_modificacion = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [nombre, descripcion || '', categoriaPadre, admin.id, admin.username, subcategoriaId]);
    
    res.json({ success: true, mensaje: 'Subcategoría actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar subcategoría:', error);
    res.status(500).json({ success: false, mensaje: 'Error al actualizar la subcategoría', error: error.message });
  }
});

// Delete subcategory
app.delete('/admin/subcategorias/:id', requireLogin, isAdmin, async (req, res) => {
  try {
    const subcategoriaId = req.params.id;
    
    // Check if subcategory exists
    const subcategoriaResult = await db.query(`
      SELECT * FROM categories_metadata WHERE id = $1 AND activo = TRUE
    `, [subcategoriaId]);
    
    if (subcategoriaResult.rows.length === 0) {
      return res.status(404).json({ success: false, mensaje: 'Subcategoría no encontrada' });
    }
    
    // Soft delete by marking as inactive instead of hard delete
    await db.query(`
      UPDATE categories_metadata 
      SET activo = FALSE, ultima_modificacion = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [subcategoriaId]);
    
    res.json({ success: true, mensaje: 'Subcategoría eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar subcategoría:', error);
    res.status(500).json({ success: false, mensaje: 'Error al eliminar la subcategoría', error: error.message });
  }
});







  