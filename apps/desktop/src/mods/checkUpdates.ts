import { notifications } from '@mantine/notifications';
import { ModInfo } from '../home/IModInfo';
import { ModVersionsRecord } from '../pocketbase-types';
import { installMod, uninstallMod } from './installMod';
import { FetchedMod } from './ModBox';

export interface IModUpdate {
  mod: FetchedMod;
  modInfo: ModInfo;
  installedVersion: ModVersionsRecord | undefined;
  latestVersion: ModVersionsRecord;
  isUnknown: boolean;
}

export function checkUpdates(mods: FetchedMod[], modsInfo: ModInfo[]) {
  let needUpdates: IModUpdate[] = [];

  for (const modInfo of modsInfo) {
    const fetchedMod = mods.find(
      (m) =>
        m.expand?.mod_versions_via_mod_id[0]?.modinfo_id === modInfo.modinfo_id
    );

    if (!fetchedMod) {
      continue;
    }

    const installedVersion = fetchedMod.expand?.mod_versions_via_mod_id.find(
      (version) => version.hash === modInfo.folder_hash
    );
    const latestVersion = fetchedMod.expand?.mod_versions_via_mod_id[0];
    if (!latestVersion) {
      console.warn(`Mod ${fetchedMod.id} has no versions`);
      continue;
    }

    if (latestVersion?.hash !== modInfo.folder_hash) {
      needUpdates.push({
        mod: fetchedMod,
        modInfo: modInfo,
        installedVersion: installedVersion,
        latestVersion: latestVersion,
        isUnknown: installedVersion == null,
      });
    }
  }

  return needUpdates;
}

export async function applyUpdates(updates: IModUpdate[]) {
  let errors = [];
  for (const update of updates) {
    console.log('Applying update:', update.mod.id);
    try {
      if (update.modInfo) {
        await uninstallMod(update.modInfo);
      }
      await installMod(update.latestVersion);
    } catch (error) {
      errors.push(error);
      console.error('Failed to apply update:', error);
    }
  }

  if (errors.length > 0) {
    notifications.show({
      color: 'red',
      title: 'Failed to apply updates',
      message: 'Some updates failed to apply: ' + errors.join(', '),
      autoClose: 15000,
    });
  } else {
    notifications.show({
      color: 'green',
      title: 'Updates applied',
      message: 'All updates applied successfully',
      autoClose: 5000,
    });
  }

  return errors;
}
