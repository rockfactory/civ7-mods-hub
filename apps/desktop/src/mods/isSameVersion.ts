import { ModInfo } from '../home/IModInfo';
import { ModVersionsRecord } from '../pocketbase-types';

export function isSameVersion(
  version: ModVersionsRecord | undefined,
  local: ModInfo | null | undefined
) {
  if (!version || !local) return false;
  return version.hash_stable === local.folder_hash;
}
