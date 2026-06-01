/**
 * Shared types for the MiniEditor component suite.
 *
 * @module MiniEditor/types
 */

import type { SerializedEditorState } from "lexical";

/** Editor mode determines read-only vs editable behavior */
export type MiniEditorMode = "readonly" | "editable";

/** Block category for the block inserter menu */
export type BlockCategory =
  | "text"
  | "media"
  | "educational"
  | "layout"
  | "embed";

/** Block definition for the inserter menu */
export interface BlockDefinition {
  /** Unique block type identifier */
  type: string;
  /** Display label in the menu */
  label: string;
  /** Short description */
  description: string;
  /** Material icon name or React node */
  icon: string;
  /** Category for grouping */
  category: BlockCategory;
  /** Keyboard shortcut hint (optional) */
  shortcut?: string;
  /** Whether this block needs configuration before insert */
  needsConfig?: boolean;
}

/** Props shared between MiniEditor modes */
export interface MiniEditorBaseProps {
  /** Serialized Lexical JSON content */
  content?: string | null;
  /** Namespace for the Lexical instance (should be unique per usage) */
  namespace?: string;
  /** Optional max height with scrolling */
  maxHeight?: string | number;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Additional CSS class */
  className?: string;
  /** Compact mode reduces padding for chat contexts */
  compact?: boolean;
}

/** Read-only MiniEditor props */
export interface MiniEditorReadOnlyProps extends MiniEditorBaseProps {
  mode: "readonly";
}

/** Editable MiniEditor props */
export interface MiniEditorEditableProps extends MiniEditorBaseProps {
  mode: "editable";
  /** Called when content changes (debounced) */
  onChange?: (json: SerializedEditorState) => void;
  /** Called on submit (Enter without Shift in chat mode) */
  onSubmit?: (json: SerializedEditorState, plainText: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show the block inserter + button */
  showBlockInserter?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Chat mode: Enter submits, Shift+Enter newline */
  chatMode?: boolean;
  /** @mention suggestions for autocomplete */
  mentionSuggestions?: MentionSuggestion[];
}

/** Combined MiniEditor props */
export type MiniEditorProps = MiniEditorReadOnlyProps | MiniEditorEditableProps;

/** Suggestion for @mention autocomplete */
export interface MentionSuggestion {
  id: string;
  displayName: string;
  type: "user" | "bot";
  avatar?: string;
}

/** Kai streaming state for a single response */
export interface KaiStreamState {
  /** Whether Kai is currently streaming */
  isStreaming: boolean;
  /** Accumulated content so far */
  content: string;
  /** Serialized Lexical blocks from tool calls */
  blocks: SerializedEditorState | null;
  /** Error if streaming failed */
  error: string | null;
  /** Message ID for tracking */
  messageId: string | null;
}

/** Context for @kai in collaborative chat */
export interface KaiChatContext {
  sectionId: string;
  unitId?: string;
  topicId?: string;
  /** Recent messages for context window */
  recentMessages?: Array<{ role: string; content: string }>;
}
