/**
 * @fileoverview Legacy mock for next-i18next (migrated to next-intl)
 * Kept for backward compatibility with any storybook addons still referencing it
 */

// Simple passthrough mock - no longer depends on react-i18next
export const useTranslation = (namespace) => ({
  t: (key) => key,
  i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  ready: true,
});

export const Trans = ({ children }) => children;

export const appWithTranslation = (Component) => Component;
export const serverSideTranslations = async (locale, namespaces) => ({
  _nextI18Next: {
    initialI18nStore: {},
    initialLocale: locale,
    userConfig: null,
  },
});
