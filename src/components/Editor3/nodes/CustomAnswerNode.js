/**
 * CustomAnswerNode — Server-safe node class for custom AI-graded answers.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { DecoratorNode } from "lexical";

function convertCustomAnswerElement(domNode) {
  const ids = domNode.getAttribute("data-lexical-custom-answer");
  if (ids) {
    return {
      node: $createCustomAnswerNode(
        ids.split(","),
        undefined,
        undefined,
        undefined,
        domNode.getAttribute("data-lexical-custom-answer-direction"),
      ),
    };
  }
  return null;
}

export class CustomAnswerNode extends DecoratorNode {
  __ids;
  __promptMethod;
  __allowedInput;
  __format;
  __direction;

  static getType() {
    return "custom-answer";
  }

  static clone(node) {
    return new CustomAnswerNode(
      node.__ids,
      node.__promptMethod,
      node.__allowedInput,
      node.__format,
      node.__direction,
      node.__key,
    );
  }

  static importJSON(serializedNode) {
    return $createCustomAnswerNode(
      serializedNode.wordIDs,
      serializedNode.promptMethod,
      serializedNode.allowedInput,
      serializedNode.format,
      serializedNode.direction,
    );
  }

  exportJSON() {
    return {
      type: "custom-answer",
      version: 1,
      wordIDs: [...this.__ids],
      promptMethod: this.__promptMethod,
      allowedInput: this.__allowedInput,
      format: this.__format,
      direction: this.__direction,
    };
  }

  constructor(
    ids = [],
    promptMethod = "word",
    allowedInput = "text",
    format = "default",
    direction = "question-to-answer",
    key,
  ) {
    super(key);
    this.__ids = ids;
    this.__promptMethod = promptMethod;
    this.__allowedInput = allowedInput;
    this.__format = format;
    this.__direction = direction;
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-custom-answer", this.__ids.join(","));
    element.setAttribute("data-lexical-custom-answer-direction", this.__direction);
    return { element };
  }

  createDOM() {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-custom-answer", this.__ids.join(","));
    div.setAttribute("data-lexical-custom-answer-direction", this.__direction);
    return div;
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-custom-answer")) {
          return null;
        }
        return {
          conversion: convertCustomAnswerElement,
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

  getPromptMethod() {
    return this.__promptMethod;
  }

  setPromptMethod(value) {
    const writable = this.getWritable();
    writable.__promptMethod = value;
  }

  getAllowedInput() {
    return this.__allowedInput;
  }

  setAllowedInput(value) {
    const writable = this.getWritable();
    writable.__allowedInput = value;
  }

  getFormat() {
    return this.__format;
  }

  getDirection() {
    return this.__direction;
  }

  setDirection(direction) {
    const writable = this.getWritable();
    writable.__direction = direction;
  }

  setFormat(value) {
    const writable = this.getWritable();
    writable.__format = value;
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

export function $createCustomAnswerNode(
  ids,
  promptMethod,
  allowedInput,
  format,
  direction,
) {
  return new CustomAnswerNode(
    ids,
    promptMethod,
    allowedInput,
    format,
    direction,
  );
}

export function $isCustomAnswerNode(node) {
  return node instanceof CustomAnswerNode;
}
