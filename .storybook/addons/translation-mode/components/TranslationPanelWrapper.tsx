import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Chip,
  Alert,
  Stack,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useChannel } from 'storybook/manager-api';
import { loadTranslation, getTranslationValue } from '../utils/translationLoader';

// Force dark theme for panel to match Storybook UI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      paper: '#1a1a1a',
      default: '#1a1a1a',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#999999',
    },
  },
});

// All supported languages from globalTypes
const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'de', label: 'Deutsch (German)' },
];

interface Translation {
  key: string;
  namespace: string;
  value: string;
  context?: string;
  usedIn?: string[];
  component?: {
    location?: string;
    description?: string;
  };
  usage?: string;
  impact?: string;
  userType?: string;
  tone?: string;
  alternativeTerms?: string[];
}

interface TranslationValues {
  [lang: string]: string;
}

export const TranslationPanelWrapper: React.FC<{ api: any; active: boolean }> = ({ api, active }) => {
  const theme = useTheme();
  const [selectedTranslation, setSelectedTranslation] = useState<Translation | null>(null);
  const [translationValues, setTranslationValues] = useState<TranslationValues>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [allTranslations, setAllTranslations] = useState<Map<string, Translation>>(new Map());
  const [manualKey, setManualKey] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  // Get current language from Storybook globals
  useEffect(() => {
    const updateLanguage = () => {
      const globals = api.getGlobals();
      if (globals?.translationLanguage) {
        setCurrentLanguage(globals.translationLanguage);
      }
    };
    
    updateLanguage();
    
    // Listen for global changes
    const unsubscribe = api.on('globalsUpdated', updateLanguage);
    return () => unsubscribe();
  }, [api]);

  // Listen for translation selection events from the story
  useChannel({
    'translation-mode/select': async (data: { 
      key: string; 
      namespace: string; 
      value: string; 
      context?: string;
      component?: { location?: string; description?: string };
      usage?: string;
      impact?: string;
      userType?: string;
      tone?: string;
      alternativeTerms?: string[];
    }) => {
      setSelectedTranslation(data);
      
      // Load translations for all languages
      const initialValues: TranslationValues = { en: data.value };
      
      // Load translations in parallel for all non-English languages
      await Promise.all(
        SUPPORTED_LANGUAGES.map(async (lang) => {
          if (lang.code !== 'en') {
            const translationData = await loadTranslation(lang.code, data.namespace);
            const translatedValue = getTranslationValue(translationData, data.key);
            initialValues[lang.code] = translatedValue || '';
          }
        })
      );
      
      setTranslationValues(initialValues);
      setHasChanges(false);
    },
  });

  const handleManualSelect = async () => {
    if (!manualKey.trim()) return;
    
    // Parse namespace.key format
    const parts = manualKey.split('.');
    if (parts.length < 2) {
      alert('Please use format: namespace.key (e.g., common.actions.save)');
      return;
    }
    
    const namespace = parts[0];
    const key = parts.slice(1).join('.');
    const fullKey = `${namespace}:${key}`;
    
    // Find the translation in allTranslations
    const translation = allTranslations.get(fullKey);
    if (translation) {
      setSelectedTranslation(translation);
      
      // Load translations for all languages
      const initialValues: TranslationValues = { en: translation.value };
      
      await Promise.all(
        SUPPORTED_LANGUAGES.map(async (lang) => {
          if (lang.code !== 'en') {
            const translationData = await loadTranslation(lang.code, namespace);
            const translatedValue = getTranslationValue(translationData, key);
            initialValues[lang.code] = translatedValue || '';
          }
        })
      );
      
      setTranslationValues(initialValues);
      setHasChanges(false);
      setManualKey('');
    } else {
      alert(`Translation "${manualKey}" not found. Make sure the text is wrapped with TranslationOverlay in the story.`);
    }
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
      // Emit save event to the story
      api.emit('translation-mode/save', {
        key: selectedTranslation.key,
        namespace: selectedTranslation.namespace,
        values: translationValues,
      });
      setHasChanges(false);
    }
  };

  const handleExport = () => {
    // Emit export event to the story which has access to the full context
    api.emit('translation-mode/export');
  };

  const charCount = (lang: string) => translationValues[lang]?.length || 0;
  const sourceLength = translationValues['en']?.length || 0;

  if (!active) {
    return null;
  }

  if (!selectedTranslation) {
    return (
      <ThemeProvider theme={darkTheme}>
      <Paper sx={{ p: 3, bgcolor: 'background.paper', height: '100%' }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
          Translation Editor
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Click on any highlighted text in the story to edit its translation, or enter a translation key below.
        </Alert>
        
        {/* Manual key selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary' }}>
            Select Translation by Key
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="namespace.key (e.g., common.actions.save)"
              value={manualKey}
              onChange={(e) => setManualKey(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualSelect();
                }
              }}
              sx={{ fontFamily: 'monospace' }}
            />
            <Button
              variant="contained"
              onClick={handleManualSelect}
              disabled={!manualKey.trim()}
              sx={{ textTransform: 'none', minWidth: '80px' }}
            >
              Select
            </Button>
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            Use this if click handlers prevent clicking on highlighted text
          </Typography>
        </Box>
        
        {allTranslations.size > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary' }}>
              Captured Translations: {allTranslations.size}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExport}
              sx={{ textTransform: 'none' }}
            >
              Export All
            </Button>
            
            {/* List available translations */}
            <Box sx={{ mt: 2, maxHeight: '300px', overflow: 'auto' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                Available translations:
              </Typography>
              <Stack direction="column" spacing={0.5}>
                {Array.from(allTranslations.values()).map((t) => (
                  <Chip
                    key={`${t.namespace}:${t.key}`}
                    label={`${t.namespace}.${t.key}`}
                    size="small"
                    variant="outlined"
                    onClick={async () => {
                      setSelectedTranslation(t);
                      
                      // Load translations for all languages
                      const initialValues: TranslationValues = { en: t.value };
                      
                      await Promise.all(
                        SUPPORTED_LANGUAGES.map(async (lang) => {
                          if (lang.code !== 'en') {
                            const translationData = await loadTranslation(lang.code, t.namespace);
                            const translatedValue = getTranslationValue(translationData, t.key);
                            initialValues[lang.code] = translatedValue || '';
                          }
                        })
                      );
                      
                      setTranslationValues(initialValues);
                      setHasChanges(false);
                    }}
                    sx={{ 
                      justifyContent: 'flex-start',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Box>
        )}
      </Paper>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
    <Paper sx={{ p: 3, bgcolor: 'background.paper', height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
        Edit Translation
      </Typography>

      {/* Translation Key Info */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          Key
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
          {selectedTranslation.namespace}.{selectedTranslation.key}
        </Typography>
        
        {selectedTranslation.context && (
          <>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2, fontWeight: 600 }}>
              Context
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              {selectedTranslation.context}
            </Typography>
          </>
        )}

        {selectedTranslation.component?.location && (
          <>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, fontWeight: 600 }}>
              Component Location
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.primary' }}>
              {selectedTranslation.component.location}
            </Typography>
          </>
        )}

        {selectedTranslation.component?.description && (
          <>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, fontWeight: 600 }}>
              Component Description
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {selectedTranslation.component.description}
            </Typography>
          </>
        )}

        {selectedTranslation.usage && (
          <>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, fontWeight: 600 }}>
              Usage
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {selectedTranslation.usage}
            </Typography>
          </>
        )}

        {(selectedTranslation.impact || selectedTranslation.userType || selectedTranslation.tone) && (
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {selectedTranslation.impact && (
              <Chip 
                label={`Impact: ${selectedTranslation.impact}`} 
                size="small" 
                color={selectedTranslation.impact.toLowerCase().includes('critical') ? 'error' : selectedTranslation.impact.toLowerCase().includes('high') ? 'warning' : 'default'}
                variant="outlined"
              />
            )}
            {selectedTranslation.userType && (
              <Chip label={`Users: ${selectedTranslation.userType}`} size="small" variant="outlined" />
            )}
            {selectedTranslation.tone && (
              <Chip label={`Tone: ${selectedTranslation.tone}`} size="small" variant="outlined" />
            )}
          </Box>
        )}

        {selectedTranslation.alternativeTerms && selectedTranslation.alternativeTerms.length > 0 && (
          <>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1, fontWeight: 600 }}>
              Alternative Terms
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {selectedTranslation.alternativeTerms.map((term) => (
                <Chip key={term} label={term} size="small" variant="outlined" />
              ))}
            </Box>
          </>
        )}

        {selectedTranslation.usedIn && selectedTranslation.usedIn.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, fontWeight: 600 }}>
              Used in stories
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {selectedTranslation.usedIn.map((story) => (
                <Chip key={story} label={story} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Translation Fields */}
      <Stack spacing={2}>
        {SUPPORTED_LANGUAGES.map((lang, index) => {
          const isSource = lang.code === 'en';
          const isCurrentLanguage = lang.code === currentLanguage;
          const isDisabled = !isCurrentLanguage;
          const charCountValue = charCount(lang.code);
          const hasLengthWarning = !isSource && charCountValue > 0 && Math.abs(charCountValue - sourceLength) > sourceLength * 0.5;
          
          return (
            <Box 
              key={lang.code}
              sx={{
                p: 2,
                borderRadius: 1,
                border: isCurrentLanguage ? '2px solid #2196F3' : '1px solid transparent',
                bgcolor: isCurrentLanguage ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: isDisabled ? 'text.disabled' : isCurrentLanguage ? '#2196F3' : 'text.primary',
                      fontWeight: isCurrentLanguage ? 700 : 500,
                      fontSize: isCurrentLanguage ? '0.95rem' : '0.875rem',
                    }}
                  >
                    {lang.label} {isSource && '(Source)'}
                  </Typography>
                  {isCurrentLanguage && (
                    <Chip
                      label="ACTIVE"
                      size="small"
                      color="primary"
                      sx={{ 
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Box>
                <Chip
                  label={`${charCountValue} chars`}
                  size="small"
                  color={
                    isSource
                      ? 'default'
                      : charCountValue === 0
                      ? 'error'
                      : hasLengthWarning
                      ? 'warning'
                      : 'success'
                  }
                  variant="outlined"
                />
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={6}
                value={translationValues[lang.code] || ''}
                onChange={(e) => handleChange(lang.code, e.target.value)}
                placeholder={isSource ? 'English text' : `${lang.label} translation`}
                disabled={isDisabled}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: isCurrentLanguage ? '#2196F3' : undefined,
                    },
                  },
                }}
              />
              {hasLengthWarning && isCurrentLanguage && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Translation length differs significantly from source ({sourceLength} chars)
                </Alert>
              )}
              {isDisabled && (
                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
                  Switch to {lang.label} in the toolbar to edit this translation
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Actions */}
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges}
          sx={{ textTransform: 'none' }}
        >
          Save Changes
        </Button>
        <Button
          variant="outlined"
          onClick={handleExport}
          sx={{ textTransform: 'none' }}
        >
          Export All
        </Button>
      </Stack>

      {hasChanges && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You have unsaved changes
        </Alert>
      )}
    </Paper>
    </ThemeProvider>
  );
};
