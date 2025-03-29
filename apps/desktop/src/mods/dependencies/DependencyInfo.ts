import { ModVersionsRecord } from '@civmods/parser';
import { ModData } from '../../home/IModInfo';

export interface ModInstallTarget {
  mod: ModData;
  version: ModVersionsRecord | undefined;
}

export type DependencyInfo = {
  /**
   * Modinfo ID of the mod
   */
  id: string;
  modData?: ModData;
  targetVersion?: ModVersionsRecord;
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
