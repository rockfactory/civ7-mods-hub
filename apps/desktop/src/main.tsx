import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './log/forwardLogs';

// core styles are required for all packages
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { registerDeepLink } from './mods/deep-links/registerDeepLink';

registerDeepLink().catch((err) => {
  console.error('[deeplink] Failed to register deep link:', err);
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
