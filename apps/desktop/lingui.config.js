import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-json';

export default defineConfig({
  sourceLocale: 'en',
  locales: ['it', 'en', 'fr', 'de', 'es', 'ko'],
  format: 'po',
  formatOptions: {
    origins: false,
    lineNumbers: false,
  },
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['src'],
    },
  ],
});
