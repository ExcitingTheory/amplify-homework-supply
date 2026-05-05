/**
 * DrillStatePlugin — Loads generated drill Lexical JSON into the editor.
 *
 * Accepts the object returned by buildDrillEditorState() (a Lexical SerializedEditorState
 * with root.children containing graded block nodes). When the JSON changes (e.g. drill
 * regenerated), re-applies the new state.
 *
 * Pattern mirrors GradedWorkbookStatePlugin / NarrativeStatePlugin but tailored
 * for practice drills where:
 * - Content may be null initially while the AI generates blocks
 * - Content swaps entirely on regeneration (no partial updates)
 * - Editor is read-only; plugins provide graded interaction
 */

import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { SerializedEditorState } from 'lexical'

interface DrillStatePluginProps {
  /** Lexical SerializedEditorState object (from buildDrillEditorState) or null */
  editorStateJSON: SerializedEditorState | null | undefined
}

export default function DrillStatePlugin({ editorStateJSON }: DrillStatePluginProps) {
  const [editor] = useLexicalComposerContext()
  const lastAppliedRef = useRef<SerializedEditorState | null>(null)

  useEffect(() => {
    // Skip if no content or same reference as last applied
    if (!editorStateJSON || editorStateJSON === lastAppliedRef.current) return

    try {
      const editorState = editor.parseEditorState(editorStateJSON)

      // Validate the parsed state has content
      if (!editorState || editorState.isEmpty()) {
        console.warn('[DrillStatePlugin] Parsed state is empty, skipping')
        return
      }

      // Use queueMicrotask to avoid "cannot update during render" errors
      queueMicrotask(() => {
        editor.setEditorState(editorState)
      })

      lastAppliedRef.current = editorStateJSON
    } catch (err) {
      console.error('[DrillStatePlugin] Failed to load drill content:', err)
    }
  }, [editorStateJSON, editor])

  return null
}
