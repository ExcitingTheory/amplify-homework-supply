import React, { useEffect } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {
  createEditor,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isParagraphNode,
  KEY_TAB_COMMAND,
  type LexicalEditor,
} from "lexical";
import { HeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { AnswerNode } from "../AnswerPlugin";
import { QuizNode } from "../QuizPlugin";
import AIContentCompletionPlugin from "../AIContentCompletionPlugin";
import UnitContext from "../../../../context/unitContext";
import SettingsContext from "../../../../context/settingsContext";
import DictionaryContext from "../../../../context/dictionaryContext";
import {
  AIContentSuggestionNode,
  AILoadingNode,
} from "../../components/AIContentSuggestionNode";

vi.mock("../../../../context/unitContext", async () => {
  const { createContext } = await import("react");
  return {
    default: createContext({
      unit: null,
      dictionary: {},
      questionBank: {},
      files: {},
    }),
  };
});
vi.mock("../../../../context/sectionContext", async () => {
  const { createContext } = await import("react");
  return { default: createContext({ sections: [], assignments: [] }) };
});
vi.mock("../../../../context/settingsContext", async () => {
  const { createContext } = await import("react");
  return { default: createContext({}) };
});
vi.mock("../../../../context/dictionaryContext", async () => {
  const { createContext } = await import("react");
  return { default: createContext({ wordMapId: {} }) };
});
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function CaptureEditor({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => onReady(editor), [editor, onReady]);
  return null;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("AI ghost-text completion", () => {
  it("renders custom block previews when replacing loading and updating streamed ghost text", async () => {
    const word = { id: "word-1", phrase: "Chloroplast", definition: "A cell organelle" };
    let streamController: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { streamController = controller; },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream)));
    let editor: LexicalEditor | undefined;
    const { container } = render(
      <DictionaryContext.Provider value={{ wordMapId: { [word.id]: word } }}>
        <UnitContext.Provider value={{
          unit: { id: "unit-1" },
          dictionary: { [word.id]: word },
          questionBank: {},
          files: {},
        }}>
          <LexicalComposer initialConfig={{
            namespace: "completion-preview-test",
            nodes: [AIContentSuggestionNode, AILoadingNode, HeadingNode],
            onError: (error) => { throw error; },
          }}>
            <RichTextPlugin contentEditable={<ContentEditable />} placeholder={null} ErrorBoundary={LexicalErrorBoundary} />
            <AIContentCompletionPlugin />
            <CaptureEditor onReady={(value) => { editor = value; }} />
          </LexicalComposer>
        </UnitContext.Provider>
      </DictionaryContext.Provider>,
    );
    await act(async () => editor!.update(() => {
      const paragraph = $createParagraphNode().append($createTextNode("Plants use sunlight"));
      $getRoot().clear().append(paragraph);
      paragraph.selectEnd();
    }, { discrete: true }));
    await screen.findByText("aiContentSuggestion.generating");
    await act(async () => {
      streamController!.enqueue(new TextEncoder().encode("\n\n:::word[w1]\n"));
    });
    await waitFor(() => expect(
      container.querySelector('[data-block-type="word"] .MuiCard-root'),
    ).toBeInTheDocument(), { timeout: 20000 });
    expect(screen.getByText("Chloroplast")).toBeInTheDocument();
    await act(async () => {
      streamController!.enqueue(new TextEncoder().encode("\nReview **this word**."));
      streamController!.close();
    });
    await waitFor(() => expect(screen.getByText("this word").tagName).toBe("STRONG"));
    expect(container.querySelector('[data-block-type="word"] [inert]')).toBeInTheDocument();
    expect(container.textContent).not.toContain(":::word");
    expect(screen.getByText("Chloroplast")).toBeInTheDocument();
  });

  it("does not request completions when disabled and aborts in-flight work when disabled", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockImplementation((_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")));
      }));
    vi.stubGlobal("fetch", fetch);
    let editor: LexicalEditor | undefined;
    const onReady = (value: LexicalEditor) => { editor = value; };
    const tree = (enabled: boolean) => (
      <SettingsContext.Provider value={{
        settings: { metadata: JSON.stringify({ aiAutocompleteEnabled: enabled }) },
      }}>
        <LexicalComposer initialConfig={{
          namespace: "completion-setting-test",
          nodes: [AIContentSuggestionNode, AILoadingNode, HeadingNode],
          onError: (error) => { throw error; },
        }}>
          <RichTextPlugin contentEditable={<ContentEditable />} placeholder={null} ErrorBoundary={LexicalErrorBoundary} />
          <AIContentCompletionPlugin />
          <CaptureEditor onReady={onReady} />
        </LexicalComposer>
      </SettingsContext.Provider>
    );
    const view = render(tree(false));
    const type = async (text: string) => {
      await act(async () => editor!.update(() => {
        const paragraph = $createParagraphNode().append($createTextNode(text));
        $getRoot().clear().append(paragraph);
        paragraph.selectEnd();
      }, { discrete: true }));
      await act(async () => vi.advanceTimersByTimeAsync(1000));
    };
    await type("Plants use sunlight");
    expect(fetch).not.toHaveBeenCalled();
    view.rerender(tree(true));
    await type("Plants use sunlight again");
    expect(fetch).toHaveBeenCalledTimes(1);
    view.rerender(tree(false));
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    await type("Plants use even more sunlight");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("aiContentSuggestion.generating")).not.toBeInTheDocument();
  });

  it("converts Markdown to Lexical nodes before saving an accepted completion", async () => {
    const completion =
      "to produce **glucose**. 光合成\n\n## Light reactions\n\n:::answer[w1]\n\n:::quiz[q1]";
    const bytes = new TextEncoder().encode(completion);
    let finishStream: () => void = () => {};
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, -2));
        finishStream = () => {
          controller.enqueue(bytes.slice(-2));
          controller.close();
        };
      },
    });
    const fetch = vi.fn().mockResolvedValue(new Response(stream));
    vi.stubGlobal("fetch", fetch);
    let editor: LexicalEditor | undefined;
    const wordId = "word-secret-uuid";
    const questionId = "question-secret-uuid";
    render(
      <UnitContext.Provider
        value={{
          unit: { name: "Photosynthesis", description: "Plant biology" },
          dictionary: {
            [wordId]: {
              id: wordId,
              phrase: "photosynthesis",
              definition: "The process plants use to make food",
            },
          },
          questionBank: {
            [questionId]: {
              id: questionId,
              prompt: "What does photosynthesis produce?",
              answer: "Glucose",
            },
          },
          files: {},
        }}
      >
        <LexicalComposer initialConfig={{
          namespace: "completion-test",
          nodes: [
            AIContentSuggestionNode,
            AILoadingNode,
            HeadingNode,
            AnswerNode,
            QuizNode,
          ],
          onError: (error) => { throw error; },
        }}>
          <RichTextPlugin
            contentEditable={<ContentEditable />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <AIContentCompletionPlugin />
          <CaptureEditor onReady={(value) => { editor = value; }} />
        </LexicalComposer>
      </UnitContext.Provider>,
    );
    const activeEditor = editor!;
    await act(async () => {
      activeEditor.update(() => {
        $getRoot().clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode("Plants use sunlight"));
        $getRoot().append(paragraph);
        paragraph.selectEnd();
      }, { discrete: true });
    });
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      "/api/content-completion", expect.objectContaining({ method: "POST" }),
    ), { timeout: 3000 });
    await screen.findByText("aiContentSuggestion.tabToAcceptHint");
    await act(async () => finishStream());
    const requestContext = JSON.parse(fetch.mock.calls[0][1].body).context;
    expect(JSON.stringify(requestContext)).not.toContain(wordId);
    expect(JSON.stringify(requestContext)).not.toContain(questionId);
    expect(requestContext.resources.vocabulary[0].ref).toBe("w1");
    expect(requestContext.resources.questions[0].ref).toBe("q1");
    await act(async () => {
      activeEditor.dispatchCommand(KEY_TAB_COMMAND, new KeyboardEvent("keydown", {
        key: "Tab", cancelable: true,
      }));
    });
    await waitFor(() => expect(
      screen.queryByText("aiContentSuggestion.tabToAcceptHint"),
    ).not.toBeInTheDocument());

    const serialized = JSON.stringify(activeEditor.getEditorState().toJSON());
    expect(serialized).not.toContain(":::answer");
    expect(serialized).not.toContain(":::quiz");
    expect(serialized).toContain(wordId);
    expect(serialized).toContain(questionId);

    const restoredEditor = createEditor({
      namespace: "completion-reload-test",
      nodes: [HeadingNode, AnswerNode, QuizNode],
      onError: (error) => { throw error; },
    });
    restoredEditor.setEditorState(restoredEditor.parseEditorState(serialized));

    restoredEditor.getEditorState().read(() => {
      const [paragraph, heading, answer, quiz] = $getRoot().getChildren();
      expect($isParagraphNode(paragraph)).toBe(true);
      expect($isHeadingNode(heading)).toBe(true);
      expect(answer?.getType()).toBe("answer");
      expect(quiz?.getType()).toBe("quiz");
      const restoredContent = JSON.stringify(
        $getRoot().getChildren().map((node) => node.exportJSON()),
      );
      expect(restoredContent).toContain(wordId);
      expect(restoredContent).toContain(questionId);
      expect(
        $isParagraphNode(paragraph)
          ? paragraph
              .getAllTextNodes()
              .filter((node) => node.hasFormat("bold"))
              .map((node) => node.getTextContent())
          : [],
      ).toContain("glucose");
      expect($getRoot().getTextContent()).toContain("Light reactions");
    });
  });
});
