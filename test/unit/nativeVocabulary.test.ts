import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { chunkVocabularyPage, parseCandidates, vocabularyLanguage } from "../../amplify/functions/nativeVocabulary/protocol";
import { runNativeSelection } from "../../amplify/functions/nativeVocabulary/pythonBridge";
import { resolveVocabularySelection } from "../../amplify/functions/documentAnalysis/vocabularySelection";

describe("native vocabulary configuration and chunking", () => {
  it("requires an explicit bundled language and leaves default selection unchanged", () => {
    expect(resolveVocabularySelection({ vocabularySelection: "hybrid-native" })).toBe("hybrid-native");
    expect(vocabularyLanguage("es")).toBe("es");
    expect(() => vocabularyLanguage("en")).toThrow("requires vocabularyLanguage");
    expect(() => vocabularyLanguage(undefined)).toThrow("requires vocabularyLanguage");
    expect(resolveVocabularySelection({})).toBe("llm");
  });
  it("preserves every character and page without splitting normal sentences", () => {
    const text = "La membrana regula el transporte. ".repeat(1_000);
    const chunks = [...chunkVocabularyPage({ pageNumber: 7, text }, "es")];
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map(({ text }) => text).join("")).toBe(text);
    expect(chunks.every((chunk) => chunk.pageNumber === 7 && chunk.text.length <= 12_000 && !chunk.splitSentence)).toBe(true);
  });
  it("bounds oversized CJK sentences without corrupting surrogate pairs, and reports the boundary", () => {
    const text = "细胞🧬".repeat(10_000);
    const chunks = [...chunkVocabularyPage({ pageNumber: 1, text }, "zh")];
    expect(chunks.map(({ text }) => text).join("")).toBe(text);
    expect(chunks.some(({ splitSentence }) => splitSentence)).toBe(true);
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(12_000);
      expect(chunk.text).not.toMatch(/[\uD800-\uDBFF]$/);
      expect(chunk.text).not.toMatch(/^[\uDC00-\uDFFF]/);
    }
  });
  it("does not produce empty chunks or silently accept invalid limits", () => {
    expect([...chunkVocabularyPage({ pageNumber: 1, text: "" }, "fr")]).toEqual([]);
    expect(() => [...chunkVocabularyPage({ pageNumber: 1, text: "Bonjour." }, "fr", 0)]).toThrow();
  });
  it("rejects malformed candidate metadata", () => {
    expect(() => parseCandidates([{ term: "cell" }])).toThrow();
    expect(() => parseCandidates(null)).toThrow();
  });
});

describe("native Python subprocess protocol", () => {
  const script = resolve("test/fixtures/native-vocabulary-worker.py");
  const options = { script, pythonPath: "python3", timeoutMs: 5_000 };
  async function* pages(text: string) { yield { pageNumber: 2, text }; }
  it("streams and acknowledges multiple chunks through a real Python process", async () => {
    const result = await runNativeSelection(pages("Una membrana regula el transporte. ".repeat(1_000)), "es", options);
    expect(result.chunks).toBeGreaterThan(1);
    expect(result).toMatchObject({ version: "stanza-wordfreq-v1", language: "es", candidates: [], splitSentences: 0 });
  });
  it.each(["CRASH", "MALFORMED"])("rejects failed or malformed workers (%s)", async (text) => {
    await expect(runNativeSelection(pages(text), "es", options)).rejects.toThrow(/Native vocabulary/);
  });
  it("terminates a hung child rather than leaving background Python work", async () => {
    await expect(runNativeSelection(pages("HANG"), "es", { ...options, timeoutMs: 150 })).rejects.toThrow("timed out");
  });
  it("surfaces missing Python executables", async () => {
    await expect(runNativeSelection(pages("Hola"), "es", { ...options, pythonPath: "/missing-python" })).rejects.toThrow(/Native vocabulary/);
  });
});
