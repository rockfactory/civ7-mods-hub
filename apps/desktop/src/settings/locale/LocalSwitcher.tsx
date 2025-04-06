import * as React from 'react';
import { useAppStore } from '../../store/store';
import { Group, Select, Text } from '@mantine/core';
import { useCallback } from 'react';
import { IconGlobe, IconLanguage } from '@tabler/icons-react';

export interface ILocaleSwitcherProps {}

const availableLocales = ['en', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'zh', 'ko'];
const availableLocaleOptions = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'zh', label: '中文' },
  { value: 'ko', label: '한국어' },
];

export function LocaleSwitcher(props: ILocaleSwitcherProps) {
  const locale = useAppStore((state) => state.locale);
  // const setLocale = useAppStore((state) => state.setLocale);

  return (
    <Select
      leftSectionWidth={90}
      leftSection={
        <Group gap={2}>
          <IconLanguage size={16} />
          <Text size="xs" c="dimmed">
            Language
          </Text>
        </Group>
      }
      aria-label="Select your language"
      clearable
      w="auto"
      value={locale}
      placeholder="System"
      onChange={(value) => {
        useAppStore.getState().setLocale(value);
      }}
      data={availableLocaleOptions}
    />
  );
}
