/**
 * MiniEditor barrel export.
 *
 * @module MiniEditor
 */

export { default as MiniEditor } from "./MiniEditor";
export { default as MiniEditorReadOnly } from "./MiniEditorReadOnly";
export { default as MiniEditorEditable } from "./MiniEditorEditable";
export { default as BlockInserterPlugin } from "./BlockInserterPlugin";
export { useKaiStreaming } from "./useKaiStreaming";
export type {
  MiniEditorProps,
  MiniEditorReadOnlyProps,
  MiniEditorEditableProps,
  MiniEditorMode,
  BlockDefinition,
  BlockCategory,
  MentionSuggestion,
  KaiStreamState,
  KaiChatContext,
} from "./types";
