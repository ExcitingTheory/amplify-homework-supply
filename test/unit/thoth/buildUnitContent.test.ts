import { describe, expect, it } from "vitest";
import groundTruthFixture from "../../fixtures/thoth/thoth-ground-truth.json";
import type { ThothGroundTruth } from "../../integration/thoth/scoreExtraction";
import {
  buildThothUnitContent,
  buildThothUnits,
  THOTH_UNIT_SPECS,
} from "../../../scripts/thoth/buildUnitContent";

const groundTruth = groundTruthFixture as unknown as ThothGroundTruth;

function walkNodes(node: Record<string, any>): Record<string, any>[] {
  return [
    node,
    ...(Array.isArray(node.children)
      ? node.children.flatMap((child: Record<string, any>) => walkNodes(child))
      : []),
  ];
}

describe("Thoth unit content builders", () => {
  it("builds all eight planned units from the ground-truth card groups", () => {
    const units = buildThothUnits(groundTruth);
    expect(units.map((unit) => unit.key)).toEqual(
      THOTH_UNIT_SPECS.map((spec) => spec.key),
    );
    expect(units.find((unit) => unit.key === "trumps")?.cards).toHaveLength(23);
    expect(units.find((unit) => unit.key === "small")?.cards).toHaveLength(37);
    expect(units.find((unit) => unit.key === "courts")?.cards).toHaveLength(19);
    expect(units.find((unit) => unit.key === "glossary")?.cards).toHaveLength(
      9,
    );
    expect(units.find((unit) => unit.key === "aces")?.cards).toHaveLength(8);
    expect(
      units.find((unit) => unit.key === "counterchange")?.cards.map(
        (card) => card.key,
      ),
    ).toEqual(
      expect.arrayContaining([
        "trump-iv-the-emperor",
        "trump-xvii-the-star",
        "ref-trumps-paths-counterchange",
      ]),
    );
    expect(
      units.find((unit) => unit.key === "colourScales")?.cards.filter(
        (card) => card.group === "small",
      ),
    ).toHaveLength(8);
  });

  it("produces standard WordBlock, Quiz, CustomAnswer, and MeaningAssociation nodes", () => {
    const units = buildThothUnits(groundTruth, {
      wordIDsByTerm: {
        Beth: "word-beth",
        Mercury: "word-mercury",
        path: "word-path",
      },
      questionIDsByCardField: {
        "trump-i-the-magus::path": "question-magus-path",
        "court-wands-princess::birthday": "question-court-birthday",
      },
    });
    const trumps = units.find((unit) => unit.key === "trumps")!;
    const trumpsNodes = walkNodes(trumps.content.root);
    expect(trumpsNodes).toContainEqual(
      expect.objectContaining({
        type: "quiz",
        data: expect.arrayContaining(["question-magus-path"]),
      }),
    );
    expect(trumpsNodes).toContainEqual(
      expect.objectContaining({
        type: "word-block",
        wordID: "word-mercury",
      }),
    );

    const courtsNodes = walkNodes(
      units.find((unit) => unit.key === "courts")!.content.root,
    );
    expect(courtsNodes).toContainEqual(
      expect.objectContaining({
        type: "custom-answer",
        ids: ["question-court-birthday"],
      }),
    );

    const glossaryNodes = walkNodes(
      units.find((unit) => unit.key === "glossary")!.content.root,
    );
    expect(glossaryNodes).toContainEqual(
      expect.objectContaining({
        type: "meaning-association",
        wordIDs: expect.arrayContaining(["word-beth", "word-mercury"]),
      }),
    );
  });

  it("includes a call-response node per non-reference card when the builder is supplied", () => {
    const unit = buildThothUnitContent("trumps", groundTruth, {
      callResponseBlock: (card) => ({
        type: "call-response",
        version: 1,
        cardKey: card.key,
      }),
    });

    const callResponseNodes = walkNodes(unit.content.root).filter(
      (node) => node.type === "call-response",
    );
    expect(callResponseNodes).toHaveLength(23);
    expect(callResponseNodes.map((node) => node.cardKey)).toEqual(
      unit.cards.map((card) => card.key),
    );
  });

  it("preserves input order, maps content to ids, and rejects unknown unit keys", () => {
    const unit = buildThothUnitContent("trumps", groundTruth, {
      questionIDsByCardField: {
        "trump-0-the-fool::number": "question-fool-number",
        "trump-i-the-magus::number": "question-magus-number",
      },
    });
    const quizNodes = walkNodes(unit.content.root).filter(
      (node) => node.type === "quiz",
    );
    expect(quizNodes[0].data).toEqual(["question-fool-number"]);
    expect(quizNodes[1].data).toEqual(["question-magus-number"]);
    expect(() =>
      buildThothUnitContent("not-a-unit" as never, groundTruth),
    ).toThrow("Unknown Thoth unit: not-a-unit");
  });
});
