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

import { useEffect, useContext, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import UnitContext from '../../../context/unitContext';

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
      // Parse unit.data if it's a string (Gen2 format)
      const editorState = typeof unit.data === 'string' 
        ? JSON.parse(unit.data) 
        : unit.data;

      if (editorState) {
        console.log('[WorkbookStatePlugin] Loading unit content into read-only workbook:', unit.id);
        
        // Convert JSON to EditorState and update editor
        const parsedState = editor.parseEditorState(editorState);
        editor.setEditorState(parsedState);
        
        hasLoaded.current = true;
      }
    } catch (error) {
      console.error('[WorkbookStatePlugin] Failed to load unit content:', error);
    }
  }, [unit?.data, unit?.id, editor]);

  return null;
}
