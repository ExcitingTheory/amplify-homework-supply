"use client";
import React from "react";
import { useTranslations } from "next-intl";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";

const CARD_SX = {
  padding: "2rem 1rem",
  margin: "1rem auto",
  height: "fit-content",
  maxWidth: "60rem",
} as const;

export interface AdvancedSettingsViewProps {
  isWorking?: boolean;
  dialogOpen: boolean;
  onClearCacheClick: () => void;
  onDialogClose: () => void;
  onConfirmClear: () => void;
}

/**
 * AdvancedSettingsView — presentational "advanced" card (clear cache) plus its
 * confirmation dialog. The actual cache-clear + reload happen in the page.
 */
export function AdvancedSettingsView({
  isWorking = false,
  dialogOpen,
  onClearCacheClick,
  onDialogClose,
  onConfirmClear,
}: AdvancedSettingsViewProps) {
  const t = useTranslations("pages");
  return (
    <>
      <Card sx={CARD_SX}>
        <h1>{t("profile.advanced.heading")}</h1>
        <p>{t("profile.advanced.description")}</p>

        <Button
          variant="outlined"
          color="warning"
          disabled={isWorking}
          onClick={onClearCacheClick}
          sx={{ mt: 2 }}
        >
          {t("profile.advanced.clearCache")}
        </Button>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={onDialogClose}
        aria-labelledby="clear-datastore-dialog-title"
        aria-describedby="clear-datastore-dialog-description"
      >
        <DialogTitle id="clear-datastore-dialog-title">
          {t("profile.advanced.clearCacheDialog.title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-datastore-dialog-description">
            {t("profile.advanced.clearCacheDialog.message")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onDialogClose} color="primary">
            {t("profile.advanced.clearCacheDialog.cancel")}
          </Button>
          <Button
            onClick={onConfirmClear}
            color="warning"
            variant="contained"
            autoFocus
          >
            {t("profile.advanced.clearCacheDialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AdvancedSettingsView;
