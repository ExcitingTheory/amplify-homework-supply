import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EditorToastProvider,
  useEditorToast,
} from "../EditorToastContext";

function ToastControls() {
  const { showToast } = useEditorToast();

  return (
    <>
      <button
        onClick={() =>
          showToast({
            message: "Saved",
            severity: "success",
          })
        }
      >
        Show success
      </button>
      <button
        onClick={() =>
          showToast({
            message: "Could not save",
            severity: "error",
          })
        }
      >
        Show error
      </button>
      <button
        onClick={() =>
          showToast({
            message: "Undo available",
            severity: "info",
            autoHideDuration: null,
            action: (dismiss) => (
              <button onClick={dismiss}>Undo</button>
            ),
          })
        }
      >
        Show action
      </button>
      <button
        onClick={() =>
          showToast({
            message: "Temporary",
            severity: "warning",
            autoHideDuration: 1000,
          })
        }
      >
        Show temporary
      </button>
    </>
  );
}

function renderToastControls() {
  return render(
    <EditorToastProvider>
      <ToastControls />
    </EditorToastProvider>,
  );
}

describe("EditorToastProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stacks simultaneous notifications and preserves semantic severity", () => {
    renderToastControls();

    fireEvent.click(screen.getByRole("button", { name: "Show success" }));
    fireEvent.click(screen.getByRole("button", { name: "Show error" }));

    expect(screen.getByTestId("editor-toast-stack").children).toHaveLength(2);
    expect(screen.getByText("Saved").closest('[data-severity="success"]'))
      .not.toBeNull();
    expect(screen.getByText("Could not save").closest('[data-severity="error"]'))
      .not.toBeNull();
  });

  it("keeps action notifications visible until explicitly dismissed", () => {
    renderToastControls();
    fireEvent.click(screen.getByRole("button", { name: "Show action" }));

    expect(screen.getByText("Undo available")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByText("Undo available")).not.toBeInTheDocument();
  });

  it("automatically dismisses temporary notifications", () => {
    vi.useFakeTimers();
    renderToastControls();
    fireEvent.click(screen.getByRole("button", { name: "Show temporary" }));

    expect(screen.getByText("Temporary")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText("Temporary")).not.toBeInTheDocument();
  });
});
