import { ModVersionsRecord } from '@civmods/parser';
import { FetchedMod } from '../../home/IModInfo';
import { pb } from './pocketbase';
import { getVersion } from '@tauri-apps/api/app';

export async function fetchModsIndex(): Promise<FetchedMod[]> {
  const version = await getVersion();

  const mods = await pb.collection('mods').getFullList<ModVersionsRecord>({
    filter: 'is_hidden != true',
    // expand: 'mod_versions_via_mod_id',
    sort: '-mod_updated',
    headers: { 'x-version': `CivMods/v${version}` },
    batch: 1000,
  });

  const versions = await pb
    .collection('mod_versions')
    .getFullList<ModVersionsRecord>({
      sort: '-mod_updated',
      headers: { 'x-version': `CivMods/v${version}` },
      batch: 1000,
    });

  const modsMap = new Map<string, FetchedMod>();
  mods.forEach((mod) => {
    modsMap.set(mod.id, {
      ...mod,
      versions: [],
    });
  });
}
