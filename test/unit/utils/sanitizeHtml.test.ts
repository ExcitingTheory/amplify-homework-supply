/**
 * Tests for sanitizeHtml.ts injection prevention (A3).
 *
 * Validates that user-influenced markup cannot execute script payloads
 * through any of the sanitization helpers.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import {
  sanitizeSvg,
  sanitizeInlineHtml,
  sanitizeRichHtml,
} from "@/utils/sanitizeHtml";

describe("sanitizeSvg", () => {
  it("allows safe SVG elements", () => {
    const svg = '<svg><circle cx="50" cy="50" r="40" fill="red"/></svg>';
    const result = sanitizeSvg(svg);
    expect(result).toContain("<circle");
    expect(result).toContain('fill="red"');
  });

  it("strips <script> tags inside SVG", () => {
    const dirty = '<svg><script>alert("xss")</script><circle r="10"/></svg>';
    const result = sanitizeSvg(dirty);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
    // DOMPurify strips the script and its siblings in some parsers —
    // the critical assertion is that no script payload survives
  });

  it("strips onload event handler from SVG elements", () => {
    const dirty =
      '<svg onload="alert(1)"><rect width="100" height="100"/></svg>';
    const result = sanitizeSvg(dirty);
    expect(result).not.toContain("onload");
    expect(result).not.toContain("alert");
  });

  it("strips onerror event handler from SVG image", () => {
    const dirty = '<svg><image href="x" onerror="alert(1)"/></svg>';
    const result = sanitizeSvg(dirty);
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("alert");
  });

  it("strips onclick from SVG elements", () => {
    const dirty =
      '<svg><rect onclick="document.location=\'http://evil.com\'" width="10" height="10"/></svg>';
    const result = sanitizeSvg(dirty);
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("evil.com");
  });

  it("strips <foreignObject> (DOM injection vector)", () => {
    const dirty =
      "<svg><foreignObject><body><script>alert(1)</script></body></foreignObject></svg>";
    const result = sanitizeSvg(dirty);
    expect(result).not.toContain("foreignObject");
    expect(result).not.toContain("<script");
  });

  it("strips <iframe> inside SVG", () => {
    const dirty = '<svg><iframe src="http://evil.com"></iframe></svg>';
    const result = sanitizeSvg(dirty);
    expect(result).not.toContain("<iframe");
    expect(result).not.toContain("evil.com");
  });

  it("strips javascript: protocol in href", () => {
    const dirty =
      '<svg><a href="javascript:alert(1)"><text>click</text></a></svg>';
    const result = sanitizeSvg(dirty);
    expect(result).not.toContain("javascript:");
  });

  it("strips SVG animate with onbegin handler", () => {
    const dirty =
      '<svg><animate onbegin="alert(1)" attributeName="x" dur="1s"/></svg>';
    const result = sanitizeSvg(dirty);
    expect(result).not.toContain("onbegin");
    expect(result).not.toContain("alert");
  });

  it("returns empty string for null/undefined input", () => {
    expect(sanitizeSvg(null)).toBe("");
    expect(sanitizeSvg(undefined)).toBe("");
    expect(sanitizeSvg("")).toBe("");
  });
});

describe("sanitizeInlineHtml", () => {
  it("allows ruby tags for phonetic annotations", () => {
    const html = "<ruby>漢<rt>かん</rt>字<rt>じ</rt></ruby>";
    const result = sanitizeInlineHtml(html);
    expect(result).toContain("<ruby>");
    expect(result).toContain("<rt>");
  });

  it("allows basic inline formatting", () => {
    const html = "<em>emphasized</em> and <strong>bold</strong>";
    const result = sanitizeInlineHtml(html);
    expect(result).toContain("<em>");
    expect(result).toContain("<strong>");
  });

  it("strips <script> tags", () => {
    const dirty = '<span>safe</span><script>alert("xss")</script>';
    const result = sanitizeInlineHtml(dirty);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
    expect(result).toContain("safe");
  });

  it("strips <img> with onerror (not in allowlist)", () => {
    const dirty = '<img src="x" onerror="alert(1)">text';
    const result = sanitizeInlineHtml(dirty);
    expect(result).not.toContain("<img");
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("alert");
  });

  it("strips event handlers on allowed elements", () => {
    const dirty = '<span onmouseover="alert(1)">hover</span>';
    const result = sanitizeInlineHtml(dirty);
    expect(result).not.toContain("onmouseover");
    expect(result).not.toContain("alert");
    expect(result).toContain("hover");
  });

  it("strips <iframe> completely", () => {
    const dirty = '<iframe src="http://evil.com"></iframe>safe';
    const result = sanitizeInlineHtml(dirty);
    expect(result).not.toContain("<iframe");
    expect(result).toContain("safe");
  });

  it("strips <a> tags (not in inline allowlist)", () => {
    const dirty = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeInlineHtml(dirty);
    expect(result).not.toContain("<a");
    expect(result).not.toContain("javascript:");
  });

  it("strips style attributes (not in allowlist)", () => {
    const dirty =
      '<span style="background:url(javascript:alert(1))">text</span>';
    const result = sanitizeInlineHtml(dirty);
    expect(result).not.toContain("style=");
    expect(result).not.toContain("javascript:");
  });

  it("strips data-* attributes", () => {
    const dirty = '<span data-payload="malicious">text</span>';
    const result = sanitizeInlineHtml(dirty);
    // ALLOWED_ATTR whitelist + ALLOW_DATA_ATTR:false should strip data-* attrs
    expect(result).toContain("text");
    // With ALLOW_DATA_ATTR: false, data attributes should be stripped
    expect(result).not.toContain("data-payload");
  });

  it("returns empty string for null/undefined input", () => {
    expect(sanitizeInlineHtml(null)).toBe("");
    expect(sanitizeInlineHtml(undefined)).toBe("");
  });
});

describe("sanitizeRichHtml", () => {
  it("allows block-level elements for rich content", () => {
    const html = "<h2>Title</h2><p>Paragraph with <strong>bold</strong></p>";
    const result = sanitizeRichHtml(html);
    expect(result).toContain("<h2>");
    expect(result).toContain("<p>");
    expect(result).toContain("<strong>");
  });

  it("allows links with safe attributes", () => {
    const html =
      '<a href="https://example.com" target="_blank" rel="noopener">link</a>';
    const result = sanitizeRichHtml(html);
    expect(result).toContain("<a");
    expect(result).toContain('href="https://example.com"');
  });

  it("strips javascript: protocol in links", () => {
    const dirty = '<a href="javascript:alert(document.cookie)">click</a>';
    const result = sanitizeRichHtml(dirty);
    expect(result).not.toContain("javascript:");
    expect(result).not.toContain("alert");
  });

  it("strips <script> tags", () => {
    const dirty =
      '<p>safe</p><script>document.location="http://evil.com"</script>';
    const result = sanitizeRichHtml(dirty);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("evil.com");
    expect(result).toContain("safe");
  });

  it("strips event handlers on all elements", () => {
    const dirty =
      '<p onclick="steal()">paragraph</p><img src="x" onerror="alert(1)">';
    const result = sanitizeRichHtml(dirty);
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("steal");
    expect(result).not.toContain("alert");
  });

  it("strips <form> elements (phishing vector)", () => {
    const dirty =
      '<form action="http://evil.com"><input type="password"></form><p>safe</p>';
    const result = sanitizeRichHtml(dirty);
    // The form action (the dangerous part) must be stripped
    expect(result).not.toContain("<form");
    expect(result).not.toContain("evil.com");
    expect(result).not.toContain("action=");
    expect(result).toContain("safe");
  });

  it("strips <embed>, <object>, <applet> elements", () => {
    const dirty = '<embed src="evil.swf"><p>safe</p>';
    const result = sanitizeRichHtml(dirty);
    expect(result).not.toContain("<embed");
    expect(result).not.toContain("evil");
    expect(result).toContain("safe");
  });

  it("strips <object> elements with data attribute", () => {
    const dirty = '<p>before</p><object data="evil.jar"></object><p>after</p>';
    const result = sanitizeRichHtml(dirty);
    expect(result).not.toContain("<object");
    expect(result).not.toContain("evil");
    expect(result).toContain("before");
  });

  it("strips <meta> http-equiv redirect", () => {
    const dirty = '<meta http-equiv="refresh" content="0;url=http://evil.com">';
    const result = sanitizeRichHtml(dirty);
    expect(result).not.toContain("<meta");
    expect(result).not.toContain("evil.com");
  });

  it("strips <svg> with embedded script (not in rich allowlist)", () => {
    const dirty = "<p>safe</p><svg><script>alert(1)</script></svg>";
    const result = sanitizeRichHtml(dirty);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
    expect(result).not.toContain("<svg");
    expect(result).toContain("safe");
  });

  it("strips data-* attributes (ALLOW_DATA_ATTR is false)", () => {
    const dirty = '<p data-exploit="payload">text</p>';
    const result = sanitizeRichHtml(dirty);
    expect(result).not.toContain("data-exploit");
    expect(result).toContain("text");
  });

  it("allows img with safe attributes", () => {
    const html =
      '<img src="https://example.com/img.png" alt="photo" width="100">';
    const result = sanitizeRichHtml(html);
    expect(result).toContain("<img");
    expect(result).toContain('src="https://example.com/img.png"');
    expect(result).toContain('alt="photo"');
  });

  it("returns empty string for null/undefined input", () => {
    expect(sanitizeRichHtml(null)).toBe("");
    expect(sanitizeRichHtml(undefined)).toBe("");
  });
});
