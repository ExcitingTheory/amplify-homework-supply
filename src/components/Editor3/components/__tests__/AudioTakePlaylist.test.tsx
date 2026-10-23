import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AudioTakePlaylist from "../AudioTakePlaylist";

const takes = [
  { id: "take-1", duration: 4, createdAt: 1_000 },
  { id: "take-2", duration: 65, createdAt: 2_000 },
];

describe("AudioTakePlaylist", () => {
  it("labels the recorded takes list", () => {
    render(<AudioTakePlaylist takes={takes} onSelect={vi.fn()} />);
    expect(
      screen.getByRole("list", { name: "audioTakePlaylist.recordedTakes" }),
    ).toBeInTheDocument();
  });

  it("renders takes and marks the selected take", () => {
    render(
      <AudioTakePlaylist
        takes={takes}
        selectedTakeId="take-2"
        onSelect={vi.fn()}
      />,
    );

    const takeButtons = screen.getAllByRole("button", {
      name: /audioTakePlaylist\.takeLabel/,
    });
    expect(takeButtons).toHaveLength(2);
    expect(takeButtons[0]).not.toHaveClass("Mui-selected");
    expect(takeButtons[1]).toHaveClass("Mui-selected");
    expect(screen.getByText("1:05", { exact: false })).toBeInTheDocument();
  });

  it("selects a take from the playlist", () => {
    const onSelect = vi.fn();
    render(
      <AudioTakePlaylist
        takes={takes}
        selectedTakeId="take-1"
        onSelect={onSelect}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", {
        name: /audioTakePlaylist\.takeLabel/,
      })[1],
    );
    expect(onSelect).toHaveBeenCalledWith("take-2");
  });

  it("deletes a take without selecting it", () => {
    const onDelete = vi.fn();
    const onSelect = vi.fn();
    render(
      <AudioTakePlaylist
        takes={takes}
        onDelete={onDelete}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "audioTakePlaylist.deleteTake",
      })[0],
    );
    expect(onDelete).toHaveBeenCalledWith("take-1");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not render an empty playlist", () => {
    const { container } = render(
      <AudioTakePlaylist takes={[]} onSelect={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
