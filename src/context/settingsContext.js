import React, { createContext } from "react";
import { DataStore } from "aws-amplify/datastore";
import { Settings } from "../models";

const SettingsContext = createContext();

const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const subscription = DataStore.observeQuery(Settings).subscribe(async ({ items }) => {
      if (items.length > 0) {
        setSettings(items[0]);
        setIsLoading(false);
      } else {
        // Create default settings if none exist
        try {
          const newSettings = await DataStore.save(new Settings({
            autoAnalyzeDocuments: true,
            documentAnalysisModel: 'gpt-4',
            editorTheme: 'auto',
            editorFontSize: 14,
            defaultAIModel: 'gpt-4',
            assistantVoice: 'shimmer',
            emailNotifications: true,
            webhookNotifications: false,
            language: 'en',
          }));
          setSettings(newSettings);
        } catch (error) {
          console.error('Error creating settings:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const updateSettings = React.useCallback(async (updates) => {
    if (!settings) return;
    try {
      const updated = await DataStore.save(
        Settings.copyOf(settings, (draft) => {
          Object.assign(draft, updates);
        })
      );
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
