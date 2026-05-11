/**
 * @fileoverview Mock for next-intl that loads real English translations.
 * Uses Vite's import.meta.glob to eagerly load all en/*.json locale files
 * so that useTranslations(namespace) returns actual translated strings.
 */

// Eagerly load all English locale JSON files at build time
const localeModules = import.meta.glob('../../public/locales/en/*.json', { eager: true });

// Build a lookup: namespace → flat translations object
// e.g. "pages" → { "index.title": "Homework Supply", ... }
const translations = {};
for (const [filePath, mod] of Object.entries(localeModules)) {
  // Extract namespace from path: "../../public/locales/en/pages.json" → "pages"
  const match = filePath.match(/\/([^/]+)\.json$/);
  if (!match) continue;
  const ns = match[1];
  // Skip .meta.json and .missing.json files
  if (ns.endsWith('.meta') || ns.endsWith('.missing')) continue;
  translations[ns] = mod.default || mod;
}

/**
 * Resolve a dotted key path from an object.
 * e.g. resolve({ index: { title: "Homework Supply" } }, "index.title") → "Homework Supply"
 */
function resolve(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Interpolate {param} placeholders in a translated string.
 */
function interpolate(str, params) {
  if (!params || typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
}

export const useTranslations = (namespace) => {
  // Support array of namespaces: useTranslations(["common", "components", "editor.authoring"])
  const namespaces = Array.isArray(namespace) ? namespace : [namespace];

  const t = (key, paramsOrDefault) => {
    let targetNs = namespaces[0]; // default to first namespace
    let resolveKey = key;
    let params = null;
    let defaultValue = undefined;

    // Handle second argument: string = default value, object = params/options
    if (typeof paramsOrDefault === 'string') {
      defaultValue = paramsOrDefault;
    } else if (paramsOrDefault && typeof paramsOrDefault === 'object') {
      params = { ...paramsOrDefault };
      // Extract ns option (namespace override)
      if (params.ns) {
        targetNs = params.ns;
        delete params.ns;
      }
      // Extract defaultValue option
      if (params.defaultValue !== undefined) {
        defaultValue = params.defaultValue;
        delete params.defaultValue;
      }
    }

    // Handle colon-separated namespace prefix: "common:navigation.home"
    const colonIdx = resolveKey.indexOf(':');
    if (colonIdx > -1) {
      targetNs = resolveKey.slice(0, colonIdx);
      resolveKey = resolveKey.slice(colonIdx + 1);
    }

    const nsData = translations[targetNs] || {};
    const value = resolve(nsData, resolveKey);

    if (value === undefined) {
      // Use default value if provided
      if (defaultValue !== undefined) return interpolate(defaultValue, params);
      // Fallback: return "namespace.key" so missing keys are visible
      return `${targetNs}.${resolveKey}`;
    }
    if (typeof value === 'string') return interpolate(value, params);
    // If the resolved value is an object (nested namespace), return the key
    return key;
  };
  // next-intl t.rich() for rich text translations
  t.rich = (key, paramsOrDefault) => t(key, paramsOrDefault);
  // next-intl t.raw() for raw values
  t.raw = (key) => {
    let targetNs = namespaces[0];
    let resolveKey = key;
    const colonIdx = resolveKey.indexOf(':');
    if (colonIdx > -1) {
      targetNs = resolveKey.slice(0, colonIdx);
      resolveKey = resolveKey.slice(colonIdx + 1);
    }
    return resolve(translations[targetNs] || {}, resolveKey);
  };
  return t;
};

export const useLocale = () => 'en';

export const useMessages = () => {
  // Return all loaded translations merged
  const all = {};
  for (const [ns, data] of Object.entries(translations)) {
    all[ns] = data;
  }
  return all;
};

export const NextIntlClientProvider = ({ children }) => children;
