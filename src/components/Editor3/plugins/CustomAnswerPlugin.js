import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR, createCommand, DecoratorNode } from 'lexical';
import * as React from 'react';
import { useEffect } from 'react';
import CustomAnswerEditor from '../nodes/CustomAnswerNode/CustomAnswerEditor';
import CustomAnswerComponent from '../nodes/CustomAnswerNode/CustomAnswerComponent';
import { join } from 'path';

function convertCustomAnswerElement(domNode) {
  const ids = domNode.getAttribute('data-lexical-custom-answer').split(',') || [];
  const allowedInput = JSON.parse(domNode.getAttribute('data-lexical-custom-answer-allowed-input')) || {};
  const promptMethod = JSON.parse(domNode.getAttribute('data-lexical-custom-answer-prompt-method')) || {};

  if (ids) {
    const node = $createCustomAnswerNode(ids, allowedInput, promptMethod);
    return { node };
  }
  return null;
}

export class CustomAnswerNode extends DecoratorNode {
  __ids;
  __promptMethod;
  __allowedInput;

  static getType() {
    return 'custom-answer';
  }

  static clone(node) {
    return new CustomAnswerNode(node.__ids, node.__allowedInput, node.__promptMethod ,node.__format, node.__key);
  }

  static importJSON(serializedNode) {
    const node = $createCustomAnswerNode(serializedNode.ids, serializedNode.allowedInput, serializedNode.promptMethod, serializedNode.format);
    return node;
  }

  exportJSON() {
    return {
      type: 'custom-answer',
      version: 1,
      ids: [...this.__ids],
      promptMethod: this.__promptMethod,
      allowedInput: this.__allowedInput,
    };
  }

  constructor(ids = [], allowedInput = [], promptMethod = [], format, key) {
    super(format, key);
    this.__ids = ids;
    this.__promptMethod = promptMethod;
    this.__allowedInput = allowedInput;
  }

  exportDOM() {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-custom-answer', this.__ids.join(','));
    element.setAttribute('data-lexical-custom-answer-allowed-input', JSON.stringify(this.__allowedInput));
    element.setAttribute('data-lexical-custom-answer-prompt-method', JSON.stringify(this.__promptMethod));
    return { element };
  }

  createDOM(config) {
    const div = document.createElement('div');
    div.setAttribute('data-lexical-custom-answer', this.__ids.join(','));
    div.setAttribute('data-lexical-custom-answer-allowed-input', JSON.stringify(this.__allowedInput));
    div.setAttribute('data-lexical-custom-answer-prompt-method', JSON.stringify(this.__promptMethod));
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
        if (!domNode.hasAttribute('data-lexical-custom-answer')) {
          return null;
        }
        return {
          conversion: convertCustomAnswerElement,
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

  appendId(id) {
    console.log('appendId', id);
    const writable = this.getWritable();
    writable.__ids = [...new Set([...writable.__ids, id])];
  }


  removeIntersection(questionIDs) {
    const writable = this.getWritable();

    let intersection = this.__ids.filter((x) => {
      return !questionIDs.includes(x);
    });

    // if intersection is undefined, set it to empty array
    intersection? intersection : [];    
    writable.__ids = [...intersection];
  }

  setids(ids) {
    const writable = this.getWritable();
    writable.__ids = [...ids];
  }

  mergeids(ids) {
    const writable = this.getWritable();
    writable.__ids = [...writable.__ids, ...ids];
  }

  appendQuestion(question) {
    const writable = this.getWritable();
    writable.__ids = [...writable.__ids, question];
  }
s
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

  getTextContent(_includeInert, _includeDirectionless) {
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
          <CustomAnswerEditor
            className={className}
            format={this.__format}
            nodeKey={this.getKey()}
            ids={this.__ids}
            allowedInput={this.__allowedInput}
            promptMethod={this.__promptMethod}
          />
        )}

        {!isEditable && (
          <CustomAnswerComponent
            className={className}
            format={this.__format}
            nodeKey={this.getKey()}
            ids={this.__ids}
            allowedInput={this.__allowedInput}
            promptMethod={this.__promptMethod}
          />
        )}
      </>
    );
  }
}

export function $createCustomAnswerNode(ids, allowedInput, promptMethod, format) {
  return new CustomAnswerNode(ids, allowedInput, promptMethod, format);
}

export function $isCustomAnswerNode(node) {
  return node instanceof CustomAnswerNode;
}

export const INSERT_CUSTOM_ANSWER_BLOCK_COMMAND = createCommand('INSERT_CUSTOM_ANSWER_BLOCK_COMMAND');

export default function CustomAnswerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([CustomAnswerNode])) {
      throw new Error('CustomAnswerPlugin: CustomAnswerNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_CUSTOM_ANSWER_BLOCK_COMMAND,
      (payload) => {
        const customAnswerNode = $createCustomAnswerNode(payload);
        $insertNodeToNearestRoot(customAnswerNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
