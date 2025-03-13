/**
 * Extracts the mod ID from a CivFanatics resource URL.
 * @param url - The CivFanatics mod page URL
 * @returns The mod ID as a string, or undefined if not found
 */
export function getModIdFromUrl(url: string): string | undefined {
  const match = url.match(/resources\/[^.]+\.([\d]+)/);
  return match ? match[1] : undefined;
}

/**
 * Extracts the version ID from a CivFanatics version download URL.
 * @param url - The CivFanatics mod version download URL
 * @returns The version ID as a string, or undefined if not found
 */
export function getVersionIdFromUrl(url: string): string | undefined {
  const match = url.match(/version\/([\d]+)\/download/);
  return match ? match[1] : undefined;
}
