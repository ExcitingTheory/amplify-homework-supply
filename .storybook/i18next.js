/**
 * i18next Configuration for Storybook
 * 
 * Initializes i18next with actual translation files for use in Storybook stories.
 * Uses the same configuration as the main app but without SSR dependencies.
 * 
 * Loads all available translations for: auth, common, components, editor, pages
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

/**
 * Extract value from nested _meta structure
 * Translation files have format: { key: { value: "text", _meta: {...} } }
 */
function extractValues(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val && typeof val === 'object' && 'value' in val) {
      // Extract the value field
      result[key] = val.value;
    } else if (val && typeof val === 'object') {
      // Recurse for nested objects
      result[key] = extractValues(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// Initialize i18next with dynamic resource loading
i18n
  .use(initReactI18next)
  .use(
    resourcesToBackend((language, namespace) => {
      // Dynamically load translation files from public directory
      return fetch(`/locales/${language}/${namespace}.json`)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to load ${language}/${namespace}`);
          return res.json();
        })
        .then(data => extractValues(data))
        .catch((error) => {
          console.warn(`Translation file not found: ${language}/${namespace}.json`);
          return {};
        });
    })
  )
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    
    // Core namespaces (editor split into feature-based namespaces)
    ns: [
      'auth',
      'common',
      'components',
      'pages',
      'editor.authoring',    // Toolbars, drawers, configuration
      'editor.files',        // File management
      'editor.ai',           // AI features and generation
      'editor.blocks',       // Block editors (quiz, answer, vocab)
      'workbook',            // Student/learner interface
      'editor.shared',       // Shared components and plugins
    ],
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    react: {
      useSuspense: false, // Disable for Storybook compatibility
    },
  });

export default i18n;
