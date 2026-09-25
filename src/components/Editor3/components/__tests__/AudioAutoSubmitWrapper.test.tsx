import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AudioAutoSubmitWrapper from "../AudioAutoSubmitWrapper";

interface ProbeProps {
  complete: () => void;
  onCancelSubmission?: () => void;
  onRequestSubmission?: (submit: () => void) => void;
  submissionCountdown?: number | null;
}

function Probe({
  complete,
  onCancelSubmission,
  onRequestSubmission,
  submissionCountdown,
}: ProbeProps) {
  const deferredSubmit = vi.fn();
  return (
    <div>
      <button onClick={complete}>Complete recording</button>
      <button onClick={() => onRequestSubmission?.(deferredSubmit)}>
        Request submission
      </button>
      <button onClick={onCancelSubmission}>Cancel submission</button>
      <span>{submissionCountdown ?? "idle"}</span>
    </div>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("AudioAutoSubmitWrapper", () => {
  it("cancels a pending recording callback", () => {
    const onRecordingComplete = vi.fn();

    render(
      <AudioAutoSubmitWrapper>
        {({ wrapOnRecordingComplete }: any) => (
          <Probe complete={wrapOnRecordingComplete(onRecordingComplete)} />
        )}
      </AudioAutoSubmitWrapper>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete recording" }));
    expect(screen.getByText("10")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel submission" }));
    expect(screen.getByText("idle")).toBeInTheDocument();
    expect(onRecordingComplete).not.toHaveBeenCalled();
  });

  it("submits once when the grace period expires", () => {
    vi.useFakeTimers();
    const onRecordingComplete = vi.fn();

    render(
      <AudioAutoSubmitWrapper gracePeriod={2}>
        {({ wrapOnRecordingComplete }: any) => (
          <Probe complete={wrapOnRecordingComplete(onRecordingComplete)} />
        )}
      </AudioAutoSubmitWrapper>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete recording" }));
    act(() => vi.advanceTimersByTime(2000));

    expect(onRecordingComplete).toHaveBeenCalledOnce();
    expect(screen.getByText("idle")).toBeInTheDocument();
  });

  it("starts a cancellable countdown for an internal submit function", () => {
    render(
      <AudioAutoSubmitWrapper>
        {() => <Probe complete={vi.fn()} />}
      </AudioAutoSubmitWrapper>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Request submission" }));
    expect(screen.getByText("10")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel submission" }));
    expect(screen.getByText("idle")).toBeInTheDocument();
  });
});
