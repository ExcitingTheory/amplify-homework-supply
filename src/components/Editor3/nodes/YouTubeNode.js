/**
 * YouTubeNode — Server-safe node class for YouTube embeds.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { DecoratorNode } from "lexical";

function convertYoutubeElement(domNode) {
  const videoID = domNode.getAttribute("data-lexical-youtube");
  if (videoID) {
    return { node: $createYouTubeNode(videoID) };
  }
  return null;
}

export class YouTubeNode extends DecoratorNode {
  __id;

  static getType() {
    return "youtube";
  }

  static clone(node) {
    return new YouTubeNode(node.__id, node.__format, node.__key);
  }

  static importJSON(serializedNode) {
    const node = $createYouTubeNode(serializedNode.videoID);
    node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "youtube",
      version: 1,
      videoID: this.__id,
    };
  }

  constructor(id, format, key) {
    super(key);
    this.__id = id;
    this.__format = format;
  }

  exportDOM() {
    const element = document.createElement("iframe");
    element.setAttribute("data-lexical-youtube", this.__id);
    element.setAttribute("width", "560");
    element.setAttribute("height", "315");
    element.setAttribute(
      "src",
      `https://www.youtube-nocookie.com/embed/${this.__id}`,
    );
    element.setAttribute("frameborder", "0");
    element.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
    );
    element.setAttribute("allowfullscreen", "true");
    element.setAttribute("title", "YouTube video");
    return { element };
  }

  static importDOM() {
    return {
      iframe: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-youtube")) {
          return null;
        }
        return {
          conversion: convertYoutubeElement,
          priority: 1,
        };
      },
    };
  }

  createDOM() {
    const div = document.createElement("div");
    return div;
  }

  updateDOM() {
    return false;
  }

  isKeyboardSelectable() {
    return true;
  }

  getId() {
    return this.__id;
  }

  getTextContent() {
    return `https://www.youtube.com/watch?v=${this.__id}`;
  }

  decorate() {
    return null;
  }
}

export function $createYouTubeNode(videoID) {
  return new YouTubeNode(videoID);
}

export function $isYouTubeNode(node) {
  return node instanceof YouTubeNode;
}
