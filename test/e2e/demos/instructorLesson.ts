import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const lessonPath = resolve(__dirname, "../../../test-results/demos/instructor-lesson.json");

export interface InstructorLesson {
  unitId: string;
  assignmentId: string;
  sectionId: string;
  aiQuestionPrompt: string;
  aiQuestionAnswer: string;
}

export function parseInstructorLesson(value: unknown): InstructorLesson {
  if (!value || typeof value !== "object") {
    throw new Error("Instructor lesson must be an object");
  }
  if (
    !("unitId" in value) || typeof value.unitId !== "string" || !value.unitId.trim() ||
    !("assignmentId" in value) || typeof value.assignmentId !== "string" || !value.assignmentId.trim() ||
    !("sectionId" in value) || typeof value.sectionId !== "string" || !value.sectionId.trim() ||
    !("aiQuestionPrompt" in value) || typeof value.aiQuestionPrompt !== "string" || !value.aiQuestionPrompt.trim() ||
    !("aiQuestionAnswer" in value) || typeof value.aiQuestionAnswer !== "string" || !value.aiQuestionAnswer.trim()
  ) {
    throw new Error("Instructor lesson details are incomplete; finish the instructor recording first");
  }
  return {
    unitId: value.unitId,
    assignmentId: value.assignmentId,
    sectionId: value.sectionId,
    aiQuestionPrompt: value.aiQuestionPrompt,
    aiQuestionAnswer: value.aiQuestionAnswer,
  };
}

export function loadInstructorLesson(): InstructorLesson {
  return parseInstructorLesson(JSON.parse(readFileSync(lessonPath, "utf8")));
}

export function saveInstructorLesson(lesson: InstructorLesson): void {
  writeFileSync(lessonPath, JSON.stringify(parseInstructorLesson(lesson), null, 2));
}
