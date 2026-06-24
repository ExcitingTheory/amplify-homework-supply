/**
 * @fileoverview MeaningAssociationPlugin - Creates vocabulary matching exercises.
 * 
 * This plugin provides interactive exercises where learners match words with their
 * definitions or meanings. Supports Easy, Hard, and Learn modes for different
 * difficulty levels.
 * 
 * @module MeaningAssociationPlugin
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR, createCommand, DecoratorNode } from 'lexical';
// import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import * as React from 'react';
import { useEffect } from 'react';

import MeaningAssociationEditor from '../components/MeaningAssociationEditor';
import MeaningAssociationExercise from '../../MeaningAssociationExercise';

/**
 * Converts a DOM element into a MeaningAssociationNode.
 * 
 * @param {HTMLElement} domNode - DOM element with meaning-association data attribute
 * @returns {{node: MeaningAssociationNode} | null} Created node or null
 */
function convertMeaningAssociationElement(
  domNode,
) {
  // comma separated list of word ids
  const wordIDs = domNode.getAttribute('data-lexical-meaning-association').split(',') || [];

  if (wordIDs) {
    const node = $createMeaningAssociationNode(wordIDs);
    return { node };
  }
  return null;
}

/**
 * MeaningAssociationNode - Lexical DecoratorNode for word-meaning matching exercises.
 * 
 * Creates interactive vocabulary exercises where learners match words with definitions.
 * Includes three difficulty modes: Easy (direct matching), Hard (with distractors),
 * and Learn (flashcard study mode).
 * 
 * @class MeaningAssociationNode
 * @extends {DecoratorNode}
 */
export class MeaningAssociationNode extends DecoratorNode {
  __ids;
  __enabledModes;

  static getType() {
    return 'meaning-association';
  }

  static clone(node) {
    return new MeaningAssociationNode(node.__ids, node.__enabledModes, node.__format, node.__key);
  }

  static importJSON(serializedNode) {
    const node = $createMeaningAssociationNode(
      serializedNode.wordIDs,
      serializedNode.enabledModes
    );
    // node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'meaning-association',
      version: 1,
      wordIDs: [...this.__ids],
      enabledModes: this.__enabledModes || ['learn', 'easy', 'hard'],
    };
  }

  constructor(ids = [], enabledModes = ['learn', 'easy', 'hard'], format, key) {
    super(key);
    this.__ids = ids;
    this.__enabledModes = enabledModes;
  }

  exportDOM() {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-meaning-association', this.__ids.join(','));
    return { element };
  }

  createDOM(config) {
    const div = document.createElement('div');
    div.setAttribute('data-lexical-meaning-association', this.__ids.join(','));
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
        if (!domNode.hasAttribute('data-lexical-meaning-association')) {
          return null;
        }
        return {
          conversion: convertMeaningAssociationElement,
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

  getIds() {
    return this.__ids;
  }

  getEnabledModes() {
    return this.__enabledModes || ['learn', 'easy', 'hard'];
  }

  setEnabledModes(modes) {
    const writable = this.getWritable();
    writable.__enabledModes = modes;
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

  getTextContent(
    _includeInert,
    _includeDirectionless
  ) {
    return this.__ids;
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
      <MeaningAssociationEditor
      className={className}
      format={this.__format}
      nodeKey={this.getKey()}
      wordIDs={this.__ids}
      enabledModes={this.__enabledModes || ['learn', 'easy', 'hard']}
    />
      )}

    {!isEditable && (
      <MeaningAssociationExercise
      className={className}
      format={this.__format}
      nodeKey={this.getKey()}
      wordIDs={this.__ids}
      enabledModes={this.__enabledModes || ['learn', 'easy', 'hard']}
    />
      )}
      </>

    );
  }
}

/**
 * Factory function to create a MeaningAssociationNode.
 * 
 * @param {string[]} wordIDs - Array of Word IDs to include in exercise
 * @param {string[]} enabledModes - Array of enabled difficulty modes ['learn', 'easy', 'hard']
 * @returns {MeaningAssociationNode} New node instance
 */
export function $createMeaningAssociationNode(wordIDs, enabledModes = ['learn', 'easy', 'hard']) {
  return new MeaningAssociationNode(wordIDs, enabledModes);
}

/**
 * Type guard for MeaningAssociationNode.
 * 
 * @param {LexicalNode} node - Node to check
 * @returns {boolean} True if node is a MeaningAssociationNode
 */
export function $isMeaningAssociationNode(
  node,
) {
  return node instanceof MeaningAssociationNode;
}

/**
 * Command to insert a meaning association exercise.
 * @type {LexicalCommand}
 */
export const INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND = createCommand(
  'INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND',
);

/**
 * MeaningAssociationPlugin - Registers and manages meaning association exercises.
 * 
 * @returns {null} Plugin returns null
 */
export default function MeaningAssociationPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([MeaningAssociationNode])) {
      throw new Error('MeaningAssociationPlugin: MeaningAssociationNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND,
      (payload) => {
        const meaningAssociationNode = $createMeaningAssociationNode(payload);
        $insertNodeToNearestRoot(meaningAssociationNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}