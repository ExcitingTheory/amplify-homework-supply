/**
 * FileMetadataNode — Server-safe node class for file metadata display.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { $applyNodeReplacement, DecoratorNode } from "lexical";

export class FileMetadataNode extends DecoratorNode {
  __file;
  __parsedContent;

  static getType() {
    return "file-metadata";
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
      type: "file-metadata",
      version: 1,
    };
  }

  constructor(file, parsedContent, key) {
    super(key);
    this.__file = file;
    this.__parsedContent = parsedContent;
  }

  createDOM() {
    const div = document.createElement("div");
    div.style.display = "contents";
    return div;
  }

  updateDOM() {
    return false;
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-file-metadata", "true");
    if (this.__file?.name) {
      element.textContent = `[File: ${this.__file.name}]`;
    }
    return { element };
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

  decorate() {
    return null;
  }
}

export function $createFileMetadataNode(file, parsedContent) {
  return $applyNodeReplacement(new FileMetadataNode(file, parsedContent));
}

export function $isFileMetadataNode(node) {
  return node instanceof FileMetadataNode;
}
