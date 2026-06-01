/**
 * PdfViewerNode — Server-safe node class for PDF embeds.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { DecoratorNode, $applyNodeReplacement } from "lexical";

function convertPdfElement(domNode) {
  const path = domNode.getAttribute("data-lexical-pdf-path");
  if (path) {
    return {
      node: $createPdfViewerNode(
        path,
        domNode.getAttribute("data-lexical-pdf-identity") || "",
        domNode.getAttribute("data-lexical-pdf-filename") || "",
      ),
    };
  }
  return null;
}

export class PdfViewerNode extends DecoratorNode {
  __path;
  __identityId;
  __filename;

  static getType() {
    return "pdf-viewer";
  }

  static clone(node) {
    return new PdfViewerNode(
      node.__path,
      node.__identityId,
      node.__filename,
      node.__key,
    );
  }

  static importJSON(serializedNode) {
    return $createPdfViewerNode(
      serializedNode.path,
      serializedNode.identityId,
      serializedNode.filename,
    );
  }

  exportJSON() {
    return {
      type: "pdf-viewer",
      version: 1,
      path: this.__path,
      identityId: this.__identityId,
      filename: this.__filename,
    };
  }

  constructor(path, identityId, filename, key) {
    super(key);
    this.__path = path;
    this.__identityId = identityId;
    this.__filename = filename;
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-pdf-path", this.__path);
    element.setAttribute("data-lexical-pdf-identity", this.__identityId);
    element.setAttribute("data-lexical-pdf-filename", this.__filename);
    element.textContent = `[PDF: ${this.__filename}]`;
    return { element };
  }

  createDOM() {
    const div = document.createElement("div");
    return div;
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-pdf-path")) {
          return null;
        }
        return {
          conversion: convertPdfElement,
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

  getPath() {
    return this.__path;
  }

  getIdentityId() {
    return this.__identityId;
  }

  getFilename() {
    return this.__filename;
  }

  decorate() {
    return null;
  }
}

export function $createPdfViewerNode(path, identityId, filename) {
  return $applyNodeReplacement(new PdfViewerNode(path, identityId, filename));
}

export function $isPdfViewerNode(node) {
  return node instanceof PdfViewerNode;
}
