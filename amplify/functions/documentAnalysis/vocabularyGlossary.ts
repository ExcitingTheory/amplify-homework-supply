import type { VocabularySourcePage } from "./vocabularySelection.js";

export function sourceDefinitions(pages: VocabularySourcePage[]) {
  const glossary = new Map<string, { term: string; page: number; sourceText: string; definition: string }>();
  for (const page of pages) {
    const lines = page.text.split(/\r?\n/);
    for (const [index, rawLine] of lines.entries()) {
      const line = rawLine.trim();
      if (/^(?:#{1,6}\s|(?:chapter|section|unit|part|lesson|module|appendix)\b)/i.test(line)) continue;
      const match = line.match(/^(.{1,100}?)\s+[—–-]\s+(\S.*)$/u);
      if (!match) continue;
      const term = match[1].replace(/\s*\(singular:[^)]+\)\s*$/i, "").replace(/[*_`]/g, "").trim();
      if (!/^[\p{L}][\p{L}\p{M}' ()-]*$/u.test(term) || term.split(/\s+/).length > 8) continue;
      const continuation: string[] = [];
      for (let next = index + 1; next < lines.length && /^\s*\d+[.)]\s+\S/.test(lines[next]); next += 1) {
        continuation.push(lines[next]);
      }
      const key = term.normalize("NFKC").toLowerCase().trim();
      if (!glossary.has(key)) glossary.set(key, {
        term, page: page.pageNumber,
        sourceText: [rawLine, ...continuation].join("\n").trim(),
        definition: [match[2].trim(), ...continuation].join("\n"),
      });
    }
  }
  return [...glossary.values()];
}
