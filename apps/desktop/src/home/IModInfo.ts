import { ModsResponse, ModVersionsRecord } from '../pocketbase-types';

export type FetchedMod = ModsResponse<{
  mod_versions_via_mod_id: ModVersionsRecord[];
}>;

export interface ModInfo {
  mod_name: string;
  modinfo_path?: string;
  modinfo_id?: string;
  folder_hash: string;
}

export type ModData = {
  fetched: FetchedMod;
  local: ModInfo | null;
  installedVersion?: ModVersionsRecord;
  isUnknown: boolean;
};
