/**
 * @fileoverview Mock for next-intl that loads real translations for all locales.
 * Uses Vite's import.meta.glob to eagerly load all locale JSON files
 * so that useTranslations(namespace) returns actual translated strings.
 * Supports dynamic locale switching via the Storybook toolbar.
 */

import { useSyncExternalStore } from 'react';

// Eagerly load ALL locale JSON files at build time
const allLocaleModules = import.meta.glob('../../public/locales/**/*.json', { eager: true });

// Build a lookup: locale → namespace → translations object
// e.g. { "en": { "pages": { "index.title": "Homework Supply" } }, "es": { ... } }
const allTranslations = {};
for (const [filePath, mod] of Object.entries(allLocaleModules)) {
  // Extract locale and namespace from path: "../../public/locales/es/pages.json" → ["es", "pages"]
  const match = filePath.match(/\/locales\/([^/]+)\/([^/]+)\.json$/);
  if (!match) continue;
  const [, locale, ns] = match;
  // Skip .meta.json and .missing.json files
  if (ns.endsWith('.meta') || ns.endsWith('.missing')) continue;
  if (!allTranslations[locale]) allTranslations[locale] = {};
  allTranslations[locale][ns] = mod.default || mod;
}

// --- Reactive locale store ---
let currentLocale = 'en';
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentLocale;
}

/** Change the active locale. Call from Storybook decorators to switch language. */
export function setLocale(locale) {
  if (locale === currentLocale) return;
  if (!allTranslations[locale]) {
    console.warn(`[next-intl mock] Locale "${locale}" not found. Available: ${Object.keys(allTranslations).join(', ')}`);
    return;
  }
  currentLocale = locale;
  listeners.forEach(fn => fn());
}

// Helper to get translations for the current locale (with English fallback)
function getTranslations() {
  return allTranslations[currentLocale] || allTranslations['en'] || {};
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
  // Subscribe to locale changes so components re-render when language switches
  const locale = useSyncExternalStore(subscribe, getSnapshot);

  // Support array of namespaces: useTranslations(["common", "components", "editor.authoring"])
  const namespaces = Array.isArray(namespace) ? namespace : [namespace];

  // Get translations for current locale, with English as fallback
  const localeData = allTranslations[locale] || {};
  const fallbackData = allTranslations['en'] || {};

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

    // Try current locale first, then fall back to English
    const nsData = localeData[targetNs] || {};
    let value = resolve(nsData, resolveKey);
    if (value === undefined) {
      const fallbackNsData = fallbackData[targetNs] || {};
      value = resolve(fallbackNsData, resolveKey);
    }

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
    const nsData = localeData[targetNs] || {};
    let value = resolve(nsData, resolveKey);
    if (value === undefined) {
      const fallbackNsData = fallbackData[targetNs] || {};
      value = resolve(fallbackNsData, resolveKey);
    }
    return value;
  };
  return t;
};

export const useLocale = () => {
  return useSyncExternalStore(subscribe, getSnapshot);
};

export const useMessages = () => {
  const locale = useSyncExternalStore(subscribe, getSnapshot);
  const localeData = allTranslations[locale] || allTranslations['en'] || {};
  // Return all loaded translations for current locale
  const all = {};
  for (const [ns, data] of Object.entries(localeData)) {
    all[ns] = data;
  }
  return all;
};

export const NextIntlClientProvider = ({ children, locale, messages }) => {
  // If a locale is passed as prop, update the store
  if (locale && locale !== currentLocale && allTranslations[locale]) {
    // Use queueMicrotask to avoid updating during render
    queueMicrotask(() => setLocale(locale));
  }
  return children;
};
