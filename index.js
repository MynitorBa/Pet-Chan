import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { log } from 'console';
import 'dotenv/config';
import { urlencoded } from 'express';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs';

/*---------------------------importaciones necesarias para la base de datos------------------------------------------------ */
/*necesario para la base de datos*/
import pg from "pg";
import session from "express-session";
import { hashPassword, verifyPassword } from "cryptography-password-js";

/*agregar esto xd*/
import { createServer } from 'http';
import { Server } from 'socket.io';
/*agregar esto xd*/


/*librerias necesarias*/
/*---------------------------importaciones de otros js------------------------------------------------ */






import { especieMascotas, comidasFavoritas, habilidadesEspeciales, accesorios, juguetes, corralesDisponibles } from './informacion/informacion.js'; //exportamos las especies de mascotas

import { preciosJuguetes, preciosAccesorios, preciosComidas, preciosCorrales } from './informacion/precios.js';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const errorLogPath = path.join(__dirname, '..', 'logs', 'error.log');






// Crear stream de log
const logDirectory = path.join(__dirname, 'logs');
fs.mkdirSync(logDirectory, { recursive: true }); // Asegura que la carpeta exista

const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, 'access.log'),
  { flags: 'a' }
);



// Morgan en archivo y consola
app.use(morgan('combined', { stream: accessLogStream }));


