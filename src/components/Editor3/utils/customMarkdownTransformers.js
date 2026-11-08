/**
 * Markdown shortcuts for Homework Supply's interactive editor blocks.
 *
 * Human-readable codes:
 *   :::quiz[question-id,...]
 *   :::answer[word-id,...]
 *   :::meaning[word-id,...]
 *   :::custom-answer[question-id,...]
 *   :::word[word-id]
 *   :::playlist[file-id,...]
 *   :::pdf[file-id]
 *   :::image[file-id]
 *   :::youtube[video-id]
 *   :::call-response[question-id,...]
 *   :::conversation-playlist[file-id,...]
 *
 * AI completions use indexed references (q1/w1/f1); the completion plugin
 * resolves those to IDs locally before passing the Markdown to these parsers.
 */

import { $createQuizNode, QuizNode } from "../plugins/QuizPlugin";
import { $createAnswerNode, AnswerNode } from "../plugins/AnswerPlugin";
import {
  $createMeaningAssociationNode,
  MeaningAssociationNode,
} from "../plugins/MeaningAssociationPlugin";
import {
  $createCustomAnswerNode,
  CustomAnswerNode,
} from "../plugins/CustomAnswerPlugin";
import {
  $createFileMetadataNode,
  FileMetadataNode,
} from "../nodes/FileMetadataNode";
import {
  $createWordBlockNode,
  WordBlockNode,
} from "../plugins/WordBlockPlugin";
import { $createPlaylistNode, PlaylistNode } from "../plugins/PlaylistPlugin";
import { $createYouTubeNode, YouTubeNode } from "../plugins/YouTubePlugin";
import {
  $createPdfViewerNode,
  PdfViewerNode,
} from "../components/PdfViewerNode";
import { $createImageNode, ImageNode } from "../nodes/ImageNode";
import {
  $createConversationPlaylistNode,
  ConversationPlaylistNode,
} from "../plugins/ConversationPlaylistPlugin";
import {
  $createCallResponseNode,
  CallResponseNode,
  createEmptyCallResponseScript,
} from "../plugins/CallResponsePlugin";
import { appendQuestionCues } from "../../../utils/callResponse/authoring";
import { $createParagraphNode, $createTextNode } from "lexical";

function parseIds(value) {
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

const ANSWER_PROMPT_METHODS = ["text", "audio"];
const CUSTOM_ANSWER_PROMPT_METHODS = [
  "text",
  "audio",
  "phrase",
  "definition",
  "pronunciation",
];
const ANSWER_INPUT_METHODS = ["text", "audio", "writing"];

function parseBlockOptions(value, directions, promptMethods) {
  if (!value) return {};

  const options = {};
  for (const option of value.split(";")) {
    const [rawName, ...rawValues] = option.split("=");
    const name = rawName.trim();
    const optionValue = rawValues.join("=").trim();
    if (!optionValue || !["direction", "prompt", "input"].includes(name)) {
      return null;
    }
    if (Object.hasOwn(options, name)) return null;

    if (name === "direction") {
      if (!directions.includes(optionValue)) return null;
      options.direction = optionValue;
      continue;
    }

    const allowedMethods =
      name === "input" ? ANSWER_INPUT_METHODS : promptMethods;
    const methods = optionValue
      .split(",")
      .map((method) => method.trim())
      .filter(Boolean);
    if (
      methods.length === 0 ||
      methods.some((method) => !allowedMethods.includes(method))
    ) {
      return null;
    }
    options[name] = [...new Set(methods)];
  }

  return options;
}

function formatBlockOptions(options) {
  const entries = [];
  if (options.direction) entries.push(`direction=${options.direction}`);
  if (options.prompt?.length) entries.push(`prompt=${options.prompt.join(",")}`);
  if (options.input?.length) entries.push(`input=${options.input.join(",")}`);
  return entries.length > 0 ? `{${entries.join(";")}}` : "";
}

function filterMethods(methods, supportedMethods) {
  return Array.isArray(methods)
    ? methods.filter((method) => supportedMethods.includes(method))
    : undefined;
}

/** @returns {import("@lexical/markdown").ElementTransformer} */
function createBlockTransformer({
  dependencies,
  regExp,
  createNode,
  exportMarkdown,
}) {
  return {
    dependencies: [dependencies],
    export: (node) =>
      node.getType() === dependencies.getType() ? exportMarkdown(node) : null,
    regExp,
    replace: (parentNode, _children, match) => {
      const ids = parseIds(match[1]);
      if (ids.length === 0) return false;
      const node = createNode(ids, match);
      if (!node) {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(match[0]));
        parentNode.replace(paragraph);
        return true;
      }
      parentNode.replace(node);
      return true;
    },
    type: "element",
  };
}

export const QUIZ_TRANSFORMER = createBlockTransformer({
  dependencies: QuizNode,
  regExp: /^:::quiz\[([^\]]+)\]$/,
  createNode: (ids) => $createQuizNode(ids),
  exportMarkdown: (node) => `:::quiz[${node.getData().join(",")}]`,
});

