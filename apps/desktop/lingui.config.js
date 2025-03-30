import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-json';

export default defineConfig({
  sourceLocale: 'en',
  locales: ['it', 'en', 'fr', 'de', 'es', 'zh', 'ko', 'pt', ,],
  format: formatter({ style: 'lingui' }),
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['src'],
    },
  ],
});
