import type { FetchedMod, FetchedVersion, ModInfo } from '../home/IModInfo';
import type { ModVersionsRecord } from '@civmods/parser';

export function isSameVersion(
  version: ModVersionsRecord | undefined,
  local: ModInfo | null | undefined
) {
  if (!version || !local) return false;
  return version.hash_stable === local.folder_hash;
}

/**
 * Returns all the modules of a version that match the given modinfo_ids.
 * If no modules match, returns undefined.
 */
export function filterVersionModulesByIds(
  version: FetchedVersion,
  modinfoIds: string[]
) {
  const modules = version.modules.filter(
    (module) =>
      module.modinfo_id != null && modinfoIds.includes(module.modinfo_id)
  );
  return modules.length ? modules : undefined;
}
