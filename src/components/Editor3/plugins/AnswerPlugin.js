/**
 * @fileoverview AnswerPlugin - Creates interactive answer fields for vocabulary exercises.
 * 
 * This plugin provides functionality for creating answer nodes where learners are prompted
 * to provide translations or definitions of vocabulary words. It supports various input
 * methods and validation strategies.
 * 
 * @module AnswerPlugin
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR, createCommand, DecoratorNode } from 'lexical';
// import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import * as React from 'react';
import { useEffect } from 'react';

import AnswerEditor from '../components/AnswerEditor';
import AnswerComponent from '../components/AnswerComponent';

/**
 * Converts a DOM element with answer attributes into an AnswerNode.
 * 
 * @param {HTMLElement} domNode - DOM element containing answer data attributes
 * @returns {{node: AnswerNode} | null} Object containing the created node or null if invalid
 */
function convertAnswerElement(
  domNode,
) {
  // comma separated list of word ids
  const wordIDs = domNode.getAttribute('data-lexical-answer').split(',') || [];
  const requestDefinition = domNode.getAttribute('data-lexical-answer-request-definition');
  const allowedInput = JSON.parse(domNode.getAttribute('data-lexical-answer-allowed-input')) || {};
  const promptMethod = JSON.parse(domNode.getAttribute('data-lexical-answer-prompt-method')) || {};

  if (wordIDs) {
    const node = $createAnswerNode(wordIDs, requestDefinition, allowedInput, promptMethod);
    return { node };
  }
  return null;
}

/**
 * AnswerNode - Lexical DecoratorNode for vocabulary answer exercises.
 * 
 * This node creates interactive answer fields where learners provide translations
 * or definitions. Supports multiple input validation methods and custom prompting.
 * 
 * @class AnswerNode
 * @extends {DecoratorNode}
 */
export class AnswerNode extends DecoratorNode {
  __ids;
  __requestDefinition;
  __allowedInput;
  __promptMethod;

  static getType() {
    return 'answer';
  }

  static clone(node) {
    return new AnswerNode(node.__ids, node.__requestDefinition, node.__allowedInput, node.__promptMethod, node.__format, node.__key);
  }

  static importJSON(serializedNode) {
    const node = $createAnswerNode(serializedNode.wordIDs, serializedNode.requestDefinition, serializedNode.allowedInput, serializedNode.promptMethod, serializedNode.format);
    return node;
  }

  exportJSON() {
    return {
      type: 'answer',
      version: 1,
      wordIDs: [...this.__ids],
      requestDefinition: this.__requestDefinition,
      allowedInput: this.__allowedInput,
      promptMethod: this.__promptMethod,
    };
  }

  constructor(ids = [], requestDefinition, allowedInput = {}, promptMethod = [], format, key) {
    super(format, key);
    this.__ids = ids;
    this.__requestDefinition = requestDefinition;
    this.__allowedInput = allowedInput;
    this.__promptMethod = promptMethod;
  }

  exportDOM() {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-answer', this.__ids.join(','));
    element.setAttribute('data-lexical-answer-request-definition', this.__requestDefinition);
    element.setAttribute('data-lexical-answer-allowed-input', JSON.stringify(this.__allowedInput));
    element.setAttribute('data-lexical-answer-prompt-method', JSON.stringify(this.__promptMethod));
    return { element };
  }

