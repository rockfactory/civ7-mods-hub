import express from 'express';
import fs from 'fs/promises';
import { pb } from './core/pocketbase.js';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello, Civ world!' });
});

app.post('/mods/import', async (req, res) => {});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
