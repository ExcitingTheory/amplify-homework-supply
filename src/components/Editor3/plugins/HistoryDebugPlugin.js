/**
 * Debug plugin to monitor HistoryPlugin status
 * Note: Undo/Redo commands won't be logged here because HistoryPlugin handles them
 * with higher priority. Instead, watch for CAN_REDO changes - when it becomes true,
 * that means undo just executed successfully.
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { CAN_REDO_COMMAND, CAN_UNDO_COMMAND, $getRoot } from 'lexical';

export default function HistoryDebugPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let canUndo = false;
    let canRedo = false;

    const logEditorContent = (prefix) => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        console.log(`${prefix} Content:`, text.substring(0, 50) + (text.length > 50 ? '...' : ''));
      });
    };

    const unregister = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        if (canUndo !== payload) {
          canUndo = payload;
          console.log(`[History] Undo ${payload ? 'available' : 'unavailable'}`);
        }
        return false;
      },
      1,
    );

    const unregister2 = editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        if (canRedo !== payload) {
          canRedo = payload;
          console.log(`[History] Redo ${payload ? 'available (undo just executed ✅)' : 'unavailable'}`);
          if (payload) {
            // Undo just happened, log what the content is now
            logEditorContent('[History]   After undo,');
          }
        }
        return false;
      },
      1,
    );

    return () => {
      unregister();
      unregister2();
    };
  }, [editor]);

  return null;
}
