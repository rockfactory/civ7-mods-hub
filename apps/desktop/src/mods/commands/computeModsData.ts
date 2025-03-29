import { FetchedMod, ModData, ModInfo } from '../../home/IModInfo';
import { isSameVersion } from '../isSameVersion';

export interface ComputeModsDataOptions {
  fetchedMods: FetchedMod[];
  modsInfo: ModInfo[];
}

export function computeModsData(options: ComputeModsDataOptions): ModData[] {
  const { fetchedMods, modsInfo } = options;

  const locallyFoundInFetched = new Set<string>();
  const dependencyMap = new Map<string, Set<string>>(); // modinfo_id -> modinfo_ids that depend on it
  const dependsOnMap = new Map<string, Set<string>>(); // modinfo_id -> modinfo_ids it depends on

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

    const local = modsInfo.find((info) => info.modinfo_id === modinfoId);

    if (local) {
      locallyFoundInFetched.add(local.folder_name);
    }

    const installedVersion = modVersions.find((version) =>
      isSameVersion(version, local)
    );

    const deps = latestVersion.dependencies as { id: string }[] | undefined;
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
