import { useCallback, useRef } from 'react';
import { useModsContext } from '../../mods/ModsContext';
import { IShareableMod, unhashProfileCodes } from '@civmods/parser';
import { createNewProfile } from '../commands/createNewProfile';
import { modals } from '@mantine/modals';
import { Button, Center, Loader, Progress, Stack, Text } from '@mantine/core';
import { installMod, isModLocked } from '../../mods/installMod';
import { ModData } from '../../home/IModInfo';
import { notifications } from '@mantine/notifications';
import { getActiveModsFolder } from '../../mods/getModsFolder';
import { invokeScanCivMods } from '../../mods/commands/modsRustBindings';
import { computeModsData } from '../../mods/commands/computeModsData';
import { ImportProfileModalLoadingContent } from './ImportProfileModalLoadingContent';

type ImportResult = {
  status: 'warning' | 'error' | 'success';
  message: string;
};

export function useImportProfile() {
  // We don't use installed mods data here, just fetched.
  const { fetchedMods, triggerReload } = useModsContext();

  const isImportCanceled = useRef<boolean>(false);

  const cancelImport = useCallback(() => {
    isImportCanceled.current = true;
  }, []);

  const importProfile = useCallback(
    async (title: string, profileCode: string) => {
      isImportCanceled.current = false;

      if (!fetchedMods) {
        console.warn('No fetched mods data. cannot import profile: ' + title);
        return;
      }

      let modalId = modals.open({
        title: 'Importing profile',
        size: 'sm',
        withCloseButton: false,
        closeOnClickOutside: false,
        closeOnEscape: false,
        zIndex: 202,
        children: (
          <ImportProfileModalLoadingContent
            isCanceling={isImportCanceled.current}
            cancelImport={cancelImport}
            value={1}
            text="Preparing..."
          />
        ),
      });

      try {
        const modsFolder = await getActiveModsFolder();
        if (!modsFolder) {
          throw new Error('Could not get active mods folder');
        }

        const sharedProfile = unhashProfileCodes(profileCode);
        console.log(`Trying to import.. `, sharedProfile);

        if (isImportCanceled.current) {
          console.log('Import canceled');
          throw new Error('Import canceled');
        }

        // 1. Create a new profile
        const newProfile = await createNewProfile({
          title,
          // We want a new clean profile
          shouldDuplicate: false,
        });

        console.log(`New profile created for import: `, JSON.stringify(newProfile)); // prettier-ignore

        // 2. Refresh the locally installed mods
        const modsInfo = await invokeScanCivMods(modsFolder);
        const modsData = computeModsData({ fetchedMods, modsInfo });

        let results: ImportResult[] = [];

        let count = 0;
        let total = sharedProfile.ms.length;
        for (const sharedMod of sharedProfile.ms) {
          count++;

          if (isImportCanceled.current) {
            console.log('Import canceled');
            throw new Error('Import canceled');
          }

          // 2. Install mod
          const mod = findModDataMatchingShared(modsData, sharedMod);
          if (!mod || !mod.fetched) {
            console.error(`Mod not found: `, JSON.stringify(sharedMod));
            results.push({
              status: 'error',
              message: `Mod not found: ${sharedMod.cfid ?? sharedMod.mid}`,
            });
            continue;
          }

          const latestVersion = mod.fetched?.expand?.mod_versions_via_mod_id[0];
          if (!latestVersion) {
            console.error(`Mod has no versions: `, mod.fetched.name, mod.fetched.id, JSON.stringify(sharedMod)); // prettier-ignore
            results.push({
              status: 'error',
              message: `Mod has no versions: ${mod.fetched.name}`,
            });
            continue;
          }

          if (mod.local && isModLocked(mod.local)) {
            console.error(`Mod is locked: `, mod.fetched.name, mod.fetched.id);
            results.push({
              status: 'warning',
              message: `Will not install Locked Mod "${mod.fetched.name}"`,
            });
            continue;
          }

          try {
            modals.updateModal({
              modalId,
              children: (
                <ImportProfileModalLoadingContent
                  isCanceling={isImportCanceled.current}
                  cancelImport={cancelImport}
                  value={(count / total) * 100}
                  text={`Installing ${mod.fetched.name}...`}
                />
              ),
            });
            await installMod(mod, latestVersion);
          } catch (e) {
            console.error(
              `Failed to install mod: `,
              mod.fetched.name,
              mod.fetched.id,
              e
            );
            results.push({
              status: 'error',
              message: `Failed to install mod: ${mod.fetched.name}, ${e}`,
            });
          }
        }

        if (results.some((r) => r.status === 'error')) {
          notifications.show({
            title: 'Error importing profile',
            message: results.map((r) => r.message).join('\n'),
            color: 'red',
          });
          return;
        }

        const warnings = results.filter((r) => r.status === 'warning');

        notifications.show({
          title: 'Profile imported',
          message: `Profile has been imported successfully with ${
            sharedProfile.ms.length
          } mods.${
            warnings.length > 0
              ? ' Some mods were skipped: ' +
                warnings.map((r) => r.message).join(', ')
              : ''
          }`,
          color: warnings.length > 0 ? 'orange' : 'green',
        });
      } catch (e) {
        console.error(e);
        notifications.show({
          title: 'Error importing profile',
          message: String(e),
          color: 'red',
        });
      } finally {
        // No cleanup needed
        modals.close(modalId);
        triggerReload();
      }
    },
    [fetchedMods, triggerReload]
  );

  return { importProfile, cancelImport };
}

function findModDataMatchingShared(
  modsData: ModData[],
  sharedMod: IShareableMod
) {
  return modsData.find((m) => {
    // Search by CivFanatics ID
    if (sharedMod.cfid) {
      return m.fetched?.cf_id === sharedMod.cfid;
    }
    // Search by ModInfo ID
    if (sharedMod.mid) {
      return (
        m.fetched?.expand?.mod_versions_via_mod_id[0].modinfo_id ===
        sharedMod.mid
      );
    }
    return false;
  });
}
