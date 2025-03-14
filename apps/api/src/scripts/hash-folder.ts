import path from 'path';
import { pb } from '../core/pocketbase';
import {
  computeFolderHash,
  EXTRACTED_DIR,
  findModInfoFile,
} from '../mods/utils/extractAndStoreModVersionMetadata';

async function hashFolder() {
  const version = await pb
    .collection('mod_versions')
    .getList(1, 1, {
      filter: pb.filter('download_url ~ {:pattern} && name ~ {:name}', {
        pattern: 'f1rst',
        name: '1.6.1',
      }),
    })
    .then((versions) => versions.items[0]);

  console.log(
    `Processing ${version.name} (${version.id}, ${version.download_url})`
  );
  const extractPath = path.join(EXTRACTED_DIR, version.id);
  const modInfoPath = await findModInfoFile(extractPath);
  if (!modInfoPath) {
    console.warn(`No .modinfo found in ${version.name}`);
    return;
  }

  // Compute extracted folder hash
  const folderHash = await computeFolderHash(path.dirname(modInfoPath));
  console.log(`Folder hash: ${folderHash}`);
}

hashFolder();
