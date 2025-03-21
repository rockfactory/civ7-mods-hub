import { appDataDir, join } from '@tauri-apps/api/path';
import { getActiveModsFolder } from '../mods/getModsFolder';
import { useAppStore } from '../store/store';
import { ModProfile } from './ModProfile';
import { invokeScanCivMods } from '../mods/commands/modsRustBindings';
import { hashProfileCodes, IShareableMod } from '@civmods/parser';
import { ModData } from '../home/IModInfo';

export async function getProfileModsFolder(profileFolderName: string) {
  const appDataDirPath = await appDataDir();
  if (!appDataDirPath) {
    throw new Error('Could not get app data directory path');
  }
  const path = await join(appDataDirPath, 'profiles', profileFolderName);
  return path;
}

export async function generateProfileCode(
  modsData: ModData[],
  profile: ModProfile
): Promise<string> {
  const currentProfile = useAppStore.getState().currentProfile;

  const folderPath =
    currentProfile === profile.folderName
      ? await getActiveModsFolder()
      : await getProfileModsFolder(profile.folderName);

  if (!folderPath) {
    console.error('Could not get mods folder path', profile.folderName, 'current', currentProfile); // prettier-ignore
    throw new Error('Could not get mods folder path');
  }

  const modsInfo = await invokeScanCivMods(folderPath);
  if (!modsInfo) {
    throw new Error('Could not get mods info');
  }

  // Generate profile code
  const mods: IShareableMod[] = modsInfo
    .map((mod) => {
      if (!mod.modinfo_id) {
        console.error('Mod has no modinfo_id', JSON.stringify(mod));
        return;
      }

      const fetchedMod = modsData.find(
        (m) =>
          m.fetched?.expand?.mod_versions_via_mod_id[0].modinfo_id ===
          mod.modinfo_id
      );
      if (!fetchedMod?.fetched?.cf_id) {
        console.error('Could not find fetched mod', mod.modinfo_id, fetchedMod?.fetched.id); // prettier-ignore
        return;
      }

      return {
        cfid: fetchedMod.fetched.cf_id,
        // v: mod.version, // Not used, install latest
      } as IShareableMod;
    })
    .filter((m) => m != null) as IShareableMod[];

  const code = hashProfileCodes(mods, profile.title);
  console.log('Generated profile code:', code);
  return code.compressed;
}
