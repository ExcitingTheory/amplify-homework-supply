import React, { createContext } from "react";
import { getAmplifyClient } from '../utils/amplifyClient';

const SettingsContext = createContext();

const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const client = getAmplifyClient();

    const subscription = client.models.Settings.observeQuery().subscribe({
      next: async ({ items }) => {
        if (items.length > 0) {
          setSettings(items[0]);
          setIsLoading(false);
        } else {
          // Create default settings if none exist
          try {
            const { data: newSettings } = await client.models.Settings.create({
              autoAnalyzeDocuments: true,
              documentAnalysisModel: 'gpt-4',
              editorTheme: 'auto',
              editorFontSize: 14,
              defaultAIModel: 'gpt-4',
              assistantVoice: 'shimmer',
              emailNotifications: true,
              webhookNotifications: false,
              language: 'en',
            });
            setSettings(newSettings);
          } catch (error) {
            console.error('Error creating settings:', error);
          } finally {
            setIsLoading(false);
          }
        }
      },
      error: (error) => {
        console.error('[SettingsContext] Settings subscription error:', error);
        // Stop retrying on auth errors to prevent rate limiting
        if (error?.message?.includes('No current user') || 
            error?.message?.includes('NoSignedUser') ||
            error?.message?.includes('401') ||
            error?.message?.includes('403')) {
          console.warn('[SettingsContext] Auth error, stopping Settings subscription retries');
          subscription.unsubscribe();
        }
        setIsLoading(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const updateSettings = React.useCallback(async (updates) => {
    if (!settings) return;
    try {
      const client = getAmplifyClient();
      const { data: updated } = await client.models.Settings.update({
        id: settings.id,
        ...updates,
      });
      setSettings(updated);
      return updated;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, [settings]);

  const contextValue = React.useMemo(() => ({
    settings,
    isLoading,
    updateSettings,
  }), [settings, isLoading, updateSettings]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export { SettingsProvider };
export default SettingsContext;
