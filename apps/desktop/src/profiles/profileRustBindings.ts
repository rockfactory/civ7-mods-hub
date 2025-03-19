import { invoke } from '@tauri-apps/api/core';

export async function listProfiles(): Promise<string[]> {
  return await invoke<string[]>('list_profiles');
}

export async function copyModsToProfile(
  modsFolderPath: string | null,
  /**
   * List of modinfo ids NOT to copy (locked). This allows us to exclude
   * specific mods, especially _locked_ mods.
   */
  lockedIds: string[],
  profileFolderName: string,
  /**
   * Removes copied mods from the source folder after copying.
   */
  cleanup: boolean = false
): Promise<void> {
  return await invoke('copy_mods_to_profile', {
    modsFolderPath,
    lockedIds,
    profileFolderName,
    cleanup,
  });
}

export async function restoreModsFromProfile(
  modsFolderPath: string,
  profileFolderName: string,
  dryRun: boolean = false
): Promise<void> {
  return await invoke('restore_mods_from_profile', {
    modsFolderPath,
    profileFolderName,
    dryRun,
  });
}

export async function invokeDeleteProfile(
  profileFolderName: string
): Promise<void> {
  return await invoke('delete_profile', { profileFolderName });
}
