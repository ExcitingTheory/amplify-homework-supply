import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { addons } from 'storybook/preview-api';
import { TranslationModeContext } from '../contexts/TranslationModeContext';
import { TranslationCaptureContext } from '../contexts/TranslationCaptureContext';
import { loadTranslation, loadMetadata, getTranslationValue } from '../utils/translationLoader';

const NON_EN_LANGUAGES = ['ja', 'es', 'fr', 'zh', 'de'];

export interface TranslationOverlayProps {
  tKey: string;
  namespace: string;
  value: string;
  children: React.ReactNode;
  defaultValue?: string;
  context?: string;
  storyName?: string;
}

export const TranslationOverlay: React.FC<TranslationOverlayProps> = ({
  tKey,
  namespace,
  value,
  children,
  defaultValue,
  context,
  storyName: propStoryName,
}) => {
  const { mode, displayLanguage, storyName: contextStoryName } = useContext(TranslationModeContext);
  const { captureTranslation, getTranslation } = useContext(TranslationCaptureContext);
  const [hover, setHover] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  // Track if we've already captured this translation to prevent duplicates
  const capturedRef = useRef(false);
  
  // Use story name from props first, then context
  const storyName = propStoryName || contextStoryName;

  // Debug logging for mode changes
  useEffect(() => {
    console.debug(`[TranslationOverlay] Mode changed to: ${mode} for key: ${tKey}`);
  }, [mode, tKey]);

  // Capture this translation on mount with full metadata - only once
  useEffect(() => {
    // Skip if already captured
    if (capturedRef.current) return;
    
    let isMounted = true;
    
    async function loadCaptureMetadata() {
      // Load metadata from translation-cache .meta.json first, fall back to English locale file
      const metaData = await loadMetadata('en', namespace);
      const metaEntry = metaData?.[tKey];
      
      // Also load English translation value
      const enData = await loadTranslation('en', namespace);
      const enValue = getTranslationValue(enData, tKey);
      
      if (!isMounted) return;
      
      // Prefer .meta.json metadata, fall back to inline locale data
      const metadata = metaEntry ? {
        context: metaEntry.context || context,
        component: metaEntry.component,
        usage: metaEntry.usage,
        impact: metaEntry.impact,
        userType: metaEntry.userType,
        tone: metaEntry.tone,
        alternativeTerms: metaEntry.alternativeTerms,
      } : {
        context,
      };
      
      captureTranslation({
        key: tKey,
        namespace,
        value: enValue || value,
        defaultValue,
        usedIn: storyName ? [storyName] : undefined,
        ...metadata,
      });
      
      // Mark as captured
      capturedRef.current = true;
    }
    
    loadCaptureMetadata();
    
    return () => {
      isMounted = false;
    };
    // Removed captureTranslation from deps - it's stable
    // Only re-capture if the key or namespace changes
  }, [tKey, namespace]);

  // Load translation when language changes
  useEffect(() => {
    let isMounted = true;
    
    async function loadText() {
      if (displayLanguage === 'en') {
        setTranslatedText(null); // Use original children for English
        return;
      }
      
      const data = await loadTranslation(displayLanguage, namespace);
      const translated = getTranslationValue(data, tKey);
      
      if (isMounted) {
        setTranslatedText(translated || null);
      }
    }
    
    loadText();
    
    return () => {
      isMounted = false;
    };
  }, [displayLanguage, namespace, tKey]);

  // Track translation availability across languages
  const [missingLanguages, setMissingLanguages] = useState<string[]>([]);

  // Check which languages are missing this key
  const checkTranslationAvailability = useCallback(async () => {
    const missing: string[] = [];
    await Promise.all(
      NON_EN_LANGUAGES.map(async (lang) => {
        const data = await loadTranslation(lang, namespace);
        const val = getTranslationValue(data, tKey);
        if (!val) {
          missing.push(lang);
        }
      })
    );
    setMissingLanguages(missing);
  }, [namespace, tKey]);

  useEffect(() => {
    if (mode === 'off') return;
    checkTranslationAvailability();
  }, [mode, checkTranslationAvailability]);

  // Get the actual translated text to display
  const translation = getTranslation(tKey, namespace);

  if (mode === 'off') {
    return <>{translatedText || children}</>;
  }

  const hasMissingTranslations = missingLanguages.length === NON_EN_LANGUAGES.length;
  const hasPartialTranslations = missingLanguages.length > 0 && !hasMissingTranslations;
  const hasAllTranslations = missingLanguages.length === 0;

  const handleClick = (e: React.MouseEvent) => {
    // Allow normal click-through when holding Shift or Cmd/Ctrl
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      console.debug('[TranslationOverlay] Modifier key held, allowing click-through');
      return; // Don't stop propagation, let the click pass through
    }
    
    e.stopPropagation();
    
    // Emit full translation data to the addon panel
    const channel = addons.getChannel();
    const fullTranslation = getTranslation(tKey, namespace);
    channel.emit('translation-mode/select', {
      key: tKey,
      namespace,
      value: fullTranslation?.value || value,
      context: fullTranslation?.context || context,
      usedIn: fullTranslation?.usedIn,
      component: fullTranslation?.component,
      usage: fullTranslation?.usage,
      impact: fullTranslation?.impact,
      userType: fullTranslation?.userType,
      tone: fullTranslation?.tone,
      alternativeTerms: fullTranslation?.alternativeTerms,
    });
  };

  const getOutlineColor = () => {
    if (!hover) return 'transparent';
    if (hasMissingTranslations) return 'error.main';
    if (hasPartialTranslations) return 'warning.main';
    return 'success.main';
  };

  const tooltipPath = `${namespace}.${tKey}`;
  const missingLabel = missingLanguages.length > 0
    ? `Missing: ${missingLanguages.join(', ').toUpperCase()}`
    : 'All languages translated';
  
  const tooltipContent = (
    <Box
      onClick={handleClick}
      sx={{ 
        p: 1,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <EditIcon sx={{ fontSize: '1rem' }} />
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '0.75rem',
            fontWeight: 500,
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          Edit: {tooltipPath}
        </Typography>
      </Box>
      <Typography 
        variant="caption" 
        sx={{ 
          fontSize: '0.65rem',
          opacity: 0.85,
          color: hasMissingTranslations ? 'error.light' : hasPartialTranslations ? 'warning.light' : 'success.light',
          fontWeight: 600,
        }}
      >
        {missingLabel}
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ 
          fontSize: '0.65rem',
          opacity: 0.7,
          fontStyle: 'italic',
        }}
      >
        Hold ⇧/⌘/Ctrl to click through
      </Typography>
    </Box>
  );

  // In edit mode, don't use tooltip to avoid click event interference
  if (mode === 'edit') {
    return (
      <Box
        ref={elementRef}
        component="span"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={handleClick}
        sx={{
          display: 'inline',
          position: 'relative',
          cursor: 'pointer',
          outline: hover ? `2px solid` : 'none',
          outlineColor: getOutlineColor(),
          outlineOffset: '2px',
          borderRadius: '2px',
          transition: 'outline 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {translatedText || children}
      </Box>
    );
  }

  return (
    <Tooltip 
      title={mode === 'highlight' ? tooltipContent : ''} 
      placement="top"
      arrow
      disableInteractive={false}
      enterDelay={0}
      leaveDelay={800}
    >
      <Box
        ref={elementRef}
        component="span"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={handleClick}
        sx={{
          display: 'inline',
          position: 'relative',
          cursor: mode === 'highlight' ? 'pointer' : 'default',
          outline: hover ? `2px solid` : 'none',
          outlineColor: getOutlineColor(),
          outlineOffset: '2px',
          borderRadius: '2px',
          transition: 'outline 0.2s ease-in-out',
        }}
      >
        {translatedText || children}
      </Box>
    </Tooltip>
  );
};
