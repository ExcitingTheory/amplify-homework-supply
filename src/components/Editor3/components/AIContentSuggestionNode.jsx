/**
 * @fileoverview AIContentSuggestionNode - Inline AI suggestion decorator node.
 *
 * Renders AI-generated text suggestions inline with the editor content as ghost text.
 * Does not get serialized to editor state - only displayed temporarily until accepted or dismissed.
 *
 * @module AIContentSuggestionNode
 */

import { DecoratorNode } from "lexical";
import * as React from "react";

export const AI_SUGGESTION_UUID = Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, "")
  .substr(0, 5);

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

  static importJSON(serializedNode) {
    // Transient node - create an empty instance that will be cleaned up
    return new AIContentSuggestionNode("", "");
  }

  exportJSON() {
    // Return valid JSON so serialization doesn't produce null/undefined types
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

  updateDOM(prevNode, dom, config) {
    // Return true to force re-render when suggestion changes
    const needsUpdate = prevNode.__suggestion !== this.__suggestion;
    return needsUpdate;
  }

  createDOM(config) {
    return document.createElement("span");
  }

  decorate() {
    if (this.__uuid !== AI_SUGGESTION_UUID) {
      return null;
    }
    return <AIContentSuggestionComponent suggestion={this.__suggestion} />;
  }

  isInline() {
    return true;
  }

  setSuggestion(suggestion) {
    const writable = this.getWritable();
    writable.__suggestion = suggestion;
  }

  getSuggestion() {
    return this.__suggestion;
  }
}

export function $createAIContentSuggestionNode(uuid, suggestion) {
  return new AIContentSuggestionNode(uuid, suggestion);
}

export class AILoadingNode extends DecoratorNode {
  __uuid;

  static clone(node) {
    return new AILoadingNode(node.__uuid, node.__key);
  }

  static getType() {
    return "ai-loading";
  }

  static importJSON(serializedNode) {
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

  updateDOM(prevNode, dom, config) {
    return false;
  }

  createDOM(config) {
    return document.createElement("span");
  }

  decorate() {
    if (this.__uuid !== AI_SUGGESTION_UUID) {
      return null;
    }
    return <AILoadingComponent />;
  }
}

export function $createAILoadingNode(uuid) {
  return new AILoadingNode(uuid);
}

function AILoadingComponent() {
  return (
    <span
      style={{
        color: "var(--mui-palette-text-secondary, #666)",
        opacity: 0.7,
        fontStyle: "italic",
        userSelect: "none",
        pointerEvents: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
      spellCheck="false"
      contentEditable={false}
    >
      <span
        style={{
          display: "inline-block",
          width: "8px",
          height: "8px",
          border: "2px solid var(--mui-palette-text-secondary, #666)",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      Generating...
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
}

function AIContentSuggestionComponent({ suggestion }) {
  console.log(
    "AIContentSuggestionComponent rendering with suggestion:",
    suggestion,
  );

  if (!suggestion) {
    return null;
  }

  return (
    <span
      style={{
        color: "var(--mui-palette-text-primary, #444)",
        opacity: 0.9,
        fontStyle: "italic",
        userSelect: "none",
        pointerEvents: "none",
      }}
      spellCheck="false"
      contentEditable={false}
    >
      {suggestion}
      <span
        style={{
          fontSize: "10px",
          marginLeft: "8px",
          opacity: 0.95,
        }}
      >
        (Tab to accept)
      </span>
    </span>
  );
}
