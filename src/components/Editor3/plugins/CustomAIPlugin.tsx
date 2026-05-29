/**
 * @fileoverview CustomAIPlugin - Creates AI-graded exercises with security guardrails.
 *
 * This plugin provides instructor-customizable AI-graded exercises where:
 * - Instructors set grading criteria and choose input modes (text/audio/image/drawing)
 * - Students submit answers through the configured input mode
 * - AI grades submissions with an immutable, secure system prompt
 * - The UI interface is non-customizable to prevent security bypass
 *
 * @module CustomAIPlugin
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  DecoratorNode,
  $getSelection,
} from "lexical";
import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  DOMConversionMap,
  DOMConversionOutput,
} from "lexical";
import * as React from "react";
import { useEffect, lazy, Suspense } from "react";

const CustomAIEditor = lazy(
  () => import("../nodes/CustomAINode/CustomAIEditor"),
);
const CustomAIComponent = lazy(
  () => import("../nodes/CustomAINode/CustomAIComponent"),
);

/** Input modes available for the Custom AI block */
export type CustomAIInputMode = "text" | "audio" | "image" | "drawing";

/** Serialized format for persistence in Lexical JSON */
export interface SerializedCustomAINode extends SerializedLexicalNode {
  type: "custom-ai";
  version: 1;
  ids: string[];
  inputMode: CustomAIInputMode;
  criteria: string;
  allowedInput: CustomAIInputMode[];
  format: string;
}

function convertCustomAIElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const idsAttr = domNode.getAttribute("data-lexical-custom-ai");
  if (!idsAttr) return null;

  const ids = idsAttr.split(",").filter(Boolean);
  const inputMode =
    (domNode.getAttribute(
      "data-lexical-custom-ai-input-mode",
    ) as CustomAIInputMode) || "text";
  const criteria =
    domNode.getAttribute("data-lexical-custom-ai-criteria") || "";
  const allowedInput = (() => {
    try {
      return JSON.parse(
        domNode.getAttribute("data-lexical-custom-ai-allowed-input") || "[]",
      );
    } catch {
      return ["text"];
    }
  })();

  const node = $createCustomAINode(ids, inputMode, criteria, allowedInput);
  return { node };
}

/**
 * CustomAINode - Lexical DecoratorNode for AI-graded exercises.
 *
 * Stores question IDs, input mode configuration, and instructor grading criteria.
 * Renders CustomAIEditor in edit mode and CustomAIComponent in read-only mode.
 */
export class CustomAINode extends DecoratorNode<React.JSX.Element> {
  __ids: string[];
  __inputMode: CustomAIInputMode;
  __criteria: string;
  __allowedInput: CustomAIInputMode[];
  __format: string;

  static getType(): string {
    return "custom-ai";
  }

