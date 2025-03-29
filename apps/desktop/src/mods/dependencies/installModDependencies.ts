import { ModData } from '../../home/IModInfo';
import { installMod } from '../installMod';
import { DependencyInfo, ModInstallTarget } from './DependencyInfo';
import { getModDependencies } from './getModDependencies';

export async function installModDependencies(
  desiredMods: ModInstallTarget[],
  allMods: ModData[]
): Promise<DependencyInfo[]> {
  const dependencies = getModDependencies(desiredMods, allMods);
  if (dependencies.length === 0) return []; // No dependencies to install

  console.log('[deps] Installing mod dependencies:', dependencies.map(dep => dep.id)); // prettier-ignore

  let installed: DependencyInfo[] = [];
  for (const dependency of dependencies) {
    // Skip if not marked for installation
    if (!dependency.shouldInstall) {
      console.log(`[deps] Dependency ${dependency.id} will not be installed (already installed?: ${dependency.isInstalled}, present?: ${dependency.isPresent})`); // prettier-ignore
      continue;
    }

    // Skip if mod data is not available or not present in DB
    const mod = dependency.modData;
    if (!mod) {
      console.warn(`[deps] Dependency ${dependency.id} is not present in fetched mods`); // prettier-ignore
      continue;
    }

    if (!dependency.targetVersion) {
      console.warn(`[deps] No target version for dependency ${dependency.id} - cannot install`); // prettier-ignore
      continue;
    }

    try {
      await installMod(mod, dependency.targetVersion);
      installed.push(dependency);
    } catch (error) {
      console.error(
        `[deps] Failed to install dependency ${dependency.id}`,
        error
      );
      throw error; // Rethrow the error to handle it in the calling function
    }
  }

  console.log('[deps] All dependencies installed successfully');
  return installed;
}