export const ANSWER_TRANSFORMER = createBlockTransformer({
  dependencies: AnswerNode,
  regExp: /^:::answer\[([^\]]+)\](?:\{([^}]*)\})?$/,
  createNode: (ids, match) => {
    const options = parseBlockOptions(
      match[2],
      ["word-to-definition", "definition-to-word"],
      ANSWER_PROMPT_METHODS,
    );
    if (!options) return null;
    return $createAnswerNode(
      ids,
      options.direction === undefined
        ? undefined
        : options.direction === "word-to-definition",
      options.input,
      options.prompt,
    );
  },
  exportMarkdown: (node) => {
    const data = node.exportJSON();
    const options = {
      direction:
        typeof data.requestDefinition === "boolean"
          ? data.requestDefinition
            ? "word-to-definition"
            : "definition-to-word"
          : undefined,
      prompt: filterMethods(data.promptMethod, ANSWER_PROMPT_METHODS),
      input: filterMethods(data.allowedInput, ANSWER_INPUT_METHODS),
    };
    return `:::answer[${node.getIds().join(",")}]${formatBlockOptions(options)}`;
  },
});

export const MEANING_ASSOCIATION_TRANSFORMER = createBlockTransformer({
  dependencies: MeaningAssociationNode,
  regExp: /^:::meaning\[([^\]]+)\]$/,
  createNode: (ids) => $createMeaningAssociationNode(ids),
  exportMarkdown: (node) => `:::meaning[${node.getIds().join(",")}]`,
});

export const CUSTOM_ANSWER_TRANSFORMER = createBlockTransformer({
  dependencies: CustomAnswerNode,
  regExp: /^:::custom-answer\[([^\]]+)\](?:\{([^}]*)\})?$/,
  createNode: (ids, match) => {
    const options = parseBlockOptions(
      match[2],
      ["question-to-answer", "answer-to-question"],
      CUSTOM_ANSWER_PROMPT_METHODS,
    );
    if (!options) return null;
    return $createCustomAnswerNode(
      ids,
      options.input,
      options.prompt,
      undefined,
      options.direction,
    );
  },
  exportMarkdown: (node) => {
    const data = node.exportJSON();
    const options = {
      direction:
        data.direction && data.direction !== "question-to-answer"
          ? data.direction
          : undefined,
      prompt: data.promptMethod,
      input: data.allowedInput,
    };
    return `:::custom-answer[${node.getIds().join(",")}]${formatBlockOptions(options)}`;
  },
});

export const WORD_BLOCK_TRANSFORMER = createBlockTransformer({
  dependencies: WordBlockNode,
  regExp: /^:::word\[([^\],]+)\]$/,
  createNode: ([id]) => $createWordBlockNode(id),
  exportMarkdown: (node) => `:::word[${node.getId()}]`,
});

export const PLAYLIST_TRANSFORMER = createBlockTransformer({
  dependencies: PlaylistNode,
  regExp: /^:::playlist\[([^\]]+)\]$/,
  createNode: (ids) => $createPlaylistNode(ids),
  exportMarkdown: (node) => `:::playlist[${node.getIds().join(",")}]`,
});

/** @type {import("@lexical/markdown").ElementTransformer} */
export const YOUTUBE_TRANSFORMER = {
  dependencies: [YouTubeNode],
  export: (node) =>
    node.getType() === YouTubeNode.getType()
      ? `:::youtube[${node.getId()}]`
      : null,
  regExp: /^:::youtube\[([a-zA-Z0-9_-]{11})\]$/,
  replace: (parentNode, _children, match) => {
    parentNode.replace($createYouTubeNode(match[1]));
    return true;
  },
  type: "element",
};

/**
 * Creates a media-specific file transformer bound to the completion snapshot.
 * @returns {import("@lexical/markdown").ElementTransformer}
 */
function createFileNodeTransformer({ type, filesById, createNode, accepts }) {
  return {
    dependencies: [type === "pdf" ? PdfViewerNode : ImageNode],
    export: (node) => {
      if (node.getType() !== (type === "pdf" ? "pdf-viewer" : "image")) {
        return null;
      }
      const file =
        type === "pdf"
          ? Object.values(filesById).find(
              (candidate) => candidate.path === node.getPath(),
            )
          : filesById[node.getFileId()];
      return file?.id ? `:::${type}[${file.id}]` : null;
    },
    regExp: new RegExp(`^:::${type}\\[([^\\]]+)\\]$`),
    replace: (parentNode, _children, match) => {
      const file = filesById[match[1].trim()];
      if (!file || !accepts(file)) return false;
      parentNode.replace(createNode(file));
      return true;
    },
    type: "element",
  };
}

/**
 * Creates a call-response block from questions available to this completion.
 * @returns {import("@lexical/markdown").ElementTransformer}
 */
