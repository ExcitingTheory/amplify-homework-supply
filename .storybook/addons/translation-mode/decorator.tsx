import React, { useContext, useEffect } from 'react';
import type { Decorator } from '@storybook/react';
import { addons } from 'storybook/preview-api';
import { TranslationModeProvider, TranslationModeContext } from './contexts/TranslationModeContext';
import { TranslationCaptureProvider, TranslationCaptureContext } from './contexts/TranslationCaptureContext';
import { useGlobals } from 'storybook/preview-api';

/**
 * Decorator that wraps stories with translation mode functionality
 */
export const withTranslationMode: Decorator = (Story, context) => {
  const [globals] = useGlobals();
  const translationMode = globals?.translationMode || 'off';
  const translationLanguage = globals?.translationLanguage || 'en';
  
  // Get story name from context
  const storyName = context.title ? `${context.title}/${context.name}` : context.name;

  return (
    <TranslationModeProvider>
      <TranslationCaptureProvider>
        <TranslationModeController 
          mode={translationMode} 
          displayLanguage={translationLanguage}
          storyName={storyName}
        >
          <Story />
        </TranslationModeController>
      </TranslationCaptureProvider>
    </TranslationModeProvider>
  );
};

interface TranslationModeControllerProps {
  mode: string;
  displayLanguage: string;
  storyName: string;
  children: React.ReactNode;
}

const TranslationModeController: React.FC<TranslationModeControllerProps> = ({ mode, displayLanguage, storyName, children }) => {
  const { setMode, setDisplayLanguage, setStoryName } = useContext(TranslationModeContext);
  const { translations, updateTranslation } = useContext(TranslationCaptureContext);

  useEffect(() => {
    setMode(mode as any);
  }, [mode, setMode]);

  useEffect(() => {
    setDisplayLanguage(displayLanguage);
  }, [displayLanguage, setDisplayLanguage]);

  useEffect(() => {
    setStoryName(storyName);
  }, [storyName, setStoryName]);

  // Set up channel listeners
  useEffect(() => {
    const channel = addons.getChannel();
    
    // Listen for save events from the panel
    const handleSave = (data: { key: string; namespace: string; values: { [lang: string]: string } }) => {
      updateTranslation(data.key, data.namespace, {
        value: data.values.en,
        // TODO: Handle other languages
      });
    };

    // Listen for export events from the panel
    const handleExport = () => {
      console.log('Export all translations', translations);
      // TODO: Implement export functionality
    };

    channel.on('translation-mode/save', handleSave);
    channel.on('translation-mode/export', handleExport);

    return () => {
      channel.off('translation-mode/save', handleSave);
      channel.off('translation-mode/export', handleExport);
    };
  }, [translations, updateTranslation]);

  // Sync translations to the panel whenever they change
  useEffect(() => {
    const channel = addons.getChannel();
    channel.emit('translation-mode/update-all', translations);
  }, [translations]);

  return <>{children}</>;
};
