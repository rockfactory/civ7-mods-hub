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

import { useStore } from 'zustand';
import { useAppStore } from './store/store';
import { ProfilesContextProvider } from './profiles/ProfilesContext';

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
    // dark: [
    //   '#d5d7e0',
    //   '#acaebf',
    //   '#8c8fa3',
    //   '#666980',
    //   '#4d4f66',
    //   '#34354a',
    //   '#2b2c3d',
    //   '#1d1e30',
    //   '#0c0d21',
    //   '#01010a',
    // ],
  },
  primaryColor: 'pastelYellow',
});

function App() {
  const isHydrated = useAppStore((state) => state.hydrated);

  // useEffect(() => {

  //   }, []);

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider>
        <Notifications position="top-right" limit={4} />
        {isHydrated && (
          <ProfilesContextProvider>
            <ModsContextProvider>
              <Home />
            </ModsContextProvider>
          </ProfilesContextProvider>
        )}
        {!isHydrated && <LoadingOverlay visible>Loading...</LoadingOverlay>}
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
