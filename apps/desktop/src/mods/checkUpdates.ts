import { notifications } from '@mantine/notifications';
import { ModData, ModInfo } from '../home/IModInfo';
import { ModVersionsRecord } from '@civmods/parser';
import { useModsContext } from './ModsContext';
import { useCallback, useMemo, useState } from 'react';
import { isSameVersion } from './isSameVersion';
import { useAppStore } from '../store/store';
import { installMod } from './installMod';

export interface IModUpdate {
  mod: ModData;
  targetVersion?: ModVersionsRecord;
}

export function checkUpdates(mods: ModData[], lockedModIds: Set<string>) {
  let needUpdates: IModUpdate[] = [];

  const installedMods = mods.filter((m) => m.local != null);

  for (const installedMod of installedMods) {
    if (lockedModIds.has(installedMod.local?.modinfo_id ?? '')) {
      continue;
    }

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

    if (!isSameVersion(latestVersion, installedMod.local)) {
      needUpdates.push({
        mod: installedMod,
        targetVersion: latestVersion,
      });
    }
  }

  return needUpdates;
}

export function useApplyUpdates() {
  const { mods, triggerReload } = useModsContext();

  const [isUpdating, setIsUpdating] = useState(false);

  const lockedModIds = useAppStore((state) => state.lockedModIds);

  const availableUpdates = useMemo(() => {
    return checkUpdates(mods, new Set(lockedModIds ?? []));
  }, [mods, lockedModIds]);

  const applyUpdates = useCallback(async () => {
    setIsUpdating(true);

    const lockedModIds = new Set(useAppStore.getState().lockedModIds ?? []);

    let errors = [];
    for (const update of availableUpdates) {
      console.log('Applying update:', update.mod.fetched.id);
      try {
        if (lockedModIds.has(update.mod.local?.modinfo_id ?? '')) {
          console.warn('Skipping locked mod:', update.mod.fetched.name, update.mod.local?.modinfo_id); // prettier-ignore
          continue;
        }

        // Install already handles uninstalling the previous version
        await installMod(update.mod, update.targetVersion!);
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
  }, [availableUpdates, triggerReload]);

  return {
    applyUpdates,
    availableUpdates,
    isUpdating,
  };
}
