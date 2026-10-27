import { describe, it, expect } from "vitest";
import {
  createInitialImportReviewState,
  importReviewReducer,
} from "../../src/components/importReviewReducer";

type Item = { id: string };
const items = (n: number): Item[] => Array.from({ length: n }, (_, i) => ({ id: `i${i}` }));

const payload = (list: Item[], autoSelectAll = true) => ({
  parsedContent: { id: "p" },
  document: { id: "d" },
  items: list,
  summaries: [],
  objectives: [],
  autoSelectAll,
});

describe("importReviewReducer CONTENT_UPDATED", () => {
  const loaded = (n: number, autoSelectAll = true) =>
    importReviewReducer<Item>(createInitialImportReviewState<Item>(), {
      type: "LOAD_SUCCESS",
      ...payload(items(n), autoSelectAll),
    });

  it("does not show the loading state again", () => {
    const next = importReviewReducer<Item>(loaded(2), {
      type: "CONTENT_UPDATED",
      ...payload(items(3)),
    });
    expect(next.loading).toBe(false);
  });

  it("keeps the user's deselections and selects only the newly arrived entries", () => {
    let state = loaded(3);
    state = importReviewReducer(state, { type: "TOGGLE_SELECT", index: 1 });
    expect([...state.selectedItems].sort()).toEqual([0, 2]);

    state = importReviewReducer(state, { type: "CONTENT_UPDATED", ...payload(items(5)) });
    expect([...state.selectedItems].sort()).toEqual([0, 2, 3, 4]);
    expect(state.items).toHaveLength(5);
  });

  it("does not auto-select arrivals once the content was imported", () => {
    let state = loaded(2, false);
    state = importReviewReducer(state, { type: "TOGGLE_SELECT", index: 0 });
    state = importReviewReducer(state, {
      type: "CONTENT_UPDATED",
      ...payload(items(4), false),
    });
    expect([...state.selectedItems]).toEqual([0]);
  });

  it("drops selected indices that no longer exist", () => {
    const state = importReviewReducer(loaded(4), {
      type: "CONTENT_UPDATED",
      ...payload(items(2)),
    });
    expect([...state.selectedItems].sort()).toEqual([0, 1]);
  });

  it("keeps expanded entries", () => {
    let state = loaded(3);
    state = importReviewReducer(state, { type: "TOGGLE_EXPAND", index: 2 });
    state = importReviewReducer(state, { type: "CONTENT_UPDATED", ...payload(items(4)) });
    expect(state.expandedItems.has(2)).toBe(true);
  });
});

describe("importReviewReducer imported entries", () => {
  type Flagged = { id: string; alreadyImported?: boolean };
  const flagged = (...imported: number[]): Flagged[] =>
    Array.from({ length: 5 }, (_, i) => ({ id: `i${i}`, alreadyImported: imported.includes(i) }));
  const content = (list: Flagged[]) => ({
    parsedContent: { id: "p" },
    document: { id: "d" },
    items: list,
    summaries: [],
    objectives: [],
    autoSelectAll: true,
  });
  const initial = () => createInitialImportReviewState<Flagged>();

  it("does not pre-select entries already imported", () => {
    const state = importReviewReducer(initial(), { type: "LOAD_SUCCESS", ...content(flagged(1, 3)) });
    expect([...state.selectedItems].sort()).toEqual([0, 2, 4]);
  });

  it("select all skips imported entries", () => {
    let state = importReviewReducer(initial(), { type: "LOAD_SUCCESS", ...content(flagged(0)) });
    state = importReviewReducer(state, { type: "DESELECT_ALL" });
    state = importReviewReducer(state, { type: "SELECT_ALL", count: 5 });
    expect([...state.selectedItems].sort()).toEqual([1, 2, 3, 4]);
  });

  it("drops entries from the selection once they are imported", () => {
    let state = importReviewReducer(initial(), { type: "LOAD_SUCCESS", ...content(flagged()) });
    state = importReviewReducer(state, { type: "CONTENT_UPDATED", ...content(flagged(0, 2)) });
    expect([...state.selectedItems].sort()).toEqual([1, 3, 4]);
    expect(state.loading).toBe(false);
  });

  it("does not select newly arrived entries that are already imported", () => {
    let state = importReviewReducer(initial(), {
      type: "LOAD_SUCCESS",
      ...content(flagged().slice(0, 2)),
    });
    state = importReviewReducer(state, { type: "CONTENT_UPDATED", ...content(flagged(3)) });
    expect([...state.selectedItems].sort()).toEqual([0, 1, 2, 4]);
  });
});
