/**
 * Manual Save component.
 * Provides a manual save button for users to force immediate save.
 * Also handles beforeunload to save when closing tab.
 * Shows a spinner when any save is in-flight (via UnitContext.isSaving).
 * Note: Automatic debounced saving is handled by MyOnChangePlugin in index.js
 */
import React from "react";
import { useContext } from "react";
import Button from "@mui/material/Button";
import UnitContext from "../../../context/unitContext";
import SaveIcon from "@mui/icons-material/Save";
import Skeleton from "@mui/material/Skeleton";
import { useTranslations } from "next-intl";
import { useEditorToast } from "../context/EditorToastContext";

export function Save() {
  const t = useTranslations("editor.authoring");
  const { showToast } = useEditorToast();

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
        showToast({
          message: t("save.permissionError"),
          severity: "error",
          autoHideDuration: 3000,
        });
      } else {
        showToast({
          message: t("save.savedSuccessfully"),
          severity: "success",
          autoHideDuration: 3000,
        });
      }
    } catch (error) {
      console.error("[Save] Manual save failed:", error);
      showToast({
        message: t("save.saveFailed"),
        severity: "error",
        autoHideDuration: 3000,
      });
    }
  };

  return (
    <>
      <Button
        data-testid="save-button"
        disabled={isSaving}
        color="inherit"
        size="small"
        sx={{
          minWidth: "3rem",
        }}
        onClick={handleManualSave}
        title={t("save.saveNowTitle")}
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
