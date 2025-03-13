import { pb } from '../core/pocketbase';
import fs from 'fs/promises';
import { getModIdFromUrl, getVersionIdFromUrl } from '../mods/utils/cfIds';
import { ModsRecord } from '../../../desktop/src/pocketbase-types';

async function fixCFIds() {
  const allMods = await pb.collection('mods').getList(1, 1000);
  const alreadyProcessed = new Set<string>();

  for (const mod of allMods.items) {
    if (alreadyProcessed.has(mod.cf_id)) {
      console.log(`Already processed CF ID: ${mod.cf_id}`);
      continue;
    }

    await pb.collection('mods').update(mod.id, {
      cf_id: getModIdFromUrl(mod.url),
    } as Partial<ModsRecord>);

    const sameIds = allMods.items.filter(
      (m) => m.cf_id === mod.cf_id && m.id !== mod.id
    );
    if (sameIds && sameIds.length > 0) {
      console.log(
        `Found ${sameIds.length} mods with the same CF ID: ${mod.cf_id}`,
        sameIds.map((m) => [
          m.id,
          m.name,
          new Date(m.created).toLocaleDateString(),
        ])
      );

      for (const sameMod of sameIds) {
        await pb.collection('mods').delete(sameMod.id);
        alreadyProcessed.add(sameMod.cf_id);
      }
    }
  }

  const alreadyProcessedVersions = new Set<string>();

  // Same for versions
  const allVersions = await pb.collection('mod_versions').getList(1, 1000);
  for (const version of allVersions.items) {
    if (alreadyProcessedVersions.has(version.cf_id)) {
      console.log(`Already processed CF ID: ${version.cf_id}`);
      continue;
    }

    await pb.collection('mod_versions').update(version.id, {
      cf_id: getVersionIdFromUrl(version.download_url),
    });

    const sameIds = allVersions.items.filter(
      (v) => v.cf_id === version.cf_id && v.id !== version.id
    );
    if (sameIds && sameIds.length > 0) {
      console.log(
        `Found ${sameIds.length} versions with the same CF ID: ${version.cf_id}`,
        sameIds.map((v) => [
          v.id,
          v.name,
          new Date(v.created).toLocaleDateString(),
        ])
      );

      for (const sameVersion of sameIds) {
        await pb.collection('mod_versions').delete(sameVersion.id);
        alreadyProcessedVersions.add(sameVersion.cf_id);
      }
    }
  }
}

fixCFIds()
  .then(() => console.log('Done!'))
  .catch(console.error);
