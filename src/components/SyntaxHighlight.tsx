/**
 * SyntaxHighlight — lightweight themeable code highlighting for non-editor
 * surfaces (Storybook docs, chat tool output, content previews).
 *
 * Uses Prism.js (already a Lexical editor dependency) and renders the exact
 * same `LanguageEditorTheme__token*` classnames the Lexical editor's
 * CodeHighlightPlugin produces, so colors always match the user's selected
 * theme (see src/themes/semanticTheme.ts `editor.lexicalTheme.codeHighlight`
 * and src/components/Editor3/components/LanguageEditorTheme.css) without a
 * second theme to maintain.
 */
import * as React from "react";
import Box from "@mui/material/Box";
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markdown";
import { SEMANTIC_THEME } from "../themes/semanticTheme";

export type SyntaxLanguage =
  | "bash"
  | "json"
  | "typescript"
  | "javascript"
  | "jsx"
  | "tsx"
  | "css"
  | "markdown"
  | "text";

const TOKEN_CLASS_MAP = SEMANTIC_THEME.editor.lexicalTheme
  .codeHighlight as Record<string, string>;

function renderTokens(tokens: (string | Prism.Token)[]): React.ReactNode[] {
  return tokens.map((token, i) => {
    if (typeof token === "string") return token;

    const className = TOKEN_CLASS_MAP[token.type];
    const content = Array.isArray(token.content)
      ? renderTokens(token.content)
      : typeof token.content === "string"
        ? token.content
        : renderTokens([token.content as unknown as Prism.Token]);

    return (
      <span key={i} className={className}>
        {content}
      </span>
    );
  });
}

export interface SyntaxHighlightProps {
  code: string;
  language?: SyntaxLanguage;
  showLineNumbers?: boolean;
  maxWidthCh?: number;
}

/** Renders `code` with Prism tokenization, matching the Lexical editor's code-block theme. */
export function SyntaxHighlight({
  code,
  language = "text",
  showLineNumbers = false,
  maxWidthCh,
}: SyntaxHighlightProps) {
  const grammar = language !== "text" ? Prism.languages[language] : undefined;
  const tokens = grammar ? Prism.tokenize(code, grammar) : [code];
  const lines = code.split("\n");

  return (
    <Box
      component="pre"
      className="LanguageEditorTheme__code"
      sx={{
        m: 0,
        fontFamily: SEMANTIC_THEME.typography.codeFontFamily,
        fontSize: 13,
        lineHeight: 1.6,
        overflowX: "auto",
        whiteSpace: "pre",
        ...(maxWidthCh ? { maxWidth: `${maxWidthCh}ch` } : {}),
        ...(showLineNumbers
          ? {
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              columnGap: "1.5em",
            }
          : {}),
      }}
    >
      {showLineNumbers ? (
        <>
          <Box
            component="span"
            sx={{
              color: "text.disabled",
              userSelect: "none",
              textAlign: "right",
            }}
          >
            {lines.map((_, i) => (
              <React.Fragment key={i}>
                {i + 1}
                {"\n"}
              </React.Fragment>
            ))}
          </Box>
          <Box component="code">{renderTokens(tokens)}</Box>
        </>
      ) : (
        <Box component="code">{renderTokens(tokens)}</Box>
      )}
    </Box>
  );
}

export default SyntaxHighlight;
