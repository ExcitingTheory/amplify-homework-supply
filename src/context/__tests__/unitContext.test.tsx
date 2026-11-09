import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  gradeCreate: vi.fn(),
  gradeUpdate: vi.fn(),
  gradeSubscribe: vi.fn(),
  evaluateSkills: vi.fn(),
  recordCompletion: vi.fn(),
  awardXP: vi.fn(),
  updateMemory: vi.fn(),
  summarize: vi.fn(),
  unitUpdate: vi.fn(),
  unitGet: vi.fn(),
  unitSubscribe: vi.fn(),
  saveDraft: vi.fn(),
  workbook: vi.fn(),
  unitWords: vi.fn(),
  unitFiles: vi.fn(),
  unitQuestions: vi.fn(),
  wordGet: vi.fn(),
  fileGet: vi.fn(),
  questionGet: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../../yjs/workbookHooks", () => ({
  useWorkbookCollaboration: mocks.workbook,
}));
vi.mock("../../utils/unitContentStorage", () => ({
  saveDraftContent: mocks.saveDraft,
  loadContent: vi.fn(),
}));
vi.mock("../../utils/moderateContent", () => ({
  moderateContent: vi.fn(async () => ({ flagged: false })),
}));
vi.mock("../../utils/analytics", () => ({
  trackWorkbookStarted: vi.fn(),
  trackGradeSubmitted: vi.fn(),
}));
vi.mock("../../../app/actions/gamification", () => ({
  awardXP: mocks.awardXP,
  recordGradeCompletion: mocks.recordCompletion,
  updateLearningMemory: mocks.updateMemory,
}));
vi.mock("../../../app/actions/feedback", () => ({
  summarizeFeedback: mocks.summarize,
}));
vi.mock("../../offline/saveGradeOffline", () => ({
  saveGradeOfflineAware: vi.fn(async (params, persist) => {
    await persist(params);
    return { synced: true, offlineQueued: false };
  }),
}));
vi.mock("../../utils/amplifyClient", () => ({
  getAmplifyClient: () => ({
    models: {
      Grade: {
        create: mocks.gradeCreate,
        update: mocks.gradeUpdate,
        observeQuery: () => ({ subscribe: mocks.gradeSubscribe }),
      },
      Assignment: { list: async () => ({ data: [] }) },
      PracticeSession: {
        observeQuery: () => ({ subscribe: () => ({ unsubscribe: vi.fn() }) }),
      },
      Unit: {
        update: mocks.unitUpdate,
        get: mocks.unitGet,
        onUpdate: () => ({ subscribe: mocks.unitSubscribe }),
      },
      UnitWord: { list: mocks.unitWords },
      UnitFile: { list: mocks.unitFiles },
      QuestionUnit: { list: mocks.unitQuestions },
      Word: { get: mocks.wordGet },
      File: { get: mocks.fileGet },
      Question: { get: mocks.questionGet },
    },
    mutations: { evaluateSkillsForUnit: mocks.evaluateSkills },
  }),
}));

import AuthContext from "../authContext";
import UnitContext, { UnitProvider } from "../unitContext";
import { WorkbookCollaborationProvider } from "../../yjs/WorkbookCollaborationProvider";

const auth = {
  user: { attributes: { sub: "student-1" } },
  session: { groups: ["Learners"] },
  isLoading: false,
};
const completedData = { "block-1": { complete: true, accuracy: 1 } };
const grade = {
  id: "grade-1",
  unitID: "unit-1",
  complete: false,
  data: "{}",
  _version: 1,
  createdAt: "2026-10-28T15:00:00Z",
};

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={auth}>
      <UnitProvider id="unit-1">{children}</UnitProvider>
    </AuthContext.Provider>
  );
}

function emitGrades(items: Record<string, unknown>[]) {
  act(() =>
    mocks.gradeSubscribe.mock.calls.at(-1)?.[0].next({ items, isSynced: true }),
  );
}

async function setup() {
  const hook = renderHook(() => React.useContext(UnitContext), { wrapper });
  await waitFor(() => expect(hook.result.current.rubric).toEqual(["block-1"]));
  return hook;
}

