/**
 * Theme drafts store — lets users keep multiple in-progress custom themes and
 * share them across every mounted ThemeMixer.
 *
 * Drafts persist to localStorage and stay in sync across component instances
 * (same tab, via a CustomEvent) and across browser tabs (via the native
 * `storage` event). SSR-safe: all reads/writes are guarded on `window`.
 *
 * @module themeDrafts
 */

import * as React from "react";
import type { CustomThemePaletteInput } from "../components/Gamification/ThemeMixer";

const STORAGE_KEY = "hs.themeDrafts.v1";
const CHANGE_EVENT = "hs:theme-drafts";

export interface ThemeDraft {
  id: string;
  name: string;
  input: CustomThemePaletteInput;
  updatedAt: number;
}

export interface ThemeDraftState {
  drafts: ThemeDraft[];
  activeId: string | null;
}

const EMPTY_STATE: ThemeDraftState = { drafts: [], activeId: null };

const INPUT_FIELDS: (keyof CustomThemePaletteInput)[] = [
  "primaryMain",
  "secondaryMain",
  "backgroundDefault",
  "backgroundPaper",
  "accentColor",
];

/** All fields (core + optional overrides) used for change detection. */
const ALL_INPUT_FIELDS: (keyof CustomThemePaletteInput)[] = [
  ...INPUT_FIELDS,
  "errorMain",
  "warningMain",
  "infoMain",
  "successMain",
  "textPrimary",
  "textSecondary",
  "chatBubbleUser",
  "chatBubbleAssistant",
  "editorBackground",
  "codeBlock",
  "searchHighlight",
  "subtleBorder",
  "glassNavbarColor",
  "heroGradientStart",
  "heroGradientEnd",
];

function isValidInput(input: unknown): input is CustomThemePaletteInput {
  if (!input || typeof input !== "object") return false;
  const obj = input as Record<string, unknown>;
  return INPUT_FIELDS.every((f) => typeof obj[f] === "string");
}

function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Read + validate the persisted draft state. Returns an empty state on SSR. */
export function loadDraftState(): ThemeDraftState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<ThemeDraftState>;
    const drafts = Array.isArray(parsed.drafts)
      ? parsed.drafts.filter(
          (d): d is ThemeDraft =>
            !!d &&
            typeof d.id === "string" &&
            typeof d.name === "string" &&
            isValidInput(d.input),
        )
      : [];
    const activeId =
      typeof parsed.activeId === "string" &&
      drafts.some((d) => d.id === parsed.activeId)
        ? parsed.activeId
        : (drafts[0]?.id ?? null);
    return { drafts, activeId };
  } catch {
    return EMPTY_STATE;
  }
}

