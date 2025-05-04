import dayjs from 'dayjs';
import {
  FetchedMod,
  ModData,
  ModInfo,
  ModLocal,
  ModPrimaryVersionRecord,
} from '../../home/IModInfo';
import { isSameVersion } from '../isSameVersion';
import { ModVersionsRecord } from '@civmods/parser';
import { mapFetchedToLocal } from './mapFetchedToLocal';
import { getModVersionsWithVariants } from './getModVersionsWithVariants';

export interface ComputeModsDataOptions {
  fetchedMods: FetchedMod[];
  modsInfo: ModInfo[];
}

export function computeModsData(options: ComputeModsDataOptions): ModData[] {
  const { fetchedMods, modsInfo } = options;

  const locallyFoundInFetched = new Set<string>();
  const dependencyMap = new Map<string, Set<string>>(); // modinfo_id -> modinfo_ids that depend on it
  const dependsOnMap = new Map<string, Set<string>>(); // modinfo_id -> modinfo_ids it depends on

  // We keep track of the fetche mods - local modinfos relationship here
  const fetchedToLocalMap = mapFetchedToLocal(fetchedMods, modsInfo);

  const fetchedMapped: ModData[] = fetchedMods.map((fetchedMod) => {
    const modVersions = fetchedMod.expand?.mod_versions_via_mod_id ?? [];
    const availableVersions = getModVersionsWithVariants(fetchedMod);
    const latest = availableVersions[0];
    // const latestVersion = modVersions.find(
    //   (v) => !v.is_variant
    // ) as ModPrimaryVersionRecord;
    // const modinfoId = latestVersion?.modinfo_id;

    if (!latest?.modinfoIds.length) {
      // If the modinfo_id is not present, we cannot map it to a local mod
      // and we cannot determine if it's installed or not.
      // This should not happen in a well-formed modinfo.
      return {
        id: fetchedMod.id,
        fetched: fetchedMod,
        locals: null,
        installedVersion: undefined,
        availableVersions,
        isUnknown: false,
        isLocalOnly: false,
        name: fetchedMod.name,
        modinfo_id: undefined,
        dependedBy: [],
        dependsOn: [],
        areDependenciesSatisfied: true,
      } as ModData;
    }

    const modinfos = fetchedToLocalMap.get(fetchedMod.id) ?? [];
    const locals: ModLocal[] = [];

    for (const modinfo of modinfos) {
      locallyFoundInFetched.add(modinfo.folder_name);

      const installedVersion = modVersions.find((version) =>
        isSameVersion(version, modinfo)
      );

      locals.push({
        modinfo,
        version: installedVersion,
        isUnknown: installedVersion == null,
      });
    }

    const installedVersions = locals
      .filter((local) => local.version != null)
      .map((local) => local.version) as ModVersionsRecord[];

    // We use only the _latest_, even if we could have multiple versions installed
    const installedVersion = availableVersions.find((v) =>
      v.versions.some((version) => installedVersions.includes(version))
    );

    // We want to track the dependencies of the installed version, if it exists,
    // since the user might have installed a specific version of the mod that has
    // _different_ dependencies than the latest version.
    // If the installed version is not found, we fall back to the latest version.
    const depsVersions =
      installedVersions.length > 0 ? installedVersions : latest.versions;
    const deps = depsVersions.flatMap((dv) => dv.dependencies) as
      | { id: string }[]
      | undefined;

    if (deps && deps.length > 0) {
      for (const dep of deps) {
        // TODO Maybe we should check `installedVersion` instead of `latest`?
        if (latest.modinfoIds.includes(dep.id)) {
          // We don't want to track dependencies that depend on themselves
          continue;
        }

        // modinfo_id → modinfo_id
        if (!dependencyMap.has(dep.id)) dependencyMap.set(dep.id, new Set());
        for (const modinfoId of latest.modinfoIds) {
          dependencyMap.get(dep.id)!.add(modinfoId);

          if (!dependsOnMap.has(modinfoId))
            dependsOnMap.set(modinfoId, new Set());
          dependsOnMap.get(modinfoId)!.add(dep.id);
        }
      }
    }

    return {
      id: fetchedMod.id,
      fetched: fetchedMod,
      installedVersion,
      availableVersions,
      locals,
      isUnknown: locals.some((local) => local.isUnknown),
      isLocalOnly: false,
      name: fetchedMod.name,
      // TODO Double check this
      modinfoIds: latest.modinfoIds,
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
      locals: [
        {
          modinfo: info,
          version: null,
          isUnknown: true,
        },
      ],
      installedVersion: undefined,
      availableVersions: undefined,
      isUnknown: true,
      isLocalOnly: true,
      name: info.modinfo_id ?? info.folder_name ?? 'Unknown mod',
      modinfoIds: [info.modinfo_id!],
      dependedBy: [],
      dependsOn: [],
      areDependenciesSatisfied: true,
    }));

  // ===========================
  // === Dependency tracking ===
  // ===========================
  const allMods: ModData[] = [...fetchedMapped, ...localOnly];
  const modinfoIdMap = new Map<string, ModData>();

  for (const mod of allMods) {
    mod.modinfoIds?.forEach((modinfo_id) => {
      modinfoIdMap.set(modinfo_id, mod);
    });
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
        // TODO We should probablu check the _specific_ installed version
        return (depMod.locals?.length ?? 0) > 0;
      });
    }
  }

  return allMods;
}
