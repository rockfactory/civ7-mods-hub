import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { unpack } from '7zip-min';
import * as unrar from 'node-unrar-js';
import sleep from 'sleep-promise';
import {
  ModsRecord,
  ModVersionsRecord,
} from '../../../../desktop/src/pocketbase-types';
import { ScrapeModsOptions, SyncModVersion } from './scrapeMods';
import { pb } from '../../core/pocketbase';

const ARCHIVE_DIR = './apps/api/data/archives/';
const EXTRACTED_DIR = './apps/api/data/extracted/';

export async function extractAndStoreModVersionMetadata(
  options: ScrapeModsOptions,
  mod: ModsRecord,
  version: ModVersionsRecord
) {
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  await fs.mkdir(EXTRACTED_DIR, { recursive: true });

  try {
    if (!version.download_url || version.skip_install) return;

    const extractPath = path.join(EXTRACTED_DIR, version.id);

    const isAlreadyDownloaded = await fs.stat(extractPath).catch(() => null);

    let archiveHash = undefined as string | undefined;
    if (!isAlreadyDownloaded?.isDirectory) {
      // Download archive
      const archivePath = await downloadFile(version.download_url, version.id);
      if (!archivePath) return;

      console.log(`Downloaded: ${archivePath}`);

      // Extract the archive
      try {
        await extractArchive(archivePath, extractPath);
        console.log(`Extracted to: ${extractPath}`);

        // Compute archive hash
        archiveHash = await computeFileHash(archivePath);

        const sleepTime = Math.floor(Math.random() * (2000 - 300 + 1)) + 1000; // Random sleep between 1-2 seconds
        console.log(`Sleeping for ${sleepTime} ms`);
        await sleep(sleepTime);
      } catch (error) {
        await fs.rm(extractPath, { recursive: true });
      }
    }
    // Find .modinfo file
    const modInfoPath = await findModInfoFile(extractPath);
    if (!modInfoPath) {
      console.warn(`No .modinfo found in ${version.name}`);
      await pb
        .collection('mod_versions')
        .update<ModVersionsRecord>(version.id, {
          skip_install: true,
          is_processing: false,
        } as ModVersionsRecord);
      return;
    }

    // Compute extracted folder hash
    const folderHash = await computeFolderHash(path.dirname(modInfoPath));

    // Parse .modinfo XML file
    const modInfoXML = await fs.readFile(modInfoPath, 'utf8');
    const parser = new XMLParser({ ignoreAttributes: false });
    const modInfo = parser.parse(modInfoXML);

    // Update PocketBase record
    await pb.collection('mod_versions').update(version.id, {
      archive_hash: archiveHash,
      hash: folderHash,
      modinfo_url: modInfo?.Mod?.Properties?.URL || null,
      modinfo_version: modInfo?.Mod?.Properties?.Version || null,
      modinfo_id: modInfo?.Mod?.['@_id'] || null,
      affect_saves: modInfo?.Mod?.Properties?.AffectsSavedGames == 1,
      skip_install: false,
      download_error: false,
      is_processing: false,
    } as Partial<ModVersionsRecord>);

    console.log(`Updated PocketBase for: ${version.name}`);
  } catch (error) {
    console.error(`Failed to process ${version.name}: ${error}`);
  } finally {
  }

  // process.exit(0); // For testing, remove this line for full processing
}

