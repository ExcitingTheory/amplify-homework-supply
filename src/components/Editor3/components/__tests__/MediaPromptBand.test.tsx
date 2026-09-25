import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MediaPromptBand from "../MediaPromptBand";

describe("MediaPromptBand", () => {
  it("renders the mandatory title and live time rows", () => {
    render(
      <MediaPromptBand
        elapsedTime="00:01:23"
        remainingTime="-00:02:34"
        title="Listening prompt"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Listening prompt" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Media timecodes")).toHaveTextContent(
      "00:01:23",
    );
    expect(screen.getByLabelText("Media timecodes")).toHaveTextContent(
      "-00:02:34",
    );
  });

  it("reserves a separate body row for prompt media", () => {
    render(
      <MediaPromptBand
        elapsedTime="00:00:00"
        remainingTime="-00:00:00"
        title="Image prompt"
      >
        <img
          alt="Prompt reference"
          src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
        />
      </MediaPromptBand>,
    );

    expect(screen.getByTestId("media-prompt-body")).toContainElement(
      screen.getByRole("img", { name: "Prompt reference" }),
    );
  });
});
