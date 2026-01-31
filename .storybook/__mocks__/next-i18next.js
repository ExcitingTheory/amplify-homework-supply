/**
 * @fileoverview Mock for next-i18next that integrates with Translation Mode
 * This mock ensures all t() calls in stories are captured for translation editing
 */

import { useTranslationWithCapture } from '../addons/translation-mode/hooks/useTranslationWithCapture';

// Re-export everything from react-i18next
export * from 'react-i18next';

// Override useTranslation with our capture version
export { useTranslationWithCapture as useTranslation };

// Mock Trans component
export { Trans } from 'react-i18next';

// Mock other common exports
export const appWithTranslation = (Component) => Component;
export const serverSideTranslations = async (locale, namespaces) => ({
  _nextI18Next: {
    initialI18nStore: {},
    initialLocale: locale,
    userConfig: null,
  },
});
