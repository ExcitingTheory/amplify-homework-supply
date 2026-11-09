import { describe, expect, it } from "vitest";
import {
  buildSuggestionReferenceCatalog,
  normalizeSuggestionBlockLines,
  placeMeaningAfterWordBlocks,
  resolveSuggestionReferences,
} from "../suggestionReferences";

describe("AI completion resource references", () => {
  it("keeps explicitly named words ahead of incidental definition matches in a bounded catalog", () => {
    const prompt = "Introduce useful vocabulary with word cards for Nucleus and Ribosomes before a meaning association exercise.";
    const dictionary = Object.fromEntries(
      Array.from({ length: 25 }, (_, index) => [
        `other-${index}`,
        { id: `other-${index}`, phrase: `Cell component ${index}`, definition: prompt },
      ]),
    );
    dictionary.nucleus = { id: "nucleus", phrase: "Nucleus", definition: "Stores DNA" };
    dictionary.ribosomes = { id: "ribosomes", phrase: "Ribosomes", definition: "Produce proteins" };
    const { resources } = buildSuggestionReferenceCatalog(dictionary, {}, {}, prompt);
    expect(resources.vocabulary.slice(0, 2).map((word) => word.phrase))
      .toEqual(["Nucleus", "Ribosomes"]);
    expect(resources.vocabulary).toHaveLength(20);
  });

  it("keeps UUIDs in the client map, not the model-facing resource list", () => {
    const catalog = buildSuggestionReferenceCatalog(
      {
        "word-uuid": {
          id: "word-uuid",
          phrase: "photosynthesis",
          definition: "The process plants use to make food",
        },
      },
      {
        "question-uuid": {
          id: "question-uuid",
          prompt: "What does photosynthesis produce?",
          answer: "Glucose",
        },
      },
      {
        "file-uuid": {
          id: "file-uuid",
          name: "Plant cell diagram",
          path: "protected/private-id/plant.png",
          description: "A labeled diagram of a plant cell",
        },
      },
      "photosynthesis",
    );

    expect(JSON.stringify(catalog.resources)).not.toContain("uuid");
    expect(JSON.stringify(catalog.resources)).not.toContain("private-id");
    expect(catalog.idByReference).toEqual({
      w1: "word-uuid",
      q1: "question-uuid",
      f1: "file-uuid",
    });
    expect(catalog.fileById["file-uuid"].name).toBe("Plant cell diagram");
  });

  it("resolves short block codes to existing resource IDs", () => {
    expect(
      resolveSuggestionReferences(
        [
          ":::quiz[q1]",
          "",
          ":::answer[w1,w2]",
          "",
          ":::meaning[w1,w2]",
          "",
          ":::custom-answer[q1]",
          "",
          ":::file[f1]",
        ].join("\n"),
        {
          q1: "question-uuid",
          w1: "word-uuid-1",
          w2: "word-uuid-2",
          f1: "file-uuid",
        },
      ),
    ).toBe(
      [
        ":::quiz[question-uuid]",
        "",
        ":::answer[word-uuid-1,word-uuid-2]",
        "",
        ":::meaning[word-uuid-1,word-uuid-2]",
        "",
        ":::custom-answer[question-uuid]",
        "",
        ":::file[file-uuid]",
      ].join("\n"),
    );
  });

  it("rejects references missing from the completion snapshot", () => {
    expect(() =>
      resolveSuggestionReferences(":::quiz[q2]", { q1: "question-uuid" }),
    ).toThrow("Invalid quiz reference");
    expect(() =>
      resolveSuggestionReferences(":::vocab[w1]", { w1: "word-uuid" }),
    ).toThrow("Unsupported AI block code");
    expect(() =>
      resolveSuggestionReferences(":::answer[unmapped-id]", {}),
    ).toThrow("Invalid answer reference");
  });

  it("resolves references in blocks that carry options", () => {
    expect(
      resolveSuggestionReferences(
        ":::answer[w1,w2]{direction=word-to-definition;input=text}\n\n:::custom-answer[q1]{prompt=text}",
        { w1: "word-1", w2: "word-2", q1: "question-1" },
      ),
    ).toBe(
      ":::answer[word-1,word-2]{direction=word-to-definition;input=text}\n\n:::custom-answer[question-1]{prompt=text}",
    );
  });

  it("moves meaning exercises after generated word cards", () => {
    expect(
      placeMeaningAfterWordBlocks(
        "Intro.\n\n:::meaning[w1,w2]\n\nWords:\n\n:::word[w1]\n\n:::word[w2]\n\nOutro.",
      ),
    ).toBe(
      "Intro.\n\nWords:\n\n:::word[w1]\n\n:::word[w2]\n\n:::meaning[w1,w2]\n\nOutro.",
    );
    const ordered = ":::word[w1]\n\n:::meaning[w1]";
    expect(placeMeaningAfterWordBlocks(ordered)).toBe(ordered);
  });

  it("normalizes list-wrapped block codes without changing fenced examples", () => {
    const markdown = [
      "Definitions:",
      "- :::word{w1}",
      "2. :::word[w2]",
      "",
      "```text",
      "- :::word{w3}",
      "```",
      "",
      ":::answer{w1,w2}{direction=word-to-definition}",
    ].join("\n");
    const normalized = normalizeSuggestionBlockLines(markdown);
    expect(normalized).toBe([
      "Definitions:",
      ":::word[w1]",
      ":::word[w2]",
      "",
      "```text",
      "- :::word{w3}",
      "```",
      "",
      ":::answer[w1,w2]{direction=word-to-definition}",
    ].join("\n"));
    expect(normalizeSuggestionBlockLines(normalized)).toBe(normalized);
    expect(resolveSuggestionReferences("- :::word{w1}", { w1: "word-1" }))
      .toBe(":::word[word-1]");
  });
});
