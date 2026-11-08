import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveGradeOfflineAware } from "../saveGradeOffline";
import { cacheGrade } from "../OfflineDataStore";
import { enqueue } from "../SyncQueue";

vi.mock("../OfflineDataStore", () => ({
  cacheGrade: vi.fn(),
  getCachedGrade: vi.fn(),
}));

vi.mock("../SyncQueue", () => ({
  enqueue: vi.fn(),
}));

describe("saveGradeOfflineAware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
  });

  it("persists the section-date review flag in the cache and sync queue", async () => {
    await saveGradeOfflineAware(
      {
        gradeId: "grade-1",
        unitId: "unit-1",
        sectionId: "section-1",
        data: {},
        complete: true,
        outsideSectionDateRange: true,
      },
      vi.fn(),
    );

    expect(cacheGrade).toHaveBeenCalledWith(
      expect.objectContaining({ outsideSectionDateRange: true }),
    );
    const queuedOperation = vi.mocked(enqueue).mock.calls[0][0];
    expect(JSON.parse(queuedOperation.payload)).toMatchObject({
      outsideSectionDateRange: true,
    });
  });
});
