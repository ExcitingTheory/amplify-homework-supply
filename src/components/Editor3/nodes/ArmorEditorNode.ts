/**
 * ArmorEditorNode — Server-safe node class for AI-powered editor blocks.
 * No React dependencies. decorate() returns null (only used client-side).
 */
import { DecoratorNode } from "lexical";

/**
 * Configuration type for the ArmorEditor block.
 */
export interface ArmorEditorConfig {
  prompt?: string;
  systemMessage?: string;
  tools?: string[];
  [key: string]: unknown;
}

function convertArmorEditorElement(domNode: HTMLElement) {
  const data = domNode.getAttribute("data-lexical-armor-editor");
  if (data) {
    try {
      return { node: $createArmorEditorNode(JSON.parse(data)) };
    } catch {
      return { node: $createArmorEditorNode({}) };
    }
  }
  return null;
}

export class ArmorEditorNode extends DecoratorNode<null> {
  __data: ArmorEditorConfig;

  static getType(): string {
    return "armor-editor";
  }

  static clone(node: ArmorEditorNode): ArmorEditorNode {
    return new ArmorEditorNode(node.__data, node.__key);
  }

  static importJSON(serializedNode: {
    data: ArmorEditorConfig;
    type: string;
    version: number;
  }): ArmorEditorNode {
    return $createArmorEditorNode(serializedNode.data);
  }

  exportJSON(): { data: ArmorEditorConfig; type: string; version: number } {
    return {
      type: "armor-editor",
      version: 1,
      data: this.__data,
    };
  }

  constructor(data: ArmorEditorConfig = {}, key?: string) {
    super(key);
    this.__data = data;
  }

  exportDOM(): { element: HTMLElement } {
    const element = document.createElement("div");
    element.setAttribute(
      "data-lexical-armor-editor",
      JSON.stringify(this.__data),
    );
    return { element };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    return div;
  }

  static importDOM(): Record<
    string,
    (
      domNode: HTMLElement,
    ) => {
      conversion: typeof convertArmorEditorElement;
      priority: number;
    } | null
  > {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-armor-editor")) {
          return null;
        }
        return {
          conversion: convertArmorEditorElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): boolean {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  getData(): ArmorEditorConfig {
    return this.__data;
  }

  setData(data: ArmorEditorConfig): void {
    const writable = this.getWritable();
    writable.__data = data;
  }

  decorate(): null {
    return null;
  }
}

export function $createArmorEditorNode(
  data: ArmorEditorConfig,
): ArmorEditorNode {
  return new ArmorEditorNode(data);
}

export function $isArmorEditorNode(node: unknown): node is ArmorEditorNode {
  return node instanceof ArmorEditorNode;
}
