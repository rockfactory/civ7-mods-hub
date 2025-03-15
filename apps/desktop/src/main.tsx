import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './log/forwardLogs';

// core styles are required for all packages
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { registerDeepLink } from './mods/deep-links/registerDeepLink';
import { checkForAppUpdates } from './settings/autoUpdater';

registerDeepLink().catch((err) => {
  console.error('[deeplink] Failed to register deep link:', err);
});

checkForAppUpdates(false).catch((err) => {
  console.error('[autoUpdater] Failed to check for updates:', err);
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
