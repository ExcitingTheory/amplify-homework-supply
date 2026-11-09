import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConnectionStatus } from "./ConnectionStatus";
import UnitContext, { type UnitContextValue } from "../../context/unitContext";

vi.mock("../../context/unitContext", async () => {
  const React = await import("react");
  return { default: React.createContext({}) };
});

describe("ConnectionStatus", () => {
  it.each([
    [false, false, "Offline"],
    [true, false, "Syncing..."],
    [true, true, "Connected"],
  ])("shows status without copying a code", (isConnected, isSynced, label) => {
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const context = {
      unit: null,
      name: "",
      rubric: [],
      grade: null,
      recentGrades: [],
      dictionary: {},
      files: {},
      questionBank: {},
      playlistUrls: {},
      description: "",
      editorStateRef: { current: null },
      editorSelectionRef: { current: null },
      editorRef: { current: null },
      versionRef: { current: 0 },
      unitRef: { current: null },
      finishedQuestions: 0,
      showUnitComplete: false,
      handleBeforeUnload: vi.fn(),
      setShowUnitComplete: vi.fn(),
      setFinishedQuestions: vi.fn(),
      saveName: vi.fn(),
      saveDescription: vi.fn(),
      handleDelete: vi.fn(),
      handleStatusChange: vi.fn(),
      saveEditorContent: vi.fn(),
      saveGrade: vi.fn().mockResolvedValue(undefined),
      createGrade: vi.fn().mockResolvedValue({ id: "grade-1", data: {} }),
      isSaving: false,
      beginSaving: vi.fn(),
      endSaving: vi.fn(),
      session: {},
      workbookEnabled: true,
      retryEnabled: false,
      workbook: {
        provider: {},
        workbookData: {},
        updateBlock: vi.fn(),
        activeTutors: [],
        connectedUsers: [],
        isConnected,
        isSynced,
        hasTutorPresent: false,
        getCompletionPercentage: vi.fn().mockReturnValue(0),
        getOverallAccuracy: vi.fn().mockReturnValue(0),
        getWorkbookData: vi.fn().mockReturnValue({}),
        disconnect: vi.fn(),
      },
      workbookStats: { completion: 0, accuracy: 0, totalBlocks: 0, completeBlocks: 0 },
      assignmentWindowReady: false,
    } satisfies UnitContextValue;
    render(
      <UnitContext.Provider value={context}>
        <ConnectionStatus showLabel={false} />
      </UnitContext.Provider>,
    );

    fireEvent.click(screen.getByLabelText(label));
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByRole("button")).toBeNull();
    vi.unstubAllGlobals();
  });
});
