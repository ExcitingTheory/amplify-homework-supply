/**
 * @fileoverview WorkbookSettings - Student-facing settings for workbook view
 * @module WorkbookSettings
 * 
 * Provides settings relevant to students completing workbooks, such as
 * accessibility preferences and display options. Excludes authoring features.
 */

import React from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import SettingsContext from '../../../context/settingsContext';
import { useTranslation } from 'next-i18next';

export default function WorkbookSettings() {
  const { t } = useTranslation('workbook');
  
  const settingsContext = React.useContext(SettingsContext);
  const settings = settingsContext?.settings || null;
  const loadingSettings = settingsContext?.isLoading || false;
  const updateSettings = settingsContext?.updateSettings;

  const handleSettingChange = async (field, value) => {
    if (!updateSettings) return;
    try {
      await updateSettings({ [field]: value });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('workbookSettings.title')}
      </Typography>

      {/* Display Preferences */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
        {t('workbookSettings.displayPreferences')}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          sx={{
            maxWidth: '100%',
            wordWrap: 'break-word',
            '& .MuiFormControlLabel-label': {
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            },
          }}
          control={
            <Switch
              checked={settings?.highContrastMode ?? false}
              onChange={(e) => handleSettingChange('highContrastMode', e.target.checked)}
              disabled={loadingSettings}
            />
          }
          label={t('workbookSettings.highContrastMode')}
        />
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          sx={{ ml: 4, mb: 2 }}
        >
          {t('workbookSettings.highContrastModeDescription')}
        </Typography>

        <FormControlLabel
          sx={{
            maxWidth: '100%',
            wordWrap: 'break-word',
            '& .MuiFormControlLabel-label': {
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            },
          }}
          control={
            <Switch
              checked={settings?.reducedMotion ?? false}
              onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
              disabled={loadingSettings}
            />
          }
          label={t('workbookSettings.reducedMotion')}
        />
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          sx={{ ml: 4, mb: 2 }}
        >
          {t('workbookSettings.reducedMotionDescription')}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Audio Preferences */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
        {t('workbookSettings.audioPreferences')}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          sx={{
            maxWidth: '100%',
            wordWrap: 'break-word',
            '& .MuiFormControlLabel-label': {
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            },
          }}
          control={
            <Switch
              checked={settings?.autoPlayAudio ?? true}
              onChange={(e) => handleSettingChange('autoPlayAudio', e.target.checked)}
              disabled={loadingSettings}
            />
          }
          label={t('workbookSettings.autoPlayAudio')}
        />
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          sx={{ ml: 4, mb: 2 }}
        >
          {t('workbookSettings.autoPlayAudioDescription')}
        </Typography>

        <FormControlLabel
          sx={{
            maxWidth: '100%',
            wordWrap: 'break-word',
            '& .MuiFormControlLabel-label': {
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            },
          }}
          control={
            <Switch
              checked={settings?.showWaveforms ?? true}
              onChange={(e) => handleSettingChange('showWaveforms', e.target.checked)}
              disabled={loadingSettings}
            />
          }
          label={t('workbookSettings.showWaveforms')}
        />
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          sx={{ ml: 4 }}
        >
          {t('workbookSettings.showWaveformsDescription')}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Feedback Preferences */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
        {t('workbookSettings.feedbackPreferences')}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          sx={{
            maxWidth: '100%',
            wordWrap: 'break-word',
            '& .MuiFormControlLabel-label': {
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            },
          }}
          control={
            <Switch
              checked={settings?.immediateWorkbookFeedback ?? true}
              onChange={(e) => handleSettingChange('immediateWorkbookFeedback', e.target.checked)}
              disabled={loadingSettings}
            />
          }
          label={t('workbookSettings.immediateFeedback')}
        />
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          sx={{ ml: 4 }}
        >
          {t('workbookSettings.immediateFeedbackDescription')}
        </Typography>
      </Box>
    </Box>
  );
}
