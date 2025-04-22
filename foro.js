import express from 'express';
import { urlencoded } from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 4000;

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

// Ruta para obtener el estado de votos del usuario actual
app.get('/mis-votos', (req, res) => {
  try {
    // Obtener el ID del usuario desde la sesión
    const userId = req.session.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }
    
    // Para una aplicación real, esto vendría de la base de datos
    // Aquí obtenemos los votos del usuario para mensajes y comentarios
    
    // 1. Obtener votos de mensajes
    db.query(
      'SELECT mensaje_id, valor FROM mensajes_votos WHERE user_id = ?',
      [userId]
    )
    .then(mensajesVotos => {
      // Formatear los votos de mensajes como un objeto {mensajeId: valor}
      const votosFormateados = {};
      mensajesVotos.forEach(voto => {
        votosFormateados[voto.mensaje_id] = voto.valor;
      });
      
      // 2. Obtener votos de comentarios
      return db.query(
        'SELECT comentario_id, valor FROM comentarios_votos WHERE user_id = ?',
        [userId]
      )
      .then(comentariosVotos => {
        // Formatear los votos de comentarios como un objeto {comentarioId: valor}
        const votosComentariosFormateados = {};
        comentariosVotos.forEach(voto => {
          votosComentariosFormateados[voto.comentario_id] = voto.valor;
        });
        
        // Devolver ambos conjuntos de votos
        return res.json({
          success: true,
          votos: votosFormateados,
          votosComentarios: votosComentariosFormateados
        });
      });
    })
    .catch(error => {
      console.error('Error al obtener votos:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener votos: ' + error.message
      });
    });
  } catch (error) {
    console.error('Error en ruta /mis-votos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error del servidor: ' + error.message
    });
  }
});

app.post('/votar/:id', async (req, res) => {
  try {
    const mensajeId = parseInt(req.params.id);
    const { valor } = req.body;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }
    
    // Verificar que el mensaje existe
    const mensajeResult = await db.query(`
      SELECT * FROM forum_posts WHERE id = $1
    `, [mensajeId]);
    
    if (mensajeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }
    
    // Obtener el voto actual del usuario
    const votoActualQuery = await db.query(`
      SELECT valor FROM post_votes 
      WHERE post_id = $1 AND user_id = $2
    `, [mensajeId, userId]);
    
    const votoActual = votoActualQuery.rows.length > 0 ? votoActualQuery.rows[0].valor : 0;
    
    // Determinar el valor final del voto
    let valorFinal = valor;
    if (votoActual === valor) {
      valorFinal = 0; // Cancelamos el voto
    }
    
    // Actualizar o eliminar el voto en la base de datos
    if (valorFinal === 0 && votoActual !== 0) {
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
    } else if (valorFinal !== 0) {
      if (votoActual !== 0) {
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
        // Insertar nuevo voto
        await db.query(`
          INSERT INTO post_votes (post_id, user_id, valor) 
          VALUES ($1, $2, $3)
        `, [mensajeId, userId, valorFinal]);
        
        // Actualizar ranking en la base de datos
        await db.query(`
          UPDATE forum_posts 
          SET ranking = ranking + $1 
          WHERE id = $2
        `, [valorFinal, mensajeId]);
      }
    }
    
    // Obtener el nuevo ranking directamente de la base de datos
    // para garantizar consistencia
    const nuevoRankingQuery = await db.query(`
      SELECT ranking FROM forum_posts WHERE id = $1
    `, [mensajeId]);
    
    const nuevoRanking = nuevoRankingQuery.rows[0].ranking;
    
    // Devolver el nuevo ranking y el valor del voto del usuario
    return res.json({ 
      success: true, 
      nuevoRanking: nuevoRanking,
      valorVoto: valorFinal
    });
  } catch (error) {
    console.error('Error al votar mensaje:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error del servidor al procesar el voto: ' + error.message 
    });
  }
});

