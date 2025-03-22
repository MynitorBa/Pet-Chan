import express from 'express';
import { urlencoded } from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

// Obtener ruta del directorio actual con soporte para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Configuración para subir imágenes
const uploadDir = join(__dirname, 'public', 'uploads');

// Crear directorio de uploads si no existe
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

// Configuración de multer con límite de 10MB
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imágenes'));
    }
    cb(null, true);
  }
});

// Configuración de la aplicación
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, 'public')));
app.use(urlencoded({ extended: true }));
app.use(express.json());

// Almacenamiento de mensajes (en memoria)
let mensajes = [];
let nextId = 1;

// Rutas
app.get('/', (req, res) => {
  res.render('foro', { mensajes });
});

// Ruta para publicar mensaje con múltiples imágenes
app.post('/publicar', upload.array('imagenes', 9), (req, res) => {
  try {
    const { autor, mensaje } = req.body;
    
    if (autor && mensaje) {
      const id = nextId++;
      const nuevoMensaje = {
        id,
        autor,
        mensaje,
        fecha: new Date().toLocaleString(),
        imagenes: []
      };
      
      // Si hay imágenes, guardar las URLs
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          nuevoMensaje.imagenes.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            url: `/uploads/${file.filename}`
          });
        });
      }
      
      mensajes.push(nuevoMensaje);
    }
    
    res.redirect('/');
  } catch (error) {
    console.error('Error al publicar:', error);
    res.status(500).send('Error al publicar el mensaje');
  }
});

// Ruta para eliminar mensajes
app.delete('/eliminar/:id', (req, res) => {
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
    
    return res.json({ 
      success: true,
      totalMensajes: mensajes.length
    });
  } catch (error) {
    console.error('Error al eliminar:', error);
    return res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
  }
});

// Ruta para obtener un mensaje específico para editar
app.get('/mensaje/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const mensaje = mensajes.find(m => m.id === id);
  
  if (mensaje) {
    res.json(mensaje);
  } else {
    res.status(404).json({ error: 'Mensaje no encontrado' });
  }
});

// Ruta para actualizar un mensaje con imágenes
app.put('/actualizar/:id', upload.array('imagenes', 9), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { autor, mensaje, mantener_imagenes } = req.body;
    
    const index = mensajes.findIndex(m => m.id === id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }
    
    if (!autor || !mensaje) {
      return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }
    
    // Guardar referencia a las imágenes antiguas
    const imagenesAntiguas = [...mensajes[index].imagenes];
    
    // Actualizar los datos del mensaje
    mensajes[index].autor = autor;
    mensajes[index].mensaje = mensaje;
    mensajes[index].fecha = new Date().toLocaleString() + ' (editado)';
    
    // Determinar qué imágenes mantener
    if (mantener_imagenes && Array.isArray(mantener_imagenes)) {
      const idsAMantener = mantener_imagenes.map(id => parseInt(id));
      
      // Eliminar las imágenes que no se mantienen
      imagenesAntiguas.forEach(imagen => {
        if (!idsAMantener.includes(imagen.id)) {
          const filename = imagen.url.split('/').pop();
          const imagePath = join(uploadDir, filename);
          
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      });
      
      // Filtrar las imágenes a mantener
      mensajes[index].imagenes = imagenesAntiguas.filter(imagen => 
        idsAMantener.includes(imagen.id)
      );
    } else {
      // Si no se especifica qué mantener, eliminar todas las imágenes antiguas
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

// Manejar errores de Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        success: false, 
        error: 'El archivo es demasiado grande. El tamaño máximo permitido es 10MB.' 
      });
    }
  }
  console.error(err);
  res.status(500).json({ success: false, error: 'Error del servidor: ' + err.message });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Foro iniciado en http://localhost:${port}`);
});