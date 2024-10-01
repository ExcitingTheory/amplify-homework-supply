import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR, createCommand, DecoratorNode } from 'lexical';
// import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import * as React from 'react';
import { useEffect } from 'react';

import MeaningAssociationEditor from '../components/MeaningAssociationEditor';
import MeaningAssociationExercise from '../../MeaningAssociationExercise';

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

export class MeaningAssociationNode extends DecoratorNode {
  __ids;

  static getType() {
    return 'meaning-association';
  }

  static clone(node) {
    return new MeaningAssociationNode(node.__ids, node.__format, node.__key);
  }

  static importJSON(serializedNode) {
    const node = $createMeaningAssociationNode(serializedNode.wordIDs);
    // node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON() {
    return {
      // ...super.exportJSON(),
      type: 'meaning-association',
      version: 1,
      wordIDs: [...this.__ids],
    };
  }

  constructor(ids = [], format, key) {
    super(format, key);
    this.__ids = ids;
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
    />
      )}

    {!isEditable && (
      <MeaningAssociationExercise
      className={className}
      format={this.__format}
      nodeKey={this.getKey()}
      wordIDs={this.__ids}
    />
      )}
      </>

    );
  }
}

export function $createMeaningAssociationNode(wordIDs) {
  return new MeaningAssociationNode(wordIDs);
}

export function $isMeaningAssociationNode(
  node,
) {
  return node instanceof MeaningAssociationNode;
}

export const INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND = createCommand(
  'INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND',
);

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