export function logError(error) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${error.stack || error}\n`;

  fs.appendFile(errorLogPath, message, (err) => {
    if (err) {
      console.error('Error al escribir en el log de errores:', err);
    }
  });
}

app.use(express.static(__dirname + '/public'));


app.set('view engine', 'ejs');




/*agregar esto xd*/
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
/*agregar esto xd*/



/*---------------------------variable necesarias para la base de datos------------------------------------------------ */
//configuracion de la base de datos
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
  }
}));

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    next();
};


// Inicializar eventos al inicio del servidor
app.use(async (req, res, next) => {
  // Inicializar eventos si no se ha hecho ya
  if (!req.app.get('eventsInitialized')) {
    await initializeEventsTable();
    req.app.set('eventsInitialized', true);
  }
  next();
});


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

    // Obtener tiempos de login y calcular diferencia
    const lastLoginTime = user.last_login_time ? new Date(user.last_login_time) : null;
    const currentLoginTime = new Date();
    
    // Debugging para ver tiempos exactos
    console.log("Last login time:", lastLoginTime);
    console.log("Current login time:", currentLoginTime);

    const petResult = await db.query('SELECT * FROM pets WHERE "id_users" = $1 LIMIT 1', [user.id]);

    // Calcular diferencia de tiempo en milisegundos
    const diferenciaDeTiempo = lastLoginTime ? (currentLoginTime - lastLoginTime) : 0;
    console.log("Diferencia de tiempo (ms):", diferenciaDeTiempo);

    // Actualizar el tiempo de inicio de sesión inmediatamente
    await db.query(
      'UPDATE users SET last_login_time = $1 WHERE id = $2',
      [currentLoginTime, user.id]
    );

    req.session.lastLoginTime = lastLoginTime;
    req.session.currentLoginTime = currentLoginTime;

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.descripcion = user.description;
    req.session.money = user.money;
    req.session.corral = user.corral;
    req.session.rango1 = user.rango1 || 'Novato';
    req.session.rango2 = user.rango2 || '';
    req.session.rango3 = user.rango3 || '';

    if (petResult.rows.length === 0) {
      return res.redirect("/minijuegomascota");
    }

    const mascota = petResult.rows[0];
    console.log("Estado inicial de la mascota:", {
      felicidad: mascota.nivelFelicidad,
      energia: mascota.nivelEnergia
    });

    // Aplicar la lógica de reducción solo si hay diferencia de tiempo
    if (diferenciaDeTiempo > 0) {
      // Convertir la diferencia de tiempo de milisegundos a horas
      const horasTranscurridas = diferenciaDeTiempo / (1000 * 60 * 60);
      console.log(`Tiempo real transcurrido: ${horasTranscurridas.toFixed(2)} horas`);
      
      // Calcular cuántos intervalos completos de 2 horas han pasado
      const intervalos2Horas = Math.floor(horasTranscurridas / 2);
      console.log(`Intervalos completos de 2 horas: ${intervalos2Horas}`);
      
      // Calcular reducción exacta: 5 puntos por cada intervalo completo de 2 horas
      let reduccionFelicidad = intervalos2Horas * 5;
      let reduccionEnergia = intervalos2Horas * 5;
      
      console.log(`Reducción calculada: ${reduccionFelicidad} puntos por ${intervalos2Horas} intervalos`);
      
      // Aplicar reducción con límite inferior de 0
      let nuevoNivelFelicidad = Math.max(mascota.nivelFelicidad - reduccionFelicidad, 0);
      let nuevoNivelEnergia = Math.max(mascota.nivelEnergia - reduccionEnergia, 0);

      console.log(`Nivel Felicidad: ${mascota.nivelFelicidad} → ${nuevoNivelFelicidad} (-${reduccionFelicidad})`);
      console.log(`Nivel Energía: ${mascota.nivelEnergia} → ${nuevoNivelEnergia} (-${reduccionEnergia})`);

      // Actualizar niveles en la base de datos
      await db.query(
        'UPDATE pets SET "nivelFelicidad" = $1, "nivelEnergia" = $2 WHERE id = $3',
        [nuevoNivelFelicidad, nuevoNivelEnergia, mascota.id]
      );

      // Actualizar los valores en el objeto mascota
      mascota.nivelFelicidad = nuevoNivelFelicidad;
      mascota.nivelEnergia = nuevoNivelEnergia;
    }

    const rutaImagen = `${rutaBase}${mascota.indice}.gif`;
    const especieDeMascota = especieMascotas[mascota.indice - 1];
    const pronombre = mascota.genero === "macho" ? "el" : "la";

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

      // Configura el tiempo actual para last_login_time
      const currentTime = new Date();

      const result = await db.query(
        'INSERT INTO users (username, password, description, money, rango1, rango2, rango3, last_login_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, username',
        [username, hashedPassword, "Descripción del usuario", 0, 'Novato', null, null, currentTime]
      );
    
      const newUser = result.rows[0];
      req.session.userId = newUser.id;
      req.session.username = newUser.username;
      req.session.descripcion = "Descripción del usuario";
      req.session.money = 0;
      req.session.corral = null;
      
      // Inicializar rangos en la sesión
      req.session.rango1 = 'Novato';
      req.session.rango2 = 'Ninguna';
      req.session.rango3 = 'Ninguna';
      
      // Inicializar tiempos de login en la sesión
      req.session.lastLoginTime = null;
      req.session.currentLoginTime = currentTime;

      // vamos a poner los accesorios en null
      req.session.accesorios = null;

      res.redirect("/minijuegomascota");
  } catch (error) {
      console.error(error);
      res.status(500).render("register.ejs", { error: "Error al registrar el usuario" });
  }
});

app.get("/logout", async (req, res) => {
  try {
      // Si hay un usuario en sesión, actualiza su last_login_time antes de cerrar sesión
      if (req.session.userId) {
          const currentTime = new Date();
          await db.query(
              'UPDATE users SET last_login_time = $1 WHERE id = $2',
              [currentTime, req.session.userId]
          );
          console.log(`Usuario ${req.session.username} cerró sesión. Last login time actualizado: ${currentTime}`);
      }
      
      // Destruye la sesión
      req.session.destroy(err => {
          if (err) {
              console.error("Error al cerrar sesión:", err);
          }
          res.redirect("/login");
      });
  } catch (error) {
      console.error("Error en logout:", error);
      res.redirect("/login");
  }
}); 

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

//Esto hay que ponerlo en meme xd
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
      // Iniciar transacción
      await db.query('BEGIN');
      
      // Crear mascota en la tabla pets (mascota activa)
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

      // ELIMINAMOS LA INSERCIÓN EN pets2
      // Ya no duplicamos la mascota en pets2

      // Confirmar transacción
      await db.query('COMMIT');

      // Guardamos en sesión la mascota actual para uso en otras vistas
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
      // Revertir transacción en caso de error
      await db.query('ROLLBACK');
      console.error('Error al crear mascota:', error);
      res.status(500).send("Error al guardar la mascota");
  }
});















// Ruta para mostrar el perfil personalizado
app.get('/perfil_personalizado', requireLogin, async (req, res) => {
  const mascota = req.session.mascotaActual;
  const mensaje = req.session.mensajeDeContra || '';
  delete req.session.mensajeDeContra;

  try {
    // Obtener información del usuario
    const userResult = await db.query(
      `SELECT username, description FROM users WHERE id = $1`,
      [req.session.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).send('Usuario no encontrado');
    }

    const user = userResult.rows[0];

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
      mensajeError: req.session.mensajeError || '' // Para mostrar errores de username duplicado
    });
    
    // Limpiar el mensaje de error después de usarlo
    delete req.session.mensajeError;
    
  } catch (error) {
    console.error('Error al obtener datos del perfil:', error);
    return res.status(500).send('Error al cargar el perfil');
  }
});

app.post('/modificarPerfil', requireLogin, async (req, res) => {
  const nuevoUsername = req.body['nombre-usuario'];
  const nuevaDescripcion = req.body['biografia'];
  const userId = req.session.userId;

  try {
      // Verificar si el nuevo nombre de usuario ya existe (excluyendo el usuario actual)
      const existeUsuario = await db.query(
          `SELECT id FROM users WHERE username = $1 AND id != $2`,
          [nuevoUsername, userId]
      );

      if (existeUsuario.rows.length > 0) {
          // El nombre de usuario ya existe
          req.session.mensajeError = `⚠️ El nombre "${nuevoUsername}" ya está en uso. Por favor elige otro.`;
          return res.redirect('/perfil_personalizado');
      }

      // Si no existe, actualizar el perfil
      await db.query(
          `UPDATE users SET username = $1, description = $2 WHERE id = $3`,
          [nuevoUsername, nuevaDescripcion, userId]
      );

      // Actualizamos la sesión si cambió el username
      req.session.username = nuevoUsername;
      req.session.descripcion = nuevaDescripcion;
      
      // Eliminar mensaje de error si la actualización fue exitosa
      delete req.session.mensajeError;

      console.log('Perfil actualizado:', nuevoUsername);
      res.redirect('/perfil_personalizado');
  } catch (error) {
      console.error('Error al modificar perfil:', error);
      req.session.mensajeError = 'Error al actualizar el perfil. Inténtalo de nuevo.';
      res.redirect('/perfil_personalizado');
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

// Actualizar la ruta de inicio para servir datos de posts y comunidades de manera segura
app.get('/inicio', requireLogin, async (req, res) => {
  try {
      const mascota = req.session.mascotaActual;
      
      // Datos predeterminados en caso de error
      let posts = [];
      let comunidades = [];
      
      try {
          // Obtener publicaciones de la base de datos con todos los campos requeridos
          const queryPosts = `
              SELECT fp.id, fp.user_id, fp.autor, fp.mensaje, fp.etiqueta, 
                     fp.subcategoria, fp.extrasubcategoria, fp.fecha, fp.fecha_str, 
                     fp.ranking, fp.comunidad_id, u.username as autor_nombre, 
                     c.nombre as comunidad_nombre 
              FROM forum_posts fp
              LEFT JOIN users u ON fp.user_id = u.id
              LEFT JOIN comunidades c ON fp.comunidad_id = c.id
              ORDER BY fp.fecha DESC
          `;
          const resultPosts = await db.query(queryPosts);
          posts = resultPosts.rows;
          
          // Obtener comunidades de la base de datos con todos los campos requeridos y conteo de miembros
          const queryComunidades = `
              SELECT c.id, c.nombre, c.descripcion, c.categoria, c.subcategoria, 
                     c.subcategoria_extra, c.imagen_url, c.creador_id, c.fecha_creacion, 
                     c.reglas, c.es_privada, u.username as creador_nombre, 
                     (SELECT COUNT(*) FROM forum_posts WHERE comunidad_id = c.id) as total_posts,
                     (SELECT COUNT(*) FROM comunidades_usuarios WHERE comunidad_id = c.id) as total_miembros
              FROM comunidades c
              LEFT JOIN users u ON c.creador_id = u.id
              ORDER BY total_posts DESC
          `;
          const resultComunidades = await db.query(queryComunidades);
          comunidades = resultComunidades.rows;
      } catch (dbError) {
          console.error('Error al consultar la base de datos:', dbError);
          return res.status(500).send('Error al cargar datos de la base de datos');
      }
      
      res.render('inicio.ejs', { 
          posts: posts,
          comunidades: comunidades,
          rutaImagen: mascota?.rutaImagen,
          accesorios: req.session.accesorios
      });
  } catch (error) {
      console.error('Error al cargar la página de inicio:', error);
      res.status(500).send('Error al cargar la página de inicio');
  }
});


// Agregar redirección de /foros a /foro para compatibilidad con el código anterior
app.get('/foros', requireLogin, (req, res) => {
  res.redirect('/foro');
});

// Agregar redirección de /comunidades a /comunidad para compatibilidad
app.get('/comunidades', requireLogin, (req, res) => {
  res.redirect('/comunidad');
});


// API para obtener datos de posts
app.get('/api/posts', requireLogin, async (req, res) => {
  try {
      const queryPosts = `
          SELECT fp.id, fp.user_id, fp.autor, fp.mensaje, fp.etiqueta, 
                 fp.subcategoria, fp.extrasubcategoria, fp.fecha, fp.fecha_str, 
                 fp.ranking, fp.comunidad_id, u.username as autor_nombre, 
                 c.nombre as comunidad_nombre 
          FROM forum_posts fp
          LEFT JOIN users u ON fp.user_id = u.id
          LEFT JOIN comunidades c ON fp.comunidad_id = c.id
          ORDER BY fp.fecha DESC
      `;
      const resultPosts = await db.query(queryPosts);
      res.json(resultPosts.rows);
  } catch (error) {
      console.error('Error al obtener publicaciones:', error);
      res.status(500).json({ error: 'Error al obtener publicaciones de la base de datos' });
  }
});

// API para obtener datos de comunidades
app.get('/api/comunidades', requireLogin, async (req, res) => {
  try {
      const queryComunidades = `
          SELECT c.id, c.nombre, c.descripcion, c.categoria, c.subcategoria, 
                 c.subcategoria_extra, c.imagen_url, c.creador_id, c.fecha_creacion, 
                 c.reglas, c.es_privada, u.username as creador_nombre, 
                 (SELECT COUNT(*) FROM forum_posts WHERE comunidad_id = c.id) as total_posts,
                 (SELECT COUNT(*) FROM comunidades_usuarios WHERE comunidad_id = c.id) as total_miembros
          FROM comunidades c
          LEFT JOIN users u ON c.creador_id = u.id
          ORDER BY total_posts DESC
      `;
      const resultComunidades = await db.query(queryComunidades);
      res.json(resultComunidades.rows);
  } catch (error) {
      console.error('Error al obtener comunidades:', error);
      res.status(500).json({ error: 'Error al obtener comunidades de la base de datos' });
  }
});



// Rutas adicionales para redirección desde botones de "Ver todos"
app.get('/foros', requireLogin, async (req, res) => {
  try {
      const mascota = req.session.mascotaActual;
      
      const queryPosts = `
          SELECT fp.id, fp.user_id, fp.autor, fp.mensaje, fp.etiqueta, 
                 fp.subcategoria, fp.extrasubcategoria, fp.fecha, fp.fecha_str, 
                 fp.ranking, fp.comunidad_id, u.username as autor_nombre, 
                 c.nombre as comunidad_nombre,
                 (SELECT COUNT(*) FROM post_likes WHERE post_id = fp.id) as total_likes
          FROM forum_posts fp
          LEFT JOIN users u ON fp.user_id = u.id
          LEFT JOIN comunidades c ON fp.comunidad_id = c.id
          ORDER BY fp.fecha DESC
      `;
      const resultPosts = await db.query(queryPosts);
      
      res.render('foros.ejs', { 
          posts: resultPosts.rows,
          rutaImagen: mascota?.rutaImagen,
          accesorios: req.session.accesorios
      });
  } catch (error) {
      console.error('Error al cargar la página de foros:', error);
      res.status(500).send('Error al cargar la página de foros');
  }
});

app.get('/comunidades', requireLogin, async (req, res) => {
  try {
      const mascota = req.session.mascotaActual;
      
      const queryComunidades = `
          SELECT c.id, c.nombre, c.descripcion, c.categoria, c.subcategoria, 
                 c.subcategoria_extra, c.imagen_url, c.creador_id, c.fecha_creacion, 
                 c.reglas, c.es_privada, u.username as creador_nombre, 
                 (SELECT COUNT(*) FROM forum_posts WHERE comunidad_id = c.id) as total_posts,
                 (SELECT COUNT(*) FROM comunidades_usuarios WHERE comunidad_id = c.id) as total_miembros
          FROM comunidades c
          LEFT JOIN users u ON c.creador_id = u.id
          ORDER BY c.nombre ASC
      `;
      const resultComunidades = await db.query(queryComunidades);
      
      res.render('comunidades.ejs', { 
          comunidades: resultComunidades.rows,
          rutaImagen: mascota?.rutaImagen,
          accesorios: req.session.accesorios
      });
  } catch (error) {
      console.error('Error al cargar la página de comunidades:', error);
      res.status(500).send('Error al cargar la página de comunidades');
  }
});

// Ruta para ver una comunidad específica
app.get('/comunidad/:id', requireLogin, async (req, res) => {
  try {
      const comunidadId = req.params.id;
      const mascota = req.session.mascotaActual;
      
      const queryComunidad = `
          SELECT c.*, u.username as creador_nombre, 
                 (SELECT COUNT(*) FROM forum_posts WHERE comunidad_id = c.id) as total_posts,
                 (SELECT COUNT(*) FROM comunidades_usuarios WHERE comunidad_id = c.id) as total_miembros
          FROM comunidades c
          LEFT JOIN users u ON c.creador_id = u.id
          WHERE c.id = $1
      `;
      const resultComunidad = await db.query(queryComunidad, [comunidadId]);
      
      if (resultComunidad.rows.length === 0) {
          return res.status(404).send('Comunidad no encontrada');
      }
      
      // Obtener posts de la comunidad
      const queryPosts = `
          SELECT fp.*, u.username as autor_nombre
          FROM forum_posts fp
          LEFT JOIN users u ON fp.user_id = u.id
          WHERE fp.comunidad_id = $1
          ORDER BY fp.fecha DESC
      `;
      const resultPosts = await db.query(queryPosts, [comunidadId]);
      
      res.render('comunidad.ejs', { 
          comunidad: resultComunidad.rows[0],
          posts: resultPosts.rows,
          rutaImagen: mascota?.rutaImagen,
          accesorios: req.session.accesorios
      });
  } catch (error) {
      console.error('Error al cargar la comunidad:', error);
      res.status(500).send('Error al cargar la comunidad');
  }
});


// Ruta para ver un post específico
app.get('/post/:id', requireLogin, async (req, res) => {
  try {
      const postId = req.params.id;
      const mascota = req.session.mascotaActual;
      
      const queryPost = `
          SELECT fp.*, u.username as autor_nombre, c.nombre as comunidad_nombre
          FROM forum_posts fp
          LEFT JOIN users u ON fp.user_id = u.id
          LEFT JOIN comunidades c ON fp.comunidad_id = c.id
          WHERE fp.id = $1
      `;
      const resultPost = await db.query(queryPost, [postId]);
      
      if (resultPost.rows.length === 0) {
          return res.status(404).send('Publicación no encontrada');
      }
      
      res.render('post.ejs', { 
          post: resultPost.rows[0],
          rutaImagen: mascota?.rutaImagen,
          accesorios: req.session.accesorios
      });
  } catch (error) {
      console.error('Error al cargar la publicación:', error);
      res.status(500).send('Error al cargar la publicación');
  }
});






    app.get('/eventos', requireLogin, async (req, res) => {
      try {
        const mascota = req.session.mascotaActual;
    
        // Obtener eventos de la base de datos
        const eventosResult = await db.query(`SELECT * FROM eventos ORDER BY fecha`);
        
        // Formatear los eventos para la plantilla
        const eventosData = eventosResult.rows.map(event => ({
          ...event,
          fecha: new Date(event.fecha), // Convertir string a objeto Date
          etiquetas: event.etiquetas ? event.etiquetas.split(',').map(tag => tag.trim()) : [],
          popular: event.popular || false
        }));
        
        // Renderizar la plantilla con los datos de eventos
        res.render('eventos.ejs', {
          mensaje: { imagenesUrl: [] },
          rutaImagen: mascota.rutaImagen,
          accesorios: req.session.accesorios,
          eventosData: eventosData, // Pasar los datos de eventos a la plantilla
          isAdmin: req.session.rango3 === 'Administrador'
        });
      } catch (error) {
        console.error('Error al renderizar página de eventos:', error);
        res.status(500).send('Error al cargar página de eventos');
      }
    });

    app.get('/formularioSoporte', requireLogin, (req, res) => {
      const mascota = req.session.mascotaActual;
  
      res.render('formularioSoporte.ejs', {
          rutaImagen: mascota.rutaImagen,
          accesorios: req.session.accesorios,
          emailjsConfig: {
              serviceId: process.env.EMAILJS_SERVICE_ID,
              templateId: process.env.EMAILJS_TEMPLATE_ID,
              toEmail: process.env.EMAILJS_TO_EMAIL
          }
      });
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




app.get('/presentacion', requireLogin, (req, res) => {
 
  const mascota = req.session.mascotaActual;

  res.render('presentacion.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios
  });
});

app.get('/minijuegos', requireLogin, (req, res) => {
 
    const mascota = req.session.mascotaActual;

    res.render('menuvideojuegos.ejs', {
        rutaImagen: mascota.rutaImagen,
        accesorios: req.session.accesorios
    });
});


app.get('/minijuego1', requireLogin, (req, res) => {
  res.render('minijuegos/minijuego1.ejs');
});

app.get('/minijuego2', requireLogin, (req, res) => {
  res.render('minijuegos/minijuego2.ejs');
});

app.get('/minijuego3', requireLogin, (req, res) => {
  res.render('minijuegos/minijuego3.ejs');
});

app.get('/minijuego4', requireLogin, (req, res) => {
  res.render('minijuegos/minijuego4.ejs');
});

app.get('/minijuego5', requireLogin, (req, res) => {
  res.render('minijuegos/minijuego5.ejs');
});

app.get('/minijuego6', requireLogin, (req, res) => {
  res.render('minijuegos/minijuego6.ejs');
});

app.get('/minijuego7', requireLogin, (req, res) => {
  res.render('minijuegos/minijuego7.ejs');
});

app.get('/minijuego8', requireLogin, (req, res) => {
  res.render('minijuegos/minijuego8.ejs');
});

app.get('/minijuego9', requireLogin, (req, res) => {
  res.render('minijuegos/minijuego9.ejs');
});

app.get('/minijuego10', requireLogin, (req, res) => {
  res.render('minijuegos/minijuego10.ejs');
});

app.get('/minijuego11', requireLogin, (req, res) => {
  res.render('minijuegos/minijuego11.ejs');
});

app.get('/min1', requireLogin, (req, res) => {
 
  const mascota = req.session.mascotaActual;

  res.render('minijuegos1.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios
  });
});



app.get('/min2', requireLogin, (req, res) => {
 
  const mascota = req.session.mascotaActual;

  res.render('minijuegos2.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios
  });
});



app.get('/min3', requireLogin, (req, res) => {
 
  const mascota = req.session.mascotaActual;

  res.render('minijuegos3.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios
  });
});


app.get('/min4', requireLogin, (req, res) => {
 
  const mascota = req.session.mascotaActual;

  res.render('minijuegos4.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios
  });
});


app.get('/min5', requireLogin, (req, res) => {
  const mascota = req.session.mascotaActual;

  res.render('minijuegos5.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios
  });
});


app.get('/min6', requireLogin, (req, res) => {
 
  const mascota = req.session.mascotaActual;

  res.render('minijuegos6.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios
  });
});


app.get('/min7', requireLogin, (req, res) => {
 
  const mascota = req.session.mascotaActual;

  res.render('minijuegos7.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios
  });
});


app.get('/min8', requireLogin, (req, res) => {
 
  const mascota = req.session.mascotaActual;

  res.render('minijuegos8.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios
  });
});


app.get('/min9', requireLogin, (req, res) => {
 
  const mascota = req.session.mascotaActual;

  res.render('minijuegos9.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios
  });
});


app.get('/min10', requireLogin, (req, res) => {
 
  const mascota = req.session.mascotaActual;

  res.render('minijuegos10.ejs', {
      rutaImagen: mascota.rutaImagen,
      accesorios: req.session.accesorios
  });
});

app.get('/min11', requireLogin, (req, res) => {
 
  const mascota = req.session.mascotaActual;

  res.render('minijuegos11.ejs', {
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

app.get('/minijuego3', (req, res) => {  
  res.render('minijuegos/minijuego3');  
});
/*---------------------------creamos rutas individuales para los juegos------------------------------------------------*/

























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



























// Variables para rastrear la actividad de los usuarios
let userActivityCounts = {}; // Almacenará conteos de posts/comentarios para cada usuario
let userVoteCounts = {}; // Almacenará conteos de votos para cada usuario
/**
 * Actualiza los rangos de un usuario basado en sus publicaciones
 * @param {number} userId - ID del usuario
 * @returns {Object} - Objeto con los rangos actualizados
 */
// Función para verificar y actualizar rangos sin sobrescribir el rango de administrador
async function updateUserRanksPreserveAdmin(userId) {
  try {
    // Primero, verificamos si el usuario tiene rango de Administrador
    const userRankResult = await db.query(
      `SELECT rango3 FROM users WHERE id = $1`,
      [userId]
    );
    
    // Si el usuario es Administrador, no modificamos sus rangos
    if (userRankResult.rows.length > 0 && userRankResult.rows[0].rango3 === 'Administrador') {
      console.log(`Usuario ${userId} es Administrador - rangos preservados`);
      return {
        // Retornamos los rangos actuales sin modificarlos
        rango1: userRankResult.rows[0].rango1 || 'Ninguno',
        rango2: userRankResult.rows[0].rango2 || 'Ninguno',
        rango3: 'Administrador' // Preservamos explícitamente el rango de Administrador
      };
    }
    
    // Si no es Administrador, procedemos con la actualización normal de rangos
    // 1. Contar el total de publicaciones del usuario
    const postCountResult = await db.query(
      `SELECT COUNT(*) as total_posts FROM forum_posts WHERE user_id = $1`,
      [userId]
    );
    
    const totalPosts = parseInt(postCountResult.rows[0].total_posts, 10);
    
    // 2. Determinar el rango1 basado en el total de publicaciones
    let rango1 = 'Ninguno'; // Valor predeterminado alineado con lo definido en la DB
    
    if (totalPosts >= 100000) {
      rango1 = 'Maestro';
    } else if (totalPosts >= 10000) {
      rango1 = 'Veterano';
    } else if (totalPosts >= 1000) {
      rango1 = 'Experimentado';
    } else if (totalPosts >= 100) {
      rango1 = 'Aprendiz';
    } else if (totalPosts >= 10) {
      rango1 = 'Novato';
    } else if (totalPosts > 0) {
      rango1 = 'Principiante';
    }
    
    // 3. Obtener la subcategoría más utilizada por el usuario
    const subcategoriaResult = await db.query(
      `SELECT subcategoria, COUNT(*) as count 
       FROM forum_posts 
       WHERE user_id = $1 AND subcategoria IS NOT NULL AND subcategoria != 'Ninguna'
       GROUP BY subcategoria 
       ORDER BY count DESC 
       LIMIT 1`,
      [userId]
    );
    
    // Si no hay subcategoría con más publicaciones, será 'Ninguno'
    let rango2 = 'Ninguno';
    if (subcategoriaResult.rows.length > 0) {
      rango2 = subcategoriaResult.rows[0].subcategoria;
    }
    
    // 4. Obtener la extra-subcategoría más utilizada por el usuario
    const extraSubcategoriaResult = await db.query(
      `SELECT extrasubcategoria, COUNT(*) as count 
       FROM forum_posts 
       WHERE user_id = $1 AND extrasubcategoria IS NOT NULL AND extrasubcategoria != 'Ninguna'
       GROUP BY extrasubcategoria 
       ORDER BY count DESC 
       LIMIT 1`,
      [userId]
    );
    
    // Si no hay extra-subcategoría con más publicaciones, será 'Ninguno'
    let rango3 = 'Ninguno';
    if (extraSubcategoriaResult.rows.length > 0) {
      rango3 = extraSubcategoriaResult.rows[0].extrasubcategoria;
    }
    
    console.log(`Actualizando rangos para usuario ${userId}: Rango1=${rango1}, Rango2=${rango2}, Rango3=${rango3}`);
    
    // 5. Actualizar los rangos del usuario en la base de datos
    try {
      const updateResult = await db.query(
        `UPDATE users 
         SET rango1 = $1, rango2 = $2, rango3 = $3 
         WHERE id = $4
         RETURNING rango1, rango2, rango3`,
        [rango1, rango2, rango3, userId]
      );
      
      if (updateResult.rows.length > 0) {
        console.log(`Rangos actualizados correctamente para usuario ${userId}`);
      } else {
        console.warn(`No se encontró usuario con ID ${userId} para actualizar rangos`);
      }
    } catch (dbError) {
      console.error('Error al actualizar rangos del usuario en la base de datos:', dbError);
      throw dbError;
    }
    
    // 6. Devolver los rangos actualizados
    return {
      rango1,
      rango2,
      rango3,
      totalPosts
    };
  } catch (error) {
    console.error('Error al actualizar rangos del usuario:', error);
    throw error;
  }
}

/**
 * Función para verificar y otorgar recompensas por publicaciones y comentarios y actualizar rangos
 * @param {number} userId - ID del usuario
 * @param {string} username - Nombre del usuario
 * @param {string} type - Tipo de actividad (post, comment)
 * @param {object} req - Objeto request
 * @returns {Object} - Resultado de la operación
 */
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
    
    let newTotal = null;
    
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
      if (req && req.session) {
        req.session.money = (req.session.money || 0) + coinsToAward;
        newTotal = req.session.money;
      }
      
      const activityType = type === 'post' ? 'publicaciones' : 'comentarios';
      console.log(`Usuario ${username} (ID: ${userId}) recibió ${coinsToAward} fichas por alcanzar ${currentCount} ${activityType}!`);
      
      if (bonusAwarded) {
        console.log(`Incluyendo un bono de 50 fichas por alcanzar un múltiplo de 100 ${activityType}!`);
      }
    }

    // Verificar primero si el usuario es administrador antes de actualizar rangos
    const isAdminResult = await db.query(
      `SELECT rango3 FROM users WHERE id = $1`,
      [userId]
    );
    
    let updatedRanks;
    
    // Si el usuario es Administrador, no actualizamos sus rangos
    if (isAdminResult.rows.length > 0 && isAdminResult.rows[0].rango3 === 'Administrador') {
      console.log(`Usuario ${username} (ID: ${userId}) es Administrador - manteniendo rangos`);
      
      // Obtenemos los rangos actuales sin modificarlos
      const userRanks = await db.query(
        `SELECT rango1, rango2, rango3 FROM users WHERE id = $1`,
        [userId]
      );
      
      updatedRanks = {
        rango1: userRanks.rows[0].rango1 || 'Ninguno',
        rango2: userRanks.rows[0].rango2 || 'Ninguno',
        rango3: 'Administrador', // Aseguramos que el rango3 sea siempre Administrador
        totalPosts: currentCount
      };
    } else {
      // Para usuarios no administradores, actualizamos normalmente los rangos
      updatedRanks = await updateUserRanksPreserveAdmin(userId);
    }
    
    // Actualizar los rangos en la sesión del usuario si está disponible
    if (req && req.session) {
      req.session.rango1 = updatedRanks.rango1;
      req.session.rango2 = updatedRanks.rango2;
      req.session.rango3 = updatedRanks.rango3;
    }
    
    return {
      awarded: regularAwarded || bonusAwarded,
      coins: coinsToAward,
      newTotal: newTotal,
      milestone: currentCount,
      bonusAwarded: bonusAwarded,
      type: type,
      ranksUpdated: true,
      updatedRanks
    };
  } catch (error) {
    console.error('Error al otorgar fichas o actualizar rangos:', error);
    return { awarded: false, error: error.message };
  }
}







































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


app.put('/actualizar-comentario/:mensajeId/:comentarioId', upload.array('imagenes', 9), async (req, res) => {
  try {
    const mensajeId = parseInt(req.params.mensajeId);
    const comentarioId = parseInt(req.params.comentarioId);
    const { autor, comentario, mantener_imagenes, comunidad_id } = req.body;
    
    // Validar datos básicos
    if (!autor || !comentario) {
      return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }
    
    // Encontrar índices
    const mensajeIndex = mensajes.findIndex(m => m.id === mensajeId);
    
    if (mensajeIndex === -1) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }
    
    const comentarioIndex = mensajes[mensajeIndex].comentarios.findIndex(c => c.id === comentarioId);
    
    if (comentarioIndex === -1) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }
    
    // Fecha formateada para actualización
    const fechaStr = new Date().toLocaleString() + ' (editado)';
    
    // Actualizar en la base de datos incluyendo comunidad_id
    await db.query(`
      UPDATE forum_comments 
      SET autor = $1, comentario = $2, fecha_str = $3, comunidad_id = $4
      WHERE id = $5 AND post_id = $6
    `, [autor, comentario, fechaStr, comunidad_id || null, comentarioId, mensajeId]);
    
    // Obtener las imágenes actuales del comentario
    const imagenesActuales = await db.query(`
      SELECT id, url FROM comment_images WHERE comment_id = $1
    `, [comentarioId]);
    
    // Preparar array para mantener las imágenes seleccionadas
    let idsAMantener = [];
    
    // Si se proporcionó el parámetro mantener_imagenes, usarlo
    if (mantener_imagenes) {
      idsAMantener = Array.isArray(mantener_imagenes) 
        ? mantener_imagenes.map(id => parseInt(id)) 
        : [parseInt(mantener_imagenes)];
    } else {
      // Si no se especificó mantener_imagenes, no mantener ninguna imagen
      idsAMantener = [];
    }
    
    // Eliminar imágenes no seleccionadas
    for (const imagen of imagenesActuales.rows) {
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
    
    // Actualizar imágenes en memoria - mantener las seleccionadas
    if (idsAMantener.length > 0) {
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

let ComunidadIdGlobal = null;

// Ruta para publicar post con rangos
app.post('/publicar', upload.array('imagenes', 9), async (req, res) => {
  try {
    const { autor, mensaje, etiqueta, subcategoria, extrasubcategoria, comunidad_id } = req.body;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }
    
    if (autor && mensaje) {
      // 1. Primero actualizamos los rangos del usuario para asegurarnos de que están al día
      const updatedRanks = await updateUserRanksPreserveAdmin(userId);
      
      // 2. Actualizamos la sesión con los rangos actualizados para acceso inmediato en el front-end
      req.session.rango1 = updatedRanks.rango1;
      req.session.rango2 = updatedRanks.rango2;
      req.session.rango3 = updatedRanks.rango3;
      
      // 3. Obtener los rangos directamente de la base de datos para asegurar consistencia
      const userRanksResult = await db.query(
        `SELECT rango1, rango2, rango3 FROM users WHERE id = $1`,
        [userId]
      );
      
      let rango1 = 'Ninguno';
      let rango2 = 'Ninguno';
      let rango3 = 'Ninguno';
      
      if (userRanksResult.rows.length > 0) {
        rango1 = userRanksResult.rows[0].rango1 || 'Ninguno';
        rango2 = userRanksResult.rows[0].rango2 || 'Ninguno';
        rango3 = userRanksResult.rows[0].rango3 || 'Ninguno';
        
        // Actualizar la sesión con valores obtenidos de la base de datos
        if (rango1 !== req.session.rango1 || rango2 !== req.session.rango2 || rango3 !== req.session.rango3) {
          console.log(`Sincronizando rangos en sesión con la base de datos para usuario ${userId}`);
          req.session.rango1 = rango1;
          req.session.rango2 = rango2;
          req.session.rango3 = rango3;
        }
      }
      
      // 4. Insertar el post con los rangos obtenidos de la tabla users
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
          comunidad_id || null
        ]
      );
      
      const postId = postResult.rows[0].id;
      const fecha = postResult.rows[0].fecha;
      
      // 5. Manejar subida de imágenes
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await db.query(
            `INSERT INTO post_images (post_id, url, filename) VALUES ($1, $2, $3)`,
            [postId, `/uploads/${file.filename}`, file.filename]
          );
        }
      }
      
      // 6. Actualizar el objeto nuevoMensaje para incluir rangos y comunidad_id
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
        rango1,
        rango2,
        rango3,
        comunidad_id: comunidad_id || null,
        imagenes: req.files ? req.files.map(file => ({
          id: Date.now() + Math.floor(Math.random() * 1000),
          url: `/uploads/${file.filename}`
        })) : [],
        comentarios: []
      };
      
      if (typeof votos !== 'undefined') {
        votos[postId] = {};
      }
      
      if (typeof mensajes !== 'undefined') {
        mensajes.push(nuevoMensaje);
      }
      
      // 7. Verificar y otorgar fichas por actividad
      const rewardResult = await checkAndAwardCoins(userId, req.session.username, 'post', req);
      
      // Si se otorgaron fichas, enviar notificación
      if (rewardResult.awarded) {
        req.session.rewardNotification = {
          type: 'post',
          coins: rewardResult.coins,
          milestone: rewardResult.milestone,
          timestamp: Date.now(),
          bonusAwarded: rewardResult.bonusAwarded
        };
      }
      
      // 8. Redireccionar a la página correspondiente
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
    res.status(500).send('Error al publicar el mensaje: ' + error.message);
  }
});

// Función que SIEMPRE muestra TODOS los mensajes de una comunidad
async function loadCommunityMessages(communityId) {
  try {
    // Consulta simple para mostrar TODOS los mensajes de la comunidad
    const query = `
      SELECT fp.*, u.username, u.rango1, u.rango2, u.rango3,
             COALESCE(SUM(v.valor), 0) as ranking,
             c.es_privada,
             c.creador_id
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      LEFT JOIN post_votes v ON fp.id = v.post_id
      LEFT JOIN comunidades c ON fp.comunidad_id = c.id
      WHERE fp.comunidad_id = $1
      GROUP BY fp.id, u.username, u.rango1, u.rango2, u.rango3, c.es_privada, c.creador_id
      ORDER BY fp.fecha DESC
    `;
    
    console.log(`Cargando TODOS los mensajes para comunidad: ${communityId}`);
    
    // Ejecutar la consulta
    const postResult = await db.query(query, [communityId]);
    console.log(`Encontrados ${postResult.rows.length} mensajes para la comunidad ${communityId}`);
    
    // Crear un array vacío para almacenar los posts
    const dbMensajes = [];
    
    // Procesar cada post
    for (const post of postResult.rows) {
      // Cargar imágenes para este post
      const imageResult = await db.query(`
        SELECT id, url FROM post_images WHERE post_id = $1
      `, [post.id]);
      
      // Cargar comentarios para este post con rangos de usuario
      const commentResult = await db.query(`
        SELECT fc.*, u.username, u.rango1, u.rango2, u.rango3,
               COALESCE(SUM(cv.valor), 0) as ranking
        FROM forum_comments fc
        JOIN users u ON fc.user_id = u.id
        LEFT JOIN comment_votes cv ON fc.id = cv.comment_id
        WHERE fc.post_id = $1
        GROUP BY fc.id, u.username, u.rango1, u.rango2, u.rango3
        ORDER BY fc.fecha ASC
      `, [post.id]);
      
      // Procesar comentarios
      const comments = [];
      for (const comment of commentResult.rows) {
        // Cargar imágenes para este comentario
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
          comunidad_id: comment.comunidad_id,
          imagenes: commentImageResult.rows.map(img => ({
            id: img.id,
            url: img.url
          })),
          ranking: comment.ranking || 0,
          votoActual: 0
        });
      }

      // Añadir el post al array
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
        es_privada: post.es_privada || false,
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
    console.error(`Error cargando mensajes para comunidad ${communityId}:`, error);
    return [];
  }
}

// Función auxiliar para procesar los mensajes
async function procesarMensajes(mensajesRows) {
  // Crear un array vacío para almacenar los posts procesados
  const dbMensajes = [];
  
  // Procesar cada post
  for (const post of mensajesRows) {
    // Cargar imágenes para este post
    const imageResult = await db.query(`
      SELECT id, url FROM post_images WHERE post_id = $1
    `, [post.id]);
    
    // Cargar comentarios para este post con rangos de usuario
    const commentResult = await db.query(`
      SELECT fc.*, u.username, u.rango1, u.rango2, u.rango3,
             COALESCE(SUM(cv.valor), 0) as ranking
      FROM forum_comments fc
      JOIN users u ON fc.user_id = u.id
      LEFT JOIN comment_votes cv ON fc.id = cv.comment_id
      WHERE fc.post_id = $1
      GROUP BY fc.id, u.username, u.rango1, u.rango2, u.rango3
      ORDER BY fc.fecha ASC
    `, [post.id]);
    
    // Procesar comentarios
    const comments = [];
    for (const comment of commentResult.rows) {
      // Cargar imágenes para este comentario
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
        comunidad_id: comment.comunidad_id,
        imagenes: commentImageResult.rows.map(img => ({
          id: img.id,
          url: img.url
        })),
        ranking: comment.ranking || 0,
        votoActual: 0
      });
    }

    // Añadir el post a nuestro array
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
      es_privada: post.es_privada || false,
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
}


app.get('/foro', requireLogin, async (req, res) => {
  try {
    const comunidad_id = req.query.comunidad_id || null; // Obtener desde la URL
    const userId = req.session.userId;
    
    // Actualizar los rangos del usuario antes de cargar la página
    if (userId) {
      try {
        // Obtener rangos actuales del usuario desde la base de datos
        const userResult = await db.query(
          `SELECT rango1, rango2, rango3 FROM users WHERE id = $1`,
          [userId]
        );
        
        if (userResult.rows.length > 0) {
          const userRanks = userResult.rows[0];
          
          // Actualizar la sesión con los rangos actuales
          req.session.rango1 = userRanks.rango1 || 'Ninguno';
          req.session.rango2 = userRanks.rango2 || 'Ninguno';
          req.session.rango3 = userRanks.rango3 || 'Ninguno';
          
          console.log(`Rangos cargados del usuario ${userId}: Rango1=${req.session.rango1}, Rango2=${req.session.rango2}, Rango3=${req.session.rango3}`);
        } else {
          console.warn(`No se encontró el usuario ${userId} en la base de datos`);
        }
      } catch (error) {
        console.error('Error al obtener rangos del usuario:', error);
      }
    }
    
    // Cargar etiquetas y posts
    const categories = await loadCategoriesFromDB();
    etiquetasDisponibles = categories.etiquetasDisponibles;
    subetiquetasDisponibles = categories.subetiquetasDisponibles;
    extrasubetiquetasDisponibles = categories.extrasubetiquetasDisponibles;

    mensajes = await loadForumPosts();
    nextId = mensajes.length > 0 ? Math.max(...mensajes.map(m => m.id)) + 1 : 1;

    if (req.session.userId) {
      const userVotesResult = await db.query(`
        SELECT post_id, valor FROM post_votes WHERE user_id = $1
      `, [req.session.userId]);
      // Puedes procesar los votos aquí si es necesario
    }

    const communitiesResult = await db.query(`
      SELECT id, nombre, es_privada FROM comunidades WHERE es_privada = false ORDER BY nombre
    `);
    const communities = communitiesResult.rows;

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

    const totalUsersResult = await db.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = totalUsersResult.rows[0].total;

    const totalCommunitiesResult = await db.query('SELECT COUNT(*) as total FROM comunidades');
    const totalCommunities = totalCommunitiesResult.rows[0].total;

    const totalPostsResult = await db.query('SELECT COUNT(*) as total FROM forum_posts');
    const totalPosts = totalPostsResult.rows[0].total;

    res.render('foro', { 
      username: req.session.username,
      userId: req.session.userId,
      descripcion: req.session.descripcion,
      money: req.session.money,
      mascotaActual: req.session.mascotaActual || null,
      rutaImagen: req.session.mascotaActual ? req.session.mascotaActual.rutaImagen : null,
      accesorios: req.session.accesorios,
      mensajes,
      etiquetasDisponibles,
      subetiquetasDisponibles,
      extrasubetiquetasDisponibles,
      userRangos: {
        rango1: req.session.rango1 || 'Ninguno',
        rango2: req.session.rango2 || 'Ninguno',
        rango3: req.session.rango3 || 'Ninguno'
      },
      communities,
      userCommunities,
      filtros: {
        showAllCommunities: true
      },
      totalUsers,
      totalCommunities,
      totalPosts,
      comunidadSeleccionada: comunidad_id // Aquí lo pasas al frontend
    });
  } catch (error) {
    console.error('Error rendering forum page:', error);
    res.status(500).send('Error loading forum page');
  }
});



app.get('/comunidad/:id/mensajes', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    
    if (!comunidadId) {
      return res.status(400).json({ error: 'ID de comunidad no proporcionado' });
    }
    
    // Usar la nueva función que SIEMPRE muestra TODOS los mensajes de la comunidad
    const mensajes = await loadCommunityMessages(comunidadId);
    
    // Enviar los mensajes como respuesta
    res.json({ mensajes });
  } catch (error) {
    console.error(`Error cargando mensajes de comunidad ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



