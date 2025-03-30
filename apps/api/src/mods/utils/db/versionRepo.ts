import { ModsRecord, ModVersionsRecord } from '@civmods/parser';
import { pb } from '../../../core/pocketbase';

export interface ModInfoBag {
  xml: any;
  path: string;
}

export async function upsertVariantVersion(
  mod: ModsRecord,
  parent: ModVersionsRecord,
  version: Partial<ModVersionsRecord>
) {
  console.log(`Upserting variant version for mod: ${mod.id}`, { modInfoPath: version.modinfo_path }); // prettier-ignore
  const existing = await pb
    .collection('mod_versions')
    .getList(1, 1, {
      filter: pb.filter(
        'mod_id = {:mod_id} && cf_id = {:cf_id} && version_parent_id = {:parent_id} && modinfo_path = {:modinfo_path}',
        {
          mod_id: parent.mod_id,
          cf_id: parent.cf_id,
          parent_id: parent.id,
          modinfo_path: version.modinfo_path,
        }
      ),
    })
    .then((versions) => (versions.items.length > 0 ? versions.items[0] : null));

  if (existing) {
    console.log(` - Updating existing variant version: ${existing.id}`); // prettier-ignore
    await pb.collection('mod_versions').update(existing.id, {
      ...version,
    });
  } else {
    console.log(` - Creating new variant version`); // prettier-ignore
    await pb.collection('mod_versions').create({
      ...version,
      mod_id: mod.id,
      // We copy the parent version's cf_id and download_url to the variant version
      cf_id: parent.cf_id,
      download_url: parent.download_url,
      released: parent.released,
      name: `${parent.name} (${version.modinfo_id})`,
      is_processing: false,
      // We set the is_variant flag to true for variant versions
      is_variant: true,
      version_parent_id: parent.id,
    } as Partial<ModVersionsRecord>);
  }
}
