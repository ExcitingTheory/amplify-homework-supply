/**
 * Translation loader utility
 * Loads translation files from the translations directory
 */

type TranslationData = Record<string, any>;

export interface TranslationMetadataEntry {
  context?: string;
  component?: {
    location?: string;
    description?: string;
  };
  usage?: string;
  impact?: string;
  userType?: string;
  tone?: string;
  alternativeTerms?: string[];
}

export type TranslationMetadata = Record<string, TranslationMetadataEntry>;

const translationCache: Map<string, TranslationData> = new Map();
const metadataCache: Map<string, TranslationMetadata> = new Map();
const missingFiles: Set<string> = new Set();

/**
 * Get the base path for static asset URLs.
 * Detects the GitHub Pages subpath from the current URL at runtime.
 */
function getBasePath(): string {
  if (typeof window === 'undefined') return '/';
  // Use pathname up to index.html or iframe.html to infer the deployment base
  const path = window.location.pathname;
  // Match pattern like /repo-name/ at the start
  const match = path.match(/^(\/[^/]+\/)/);
  // If path starts with a subpath (not just /), use it
  if (match && match[1] !== '/') {
    return match[1];
  }
  return '/';
}

/**
 * Load a translation file for a specific language and namespace
 * @param language - The language code (e.g., 'en', 'ja')
 * @param namespace - The namespace (e.g., 'common', 'auth')
 * @returns The translation data object
 */
export async function loadTranslation(
  language: string,
  namespace: string
): Promise<TranslationData | null> {
  const cacheKey = `${language}:${namespace}`;
  
  // Check cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }
  
  // Check if we already know this file is missing
  if (missingFiles.has(cacheKey)) {
    return null;
  }
  
  try {
    // Dynamically import the translation file using fetch
    // This works in both manager and preview contexts
    const base = getBasePath();
    const response = await fetch(`${base}locales/${language}/${namespace}.json`);
    
    if (!response.ok) {
      // Mark as missing to avoid repeated warnings
      missingFiles.add(cacheKey);
      
      // Only warn in development, not for every missing translation
      if (process.env.NODE_ENV === 'development' && language !== 'en') {
        console.debug(`[i18n] Translation not yet available: ${language}/${namespace} (will fall back to English)`);
      }
      return null;
    }
    
    const data = await response.json();
    
    // Cache the result
    translationCache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    // Mark as missing to avoid repeated errors
    missingFiles.add(cacheKey);
    console.error(`[i18n] Failed to load translation: ${language}/${namespace}`, error);
    return null;
  }
}

/**
 * Get a specific translation value by key path
 * @param data - The translation data object
 * @param keyPath - Dot-separated key path (e.g., 'demo.title')
 * @returns The translated string or undefined
 */
export function getTranslationValue(
  data: TranslationData | null,
  keyPath: string
): string | undefined {
  if (!data) return undefined;
  
  const keys = keyPath.split('.');
  let current: any = data;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

/**
 * Load translation metadata for a namespace from translation-cache
 * @param language - The language code (e.g., 'en')
 * @param namespace - The namespace (e.g., 'auth', 'common')
 * @returns The metadata object keyed by translation key
 */
export async function loadMetadata(
  language: string,
  namespace: string
): Promise<TranslationMetadata | null> {
  const cacheKey = `meta:${language}:${namespace}`;

  if (metadataCache.has(cacheKey)) {
    return metadataCache.get(cacheKey)!;
  }

  if (missingFiles.has(cacheKey)) {
    return null;
  }

  // Try multiple paths: translation-cache static dir (flat), then public locales dir
  const base = getBasePath();
  const paths = [
    `${base}translation-cache/${namespace}.meta.json`,
    `${base}locales/${language}/${namespace}.meta.json`,
  ];

  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const data: TranslationMetadata = await response.json();
        metadataCache.set(cacheKey, data);
        return data;
      }
    } catch {
      // Try next path
    }
  }

  missingFiles.add(cacheKey);
  console.debug(`[i18n] No metadata file for ${language}/${namespace}`);
  return null;
}

/**
 * Clear the translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
  metadataCache.clear();
}
