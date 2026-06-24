/**
 * @fileoverview QuizPlugin - Creates interactive quiz nodes for assessments.
 * 
 * This plugin provides quiz functionality with multiple question types,
 * automatic grading, and progress tracking.
 * 
 * @module QuizPlugin
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR, createCommand, DecoratorNode } from 'lexical';
import * as React from 'react';
import { useEffect,  } from 'react';

import QuizEditor from '../components/QuizEditor';
import QuizComponent from '../components/QuizComponent';

/**
 * Converts a DOM element into a QuizNode.
 * 
 * @param {HTMLElement} domNode - DOM element with quiz data
 * @returns {{node: QuizNode} | null} Created node or null
 */
function convertQuizElement(
  domNode,
) {
  // comma separated list of word ids
  const data = domNode.getAttribute('data-lexical-quiz') || [];

  if (data) {
    const node = $createQuizNode(data);
    return { node };
  }
  return null;
}

/**
 * QuizNode - Lexical DecoratorNode for interactive quizzes.
 * 
 * Provides quiz functionality with multiple question types,
 * automatic scoring, and learner response tracking.
 * 
 * @class QuizNode
 * @extends {DecoratorNode}
 */
export class QuizNode extends DecoratorNode {
  __data;

  static getType() {
    return 'quiz';
  }

  static clone(node) {
    return new QuizNode(node.__data, node.__format, node.__key);
  }

  static importJSON(serializedNode) {
    const node = $createQuizNode(serializedNode.data);
    // node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'quiz',
      version: 1,
      data: this.__data,
    };
  }

  constructor(ids = [], format, key) {
    super(key);
    this.__data = ids;
  }

  exportDOM() {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-quiz', JSON.stringify(this.__data));
    return { element };
  }

  createDOM(config) {
    const div = document.createElement('div');
    div.setAttribute('data-lexical-quiz', JSON.stringify(this.__data));
    // const theme = config.theme;
    // const className = theme.image;
    // if (className !== undefined) {
    //   div.className = className;
    // }
    return div;
  }


  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute('data-lexical-quiz')) {
          return null;
        }
        return {
          conversion: convertQuizElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM() {
    return false;
  }

  isKeyboardSelectable() {
    return true;
  }

  canBeEmpty() {
    return true;
  }

  getData() {
    return this.__data || [];
  }

  saveData(data) {
    const writable = this.getWritable();
    writable.__data = data;
  }

  getTextContent(
    _includeInert,
    _includeDirectionless
  ) {
    return this.__data;
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
      {isEditable &&
        <QuizEditor
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        data={this.getData()}
      />
      }
      {!isEditable &&
        <QuizComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        data={this.getData()}
      />
      }
      </>


    );
  }
}

/**
 * Factory function to create a QuizNode.
 * 
 * @param {Object} data - Quiz configuration and questions
 * @returns {QuizNode} New quiz node instance
 */
export function $createQuizNode(data) {
  return new QuizNode(data);
}

/**
 * Type guard for QuizNode.
 * 
 * @param {LexicalNode} node - Node to check
 * @returns {boolean} True if node is a QuizNode
 */
export function $isQuizNode(
  node,
) {
  return node instanceof QuizNode;
}

/**
 * Command to insert a quiz into the editor.
 * @type {LexicalCommand}
 */
export const INSERT_QUIZ_COMMAND = createCommand(
  'INSERT_QUIZ_COMMAND',
);

/**
 * QuizPlugin - Registers quiz functionality in the editor.
 * 
 * @returns {null} Plugin returns null
 */
export default function QuizPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([QuizNode])) {
      throw new Error('QuizPlugin: QuizNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_QUIZ_COMMAND,
      (payload) => {
        const meaningAssociationNode = $createQuizNode(payload);
        $insertNodeToNearestRoot(meaningAssociationNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}