async function loadForumPosts(includePrivate = false, specificCommunityId = null, userId = null) {
  try {
    // Base query to load all posts with user information
    let query = `
      SELECT fp.*, u.username, u.rango1, u.rango2, u.rango3,
             COALESCE(SUM(v.valor), 0) as ranking,
             c.es_privada,
             c.creador_id
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      LEFT JOIN post_votes v ON fp.id = v.post_id
      LEFT JOIN comunidades c ON fp.comunidad_id = c.id
    `;
    
    // Add filters based on parameters
    const queryParams = [];
    let paramCounter = 1;
    
    // If we specifically want messages from a community
    if (specificCommunityId) {
      console.log(`Filtrando mensajes para comunidad específica: ${specificCommunityId}`);
      query += ` WHERE fp.comunidad_id = $${paramCounter}`;
      queryParams.push(specificCommunityId);
      paramCounter++;
    } 
    // If we're in the general forum, exclude messages from private communities
    else if (!includePrivate) {
      query += ` WHERE (fp.comunidad_id IS NULL OR c.es_privada = false`;
      
      // If we have a userId, allow viewing messages from private communities where the user is a member
      if (userId) {
        query += ` OR
          (c.es_privada = true AND (
            c.creador_id = $${paramCounter} OR
            EXISTS(SELECT 1 FROM comunidades_usuarios cu WHERE cu.comunidad_id = c.id AND cu.user_id = $${paramCounter})
          ))`;
        queryParams.push(userId);
        paramCounter++;
      }
      
      query += `)`;
    }
    
    // Continue with the rest of the query
    query += `
      GROUP BY fp.id, u.username, u.rango1, u.rango2, u.rango3, c.es_privada, c.creador_id
      ORDER BY fp.fecha DESC
    `;
    
    console.log("Query SQL:", query);
    console.log("Params:", queryParams);
    
    // Execute the query
    const postResult = await db.query(query, queryParams);
    console.log(`Encontrados ${postResult.rows.length} mensajes`);
    
    // Create an empty array to store the posts
    const dbMensajes = [];
    
    // Process each post
    for (const post of postResult.rows) {
      // Load images for this post
      const imageResult = await db.query(`
        SELECT id, url FROM post_images WHERE post_id = $1
      `, [post.id]);
      
      // Load comments for this post with user ranks from the users table
      const commentResult = await db.query(`
        SELECT fc.*, u.username, u.rango1, u.rango2, u.rango3,
               COALESCE(SUM(cv.valor), 0) as ranking
        FROM forum_comments fc
        JOIN users u ON fc.user_id = u.id
        LEFT JOIN comment_votes cv ON fc.id = cv.comment_id
        WHERE fc.post_id = $1
        GROUP BY fc.id, u.username, u.rango1, u.rango2, u.rango3
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
          comunidad_id: comment.comunidad_id,
          imagenes: commentImageResult.rows.map(img => ({
            id: img.id,
            url: img.url
          })),
          ranking: comment.ranking || 0,
          votoActual: 0
        });
      }

      // Add the post to our array with user ranks and es_privada property
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
        es_privada: post.es_privada || false,  // Add property to verify if it's private
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






// Ruta para cargar la biblioteca de mascotas Esto agregar a meme xd

app.get('/biblioteca', requireLogin, async (req, res) => {
  const userId = req.session.userId;
  const mascotaActual = req.session.mascotaActual;

  try {
      // Eliminamos el bloque que verificaba y clonaba la mascota activa en pets2
      // Ya no hay duplicación entre pets y pets2

      // Obtener las mascotas de la biblioteca
      const mascotasResult = await db.query(
          `SELECT * FROM pets2 WHERE id_users = $1`,
          [userId]
      );

      // Obtener el ID de la mascota activa
      const mascotaActivaResult = await db.query(
          `SELECT id FROM pets WHERE id_users = $1 LIMIT 1`,
          [userId]
      );

      const mascotaActivaId = mascotaActivaResult.rows.length > 0 ? mascotaActivaResult.rows[0].id : null;

      res.render('biblioteca.ejs', {
          rutaImagen: mascotaActual ? mascotaActual.rutaImagen : null,
          accesorios: req.session.accesorios,
          money: req.session.money,
          mascotaActual: mascotaActual,
          mascotas: mascotasResult.rows,
          mascotaActiva: mascotaActivaId,
          especieMascotas: especieMascotas
      });
  } catch (error) {
      console.error('Error al cargar la biblioteca:', error);
      res.status(500).send('Error al cargar la biblioteca de mascotas');
  }
});

app.get('/biblioteca/detalle-mascota/:id', requireLogin, async (req, res) => {
  const mascotaId = req.params.id;
  const userId = req.session.userId;

  try {
      // Verificar que la mascota pertenece al usuario
      const mascotaResult = await db.query(
          `SELECT * FROM pets2 WHERE id = $1 AND id_users = $2`,
          [mascotaId, userId]
      );

      if (mascotaResult.rows.length === 0) {
          return res.json({ success: false, mensaje: 'Mascota no encontrada' });
      }

      const mascota = mascotaResult.rows[0];
      const especie = especieMascotas[mascota.indice - 1];

      res.json({
          success: true,
          mascota: mascota,
          especie: especie
      });
  } catch (error) {
      console.error('Error al obtener detalles de la mascota:', error);
      res.json({ success: false, mensaje: 'Error al obtener detalles' });
  }
});

app.post('/biblioteca/activar-mascota', requireLogin, async (req, res) => {
  const mascotaId = req.body.mascotaId;
  const userId = req.session.userId;

  try {
      // Obtener los datos de la mascota seleccionada en pets2
      const mascotaNuevaResult = await db.query(
          `SELECT * FROM pets2 WHERE id = $1 AND id_users = $2`,
          [mascotaId, userId]
      );

      if (mascotaNuevaResult.rows.length === 0) {
          return res.json({ success: false, mensaje: 'Mascota no encontrada o no te pertenece' });
      }

      const mascotaNueva = mascotaNuevaResult.rows[0];

      // Obtener la mascota activa actual (si existe)
      const mascotaActivaResult = await db.query(
          `SELECT * FROM pets WHERE id_users = $1`,
          [userId]
      );

      const existeMascotaActiva = mascotaActivaResult.rows.length > 0;
      const mascotaActiva = existeMascotaActiva ? mascotaActivaResult.rows[0] : null;

      // Comenzar una transacción
      await db.query('BEGIN');

      // 1. Si existe una mascota activa, guardarla en pets2 antes de eliminarla
      if (existeMascotaActiva) {
          // Verificamos primero si la mascota activa ya existe en pets2 con los mismos datos
          const mascotaExisteEnPets2 = await db.query(
              `SELECT id FROM pets2 
               WHERE id_users = $1 AND indice = $2 AND petname = $3`,
              [userId, mascotaActiva.indice, mascotaActiva.petname]
          );

          // Si no existe una mascota idéntica en pets2, la insertamos
          if (mascotaExisteEnPets2.rows.length === 0) {
              await db.query(
                  `INSERT INTO pets2 (petname, genero, indice, "nivelAmor", "nivelFelicidad", "nivelEnergia", 
                                    habilidad, "comidaFavorita", rareza, id_users)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                  [
                      mascotaActiva.petname,
                      mascotaActiva.genero,
                      mascotaActiva.indice,
                      mascotaActiva.nivelAmor,
                      mascotaActiva.nivelFelicidad,
                      mascotaActiva.nivelEnergia,
                      mascotaActiva.habilidad,
                      mascotaActiva.comidaFavorita,
                      mascotaActiva.rareza, // Rareza predeterminada si no se conoce
                      userId
                  ]
              );
              
              console.log(`Mascota activa anterior guardada en la biblioteca: ${mascotaActiva.petname}`);
          }

          // 2. Eliminar la mascota activa actual
          await db.query('DELETE FROM pets WHERE id_users = $1', [userId]);
      }

      // 3. Eliminar la mascota seleccionada de pets2
      await db.query('DELETE FROM pets2 WHERE id = $1', [mascotaId]);

      // 4. Insertar la nueva mascota activa en pets
      const result = await db.query(
          `INSERT INTO pets (petname, genero, indice, "nivelAmor", "nivelFelicidad", "nivelEnergia", 
                         habilidad, "comidaFavorita", id_users, rareza)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
              mascotaNueva.petname,
              mascotaNueva.genero,
              mascotaNueva.indice,
              mascotaNueva.nivelAmor,
              mascotaNueva.nivelFelicidad,
              mascotaNueva.nivelEnergia,
              mascotaNueva.habilidad,
              mascotaNueva.comidaFavorita,
              userId,
              mascotaNueva.rareza
          ]
      );

      // Confirmar la transacción
      await db.query('COMMIT');

      // Actualizar la sesión con la nueva mascota activa
      const rutaImagen = `${rutaBase}${mascotaNueva.indice}.gif`;
      const especieDeMascota = especieMascotas[mascotaNueva.indice - 1];
      const pronombre = mascotaNueva.genero === "macho" ? "el" : "la";

      req.session.mascotaActual = {
          id: result.rows[0].id,
          nombre: mascotaNueva.petname,
          genero: mascotaNueva.genero,
          especie: especieDeMascota,
          indice: mascotaNueva.indice,
          rutaImagen,
          pronombre,
          niveldeAmor: mascotaNueva.nivelAmor,
          niveldeFelicidad: mascotaNueva.nivelFelicidad,
          niveldeEnergia: mascotaNueva.nivelEnergia,
          habilidad: mascotaNueva.habilidad,
          comidaFavorita: mascotaNueva.comidaFavorita
      };

      res.json({ 
          success: true, 
          mensaje: 'Mascota activada correctamente. Refresca la página para ver todos los cambios.' 
      });
  } catch (error) {
      // Revertir la transacción en caso de error
      await db.query('ROLLBACK');
      console.error('Error al activar mascota:', error);
      res.json({ success: false, mensaje: 'Error al activar la mascota: ' + error.message });
  }
});

app.post('/biblioteca/guardar-mascota', requireLogin, async (req, res) => {
  const { nombre, indice, genero, rareza } = req.body;
  const userId = req.session.userId;

  try {
      // Verificar datos necesarios
      if (!nombre || !indice || !genero || !rareza) {
          return res.json({ success: false, mensaje: 'Datos incompletos' });
      }

      // Generar aleatoriamente una habilidad y comida favorita
      const indiceHabilidad = Math.floor(Math.random() * habilidadesEspeciales.length);
      const indiceComida = Math.floor(Math.random() * comidasFavoritas.length);
      
      const habilidad = habilidadesEspeciales[indiceHabilidad];
      const comidaFavorita = comidasFavoritas[indiceComida];

      // Insertar la nueva mascota en pets2
      await db.query(
          `INSERT INTO pets2 (petname, genero, indice, "nivelAmor", "nivelFelicidad", "nivelEnergia", habilidad, "comidaFavorita", rareza, id_users)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
              nombre,
              genero,
              indice,
              0, // nivelAmor
              50, // nivelFelicidad
              50, // nivelEnergia
              habilidad,
              comidaFavorita,
              rareza,
              userId
          ]
      );

      res.json({ success: true, mensaje: 'Mascota guardada correctamente' });
  } catch (error) {
      console.error('Error al guardar mascota:', error);
      res.json({ success: false, mensaje: 'Error al guardar la mascota' });
  }
});







