import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-json';

export default defineConfig({
  sourceLocale: 'en_US',
  locales: ['it_IT', 'en_US', 'fr_FR', 'de_DE', 'es_ES', 'ko_KR'],
  format: formatter({ style: 'lingui' }),
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['src'],
    },
  ],
});
