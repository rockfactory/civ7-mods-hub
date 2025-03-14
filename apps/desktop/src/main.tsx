import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// core styles are required for all packages
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
