import React, { useContext, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Typography,
  Divider,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { TranslationCaptureContext } from '../contexts/TranslationCaptureContext';
import { TranslationExporter, ExportOptions } from '../utils/TranslationExporter';

export const ExportDialog: React.FC = () => {
  const { translations } = useContext(TranslationCaptureContext);
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'json' | 'csv' | 'diff'>('json');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en', 'ja']);
  const [includeEmpty, setIncludeEmpty] = useState(false);

  const handleExport = () => {
    const namespaces = Array.from(new Set(Array.from(translations.values()).map((t) => t.namespace)));

    const options: ExportOptions = {
      format,
      languages: selectedLanguages,
      namespaces,
      includeEmpty,
    };

    TranslationExporter.downloadTranslations(translations, options);
    setOpen(false);
  };

  const translationCount = translations.size;
  const namespaces = Array.from(new Set(Array.from(translations.values()).map((t) => t.namespace)));

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => setOpen(true)}
        disabled={translationCount === 0}
      >
        Export Translations ({translationCount})
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Translations</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Found {translationCount} translations across {namespaces.length} namespaces
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Namespaces: {namespaces.join(', ')}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Export Format</FormLabel>
            <RadioGroup value={format} onChange={(e) => setFormat(e.target.value as any)}>
              <FormControlLabel value="json" control={<Radio />} label="JSON (Standard i18n format)" />
              <FormControlLabel value="csv" control={<Radio />} label="CSV (Spreadsheet friendly)" />
              <FormControlLabel value="diff" control={<Radio />} label="Diff (Show changes only)" />
            </RadioGroup>
          </FormControl>

          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Languages</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedLanguages.includes('en')}
                    onChange={(e) => {
                      setSelectedLanguages(
                        e.target.checked
                          ? [...selectedLanguages, 'en']
                          : selectedLanguages.filter((l) => l !== 'en')
                      );
                    }}
                  />
                }
                label="English (en)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedLanguages.includes('ja')}
                    onChange={(e) => {
                      setSelectedLanguages(
                        e.target.checked
                          ? [...selectedLanguages, 'ja']
                          : selectedLanguages.filter((l) => l !== 'ja')
                      );
                    }}
                  />
                }
                label="Japanese (ja)"
              />
            </FormGroup>
          </FormControl>

          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={includeEmpty} onChange={(e) => setIncludeEmpty(e.target.checked)} />}
              label="Include empty translations"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={<DownloadIcon />}
            disabled={selectedLanguages.length === 0}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
