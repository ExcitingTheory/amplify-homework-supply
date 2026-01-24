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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useChannel } from 'storybook/manager-api';

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

  // Listen for translation selection events from the story
  useChannel({
    'translation-mode/select': (data: { 
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
      // Initialize with English value
      setTranslationValues({
        en: data.value,
        ja: '', // TODO: Load from actual translation files
      });
      setHasChanges(false);
    },
    'translation-mode/update-all': (translations: Map<string, Translation>) => {
      setAllTranslations(translations);
    },
  });

  const handleManualSelect = () => {
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
      setTranslationValues({
        en: translation.value,
        ja: '', // TODO: Load from actual translation files
      });
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
              <Stack spacing={0.5}>
                {Array.from(allTranslations.values()).map((t) => (
                  <Chip
                    key={`${t.namespace}:${t.key}`}
                    label={`${t.namespace}.${t.key}`}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedTranslation(t);
                      setTranslationValues({
                        en: t.value,
                        ja: '',
                      });
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
    );
  }

  return (
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
        {/* English (Source) */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
              English (Source)
            </Typography>
            <Chip
              label={`${charCount('en')} chars`}
              size="small"
              color="default"
              variant="outlined"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            value={translationValues['en'] || ''}
            onChange={(e) => handleChange('en', e.target.value)}
            placeholder="English text"
          />
        </Box>

        {/* Japanese */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
              日本語 (Japanese)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`${charCount('ja')} chars`}
                size="small"
                color={
                  charCount('ja') === 0
                    ? 'error'
                    : Math.abs(charCount('ja') - sourceLength) > sourceLength * 0.5
                    ? 'warning'
                    : 'success'
                }
                variant="outlined"
              />
            </Box>
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            value={translationValues['ja'] || ''}
            onChange={(e) => handleChange('ja', e.target.value)}
            placeholder="日本語のテキスト"
          />
          {charCount('ja') > 0 && Math.abs(charCount('ja') - sourceLength) > sourceLength * 0.5 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Translation length differs significantly from source ({sourceLength} chars)
            </Alert>
          )}
        </Box>
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
  );
};
