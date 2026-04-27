import { useColorScheme } from '@mui/material/styles';
import React from 'react';
import SettingsContext from '../context/settingsContext';

export function useColorMode() {
  const { settings, updateSettings } = React.useContext(SettingsContext) || {};
  const { mode, setMode } = useColorScheme();

  // Sync MUI mode with persisted settings (one-way: settings → MUI).
  // Do NOT include `mode` in deps — it causes an infinite loop when an
  // external controller (e.g. Storybook's ColorSchemeSynchronizer) also
  // calls setMode, creating two effects that fight over the same state.
  React.useEffect(() => {
    if (!settings?.editorTheme) return;
    const muiMode = settings.editorTheme === 'auto' ? 'system' : settings.editorTheme;
    setMode(muiMode);
  }, [settings?.editorTheme, setMode]);

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
