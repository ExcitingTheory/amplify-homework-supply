import { describe, expect, it } from "vitest";
import {
  comparablePairs,
  linkExistingQuestions,
  linkExistingWords,
  textsNeedingMeaning,
} from "../../amplify/functions/documentAnalysis/existingContent";

const word = (id: string, phrase: string, definition?: string) => ({ id, phrase, definition });
const question = (id: string, prompt: string, answer?: string) => ({ id, prompt, answer });

describe("linkExistingWords", () => {
  it("links a term to the existing Word however the term is written", () => {
    const { entries, linked } = linkExistingWords(
      [{ word: "Chloroplasts", definition: "Organelles where photosynthesis occurs" }],
      [word("w1", "chloroplast", "Organelles where photosynthesis occurs")],
    );
    expect(linked).toBe(1);
    expect(entries[0]).toMatchObject({ wordID: "w1" });
  });

  it("links when the definition is reworded, so a rewording is not imported twice", () => {
    const { entries } = linkExistingWords(
      [{ word: "Cell", definition: "the basic unit of life!" }],
      [word("w1", "Cell", "The basic unit of life")],
    );
    expect(entries[0]).toMatchObject({ wordID: "w1" });
  });

  it("leaves a different sense of the same term unlinked, so importing cannot overwrite it", () => {
    const { entries, linked } = linkExistingWords(
      [{ word: "Path", definition: "A road for walkers" }],
      [word("w1", "Path", "A Tree-line joining two Sephiroth")],
    );
    expect(linked).toBe(0);
    expect(entries[0]).not.toHaveProperty("wordID");
  });

  it("links when either side has no definition to disagree with", () => {
    expect(
      linkExistingWords([{ word: "Aleph" }], [word("w1", "Aleph", "Hebrew letter")]).entries[0],
    ).toMatchObject({ wordID: "w1" });
    expect(
      linkExistingWords([{ word: "Aleph", definition: "Hebrew letter" }], [word("w1", "Aleph")])
        .entries[0],
    ).toMatchObject({ wordID: "w1" });
  });

  it("chooses the Word whose sense matches when a term is defined more than once", () => {
    const { entries } = linkExistingWords(
      [{ word: "Path", definition: "A road for walkers" }],
      [word("w1", "Path", "A Tree-line joining two Sephiroth"), word("w2", "Path", "A road for walkers")],
    );
    expect(entries[0]).toMatchObject({ wordID: "w2" });
  });

  it("keeps a wordID an importer already recorded, and ignores unmatched terms", () => {
    const { entries, linked } = linkExistingWords(
      [{ word: "Cell", wordID: "already" }, { word: "Nowhere" }, "raw"],
      [word("w1", "Cell"), word("w2", "Nowhere-else")],
    );
    expect(linked).toBe(0);
    expect(entries).toEqual([{ word: "Cell", wordID: "already" }, { word: "Nowhere" }, "raw"]);
  });

  it("can treat a paraphrased definition as the same sense", () => {
    const paraphrases = new Map([["Organelles that release energy", "The parts that supply power"]]);
    const { entries } = linkExistingWords(
      [{ word: "Mitochondria", definition: "Organelles that release energy" }],
      [word("w1", "Mitochondria", "The parts that supply power")],
      { sameMeaning: (left, right) => paraphrases.get(left) === right },
    );
    expect(entries[0]).toMatchObject({ wordID: "w1" });
  });
});

describe("linkExistingQuestions", () => {
  it("links a question asking the same thing with the same answer", () => {
    const { entries, linked } = linkExistingQuestions(
      [{ prompt: "What is the path for The Magus?", answer: "12" }],
      [question("q1", "what is the path for the magus?", "12")],
    );
    expect(linked).toBe(1);
    expect(entries[0]).toMatchObject({ questionID: "q1" });
  });

  it("leaves a question unlinked when the existing answer contradicts it", () => {
    const { entries } = linkExistingQuestions(
      [{ prompt: "What is the path for The Magus?", answer: "12" }],
      [question("q1", "What is the path for The Magus?", "13")],
    );
    expect(entries[0]).not.toHaveProperty("questionID");
  });

  it("leaves a question unlinked when the existing answer is negated", () => {
    const { entries } = linkExistingQuestions(
      [{ prompt: "Does the nucleus hold DNA?", answer: "The nucleus holds DNA" }],
      [question("q1", "Does the nucleus hold DNA?", "The nucleus does not hold DNA")],
    );
    expect(entries[0]).not.toHaveProperty("questionID");
  });
});

describe("choosing what to compare by meaning", () => {
  it("pairs each entry with the existing records sharing its term", () => {
    expect(
      comparablePairs(
        [{ word: "Cell", definition: "The basic unit of life" }],
        [
          { text: "cell", compare: "A living building block" },
          { text: "Nucleus", compare: "The control centre" },
        ],
        (entry) => String(entry.word ?? ""),
        (entry) => String(entry.definition ?? ""),
      ),
    ).toEqual([{ entry: "The basic unit of life", existing: "A living building block" }]);
  });

  it("asks for only the texts whose wording leaves the answer open", () => {
    expect(
      textsNeedingMeaning([
        // Reads alike already, so no comparison is needed.
        { entry: "The basic unit of life", existing: "the basic unit of life!" },
        // Contradicts, so no comparison can rescue it.
        { entry: "Path 12", existing: "Path 13" },
        { entry: "A living building block", existing: "The smallest living thing" },
      ]),
    ).toEqual(["A living building block", "The smallest living thing"]);
  });
});
