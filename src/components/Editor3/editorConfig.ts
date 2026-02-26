/**
 * Shared editor configuration, nodes, and utilities for Editor3
 */

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HashtagNode } from '@lexical/hashtag';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { TRANSFORMERS } from '@lexical/markdown';
import { CUSTOM_BLOCK_TRANSFORMERS } from './utils/customMarkdownTransformers';

import { YouTubeNode } from './plugins/YouTubePlugin';
import { WordBlockNode } from './plugins/WordBlockPlugin';
import { MeaningAssociationNode } from './plugins/MeaningAssociationPlugin';
import { QuizNode } from './plugins/QuizPlugin';
import { PlaylistNode } from './plugins/PlaylistPlugin';
import { PdfViewerNode } from './components/PdfViewerNode';
import { AutocompleteNode } from './components/AutocompleteNode';
import { AIContentSuggestionNode, AILoadingNode } from './components/AIContentSuggestionNode';
import { ImageNode } from './components/ImageNode';
import { LayoutContainerNode } from './components/LayoutContainerNode';
import { LayoutItemNode } from './components/LayoutItemNode';
import { AnswerNode } from './plugins/AnswerPlugin';
import { CustomAnswerNode } from './plugins/CustomAnswerPlugin';
import { FileMetadataNode } from './nodes/FileMetadataNode';
/**
 * All custom Lexical nodes used in the editor
 * Note: Using any[] due to strict type incompatibilities with custom node implementations
 */
export const EditorNodes: any[] = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  HashtagNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  HorizontalRuleNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  YouTubeNode,
  WordBlockNode,
  MeaningAssociationNode,
  AutocompleteNode,
  AIContentSuggestionNode,
  AILoadingNode,
  ImageNode,
  QuizNode,
  PlaylistNode,
  PdfViewerNode,
  LayoutContainerNode,
  LayoutItemNode,
  AnswerNode,
  CustomAnswerNode,
  FileMetadataNode,
];

/**
 * All markdown transformers (default + custom blocks)
 * Note: Using any[] due to transformer type strictness
 */
export const ALL_TRANSFORMERS: any[] = [...TRANSFORMERS, ...CUSTOM_BLOCK_TRANSFORMERS];

/**
 * Default drawer width in pixels
 */
export const DRAWER_WIDTH = 350;

/**
 * Debounce delay for auto-save in milliseconds
 */
export const DEBOUNCE_SAVE_DELAY_MS = 2000;

/**
 * Error handler for Lexical editor
 * Logs and throws errors to prevent silent failures
 */
export function onError(error: Error): void {
  console.error(error);
  throw error;
}

/**
 * Generic debounce utility function
 * @param func - Function to debounce
 * @param timeout - Delay in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  timeout: number = DEBOUNCE_SAVE_DELAY_MS
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}
