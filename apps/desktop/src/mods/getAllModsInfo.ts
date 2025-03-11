import { invoke } from '@tauri-apps/api/core';
import { readDir, readTextFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { XMLParser } from 'fast-xml-parser';

// Recursive search for .modinfo
async function findModInfoRecursive(
  directoryPath: string
): Promise<string | null> {
  const entries = await readDir(directoryPath);

  for (const entry of entries) {
    const entryPath = await join(directoryPath, entry.name);

    if (entry.isDirectory) {
      const nestedResult = await findModInfoRecursive(entryPath);
      if (nestedResult) return nestedResult;
    } else if (entry.isFile && entry.name.endsWith('.modinfo')) {
      return entryPath;
    }
  }

  return null;
}

// Main function
export async function getAllModsInfo() {
  const modsFolderPath = await invoke<string>('get_mods_folder');
  const modDirs = (await readDir(modsFolderPath)).filter(
    (entry) => entry.isDirectory
  );

  const modsInfo = [];

  for (const modDir of modDirs) {
    const modDirPath = await join(modsFolderPath, modDir.name);
    const modInfoPath = await findModInfoRecursive(modDirPath);

    if (modInfoPath) {
      const xmlContent = await readTextFile(modInfoPath);
      const parser = new XMLParser({ ignoreAttributes: false });
      const modInfoJson = parser.parse(xmlContent);

      modsInfo.push({
        modName: modDir.name,
        modInfoPath,
        modInfo: modInfoJson,
      });
    } else {
      console.warn(`No .modinfo found in ${modDir.name}`);
    }
  }

  console.log('All mods info:', modsInfo);
  return modsInfo;
}
