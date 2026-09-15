"use client";
import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Card,
  Chip,
  Stack,
  Typography,
  Button,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import {
  ChatBubbleOutline as DiscussIcon,
  AssignmentLate as PendingIcon,
  PeopleAlt as StudentsIcon,
  OpenInNew as OpenIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { getAssignmentWindowState } from "@/utils/assignmentTiming";

/**
 * NeedsAttention: Instructor action queue showing:
 * - Unreviewed submissions count
 * - Students missing current assignment
 * - Open guidance rooms needing review
 *
 * Props:
 *   - sectionID: string - current section ID
 *   - assignments: Assignment[] - section assignments
 *   - grades: Grade[] - all grades in section
 *   - students: Student[] - section students
 *   - openRooms: Room[] - open guidance/peer review rooms in section
 */
export function NeedsAttention({
  sectionID,
  assignments = [],
  grades = [],
  students = [],
  openRooms = [],
  onAssignUnit,
}) {
  const t = useTranslations();

  // Calculate unreviewed submissions (completed but not reviewed)
  const unreviewedCount = useMemo(() => {
    return grades.filter(
      (g) =>
        g != null && g.sectionID === sectionID && g.complete && !g.reviewedAt,
    ).length;
  }, [grades, sectionID]);

  const pendingLateCount = useMemo(() => {
    return assignments.filter(
      (assignment) =>
        assignment != null &&
        assignment.sectionID === sectionID &&
        assignment.lateStatus === "PENDING",
    ).length;
  }, [assignments, sectionID]);

  // Current/active assignment (most recent not-yet-overdue)
  const currentAssignment = useMemo(() => {
    const now = new Date();
    return assignments
      .filter((a) => a != null && a.sectionID === sectionID)
      .sort(
        (a, b) =>
          new Date(b.dueDate || 0).getTime() -
          new Date(a.dueDate || 0).getTime(),
      )
      .find((a) => new Date(a.dueDate || 0) > now);
  }, [assignments, sectionID]);

  // Students who haven't started current assignment
  const studentsMissingCurrent = useMemo(() => {
    if (!currentAssignment) return 0;

    const studentIds = new Set(students.map((s) => s?.id).filter(Boolean));
    const studentsWithGrades = new Set(
      grades
        .filter((g) => g?.unitID === currentAssignment.unitID)
        .map((g) => g?.owner)
        .filter(Boolean),
    );

    return Array.from(studentIds).filter((id) => !studentsWithGrades.has(id))
      .length;
  }, [students, grades, currentAssignment]);

  // Open rooms in this section
  const roomsInSection = useMemo(() => {
    return openRooms.filter(
      (r) => r != null && r.sectionID === sectionID && !r.closed,
    );
  }, [openRooms, sectionID]);

  // Show alert if there are any action items
  const hasActions =
    unreviewedCount > 0 ||
    pendingLateCount > 0 ||
    studentsMissingCurrent > 0 ||
    roomsInSection.length > 0 ||
    Boolean(onAssignUnit);

  if (!hasActions) return null;

  return (
    <Alert
      severity="info"
      sx={{ mb: 3, display: "flex", alignItems: "flex-start", gap: 2 }}
      icon={<PendingIcon sx={{ mt: 0.5 }} />}
    >
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          {t("sectionDetail.needsAttention", "Needs Attention")}
        </Typography>

        <Stack spacing={1} sx={{ mb: 1 }}>
          {unreviewedCount > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DiscussIcon fontSize="small" />
              <Typography variant="body2">
                {t(
                  "sectionDetail.unreviewedSubmissions",
                  "{count} unreviewed submissions",
                  { count: unreviewedCount },
                )}
              </Typography>
              <Chip
                label={unreviewedCount}
                size="small"
                color="error"
                variant="filled"
              />
            </Box>
          )}

          {pendingLateCount > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PendingIcon fontSize="small" />
              <Typography variant="body2">
                {t(
                  "sectionDetail.pendingLateSubmissions",
                  "{count} late submissions waiting for review",
                  { count: pendingLateCount },
                )}
              </Typography>
              <Chip
                label={pendingLateCount}
                size="small"
                color="warning"
                variant="filled"
              />
            </Box>
          )}

          {studentsMissingCurrent > 0 && currentAssignment && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <StudentsIcon fontSize="small" />
              <Typography variant="body2">
                {t(
                  "sectionDetail.studentsMissingAssignment",
                  "{count} students haven't started the current assignment",
                  { count: studentsMissingCurrent },
                )}
              </Typography>
              <Chip
                label={studentsMissingCurrent}
                size="small"
                color="warning"
                variant="filled"
              />
            </Box>
          )}

          {roomsInSection.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DiscussIcon fontSize="small" />
              <Typography variant="body2">
                {t("sectionDetail.openRooms", "{count} open discussion rooms", {
                  count: roomsInSection.length,
                })}
              </Typography>
              <Chip
                label={roomsInSection.length}
                size="small"
                color="info"
                variant="filled"
              />
            </Box>
          )}
        </Stack>

        {/* Quick action links */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 2 }}
        >
          {unreviewedCount > 0 && (
            <Button
              size="small"
              variant="contained"
              color="error"
              href="#gradebook"
              endIcon={<OpenIcon />}
            >
              {t("sectionDetail.reviewSubmissions", "Review Submissions")}
            </Button>
          )}
          {pendingLateCount > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              href="#gradebook"
              endIcon={<OpenIcon />}
            >
              {t(
                "sectionDetail.reviewLateSubmissions",
                "Review Late Submissions",
              )}
            </Button>
          )}
          {roomsInSection.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              href={`/section/${sectionID}#discussion-rooms`}
              endIcon={<OpenIcon />}
            >
              {t("sectionDetail.viewRooms", "View Rooms")}
            </Button>
          )}
          {onAssignUnit && (
            <Button size="small" variant="outlined" onClick={onAssignUnit}>
              {t("sectionDetail.assignUnit", "Assign Unit")}
            </Button>
          )}
        </Stack>
      </Box>
    </Alert>
  );
}
