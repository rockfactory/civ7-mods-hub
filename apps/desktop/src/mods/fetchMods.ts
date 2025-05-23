import { ModVersionsRecord } from '@civmods/parser';
import dayjs from 'dayjs';

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
    const dateA = dayjs(a.released ?? '');
    const dateB = dayjs(b.released ?? '');

    if (!dateA.isValid() || !dateB.isValid()) {
      console.warn(`Invalid date detected: ${a.released} or ${b.released}`);
      return 0; // Keep original order if any date is invalid
    }

    return ascending
      ? dateA.diff(dateB, 'millisecond')
      : dateB.diff(dateA, 'millisecond');
  });
}
