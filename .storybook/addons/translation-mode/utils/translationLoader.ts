/**
 * Translation loader utility
 * Loads translation files from the translations directory
 */

type TranslationData = Record<string, any>;

const translationCache: Map<string, TranslationData> = new Map();

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
  
  try {
    // Dynamically import the translation file from public/locales
    const module = await import(`../../../../public/locales/${language}/${namespace}.json`);
    const data = module.default || module;
    
    // Cache the result
    translationCache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.warn(`Failed to load translation: ${language}/${namespace}`, error);
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
 * Clear the translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}