describe("UnitProvider attempt lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.unitWords.mockResolvedValue({ data: [] });
    mocks.unitFiles.mockResolvedValue({ data: [] });
    mocks.unitQuestions.mockResolvedValue({ data: [] });
    mocks.workbook.mockReturnValue(null);
    mocks.gradeSubscribe.mockReturnValue({ unsubscribe: vi.fn() });
    mocks.gradeCreate.mockResolvedValue({ data: grade });
    mocks.gradeUpdate.mockResolvedValue({ data: grade });
    mocks.evaluateSkills.mockResolvedValue({ data: {} });
    mocks.recordCompletion.mockResolvedValue({});
    mocks.awardXP.mockResolvedValue({});
    mocks.updateMemory.mockResolvedValue({});
    mocks.summarize.mockResolvedValue('{"overall":"Well done"}');
    mocks.unitUpdate.mockImplementation(async (input) => ({ data: { ...input, _version: input._version + 1 } }));
    mocks.unitSubscribe.mockReturnValue({ unsubscribe: vi.fn() });
    mocks.unitGet.mockResolvedValue({
      data: {
        id: "unit-1", owner: "instructor-1", _version: 1,
        data: JSON.stringify({ root: { children: [{ type: "custom-ai", key: "block-1" }] } }),
      },
    });
  });

  it("loads unit resources from later pages, including after an empty filtered page", async () => {
    mocks.unitWords
      .mockResolvedValueOnce({ data: [{ wordID: "nucleus" }], nextToken: "words-2" })
      .mockResolvedValueOnce({ data: [], nextToken: "words-3" })
      .mockResolvedValueOnce({ data: [{ wordID: "ribosomes" }], nextToken: null });
    mocks.unitFiles
      .mockResolvedValueOnce({ data: [], nextToken: "files-2" })
      .mockResolvedValueOnce({ data: [{ fileID: "pdf" }], nextToken: null });
    mocks.unitQuestions
      .mockResolvedValueOnce({ data: [], nextToken: "questions-2" })
      .mockResolvedValueOnce({ data: [{ questionID: "question" }], nextToken: null });
    mocks.wordGet.mockImplementation(async ({ id }) => ({ data: { id } }));
    mocks.fileGet.mockResolvedValue({ data: { id: "pdf" } });
    mocks.questionGet.mockResolvedValue({ data: { id: "question" } });

    const { result } = await setup();
    expect(Object.keys(result.current.dictionary)).toEqual(["nucleus", "ribosomes"]);
    expect(Object.keys(result.current.files)).toEqual(["pdf"]);
    expect(Object.keys(result.current.questionBank)).toEqual(["question"]);
    expect(mocks.unitWords).toHaveBeenLastCalledWith({
      filter: { unitID: { eq: "unit-1" }, deletedAt: { attributeExists: false } },
      nextToken: "words-3", selectionSet: ["wordID"],
    });
  });

  it("loads learner resources when join metadata is readable only by the owner", async () => {
    for (const [list, field, id] of [
      [mocks.unitWords, "wordID", "nucleus"],
      [mocks.unitFiles, "fileID", "pdf"],
      [mocks.unitQuestions, "questionID", "question"],
    ] as const) {
      list.mockImplementation(async ({ selectionSet }: { selectionSet?: string[] }) =>
        !selectionSet?.length || selectionSet.some((selected) => selected !== field)
          ? { errors: [{ message: "Not Authorized to access join metadata" }] }
          : { data: [{ [field]: id }] },
      );
    }
    mocks.wordGet.mockResolvedValue({ data: { id: "nucleus" } });
    mocks.fileGet.mockResolvedValue({ data: { id: "pdf" } });
    mocks.questionGet.mockResolvedValue({ data: { id: "question" } });

    const { result } = await setup();
    expect(Object.keys(result.current.dictionary)).toEqual(["nucleus"]);
    expect(Object.keys(result.current.files)).toEqual(["pdf"]);
    expect(Object.keys(result.current.questionBank)).toEqual(["question"]);
  });

  it("reports a later-page failure instead of exposing an incomplete dictionary", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.unitWords
        .mockResolvedValueOnce({ data: [{ wordID: "nucleus" }], nextToken: "words-2" })
        .mockResolvedValueOnce({ errors: [{ message: "Unauthorized" }] });
      renderHook(() => React.useContext(UnitContext), { wrapper });
      await waitFor(() => expect(error).toHaveBeenCalledWith(
        "[UnitContext] Unit.get error:",
        expect.objectContaining({ message: "Could not load unit words: Unauthorized" }),
      ));
      expect(mocks.wordGet).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("does not save remote workbook updates as student answers", async () => {
    await setup();
    emitGrades([grade]);
    const options = mocks.workbook.mock.calls.at(-1)?.[0];
    expect(options).toBeTruthy();

    vi.useFakeTimers();
    const provider = new WorkbookCollaborationProvider({
      ...options,
      connect: false,
      persistence: false,
    });
    const onSync = (event: Event) => {
      const { data, feedback } = (event as CustomEvent).detail;
      options.onSyncToGrade?.(data, feedback);
    };
    window.addEventListener("workbook-sync", onSync);
    try {
      provider.updateBlock("block-1", { userAnswer: "remote answer" });
      await act(async () => vi.advanceTimersByTimeAsync(3001));
      expect(mocks.gradeUpdate).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("workbook-sync", onSync);
      provider.destroy();
      vi.useRealTimers();
    }
  });

  it("hydrates sparse backend notifications before replacing unit metadata", async () => {
    const { result } = await setup();
    mocks.unitGet.mockResolvedValueOnce({
      data: { ...result.current.unit, name: "Biology lesson", description: "Explore cells", _version: 2 },
    });
    await act(async () => {
      await mocks.unitSubscribe.mock.calls.at(-1)?.[0].next({
        id: "unit-1", name: null, description: null, _version: 2,
      });
    });
    expect(result.current.unit.name).toBe("Biology lesson");
    expect(result.current.unit.description).toBe("Explore cells");
    expect(result.current.rubric).toEqual(["block-1"]);
  });

  it("keeps saved metadata in state and the current-unit ref without waiting for subscription echoes", async () => {
    mocks.unitUpdate.mockImplementation(async (input) => ({
      data: { id: input.id, name: null, description: null, _version: input._version + 1 },
    }));
    const { result } = await setup();
    const content = result.current.unit.data;
    await act(async () => { await result.current.saveName("New biology lesson"); });
    expect(result.current.unit.name).toBe("New biology lesson");
    await act(async () => { await result.current.saveDescription("Explore cells"); });
    expect(result.current.unit.description).toBe("Explore cells");
    expect(result.current.unit.name).toBe("New biology lesson");
    expect(result.current.unit.data).toBe(content);
    expect(mocks.unitUpdate).toHaveBeenLastCalledWith({
      id: "unit-1", description: "Explore cells", _version: 2,
    });
  });

    it("preserves unsaved editor state when a metadata-only refresh has no content", async () => {
      const { result } = await setup();
      const unsaved = { root: { children: [{ type: "custom-answer", ids: ["question-1"], allowedInput: ["audio"], promptMethod: ["text"] }] } };
      result.current.editorStateRef.current = unsaved;
      mocks.unitGet.mockResolvedValueOnce({
        data: { id: "unit-1", owner: "instructor-1", name: "Updated", _version: 2 },
      });
      await act(async () => {
        await mocks.unitSubscribe.mock.calls.at(-1)?.[0].next({ id: "unit-1", _version: 2 });
      });
      expect(result.current.editorStateRef.current).toBe(unsaved);
      expect(result.current.unit.data).toBeTruthy();
    });

    it("manual save serializes the live Lexical state even when the cached ref is missing", async () => {
      const { result } = await setup();
      const latest = { root: { children: [{ type: "custom-answer", ids: ["question-1"], allowedInput: ["writing"], promptMethod: ["text"] }] } };
      result.current.editorStateRef.current = undefined;
      result.current.editorRef.current = { getEditorState: () => ({ toJSON: () => latest }) };
      await act(async () => { await result.current.saveEditorContent(); });
      expect(mocks.saveDraft).toHaveBeenCalledWith(undefined, "unit-1", JSON.stringify(latest));
    });

    it("counts graded decorators nested inside paragraphs before completing the workbook", async () => {
      mocks.unitGet.mockResolvedValue({
        data: {
          id: "unit-1", _version: 1,
          data: JSON.stringify({ root: { children: [
            { type: "paragraph", children: [{ type: "custom-ai", key: "block-1" }] },
            { type: "paragraph", children: [{ type: "custom-answer", key: "audio-1" }] },
            { type: "paragraph", children: [{ type: "custom-answer", key: "drawing-1" }] },
          ] } }),
        },
      });
      const { result } = renderHook(() => React.useContext(UnitContext), { wrapper });
      await waitFor(() => expect(result.current.rubric).toEqual(["block-1", "audio-1", "drawing-1"]));
      emitGrades([grade]);
      await act(async () => { await result.current.saveGrade(completedData); });
      expect(result.current.showUnitComplete).toBe(false);
    });

  it("shares an in-flight grade creation between concurrent saves", async () => {
    let resolveCreate!: (result: { data: typeof grade }) => void;
    mocks.gradeCreate.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const { result } = await setup();
    let saves!: Promise<unknown[]>;
    await act(async () => {
      saves = Promise.all([
        result.current.saveGrade(completedData),
        result.current.saveGrade(completedData),
      ]);
      await Promise.resolve();
    });
    await act(async () => {
      resolveCreate({ data: grade });
      await saves;
    });
    expect(mocks.gradeCreate).toHaveBeenCalledTimes(1);
    expect(result.current.grade.id).toBe("grade-1");
    expect(mocks.recordCompletion).toHaveBeenCalledTimes(1);
    expect(mocks.evaluateSkills).toHaveBeenCalledTimes(1);
  });

  it("retains the completed attempt and its answers after the subscription echo", async () => {
    const { result } = await setup();
    emitGrades([grade]);
    await act(async () => {
      await result.current.saveGrade(completedData);
    });
    const completedGrade = {
      ...grade,
      complete: true,
      accuracy: 100,
      data: JSON.stringify(completedData),
      _version: 2,
    };
    emitGrades([completedGrade]);
    expect(result.current.grade.id).toBe("grade-1");
    expect(result.current.grade.data).toEqual(completedData);
    expect(result.current.finishedQuestions).toBe(1);
    expect(result.current.showUnitComplete).toBe(true);
    expect(result.current.recentGrades).toHaveLength(1);
    await act(async () => {
      await result.current.saveGrade(completedData);
    });
    expect(mocks.gradeCreate).not.toHaveBeenCalled();
    expect(mocks.recordCompletion).toHaveBeenCalledTimes(1);
  });

  it("loads completed answers without creating a replacement attempt", async () => {
    const { result } = await setup();
    emitGrades([
      { ...grade, complete: true, data: JSON.stringify(completedData) },
    ]);
    expect(result.current.grade.id).toBe("grade-1");
    expect(result.current.grade.data).toEqual(completedData);
    expect(result.current.showUnitComplete).toBe(true);
    expect(mocks.gradeCreate).not.toHaveBeenCalled();
  });

  it("starts a fresh attempt only on an explicit retry and immediately exposes its ID", async () => {
    const { result } = await setup();
    emitGrades([
      { ...grade, complete: true, data: JSON.stringify(completedData) },
    ]);
    mocks.gradeCreate.mockResolvedValueOnce({
      data: { ...grade, id: "grade-2" },
    });
    await act(async () => {
      await result.current.createGrade(0, false);
      await result.current.saveGrade(completedData);
    });
    expect(mocks.gradeCreate).toHaveBeenCalledTimes(1);
    expect(mocks.gradeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "grade-2" }),
    );
    expect(result.current.grade.id).toBe("grade-2");
  });

  it("does not regress a local completion on an unversioned incomplete echo", async () => {
    const { result } = await setup();
    emitGrades([{ ...grade, _version: null }]);
    await act(async () => {
      await result.current.saveGrade(completedData);
    });
    emitGrades([{ ...grade, _version: null }]);
    expect(result.current.grade.complete).toBe(true);
    expect(result.current.grade.data).toEqual(completedData);
  });

  it("keeps a just-created retry when a snapshot has not caught up", async () => {
    const { result } = await setup();
    const completedGrade = {
      ...grade,
      complete: true,
      data: JSON.stringify(completedData),
    };
    emitGrades([completedGrade]);
    mocks.gradeCreate.mockResolvedValueOnce({
      data: { ...grade, id: "grade-2" },
    });
    await act(async () => {
      await result.current.createGrade(0, false);
      result.current.setShowUnitComplete(false);
    });
    emitGrades([completedGrade]);
    expect(result.current.grade.id).toBe("grade-2");
    expect(result.current.showUnitComplete).toBe(false);
  });

  it("keeps the active completion rather than switching to an abandoned attempt", async () => {
    const { result } = await setup();
    const abandoned = {
      ...grade,
      id: "old-grade",
      createdAt: "2026-10-27T15:00:00Z",
    };
    emitGrades([abandoned, grade]);
    expect(result.current.grade.id).toBe("grade-1");
    emitGrades([
      abandoned,
      {
        ...grade,
        complete: true,
        _version: 2,
        data: JSON.stringify(completedData),
      },
    ]);
    expect(result.current.grade.id).toBe("grade-1");
    expect(result.current.showUnitComplete).toBe(true);
  });

  it("merges concurrent block saves without losing earlier answers", async () => {
    const { result } = await setup();
    emitGrades([grade]);
    await act(async () => {
      await Promise.all([
        result.current.saveGrade({
          draft: { complete: false, userAnswer: "First answer" },
        }),
        result.current.saveGrade(completedData),
      ]);
    });
    expect(result.current.grade.data).toEqual({
      draft: { complete: false, userAnswer: "First answer" },
      ...completedData,
    });
    expect(mocks.gradeCreate).not.toHaveBeenCalled();
  });

  it("processes history additions and deletions even when the active version is unchanged", async () => {
    const { result } = await setup();
    emitGrades([grade]);
    const previousAttempt = { ...grade, id: "previous-grade", complete: true };
    emitGrades([grade, previousAttempt]);
    expect(result.current.recentGrades).toHaveLength(1);
    emitGrades([grade]);
    expect(result.current.recentGrades).toHaveLength(0);
  });
});
