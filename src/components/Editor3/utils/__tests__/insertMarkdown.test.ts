import { describe, expect, it } from "vitest";
import {
  createEditor,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isParagraphNode,
} from "lexical";
import { HeadingNode, QuoteNode, $isHeadingNode } from "@lexical/rich-text";
import { ListNode, ListItemNode, $isListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { CodeNode } from "@lexical/code";
import { $replaceWithMarkdown } from "../insertMarkdown";
import {
  ANSWER_TRANSFORMER,
  CUSTOM_ANSWER_TRANSFORMER,
} from "../customMarkdownTransformers";
import { AnswerNode } from "../../plugins/AnswerPlugin";
import { QuizNode } from "../../plugins/QuizPlugin";
import { MeaningAssociationNode } from "../../plugins/MeaningAssociationPlugin";
import { CustomAnswerNode } from "../../plugins/CustomAnswerPlugin";
import { FileMetadataNode } from "../../nodes/FileMetadataNode";
import { WordBlockNode } from "../../plugins/WordBlockPlugin";
import { PlaylistNode } from "../../plugins/PlaylistPlugin";
import { YouTubeNode } from "../../plugins/YouTubePlugin";
import { PdfViewerNode } from "../../components/PdfViewerNode";
import { ImageNode } from "../../nodes/ImageNode";
import { ConversationPlaylistNode } from "../../plugins/ConversationPlaylistPlugin";
import { CallResponseNode } from "../../plugins/CallResponsePlugin";
import { resolveSuggestionReferences } from "../../plugins/suggestionReferences";

function setup(initial: string) {
  const editor = createEditor({
    namespace: "insert-markdown-test",
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      CodeNode,
      AnswerNode,
      QuizNode,
      MeaningAssociationNode,
      CustomAnswerNode,
      FileMetadataNode,
      WordBlockNode,
      PlaylistNode,
      YouTubeNode,
      PdfViewerNode,
      ImageNode,
      ConversationPlaylistNode,
      CallResponseNode,
    ],
    onError: (error) => {
      throw error;
    },
  });
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(initial));
      $getRoot().clear().append(paragraph);
    },
    { discrete: true },
  );
  return editor;
}

function insert(
  editor: ReturnType<typeof setup>,
  markdown: string,
  prefix = "",
) {
  editor.update(
    () => {
      const paragraph = $getRoot().getFirstChild();
      if (!$isParagraphNode(paragraph)) throw new Error("expected paragraph");
      const marker = $createTextNode("");
      paragraph.append(marker);
      $replaceWithMarkdown(marker, markdown, prefix);
    },
    { discrete: true },
  );
}

