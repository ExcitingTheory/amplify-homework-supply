import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExerciseResponsePanel from "../ExerciseResponsePanel";

describe("ExerciseResponsePanel", () => {
  it("keeps cancel, contextual controls, and submit in one action row", () => {
    render(
      <ExerciseResponsePanel
        centerControls={<span>Playback controls</span>}
        countdown={7}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      >
        <textarea aria-label="Answer" />
      </ExerciseResponsePanel>,
    );

    expect(
      screen.getByRole("button", { name: "Cancel submission" }),
    ).toBeEnabled();
    expect(screen.getByText("Playback controls")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit/ })).toBeEnabled();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("calls the submission controls", () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();

    render(
      <ExerciseResponsePanel
        countdown={10}
        onCancel={onCancel}
        onSubmit={onSubmit}
      >
        <div>Response surface</div>
      </ExerciseResponsePanel>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel submission" }));
    fireEvent.click(screen.getByRole("button", { name: /Submit/ }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("keeps cancel visible but disabled outside the grace period", () => {
    render(
      <ExerciseResponsePanel onSubmit={vi.fn()}>
        <div>Response surface</div>
      </ExerciseResponsePanel>,
    );

    expect(
      screen.getByRole("button", { name: "Cancel submission" }),
    ).toBeDisabled();
  });
});
