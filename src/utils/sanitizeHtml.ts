/**
 * Centralized HTML/SVG sanitization for untrusted markup.
 *
 * Uses DOMPurify with a strict SVG-oriented allowlist. All user-influenced
 * markup (crest SVGs, ruby tags, editor previews) must pass through one of
 * these helpers before being rendered via dangerouslySetInnerHTML.
 *
 * @module utils/sanitizeHtml
 */

import DOMPurify from "dompurify";

// ── SVG sanitization ────────────────────────────────────────────────────────

/**
 * Sanitize an SVG string, allowing only safe SVG elements and presentation
 * attributes. Strips all event handlers, scripts, and foreign objects.
 */
export function sanitizeSvg(dirty: string | undefined | null): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["use"],
    ADD_ATTR: ["xlink:href", "href", "clip-path", "mask"],
    FORBID_TAGS: ["script", "foreignObject", "iframe", "embed", "object"],
    FORBID_ATTR: [
      "onload",
      "onerror",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
      "onanimationend",
      "onbegin",
    ],
  });
}

// ── HTML sanitization ───────────────────────────────────────────────────────

/**
 * Sanitize an HTML string with a minimal allowlist suitable for inline
 * rich text (ruby tags, basic formatting). No block-level elements allowed.
 */
export function sanitizeInlineHtml(dirty: string | undefined | null): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "ruby",
      "rt",
      "rp",
      "rb",
      "span",
      "em",
      "strong",
      "br",
      "sup",
      "sub",
    ],
    ALLOWED_ATTR: ["class", "lang", "dir"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize a block of HTML allowing common rich text elements.
 * More permissive than sanitizeInlineHtml but still strips scripts/events.
 */
export function sanitizeRichHtml(dirty: string | undefined | null): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "span",
      "em",
      "strong",
      "b",
      "i",
      "u",
      "a",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
      "img",
      "figure",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "ruby",
      "rt",
      "rp",
      "rb",
      "sup",
      "sub",
    ],
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "embed",
      "object",
      "applet",
      "form",
      "input",
      "select",
      "textarea",
      "button",
      "svg",
      "math",
    ],
    ALLOWED_ATTR: [
      "class",
      "href",
      "target",
      "rel",
      "src",
      "alt",
      "width",
      "height",
      "lang",
      "dir",
    ],
    ALLOW_DATA_ATTR: false,
  });
}
