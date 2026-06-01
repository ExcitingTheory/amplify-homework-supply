/**
 * ImageNode — Server-safe node class for images with optional captions.
 * No React dependencies. decorate() returns null (only used client-side).
 * Uses createEditor() for the caption sub-editor (server-safe).
 */
import {
  $applyNodeReplacement,
  createEditor,
  DecoratorNode,
} from "lexical";

function convertImageElement(domNode) {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width, height } = domNode;
    const node = $createImageNode({ altText, height, src, width });
    return { node };
  }
  return null;
}

export class ImageNode extends DecoratorNode {
  __path;
  __identityId;
  __fileId;
  __src;
  __altText;
  __width;
  __height;
  __maxWidth;
  __showCaption;
  __caption;
  __captionsEnabled;

  static getType() {
    return "image";
  }

  static clone(node) {
    return new ImageNode(
      node.__path,
      node.__identityId,
      node.__fileId,
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__maxWidth,
      node.__showCaption,
      node.__caption,
      node.__captionsEnabled,
      node.__key,
    );
  }

  static importJSON(serializedNode) {
    const {
      path,
      identityId,
      fileId,
      altText,
      height,
      width,
      maxWidth,
      caption,
      src,
      showCaption,
    } = serializedNode;
    const node = $createImageNode({
      path,
      identityId,
      fileId,
      altText,
      height,
      maxWidth,
      showCaption,
      src,
      width,
    });
    const nestedEditor = node.__caption;
    const editorState = nestedEditor.parseEditorState(caption.editorState);
    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState);
    }
    return node;
  }

  exportDOM() {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src || "");
    element.setAttribute("alt", this.__altText || "");
    if (this.__width) element.setAttribute("width", String(this.__width));
    if (this.__height) element.setAttribute("height", String(this.__height));
    return { element };
  }

  static importDOM() {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  exportJSON() {
    return {
      path: this.__path || this.getPath(),
      identityId: this.__identityId || this.getIdentityId(),
      fileId: this.__fileId || this.getFileId(),
      altText: this.getAltText(),
      caption: this.__caption.toJSON(),
      height: this.__height === "inherit" ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      src: this.getSrc(),
      type: "image",
      version: 1,
      width: this.__width === "inherit" ? 0 : this.__width,
    };
  }

  constructor(
    path,
    identityId,
    fileId,
    src,
    altText,
    width,
    height,
    maxWidth,
    showCaption,
    caption,
    captionsEnabled,
    key,
  ) {
    super(key);
    this.__path = path;
    this.__identityId = identityId;
    this.__fileId = fileId;
    this.__src = src;
    this.__altText = altText || "";
    this.__maxWidth = maxWidth;
    this.__width = width || "inherit";
    this.__height = height || "inherit";
    this.__showCaption = showCaption || false;
    this.__caption = caption || createEditor();
    this.__captionsEnabled = captionsEnabled;
  }

  setWidthAndHeight(width, height) {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setShowCaption(showCaption) {
    const writable = this.getWritable();
    writable.__showCaption = showCaption;
  }

  createDOM(config) {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM() {
    return false;
  }

  getSrc() {
    return this.__src;
  }

  getPath() {
    return this.__path;
  }

  getIdentityId() {
    return this.__identityId;
  }

  getFileId() {
    return this.__fileId;
  }

  getAltText() {
    return this.__altText;
  }

  decorate() {
    return null;
  }
}

export function $createImageNode({
  path,
  identityId,
  fileId,
  altText,
  height,
  maxWidth = 500,
  captionsEnabled,
  src,
  width,
  showCaption,
  caption,
  key,
}) {
  return $applyNodeReplacement(
    new ImageNode(
      path,
      identityId,
      fileId,
      src,
      altText,
      width,
      height,
      maxWidth,
      showCaption,
      caption,
      captionsEnabled,
      key,
    ),
  );
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}
