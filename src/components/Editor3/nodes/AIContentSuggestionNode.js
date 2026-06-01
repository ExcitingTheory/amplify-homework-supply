/**
 * AIContentSuggestionNode & AILoadingNode — Server-safe node classes.
 * These are transient nodes that don't persist in editor state.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { DecoratorNode } from "lexical";

export class AIContentSuggestionNode extends DecoratorNode {
  __uuid;
  __suggestion;

  static clone(node) {
    return new AIContentSuggestionNode(
      node.__uuid,
      node.__suggestion,
      node.__key,
    );
  }

  static getType() {
    return "ai-content-suggestion";
  }

  static importJSON() {
    return new AIContentSuggestionNode("", "");
  }

  exportJSON() {
    return {
      type: "ai-content-suggestion",
      version: 1,
    };
  }

  constructor(uuid, suggestion, key) {
    super(key);
    this.__uuid = uuid;
    this.__suggestion = suggestion || "";
  }

  updateDOM(prevNode) {
    return prevNode.__suggestion !== this.__suggestion;
  }

  createDOM() {
    return document.createElement("span");
  }

  isInline() {
    return true;
  }

  decorate() {
    return null;
  }
}

export class AILoadingNode extends DecoratorNode {
  __uuid;

  static clone(node) {
    return new AILoadingNode(node.__uuid, node.__key);
  }

  static getType() {
    return "ai-loading";
  }

  static importJSON() {
    return new AILoadingNode("");
  }

  exportJSON() {
    return {
      type: "ai-loading",
      version: 1,
    };
  }

  constructor(uuid, key) {
    super(key);
    this.__uuid = uuid;
  }

  isInline() {
    return true;
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

export function $createAIContentSuggestionNode(uuid, suggestion) {
  return new AIContentSuggestionNode(uuid, suggestion);
}

export function $createAILoadingNode(uuid) {
  return new AILoadingNode(uuid);
}
