import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function loadBiologySource() {
  const text = readFileSync(resolve(__dirname, "../../mocks/biology-cell-structure.md"), "utf8");
  const html = text.split(/\n\s*\n/).map((paragraph, index) => {
    const tag = index === 0 ? "h1" : /^Chapter \d:/.test(paragraph) ? "h2" : "p";
    const content = escapeHtml(paragraph).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
    return `<${tag}>${content}</${tag}>`;
  }).join("\n");
  return {
    text,
    html,
    pdfPath: resolve(__dirname, "../../mocks/biology-cell-structure.pdf"),
  };
}

export async function pasteLessonHtml(page: Page, html: string, text: string) {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  // The async clipboard API rejects writes from an unfocused document.
  await page.bringToFront();
  await page.evaluate(async ({ html, text }) => {
    await navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([text], { type: "text/plain" }),
    })]);
  }, { html, text });
  await page.keyboard.press("ControlOrMeta+V");
}

export function biologyPdfHtml(file: { path: string; identityId: string; name: string }) {
  return `<div data-lexical-pdf-path="${escapeHtml(file.path)}" ` +
    `data-lexical-pdf-identity-id="${escapeHtml(file.identityId)}" ` +
    `data-lexical-pdf-filename="${escapeHtml(file.name)}"></div><p><br></p>`;
}
