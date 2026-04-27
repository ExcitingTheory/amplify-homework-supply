/**
 * next-i18next Configuration
 * 
 * Configures internationalization for the Homework Supply platform.
 * Supports multiple languages with namespace-based translation files.
 * 
 * @see https://github.com/i18next/next-i18next
 */

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
  },
  
  // Load translation files from public/locales (server-side only)
  localePath: require('path').resolve('./public/locales'),
  
  // Namespace configuration
  ns: [
    'auth',
    'common',
    'components',
    'pages',
    // Editor namespaces (split from original 'editor' namespace)
    'editor.authoring',    // Toolbars, drawers, configuration
    'editor.files',        // File management
    'editor.ai',           // AI features and generation
    'editor.blocks',       // Block editors (quiz, answer, vocab)
    'workbook',            // Student/learner interface
    'editor.shared',       // Shared components and plugins
  ],
  defaultNS: 'common',
  
  // React configuration
  react: {
    useSuspense: false, // Disable suspense for SSR compatibility
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'span'],
  },
  
  // Interpolation settings
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  
  // Fallback language
  fallbackLng: 'en',
  
  // Load translations on server-side
  serializeConfig: false,
};
