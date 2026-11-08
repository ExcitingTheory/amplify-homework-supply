import React, { useEffect } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {
  $createParagraphNode, $createTextNode, $getRoot, $setSelection,
  KEY_TAB_COMMAND, KEY_ENTER_COMMAND, type LexicalEditor,
} from "lexical";
import { HeadingNode } from "@lexical/rich-text";
import { AnswerNode } from "../AnswerPlugin";
import BlockSuggestionPlugin from "../BlockSuggestionPlugin";
import BlockSuggestionMenu from "../../components/BlockSuggestionMenu";
import { SuggestionProvider, useSuggestions } from "../../context/SuggestionContext";

vi.mock("../../../../context/unitContext", async () => {
  const { createContext } = await import("react");
  return { default: createContext({
    unit: { id: "unit-secret-id", name: "Plants" },
    dictionary: { "word-secret-id": { id: "word-secret-id", phrase: "sunlight", definition: "Light from the sun" } },
    questionBank: {}, files: {},
  }) };
});
vi.mock("../../../../context/sectionContext", async () => {
  const { createContext } = await import("react");
  return { default: createContext({ sections: [], assignments: [] }) };
});
vi.mock("next-intl", () => ({
  useTranslations: () => translate,
}));
const translate = (key: string) => key;
vi.mock("../../components/SuggestionBlockPreview", () => ({
  default: () => <span>Vocabulary block preview</span>,
}));

function Sidebar() {
  const { suggestions, insertSuggestion, rejectSuggestion, requestMoreSuggestions, isLoadingAI, error } = useSuggestions();
  return <aside aria-label="Block suggestions">
    <BlockSuggestionMenu
      suggestions={suggestions}
      onSelect={(index: number) => insertSuggestion(suggestions[index])}
      onReject={(index: number) => rejectSuggestion(suggestions[index])}
      onRequestMore={requestMoreSuggestions}
      isLoadingAI={isLoadingAI}
      error={error}
      useAI
    />
  </aside>;
}

function Capture({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => onReady(editor), [editor, onReady]);
  return null;
}

function setup(active = true) {
  let editor: LexicalEditor;
  const onReady = (value: LexicalEditor) => { editor = value; };
  const tree = (open: boolean) => (
    <LexicalComposer initialConfig={{
      namespace: "block-suggestions-test",
      nodes: [HeadingNode, AnswerNode],
      editorState: () => {
        $getRoot().append($createParagraphNode().append($createTextNode("Plants use sunlight")));
      },
      onError: (error) => { throw error; },
    }}>
      <SuggestionProvider active={open} useAI>
        <RichTextPlugin contentEditable={<ContentEditable />} placeholder={null} ErrorBoundary={LexicalErrorBoundary} />
        <BlockSuggestionPlugin useAI />
        <Sidebar />
        <Capture onReady={onReady} />
      </SuggestionProvider>
    </LexicalComposer>
  );
  const view = render(tree(active));
  return { editor: editor!, setOpen: (open: boolean) => view.rerender(tree(open)) };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("sidebar block suggestions", () => {
  it("runs only with the tab open, shows a preview, and accepts Markdown with resolved IDs after editor blur", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockImplementation(async () =>
      new Response("## Practice\n\nUse **sunlight**.\n\n:::answer[w1]"));
    vi.stubGlobal("fetch", fetch);
    const { editor, setOpen } = setup(false);
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(fetch).not.toHaveBeenCalled();
    setOpen(true);
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(fetch.mock.calls[0][1].body)).not.toContain("word-secret-id");
    expect(JSON.stringify(fetch.mock.calls[0][1].body)).not.toContain("unit-secret-id");
    expect(JSON.parse(fetch.mock.calls[0][1].body).context.resources.vocabulary[0].ref).toBe("w1");
    expect(screen.getByText("Vocabulary block preview")).toBeInTheDocument();
    expect(document.querySelector('[data-testid="block-suggestion-hint"]')).toBeNull();
    expect(editor.dispatchCommand(KEY_TAB_COMMAND, new KeyboardEvent("keydown"))).toBe(false);
    expect(editor.dispatchCommand(KEY_ENTER_COMMAND, new KeyboardEvent("keydown"))).toBe(false);
    await act(async () => editor.update(() => $setSelection(null), { discrete: true }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "blockSuggestionMenu.accept" })));
    const json = JSON.stringify(editor.getEditorState().toJSON());
    expect(json).toContain("word-secret-id");
    expect(json).not.toContain(":::answer");
    expect(json).not.toContain("**sunlight**");
    expect(editor.getEditorState().read(() => $getRoot().getTextContent())).toContain("Plants use sunlight");
    expect(editor.getEditorState().read(() => $getRoot().getChildren().map((node) => node.getType())))
      .toEqual(["paragraph", "heading", "paragraph", "answer"]);
    expect(screen.queryByRole("button", { name: "blockSuggestionMenu.accept" })).toBeNull();
  });

  it("rejects without editing and cancels pending requests on tab close", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockResolvedValueOnce(new Response("A **new** block."));
    vi.stubGlobal("fetch", fetch);
    const { editor, setOpen } = setup();
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    const before = editor.getEditorState().toJSON();
    fireEvent.click(screen.getByRole("button", { name: "blockSuggestionMenu.reject" }));
    expect(editor.getEditorState().toJSON()).toEqual(before);
    expect(screen.queryByRole("button", { name: "blockSuggestionMenu.accept" })).toBeNull();
    let resolve: (value: Response) => void = () => {};
    fetch.mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done; }));
    fireEvent.click(screen.getByRole("button", { name: "blockSuggestionMenu.generateMore" }));
    expect(fetch).toHaveBeenCalledTimes(2);
    setOpen(false);
    expect(fetch.mock.calls[1][1].signal.aborted).toBe(true);
    await act(async () => resolve(new Response("Stale suggestion")));
    expect(screen.queryByText("Stale suggestion")).toBeNull();
    expect(editor.getEditorState().toJSON()).toEqual(before);
  });

  it("reports invalid resource references without inserting a broken block", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(":::answer[w99]")));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { editor } = setup();
    const before = editor.getEditorState().toJSON();
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(screen.getByRole("alert")).toHaveTextContent("blockSuggestionMenu.error");
    expect(screen.queryByRole("button", { name: "blockSuggestionMenu.accept" })).toBeNull();
    expect(editor.getEditorState().toJSON()).toEqual(before);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
