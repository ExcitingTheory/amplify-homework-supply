import { useColorScheme } from '@mui/material/styles';
import React from 'react';
import SettingsContext from '../context/settingsContext';

export function useColorMode() {
  const { settings, updateSettings } = React.useContext(SettingsContext) || {};
  const { mode, setMode } = useColorScheme();

  // Sync MUI mode with persisted settings
  React.useEffect(() => {
    const target = settings?.editorTheme || 'auto';
    const muiMode = target === 'auto' ? 'system' : target;
    if (mode !== muiMode) {
      setMode(muiMode);
    }
  }, [settings?.editorTheme, mode, setMode]);

  const setColorMode = React.useCallback(
    (value) => {
      const muiMode = value === 'auto' ? 'system' : value;
      setMode(muiMode);
      if (updateSettings) {
        updateSettings({ editorTheme: value });
      }
    },
    [setMode, updateSettings],
  );

  return { mode: settings?.editorTheme || 'auto', setColorMode };
}
