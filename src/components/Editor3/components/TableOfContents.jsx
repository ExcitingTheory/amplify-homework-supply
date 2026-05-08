/**
 * @fileoverview TableOfContents - Displays a navigable table of contents from editor headings
 * @module TableOfContents
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isElementNode } from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { List, ListItem, ListItemButton, ListItemText, Typography, Box } from '@mui/material';
import { useTranslations } from 'next-intl';

/**
 * Extracts heading nodes from the editor state
 */
function getHeadings(editor) {
  const headings = [];
  
  editor.getEditorState().read(() => {
    const root = $getRoot();
    const children = root.getChildren();
    
    children.forEach((node) => {
      if ($isHeadingNode(node)) {
        headings.push({
          key: node.getKey(),
          text: node.getTextContent(),
          tag: node.getTag(),
          level: parseInt(node.getTag().replace('h', ''), 10),
        });
      }
    });
  });
  
  return headings;
}

/**
 * Scrolls to a specific node in the editor
 */
function scrollToNode(editor, key) {
  editor.getEditorState().read(() => {
    const element = editor.getElementByKey(key);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

export default function TableOfContents() {
  const t = useTranslations('editor.shared');
  const [editor] = useLexicalComposerContext();
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    // Update headings on initial load
    setHeadings(getHeadings(editor));

    // Subscribe to editor updates
    return editor.registerUpdateListener(({ editorState }) => {
      setHeadings(getHeadings(editor));
    });
  }, [editor]);

  if (headings.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>{t('tableOfContents.emptyState')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
        {t('tableOfContents.title')}
      </Typography>
      <List dense>
        {headings.map((heading) => (
          <ListItem key={heading.key} disablePadding>
            <ListItemButton
              onClick={() => scrollToNode(editor, heading.key)}
              sx={{
                pl: heading.level * 2,
              }}
            >
              <ListItemText
                primary={heading.text || '(Empty heading)'}
                primaryTypographyProps={{
                  variant: heading.level === 1 ? 'body1' : 'body2',
                  fontWeight: heading.level === 1 ? 600 : 400,
                  sx: {
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
