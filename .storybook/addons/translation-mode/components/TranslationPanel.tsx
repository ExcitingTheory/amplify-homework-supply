import React, { useContext, useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  Typography,
  TextField,
  Button,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TranslationModeContext } from '../contexts/TranslationModeContext';
import { TranslationCaptureContext } from '../contexts/TranslationCaptureContext';
import { ExportDialog } from './ExportDialog';

interface TranslationValues {
  [lang: string]: string;
}

export const TranslationPanel: React.FC = () => {
  const { selectedTranslation, selectTranslation, isPanelOpen, setPanelOpen, currentLanguages } =
    useContext(TranslationModeContext);
  const { getTranslation, updateTranslation, translations } = useContext(TranslationCaptureContext);

  const [translationValues, setTranslationValues] = useState<TranslationValues>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load translation when selection changes
  useEffect(() => {
    if (selectedTranslation) {
      const translation = getTranslation(selectedTranslation.key, selectedTranslation.namespace);
      if (translation) {
        const values: TranslationValues = {};
        currentLanguages.forEach((lang) => {
          values[lang] = lang === 'en' ? translation.value : ''; // TODO: Load from actual translation files
        });
        setTranslationValues(values);
        setHasChanges(false);
      }
    }
  }, [selectedTranslation, getTranslation, currentLanguages]);

  const handleClose = () => {
    setPanelOpen(false);
    selectTranslation(null);
  };

  const handleChange = (lang: string, value: string) => {
    setTranslationValues((prev) => ({
      ...prev,
      [lang]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (selectedTranslation) {
      // TODO: Actually save to translation files
      console.log('Saving translations:', translationValues);
      setHasChanges(false);
    }
  };

  const handleNextMissing = () => {
    // Find next translation with missing values
    const allTranslations = Array.from(translations.values());
    const currentIndex = selectedTranslation
      ? allTranslations.findIndex(
          (t) => t.key === selectedTranslation.key && t.namespace === selectedTranslation.namespace
        )
      : -1;

    for (let i = currentIndex + 1; i < allTranslations.length; i++) {
      const t = allTranslations[i];
      // TODO: Check if this translation has missing values
      selectTranslation({ key: t.key, namespace: t.namespace });
      return;
    }

    // Wrap around to beginning
    if (allTranslations.length > 0) {
      const t = allTranslations[0];
      selectTranslation({ key: t.key, namespace: t.namespace });
    }
  };

  if (!selectedTranslation || !isPanelOpen) {
    return null;
  }

  const translation = getTranslation(selectedTranslation.key, selectedTranslation.namespace);
  const charCount = (lang: string) => translationValues[lang]?.length || 0;
  const sourceLength = translationValues['en']?.length || 0;

  return (
    <Drawer
      anchor="right"
      open={isPanelOpen}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: 400,
          p: 3,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Edit Translation</Typography>
        <Button 
          onClick={handleClose} 
          size="small"
          sx={{ 
            minWidth: 'auto', 
            color: 'inherit',
            p: 0.5,
          }}
          ariaLabel="Close translation panel"
        >
          <CloseIcon />
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Translation Key
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {selectedTranslation.namespace}:{selectedTranslation.key}
        </Typography>
      </Box>

      {/* English Metadata */}
      {translation?.context && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
            Context
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            {translation.context}
          </Typography>
        </Box>
      )}

      {translation?.component?.location && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
            Component Location
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {translation.component.location}
          </Typography>
        </Box>
      )}

      {translation?.component?.description && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
            Component Description
          </Typography>
          <Typography variant="body2">
            {translation.component.description}
          </Typography>
        </Box>
      )}

      {translation?.usage && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
            Usage
          </Typography>
          <Typography variant="body2">
            {translation.usage}
          </Typography>
        </Box>
      )}

      {(translation?.impact || translation?.userType || translation?.tone) && (
        <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {translation?.impact && (
            <Chip 
              label={`Impact: ${translation.impact}`} 
              size="small" 
              color={translation.impact.toLowerCase().includes('critical') ? 'error' : translation.impact.toLowerCase().includes('high') ? 'warning' : 'default'}
              variant="outlined"
            />
          )}
          {translation?.userType && (
            <Chip label={`Users: ${translation.userType}`} size="small" variant="outlined" />
          )}
          {translation?.tone && (
            <Chip label={`Tone: ${translation.tone}`} size="small" variant="outlined" />
          )}
        </Box>
      )}

      {translation?.alternativeTerms && translation.alternativeTerms.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
            Alternative Terms
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {translation.alternativeTerms.map((term) => (
              <Chip key={term} label={term} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      )}

      {translation?.usedIn && translation.usedIn.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Used in stories:
          </Typography>
          {translation.usedIn.map((story) => (
            <Chip key={story} label={story} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
          ))}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {currentLanguages.map((lang) => {
        const lengthDiff = sourceLength > 0 ? ((charCount(lang) - sourceLength) / sourceLength) * 100 : 0;
        const showLengthWarning = Math.abs(lengthDiff) > 30;

        return (
          <Box key={lang} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                {lang === 'en' ? 'English (Source)' : `${lang.toUpperCase()}`}
                {lang === 'en' && <Chip label="Primary" size="small" sx={{ ml: 1 }} color="primary" />}
              </Typography>
              <Typography variant="caption" color={showLengthWarning ? 'warning.main' : 'text.secondary'}>
                {charCount(lang)} chars
                {lang !== 'en' && sourceLength > 0 && ` (${lengthDiff > 0 ? '+' : ''}${lengthDiff.toFixed(0)}%)`}
              </Typography>
            </Box>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={6}
              value={translationValues[lang] || ''}
              onChange={(e) => handleChange(lang, e.target.value)}
              placeholder={lang === 'en' ? 'Source text' : `Translate to ${lang}...`}
              disabled={lang === 'en'} // Source language is read-only in this view
              variant="outlined"
              size="small"
            />
            {showLengthWarning && lang !== 'en' && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  Translation is {Math.abs(lengthDiff).toFixed(0)}% {lengthDiff > 0 ? 'longer' : 'shorter'} than
                  source. Check if it fits in the UI.
                </Typography>
              </Alert>
            )}
          </Box>
        );
      })}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <ExportDialog />
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={handleSave} disabled={!hasChanges} fullWidth>
          Save Translation
        </Button>
        <Button variant="outlined" onClick={handleNextMissing}>
          Next Missing
        </Button>
      </Box>

      <Button variant="text" onClick={handleClose} fullWidth sx={{ mt: 1 }}>
        Cancel
      </Button>
    </Drawer>
  );
};