app.get('/migracion-mascotas', requireLogin, async (req, res) => {
  // Solo permitir al administrador ejecutar esta migración
  if (req.session.rango3 !== 'Administrador') {
      return res.status(403).send('Acceso denegado. Se requieren permisos de administrador.');
  }

  try {
      // Obtener todas las mascotas activas que no están en pets2
      const mascotasActivas = await db.query(`
          SELECT p.* 
          FROM pets p
          WHERE NOT EXISTS (
              SELECT 1 
              FROM pets2 p2 
              WHERE p2.id_users = p.id_users AND p2.indice = p.indice
          )
      `);

      let mascotasMigradas = 0;

      // Migrar cada mascota activa a pets2
      for (const mascota of mascotasActivas.rows) {
          await db.query(`
              INSERT INTO pets2 (petname, genero, indice, "nivelAmor", "nivelFelicidad", "nivelEnergia", 
                               habilidad, "comidaFavorita", rareza, id_users)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
              mascota.petname,
              mascota.genero,
              mascota.indice,
              mascota.nivelAmor,
              mascota.nivelFelicidad,
              mascota.nivelEnergia,
              mascota.habilidad,
              mascota.comidaFavorita,
              'comun', // rareza por defecto para mascotas migradas
              mascota.id_users
          ]);
          
          mascotasMigradas++;
      }

      res.send(`Migración completada. Se migraron ${mascotasMigradas} mascotas a la biblioteca.`);
  } catch (error) {
      console.error('Error en la migración de mascotas:', error);
      res.status(500).send('Error en la migración: ' + error.message);
  }
});




//Agregar esto xd



//agrega esto xd
// Versión mejorada de la función del cliente para comprar sobres
app.post('/biblioteca/comprar-sobre', requireLogin, async (req, res) => {
  const { tipo, precio } = req.body;
  const userId = req.session.userId;

  try {
      // Verificar si el usuario tiene suficiente dinero
      const userResult = await db.query('SELECT money FROM users WHERE id = $1', [userId]);
      const userMoney = userResult.rows[0].money;

      if (userMoney < precio) {
          return res.json({
              success: false,
              mensaje: 'No tienes suficientes monedas para comprar este sobre'
          });
      }

      // Actualizar dinero del usuario
      await db.query('UPDATE users SET money = money - $1 WHERE id = $2', [precio, userId]);
      req.session.money = userMoney - precio;

      // Obtener mascota aleatoria según el tipo de sobre
      let rareza;
      const random = Math.random() * 100;
      
      if (tipo === 'basico') {
          // Sobre básico: 70% común, 25% raro, 5% épico
          if (random < 70) {
              rareza = 'comun';
          } else if (random < 95) {
              rareza = 'raro';
          } else {
              rareza = 'epico';
          }
      } else if (tipo === 'premium') {
          // Sobre premium: 60% raro, 30% épico, 10% legendario
          if (random < 60) {
              rareza = 'raro';
          } else if (random < 90) {
              rareza = 'epico';
          } else {
              rareza = 'legendario';
          }
      }
      
      // Seleccionar un índice de mascota según la rareza
      let indicesDisponibles;
      
      // Ejemplo de asignación de índices por rareza (ajusta según la distribución deseada)
      const indicesComunes = [1, 4, 7, 10, 11];
      const indicesRaros = [13, 16, 18, 21];
      const indicesEpicos = [23, 27, 29, 32];
      const indicesLegendarios = [35, 37, 38];
      
      switch (rareza) {
          case 'comun':
              indicesDisponibles = indicesComunes;
              break;
          case 'raro':
              indicesDisponibles = indicesRaros;
              break;
          case 'epico':
              indicesDisponibles = indicesEpicos;
              break;
          case 'legendario':
              indicesDisponibles = indicesLegendarios;
              break;
      }
      
      // Seleccionar un índice aleatorio de la lista disponible
      const indiceAleatorio = indicesDisponibles[Math.floor(Math.random() * indicesDisponibles.length)];
      
      // Determinar aleatoriamente el género
      const genero = Math.random() < 0.5 ? "macho" : "hembra";
      
      // Generar aleatoriamente una habilidad y comida favorita
      const indiceHabilidad = Math.floor(Math.random() * habilidadesEspeciales.length);
      const indiceComida = Math.floor(Math.random() * comidasFavoritas.length);
      
      const habilidad = habilidadesEspeciales[indiceHabilidad];
      const comidaFavorita = comidasFavoritas[indiceComida];

      res.json({
          success: true,
          moneyRestante: req.session.money,
          mascota: {
              indice: indiceAleatorio,
              genero: genero,
              rareza: rareza,
              especie: especieMascotas[indiceAleatorio - 1],
              habilidad: habilidad,
              comidaFavorita: comidaFavorita
          }
      });
  } catch (error) {
      console.error('Error al comprar sobre:', error);
      res.json({ success: false, mensaje: 'Error al procesar la compra' });
  }
});
// Agrega esta ruta para guardar la mascota después de que el usuario le asigne un nombre
app.post('/biblioteca/guardar-mascota', requireLogin, async (req, res) => {
  const { nombre, indice, genero, rareza } = req.body;
  const userId = req.session.userId;

  try {
      // Verificar datos necesarios
      if (!nombre || !indice || !genero || !rareza) {
          return res.json({ success: false, mensaje: 'Datos incompletos' });
      }

      // Generar aleatoriamente una habilidad y comida favorita
      const indiceHabilidad = Math.floor(Math.random() * habilidadesEspeciales.length);
      const indiceComida = Math.floor(Math.random() * comidasFavoritas.length);
      
      const habilidad = habilidadesEspeciales[indiceHabilidad];
      const comidaFavorita = comidasFavoritas[indiceComida];

      // Insertar la nueva mascota en pets2 con todos los campos necesarios
      const result = await db.query(
          `INSERT INTO pets2 (petname, genero, indice, "nivelAmor", "nivelFelicidad", "nivelEnergia", 
                          habilidad, "comidaFavorita", rareza, id_users, nivel, fechaObtencion)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
           RETURNING id`,
          [
              nombre,         // petname
              genero,         // genero
              indice,         // indice
              0,              // nivelAmor
              50,             // nivelFelicidad
              50,             // nivelEnergia
              habilidad,      // habilidad
              comidaFavorita, // comidaFavorita
              rareza,         // rareza
              userId,         // id_users
              1               // nivel (valor predeterminado)
          ]
      );

      res.json({ success: true, mensaje: 'Mascota guardada correctamente' });
  } catch (error) {
      console.error('Error al guardar mascota:', error);
      res.json({ 
          success: false, 
          mensaje: 'Error al guardar la mascota: ' + error.message
      });
  }
});
//xdd









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

app.post('/publicar-comentario', upload.array('imagenes', 9), async (req, res) => {
  try {
    const { autor, comentario, mensaje_padre_id, comunidad_id } = req.body;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }
    
    if (autor && comentario && mensaje_padre_id) {
      // Primero actualizamos los rangos del usuario para asegurarnos de que están al día
      const updatedRanks = await updateUserRanksPreserveAdmin(userId);
      
      // Actualizamos la sesión con los rangos actualizados
      req.session.rango1 = updatedRanks.rango1;
      req.session.rango2 = updatedRanks.rango2;
      req.session.rango3 = updatedRanks.rango3;
      
      // Insert the comment into the database con comunidad_id y rangos actualizados
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
          updatedRanks.rango1,
          updatedRanks.rango2,
          updatedRanks.rango3,
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
        rango1: updatedRanks.rango1,
        rango2: updatedRanks.rango2,
        rango3: updatedRanks.rango3,
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


// Ruta para subir nuevas imágenes a un comentario existente
app.post('/agregar-imagenes-comentario/:mensajeId/:comentarioId', upload.array('imagenes', 9), async (req, res) => {
  try {
    const mensajeId = parseInt(req.params.mensajeId);
    const comentarioId = parseInt(req.params.comentarioId);
    const { comunidad_id } = req.body;
    
    // Verificar si el comentario existe
    const mensajeIndex = mensajes.findIndex(m => m.id === mensajeId);
    if (mensajeIndex === -1) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }
    
    const comentarioIndex = mensajes[mensajeIndex].comentarios.findIndex(c => c.id === comentarioId);
    if (comentarioIndex === -1) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }
    
    // Verificar si hay imágenes nuevas
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No se proporcionaron imágenes' });
    }
    
    // Obtener cantidad actual de imágenes
    const imagenesActuales = await db.query(`
      SELECT COUNT(*) as total FROM comment_images WHERE comment_id = $1
    `, [comentarioId]);
    
    const totalActual = parseInt(imagenesActuales.rows[0].total);
    const totalNuevas = req.files.length;
    
    // Verificar que no se exceda el límite de 9 imágenes
    if (totalActual + totalNuevas > 9) {
      return res.status(400).json({ 
        success: false, 
        error: `No se pueden agregar ${totalNuevas} imágenes. El límite es de 9 imágenes en total y ya tienes ${totalActual}.`
      });
    }
    
    // Añadir nuevas imágenes a la base de datos
    for (const file of req.files) {
      await db.query(`
        INSERT INTO comment_images (comment_id, url, filename, comunidad_id)
        VALUES ($1, $2, $3, $4)
      `, [comentarioId, `/uploads/${file.filename}`, file.filename, comunidad_id || null]);
    }
    
    // Añadir nuevas imágenes en memoria
    for (const file of req.files) {
      const newImageId = Date.now() + Math.floor(Math.random() * 1000);
      
      mensajes[mensajeIndex].comentarios[comentarioIndex].imagenes.push({
        id: newImageId,
        url: `/uploads/${file.filename}`
      });
    }
    
    // Actualizar datos en memoria desde la base de datos
    await loadForumPosts();
    
    res.json({ 
      success: true, 
      mensaje: `Se han agregado ${req.files.length} nuevas imágenes al comentario`,
      comentario: mensajes[mensajeIndex].comentarios[comentarioIndex]
    });
    
  } catch (error) {
    console.error('Error al agregar imágenes al comentario:', error);
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
      
      // Error al enviar comentario ranking en la base de datos
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































































































































































































































































































































































// Ruta para ver perfiles de usuarios específicos
app.get('/usuario/:userId', async (req, res) => {
  try {
    const viewerId = req.session.userId; // ID del usuario que está viendo el perfil
    const profileId = req.params.userId; // ID del usuario cuyo perfil se está viendo
    
    // Verificar si el usuario está viendo su propio perfil
    const isOwnProfile = viewerId && viewerId.toString() === profileId.toString();
    
    // Si es su propio perfil, redirigir a la ruta normal de perfil
    if (isOwnProfile) {
      return res.redirect('/perfil');
    }
    
    // Obtener información del usuario cuyo perfil se está viendo
    const userResult = await db.query(`
      SELECT id, username, description, rango1, rango2, rango3, last_login_time
      FROM users WHERE id = $1
    `, [profileId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).send('Usuario no encontrado');
    }
    
    const user = userResult.rows[0];
    
    // Obtener la mascota del usuario
    const mascotaResult = await db.query(`
      SELECT id, petname, genero, indice, habilidad, "nivelAmor", "nivelFelicidad", "nivelEnergia", "comidaFavorita"
      FROM pets
      WHERE id_users = $1
    `, [profileId]);
    
    // Configurar los datos de la mascota
    let mascotaNombre = "Sin mascota";
    let rutaImagen = "/imagenes_y_gif/default_mascota.png";
    let especieDeMascota = "Desconocida";
    let pronombre = "le"; // Valor por defecto
    let nivelAmor = 0;
    let nivelEnergia = 0;
    let nivelFelicidad = 0;
    let comidaFavorita = "Desconocida";
    let habilidadesEspeciales = "Ninguna";
    
    if (mascotaResult.rows.length > 0) {
      const mascota = mascotaResult.rows[0];
      mascotaNombre = mascota.petname;
      rutaImagen = `/imagenes_de_mascotas/${mascota.indice}.gif`;
      especieDeMascota = "Mascota";
      pronombre = mascota.genero === 'Femenino' ? 'ella' : 'el';
      nivelAmor = mascota["nivelAmor"];
      nivelEnergia = mascota["nivelEnergia"];
      nivelFelicidad = mascota["nivelFelicidad"];
      comidaFavorita = mascota["comidaFavorita"] || "Desconocida";
      habilidadesEspeciales = mascota.habilidad;
    }
    
    // Obtener accesorios del usuario
    const accesoriosResult = await db.query(`
      SELECT * FROM accesorios WHERE id_users = $1
    `, [profileId]);
    
    // Obtener conteo de actividad (publicaciones y comentarios)
    const postsResult = await db.query('SELECT COUNT(*) FROM forum_posts WHERE user_id = $1', [profileId]);
    const postCount = parseInt(postsResult.rows[0].count);
    
    const commentsResult = await db.query('SELECT COUNT(*) FROM forum_comments WHERE user_id = $1', [profileId]);
    const commentCount = parseInt(commentsResult.rows[0].count);
    
    const totalPublicaciones = postCount + commentCount;
    
    // Usar una fecha fija para la membresía si no hay last_login_time
    const fechaMembresia = user.last_login_time ? 
                         new Date(user.last_login_time).toLocaleDateString('es-ES') : 
                         new Date('2024-01-01').toLocaleDateString('es-ES');
    
    // Renderizar la vista de perfil con los datos del usuario
    res.render('perfil.ejs', {
      rutaImagen,
      accesorios: accesoriosResult.rows,
      mascotaNombre,
      usuario: user.username,
      especieDeMascota,
      pronombre,
      nivelAmor,
      nivelEnergia,
      nivelFelicidad,
      comidaFavorita,
      habilidadesEspeciales,
      descripcion: user.description || 'Sin descripción',
      rango1: user.rango1 || 'Ninguno',
      rango2: user.rango2 || 'Ninguno',
      rango3: user.rango3 || 'Ninguno',
      totalPublicaciones,
      fechaMembresia,
      viewingOwnProfile: false,
      viewerId,
      // Variables para header y footer
      isAuthenticated: !!req.session.userId,
      username: req.session.username,
      userId: req.session.userId,
      money: req.session.money,
      mascotaActual: req.session.mascotaActual,
      miUsuarioId: req.session.userId // Para el script del footer
    });
  } catch (error) {
    console.error('Error al obtener datos del perfil de usuario:', error);
    res.status(500).send('Error al cargar el perfil del usuario');
  }
});
// Dejar la ruta existente tal como está y simplemente añadir la nueva propiedad viewingOwnProfile
app.get('/perfil', requireLogin, async (req, res) => {
  try {
      const mascota = req.session.mascotaActual;
      const userId = req.session.userId;
      
      // Obtener el conteo total de publicaciones del usuario
      const postsResult = await db.query('SELECT COUNT(*) FROM forum_posts WHERE user_id = $1', [userId]);
      const postCount = parseInt(postsResult.rows[0].count);
      
      // Obtener el conteo total de comentarios del usuario
      const commentsResult = await db.query('SELECT COUNT(*) FROM forum_comments WHERE user_id = $1', [userId]);
      const commentCount = parseInt(commentsResult.rows[0].count);
      
      // Sumar ambos para obtener el total de actividad
      const totalPublicaciones = postCount + commentCount;
      
      // Obtener información del usuario, incluyendo last_login_time
      const userResult = await db.query('SELECT last_login_time FROM users WHERE id = $1', [userId]);
      
      // Si el usuario tiene last_login_time en la base de datos y NO tiene fecha guardada en la sesión
      if (userResult.rows.length > 0 && userResult.rows[0].last_login_time && !req.session.membresia_date) {
          // Guardamos la fecha en la sesión como fecha de membresía (solo la primera vez)
          req.session.membresia_date = userResult.rows[0].last_login_time;
      }
      
      // Usar una fecha fija si no hay fecha de membresía
      const fechaMembresia = req.session.membresia_date ? 
                         new Date(req.session.membresia_date).toLocaleDateString('es-ES') : 
                         new Date('2024-01-01').toLocaleDateString('es-ES');
      
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
          rango1: req.session.rango1,
          rango2: req.session.rango2,
          rango3: req.session.rango3,
          totalPublicaciones: totalPublicaciones,
          fechaMembresia: fechaMembresia,
          viewingOwnProfile: true // Indicar que es el propio perfil
      });
  } catch (error) {
      console.error('Error al obtener datos para el perfil:', error);
      res.status(500).send('Error al cargar el perfil');
  }
});



app.get('/buscar', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') return res.redirect('/inicio'); // si vacío, redirige

  try {
    const texto = `%${q}%`;
    
    // Buscar mascotas por nombre o habilidad
    const mascotas = await db.query(
      `SELECT p.id, p.petname, p.genero, p.indice, p.habilidad, p."nivelAmor", 
              p."nivelFelicidad", p."nivelEnergia", p."comidaFavorita" 
       FROM pets p
       JOIN users u ON p.id_users = u.id
       WHERE p.petname ILIKE $1 OR p.habilidad ILIKE $1 OR p."comidaFavorita" ILIKE $1
       ORDER BY p."nivelAmor" DESC`, [texto]
    );

    // Buscar eventos relacionados con la búsqueda
    const eventos = await db.query(
      `SELECT id, titulo, descripcion, imagen, fecha, hora, duracion, plataforma, 
              etiquetas, organizador, asistentes, popular, es_especial
       FROM eventos 
       WHERE titulo ILIKE $1 OR descripcion ILIKE $1 OR etiquetas ILIKE $1 OR organizador ILIKE $1
       ORDER BY fecha ASC, popular DESC`, [texto]
    );
    
    // Buscar posts del foro más votados incluyendo imágenes
    const posts = await db.query(
      `SELECT fp.id, fp.user_id, fp.autor, fp.mensaje, fp.etiqueta, fp.subcategoria, 
              fp.extrasubcategoria, fp.fecha, fp.fecha_str, fp.ranking, 
              (SELECT url FROM post_images WHERE post_id = fp.id LIMIT 1) as imagen_url,
              COUNT(pv.id) as votos
       FROM forum_posts fp
       LEFT JOIN post_votes pv ON fp.id = pv.post_id
       WHERE fp.autor ILIKE $1 OR fp.mensaje ILIKE $1 OR fp.etiqueta ILIKE $1 
             OR fp.subcategoria ILIKE $1 OR fp.extrasubcategoria ILIKE $1
       GROUP BY fp.id
       ORDER BY COUNT(pv.id) DESC, fp.fecha DESC`, [texto]
    );

    // Buscar comunidades por nombre, descripción o categoría
    const comunidades = await db.query(
      `SELECT c.id, c.nombre, c.descripcion, c.categoria, c.subcategoria, c.subcategoria_extra, 
              c.imagen_url, c.es_privada, COUNT(cu.user_id) as miembros
       FROM comunidades c
       LEFT JOIN comunidades_usuarios cu ON c.id = cu.comunidad_id
       WHERE c.nombre ILIKE $1 OR c.descripcion ILIKE $1 OR c.categoria ILIKE $1 OR 
             c.subcategoria ILIKE $1 OR c.subcategoria_extra ILIKE $1
       GROUP BY c.id
       ORDER BY COUNT(cu.user_id) DESC`, [texto]
    );

    // Buscar comentarios relevantes con imágenes
    const comentarios = await db.query(
      `SELECT fc.id, fc.post_id, fc.user_id, fc.autor, fc.comentario, fc.fecha, fc.fecha_str, fc.ranking, 
              (SELECT url FROM comment_images WHERE comment_id = fc.id LIMIT 1) as imagen_url,
              fp.id as post_id, fp.etiqueta, fp.subcategoria
       FROM forum_comments fc
       JOIN forum_posts fp ON fc.post_id = fp.id
       WHERE fc.comentario ILIKE $1 OR fc.autor ILIKE $1
       ORDER BY fc.ranking DESC`, [texto]
    );

    // Buscar accesorios
    const accesoriosBusqueda = await db.query(
      `SELECT a.id, a.indice, a.id_users, u.username as dueno
       FROM accesorios a
       JOIN users u ON a.id_users = u.id
       WHERE u.username ILIKE $1`, [texto]
    );

    // Buscar items
    const items = await db.query(
      `SELECT i.id, i.indice, i.categoria, i.id_users, u.username as dueno
       FROM items i
       JOIN users u ON i.id_users = u.id
       WHERE i.categoria ILIKE $1 OR u.username ILIKE $1`, [texto]
    );

    // Buscar usuarios
    const usuarios = await db.query(
      `SELECT id, username, description, rango1, rango2, rango3
       FROM users
       WHERE username ILIKE $1 OR description ILIKE $1 OR rango1 ILIKE $1 OR rango2 ILIKE $1 OR rango3 ILIKE $1`, [texto]
    );

    // Buscar categorías
    const categorias = await db.query(
      `SELECT id, nombre, descripcion, tipo, categoria, subcategoria, extrasubcategoria
       FROM categories_metadata
       WHERE nombre ILIKE $1 OR descripcion ILIKE $1 OR categoria ILIKE $1 
             OR subcategoria ILIKE $1 OR extrasubcategoria ILIKE $1`, [texto]
    );

    // Eventos destacados (para ejemplos cuando no hay resultados)
    const eventosDestacados = await db.query(
      `SELECT id, titulo, fecha, imagen, popular 
       FROM eventos 
       WHERE fecha >= CURRENT_DATE
       ORDER BY popular DESC, fecha ASC`
    );

    // Ejemplos destacados para cada categoría
    const ejemplos = {
      mascotas: await db.query(
        `SELECT id, petname, habilidad, "comidaFavorita"
         FROM pets 
         ORDER BY "nivelFelicidad" DESC`
      ),
      posts: await db.query(
        `SELECT id, autor, etiqueta, mensaje, fecha,
              (SELECT url FROM post_images WHERE post_id = forum_posts.id LIMIT 1) as imagen_url
         FROM forum_posts 
         ORDER BY ranking DESC`
      ),
      comunidades: await db.query(
        `SELECT c.id, c.nombre, c.categoria, c.imagen_url, COUNT(cu.user_id) as miembros 
         FROM comunidades c
         LEFT JOIN comunidades_usuarios cu ON c.id = cu.comunidad_id
         GROUP BY c.id
         ORDER BY COUNT(cu.user_id) DESC`
      ),
      eventos: eventosDestacados.rows,
      accesorios: await db.query(
        `SELECT id, indice FROM accesorios ORDER BY id DESC`
      ),
      items: await db.query(
        `SELECT id, indice, categoria FROM items ORDER BY id DESC`
      )
    };

    // Si el usuario está autenticado, obtener sus accesorios y mascota para el footer
    let accesoriosUsuario = [];
    let usuario = null;
    let mascotaActual = req.session.mascotaActual || null;
    let rutaImagen = req.session.mascotaActual ? req.session.mascotaActual.rutaImagen : '/imagenes_y_gif/default_mascota.png';
    
    if (req.session && req.session.userId) {
      // Obtener accesorios del usuario para el footer
      const accResult = await db.query(
        `SELECT * FROM accesorios WHERE id_users = $1`,
        [req.session.userId]
      );
      accesoriosUsuario = accResult.rows;
      
      // Obtener información del usuario
      const userResult = await db.query(
        `SELECT * FROM users WHERE id = $1`,
        [req.session.userId]
      );
      
      if (userResult.rows.length > 0) {
        usuario = userResult.rows[0];
      }
    }

    res.render('resultados_busqueda', {
      query: q,
      mascotas: mascotas.rows,
      posts: posts.rows,
      comunidades: comunidades.rows,
      comentarios: comentarios.rows,
      eventos: eventos.rows,
      accesorios: accesoriosBusqueda.rows,
      items: items.rows,
      usuarios: usuarios.rows,
      categorias: categorias.rows,
      ejemplos: {
        mascotas: ejemplos.mascotas.rows,
        posts: ejemplos.posts.rows,
        comunidades: ejemplos.comunidades.rows,
        eventos: ejemplos.eventos,
        accesorios: ejemplos.accesorios.rows,
        items: ejemplos.items.rows
      },
      menuItems: [
        {path: '/inicio', icon: 'fas fa-home', text: 'Inicio'},
        {path: '/foro', icon: 'fas fa-comments', text: 'Foros'},
        {path: '/eventos', icon: 'fas fa-calendar', text: 'Eventos'},
        {path: '/comunidad', icon: 'fas fa-users', text: 'Comunidad'},
        {path: '/corral_mascota', icon: 'fas fa-paw', text: 'Mascotas'},
        {path: '/tienda', icon: 'fas fa-shopping-cart', text: 'Tienda'},
      ],
      // Variables actualizadas para el footer
      rutaImagen: req.session.mascotaActual ? req.session.mascotaActual.rutaImagen : '/imagenes_y_gif/default_mascota.png',
      mascotaActual: req.session.mascotaActual || null,
      accesorios: req.session.accesorios,
      accesoriosUsuario: accesoriosUsuario || [],
      usuario: usuario || null,
      username: req.session.username,
      userId: req.session.userId,
      money: req.session.money,
      isAuthenticated: !!req.session.userId,
      descripcion: req.session.descripcion,
      userRangos: {
        rango1: req.session.rango1 || 'Ninguno',
        rango2: req.session.rango2 || 'Ninguno',
        rango3: req.session.rango3 || 'Ninguno'
      }
    });

  } catch (err) {
    console.error('Error en la búsqueda:', err);
    res.status(500).send('Error interno al buscar');
  }
});







// Nueva ruta para buscar y redirigir al perfil del dueño de una mascota
app.post('/buscar-dueno', async (req, res) => {
  try {
    const mascotaId = req.body.mascotaId;
    
    // Consultar la base de datos para obtener el id_users de la mascota
    const result = await db.query('SELECT id_users FROM pets WHERE id = $1', [mascotaId]);
    
    if (result.rows.length === 0) {
      return res.status(404).send('Mascota no encontrada');
    }
    
    const userId = result.rows[0].id_users;
    
    // Redirigir al perfil del usuario
    res.redirect(`/usuario/${userId}`);
  } catch (error) {
    console.error('Error al buscar dueño de mascota:', error);
    res.status(500).send('Error interno al buscar dueño');
  }
});




// Endpoint para obtener información de un usuario específico
app.get('/api/users/:id', requireLogin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verificar que es un ID válido
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de usuario inválido'
      });
    }
    
    // Buscar el usuario en la base de datos
    const userResult = await db.query(`
      SELECT id, username FROM users WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'Usuario no encontrado'
      });
    }
    
    // Devolver la información del usuario
    res.json({
      success: true,
      id: userResult.rows[0].id,
      username: userResult.rows[0].username
    });
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener información del usuario'
    });
  }
});

