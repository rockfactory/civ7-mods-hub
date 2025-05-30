import { invoke } from '@tauri-apps/api/core';
import { ModInfo } from '../../home/IModInfo';

/**
 * Invokes `backup_mod_to_temp` to create a backup of the given mod folder in the temp directory.
 * @param modPath Path of the mod folder to back up.
 * @returns The path to the created temp backup folder.
 */
export async function invokeBackupModToTemp(modPath: string): Promise<string> {
  return await invoke<string>('backup_mod_to_temp', { modPath });
}

/**
 * Invokes `restore_mod_from_temp` to restore a mod folder from a previously created temp backup.
 * @param modsFolderPath The destination mods folder path.
 * @param tempBackupPath The temporary backup folder path.
 */
export async function invokeRestoreModFromTemp(
  modsFolderPath: string,
  tempBackupPath: string
): Promise<void> {
  return await invoke('restore_mod_from_temp', {
    modsFolderPath,
    tempBackupPath,
  });
}

/**
 * Invokes `cleanup_backup` to delete a temporary backup folder.
 * @param tempBackupPath The path to the backup folder to delete.
 */
export async function invokeCleanupModBackup(
  tempBackupPath: string
): Promise<void> {
  try {
    await invoke('cleanup_mod_backup', { tempBackupPath });
  } catch (error) {
    console.error('HIGH: Failed to cleanup mod backup:', error);
    // We don't want to throw an error here, as it's not critical to the operation.
  }
}

export async function invokeScanCivMods(modsFolderPath: string) {
  return await invoke<ModInfo[]>('scan_civ_mods', {
    modsFolderPath,
  });
}

export interface CivModsProperties {
  target_modinfo_id: string | undefined;
  target_modinfo_path: string | undefined;
  internal_version_id: string;
  mod_url: string;
  mod_version?: string;
  mod_category?: string;
  mod_version_date?: string;
}

/**
 * Patches a modinfo XML file by injecting CivMods properties
 * and creating a diff patch for later restoration.
 *
 * @param modinfoPath Absolute path to the modinfo.xml file.
 * @param civProperties An object containing CivMods metadata to inject.
 */
export async function invokePatchModinfoXml(
  modinfoPath: string,
  civProperties: CivModsProperties
): Promise<void> {
  return await invoke('patch_modinfo_xml_command', {
    modinfoPath,
    civProperties,
  });
}

export async function invokeExtractModArchive(data: {
  archivePath: string;
  extractPath: string;
  properties: CivModsProperties;
}): Promise<string> {
  return await invoke<string>('extract_mod_archive', data);
}
