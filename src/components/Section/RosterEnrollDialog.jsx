"use client";
import React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  Chip,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { addStudentsToSection } from "../../../app/actions/section";

/**
 * RosterEnrollDialog: instructor pastes a list of student emails to bulk-enroll
 * them into a section. Emails may be separated by commas, spaces, or newlines.
 *
 * Props:
 *   - open: boolean
 *   - onClose: () => void
 *   - sectionId: string
 *   - onEnrolled: () => void   // called after a successful enroll (to refetch roster)
 */
export function RosterEnrollDialog({ open, onClose, sectionId, onEnrolled }) {
  const t = useTranslations();
  const [value, setValue] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");

  const parsedEmails = React.useMemo(
    () =>
      Array.from(
        new Set(
          value
            .split(/[\s,;]+/)
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e.includes("@")),
        ),
      ),
    [value],
  );

  const handleClose = () => {
    if (submitting) return;
    setValue("");
    setResult(null);
    setError("");
    onClose?.();
  };

  const handleSubmit = async () => {
    if (parsedEmails.length === 0 || !sectionId) return;
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const res = await addStudentsToSection(sectionId, parsedEmails);
      if (!res.success) {
        setError(res.error || "Failed to enroll students");
        return;
      }
      setResult(res);
      if ((res.added?.length || 0) > 0) {
        onEnrolled?.();
      }
    } catch (err) {
      setError(err?.message || "Failed to enroll students");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {t("sectionDetail.enrollStudentsTitle", "Add students to section")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {t(
            "sectionDetail.enrollStudentsHelp",
            "Paste student emails separated by commas, spaces, or new lines. Each must already have an account.",
          )}
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="alice@example.com, bob@example.com"
          disabled={submitting}
          data-testid="enroll-emails-input"
        />
        {parsedEmails.length > 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            {t("sectionDetail.enrollDetected", {
              count: parsedEmails.length,
              defaultValue: `${parsedEmails.length} email(s) detected`,
            })}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 2 }}>
            {(result.added?.length || 0) > 0 && (
              <Alert severity="success" sx={{ mb: 1 }}>
                {t("sectionDetail.enrolledCount", {
                  count: result.added.length,
                  defaultValue: `Enrolled ${result.added.length} student(s)`,
                })}
              </Alert>
            )}
            {(result.alreadyEnrolled?.length || 0) > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t("sectionDetail.enrollAlready", "Already enrolled:")}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  useFlexGap
                  sx={{ mt: 0.5, flexWrap: "wrap" }}
                >
                  {result.alreadyEnrolled.map((e) => (
                    <Chip key={e} size="small" label={e} />
                  ))}
                </Stack>
              </Box>
            )}
            {(result.notFound?.length || 0) > 0 && (
              <Box>
                <Typography variant="caption" color="error">
                  {t("sectionDetail.enrollNotFound", "No account found:")}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  useFlexGap
                  sx={{ mt: 0.5, flexWrap: "wrap" }}
                >
                  {result.notFound.map((e) => (
                    <Chip
                      key={e}
                      size="small"
                      color="error"
                      variant="outlined"
                      label={e}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          {t("common.actions.close", "Close")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || parsedEmails.length === 0}
          startIcon={submitting ? <CircularProgress size={16} /> : null}
        >
          {t("sectionDetail.enrollAction", {
            count: parsedEmails.length,
            defaultValue: `Enroll ${parsedEmails.length || ""}`.trim(),
          })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RosterEnrollDialog;
