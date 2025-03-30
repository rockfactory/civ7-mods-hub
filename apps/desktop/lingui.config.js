import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-json';

export default defineConfig({
  sourceLocale: 'en_US',
  locales: [
    'it_IT',
    'en_US',
    'fr_FR',
    'de_DE',
    'es_ES',
    'zh_CN',
    'ko_KR',
    'pt_PT',
    'ja_JP',
  ],
  format: formatter({ style: 'lingui' }),
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['src'],
    },
  ],
});