  createDOM(config) {
    const div = document.createElement('div');
    div.setAttribute('data-lexical-answer', this.__ids.join(','));
    div.setAttribute('data-lexical-answer-request-definition', this.__requestDefinition);
    div.setAttribute('data-lexical-answer-allowed-input', JSON.stringify(this.__allowedInput));
    div.setAttribute('data-lexical-answer-prompt-method', JSON.stringify(this.__promptMethod));

    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      div.className = className;
    }
    return div;
  }


  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute('data-lexical-answer')) {
          return null;
        }
        return {
          conversion: convertAnswerElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM() {
    return false;
  }

  getIds() {
    return this.__ids;
  }

  removeIntersection(ids) {
    const writable = this.getWritable();

    let intersection = this.__ids.filter(x => !ids.includes(x));
    writable.__ids = [...new Set([...intersection])];
  }


  setIds(ids) {
    const writable = this.getWritable();
    writable.__ids = [...new Set([...ids])];
  }

  mergeIds(ids) {
    const writable = this.getWritable();
    // Deduplicate with a Set and then convert back to array
    writable.__ids = [...new Set([...writable.__ids, ...ids])];
  }

  appendId(id) {
    const writable = this.getWritable();
    // Deduplicate with a Set and then convert back to array
    writable.__ids = [...new Set([...writable.__ids, id])];
  }

  setAllowedInput(allowedInput) {
    const writable = this.getWritable();
    writable.__allowedInput = allowedInput;
  }

  mergeAllowedInput(allowedInput) {
    const writable = this.getWritable();
    writable.__allowedInput = { ...writable.__allowedInput, ...allowedInput };
  }

  setPromptMethod(newPromptMethod) {
    const writable = this.getWritable();
    writable.__promptMethod = newPromptMethod;
  }

  getTextContent(
    _includeInert,
    _includeDirectionless
  ) {
    return this.__ids;
  }

  setRequestDefinition(requestDefinition) {
    const writable = this.getWritable();
    writable.__requestDefinition = requestDefinition
  }

  decorate(_editor, config) {
    const isEditable = _editor.isEditable();
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <>
      {isEditable && (
      <AnswerEditor
      className={className}
      format={this.__format}
      nodeKey={this.getKey()}
      wordIDs={this.__ids}
      requestDefinition={this.__requestDefinition}
      allowedInput={this.__allowedInput}
      promptMethod={this.__promptMethod}
    />
      )}

    {!isEditable && (
      <AnswerComponent
      className={className}
      format={this.__format}
      nodeKey={this.getKey()}
      wordIDs={this.__ids}
      requestDefinition={this.__requestDefinition}
      allowedInput={this.__allowedInput}
      promptMethod={this.__promptMethod}
    />
      )}
      </>

    );
  }
}

/**
 * Factory function to create a new AnswerNode.
 * 
 * @param {string[]} wordIDs - Array of Word IDs to quiz on
 * @param {boolean} requestDefinition - Whether to request definition or phrase
 * @param {Object} allowedInputs - Configuration for accepted input types
 * @param {Array} promptMethod - Array defining how to prompt the user
 * @param {string} format - Node format
 * @returns {AnswerNode} New AnswerNode instance
 */
export function $createAnswerNode(wordIDs, requestDefinition, allowedInputs, promptMethod, format) {
  return new AnswerNode(wordIDs, requestDefinition, allowedInputs, promptMethod, format);
}

/**
 * Type guard to check if a node is an AnswerNode.
 * 
 * @param {LexicalNode} node - Node to check
 * @returns {boolean} True if node is an AnswerNode
 */
export function $isAnswerNode(
  node,
) {
  return node instanceof AnswerNode;
}

/**
 * Command to insert an answer block into the editor.
 * @type {LexicalCommand}
 */
export const INSERT_ANSWER_BLOCK_COMMAND = createCommand(
  'INSERT_ANSWER_BLOCK_COMMAND',
);

/**
 * AnswerPlugin - Registers the AnswerNode and handles insertion commands.
 * 
 * This plugin registers the AnswerNode type with the Lexical editor and sets up
 * command handlers for inserting answer blocks into the editor.
 * 
 * @returns {null} Plugin returns null as it only registers functionality
 */
export default function AnswerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([AnswerNode])) {
      throw new Error('AnswerPlugin: AnswerNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_ANSWER_BLOCK_COMMAND,
      (payload) => {
        const { wordIDs = [], requestDefinition = 'translation', allowedInput = ['text'], promptMethod = ['phrase'] } = payload || {};
        const answerNode = $createAnswerNode(wordIDs, requestDefinition, allowedInput, promptMethod);
        $insertNodeToNearestRoot(answerNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}