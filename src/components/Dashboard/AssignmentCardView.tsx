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
import { alpha, useTheme } from "@mui/material/styles";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RateReviewIcon from "@mui/icons-material/RateReview";
import LockIcon from "@mui/icons-material/Lock";
import { getAssignmentWindowState } from "@/utils/assignmentTiming";
import { getEffectiveDueDate } from "@/utils/accommodations";
import { isPlaceholderDueDate } from "@/utils/dueDate";
import { ExerciseProgressMeters } from "@/components/Editor3/components/ExerciseProgressMeters";
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

// Lightweight time estimate derived from unit difficulty metadata — no
// dedicated schema field exists yet, so this is a heuristic, not exact.
function estimateMinutesLabel(difficulty?: string): string | null {
  if (difficulty === "easy") return "~10 min";
  if (difficulty === "medium") return "~20 min";
  if (difficulty === "hard") return "~30 min";
  return null;
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
  latestGrade?: {
    id: string;
    accuracy?: number;
    percentComplete?: number;
    sectionID?: string;
  } | null;
  locked?: boolean;
  lockStatus?: {
    unlockDate?: string;
    requiredPriorUnitName?: string;
  } | null;
  /** Whether this is the highlighted "up next" card */
  isUpNext?: boolean;
  /** Nailed-it count for this unit */
  nailedItCount?: number;
  /** Small caption shown above the due-status line (e.g. "Today") — omit for normal list cards. */
  eyebrowLabel?: string;
  /** Use an opaque, high-contrast card surface instead of the low-opacity state tint — for cards placed on top of a colorful gradient background. */
  onGradient?: boolean;
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
  eyebrowLabel,
  onGradient = false,
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
  const progressPct = latestGrade?.percentComplete ?? 100;

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
  const rawEffectiveDueDate =
    getEffectiveDueDate(assignment.dueDate, accommodation) ||
    assignment.dueDate;
  // Unrealistically far-future dates are draft/undated placeholders, not real deadlines.
  const effectiveDueDate = isPlaceholderDueDate(rawEffectiveDueDate)
    ? undefined
    : rawEffectiveDueDate;
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
    ? new Date(effectiveDueDate).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone,
      })
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

  // Overdue is surfaced inline in the metadata caption below the title —
  // no floating badge, to keep the card flat and low-noise.
  const showsOverdueIndicator = !!isOverdue || dueStatus?.color === "error";

  const theme = useTheme();
  // Muted, flat state tint (like a Recording Studio track) instead of a
  // vivid color-coded border — same state logic, much lower visual noise.
  const stateColor = isCompleted
    ? theme.palette[gradeColor(pct)].main
    : locked || windowState.isLocked
      ? theme.palette.grey[500]
      : isOverdue || windowState.isLate
        ? theme.palette.error.main
        : isUpNext
          ? theme.palette.primary.main
          : theme.palette.warning.main;
  // On the gradient hero, use a frosted translucent white panel with a white
  // outline instead of the state color — keeps the card legible no matter
  // which part of the animated gradient sits behind it, and reserves color
  // for the spinning ring around the start button.
  const cardBg = onGradient ? alpha("#fff", 0.16) : alpha(stateColor, 0.06);
  const cardBorder = onGradient ? alpha("#fff", 0.55) : alpha(stateColor, 0.3);
  const gradientTextSx = onGradient
    ? {
        color: "common.white",
        borderColor: alpha("#fff", 0.6),
        bgcolor: "transparent",
        "& .MuiChip-icon": { color: "common.white" },
      }
    : {};

  return (
    <Box sx={{ position: "relative" }}>
      <Card
        component="article"
        aria-label={`${unit?.name || "Assignment"}${locked ? " (locked)" : ""}${isCompleted ? ` — ${pct}% ${gradeLabel(pct, (key) => t(key))}` : ""}`}
        data-tour={
          isCompleted ? "assignment-card-completed" : "assignment-card-pending"
        }
        elevation={0}
        sx={{
          // Flat, muted "track" chrome — a tinted fill + thin matching border
          // instead of a vivid color-coded border and white background. On a
          // gradient background, use a thicker opaque outline instead so the
          // card reads clearly against the colorful surface behind it.
          border: isUpNext ? "none" : onGradient ? "2px solid" : "1px solid",
          borderColor: isUpNext ? undefined : cardBorder,
          bgcolor: isUpNext ? "action.selected" : cardBg,
          // MUI's sx multiplies bare numeric borderRadius by theme.shape.borderRadius
          // (4) \u2014 must be an explicit px string or 8 silently becomes 32.
          borderRadius: isUpNext ? 0 : `${DASHBOARD_TOKENS.radius.card}px`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          // Always clip to the card's own radius so nested elements (thumbnail,
          // chips) never show square corners poking out under the rounded curve.
          overflow: "hidden",
          minHeight: { xs: 0, sm: 96 },
          opacity: locked ? 0.7 : 1,
        }}
      >
        {thumbnail}
        <Box sx={{ flex: 1, p: 3 }}>
          {eyebrowLabel && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: onGradient ? "common.white" : "primary.main",
                mb: 0.5,
              }}
            >
              {eyebrowLabel}
            </Typography>
          )}
          {/* Metadata line — kept on its own row, above and separate from the
              title, instead of competing with it for the same line. */}
          {!isCompleted && !(locked || windowState.isLocked) && dueStatus && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontWeight: 600,
                mb: 0.5,
                color: onGradient
                  ? alpha("#fff", 0.85)
                  : dueStatus.color === "default"
                    ? "text.secondary"
                    : `${dueStatus.color}.main`,
              }}
            >
              {localTime ? `${dueStatus.label}: ${localTime}` : dueStatus.label}
            </Typography>
          )}

          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 700,
              mb: 0.5,
              color: onGradient ? "common.white" : undefined,
            }}
          >
            {unit?.name || ""}
          </Typography>

          {/* Primary status chip — always visible, collapsed or not: the
              one signal that matters most at a glance (grade or lock state). */}
          {(isCompleted || locked || windowState.isLocked) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              {isCompleted && (
                <Chip
                  label={`${pct}% · ${gradeLabel(pct, (key) => t(key))}`}
                  size="small"
                  variant={onGradient ? "outlined" : "status"}
                  color={onGradient ? undefined : gradeColor(pct)}
                  icon={<CheckCircleIcon />}
                  sx={{
                    fontWeight: 700,
                    ...gradientTextSx,
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
                  sx={{ fontSize: "0.7rem", ...gradientTextSx }}
                />
              )}
            </Box>
          )}

          {/* Progress/accuracy meters — same two-bar pattern used inside the
              answer exercises, attached here so the card shows how the
              attempt went, not just the final grade chip. */}
          {isCompleted && (
            <ExerciseProgressMeters
              percentComplete={progressPct}
              accuracy={pct}
              hasAttempts
            />
          )}

          {/* Description — always visible, not tucked behind the collapse. */}
          {unit?.description && (
            <Typography
              variant="body2"
              color={onGradient ? undefined : "text.secondary"}
              sx={{
                lineHeight: 1.5,
                mb: 1,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                color: onGradient ? alpha("#fff", 0.85) : undefined,
              }}
            >
              {unit.description}
            </Typography>
          )}

          {/* Secondary chips — lower-priority context. */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
              flexWrap: "wrap",
            }}
          >
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
                        bgcolor: onGradient
                          ? dot <=
                            ({ easy: 1, medium: 2, hard: 3 }[
                              unit.difficulty!
                            ] ?? 0)
                            ? "common.white"
                            : alpha("#fff", 0.3)
                          : dot <=
                              ({ easy: 1, medium: 2, hard: 3 }[
                                unit.difficulty!
                              ] ?? 0)
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
            {!isCompleted && estimateMinutesLabel(unit?.difficulty) && (
              <Chip
                label={estimateMinutesLabel(unit?.difficulty)}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.7rem",
                  color: onGradient ? "common.white" : "text.secondary",
                  ...(onGradient && { borderColor: alpha("#fff", 0.6) }),
                }}
              />
            )}
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              {prefetchBadge}
            </Box>
            {isCompleted && nailedItCount > 0 && (
              <Chip
                label={`🎯 ${nailedItCount}`}
                size="small"
                color={onGradient ? undefined : "success"}
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: "0.7rem", ...gradientTextSx }}
              />
            )}
            {windowState.isLate && !isCompleted && !showsOverdueIndicator && (
              <Chip
                label="Late"
                size="small"
                color={onGradient ? undefined : "warning"}
                variant={onGradient ? "outlined" : "filled"}
                sx={{ fontSize: "0.7rem", ...gradientTextSx }}
              />
            )}
            {assignment.lateStatus === "DROPPED" && (
              <Chip
                label="Dropped by instructor"
                size="small"
                color="default"
                variant="outlined"
                sx={{ fontSize: "0.7rem", ...gradientTextSx }}
              />
            )}
            {!isCompleted && hasDueExtension && (
              <Tooltip
                title={accommodation?.note || "Extended due date accommodation"}
              >
                <Chip
                  label="Extended"
                  size="small"
                  color={onGradient ? undefined : "info"}
                  variant="outlined"
                  sx={{ fontSize: "0.7rem", ...gradientTextSx }}
                />
              </Tooltip>
            )}
          </Box>

          {/* Actions */}
          {locked || windowState.isLocked ? (
            <Typography
              variant="body2"
              color={onGradient ? undefined : "text.secondary"}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: onGradient ? alpha("#fff", 0.85) : undefined,
              }}
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
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{ alignItems: "center" }}
              >
                <Button
                  variant="text"
                  size="small"
                  startIcon={<AutoFixHighIcon />}
                  sx={{
                    color: onGradient ? alpha("#fff", 0.85) : "text.secondary",
                  }}
                  onClick={() =>
                    onOpenDrill(assignment.unitID, unit?.name || "")
                  }
                >
                  {t("practice")}
                </Button>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<ChatBubbleOutlineIcon />}
                  sx={{
                    color: onGradient ? alpha("#fff", 0.85) : "text.secondary",
                  }}
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
                      variant="text"
                      size="small"
                      color="secondary"
                      sx={{
                        color: onGradient
                          ? alpha("#fff", 0.85)
                          : "text.secondary",
                      }}
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
              </Stack>
              {startButton}
            </Stack>
          )}
        </Box>
      </Card>
    </Box>
  );
}
