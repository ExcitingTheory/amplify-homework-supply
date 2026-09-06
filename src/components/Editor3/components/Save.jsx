/**
 * Manual Save component.
 * Provides a manual save button for users to force immediate save.
 * Also handles beforeunload to save when closing tab.
 * Shows a spinner when any save is in-flight (via UnitContext.isSaving).
 * Note: Automatic debounced saving is handled by MyOnChangePlugin in index.js
 */
import React from "react";
import { useState, useContext } from "react";
import Button from "@mui/material/Button";
import Portal from "@mui/material/Portal";
import UnitContext from "../../../context/unitContext";
import SaveIcon from "@mui/icons-material/Save";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";

export function Save() {
  const [saveMessage, setSaveMessage] = useState("");

  const { saveEditorContent, editorStateRef, unit, isSaving } =
    useContext(UnitContext);

  // Save on page close/refresh as safety net — fire-and-forget save without
  // blocking navigation (no event.preventDefault) so the browser never shows
  // a "leave page?" confirmation dialog.
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (!editorStateRef?.current) return;
      const content = JSON.stringify(editorStateRef.current);
      const unitContent = JSON.stringify(unit?.data || {});

      if (content !== unitContent) {
        console.log("[Save] Saving before unload");
        saveEditorContent();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unit?.data, editorStateRef, saveEditorContent]);

  const handleManualSave = async (event) => {
    event.preventDefault();

    try {
      const response = await saveEditorContent();
      console.log("[Save] Manual save completed:", response);

      if (response === false) {
        setSaveMessage("Error: You do not have permission to edit this unit.");
      } else {
        setSaveMessage("Saved successfully");
      }
    } catch (error) {
      console.error("[Save] Manual save failed:", error);
      setSaveMessage("Save failed");
    }
  };

  return (
    <>
      <Portal>
        <Snackbar
          open={saveMessage !== ""}
          autoHideDuration={3000}
          onClose={() => setSaveMessage("")}
          message={saveMessage}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        />
      </Portal>
      <Button
        data-testid="save-button"
        disabled={isSaving}
        color="inherit"
        size="small"
        sx={{
          minWidth: "3rem",
        }}
        onClick={handleManualSave}
        title="Save now (automatic save happens 2 seconds after you stop typing)"
      >
        {isSaving ? (
          <Skeleton variant="circular" width={20} height={20} />
        ) : (
          <SaveIcon />
        )}
      </Button>
    </>
  );
}
