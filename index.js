import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname + '/public'));


app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    // Create a mensaje object with the data you need
    const mensaje = {
        imagenesUrl: [] // Empty array or populate with actual image URLs
    };
    
    res.render('inicio.ejs', { mensaje });
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
})