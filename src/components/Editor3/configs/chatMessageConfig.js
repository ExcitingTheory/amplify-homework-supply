/**
 * Lexical Editor Configuration for Chat Messages
 * 
 * Optimized read-only configuration for rendering chat messages with markdown support.
 * Includes all necessary nodes for rich text display but excludes editing features.
 */

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { QuizNode } from '../plugins/QuizPlugin';
import { AnswerNode } from '../plugins/AnswerPlugin';
import { CustomAnswerNode } from '../plugins/CustomAnswerPlugin';
import { MeaningAssociationNode } from '../plugins/MeaningAssociationPlugin';

/**
 * Theme configuration for chat message rendering
 * Uses CSS classes that can be styled independently from main editor
 */
const chatMessageTheme = {
  paragraph: 'chat-message-paragraph',
  quote: 'chat-message-quote',
  heading: {
    h1: 'chat-message-h1',
    h2: 'chat-message-h2',
    h3: 'chat-message-h3',
    h4: 'chat-message-h4',
    h5: 'chat-message-h5',
    h6: 'chat-message-h6',
  },
  list: {
    ul: 'chat-message-ul',
    ol: 'chat-message-ol',
    listitem: 'chat-message-li',
    nested: {
      listitem: 'chat-message-li-nested',
    },
    checklist: 'chat-message-checklist',
  },
  code: 'chat-message-code',
  codeHighlight: {
    atrule: 'chat-code-atrule',
    attr: 'chat-code-attr',
    boolean: 'chat-code-boolean',
    builtin: 'chat-code-builtin',
    cdata: 'chat-code-cdata',
    char: 'chat-code-char',
    class: 'chat-code-class',
    'class-name': 'chat-code-class-name',
    comment: 'chat-code-comment',
    constant: 'chat-code-constant',
    deleted: 'chat-code-deleted',
    doctype: 'chat-code-doctype',
    entity: 'chat-code-entity',
    function: 'chat-code-function',
    important: 'chat-code-important',
    inserted: 'chat-code-inserted',
    keyword: 'chat-code-keyword',
    namespace: 'chat-code-namespace',
    number: 'chat-code-number',
    operator: 'chat-code-operator',
    prolog: 'chat-code-prolog',
    property: 'chat-code-property',
    punctuation: 'chat-code-punctuation',
    regex: 'chat-code-regex',
    selector: 'chat-code-selector',
    string: 'chat-code-string',
    symbol: 'chat-code-symbol',
    tag: 'chat-code-tag',
    url: 'chat-code-url',
    variable: 'chat-code-variable',
  },
  link: 'chat-message-link',
  text: {
    bold: 'chat-message-bold',
    italic: 'chat-message-italic',
    underline: 'chat-message-underline',
    strikethrough: 'chat-message-strikethrough',
    code: 'chat-message-inline-code',
  },
  hr: 'chat-message-hr',
};

/**
 * Chat message editor configuration
 * Read-only configuration optimized for display
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.includeCustomBlocks - Include custom blocks (Quiz, Answer, etc.) for AI-generated content
 * @param {Function} options.onInsertBlock - Callback when user clicks "Insert into Unit" on a custom block
 * @returns {Object} Lexical editor configuration
 */
export const createChatMessageConfig = (options = {}) => {
  const { includeCustomBlocks = false, onInsertBlock } = options;
  
  const baseNodes = [
    HeadingNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    AutoLinkNode,
    ListNode,
    ListItemNode,
    HorizontalRuleNode,
  ];
  
  // Add custom blocks if requested (for AI-generated content in chat)
  const nodes = includeCustomBlocks
    ? [...baseNodes, QuizNode, AnswerNode, CustomAnswerNode, MeaningAssociationNode]
    : baseNodes;
  
  return {
    namespace: 'ChatMessage',
    theme: chatMessageTheme,
    nodes,
    editable: false, // Read-only for message display
    onError: (error) => {
      console.error('Lexical chat message error:', error);
    },
    // Pass insert callback to custom nodes via editor context
    ...(onInsertBlock && { onInsertBlock }),
  };
};

/**
 * Default chat message editor configuration (no custom blocks)
 */
export const chatMessageEditorConfig = createChatMessageConfig();

export default chatMessageEditorConfig;
