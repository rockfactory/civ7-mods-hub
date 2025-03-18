import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/store';

export async function getActiveModsFolder(): Promise<string | null> {
  return (
    useAppStore.getState().modFolder ||
    (await invoke<string | null>('get_mods_folder', {}))
  );
}
