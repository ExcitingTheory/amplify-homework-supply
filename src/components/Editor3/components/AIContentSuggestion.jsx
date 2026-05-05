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
import { Box, Skeleton, Typography } from '@mui/material';
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
  const { t } = useTranslation('editor.ai');
  const suggestionRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  // Position suggestion at cursor - inline with text, not below
  useEffect(() => {
    if (anchorElement && suggestionRef.current) {
      const rect = anchorElement.getBoundingClientRect();
      
      setPosition({
        top: rect.top + window.scrollY,
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
        display: 'inline',
        pointerEvents: 'none', // Don't interfere with typing
      }}
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="circular" width={12} height={12} />
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
          component="span"
          sx={{
            color: 'text.disabled',
            opacity: 0.5,
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontStyle: 'italic',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {suggestion}
        </Typography>
      )}
      
      {!isLoading && suggestion && (
        <Typography
          component="span"
          variant="caption"
          sx={{
            ml: 0.5,
            color: 'text.disabled',
            opacity: 0.6,
            fontSize: '10px',
          }}
        >
          {t('aiContentSuggestion.tabToAccept')}
        </Typography>
      )}
    </Box>,
    document.body
  );
}
