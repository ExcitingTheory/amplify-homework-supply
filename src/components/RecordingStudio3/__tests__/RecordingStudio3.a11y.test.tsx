import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { beforeEach, afterEach, vi } from "vitest";
import { AudioPlayerProvider } from "../../Editor3/context/AudioPlayerContext";
import HorizontalTimeline from "../HorizontalTimeline";
import TakeVersionHistory from "../TakeVersionHistory";

describe("RecordingStudio3 a11y and narrow-layout helpers", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillStyle: "",
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      closePath: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const scriptData = {
    dialogue: [
      {
        id: "line-1",
        speaker: "speaker-1",
        text: "Test line",
        timing: { start: 0, end: 6 },
        activeTakeIndex: 0,
        takes: [{ audioPath: "audio-1.mp3" }],
      },
    ],
    speakers: {
      "speaker-1": { name: "Narrator" },
    },
  };

  it("adds accessible labels to timeline controls", () => {
    render(
      <AudioPlayerProvider>
        <HorizontalTimeline
          scriptData={scriptData}
          selectedDialogueId="line-1"
          onSelectDialogue={() => {}}
          onPlay={() => {}}
          onStop={() => {}}
          onRecordingComplete={() => {}}
        />
      </AudioPlayerProvider>,
    );

    const playButton = screen.getByRole("button", {
      name: /recordingStudio3\.play|play timeline|stop playback/i,
    });
    expect(playButton).toBeInTheDocument();
    expect(playButton).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/play|stop/i),
    );
  });

  it("provides a usable dialog toggle for version history", async () => {
    render(
      <TakeVersionHistory
        identityId="user-123"
        dialogueId="line-1"
        slotId="slot-1"
        currentVersion="audio-1.mp3"
        currentAudioPath="audio-1.mp3"
        takeType="human"
        onRestore={() => {}}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: /recordingStudio3\.openVersionHistory|open version history/i,
    });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(
        screen.getByText(/recordingStudio3\.versionHistory|version history/i),
      ).toBeInTheDocument();
    });
  });
});
