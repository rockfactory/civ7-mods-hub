import { FetchedMod, ModData, ModInfo } from '../../home/IModInfo';
import { getActiveModsFolder } from '../getModsFolder';
import { isSameVersion } from '../isSameVersion';
import { invokeScanCivMods } from './modsRustBindings';

export interface ComputeModsDataOptions {
  fetchedMods: FetchedMod[];
  modsInfo: ModInfo[];
}

export function computeModsData(options: ComputeModsDataOptions) {
  const { fetchedMods, modsInfo } = options;

  return fetchedMods.map((fetchedMod) => {
    const local = modsInfo.find(
      (info) =>
        info.modinfo_id ===
        fetchedMod.expand?.mod_versions_via_mod_id[0].modinfo_id
    );

    const installedVersion = fetchedMod.expand?.mod_versions_via_mod_id.find(
      (version) => isSameVersion(version, local)
    );

    return {
      fetched: fetchedMod,
      local,
      installedVersion,
      isUnknown: !installedVersion && local != null,
    } as ModData;
  });
}