// Utility: Compute SHA-256 hash of a file
async function computeFileHash(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Utility: Compute SHA-256 hash of folder content, including filename and relative path.
 * @param folderPath - Path to the folder to hash
 * @returns SHA-256 hash as a hexadecimal string
 */
async function computeFolderHash(folderPath: string): Promise<string> {
  const files = await getFilesRecursively(folderPath);
  const hash = crypto.createHash('sha256');
  console.log(`Hashing folder: ${folderPath}`);

  for (const file of files) {
    // Skipping for now

    // Get the relative path
    // const relativePath = path.relative(folderPath, file);
    // console.log(` Hashing: ${relativePath}`);

    // // Update hash with the relative path
    // hash.update(relativePath);

    // Read file content and update hash
    const content = await fs.readFile(file);
    hash.update(content);
  }

  return hash.digest('hex');
}

// Utility: Recursively list all files in a directory
async function getFilesRecursively(directory: string): Promise<string[]> {
  let files: string[] = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const orderedEntries = entries.sort((a, b) => {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  for (const entry of orderedEntries) {
    const entryPath = path.join(directory, entry.name);

    // Make sure this is aligned with the ignore list in the frontend in rust
    if (entry.name.startsWith('.')) continue;
    if (entry.name.toLowerCase() === 'thumbs.db') continue;
    if (entry.name.toLowerCase() === '__MACOSX') continue;

    if (entry.isDirectory()) {
      files = files.concat(await getFilesRecursively(entryPath));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

// Utility: Recursively find .modinfo file
async function findModInfoFile(directory: string): Promise<string | null> {
  const files = await getFilesRecursively(directory);
  return (
    files.find((file) => file.endsWith('.modinfo') && !file.startsWith('.')) ||
    null
  );
}

// Extract ZIP and 7z using `7zip-min`
async function extract7ZipOrZip(
  archivePath: string,
  extractTo: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    unpack(archivePath, extractTo, (err) => {
      if (err) reject(`7zip extraction failed: ${err}`);
      else resolve();
    });
  });
}

// Extract RAR using `node-unrar-js`
async function extractRar(
  archivePath: string,
  extractTo: string
): Promise<void> {
  const extractor = await unrar.createExtractorFromFile({
    filepath: archivePath,
    targetPath: extractTo,
  });
  const extractedFiles = extractor.extract();

  await fs.mkdir(extractTo, { recursive: true });

  for (const file of extractedFiles.files) {
    if (!file.fileHeader.flags.directory) {
      // const filePath = path.join(extractTo, file.fileHeader.name);
      // Trigger extraction
      file.extraction;
    }
  }
}

// Function to extract an archive based on its format
async function extractArchive(
  archivePath: string,
  extractTo: string
): Promise<void> {
  if (archivePath.endsWith('.zip') || archivePath.endsWith('.7z')) {
    await extract7ZipOrZip(archivePath, extractTo);
  } else if (archivePath.endsWith('.rar')) {
    await extractRar(archivePath, extractTo);
  } else {
    throw new Error(`Unsupported archive format: ${archivePath}`);
  }
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

// Utility: Download a file
async function downloadFile(url: string, id: string): Promise<string | null> {
  let res = await fetch(url, {
    headers: {
      'User-Agent': 'CivMods/1.0',
    },
  });
  if (!res.ok) throw new Error(`Failed to download ${url}`);

  if (res.redirected) {
    await pb.collection('mod_versions').update(id, {
      is_external_download: true,
    } as Partial<ModVersionsRecord>);
  }

  if (res.redirected && res.url.includes('//drive.google.com/')) {
    const updatedUrl = getGoogleDriveDirectDownloadUrl(res.url);
    if (!updatedUrl) {
      console.warn(`Failed to get direct download link for ${url}`);
      return null;
    }

    res = await fetch(updatedUrl);
    if (!res.ok) throw new Error(`Failed to download ${updatedUrl}`);
  }

  console.log(`Downloaded: ${url}`, {
    status: res.status,
    statusText: res.statusText,
    disposition: res.headers.get('content-disposition'),
    type: res.headers.get('content-type'),
  });

  const buffer = await res.arrayBuffer();
  const { filename, extension } = parseContentDisposition(
    res.headers.get('content-disposition')
  );

  if (extension == null) {
    console.warn(`No extension found for ${url}`, { filename, extension });
    await pb.collection('mod_versions').update(id, {
      download_error: true,
      is_processing: false,
    } as Partial<ModVersionsRecord>);
    return null;
  }

  await fs.writeFile(
    path.join(ARCHIVE_DIR, `${id}.${extension}`),
    Buffer.from(buffer)
  );

  return path.join(ARCHIVE_DIR, `${id}.${extension}`);
}

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
