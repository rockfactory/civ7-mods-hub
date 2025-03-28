import fs from 'fs/promises';
import path from 'path';

/**
 * Utility: Recursively list all files in a directory
 */
export async function getFilesRecursively(
  directory: string
): Promise<string[]> {
  let files: string[] = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const orderedEntries = entries.sort((a, b) => {
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();
    if (aLower < bLower) return -1;
    if (aLower > bLower) return 1;
    return 0;
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
