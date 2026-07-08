"use client";
import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Collapse,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SchoolIcon from "@mui/icons-material/School";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SkillTreePopupButton } from "@/components/SkillTreePopupButton";
import { AssignmentCard, type AssignmentCardProps } from "./AssignmentCard";
import { UpNextCard } from "./UpNextCard";

function gradeColor(pct = 0) {
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

export interface SectionAssignment {
  id: string;
  unitID: string;
  sectionID?: string;
  dueDate?: string;
}

export interface SectionPanelProps {
  section: {
    id: string;
    name?: string;
    description?: string;
  };
  assignments: SectionAssignment[];
  units: Record<string, { id?: string; name?: string; description?: string; thumbnail?: string; featuredImage?: string; identityId?: string; difficulty?: string } | undefined>;
  gradeMap: Record<string, { id: string; accuracy?: number; sectionID?: string }[]>;
  /** XP-based nailed-it counts per unit */
  nailedItByUnit?: Record<string, number>;
  /** Active campaign chapter title for this section */
  activeChapterTitle?: string | null;
  /** Content lock check */
  isLocked: (unitId: string) => boolean;
  getLockStatus: (unitId: string) => { unlockDate?: string; requiredPriorUnitName?: string } | null;
  /** Section-level XP info */
  sectionLevel?: { level: number } | null;
  /** Whether this section panel should start expanded */
  defaultExpanded?: boolean;
  /** Compact campaign timeline (optional, rendered above assignments) */
  campaignTimeline?: React.ReactNode;
  /** Collapsed campaign briefing (optional, rendered above assignments) */
  campaignBriefing?: React.ReactNode;
  onOpenDrill: (unitId: string, unitName: string) => void;
  onRequestGuidance: (referenceId: string, sectionID: string) => Promise<void>;
  onCreateReviewRoom?: (gradeId: string, invitedUserIds: string[]) => Promise<string>;
  onRoomCreated?: (roomId: string) => void;
}

export function SectionPanel({
  section,
  assignments,
  units,
  gradeMap,
  nailedItByUnit = {},
  activeChapterTitle,
  isLocked,
  getLockStatus,
  sectionLevel,
  defaultExpanded = false,
  campaignTimeline,
  campaignBriefing,
  onOpenDrill,
  onRequestGuidance,
  onCreateReviewRoom,
  onRoomCreated,
}: SectionPanelProps) {
  const [showCompleted, setShowCompleted] = React.useState(false);
  const reducedMotion = useReducedMotion();
  const upNextRef = React.useRef<HTMLDivElement>(null);

  const handleAccordionChange = React.useCallback(
    (_: React.SyntheticEvent, isExpanded: boolean) => {
      if (isExpanded) {
        // On next tick, after accordion animation, move focus to UpNext card
        setTimeout(() => {
          upNextRef.current?.focus();
        }, reducedMotion ? 0 : 280);
      }
    },
    [reducedMotion],
  );

  // Split assignments into pending/completed, sort by due date
  const pending = assignments
    .filter((a) => !gradeMap[a.unitID]?.length)
    .sort((a, b) => {
      // Locked items to the bottom
      const aLocked = isLocked(a.unitID) ? 1 : 0;
      const bLocked = isLocked(b.unitID) ? 1 : 0;
      if (aLocked !== bLocked) return aLocked - bLocked;
      // Then by due date (earliest first)
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDate - bDate;
    });

  const completed = assignments.filter((a) => gradeMap[a.unitID]?.length > 0);

  // Up-next: first non-locked pending assignment
  const upNext = pending.find((a) => !isLocked(a.unitID));
  const remainingPending = pending.filter((a) => a.id !== upNext?.id);

  // Stats
  const completionPct = assignments.length
    ? Math.round((completed.length / assignments.length) * 100)
    : 0;
  const completedGrades = completed.flatMap((a) => gradeMap[a.unitID] || []);
  const avgAccuracy = completedGrades.length
    ? Math.round(
        completedGrades.reduce((s, g) => s + (g.accuracy || 0), 0) /
          completedGrades.length,
      )
    : null;

  // Summary line for screen readers and quick scanning
  const summaryText = `${pending.length} pending · ${completed.length} completed${avgAccuracy !== null ? ` · ${avgAccuracy}% avg` : ""}`;

  return (
    <Accordion
      component="section"
      aria-labelledby={`section-heading-${section.id}`}
      defaultExpanded={defaultExpanded}
      onChange={handleAccordionChange}
      disableGutters
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px !important",
        mb: 2,
        "&:before": { display: "none" },
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`section-content-${section.id}`}
        id={`section-heading-${section.id}`}
        sx={{
          px: 2.5,
          "& .MuiAccordionSummary-content": {
            flexWrap: "wrap",
            gap: 1,
            alignItems: "center",
            my: 1.5,
          },
        }}
      >
        <SchoolIcon color="primary" sx={{ mr: 1 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {section.name || "Untitled Section"}
          </Typography>
          {section.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.3 }}
            >
              {section.description}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {pending.length > 0 && (
            <Chip
              label={`${pending.length} pending`}
              size="small"
              color="warning"
              icon={<HourglassTopIcon />}
              sx={{ fontWeight: 700 }}
            />
          )}
          {completed.length > 0 && (
            <Chip
              label={`${completed.length} done`}
              size="small"
              color="success"
              icon={<CheckCircleIcon />}
              sx={{ fontWeight: 700 }}
            />
          )}
          {sectionLevel && (
            <Chip
              label={`Lv. ${sectionLevel.level}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Stack>
      </AccordionSummary>

      <AccordionDetails
        id={`section-content-${section.id}`}
        sx={{ px: 2.5, pb: 2.5, pt: 0 }}
      >
        {/* Progress bar */}
        {assignments.length > 0 && (
          <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={completionPct}
              sx={{ flex: 1, height: 6, borderRadius: 3 }}
              color={completionPct === 100 ? "success" : "primary"}
              aria-label={`${completionPct}% complete`}
            />
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
              {completionPct}%
            </Typography>
          </Box>
        )}

        {/* Progress summary sentence (Phase 5.4) */}
        {assignments.length > 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1.5 }}
            aria-live="polite"
          >
            {completed.length === assignments.length
              ? `All ${assignments.length} assignment${assignments.length !== 1 ? 's' : ''} completed in ${section.name || 'this section'}.`
              : `${completed.length} of ${assignments.length} completed in ${section.name || 'this section'}.${
                  upNext
                    ? ` Next: ${units[upNext.unitID]?.name || 'next assignment'}${upNext.dueDate ? `, due ${new Date(upNext.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}.`
                    : ''
                }`
            }
          </Typography>
        )}

        {/* Campaign timeline (compact, optional) */}
        {campaignTimeline}

        {/* Campaign briefing (collapsed teaser, optional) */}
        {campaignBriefing}

        {/* Up Next hero */}
        {upNext && (
          <Box ref={upNextRef} tabIndex={-1} sx={{ outline: 'none' }}>
            <UpNextCard
              assignment={upNext}
              unit={units[upNext.unitID]}
              sectionName={section.name || "this section"}
              chapterTitle={activeChapterTitle}
              nailedItCount={nailedItByUnit[upNext.unitID] || 0}
              onOpenDrill={onOpenDrill}
              onRequestGuidance={onRequestGuidance}
            />
          </Box>
        )}

        {/* Remaining pending */}
        {remainingPending.length > 0 && (
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            {remainingPending.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                unit={units[assignment.unitID]}
                locked={isLocked(assignment.unitID)}
                lockStatus={getLockStatus(assignment.unitID)}
                nailedItCount={nailedItByUnit[assignment.unitID] || 0}
                onOpenDrill={onOpenDrill}
                onRequestGuidance={onRequestGuidance}
              />
            ))}
          </Stack>
        )}

        {/* Completed (collapsed by default) */}
        {completed.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              onClick={() => setShowCompleted((v) => !v)}
              startIcon={<CheckCircleIcon color="success" />}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: showCompleted ? "rotate(180deg)" : "none",
                    transition: reducedMotion ? "none" : "transform 0.2s",
                  }}
                />
              }
              sx={{
                textTransform: "none",
                fontWeight: 600,
                mb: 1,
                color: "text.secondary",
              }}
            >
              Completed ({completed.length})
            </Button>
            <Collapse in={showCompleted}>
              <Stack spacing={1.5}>
                {completed.map((assignment) => {
                  const grades = gradeMap[assignment.unitID] || [];
                  const latestGrade = grades[grades.length - 1];
                  return (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      unit={units[assignment.unitID]}
                      latestGrade={latestGrade}
                      nailedItCount={nailedItByUnit[assignment.unitID] || 0}
                      onOpenDrill={onOpenDrill}
                      onRequestGuidance={onRequestGuidance}
                      onCreateReviewRoom={onCreateReviewRoom}
                      onRoomCreated={onRoomCreated}
                    />
                  );
                })}
              </Stack>
            </Collapse>
          </Box>
        )}

        {/* Section-aware empty state */}
        {pending.length === 0 && completed.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            All caught up! Review your completed work or try practice drills.
          </Typography>
        )}

        {/* Footer actions */}
        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Button
            component="a"
            href={`/section/${section.id}`}
            size="small"
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            View Class
          </Button>
          <SkillTreePopupButton sectionId={section.id} label={section.name} />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