// Mejorada ruta de backend para votar comentarios
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
    
    // Verificar que el comentario existe
    const comentarioResult = await db.query(`
      SELECT * FROM forum_comments WHERE id = $1
    `, [comentarioIdNum]);
    
    if (comentarioResult.rows.length === 0) {
      return res.json({ 
        success: false, 
        mensaje: 'Comentario no encontrado' 
      });
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
    if (valorFinal === 0 && votoActual !== 0) {
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
    } else if (valorFinal !== 0) {
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
    
    // Consultar el ranking actualizado directamente de la base de datos
    const rankingQuery = await db.query(`
      SELECT ranking FROM forum_comments WHERE id = $1
    `, [comentarioIdNum]);
    
    const nuevoRanking = rankingQuery.rows[0].ranking;
    
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

// Ruta para publicar comentario
app.post('/publicar-comentario', upload.array('imagenes', 4), (req, res) => {
  try {
    const { autor, comentario, mensaje_padre_id } = req.body;
    
    if (autor && comentario && mensaje_padre_id) {
      const id = comentarioNextId++;
      const nuevoComentario = {
        id,
        autor,
        comentario,
        fecha: new Date(),
        fechaStr: new Date().toLocaleString(),
        imagenes: [],
        ranking: 0,  // Inicializar ranking explícitamente
        votoActual: 0  // Inicializar voto actual explícitamente
      };
      
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          nuevoComentario.imagenes.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            url: `/uploads/${file.filename}`
          });
        });
      }
      
      const mensajeIndex = mensajes.findIndex(m => m.id === parseInt(mensaje_padre_id));
      
      if (mensajeIndex === -1) {
        return res.status(404).json({ success: false, error: 'Mensaje padre no encontrado' });
      }
      
      if (!mensajes[mensajeIndex].comentarios) {
        mensajes[mensajeIndex].comentarios = [];
      }
      
      // Push to the end of the array to maintain chronological order
      mensajes[mensajeIndex].comentarios.push(nuevoComentario);
      
      // Return JSON response instead of redirecting
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





// Update the delete message route to include database operations and author check
app.delete('/eliminar-mensaje/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
  }
  
  try {
    // Check if message exists and belongs to the current user
    const messageResult = await db.query(`
      SELECT * FROM forum_posts WHERE id = $1
    `, [id]);
    
    if (messageResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }
    
    const message = messageResult.rows[0];
    
    // Authorization check - only allow users to delete their own messages
    if (message.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para eliminar este mensaje' });
    }
    
    // Get image filenames to delete from filesystem
    const imageResult = await db.query(`
      SELECT filename FROM post_images WHERE post_id = $1
    `, [id]);
    
    // Delete images from filesystem
    for (const img of imageResult.rows) {
      const imagePath = join(uploadDir, img.filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Begin transaction for cascading delete
    await db.query('BEGIN');
    
    // Delete all comment images
    await db.query(`
      DELETE FROM comment_images 
      WHERE comment_id IN (SELECT id FROM forum_comments WHERE post_id = $1)
    `, [id]);
    
    // Delete comment votes
    await db.query(`
      DELETE FROM comment_votes 
      WHERE comment_id IN (SELECT id FROM forum_comments WHERE post_id = $1)
    `, [id]);
    
    // Delete comments
    await db.query(`
      DELETE FROM forum_comments WHERE post_id = $1
    `, [id]);
    
    // Delete post images
    await db.query(`
      DELETE FROM post_images WHERE post_id = $1
    `, [id]);
    
    // Delete post votes
    await db.query(`
      DELETE FROM post_votes WHERE post_id = $1
    `, [id]);
    
    // Finally delete the post itself
    await db.query(`
      DELETE FROM forum_posts WHERE id = $1
    `, [id]);
    
    // Commit transaction
    await db.query('COMMIT');
    
    // Update in-memory data
    mensajes = mensajes.filter(m => m.id !== id);
    delete votos[id];
    
    return res.json({ 
      success: true,
      totalMensajes: mensajes.length
    });
  } catch (error) {
    // Rollback in case of error
    await db.query('ROLLBACK');
    console.error('Error al eliminar mensaje:', error);
    return res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});

// Versión modificada de la ruta para eliminar comentarios
app.delete('/eliminar-comentario/:mensajeId/:comentarioId', async (req, res) => {
  try {
    const mensajeId = parseInt(req.params.mensajeId);
    const comentarioId = parseInt(req.params.comentarioId);
    
    // Eliminamos la verificación de userId para permitir la eliminación sin autenticación
    // const userId = req.session.userId;
    // 
    // if (!userId) {
    //   return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    // }
    
    // Check if comment exists
    const commentResult = await db.query(`
      SELECT * FROM forum_comments WHERE id = $1 AND post_id = $2
    `, [comentarioId, mensajeId]);
    
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }
    
    const comment = commentResult.rows[0];
    
    // Eliminamos la verificación de autor del comentario
    // if (comment.user_id !== userId) {
    //   return res.status(403).json({ success: false, error: 'No tienes permiso para eliminar este comentario' });
    // }
    
    // Get image filenames to delete from filesystem
    const imageResult = await db.query(`
      SELECT filename FROM comment_images WHERE comment_id = $1
    `, [comentarioId]);
    
    // Delete images from filesystem
    for (const img of imageResult.rows) {
      const imagePath = join(uploadDir, img.filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Begin transaction
    await db.query('BEGIN');
    
    // Delete comment votes
    await db.query(`
      DELETE FROM comment_votes WHERE comment_id = $1
    `, [comentarioId]);
    
    // Delete comment images
    await db.query(`
      DELETE FROM comment_images WHERE comment_id = $1
    `, [comentarioId]);
    
    // Delete the comment
    await db.query(`
      DELETE FROM forum_comments WHERE id = $1
    `, [comentarioId]);
    
    // Commit transaction
    await db.query('COMMIT');
    
    // Update in-memory data
    const mensaje = mensajes.find(m => m.id === mensajeId);
    if (mensaje && mensaje.comentarios) {
      mensaje.comentarios = mensaje.comentarios.filter(c => c.id !== comentarioId);
    }
    
    return res.json({ 
      success: true,
      totalComentarios: mensaje?.comentarios?.length || 0
    });
  } catch (error) {
    // Rollback in case of error
    await db.query('ROLLBACK');
    console.error('Error al eliminar comentario:', error);
    return res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
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
app.put('/actualizar-comentario/:mensajeId/:comentarioId', upload.array('imagenes', 4), (req, res) => {
  try {
    const mensajeId = parseInt(req.params.mensajeId);
    const comentarioId = parseInt(req.params.comentarioId);
    const { autor, comentario, mantener_imagenes } = req.body;
    
    // Validar datos básicos
    if (!autor || !comentario) {
      return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }
    
    // Buscar el mensaje
    const mensajeIndex = mensajes.findIndex(m => m.id === mensajeId);
    
    if (mensajeIndex === -1 || !mensajes[mensajeIndex].comentarios) {
      return res.status(404).json({ success: false, error: 'Mensaje o comentarios no encontrados' });
    }
    
    // Buscar el comentario
    const comentarioIndex = mensajes[mensajeIndex].comentarios.findIndex(c => c.id === comentarioId);
    
    if (comentarioIndex === -1) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }
    
    // Actualizar datos básicos
    mensajes[mensajeIndex].comentarios[comentarioIndex].autor = autor;
    mensajes[mensajeIndex].comentarios[comentarioIndex].comentario = comentario;
    mensajes[mensajeIndex].comentarios[comentarioIndex].fechaStr = new Date().toLocaleString() + ' (editado)';
    
    // Gestionar imágenes
    const imagenesAntiguas = [...mensajes[mensajeIndex].comentarios[comentarioIndex].imagenes];
    
    if (mantener_imagenes) {
      const mantenerArray = Array.isArray(mantener_imagenes) ? mantener_imagenes : [mantener_imagenes];
      const idsAMantener = mantenerArray.map(id => parseInt(id));
      
      imagenesAntiguas.forEach(imagen => {
        if (!idsAMantener.includes(imagen.id)) {
          const filename = imagen.url.split('/').pop();
          const imagePath = join(uploadDir, filename);
          
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      });
      
      mensajes[mensajeIndex].comentarios[comentarioIndex].imagenes = imagenesAntiguas.filter(imagen => 
        idsAMantener.includes(imagen.id)
      );
    } else {
      imagenesAntiguas.forEach(imagen => {
        const filename = imagen.url.split('/').pop();
        const imagePath = join(uploadDir, filename);
        
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
      
      mensajes[mensajeIndex].comentarios[comentarioIndex].imagenes = [];
    }
    
    // Añadir nuevas imágenes si hay
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        mensajes[mensajeIndex].comentarios[comentarioIndex].imagenes.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          url: `/uploads/${file.filename}`
        });
      });
    }
    
    res.json({ 
      success: true, 
      comentario: mensajes[mensajeIndex].comentarios[comentarioIndex] 
    });
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
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

app.get('/', (req, res) => {
  res.render('foro', { 
    mensajes,
    etiquetasDisponibles,
    subetiquetasDisponibles: Object.values(subetiquetasDisponibles).flat(),
    subcategorias: etiquetasDisponibles,
    extrasubcategorias: etiquetasDisponibles,
    extrasubetiquetasDisponibles,
    rutaImagen:null,
    accesorios:null,
  });
});

// Ruta para publicar mensaje (eliminar la duplicada)
app.post('/publicar', upload.array('imagenes', 9), (req, res) => {
  try {
    const { autor, mensaje, etiqueta, subcategoria, extrasubcategoria } = req.body;
    
    if (autor && mensaje) {
      const id = nextId++;
      const nuevoMensaje = {
        id,
        autor,
        mensaje,
        etiqueta: etiqueta || "Ninguna", // Default to "Ninguna" if not provided
        subcategoria: subcategoria || "Ninguna", // Default to "Ninguna" if not provided
        extrasubcategoria: extrasubcategoria || "Ninguna", // Default to "Ninguna" if not provided
        fecha: new Date(),
        fechaStr: new Date().toLocaleString(),
        ranking: 0,
        imagenes: [],
        comentarios: []
      };
      
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          nuevoMensaje.imagenes.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            url: `/uploads/${file.filename}`
          });
        });
      }
      
      votos[id] = {};
      mensajes.push(nuevoMensaje);
      res.redirect('/');
    } else {
      res.status(400).json({ success: false, error: 'Datos incompletos' });
    }
  } catch (error) {
    console.error('Error al publicar:', error);
    res.status(500).send('Error al publicar el mensaje');
  }
});

// Ruta para actualizar mensaje
app.put('/actualizar/:id', upload.array('imagenes', 9), (req, res) => {
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
    
    // Actualizar datos básicos del mensaje
    mensajes[index].autor = autor;
    mensajes[index].mensaje = mensaje;
    mensajes[index].fechaStr = new Date().toLocaleString() + ' (editado)';
    
    // Actualizar etiqueta con valor por defecto "Ninguna"
    if (etiqueta !== undefined) {
      mensajes[index].etiqueta = etiqueta || "Ninguna";
    }
    
    // Actualizar subcategoria con valor por defecto "Ninguna"
    if (subcategoria !== undefined) {
      mensajes[index].subcategoria = subcategoria || "Ninguna";
    }
    
    // Actualizar extrasubcategoria con valor por defecto "Ninguna"
    if (extrasubcategoria !== undefined) {
      mensajes[index].extrasubcategoria = extrasubcategoria || "Ninguna";
    }

    // Resto del código de manejo de imágenes (sin cambios)
    const imagenesAntiguas = [...mensajes[index].imagenes];
    
    if (mantener_imagenes) {
      const mantenerArray = Array.isArray(mantener_imagenes) ? mantener_imagenes : [mantener_imagenes];
      const idsAMantener = mantenerArray.map(id => parseInt(id));
      
      imagenesAntiguas.forEach(imagen => {
        if (!idsAMantener.includes(imagen.id)) {
          const filename = imagen.url.split('/').pop();
          const imagePath = join(uploadDir, filename);
          
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      });
      
      mensajes[index].imagenes = imagenesAntiguas.filter(imagen => 
        idsAMantener.includes(imagen.id)
      );
    } else {
      imagenesAntiguas.forEach(imagen => {
        const filename = imagen.url.split('/').pop();
        const imagePath = join(uploadDir, filename);
        
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
      
      mensajes[index].imagenes = [];
    }
    
    // Añadir las nuevas imágenes
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        mensajes[index].imagenes.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          url: `/uploads/${file.filename}`
        });
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar:', error);
    res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
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

// Ruta para filtrar mensajes con soporte para etiquetas y subcategorías unificado
app.get('/filtrar', (req, res) => {
  try {
    const { etiquetas, subetiquetas, extrasubetiquetas, orden, ranking, tipo, autor } = req.query;
    
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
      switch (tipo) {
        case 'otros':
          mensajesFiltrados = mensajesFiltrados.filter(m => m.autor !== autor);
          break;
        case 'mios':
          mensajesFiltrados = mensajesFiltrados.filter(m => m.autor === autor);
          break;
        // 'todos' no requiere filtrado
      }
    }
    
    // Filtrar por ranking
    if (ranking) {
      switch (ranking) {
        case 'populares':
          mensajesFiltrados = mensajesFiltrados.filter(m => m.ranking >= 100);
          break;
        case 'medios':
          mensajesFiltrados = mensajesFiltrados.filter(m => m.ranking >= 20 && m.ranking < 100);
          break;
        case 'menos_populares':
          mensajesFiltrados = mensajesFiltrados.filter(m => m.ranking < 20);
          break;
        // 'todos' no requiere filtrado
      }
    }
    
    // Ordenar resultados
    if (orden) {
      switch (orden) {
        case 'recientes':
          mensajesFiltrados.sort((a, b) => b.fecha - a.fecha);
          break;
        case 'antiguos':
          mensajesFiltrados.sort((a, b) => a.fecha - b.fecha);
          break;
        // ... resto de los casos de ordenamiento
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

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Foro iniciado en http://localhost:${port}`);
});