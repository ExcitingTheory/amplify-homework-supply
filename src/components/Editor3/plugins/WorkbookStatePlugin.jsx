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

import { useEffect, useContext, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useTranslations } from "next-intl";
import Snackbar from "@mui/material/Snackbar";
import Button from "@mui/material/Button";
import UnitContext from "../../../context/unitContext";
import { sanitizeEditorStateJSON } from "../editorConfig";

export default function WorkbookStatePlugin() {
  const t = useTranslations("pages");
  const { unit } = useContext(UnitContext);
  const [editor] = useLexicalComposerContext();
  const hasLoaded = useRef(false);
  const loadedVersion = useRef(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

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
        loadedVersion.current = unit._version;
      }
    } catch (error) {
      console.warn(
        "[WorkbookStatePlugin] Failed to load unit content:",
        error.message,
      );
    }
  }, [unit?.data, unit?.id, editor]);

  // Detect version changes after initial load
  useEffect(() => {
    if (
      !hasLoaded.current ||
      loadedVersion.current == null ||
      unit?._version == null
    ) {
      return;
    }

    if (unit._version > loadedVersion.current) {
      console.log(
        "[WorkbookStatePlugin] Unit updated while student is working:",
        loadedVersion.current,
        "→",
        unit._version,
      );
      setUpdateAvailable(true);
    }
  }, [unit?._version]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Snackbar
      open={updateAvailable}
      message={t("workbook.unitUpdated")}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      action={
        <Button
          color="primary"
          variant="contained"
          size="small"
          onClick={handleReload}
        >
          {t("workbook.reload")}
        </Button>
      }
    />
  );
}
