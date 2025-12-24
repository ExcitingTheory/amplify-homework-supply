/**
 * @fileoverview WordBlockPlugin - Displays vocabulary word information in block format.
 * @module WordBlockPlugin
 * 
 * Creates an interactive word block that displays a vocabulary word's phrase,
 * pronunciation, and definition from the dictionary context.
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand} from 'lexical';
import {BlockWithAlignableContents} from '@lexical/react/LexicalBlockWithAlignableContents';
import {
DecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import * as React from 'react';
import { useEffect, useContext } from 'react';

import DictionaryContext from '../../../context/dictionaryContext';

  /**
   * WordBlockComponent - Displays word information in a block.
   * 
   * @param {Object} props - Component props
   * @param {string} props.className - CSS className for styling
   * @param {string} props.format - Block alignment format
   * @param {string} props.nodeKey - Lexical node key
   * @param {string} props.wordID - Dictionary word identifier
   * @returns {JSX.Element} Word block component
   */
  function WordBlockComponent({
    className,
    format,
    nodeKey,
    wordID,
  }) {

    const { wordMapId: dictionary } = useContext(DictionaryContext);
    const word = dictionary[wordID];

    return (
      <BlockWithAlignableContents
        className={className}
        format={format}
        nodeKey={nodeKey}>

        <>
        ID: {wordID} <br />
        Phrase: {word?.phrase} <br />
        Pronunciation: {word?.pronunciation} <br />
        Definition: {word?.phrase}
        </>
            
      </BlockWithAlignableContents>
    );
  }
  
  function convertYoutubeElement(
    domNode,
  ){
    const wordID = domNode.getAttribute('data-lexical-word-block');
    if (wordID) {
  /**
   * WordBlockNode - Lexical decorator block node for displaying vocabulary words.
   * 
   * @class
   * @extends {DecoratorBlockNode}
   */
      const node = $createWordBlockNode(wordID);
      return {node};
    }
    return null;
  }
  
  export class WordBlockNode extends DecoratorBlockNode {
    __id;
  
    static getType() {
      return 'word-block';
    }
  
    static clone(node) {
      return new WordBlockNode(node.__id, node.__format, node.__key);
    }
  
    static importJSON(serializedNode) {
      const node = $createWordBlockNode(serializedNode.wordID);
      node.setFormat(serializedNode.format);
      return node;
    }
  
    exportJSON() {
      return {
        ...super.exportJSON(),
        type: 'word-block',
        version: 1,
        wordID: this.__id,
      };
    }
  
    constructor(id, format, key) {
      super(format, key);
      this.__id = id;
    }
  
    exportDOM() {
      const element = document.createElement('div');
      element.setAttribute('data-lexical-word-block', this.__id);
      return {element};
    }
  
    static importDOM() {
      return {
        div: (domNode) => {
          if (!domNode.hasAttribute('data-lexical-word-block')) {
            return null;
          }
          return {
            conversion: convertYoutubeElement,
            priority: 1,
          };
        },
      };
    }
  
    updateDOM() {
      return false;
    }
  
    getId() {
      return this.__id;
    }
  
    getTextContent(
      _includeInert,
      _includeDirectionless
    ) {
      return this.__id;
    }
  
    decorate(_editor, config) {
      const embedBlockTheme = config.theme.embedBlock || {};
      const className = {
        base: embedBlockTheme.base || '',
        focus: embedBlockTheme.focus || '',
      };
      return (
        <WordBlockComponent
          className={className}
          format={this.__format}
          nodeKey={this.getKey()}
          wordID={this.__id}
        />
      );
    }
  }
  
  /**
   * Factory function to create a WordBlockNode.
   * 
   * @param {string} wordID - Dictionary word identifier
   * @returns {WordBlockNode} New word block node instance
   */
  export function $createWordBlockNode(wordID) {
    return new WordBlockNode(wordID);
  }
  
  /**
   * Type guard for WordBlockNode.
   * 
   * @param {LexicalNode} node - Node to check
   * @returns {boolean} True if node is a WordBlockNode
   */
  export function $isWordBlockNode(
    node,
  ) {
    return node instanceof WordBlockNode;
  }

/**
 * Command to insert a word block into the editor.
 * @type {LexicalCommand}
 */
export const INSERT_WORD_BLOCK_COMMAND = createCommand(
  'INSERT_WORD_BLOCK_COMMAND',
);

/**
 * WordBlockPlugin - Registers word block functionality.
 * 
 * Registers the WordBlockNode with the editor and handles INSERT_WORD_BLOCK_COMMAND
 * to insert vocabulary word blocks into the editor.
 * 
 * @returns {null} Plugin returns null
 */
export default function WordBlockPlugin(){
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([WordBlockNode])) {
      throw new Error('WordBlockPlugin: WordBlockNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_WORD_BLOCK_COMMAND,
      (payload) => {
        const wordBlockNode = $createWordBlockNode(payload);
        $insertNodeToNearestRoot(wordBlockNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}