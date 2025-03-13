import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {
  createTheme,
  MantineColorsTuple,
  MantineProvider,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';

// core styles are required for all packages
import '@mantine/core/styles.css';
import Home from './home/Home';

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

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications />
      <Home />
    </MantineProvider>
  </React.StrictMode>
);
