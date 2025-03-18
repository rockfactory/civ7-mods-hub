import {
  ModsRecord,
  ModVersionsRecord,
  ModVersionsResponse,
} from '../../../../desktop/src/pocketbase-types';
import { pb } from '../../core/pocketbase';
import { getModIdFromUrl, getVersionIdFromUrl } from './cfIds';
import { extractAndStoreModVersionMetadata } from './extractAndStoreModVersionMetadata';
import { ScrapeModsOptions, SyncMod } from './scrapeMods';

function syncModToModRecord(syncMod: SyncMod): Partial<ModsRecord> {
  return {
    name: syncMod.modName,
    author: syncMod.modAuthor,
    url: syncMod.modPageUrl,
    rating: parseFloat(syncMod.rating),
    short_description: syncMod.shortDescription,
    downloads_count: parseInt(syncMod.downloadsCount, 10),
    mod_updated: syncMod.updatedAt ? syncMod.updatedAt : undefined,
    mod_released: syncMod.releasedAt ? syncMod.releasedAt : undefined,
    category: syncMod.category,
    icon_url: syncMod.iconUrl,
    cf_id: getModIdFromUrl(syncMod.modPageUrl),
  };
}

export async function saveModToDatabase(
  options: ScrapeModsOptions,
  syncMod: SyncMod
) {
  if (options.skipSaveToDatabase) {
    return;
  }

  const modCfId = getModIdFromUrl(syncMod.modPageUrl);
  console.log(`Mod`, pb.filter('cf_id = {:cf_id}', { cf_id: modCfId }));

  let mod = await pb
    .collection('mods')
    .getList(1, 1, {
      filter: pb.filter('cf_id = {:cf_id}', { cf_id: modCfId }),
    })
    .then((mods) => (mods.items.length > 0 ? mods.items[0] : null));

  // If mod doesn't exist, create it. If it does, update it.
  if (!mod) {
    console.log(`Creating new mod: ${syncMod.modName} (${syncMod.modPageUrl})`);
    mod = await pb.collection('mods').create({
      ...syncModToModRecord(syncMod),
    } as Partial<ModsRecord>);
  } else {
    console.log(
      `Mod already exists, updating: ${syncMod.modName} (${syncMod.modPageUrl})`
    );
    mod = await pb.collection('mods').update(mod.id, {
      ...syncModToModRecord(syncMod),
    } as Partial<ModsRecord>);
  }

  if (!mod) {
    throw new Error(`Failed to create or update mod: ${syncMod.modName}`);
  }

  // Process versions
  let isNewVersionsAvailable = false;
  let processableVersions: ModVersionsResponse[] = [];

  const syncVersions = syncMod.versions || [];
  for (let i = 0; i < syncVersions.length; i++) {
    const syncVersion = syncVersions[i];

    const versionCfId = getVersionIdFromUrl(syncVersion.downloadUrl);
    let version = await pb
      .collection('mod_versions')
      .getList(1, 1, {
        filter: pb.filter('mod_id = {:mod_id} && cf_id = {:cf_id}', {
          mod_id: mod.id,
          cf_id: versionCfId,
        }),
      })
      .then((versions) =>
        versions.items.length > 0 ? versions.items[0] : null
      );

    if (!version) {
      isNewVersionsAvailable = true;
      console.log(
        `Creating new version: ${syncVersion.version} for mod ${syncMod.modName}`
      );
      version = await pb.collection('mod_versions').create({
        mod_id: mod.id,
        name: syncVersion.version,
        rating: parseFloat(syncVersion.rating),
        download_url: syncVersion.downloadUrl,
        released: syncVersion.date,
        is_processing: true,
        cf_id: getVersionIdFromUrl(syncVersion.downloadUrl),
      } as Partial<ModVersionsRecord>);

      if (!version) {
        throw new Error(
          `Failed to create version: ${syncVersion.version} for mod ${syncMod.modName}`
        );
      }

      processableVersions.push(version);
    } else {
      console.log(
        `Version already exists, updating: ${syncVersion.version} for mod ${syncMod.modName}`
      );
      version = await pb.collection('mod_versions').update(version.id, {
        name: syncVersion.version,
        rating: parseFloat(syncVersion.rating),
        download_url: syncVersion.downloadUrl,
        released: syncVersion.date,
        cf_id: getVersionIdFromUrl(syncVersion.downloadUrl),
      });

      if (!version) {
        throw new Error(
          `Failed to update version: ${syncVersion.version} for mod ${syncMod.modName}`
        );
      }

      if (version.is_processing || options.forceExtractAndStore) {
        // Stuck
        console.log(`Version is stuck, reprocessing: ${syncVersion.version}`);
        processableVersions.push(version);
      }
    }
  }

  if (
    (isNewVersionsAvailable && !options.skipExtractAndStore) ||
    options.forceExtractAndStore
  ) {
    for (const version of processableVersions) {
      console.log(`[mod=${mod.name}] Processing new version: ${version.name}`);
      await extractAndStoreModVersionMetadata(options, mod, version);
    }
  }

  // If no new versions were added, and we're not forcing extraction,
  // we can skip the rest of the process
  let shouldStopProcessing =
    !isNewVersionsAvailable &&
    options.stopAfterLastModVersion &&
    !options.forceExtractAndStore;

  return shouldStopProcessing;
}
