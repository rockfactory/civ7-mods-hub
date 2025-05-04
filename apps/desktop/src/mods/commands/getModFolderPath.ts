import { ModInfo } from '../../home/IModInfo';
import * as fs from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';

export async function getModFolderPath(
  modsFolderPath: string,
  modInfo: ModInfo
) {
  return await path.join(modsFolderPath, modInfo.folder_name);
}
