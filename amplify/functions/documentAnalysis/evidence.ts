import { createHash } from "node:crypto";

export interface EvidencePage {
  pageNumber: number;
  text: string;
}

export interface EvidenceUnit {
  id: string;
  page: number;
  headingPath: string[];
  text: string;
  start: number;
  end: number;
}

export interface EvidenceAnchor {
  evidenceUnitId: string;
  sourceStart: number;
  sourceEnd: number;
}

/** Offsets are page-local UTF-16 indices; text and layout are never rewritten. */
export function sourceEvidenceUnits(page: EvidencePage): EvidenceUnit[] {
  const units: EvidenceUnit[] = [];
  const headings: Array<{ level: number; text: string }> = [];
  for (const match of page.text.matchAll(/[^\r\n]+(?:\r?\n(?![ \t]*(?:\r?\n|$))[^\r\n]+)*/g)) {
    const text = match[0].trim();
    if (!text) continue;
    const start = match.index + match[0].indexOf(text);
    const markdown = text.match(/^(#{1,6})[ \t]+(.+)$/);
    const chapter = /^(?:chapter|section|unit|part|lesson|module|appendix)\b/i.test(text);
    const words = text.split(/\s+/);
    const plainHeading = !text.includes("\n") && !/[.!?;:]|(?:\s[—–-]\s)/u.test(text) &&
      !text.startsWith("**") && words.length <= 12 &&
      words.every((word) => /^(?:a|an|and|as|at|by|for|from|in|of|on|or|the|to|with)$/u.test(word) ||
        /^\p{Lu}/u.test(word));
    if (markdown || chapter || plainHeading) {
      if (markdown) {
        const level = markdown[1].length;
        while (headings.length && headings.at(-1)!.level >= level) headings.pop();
        headings.push({ level, text: markdown[2] });
      } else if (chapter) {
        headings.splice(0, headings.length, { level: 1, text });
      } else {
        while (headings.length && headings.at(-1)!.level >= 2) headings.pop();
        headings.push({ level: 2, text });
      }
      continue;
    }
    const end = start + text.length;
    const headingPath = headings.map((heading) => heading.text);
    const digest = createHash("sha256")
      .update(JSON.stringify([page.pageNumber, start, end, headingPath, text]))
      .digest("hex").slice(0, 20);
    units.push({ id: `evidence-${digest}`, page: page.pageNumber,
      headingPath, text, start, end });
  }
  return units;
}

export function locateEvidence(
  page: EvidencePage,
  quote: string,
  units = sourceEvidenceUnits(page),
): EvidenceAnchor | undefined {
  if (!quote.trim()) return undefined;
  // Repeated quotations need enough context to identify a unique source span.
  const start = page.text.indexOf(quote);
  if (start < 0 || page.text.indexOf(quote, start + 1) >= 0) return undefined;
  const end = start + quote.length;
  const unit = units.find((entry) => entry.start <= start && entry.end >= end);
  return unit ? { evidenceUnitId: unit.id, sourceStart: start, sourceEnd: end } : undefined;
}

/** Evidence coverage means a unit has an anchored claim, not that all its facts were recalled. */
export function uncoveredEvidenceUnits(
  page: EvidencePage,
  facts: Array<{ subject: string; field: string; answer: string; sourceText: string; page: number }>,
): EvidenceUnit[] {
  const units = sourceEvidenceUnits(page);
  const touched = new Set(facts.flatMap((fact) => {
    if (fact.page !== page.pageNumber || !fact.subject.trim() || !fact.field.trim() ||
        !fact.answer.trim() ||
        !normalizeEvidence(fact.sourceText).includes(normalizeEvidence(fact.answer))) return [];
    const anchor = locateEvidence(page, fact.sourceText, units);
    return anchor ? [anchor.evidenceUnitId] : [];
  }));
  return units.filter((unit) => !touched.has(unit.id));
}

export function normalizeEvidence(value: string): string {
  return value.normalize("NFKC")
    .replace(/[\u2018\u2019']/gu, '"')
    .replace(/[\u201c\u201d]/gu, '"')
    .replace(/\s+/gu, " ").trim().toLowerCase();
}
