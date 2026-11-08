import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  createSession: vi.fn(),
  updateSession: vi.fn(),
  listGrades: vi.fn(),
  createGrade: vi.fn(),
}));

vi.mock("../../utils/amplifyClient", () => ({
  getAmplifyClient: () => ({
    models: {
      PracticeSession: { create: mocks.createSession, update: mocks.updateSession },
      Grade: { listGradeByPracticeSessionID: mocks.listGrades, create: mocks.createGrade },
    },
  }),
}));
vi.mock("../../../app/actions/drill", () => ({ generatePracticeDrill: mocks.generate }));
vi.mock("../../../app/actions/gamification", () => ({ updateLearningMemory: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../utils/analytics", () => ({
  trackPracticeDrillStarted: vi.fn(),
  trackPracticeDrillCompleted: vi.fn(),
}));
vi.mock("./buildPracticeDrillFeedback", () => ({
  buildFeedbackData: () => ({ weakAreas: [], strongAreas: [], blockBreakdown: {} }),
  buildFeedbackMarkdown: () => "",
}));

import { usePracticeDrill } from "./usePracticeDrill";

describe("practice drill answers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generate.mockResolvedValue({ blocks: [{ type: "quiz" }] });
    mocks.createSession.mockResolvedValue({ data: { id: "session-1" } });
    mocks.updateSession.mockResolvedValue({ data: {} });
    mocks.listGrades.mockResolvedValue({ data: [] });
    mocks.createGrade.mockResolvedValue({ data: { id: "grade-1" } });
  });

  it("persists the latest answers and accuracy when completed immediately", async () => {
    const { result } = renderHook(() => usePracticeDrill());
    await act(async () => {
      await result.current.generateDrill("unit-1", {
        drillType: "mixed",
        count: 1,
        sources: { vocabulary: true, questions: false, text: false, documents: false },
      });
    });

    await act(async () => {
      result.current.saveAnswers(
        { block: { complete: true, accuracy: 1, userAnswer: "answer" } },
        { blocksCompleted: 1, accuracy: 100, complete: true },
      );
      await result.current.completeDrill();
    });

    expect(mocks.createGrade).toHaveBeenCalledWith(
      expect.objectContaining({
        practiceSessionID: "session-1",
        accuracy: 100,
        data: JSON.stringify({ block: { complete: true, accuracy: 1, userAnswer: "answer" } }),
      }),
    );
    expect(mocks.updateSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: "session-1", complete: true, accuracy: 100 }),
    );
  });

  it("reports a rejected grade creation without marking local state complete", async () => {
    const { result } = renderHook(() => usePracticeDrill());
    await act(async () => {
      await result.current.generateDrill("unit-1", {
        drillType: "mixed",
        count: 1,
        sources: { vocabulary: true, questions: false, text: false, documents: false },
      });
    });
    mocks.createGrade.mockResolvedValue({ errors: [{ message: "Grade save failed" }] });
    await act(async () => result.current.completeDrill());
    expect(result.current.error).toBe("Grade save failed");
    expect(result.current.session.complete).toBe(false);
  });

  it("does not reuse answers from the previous attempt after retrying missed blocks", async () => {
    const { result } = renderHook(() => usePracticeDrill());
    await act(async () => {
      await result.current.generateDrill("unit-1", {
        drillType: "mixed",
        count: 1,
        sources: { vocabulary: true, questions: false, text: false, documents: false },
      });
    });
    await act(async () => {
      result.current.saveAnswers(
        { block: { complete: true, accuracy: 50, userAnswer: "old answer" } },
        { blocksCompleted: 1, accuracy: 50, complete: true },
      );
    });
    act(() => result.current.retryMissed());
    await act(async () => result.current.completeDrill());
    expect(mocks.createGrade).toHaveBeenCalledWith(
      expect.objectContaining({ data: "{}", accuracy: 0 }),
    );
  });

  it("reports an answer save without an active session", () => {
    const { result } = renderHook(() => usePracticeDrill());
    act(() => result.current.saveAnswers({}, { blocksCompleted: 0, accuracy: 0, complete: false }));
    expect(result.current.error).toBe("Cannot save drill answers without a session");
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });
});
