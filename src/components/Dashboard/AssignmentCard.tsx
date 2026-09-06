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
import EditNoteIcon from "@mui/icons-material/EditNote";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import PublishedUnitHtmlThumbnail from "@/components/PublishedUnitHtmlThumbnail";
import { PrefetchButton } from "@/components/PrefetchButton";
import PrefetchBadge from "@/components/PrefetchBadge";
import { OpenPeerReviewButton } from "@/components/PeerReview/OpenPeerReviewButton";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DASHBOARD_TOKENS } from "./constants";

function gradeColor(pct = 0) {
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

function gradeLabel(pct = 0) {
  if (pct >= 90) return "Excellent";
  if (pct >= 80) return "Good";
  if (pct >= 60) return "Fair";
  return "Needs work";
}

export interface AssignmentCardProps {
  assignment: {
    id: string;
    unitID: string;
    sectionID?: string;
    dueDate?: string;
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
  grades?: { id: string; accuracy?: number; sectionID?: string }[];
  locked?: boolean;
  lockStatus?: {
    unlockDate?: string;
    requiredPriorUnitName?: string;
  } | null;
  /** Whether this is the highlighted "up next" card */
  isUpNext?: boolean;
  /** Nailed-it count for this unit */
  nailedItCount?: number;
  onOpenDrill: (unitId: string, unitName: string) => void;
  onRequestGuidance: (referenceId: string, sectionID: string) => Promise<void>;
  onCreateReviewRoom?: (
    gradeId: string,
    invitedUserIds: string[],
  ) => Promise<string>;
  onRoomCreated?: (roomId: string) => void;
}

export function AssignmentCard({
  assignment,
  unit,
  latestGrade,
  locked = false,
  lockStatus,
  isUpNext = false,
  nailedItCount = 0,
  onOpenDrill,
  onRequestGuidance,
  onCreateReviewRoom,
  onRoomCreated,
}: AssignmentCardProps) {
  const isCompleted = !!latestGrade;
  const pct = latestGrade ? Math.round(latestGrade.accuracy || 0) : 0;
  const reducedMotion = useReducedMotion();

  // Track previous completed state to fire flash animation on completion
  const prevCompleted = React.useRef(isCompleted);
  const [justCompleted, setJustCompleted] = React.useState(false);
  React.useEffect(() => {
    if (!prevCompleted.current && isCompleted && !reducedMotion) {
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), 700);
      return () => clearTimeout(t);
    }
    prevCompleted.current = isCompleted;
  }, [isCompleted, reducedMotion]);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localTime = assignment.dueDate
    ? new Date(assignment.dueDate).toLocaleString(undefined, { timeZone })
    : null;
  const isOverdue =
    !isCompleted &&
    assignment.dueDate &&
    new Date(assignment.dueDate) < new Date();

  const borderLeftColor = isCompleted
    ? `${gradeColor(pct)}.main`
    : locked
      ? "grey.400"
      : isOverdue
        ? "error.main"
        : isUpNext
          ? "primary.main"
          : "warning.main";

  return (
    <Card
      component="article"
      aria-label={`${unit?.name || "Assignment"}${locked ? " (locked)" : ""}${isCompleted ? ` — ${pct}% ${gradeLabel(pct)}` : ""}`}
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
        overflow: "hidden",
        height: 140,
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
        }}
      >
        <PublishedUnitHtmlThumbnail
          unitId={assignment.unitID}
          thumbnailS3Key={unit?.thumbnail}
          fallbackS3Key={unit?.featuredImage}
          fallbackIdentityId={unit?.identityId}
        />
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
                        ({ easy: 1, medium: 2, hard: 3 }[unit.difficulty!] ?? 0)
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
            <PrefetchBadge unitId={assignment.unitID} />
          </Box>
          {isCompleted && (
            <Chip
              label={`${pct}% · ${gradeLabel(pct)}`}
              size="small"
              color={gradeColor(pct)}
              icon={<CheckCircleIcon />}
              sx={{ fontWeight: 700 }}
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
          {locked && (
            <Chip
              label={
                lockStatus?.unlockDate
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
          {!isCompleted && !locked && localTime && (
            <Chip
              label={isOverdue ? `Overdue · ${localTime}` : `Due ${localTime}`}
              size="small"
              color={isOverdue ? "error" : "default"}
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
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
        {locked ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <LockIcon fontSize="small" />
            {lockStatus?.requiredPriorUnitName
              ? `Complete "${lockStatus.requiredPriorUnitName}" first`
              : "Complete the previous assignment to unlock"}
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <PrefetchButton
              data-tour={isCompleted ? undefined : "start-workbook-button"}
              variant={isCompleted ? "outlined" : "contained"}
              size="small"
              href={`/workbook/${assignment.unitID}`}
              startIcon={<EditNoteIcon />}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              {isCompleted ? "Review" : "Start Workbook"}
            </PrefetchButton>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AutoFixHighIcon />}
              onClick={() => onOpenDrill(assignment.unitID, unit?.name || "")}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              {isCompleted ? "Practice from mistakes" : "Practice"}
            </Button>
            {isCompleted && latestGrade && onCreateReviewRoom && (
              <OpenPeerReviewButton
                gradeId={latestGrade.id}
                onCreateRoom={onCreateReviewRoom}
                onRoomCreated={onRoomCreated || (() => {})}
              />
            )}
            <Tooltip title="Create a room and share the code with your instructor to get personal guidance">
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
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  Request Guidance
                </Button>
              </span>
            </Tooltip>
          </Stack>
        )}
      </Box>
    </Card>
  );
}