  static clone(node: CustomAINode): CustomAINode {
    return new CustomAINode(
      node.__ids,
      node.__inputMode,
      node.__criteria,
      node.__allowedInput,
      node.__format,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedCustomAINode): CustomAINode {
    const node = $createCustomAINode(
      serializedNode.ids,
      serializedNode.inputMode,
      serializedNode.criteria,
      serializedNode.allowedInput,
      serializedNode.format,
    );
    return node;
  }

  exportJSON(): SerializedCustomAINode {
    return {
      type: "custom-ai",
      version: 1,
      ids: [...this.__ids],
      inputMode: this.__inputMode,
      criteria: this.__criteria,
      allowedInput: [...this.__allowedInput],
      format: this.__format,
    };
  }

  constructor(
    ids: string[] = [],
    inputMode: CustomAIInputMode = "text",
    criteria: string = "",
    allowedInput: CustomAIInputMode[] = ["text"],
    format: string = "",
    key?: NodeKey,
  ) {
    super(key);
    this.__ids = ids;
    this.__inputMode = inputMode;
    this.__criteria = criteria;
    this.__allowedInput = allowedInput;
    this.__format = format;
  }

  exportDOM(): { element: HTMLElement } {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-custom-ai", this.__ids.join(","));
    element.setAttribute(
      "data-lexical-custom-ai-input-mode",
      this.__inputMode,
    );
    element.setAttribute("data-lexical-custom-ai-criteria", this.__criteria);
    element.setAttribute(
      "data-lexical-custom-ai-allowed-input",
      JSON.stringify(this.__allowedInput),
    );
    return { element };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-custom-ai", this.__ids.join(","));
    div.setAttribute("data-lexical-custom-ai-input-mode", this.__inputMode);
    div.setAttribute("data-lexical-custom-ai-criteria", this.__criteria);
    div.setAttribute(
      "data-lexical-custom-ai-allowed-input",
      JSON.stringify(this.__allowedInput),
    );
    return div;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-custom-ai")) {
          return null;
        }
        return {
          conversion: convertCustomAIElement,
          priority: 1 as const,
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

  isSelectable(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return true;
  }

  getIds(): string[] {
    return this.__ids;
  }

  appendId(id: string): void {
    const writable = this.getWritable();
    writable.__ids = [...new Set([...writable.__ids, id])];
  }

  removeId(id: string): void {
    const writable = this.getWritable();
    writable.__ids = writable.__ids.filter((i) => i !== id);
  }

  setIds(ids: string[]): void {
    const writable = this.getWritable();
    writable.__ids = [...ids];
  }

  getInputMode(): CustomAIInputMode {
    return this.__inputMode;
  }

  setInputMode(mode: CustomAIInputMode): void {
    const writable = this.getWritable();
    writable.__inputMode = mode;
  }

  getCriteria(): string {
    return this.__criteria;
  }

  setCriteria(criteria: string): void {
    const writable = this.getWritable();
    writable.__criteria = criteria;
  }

  getAllowedInput(): CustomAIInputMode[] {
    return this.__allowedInput;
  }

  setAllowedInput(allowedInput: CustomAIInputMode[]): void {
    const writable = this.getWritable();
    writable.__allowedInput = [...allowedInput];
  }

  setFormat(format: string): void {
    const self = this.getWritable();
    self.__format = format;
  }

  getFormat(): string {
    return this.__format;
  }

  getTextContent(): string {
    return this.__ids.join(",");
  }

  decorate(
    _editor: import("lexical").LexicalEditor,
    config: { theme: { embedBlock?: { base?: string; focus?: string } } },
  ): React.JSX.Element {
    const isEditable = _editor.isEditable();
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || "",
    };

    return (
      <Suspense fallback={null}>
        {isEditable && (
          <CustomAIEditor
            className={className}
            format={this.__format}
            nodeKey={this.getKey()}
            ids={this.__ids}
            inputMode={this.__inputMode}
            criteria={this.__criteria}
            allowedInput={this.__allowedInput}
          />
        )}
        {!isEditable && (
          <CustomAIComponent
            className={className}
            format={this.__format}
            nodeKey={this.getKey()}
            ids={this.__ids}
            inputMode={this.__inputMode}
            criteria={this.__criteria}
            allowedInput={this.__allowedInput}
          />
        )}
      </Suspense>
    );
  }
}

/**
 * Factory function to create a CustomAINode.
 */
export function $createCustomAINode(
  ids: string[] = [],
  inputMode: CustomAIInputMode = "text",
  criteria: string = "",
  allowedInput: CustomAIInputMode[] = ["text"],
  format: string = "",
): CustomAINode {
  return new CustomAINode(ids, inputMode, criteria, allowedInput, format);
}

/**
 * Type guard for CustomAINode.
 */
export function $isCustomAINode(
  node: LexicalNode | null | undefined,
): node is CustomAINode {
  return node instanceof CustomAINode;
}

/**
 * Command to insert a custom AI exercise block.
 */
export const INSERT_CUSTOM_AI_BLOCK_COMMAND = createCommand<string[]>(
  "INSERT_CUSTOM_AI_BLOCK_COMMAND",
);

/**
 * CustomAIPlugin - Registers custom AI block functionality with the editor.
 */
export default function CustomAIPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([CustomAINode])) {
      throw new Error(
        "CustomAIPlugin: CustomAINode not registered on editor",
      );
    }

    return editor.registerCommand(
      INSERT_CUSTOM_AI_BLOCK_COMMAND,
      (payload: string[]) => {
        const selection = $getSelection();
        let selectedNode: CustomAINode | null = null;

        if (selection) {
          const nodes = selection.getNodes();
          for (const node of nodes) {
            if ($isCustomAINode(node)) {
              selectedNode = node;
              break;
            }
            let parent = node.getParent();
            while (parent) {
              if ($isCustomAINode(parent)) {
                selectedNode = parent as CustomAINode;
                break;
              }
              parent = parent.getParent();
            }
            if (selectedNode) break;
          }
        }

        if (selectedNode) {
          payload.forEach((id) => selectedNode!.appendId(id));
        } else {
          const node = $createCustomAINode(payload);
          $insertNodeToNearestRoot(node);
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
