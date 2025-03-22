import lzString from 'lz-string';

/**
 * Atleast one of mid or cfid is required
 */
export type IShareableMod = {
  /**
   * CivFanatics ID
   */
  cfid?: string;
  /**
   * Modinfo ID
   */
  mid?: string;
  /**
   * Version hash. Latest version if not specified.
   */
  v?: string;
};

export interface IShareableProfile {
  /**
   * Shareable profile version
   */
  v: number;
  /**
   * Profile Title (optional)
   */
  t?: string;
  /**
   * Mods
   */
  ms: IShareableMod[];
}

export function hashProfileCodes(
  mods: IShareableMod[],
  title: string | undefined
): {
  base: string;
  compressed: string;
} {
  if (mods.some((m) => !m.mid && !m.cfid)) {
    throw new Error(
      'Atleast one of mid (modinfo_id) or cfid (CivFanatics ID) is required'
    );
  }

  const base = JSON.stringify({ v: 0, t: title, ms: mods });
  const compressed = lzString.compressToEncodedURIComponent(base);

  return { base, compressed };
}

export function unhashProfileCodes(code: string): IShareableProfile {
  const base = lzString.decompressFromEncodedURIComponent(code);
  if (!base) {
    throw new Error('Failed to decompress profile code');
  }

  return JSON.parse(base);
}
