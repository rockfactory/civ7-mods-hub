import { parseContentDisposition } from '@civmods/parser';
import { pb } from '../../../core/pocketbase';
import { DownloadError } from '../errors';
import fs from 'fs/promises';
import { findModVersionMetadata } from '../db/versionMetadataRepo';
import path from 'path';
import { ARCHIVE_DIR } from '../fs/extractionDirs';

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

/**
 * Generic fetch wrapper with User-Agent
 */
async function fetchFile(url: string): Promise<Response> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CivMods/1.0' },
  });
  if (!res.ok) throw new Error(`Failed to download ${url}`);
  return res;
}

/**
 * Try to fetch the file from the cached PocketBase URL
 */
async function tryDownloadFromCachedUrl(id: string): Promise<Response | null> {
  const versionMetadata = await findModVersionMetadata(id);
  if (!versionMetadata?.archive_file) return null;

  const cachedUrl = pb.files.getURL(
    versionMetadata,
    versionMetadata.archive_file,
    {
      token: await pb.files.getToken(),
    }
  );

  console.log(`Trying cached download URL: ${cachedUrl}`);

  try {
    const res = await fetchFile(cachedUrl);
    console.log(`Downloaded from cache: ${cachedUrl}`);
    return res;
  } catch (err) {
    console.warn(`Cached download failed: ${cachedUrl}`, err);
    return null;
  }
}

/**
 * If the file is redirected externally, handle special logic (e.g., Google Drive)
 */
async function handleExternalRedirects(
  res: Response,
  id: string
): Promise<Response> {
  if (res.redirected) {
    await pb.collection('mod_versions').update(id, {
      is_external_download: true,
    });

    if (res.url.includes('//drive.google.com/')) {
      const updatedUrl = getGoogleDriveDirectDownloadUrl(res.url);
      if (!updatedUrl) {
        console.warn(`Failed to get direct download link for ${res.url}`);
        throw new Error(`Google Drive redirect failed: ${res.url}`);
      }
      return await fetchFile(updatedUrl);
    }
  }
  return res;
}

/**
 * Save the downloaded file and return the path
 */
async function saveDownloadedFile(
  res: Response,
  id: string
): Promise<[string, string]> {
  const buffer = await res.arrayBuffer();
  const { filename, extension } = parseContentDisposition(
    res.headers.get('content-disposition')
  );

  if (!extension) {
    throw new DownloadError(
      `No extension found. Filename: ${filename}, Content-Disposition: ${res.headers.get(
        'content-disposition'
      )}`
    );
  }

  const archivePath = path.join(ARCHIVE_DIR, `${id}.${extension}`);
  await fs.writeFile(archivePath, Buffer.from(buffer));
  return [filename!, archivePath];
}

/**
 * Download a mod version file, attempting cache first, with fallback.
 * @param versionDownloadUrl - The primary URL for the file.
 * @param id - The mod version ID.
 */
export async function downloadVersionFile(
  versionDownloadUrl: string,
  id: string
): Promise<{ isCached: boolean; filename: string; archivePath: string }> {
  let res = await tryDownloadFromCachedUrl(id);

  if (res) {
    const [filename, archivePath] = await saveDownloadedFile(res, id);
    return { isCached: true, filename, archivePath };
  }

  // Fallback to original URL
  console.log(`Falling back to standard download URL: ${versionDownloadUrl}`);
  res = await fetchFile(versionDownloadUrl);
  res = await handleExternalRedirects(res, id);

  console.log(`Downloaded: ${res.url}`, {
    status: res.status,
    statusText: res.statusText,
    disposition: res.headers.get('content-disposition'),
    type: res.headers.get('content-type'),
  });

  const [filename, archivePath] = await saveDownloadedFile(res, id);
  return { isCached: false, filename, archivePath };
}
