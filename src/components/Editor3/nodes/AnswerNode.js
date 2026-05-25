/**
 * AnswerNode — Server-safe node class for answer/response blocks.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { DecoratorNode } from "lexical";

function convertAnswerElement(domNode) {
  const ids = domNode.getAttribute("data-lexical-answer");
  if (ids) {
    return { node: $createAnswerNode(ids.split(",")) };
  }
  return null;
}

export class AnswerNode extends DecoratorNode {
  __ids;
  __requestDefinition;
  __allowedInput;
  __promptMethod;

  static getType() {
    return "answer";
  }

  static clone(node) {
    return new AnswerNode(
      node.__ids,
      node.__requestDefinition,
      node.__allowedInput,
      node.__promptMethod,
      node.__format,
      node.__key,
    );
  }

  static importJSON(serializedNode) {
    return $createAnswerNode(
      serializedNode.wordIDs,
      serializedNode.requestDefinition,
      serializedNode.allowedInput,
      serializedNode.promptMethod,
    );
  }

  exportJSON() {
    return {
      type: "answer",
      version: 1,
      wordIDs: [...this.__ids],
      requestDefinition: this.__requestDefinition,
      allowedInput: this.__allowedInput,
      promptMethod: this.__promptMethod,
    };
  }

  constructor(
    ids = [],
    requestDefinition = "definition",
    allowedInput = "text",
    promptMethod = "word",
    format,
    key,
  ) {
    super(key);
    this.__ids = ids;
    this.__requestDefinition = requestDefinition;
    this.__allowedInput = allowedInput;
    this.__promptMethod = promptMethod;
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-answer", this.__ids.join(","));
    return { element };
  }

  createDOM() {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-answer", this.__ids.join(","));
    return div;
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-answer")) {
          return null;
        }
        return {
          conversion: convertAnswerElement,
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

  setIds(ids) {
    const writable = this.getWritable();
    writable.__ids = [...new Set([...ids])];
  }

  getRequestDefinition() {
    return this.__requestDefinition;
  }

  setRequestDefinition(value) {
    const writable = this.getWritable();
    writable.__requestDefinition = value;
  }

  getAllowedInput() {
    return this.__allowedInput;
  }

  setAllowedInput(value) {
    const writable = this.getWritable();
    writable.__allowedInput = value;
  }

  getPromptMethod() {
    return this.__promptMethod;
  }

  setPromptMethod(value) {
    const writable = this.getWritable();
    writable.__promptMethod = value;
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

export function $createAnswerNode(ids, requestDefinition, allowedInput, promptMethod) {
  return new AnswerNode(ids, requestDefinition, allowedInput, promptMethod);
}

export function $isAnswerNode(node) {
  return node instanceof AnswerNode;
}
