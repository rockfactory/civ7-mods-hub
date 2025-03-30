import type { FetchedMod, ModInfo } from '../home/IModInfo';
import type { ModVersionsRecord } from '@civmods/parser';

export function isSameVersion(
  version: ModVersionsRecord | undefined,
  local: ModInfo | null | undefined
) {
  if (!version || !local) return false;
  return version.hash_stable === local.folder_hash;
}

export function getLatestVersionMatchingLocal(
  mod: FetchedMod | undefined,
  local: ModInfo | null | undefined
) {
  // 0. If the mod is not fetched, return null
  // This is the case for local-only mods
  if (!mod) return null;

  // 1. If the mod is not local, return the latest version from the fetched mod
  if (!local) return mod.expand?.mod_versions_via_mod_id[0] ?? null;

  // 2. If the mod is local, find the latest version that matches the local modinfo_id
  const latestById = mod.expand?.mod_versions_via_mod_id.find(
    (version) => version.modinfo_id === local.modinfo_id
  );
  if (latestById) return latestById;

  console.log(
    `No version found for modinfo_id ${local.modinfo_id}: using latest`
  );
  return mod.expand?.mod_versions_via_mod_id[0] ?? null;
}
