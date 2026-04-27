/**
 * @fileoverview PracticeDrill module exports
 */

export { default as PracticeDrillConfigPopup } from './PracticeDrillConfigPopup'
export type {
  DrillSourceConfig,
  CoverageSnapshot,
  DrillConfig,
  PracticeDrillConfigPopupProps,
} from './PracticeDrillConfigPopup'

export {
  buildFeedbackData,
  buildFeedbackMarkdown,
} from './buildPracticeDrillFeedback'
export type {
  BlockResult,
  PracticeDrillFeedbackData,
  PracticeSessionData,
  GeneratedBlock,
} from './buildPracticeDrillFeedback'

export { useDrillCoverage } from './useDrillCoverage'

// --- Phase 1 components ---
export { default as PracticeDrillDialog } from './PracticeDrillDialog'
export type { PracticeDrillDialogProps } from './PracticeDrillDialog'

export { default as PracticeDrillWorkbook } from './PracticeDrillWorkbook'
export type { PracticeDrillWorkbookProps } from './PracticeDrillWorkbook'

export { default as PracticeDrillProgress } from './PracticeDrillProgress'
export type { PracticeDrillProgressProps } from './PracticeDrillProgress'

export { default as PracticeDrillDocRef } from './PracticeDrillDocRef'
export type { PracticeDrillDocRefProps } from './PracticeDrillDocRef'

export { default as DrillAudioButton } from './DrillAudioButton'
export type { DrillAudioButtonProps } from './DrillAudioButton'

export { default as DrillRecordButton } from './DrillRecordButton'
export type { DrillRecordButtonProps } from './DrillRecordButton'

export { default as JoinPracticeDialog } from './JoinPracticeDialog'
export type { JoinPracticeDialogProps, JoinedSessionInfo } from './JoinPracticeDialog'

export { default as CollaborativePresenceBar } from './CollaborativePresenceBar'
export type { CollaborativePresenceBarProps } from './CollaborativePresenceBar'

// --- Hooks ---
export { usePracticeDrill } from './usePracticeDrill'
export { useDrillAudio } from './useDrillAudio'
export { useDrillRecording } from './useDrillRecording'

// --- Utilities ---
export { buildDrillEditorState, extractDrillMetadata } from './buildDrillEditorState'
