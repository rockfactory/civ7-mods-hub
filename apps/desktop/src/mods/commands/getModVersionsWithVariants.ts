import { ModVersionsRecord } from '@civmods/parser';
import {
  FetchedMod,
  ModDataVersion,
  ModPrimaryVersionRecord,
  ModVariantVersionRecord,
} from '../../home/IModInfo';
import { uniq } from 'es-toolkit';

export function getModVersionWithVariants(
  fetchedMod: FetchedMod,
  primary: ModPrimaryVersionRecord
): ModDataVersion {
  const modVersions = fetchedMod.expand?.mod_versions_via_mod_id ?? [];

  const variants = modVersions.filter(
    (v) => v.is_variant && v.version_parent_id == primary.id
  ) as ModVariantVersionRecord[];

  const versions = [primary, ...variants];
  const modinfoIds = uniq(
    versions.map((v) => v.modinfo_id).filter(Boolean) as string[]
  );

  return {
    primary,
    variants,
    versions,
    modinfoIds,
    hasVariants: variants.length > 0,
  };
}

export function getModVersionsWithVariants(
  fetchedMod: FetchedMod
): ModDataVersion[] {
  // We expect these to be sorted by release date
  // and the first one to be the latest.
  const modVersions = fetchedMod.expand?.mod_versions_via_mod_id ?? [];

  const primaryVersions = modVersions.filter(
    (v) => !v.is_variant
  ) as ModPrimaryVersionRecord[];

  return primaryVersions.map((primary) =>
    getModVersionWithVariants(fetchedMod, primary)
  );
}
