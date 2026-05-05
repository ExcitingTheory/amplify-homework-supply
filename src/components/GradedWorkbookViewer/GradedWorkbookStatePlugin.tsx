/**
 * GradedWorkbookStatePlugin — Loads Lexical JSON into the read-only editor.
 * Same pattern as NarrativeStatePlugin but dedicated to the graded workbook view.
 */

import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

interface GradedWorkbookStatePluginProps {
  contentJson: string
}

export function GradedWorkbookStatePlugin({ contentJson }: GradedWorkbookStatePluginProps) {
  const [editor] = useLexicalComposerContext()
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (hasLoaded.current || !contentJson) return

    try {
      const parsed = typeof contentJson === 'string'
        ? JSON.parse(contentJson)
        : contentJson

      if (parsed) {
        const editorState = editor.parseEditorState(parsed)
        queueMicrotask(() => {
          editor.setEditorState(editorState)
        })
        hasLoaded.current = true
      }
    } catch (err) {
      console.error('[GradedWorkbookStatePlugin] Failed to load content:', err)
    }
  }, [contentJson, editor])

  // Reset when content changes (e.g. switching between students)
  useEffect(() => {
    hasLoaded.current = false
  }, [contentJson])

  return null
}
