import React, { createContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { addons } from 'storybook/preview-api';

export type TranslationModeType = 'off' | 'highlight' | 'edit';

export interface SelectedTranslation {
  key: string;
  namespace: string;
  position?: { x: number; y: number };
}

interface TranslationModeContextValue {
  mode: TranslationModeType;
  setMode: (mode: TranslationModeType) => void;
  selectedTranslation: SelectedTranslation | null;
  selectTranslation: (translation: SelectedTranslation | null) => void;
  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  currentLanguages: string[];
  setCurrentLanguages: (languages: string[]) => void;
  displayLanguage: string;
  setDisplayLanguage: (language: string) => void;
  storyName: string;
  setStoryName: (name: string) => void;
}

export const TranslationModeContext = createContext<TranslationModeContextValue>({
  mode: 'off',
  setMode: () => {},
  selectedTranslation: null,
  selectTranslation: () => {},
  isPanelOpen: false,
  setPanelOpen: () => {},
  currentLanguages: ['en', 'ja', 'es', 'fr', 'zh', 'de'],
  setCurrentLanguages: () => {},
  displayLanguage: 'en',
  setDisplayLanguage: () => {},
  storyName: '',
  setStoryName: () => {},
});

interface Props {
  children: ReactNode;
}

export const TranslationModeProvider: React.FC<Props> = ({ children }) => {
  const [mode, setMode] = useState<TranslationModeType>('off');
  const [selectedTranslation, setSelectedTranslation] = useState<SelectedTranslation | null>(null);
  const [isPanelOpen, setPanelOpen] = useState(false);
  const [currentLanguages, setCurrentLanguages] = useState<string[]>(['en', 'ja', 'es', 'fr', 'zh', 'de']);
  const [displayLanguage, setDisplayLanguage] = useState<string>('en');
  const [storyName, setStoryName] = useState<string>('');

  const selectTranslation = useCallback((translation: SelectedTranslation | null) => {
    setSelectedTranslation(translation);
    if (translation) {
      setPanelOpen(true);
      // Emit to the addon panel via Storybook channel
      const channel = addons.getChannel();
      // Get the full translation data from context
      // We'll need to pass this through from TranslationOverlay
      channel.emit('translation-mode/select', translation);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      mode,
      setMode,
      selectedTranslation,
      selectTranslation,
      isPanelOpen,
      setPanelOpen,
      currentLanguages,
      setCurrentLanguages,
      displayLanguage,
      setDisplayLanguage,
      storyName,
      setStoryName,
    }),
    [
      mode,
      selectedTranslation,
      selectTranslation,
      isPanelOpen,
      currentLanguages,
      displayLanguage,
      storyName,
    ]
  );

  return (
    <TranslationModeContext.Provider value={contextValue}>
      {children}
    </TranslationModeContext.Provider>
  );
};