// Endpoint para obtener la lista de miembros de una comunidad
app.get('/api/comunidad/:id/members', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    const userId = req.session.userId;
    
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
    
    // Obtener el creador de la comunidad
    const creadorId = comunidadResult.rows[0].creador_id;
    
    // Obtener la lista de miembros
    const miembrosResult = await db.query(`
      SELECT u.id, u.username, cu.rol
      FROM users u
      JOIN comunidades_usuarios cu ON u.id = cu.user_id
      WHERE cu.comunidad_id = $1
      ORDER BY 
        CASE 
          WHEN cu.rol = 'administrador' THEN 1
          WHEN cu.rol = 'moderador' THEN 2
          WHEN cu.rol = 'miembro' THEN 3
          ELSE 4
        END, 
        u.username
    `, [comunidadId]);
    
    // Añadir el creador si no está en la lista de miembros
    let members = [...miembrosResult.rows];
    
    // Verificar si el creador ya está en la lista
    const creadorExisteEnLista = members.some(member => member.id === creadorId);
    
    // Si el creador no está en la lista, obtener sus datos y añadirlo
    if (!creadorExisteEnLista) {
      const creadorResult = await db.query(`
        SELECT id, username FROM users WHERE id = $1
      `, [creadorId]);
      
      if (creadorResult.rows.length > 0) {
        members.push({
          id: creadorResult.rows[0].id,
          username: creadorResult.rows[0].username,
          rol: 'administrador (creador)'
        });
      }
    }
    
    res.json({
      success: true,
      members: members
    });
  } catch (error) {
    console.error('Error al obtener miembros de la comunidad:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al obtener la lista de miembros' 
    });
  }
});

// Modificación del endpoint para transferir la propiedad
app.post('/api/comunidad/:id/transfer-ownership', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    const currentUserId = req.session.userId;
    const { newOwnerId } = req.body;
    
    if (!newOwnerId) {
      return res.status(400).json({
        success: false,
        mensaje: 'Se requiere el ID del nuevo propietario'
      });
    }
    
    // Iniciar transacción
    await db.query('BEGIN');
    
    // Verificar si la comunidad existe y el usuario actual es el creador
    const comunidadResult = await db.query(`
      SELECT * FROM comunidades WHERE id = $1
    `, [comunidadId]);
    
    if (comunidadResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        mensaje: 'Comunidad no encontrada' 
      });
    }
    
    const comunidad = comunidadResult.rows[0];
    
    if (comunidad.creador_id !== currentUserId) {
      await db.query('ROLLBACK');
      return res.status(403).json({ 
        success: false, 
        mensaje: 'No tienes permisos para transferir la propiedad de esta comunidad' 
      });
    }
    
    // Verificar que el nuevo propietario exista
    const nuevoUsuarioResult = await db.query(`
      SELECT u.* FROM users u 
      WHERE u.id = $1
    `, [newOwnerId]);
    
    if (nuevoUsuarioResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        mensaje: 'El usuario seleccionado no existe' 
      });
    }
    
    const isMemberResult = await db.query(`
      SELECT * FROM comunidades_usuarios 
      WHERE comunidad_id = $1 AND user_id = $2
    `, [comunidadId, newOwnerId]);
    
    // Si no es miembro, verificar si necesitamos agregarlo
    if (isMemberResult.rows.length === 0) {
      // Agregarlo como miembro con rol de administrador
      await db.query(`
        INSERT INTO comunidades_usuarios
        (comunidad_id, user_id, rol, fecha_union)
        VALUES ($1, $2, 'administrador', NOW())
      `, [comunidadId, newOwnerId]);
    } else {
      // Actualizar su rol a administrador independientemente de su rol actual
      await db.query(`
        UPDATE comunidades_usuarios
        SET rol = 'administrador'
        WHERE comunidad_id = $1 AND user_id = $2
      `, [comunidadId, newOwnerId]);
    }
    
    // Actualizar el creador en la tabla comunidades
    await db.query(`
      UPDATE comunidades
      SET creador_id = $1
      WHERE id = $2
    `, [newOwnerId, comunidadId]);
    
    // Cambiar el rol del anterior creador a miembro normal
    // Primero verificar si ya existe en comunidades_usuarios
    const oldOwnerMembershipResult = await db.query(`
      SELECT * FROM comunidades_usuarios 
      WHERE comunidad_id = $1 AND user_id = $2
    `, [comunidadId, currentUserId]);
    
    if (oldOwnerMembershipResult.rows.length === 0) {
      // Si no existe, agregarlo como miembro normal
      await db.query(`
        INSERT INTO comunidades_usuarios
        (comunidad_id, user_id, rol, fecha_union)
        VALUES ($1, $2, 'miembro', NOW())
      `, [comunidadId, currentUserId]);
    } else {
      // Si existe, cambiar su rol a miembro
      await db.query(`
        UPDATE comunidades_usuarios
        SET rol = 'miembro'
        WHERE comunidad_id = $1 AND user_id = $2
      `, [comunidadId, currentUserId]);
    }
    
    // Confirmar transacción
    await db.query('COMMIT');
    
    res.json({
      success: true,
      mensaje: `Propiedad transferida correctamente a ${nuevoUsuarioResult.rows[0].username}`
    });
  } catch (error) {
    // Revertir transacción en caso de error
    await db.query('ROLLBACK');
    console.error('Error al transferir propiedad de la comunidad:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al transferir la propiedad de la comunidad' 
    });
  }
});
// Modificar el endpoint para dejar una comunidad
app.post('/api/comunidad/:id/leave', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    const userId = req.session.userId;
    
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
    
    // Verificar si es el creador (no debería poder abandonar, solo transferir la propiedad)
    if (comunidad.creador_id === userId) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'Como administrador no puedes abandonar la comunidad. Debes transferir la propiedad primero.' 
      });
    }
    
    // Verificar si es miembro
    const isMemberResult = await db.query(`
      SELECT * FROM comunidades_usuarios 
      WHERE comunidad_id = $1 AND user_id = $2
    `, [comunidadId, userId]);
    
    if (isMemberResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'No eres miembro de esta comunidad' 
      });
    }
    
    // Iniciar una transacción para asegurar la integridad de los datos
    await db.query('BEGIN');
    
    try {
      // Eliminar al usuario de la comunidad
      await db.query(`
        DELETE FROM comunidades_usuarios
        WHERE comunidad_id = $1 AND user_id = $2
      `, [comunidadId, userId]);
      
      // También eliminar cualquier solicitud previa para permitir futuras solicitudes
      await db.query(`
        DELETE FROM solicitudes_comunidad
        WHERE comunidad_id = $1 AND usuario_id = $2
      `, [comunidadId, userId]);
      
      // Confirmar la transacción
      await db.query('COMMIT');
      
      return res.json({ 
        success: true, 
        mensaje: 'Has abandonado la comunidad correctamente'
      });
    } catch (error) {
      // Si hay algún error, deshacer todos los cambios
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error al abandonar la comunidad:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al procesar la solicitud' 
    });
  }
});




// Endpoint para obtener comunidades con información de acceso
app.get('/api/comunidades', async (req, res) => {
  try {
      const userId = req.session.userId || null;
      
      let query = `
          SELECT c.*, 
                 COUNT(DISTINCT cu.user_id) as total_miembros, 
                 COUNT(DISTINCT p.id) as total_posts
      `;
      
      // Siempre incluir información de acceso si el usuario está logueado
      if (userId) {
          query += `, 
              (SELECT COUNT(*) > 0 FROM comunidades_usuarios 
               WHERE comunidad_id = c.id AND user_id = $1) as es_miembro,
               (c.creador_id = $1) as es_creador
          `;
      }
      
      query += `
          FROM comunidades c
          LEFT JOIN comunidades_usuarios cu ON c.id = cu.comunidad_id
          LEFT JOIN posts p ON c.id = p.comunidad_id
          GROUP BY c.id
          ORDER BY total_miembros DESC, total_posts DESC
      `;
      
      const params = userId ? [userId] : [];
      const result = await db.query(query, params);
      
      // Si el usuario no está logueado, establecer valores predeterminados
      if (!userId) {
          result.rows.forEach(comunidad => {
              comunidad.es_miembro = false;
              comunidad.es_creador = false;
          });
      }
      
      res.json(result.rows);
  } catch (error) {
      console.error('Error al obtener comunidades:', error);
      res.status(500).json([]);
  }
});

// Endpoint para obtener el usuario actual
app.get('/api/usuario/actual', (req, res) => {
  if (req.session && req.session.userId) {
      res.json({ 
          userId: req.session.userId,
          username: req.session.username
      });
  } else {
      res.json({ userId: null, username: null });
  }
});

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

// 4. Corregir el endpoint API para unirse a una comunidad (versión API)
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
        (usuario_id, comunidad_id, mensaje, estado) 
        VALUES ($1, $2, $3, 'pendiente')
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
      ON CONFLICT (comunidad_id, user_id) DO NOTHING
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

