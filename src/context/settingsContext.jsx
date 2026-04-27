import React, { createContext } from "react";
import { getAmplifyClient } from '../utils/amplifyClient';
import AuthContext from './authContext';

const SettingsContext = createContext();

const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Get auth state from centralized context
  const authContext = React.useContext(AuthContext);
  const { user, isLoading: authLoading } = authContext || { user: undefined, isLoading: true };

  React.useEffect(() => {
    // Wait for auth to be ready
    if (authLoading || !user) {
      console.log('[SettingsContext] Waiting for auth...', { authLoading, hasUser: !!user });
      return;
    }
    
    console.log('[SettingsContext] Setting up Settings subscription for user:', user.attributes.sub);
    const client = getAmplifyClient();

    const subscription = client.models.Settings.observeQuery().subscribe({
      next: async ({ items }) => {
        // Filter out null items that can appear during subscription updates
        const validItems = items.filter(item => item != null && item.id != null);
        
        if (validItems.length > 0) {
          setSettings(validItems[0]);
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
        const msg = error?.message || error?.errors?.[0]?.message || error?.error?.errors?.[0]?.message || JSON.stringify(error);
        if (msg.includes('DuplicatedOperationError')) {
          console.warn('[SettingsContext] Settings subscription: transient DuplicatedOperationError (safe to ignore)');
          return;
        }
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
  }, [authLoading, user]);

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
