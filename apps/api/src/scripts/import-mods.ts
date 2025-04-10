import { pb } from '../core/pocketbase';
import fs from 'fs/promises';

async function importMods() {
  const allMods = await fs.readFile(
    './apps/api/src/mods/civ7_mods.json',
    'utf-8'
  );

  (await pb.collection('mod_versions').getFullList()).forEach(
    async (record) => {
      await pb.collection('mod_versions').delete(record.id);
    }
  );
  (await pb.collection('mods').getFullList()).forEach(async (record) => {
    await pb.collection('mods').delete(record.id);
  });

  // await pb.collection('mods').delete();
  const mods = JSON.parse(allMods);
  for (const mod of mods) {
    console.log(`Importing mod: ${mod.modName}`);
    const modRecord = await pb.collection('mods').create({
      mod_updated: new Date(mod.versions[0].date),
      name: mod.modName,
      author: mod.modAuthor,
      rating: parseFloat(mod.rating),
      short_description: mod.shortDescription,
      url: mod.modPageUrl,
    });

    for (const version of mod.versions) {
      await pb.collection('mod_versions').create({
        name: version.version,
        rating: parseFloat(version.rating),
        download_url: version.downloadUrl,
        mod_id: modRecord.id,
      });
    }
  }
}

importMods()
  .then(() => {
    console.log('Mods imported successfully');
  })
  .catch((err) => {
    console.error('Failed to import mods:', err);
  });
