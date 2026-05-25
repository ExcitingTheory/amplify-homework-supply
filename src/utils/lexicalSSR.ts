/**
 * Server-safe Lexical JSON → HTML renderer.
 *
 * Parses the Lexical editor state JSON tree directly and converts it to HTML
 * WITHOUT importing any Lexical packages or custom node files.
 *
 * This avoids the server/client module boundary issue where custom Lexical nodes
 * transitively import React hooks, createContext, styled-jsx, etc.
 *
 * Handles standard content nodes (paragraphs, headings, lists, tables, links,
 * formatted text, code blocks, images) and renders placeholders for interactive
 * custom nodes (quizzes, answer blocks, etc.) that can only function client-side.
 *
 * Pattern inspired by: https://github.com/2wheeh/lexical-nextjs-ssr
 */

// ============================================================================
// Types (minimal, matching Lexical's serialized JSON format)
// ============================================================================

interface LexicalNode {
  type: string;
  children?: LexicalNode[];
  text?: string;
  format?: number | string;
  tag?: string;
  url?: string;
  src?: string;
  altText?: string;
  width?: number;
  height?: number;
  direction?: string | null;
  indent?: number;
  listType?: string;
  start?: number;
  value?: number;
  language?: string;
  title?: string;
  rel?: string;
  target?: string;
  // Custom node fields
  videoID?: string;
  word?: string;
  questionText?: string;
  [key: string]: unknown;
}

interface LexicalEditorState {
  root: LexicalNode;
}

// ============================================================================
// Text format bit flags (matches Lexical's TextFormatType)
// ============================================================================

const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;
const IS_SUBSCRIPT = 1 << 5;
const IS_SUPERSCRIPT = 1 << 6;
const IS_HIGHLIGHT = 1 << 7;

// ============================================================================
// Element format (text alignment)
// ============================================================================

function getTextAlign(format: number | string | undefined): string {
  if (!format) return "";
  const numFormat = typeof format === "string" ? parseInt(format, 10) : format;
  switch (numFormat) {
    case 1:
      return "text-align: left;";
    case 2:
      return "text-align: center;";
    case 3:
      return "text-align: right;";
    case 4:
      return "text-align: justify;";
    default:
      return "";
  }
}

// ============================================================================
// HTML escaping
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================================
// Text formatting
// ============================================================================

function wrapTextWithFormat(text: string, format: number): string {
  if (!format) return text;

  let result = text;
  if (format & IS_CODE) result = `<code>${result}</code>`;
  if (format & IS_BOLD) result = `<strong>${result}</strong>`;
  if (format & IS_ITALIC) result = `<em>${result}</em>`;
  if (format & IS_UNDERLINE) result = `<u>${result}</u>`;
  if (format & IS_STRIKETHROUGH) result = `<s>${result}</s>`;
  if (format & IS_SUBSCRIPT) result = `<sub>${result}</sub>`;
  if (format & IS_SUPERSCRIPT) result = `<sup>${result}</sup>`;
  if (format & IS_HIGHLIGHT) result = `<mark>${result}</mark>`;

  return result;
}

// ============================================================================
// Node renderers
// ============================================================================

function renderChildren(children: LexicalNode[] | undefined): string {
  if (!children || children.length === 0) return "";
  return children.map(renderNode).join("");
}

