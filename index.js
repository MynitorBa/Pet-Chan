import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname + '/public'));


app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('foro.ejs');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})