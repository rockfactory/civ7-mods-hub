import express from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import { engine } from 'express-handlebars';
import { pb } from './core/pocketbase.js';
import { safeAsync } from './core/async.js';
import {
  getCachedGithubRelease,
  getGithubRelease,
  Release,
} from './download/downloadLinks.js';
import { marked } from 'marked';
import Handlebars from 'handlebars';

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
      markdown: function (content: string) {
        return new Handlebars.SafeString(
          marked.parse(content, { async: false })
        );
      },
      icon: function (name: string, size: number = 24) {
        const content = fsSync.readFileSync(
          `../../node_modules/@tabler/icons/icons/${name}.svg`,
          'utf-8'
        );
        if (size !== 24) {
          // Replace width and height
          return new Handlebars.SafeString(
            content
              .replace(/width="24"/g, `width="${size}"`)
              .replace(/height="24"/g, `height="${size}"`)
          );
        }

        return new Handlebars.SafeString(content);
      },
    },
  })
);
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get(
  '/',
  safeAsync(async (req, res) => {
    let release: Release | null = null;
    try {
      release = await getCachedGithubRelease('latest');
    } catch (err) {
      console.error("Couldn't fetch latest release");
      console.error(err);
    }

    res.render('index', { title: 'Home', lang: 'en', release });
  })
);

app.get(
  '/releases/:version',
  safeAsync(async (req, res) => {
    const version = req.params.version;
    let release: Release | null = null;
    try {
      release = await getCachedGithubRelease(version);
    } catch (err) {
      console.error(`Couldn't fetch release ${version}`);
      return res.status(404).render('error', {
        title: 'Error',
        error: `Couldn't fetch release ${version}`,
      });
    }

    if (!release) {
      return res.status(404).render('error', {
        title: 'Error',
        error: `Release ${version} not found`,
      });
    }

    res.render('release', {
      title: `Release ${release?.title ?? 'Unknown'}`,
      lang: 'en',
      release,
    });
  })
);

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
