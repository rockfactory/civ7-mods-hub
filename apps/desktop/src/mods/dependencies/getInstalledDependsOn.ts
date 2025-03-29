import { ModData } from '../../home/IModInfo';

/**
 * Get all mods that are installed and are dependencies of the given mod.
 */
export function getInstalledDependsOn(mod: ModData, allMods: ModData[]) {
  const dependsOn = mod.dependsOn
    .map((id) => allMods.find((m) => m.modinfo_id === id))
    .filter(Boolean) as ModData[];
  const installedDependsOn = dependsOn.filter((m) => m.local != null);
  return installedDependsOn;
}

/**
 * Get all mods that are installed and depend on the given mod.
 */
export function getInstalledDependedBy(
  mod: ModData,
  allMods: ModData[]
): ModData[] {
  const dependedBy = mod.dependedBy
    .map((id) => allMods.find((m) => m.modinfo_id === id))
    .filter(Boolean) as ModData[];
  const installedDependedBy = dependedBy.filter((m) => m.local != null);
  return installedDependedBy;
}

/**
 * Get all the mods needed by the given mod, which are not installed.
 */
export function getNotInstalledDependsOn(
  mod: ModData,
  allMods: ModData[]
): ModData[] {
  const dependsOn = mod.dependsOn
    .map((id) => allMods.find((m) => m.modinfo_id === id))
    .filter(Boolean) as ModData[];
  const notInstalledDependsOn = dependsOn.filter((m) => m.local == null);
  return notInstalledDependsOn;
}
