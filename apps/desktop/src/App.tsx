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
  },
  primaryColor: 'pastelYellow',
});

function App() {
  const isHydrated = useAppStore((state) => state.hydrated);
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider>
        <Notifications position="top-right" />
        {isHydrated && (
          <ModsContextProvider>
            <Home />
          </ModsContextProvider>
        )}
        {!isHydrated && <LoadingOverlay visible>Loading...</LoadingOverlay>}
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
