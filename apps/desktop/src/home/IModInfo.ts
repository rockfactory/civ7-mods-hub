import { ModsResponse, ModVersionsRecord } from '@civmods/parser';

export type FetchedMod = ModsResponse<{
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
  version: ModVersionsRecord | null | undefined;
  isUnknown: boolean;
}

export type ModPrimaryVersionRecord = ModVersionsRecord & {
  is_variant: false;
  version_parent_id: undefined;
};

export type ModVariantVersionRecord = ModVersionsRecord & {
  is_variant: true;
  version_parent_id: string;
};

export interface ModDataVersion {
  modinfoIds: string[];
  primary: ModPrimaryVersionRecord;
  variants: ModVariantVersionRecord[] | null;
  versions: ModVersionsRecord[];
  hasVariants: boolean;
}

export type ModData = {
  fetched?: FetchedMod;
  locals: ModLocal[] | null;
  installedVersion?: ModDataVersion;
  availableVersions?: ModDataVersion[];
  isUnknown: boolean;
  isLocalOnly: boolean;
  dependedBy: string[];
  dependsOn: string[];
  id: string;
  name: string;
  modinfoIds?: string[];
  areDependenciesSatisfied: boolean;
};
