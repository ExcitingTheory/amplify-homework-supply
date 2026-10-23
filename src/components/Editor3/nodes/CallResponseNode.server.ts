import {
  DecoratorNode,
  type NodeKey,
  type SerializedLexicalNode,
} from "lexical";
import {
  isCallResponseScript,
  type CallResponseScript,
} from "../../../utils/callResponse/buildCallResponseScript";

export class CallResponseNodeServer extends DecoratorNode<null> {
  __script: CallResponseScript;

  static getType(): string {
    return "call-response";
  }

  static clone(node: CallResponseNodeServer): CallResponseNodeServer {
    return new CallResponseNodeServer(node.__script, node.__key);
  }

  static importJSON(serializedNode: SerializedLexicalNode): CallResponseNodeServer {
    if (
      !("script" in serializedNode) ||
      !isCallResponseScript(serializedNode.script)
    ) {
      throw new Error("Invalid call-response node data");
    }
    return new CallResponseNodeServer(serializedNode.script);
  }

  constructor(script: CallResponseScript, key?: NodeKey) {
    super(key);
    this.__script = script;
  }

  exportJSON() {
    return {
      type: "call-response",
      version: 1 as const,
      script: JSON.parse(JSON.stringify(this.__script)) as CallResponseScript,
    };
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-call-response", "true");
    return element;
  }

  updateDOM(): false {
    return false;
  }

  getTextContent(): string {
    return this.__script.title;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return true;
  }

  decorate(): null {
    return null;
  }
}
