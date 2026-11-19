import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useResponseRecorder } from "../../src/hooks/useResponseRecorder";
import { buildResponse } from "../../src/utils/studentResponses";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
}));

vi.mock("../../src/utils/amplifyClient", () => ({
  getAmplifyClient: () => ({
    models: { GradeResponse: { get: mocks.get } },
    mutations: { saveStudentResponse: mocks.save },
  }),
}));

describe("useResponseRecorder", () => {
  beforeEach(() => {
    mocks.get.mockReset().mockResolvedValue({ data: null });
    mocks.save.mockReset().mockResolvedValue({ data: true });
  });

  it("creates the grade before persisting the first response", async () => {
    const createGrade = vi.fn().mockResolvedValue({
      id: "grade-1",
      unitID: "unit-1",
    });
    const { result } = renderHook(() =>
      useResponseRecorder({
        grade: null,
        blockKey: "persisted-block-id",
        createGrade,
      }),
    );

    await act(async () => {
      await result.current(
        "question-1",
        buildResponse({ inputMethod: "text", text: "answer" }),
      );
    });

    expect(createGrade).toHaveBeenCalledWith(0, false, undefined, false);
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        gradeId: "grade-1",
        blockKey: "persisted-block-id",
        questionKey: "question-1",
      }),
    );
  });

  it("does not write when loading the prior response fails", async () => {
    mocks.get.mockResolvedValue({
      data: null,
      errors: [{ message: "Read failed" }],
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() =>
      useResponseRecorder({
        grade: { id: "grade-1", unitID: "unit-1" },
        blockKey: "persisted-block-id",
      }),
    );

    await act(async () => {
      await result.current(
        "question-1",
        buildResponse({ inputMethod: "text", text: "answer" }),
      );
    });

    expect(mocks.save).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      "[useResponseRecorder] Saving the answer failed:",
      expect.objectContaining({ message: "Read failed" }),
    );
    error.mockRestore();
  });
});
