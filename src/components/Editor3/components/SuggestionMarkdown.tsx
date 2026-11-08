/**
 * @fileoverview SuggestionMarkdown - Renders markdown inside transient editor suggestions
 * (ghost text and block previews) so users see what will be inserted on accept.
 *
 * Lines using the editor's custom block codes render as non-interactive previews
 * of the actual editor blocks when their reference context is available.
 */
import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import {
  mapUnfencedSuggestionLines,
  normalizeSuggestionBlockLines,
  type SuggestionReferenceCatalog,
} from "../plugins/suggestionReferences";

const SuggestionBlockPreview = React.lazy(() => import("./SuggestionBlockPreview"));

const components: Components = {
  a: ({ children }) => <span style={{ textDecoration: "underline" }}>{children}</span>,
  code: ({ children }) => (
    <code style={{ fontFamily: "monospace", fontSize: "0.9em" }}>{children}</code>
  ),
};

const BLOCK_LABEL_KEYS = {
  quiz: "quiz",
  answer: "answer",
  meaning: "meaning",
  "custom-answer": "customAnswer",
  "call-response": "callResponse",
  word: "word",
  playlist: "playlist",
  "conversation-playlist": "conversationPlaylist",
  pdf: "pdf",
  image: "image",
  file: "file",
  youtube: "youtube",
} as const;

type BlockType = keyof typeof BLOCK_LABEL_KEYS;

const BLOCK_LINE = new RegExp(
  `^[ \\t]*:::(${Object.keys(BLOCK_LABEL_KEYS).join("|")})\\[([^\\]\\r\\n]*)\\](?:\\{[^}\\r\\n]*\\})?[ \\t]*$`,
);
type Segment =
  | { kind: "markdown"; text: string }
  | { kind: "block"; type: BlockType; source: string };

export function splitSuggestionMarkdown(markdown: string): Segment[] {
  const segments: Segment[] = [];
  let pending: string[] = [];
  const normalized = normalizeSuggestionBlockLines(markdown);
  const matches = new Map<number, RegExpExecArray>();
  mapUnfencedSuggestionLines(normalized, (line, index) => {
    const match = BLOCK_LINE.exec(line);
    if (match) matches.set(index, match);
    return line;
  });
  const flush = () => {
    if (pending.some((line) => line.trim())) {
      segments.push({ kind: "markdown", text: pending.join("\n") });
    }
    pending = [];
  };
  for (const [index, line] of normalized.split(/\r?\n/).entries()) {
    const match = matches.get(index);
    if (!match) {
      pending.push(line);
      continue;
    }
    flush();
    segments.push({
      kind: "block",
      type: match[1] as BlockType,
      source: line,
    });
  }
  flush();
  return segments;
}

export interface SuggestionMarkdownProps {
  markdown: string;
  referenceContext?: Pick<
    SuggestionReferenceCatalog,
    "idByReference" | "fileById" | "questionById"
  >;
}

export default function SuggestionMarkdown({
  markdown,
  referenceContext,
}: SuggestionMarkdownProps) {
  const segments = React.useMemo(() => splitSuggestionMarkdown(markdown), [markdown]);

  // The first paragraph continues the line the suggestion is typed on, as it will on accept.
  return (
    <span className="ai-suggestion-markdown">
      {segments.map((segment, index) =>
        segment.kind === "markdown" ? (
          <span key={index} className="ai-suggestion-markdown__text">
            <ReactMarkdown components={components}>{segment.text}</ReactMarkdown>
          </span>
        ) : (
          <span
            key={index}
            className="ai-suggestion-markdown__block"
            data-block-type={segment.type}
          >
            {referenceContext ? (
              <React.Suspense fallback={<span aria-busy="true" />}>
                <SuggestionBlockPreview
                  key={segment.source}
                  markdown={segment.source}
                  referenceContext={referenceContext}
                />
              </React.Suspense>
            ) : (
              <code>{segment.source}</code>
            )}
          </span>
        ),
      )}
      <style>{`
        .ai-suggestion-markdown p { display: block; margin: 0.5em 0; }
        .ai-suggestion-markdown > .ai-suggestion-markdown__text:first-child > p:first-child { display: inline; margin: 0; }
        .ai-suggestion-markdown :is(h1, h2, h3, h4, h5, h6) { display: block; margin: 0.5em 0; font-weight: 700; }
        .ai-suggestion-markdown :is(ul, ol) { display: block; margin: 0.25em 0; padding-left: 1.5em; }
        .ai-suggestion-markdown blockquote { display: block; margin: 0.25em 0; padding-left: 1em; border-left: 3px solid currentColor; }
        .ai-suggestion-markdown pre { display: block; margin: 0.25em 0; white-space: pre-wrap; }
        .ai-suggestion-markdown__block { display: block; margin: 0.5em 0; font-style: normal; }
      `}</style>
    </span>
  );
}