// API para obtener todas las categorías (accesible para todos los usuarios)
app.get('/api/categorias', async (req, res) => {
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

// API para obtener subcategorías por categoría (accesible para todos los usuarios)
app.get('/api/subcategorias', async (req, res) => {
  try {
    const { categoria } = req.query;
    
    if (!categoria) {
      return res.status(400).json({ success: false, mensaje: 'Se requiere una categoría' });
    }
    
    const subcategoriasResult = await db.query(`
      SELECT * FROM categories_metadata 
      WHERE tipo = 'subcategoria' AND categoria = $1 AND activo = TRUE
      ORDER BY nombre
    `, [categoria]);
    
    res.json({ success: true, subcategorias: subcategoriasResult.rows });
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    res.status(500).json({ success: false, mensaje: 'Error al obtener subcategorías', error: error.message });
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
    
    // Validar que la categoría existe
    if (categoria) {
      const categoriaResult = await db.query(`
        SELECT * FROM categories_metadata 
        WHERE tipo = 'categoria' AND nombre = $1 AND activo = TRUE
      `, [categoria]);
      
      if (categoriaResult.rows.length === 0) {
        return res.redirect('/comunidad?error=true&mensaje=La categoría seleccionada no existe');
      }
      
      // Validar que la subcategoría existe si se proporciona
      if (subcategoria) {
        const subcategoriaResult = await db.query(`
          SELECT * FROM categories_metadata 
          WHERE tipo = 'subcategoria' AND categoria = $1 AND nombre = $2 AND activo = TRUE
        `, [categoria, subcategoria]);
        
        if (subcategoriaResult.rows.length === 0) {
          return res.redirect('/comunidad?error=true&mensaje=La subcategoría seleccionada no existe');
        }
      }
    }
    
    try {
      // Begin transaction
      await db.query('BEGIN');
      
      // Insertar la nueva comunidad con subcategorías
      const result = await db.query(`
        INSERT INTO comunidades 
        (nombre, descripcion, categoria, subcategoria, subcategoria_extra, imagen_url, creador_id, reglas, es_privada) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [nombre, descripcion, categoria, subcategoria, subcategoria_extra, imagen_url, req.session.userId, reglas, es_privada]);
      
      const comunidadId = result.rows[0].id;
      
      // Añadir automáticamente al creador como miembro de la comunidad con rol 'administrador'
      await db.query(`
        INSERT INTO comunidades_usuarios (comunidad_id, user_id, rol, fecha_union)
        VALUES ($1, $2, 'administrador', NOW())
      `, [comunidadId, req.session.userId]);
      
      await db.query('COMMIT');
      
      // MODIFICACIÓN: Redirigir directamente al foro de la comunidad creada
      res.redirect(`/foro?comunidad_id=${comunidadId}`);
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error al crear comunidad:', error);
    res.redirect('/comunidad?error=true&mensaje=Error al crear la comunidad');
  }
});

// 3. Corregir el endpoint para unirse a una comunidad
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
    
    // Verificar si ya es miembro
    const isMemberResult = await db.query(`
      SELECT * FROM comunidades_usuarios 
      WHERE comunidad_id = $1 AND user_id = $2
    `, [comunidadId, req.session.userId]);
    
    if (isMemberResult.rows.length > 0) {
      return res.status(400).json({ success: false, mensaje: 'Ya eres miembro de esta comunidad' });
    }
    
    // Si la comunidad es privada, crear solicitud
    if (comunidad.es_privada) {
      await db.query(`
        INSERT INTO solicitudes_comunidad 
        (usuario_id, comunidad_id, mensaje, estado) 
        VALUES ($1, $2, $3, 'pendiente')
        ON CONFLICT (usuario_id, comunidad_id) DO NOTHING
      `, [req.session.userId, comunidadId, req.body.mensaje || '']);
      
      return res.json({ success: true, mensaje: 'Solicitud enviada correctamente. Espera la aprobación de un administrador.' });
    }
    
    // CORRECCIÓN: Si la comunidad es pública, agregar como miembro automáticamente
    await db.query(`
      INSERT INTO comunidades_usuarios
      (comunidad_id, user_id, rol, fecha_union)
      VALUES ($1, $2, 'miembro', NOW())
      ON CONFLICT (comunidad_id, user_id) DO NOTHING
    `, [comunidadId, req.session.userId]);
    
    return res.json({ success: true, mensaje: 'Te has unido a la comunidad correctamente.' });
  } catch (error) {
    console.error('Error al unirse a la comunidad:', error);
    res.status(500).json({ success: false, mensaje: 'Error al procesar la solicitud' });
  }
});

















// Agregar estos endpoints a tu archivo index.js o routes/comunidades.js

// Endpoint para obtener estadísticas de una comunidad
app.get('/api/comunidades/:comunidadId/stats', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.comunidadId;
    
    // Consulta para obtener cantidad de miembros
    const miembrosQuery = `
      SELECT COUNT(user_id) AS total 
      FROM comunidades_usuarios 
      WHERE comunidad_id = $1
    `;
    
    // Consulta para obtener cantidad de publicaciones
    const publicacionesQuery = `
      SELECT COUNT(id) AS total 
      FROM publicaciones 
      WHERE comunidad_id = $1
    `;
    
    // Ejecutar consultas en paralelo
    const [miembrosResult, publicacionesResult] = await Promise.all([
      db.query(miembrosQuery, [comunidadId]),
      db.query(publicacionesQuery, [comunidadId])
    ]);
    
    return res.json({
      exito: true,
      miembros: parseInt(miembrosResult.rows[0]?.total || 0),
      publicaciones: parseInt(publicacionesResult.rows[0]?.total || 0)
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas de comunidad:', error);
    return res.status(500).json({
      error: true,
      mensaje: 'Error al obtener estadísticas de la comunidad'
    });
  }
});

// Endpoint para eliminar una comunidad (versión actualizada)
app.post('/api/comunidades/:comunidadId/eliminar', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.comunidadId;
    const userId = req.session.userId;
    
    // Verificar que el usuario es administrador de la comunidad
    const verificacionQuery = `
      SELECT rol 
      FROM comunidades_usuarios 
      WHERE comunidad_id = $1 AND user_id = $2
    `;
    
    const verificacionResult = await db.query(verificacionQuery, [comunidadId, userId]);
    
    if (verificacionResult.rows.length === 0 || verificacionResult.rows[0].rol !== 'administrador') {
      return res.status(403).json({
        error: true,
        mensaje: 'No tienes permiso para eliminar esta comunidad'
      });
    }
    
    // Usar una transacción para eliminar todos los datos relacionados
    await db.query('BEGIN');
    
    try {
      // Primero verificamos qué tablas existen antes de intentar eliminar datos
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('comunidades_usuarios', 'comentarios', 'likes', 'publicaciones', 'comunidades', 'forum_posts')
      `;
      
      const tablesResult = await db.query(tablesQuery);
      const existingTables = tablesResult.rows.map(row => row.table_name);
      
      console.log('Tablas existentes:', existingTables);
      
      // 1. Eliminar membresías de usuarios (si la tabla existe)
      if (existingTables.includes('comunidades_usuarios')) {
        await db.query('DELETE FROM comunidades_usuarios WHERE comunidad_id = $1', [comunidadId]);
      }
      
      // 2. Eliminar publicaciones y referencias relacionadas (si la tabla existe)
      if (existingTables.includes('publicaciones')) {
        // Si existe la tabla 'likes', eliminar primero los likes de las publicaciones
        if (existingTables.includes('likes')) {
          await db.query(`
            DELETE FROM likes 
            WHERE publicacion_id IN (
              SELECT id FROM publicaciones WHERE comunidad_id = $1
            )
          `, [comunidadId]);
        }
        
        // Si existe la tabla 'comentarios', eliminar los comentarios de las publicaciones
        if (existingTables.includes('comentarios')) {
          await db.query(`
            DELETE FROM comentarios 
            WHERE publicacion_id IN (
              SELECT id FROM publicaciones WHERE comunidad_id = $1
            )
          `, [comunidadId]);
        }
        
        // Ahora eliminamos las publicaciones
        await db.query('DELETE FROM publicaciones WHERE comunidad_id = $1', [comunidadId]);
      }
      
      // 3. NUEVO: Eliminar los posts del foro relacionados con esta comunidad
      if (existingTables.includes('forum_posts')) {
        await db.query('DELETE FROM forum_posts WHERE comunidad_id = $1', [comunidadId]);
        console.log('Posts del foro eliminados para la comunidad:', comunidadId);
      }
      
      // 4. Finalmente, eliminar la comunidad
      if (existingTables.includes('comunidades')) {
        await db.query('DELETE FROM comunidades WHERE id = $1', [comunidadId]);
      }
      
      // Confirmar transacción
      await db.query('COMMIT');
      
      return res.json({
        exito: true,
        mensaje: 'Comunidad eliminada correctamente'
      });
      
    } catch (error) {
      // Revertir transacción en caso de error
      await db.query('ROLLBACK');
      console.error('Error en la transacción:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error al eliminar comunidad:', error);
    return res.status(500).json({
      error: true,
      mensaje: 'Error al eliminar la comunidad: ' + error.message
    });
  }
});

// Endpoint para obtener las comunidades que el usuario administra o modera
app.get('/api/comunidades/administradas', requireLogin, async (req, res) => {
  try {
    // Obtener directamente las comunidades donde el usuario es administrador o moderador
    // Sin verificar el rango del usuario, ya que parece que esa información está en otra tabla
    const query = `
      SELECT c.id, c.nombre, c.descripcion, c.categoria, c.subcategoria, c.imagen_url, cu.rol
      FROM comunidades c
      JOIN comunidades_usuarios cu ON c.id = cu.comunidad_id
      WHERE cu.user_id = $1 
      AND (cu.rol = 'administrador' OR cu.rol = 'moderador')
      ORDER BY c.nombre ASC
    `;
    
    const result = await db.query(query, [req.session.userId]);
    
    return res.json({
      exito: true,
      comunidades: result.rows
    });
    
  } catch (error) {
    console.error('Error al obtener comunidades administradas:', error);
    return res.status(500).json({
      error: true,
      mensaje: 'Error al obtener las comunidades administradas'
    });
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

// Mantener la versión original para compatibilidad con código existente
app.get('/api/comunidad/:id/verificar-acceso', requireLogin, async (req, res) => {
  try {
    const comunidadId = req.params.id;
    const userId = req.session.userId;
    
    console.log(`Verificando acceso: comunidadId=${comunidadId}, userId=${userId}`);
    
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
    
    // ¿Es el creador?
    const esCreador = comunidad.creador_id === userId;
    
    // Verificar membresía
    const miembroResult = await db.query(`
      SELECT rol FROM comunidades_usuarios 
      WHERE comunidad_id = $1 AND user_id = $2
    `, [comunidadId, userId]);
    
    const esMiembro = miembroResult.rows.length > 0;
    const rol = esMiembro ? miembroResult.rows[0].rol : null;
    
    // Verificar si hay solicitud pendiente
    const solicitudResult = await db.query(`
      SELECT * FROM solicitudes_comunidad 
      WHERE comunidad_id = $1 AND usuario_id = $2 AND estado = 'pendiente'
    `, [comunidadId, userId]);
    
    const solicitudPendiente = solicitudResult.rows.length > 0;
    
    // La comunidad es privada pero el usuario es miembro o creador
    const puedeAcceder = !comunidad.es_privada || esCreador || esMiembro;
    
    console.log(`Resultado acceso: esCreador=${esCreador}, esMiembro=${esMiembro}, rol=${rol}, puedeAcceder=${puedeAcceder}`);
    
    res.json({
      success: true,
      puedeAcceder,
      esCreador,
      esMiembro,
      rol,
      esPrivada: comunidad.es_privada,
      solicitudPendiente
    });
    
  } catch (error) {
    console.error('Error al verificar acceso a la comunidad:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error al verificar acceso' 
    });
  }
});

// Añadir también la versión que funciona en el segundo archivo
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





































































// Endpoint to get unread event notifications
app.get('/api/notificaciones-eventos', requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get events that the user hasn't received a notification for
    // or hasn't read yet, and that haven't passed yet
    const query = `
      SELECT e.* 
      FROM eventos e
      LEFT JOIN eventos_notificaciones en ON e.id = en.evento_id AND en.user_id = $1
      WHERE 
        e.fecha >= CURRENT_DATE AND 
        (en.id IS NULL OR en.leido = false)
      ORDER BY e.fecha ASC, e.hora ASC
      LIMIT 10
    `;
    
    const result = await db.query(query, [userId]);
    
    // Process each event to format the etiquetas
    const eventos = result.rows.map(event => ({
      ...event,
      etiquetas: event.etiquetas ? event.etiquetas.split(',').map(tag => tag.trim()) : []
    }));
    
    // Get count of unread notifications
    const countQuery = `
      SELECT COUNT(*) 
      FROM eventos e
      LEFT JOIN eventos_notificaciones en ON e.id = en.evento_id AND en.user_id = $1
      WHERE 
        e.fecha >= CURRENT_DATE AND 
        (en.id IS NULL OR en.leido = false)
    `;
    
    const countResult = await db.query(countQuery, [userId]);
    const unreadCount = parseInt(countResult.rows[0].count || 0);
    
    // Create notification entries for new events
    const eventIds = eventos.map(e => e.id);
    if (eventIds.length > 0) {
      // Use INSERT with ON CONFLICT to avoid duplicates
      await db.query(`
        INSERT INTO eventos_notificaciones (evento_id, user_id, leido)
        SELECT e.id, $1, false
        FROM unnest($2::int[]) AS e(id)
        ON CONFLICT (evento_id, user_id) DO NOTHING
      `, [userId, eventIds]);
    }
    
    res.json({
      success: true,
      eventos: eventos,
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching notifications' 
    });
  }
});

// Endpoint to mark notifications as read
app.post('/api/notificaciones-eventos/marcar-leido', requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { eventoId } = req.body;
    
    if (eventoId) {
      // Mark a specific notification as read
      await db.query(`
        UPDATE eventos_notificaciones
        SET leido = true, fecha_lectura = CURRENT_TIMESTAMP
        WHERE evento_id = $1 AND user_id = $2
      `, [eventoId, userId]);
    } else {
      // Mark all notifications as read
      await db.query(`
        UPDATE eventos_notificaciones
        SET leido = true, fecha_lectura = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND leido = false
      `, [userId]);
    }
    
    res.json({
      success: true,
      mensaje: 'Notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error marking notifications as read' 
    });
  }
});











// ---------------------- API DE EVENTOS -------------------------
// API endpoints para la gestión de eventos

// GET - Obtener todos los eventos
app.get('/api/eventos-data', requireLogin, async (req, res) => {
  try {
    // Query to retrieve events from database
    const result = await db.query(`
      SELECT * FROM eventos 
      ORDER BY fecha DESC
    `);
    
    // Process the database results (convert date objects, parse etiquetas to array)
    const events = result.rows.map(event => ({
      ...event,
      etiquetas: event.etiquetas ? event.etiquetas.split(',').map(tag => tag.trim()) : []
    }));
    
    res.json({
      success: true,
      eventos: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error retrieving events from database' 
    });
  }
});

// GET - Obtener un evento específico por ID
app.get('/api/eventos/:id', requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const result = await db.query(`
      SELECT * FROM eventos WHERE id = $1
    `, [eventId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    // Process event (convert etiquetas to array)
    const event = {
      ...result.rows[0],
      etiquetas: result.rows[0].etiquetas ? result.rows[0].etiquetas.split(',').map(tag => tag.trim()) : []
    };
    
    res.json({
      success: true,
      evento: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, error: 'Error retrieving event from database' });
  }
});

// Middleware para verificar si el usuario es administrador
const isAdminEventos = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, mensaje: 'Debes iniciar sesión' });
    }
    
    // Verificar si el usuario tiene el rango3 = 'Administrador'
    if (req.session.rango3 !== 'Administrador') {
      return res.status(403).json({ success: false, mensaje: 'No tienes permisos de administrador' });
    }
    
    next();
  } catch (error) {
    console.error('Error al verificar permisos de administrador:', error);
    res.status(500).json({ success: false, mensaje: 'Error al verificar permisos' });
  }
};

// POST - Create a new event (admin or community admin)
app.post('/api/eventos', requireLogin, async (req, res) => {
  try {
    const { titulo, descripcion, imagen, fecha, hora, duracion, plataforma, etiquetas, esEspecial, comunidad_id } = req.body;
    const userId = req.session.userId;
    
    // Validate required fields
    if (!titulo || !descripcion || !fecha || !hora || !plataforma) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan campos obligatorios (título, descripción, fecha, hora, plataforma)' 
      });
    }
    
    // Check authorization using both approaches
    const isSystemAdmin = req.session.rango3 === 'Administrador';
    let isCommunityAdmin = false;
    
    // Only check community admin status if a community_id is provided
    if (comunidad_id) {
      // Log the community_id and userId for debugging
      console.log(`Checking admin status for user ${userId} in community ${comunidad_id}`);
      
      const adminCheck = await db.query(
        `SELECT * FROM comunidades_usuarios 
         WHERE comunidad_id = $1 AND user_id = $2 AND rol = 'administrador'`,
        [comunidad_id, userId]
      );
      
      // Log the result for debugging
      console.log('Admin check query results:', adminCheck.rows);
      
      isCommunityAdmin = adminCheck.rows.length > 0;
    }
    
    // Log both flags for debugging
    console.log(`isSystemAdmin: ${isSystemAdmin}, isCommunityAdmin: ${isCommunityAdmin}`);
    
    // If neither system admin nor community admin, reject
    if (!isSystemAdmin && !isCommunityAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para crear eventos' 
      });
    }
    
    // Process etiquetas (convert array to comma-separated string if needed)
    const etiquetasString = Array.isArray(etiquetas) ? etiquetas.join(',') : etiquetas || '';
    
    // Get community name for the organizer field
    let organizerName = "Equipo Pet-Chan";
    if (!isSystemAdmin && comunidad_id) {
      const communityResult = await db.query('SELECT nombre FROM comunidades WHERE id = $1', [comunidad_id]);
      if (communityResult.rows.length > 0) {
        organizerName = `Comunidad: ${communityResult.rows[0].nombre}`;
      }
    }
    
    // Insert the new event into the database
    const result = await db.query(`
      INSERT INTO eventos 
      (titulo, descripcion, imagen, fecha, hora, duracion, plataforma, etiquetas, organizador, es_especial, creador_id, comunidad_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      titulo, 
      descripcion,
      imagen || "https://i.pinimg.com/originals/ae/0a/a1/ae0aa14707e1b4bb35fe11b8f00a9956.gif", // Default image
      fecha,
      hora,
      duracion || "1 hora",
      plataforma,
      etiquetasString,
      organizerName,
      esEspecial === true || esEspecial === 'true',
      userId, // Añadir creador_id
      comunidad_id || null // Añadir comunidad_id
    ]);
    
    // Format the returned event for the response
    const newEvent = {
      ...result.rows[0],
      etiquetas: result.rows[0].etiquetas ? result.rows[0].etiquetas.split(',').map(tag => tag.trim()) : []
    };
    
    // Crear notificaciones para todos los usuarios
    try {
      // Obtener todos los usuarios
      const userIdsResult = await db.query(`SELECT id FROM users`);
      
      if (userIdsResult.rows.length > 0 && newEvent && newEvent.id) {
        // Preparar valores para inserción masiva
        const values = userIdsResult.rows.map(row => 
          `(${newEvent.id}, ${row.id}, false)`
        ).join(', ');
        
        // Insertar notificaciones para todos los usuarios
        if (values.length > 0) {
          await db.query(`
            INSERT INTO eventos_notificaciones (evento_id, user_id, leido)
            VALUES ${values}
            ON CONFLICT (evento_id, user_id) DO NOTHING
          `);
          console.log(`Creadas ${userIdsResult.rows.length} notificaciones para el evento ${newEvent.id}`);
        }
      }
    } catch (notifError) {
      // Solo registrar el error, pero no interrumpir la creación de eventos
      console.error('Error al crear notificaciones para el evento:', notifError);
    }
    
    res.status(201).json({
      success: true,
      mensaje: 'Evento creado correctamente',
      evento: newEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al crear evento en la base de datos', 
      details: error.message 
    });
  }
});

// Función para verificar el esquema actual de la tabla eventos
async function checkEventosSchema() {
  try {
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'eventos' 
      ORDER BY ordinal_position;
    `;
    
    const result = await db.query(query);
    console.log("Esquema actual de la tabla eventos:");
    console.table(result.rows);
    
    return result.rows;
  } catch (error) {
    console.error("Error al verificar el esquema:", error);
    return [];
  }
}

// Ejecutar esta función antes de implementar los cambios para verificar la estructura actual
// checkEventosSchema();

// PUT - Update an existing event (admin or community admin)
app.put('/api/eventos/:id', requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { titulo, descripcion, imagen, fecha, hora, duracion, plataforma, etiquetas, esEspecial, comunidad_id } = req.body;
    const userId = req.session.userId;
    
    // Check if the event exists
    const eventResult = await db.query(`SELECT * FROM eventos WHERE id = $1`, [eventId]);
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' });
    }
    
    const event = eventResult.rows[0];
    
    // Check authorization
    const isSystemAdmin = req.session.rango3 === 'Administrador';
    let isCommunityAdmin = false;
    
    // For community admin, check if they have admin role in the community associated with the event
    if (event.comunidad_id) {
      const adminCheck = await db.query(
        `SELECT * FROM comunidades_usuarios 
         WHERE comunidad_id = $1 AND user_id = $2 AND rol = 'administrador'`,
        [event.comunidad_id, userId]
      );
      
      isCommunityAdmin = adminCheck.rows.length > 0;
    }
    
    // Also check if user is the creator of the event
    const isCreator = event.creador_id && event.creador_id === userId;
    
    // If neither system admin nor community admin nor creator, reject
    if (!isSystemAdmin && !isCommunityAdmin && !isCreator) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para editar este evento' 
      });
    }
    
    // Process etiquetas
    const etiquetasString = Array.isArray(etiquetas) ? etiquetas.join(',') : etiquetas;
    
    // Only system admin can change the community association
    const finalComunidadId = isSystemAdmin ? (comunidad_id || event.comunidad_id) : event.comunidad_id;
    
    // Update the event in the database
    const updateResult = await db.query(`
      UPDATE eventos SET
        titulo = COALESCE($1, titulo),
        descripcion = COALESCE($2, descripcion),
        imagen = COALESCE($3, imagen),
        fecha = COALESCE($4, fecha),
        hora = COALESCE($5, hora),
        duracion = COALESCE($6, duracion),
        plataforma = COALESCE($7, plataforma),
        etiquetas = COALESCE($8, etiquetas),
        es_especial = COALESCE($9, es_especial),
        comunidad_id = $10,
        fecha_modificacion = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [
      titulo || null,
      descripcion || null,
      imagen || null,
      fecha || null,
      hora || null,
      duracion || null,
      plataforma || null,
      etiquetasString || null,
      esEspecial !== undefined ? (esEspecial === true || esEspecial === 'true') : null,
      finalComunidadId,
      eventId
    ]);
    
    // Format the returned event for the response
    const updatedEvent = {
      ...updateResult.rows[0],
      etiquetas: updateResult.rows[0].etiquetas ? updateResult.rows[0].etiquetas.split(',').map(tag => tag.trim()) : []
    };
    
    res.json({
      success: true,
      mensaje: 'Evento actualizado correctamente',
      evento: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al actualizar evento en la base de datos',
      details: error.message
    });
  }
});


// DELETE - Delete an event (admin, community admin, or creator)
app.delete('/api/eventos/:id', requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.session.userId;
    
    // Check if the event exists
    const checkResult = await db.query(`SELECT * FROM eventos WHERE id = $1`, [eventId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' });
    }
    
    const event = checkResult.rows[0];
    
    // Check authorization
    const isSystemAdmin = req.session.rango3 === 'Administrador';
    let isCommunityAdmin = false;
    
    // Check if community admin (if event belongs to a community)
    if (event.comunidad_id) {
      const adminCheck = await db.query(
        `SELECT * FROM comunidades_usuarios 
         WHERE comunidad_id = $1 AND user_id = $2 AND rol = 'administrador'`,
        [event.comunidad_id, userId]
      );
      
      isCommunityAdmin = adminCheck.rows.length > 0;
    }
    
    // Check if user is the creator
    const isCreator = event.creador_id && event.creador_id === userId;
    
    // If neither system admin nor community admin nor creator, reject
    if (!isSystemAdmin && !isCommunityAdmin && !isCreator) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para eliminar este evento' 
      });
    }
    
    // Delete the event
    await db.query(`DELETE FROM eventos WHERE id = $1`, [eventId]);
    
    res.json({
      success: true,
      mensaje: 'Evento eliminado correctamente',
      evento: checkResult.rows[0] // Return the deleted event info
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al eliminar evento de la base de datos',
      details: error.message
    });
  }
});

// Helper function to check if user is admin or community admin
async function isUserAuthorized(userId, communityId = null) {
  try {
    // Check if system admin
    const userCheck = await db.query('SELECT rango3 FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rows.length > 0 && userCheck.rows[0].rango3 === 'Administrador') {
      return true;
    }
    
    // If communityId provided, check if community admin
    if (communityId) {
      const adminCheck = await db.query(
        `SELECT * FROM comunidades_usuarios 
         WHERE comunidad_id = $1 AND user_id = $2 AND rol = 'administrador'`,
        [communityId, userId]
      );
      
      return adminCheck.rows.length > 0;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking user authorization:', error);
    return false;
  }
}

// GET - Check if the current user can create/edit events in a community
app.get('/api/eventos/check-permissions/:comunidad_id?', requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const comunidadId = req.params.comunidad_id || null;
    
    const isAuthorized = await isUserAuthorized(userId, comunidadId);
    
    res.json({
      success: true,
      canManageEvents: isAuthorized
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    res.status(500).json({ success: false, error: 'Error al verificar permisos' });
  }
});

// POST - Registrarse para un evento (aumentar contador de asistentes)
app.post('/api/eventos/:id/register', requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { nombre, email, mascota, comentarios } = req.body;
    
    // Check if the event exists
    const checkResult = await db.query(`SELECT * FROM eventos WHERE id = $1`, [eventId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' });
    }
    
    // Increment attendance count
    await db.query(`
      UPDATE eventos 
      SET asistentes = asistentes + 1 
      WHERE id = $1
    `, [eventId]);
    
    // In a complete implementation, you would store the registration details
    // and perhaps send a confirmation email
    
    res.json({
      success: true,
      mensaje: 'Registro exitoso',
      evento: checkResult.rows[0]
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ success: false, error: 'Error al registrarse para el evento' });
  }
});

// GET - Verificar si el usuario actual es administrador
app.get('/api/check-admin', requireLogin, (req, res) => {
  try {
    // Verificar si el usuario tiene el rango de administrador
    const isAdmin = req.session.rango3 === 'Administrador';
    
    res.json({
      success: true,
      isAdmin: isAdmin
    });
  } catch (error) {
    console.error('Error al verificar estado admin:', error);
    res.status(500).json({ success: false, error: 'Error al verificar permisos' });
  }
});

// Función para inicializar la tabla de eventos con datos de ejemplo
async function initializeEventsTable() {
  try {
    const checkResult = await db.query('SELECT COUNT(*) FROM eventos');
    
    if (parseInt(checkResult.rows[0].count) === 0) {
      console.log('Inicializando tabla de eventos con datos de ejemplo...');
      
      // Eventos de ejemplo
      const sampleEvents = [
        {
          titulo: "Torneo de Mascotas Virtuales",
          descripcion: "Participa en el torneo más grande de mascotas virtuales. ¡Gana premios exclusivos!",
          imagen: "https://i.pinimg.com/originals/ae/0a/a1/ae0aa14707e1b4bb35fe11b8f00a9956.gif",
          fecha: new Date(new Date().getFullYear(), 9, 25), // 25 de Octubre
          hora: "18:00",
          duracion: "2 horas",
          plataforma: "Discord",
          etiquetas: "Competitivo,Premios,Mascotas",
          organizador: "Equipo Pet-Chan",
          asistentes: 0,
          popular: true,
          es_especial: false
        },
        {
          titulo: "Concurso de Diseño de Mascotas",
          descripcion: "Diseña la mascota más creativa y gana reconocimiento en la comunidad.",
          imagen: "https://i.pinimg.com/originals/f0/ae/4d/f0ae4d94c7e930bc50632d4c7d79b59d.gif", 
          fecha: new Date(new Date().getFullYear(), 10, 15), // 15 de Noviembre
          hora: "16:00",
          duracion: "3 horas",
          plataforma: "Zoom",
          etiquetas: "Creatividad,Diseño,Reconocimiento",
          organizador: "Artistas Pet-Chan",
          asistentes: 0,
          popular: false,
          es_especial: false
        },
        {
          titulo: "Fiesta de Fin de Año",
          descripcion: "Celebra el fin de año con una gran fiesta virtual y sorpresas especiales.",
          imagen: "https://favim.com/pd/p/orig/2019/02/11/8bit-city-8-bit-Favim.com-6875655.gif",
          fecha: new Date(new Date().getFullYear(), 11, 30), // 30 de Diciembre
          hora: "22:00",
          duracion: "4 horas",
          plataforma: "Twitch",
          etiquetas: "Fiesta,Sorpresas,Celebración",
          organizador: "Comunidad Pet-Chan",
          asistentes: 0,
          popular: true,
          es_especial: true
        }
      ];
      
      // Insertar eventos de ejemplo
      for (const event of sampleEvents) {
        await db.query(`
          INSERT INTO eventos 
          (titulo, descripcion, imagen, fecha, hora, duracion, plataforma, etiquetas, organizador, asistentes, popular, es_especial) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          event.titulo,
          event.descripcion,
          event.imagen,
          event.fecha,
          event.hora,
          event.duracion,
          event.plataforma,
          event.etiquetas,
          event.organizador,
          event.asistentes,
          event.popular,
          event.es_especial
        ]);
      }
      
      console.log('Eventos de ejemplo añadidos a la base de datos');
    }
  } catch (error) {
    console.error('Error al inicializar tabla de eventos:', error);
  }
}


































































































































