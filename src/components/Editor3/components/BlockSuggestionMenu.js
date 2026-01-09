/**
 * @fileoverview BlockSuggestionMenu - Static sidebar menu for block suggestions.
 * 
 * Displays a list of suggested block types that would pedagogically follow
 * the current content. Embedded in sidebar for non-intrusive suggestions.
 * 
 * @module BlockSuggestionMenu
 */

import React, { useEffect, useRef } from 'react';
import { Box, List, ListItem, ListItemButton, Typography, Chip, CircularProgress } from '@mui/material';

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
}) {  
  const menuRef = useRef(null);
  
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
          No suggestions available yet.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Start typing in the editor to see AI-powered block suggestions.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box ref={menuRef} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, flex: 1 }}>
          {useAI ? '🤖 AI-Powered Suggestions' : '💡 Suggested Blocks'}
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
              sx={{
                py: useAI ? 2 : 1.5,
                px: 2,
                flexDirection: 'column',
                alignItems: 'stretch',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
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
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Click a suggestion to insert it into your lesson
        </Typography>
      </Box>
    </Box>
  );
}
