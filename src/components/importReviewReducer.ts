/**
 * importReviewReducer — Shared reducer for VocabularyReview2 and QuestionsReview2.
 *
 * Manages the import state machine (idle → importing → complete/error)
 * and data loading state (loading → loaded).
 */

// ============================================================================
// Types
// ============================================================================

export interface ImportProgress {
  current: number;
  total: number;
  message: string;
}

export interface ImportResult {
  success: boolean;
  imported?: number;
  skipped?: number;
  errors?: number;
  [key: string]: any;
}

export type ImportStatus = "idle" | "importing" | "complete" | "error";

export interface ImportReviewState<T> {
  // Data loading
  parsedContent: any;
  document: any;
  items: T[];
  summaries: any[];
  objectives: any[];
  loading: boolean;

  // Import state machine
  importStatus: ImportStatus;
  importProgress: ImportProgress | null;
  importResult: ImportResult | null;

  // UI state
  selectedItems: Set<number>;
  expandedItems: Set<number>;
  showSummaries: boolean;
}

// ============================================================================
// Actions
// ============================================================================

export type ImportReviewAction<T> =
  | { type: "LOAD_START" }
  | {
      type: "LOAD_SUCCESS";
      parsedContent: any;
      document: any;
      items: T[];
      summaries: any[];
      objectives: any[];
      autoSelectAll: boolean;
    }
  | { type: "LOAD_ERROR" }
  | { type: "IMPORT_START" }
  | { type: "IMPORT_PROGRESS"; progress: ImportProgress }
  | { type: "IMPORT_SUCCESS"; result: ImportResult }
  | { type: "IMPORT_ERROR"; result: ImportResult }
  | { type: "CLEAR_IMPORT_RESULT" }
  | { type: "TOGGLE_SELECT"; index: number }
  | { type: "SELECT_ALL"; count: number }
  | { type: "DESELECT_ALL" }
  | { type: "TOGGLE_EXPAND"; index: number }
  | { type: "TOGGLE_SUMMARIES" }
  | { type: "UPDATE_ITEM"; index: number; item: T };

// ============================================================================
// Initial State Factory
// ============================================================================

export function createInitialImportReviewState<T>(): ImportReviewState<T> {
  return {
    parsedContent: null,
    document: null,
    items: [],
    summaries: [],
    objectives: [],
    loading: true,
    importStatus: "idle",
    importProgress: null,
    importResult: null,
    selectedItems: new Set(),
    expandedItems: new Set(),
    showSummaries: false,
  };
}

// ============================================================================
// Reducer
// ============================================================================

export function importReviewReducer<T>(
  state: ImportReviewState<T>,
  action: ImportReviewAction<T>,
): ImportReviewState<T> {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true };

    case "LOAD_SUCCESS": {
      const selectedItems = action.autoSelectAll
        ? new Set(action.items.map((_, i) => i))
        : state.selectedItems;
      return {
        ...state,
        loading: false,
        parsedContent: action.parsedContent,
        document: action.document,
        items: action.items,
        summaries: action.summaries,
        objectives: action.objectives,
        selectedItems,
      };
    }

    case "LOAD_ERROR":
      return { ...state, loading: false };

    case "IMPORT_START":
      return {
        ...state,
        importStatus: "importing",
        importProgress: null,
        importResult: null,
      };

    case "IMPORT_PROGRESS":
      return { ...state, importProgress: action.progress };

    case "IMPORT_SUCCESS":
      return {
        ...state,
        importStatus: "complete",
        importProgress: null,
        importResult: action.result,
      };

    case "IMPORT_ERROR":
      return {
        ...state,
        importStatus: "error",
        importProgress: null,
        importResult: action.result,
      };

    case "CLEAR_IMPORT_RESULT":
      return { ...state, importResult: null, importStatus: "idle" };

    case "TOGGLE_SELECT": {
      const next = new Set(state.selectedItems);
      if (next.has(action.index)) {
        next.delete(action.index);
      } else {
        next.add(action.index);
      }
      return { ...state, selectedItems: next };
    }

    case "SELECT_ALL":
      return {
        ...state,
        selectedItems: new Set(
          Array.from({ length: action.count }, (_, i) => i),
        ),
      };

    case "DESELECT_ALL":
      return { ...state, selectedItems: new Set() };

    case "TOGGLE_EXPAND": {
      const next = new Set(state.expandedItems);
      if (next.has(action.index)) {
        next.delete(action.index);
      } else {
        next.add(action.index);
      }
      return { ...state, expandedItems: next };
    }

    case "TOGGLE_SUMMARIES":
      return { ...state, showSummaries: !state.showSummaries };

    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item, i) =>
          i === action.index ? action.item : item,
        ),
      };

    default:
      return state;
  }
}
