import { ModVersionsMetadataRecord } from '@civmods/parser';
import { pb } from '../../core/pocketbase';
import { ScrapeModsOptions } from './scrapeMods';
import fs from 'fs';

export interface UpsertVersionMetadataInput {
  modId: string;
  versionId: string;
  modInfo: any;
  archivePath: string | null | undefined;
}

export async function upsertVersionMetadata(
  options: ScrapeModsOptions,
  input: UpsertVersionMetadataInput
) {
  const { modId, versionId, modInfo } = input;
  const metadata = await pb
    .collection('mod_versions_metadata')
    .getList(1, 1, {
      filter: pb.filter(`version_id = {:version_id}`, {
        version_id: versionId,
      }),
    })
    .then((res) => res?.items?.[0]);

  const partialMetadata = {
    version_id: versionId,
    content: modInfo,
  } as Partial<ModVersionsMetadataRecord>;

  if (input.archivePath) {
    partialMetadata.archive_file = new Blob([
      fs.readFileSync(input.archivePath),
    ]) as any;
  } else {
    console.log(
      `No archive file found for mod: ${modId} (already downloaded?)`
    );
  }

  if (!metadata) {
    await pb.collection('mod_versions_metadata').create(partialMetadata);
  } else {
    await pb
      .collection('mod_versions_metadata')
      .update(metadata.id, partialMetadata);
  }
}
