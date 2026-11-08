import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
  get: vi.fn(),
  subscribeDocuments: vi.fn(),
}));
vi.mock("aws-amplify/storage", () => ({ list: vi.fn() }));
vi.mock("aws-amplify/utils", () => ({
  Hub: { listen: () => () => {} }, Cache: { getItem: vi.fn() },
}));
vi.mock("../../components/Editor3/components/FileManager2", () => ({ CourseVectorStore: null }));
vi.mock("../../utils/vectorStoreDB", () => ({
  loadEmbeddingsByDocument: vi.fn(), loadEmbeddingsFromS3: vi.fn(),
}));
vi.mock("../../utils/searchBundles", () => ({
  loadUnitBundle: vi.fn(), loadInstructorBundle: vi.fn(),
}));
vi.mock("../../utils/amplifyClient", () => ({
  getAmplifyClient: () => ({
    models: {
      File: { get: mocks.get, observeQuery: () => ({ subscribe: mocks.subscribe }) },
      Document: { observeQuery: () => ({ subscribe: mocks.subscribeDocuments }) },
    },
  }),
}));

import AuthContext from "../authContext";
import FilesContext, { FilesProvider } from "../fileContext";

const auth = {
  user: { attributes: { sub: "instructor-1" } },
  session: { identityId: "identity-1", groups: [] },
  isLoading: false,
};
const file = {
  id: "file-1", name: "biology.pdf", path: "protected/identity-1/biology.pdf",
  mimeType: "application/pdf", level: "PROTECTED", _version: 2,
};
function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthContext.Provider value={auth}><FilesProvider>{children}</FilesProvider></AuthContext.Provider>;
}
async function emit(items: Record<string, unknown>[]) {
  await act(async () => { await mocks.subscribe.mock.calls.at(-1)?.[0].next({ items }); });
}
describe("FilesProvider sparse analysis notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscribe.mockReturnValue({ unsubscribe: vi.fn() });
    mocks.subscribeDocuments.mockReturnValue({ unsubscribe: vi.fn() });
    mocks.get.mockResolvedValue({ data: file });
  });
  it.each([
    { name: null, path: null, mimeType: null },
    { name: null, path: file.path, mimeType: file.mimeType },
  ])("refreshes metadata before displaying a partially selected file (%j)", async (partial) => {
    const { result } = renderHook(() => React.useContext(FilesContext), { wrapper });
    await waitFor(() => expect(mocks.subscribe).toHaveBeenCalledOnce());
    await emit([{ id: file.id, documentID: "doc-1", ...partial, _version: 2 }]);
    expect(mocks.get).toHaveBeenCalledWith({ id: file.id });
    expect(result.current.files).toEqual([file]);
    expect(result.current.myPdfs[file.id]).toEqual(file);
  });
  it("does not fetch complete file snapshots", async () => {
    const { result } = renderHook(() => React.useContext(FilesContext), { wrapper });
    await waitFor(() => expect(mocks.subscribe).toHaveBeenCalledOnce());
    await emit([file]);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(result.current.files).toEqual([file]);
  });
  it("exposes completed extraction warnings to the file review panel", async () => {
    const { result } = renderHook(() => React.useContext(FilesContext), { wrapper });
    await waitFor(() => expect(mocks.subscribeDocuments).toHaveBeenCalledOnce());
    const reviewWarnings = ['Page 2: vocabulary "Lysosomes": answer_not_in_source'];
    await act(async () => {
      mocks.subscribeDocuments.mock.calls[0][0].next({ items: [{
        id: "doc-1", status: "completed", _version: 3,
        metadata: JSON.stringify({ analysis: {
          state: "completed", reviewWarnings, reviewWarningCount: 1,
        } }),
      }] });
    });
    expect(result.current.documents["doc-1"]).toMatchObject({
      status: "completed",
      analysis: { reviewWarnings, reviewWarningCount: 1 },
    });
  });
  it("reports failed refreshes without replacing valid file state with blank rows", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { result } = renderHook(() => React.useContext(FilesContext), { wrapper });
      await waitFor(() => expect(mocks.subscribe).toHaveBeenCalledOnce());
      await emit([file]);
      mocks.get.mockResolvedValueOnce({ errors: [{ message: "Refresh denied" }] });
      await emit([{ id: file.id }]);
      expect(error).toHaveBeenCalledWith("[FilesContext] File refresh error:", expect.any(Error));
      expect(result.current.files).toEqual([file]);
    } finally {
      error.mockRestore();
    }
  });
});
