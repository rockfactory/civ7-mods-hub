import * as React from 'react';
import { DateFormatter } from './DateFormatter';
import { parseDate } from './parseDate';

export interface IDateRenderProps {
  date: string | null;
}

export function DateRender(props: IDateRenderProps) {
  const displayDate = DateFormatter.format(
    parseDate(props.date ?? '')?.toDate()
  );

  return displayDate;
}
