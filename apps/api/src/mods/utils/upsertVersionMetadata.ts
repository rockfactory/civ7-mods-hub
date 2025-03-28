import { ModVersionsMetadataRecord } from '@civmods/parser';
import { pb } from '../../core/pocketbase';
import { ScrapeModsOptions } from './scrapeMods';
import fs from 'fs';
import { findModVersionMetadata } from './db/versionMetadataRepo';
import path from 'path';

export interface UpsertVersionMetadataInput {
  modId: string;
  versionId: string;
  modInfo: any;
  archivePath: string | null | undefined;
  filename: string | null | undefined;
  /**
   * Useful if the file is already downloaded and you want to skip the upload.
   */
  skipFileUpload?: boolean;
}

export async function upsertVersionMetadata(
  options: ScrapeModsOptions,
  input: UpsertVersionMetadataInput
) {
  const { modId, versionId, modInfo } = input;
  const metadata = await findModVersionMetadata(versionId);

  const partialMetadata = {
    version_id: versionId,
    content: modInfo,
  } as Partial<ModVersionsMetadataRecord>;

  if (!input.skipFileUpload) {
    if (input.archivePath) {
      partialMetadata.archive_file = new File(
        [fs.readFileSync(input.archivePath)],
        input.filename ?? path.basename(input.archivePath)
      ) as any;
    } else {
      console.log(
        `No archive file found for mod: ${modId} (already downloaded?)`
      );
    }
  }

  if (!metadata) {
    await pb.collection('mod_versions_metadata').create(partialMetadata);
  } else {
    await pb
      .collection('mod_versions_metadata')
      .update(metadata.id, partialMetadata);
  }
}
