/**
 * Extract plain text from Lexical editor JSON structure.
 *
 * Shared utility used by:
 * - unitContentStorage.ts (write plain.txt on publish)
 * - rebuildSearchBundle Lambda (generate embeddings from plain text)
 * - gamification engine (skill tree generation)
 */

interface LexicalNode {
  text?: string;
  prompt?: string;
  answer?: string;
  phrase?: string;
  definition?: string;
  children?: LexicalNode[];
}

interface LexicalRoot {
  root?: {
    children?: LexicalNode[];
  };
}

export function extractTextFromLexical(
  data: LexicalRoot | string | null | undefined,
): string {
  if (!data) return "";

  let parsed: LexicalRoot;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      return "";
    }
  } else {
    parsed = data;
  }

  if (!parsed?.root?.children) return "";

  const parts: string[] = [];

  function walk(node: LexicalNode | null | undefined): void {
    if (!node) return;
    if (node.text) parts.push(node.text);
    if (node.prompt) parts.push(node.prompt);
    if (node.answer) parts.push(node.answer);
    if (node.phrase) parts.push(node.phrase);
    if (node.definition) parts.push(node.definition);
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child);
    }
  }

  walk(parsed.root as unknown as LexicalNode);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
