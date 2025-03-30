import Home from './home/Home';
import { ModsContextProvider } from './mods/ModsContext';
import {
  createTheme,
  LoadingOverlay,
  MantineColorsTuple,
  MantineProvider,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { useAppStore } from './store/store';
import { ProfilesContextProvider } from './profiles/ProfilesContext';
import { useEffect, useState } from 'react';
import { dynamicActivate } from './localization/dynamicActivate';

// Locales (default)
import { messages as enMessages } from './locales/en/messages.po';
i18n.load('en', enMessages);
i18n.activate('en');

// Theme
const pastelYellow: MantineColorsTuple = [
  '#fff7e8',
  '#f9edd5',
  '#f2d9ab',
  '#ebc57c',
  '#e5b355',
  '#e1a83c',
  '#e0a22e',
  '#c68d21',
  '#b17d19',
  '#996b0b',
];

const theme = createTheme({
  colors: {
    pastelYellow,
    dark: [
      '#d2d4db',
      '#a2a6b5',
      '#7e8499',
      '#5a5f71',
      '#434856',
      '#2d303a',
      '#252830',
      '#191b20',
      '#0a0b0d',
      '#000001',
    ],
  },
  primaryColor: 'pastelYellow',
});

function App() {
  const isHydrated = useAppStore((state) => state.hydrated);
  const [isLoadingLocale, setIsLoadingLocale] = useState(true);

  useEffect(() => {
    const browserLocale = navigator.language.split('-')[0];
    console.log('Browser locale:', browserLocale);

    dynamicActivate(browserLocale)
      .catch((error) => {
        console.error('Failed to load locale:', error);
      })
      .finally(() => {
        setIsLoadingLocale(false);
      });
  }, []);

  const isLoading = !isHydrated || isLoadingLocale;

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      {!isLoading && (
        <I18nProvider i18n={i18n}>
          <ModalsProvider>
            <Notifications position="top-right" limit={4} />
            <ProfilesContextProvider>
              <ModsContextProvider>
                <Home />
              </ModsContextProvider>
            </ProfilesContextProvider>
          </ModalsProvider>
        </I18nProvider>
      )}
      {isLoading && <LoadingOverlay visible>Loading...</LoadingOverlay>}
    </MantineProvider>
  );
}

export default App;
