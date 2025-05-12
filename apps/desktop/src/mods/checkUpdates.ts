import { notifications } from '@mantine/notifications';
import {
  FetchedMod,
  FetchedModule,
  FetchedVersion,
  ModData,
  ModInfo,
} from '../home/IModInfo';
import { ModVersionsRecord } from '@civmods/parser';
import { useModsContext } from './ModsContext';
import { useCallback, useMemo, useState } from 'react';
import { useAppStore } from '../store/store';
import { installMod, isModLocalLocked } from './installMod';
import { installModDependencies } from './dependencies/installModDependencies';
import { filterVersionModulesByIds } from './isSameVersion';

export interface IModUpdate {
  mod: ModData;
  fetched: FetchedMod;
  targetVersion: FetchedVersion;
  /**
   * If we installed only _some_ of the modules, we
   * want to update only those modules that were installed
   * and not all of them..
   */
  targetModinfoIds?: string[];
  targetModules?: FetchedModule[];
}

export function checkUpdates(mods: ModData[], lockedModIds: Set<string>) {
  let needUpdates: IModUpdate[] = [];

  const installedMods = mods.filter((m) => m.locals.length > 0);

  for (const installedMod of installedMods) {
    if (isModLocalLocked(installedMod.locals)) {
      continue;
    }

    if (!installedMod.fetched) {
      continue;
    }

    const latestVersion = installedMod.fetched.versions[0];

    if (!latestVersion) {
      console.warn(`Mod ${installedMod.fetched?.name} has no matching versions`); // prettier-ignore
      continue;
    }

    // We don't want to update unknown mods automatically
    if (installedMod.isUnknown) {
      continue;
    }

    if (installedMod.installedVersion?.id !== latestVersion.id) {
      const installedModinfoIds = installedMod.locals
        .map((local) => local.modinfo.modinfo_id!)
        .filter(Boolean) as string[];

      // If the mod is installed _partially_ (some modules are installed, some are not),
      // we want to update _ONLY_ the modules that are installed.
      const shouldFilterModules =
        installedMod.installedVersion?.modules.length !==
        installedModinfoIds.length;

      // TODO We should check if the modinfos are available
      // in the latest version, and if not, we should install
      // _all_ modules instead of just the ones that are installed.

      needUpdates.push({
        mod: installedMod,
        fetched: installedMod.fetched,
        targetVersion: latestVersion,
        targetModinfoIds: shouldFilterModules ? installedModinfoIds : undefined,
        targetModules: shouldFilterModules
          ? filterVersionModulesByIds(latestVersion, installedModinfoIds)
          : undefined,
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

    // 1. Install dependencies first (only new ones)
    // If a dependency is already in the update list, it will be skipped
    // because it will be installed in the next step
    try {
      const installedDeps = await installModDependencies(
        availableUpdates.map((update) => ({
          mod: update.mod,
          version: update.targetVersion,
          modules: update.targetModules,
        })),
        mods
      );
      if (installedDeps.length > 0) {
        notifications.show({
          color: 'blue',
          title: 'Installed dependencies',
          message: `Installed ${installedDeps.length} missing dependencies`,
          autoClose: 5000,
        });
      }
    } catch (error) {
      errors.push(error);
      console.error('Failed to install dependencies:', error);
    }

    // 2. Install mods updates
    for (const update of availableUpdates) {
      console.log('Applying update:', update.fetched.id);
      try {
        if (isModLocalLocked(update.mod.locals)) {
          console.warn('Skipping locked mod:', update.fetched.name); // prettier-ignore
          continue;
        }

        // Install already handles uninstalling the previous version
        await installMod(update.mod, update.targetVersion!, {
          modules: update.targetModules,
        });
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