export function createCallResponseTransformer(questionsById = {}) {
  return {
    dependencies: [CallResponseNode],
    export: (node) => {
      if (node.getType() !== CallResponseNode.getType()) return null;
      const { script } = node.exportJSON();
      const prefix = `${script.cardKey}-q-`;
      const questionIds = [
        ...new Set(
          script.cues
            .filter(
              (cue) =>
                cue.kind === "prompt" &&
                cue.id.startsWith(prefix) &&
                cue.id.endsWith("-prompt"),
            )
            .map((cue) => cue.id.slice(prefix.length, -"-prompt".length)),
        ),
      ];
      return questionIds.length > 0
        ? `:::call-response[${questionIds.join(",")}]`
        : null;
    },
    regExp: /^:::call-response\[([^\]]+)\]$/,
    replace: (parentNode, _children, match) => {
      const ids = parseIds(match[1]);
      const questions = ids.map((id) => questionsById[id]).filter(Boolean);
      if (questions.length !== ids.length) {
        throw new Error(
          "Call-response block references an unavailable question",
        );
      }
      const script = appendQuestionCues(
        createEmptyCallResponseScript(),
        questions,
      );
      if (script.cues.length === 0) {
        throw new Error(
          "Call-response block requires questions with prompts and answers",
        );
      }
      parentNode.replace($createCallResponseNode(script));
      return true;
    },
    type: "element",
  };
}

/**
 * Creates a conversation playlist from files available to this completion.
 * @returns {import("@lexical/markdown").ElementTransformer}
 */
export function createConversationPlaylistTransformer(filesById = {}) {
  return {
    dependencies: [ConversationPlaylistNode],
    export: (node) => {
      if (node.getType() !== ConversationPlaylistNode.getType()) return null;
      const { fileIDs = [] } = node.exportJSON();
      return fileIDs.length > 0
        ? `:::conversation-playlist[${fileIDs.join(",")}]`
        : null;
    },
    regExp: /^:::conversation-playlist\[([^\]]+)\]$/,
    replace: (parentNode, _children, match) => {
      const ids = parseIds(match[1]);
      const files = ids.map((id) => filesById[id]).filter(Boolean);
      if (files.length !== ids.length) return false;
      const title = files[0]?.name ?? "Conversation playlist";
      parentNode.replace($createConversationPlaylistNode(ids, [], title, null));
      return true;
    },
    type: "element",
  };
}

/**
 * Creates a file transformer bound to the exact file set used for a completion.
 * The Markdown parser can only insert a file that was in that context snapshot.
 */
/** @returns {import("@lexical/markdown").ElementTransformer} */
export function createFileMetadataTransformer(filesById) {
  return {
    dependencies: [FileMetadataNode],
    export: (node) => {
      if (node.getType() !== FileMetadataNode.getType()) return null;
      const id = node.getFile()?.id;
      return id ? `:::file[${id}]` : null;
    },
    regExp: /^:::file\[([^\]]+)\]$/,
    replace: (parentNode, _children, match) => {
      const file = filesById[match[1].trim()];
      if (!file) return false;
      parentNode.replace($createFileMetadataNode(file, null));
      return true;
    },
    type: "element",
  };
}

export function createPdfViewerTransformer(filesById) {
  return createFileNodeTransformer({
    type: "pdf",
    filesById,
    accepts: (file) =>
      file.mimeType === "application/pdf" &&
      typeof file.path === "string" &&
      typeof file.identityId === "string",
    createNode: (file) =>
      $createPdfViewerNode({
        path: file.path,
        identityId: file.identityId,
        filename: file.name,
      }),
  });
}

export function createImageTransformer(filesById) {
  return createFileNodeTransformer({
    type: "image",
    filesById,
    accepts: (file) =>
      typeof file.mimeType === "string" &&
      file.mimeType.startsWith("image/") &&
      typeof file.path === "string" &&
      typeof file.identityId === "string",
    createNode: (file) =>
      $createImageNode({
        path: file.path,
        identityId: file.identityId,
        fileId: file.id,
        altText: file.name,
      }),
  });
}

/** @type {import("@lexical/markdown").ElementTransformer} */
export const CODE_BLOCK_QUIZ_TRANSFORMER = {
  dependencies: [QuizNode],
  export: (node) =>
    node.getType() === QuizNode.getType()
      ? `\`\`\`quiz\n${JSON.stringify({ questions: node.getData() }, null, 2)}\n\`\`\``
      : null,
  regExp: /^```quiz\s*\n([\s\S]+?)\n```$/,
  replace: (parentNode, _children, match) => {
    try {
      const parsed = JSON.parse(match[1]);
      parentNode.replace($createQuizNode(parsed.questions || []));
      return true;
    } catch (error) {
      console.error("[CODE_BLOCK_QUIZ_TRANSFORMER] Invalid JSON:", error);
      return false;
    }
  },
  type: "element",
};

export const CUSTOM_BLOCK_TRANSFORMERS = [
  QUIZ_TRANSFORMER,
  ANSWER_TRANSFORMER,
  MEANING_ASSOCIATION_TRANSFORMER,
  CUSTOM_ANSWER_TRANSFORMER,
  WORD_BLOCK_TRANSFORMER,
  PLAYLIST_TRANSFORMER,
  YOUTUBE_TRANSFORMER,
  CODE_BLOCK_QUIZ_TRANSFORMER,
];
