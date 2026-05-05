import React, { createContext, useReducer } from "react";
import { getAmplifyClient } from '../utils/amplifyClient';
import AuthContext from './authContext';
import { settingsReducer, initialState, actionTypes } from './reducers/settingsReducer';

const SettingsContext = createContext();

const SettingsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  
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
    const subscriptions = [];
    let cancelled = false;

    function handleError(label, error) {
      const msg = error?.message || error?.errors?.[0]?.message || error?.error?.errors?.[0]?.message || JSON.stringify(error);
      if (msg.includes('DuplicatedOperationError')) {
        console.warn(`[SettingsContext] ${label}: transient DuplicatedOperationError (safe to ignore)`);
        return;
      }
      console.error(`[SettingsContext] ${label} error:`, error);
    }

    async function fetchSettings() {
      try {
        const { data: items, errors } = await client.models.Settings.list();
        if (cancelled) return;
        if (errors?.length) console.error('[SettingsContext] list errors:', errors);

        const validItems = (items || []).filter(item => item != null && item.id != null);
        if (validItems.length > 0) {
          dispatch({ type: actionTypes.SETTINGS_LOADED, payload: validItems[0] });
        } else {
          // Create default settings if none exist
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
          if (!cancelled) {
            dispatch({ type: actionTypes.SETTINGS_LOADED, payload: newSettings });
          }
        }

        if (cancelled) return;

        // Subscribe to updates
        const updateSub = client.models.Settings.onUpdate().subscribe({
          next: (response) => {
            const updated = response?.data || response;
            if (!updated || !updated.id) return;
            dispatch({ type: actionTypes.SETTINGS_LOADED, payload: updated });
          },
          error: (error) => handleError('Settings onUpdate', error)
        });
        subscriptions.push(updateSub);
      } catch (error) {
        console.error('[SettingsContext] fetchSettings error:', error);
        if (!cancelled) dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    }

    fetchSettings();
    
    return () => {
      cancelled = true;
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [authLoading, user]);

  const updateSettings = React.useCallback(async (updates) => {
    if (!state.settings) return;
    try {
      const client = getAmplifyClient();
      const { data: updated, errors } = await client.models.Settings.update({
        id: state.settings.id,
        _version: state.settings._version,
        ...updates,
      });
      if (errors?.length) {
        console.error('[SettingsContext] update errors:', errors);
      }
      if (updated) {
        dispatch({ type: actionTypes.SET_SETTINGS, payload: updated });
      }
      return updated;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, [state.settings]);

  const contextValue = React.useMemo(() => ({
    settings: state.settings,
    isLoading: state.isLoading,
    updateSettings,
  }), [state.settings, state.isLoading, updateSettings]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export { SettingsProvider };
export default SettingsContext;
