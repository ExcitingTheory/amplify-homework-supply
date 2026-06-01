/**
 * QuizNode — Server-safe node class for interactive quizzes.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { DecoratorNode } from "lexical";

function convertQuizElement(domNode) {
  const data = domNode.getAttribute("data-lexical-quiz");
  if (data) {
    try {
      return { node: $createQuizNode(JSON.parse(data)) };
    } catch {
      return { node: $createQuizNode([]) };
    }
  }
  return null;
}

export class QuizNode extends DecoratorNode {
  __data;

  static getType() {
    return "quiz";
  }

  static clone(node) {
    return new QuizNode(node.__data, node.__format, node.__key);
  }

  static importJSON(serializedNode) {
    return $createQuizNode(serializedNode.data);
  }

  exportJSON() {
    return {
      type: "quiz",
      version: 1,
      data: this.__data,
    };
  }

  constructor(ids = [], format, key) {
    super(key);
    this.__data = ids;
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-quiz", JSON.stringify(this.__data));
    return { element };
  }

  createDOM() {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-quiz", JSON.stringify(this.__data));
    return div;
  }

  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-quiz")) {
          return null;
        }
        return {
          conversion: convertQuizElement,
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

  getData() {
    return this.__data || [];
  }

  saveData(data) {
    const writable = this.getWritable();
    writable.__data = data;
  }

  getTextContent() {
    return this.__data;
  }

  decorate() {
    return null;
  }
}

export function $createQuizNode(data) {
  return new QuizNode(data);
}

export function $isQuizNode(node) {
  return node instanceof QuizNode;
}
