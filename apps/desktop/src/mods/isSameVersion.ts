import type { ModInfo } from '../home/IModInfo';
import type { ModVersionsRecord } from '@civmods/parser';

export function isSameVersion(
  version: ModVersionsRecord | undefined,
  local: ModInfo | null | undefined
) {
  if (!version || !local) return false;
  return version.hash_stable === local.folder_hash;
}
