import { ModVersionsRecord } from '@civmods/parser';
import { FetchedModule, FetchedVersion, ModData } from '../../home/IModInfo';

export interface ModInstallTarget {
  mod: ModData;
  version: FetchedVersion | undefined;
  modules?: FetchedModule[] | undefined;
}

export type DependencyInfo = {
  /**
   * Modinfo ID of the mod
   */
  id: string;
  modData?: ModData;
  targetVersion?: FetchedVersion;
  /**
   * If a mod is present in the fetched list
   * (i.e. it exists in the database)
   */
  isPresent: boolean;
  /**
   * If a mod is installed locally
   * (i.e. it exists in the mods folder)
   */
  isInstalled: boolean;
  shouldInstall: boolean;
};
