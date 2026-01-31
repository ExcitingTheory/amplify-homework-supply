/**
 * @fileoverview BlockSuggestionMenu - Static sidebar menu for block suggestions.
 * 
 * Displays a list of suggested block types that would pedagogically follow
 * the current content. Embedded in sidebar for non-intrusive suggestions.
 * 
 * @module BlockSuggestionMenu
 */

import React, { useEffect, useRef } from 'react';
import { Box, List, ListItem, ListItemButton, Typography, Chip, CircularProgress, Button, Tooltip } from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';

/**
 * BlockSuggestionMenu component
 * 
 * @param {Object} props
 * @param {Array} props.suggestions - Array of suggestion objects with type, label, icon, reasoning
 * @param {number} props.selectedIndex - Currently selected suggestion index
 * @param {Function} props.onSelect - Callback when suggestion is clicked
 * @param {boolean} props.isLoadingAI - Whether AI suggestions are loading
 * @param {boolean} props.useAI - Whether AI mode is enabled
 */
export default function BlockSuggestionMenu({ 
  suggestions, 
  selectedIndex,
  onSelect, 
  isLoadingAI = false,
  useAI = false,
  onRequestMore,
}) {  
  const { t } = useTranslation('editor');
  const menuRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  
  // Scroll selected item into view
  useEffect(() => {
    if (menuRef.current) {
      const selectedItem = menuRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);
  
  // Show loading state
  if (isLoadingAI) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }
  
  // Show empty state
  if (!suggestions || suggestions.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('blockSuggestionMenu.emptyState')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {t('blockSuggestionMenu.emptyStateHelper')}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box ref={menuRef} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, flex: 1 }}>
          {useAI ? t('blockSuggestionMenu.aiTitle') : t('blockSuggestionMenu.suggestionsTitle')}
        </Typography>
        {isLoadingAI && <CircularProgress size={16} />}
      </Box>
      
      <List disablePadding sx={{ flex: 1, overflow: 'auto' }}>
        {suggestions.map((suggestion, index) => (
          <ListItem 
            key={index} 
            disablePadding
            data-index={index}
          >
            <ListItemButton
              selected={index === selectedIndex}
              onClick={() => onSelect(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              sx={{
                py: useAI ? 2 : 1.5,
                px: 2,
                flexDirection: 'column',
                alignItems: 'stretch',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredIndex === index ? 'scale(1.02)' : 'scale(1)',
                boxShadow: hoveredIndex === index ? 2 : 0,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
                '&:hover': {
                  bgcolor: index === selectedIndex ? 'primary.dark' : 'action.hover',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  bgcolor: suggestion.confidence >= 0.8 ? 'success.main' : 
                          suggestion.confidence >= 0.6 ? 'warning.main' : 
                          'action.disabled',
                  opacity: useAI ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
                <Typography variant="h6" component="span" sx={{ fontSize: '1.5rem' }}>
                  {suggestion.icon}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {suggestion.label}
                    </Typography>
                    {useAI && suggestion.priority && (
                      <Chip 
                        label={suggestion.priority} 
                        size="small" 
                        color={
                          suggestion.priority === 'high' ? 'error' : 
                          suggestion.priority === 'medium' ? 'warning' : 
                          'default'
                        }
                        sx={{ height: 20, fontSize: '11px' }}
                      />
                    )}
                    {useAI && suggestion.confidence !== undefined && (
                      <Chip 
                        label={`${Math.round(suggestion.confidence * 100)}%`}
                        size="small" 
                        variant="outlined"
                        color={
                          suggestion.confidence >= 0.8 ? 'success' : 
                          suggestion.confidence >= 0.6 ? 'warning' : 
                          'default'
                        }
                        sx={{ height: 20, fontSize: '10px', fontWeight: 600 }}
                      />
                    )}
                  </Box>
                  {useAI && suggestion.reasoning && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: index === selectedIndex ? 0.9 : 0.7,
                        display: 'block',
                        mt: 0.5,
                        lineHeight: 1.4,
                      }}
                    >
                      {suggestion.reasoning}
                    </Typography>
                  )}
                  {!useAI && suggestion.description && (
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                      {suggestion.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box 
        sx={{ 
          p: 1.5, 
          borderTop: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'action.hover',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {useAI ? t('blockSuggestionMenu.helperAI') : t('blockSuggestionMenu.helper')}
        </Typography>
        {useAI && onRequestMore && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoAwesomeIcon />}
            onClick={onRequestMore}
            disabled={isLoadingAI}
            sx={{ textTransform: 'none' }}
          >
            {t('blockSuggestionMenu.generateMore')}
          </Button>
        )}
      </Box>
    </Box>
  );
}
