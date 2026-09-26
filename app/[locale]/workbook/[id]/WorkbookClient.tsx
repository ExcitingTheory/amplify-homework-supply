"use client";

/**
 * WorkbookClient — Full interactive workbook with SSR HTML skeleton.
 *
 * Receives pre-rendered HTML from the server component and displays it
 * immediately while the full interactive Lexical editor loads.
 * Once Lexical is ready, it replaces the static HTML seamlessly.
 *
 * Pattern from: https://github.com/2wheeh/lexical-nextjs-ssr
 */

import React, { useState, useContext, useMemo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { Workbook } from "@/components/Editor3";
import { WorkbookSSRSkeleton } from "@/components/Editor3/WorkbookSSRSkeleton";
import { SecretLinkIcon } from "@/components/Gamification/SecretLinkIcon";
import { NarrativeContextBanner } from "@/components/Workbook/NarrativeContextBanner";
import { FilesProvider } from "@/context/fileContext";
import { DictionaryProvider } from "@/context/dictionaryContext";
import { UnitProvider } from "@/context/unitContext";
import UnitContext from "@/context/unitContext";
import { useChatPageContext } from "@/hooks/useChatPageContext";
import { SectionProvider } from "@/context/sectionContext";
import { CollaborativeChatWrapper } from "@/components/Chat/CollaborativeChatWrapper";
import { SEMANTIC_THEME } from "@/themes/semanticTheme";

interface WorkbookClientProps {
  ssrHtml?: string;
}

function formatTimerDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

function getRemainingTimerMilliseconds(
  timerStartedAt: string | undefined,
  timeLimitSeconds: number,
) {
  if (!timerStartedAt || timeLimitSeconds <= 0) {
    return timeLimitSeconds * 1000;
  }

  return Math.max(
    0,
    new Date(timerStartedAt).getTime() + timeLimitSeconds * 1000 - Date.now(),
  );
}

function getLocalStartStorageKey(unitId: string | undefined) {
  return unitId ? `workbook-timer-started:${unitId}` : null;
}

function markLocalTimerStart(unitId: string | undefined, gradeId?: string) {
  const key = getLocalStartStorageKey(unitId);
  if (!key || typeof window === "undefined") return;

  window.sessionStorage.setItem(
    key,
    JSON.stringify({ gradeId: gradeId || null, startedAt: Date.now() }),
  );
}

function hasRecentLocalTimerStart(
  unitId: string | undefined,
  gradeId?: string,
) {
  const key = getLocalStartStorageKey(unitId);
  if (!key || typeof window === "undefined") return false;

  try {
    const marker = JSON.parse(window.sessionStorage.getItem(key) || "null");
    if (!marker?.startedAt) return false;
    if (marker.gradeId && gradeId && marker.gradeId !== gradeId) return false;
    return Date.now() - marker.startedAt < 60_000;
  } catch {
    return false;
  }
}

function WorkbookChatGate() {
  const { assignment } = useContext(UnitContext);

  if (assignment?.workbookChatEnabled === false) {
    return null;
  }

  return <CollaborativeChatWrapper />;
}

const timerGateCardSx = {
  p: { xs: 2, sm: 3 },
  width: "min(calc(100% - 2rem), 48rem)",
  maxHeight: "calc(100vh - 2rem)",
  margin: "1rem auto",
  overflow: "auto",
  textAlign: "center",
  borderRadius: `${SEMANTIC_THEME.radius.modal}px`,
  bgcolor: SEMANTIC_THEME.surface.lightGlass,
  backdropFilter: SEMANTIC_THEME.surface.modalBlur,
  WebkitBackdropFilter: SEMANTIC_THEME.surface.modalBlur,
  "@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))":
    {
      bgcolor: "background.paper",
      backdropFilter: "none",
      WebkitBackdropFilter: "none",
    },
};

const timerGateBackdropSx = {
  position: "absolute",
  inset: 0,
  zIndex: (theme: any) => theme.zIndex.modal + 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: 2,
  bgcolor: SEMANTIC_THEME.surface.lightOverlay,
  backdropFilter: SEMANTIC_THEME.surface.overlayBlur,
  WebkitBackdropFilter: SEMANTIC_THEME.surface.overlayBlur,
  "@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))":
    {
      bgcolor: "background.paper",
      backdropFilter: "none",
      WebkitBackdropFilter: "none",
    },
};

/**
 * TimerWrappedEditor — Inner content that handles the timer gate and renders workbook.
 */
function TimerWrappedEditor({ ssrHtml }: { ssrHtml?: string }) {
  const t = useTranslations("pages");
  const {
    unit,
    grade,
    createGrade,
    recentGrades,
    showUnitComplete,
    files,
    dictionary,
    questionBank,
    assignment,
    assignmentWindowState,
    assignmentWindowReady,
  } = useContext(UnitContext);

  const filesArray = useMemo(() => Object.values(files || {}), [files]);
  const assistantChatEnabled = assignment?.aiChatEnabled !== false;

  useChatPageContext(
    {
      unit,
      files: filesArray as any,
      dictionary: dictionary as any,
      questions: questionBank as any,
    },
    { enabled: assistantChatEnabled },
  );

  const unitTimeLimitSeconds = unit?.timeLimitSeconds || 0;
  const needsTimer = unitTimeLimitSeconds > 0;
  const configuredTime = formatTimerDuration(unitTimeLimitSeconds * 1000);
  const timerStarted = grade?.timerStarted;
  const retryEnabled = unit?.retryEnabled !== false;
  const [isStartingGrade, setIsStartingGrade] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const localStartPendingRef = useRef(false);
  const locallyStartedGradeIdsRef = useRef<Set<string>>(new Set());
  const [resumeOverlayOpen, setResumeOverlayOpen] = useState(true);
  const [timerHelpAnchor, setTimerHelpAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [remainingTime, setRemainingTime] = useState(() =>
    getRemainingTimerMilliseconds(grade?.createdAt, unitTimeLimitSeconds),
  );
  const timerHelpOpen = Boolean(timerHelpAnchor);
  const timerHelpId = timerHelpOpen ? "workbook-timer-help" : undefined;

  useEffect(() => {
    if (grade?.id && localStartPendingRef.current) {
      locallyStartedGradeIdsRef.current.add(grade.id);
      localStartPendingRef.current = false;
      setResumeOverlayOpen(false);
      return;
    }

    setResumeOverlayOpen(true);
    setRemainingTime(
      getRemainingTimerMilliseconds(grade?.createdAt, unitTimeLimitSeconds),
    );
  }, [grade?.createdAt, grade?.id, unitTimeLimitSeconds]);

  useEffect(() => {
    if (resumeOverlayOpen) {
      return;
    }

    if (!needsTimer || !timerStarted) {
      setRemainingTime(unitTimeLimitSeconds * 1000);
      return;
    }

    const updateRemainingTime = () => {
      setRemainingTime(
        getRemainingTimerMilliseconds(grade?.createdAt, unitTimeLimitSeconds),
      );
    };

    updateRemainingTime();
    const interval = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(interval);
  }, [
    grade?.createdAt,
    needsTimer,
    resumeOverlayOpen,
    timerStarted,
    unitTimeLimitSeconds,
  ]);

  useEffect(() => {
    const updateNetworkState = () => setIsOffline(!navigator.onLine);
    updateNetworkState();
    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);
    return () => {
      window.removeEventListener("online", updateNetworkState);
      window.removeEventListener("offline", updateNetworkState);
    };
  }, []);

  const handleStartWorkbook = async () => {
    if (isStartingGrade) return;
    setIsStartingGrade(true);
    localStartPendingRef.current = true;
    markLocalTimerStart(unit?.id);
    try {
      const newGrade = (await createGrade()) as { id?: string } | undefined;
      if (newGrade?.id) {
        locallyStartedGradeIdsRef.current.add(newGrade.id);
        markLocalTimerStart(unit?.id, newGrade.id);
      }
      setResumeOverlayOpen(false);
    } catch (error) {
      localStartPendingRef.current = false;
      throw error;
    } finally {
      setIsStartingGrade(false);
    }
  };

  // Assignment-window gate. Keep these returns AFTER all hooks above so hook
  // order stays stable across the "checking" → "available" transition.
  if (!assignmentWindowReady) {
    return (
      <Alert
        severity="info"
        sx={{ width: "min(calc(100% - 2rem), 48rem)", mx: "auto", mt: 3 }}
      >
        Checking assignment availability...
      </Alert>
    );
  }

  if (assignmentWindowState?.state === "locked") {
    return (
      <Alert
        severity="info"
        sx={{ width: "min(calc(100% - 2rem), 48rem)", mx: "auto", mt: 3 }}
      >
        Opens {assignmentWindowState.opensAt?.toLocaleString() || "later"}.
      </Alert>
    );
  }

  if (assignmentWindowState?.state === "closed") {
    return (
      <Alert
        severity="warning"
        sx={{ width: "min(calc(100% - 2rem), 48rem)", mx: "auto", mt: 3 }}
      >
        This assignment is closed.
      </Alert>
    );
  }

  const shouldShowResumeOverlay =
    needsTimer &&
    timerStarted &&
    !showUnitComplete &&
    resumeOverlayOpen &&
    !isStartingGrade &&
    !locallyStartedGradeIdsRef.current.has(grade?.id || "") &&
    !hasRecentLocalTimerStart(unit?.id, grade?.id);
  const shouldShowStartOverlay =
    needsTimer &&
    !timerStarted &&
    !showUnitComplete &&
    (recentGrades.length === 0 || retryEnabled);

  const renderTimerGateHeader = (titleId: string) => (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          mt: 2,
          mb: 0.5,
        }}
      >
        <Typography
          variant="h4"
          component="h4"
          id={titleId}
          sx={{ textAlign: "center" }}
        >
          {unit?.name}
        </Typography>
        <IconButton
          aria-describedby={timerHelpId}
          aria-label="How timed exercises work"
          onClick={(event) => setTimerHelpAnchor(event.currentTarget)}
          size="small"
        >
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
      </Box>
      <Popover
        id={timerHelpId}
        open={timerHelpOpen}
        anchorEl={timerHelpAnchor}
        onClose={() => setTimerHelpAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Box sx={{ p: 2, maxWidth: 340 }}>
          <Typography variant="subtitle2" component="h5" sx={{ mb: 0.5 }}>
            Timed exercises
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The timer starts when you press Start. If you leave and come back,
            you will see a resume screen with the remaining time from your
            original start. Completed timed attempts show your time to
            completion with the grade.
          </Typography>
        </Box>
      </Popover>
    </>
  );

  const timerGateOverlay =
    shouldShowStartOverlay || shouldShowResumeOverlay ? (
      <Box className="workbook-timer-overlay" sx={timerGateBackdropSx}>
        <Card
          elevation={5}
          sx={timerGateCardSx}
          component="section"
          aria-labelledby={
            shouldShowResumeOverlay
              ? "workbook-resume-title"
              : "workbook-timer-title"
          }
        >
          {renderTimerGateHeader(
            shouldShowResumeOverlay
              ? "workbook-resume-title"
              : "workbook-timer-title",
          )}
          <Typography
            variant="h5"
            component="p"
            sx={{ fontVariantNumeric: "tabular-nums", my: 2 }}
          >
            {shouldShowResumeOverlay
              ? `Time remaining: ${formatTimerDuration(remainingTime)}`
              : `Time limit: ${configuredTime}`}
          </Typography>
          {shouldShowStartOverlay && (
            <Typography
              variant="body1"
              component="p"
              sx={{ color: "text.secondary", mb: 1 }}
            >
              {unit?.description}
            </Typography>
          )}
          <Typography
            variant="body1"
            component="p"
            sx={{ color: "text.secondary", mb: 3 }}
          >
            {shouldShowResumeOverlay
              ? "The timer continues from your original start time."
              : t("workbook.timerInstructions")}
          </Typography>
          <Button
            variant="contained"
            onClick={
              shouldShowResumeOverlay
                ? () => setResumeOverlayOpen(false)
                : handleStartWorkbook
            }
            disabled={shouldShowStartOverlay && isStartingGrade}
            aria-busy={shouldShowStartOverlay && isStartingGrade}
          >
            {shouldShowResumeOverlay ? "Resume" : t("workbook.start")}
          </Button>
        </Card>
      </Box>
    ) : null;

  return (
    <>
      {isOffline && (
        <Alert
          severity="warning"
          role="status"
          sx={{ width: "min(calc(100% - 2rem), 48rem)", mx: "auto", mt: 1 }}
        >
          You are offline. Cached content and local answers remain available;
          submission will sync when you reconnect.
        </Alert>
      )}
      <Box
        id="main-content"
        component="main"
        data-tour="workbook-content"
        sx={{ position: "relative", height: "100%", overflow: "hidden" }}
      >
        {unit ? (
          <>
            <NarrativeContextBanner unitId={unit.id} />
            <Workbook timerGateOverlay={timerGateOverlay} />
            <SecretLinkIcon unitId={unit?.id || ""} />
          </>
        ) : (
          // Show SSR HTML while the interactive editor loads
          <WorkbookSSRSkeleton html={ssrHtml || ""} />
        )}
      </Box>
    </>
  );
}

/**
 * WorkbookClient — Exported default for dynamic import.
 * Wraps the full workbook with auth + providers.
 */
export default function WorkbookClient({ ssrHtml }: WorkbookClientProps) {
  const { id } = useParams() as { id: string };

  return (
    <SectionProvider unitId={id}>
      <FilesProvider>
        <DictionaryProvider>
          <UnitProvider id={id}>
            <TimerWrappedEditor ssrHtml={ssrHtml} />
            <WorkbookChatGate />
          </UnitProvider>
        </DictionaryProvider>
      </FilesProvider>
    </SectionProvider>
  );
}
