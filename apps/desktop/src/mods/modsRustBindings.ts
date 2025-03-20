import { invoke } from '@tauri-apps/api/core';
import { ModInfo } from '../home/IModInfo';

export async function invokeScanCivMods(modsFolderPath: string) {
  return await invoke<ModInfo[]>('scan_civ_mods', {
    modsFolderPath,
  });
}
