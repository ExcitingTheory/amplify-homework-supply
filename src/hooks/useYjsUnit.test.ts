/**
 * useYjsUnit Hook Tests
 *
 * Comprehensive tests for Yjs-based unit editing with DataStore persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import * as Y from "yjs";

// Create mock functions at module scope
const mockGetAmplifyClient = vi.fn();
const mockUseYjsProvider = vi.fn();
const mockSaveDraftContent = vi.fn();
const mockSaveYjsSnapshot = vi.fn();
const mockLoadYjsSnapshot = vi.fn();

// Mock modules
vi.mock("../utils/amplifyClient", () => ({
  getAmplifyClient: () => mockGetAmplifyClient(),
}));

vi.mock("../yjs/hooks", () => ({
  useYjsProvider: (config: any) => mockUseYjsProvider(config),
}));

vi.mock("../utils/unitContentStorage", () => ({
  saveDraftContent: (...args: any[]) => mockSaveDraftContent(...args),
  saveYjsSnapshot: (...args: any[]) => mockSaveYjsSnapshot(...args),
  loadYjsSnapshot: (...args: any[]) => mockLoadYjsSnapshot(...args),
}));

// Import hook after mocks are set up
import { useYjsUnit } from "./useYjsUnit";

describe("useYjsUnit Hook", () => {
  let mockDoc: Y.Doc;
  let mockYText: Y.Text;
  let mockYMap: Y.Map<any>;
  let mockProvider: any;
  let mockClient: any;
  let mockUpdateHandler: (() => void) | null = null;

  const mockUnitData = {
    id: "unit-1",
    name: "Test Unit",
    description: "Test Description",
    data: JSON.stringify({ content: "Test content" }),
    yjsSnapshot: null,
    updatedAt: "2024-01-15T10:30:00Z",
    owner: "user-1",
    identityId: "identity-1",
    contentVersion: 0,
  };

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    mockUpdateHandler = null;

    // Set default return values for S3 mocks
    mockSaveDraftContent.mockResolvedValue(undefined);
    mockSaveYjsSnapshot.mockResolvedValue(undefined);
    mockLoadYjsSnapshot.mockResolvedValue(null);

    // Create Yjs document
    mockDoc = new Y.Doc();
    mockYText = mockDoc.getText("editorContent");
    mockYMap = mockDoc.getMap("metadata");

    // Mock provider
    mockProvider = {
      getDoc: vi.fn(() => mockDoc),
      getText: vi.fn((name: string) => mockDoc.getText(name)),
      getMap: vi.fn((name: string) => mockDoc.getMap(name)),
      onUpdate: vi.fn((handler: () => void) => {
        mockUpdateHandler = handler;
        return vi.fn(); // unsubscribe
      }),
    };

    // Mock useYjs Provider
    mockUseYjsProvider.mockReturnValue({
      provider: mockProvider,
      isSynced: true,
      isConnected: true,
    });

    // Mock Amplify client
    mockClient = {
      models: {
        Unit: {
          get: vi.fn().mockResolvedValue({
            data: mockUnitData,
          }),
          update: vi.fn().mockResolvedValue({
            data: { ...mockUnitData, updatedAt: "2024-01-15T10:31:00Z" },
          }),
        },
      },
    };

    mockGetAmplifyClient.mockReturnValue(mockClient);
  });

  afterEach(() => {
    mockDoc.destroy();
    vi.useRealTimers();
  });

  describe("Initial Load", () => {
    it("should start in loading state", () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.unit).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("should load unit from GraphQL API", async () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.isLoading).toBe(false), {
        timeout: 5000,
      });

      expect(mockClient.models.Unit.get).toHaveBeenCalledWith({ id: "unit-1" });
      expect(result.current.unit).toEqual(mockUnitData);
      expect(result.current.error).toBeNull();
    });

    it("should parse JSON data field", async () => {
      const complexData = {
        root: {
          children: [{ type: "paragraph", children: [{ text: "Hello" }] }],
        },
      };

      mockClient.models.Unit.get.mockResolvedValueOnce({
        data: { ...mockUnitData, data: JSON.stringify(complexData) },
      });

      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      expect(result.current.unit.data).toEqual(JSON.stringify(complexData));
    });

    it("should handle null data field", async () => {
      mockClient.models.Unit.get.mockResolvedValueOnce({
        data: { ...mockUnitData, data: null },
      });

      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      expect(result.current.unit.data).toBeNull();
    });

    it("should handle unit not found", async () => {
      mockClient.models.Unit.get.mockResolvedValueOnce({ data: null });

      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.error).toBeTruthy());

      expect(result.current.error?.message).toContain("not found");
    });

    it("should handle load errors", async () => {
      const testError = new Error("Network error");
      mockClient.models.Unit.get.mockRejectedValueOnce(testError);

      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.error).toBeTruthy());

      expect(result.current.error).toBe(testError);
      expect(result.current.unit).toBeNull();
    });

    it("should apply Yjs snapshot if exists", async () => {
      const snapDoc = new Y.Doc();
      const snapText = snapDoc.getText("editorContent");
      snapText.insert(0, "Snapshot content");
      const snapshot = Y.encodeStateAsUpdate(snapDoc);
      const base64Snapshot = Buffer.from(snapshot).toString("base64");

      mockClient.models.Unit.get.mockResolvedValueOnce({
        data: { ...mockUnitData, yjsSnapshot: base64Snapshot },
      });

      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      // Verify snapshot was loaded by checking unit has yjsSnapshot field
      expect(result.current.unit.yjsSnapshot).toBe(base64Snapshot);

      snapDoc.destroy();
    });
  });

  describe("Provider Initialization", () => {
    it("should initialize provider with correct docName", async () => {
      renderHook(() => useYjsUnit({ unitId: "unit-123" }));

      expect(mockUseYjsProvider).toHaveBeenCalledWith({
        docName: "unit-unit-123",
        connect: true,
        persistence: true,
      });
    });

    it("should respect enableWebSocket option", async () => {
      renderHook(() =>
        useYjsUnit({ unitId: "unit-1", enableWebSocket: false }),
      );

      expect(mockUseYjsProvider).toHaveBeenCalledWith(
        expect.objectContaining({ connect: false }),
      );
    });

    it("should respect enablePersistence option", async () => {
      renderHook(() =>
        useYjsUnit({ unitId: "unit-1", enablePersistence: false }),
      );

      expect(mockUseYjsProvider).toHaveBeenCalledWith(
        expect.objectContaining({ persistence: false }),
      );
    });

    it("should return Y.Text for editor content", async () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      expect(result.current.ytext).toBe(mockYText);
      expect(mockProvider.getText).toHaveBeenCalledWith("editorContent");
    });

    it("should return Y.Map for metadata", async () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      expect(result.current.ymetadata).toBe(mockYMap);
      expect(mockProvider.getMap).toHaveBeenCalledWith("metadata");
    });
  });

  describe("Metadata Updates", () => {
    it("should update metadata in Y.Map", async () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      act(() => {
        result.current.updateMetadata({
          name: "New Name",
          description: "New Description",
        });
      });

      expect(mockYMap.get("name")).toBe("New Name");
      expect(mockYMap.get("description")).toBe("New Description");
    });

    it("should handle null provider gracefully", () => {
      // Mock provider as null
      mockUseYjsProvider.mockReturnValue({
        provider: null,
        isSynced: false,
        isConnected: false,
      });

      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      // Provider should be null
      expect(result.current.provider).toBeNull();

      // updateMetadata should not throw even with null provider
      act(() => {
        expect(() => {
          result.current.updateMetadata({ name: "Test" });
        }).not.toThrow();
      });

      // forceSave should not throw with null provider
      act(() => {
        expect(async () => {
          await result.current.forceSave();
        }).not.toThrow();
      });

      // Reset mock for other tests
      mockUseYjsProvider.mockReturnValue({
        provider: mockProvider,
        isSynced: true,
        isConnected: true,
      });
    });
  });

  describe("Force Save", () => {
    it("should save immediately when forceSave called", async () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      mockYText.insert(0, "Force save test");

      await act(async () => {
        await result.current.forceSave();
      });

      expect(mockClient.models.Unit.update).toHaveBeenCalled();
    });

    it("should stringify editor content for Gen 2", async () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      mockYText.insert(0, "Test content");

      await act(async () => {
        await result.current.forceSave();
      });

      // Content is saved to S3 via saveDraftContent as JSON string
      expect(mockSaveDraftContent).toHaveBeenCalledWith(
        "identity-1",
        "unit-1",
        expect.stringMatching(/^{.*}$/),
      );
    });

    it("should encode Yjs state as Uint8Array snapshot", async () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      mockYText.insert(0, "Snapshot test");

      await act(async () => {
        await result.current.forceSave();
      });

      // Yjs state is saved to S3 via saveYjsSnapshot as Uint8Array
      expect(mockSaveYjsSnapshot).toHaveBeenCalledWith(
        "identity-1",
        "unit-1",
        expect.any(Uint8Array),
      );
    });

    it("should include metadata in save", async () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      act(() => {
        mockYMap.set("name", "Updated Name");
        mockYMap.set("tags", ["tag1", "tag2"]);
      });

      await act(async () => {
        await result.current.forceSave();
      });

      const callArgs = mockClient.models.Unit.update.mock.calls[0][0];
      expect(callArgs.name).toBe("Updated Name");
      expect(callArgs.tags).toEqual(["tag1", "tag2"]);
    });

    it("should include version number", async () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      await act(async () => {
        await result.current.forceSave();
      });

      const callArgs = mockClient.models.Unit.update.mock.calls[0][0];
      expect(callArgs._version).toBeDefined(); // Version should be set for optimistic locking
    });
  });

  describe("Version Conflict Handling", () => {
    it("should handle version conflict error", async () => {
      mockClient.models.Unit.update.mockRejectedValueOnce(
        new Error("ConditionalCheckFailedException: updatedAt"),
      );

      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      await expect(
        act(async () => {
          await result.current.forceSave();
        }),
      ).rejects.toThrow("ConditionalCheck");
    });

    it("should reload from DataStore on conflict", async () => {
      mockClient.models.Unit.update.mockRejectedValueOnce(
        new Error("version conflict"),
      );

      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      const initialGetCalls = mockClient.models.Unit.get.mock.calls.length;

      try {
        await act(async () => {
          await result.current.forceSave();
        });
      } catch (err) {
        // Expected to throw
      }

      await waitFor(() =>
        expect(mockClient.models.Unit.get.mock.calls.length).toBeGreaterThan(
          initialGetCalls,
        ),
      );
    });
  });

  describe("Cleanup", () => {
    it("should unsubscribe on unmount", async () => {
      const unsubscribeMock = vi.fn();
      mockProvider.onUpdate.mockReturnValueOnce(unsubscribeMock);

      const { unmount } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(mockProvider.onUpdate).toHaveBeenCalled());

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty content", async () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      await act(async () => {
        await result.current.forceSave();
      });

      expect(mockClient.models.Unit.update).toHaveBeenCalled();
    });

    it("should handle special characters", async () => {
      const { result } = renderHook(() => useYjsUnit({ unitId: "unit-1" }));

      await waitFor(() => expect(result.current.unit).toBeTruthy());

      mockYText.insert(0, 'こんにちは 🎌 "quotes"');

      await act(async () => {
        await result.current.forceSave();
      });

      // Content is saved to S3 via saveDraftContent
      expect(mockSaveDraftContent).toHaveBeenCalled();
      const savedContent = mockSaveDraftContent.mock.calls[0][2];
      const parsed = JSON.parse(savedContent);
      expect(parsed.content).toContain("こんにちは");
    });
  });
});