/*agregar esto xd*/
app.get("/intercambio", requireLogin, (req, res) => {

  res.render("intercambio-mascotas.ejs", {
    userId: req.session.userId,
    petId: req.session.mascotaActual.id
  });
});



// Ruta para crear nueva sala
app.post("/intercambio/crear-sala", requireLogin, (req, res) => {
  const { userId } = req.body;
  const petId = req.session.mascotaActual.id;
  const mascota = req.session.mascotaActual;
  
  // Generar código aleatorio de 6 caracteres
  const sala = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  res.render("sala-intercambio.ejs", {
      sala,
      userId,
      petId,
      esCreador: true,  // Para identificar al creador de la sala
      rutaImagen: mascota.rutaImagen,
  });
});

// Ruta para unirse a sala existente
app.post("/intercambio/unirse-sala", requireLogin, async (req, res) => {
  const { codigoSala, userId } = req.body;
  const petId = req.session.mascotaActual.id;
  const mascota = req.session.mascotaActual;

  // Verificar si la sala existe y tiene espacio
  if (salasDeIntercambio[codigoSala] && salasDeIntercambio[codigoSala].length < 2) {
      res.render("sala-intercambio.ejs", {
          sala: codigoSala,
          userId,
          petId,
          esCreador: false,
          rutaImagen: mascota.rutaImagen,
      });
  } else {
      res.status(400).send("Sala no encontrada o llena");
  }
});

app.post("/actualizar-mascota", requireLogin, async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).send("No autorizado");

  try {
      const petResult = await db.query('SELECT * FROM pets WHERE id_users = $1 LIMIT 1', [userId]);

      if (petResult.rows.length > 0) {
          const mascota = petResult.rows[0];
          const rutaImagen = `${rutaBase}${mascota.indice}.gif`;
          const especieDeMascota = especieMascotas[mascota.indice - 1];
          const pronombre = mascota.genero === "macho" ? "el" : "la";

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

          return res.send("ok");
      }

      res.status(404).send("Mascota no encontrada");

  } catch (err) {
      console.error("❌ Error al actualizar sesión:", err);
      res.status(500).send("Error interno");
  }
});



// Rutas para batallas
app.get("/batalla", requireLogin, (req, res) => {
  res.render("lobby-batallas.ejs", {
    userId: req.session.userId,
    petId: req.session.mascotaActual.id,
    mascota: req.session.mascotaActual
  });
});

// Modifica la ruta para manejar mejor la validación de mascota
app.get("/batalla/sala/:id", requireLogin, (req, res) => {
  const salaId = req.params.id;
  const sala = salasBatalla.get(salaId);
  
  // Verificar si la sala existe y está llena
  if (sala && sala.jugadores.length >= 2) {
    return res.redirect("/batalla?error=sala_llena");
  }
  
  // Verificar que el usuario tenga una mascota seleccionada
  if (!req.session.mascotaActual || !req.session.mascotaActual.id) {
    return res.redirect("/batalla?error=no_mascota");
  }
  
  res.render("sala-batalla.ejs", { 
    salaId,
    userId: req.session.userId,
    petId: req.session.mascotaActual.id,  // Aseguramos que se pase el petId
    mascota: req.session.mascotaActual
  });
});

// Actualizar la ruta para unirse a salas existentes para asegurar que petId está definido
app.post("/intercambio/unirse-sala", requireLogin, async (req, res) => {
  const { codigoSala, userId } = req.body;
  
  // Verificar que el usuario tenga una mascota seleccionada
  if (!req.session.mascotaActual || !req.session.mascotaActual.id) {
    return res.status(400).send("No tienes una mascota seleccionada");
  }
  
  const petId = req.session.mascotaActual.id;
  const mascota = req.session.mascotaActual;

  // Verificar si la sala existe y tiene espacio
  if (salasDeIntercambio[codigoSala] && salasDeIntercambio[codigoSala].length < 2) {
      res.render("sala-intercambio.ejs", {
          sala: codigoSala,
          userId,
          petId,  // Aseguramos que se pase el petId
          esCreador: false,
          rutaImagen: mascota.rutaImagen,
      });
  } else {
      res.status(400).send("Sala no encontrada o llena");
  }
});

// Ruta para crear una sala de batalla
app.post("/batalla/crear-sala", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const petId = req.session.mascotaActual?.id;
    
    // Verificar que el usuario tenga una mascota seleccionada
    if (!petId) {
      return res.status(400).json({ 
        error: "No tienes una mascota seleccionada",
        redirect: "/mascota"
      });
    }
    
    // Validar la propiedad de la mascota
    const esValido = await validarPropiedadMascota(userId, petId);
    if (!esValido) {
      return res.status(403).json({ 
        error: "No eres el dueño de esta mascota" 
      });
    }
    
    // Generar código aleatorio para la sala (6 caracteres alfanuméricos)
    const salaId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Crear la sala en la estructura de datos
    salasBatalla.set(salaId, { 
      jugadores: [],
      selecciones: {},
      estado: 'esperando',
      ronda: 1,
      turnos: 0,
      vida: {
        jugador1: 500,
        jugador2: 500
      },
      mascotas: {},
      creadoEn: new Date()
    });
    
    // Devolver el ID de la sala para redirigir al usuario
    res.json({ 
      success: true,
      salaId: salaId,
      redirect: `/batalla/sala/${salaId}`
    });
    
  } catch (error) {
    console.error("❌ Error al crear sala:", error);
    res.status(500).json({ 
      error: "Error al crear la sala de batalla" 
    });
  }
});

// Ruta para obtener salas de batalla disponibles
app.get("/batalla/salas-disponibles", requireLogin, (req, res) => {
  const salasDisponibles = [];
  
  // Convertir el Map de salas a un array de objetos con la información requerida
  salasBatalla.forEach((sala, salaId) => {
    // Solo incluir salas que estén en estado "esperando" y no estén llenas
    if (sala.estado === 'esperando' && sala.jugadores.length < 2) {
      salasDisponibles.push({
        id: salaId,
        jugadores: sala.jugadores.length,
        // Incluir información adicional útil 
        mascotaAnfitrion: sala.jugadores.length > 0 ? {
          nombre: sala.mascotas.jugador1?.petname || "Desconocido",
          especie: sala.mascotas.jugador1?.especie || "Desconocido",
          indice: sala.mascotas.jugador1?.indice || 1
        } : null
      });
    }
  });
  
  res.json(salasDisponibles);
});

//-------------------------------------------------rutas de pet-chat--------------------------------------------------------------------//
app.get('/petchat', requireLogin, (req, res) => {
  res.render('petchat');
});

app.get('/room/:id', requireLogin, (req, res) => {
  res.render('room', { roomId: req.params.id });
});


//funcion para validar la propiedad de la mascota
async function validarPropiedadMascota(userId, petId) {
  try {
      const result = await db.query(
          'SELECT id FROM pets WHERE id = $1 AND id_users = $2',
          [petId, userId]
      );
      return result.rows.length > 0;
  } catch (err) {
      console.error("Error validando propiedad:", err);
      return false;
  }
}


const salasDeIntercambio = {}; // sala => [{ userId, petId, socketId, confirmado }]

//variables principales para la batalla
// Estructuras para batallas
const salasBatalla = new Map(); 
import { typeEffectiveness } from './informacion/batallasInfor.js';

//variables para las camaras
const rooms = new Map(); // Para el seguimiento de usuarios en cámaras
const MAX_USERS_PER_ROOM = 10; // Límite para cámaras

/*---------------------------------funcion para calcular daño----------------------------------------------------*/
/**
 * Calcula el daño de un ataque basado en tipos y efectividad
 */
function calcularDanio(ataque, tipoAtacante, tipoDefensor) {
  // Si alguno de los tipos no existe, daño normal
  if (!typeEffectiveness[ataque.type] || !typeEffectiveness[tipoDefensor]) {
    return {
      danio: Math.floor(ataque.power * (0.85 + Math.random() * 0.3)),
      mensaje: "Ataque normal. (x1)"
    };
  }

  // Calcular multiplicador de efectividad
  let efectividad = 1;
  
  // Verificar si no tiene efecto
  if (typeEffectiveness[ataque.type].noEffectAgainst?.includes(tipoDefensor)) {

    efectividad = 0;
  } 
  // Verificar si es super efectivo
  else if (typeEffectiveness[ataque.type].strongAgainst.includes(tipoDefensor)) {
    efectividad = 2;
  } 
  // Verificar si es poco efectivo
  else if (typeEffectiveness[ataque.type].weakAgainst.includes(tipoDefensor)) {
    efectividad = 0.5;
  }

  // Variación aleatoria entre 85% y 115%
  const variacion = 0.85 + Math.random() * 0.3;
  const danioFinal = Math.floor(ataque.power * efectividad * variacion);

  // Mensajes según efectividad
  let mensajeEfectividad = '';
  if (efectividad === 0) {
    console.log('baja efectividad', efectividad);
    mensajeEfectividad = '¡No tuvo efecto! (x0)';
  } else if (efectividad === 0.5) {
    console.log('poca efectividad', efectividad);
    mensajeEfectividad = 'No es muy efectivo... (x0.5)';
  } else if (efectividad === 1) {
    console.log('media efectividad', efectividad);
    mensajeEfectividad = 'Ataque normal. (x1)';
  } else if (efectividad === 2) {
    console.log('alta efectividad', efectividad);
    mensajeEfectividad = '¡ES SUPER EFECTIVO! (x2)';
  }

  console.log('ataque', ataque, 'atacante', tipoAtacante, 'defensor', tipoDefensor);
  console.log('tipo atacante', typeEffectiveness[ataque.type], 'tipo defensor', typeEffectiveness[tipoDefensor]);
  console.log(`Efectividad: ${efectividad}, Variación: ${variacion}, Danio: ${danioFinal}`);

  return {
    danio: efectividad === 0 ? 0 : danioFinal, // Asegurar 0 de daño si no tiene efecto
    mensaje: mensajeEfectividad
  };
}

// En tu servidor Express (index.js)
app.post('/actualizar-sesion-batalla', async (req, res) => {
  if (!req.session.userId) return res.status(401).send();
  
  try {
    const user = await db.query('SELECT money FROM users WHERE id = $1', [req.session.userId]);
    const mascota = await db.query('SELECT * FROM pets WHERE id_users = $1', [req.session.userId]);
    
    if (user.rows[0] && mascota.rows[0]) {
      const evoluciono = req.session.mascotaActual?.indice !== mascota.rows[0].indice;
      
      req.session.money = user.rows[0].money;
      req.session.mascotaActual = {
        ...req.session.mascotaActual,
        indice: mascota.rows[0].indice,
        niveldeAmor: mascota.rows[0].nivelAmor,
        rutaImagen: `imagenes_de_mascotas/${mascota.rows[0].indice}.gif`
      };
      req.session.save();
      
      return res.json({
        status: "ok",
        evoluciono,
        nuevaImagen: req.session.mascotaActual.rutaImagen
      });
    }
    res.status(404).send();
  } catch (err) {
    console.error("Error al actualizar sesión:", err);
    res.status(500).send();
  }
});
/*
function obtenerTodosLosAtaques() {
  return [
    { name: "Llamarada", type: "fuego", power: 500 }, { name: "Infierno", type: "fuego", power: 500 },
    { name: "Hidrobomba", type: "agua", power: 500 }, { name: "Surf", type: "agua", power: 500 },
    { name: "Rayo Solar", type: "planta", power: 500 }, { name: "Latigazo", type: "planta", power: 500 },
    { name: "Trueno", type: "electrico", power: 500 }, { name: "Rayo", type: "electrico", power: 500 },
    { name: "Terremoto", type: "tierra", power: 500 }, { name: "Excavar", type: "tierra", power: 500 },
    { name: "Avalancha", type: "roca", power: 500 }, { name: "Ventisca", type: "hielo", power: 500 },
    { name: "Tijera X", type: "bicho", power: 500 }, { name: "Ataque Aéreo", type: "volador", power: 500 },
    { name: "Residuos", type: "veneno", power: 500 }, { name: "Psicorrayo", type: "psiquico", power: 500 },
    { name: "Patada Salto", type: "lucha", power: 500 }, { name: "Bola Sombra", type: "fantasma", power: 500 },
    { name: "Cabeza de Hierro", type: "acero", power: 500 }, { name: "Garra Dragón", type: "dragon", power: 500 },
    { name: "Viento Feérico", type: "hada", power: 500 }, { name: "Hiperrayo", type: "normal", power: 500 }
  ];
}
*/
function obtenerTodosLosAtaques() {
  return [
    { name: "Llamarada", type: "fuego", power: 60 }, { name: "Infierno", type: "fuego", power: 90 },
    { name: "Hidrobomba", type: "agua", power: 110 }, { name: "Surf", type: "agua", power: 75 },
    { name: "Rayo Solar", type: "planta", power: 90 }, { name: "Latigazo", type: "planta", power: 60 },
    { name: "Trueno", type: "electrico", power: 85 }, { name: "Rayo", type: "electrico", power: 65 },
    { name: "Terremoto", type: "tierra", power: 90 }, { name: "Excavar", type: "tierra", power: 70 },
    { name: "Avalancha", type: "roca", power: 80 }, { name: "Ventisca", type: "hielo", power: 85 },
    { name: "Tijera X", type: "bicho", power: 80 }, { name: "Ataque Aéreo", type: "volador", power: 75 },
    { name: "Residuos", type: "veneno", power: 65 }, { name: "Psicorrayo", type: "psiquico", power: 75 },
    { name: "Patada Salto", type: "lucha", power: 85 }, { name: "Bola Sombra", type: "fantasma", power: 80 },
    { name: "Cabeza de Hierro", type: "acero", power: 80 }, { name: "Garra Dragón", type: "dragon", power: 90 },
    { name: "Viento Feérico", type: "hada", power: 80 }, { name: "Hiperrayo", type: "normal", power: 100 }
  ];
}


//funciones necesarias para la evolucion de mascotas 
// En tu archivo principal (index.js o donde tengas configuraciones)
const EVOLUCIONES_NIVEL_60 = [1, 4, 7, 11, 13, 16, 18, 21, 23, 27, 29, 32, 35];  // Índices que pueden evolucionar al llegar a 60
const EVOLUCIONES_NIVEL_180 = [2, 5, 8, 14, 19, 24, 30, 33]; // Índices que pueden evolucionar al llegar a 180



async function actualizarNivelAmor(petId, userId, incrementoAmor, incrementoDinero) {
  try {
    await db.query('BEGIN');

    // 1. Obtener datos actuales de la mascota
    const mascotaActual = await db.query(
      'SELECT indice, "nivelAmor", "nivelEnergia" FROM pets WHERE id = $1',
      [petId]
    );

    if (mascotaActual.rows.length === 0) throw new Error('Mascota no encontrada');

    const indiceActual = mascotaActual.rows[0].indice;
    const nivelAmorActual = mascotaActual.rows[0].nivelAmor;
    const nivelEnergia = mascotaActual.rows[0].nivelEnergia;
    const nuevoNivelAmor = nivelAmorActual + incrementoAmor;

    // 2. Actualizar nivelAmor y dinero
    await db.query(
      'UPDATE pets SET "nivelAmor" = "nivelAmor" + $1 WHERE id = $2',
      [incrementoAmor, petId]
    );

    await db.query(
      'UPDATE users SET money = money + $1 WHERE id = $2',
      [incrementoDinero, userId]
    );

    // 3. Verificar evolución
    let nuevoIndice = indiceActual;
    
    // Caso especial para índice 24 al nivel 180
    if (nuevoNivelAmor >= 180 && indiceActual === 24) {
      nuevoIndice = (nivelEnergia > 50) ? 25 : 26;
      console.log(`Evolución especial para mascota ${petId}:
        Nivel Energía: ${nivelEnergia}
        Evolución a: ${nuevoIndice}`);
    }
    // Evoluciones normales
    else if (nuevoNivelAmor >= 60 && EVOLUCIONES_NIVEL_60.includes(indiceActual)) {
      nuevoIndice = indiceActual + 1;
      console.log(`Evolución nivel 60 para mascota ${petId}, nuevo índice: ${nuevoIndice}`);
    } 
    else if (nuevoNivelAmor >= 180 && EVOLUCIONES_NIVEL_180.includes(indiceActual)) {
      nuevoIndice = indiceActual + 1;
      console.log(`Evolución nivel 180 para mascota ${petId}, nuevo índice: ${nuevoIndice}`);
    }

    // 4. Aplicar evolución si es necesario
    if (nuevoIndice !== indiceActual) {
      await db.query(
        'UPDATE pets SET indice = $1 WHERE id = $2',
        [nuevoIndice, petId]
      );
    }

    await db.query('COMMIT');

    return {
      evoluciono: nuevoIndice !== indiceActual,
      nuevoIndice,
      nivelEnergia // Devuelve el nivel de energía para posibles usos adicionales
    };

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error en actualizarNivelAmor:', error);
    throw error;
  }
}

/*--------------------------------------------------------------------------------------------------------------------*/


