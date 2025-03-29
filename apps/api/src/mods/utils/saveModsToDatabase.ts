import {
  ModsRecord,
  ModVersionsRecord,
  ModVersionsResponse,
} from '@civmods/parser';
import { pb } from '../../core/pocketbase';
import { getModIdFromUrl, getVersionIdFromUrl } from './cfIds';
import { extractAndStoreModVersionMetadata } from './extractAndStoreModVersionMetadata';
import { ScrapeModsOptions, SyncMod } from './scrapeMods';
import { DiscordLog } from '../../integrations/discord/DiscordLog';

function syncModToModRecord(syncMod: SyncMod): Partial<ModsRecord> {
  return {
    name: syncMod.modName,
    author: syncMod.modAuthor,
    url: syncMod.modPageUrl,
    rating: parseFloat(syncMod.rating),
    short_description: syncMod.shortDescription,
    downloads_count: parseInt(syncMod.downloadsCount.replace(/,/g, ''), 10),
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
    // We don't want to create mods on "list only" mode, since
    // we won't be able to process versions
    if (options.onlyListData) return;

    console.log(`Creating new mod: ${syncMod.modName} (${syncMod.modPageUrl})`);
    mod = await pb.collection('mods').create({
      ...syncModToModRecord(syncMod),
    } as Partial<ModsRecord>);
  } else {
    if (mod.is_hidden) {
      console.log(`Mod is hidden, skipping: ${syncMod.modName} (${syncMod.modPageUrl})`); // prettier-ignore
      return;
    }

    console.log(`Mod already exists, updating: ${syncMod.modName} (${syncMod.modPageUrl})`); // prettier-ignore
    mod = await pb.collection('mods').update(mod.id, {
      ...syncModToModRecord(syncMod),
    } as Partial<ModsRecord>);
  }

  if (!mod) {
    throw new Error(`Failed to create or update mod: ${syncMod.modName}`);
  }

  // If we're only listing data, we can skip the rest of the process
  if (options.onlyListData) return;

  // Process versions
  let processableVersions: ModVersionsResponse[] = [];
  let modVersions: string[] = [];

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

      modVersions.push(version.id);
      processableVersions.push(version);
    } else {
      console.log(
        `Version already exists, updating: ${syncVersion.version} for mod ${syncMod.modName}`
      );

      // FAKE
      // You can uncomment this block to create fake versions for testing purposes.
      // I used this to test the Back-relation expansion in Pocketbase.
      // 1000 records is the limit for a _single record_ (a mod), so we don't need to worry.
      // if (process.env.NODE_ENV === 'development') {
      //   for (let i = 0; i < 800; i++) {
      //     const fakeVersion = await pb.collection('mod_versions').create({
      //       mod_id: mod.id,
      //       name: `${syncVersion.version} (FAKE_VERSION)`,
      //       rating: parseFloat(syncVersion.rating),
      //       download_url: syncVersion.downloadUrl,
      //       released: syncVersion.date,
      //       is_processing: true,
      //       cf_id: getVersionIdFromUrl(syncVersion.downloadUrl),
      //     } as Partial<ModVersionsRecord>);
      //     modVersions.push(fakeVersion.id);
      //   }
      // }

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

      modVersions.push(version.id);
      if (version.is_processing || options.forceExtractAndStore) {
        // Stuck
        console.log(`Version is ${version.is_processing ? 'stuck' : 'forced'}, reprocessing: ${syncVersion.version}`); // prettier-ignore
        processableVersions.push(version);
      }
    }
  }

  console.log(`Updating mod versions for ${syncMod.modName}: ${modVersions.join(', ')}`); // prettier-ignore
  await pb.collection('mods').update(mod.id, {
    versions: modVersions,
  });

  const isNewVersionsAvailable = processableVersions.length > 0;

  if (isNewVersionsAvailable && !options.skipExtractAndStore) {
    for (const version of processableVersions) {
      console.log(`[mod=${mod.name}] Processing version: ${version.name}`);
      if (!options.forceExtractAndStore) {
        DiscordLog.onVersionProcessing(mod, version);
      }

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
