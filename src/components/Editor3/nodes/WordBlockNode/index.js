/**
 * @fileoverview WordBlockNode - Server-safe Lexical node class for word blocks.
 *
 * This file contains ONLY the node class definition without any React component
 * dependencies. It can be safely imported in Server Components and headless
 * Lexical editor instances (e.g., lexicalServerRender.ts).
 *
 * The full interactive plugin (with React rendering) is in:
 *   src/components/Editor3/plugins/WordBlockPlugin.jsx
 */

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';

function convertWordBlockElement(domNode) {
  const wordID = domNode.getAttribute('data-lexical-word-block');
  if (wordID) {
    const node = $createWordBlockNode(wordID);
    return { node };
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
    super(key);
    this.__id = id;
  }

  exportDOM() {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-word-block', this.__id);
    return { element };
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute('data-lexical-word-block')) {
          return null;
        }
        return {
          conversion: convertWordBlockElement,
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

  getTextContent(_includeInert, _includeDirectionless) {
    return this.__id;
  }

  decorate() {
    // Server-safe no-op. The full plugin (WordBlockPlugin.jsx) overrides
    // this with actual React rendering on the client.
    return null;
  }
}

export function $createWordBlockNode(wordID) {
  return new WordBlockNode(wordID);
}

export function $isWordBlockNode(node) {
  return node instanceof WordBlockNode;
}
