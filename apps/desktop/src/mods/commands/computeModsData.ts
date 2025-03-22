import { FetchedMod, ModData, ModInfo } from '../../home/IModInfo';
import { getActiveModsFolder } from '../getModsFolder';
import { isSameVersion } from '../isSameVersion';
import { invokeScanCivMods } from './modsRustBindings';

export interface ComputeModsDataOptions {
  fetchedMods: FetchedMod[];
  modsInfo: ModInfo[];
}

export function computeModsData(options: ComputeModsDataOptions): ModData[] {
  const { fetchedMods, modsInfo } = options;

  let locallyFoundInFetched = new Set<string>();

  const fetchedMapped: ModData[] = fetchedMods.map((fetchedMod) => {
    const local = modsInfo.find(
      (info) =>
        info.modinfo_id ===
        fetchedMod.expand?.mod_versions_via_mod_id[0].modinfo_id
    );

    if (local) {
      locallyFoundInFetched.add(local.folder_name);
    }

    const installedVersion = fetchedMod.expand?.mod_versions_via_mod_id.find(
      (version) => isSameVersion(version, local)
    );

    return {
      id: fetchedMod.id,
      fetched: fetchedMod,
      local,
      installedVersion,
      isUnknown: !installedVersion && local != null,
      isLocalOnly: false,
      name: fetchedMod.name,
      modinfo_id:
        local?.modinfo_id ||
        fetchedMod.expand?.mod_versions_via_mod_id[0].modinfo_id!,
    };
  });

  return [
    ...fetchedMapped,
    ...modsInfo
      .filter((info) => !locallyFoundInFetched.has(info.folder_name))
      .map(
        (info) =>
          ({
            id: info.folder_name + '-local',
            fetched: undefined,
            local: info,
            installedVersion: undefined,
            isUnknown: true,
            isLocalOnly: true,
            // TODO use the localized name, when we'll get it
            name: info.modinfo_id ?? info.folder_name ?? 'Unknown mod',
            modinfo_id: info.modinfo_id,
          } as ModData)
      ),
  ];
}
