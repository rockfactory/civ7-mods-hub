import { ModVersionsRecord } from '@civmods/parser';
import {
  FetchedMod,
  FetchedModule,
  FetchedVersion,
  RawFetchedMod,
} from '../../home/IModInfo';
import { sortVersionsByDate } from '../fetchMods';

export function parseFetchedMods(fetched: RawFetchedMod[]): FetchedMod[] {
  return (
    fetched
      // We don't want mods without versions since we can't install them anyway;
      // Plus they break the `[0]` check as latest version check
      .filter((r) => r.expand?.mod_versions_via_mod_id?.length)
      .map((mod) => {
        const allVersions = sortVersionsByDate(
          mod.expand?.mod_versions_via_mod_id ?? []
        );
        const primaryVersions = allVersions.filter((v) => !v.is_variant);

        return {
          ...mod,
          _rawVersions: allVersions,
          versions: primaryVersions.map((version) =>
            parseFetchedVersion(version, allVersions)
          ),
        } satisfies FetchedMod;
      })
  );
}

function parseFetchedVersion(
  version: ModVersionsRecord,
  allVersions: ModVersionsRecord[]
): FetchedVersion {
  const modules = allVersions
    .filter(
      (v) =>
        // Variants
        (v.is_variant && v.version_parent_id == version.id) ||
        // Primary
        v.id == version.id
    )
    .map((module) => parseFetchedModule(module));

  return {
    _brand: 'Version',
    ...version,
    is_variant: false,
    version_parent_id: undefined,

    hasMultipleModules: modules.length > 1,
    modinfoIds: modules.map((m) => m.modinfo_id).filter(Boolean) as string[],
    modules: allVersions
      .filter(
        (v) =>
          // Variants
          (v.is_variant && v.version_parent_id == version.id) ||
          // Primary
          v.id == version.id
      )
      .map((module) => parseFetchedModule(module)),
  };
}

function parseFetchedModule(moduleVersion: ModVersionsRecord): FetchedModule {
  return {
    _brand: 'Module',
    ...moduleVersion,
  } satisfies FetchedModule;
}
