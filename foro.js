import express from 'express';
import { urlencoded } from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

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

// Nueva ruta para votar mensajes
app.post('/votar/:id', (req, res) => {
  try {
    const mensajeId = parseInt(req.params.id);
    const { valor } = req.body;

    // Encontrar el mensaje
    const mensajeIndex = mensajes.findIndex(m => m.id === mensajeId);
    
    if (mensajeIndex === -1) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }

    // Inicializar ranking si no existe
    if (!mensajes[mensajeIndex].ranking) {
      mensajes[mensajeIndex].ranking = 0;
    }

    // Obtener el voto actual
    const votoActual = mensajes[mensajeIndex].votoActual || 0;

    // Calcular el nuevo ranking basado en la lógica específica
    if (votoActual === 0) {
      // Si no había voto previo, simplemente agregamos el nuevo voto
      mensajes[mensajeIndex].ranking += valor;
    } else if (votoActual > 0 && valor > 0) {
      // Si ya había un like y se da like de nuevo, se quita
      mensajes[mensajeIndex].ranking -= votoActual;
    } else if (votoActual < 0 && valor < 0) {
      // Si ya había un dislike y se da dislike de nuevo, se quita
      mensajes[mensajeIndex].ranking -= votoActual;
    } else {
      // Cambiar entre like y dislike
      mensajes[mensajeIndex].ranking -= votoActual;
      mensajes[mensajeIndex].ranking += valor;
    }

    // Actualizar el voto actual
    if (valor === 0) {
      delete mensajes[mensajeIndex].votoActual;
    } else {
      mensajes[mensajeIndex].votoActual = valor;
    }

    // Redondear para evitar problemas de precisión
    mensajes[mensajeIndex].ranking = Math.round(mensajes[mensajeIndex].ranking * 10) / 10;

    // Devolver el nuevo ranking
    return res.json({ 
      success: true, 
      nuevoRanking: mensajes[mensajeIndex].ranking 
    });

  } catch (error) {
    console.error('Error al votar mensaje:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error del servidor al procesar el voto: ' + error.message 
    });
  }
});

// Ruta para votar comentarios - CORREGIDA
app.post('/votar-comentario', (req, res) => {
  try {
    const { comentarioId, valor } = req.body;
    
    if (!comentarioId || valor === undefined) {
      return res.json({ 
        success: true, // Mantenemos success:true para evitar alertas
        nuevoRanking: 0,
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
    
    // Si no encuentra el comentario, retorna éxito con ranking 0
    if (!comentarioEncontrado) {
      console.log('Comentario no encontrado:', comentarioIdNum);
      return res.json({ 
        success: true, 
        nuevoRanking: 0 
      });
    }

    // Inicializar ranking si no existe
    if (comentarioEncontrado.ranking === undefined) {
      comentarioEncontrado.ranking = 0;
    }
    
    // Obtener el voto actual
    const votoActual = comentarioEncontrado.votoActual || 0;

    // Calcular el nuevo ranking
    if (valorNum === 0) {
      // Cancelar voto
      comentarioEncontrado.ranking -= votoActual;
      delete comentarioEncontrado.votoActual;
    } else if (votoActual === 0) {
      // Sin voto previo
      comentarioEncontrado.ranking += valorNum;
      comentarioEncontrado.votoActual = valorNum;
    } else if (votoActual === valorNum) {
      // Mismo voto, cancelar
      comentarioEncontrado.ranking -= votoActual;
      delete comentarioEncontrado.votoActual;
    } else {
      // Cambiar voto
      comentarioEncontrado.ranking = comentarioEncontrado.ranking - votoActual + valorNum;
      comentarioEncontrado.votoActual = valorNum;
    }

    // Redondear para evitar problemas de precisión
    comentarioEncontrado.ranking = Math.round(comentarioEncontrado.ranking);
    
    console.log('Comentario actualizado:', comentarioIdNum, 'nuevo ranking:', comentarioEncontrado.ranking);
    
    // Siempre devolver éxito
    return res.json({ 
      success: true, 
      nuevoRanking: comentarioEncontrado.ranking 
    });

  } catch (error) {
    console.error('Error al votar comentario:', error);
    // Siempre devolver éxito para evitar alertas en el cliente
    return res.json({ 
      success: true, 
      nuevoRanking: 0,
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






// Ruta para eliminar mensajes
app.delete('/eliminar-mensaje/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    // Buscar el mensaje para eliminar sus imágenes si existen
    const mensaje = mensajes.find(m => m.id === id);
    
    if (!mensaje) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }
    
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
    
    // Filtrar el mensaje a eliminar
    mensajes = mensajes.filter(m => m.id !== id);
    
    // Eliminar votos asociados al mensaje
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


// NUEVA RUTA: Eliminar comentario
app.delete('/eliminar-comentario/:mensajeId/:comentarioId', (req, res) => {
  try {
    const mensajeId = parseInt(req.params.mensajeId);
    const comentarioId = parseInt(req.params.comentarioId);

    // Buscar el mensaje
    const mensaje = mensajes.find(m => m.id === mensajeId);
    
    if (!mensaje || !mensaje.comentarios) {
      return res.status(404).json({ success: false, error: 'Mensaje o comentarios no encontrados' });
    }
    
    // Buscar el comentario
    const comentarioIndex = mensaje.comentarios.findIndex(c => c.id === comentarioId);
    
    if (comentarioIndex === -1) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }
    
    // Eliminar las imágenes del comentario si existen
    const comentario = mensaje.comentarios[comentarioIndex];
    if (comentario.imagenes && comentario.imagenes.length > 0) {
      comentario.imagenes.forEach(imagen => {
        const filename = imagen.url.split('/').pop();
        const imagePath = join(uploadDir, filename);
        
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }
    
    // Eliminar el comentario del array
    mensaje.comentarios.splice(comentarioIndex, 1);
    
    return res.json({ 
      success: true,
      totalComentarios: mensaje.comentarios.length
    });
  } catch (error) {
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
    extrasubetiquetasDisponibles
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