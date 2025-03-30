import { ModVersionsRecord } from '@civmods/parser';
import * as React from 'react';
import { useMemo } from 'react';

export interface IModLocalizedTextProps {
  version: ModVersionsRecord;
  type: 'name' | 'description';
}

export function ModLocalizedText(props: IModLocalizedTextProps) {
  const { version, type } = props;
  const localizedText = useMemo(() => {
    // TODO - add support for other languages
    const text = getLocalizedName(version, 'en_US', type);
    return text;
  }, [version, type]);

  return localizedText;
}

export function getLocalizedName(
  version: ModVersionsRecord,
  locale: string,
  type: 'name' | 'description'
) {
  const localizedText = version.localized_names as Record<
    string,
    Record<string, string>
  >;
  const text =
    localizedText?.[locale.toLocaleLowerCase()]?.[type] ??
    localizedText?.['en_us']?.[type];
  return text;
}
