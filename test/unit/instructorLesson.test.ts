import { describe, expect, it } from "vitest";
import { parseInstructorLesson } from "../e2e/demos/instructorLesson";

describe("instructor-to-learner demo handoff", () => {
  it("preserves the new assignment and AI question", () => {
    const lesson = {
      unitId: "new-unit",
      assignmentId: "new-assignment",
      sectionId: "biology-section",
      aiQuestionPrompt: "What is cell theory?",
      aiQuestionAnswer: "All living organisms are composed of one or more cells.",
    };
    expect(parseInstructorLesson(lesson)).toEqual(lesson);
  });

  it.each([
    null,
    {},
    { unitId: "new-unit" },
    { unitId: "", assignmentId: "assignment", sectionId: "section" },
    { unitId: "unit", assignmentId: "assignment", sectionId: "section" },
  ])(
    "rejects an incomplete handoff without falling back to a seeded workbook: %j",
    (value) => expect(() => parseInstructorLesson(value)).toThrow(),
  );
});
