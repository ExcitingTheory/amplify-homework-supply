import React, { useEffect, useState } from "react";
import { act, fireEvent, render, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { $createHeadingNode, HeadingNode } from "@lexical/rich-text";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $insertNodes,
  COMMAND_PRIORITY_NORMAL,
  createEditor,
  type LexicalEditor,
} from "lexical";
import DraggableBlockPlugin, { setMenuPosition } from "../DraggableBlockPlugin";
import TableOfContents from "../../components/TableOfContents";
import {
  OPEN_BLOCK_INSERT_MENU_COMMAND,
  $selectInsertionPointAfterBlock,
} from "../../constants/blockInsertion";

function Harness({ onReady, showContents = false }: {
  onReady: (editor: LexicalEditor) => void;
  showContents?: boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  useEffect(() => onReady(editor), [editor, onReady]);
  return (
    <div ref={setAnchor}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      {anchor && <DraggableBlockPlugin anchorElem={anchor} />}
      {showContents && <TableOfContents />}
    </div>
  );
}

describe("editor block gutter", () => {
  it.each([true, false])("scrolls from accessible line links and the TOC without changing content (editable: %s)", async (editable) => {
    let editor!: LexicalEditor;
    const { container } = render(
      <LexicalComposer initialConfig={{
        namespace: "gutter-navigation",
        editable,
        nodes: [HeadingNode],
        onError: (error) => { throw error; },
        editorState: () => {
          $getRoot().append($createHeadingNode("h2").append($createTextNode("Section")));
        },
      }}>
        <Harness showContents onReady={(value) => { editor = value; }} />
      </LexicalComposer>,
    );
    const link = await within(container).findByRole("link", { name: "1" });
    expect(link.getAttribute("href")).toBe(`#${link.id}`);
    expect(link.closest('[aria-hidden="true"]')).toBeNull();
    const heading = container.querySelector("h2")!;
    const pane = heading.parentElement!.parentElement!;
    pane.style.overflowY = "auto";
    Object.defineProperties(pane, {
      clientHeight: { value: 600 },
      scrollHeight: { value: 2000 },
    });
    vi.spyOn(pane, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 160, 800, 600));
    vi.spyOn(heading, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 600, 800, 40));
    const scroll = vi.spyOn(pane, "scrollTo");
    const originalContent = editor.getEditorState().toJSON();

    fireEvent.click(link);
    expect(scroll).toHaveBeenLastCalledWith({ top: 440, behavior: "smooth" });
    expect(link).toHaveAttribute("aria-current", "location");
    expect(window.location.hash).toBe(`#${link.id}`);
    fireEvent.click(within(container).getByRole("button", { name: "Section" }));
    expect(scroll).toHaveBeenCalledTimes(2);
    expect(scroll).toHaveBeenLastCalledWith({ top: 440, behavior: "smooth" });
    expect(editor.getEditorState().toJSON()).toEqual(originalContent);
    vi.restoreAllMocks();
  });

  it("numbers blocks after edits and reordering and anchors insertion to the selected block", async () => {
    let editor!: LexicalEditor;
    const { container } = render(
      <LexicalComposer initialConfig={{
        namespace: "gutter",
        onError: (error) => { throw error; },
        editorState: () => {
          const first = $createParagraphNode().append($createTextNode("First"));
          $getRoot().append(first, $createParagraphNode().append($createTextNode("Second")));
          first.selectStart();
        },
      }}>
        <Harness onReady={(value) => { editor = value; }} />
      </LexicalComposer>,
    );
    await waitFor(() => expect(container.querySelectorAll(".editor-block-number")).toHaveLength(2));
    const openMenu = vi.fn();
    const unregister = editor.registerCommand(OPEN_BLOCK_INSERT_MENU_COMMAND, (payload) => {
      openMenu(payload);
      return true;
    }, COMMAND_PRIORITY_NORMAL);
    fireEvent.click(container.querySelector(".editor-block-insert")!);
    const firstKey = editor.getEditorState().read(() => $getRoot().getFirstChildOrThrow().getKey());
    expect(openMenu).toHaveBeenCalledWith(expect.objectContaining({ nodeKey: firstKey }));
    await act(async () => editor.update(() => {
      const root = $getRoot();
      root.getFirstChildOrThrow().insertBefore(root.getLastChildOrThrow());
      root.append($createParagraphNode().append($createTextNode("Third")));
    }));
    await waitFor(() => expect(
      [...container.querySelectorAll(".editor-block-number")].map((element) => element.textContent),
    ).toEqual(["1", "2", "3"]));
    await act(async () => editor.setEditable(false));
    expect(container.querySelector(".editor-block-insert")).toBeNull();
    expect(container.querySelector(".draggable-block-menu")).toHaveAttribute("hidden");
    unregister();
  });

  it("positions the handle beside the centered editable instead of the outer anchor, including after scrolling", () => {
    const anchor = document.createElement("div");
    const root = document.createElement("div");
    const block = document.createElement("p");
    const handle = document.createElement("div");
    block.style.lineHeight = "24px";
    vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue(new DOMRect(100, -200, 1200, 1000));
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue(new DOMRect(288, -200, 1024, 1000));
    vi.spyOn(block, "getBoundingClientRect").mockReturnValue(new DOMRect(304, 120, 992, 72));
    setMenuPosition(block, handle, anchor, root);
    expect(handle.style.transform).toBe("translate(100px, 318px)");
  });
});

describe("gutter insertion point", () => {
  it.each(["nearest-root", "insert-nodes"])("inserts below selected text without overwriting or adding empty blocks (%s)", (method) => {
    const editor = createEditor({ nodes: [HeadingNode], onError: (error) => { throw error; } });
    editor.update(() => {
      const first = $createParagraphNode().append($createTextNode("Keep selected text"));
      const second = $createParagraphNode().append($createTextNode("Keep following text"));
      $getRoot().append(first, second);
      first.select(0, 1);
      $selectInsertionPointAfterBlock(first.getKey());
      const heading = $createHeadingNode("h2").append($createTextNode("Inserted"));
      if (method === "nearest-root") $insertNodeToNearestRoot(heading);
      else $insertNodes([heading]);
      expect($getRoot().getChildren().map((node) => node.getTextContent()))
        .toEqual(["Keep selected text", "Inserted", "Keep following text"]);
    }, { discrete: true });
  });
});
