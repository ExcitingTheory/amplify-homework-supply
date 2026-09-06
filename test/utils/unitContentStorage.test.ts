import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock aws-amplify/storage
const mockUploadData = vi.fn();
const mockDownloadData = vi.fn();
const mockList = vi.fn();

vi.mock("aws-amplify/storage", () => ({
  uploadData: (...args: any[]) => mockUploadData(...args),
  downloadData: (...args: any[]) => mockDownloadData(...args),
  list: (...args: any[]) => mockList(...args),
}));

import {
  saveDraftContent,
  saveYjsSnapshot,
  loadYjsSnapshot,
  publishContent,
  loadContent,
  loadHistoryVersion,
  restoreVersion,
  listVersionHistory,
} from "@/utils/unitContentStorage";

const TEST_IDENTITY_ID = "us-east-1:abc123";
const TEST_UNIT_ID = "unit-456";

describe("unitContentStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveDraftContent", () => {
    it("uploads content to the correct protected path", async () => {
      mockUploadData.mockReturnValue({ result: Promise.resolve({}) });

      await saveDraftContent(TEST_IDENTITY_ID, TEST_UNIT_ID, '{"root":{}}');

      expect(mockUploadData).toHaveBeenCalledWith({
        path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/draft.json`,
        data: '{"root":{}}',
        options: { contentType: "application/json" },
      });
    });
  });

  describe("saveYjsSnapshot", () => {
    it("uploads binary data to the correct protected path", async () => {
      mockUploadData.mockReturnValue({ result: Promise.resolve({}) });
      const snapshot = new Uint8Array([1, 2, 3, 4]);

      await saveYjsSnapshot(TEST_IDENTITY_ID, TEST_UNIT_ID, snapshot);

      expect(mockUploadData).toHaveBeenCalledWith({
        path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/yjs-snapshot.bin`,
        data: expect.any(Blob),
        options: { contentType: "application/octet-stream" },
      });
    });
  });

  describe("loadYjsSnapshot", () => {
    it("returns Uint8Array when snapshot exists", async () => {
      const testData = new Uint8Array([10, 20, 30]);
      const mockBlob = new Blob([testData]);
      mockList.mockResolvedValue({
        items: [
          {
            path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/yjs-snapshot.bin`,
          },
        ],
      });
      mockDownloadData.mockReturnValue({
        result: Promise.resolve({
          body: { blob: () => Promise.resolve(mockBlob) },
        }),
      });

      const result = await loadYjsSnapshot(TEST_IDENTITY_ID, TEST_UNIT_ID);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(testData);
      expect(mockList).toHaveBeenCalledWith({
        path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/yjs-snapshot.bin`,
      });
      expect(mockDownloadData).toHaveBeenCalledWith({
        path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/yjs-snapshot.bin`,
      });
    });

    it("returns null when snapshot does not exist", async () => {
      mockList.mockResolvedValue({ items: [] });

      const result = await loadYjsSnapshot(TEST_IDENTITY_ID, TEST_UNIT_ID);
      expect(result).toBeNull();
      expect(mockDownloadData).not.toHaveBeenCalled();
    });
  });

  describe("loadContent", () => {
    it("loads draft from protected path for instructors", async () => {
      mockDownloadData.mockReturnValue({
        result: Promise.resolve({
          body: { text: () => Promise.resolve('{"root":{}}') },
        }),
      });

      const result = await loadContent(TEST_IDENTITY_ID, TEST_UNIT_ID, "draft");

      expect(result).toBe('{"root":{}}');
      expect(mockDownloadData).toHaveBeenCalledWith({
        path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/draft.json`,
      });
    });

    it("loads published from protected path for learners", async () => {
      mockDownloadData.mockReturnValue({
        result: Promise.resolve({
          body: { text: () => Promise.resolve('{"root":{}}') },
        }),
      });

      const result = await loadContent(
        TEST_IDENTITY_ID,
        TEST_UNIT_ID,
        "published",
      );

      expect(result).toBe('{"root":{}}');
      expect(mockDownloadData).toHaveBeenCalledWith({
        path: `protected/units/${TEST_UNIT_ID}/published.json`,
      });
    });

    it("returns null when content does not exist", async () => {
      mockDownloadData.mockReturnValue({
        result: Promise.reject(new Error("NoSuchKey")),
      });

      const result = await loadContent(TEST_IDENTITY_ID, TEST_UNIT_ID, "draft");
      expect(result).toBeNull();
    });
  });

  describe("publishContent", () => {
    it("reads draft and writes to published + history in parallel", async () => {
      mockDownloadData.mockReturnValue({
        result: Promise.resolve({
          body: { text: () => Promise.resolve('{"root":{"children":[]}}') },
        }),
      });
      mockUploadData.mockReturnValue({ result: Promise.resolve({}) });

      await publishContent(TEST_IDENTITY_ID, TEST_UNIT_ID, 5);

      // Should download draft
      expect(mockDownloadData).toHaveBeenCalledWith({
        path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/draft.json`,
      });

      // Should upload only to history (protected/) — published.json is written by the publishUnit Lambda
      expect(mockUploadData).toHaveBeenCalledTimes(1);
      expect(mockUploadData).toHaveBeenCalledWith(
        expect.objectContaining({
          path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/history/v5.json`,
          data: '{"root":{"children":[]}}',
        }),
      );
    });
  });

  describe("loadHistoryVersion", () => {
    it("loads a specific version from history path", async () => {
      mockDownloadData.mockReturnValue({
        result: Promise.resolve({
          body: { text: () => Promise.resolve('{"version":3}') },
        }),
      });

      const result = await loadHistoryVersion(
        TEST_IDENTITY_ID,
        TEST_UNIT_ID,
        3,
      );

      expect(result).toBe('{"version":3}');
      expect(mockDownloadData).toHaveBeenCalledWith({
        path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/history/v3.json`,
      });
    });

    it("returns null for non-existent version", async () => {
      mockDownloadData.mockReturnValue({
        result: Promise.reject(new Error("NoSuchKey")),
      });

      const result = await loadHistoryVersion(
        TEST_IDENTITY_ID,
        TEST_UNIT_ID,
        99,
      );
      expect(result).toBeNull();
    });
  });

  describe("restoreVersion", () => {
    it("copies history version content to draft", async () => {
      mockDownloadData.mockReturnValue({
        result: Promise.resolve({
          body: { text: () => Promise.resolve('{"restored":true}') },
        }),
      });
      mockUploadData.mockReturnValue({ result: Promise.resolve({}) });

      const result = await restoreVersion(TEST_IDENTITY_ID, TEST_UNIT_ID, 2);

      expect(result).toBe(true);
      // Should upload restored content as draft
      expect(mockUploadData).toHaveBeenCalledWith({
        path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/draft.json`,
        data: '{"restored":true}',
        options: { contentType: "application/json" },
      });
    });

    it("returns false when version does not exist", async () => {
      mockDownloadData.mockReturnValue({
        result: Promise.reject(new Error("NoSuchKey")),
      });

      const result = await restoreVersion(TEST_IDENTITY_ID, TEST_UNIT_ID, 99);
      expect(result).toBe(false);
      expect(mockUploadData).not.toHaveBeenCalled();
    });
  });

  describe("listVersionHistory", () => {
    it("returns version numbers sorted descending", async () => {
      mockList.mockResolvedValue({
        items: [
          {
            path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/history/v1.json`,
          },
          {
            path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/history/v3.json`,
          },
          {
            path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/history/v2.json`,
          },
          {
            path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/history/v10.json`,
          },
        ],
      });

      const versions = await listVersionHistory(TEST_IDENTITY_ID, TEST_UNIT_ID);

      expect(versions).toEqual([10, 3, 2, 1]);
      expect(mockList).toHaveBeenCalledWith({
        path: `protected/${TEST_IDENTITY_ID}/units/${TEST_UNIT_ID}/history/`,
      });
    });

    it("returns empty array when no history exists", async () => {
      mockList.mockResolvedValue({ items: [] });

      const versions = await listVersionHistory(TEST_IDENTITY_ID, TEST_UNIT_ID);
      expect(versions).toEqual([]);
    });

    it("returns empty array on error", async () => {
      mockList.mockRejectedValue(new Error("Access denied"));

      const versions = await listVersionHistory(TEST_IDENTITY_ID, TEST_UNIT_ID);
      expect(versions).toEqual([]);
    });
  });
});
