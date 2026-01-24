import React, { createContext, useCallback, useState, ReactNode } from 'react';

export interface CapturedTranslation {
  key: string;
  namespace: string;
  value: string;
  defaultValue?: string;
  context?: string;
  interpolation?: Record<string, any>;
  usedIn?: string[];
  // English metadata from translation files
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

interface TranslationCaptureContextValue {
  translations: Map<string, CapturedTranslation>;
  captureTranslation: (translation: CapturedTranslation) => void;
  clearTranslations: () => void;
  getTranslation: (key: string, namespace: string) => CapturedTranslation | undefined;
  updateTranslation: (key: string, namespace: string, updates: Partial<CapturedTranslation>) => void;
}

export const TranslationCaptureContext = createContext<TranslationCaptureContextValue>({
  translations: new Map(),
  captureTranslation: () => {},
  clearTranslations: () => {},
  getTranslation: () => undefined,
  updateTranslation: () => {},
});

interface Props {
  children: ReactNode;
}

export const TranslationCaptureProvider: React.FC<Props> = ({ children }) => {
  const [translations, setTranslations] = useState<Map<string, CapturedTranslation>>(new Map());

  const captureTranslation = useCallback((translation: CapturedTranslation) => {
    setTranslations((prev) => {
      const key = `${translation.namespace}:${translation.key}`;
      const existing = prev.get(key);
      
      const newMap = new Map(prev);
      newMap.set(key, {
        ...translation,
        usedIn: existing?.usedIn 
          ? Array.from(new Set([...existing.usedIn, ...(translation.usedIn || [])]))
          : translation.usedIn,
      });
      
      return newMap;
    });
  }, []);

  const clearTranslations = useCallback(() => {
    setTranslations(new Map());
  }, []);

  const getTranslation = useCallback((key: string, namespace: string) => {
    return translations.get(`${namespace}:${key}`);
  }, [translations]);

  const updateTranslation = useCallback((key: string, namespace: string, updates: Partial<CapturedTranslation>) => {
    setTranslations((prev) => {
      const fullKey = `${namespace}:${key}`;
      const existing = prev.get(fullKey);
      
      if (!existing) return prev;
      
      const newMap = new Map(prev);
      newMap.set(fullKey, { ...existing, ...updates });
      
      return newMap;
    });
  }, []);

  return (
    <TranslationCaptureContext.Provider
      value={{
        translations,
        captureTranslation,
        clearTranslations,
        getTranslation,
        updateTranslation,
      }}
    >
      {children}
    </TranslationCaptureContext.Provider>
  );
};
