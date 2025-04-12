import { invoke } from '@tauri-apps/api/core';

export async function invokeIsCiv7Running(): Promise<boolean> {
  const isRunning = await invoke<boolean>('is_civ7_running');
  return isRunning;
}

export interface GameInstallation {
  method: 'Steam' | 'Epic' | 'Other';
  path: string;
}

export async function invokeFindCiv7Installation(): Promise<GameInstallation | null> {
  const installation = await invoke<GameInstallation | null>(
    'find_civ7_installation'
  );
  return installation;
}

export async function invokeLaunchCiv7(
  installation: GameInstallation
): Promise<void> {
  await invoke('launch_civ7', { installation });
}
