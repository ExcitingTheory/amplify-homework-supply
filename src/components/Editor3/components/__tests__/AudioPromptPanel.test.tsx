import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AudioPromptPanel from "../AudioPromptPanel";

const play = vi.fn();
const pause = vi.fn();

vi.mock("../../context/AudioPlayerContext", () => ({
  useAudioPlayer: () => ({
    currentSource: null,
    isPlaying: false,
    pause,
    play,
  }),
}));

vi.mock("../../../../utils/getCachedUrl", () => ({
  default: vi.fn(async (path: string) => path),
}));

vi.mock("../StaticWaveform", () => ({
  default: ({ height, width }: { height: number; width: number }) => (
    <div
      data-testid="static-waveform"
      data-height={height}
      data-width={width}
    />
  ),
}));

describe("AudioPromptPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a full-width square-edged prompt and definition band", () => {
    render(
      <AudioPromptPanel
        definition="A formal greeting used in the evening."
        prompt="Konbanwa"
        width={480}
      />,
    );

    const panel = screen.getByTestId("audio-prompt-panel");
    expect(panel).toHaveStyle({ width: "100%", borderRadius: "0" });
    expect(screen.getByText("Konbanwa")).toBeInTheDocument();
    expect(
      screen.getByText("A formal greeting used in the evening."),
    ).toBeInTheDocument();
  });

  it("renders prompt audio as a static waveform with a play overlay", async () => {
    render(
      <AudioPromptPanel
        audioUrl="https://example.com/prompt.mp3"
        prompt="Listen and repeat"
        width={480}
      />,
    );

    expect(screen.getByTestId("static-waveform")).toHaveAttribute(
      "data-width",
      "480",
    );
    const playButton = await screen.findByRole("button", {
      name: "Play prompt audio",
    });
    await waitFor(() => expect(playButton).toBeEnabled());
    fireEvent.click(playButton);

    expect(play).toHaveBeenCalledWith("https://example.com/prompt.mp3");
  });
});
