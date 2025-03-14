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

export interface InstallModOptions {
  modsFolderPath: string;
}

/**
 * Converts a Google Drive file URL into a direct download link.
 * @param url - The original Google Drive file URL
 * @returns Direct download URL or null if invalid
 */
function getGoogleDriveDirectDownloadUrl(url: string): string | null {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return null;
}

export async function installMod(
  mod: ModVersionsRecord,
  options: InstallModOptions
) {
  if (!mod.download_url) {
    throw new Error(`Mod ${mod.id} has no download URL`);
  }

  console.log('Downloading mod from:', mod.download_url);
  let response = await fetch(mod.download_url);
  if (!response.ok) {
    throw new Error(`Failed to download mod: ${response.statusText}`);
  }

  console.log('Downloaded mod:', response.url);

  if (response.redirected) console.log('Redirected to:', response.url);

  if (
    response.url.includes('//drive.google.com/') &&
    !response.url.includes('export')
  ) {
    console.log('Redirected to Google Drive, getting direct download link..');
    const updatedUrl = getGoogleDriveDirectDownloadUrl(response.url);
    if (!updatedUrl) {
      console.warn(`Failed to get direct download link for ${response.url}`);
      throw new Error(
        'Failed to download mod: redirect link provider is not supported'
      );
    }

    response = await fetch(updatedUrl);
    if (!response.ok)
      throw new Error(
        `Failed to download Google Drive link. Please download it manually. ${updatedUrl}`
      );
  }

  const contentDisposition = response.headers.get('content-disposition');
  console.log('Downloaded mod:', contentDisposition);
  const { filename, extension } = parseContentDisposition(contentDisposition);

  if (!filename || !extension) {
    throw new Error('Failed to parse filename or extension');
  }
  console.log('Filename:', filename, 'Extension:', extension);
  const modsFolderPath = options.modsFolderPath;

  console.log('Mods folder:', modsFolderPath);
  const tempArchivePath = await path.join(
    modsFolderPath,
    `${mod.id}_${filename}`
  );

  console.log('Saving mod to:', tempArchivePath);
  const buffer = await response.arrayBuffer();

  console.log('Writing mod archive to disk..');
  try {
    await fs.writeFile(tempArchivePath, new Uint8Array(buffer));

    const extractPath = await path.join(
      modsFolderPath,
      `civmod-${mod.modinfo_id ?? mod.mod_id}-${mod.cf_id}`
    );
    console.log('Extracting mod to:', extractPath);
    const result = await invoke<string>('extract_mod_archive', {
      archivePath: tempArchivePath,
      extractTo: extractPath,
    });

    console.log('Mod installed!', result);
  } finally {
    console.log('Removing temp archive:', tempArchivePath);
    await fs.remove(tempArchivePath);
  }
}

export async function uninstallMod(modInfo: ModInfo, modsFolderPath: string) {
  console.log('Mods folder:', modsFolderPath);
  const modPath = await path.join(modsFolderPath, modInfo.mod_name);

  if (!(await fs.exists(modPath))) {
    console.warn('Mod not found:', modPath);
    return;
  }

  console.log('Removing mod:', modPath);
  await fs.remove(modPath, { recursive: true });
}

export function canInstallMod(mod: ModVersionsRecord): boolean {
  return mod.download_url != null && !mod.skip_install;
}
