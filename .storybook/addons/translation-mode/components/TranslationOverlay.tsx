import React, { useContext, useState, useRef, useEffect } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { addons } from 'storybook/preview-api';
import { TranslationModeContext } from '../contexts/TranslationModeContext';
import { TranslationCaptureContext } from '../contexts/TranslationCaptureContext';
import { loadTranslation, getTranslationValue } from '../utils/translationLoader';

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

  // Capture this translation on mount with full metadata - only once
  useEffect(() => {
    // Skip if already captured
    if (capturedRef.current) return;
    
    let isMounted = true;
    
    async function loadMetadata() {
      // Load English translation file to get full metadata
      const enData = await loadTranslation('en', namespace);
      const fullData = enData?.[tKey];
      
      if (!isMounted) return;
      
      // Extract metadata from the English translation file
      const metadata = typeof fullData === 'object' && fullData !== null ? {
        context: fullData.context || context,
        component: fullData.component,
        usage: fullData.usage,
        impact: fullData.impact,
        userType: fullData.userType,
        tone: fullData.tone,
        alternativeTerms: fullData.alternativeTerms,
      } : {
        context,
      };
      
      captureTranslation({
        key: tKey,
        namespace,
        value: typeof fullData === 'object' && fullData !== null ? fullData.value : value,
        defaultValue,
        usedIn: storyName ? [storyName] : undefined,
        ...metadata,
      });
      
      // Mark as captured
      capturedRef.current = true;
    }
    
    loadMetadata();
    
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

  // Get the actual translated text to display
  const translation = getTranslation(tKey, namespace);

  if (mode === 'off') {
    return <>{children}</>;
  }

  const hasAllTranslations = true; // TODO: Check if all languages have translations
  const hasPartialTranslations = false; // TODO: Check if some languages are missing
  const hasMissingTranslations = false; // TODO: Check if no translations exist

  const handleClick = (e: React.MouseEvent) => {
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
  
  const tooltipContent = (
    <Box
      onClick={handleClick}
      sx={{ 
        p: 1,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
      }}
    >
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
  );

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
          cursor: mode === 'edit' ? 'pointer' : 'default',
          outline: hover ? `2px solid` : 'none',
          outlineColor: getOutlineColor(),
          outlineOffset: '2px',
          borderRadius: '2px',
          transition: 'outline 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: mode === 'edit' ? 'action.hover' : 'transparent',
          },
        }}
      >
        {translatedText || children}
      </Box>
    </Tooltip>
  );
};
