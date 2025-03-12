import {
  ModsResponse,
  ModVersionsRecord,
  ModVersionsResponse,
} from '../pocketbase-types';
import { fetch } from '@tauri-apps/plugin-http';
import * as fs from '@tauri-apps/plugin-fs';
// import { parseContentDisposition } from '../../../../packages/parser/src/headers';
import { invoke } from '@tauri-apps/api/core';
import * as path from '@tauri-apps/api/path';
import { ModInfo } from '../home/IModInfo';

function parseContentDisposition(contentDisposition: string | null): {
  filename?: string;
  extension?: string;
} {
  if (!contentDisposition) return {};

  const match = contentDisposition.match(
    /filename\*?=(?:UTF-8'')?([^;\r\n]*)/i
  );
  if (match && match[1]) {
    let filename = decodeURIComponent(match[1].replace(/['"]/g, '')); // Remove quotes
    let extension = filename.includes('.')
      ? filename.split('.').pop()
      : undefined;
    return { filename, extension };
  }

  return {};
}

export async function installMod(mod: ModVersionsRecord) {
  if (!mod.download_url) {
    throw new Error(`Mod ${mod.id} has no download URL`);
  }

  console.log('Downloading mod from:', mod.download_url);
  const response = await fetch(mod.download_url);
  if (!response.ok) {
    throw new Error(`Failed to download mod: ${response.statusText}`);
  }

  const contentDisposition = response.headers.get('content-disposition');
  console.log('Downloaded mod:', contentDisposition);
  const { filename, extension } = parseContentDisposition(contentDisposition);

  if (!filename || !extension) {
    throw new Error('Failed to parse filename or extension');
  }
  console.log('Filename:', filename, 'Extension:', extension);
  const modsFolderPath = await invoke<string>('get_mods_folder', {});

  console.log('Mods folder:', modsFolderPath);
  const tempArchivePath = await path.join(
    modsFolderPath,
    `${mod.id}_${filename}`
  );

  console.log('Saving mod to:', tempArchivePath);
  const buffer = await response.arrayBuffer();

  console.log('Writing mod archive to disk..');
  await fs.writeFile(tempArchivePath, new Uint8Array(buffer));

  const extractPath = await path.join(
    modsFolderPath,
    `civmods_${mod.modinfo_id!}_${mod.id}`
  );
  console.log('Extracting mod to:', extractPath);
  const result = await invoke<string>('extract_mod_archive', {
    archivePath: tempArchivePath,
    extractTo: extractPath,
  });

  console.log('Mod installed!', result);
  await fs.remove(tempArchivePath);
}

export async function uninstallMod(modInfo: ModInfo) {
  const modsFolderPath = await invoke<string>('get_mods_folder', {});

  console.log('Mods folder:', modsFolderPath);
  const modPath = await path.join(modsFolderPath, modInfo.mod_name);

  console.log('Removing mod:', modPath);
  await fs.remove(modPath, { recursive: true });
}
