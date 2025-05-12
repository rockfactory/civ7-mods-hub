import { ModsRecord, ModsResponse, ModVersionsRecord } from '@civmods/parser';

export type FetchedModule = ModVersionsRecord & {
  _brand: 'Module';
};

export type FetchedVersion = ModVersionsRecord & {
  _brand: 'Version';
  modules: FetchedModule[];
  /**
   * List of modinfo IDs that this version contains.
   */
  modinfoIds: string[];
  hasMultipleModules: boolean;

  is_variant: false;
  version_parent_id: undefined;
};

export type FetchedMod = Omit<ModsResponse<{}>, 'versions'> & {
  versions: FetchedVersion[];

  /**
   * @protected Use this only if you know what you're doing.
   * This is the raw data from the server. It contains all the mod versions,
   * which are both "Versions" and "Modules".
   */
  _rawVersions: ModVersionsRecord[];
};

export type RawFetchedMod = ModsResponse<{
  mod_versions_via_mod_id: ModVersionsRecord[];
}>;

export interface ModInfo {
  /**
   * @deprecated This is the folder name, use `folder_name` instead
   */
  mod_name: string;
  modinfo_path?: string;
  modinfo_id?: string;
  folder_hash: string;
  /**
   * Path to the specific mod folder. It contains only one submod (variant)
   * and its `.modinfo` XML file.
   */
  folder_name: string;
  /**
   * Path to the mod folder. It may contain multiple submods (variants).
   */
  root_folder_name: string;
  civmods_internal_version_id?: string;
}

export type ModDependency = {
  id: string;
};

export interface ModLocal {
  modinfo: ModInfo;
  version: FetchedVersion | null | undefined;
  /**
   * Module version that is installed in the modinfo folder.
   */
  module: FetchedModule | null | undefined;
  isUnknown: boolean;
}

export type ModData = {
  fetched?: FetchedMod;
  locals: ModLocal[];
  installedVersion?: FetchedVersion;
  isUnknown: boolean;
  isLocalOnly: boolean;
  dependedBy: string[];
  dependsOn: string[];
  id: string;
  name: string;
  modinfoIds: string[];
  areDependenciesSatisfied: boolean;
};
