import express from 'express';
import fs from 'fs/promises';
import { engine } from 'express-handlebars';
import { pb } from './core/pocketbase.js';

const app = express();
const port = process.env.PORT || 3000;

app.use('/static', express.static('public'));
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('index', { title: 'Home', lang: 'en' });
});

app.post('/mods/import', async (req, res) => {});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
