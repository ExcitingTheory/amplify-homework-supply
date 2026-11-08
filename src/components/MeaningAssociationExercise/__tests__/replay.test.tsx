import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, fallback?: string) =>
    typeof fallback === "string" ? fallback : key,
}));

vi.mock("../Easy", () => ({
  Easy: ({ readOnly }: { readOnly: boolean }) => (
    <div data-testid="easy-mode" data-readonly={String(readOnly)} />
  ),
}));

vi.mock("../Hard", () => ({
  Hard: ({ readOnly }: { readOnly: boolean }) => (
    <div data-testid="hard-mode" data-readonly={String(readOnly)} />
  ),
}));

vi.mock("../Learn", () => ({
  Learn: ({ readOnly }: { readOnly: boolean }) => (
    <div data-testid="learn-mode" data-readonly={String(readOnly)} />
  ),
}));

vi.mock("../DndWrapper", () => ({
  DndWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../../Editor3/components/ExerciseBlockCard", () => ({
  ExerciseBlockCard: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../../Editor3/components/ExerciseProgressMeters", () => ({
  ExerciseProgressMeters: () => null,
}));

import MeaningAssociationExercise from "../index";
import UnitContext from "../../../context/unitContext";

const completedGrade = {
  id: "grade-1",
  data: JSON.stringify({
    "meaning-block": {
      complete: true,
      tabIndex: "learn",
      learn: { complete: true, percentComplete: 1 },
      easy: { complete: true, percentComplete: 1 },
      hard: { complete: true, percentComplete: 1 },
    },
  }),
};

function renderCompletedExercise(
  retryEnabled: boolean,
  saveGrade = vi.fn(async () => {}),
) {
  function Exercise() {
    const [grade, setGrade] = React.useState(completedGrade);
    const handleSave = async (data: Record<string, unknown>) => {
      await saveGrade(data);
      setGrade((current) => ({
        ...current,
        data: JSON.stringify({
          ...JSON.parse(current.data),
          ...data,
        }),
      }));
    };

    return (
      <UnitContext.Provider
        value={{ grade, retryEnabled, saveGrade: handleSave }}
      >
        <MeaningAssociationExercise nodeKey="meaning-block" wordIDs={[]} />
      </UnitContext.Provider>
    );
  }

  return {
    saveGrade,
    ...render(<Exercise />),
  };
}

describe("meaning association replay", () => {
  it("keeps every completed mode read-only when replay is disabled", () => {
    renderCompletedExercise(false);

    for (const mode of ["learn-mode", "easy-mode", "hard-mode"]) {
      expect(screen.getByTestId(mode)).toHaveAttribute("data-readonly", "true");
    }
    expect(
      screen.queryByRole("button", { name: "Replay" }),
    ).not.toBeInTheDocument();
  });

  it("resets the completed block and unlocks its modes", async () => {
    const saveGrade = vi.fn(async () => {});
    renderCompletedExercise(true, saveGrade);

    fireEvent.click(screen.getByRole("button", { name: "Replay" }));

    await waitFor(() =>
      expect(saveGrade).toHaveBeenCalledWith({
        "meaning-block": { tabIndex: "learn" },
      }),
    );
    await waitFor(() => {
      for (const mode of ["learn-mode", "easy-mode", "hard-mode"]) {
        expect(screen.getByTestId(mode)).toHaveAttribute(
          "data-readonly",
          "false",
        );
      }
    });
  });
});
