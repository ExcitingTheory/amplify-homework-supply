import { useEffect, useRef, useState } from "react";
import { Alert, Box, LinearProgress, Snackbar, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

/** The analysis stages that are still working, in the order they happen. */
const WORKING_STATES = ["uploaded", "extracting", "analyzing", "aggregating", "embedding"];

export interface DocumentAnalysisProgressProps {
  /** The document's status record, as FilesContext exposes it. */
  documentStatus?: {
    status?: string | null;
    analysis?: {
      state?: string | null;
      done?: number | null;
      totalPages?: number | null;
      failed?: number | null;
      partialCounts?: { questions?: number; vocabulary?: number } | null;
    } | null;
  } | null;
}

/**
 * Shows that a document is still being analysed, and how far it has got.
 *
 * Analysis runs for minutes across several stages, so a bare status word reads
 * as nothing happening. A page count appears once the pages are known, and the
 * running totals show content arriving before the analysis finishes.
 */
export default function DocumentAnalysisProgress({
  documentStatus,
}: DocumentAnalysisProgressProps) {
  const t = useTranslations("editor.files");
  const analysis = documentStatus?.analysis;
  const analysisState = analysis?.state;
  const state =
    analysisState === "embedding" ||
    analysisState === "completed" ||
    analysisState === "failed"
      ? analysisState
      : documentStatus?.status;
  const isWorking = !!state && WORKING_STATES.includes(state);
  const wasWorking = useRef(false);
  const [progressDismissed, setProgressDismissed] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<"completed" | "failed" | null>(null);

  useEffect(() => {
    if (isWorking && !wasWorking.current) {
      setProgressDismissed(false);
      setCompletionStatus(null);
    } else if (!isWorking && wasWorking.current) {
      if (state === "completed" || state === "failed") {
        setCompletionStatus(state);
      }
    }
    wasWorking.current = isWorking;
  }, [isWorking, state]);

  if (!isWorking && !completionStatus) return null;

  const total = analysis?.totalPages ?? 0;
  const done = analysis?.done ?? 0;
  const failed = analysis?.failed ?? 0;
  const hasPages = total > 0;
  const percent = hasPages ? Math.min(100, Math.round((done / total) * 100)) : 0;

  const stageLabel = state && t.has(`fileManager2.analysisState.${state}`)
    ? t(`fileManager2.analysisState.${state}`)
    : state;
  const counts = analysis?.partialCounts;
  const found =
    counts && (counts.questions || counts.vocabulary)
      ? t("fileManager2.analysisFound", {
          questions: counts.questions ?? 0,
          words: counts.vocabulary ?? 0,
        })
      : null;

  return (
    <>
      {isWorking && (
        <Box sx={{ width: "100%", my: 1 }} aria-live="polite">
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {stageLabel}
              {hasPages ? ` · ${t("fileManager2.analysisPages", { done, total })}` : ""}
            </Typography>
            {hasPages && (
              <Typography variant="caption" color="text.secondary">
                {percent}%
              </Typography>
            )}
          </Box>
          <LinearProgress
            // Until the page count is known there is no way to say how far along
            // the run is, so the bar only says that it is working.
            variant={hasPages ? "determinate" : "indeterminate"}
            value={percent}
            sx={{ borderRadius: 1, height: 6, mt: 0.5 }}
          />
          {(found || failed > 0) && (
            <Typography variant="caption" color={failed > 0 ? "warning.main" : "text.secondary"}>
              {found}
              {found && failed > 0 ? " · " : ""}
              {failed > 0 ? t("fileManager2.analysisFailedPages", { count: failed }) : ""}
            </Typography>
          )}
        </Box>
      )}
      <Snackbar
        key={isWorking ? "working" : completionStatus}
        data-testid="document-analysis-snackbar"
        open={isWorking ? !progressDismissed : completionStatus !== null}
        autoHideDuration={isWorking ? null : 5000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          if (isWorking) setProgressDismissed(true);
          else setCompletionStatus(null);
        }}
      >
        <Alert
          severity={isWorking ? "info" : completionStatus === "failed" ? "error" : "success"}
          variant="filled"
          role={isWorking || completionStatus === "completed" ? "status" : "alert"}
          onClose={() => {
            if (isWorking) setProgressDismissed(true);
            else setCompletionStatus(null);
          }}
        >
          {isWorking
            ? `${stageLabel}${hasPages ? ` · ${t("fileManager2.analysisPages", { done, total })}` : ""}`
            : t(`fileManager2.documentStatus.${completionStatus === "completed" ? "analyzed" : "failed"}`)}
        </Alert>
      </Snackbar>
    </>
  );
}
