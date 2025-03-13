import { notifications } from '@mantine/notifications';
import { ModData, ModInfo } from '../home/IModInfo';
import { ModVersionsRecord } from '../pocketbase-types';
import { installMod, uninstallMod } from './installMod';
import { useModsContext } from './ModsContext';
import { useCallback, useMemo, useState } from 'react';

export interface IModUpdate {
  mod: ModData;
  targetVersion?: ModVersionsRecord;
}

export function checkUpdates(mods: ModData[]) {
  let needUpdates: IModUpdate[] = [];

  const installedMods = mods.filter((m) => m.local != null);

  for (const installedMod of installedMods) {
    const latestVersion =
      installedMod.fetched.expand?.mod_versions_via_mod_id[0];

    if (!latestVersion) {
      console.warn(`Mod ${installedMod.fetched.name} has no versions`);
      continue;
    }

    // We don't want to update unknown mods automatically
    if (installedMod.isUnknown) {
      continue;
    }

    if (latestVersion?.hash !== installedMod.local!.folder_hash) {
      needUpdates.push({
        mod: installedMod,
        targetVersion: latestVersion,
      });
    }
  }

  return needUpdates;
}

export function useApplyUpdates() {
  const { mods, install, uninstall, triggerReload } = useModsContext();

  const [isUpdating, setIsUpdating] = useState(false);

  const availableUpdates = useMemo(() => {
    return checkUpdates(mods);
  }, [mods]);

  const applyUpdates = useCallback(async () => {
    setIsUpdating(true);

    let errors = [];
    for (const update of availableUpdates) {
      console.log('Applying update:', update.mod.fetched.id);
      try {
        if (update.mod.local) {
          await uninstall(update.mod);
        }
        await install(update.mod, update.targetVersion!);
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

    triggerReload();
    setIsUpdating(false);
    return errors;
  }, [availableUpdates, install, triggerReload, uninstall]);

  return {
    applyUpdates,
    availableUpdates,
    isUpdating,
  };
}
