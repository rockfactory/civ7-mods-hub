import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

/**
 * Centralized date parsing function.
 */
export function parseDate(dateString: string): Dayjs {
  const parsedDate = dayjs(dateString, [
    // Example: '2025-02-21 15:59:44.000Z'
    'YYYY-MM-DD HH:mm:ss.SSS[Z]',
  ]);

  if (!parsedDate.isValid() && dateString !== '') {
    console.warn(`Invalid date format: ${dateString}`);
  }

  return parsedDate;
}
