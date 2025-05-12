import { ModData, ModDependency } from '../../home/IModInfo';
import { DependencyInfo, ModInstallTarget } from './DependencyInfo';

function getModInfoId(mod: ModData): string | undefined {
  return mod.modinfo_id;
}

function createModDataMap(mods: ModData[]): Map<string, ModData> {
  return new Map(
    mods
      .filter((mod) => getModInfoId(mod) != null)
      .map((mod) => [getModInfoId(mod) as string, mod])
  );
}

/**
 * Get all dependencies of the given mods, excluding the mods themselves.
 */
export function getModDependencies(
  desiredMods: ModInstallTarget[],
  allMods: ModData[]
): DependencyInfo[] {
  const allModsMap = createModDataMap(allMods);

  const result: DependencyInfo[] = [];

  // Recursion tracker
  const visited = new Set<string>();

  // Make sure the dependencies are tracked _only_ once.
  // This is important because a mod can have multiple dependencies
  const added = new Set<string>();

  const desiredModIds = new Set(
    desiredMods
      .map((m) => m.version?.modinfo_id)
      .filter((id): id is string => !!id)
  );

  // Let's use a queue to process FIFO the dependencies.
  // We process the dependencies of the mods we want to install first.
  const queue: ModInstallTarget[] = [...desiredMods];

  while (queue.length > 0) {
    const currentMod = queue.shift();
    if (!currentMod) continue;

    const modinfoId =
      currentMod.version?.modinfo_id ?? currentMod.mod.modinfo_id;
    if (!modinfoId || visited.has(modinfoId)) continue;
    visited.add(modinfoId);

    const currentTargetVersion =
      currentMod.version ??
      currentMod.mod.installedVersion ??
      currentMod.mod.fetched?.versions[0];

    const dependencies = currentTargetVersion?.dependencies as
      | ModDependency[]
      | undefined;
    if (!dependencies) continue;

    for (const dep of dependencies) {
      if (visited.has(dep.id)) continue;

      const depMod = allModsMap.get(dep.id);
      const isPresent = depMod?.fetched != null;
      const isInstalled = (depMod?.locals.length ?? 0) > 0;

      // We want to install the dependency if:
      // 1. The dependency is not already in the list of desired mods
      // 2. The dependency is present in the DB (e.g. not game DLCs)
      // 3. The dependency is not already installed
      const shouldInstall =
        !desiredModIds.has(dep.id) && isPresent && !isInstalled;

      if (!added.has(dep.id)) {
        result.push({
          id: dep.id,
          modData: depMod,
          isPresent,
          isInstalled,
          shouldInstall,
          targetVersion: depMod?.fetched?.versions[0],
        });
        added.add(dep.id);
      }

      // If the dependency is not installed and is present in the DB,
      // we need to add it to the queue for processing.
      if (depMod) {
        queue.push({
          mod: depMod,
          // We don't want to specify a version here, since we want to use
          // the latest version available in the DB _or_ the installed version
          // if it's already installed.
          version: undefined,
        });
      }
    }
  }

  return result;
}
