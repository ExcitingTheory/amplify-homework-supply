/**
 * Helpers for turning markdown produced by autocomplete/suggestions into real
 * Lexical nodes instead of inserting the raw markdown source as plain text.
 */
import {
  $convertFromMarkdownString,
  TRANSFORMERS,
  type Transformer,
} from "@lexical/markdown";
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
  $setSelection,
  type LexicalNode,
} from "lexical";
import {
  CUSTOM_BLOCK_TRANSFORMERS,
  createCallResponseTransformer,
  createConversationPlaylistTransformer,
  createFileMetadataTransformer,
  createImageTransformer,
  createPdfViewerTransformer,
} from "./customMarkdownTransformers";
import type { SuggestionReferenceMap } from "../plugins/suggestionReferences";

interface MarkdownInsertOptions {
  fileById?: Record<string, Record<string, unknown>>;
  questionById?: Record<string, Record<string, unknown>>;
}

function getTransformers(options: MarkdownInsertOptions = {}): Transformer[] {
  const fileTransformer = options.fileById
    ? [
        createFileMetadataTransformer(options.fileById),
        createPdfViewerTransformer(options.fileById),
        createImageTransformer(options.fileById),
        createConversationPlaylistTransformer(options.fileById),
      ]
    : [];
  const callResponseTransformer = options.questionById
    ? [createCallResponseTransformer(options.questionById)]
    : [];
  return [
    ...TRANSFORMERS,
    ...CUSTOM_BLOCK_TRANSFORMERS,
    ...fileTransformer,
    ...callResponseTransformer,
  ];
}

/**
 * Parses markdown into detached top-level nodes. Must run inside an editor update.
 * The conversion targets a detached container so the live document is untouched,
 * and the selection is cleared meanwhile because the importer re-selects the container.
 */
export function $parseMarkdownToNodes(
  markdown: string,
  options: MarkdownInsertOptions = {},
): LexicalNode[] {
  const container = $createParagraphNode();
  const previousSelection = $getSelection();
  $setSelection(null);
  try {
    $convertFromMarkdownString(markdown, getTransformers(options), container);
  } finally {
    $setSelection(previousSelection);
  }
  return container.getChildren();
}

/**
 * Replaces `placeholder` (an inline node inside a top-level block) with the
 * rendered markdown. A leading paragraph continues the current block inline;
 * all other blocks (headings, lists, further paragraphs...) follow the block.
 * The selection ends after the inserted content.
 */
export function $replaceWithMarkdown(
  placeholder: LexicalNode,
  markdown: string,
  prefix = "",
  options: MarkdownInsertOptions = {},
): void {
  const blocks = $parseMarkdownToNodes(markdown, options);
  const host = placeholder.getTopLevelElementOrThrow();

  if (blocks.length === 0) {
    const fallback = $createTextNode(prefix + markdown);
    placeholder.replace(fallback);
    fallback.selectEnd();
    return;
  }

  const [first, ...rest] = blocks;
  let lastInline: LexicalNode | null = null;

  if ($isParagraphNode(first)) {
    const inline = first.getChildren();
    if (prefix) {
      inline.unshift($createTextNode(prefix));
    }
    let cursor: LexicalNode = placeholder;
    for (const child of inline) {
      cursor.insertAfter(child);
      cursor = child;
    }
    lastInline = inline.length > 0 ? cursor : null;
    placeholder.remove();
  } else {
    placeholder.remove();
    rest.unshift(first);
  }

  let cursor: LexicalNode = host;
  for (const block of rest) {
    cursor.insertAfter(block);
    cursor = block;
  }

  if (!$isParagraphNode(first) && $isElementNode(host) && host.isEmpty()) {
    host.remove();
  }

  if (rest.length > 0) {
    const last = rest[rest.length - 1];
    if ($isElementNode(last)) {
      last.selectEnd();
      return;
    }
  }
  if (lastInline !== null) {
    if ($isTextNode(lastInline)) {
      lastInline.selectEnd();
    } else {
      lastInline.selectNext();
    }
  }
}
