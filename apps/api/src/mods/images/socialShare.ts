import path from 'path';
import { pb } from '../../core/pocketbase';
import { readFileSync, createReadStream, existsSync, mkdirSync } from 'fs';
import * as fsp from 'fs/promises';
import satori from 'satori';
import sharp from 'sharp';
import { Request, Response } from 'express';

const fontFilePath = path.join(__dirname, './inter-24pt-regular.ttf');
const fontFile = readFileSync(fontFilePath);

const fontBoldFilePath = path.join(__dirname, './inter-28pt-bold.ttf');
const fontBoldFile = readFileSync(fontBoldFilePath);

const imageLogoPath = path.resolve(__dirname, '../../../public/logo.png');
const imageBuffer = readFileSync(imageLogoPath);

async function generateSocialImage(id: string | null) {
  const html = await import('satori-html');
  if (!id) {
    throw new Error('Mod ID is required');
  }

  const mod = await pb.collection('mods').getOne(id);

  if (!mod) {
    throw new Error('Mod not found');
  }

  const markup = html.html(/*html*/ `<div
    style="font-family: 'Inter'; height: 100%; width: 100%; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; background-color: #13171f; font-size: 32px; font-weight: 400;"
  >
    <div
      style="font-size: 70px; margin-top: 38px; display: flex; flex-direction: column; color: white; margin-left: 38px;"
    >
      <div style="font-size: 100px;">
        ${mod.name}
      </div>
      <div style="display: flex; align-items: center; margin-top: 18px; font-family: Inter; font-weight: 700;">
        <img src="data:image/png;base64,${imageBuffer.toString(
          'base64'
        )}" style="width: 100px; height: 100px; margin-right: 18px;" />
        <span>
          Install with CivMods
        </span>
      </div>      
    </div>
  </div>`);

  const svg = await satori(markup as any, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: fontFile,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: fontBoldFile,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const png = sharp(Buffer.from(svg)).png();
  const response = await png.toBuffer();
  return response;
}

async function exists(path: string): Promise<boolean> {
  try {
    await fsp.access(path, fsp.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function renderSocialImage(req: Request, res: Response) {
  const { id } = req.params;
  if (typeof id !== 'string') {
    return res.status(400).send('Mod ID is required');
  }

  const cacheDir = path.join(__dirname, '../../cache/social');

  // Ensure the cache directory exists
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  const cachePath = path.join(cacheDir, `${id}.png`);
  try {
    if (await exists(cachePath)) {
      // If it exists, stream the cached image to the response
      res.setHeader('Cache-Control', 'public, max-age=43200'); // 12 hours
      res.setHeader('Content-Type', 'image/png');
      createReadStream(cachePath).pipe(res);
    } else {
      const imageBuffer = await generateSocialImage(id);

      // Save the generated image to the cache
      await fsp.writeFile(cachePath, imageBuffer);

      // Serve the newly generated image
      res.setHeader('Cache-Control', 'public, max-age=43200'); // 12 hours
      res.setHeader('Content-Type', 'image/png');
      res.send(imageBuffer);
    }
  } catch (err) {
    // An unexpected error occurred while checking the cache
    console.error('Error accessing cache:', err);
    res.status(500).send('Error generating social image');
  }
}
