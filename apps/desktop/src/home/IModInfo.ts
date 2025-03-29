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
  folder_name: string;
}

export type ModDependency = {
  id: string;
};

export type ModData = {
  fetched?: FetchedMod;
  local: ModInfo | null | undefined;
  installedVersion?: ModVersionsRecord;
  isUnknown: boolean;
  isLocalOnly: boolean;
  dependedBy: string[];
  dependsOn: string[];
  id: string;
  name: string;
  modinfo_id?: string;
  areDependenciesSatisfied: boolean;
};
