import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/components/VocabularyReview2", () => ({
  default: (props: Record<string, unknown>) => <pre data-testid="vocabulary">{JSON.stringify(props)}</pre>,
}));
vi.mock("../../src/components/QuestionsReview2", () => ({
  default: (props: Record<string, unknown>) => <pre data-testid="questions">{JSON.stringify(props)}</pre>,
}));

import { SuggestedVocabulary, SuggestedQuestions } from "../../src/components/Editor3/components/SuggestedContent";

describe("file-panel import identity", () => {
  it("forwards the real target unit and ownership to both reviewers", () => {
    const props = { documentId: "document-1", fileId: "file-1", unitId: "unit-1", owner: "instructor", identityId: "identity-1" };
    render(<><SuggestedVocabulary {...props} /><SuggestedQuestions {...props} /></>);
    for (const kind of ["vocabulary", "questions"]) {
      expect(JSON.parse(screen.getByTestId(kind).textContent!)).toMatchObject({
        documentId: props.documentId,
        unitId: props.unitId,
        owner: props.owner,
        identityId: props.identityId,
      });
    }
  });
});
