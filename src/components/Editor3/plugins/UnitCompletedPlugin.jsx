/**
 * @fileoverview UnitCompletedPlugin - Displays unit completion modal.
 * @module UnitCompletedPlugin
 *
 * Shows a congratulatory modal when a unit is completed, displaying
 * the unit name, top grades/scores, and action buttons (Try Again, Peer Review).
 * The modal persists across navigation until the student explicitly starts a new attempt.
 */

import * as React from "react";
import { useContext, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import UnitContext from "../../../context/unitContext";
import SectionContext from "../../../context/sectionContext";
import { useXP } from "../../../context/gamificationContext";
import { OpenPeerReviewButton } from "../../PeerReview/OpenPeerReviewButton";
import { HomeworkXPSummary } from "../../Gamification/HomeworkXPSummary";
import { PersonalBestBanner } from "../../Gamification/PersonalBestBanner";
import { createPeerReviewRoom } from "../../../../app/actions/peerReview";
import {
  trackWorkbookCompleted,
  trackGradeRetry,
  trackPeerReviewSubmitted,
} from "../../../utils/analytics";
import {
  Modal,
  Card,
  Typography,
  Box,
  Button,
  Divider,
  Alert,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  formatGradeDuration,
  getGradeCompletionLabel,
} from "../../../utils/gradeTiming";
import { SEMANTIC_THEME } from "../../../themes/semanticTheme";

/**
 * UnitCompletedPlugin - Displays modal when unit is completed.
 *
 * Shows a modal with unit name, recent grades, and action buttons.
 * If retryEnabled is true on the unit, a "Try Again" button creates a new grade.
 * An "Open for Peer Review" button launches the peer review flow.
 * The modal cannot be dismissed by backdrop click — student must take an action.
 *
 * @returns {JSX.Element} Unit completion modal component
 */
export default function UnitCompletedPlugin() {
  const t = useTranslations("workbook");
  const router = useRouter();

  const {
    unit,
    name,
    grade,
    showUnitComplete,
    setShowUnitComplete,
    personalBestResult,
    setPersonalBestResult,
    createGrade,
    recentGrades = [],
    sectionId,
    session,
  } = useContext(UnitContext) || {};

  const [retrying, setRetrying] = useState(false);
  const [requestingGuidance, setRequestingGuidance] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null); // { roomId } | null
  const [copied, setCopied] = useState(false);
  const { totalXP, xpLogs } = useXP();
  const { assignments } = useContext(SectionContext) || { assignments: [] };

  const retryEnabled = unit?.retryEnabled !== false;
  // Most recent completed grade for peer review
  const latestCompletedGrade = recentGrades[0];
  const timeLimitSeconds = unit?.timeLimitSeconds || 0;
  const completionTimeLabel = getGradeCompletionLabel(
    latestCompletedGrade || grade,
  );

  // Fire a workbook-completed analytics event once when the completion modal appears
  const completionTrackedRef = React.useRef(null);
  React.useEffect(() => {
    if (!showUnitComplete || !unit?.id) return;
    const gradeId = grade?.id || latestCompletedGrade?.id || "";
    if (completionTrackedRef.current === gradeId) return;
    completionTrackedRef.current = gradeId;
    const accuracy = grade?.accuracy ?? latestCompletedGrade?.accuracy ?? 0;
    trackWorkbookCompleted(unit.id, gradeId, accuracy, 0);
  }, [
    showUnitComplete,
    unit?.id,
    grade?.id,
    grade?.accuracy,
    latestCompletedGrade,
  ]);

  // Compute next assignment in same section (sorted by due date, skip current)
  const nextAssignment = useMemo(() => {
    if (!sectionId || !unit?.id || !assignments?.length) return null;
    const now = new Date();
    const sectionAssignments = assignments
      .filter((a) => a && a.sectionID === sectionId && a.unitID !== unit.id)
      .filter((a) => !a.dueDate || new Date(a.dueDate) >= now)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    return sectionAssignments[0] || null;
  }, [assignments, sectionId, unit?.id]);

  const handleTryAgain = async () => {
    setRetrying(true);
    try {
      trackGradeRetry(unit?.id || "", grade?.id);
      await createGrade(0, false);
      setShowUnitComplete(false);
    } catch (err) {
      console.error("[UnitCompletedPlugin] Error creating new grade:", err);
    } finally {
      setRetrying(false);
    }
  };

  const handleCreateRoom = async (gradeId, invitedUserIds) => {
    const result = await createPeerReviewRoom(
      gradeId,
      invitedUserIds,
      sectionId || "",
      session?.username || "",
    );
    if (!result?.success || !result.roomId) {
      throw new Error(result?.error || "Failed to create review room");
    }
    trackPeerReviewSubmitted(result.roomId, {
      gradeId,
      sectionId: sectionId || undefined,
      participantCount: (invitedUserIds?.length || 0) + 1,
    });
    return result.roomId;
  };

  const handleRoomCreated = (roomId) => {
    // Show inline actions instead of navigating away immediately
    setCreatedRoom({ roomId });
    router.prefetch(`/review/${roomId}`);
  };

  const handleCopyInvite = async () => {
    if (!createdRoom?.roomId) return;
    const url = `${window.location.origin}/review/${createdRoom.roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[UnitCompletedPlugin] Failed to copy invite link:", err);
    }
  };

  const handleRequestGuidance = async () => {
    if (!latestCompletedGrade || requestingGuidance) return;
    setRequestingGuidance(true);
    try {
      const result = await createPeerReviewRoom(
        latestCompletedGrade.id,
        [],
        sectionId || "",
        session?.username || "",
      );
      if (result?.success && result.roomId) {
        router.push(`/review/${result.roomId}`);
      }
    } catch (err) {
      console.error("[UnitCompletedPlugin] Error requesting guidance:", err);
    } finally {
      setRequestingGuidance(false);
    }
  };

  const handlePracticeMistakes = () => {
    if (!unit?.id) return;
    setShowUnitComplete(false);
    router.push(`/drill/${unit.id}?drillType=mixed&count=10`);
  };

  // Prefetch dashboard return route ahead of time
  React.useEffect(() => {
    router.prefetch("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      open={showUnitComplete}
      onClose={(_, reason) => {
        // Only allow close if retryEnabled, or if there's an active incomplete grade
        if (retryEnabled || grade) {
          setShowUnitComplete(false);
        }
        // Otherwise: no backdrop/escape dismiss — student must use Try Again
      }}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        overflow: "auto",
        zIndex: (theme) => theme.zIndex.modal + 3,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: SEMANTIC_THEME.surface.overlayBlur,
            WebkitBackdropFilter: SEMANTIC_THEME.surface.overlayBlur,
          },
        },
      }}
    >
      <Card
        data-tour="results"
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "70vw",
          maxWidth: "700px",
          bgcolor: "background.paper",
          boxShadow: (theme) => theme.shadows[SEMANTIC_THEME.elevation.overlay],
          backdropFilter: SEMANTIC_THEME.surface.overlayBlur,
          WebkitBackdropFilter: SEMANTIC_THEME.surface.overlayBlur,
          overflow: "auto",
          maxHeight: "90vh",
        }}
      >
        <Typography
          variant="h3"
          component="h3"
          sx={{
            flexGrow: 1,
            textAlign: "center",
            margin: "2rem 0.5rem 0.5rem",
          }}
        >
          {t("unitCompletedPlugin.completionMessage")} {name}
        </Typography>

        <Typography
          variant="h6"
          component="h6"
          sx={{
            flexGrow: 1,
            textAlign: "center",
          }}
        >
          {t("unitCompletedPlugin.sectionHeading")}
        </Typography>

        {timeLimitSeconds > 0 && (
          <Typography
            variant="body1"
            component="p"
            sx={{ textAlign: "center", color: "text.secondary", mt: 1 }}
          >
            Time limit: {formatGradeDuration(timeLimitSeconds)}
            {completionTimeLabel ? ` • ${completionTimeLabel}` : ""}
          </Typography>
        )}

        {/* Personal Best Banner */}
        {personalBestResult?.isNewBest && (
          <Box sx={{ mx: 2, mt: 1 }}>
            <PersonalBestBanner
              open={true}
              newScore={personalBestResult.bestScore}
              previousBest={personalBestResult.previousBest}
              onClose={() => setPersonalBestResult?.(null)}
            />
          </Box>
        )}

        <style global jsx>{`
          ol.recent-grades {
            list-style-type: none;
            counter-reset: my-counter;
          }

          ol.recent-grades li::before {
            content: counter(my-counter);
            counter-increment: my-counter;
            font-weight: bold;
            font-size: 1.5em;
            position: relative;
            left: -1.5rem;
            top: 2rem;
            margin-right: -0.5em;
          }
        `}</style>

        <ol
          className="recent-grades"
          style={{
            padding: "0 2rem",
            margin: "1rem 2rem",
            maxHeight: "40vh",
            overflow: "auto",
          }}
        >
          {recentGrades.map((grade, index) => {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const localTime = new Date(grade?.createdAt).toLocaleString(
              undefined,
              {
                timeZone,
              },
            );

            const _roundedAccuracy = Math.round(grade?.accuracy * 100) / 100;
            const completionLabel = getGradeCompletionLabel(grade);

            return (
              <li key={index}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    margin: "0",
                  }}
                >
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      textAlign: "left",
                      paddingLeft: "2rem",
                    }}
                  >
                    {`${localTime}`}
                  </Typography>

                  <div
                    style={{
                      flex: 1,
                      textAlign: "center",
                      flexGrow: 1,
                      borderBottom: "1px dashed currentColor",
                      margin: "0 0.4rem",
                      position: "relative",
                      top: "-0.5rem",
                    }}
                  ></div>

                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      textAlign: "right",
                      margin: "0",
                    }}
                  >
                    {`${_roundedAccuracy}%`}
                  </Typography>
                </Box>
                {completionLabel && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", textAlign: "right" }}
                  >
                    {completionLabel}
                  </Typography>
                )}
              </li>
            );
          })}
        </ol>

        {/* XP Summary for this homework */}
        {xpLogs.length > 0 &&
          (() => {
            // Show XP earned from this grade's reference
            const gradeId = latestCompletedGrade?.id;
            const relevantLogs = gradeId
              ? xpLogs.filter((l) => l.referenceId === gradeId)
              : xpLogs.slice(-3);
            if (relevantLogs.length === 0) return null;
            const lineItems = relevantLogs.map((l) => ({
              label: l.reason?.replace(/_/g, " ") || "XP",
              xp: l.xpAmount || 0,
            }));
            const earnedXP = lineItems.reduce((s, i) => s + i.xp, 0);
            return (
              <Box sx={{ px: 3, pb: 1 }}>
                <HomeworkXPSummary
                  lineItems={lineItems}
                  totalXP={earnedXP}
                  cumulativeXP={totalXP}
                />
              </Box>
            );
          })()}

        <Divider sx={{ mx: 2 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 1.25,
            p: 3,
            alignItems: "stretch",
          }}
        >
          {retryEnabled && (
            <Button
              variant="contained"
              size="large"
              startIcon={<ReplayIcon />}
              onClick={handleTryAgain}
              disabled={retrying}
              sx={{ width: "100%" }}
            >
              {retrying
                ? t("unitCompletedPlugin.retrying", "Starting new attempt...")
                : t("unitCompletedPlugin.tryAgain", "Try Again")}
            </Button>
          )}

          <Button
            variant="outlined"
            size="large"
            startIcon={<RateReviewIcon />}
            onClick={() => setShowUnitComplete(false)}
            sx={{ width: "100%" }}
          >
            {t("unitCompletedPlugin.reviewAnswers", "Review Answers")}
          </Button>

          {createdRoom ? (
            <Alert severity="success" sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                {t("unitCompletedPlugin.roomCreated", "Review room created!")}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyInvite}
                >
                  {copied
                    ? t("common.copied", "Copied!")
                    : t("unitCompletedPlugin.copyInvite", "Copy Invite Link")}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push(`/review/${createdRoom.roomId}`)}
                >
                  {t("unitCompletedPlugin.goToRoom", "Go to Room")}
                </Button>
              </Box>
            </Alert>
          ) : (
            latestCompletedGrade && (
              <OpenPeerReviewButton
                gradeId={latestCompletedGrade.id}
                onCreateRoom={handleCreateRoom}
                onRoomCreated={handleRoomCreated}
              />
            )
          )}

          {latestCompletedGrade && (
            <Button
              variant="outlined"
              size="large"
              color="secondary"
              startIcon={<SupportAgentIcon />}
              onClick={handleRequestGuidance}
              disabled={requestingGuidance}
              sx={{ width: "100%" }}
            >
              {requestingGuidance
                ? t("unitCompletedPlugin.requestingGuidance", "Requesting...")
                : t("unitCompletedPlugin.requestGuidance", "Request Guidance")}
            </Button>
          )}

          <Button
            variant="outlined"
            size="large"
            startIcon={<AutoFixHighIcon />}
            onClick={handlePracticeMistakes}
            sx={{ width: "100%" }}
          >
            {t("unitCompletedPlugin.practiceMistakes", "Practice Mistakes")}
          </Button>

          {nextAssignment && (
            <Button
              variant="outlined"
              size="large"
              endIcon={<NavigateNextIcon />}
              onClick={() => {
                setShowUnitComplete(false);
                router.push(`/workbook/${nextAssignment.unitID}`);
              }}
              sx={{ width: "100%" }}
            >
              {t("unitCompletedPlugin.nextAssignment", "Next Assignment")}
            </Button>
          )}

          {!nextAssignment && !retryEnabled && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t(
                "unitCompletedPlugin.allCaughtUp",
                "All caught up! No more assignments.",
              )}
            </Typography>
          )}
        </Box>
      </Card>
    </Modal>
  );
}
