import { ModVersionsRecord } from '@civmods/parser';

/**
 * Safely sorts an array of objects by a Date field stored as a string.
 * @param array - The array to sort
 * @param ascending - Whether to sort in ascending order (default: false, se we need the latest version first)
 * @returns A new sorted array
 */
export function sortVersionsByDate(
  array: ModVersionsRecord[],
  ascending = false
): ModVersionsRecord[] {
  return [...array].sort((a, b) => {
    const dateA = new Date(a.released ?? '');
    const dateB = new Date(b.released ?? '');

    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      console.warn(`Invalid date detected: ${a.released} or ${b.released}`);
      return 0; // Keep original order if any date is invalid
    }

    return ascending
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });
}
