/**
 * PlaylistNode — Server-safe node class for media playlists.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { DecoratorNode } from "lexical";

function convertPlaylistElement(domNode) {
  const ids = domNode.getAttribute("data-lexical-playlist");
  if (ids) {
    return { node: $createPlaylistNode(ids.split(",")) };
  }
  return null;
}

export class PlaylistNode extends DecoratorNode {
  __ids;

  static getType() {
    return "playlist";
  }

  static clone(node) {
    return new PlaylistNode(node.__ids, node.__format, node.__key);
  }

  static importJSON(serializedNode) {
    return $createPlaylistNode(serializedNode.fileIDs);
  }

  exportJSON() {
    return {
      type: "playlist",
      version: 1,
      fileIDs: [...this.__ids],
    };
  }

  constructor(ids = [], format, key) {
    super(key);
    this.__ids = ids;
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-playlist", this.__ids.join(","));
    return { element };
  }

  createDOM() {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-playlist", this.__ids.join(","));
    return div;
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-playlist")) {
          return null;
        }
        return {
          conversion: convertPlaylistElement,
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

  setIds(ids) {
    const writable = this.getWritable();
    writable.__ids = [...new Set([...ids])];
  }

  getTextContent() {
    return this.__ids;
  }

  decorate() {
    return null;
  }
}

export function $createPlaylistNode(ids) {
  return new PlaylistNode(ids);
}

export function $isPlaylistNode(node) {
  return node instanceof PlaylistNode;
}