describe("$replaceWithMarkdown", () => {
  it("inserts list-wrapped word triggers as real word nodes", () => {
    const editor = setup("Definitions");
    const markdown = resolveSuggestionReferences(
      "- :::word{w1}\n- :::word{w2}",
      { w1: "word-1", w2: "word-2" },
    );
    insert(editor, markdown);
    editor.read(() => {
      const nodes = $getRoot().getChildren();
      expect(nodes.map((node) => node.getType())).toEqual([
        "paragraph",
        "word-block",
        "word-block",
      ]);
      expect(nodes[1].exportJSON()).toMatchObject({ wordID: "word-1" });
      expect(nodes[2].exportJSON()).toMatchObject({ wordID: "word-2" });
    });
  });
  it("renders inline formatting as formatted text nodes", () => {
    const editor = setup("Plants are");
    insert(editor, "**very** useful", " ");
    editor.read(() => {
      const paragraph = $getRoot().getFirstChild();
      expect($getRoot().getTextContent()).toBe("Plants are very useful");
      const formatted = (paragraph as any)
        .getChildren()
        .find((n: any) => n.hasFormat?.("bold"));
      expect(formatted?.getTextContent()).toBe("very");
    });
  });

  it("renders following blocks after the current paragraph", () => {
    const editor = setup("Intro");
    insert(editor, "# Title\n\n- one\n- two");
    editor.read(() => {
      const [first, heading, list] = $getRoot().getChildren();
      expect($isParagraphNode(first)).toBe(true);
      expect($isHeadingNode(heading)).toBe(true);
      expect($isListNode(list)).toBe(true);
      expect($getRoot().getTextContent()).not.toContain("#");
      expect($getRoot().getTextContent()).not.toContain("- ");
    });
  });

  it("drops the host paragraph when it ends up empty before a block", () => {
    const editor = setup("");
    insert(editor, "## Heading");
    editor.read(() => {
      expect($getRoot().getChildrenSize()).toBe(1);
      expect($isHeadingNode($getRoot().getFirstChild())).toBe(true);
    });
  });

  it("parses short block codes into real custom nodes and resolves file metadata", () => {
    const editor = setup("Intro");
    const file = {
      id: "file-1",
      name: "Plant cell diagram",
      path: "protected/identity/files/plant.png",
    };
    const markdown = resolveSuggestionReferences(
      [
        ":::quiz[q1]",
        "",
        ":::answer[w1]",
        "",
        ":::meaning[w1]",
        "",
        ":::custom-answer[q1]",
        "",
        ":::file[f1]",
      ].join("\n"),
      { q1: "question-1", w1: "word-1", f1: file.id },
    );

    editor.update(
      () => {
        const paragraph = $getRoot().getFirstChild();
        if (!$isParagraphNode(paragraph)) throw new Error("expected paragraph");
        const marker = $createTextNode("");
        paragraph.append(marker);
        $replaceWithMarkdown(marker, markdown, "", {
          fileById: { [file.id]: file },
        });
      },
      { discrete: true },
    );

    editor.read(() => {
      expect(
        $getRoot()
          .getChildren()
          .map((node) => node.getType()),
      ).toEqual([
        "paragraph",
        "quiz",
        "answer",
        "meaning-association",
        "custom-answer",
        "file-metadata",
      ]);
      const serialized = JSON.stringify(
        $getRoot()
          .getChildren()
          .map((node) => node.exportJSON()),
      );
      expect(serialized).toContain("question-1");
      expect(serialized).toContain("word-1");
      expect(serialized).toContain("file-1");
      expect(serialized).not.toContain(":::file");
    });
  });

  it("parses answer directions and prompt/input options while keeping defaults", () => {
    const editor = setup("Intro");
    insert(
      editor,
      [
        ":::answer[word-1]{direction=word-to-definition;prompt=text,audio;input=text,writing}",
        "",
        ":::answer[word-2]",
        "",
        ":::custom-answer[question-1]{direction=answer-to-question;prompt=text,audio;input=text,audio}",
        "",
        ":::custom-answer[question-2]",
        "",
        ":::answer[word-3]{direction=definition-to-word}",
        "",
        ":::custom-answer[question-3]{direction=question-to-answer}",
      ].join("\n"),
    );

    editor.read(() => {
      const [
        paragraph,
        wordAnswer,
        defaultAnswer,
        reverseCustom,
        defaultCustom,
        reverseAnswer,
        defaultDirectionCustom,
      ] = $getRoot().getChildren();
      expect($isParagraphNode(paragraph)).toBe(true);
      expect(wordAnswer?.exportJSON()).toMatchObject({
        type: "answer",
        requestDefinition: true,
        promptMethod: ["text", "audio"],
        allowedInput: ["text", "writing"],
      });
      expect(defaultAnswer?.exportJSON()).toMatchObject({
        type: "answer",
        requestDefinition: undefined,
        promptMethod: [],
        allowedInput: {},
      });
      expect(reverseCustom?.exportJSON()).toMatchObject({
        type: "custom-answer",
        direction: "answer-to-question",
        promptMethod: ["text", "audio"],
        allowedInput: ["text", "audio"],
      });
      expect(defaultCustom?.exportJSON()).toMatchObject({
        type: "custom-answer",
        direction: "question-to-answer",
        promptMethod: [],
        allowedInput: [],
      });
      expect(reverseAnswer?.exportJSON()).toMatchObject({
        type: "answer",
        requestDefinition: false,
      });
      expect(defaultDirectionCustom?.exportJSON()).toMatchObject({
        type: "custom-answer",
        direction: "question-to-answer",
      });
      expect(ANSWER_TRANSFORMER.export?.(wordAnswer!)).toBe(
        ":::answer[word-1]{direction=word-to-definition;prompt=text,audio;input=text,writing}",
      );
      expect(ANSWER_TRANSFORMER.export?.(defaultAnswer!)).toBe(
        ":::answer[word-2]",
      );
      expect(CUSTOM_ANSWER_TRANSFORMER.export?.(reverseCustom!)).toBe(
        ":::custom-answer[question-1]{direction=answer-to-question;prompt=text,audio;input=text,audio}",
      );
      expect(CUSTOM_ANSWER_TRANSFORMER.export?.(defaultCustom!)).toBe(
        ":::custom-answer[question-2]",
      );
      expect(ANSWER_TRANSFORMER.export?.(reverseAnswer!)).toBe(
        ":::answer[word-3]{direction=definition-to-word}",
      );
    });

    const serialized = JSON.stringify(editor.getEditorState().toJSON());
    const restoredEditor = createEditor({
      namespace: "answer-config-reload-test",
      nodes: [AnswerNode, CustomAnswerNode],
      onError: (error) => {
        throw error;
      },
    });
    restoredEditor.setEditorState(restoredEditor.parseEditorState(serialized));
    restoredEditor.read(() => {
      const restoredCustom = $getRoot().getChildren()[3];
      expect(restoredCustom?.exportJSON()).toMatchObject({
        direction: "answer-to-question",
        promptMethod: ["text", "audio"],
        allowedInput: ["text", "audio"],
      });
    });
  });

  it("leaves blocks with unsupported named options as visible Markdown", () => {
    const editor = setup("Intro");
    insert(editor, ":::answer[word-1]{direction=unknown;input=video}");
    editor.read(() => {
      expect($getRoot().getTextContent()).toContain(
        ":::answer[word-1]{direction=unknown;input=video}",
      );
    });
  });

  it("parses the additional native block types from indexed resources", () => {
    const editor = setup("Intro");
    const files = {
      "pdf-file": {
        id: "pdf-file",
        name: "Lesson handout",
        path: "public/handout.pdf",
        identityId: "identity-1",
        mimeType: "application/pdf",
      },
      "image-file": {
        id: "image-file",
        name: "Cell diagram",
        path: "public/cell.png",
        identityId: "identity-1",
        mimeType: "image/png",
      },
      "audio-file": {
        id: "audio-file",
        name: "Dialogue audio",
        path: "public/dialogue.mp3",
        identityId: "identity-1",
        mimeType: "audio/mpeg",
      },
      "video-file": {
        id: "video-file",
        name: "Lesson video",
        path: "public/lesson.mp4",
        identityId: "identity-1",
        mimeType: "video/mp4",
      },
    };
    const question = {
      id: "question-1",
      prompt: "What do plants produce?",
      answer: "Glucose",
    };
    const markdown = resolveSuggestionReferences(
      [
        ":::word[w1]",
        "",
        ":::playlist[f3,f4]",
        "",
        ":::pdf[f1]",
        "",
        ":::image[f2]",
        "",
        ":::youtube[dQw4w9WgXcQ]",
        "",
        ":::call-response[q1]",
        "",
        ":::conversation-playlist[f3]",
      ].join("\n"),
      {
        w1: "word-1",
        q1: question.id,
        f1: "pdf-file",
        f2: "image-file",
        f3: "audio-file",
        f4: "video-file",
      },
      files,
      { [question.id]: question },
    );

    editor.update(
      () => {
        const paragraph = $getRoot().getFirstChild();
        if (!$isParagraphNode(paragraph)) throw new Error("expected paragraph");
        const marker = $createTextNode("");
        paragraph.append(marker);
        $replaceWithMarkdown(marker, markdown, "", {
          fileById: files,
          questionById: { [question.id]: question },
        });
      },
      { discrete: true },
    );

    editor.read(() => {
      expect(
        $getRoot()
          .getChildren()
          .map((node) => node.getType()),
      ).toEqual([
        "paragraph",
        "word-block",
        "playlist",
        "pdf-viewer",
        "image",
        "youtube",
        "call-response",
        "conversation-playlist",
      ]);
    });
  });
});
