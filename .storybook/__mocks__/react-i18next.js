/**
 * @fileoverview Mock for react-i18next (legacy - project migrated to next-intl)
 * Kept for Storybook translation-mode addon backward compatibility
 */

export const useTranslation = (namespace) => ({
  t: (key) => key,
  i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  ready: true,
});

export const Trans = ({ children }) => children;

export const I18nextProvider = ({ children }) => children;

export const initReactI18next = {
  type: '3rdParty',
  init: () => {},
};
