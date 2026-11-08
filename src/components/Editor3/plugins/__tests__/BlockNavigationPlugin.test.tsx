import React, { useEffect } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  DecoratorNode,
  createEditor,
  KEY_ARROW_DOWN_COMMAND,
  type LexicalEditor,
  type NodeKey,
} from "lexical";
import BlockNavigationPlugin from "../BlockNavigationPlugin";
import BlockSuggestionPlugin from "../BlockSuggestionPlugin";

const { setSuggestions } = vi.hoisted(() => ({ setSuggestions: vi.fn() }));
vi.mock("../../context/SuggestionContext", () => ({
  useSuggestions: () => ({
    suggestions: [{ type: "heading", label: "Add a heading", blockData: {} }],
    setSuggestions,
    setIsLoadingAI: vi.fn(),
    setError: vi.fn(),
    registerInsertCallback: vi.fn(),
    active: false,
  }),
}));
vi.mock("../../../../context/unitContext", async () => {
  const { createContext } = await import("react");
  return { default: createContext({ dictionary: {}, questionBank: {} }) };
});
vi.mock("../../../../context/sectionContext", async () => {
  const { createContext } = await import("react");
  return { default: createContext({ sections: [], assignments: [] }) };
});

class ExampleBlock extends DecoratorNode<React.ReactElement> {
  static getType() { return "navigation-example"; }
  static clone(node: ExampleBlock) { return new ExampleBlock(node.__key); }
  static importJSON() { return new ExampleBlock(); }
  constructor(key?: NodeKey) { super(key); }
  createDOM() { return document.createElement("div"); }
  updateDOM() { return false; }
  decorate() { return <span>Custom block</span>; }
}

function CaptureEditor({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => onReady(editor), [editor, onReady]);
  return null;
}

function setup({ followingParagraph = false, consecutive = false } = {}) {
  let editor!: LexicalEditor;
  let blockKey!: NodeKey;
  render(
    <LexicalComposer initialConfig={{
      namespace: "block-navigation",
      nodes: [ExampleBlock],
      onError: (error) => { throw error; },
      editorState: () => {
        const paragraph = $createParagraphNode();
        const block = new ExampleBlock();
        blockKey = block.getKey();
        $getRoot().append(paragraph, block);
        if (followingParagraph) {
          $getRoot().append($createParagraphNode().append($createTextNode("Existing text")));
        }
        if (consecutive) $getRoot().append(new ExampleBlock());
        paragraph.selectEnd();
      },
    }}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <BlockSuggestionPlugin />
      <BlockNavigationPlugin />
      <CaptureEditor onReady={(value) => { editor = value; }} />
    </LexicalComposer>,
  );
  return { editor, blockKey };
}

async function arrowDown(editor: LexicalEditor, modifiers: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    key: "ArrowDown", cancelable: true, ...modifiers,
  });
  await act(async () => { editor.dispatchCommand(KEY_ARROW_DOWN_COMMAND, event); });
  return event;
}

afterEach(() => vi.restoreAllMocks());

describe("custom block ArrowDown navigation", () => {
  it("selects the block before creating a paragraph below it, despite suggestions", async () => {
    const scroll = vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(() => {});
    const { editor, blockKey } = setup();
    expect((await arrowDown(editor)).defaultPrevented).toBe(true);
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      expect($isNodeSelection(selection)).toBe(true);
      expect(selection?.getNodes().map((node) => node.getKey())).toEqual([blockKey]);
      expect($getRoot().getChildrenSize()).toBe(2);
    });
    await arrowDown(editor);
    editor.getEditorState().read(() => {
      const paragraph = $getRoot().getLastChildOrThrow();
      const selection = $getSelection();
      expect(paragraph.getType()).toBe("paragraph");
      expect($isRangeSelection(selection) && selection.anchor.key).toBe(paragraph.getKey());
      expect($getRoot().getChildrenSize()).toBe(3);
    });
    expect(scroll).toHaveBeenLastCalledWith({ block: "nearest" });
    expect(scroll.mock.instances.at(-1)).toBe(editor.getRootElement()?.lastElementChild);
  });

  it("reuses the following paragraph without overwriting its content", async () => {
    const { editor } = setup({ followingParagraph: true });
    await arrowDown(editor);
    await arrowDown(editor);
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      expect($getRoot().getChildrenSize()).toBe(3);
      expect($getRoot().getLastChildOrThrow().getTextContent()).toBe("Existing text");
      expect($isRangeSelection(selection) && selection.anchor.offset).toBe(0);
    });
  });

  it("inserts a paragraph between consecutive blocks", async () => {
    const { editor } = setup({ consecutive: true });
    await arrowDown(editor);
    await arrowDown(editor);
    editor.getEditorState().read(() => {
      expect($getRoot().getChildren().map((node) => node.getType()))
        .toEqual(["paragraph", "navigation-example", "paragraph", "navigation-example"]);
    });
  });

  it("leaves plain arrows free when there is no adjacent block", async () => {
    const { editor } = setup();
    await act(async () => {
      editor.update(() => {
        $getRoot().clear();
        const paragraph = $createParagraphNode();
        $getRoot().append(paragraph);
        paragraph.selectEnd();
      }, { discrete: true });
    });
    expect((await arrowDown(editor)).defaultPrevented).toBe(false);
    editor.getEditorState().read(() => expect($getRoot().getChildrenSize()).toBe(1));
  });

  it("does not hijack Shift+ArrowDown to select or insert a block", async () => {
    const { editor } = setup();
    await arrowDown(editor, { shiftKey: true });
    editor.getEditorState().read(() => {
      expect($isNodeSelection($getSelection())).toBe(false);
      expect($getRoot().getChildrenSize()).toBe(2);
    });
  });

  it("does not navigate the outer document while a nested editor handles ArrowDown", async () => {
    const { editor } = setup();
    const nestedEditor = createEditor({
      namespace: "nested-block-content",
      parentEditor: editor,
      onError: (error) => { throw error; },
    });
    nestedEditor.update(() => {
      const paragraph = $createParagraphNode();
      $getRoot().append(paragraph);
      paragraph.selectEnd();
    }, { discrete: true });
    expect((await arrowDown(nestedEditor)).defaultPrevented).toBe(false);
    editor.getEditorState().read(() => {
      expect($isRangeSelection($getSelection())).toBe(true);
      expect($getRoot().getChildrenSize()).toBe(2);
    });
  });
});
