import dayjs from 'dayjs';
import { FetchedMod, ModData, ModInfo } from '../../home/IModInfo';
import { isSameVersion } from '../isSameVersion';

export interface ComputeModsDataOptions {
  fetchedMods: FetchedMod[];
  modsInfo: ModInfo[];
}

function mapFetchedToLocal(
  fetchedMods: FetchedMod[],
  modsInfo: ModInfo[]
): Map<string, ModInfo> {
  const fetchedToLocalMap = new Map<string, ModInfo>();

  // Get all versions, sorted by release date. The idea is having the _first_ version
  // be the first one released, so we can associate the local mod to the first version
  // with the same modinfo_id.
  const allVersionsModMap = [];
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
    const firstMatchingVersion = allVersionsModMap.find(
      (mod) =>
        // 1. Check if we saved the internal version ID. This is the most reliable way to check if the mod is the same, since we write it
        mod.version.id === local.civmods_internal_version_id ||
        // 2. Check if the modinfo_id matches. This is less reliable, but we can use it as a fallback.
        mod.version.modinfo_id === local.modinfo_id
    );
    if (!firstMatchingVersion) continue;

    // Get the first version that matches the local mod
    const fetchedMod = firstMatchingVersion.fetchedMod;
    fetchedToLocalMap.set(fetchedMod.id, local);
  }

  return fetchedToLocalMap;
}

export function computeModsData(options: ComputeModsDataOptions): ModData[] {
  const { fetchedMods, modsInfo } = options;

  const locallyFoundInFetched = new Set<string>();
  const dependencyMap = new Map<string, Set<string>>(); // modinfo_id -> modinfo_ids that depend on it
  const dependsOnMap = new Map<string, Set<string>>(); // modinfo_id -> modinfo_ids it depends on

  const fetchedToLocalMap = mapFetchedToLocal(fetchedMods, modsInfo);

  const fetchedMapped: ModData[] = fetchedMods.map((fetchedMod) => {
    const modVersions = fetchedMod.expand?.mod_versions_via_mod_id ?? [];
    const latestVersion = modVersions[0];
    const modinfoId = latestVersion?.modinfo_id;

    if (!modinfoId) {
      // If the modinfo_id is not present, we cannot map it to a local mod
      // and we cannot determine if it's installed or not.
      // This should not happen in a well-formed modinfo.
      return {
        id: fetchedMod.id,
        fetched: fetchedMod,
        local: undefined,
        installedVersion: undefined,
        isUnknown: false,
        isLocalOnly: false,
        name: fetchedMod.name,
        modinfo_id: undefined,
        dependedBy: [],
        dependsOn: [],
        areDependenciesSatisfied: true,
      };
    }

    const local = fetchedToLocalMap.get(fetchedMod.id) ?? null;
    if (local) {
      locallyFoundInFetched.add(local.folder_name);
    }

    const installedVersion = modVersions.find((version) =>
      isSameVersion(version, local)
    );

    // We want to track the dependencies of the installed version, if it exists,
    // since the user might have installed a specific version of the mod that has
    // _different_ dependencies than the latest version.
    // If the installed version is not found, we fall back to the latest version.
    const deps = (installedVersion ?? latestVersion).dependencies as
      | { id: string }[]
      | undefined;

    if (deps && deps.length > 0) {
      for (const dep of deps) {
        // modinfo_id → modinfo_id
        if (!dependencyMap.has(dep.id)) dependencyMap.set(dep.id, new Set());
        dependencyMap.get(dep.id)!.add(modinfoId);

        if (!dependsOnMap.has(modinfoId))
          dependsOnMap.set(modinfoId, new Set());
        dependsOnMap.get(modinfoId)!.add(dep.id);
      }
    }

    return {
      id: fetchedMod.id,
      fetched: fetchedMod,
      local,
      installedVersion,
      isUnknown: !installedVersion && local != null,
      isLocalOnly: false,
      name: fetchedMod.name,
      modinfo_id: modinfoId,
      dependedBy: [],
      dependsOn: [],
      areDependenciesSatisfied: true, // calculated later
    };
  });

  const localOnly: ModData[] = modsInfo
    .filter((info) => !locallyFoundInFetched.has(info.folder_name))
    .map((info) => ({
      id: info.folder_name + '-local',
      fetched: undefined,
      local: info,
      installedVersion: undefined,
      isUnknown: true,
      isLocalOnly: true,
      name: info.modinfo_id ?? info.folder_name ?? 'Unknown mod',
      modinfo_id: info.modinfo_id,
      dependedBy: [],
      dependsOn: [],
      areDependenciesSatisfied: true,
    }));

  const allMods: ModData[] = [...fetchedMapped, ...localOnly];
  const modinfoIdMap = new Map<string, ModData>();

  for (const mod of allMods) {
    if (mod.modinfo_id) {
      modinfoIdMap.set(mod.modinfo_id, mod);
    }
  }

  // Assign `dependedBy`
  for (const [depId, dependents] of dependencyMap.entries()) {
    const depMod = modinfoIdMap.get(depId);
    if (depMod) {
      depMod.dependedBy = Array.from(dependents);
    }
  }

  // Assign `dependsOn` and `areDependenciesSatisfied`
  for (const [modinfoId, deps] of dependsOnMap.entries()) {
    const mod = modinfoIdMap.get(modinfoId);
    if (mod) {
      const depsArray = Array.from(deps);
      mod.dependsOn = depsArray;

      mod.areDependenciesSatisfied = depsArray.every((depId) => {
        const depMod = modinfoIdMap.get(depId);
        if (!depMod) return true; // If the dependency is not found, we assume it's satisfied, e.g. DLCs
        return depMod.local != null;
      });
    }
  }

  return allMods;
}
