/**
 * ContentPreview - Renders generated Lexical content with insert capability
 * 
 * Displays AI-generated content in a preview card with options to:
 * - View the generated content rendered as Lexical nodes
 * - Copy the content as markdown
 * - Insert directly into the editor
 * - Regenerate with different parameters
 * 
 * @module ChatSidebar/ContentPreview
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Lexical imports for rendering
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';

interface ContentPreviewProps {
  contentType: string;
  topic: string;
  generatedContent: string;
  format?: 'markdown' | 'lexical' | 'html';
  onInsert?: (content: string, format: string) => void;
  onRegenerate?: () => void;
  onCopy?: () => void;
  compact?: boolean;
  showInsertButton?: boolean;
}

/**
 * ContentPreview Component
 * 
 * Renders a preview of AI-generated content with multiple view modes:
 * - Preview: Rendered Lexical/HTML view
 * - Raw: Raw markdown/code view
 * 
 * Provides actions:
 * - Copy to clipboard
 * - Insert into editor
 * - Regenerate content
 */
export const ContentPreview: React.FC<ContentPreviewProps> = ({
  contentType,
  topic,
  generatedContent,
  format = 'markdown',
  onInsert,
  onRegenerate,
  onCopy,
  compact = false,
  showInsertButton = true,
}) => {
  const { t } = useTranslation('components');
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  }, [generatedContent, onCopy]);

  const handleInsert = useCallback(() => {
    onInsert?.(generatedContent, format);
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
  }, [generatedContent, format, onInsert]);

  const getContentTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      explanation: '📖',
      example: '💡',
      practice: '✏️',
      quiz: '❓',
      summary: '📝',
      vocabulary_section: '📚',
      custom: '✨',
    };
    return icons[type] || '📄';
  };

  // Lexical editor configuration for preview
  const editorConfig = useMemo(() => ({
    namespace: 'ContentPreview',
    editable: false,
    theme: {
      paragraph: 'editor-paragraph',
      heading: {
        h1: 'editor-heading-h1',
        h2: 'editor-heading-h2',
        h3: 'editor-heading-h3',
      },
      list: {
        ol: 'editor-list-ol',
        ul: 'editor-list-ul',
        listitem: 'editor-listitem',
      },
      code: 'editor-code',
      codeHighlight: {
        keyword: 'editor-code-keyword',
        string: 'editor-code-string',
      },
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical preview error:', error);
    },
    editorState: format === 'markdown' 
      ? () => $convertFromMarkdownString(generatedContent, TRANSFORMERS)
      : undefined,
  }), [generatedContent, format]);

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 2,
        border: 1,
        borderColor: 'primary.main',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'primary.light',
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {getContentTypeIcon(contentType)} {t('chatSidebar.contentPreview.generatedContent', { contentType: contentType.replace(/_/g, ' ') })}
          </Typography>
          <Chip
            label={format}
            size="small"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        </Box>

        <Stack direction="row" spacing={0.5}>
          <Tooltip title={copied ? t('chatSidebar.contentPreview.copied') : t('chatSidebar.contentPreview.copyToClipboard')}>
            <IconButton
              size="small"
              onClick={handleCopy}
              color={copied ? 'success' : 'default'}
            >
              {copied ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {onRegenerate && (
            <Tooltip title={t('chatSidebar.contentPreview.regenerateContent')}>
              <IconButton size="small" onClick={onRegenerate}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* Topic */}
      {topic && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('chatSidebar.contentPreview.topic')}: {topic}
          </Typography>
        </Box>
      )}

      {/* View Mode Tabs */}
      <Tabs
        value={viewMode}
        onChange={(_, newValue) => setViewMode(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}
      >
        <Tab
          label={t('chatSidebar.contentPreview.preview')}
          value="preview"
          icon={<VisibilityIcon fontSize="small" />}
          iconPosition="start"
          sx={{ minHeight: 40 }}
        />
        <Tab
          label={t('chatSidebar.contentPreview.raw')}
          value="raw"
          icon={<CodeIcon fontSize="small" />}
          iconPosition="start"
          sx={{ minHeight: 40 }}
        />
      </Tabs>

      {/* Content Display */}
      <Box
        sx={{
          p: 2,
          maxHeight: compact ? 300 : 500,
          overflow: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        {viewMode === 'preview' && format === 'markdown' && (
          <Box
            sx={{
              '& .editor-paragraph': {
                mb: 1,
              },
              '& .editor-heading-h1': {
                fontSize: '2rem',
                fontWeight: 700,
                mb: 1.5,
                mt: 2,
              },
              '& .editor-heading-h2': {
                fontSize: '1.5rem',
                fontWeight: 600,
                mb: 1,
                mt: 1.5,
              },
              '& .editor-heading-h3': {
                fontSize: '1.25rem',
                fontWeight: 600,
                mb: 0.75,
                mt: 1,
              },
              '& .editor-list-ol, & .editor-list-ul': {
                pl: 3,
                mb: 1,
              },
              '& .editor-listitem': {
                mb: 0.5,
              },
              '& .editor-code': {
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                overflow: 'auto',
              },
            }}
          >
            <LexicalComposer initialConfig={editorConfig}>
              <RichTextPlugin
                contentEditable={<ContentEditable style={{ outline: 'none' }} />}
                placeholder={null}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            </LexicalComposer>
          </Box>
        )}

        {viewMode === 'preview' && format !== 'markdown' && (
          <Box
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
              {generatedContent}
            </Typography>
          </Box>
        )}

        {viewMode === 'raw' && (
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              bgcolor: 'custom.codeBlock',
              color: 'text.primary',
              borderRadius: 1,
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {generatedContent}
          </Box>
        )}
      </Box>

      {/* Actions */}
      {showInsertButton && onInsert && (
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'action.hover',
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
          }}
        >
          {inserted && (
            <Alert severity="success" sx={{ flex: 1, py: 0 }}>
              {t('chatSidebar.contentPreview.successMessage')}
            </Alert>
          )}
          
          <Button
            variant="contained"
            startIcon={<InsertDriveFileIcon />}
            onClick={handleInsert}
            disabled={inserted}
            color={inserted ? 'success' : 'primary'}
            data-tour="insert-button"
          >
            {inserted ? t('chatSidebar.contentPreview.inserted') : t('chatSidebar.contentPreview.insertIntoEditor')}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default ContentPreview;
