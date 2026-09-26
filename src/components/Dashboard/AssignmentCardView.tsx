"use client";
import React from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RateReviewIcon from "@mui/icons-material/RateReview";
import LockIcon from "@mui/icons-material/Lock";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { getAssignmentWindowState } from "@/utils/assignmentTiming";
import { getEffectiveDueDate } from "@/utils/accommodations";
import { DASHBOARD_TOKENS } from "./constants";

export function gradeColor(pct = 0) {
  if (pct >= 80) return "success" as const;
  if (pct >= 60) return "warning" as const;
  return "error" as const;
}

export function gradeLabel(pct = 0, t?: (key: string) => string) {
  if (!t)
    return pct >= 90
      ? "Excellent"
      : pct >= 80
        ? "Good"
        : pct >= 60
          ? "Fair"
          : "Needs work";
  if (pct >= 90) return t("excellent");
  if (pct >= 80) return t("good");
  if (pct >= 60) return t("fair");
  return t("needsWork");
}

function getDueStatus(dueDate?: string, t?: (key: string) => string) {
  if (!dueDate)
    return {
      label: t ? t("noDueDate") : "No due date",
      color: "default" as const,
    };

  const dueTime = new Date(dueDate).getTime();
  const now = Date.now();
  const twoDays = 2 * 24 * 60 * 60 * 1000;

  if (dueTime < now)
    return { label: t ? t("overdue") : "Overdue", color: "error" as const };
  if (dueTime - now <= twoDays)
    return { label: "Due soon", color: "warning" as const };
  return { label: "Due", color: "default" as const };
}

export interface AssignmentCardData {
  assignment: {
    id: string;
    unitID: string;
    sectionID?: string;
    dueDate?: string;
    unlockDate?: string;
    availableFrom?: string;
    availableUntil?: string;
    allowLateCompletion?: boolean;
    lateStatus?: "PENDING" | "KEPT" | "DROPPED";
  };
  unit?: {
    id?: string;
    name?: string;
    description?: string;
    thumbnail?: string;
    featuredImage?: string;
    identityId?: string;
    difficulty?: string;
  } | null;
  /** Grade info for completed assignments */
  latestGrade?: { id: string; accuracy?: number; sectionID?: string } | null;
  locked?: boolean;
  lockStatus?: {
    unlockDate?: string;
    requiredPriorUnitName?: string;
  } | null;
  /** Whether this is the highlighted "up next" card */
  isUpNext?: boolean;
  /** Nailed-it count for this unit */
  nailedItCount?: number;
  /** This learner's accommodation for the section (extra due-date days / time multiplier) */
  accommodation?: {
    dueDateExtensionDays?: number;
    timeMultiplier?: number;
    note?: string;
  } | null;
  onOpenDrill: (unitId: string, unitName: string) => void;
  onRequestGuidance: (referenceId: string, sectionID: string) => Promise<void>;
}

export interface AssignmentCardViewProps extends AssignmentCardData {
  /** Translation function (resolved from context by the wrapper). */
  t: (key: string) => string;
  /** Whether reduced-motion is preferred (disables completion animations). */
  reducedMotion?: boolean;
  /** Pending peer-review invitation, if any (drives the "Join Review" button). */
  reviewInvitation?: { linkPath?: string | null } | null;
  /** Called when the learner clicks "Join Review". */
  onJoinReview?: (path: string) => void;
  /** Called when the learner clicks "Discuss". */
  onDiscuss?: () => void;
  /** Thumbnail slot (real card passes PublishedUnitHtmlThumbnail). */
  thumbnail?: React.ReactNode;
  /** Prefetch badge slot (real card passes PrefetchBadge). */
  prefetchBadge?: React.ReactNode;
  /** Peer-review button slot (real card passes OpenPeerReviewButton). */
  peerReviewButton?: React.ReactNode;
  /** Primary start/review action slot (real card passes PrefetchButton). */
  startButton?: React.ReactNode;
}

/**
 * Presentational, context-free rendering of an assignment card. All app
 * context (router, translations, notifications, S3 thumbnails, prefetch) is
 * resolved by the AssignmentCard wrapper and passed in as props/slots so this
 * view can be reused directly (e.g. in the Design System Showcase).
 */
