/**
 * @fileoverview BlockSuggestionMenu - Floating menu for block suggestions.
 * 
 * Displays a list of suggested block types that would pedagogically follow
 * the current content. Supports keyboard navigation and click selection.
 * 
 * @module BlockSuggestionMenu
 */

import React, { useEffect, useRef } from 'react';
import { Box, Paper, List, ListItem, ListItemButton, ListItemText, Typography, Chip, CircularProgress } from '@mui/material';
import { createPortal } from 'react-dom';

/**
 * BlockSuggestionMenu component
 * 
 * @param {Object} props
 * @param {Array} props.suggestions - Array of suggestion objects with type, label, icon, reasoning
 * @param {number} props.selectedIndex - Currently selected suggestion index
 * @param {Function} props.onSelect - Callback when suggestion is clicked
 * @param {Range} props.anchorElement - Selection range for positioning
 * @param {boolean} props.isLoadingAI - Whether AI suggestions are loading
 * @param {boolean} props.useAI - Whether AI mode is enabled
 */
export default function BlockSuggestionMenu({ 
  suggestions, 
  selectedIndex, 
  onSelect, 
  anchorElement,
  isLoadingAI = false,
  useAI = false,
}) {
  const menuRef = useRef(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  
  // Position menu below cursor
  useEffect(() => {
    if (anchorElement && menuRef.current) {
      const rect = anchorElement.getBoundingClientRect();
      const menuHeight = menuRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      // Position below cursor, or above if not enough space
      let top = rect.bottom + window.scrollY + 8;
      if (top + menuHeight > viewportHeight + window.scrollY) {
        top = rect.top + window.scrollY - menuHeight - 8;
      }
      
      setPosition({
        top,
        left: rect.left + window.scrollX,
      });
    }
  }, [anchorElement]);
  
  // Scroll selected item into view
  useEffect(() => {
    if (menuRef.current) {
      const selectedItem = menuRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);
  
  if (!suggestions || suggestions.length === 0) {
    return null;
  }
  
  return createPortal(
    <Paper
      ref={menuRef}
      elevation={8}
      sx={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
        minWidth: useAI ? 400 : 280,
        maxWidth: useAI ? 600 : 400,
        maxHeight: 400,
        overflow: 'auto',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: useAI ? 'primary.main' : 'divider',
      }}
    >
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, flex: 1 }}>
          {useAI ? '🤖 AI-Powered Suggestions' : '💡 Suggested blocks'}
        </Typography>
        {isLoadingAI && <CircularProgress size={14} />}
      </Box>
      
      <List disablePadding>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                <Typography variant="h6" component="span">
                  {suggestion.icon}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        sx={{ height: 18, fontSize: '10px' }}
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
                        lineHeight: 1.3,
                      }}
                    >
                      {suggestion.reasoning}
                    </Typography>
                  )}
                  {!useAI && suggestion.description && (
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {suggestion.description}
                    </Typography>
                  )}
                </Box>
                {index === selectedIndex && (
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Tab ↹
                  </Typography>
                )}
              </Box>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box 
        sx={{ 
          p: 1, 
          borderTop: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          ↑↓ Navigate • Tab/Enter Select • Esc Dismiss
        </Typography>
      </Box>
    </Paper>,
    document.body
  );
}
