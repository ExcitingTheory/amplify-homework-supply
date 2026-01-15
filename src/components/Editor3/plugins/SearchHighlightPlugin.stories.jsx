import React, { useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { MarkNode } from '@lexical/mark';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { Box, TextField, Typography } from '@mui/material';
import SearchHighlightPlugin from './SearchHighlightPlugin';

export default {
  title: '🔌 Editor Plugins/Search Highlight',
  component: SearchHighlightPlugin,
};

const sampleText = 'The quick brown fox jumps over the lazy dog. Photosynthesis is the process by which plants convert sunlight into energy. Learning Japanese requires dedication and practice.';

const initialConfig = {
  namespace: 'SearchHighlightDemo',
  nodes: [MarkNode],
  theme: {
    mark: 'search-highlight',
  },
  onError: (error) => console.error('Lexical error:', error),
  editorState: () => {
    const root = $getRoot();
    root.clear();
    const paragraph = $createParagraphNode();
    const text = $createTextNode(sampleText);
    paragraph.append(text);
    root.append(paragraph);
  },
};

export const Default = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Search Highlight Plugin Demo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Type a search term to highlight matching text in the editor below.
      </Typography>
      
      <TextField
        fullWidth
        label="Search Term"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Try 'fox', 'the', or 'photo'"
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 2,
          minHeight: 150,
          '& [contenteditable]': {
            outline: 'none',
          },
        }}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={<ContentEditable />}
            placeholder={<div>Type here...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <SearchHighlightPlugin searchTerm={searchTerm} />
        </LexicalComposer>
      </Box>

      {searchTerm && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Highlighting: "{searchTerm}"
        </Typography>
      )}
    </Box>
  );
};

export const WithMultipleMatches = () => {
  const [searchTerm, setSearchTerm] = useState('the');

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Multiple Matches
      </Typography>
      
      <TextField
        fullWidth
        label="Search Term"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 2,
          minHeight: 150,
        }}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={<ContentEditable />}
            placeholder={<div>Type here...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <SearchHighlightPlugin searchTerm={searchTerm} />
        </LexicalComposer>
      </Box>
    </Box>
  );
};

export const CaseInsensitive = () => {
  const [searchTerm, setSearchTerm] = useState('FOX');

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Case Insensitive Search
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Search is case-insensitive. "FOX" will match "fox" and "Fox".
      </Typography>
      
      <TextField
        fullWidth
        label="Search Term"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 2,
          minHeight: 150,
        }}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={<ContentEditable />}
            placeholder={<div>Type here...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <SearchHighlightPlugin searchTerm={searchTerm} />
        </LexicalComposer>
      </Box>
    </Box>
  );
};