io.on("connection", (socket) => {

  console.log(`🔌 Cliente conectado: ${socket.id}`);

  socket.on("connection_intercambio_pets", ({ sala, userId, petId }) => {
    if (!sala || !userId || !petId) return;

    socket.join(sala);
    if (!salasDeIntercambio[sala]) salasDeIntercambio[sala] = [];

    salasDeIntercambio[sala].push({ socketId: socket.id, userId, petId });

    if (salasDeIntercambio[sala].length === 1) {
      socket.emit("esperando_otro_usuario");
    } else if (salasDeIntercambio[sala].length === 2) {
      io.to(sala).emit("ambos_usuarios_conectados");
    } else {
      socket.leave(sala);
      socket.emit("error_sala_llena");
    }
  });

  socket.on("unirse_sala_intercambio_pets", async ({ sala, userId, petId }) => {
        // Validar propiedad inmediatamente
        const esValido = await validarPropiedadMascota(userId, petId);
        if (!esValido) {
            socket.emit("error_intercambio", "No tienes permiso para intercambiar esta mascota");
            return;
        }

        // Verificar si el usuario ya está en alguna sala
        for (const salaExistente in salasDeIntercambio) {
            if (salasDeIntercambio[salaExistente].some(u => u.userId === userId)) {
                socket.emit("error_usuario_en_otra_sala");
                return;
            }
        }

        // Si la sala no existe, solo permitir si el usuario es el primero
        if (!salasDeIntercambio[sala]) {
            salasDeIntercambio[sala] = [];
        }

        // Verificar si la sala está llena
        if (salasDeIntercambio[sala].length >= 2) {
            socket.emit("sala_llena_intercambio");
            return;
        }

        socket.join(sala);
        salasDeIntercambio[sala].push({
            socketId: socket.id,
            userId,
            petId,
            confirmado: false
        });

        // Notificar a los usuarios en la sala
        io.to(sala).emit("usuarios_sala_intercambio", {
            usuarios: salasDeIntercambio[sala].map(p => p.userId),
            codigoSala: sala
        });

        // Si hay 2 usuarios, notificar
        if (salasDeIntercambio[sala].length === 2) {
            io.to(sala).emit("ambos_usuarios_conectados");
        }

        // Cuando hay 2 usuarios, enviar la info completa de ambas mascotas
        if (salasDeIntercambio[sala]?.length === 2) {
          const [usuario1, usuario2] = salasDeIntercambio[sala];
          
          // Obtener info completa de ambas mascotas
          const mascota1 = await obtenerInfoMascota(usuario1.petId);
          const mascota2 = await obtenerInfoMascota(usuario2.petId);
          
          // Enviar a cada usuario la info de la mascota del otro
          io.to(usuario1.socketId).emit("info_mascota_oponente", {
              ...mascota2,
              rutaImagen: `imagenes_de_mascotas/${mascota2.indice}.gif`
          });
          
          io.to(usuario2.socketId).emit("info_mascota_oponente", {
              ...mascota1,
              rutaImagen: `imagenes_de_mascotas/${mascota1.indice}.gif`
          });
      }
    });

    socket.on("confirmar_intercambio_pets", async ({ sala }) => {
      if (!salasDeIntercambio[sala] || salasDeIntercambio[sala].length !== 2) {
          return socket.emit("error_intercambio", "Sala inválida");
      }

      const usuario = salasDeIntercambio[sala].find(p => p.socketId === socket.id);
      if (!usuario) return;

      // Validar que la mascota pertenece al usuario
      const esPropietario = await validarPropiedadMascota(usuario.userId, usuario.petId);
      if (!esPropietario) {
          return socket.emit("error_intercambio", "No eres dueño de esta mascota");
      }

      usuario.confirmado = true;
      const [p1, p2] = salasDeIntercambio[sala];

      if (p1.confirmado && p2.confirmado) {
          try {
              // Validar nuevamente ANTES del intercambio
              const validaciones = await Promise.all([
                  validarPropiedadMascota(p1.userId, p1.petId),
                  validarPropiedadMascota(p2.userId, p2.petId)
              ]);

              if (!validaciones.every(v => v)) {
                  throw new Error("Validación de propiedad falló");
              }

              /*cambio de mascota*/
              await db.query("BEGIN");
              await db.query(`UPDATE pets SET id_users = $1 WHERE id = $2`, [p2.userId, p1.petId]);
              await db.query(`UPDATE pets SET id_users = $1 WHERE id = $2`, [p1.userId, p2.petId]);
              await db.query("COMMIT");

              io.to(sala).emit("intercambio_realizado");
          } catch (err) {
              await db.query("ROLLBACK");
              console.error("❌ Error en intercambio:", err);
              io.to(sala).emit("error_intercambio", "Error en el intercambio");
          } finally {
              delete salasDeIntercambio[sala];
          }
      }
    });

    



    /*----------------------------------------------------------------------------------------------------------------------------*/


    socket.on('unirse-sala-batalla', async ({ salaId, userId, petId }) => {
      try {
        const esValido = await validarPropiedadMascota(userId, petId);
        if (!esValido) throw new Error('MASCOTA_NO_VALIDA');
    
        if (!salasBatalla.has(salaId)) {
          const mascota = await obtenerInfoMascota(petId);
          salasBatalla.set(salaId, {
            jugadores: [],
            selecciones: {},
            ataques: { jugador1: [], jugador2: [] },
            estado: 'esperando',
            ronda: 1,
            turnoActual: null,
            vida: { jugador1: 500, jugador2: 500 },
            mascotas: {}
          });
        }
    
        const sala = salasBatalla.get(salaId);
        if (sala.jugadores.length >= 2) throw new Error('SALA_LLENA');
    
        socket.join(salaId);
        const mascota = await obtenerInfoMascota(petId);
        const rol = sala.jugadores.length === 0 ? 'jugador1' : 'jugador2';
    
        sala.jugadores.push({ socketId: socket.id, userId, petId, rol });
        sala.mascotas[rol] = { ...mascota, rutaImagen: `imagenes_de_mascotas/${mascota.indice}.gif` };
        socket.emit('asignar-rol', { rol });
    
        io.to(salaId).emit('jugadores-actualizados', {
          jugadores: sala.jugadores.map(j => j.userId),
          estado: sala.estado,
          mascotas: sala.mascotas
        });
    
        if (sala.jugadores.length === 2) {
          const tipos = Object.keys(typeEffectiveness);
          sala.tiposDisponibles = {
            jugador1: tipos.sort(() => 0.5 - Math.random()).slice(0, 3),
            jugador2: tipos.sort(() => 0.5 - Math.random()).slice(0, 3)
          };
          sala.estado = 'seleccion_tipo';
          io.to(salaId).emit('iniciar-juego', {
            tiposDisponibles: sala.tiposDisponibles,
            ronda: sala.ronda,
            mascotas: sala.mascotas
          });
        }
    
      } catch (error) {
        socket.emit('error-sala', { mensaje: error.message });
      }
    });
    
    socket.on('seleccionar-tipo-batalla', ({ salaId, tipo }) => {
      const sala = salasBatalla.get(salaId);
      if (!sala) return;
      const jugador = sala.jugadores.find(j => j.socketId === socket.id);
      if (!jugador || !typeEffectiveness[tipo]) return;

      
      
      try {
        
      
    
      sala.selecciones[jugador.rol] = tipo;
      io.to(salaId).emit('tipo-seleccionado', {
        jugador: jugador.rol,
        tipo,
        color: typeEffectiveness[tipo].color
      });
    
      if (Object.keys(sala.selecciones).length === 2) {
        sala.estado = 'en_batalla';
        sala.turnoActual = 'jugador1';
        const allAttacks = obtenerTodosLosAtaques();
        sala.ataques = {
          jugador1: allAttacks.sort(() => 0.5 - Math.random()).slice(0, 4),
          jugador2: allAttacks.sort(() => 0.5 - Math.random()).slice(0, 4)
        };
        io.to(salaId).emit('ronda-iniciada', {
          turno: sala.turnoActual,
          ronda: sala.ronda,
          ataques: sala.ataques,
          vida: sala.vida
        });
      }
    } catch (error) {
      socket.emit('error-sala', { mensaje: error.message });
      return;
    }
    });
    
    socket.on('realizar-ataque', async ({ salaId, ataque }) => {
      const sala = salasBatalla.get(salaId);
      if (!sala) return;

      try {

      const jugador = sala.jugadores.find(j => j.socketId === socket.id);
      const oponente = sala.jugadores.find(j => j.rol !== jugador.rol);
      if (sala.turnoActual !== jugador.rol) return;
    
      const resultado = calcularDanio(
        ataque,
        sala.selecciones[jugador.rol],
        sala.selecciones[oponente.rol]
      );
    
      sala.vida[oponente.rol] = Math.max(0, sala.vida[oponente.rol] - resultado.danio);
      sala.historial = sala.historial || [];
      sala.historial.push({ atacante: jugador.rol, oponente: oponente.rol, ataque, ...resultado, ronda: sala.ronda });
    
      io.to(salaId).emit('ataque-procesado', {
        atacante: jugador.rol,
        oponente: oponente.rol,
        ataque,
        danio: resultado.danio,
        mensajeEfectividad: resultado.mensaje,
        vida: sala.vida,
        turno: oponente.rol
      });
    
      // Verificar si la batalla ha terminado
      if (sala.vida.jugador1 <= 0 || sala.vida.jugador2 <= 0) {
        const ganador = sala.vida.jugador1 <= 0 ? 'jugador2' : 'jugador1';
    
        try {
          const jugador1 = sala.jugadores.find(j => j.rol === 'jugador1');
          const jugador2 = sala.jugadores.find(j => j.rol === 'jugador2');
    
          if (ganador === 'jugador1') {
            // Jugador 1 gana (+5 amor, +20 dinero), Jugador 2 pierde (+1 amor, +4 dinero)
            await actualizarNivelAmor(jugador1.petId, jugador1.userId, 5, 20, jugador1.req);
            await actualizarNivelAmor(jugador2.petId, jugador2.userId, 1, 4, jugador2.req);
          } else {
            // Jugador 2 gana (+5 amor, +20 dinero), Jugador 1 pierde (+1 amor, +4 dinero)
            await actualizarNivelAmor(jugador2.petId, jugador2.userId, 5, 20, jugador2.req);
            await actualizarNivelAmor(jugador1.petId, jugador1.userId, 1, 4, jugador1.req);
          }
    
          io.to(salaId).emit('batalla-terminada', { 
            ganador,
            incrementos: {
              jugador1: {
                amor: ganador === 'jugador1' ? 5 : 1,
                dinero: ganador === 'jugador1' ? 20 : 4
              },
              jugador2: {
                amor: ganador === 'jugador2' ? 5 : 1,
                dinero: ganador === 'jugador2' ? 20 : 4
              }
            }
          });
    
        } catch (error) {
          console.error('Error al actualizar:', error);
          io.to(salaId).emit('error-batalla', { 
            mensaje: 'Error al actualizar recompensas' 
          });
        } finally {
          salasBatalla.delete(salaId);
        }
      } else {
        sala.turnoActual = oponente.rol;
        io.to(salaId).emit('cambio-turno', {
          turno: sala.turnoActual,
          vida: sala.vida
        });
      }

    } catch (error) {
      socket.emit('error-sala', { mensaje: error.message });
      return;
    }
  
    });

    // Modifica el manejador de 'batalla-terminada'
    socket.on('batalla-terminada', async ({ ganador }) => {
      const sala = salasBatalla.get(salaId);
      if (!sala) return;

      try {
        // Obtener los IDs de las mascotas de ambos jugadores
        const jugador1PetId = sala.jugadores.find(j => j.rol === 'jugador1').petId;
        const jugador2PetId = sala.jugadores.find(j => j.rol === 'jugador2').petId;

        // Actualizar niveles de amor
        if (ganador === 'jugador1') {
          await actualizarNivelAmor(jugador1PetId, 5); // Ganador +5
          await actualizarNivelAmor(jugador2PetId, 1); // Perdedor +1
        } else {
          await actualizarNivelAmor(jugador2PetId, 5); // Ganador +5
          await actualizarNivelAmor(jugador1PetId, 1); // Perdedor +1
        }

        // Emitir evento con los resultados
        io.to(salaId).emit('batalla-terminada', { 
          ganador,
          incrementos: {
            jugador1: ganador === 'jugador1' ? 5 : 1,
            jugador2: ganador === 'jugador2' ? 5 : 1
          }
        });

      } catch (error) {
        console.error('Error al actualizar niveles de amor:', error);
        io.to(salaId).emit('error-batalla', { 
          mensaje: 'Error al actualizar niveles de amor' 
        });
      } finally {
        salasBatalla.delete(salaId);
      }
      
    });

    
    
    socket.on('rendirse', ({ salaId }) => {
      const sala = salasBatalla.get(salaId);
      if (!sala) return;
    
      const jugador = sala.jugadores.find(j => j.socketId === socket.id);
      if (!jugador) return;
    
      const ganador = jugador.rol === 'jugador1' ? 'jugador2' : 'jugador1';
      io.to(salaId).emit('batalla-terminada', {
        ganador,
        motivo: 'rendicion',
        vida: sala.vida,
        historial: sala.historial || []
      });
    
      salasBatalla.delete(salaId);
    });
    
    socket.on('abandonar-batalla', ({ salaId }) => {
      const sala = salasBatalla.get(salaId);
      if (!sala) return;
    
      const jugador = sala.jugadores.find(j => j.socketId === socket.id);
      const oponente = sala.jugadores.find(j => j.socketId !== socket.id);
    
      if (oponente) io.to(oponente.socketId).emit('oponente-abandono');
    
      salasBatalla.delete(salaId);
      socket.leave(salaId);
    });

    socket.on('solicitar-nueva-ronda', ({ salaId }, callback) => {
      const sala = salasBatalla.get(salaId);
      if (!sala) {
        return callback({ success: false, error: 'Sala no existe' });
      }
    
      // Reinicia selecciones y genera nuevos tipos/ataques
      sala.selecciones = {};
      sala.estado = 'seleccion_tipo'; // Forzar estado correcto
      sala.ronda += 1;
    
      const tipos = Object.keys(typeEffectiveness);
      sala.tiposDisponibles = {
        jugador1: tipos.sort(() => 0.5 - Math.random()).slice(0, 3),
        jugador2: tipos.sort(() => 0.5 - Math.random()).slice(0, 3)
      };
    
      const allAttacks = obtenerTodosLosAtaques();
      sala.ataques = {
        jugador1: allAttacks.sort(() => 0.5 - Math.random()).slice(0, 4),
        jugador2: allAttacks.sort(() => 0.5 - Math.random()).slice(0, 4)
      };
    
      // Respuesta exitosa con datos actualizados
      callback({
        success: true,
        tipos: sala.tiposDisponibles,  // Envía ambos jugadores
        ataques: sala.ataques,
        ronda: sala.ronda
      });
    });
  
   /*--------------------------------------------rutas de pet-chat-----------------------------------------------------------*/


    let currentRoomId = null;
    let currentUserId = null;

    socket.on('join-room', (roomId, userId) => {
        // Guardar información para uso posterior
        currentRoomId = roomId;
        currentUserId = userId;
        
        socket.join(roomId);
        
        // Inicializar la sala si no existe
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
        }
        
        const room = rooms.get(roomId);
        
        // Verificar si la sala está llena
        if (room.size >= MAX_USERS_PER_ROOM) {
            socket.emit('room-full');
            return;
        }
        
        // Almacenar información del usuario
        room.set(userId, {
            id: userId,
            x: 5000, // Posición inicial x
            y: 5000, // Posición inicial y
            socketId: socket.id
        });
        
        // Enviar lista de usuarios ya conectados al nuevo usuario
        const usersInRoom = Array.from(room.values());
        socket.emit('current-users', usersInRoom);
        
        // Notificar a los demás sobre el nuevo usuario
        socket.to(roomId).emit('user-connected', userId);
        
        console.log(`Usuario ${userId} se unió a la sala ${roomId}. Total en sala: ${room.size}`);
    });
    
    // Manejar movimiento del usuario
    socket.on('move', (data) => {
        if (!currentRoomId || !currentUserId) return;
        
        const room = rooms.get(currentRoomId);
        if (!room) return;
        
        const user = room.get(currentUserId);
        if (user) {
            user.x = data.x;
            user.y = data.y;
            socket.to(currentRoomId).emit('user-moved', { 
                userId: currentUserId, 
                x: data.x, 
                y: data.y 
            });
        }
    });
    
    // Señalización WebRTC
    socket.on('webrtc-offer', ({ to, offer }) => {
        if (!currentRoomId || !currentUserId) return;
        
        const room = rooms.get(currentRoomId);
        if (!room) return;
        
        const targetUser = Array.from(room.values()).find(user => user.id === to);
        if (targetUser) {
            console.log(`Reenviando oferta de ${currentUserId} a ${to}`);
            io.to(targetUser.socketId).emit('webrtc-offer', {
                from: currentUserId,
                offer
            });
        } else {
            console.log(`Usuario ${to} no encontrado en la sala ${currentRoomId}`);
        }
    });
    
    socket.on('webrtc-answer', ({ to, answer }) => {
        if (!currentRoomId || !currentUserId) return;
        
        const room = rooms.get(currentRoomId);
        if (!room) return;
        
        const targetUser = Array.from(room.values()).find(user => user.id === to);
        if (targetUser) {
            console.log(`Reenviando respuesta de ${currentUserId} a ${to}`);
            io.to(targetUser.socketId).emit('webrtc-answer', {
                from: currentUserId,
                answer
            });
        } else {
            console.log(`Usuario ${to} no encontrado en la sala ${currentRoomId}`);
        }
    });
    
    socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
        if (!currentRoomId || !currentUserId) return;
        
        const room = rooms.get(currentRoomId);
        if (!room) return;
        
        const targetUser = Array.from(room.values()).find(user => user.id === to);
        if (targetUser) {
            io.to(targetUser.socketId).emit('webrtc-ice-candidate', {
                from: currentUserId,
                candidate
            });
        }
    });
    
    // Nuevo evento para solicitar conexión
    socket.on('request-connection', ({ to }) => {
        if (!currentRoomId || !currentUserId) return;
        
        const room = rooms.get(currentRoomId);
        if (!room) return;
        
        const targetUser = Array.from(room.values()).find(user => user.id === to);
        if (targetUser) {
            console.log(`${currentUserId} solicita conexión a ${to}`);
            io.to(targetUser.socketId).emit('request-connection', {
                from: currentUserId
            });
        }
    });

  /*----------------------------------------------------------------------------------------------------------------------------*/





      // Manejo de desconexión para ambos sistemas
  socket.on("disconnect", () => {
    // Limpiar de intercambios
    for (const sala in salasDeIntercambio) {
      const index = salasDeIntercambio[sala].findIndex(p => p.socketId === socket.id);
      if (index !== -1) {
        salasDeIntercambio[sala].splice(index, 1);
        io.to(sala).emit("usuarios_sala_intercambio", salasDeIntercambio[sala].map(p => p.userId));
      }
    }
    
    // Limpiar de batallas
    salasBatalla.forEach((sala, salaId) => {
      sala.jugadores = sala.jugadores.filter(j => j.socketId !== socket.id);
      if (sala.jugadores.length === 0) {
        setTimeout(() => {
          if (salasBatalla.get(salaId)?.jugadores.length === 0) {
            salasBatalla.delete(salaId);
          }
        }, 30000);
      } else {
        io.to(salaId).emit('jugador-desconectado', { socketId: socket.id });
      }
    });

    // Limpiar de cámaras (nuevo)
    if (currentRoomId && currentUserId) {
      const room = rooms.get(currentRoomId);
      if (room && room.has(currentUserId)) {
          room.delete(currentUserId);
          socket.to(currentRoomId).emit('user-disconnected', currentUserId);
          
          if (room.size === 0) {
              rooms.delete(currentRoomId);
          }
      }
  }
  });

});


// Función auxiliar para obtener info completa de la mascota
async function obtenerInfoMascota(petId) {
  const result = await db.query(
      `SELECT p.*, u.username as dueno 
       FROM pets p 
       JOIN users u ON p.id_users = u.id 
       WHERE p.id = $1`,
      [petId]
  );
  return result.rows[0];
}

httpServer.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor corriendo en http://192.168.0.21:${process.env.PORT || 3000}`);
});

