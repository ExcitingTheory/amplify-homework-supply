'use client'

/**
 * MiniEditor — Unified Lexical editor component for chat and inline editing.
 *
 * Provides two modes:
 * - `readonly`: Renders serialized Lexical JSON with all custom blocks (quiz,
 *   answer, meaning association, etc.) in a compact, non-editable format.
 * - `editable`: Full editing with Notion-style block inserter, @mention
 *   autocomplete, and optional chat mode (Enter to submit).
 *
 * Usage locations:
 * - Collaborative chat message display (readonly)
 * - Collaborative chat input (editable + chatMode)
 * - Squad descriptions (readonly / editable)
 * - Squad post editing (editable)
 * - Campaign briefing editing (editable)
 * - Kai bot response streaming (readonly with progressive updates)
 *
 * @module MiniEditor
 * @example
 * ```tsx
 * // Read-only display
 * <MiniEditor mode="readonly" content={messageJson} compact />
 *
 * // Chat input
 * <MiniEditor
 *   mode="editable"
 *   chatMode
 *   compact
 *   placeholder="Message your class..."
 *   onSubmit={(json, text) => sendMessage(json, text)}
 *   showBlockInserter
 * />
 *
 * // Full editing (squad post)
 * <MiniEditor
 *   mode="editable"
 *   content={existingContent}
 *   onChange={(json) => saveDraft(json)}
 *   placeholder="Write your post..."
 *   showBlockInserter
 * />
 * ```
 */

import React from 'react'
import type { MiniEditorProps } from './types'
import MiniEditorReadOnly from './MiniEditorReadOnly'
import MiniEditorEditable from './MiniEditorEditable'

export default function MiniEditor(props: MiniEditorProps) {
  if (props.mode === 'readonly') {
    const { mode, ...rest } = props
    return <MiniEditorReadOnly {...rest} />
  }

  const { mode, ...rest } = props
  return <MiniEditorEditable {...rest} />
}

export { MiniEditor }
