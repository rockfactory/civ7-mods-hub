import { i18n } from '@lingui/core';

export async function dynamicActivate(locale: string) {
  const { messages } = await import(`../locales/${locale}/messages.po`);

  i18n.load(locale, messages);
  i18n.activate(locale);
  console.log('Activated locale:', locale);
  console.log('Loaded messages:', messages);
}