export function AssignmentCardView({
  assignment,
  unit,
  latestGrade,
  locked = false,
  lockStatus,
  isUpNext = false,
  nailedItCount = 0,
  accommodation,
  onOpenDrill,
  onRequestGuidance,
  t,
  reducedMotion = false,
  reviewInvitation,
  onJoinReview,
  onDiscuss,
  thumbnail,
  prefetchBadge,
  peerReviewButton,
  startButton,
}: AssignmentCardViewProps) {
  const isCompleted = !!latestGrade;
  const pct = latestGrade ? Math.round(latestGrade.accuracy || 0) : 0;

  // Track previous completed state to fire flash animation on completion
  const prevCompleted = React.useRef(isCompleted);
  const [justCompleted, setJustCompleted] = React.useState(false);
  React.useEffect(() => {
    if (!prevCompleted.current && isCompleted && !reducedMotion) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 700);
      return () => clearTimeout(timer);
    }
    prevCompleted.current = isCompleted;
  }, [isCompleted, reducedMotion]);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Apply this learner's due-date extension (accommodation) to the base dates.
  const effectiveDueDate =
    getEffectiveDueDate(assignment.dueDate, accommodation) ||
    assignment.dueDate;
  const effectiveAvailableUntil =
    getEffectiveDueDate(
      assignment.availableUntil || assignment.dueDate,
      accommodation,
    ) ||
    assignment.availableUntil ||
    assignment.dueDate;
  const hasDueExtension =
    !!accommodation?.dueDateExtensionDays &&
    Number(accommodation.dueDateExtensionDays) > 0;
  const localTime = effectiveDueDate
    ? new Date(effectiveDueDate).toLocaleString(undefined, { timeZone })
    : null;
  const windowState = getAssignmentWindowState({
    availableFrom: assignment.availableFrom || assignment.unlockDate,
    availableUntil: effectiveAvailableUntil,
    dueDate: effectiveDueDate,
    unlockDate: assignment.unlockDate,
    allowLateCompletion: assignment.allowLateCompletion,
    lateStatus: assignment.lateStatus,
  });
  const isOverdue =
    !isCompleted && effectiveDueDate && new Date(effectiveDueDate) < new Date();
  const dueStatus = !isCompleted
    ? getDueStatus(effectiveDueDate, (key) => t(key))
    : null;

  // Overdue is surfaced as a pill floating on top of the card (like "Up Next"),
  // not as an inline chip in the header row. Suppressed when the card is itself
  // the Up Next hero (that card owns the top-of-card badge slot).
  const showOverdueBadge =
    !!isOverdue && !isUpNext && !locked && !windowState.isLocked;

  const borderLeftColor = isCompleted
    ? `${gradeColor(pct)}.main`
    : locked || windowState.isLocked
      ? "grey.400"
      : isOverdue || windowState.isLate
        ? "error.main"
        : isUpNext
          ? "primary.main"
          : "warning.main";

  return (
    <Box sx={{ position: "relative" }}>
      {showOverdueBadge && (
        <Box
          sx={{
            position: "absolute",
            top: -10,
            left: 16,
            zIndex: 2,
          }}
        >
          <Chip
            icon={<WarningAmberIcon />}
            label={localTime ? `Overdue · ${localTime}` : t("overdue")}
            color="error"
            size="small"
            sx={{ fontWeight: 700, fontSize: "0.75rem" }}
          />
        </Box>
      )}
      <Card
        component="article"
        aria-label={`${unit?.name || "Assignment"}${locked ? " (locked)" : ""}${isCompleted ? ` — ${pct}% ${gradeLabel(pct, (key) => t(key))}` : ""}`}
        data-tour={
          isCompleted ? "assignment-card-completed" : "assignment-card-pending"
        }
        elevation={0}
        sx={{
          // When nested inside UpNextCard, suppress the outer border and elevation
          // (UpNextCard's own Card provides the highlighted outline treatment).
          border: isUpNext ? "none" : "1px solid",
          borderColor: isUpNext ? undefined : "divider",
          ...(isUpNext ? {} : { borderLeft: "4px solid", borderLeftColor }),
          borderRadius: isUpNext ? 0 : DASHBOARD_TOKENS.radius.card,
          display: "flex",
          // Always clip to the card's own radius so nested elements (thumbnail,
          // chips) never show square corners poking out under the rounded curve.
          overflow: "hidden",
          minHeight: { xs: 0, sm: 140 },
          opacity: locked ? 0.7 : 1,
          transition: justCompleted ? "none" : "box-shadow 0.2s",
          "&:hover": { boxShadow: locked ? 0 : 4 },
          ...(isUpNext && {
            boxShadow: 0,
            bgcolor: "action.selected",
          }),
          ...(justCompleted && {
            animation: "cardComplete 0.6s ease-out",
            "@keyframes cardComplete": {
              "0%": { boxShadow: "0 0 0 0 rgba(76,175,80,0.5)" },
              "50%": { boxShadow: "0 0 0 8px rgba(76,175,80,0.15)" },
              "100%": { boxShadow: "0 0 0 0 rgba(76,175,80,0)" },
            },
          }),
        }}
      >
        <Box
          sx={{
            width: 120,
            flexShrink: 0,
            display: { xs: "none", sm: "block" },
            overflow: "hidden",
          }}
        >
          {thumbnail}
        </Box>
        <Box sx={{ flex: 1, p: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              mb: 0.5,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
              {unit?.name || ""}
            </Typography>
            {unit?.difficulty && (
              <Tooltip title={`Difficulty: ${unit.difficulty}`}>
                <Box
                  aria-label={`Difficulty: ${unit.difficulty}`}
                  sx={{
                    display: "flex",
                    gap: "3px",
                    alignItems: "center",
                    flexShrink: 0,
                    opacity: 0.65,
                  }}
                >
                  {[1, 2, 3].map((dot) => (
                    <Box
                      key={dot}
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        bgcolor:
                          dot <=
                          ({ easy: 1, medium: 2, hard: 3 }[unit.difficulty!] ??
                            0)
                            ? unit.difficulty === "easy"
                              ? "success.main"
                              : unit.difficulty === "medium"
                                ? "warning.main"
                                : "error.main"
                            : "action.disabled",
                      }}
                    />
                  ))}
                </Box>
              </Tooltip>
            )}
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              {prefetchBadge}
            </Box>
            {isCompleted && (
              <Chip
                label={`${pct}% · ${gradeLabel(pct, (key) => t(key))}`}
                size="small"
                variant="status"
                color={gradeColor(pct)}
                icon={<CheckCircleIcon />}
                sx={{
                  fontWeight: 700,
                  // Satisfying check pop when the card transitions to completed
                  ...(justCompleted && {
                    animation: "chipPop 0.6s ease-out",
                    "@keyframes chipPop": {
                      "0%": { transform: "scale(0.8)", opacity: 0 },
                      "60%": { transform: "scale(1.12)" },
                      "100%": { transform: "scale(1)", opacity: 1 },
                    },
                    "& .MuiChip-icon": {
                      animation: "checkPop 0.6s ease-out",
                    },
                    "@keyframes checkPop": {
                      "0%": { transform: "scale(0) rotate(-90deg)" },
                      "70%": { transform: "scale(1.3) rotate(0deg)" },
                      "100%": { transform: "scale(1) rotate(0deg)" },
                    },
                  }),
                }}
              />
            )}
            {isCompleted && nailedItCount > 0 && (
              <Chip
                label={`🎯 ${nailedItCount}`}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: "0.7rem" }}
              />
            )}
            {(locked || windowState.isLocked) && (
              <Chip
                label={
                  windowState.opensAt
                    ? `Opens ${new Date(windowState.opensAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                    : lockStatus?.unlockDate
                      ? `Unlocks ${new Date(lockStatus.unlockDate).toLocaleDateString()}`
                      : "Locked"
                }
                size="small"
                color="default"
                variant="outlined"
                icon={<LockIcon />}
                sx={{ fontSize: "0.7rem" }}
              />
            )}
            {windowState.isLate && !isCompleted && (
              <Chip
                label="Late"
                size="small"
                color="warning"
                variant="filled"
                sx={{ fontSize: "0.7rem" }}
              />
            )}
            {assignment.lateStatus === "DROPPED" && (
              <Chip
                label="Dropped by instructor"
                size="small"
                color="default"
                variant="outlined"
                sx={{ fontSize: "0.7rem" }}
              />
            )}
            {!isCompleted &&
              !(locked || windowState.isLocked) &&
              dueStatus &&
              !showOverdueBadge && (
                <Chip
                  label={
                    localTime
                      ? `${dueStatus.label} · ${localTime}`
                      : dueStatus.label
                  }
                  size="small"
                  color={dueStatus.color}
                  variant="outlined"
                  sx={{ fontSize: "0.7rem" }}
                />
              )}
            {!isCompleted && hasDueExtension && (
              <Tooltip
                title={accommodation?.note || "Extended due date accommodation"}
              >
                <Chip
                  label="Extended"
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem" }}
                />
              </Tooltip>
            )}
          </Box>
          <Box sx={{ height: "2.625rem", mb: 1.5, overflow: "hidden" }}>
            {unit?.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.5,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {unit.description}
              </Typography>
            )}
          </Box>

          {/* Actions */}
          {locked || windowState.isLocked ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <LockIcon fontSize="small" />
              {windowState.opensAt
                ? `Opens ${new Date(windowState.opensAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                : lockStatus?.requiredPriorUnitName
                  ? `Complete "${lockStatus.requiredPriorUnitName}" first`
                  : "Complete the previous assignment to unlock"}
            </Typography>
          ) : (
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ alignItems: "center" }}
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<AutoFixHighIcon />}
                onClick={() => onOpenDrill(assignment.unitID, unit?.name || "")}
              >
                {t("practice")}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ChatBubbleOutlineIcon />}
                onClick={() => onDiscuss?.()}
              >
                {t("discuss")}
              </Button>
              {isCompleted && peerReviewButton}
              {isCompleted && reviewInvitation?.linkPath && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<RateReviewIcon />}
                  onClick={() => {
                    const reviewPath = reviewInvitation.linkPath;
                    if (reviewPath) onJoinReview?.(reviewPath);
                  }}
                >
                  {t("joinReview")}
                </Button>
              )}
              <Tooltip title={t("requestGuidanceTooltip")}>
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    color="secondary"
                    startIcon={<SupportAgentIcon />}
                    onClick={() =>
                      onRequestGuidance(
                        isCompleted && latestGrade
                          ? latestGrade.id
                          : assignment.id,
                        (isCompleted && latestGrade
                          ? latestGrade.sectionID
                          : assignment.sectionID) || "",
                      )
                    }
                  >
                    {t("requestGuidance")}
                  </Button>
                </span>
              </Tooltip>
              {startButton}
            </Stack>
          )}
        </Box>
      </Card>
    </Box>
  );
}
