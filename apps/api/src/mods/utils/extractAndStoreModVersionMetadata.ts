import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import sleep from 'sleep-promise';
import {
  ModsRecord,
  ModVersionsRecord,
  parseContentDisposition,
} from '@civmods/parser';
import { ScrapeModsOptions, SyncModVersion } from './scrapeMods';
import { pb } from '../../core/pocketbase';
import { DiscordLog } from '../../integrations/discord/DiscordLog';
import { upsertVersionMetadata } from './upsertVersionMetadata';
import { DownloadError, SkipInstallError } from './errors';
import { extractArchive } from './extract/extractArchive';
import { getFilesRecursively } from './fs/getFilesRecursively';
import { ARCHIVE_DIR, EXTRACTED_DIR } from './fs/extractionDirs';
import { downloadVersionFile } from './download/downloadVersionFile';
import { getModInfoDependencies } from './modinfo/getModInfoDependencies';

export async function extractAndStoreModVersionMetadata(
  options: ScrapeModsOptions,
  mod: ModsRecord,
  version: ModVersionsRecord
) {
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  await fs.mkdir(EXTRACTED_DIR, { recursive: true });

  let archiveSize = 0;
  let archivePath: string | null = null;
  let filename: string | null = null;
  let isCached: boolean = false;
  const extractPath = path.join(EXTRACTED_DIR, version.id);

  try {
    if (
      !version.download_url ||
      (version.skip_install && !options.forceExtractAndStore)
    )
      return;

    const isAlreadyDownloaded = await fs.stat(extractPath).catch(() => null);

    let archiveHash = undefined as string | undefined;
    if (!isAlreadyDownloaded?.isDirectory) {
      // Download archive
      console.log(`Downloading: ${version.download_url}`);
      const download = await downloadVersionFile(
        version.download_url,
        version.id
      );
      archivePath = download.archivePath;
      isCached = download.isCached;
      filename = download.filename;

      console.log(`Downloaded: ${archivePath}`);
      archiveSize = (await fs.stat(archivePath)).size;
      console.log(`Archive size: ${archiveSize / 1024 / 1024} MB`);

      // Extract the archive
      await extractArchive(archivePath, extractPath);
      console.log(`Extracted to: ${extractPath}`);

      // Compute archive hash
      archiveHash = await computeFileHash(archivePath);

      const sleepTime = isCached
        ? 100
        : Math.floor(Math.random() * (2000 - 300 + 1)) + 1000; // Random sleep between 1-2 seconds

      console.log(`Sleeping for ${sleepTime} ms`);
      await sleep(sleepTime);
    } else {
      console.log(`Already downloaded: ${extractPath}`);
    }

    // Find .modinfo file
    const modInfoPath = await findModInfoFile(extractPath);
    if (!modInfoPath) {
      throw new SkipInstallError(`No .modinfo file found in ${version.name}`);
    }

    // Compute extracted folder hash
    const folderHash = await computeFolderHash(path.dirname(modInfoPath));

    // Parse .modinfo XML file
    const modInfoXML = await fs.readFile(modInfoPath, 'utf8');
    const parser = new XMLParser({ ignoreAttributes: false });
    let modInfo: any;

    try {
      modInfo = parser.parse(modInfoXML);
    } catch (error) {
      throw new SkipInstallError(
        `Failed to parse .modinfo XML for ${version.name}. Make sure it's a valid XML: ${error}`
      );
    }

    const versionUpdate = {
      archive_hash: archiveHash,
      hash_stable: folderHash,
      modinfo_url: modInfo?.Mod?.Properties?.URL || null,
      modinfo_version: modInfo?.Mod?.Properties?.Version || null,
      modinfo_id: modInfo?.Mod?.['@_id'] || null,
      affect_saves:
        modInfo?.Mod?.Properties?.AffectsSavedGames == 1 ||
        modInfo?.Mod?.Properties?.AffectsSavedGames == null,
      archive_size: archiveSize,
      dependencies: getModInfoDependencies(modInfo),
      skip_install: false,
      download_error: false,
      is_processing: false,
    } as Partial<ModVersionsRecord>;

    // Update PocketBase record
    await pb.collection('mod_versions').update(version.id, versionUpdate);

    // Store metadata
    try {
      await upsertVersionMetadata(options, {
        modId: mod.id,
        versionId: version.id,
        modInfo,
        archivePath,
        filename,
        skipFileUpload: isCached,
      });
    } catch (error) {
      console.error(`Failed to store metadata for ${version.name}: ${error}`);
      if (process.env.NODE_ENV === 'development') throw error;
    }

    console.log(`Updated PocketBase for: ${version.name}`);
    if (!options.forceExtractAndStore) {
      DiscordLog.onVersionProcessed(mod, { ...version, ...versionUpdate });
    }
  } catch (error) {
    console.error(`Failed to process ${version.name}: ${error}`);
    console.error(error);
    if (!options.forceExtractAndStore) {
      DiscordLog.onVersionError(mod, version, error);
    }

    /**
     * If the error is a SkipInstallError, mark the version as skipped and not
     * processing further. This is useful for mods that are impossible to install.
     * In all other cases, the version will be kept in processing state and
     * re-processed on the next run.
     */
    if (error instanceof SkipInstallError) {
      await pb
        .collection('mod_versions')
        .update<ModVersionsRecord>(version.id, {
          skip_install: true,
          is_processing: false,
        } as ModVersionsRecord);
    }

    if (error instanceof DownloadError) {
      await pb
        .collection('mod_versions')
        .update<ModVersionsRecord>(version.id, {
          download_error: true,
          is_processing: false,
        } as ModVersionsRecord);
    }
  } finally {
    if (process.env.NODE_ENV !== 'development' || true) {
      console.log(`Cleaning up: ${version.name}, NODE_ENV: ${process.env.NODE_ENV}`); // prettier-ignore
      try {
        if (archivePath) await fs.rm(archivePath);
        if (extractPath) await fs.rm(extractPath, { recursive: true });
      } catch (error) {
        console.error(`Failed to clean up: ${error}`);
      }
    }
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
export async function computeFolderHash(folderPath: string): Promise<string> {
  const files = await getFilesRecursively(folderPath);
  const hash = crypto.createHash('sha256');
  console.log(`Hashing folder: ${folderPath}`);

  for (const file of files) {
    // Read file content and update hash
    const content = await fs.readFile(file);
    hash.update(content);
  }

  return hash.digest('hex');
}

// Utility: Recursively find .modinfo file
export async function findModInfoFile(
  directory: string
): Promise<string | null> {
  const files = await getFilesRecursively(directory);
  return (
    files.find((file) => file.endsWith('.modinfo') && !file.startsWith('.')) ||
    null
  );
}
