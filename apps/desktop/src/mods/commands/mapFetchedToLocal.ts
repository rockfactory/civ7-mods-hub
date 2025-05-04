import dayjs from 'dayjs';
import { FetchedMod, ModInfo } from '../../home/IModInfo';
import { ModVersionsRecord } from '@civmods/parser';

/**
 * Helper type that keeps track of the fetched mod and its versions.
 */
type FetchedModSpecificVersion = {
  fetchedMod: FetchedMod;
  version: ModVersionsRecord;
};

type ModVersionsMap = Array<FetchedModSpecificVersion>;

/**
 * Finds the first version of a mod that matches the local mod.
 * It checks the following:
 * 1. If the internal version ID is saved.
 * 2. If the modinfo ID and the hash match.
 * 3. If the modinfo ID matches.
 */
function findLocalMatchingVersion(
  allVersionsModMap: ModVersionsMap,
  local: ModInfo
): FetchedModSpecificVersion | undefined {
  // 1. Check if we saved the internal version ID.
  // This is the most reliable way to check if the mod is the same,
  // since we write it.
  const firstByInternalId = allVersionsModMap.find(
    (mod) => mod.version.id === local.civmods_internal_version_id
  );
  if (firstByInternalId) return firstByInternalId;

  // 2. Check if the modinfo_id and the hash match.
  // This is less reliable, but we can use it as a fallback.
  const firstByModinfoId = allVersionsModMap.find(
    (mod) =>
      mod.version.modinfo_id === local.modinfo_id &&
      mod.version.hash_stable === local.folder_hash
  );
  if (firstByModinfoId) return firstByModinfoId;

  // 3. Check if the modinfo_id matches.
  // This is the least reliable way to check if the mod is the same.
  // It may be the same mod, but with a different hash, e.g. "redux" updates
  // to a discontinued mod by another author.
  const firstByModinfoIdOnly = allVersionsModMap.find(
    (mod) => mod.version.modinfo_id === local.modinfo_id
  );
  if (firstByModinfoIdOnly) return firstByModinfoIdOnly;
}

export function mapFetchedToLocal(
  fetchedMods: FetchedMod[],
  modsInfo: ModInfo[]
): Map<string, ModInfo[]> {
  const fetchedToLocalMap = new Map<string, ModInfo[]>();

  // Get all versions, sorted by release date. The idea is having the _first_ version
  // be the first one released, so we can associate the local mod to the first version
  // with the same modinfo_id.
  const allVersionsModMap: ModVersionsMap = [];
  for (const fetchedMod of fetchedMods) {
    const modVersions = fetchedMod.expand?.mod_versions_via_mod_id ?? [];
    for (const version of modVersions) {
      allVersionsModMap.push({
        fetchedMod,
        version,
      });
    }
  }

  // Compare by date (ISO string)
  allVersionsModMap.sort((a, b) => {
    return dayjs(a.version.released).diff(
      dayjs(b.version.released),
      'millisecond',
      true
    );
  });

  // Map local mods to fetched mods
  for (const local of modsInfo) {
    // Get the first version that matches the local mod
    const firstMatchingVersion = findLocalMatchingVersion(
      allVersionsModMap,
      local
    );
    if (!firstMatchingVersion) continue;

    const fetchedMod = firstMatchingVersion.fetchedMod;
    if (!fetchedToLocalMap.has(fetchedMod.id))
      fetchedToLocalMap.set(fetchedMod.id, []);

    fetchedToLocalMap.get(fetchedMod.id)?.push(local);
  }

  return fetchedToLocalMap;
}
