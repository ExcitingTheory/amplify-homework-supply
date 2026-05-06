import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

/**
 * Loads all namespace translation files for the resolved locale.
 * Messages are split across namespace files in public/locales/{locale}/.
 */
const namespaces = [
  'auth',
  'common',
  'components',
  'pages',
  'editor.authoring',
  'editor.files',
  'editor.ai',
  'editor.blocks',
  'editor.shared',
  'workbook',
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Load all namespace files and merge into a single messages object
  const messages: Record<string, any> = {};
  for (const ns of namespaces) {
    try {
      const mod = await import(`../../public/locales/${locale}/${ns}.json`);
      messages[ns] = mod.default;
    } catch {
      // Namespace file may not exist for all locales - skip gracefully
    }
  }

  return {
    locale,
    messages,
  };
});
