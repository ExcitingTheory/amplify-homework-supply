/**
 * @fileoverview WorkbookStatePlugin - Loads unit content for read-only Workbook mode
 * @module WorkbookStatePlugin
 *
 * In production, this plugin loads the Unit.data (lesson content) into the read-only
 * Workbook view. The student interacts with graded blocks, whose state is managed
 * by the workbookCollaboration system (Grade.data), not the unit content itself.
 *
 * This is different from the Editor component which uses CollaborationPlugin for
 * real-time collaborative editing of Unit.data by instructors.
 *
 * Usage: Add this plugin to the Workbook component (student view - read-only content).
 * It loads Unit.data while graded blocks use workbookCollaboration.workbookData for answers.
 */

import { useEffect, useContext, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import UnitContext from "../../../context/unitContext";
import { sanitizeEditorStateJSON } from "../editorConfig";

export default function WorkbookStatePlugin() {
  const { unit } = useContext(UnitContext);
  const [editor] = useLexicalComposerContext();
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Only load once and only if we have unit data
    if (hasLoaded.current || !unit?.data) {
      return;
    }

    try {
      // Sanitize the JSON to strip nodes with invalid/unregistered types
      const sanitized = sanitizeEditorStateJSON(
        typeof unit.data === "string" ? unit.data : JSON.stringify(unit.data),
      );

      if (sanitized) {
        const editorState = JSON.parse(sanitized);

        console.log(
          "[WorkbookStatePlugin] Loading unit content into read-only workbook:",
          unit.id,
        );

        // Convert JSON to EditorState and update editor
        const parsedState = editor.parseEditorState(editorState);

        // Defer state update to avoid flushSync during React lifecycle
        queueMicrotask(() => {
          editor.setEditorState(parsedState);
        });

        hasLoaded.current = true;
      }
    } catch (error) {
      console.warn(
        "[WorkbookStatePlugin] Failed to load unit content:",
        error.message,
      );
    }
  }, [unit?.data, unit?.id, editor]);

  return null;
}
