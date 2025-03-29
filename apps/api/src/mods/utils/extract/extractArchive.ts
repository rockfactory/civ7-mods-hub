import fs from 'fs/promises';
import path from 'path';
import { unpack, cmd } from '7zip-min';
import * as unrar from 'node-unrar-js';
import { SkipInstallError } from '../errors';

// Extract ZIP and 7z using `7zip-min`
async function extract7ZipOrZip(
  archivePath: string,
  extractTo: string
): Promise<void> {
  try {
    const isTarGz =
      archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz');

    let args = ['x', archivePath, '-y', '-o' + extractTo];

    if (archivePath.endsWith('.tgz')) {
      args.push('-tgzip');
    }

    await cmd(args);

    if (isTarGz) {
      // Gets tar path e.g. "abc.tgz" -> "abc.tar", or "abc.tar.gz" -> "abc.tar"
      const tarPath = path.join(
        extractTo,
        path.basename(archivePath, path.extname(archivePath)) + '.tar'
      );

      console.log('Extracting tar.gz file from', tarPath);
      await unpack(tarPath, extractTo);
      await fs.rm(tarPath);
    }
  } catch (error) {
    throw new Error(`7zip extraction failed: ${error}`);
  }
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
export async function extractArchive(
  archivePath: string,
  extractTo: string
): Promise<void> {
  if (
    archivePath.endsWith('.zip') ||
    archivePath.endsWith('.7z') ||
    archivePath.endsWith('.tar.gz') ||
    archivePath.endsWith('.tgz') ||
    archivePath.endsWith('.tar') ||
    archivePath.endsWith('.gz') ||
    archivePath.endsWith('.bz2')
  ) {
    await extract7ZipOrZip(archivePath, extractTo);
  } else if (archivePath.endsWith('.rar')) {
    await extractRar(archivePath, extractTo);
  } else {
    throw new SkipInstallError(`Unsupported archive format: ${archivePath}`);
  }

  // Ensure all files have sufficient permissions
  try {
    await recursivelyGrantReadWritePermissions(extractTo);
  } catch (error) {
    console.error(error);
  }
}

async function recursivelyGrantReadWritePermissions(
  directory: string
): Promise<void> {
  const entries = [path.resolve(directory)];
  while (entries.length > 0) {
    const entry = entries.pop()!;
    const stat = await fs.stat(entry);
    await fs.chmod(entry, stat.mode | fs.constants.O_RDWR);
    if (stat.isDirectory()) {
      const subEntries = (await fs.readdir(entry)).map((subEntry) =>
        path.join(entry, subEntry)
      );
      entries.push(...subEntries);
    }
  }
}
