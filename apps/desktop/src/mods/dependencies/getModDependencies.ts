import { ModData, ModDependency } from '../../home/IModInfo';

type DependencyInfo = {
  id: string;
  modData?: ModData;
  isPresent: boolean;
  isInstalled: boolean;
};

function getModInfoId(mod: ModData): string | undefined {
  return mod.fetched?.expand?.mod_versions_via_mod_id?.[0].modinfo_id;
}

function createModDataMap(mods: ModData[]): Map<string, ModData> {
  return new Map(
    mods
      .filter((mod) => getModInfoId(mod) != null)
      .map((mod) => [getModInfoId(mod) as string, mod])
  );
}

function getModDependenciesRecursive(
  mod: ModData,
  allModsMap: Map<string, ModData>,
  visited: Set<string>,
  result: DependencyInfo[]
) {
  if (visited.has(mod.id)) return;
  visited.add(mod.id);

  const latestVersion = mod.fetched?.expand?.mod_versions_via_mod_id?.[0];

  const dependencies = latestVersion?.dependencies as
    | ModDependency[]
    | undefined;

  if (!dependencies || dependencies.length === 0) return;

  for (const dependency of dependencies) {
    if (visited.has(dependency.id)) continue;

    const depMod = allModsMap.get(dependency.id);
    const isPresent = !!depMod;
    const isInstalled = !!depMod?.installedVersion;

    result.push({
      id: dependency.id,
      modData: depMod,
      isPresent,
      isInstalled,
    });

    if (depMod) {
      getModDependenciesRecursive(depMod, allModsMap, visited, result);
    }
  }
}

export function getModDependencies(
  desiredMods: ModData[],
  allMods: ModData[]
): DependencyInfo[] {
  const allModsMap = createModDataMap(allMods);
  const result: DependencyInfo[] = [];
  const visited = new Set<string>();

  for (const mod of desiredMods) {
    getModDependenciesRecursive(mod, allModsMap, visited, result);
  }

  return result;
}
