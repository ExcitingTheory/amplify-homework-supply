/**
 * @fileoverview Wrapper for next-i18next useTranslation that auto-captures translations
 * This allows existing t() calls to work with Translation Mode without code changes
 */

import { useContext, useCallback, useMemo, useRef } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import type { UseTranslationResponse } from 'react-i18next';
import { TranslationCaptureContext } from '../contexts/TranslationCaptureContext';
import { TranslationModeContext } from '../contexts/TranslationModeContext';
import { loadTranslation } from '../utils/translationLoader';

/**
 * Enhanced useTranslation hook that captures and wraps t() calls for Translation Mode
 * Drop-in replacement for next-i18next's useTranslation
 */
export function useTranslationWithCapture(
  namespace: string | string[] = 'common',
  options?: any
): UseTranslationResponse<any> {
  const original = useI18nextTranslation(namespace, options);
  const { captureTranslation, getTranslation, updateTranslation } = useContext(TranslationCaptureContext);
  const { mode, displayLanguage, storyName } = useContext(TranslationModeContext);
  // Track which translations we've already captured to prevent duplicates
  const capturedKeys = useRef<Set<string>>(new Set());

  // Get the primary namespace (first if array)
  const primaryNamespace = Array.isArray(namespace) ? namespace[0] : namespace;

  // Wrapped t() function that captures translations
  const enhancedT = useCallback(
    (key: string, options?: any) => {
      // Get the original translation
      const value = original.t(key, options);

      // Capture this translation for Translation Mode (only once per key)
      if (mode !== 'off') {
        const captureKey = `${primaryNamespace}:${key}`;
        
        // Only capture if we haven't captured this key yet
        if (!capturedKeys.current.has(captureKey)) {
          capturedKeys.current.add(captureKey);
          
          // Load metadata asynchronously (non-blocking)
          loadTranslation('en', primaryNamespace).then((enData) => {
            const fullData = enData?.[key];
            const metadata = typeof fullData === 'object' && fullData !== null ? {
              context: fullData.context,
              component: fullData.component,
              usage: fullData.usage,
              impact: fullData.impact,
              userType: fullData.userType,
              tone: fullData.tone,
              alternativeTerms: fullData.alternativeTerms,
            } : {};

            captureTranslation({
              key,
              namespace: primaryNamespace,
              value: typeof fullData === 'object' && fullData !== null ? fullData.value : value,
              usedIn: storyName ? [storyName] : undefined,
              ...metadata,
            });
          });
        }

        // Check if we have a custom translation in context (user edited it)
        // Note: getTranslation is now stable and won't cause re-renders
        const customTranslation = getTranslation(key, primaryNamespace);
        if (customTranslation?.value && displayLanguage === 'en') {
          return customTranslation.value;
        }

        // For other languages, load from translation files
        if (displayLanguage !== 'en' && displayLanguage !== original.i18n.language) {
          // This is handled by react-i18next, but we could intercept here
          // if we want to show in-progress translations
        }
      }

      return value;
    },
    // Removed captureTranslation and getTranslation from deps - both are stable
    // Only depend on values that should trigger re-creation of enhancedT
    [original.t, mode, primaryNamespace, displayLanguage, storyName]
  );

  // Return enhanced version of UseTranslationResponse
  return useMemo(
    () => ({
      ...original,
      t: enhancedT as any,
    }),
    [original, enhancedT]
  );
}

/**
 * Type-safe version with proper generics
 */
export function useTranslationWithCaptureTyped<N extends string = string>(
  namespace?: N | N[],
  options?: any
): UseTranslationResponse<N> {
  return useTranslationWithCapture(namespace, options) as UseTranslationResponse<N>;
}
