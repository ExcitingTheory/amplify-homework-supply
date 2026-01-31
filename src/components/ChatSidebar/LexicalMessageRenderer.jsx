/**
 * LexicalMessageRenderer
 * 
 * Read-only Lexical editor surface for rendering chat messages with markdown support.
 * Provides a unified editing experience across the application by using the same
 * Lexical components for display as the main editor uses for editing.
 * 
 * Features:
 * - Markdown parsing to Lexical AST
 * - Code syntax highlighting
 * - Support for all standard markdown elements (headings, lists, links, etc.)
 * - Streaming support for real-time AI responses
 * - Optimized for performance with React.memo
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'next-i18next';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { chatMessageEditorConfig } from '../Editor3/configs/chatMessageConfig';
import styles from './LexicalMessageRenderer.module.css';

/**
 * Plugin to populate editor with content
 * Converts markdown to Lexical nodes using @lexical/markdown
 */
const ContentPlugin = ({ content }) => {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    if (!content) return;
    
    editor.update(() => {
      try {
        // Clear existing content
        const root = $getRoot();
        root.clear();
        
        // Convert markdown string to Lexical nodes
        $convertFromMarkdownString(content, TRANSFORMERS);
        
      } catch (error) {
        console.error('[LexicalMessageRenderer] Error converting markdown:', error);
        
        // Fallback to plain text if markdown parsing fails
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(content);
        paragraph.append(textNode);
        root.append(paragraph);
      }
    });
  }, [content, editor]);
  
  return null;
};

ContentPlugin.propTypes = {
  content: PropTypes.string,
};

/**
 * LexicalMessageRenderer Component
 * 
 * Renders a single chat message using a read-only Lexical editor.
 * Supports markdown formatting and streaming content updates.
 * 
 * @param {Object} props
 * @param {string} props.content - Markdown content to render
 * @param {boolean} [props.isStreaming=false] - Whether content is currently streaming
 * @param {string} [props.className] - Additional CSS class names
 * @param {Function} [props.onContentLoaded] - Callback when content is loaded
 */
export const LexicalMessageRenderer = React.memo(({ 
  content, 
  isStreaming = false,
  className = '',
  onContentLoaded,
}) => {
  const { t } = useTranslation('components');
  
  // Create editor config with error handling
  const config = useMemo(() => ({
    ...chatMessageEditorConfig,
    editorState: null, // Will be set by MarkdownContentPlugin
  }), []);
  
  // Callback for when content is loaded
  const handleContentLoaded = useCallback(() => {
    if (onContentLoaded) {
      onContentLoaded();
    }
  }, [onContentLoaded]);
  
  // Don't render if no content
  if (!content) {
    return null;
  }
  
  const containerClassName = `${styles.messageRenderer} ${className} ${isStreaming ? styles.streaming : ''}`.trim();
  
  return (
    <div className={containerClassName}>
      <LexicalComposer initialConfig={config}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className={styles.contentEditable}
              ariaLabel="Chat message content"
              role="article"
            />
          }
          placeholder={null}
          ErrorBoundary={() => <div>{t('chatSidebar.errorRenderingMessage')}</div>}
        />
        
        {/* Content rendering */}
        <ContentPlugin content={content} />
        
        {/* Markdown and list support */}
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin />
      </LexicalComposer>
    </div>
  );
});

LexicalMessageRenderer.displayName = 'LexicalMessageRenderer';

LexicalMessageRenderer.propTypes = {
  content: PropTypes.string.isRequired,
  isStreaming: PropTypes.bool,
  className: PropTypes.string,
  onContentLoaded: PropTypes.func,
};

export default LexicalMessageRenderer;
