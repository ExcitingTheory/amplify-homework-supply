import { describe, expect, it } from "vitest";

import {
  filterPlaylistFiles,
  parsePlaylistFileDragData,
  PLAYLIST_FILE_DRAG_TYPE,
} from "../PlaylistFilePickerDialog";

const files = [
  { id: "audio-1", name: "Opening Theme", mimeType: "audio/mpeg" },
  { id: "video-1", name: "Lesson Demo", mimeType: "video/mp4" },
  { id: "image-1", name: "Poster", mimeType: "image/png" },
];

describe("filterPlaylistFiles", () => {
  it("limits playlist choices to audio and video", () => {
    expect(
      filterPlaylistFiles(files, "all", "").map((file) => file.id),
    ).toEqual(["audio-1", "video-1"]);
  });

  it("combines media type and text filters", () => {
    expect(filterPlaylistFiles(files, "video", "demo")).toEqual([files[1]]);
    expect(filterPlaylistFiles(files, "audio", "demo")).toEqual([]);
  });
});

describe("parsePlaylistFileDragData", () => {
  it("accepts non-empty string file IDs", () => {
    const dataTransfer = {
      getData: (type: string) =>
        type === PLAYLIST_FILE_DRAG_TYPE
          ? JSON.stringify({ fileIDs: ["audio-1", "", 42] })
          : "",
    } as DataTransfer;

    expect(parsePlaylistFileDragData(dataTransfer)).toEqual({
      fileIDs: ["audio-1"],
    });
  });

  it("rejects malformed drag data", () => {
    const dataTransfer = {
      getData: () => "not-json",
    } as unknown as DataTransfer;

    expect(parsePlaylistFileDragData(dataTransfer)).toBeNull();
  });
});
