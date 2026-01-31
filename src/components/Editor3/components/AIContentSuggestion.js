/**
 * @fileoverview AIContentSuggestion - Inline AI content suggestion display.
 * 
 * Renders AI-generated text suggestions inline with the editor content,
 * styled similarly to GitHub Copilot's ghost text.
 * 
 * @module AIContentSuggestion
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Box, CircularProgress, Typography } from '@mui/material';
import { createPortal } from 'react-dom';

/**
 * AIContentSuggestion component
 * 
 * @param {Object} props
 * @param {string} props.suggestion - AI-generated completion text
 * @param {boolean} props.isLoading - Whether suggestion is still loading
 * @param {Range} props.anchorElement - Selection range for positioning
 * @param {Function} props.onAccept - Callback when suggestion is accepted
 * @param {Function} props.onDismiss - Callback when suggestion is dismissed
 */
export default function AIContentSuggestion({ 
  suggestion, 
  isLoading,
  anchorElement,
  onAccept,
  onDismiss,
}) {
  const { t } = useTranslation('editor');
  const suggestionRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  // Position suggestion at cursor
  useEffect(() => {
    if (anchorElement && suggestionRef.current) {
      const rect = anchorElement.getBoundingClientRect();
      
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX,
      });
    }
  }, [anchorElement, suggestion]);
  
  if (!isLoading && !suggestion) {
    return null;
  }
  
  return createPortal(
    <Box
      ref={suggestionRef}
      sx={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        pointerEvents: 'none', // Don't interfere with typing
      }}
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={12} sx={{ color: 'text.disabled' }} />
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.disabled',
              fontStyle: 'italic',
            }}
          >
            Generating...
          </Typography>
        </Box>
      ) : (
        <Typography
          sx={{
            color: 'text.disabled',
            opacity: 0.5,
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontStyle: 'italic',
            borderLeft: '2px solid',
            borderColor: 'primary.main',
            paddingLeft: 0.5,
            maxWidth: '600px',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {suggestion}
        </Typography>
      )}
      
      {!isLoading && suggestion && (
        <Typography
          variant="caption"
          sx={{
            ml: 1,
            color: 'text.disabled',
            bgcolor: 'background.paper',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '10px',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {t('aiContentSuggestion.tabToAccept')}
        </Typography>
      )}
    </Box>,
    document.body
  );
}