function renderNode(node: LexicalNode): string {
  switch (node.type) {
    case "root":
      return renderChildren(node.children);

    case "paragraph": {
      const style = getTextAlign(node.format);
      const indent = node.indent
        ? ` style="padding-left: ${node.indent * 2}rem;${style ? " " + style : ""}"`
        : style
          ? ` style="${style}"`
          : "";
      return `<p${indent}>${renderChildren(node.children)}</p>`;
    }

    case "heading": {
      const tag = node.tag || "h2";
      const style = getTextAlign(node.format);
      const attr = style ? ` style="${style}"` : "";
      return `<${tag}${attr}>${renderChildren(node.children)}</${tag}>`;
    }

    case "text": {
      const escaped = escapeHtml(node.text || "");
      const format =
        typeof node.format === "number"
          ? node.format
          : parseInt(String(node.format || "0"), 10);
      return wrapTextWithFormat(escaped, format);
    }

    case "linebreak":
      return "<br>";

    case "link": {
      const href = node.url ? ` href="${escapeHtml(node.url)}"` : "";
      const rel = node.rel ? ` rel="${escapeHtml(node.rel)}"` : "";
      const target = node.target ? ` target="${escapeHtml(node.target)}"` : "";
      return `<a${href}${rel}${target}>${renderChildren(node.children)}</a>`;
    }

    case "autolink": {
      const href = node.url ? ` href="${escapeHtml(node.url)}"` : "";
      return `<a${href}>${renderChildren(node.children)}</a>`;
    }

    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      const start =
        node.listType === "number" && node.start && node.start > 1
          ? ` start="${node.start}"`
          : "";
      return `<${tag}${start}>${renderChildren(node.children)}</${tag}>`;
    }

    case "listitem": {
      const indent = node.indent
        ? ` style="padding-left: ${node.indent * 2}rem;"`
        : "";
      // Check if this is a nested list item (contains a list child)
      const hasNestedList = node.children?.some((c) => c.type === "list");
      if (hasNestedList) {
        return `<li${indent}>${renderChildren(node.children)}</li>`;
      }
      return `<li${indent}>${renderChildren(node.children)}</li>`;
    }

    case "quote": {
      return `<blockquote>${renderChildren(node.children)}</blockquote>`;
    }

    case "code": {
      const lang = node.language
        ? ` data-language="${escapeHtml(node.language)}"`
        : "";
      return `<pre${lang}><code>${renderChildren(node.children)}</code></pre>`;
    }

    case "code-highlight": {
      const escaped = escapeHtml(node.text || "");
      return `<span class="code-highlight">${escaped}</span>`;
    }

    case "horizontalrule":
      return "<hr>";

    case "table":
      return `<table>${renderChildren(node.children)}</table>`;

    case "tablerow":
      return `<tr>${renderChildren(node.children)}</tr>`;

    case "tablecell": {
      const tag = (node as any).headerState ? "th" : "td";
      const colspan =
        (node as any).colSpan > 1 ? ` colspan="${(node as any).colSpan}"` : "";
      const rowspan =
        (node as any).rowSpan > 1 ? ` rowspan="${(node as any).rowSpan}"` : "";
      return `<${tag}${colspan}${rowspan}>${renderChildren(node.children)}</${tag}>`;
    }

    case "image": {
      const src = node.src ? ` src="${escapeHtml(node.src)}"` : "";
      const alt = node.altText ? ` alt="${escapeHtml(node.altText)}"` : "";
      const width = node.width ? ` width="${node.width}"` : "";
      const height = node.height ? ` height="${node.height}"` : "";
      return `<img${src}${alt}${width}${height} style="max-width: 100%;" />`;
    }

    case "hashtag":
      return `<span class="hashtag">${renderChildren(node.children)}</span>`;

    // Layout nodes
    case "layout-container":
      return `<div class="layout-container" style="display: flex; gap: 1rem;">${renderChildren(node.children)}</div>`;

    case "layout-item":
      return `<div class="layout-item" style="flex: 1;">${renderChildren(node.children)}</div>`;

    // YouTube embed
    case "youtube": {
      const videoId = node.videoID || "";
      return `<div class="youtube-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"><iframe src="https://www.youtube.com/embed/${escapeHtml(videoId)}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe></div>`;
    }

    // Interactive/custom nodes — render semantic placeholders
    case "quiz":
      return `<div class="ssr-quiz-placeholder" role="region" aria-label="Quiz" style="padding: 1rem; margin: 1rem 0; border: 1px solid #e0e0e0; border-radius: 8px; background: #f5f5f5;"><p style="color: #666; font-style: italic;">📝 Interactive quiz — loading…</p></div>`;

    case "meaning-association":
      return `<div class="ssr-exercise-placeholder" role="region" aria-label="Vocabulary exercise" style="padding: 1rem; margin: 1rem 0; border: 1px solid #e0e0e0; border-radius: 8px; background: #f5f5f5;"><p style="color: #666; font-style: italic;">🔗 Vocabulary exercise — loading…</p></div>`;

    case "answer":
    case "custom-answer":
      return `<div class="ssr-answer-placeholder" role="region" aria-label="Answer block" style="padding: 1rem; margin: 1rem 0; border: 1px solid #e0e0e0; border-radius: 8px; background: #f5f5f5;"><p style="color: #666; font-style: italic;">✍️ Answer block — loading…</p></div>`;

    case "word-block": {
      const word = (node as any).word || "";
      return `<span class="word-block" style="font-weight: 600; border-bottom: 2px dotted #1976d2; cursor: help;">${escapeHtml(word)}</span>`;
    }

    case "playlist":
      return `<div class="ssr-playlist-placeholder" role="region" aria-label="Audio playlist" style="padding: 1rem; margin: 1rem 0; border: 1px solid #e0e0e0; border-radius: 8px; background: #f5f5f5;"><p style="color: #666; font-style: italic;">🎵 Audio playlist — loading…</p></div>`;

    case "pdf-viewer":
      return `<div class="ssr-pdf-placeholder" role="region" aria-label="PDF viewer" style="padding: 1rem; margin: 1rem 0; border: 1px solid #e0e0e0; border-radius: 8px; background: #f5f5f5;"><p style="color: #666; font-style: italic;">📄 PDF document — loading…</p></div>`;

    case "custom-ai":
    case "armor-editor":
      return `<div class="ssr-ai-placeholder" role="region" aria-label="AI content" style="padding: 1rem; margin: 1rem 0; border: 1px solid #e0e0e0; border-radius: 8px; background: #f5f5f5;"><p style="color: #666; font-style: italic;">🤖 AI content — loading…</p></div>`;

    case "file-metadata":
      return `<div class="ssr-file-placeholder" style="padding: 0.5rem; margin: 0.5rem 0; border: 1px solid #e0e0e0; border-radius: 4px; background: #fafafa;"><p style="color: #666; font-size: 0.875rem;">📎 File attachment</p></div>`;

    // Autocomplete / AI suggestions (not visible content)
    case "autocomplete":
    case "ai-content-suggestion":
    case "ai-loading":
      return "";

    default:
      // For any unknown node type, try to render its children
      if (node.children && node.children.length > 0) {
        return `<div class="ssr-unknown-node" data-type="${escapeHtml(node.type)}">${renderChildren(node.children)}</div>`;
      }
      return "";
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate HTML from a serialized Lexical editor state JSON string.
 *
 * This is a pure function with ZERO external dependencies — safe for use
 * in React Server Components, Edge Runtime, or any Node.js environment.
 *
 * @param serializedEditorState - JSON string of Lexical editor state (Unit.data)
 * @returns HTML string of the rendered content, or empty string on failure
 */
export function generateSSRHtml(serializedEditorState: string): string {
  if (!serializedEditorState) return "";

  try {
    const parsed: LexicalEditorState =
      typeof serializedEditorState === "string"
        ? JSON.parse(serializedEditorState)
        : serializedEditorState;

    if (!parsed?.root) return "";

    return renderNode(parsed.root);
  } catch (error) {
    console.error("[lexicalSSR] Failed to generate HTML:", error);
    return "";
  }
}
