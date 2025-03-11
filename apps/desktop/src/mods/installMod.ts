import {
  ModsResponse,
  ModVersionsRecord,
  ModVersionsResponse,
} from '../pocketbase-types';

export async function installMod(
  mod: ModsResponse<{ mod_versions_via_mod_id: ModVersionsResponse }>
) {}
