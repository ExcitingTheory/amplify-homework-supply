/**
 * @fileoverview Mock for i18next (legacy - project migrated to next-intl)
 * Kept for Storybook translation-mode addon backward compatibility
 */

const i18n = {
  language: 'en',
  use: () => i18n,
  init: () => Promise.resolve(i18n),
  t: (key) => key,
  changeLanguage: (lng) => { i18n.language = lng; return Promise.resolve(); },
  on: () => i18n,
  off: () => i18n,
  exists: () => true,
  getFixedT: () => (key) => key,
  hasLoadedNamespace: () => true,
  loadNamespaces: () => Promise.resolve(),
  isInitialized: true,
};

export default i18n;
