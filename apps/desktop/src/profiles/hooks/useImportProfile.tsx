import { useCallback } from 'react';
import { useModsContext } from '../../mods/ModsContext';
import { IShareableMod, unhashProfileCodes } from '@civmods/parser';
import { createNewProfile } from '../commands/createNewProfile';
import { modals } from '@mantine/modals';
import { Center, Loader } from '@mantine/core';
import { installMod } from '../../mods/installMod';
import { ModData } from '../../home/IModInfo';
import { notifications } from '@mantine/notifications';

export function useImportProfile() {
  const { mods: modsData } = useModsContext();

  return useCallback(
    async (title: string, profileCode: string) => {
      if (!modsData) return;

      let modalId = modals.open({
        title: 'Importing profile...',
        size: 'sm',
        children: (
          <Center>
            <Loader />
          </Center>
        ),
      });

      try {
        const sharedProfile = unhashProfileCodes(profileCode);
        console.log(`Trying to import.. `, sharedProfile);

        // 1. Create a new profile
        const newProfile = await createNewProfile({
          title,
          // We want a new clean profile
          shouldDuplicate: false,
        });

        let errors: string[] = [];

        for (const sharedMod of sharedProfile.ms) {
          // 2. Install mod
          const mod = findModDataMatchingShared(modsData, sharedMod);
          if (!mod) {
            console.error(`Mod not found: `, JSON.stringify(sharedMod));
            errors.push(`Mod not found: ${sharedMod.cfid ?? sharedMod.mid}`);
            continue;
          }

          const latestVersion = mod.fetched.expand?.mod_versions_via_mod_id[0];
          if (!latestVersion) {
            console.error(`Mod has no versions: `, mod.fetched.name, mod.fetched.id, JSON.stringify(sharedMod)); // prettier-ignore
            errors.push(`Mod has no versions: ${mod.fetched.name}`);
            continue;
          }

          try {
            await installMod(mod, latestVersion);
          } catch (e) {
            console.error(
              `Failed to install mod: `,
              mod.fetched.name,
              mod.fetched.id,
              e
            );
            errors.push(`Failed to install mod: ${mod.fetched.name}`);
          }
        }

        if (errors.length > 0) {
          throw new Error(errors.join('\n'));
        }

        notifications.show({
          title: 'Profile imported',
          message: `Profile has been imported successfully with ${sharedProfile.ms.length} mods`,
          color: 'green',
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
      }
    },
    [modsData]
  );
}

function findModDataMatchingShared(
  modsData: ModData[],
  sharedMod: IShareableMod
) {
  return modsData.find((m) => {
    // Search by CivFanatics ID
    if (sharedMod.cfid) {
      return m.fetched.cf_id === sharedMod.cfid;
    }
    // Search by ModInfo ID
    if (sharedMod.mid) {
      return (
        m.fetched.expand?.mod_versions_via_mod_id[0].modinfo_id ===
        sharedMod.mid
      );
    }
    return false;
  });
}