function writeDraftState(state: ThemeDraftState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // localStorage `storage` events don't fire in the originating tab, so notify
  // same-tab subscribers explicitly.
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/**
 * Read-modify-write helper. `fn` should return the same reference it received
 * to signal a no-op (skips the write + change event, preventing sync loops).
 */
function mutate(
  fn: (state: ThemeDraftState) => ThemeDraftState,
): ThemeDraftState {
  const current = loadDraftState();
  const next = fn(current);
  if (next === current) return current;
  writeDraftState(next);
  return next;
}

function nextDraftName(drafts: ThemeDraft[]): string {
  let n = drafts.length + 1;
  const names = new Set(drafts.map((d) => d.name));
  while (names.has(`Theme ${n}`)) n += 1;
  return `Theme ${n}`;
}

function serializeInput(input: CustomThemePaletteInput): string {
  return ALL_INPUT_FIELDS.map((f) => input[f] ?? "").join("|");
}

export function createDraft(
  input: CustomThemePaletteInput,
  name?: string,
): string {
  const id = generateId();
  mutate((state) => ({
    drafts: [
      ...state.drafts,
      {
        id,
        name: name?.trim() || nextDraftName(state.drafts),
        input,
        updatedAt: Date.now(),
      },
    ],
    activeId: id,
  }));
  return id;
}

/**
 * Create a first draft only when none exist yet. Reads fresh state so that
 * multiple mixers mounting at once don't each seed a duplicate draft.
 */
export function ensureAtLeastOneDraft(
  input: CustomThemePaletteInput,
  name?: string,
): void {
  mutate((state) => {
    if (state.drafts.length > 0) return state;
    const id = generateId();
    return {
      drafts: [
        { id, name: name?.trim() || "My Theme", input, updatedAt: Date.now() },
      ],
      activeId: id,
    };
  });
}

export function duplicateDraft(id: string): string {
  const newId = generateId();
  mutate((state) => {
    const source = state.drafts.find((d) => d.id === id);
    if (!source) return state;
    return {
      drafts: [
        ...state.drafts,
        {
          id: newId,
          name: `${source.name} copy`,
          input: { ...source.input },
          updatedAt: Date.now(),
        },
      ],
      activeId: newId,
    };
  });
  return newId;
}

export function renameDraft(id: string, name: string): void {
  mutate((state) => {
    if (!state.drafts.some((d) => d.id === id)) return state;
    return {
      ...state,
      drafts: state.drafts.map((d) => (d.id === id ? { ...d, name } : d)),
    };
  });
}

export function deleteDraft(id: string): void {
  mutate((state) => {
    if (!state.drafts.some((d) => d.id === id)) return state;
    const drafts = state.drafts.filter((d) => d.id !== id);
    const activeId =
      state.activeId === id ? (drafts[0]?.id ?? null) : state.activeId;
    return { drafts, activeId };
  });
}

export function selectDraft(id: string): void {
  mutate((state) =>
    state.activeId === id || !state.drafts.some((d) => d.id === id)
      ? state
      : { ...state, activeId: id },
  );
}

/** Update the active draft's palette. No-op when the value is unchanged. */
export function updateActiveInput(input: CustomThemePaletteInput): void {
  mutate((state) => {
    const id = state.activeId ?? state.drafts[0]?.id;
    if (!id) return state;
    const current = state.drafts.find((d) => d.id === id);
    if (current && serializeInput(current.input) === serializeInput(input)) {
      return state;
    }
    return {
      ...state,
      drafts: state.drafts.map((d) =>
        d.id === id ? { ...d, input, updatedAt: Date.now() } : d,
      ),
    };
  });
}

/** Subscribe to draft changes from this tab or other tabs. */
export function subscribeDrafts(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export interface UseThemeDraftsResult extends ThemeDraftState {
  /** False until the store has hydrated from localStorage on the client. */
  hydrated: boolean;
  activeDraft: ThemeDraft | undefined;
  createDraft: typeof createDraft;
  ensureAtLeastOneDraft: typeof ensureAtLeastOneDraft;
  duplicateDraft: typeof duplicateDraft;
  renameDraft: typeof renameDraft;
  deleteDraft: typeof deleteDraft;
  selectDraft: typeof selectDraft;
  updateActiveInput: typeof updateActiveInput;
}

/**
 * React binding for the drafts store. Starts empty (SSR-safe), hydrates from
 * localStorage after mount, and re-renders on any cross-instance change.
 */
export function useThemeDrafts(): UseThemeDraftsResult {
  const [state, setState] = React.useState<ThemeDraftState>(EMPTY_STATE);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setState(loadDraftState());
    setHydrated(true);
    return subscribeDrafts(() => setState(loadDraftState()));
  }, []);

  const activeDraft =
    state.drafts.find((d) => d.id === state.activeId) ?? state.drafts[0];

  return {
    ...state,
    activeId: activeDraft?.id ?? null,
    activeDraft,
    hydrated,
    createDraft,
    ensureAtLeastOneDraft,
    duplicateDraft,
    renameDraft,
    deleteDraft,
    selectDraft,
    updateActiveInput,
  };
}
