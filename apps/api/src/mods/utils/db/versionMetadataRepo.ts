import { ModVersionsMetadataRecord } from '@civmods/parser';
import { pb } from '../../../core/pocketbase';

export async function findModVersionMetadata(
  versionId: string
): Promise<ModVersionsMetadataRecord | null> {
  const res = await pb.collection('mod_versions_metadata').getList(1, 1, {
    filter: pb.filter(`version_id = {:version_id}`, {
      version_id: versionId,
    }),
  });
  return res?.items?.[0] ?? null;
}
