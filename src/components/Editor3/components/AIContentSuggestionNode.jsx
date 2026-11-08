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
import { useTranslations } from "next-intl";
import SuggestionMarkdown from "./SuggestionMarkdown";

export const AI_SUGGESTION_UUID = Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, "")
  .substr(0, 5);

export class AIContentSuggestionNode extends DecoratorNode {
  __uuid;
  __suggestion;
  __referenceContext;

  static clone(node) {
    return new AIContentSuggestionNode(
      node.__uuid,
      node.__suggestion,
      node.__referenceContext,
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

  constructor(uuid, suggestion, referenceContext, key) {
    super(key);
    this.__uuid = uuid;
    this.__suggestion = suggestion || "";
    this.__referenceContext = referenceContext;
  }

  updateDOM(prevNode, dom, config) {
    // Return true to force re-render when suggestion changes
    return (
      prevNode.__suggestion !== this.__suggestion ||
      prevNode.__referenceContext !== this.__referenceContext
    );
  }

  createDOM(config) {
    return document.createElement("span");
  }

  decorate() {
    if (this.__uuid !== AI_SUGGESTION_UUID) {
      return null;
    }
    return (
      <AIContentSuggestionComponent
        suggestion={this.__suggestion}
        referenceContext={this.__referenceContext}
      />
    );
  }

  isInline() {
    return true;
  }

  setSuggestion(suggestion, referenceContext) {
    const writable = this.getWritable();
    writable.__suggestion = suggestion;
    if (referenceContext) writable.__referenceContext = referenceContext;
  }

  getSuggestion() {
    return this.__suggestion;
  }
}

export function $createAIContentSuggestionNode(uuid, suggestion, referenceContext) {
  return new AIContentSuggestionNode(uuid, suggestion, referenceContext);
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
  const t = useTranslations("editor.ai");
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
      {t("aiContentSuggestion.generating")}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
}

function AIContentSuggestionComponent({ suggestion, referenceContext }) {
  const t = useTranslations("editor.ai");
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
      {/^\s/.test(suggestion) ? " " : null}
      <SuggestionMarkdown markdown={suggestion} referenceContext={referenceContext} />
      <span
        style={{
          fontSize: "10px",
          marginLeft: "8px",
          opacity: 0.95,
        }}
      >
        {t("aiContentSuggestion.tabToAcceptHint")}
      </span>
    </span>
  );
}
