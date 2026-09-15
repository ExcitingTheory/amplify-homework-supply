import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ConflictResolutionDialog, {
  GradeConflictDetails,
} from "../../src/components/ConflictResolutionDialog";

describe("ConflictResolutionDialog", () => {
  const sampleConflict: GradeConflictDetails = {
    gradeId: "grade-12345678-abcd",
    localVersion: 2,
    serverVersion: 3,
    localData: {
      "block-1": {
        userAnswer: "Offline student answer",
        accuracy: 90,
        complete: true,
        gradedOffline: true,
        prompt: "What is photosynthesis?",
      },
    },
    serverData: {
      "block-1": {
        userAnswer: "Server answer",
        accuracy: 70,
        complete: true,
        prompt: "What is photosynthesis?",
      },
    },
    requiresInstructorReview: true,
  };

  it("renders when open with conflict details", () => {
    render(
      <ConflictResolutionDialog
        open={true}
        conflict={sampleConflict}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />,
    );

    expect(screen.getByText("Sync Conflict Resolution")).toBeInTheDocument();
    expect(screen.getByText(/Offline student answer/)).toBeInTheDocument();
    expect(screen.getByText(/Server answer/)).toBeInTheDocument();
    expect(screen.getByText(/Score diff: 20 pts/)).toBeInTheDocument();
  });

  it("does not render when conflict is null", () => {
    const { container } = render(
      <ConflictResolutionDialog
        open={true}
        conflict={null}
        onClose={vi.fn()}
        onResolve={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("allows switching resolution strategy and calling onResolve", async () => {
    const onResolve = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ConflictResolutionDialog
        open={true}
        conflict={sampleConflict}
        onClose={onClose}
        onResolve={onResolve}
      />,
    );

    // Click "Keep Local Answers" radio option
    const localWinsRadio = screen.getByLabelText(/Keep Local Answers/i);
    fireEvent.click(localWinsRadio);

    // Click "Apply & Sync" button
    const applyButton = screen.getByTestId("apply-resolution-button");
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(onResolve).toHaveBeenCalledWith(
        expect.objectContaining({
          strategy: "local-wins",
          mergedData: expect.objectContaining({
            "block-1": expect.objectContaining({
              userAnswer: "Offline student answer",
            }),
          }),
        }),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();

    render(
      <ConflictResolutionDialog
        open={true}
        conflict={sampleConflict}
        onClose={onClose}
        onResolve={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
