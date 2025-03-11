import express from 'express';
import fs from 'fs/promises';
import { pb } from './core/pocketbase';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello, Civ world!' });
});

app.post('/mods/import-static', async (req, res) => {
  const allMods = await fs.readFile('./mods/civ7_mods.json', 'utf-8');
  const mods = JSON.parse(allMods);
  for (const mod of mods) {
    console.log(`Importing mod: ${mod.modName}`);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
