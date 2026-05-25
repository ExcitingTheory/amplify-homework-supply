/**
 * MeaningAssociationNode — Server-safe node class for vocabulary matching exercises.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { DecoratorNode } from "lexical";

function convertMeaningAssociationElement(domNode) {
  const ids = domNode.getAttribute("data-lexical-meaning-association");
  if (ids) {
    return { node: $createMeaningAssociationNode(ids.split(",")) };
  }
  return null;
}

export class MeaningAssociationNode extends DecoratorNode {
  __ids;
  __enabledModes;

  static getType() {
    return "meaning-association";
  }

  static clone(node) {
    return new MeaningAssociationNode(
      node.__ids,
      node.__enabledModes,
      node.__format,
      node.__key,
    );
  }

  static importJSON(serializedNode) {
    return $createMeaningAssociationNode(
      serializedNode.wordIDs,
      serializedNode.enabledModes,
    );
  }

  exportJSON() {
    return {
      type: "meaning-association",
      version: 1,
      wordIDs: [...this.__ids],
      enabledModes: this.__enabledModes || ["learn", "easy", "hard"],
    };
  }

  constructor(ids = [], enabledModes = ["learn", "easy", "hard"], format, key) {
    super(key);
    this.__ids = ids;
    this.__enabledModes = enabledModes;
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute(
      "data-lexical-meaning-association",
      this.__ids.join(","),
    );
    return { element };
  }

  createDOM(config) {
    const div = document.createElement("div");
    div.setAttribute(
      "data-lexical-meaning-association",
      this.__ids.join(","),
    );
    return div;
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-meaning-association")) {
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

  isKeyboardSelectable() {
    return true;
  }

  getIds() {
    return this.__ids;
  }

  getEnabledModes() {
    return this.__enabledModes || ["learn", "easy", "hard"];
  }

  setEnabledModes(modes) {
    const writable = this.getWritable();
    writable.__enabledModes = modes;
  }

  setIds(ids) {
    const writable = this.getWritable();
    writable.__ids = [...new Set([...ids])];
  }

  mergeIds(ids) {
    const writable = this.getWritable();
    writable.__ids = [...new Set([...writable.__ids, ...ids])];
  }

  appendId(id) {
    const writable = this.getWritable();
    writable.__ids = [...new Set([...writable.__ids, id])];
  }

  removeIntersection(ids) {
    const writable = this.getWritable();
    writable.__ids = this.__ids.filter((x) => !ids.includes(x));
  }

  getTextContent() {
    return this.__ids;
  }

  decorate() {
    return null;
  }
}

export function $createMeaningAssociationNode(ids, enabledModes) {
  return new MeaningAssociationNode(ids, enabledModes);
}

export function $isMeaningAssociationNode(node) {
  return node instanceof MeaningAssociationNode;
}
