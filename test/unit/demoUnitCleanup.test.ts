import { describe, expect, it, vi } from "vitest";
import { recycleFailedDemoUnit } from "../e2e/demos/demoUnitCleanup";

const unit = {
  id: "created-by-this-run",
  graphqlUrl: "https://example.test/graphql",
  authorization: "test-token",
};

describe("failed instructor demo cleanup", () => {
  it.each([{ success: true }, JSON.stringify({ success: true })])(
    "recycles only the tracked unit and accepts the API result %j",
    async (result) => {
      const post = vi.fn().mockResolvedValue({
        ok: () => true,
        json: async () => ({ data: { softDelete: result } }),
      });
      await recycleFailedDemoUnit({ post }, unit);
      expect(post).toHaveBeenCalledOnce();
      expect(post).toHaveBeenCalledWith(unit.graphqlUrl, {
        timeout: 90_000,
        headers: { authorization: "test-token" },
        data: {
          query: expect.stringContaining(
            "softDelete(modelName: $modelName, id: $id)",
          ),
          variables: { modelName: "Unit", id: "created-by-this-run" },
        },
      });
    },
  );

  it.each([
    { errors: [{ message: "Access denied" }] },
    {
      data: {
        softDelete: JSON.stringify({ success: false, message: "Not owned" }),
      },
    },
    { data: null },
  ])(
    "reports backend failure instead of silently leaving a draft: %j",
    async (result) => {
      const post = vi.fn().mockResolvedValue({
        ok: () => true,
        json: async () => result,
      });
      await expect(recycleFailedDemoUnit({ post }, unit)).rejects.toThrow(
        "Failed to recycle demo unit",
      );
    },
  );

  it("reports HTTP failure", async () => {
    const post = vi
      .fn()
      .mockResolvedValue({ ok: () => false, status: () => 503 });
    await expect(recycleFailedDemoUnit({ post }, unit)).rejects.toThrow(
      "HTTP 503",
    );
  });

  it("verifies deletion after a backend execution timeout", async () => {
    const post = vi.fn()
      .mockResolvedValueOnce({ ok: () => true, json: async () => ({ errors: [{ message: "Execution timed out." }] }) })
      .mockResolvedValueOnce({ ok: () => true, json: async () => ({ data: { getUnit: { id: unit.id, deletedAt: "2026-10-28T20:00:00Z" } } }) });
    await recycleFailedDemoUnit({ post }, unit);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("does not mistake an undeleted unit for successful timeout cleanup", async () => {
    const post = vi.fn()
      .mockResolvedValueOnce({ ok: () => true, json: async () => ({ errors: [{ message: "Execution timed out." }] }) })
      .mockResolvedValueOnce({ ok: () => true, json: async () => ({ data: { getUnit: { id: unit.id, deletedAt: null } } }) });
    await expect(recycleFailedDemoUnit({ post }, unit)).rejects.toThrow("Execution timed out.");
  });
});
