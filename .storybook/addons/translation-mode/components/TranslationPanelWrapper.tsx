import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  LinearProgress,
  Collapse,
  Link,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTheme } from '@mui/material/styles';
import { useTheme as useStorybookTheme } from 'storybook/theming';
import { createEmptyHistoryState } from '@lexical/react/LexicalHistoryPlugin';
import { loadTranslation, loadMetadata, getTranslationValue } from '../utils/translationLoader';
import type { TranslationMetadataEntry } from '../utils/translationLoader';
import PlainTextCell from './PlainTextCell';

// Build MUI theme from Storybook's active theme
function buildMuiTheme(isDark: boolean) {
  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      background: {
        paper: isDark ? '#1a1a1a' : '#ffffff',
        default: isDark ? '#1a1a1a' : '#f6f9fc',
      },
      text: {
        primary: isDark ? '#e0e0e0' : '#2E3338',
        secondary: isDark ? '#999999' : '#5C6570',
      },
    },
  });
}

// All supported languages from globalTypes
const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'de', label: 'Deutsch (German)' },
];

const GITHUB_BASE = 'https://github.com/ExcitingTheory/amplify-homework-supply/blob/main';

/** Build a GitHub URL for a component location path */
function getGitHubUrl(location: string): string {
  // Strip leading ./ or / if present
  const cleaned = location.replace(/^\.?\//, '');
  return `${GITHUB_BASE}/${cleaned}`;
}

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

interface MetadataValues {
  context: string;
  usage: string;
  impact: string;
  userType: string;
  tone: string;
  alternativeTerms: string;
  componentLocation: string;
  componentDescription: string;
}

const emptyMetadata: MetadataValues = {
  context: '',
  usage: '',
  impact: '',
  userType: '',
  tone: '',
  alternativeTerms: '',
  componentLocation: '',
  componentDescription: '',
};

/** Key list for the captured translations overview */
interface KeyListProps {
  allTranslations: Map<string, Translation>;
  keyMetadata: Record<string, TranslationMetadataEntry>;
  keyTranslations: Record<string, Record<string, string>>;
  expandedKeys: Set<string>;
  toggleKeyExpand: (key: string) => void;
  currentLanguage: string;
  sharedHistory: ReturnType<typeof createEmptyHistoryState>;
  /** Per-key edited translation values */
  editedValues: Record<string, Record<string, string>>;
  /** Per-key edited metadata */
  editedMetadata: Record<string, MetadataValues>;
  /** Per-key dirty flags */
  dirtyKeys: Set<string>;
  onTranslationChange: (fullKey: string, lang: string, text: string) => void;
  onMetadataChange: (fullKey: string, field: keyof MetadataValues, text: string) => void;
  onSave: (fullKey: string) => void;
  onBlur: (fullKey: string) => void;
  onExport: () => void;
}

const KeyList: React.FC<KeyListProps> = ({
  allTranslations,
  keyMetadata,
  keyTranslations,
  expandedKeys,
  toggleKeyExpand,
  currentLanguage,
  sharedHistory,
  editedValues,
  editedMetadata,
  dirtyKeys,
  onTranslationChange,
  onMetadataChange,
  onSave,
  onBlur,
  onExport,
}) => {
  const items = useMemo(() => Array.from(allTranslations.values()), [allTranslations]);

  return (
    <Box>
      {items.map((t) => {
        const fullKey = `${t.namespace}:${t.key}`;
        const meta = keyMetadata[fullKey];
        const translations = keyTranslations[fullKey];
        const isExpanded = expandedKeys.has(fullKey);
        const isDirty = dirtyKeys.has(fullKey);
        const editVals = editedValues[fullKey] || translations || {};
        const editMeta = editedMetadata[fullKey];
        const missingLangs = SUPPORTED_LANGUAGES
          .filter((l) => l.code !== 'en' && translations && !translations[l.code])
          .map((l) => l.code);
        const sourceLen = (editVals['en'] || '').length;

        return (
          <Box
            key={fullKey}
            sx={{
              p: 1.5,
              mb: 1,
              borderRadius: 1,
              border: '1px solid',
              borderColor: isDirty ? '#2196F3' : missingLangs.length > 0 ? 'warning.dark' : 'divider',
              bgcolor: isExpanded ? 'action.hover' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
                {/* Key header row — clickable to expand */}
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => toggleKeyExpand(fullKey)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    {isExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.namespace}.{t.key}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    {isDirty && (
                      <Chip label="unsaved" size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                    {missingLangs.length > 0 ? (
                      <Chip label={`${missingLangs.length} missing`} size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    ) : (
                      <Chip label="✓" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                </Box>

                {/* English value preview when collapsed */}
                {!isExpanded && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, pl: 3 }}>
                    {editVals['en'] || translations?.en || t.value}
                  </Typography>
                )}

                {/* Expanded: inline editors */}
                <Collapse in={isExpanded}>
                  <Box sx={{ mt: 1.5, pl: 3 }} onClick={(e) => e.stopPropagation()}>
                    {/* Metadata chips (read-only summary) */}
                    {meta && (
                      <Box sx={{ mb: 1.5 }}>
                        {meta.component?.location && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5, fontFamily: 'monospace' }}>
                            <Link
                              href={getGitHubUrl(meta.component.location)}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ color: 'primary.main', fontSize: 'inherit', fontFamily: 'inherit' }}
                            >
                              {meta.component.location} <OpenInNewIcon sx={{ fontSize: 10, verticalAlign: 'middle' }} />
                            </Link>
                          </Typography>
                        )}
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                          {meta.impact && <Chip label={`Impact: ${meta.impact}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />}
                          {meta.userType && <Chip label={`Users: ${meta.userType}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />}
                          {meta.tone && <Chip label={`Tone: ${meta.tone}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />}
                        </Stack>
                      </Box>
                    )}

                    {/* Editable metadata fields */}
                    {editMeta && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700, display: 'block', mb: 1, fontSize: '0.9rem' }}>
                          Metadata
                        </Typography>
                        <Stack spacing={1}>
                          <Box>
                            <Typography variant="body2" sx={{ color: 'text.primary', display: 'block', mb: 0.5, fontWeight: 600 }}>Context</Typography>
                            <PlainTextCell
                              value={editMeta.context}
                              onChange={(text) => onMetadataChange(fullKey, 'context', text)}
                              onBlur={() => onBlur(fullKey)}
                              placeholder="Translation context"
                              historyState={sharedHistory}
                              multiline={false}
                              minHeight={28}
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ color: 'text.primary', display: 'block', mb: 0.5, fontWeight: 600 }}>Usage</Typography>
                            <PlainTextCell
                              value={editMeta.usage}
                              onChange={(text) => onMetadataChange(fullKey, 'usage', text)}
                              onBlur={() => onBlur(fullKey)}
                              placeholder="How this text is used"
                              historyState={sharedHistory}
                              multiline={false}
                              minHeight={28}
                            />
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ color: 'text.primary', display: 'block', mb: 0.5, fontWeight: 600 }}>Impact</Typography>
                              <PlainTextCell
                                value={editMeta.impact}
                                onChange={(text) => onMetadataChange(fullKey, 'impact', text)}
                                onBlur={() => onBlur(fullKey)}
                                placeholder="critical/high/low"
                                historyState={sharedHistory}
                                multiline={false}
                                minHeight={28}
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ color: 'text.primary', display: 'block', mb: 0.5, fontWeight: 600 }}>Tone</Typography>
                              <PlainTextCell
                                value={editMeta.tone}
                                onChange={(text) => onMetadataChange(fullKey, 'tone', text)}
                                onBlur={() => onBlur(fullKey)}
                                placeholder="formal/casual"
                                historyState={sharedHistory}
                                multiline={false}
                                minHeight={28}
                              />
                            </Box>
                          </Stack>
                        </Stack>
                      </Box>
                    )}

                    <Divider sx={{ my: 1 }} />

                    {/* Inline translation editors per language */}
                    <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700, display: 'block', mb: 1, fontSize: '0.9rem' }}>
                      Translations
                    </Typography>
                    <Stack spacing={1}>
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const val = editVals[lang.code] || '';
                        const isMissing = lang.code !== 'en' && !val;
                        const isCurrent = lang.code === currentLanguage;
                        const isSource = lang.code === 'en';
                        const charLen = val.length;
                        const hasLengthWarning = !isSource && charLen > 0 && sourceLen > 0 && Math.abs(charLen - sourceLen) > sourceLen * 0.5;
                        return (
                          <Box
                            key={lang.code}
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              border: isCurrent ? '1px solid' : '1px solid',
                              borderColor: isCurrent ? 'primary.main' : 'divider',
                              bgcolor: isCurrent ? 'action.selected' : 'transparent',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    color: isMissing ? 'error.light' : isCurrent ? 'primary.main' : 'text.primary',
                                  }}
                                >
                                  {lang.code.toUpperCase()}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                                  {lang.label} {isSource && '(Source)'}
                                </Typography>
                                {isCurrent && (
                                  <Chip label="ACTIVE" size="small" color="primary" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700 }} />
                                )}
                              </Box>
                              <Chip
                                label={`${charLen}`}
                                size="small"
                                color={isSource ? 'default' : charLen === 0 ? 'error' : hasLengthWarning ? 'warning' : 'success'}
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.6rem' }}
                              />
                            </Box>
                            <PlainTextCell
                              value={val}
                              onChange={(text) => onTranslationChange(fullKey, lang.code, text)}
                              onBlur={() => onBlur(fullKey)}
                              placeholder={isSource ? 'English text' : `${lang.label} translation`}
                              historyState={sharedHistory}
                              highlighted={isCurrent}
                              minHeight={32}
                            />
                          </Box>
                        );
                      })}
                    </Stack>

                    {/* Save status for this key */}
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!isDirty}
                        onClick={() => onSave(fullKey)}
                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        Save Now
                      </Button>
                      {isDirty && (
                        <Typography variant="caption" sx={{ color: 'info.light' }}>Autosaving...</Typography>
                      )}
                      {!isDirty && editedValues[fullKey] && (
                        <Typography variant="caption" sx={{ color: 'success.light' }}>Saved</Typography>
                      )}
                    </Box>
                  </Box>
                </Collapse>
              </Box>
          );
        })}
    </Box>
  );
};

export const TranslationPanelWrapper: React.FC<{ api: any; active: boolean }> = ({ api, active }) => {
  const theme = useTheme();
  // Detect Storybook theme to build matching MUI theme
  let sbTheme: any;
  try { sbTheme = useStorybookTheme(); } catch { sbTheme = null; }
  const isDark = sbTheme?.base === 'dark' || 
    (sbTheme == null && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const muiTheme = useMemo(() => buildMuiTheme(isDark), [isDark]);
  // Single shared history state for all Lexical editors — enables cross-editor undo/redo
  const sharedHistory = useMemo(() => createEmptyHistoryState(), []);
  const [allTranslations, setAllTranslations] = useState<Map<string, Translation>>(new Map());
  const [manualKey, setManualKey] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [missingKeysByLang, setMissingKeysByLang] = useState<Record<string, string[]>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedLangs, setExpandedLangs] = useState<Set<string>>(new Set());
  const [keyMetadata, setKeyMetadata] = useState<Record<string, TranslationMetadataEntry>>({});
  const [keyTranslations, setKeyTranslations] = useState<Record<string, Record<string, string>>>({});
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  // Per-key inline edit state
  const [editedValues, setEditedValues] = useState<Record<string, Record<string, string>>>({});
  const [editedMetadata, setEditedMetadata] = useState<Record<string, MetadataValues>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  // Autosave timers per key
  const autosaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const AUTOSAVE_DELAY = 1500; // ms after last change

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

  // Listen for channel events using api.on() directly for reliable cross-iframe communication
  useEffect(() => {
    const handleSelect = async (data: {
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
      console.log('[TranslationPanel] Received select event:', data.namespace, data.key);
      const fullKey = `${data.namespace}:${data.key}`;

      // Ensure this key exists in allTranslations so KeyList can render it
      setAllTranslations((prev) => {
        const next = new Map(prev);
        next.set(fullKey, {
          key: data.key,
          namespace: data.namespace,
          value: data.value,
          context: data.context,
          usedIn: [],
          component: data.component,
          usage: data.usage,
          impact: data.impact,
          userType: data.userType,
          tone: data.tone,
          alternativeTerms: data.alternativeTerms,
        });
        return next;
      });

      // Expand this key
      setExpandedKeys((prev) => new Set(prev).add(fullKey));

      // Initialize edit values from locale files
      const initialValues: Record<string, string> = {};
      await Promise.all(
        SUPPORTED_LANGUAGES.map(async (lang) => {
          const translationData = await loadTranslation(lang.code, data.namespace);
          const translatedValue = getTranslationValue(translationData, data.key);
          initialValues[lang.code] = translatedValue || (lang.code === 'en' ? data.value : '');
        })
      );
      setEditedValues((prev) => prev[fullKey] ? prev : { ...prev, [fullKey]: initialValues });

      // Initialize metadata
      setEditedMetadata((prev) => prev[fullKey] ? prev : {
        ...prev,
        [fullKey]: {
          context: data.context || '',
          usage: data.usage || '',
          impact: data.impact || '',
          userType: data.userType || '',
          tone: data.tone || '',
          alternativeTerms: data.alternativeTerms?.join(', ') || '',
          componentLocation: data.component?.location || '',
          componentDescription: data.component?.description || '',
        },
      });
    };

    const handleUpdateAll = (entries: [string, Translation][]) => {
      console.log('[TranslationPanel] Received update-all, entries:', Array.isArray(entries) ? entries.length : 'not array');
      if (Array.isArray(entries)) {
        const map = new Map<string, Translation>();
        entries.forEach(([key, value]) => map.set(key, value));
        setAllTranslations(map);
      }
    };

    const unsub1 = api.on('translation-mode/select', handleSelect);
    const unsub2 = api.on('translation-mode/update-all', handleUpdateAll);

    // Request current translations from the preview on mount
    console.log('[TranslationPanel] Requesting translations from preview...');
    api.emit('translation-mode/request-all');

    return () => {
      unsub1();
      unsub2();
    };
  }, [api]);

  // Analyze missing keys for each non-English language whenever allTranslations or language changes
  const analyzeMissingKeys = useCallback(async () => {
    if (allTranslations.size === 0) return;
    setIsAnalyzing(true);

    const nonEnLangs = SUPPORTED_LANGUAGES.filter((l) => l.code !== 'en');
    const result: Record<string, string[]> = {};

    // Group captured keys by namespace for efficient loading
    const keysByNamespace = new Map<string, string[]>();
    for (const [, t] of allTranslations) {
      const ns = t.namespace;
      if (!keysByNamespace.has(ns)) keysByNamespace.set(ns, []);
      keysByNamespace.get(ns)!.push(t.key);
    }

    await Promise.all(
      nonEnLangs.map(async (lang) => {
        const missing: string[] = [];
        await Promise.all(
          Array.from(keysByNamespace.entries()).map(async ([ns, keys]) => {
            const data = await loadTranslation(lang.code, ns);
            for (const key of keys) {
              const val = getTranslationValue(data, key);
              if (!val) {
                missing.push(`${ns}.${key}`);
              }
            }
          })
        );
        result[lang.code] = missing;
      })
    );

    setMissingKeysByLang(result);
    setIsAnalyzing(false);
  }, [allTranslations]);

  useEffect(() => {
    analyzeMissingKeys();
  }, [analyzeMissingKeys]);

  const toggleLangExpand = (langCode: string) => {
    setExpandedLangs((prev) => {
      const next = new Set(prev);
      if (next.has(langCode)) next.delete(langCode);
      else next.add(langCode);
      return next;
    });
  };

  const toggleKeyExpand = useCallback(async (fullKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(fullKey)) {
        next.delete(fullKey);
      } else {
        next.add(fullKey);
      }
      return next;
    });

    // Initialize edit state on first expand if not already loaded
    if (!editedValues[fullKey]) {
      const t = allTranslations.get(fullKey);
      if (!t) return;
      const meta = keyMetadata[fullKey];
      const translations = keyTranslations[fullKey];
      
      // Use already-loaded translations or fetch from locale files
      if (translations) {
        setEditedValues((prev) => ({ ...prev, [fullKey]: { ...translations } }));
      } else {
        const initialValues: Record<string, string> = {};
        await Promise.all(
          SUPPORTED_LANGUAGES.map(async (lang) => {
            const translationData = await loadTranslation(lang.code, t.namespace);
            const val = getTranslationValue(translationData, t.key);
            initialValues[lang.code] = val || (lang.code === 'en' ? t.value : '');
          })
        );
        setEditedValues((prev) => ({ ...prev, [fullKey]: initialValues }));
      }
      
      setEditedMetadata((prev) => ({
        ...prev,
        [fullKey]: {
          context: meta?.context || t.context || '',
          usage: meta?.usage || t.usage || '',
          impact: meta?.impact || t.impact || '',
          userType: meta?.userType || t.userType || '',
          tone: meta?.tone || t.tone || '',
          alternativeTerms: (meta?.alternativeTerms || t.alternativeTerms)?.join(', ') || '',
          componentLocation: meta?.component?.location || t.component?.location || '',
          componentDescription: meta?.component?.description || t.component?.description || '',
        },
      }));
    }
  }, [allTranslations, editedValues, keyMetadata, keyTranslations]);

  // Load metadata and per-language values for all captured translations
  const loadKeyDetails = useCallback(async () => {
    if (allTranslations.size === 0) return;

    const metaResult: Record<string, TranslationMetadataEntry> = {};
    const transResult: Record<string, Record<string, string>> = {};

    // Group by namespace
    const keysByNamespace = new Map<string, string[]>();
    for (const [, t] of allTranslations) {
      if (!keysByNamespace.has(t.namespace)) keysByNamespace.set(t.namespace, []);
      keysByNamespace.get(t.namespace)!.push(t.key);
    }

    await Promise.all(
      Array.from(keysByNamespace.entries()).map(async ([ns, keys]) => {
        // Load metadata for this namespace
        const meta = await loadMetadata('en', ns);

        // Load all language translations for this namespace
        const langData: Record<string, any> = {};
        await Promise.all(
          SUPPORTED_LANGUAGES.map(async (lang) => {
            langData[lang.code] = await loadTranslation(lang.code, ns);
          })
        );

        for (const key of keys) {
          const fullKey = `${ns}:${key}`;
          if (meta?.[key]) {
            metaResult[fullKey] = meta[key];
          }
          transResult[fullKey] = {};
          for (const lang of SUPPORTED_LANGUAGES) {
            const val = getTranslationValue(langData[lang.code], key);
            transResult[fullKey][lang.code] = val || '';
          }
        }
      })
    );

    setKeyMetadata(metaResult);
    setKeyTranslations(transResult);
  }, [allTranslations]);

  useEffect(() => {
    loadKeyDetails();
  }, [loadKeyDetails]);

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
      // Expand it inline
      await toggleKeyExpand(fullKey);
      setManualKey('');
    } else {
      alert(`Translation "${manualKey}" not found. Make sure the text is wrapped with TranslationOverlay in the story.`);
    }
  };

  const handleSaveKey = useCallback((fullKey: string) => {
    const t = allTranslations.get(fullKey);
    if (!t) return;
    const values = editedValues[fullKey];
    const meta = editedMetadata[fullKey];
    if (!values) return;
    // Don't save if not dirty
    if (!dirtyKeys.has(fullKey)) return;

    api.emit('translation-mode/save', {
      key: t.key,
      namespace: t.namespace,
      values,
      metadata: meta ? {
        ...meta,
        alternativeTerms: meta.alternativeTerms
          ? meta.alternativeTerms.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        component: {
          location: meta.componentLocation,
          description: meta.componentDescription,
        },
      } : undefined,
    });
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      next.delete(fullKey);
      return next;
    });
    // Clear any pending autosave timer for this key
    if (autosaveTimers.current[fullKey]) {
      clearTimeout(autosaveTimers.current[fullKey]);
      delete autosaveTimers.current[fullKey];
    }
  }, [allTranslations, editedValues, editedMetadata, dirtyKeys, api]);

  // Keep a ref to the latest handleSaveKey so timers don't capture stale closures
  const handleSaveKeyRef = useRef(handleSaveKey);
  handleSaveKeyRef.current = handleSaveKey;

  /** Schedule an autosave for a key, resetting any existing timer */
  const scheduleAutosave = useCallback((fullKey: string) => {
    if (autosaveTimers.current[fullKey]) {
      clearTimeout(autosaveTimers.current[fullKey]);
    }
    autosaveTimers.current[fullKey] = setTimeout(() => {
      handleSaveKeyRef.current(fullKey);
      delete autosaveTimers.current[fullKey];
    }, AUTOSAVE_DELAY);
  }, []);

  const handleTranslationChange = useCallback((fullKey: string, lang: string, text: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [fullKey]: { ...(prev[fullKey] || {}), [lang]: text },
    }));
    setDirtyKeys((prev) => new Set(prev).add(fullKey));
    scheduleAutosave(fullKey);
  }, [scheduleAutosave]);

  const handleMetadataChange = useCallback((fullKey: string, field: keyof MetadataValues, text: string) => {
    setEditedMetadata((prev) => ({
      ...prev,
      [fullKey]: { ...(prev[fullKey] || emptyMetadata), [field]: text },
    }));
    setDirtyKeys((prev) => new Set(prev).add(fullKey));
    scheduleAutosave(fullKey);
  }, [scheduleAutosave]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(autosaveTimers.current).forEach(clearTimeout);
    };
  }, []);

  /** Save immediately on blur if dirty */
  const handleBlurSave = useCallback((fullKey: string) => {
    // Clear pending autosave and save now
    if (autosaveTimers.current[fullKey]) {
      clearTimeout(autosaveTimers.current[fullKey]);
      delete autosaveTimers.current[fullKey];
    }
    // Use a microtask to ensure the latest state is captured
    Promise.resolve().then(() => handleSaveKeyRef.current(fullKey));
  }, []);

  const handleExport = () => {
    // Emit export event to the story which has access to the full context
    api.emit('translation-mode/export');
  };

  if (!active) {
    return null;
  }

  return (
    <ThemeProvider theme={muiTheme}>
    <Paper sx={{ p: 3, bgcolor: 'background.paper', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
        Translation Editor
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Click on any highlighted text in the story, or expand a key below to edit inline.
      </Alert>
      
      {/* Manual key selection */}
      <Box sx={{ mb: 2 }}>
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
            Go
          </Button>
        </Stack>
      </Box>
      
      {allTranslations.size > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
              {allTranslations.size} keys captured
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExport}
              sx={{ textTransform: 'none' }}
            >
              Export All
            </Button>
          </Box>

          {/* Missing Keys by Language */}
          {isAnalyzing && <LinearProgress sx={{ mb: 1 }} />}
            {!isAnalyzing && Object.keys(missingKeysByLang).length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Missing Keys by Language
                </Typography>
                <Box
                  component="table"
                  sx={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    '& th, & td': {
                      px: 1,
                      py: 0.5,
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      borderBottom: 1,
                      borderColor: 'divider',
                    },
                    '& th': {
                      color: 'text.secondary',
                      fontWeight: 600,
                    },
                  }}
                >
                  <thead>
                    <tr>
                      <th>Language</th>
                      <th>Missing</th>
                      <th>Coverage</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {SUPPORTED_LANGUAGES.filter((l) => l.code !== 'en').map((lang) => {
                      const missing = missingKeysByLang[lang.code] || [];
                      const total = allTranslations.size;
                      const translated = total - missing.length;
                      const pct = total > 0 ? Math.round((translated / total) * 100) : 100;
                      const isExpanded = expandedLangs.has(lang.code);
                      const color = missing.length === 0 ? 'success.main' : missing.length >= total ? 'error.main' : 'warning.main';
                      return (
                        <React.Fragment key={lang.code}>
                          <Box
                            component="tr"
                            onClick={() => missing.length > 0 && toggleLangExpand(lang.code)}
                            sx={{ cursor: missing.length > 0 ? 'pointer' : 'default', '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <td>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {lang.label}
                              </Typography>
                            </td>
                            <td>
                              <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
                                {missing.length}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {' / '}{total}
                              </Typography>
                            </td>
                            <td>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ flex: 1, height: 4, bgcolor: 'action.disabledBackground', borderRadius: 2, overflow: 'hidden' }}>
                                  <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 2 }} />
                                </Box>
                                <Typography variant="caption" sx={{ color, minWidth: 32, textAlign: 'right', fontWeight: 600 }}>
                                  {pct}%
                                </Typography>
                              </Box>
                            </td>
                            <td>
                              {missing.length > 0 && (isExpanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />)}
                            </td>
                          </Box>
                          {isExpanded && missing.length > 0 && (
                            <tr>
                              <td colSpan={4} style={{ paddingTop: 0 }}>
                                <Box sx={{ pl: 1, pb: 0.5 }}>
                                  {missing.map((k) => (
                                    <Typography key={k} variant="caption" sx={{ display: 'block', fontFamily: 'monospace', fontSize: '0.7rem', color: 'error.light' }}>
                                      {k}
                                    </Typography>
                                  ))}
                                </Box>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 1.5 }} />

            {/* Translation key list with inline editors */}
            <KeyList
              allTranslations={allTranslations}
              keyMetadata={keyMetadata}
              keyTranslations={keyTranslations}
              expandedKeys={expandedKeys}
              toggleKeyExpand={toggleKeyExpand}
              currentLanguage={currentLanguage}
              sharedHistory={sharedHistory}
              editedValues={editedValues}
              editedMetadata={editedMetadata}
              dirtyKeys={dirtyKeys}
              onTranslationChange={handleTranslationChange}
              onMetadataChange={handleMetadataChange}
              onSave={handleSaveKey}
              onBlur={handleBlurSave}
              onExport={handleExport}
            />
          </Box>
        )}
      </Paper>
      </ThemeProvider>
    );
  
};
