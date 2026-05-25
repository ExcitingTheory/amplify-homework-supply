/**
 * AutocompleteNode — Server-safe node class for inline autocomplete suggestions.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { DecoratorNode } from "lexical";

export class AutocompleteNode extends DecoratorNode {
  __uuid;

  static clone(node) {
    return new AutocompleteNode(node.__uuid, node.__key);
  }

  static getType() {
    return "autocomplete";
  }

  static importJSON(serializedNode) {
    const node = $createAutocompleteNode(serializedNode.uuid);
    return node;
  }

  exportJSON() {
    return {
      type: "autocomplete",
      uuid: this.__uuid,
      version: 1,
    };
  }

  constructor(uuid, key) {
    super(key);
    this.__uuid = uuid;
  }

  updateDOM() {
    return false;
  }

  createDOM() {
    return document.createElement("span");
  }

  decorate() {
    return null;
  }
}

export function $createAutocompleteNode(uuid) {
  return new AutocompleteNode(uuid);
}

export function $isAutocompleteNode(node) {
  return node instanceof AutocompleteNode;
}
