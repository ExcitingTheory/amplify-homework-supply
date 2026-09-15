import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import HorizontalTimeline from "../HorizontalTimeline";
import TakeVersionHistory from "../TakeVersionHistory";

describe("RecordingStudio3 a11y and narrow-layout helpers", () => {
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
      <HorizontalTimeline
        scriptData={scriptData}
        selectedDialogueId="line-1"
        onSelectDialogue={() => {}}
        onPlay={() => {}}
        onStop={() => {}}
        onRecordingComplete={() => {}}
      />,
    );

    expect(screen.getByLabelText(/play/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/play/i)).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/play/i),
    );
  });

  it("provides a usable dialog toggle for version history", () => {
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

    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    expect(screen.getByText(/version history/i)).toBeInTheDocument();
  });
});
