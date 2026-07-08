/**
 * @fileoverview PracticeDrill module exports
 */

export { default as PracticeDrillConfigPopup } from "./PracticeDrillConfigPopup";
export type {
  DrillSourceConfig,
  CoverageSnapshot,
  DrillConfig,
  PracticeDrillConfigPopupProps,
} from "./PracticeDrillConfigPopup";

export {
  buildFeedbackData,
  buildFeedbackMarkdown,
} from "./buildPracticeDrillFeedback";
export type {
  BlockResult,
  PracticeDrillFeedbackData,
  PracticeSessionData,
  GeneratedBlock,
} from "./buildPracticeDrillFeedback";

export { useDrillCoverage } from "./useDrillCoverage";

export { useDrillLibrary } from "./useDrillLibrary";
export type { DrillLibraryEntry, DrillLibraryResult } from "./useDrillLibrary";

export { usePracticeDrill } from "./usePracticeDrill";

export { default as PracticeDrillDialog } from "./PracticeDrillDialog";
export type { PracticeDrillDialogProps } from "./PracticeDrillDialog";

export { default as PracticeDrillProgress } from "./PracticeDrillProgress";
export type { PracticeDrillProgressProps } from "./PracticeDrillProgress";

export { default as JoinPracticeDialog } from "./JoinPracticeDialog";
export type {
  JoinPracticeDialogProps,
  JoinedSessionInfo,
} from "./JoinPracticeDialog";

export { default as CollaborativePresenceBar } from "./CollaborativePresenceBar";
export type { CollaborativePresenceBarProps } from "./CollaborativePresenceBar";

export { default as DrillGradeAdapter } from "./DrillGradeAdapter";
export type { DrillStats } from "./DrillGradeAdapter";

// --- Utilities ---
export {
  buildDrillEditorState,
  extractDrillMetadata,
} from "./buildDrillEditorState";
export type { PracticeDrillBlock } from "./buildDrillEditorState";
