import express from 'express';
import fs from 'fs/promises';
import { engine } from 'express-handlebars';
import { pb } from './core/pocketbase.js';
import { safeAsync } from './core/async.js';

const app = express();
const port = process.env.PORT || 3000;

app.use('/static', express.static('public'));
app.engine(
  'handlebars',
  engine({
    helpers: {
      section: function (name: string, options: any) {
        if (!this._sections) this._sections = {};
        // @ts-ignore
        this._sections[name] = options.fn(this);
        return null;
      },
    },
  })
);
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('index', { title: 'Home', lang: 'en' });
});

app.get(
  '/install',
  safeAsync(async (req, res) => {
    // if (!req.query?.modUrl) {
    //   return res.status(400).send('Missing modUrl query parameter');
    // }
    let filter = null;
    if (req.query?.modId) {
      filter = pb.filter('id = {:id}', { id: req.query.modId });
    } else if (req.query?.modUrl) {
      filter = pb.filter('download_url = {:url}', { url: req.query.modUrl });
    } else if (req.query?.modCfId) {
      filter = pb.filter('cf_id = {:cf_id}', { cf_id: req.query.modCfId });
    } else {
      return res.status(400).render('error', {
        title: 'Error',
        error: 'Missing modUrl, modId or modCfId query parameter',
      });
    }

    const modUrl = req.query.modUrl as string;
    const modId = req.query.modId as string;

    try {
      const mod = await pb.collection('mods').getFirstListItem(filter);
      res.render('install', { title: 'Install mod', mod });
    } catch (err) {
      return res.status(404).render('error', {
        title: 'Mod not found',
        error: "We couldn't find the mod you're looking for",
      });
    }
  })
);

app.get('/modders', async (req, res) => {
  res.render('modders', { title: 'Modders' });
});

app.post('/mods/import', async (req, res) => {});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
