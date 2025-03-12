import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { unpack } from '7zip-min';
import * as unrar from 'node-unrar-js';
import sleep from 'sleep-promise';
import PocketBase from 'pocketbase';
import { ModVersionsRecord } from '../../../desktop/src/pocketbase-types';
import { pb } from '../core/pocketbase';

const ARCHIVE_DIR = './apps/api/data/archives/';
const EXTRACTED_DIR = './apps/api/data/extracted/';

// Utility: Compute SHA-256 hash of a file
async function computeFileHash(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Utility: Compute SHA-256 hash of folder content
async function computeFolderHash(folderPath: string): Promise<string> {
  const files = await getFilesRecursively(folderPath);
  const hash = crypto.createHash('sha256');

  for (const file of files) {
    const content = await fs.readFile(file);
    hash.update(content);
  }

  return hash.digest('hex');
}

// Utility: Recursively list all files in a directory
async function getFilesRecursively(directory: string): Promise<string[]> {
  let files: string[] = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
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
  return files.find((file) => file.endsWith('.modinfo')) || null;
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
      const filePath = path.join(extractTo, file.fileHeader.name);
      file.extraction;
      // await fs.writeFile(filePath, file.);
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

// Main function to process mod archives
async function processModArchives() {
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  await fs.mkdir(EXTRACTED_DIR, { recursive: true });

  const modsVersions = await pb.collection('mod_versions').getFullList();

  for (const version of modsVersions) {
    try {
      if (!version.download_url) continue;

      // Download archive
      const archivePath = await downloadFile(version.download_url, version.id);
      console.log(`Downloaded: ${archivePath}`);

      // const archivePath = path.join(ARCHIVE_DIR, `${version.id}`);
      const extractPath = path.join(EXTRACTED_DIR, version.id);

      // Compute archive hash
      const archiveHash = await computeFileHash(archivePath);

      // Extract the archive
      await extractArchive(archivePath, extractPath);
      console.log(`Extracted to: ${extractPath}`);

      // Find .modinfo file
      const modInfoPath = await findModInfoFile(extractPath);
      if (!modInfoPath) {
        console.warn(`No .modinfo found in ${version.name}`);
        // await pb
        //   .collection('mod_versions')
        //   .update<ModVersionsRecord>(version.id, {

        //   } as ModVersionsRecord);
        continue;
      }

      // Compute extracted folder hash
      const folderHash = await computeFolderHash(extractPath);

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
      } as Partial<ModVersionsRecord>);

      console.log(`Updated PocketBase for: ${version.name}`);

      const sleepTime = Math.floor(Math.random() * (2000 - 300 + 1)) + 1000; // Random sleep between 2-5 seconds
      console.log(`Sleeping for ${sleepTime} ms`);
      await sleep(sleepTime);
    } catch (error) {
      console.error(`Failed to process ${version.name}: ${error}`);
    }

    // process.exit(0); // For testing, remove this line for full processing
  }
}

// Utility: Download a file
async function downloadFile(url: string, id: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}`);
  console.log(`Downloading: ${url}`, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
  const buffer = await res.arrayBuffer();
  const { filename, extension } = parseContentDisposition(
    res.headers.get('content-disposition')
  );

  await fs.writeFile(
    path.join(ARCHIVE_DIR, `${id}.${extension}`),
    Buffer.from(buffer)
  );

  return path.join(ARCHIVE_DIR, `${id}.${extension}`);
}

// Utility: Detect archive extension
function getArchiveExtension(url: string): string {
  const ext = path.extname(url);
  return ['.zip', '.7z', '.rar'].includes(ext) ? ext : '.zip'; // Default to .zip
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

// Run the process
processModArchives();
