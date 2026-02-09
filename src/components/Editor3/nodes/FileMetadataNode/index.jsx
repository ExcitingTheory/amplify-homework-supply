import {
  $applyNodeReplacement,
  DecoratorNode,
} from 'lexical';
import { Suspense } from 'react';

export class FileMetadataNode extends DecoratorNode {
  __file;
  __parsedContent;

  static getType() {
    return 'file-metadata';
  }

  static clone(node) {
    return new FileMetadataNode(
      node.__file,
      node.__parsedContent,
      node.__key,
    );
  }

  static importJSON(serializedNode) {
    const { file, parsedContent } = serializedNode;
    const node = $createFileMetadataNode(file, parsedContent);
    return node;
  }

  exportJSON() {
    return {
      file: this.__file,
      parsedContent: this.__parsedContent,
      type: 'file-metadata',
      version: 1,
    };
  }

  constructor(file, parsedContent, key) {
    super(key);
    this.__file = file;
    this.__parsedContent = parsedContent;
  }

  createDOM(config) {
    const div = document.createElement('div');
    div.style.display = 'contents';
    return div;
  }

  updateDOM() {
    return false;
  }

  setFile(file) {
    const writable = this.getWritable();
    writable.__file = file;
  }

  setParsedContent(parsedContent) {
    const writable = this.getWritable();
    writable.__parsedContent = parsedContent;
  }

  getFile() {
    return this.__file;
  }

  getParsedContent() {
    return this.__parsedContent;
  }

  decorate(editor, config) {
    return (
      <Suspense fallback={null}>
        <FileMetadataComponent 
          file={this.__file}
          parsedContent={this.__parsedContent}
          nodeKey={this.getKey()}
          onFileNameUpdate={(newName) => {
            editor.update(() => {
              const writableNode = this.getWritable();
              writableNode.__file = {
                ...writableNode.__file,
                name: newName
              };
            });
          }}
          onRemove={(nodeKey) => {
            editor.update(() => {
              const node = $getNodeByKey(nodeKey);
              if (node) {
                node.remove();
              }
            });
          }}
        />
      </Suspense>
    );
  }

  isInline() {
    return false;
  }

  isKeyboardSelectable() {
    return true;
  }
}

export function $createFileMetadataNode(file, parsedContent) {
  return $applyNodeReplacement(new FileMetadataNode(file, parsedContent));
}

export function $isFileMetadataNode(node) {
  return node instanceof FileMetadataNode;
}

// Import the component
import FileMetadataComponent from './FileMetadataComponent';
import { $getNodeByKey } from 'lexical';