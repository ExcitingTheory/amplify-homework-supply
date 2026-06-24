import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "../utils/amplifyClient";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Stack,
  Tooltip,
  Alert,
  Skeleton,
  Divider,
  Button,
  Avatar,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { DiceBearAvatar } from "./Gamification/DiceBearAvatar";
import { SkillTreePopupButton } from "./SkillTreePopupButton";
import { listSectionStudents } from "../../app/actions/section";
import { formatLastFirst, getInitials } from "../utils/formatUserName";

// ── Helpers ──────────────────────────────────────────────────────────────────
function gradeColor(pct) {
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

function CopyableCode({ code }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Tooltip title={copied ? "Copied!" : "Copy join code"}>
      <Chip
        label={code}
        size="small"
        variant="outlined"
        icon={<ContentCopyIcon sx={{ fontSize: "0.85rem !important" }} />}
        onClick={() => {
          navigator.clipboard.writeText(code).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        sx={{ fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}
      />
    </Tooltip>
  );
}

/**
 * InstructorDashboard displays aggregate performance metrics across all sections
 * and leaderboards for each section showing top-performing students.
 */
export default function InstructorDashboard({ sections = [] }) {
  const t = useTranslations("components");
  const client = getAmplifyClient();

  const [sectionStats, setSectionStats] = useState({});
  const [allGrades, setAllGrades] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [sectionStudents, setSectionStudents] = useState({});
  const [allUnits, setAllUnits] = useState({});
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch all grades for instructor's sections
  useEffect(() => {
    if (sections.length === 0) {
      setLoading(false);
      return;
    }

    const subscription = client.models.Grade.observeQuery({
      filter: {
        complete: { eq: true },
      },
    }).subscribe({
      next: ({ items }) => {
        // Filter out null items that can appear during subscription updates
        const validItems = items.filter(
          (item) => item != null && item.id != null,
        );

        // Filter out grades without accuracy scores (client-side filtering)
        const validGrades = validItems.filter(
          (grade) => grade.accuracy != null,
        );
        setAllGrades(validGrades);
      },
      error: (err) => {
        console.error("Grades subscription error:", err);
        // Stop retrying on auth errors to prevent rate limiting
        if (
          err?.message?.includes("No current user") ||
          err?.message?.includes("NoSignedUser") ||
          err?.message?.includes("401") ||
          err?.message?.includes("403")
        ) {
          console.warn(
            "[InstructorDashboard] Auth error, stopping Grades subscription retries",
          );
          subscription.unsubscribe();
        }
      },
    });

    return () => subscription.unsubscribe();
  }, [sections.length]);

  // Fetch all assignments for instructor's sections
  useEffect(() => {
    if (sections.length === 0) return;

    // Filter out null sections before mapping to IDs
    const validSections = sections.filter((s) => s != null && s.id != null);
    if (validSections.length === 0) return;

    const sectionIDs = validSections.map((s) => s.id);

    const subscription = client.models.Assignment.observeQuery({
      filter: {
        or: sectionIDs.map((id) => ({ sectionID: { eq: id } })),
      },
    }).subscribe({
      next: ({ items }) => {
        // Filter out null items that can appear during subscription updates
        const validItems = items.filter(
          (item) => item != null && item.id != null,
        );
        setAllAssignments(validItems);
      },
      error: (err) => {
        console.error("Assignments subscription error:", err);
        // Stop retrying on auth errors to prevent rate limiting
        if (
          err?.message?.includes("No current user") ||
          err?.message?.includes("NoSignedUser") ||
          err?.message?.includes("401") ||
          err?.message?.includes("403")
        ) {
          console.warn(
            "[InstructorDashboard] Auth error, stopping Assignments subscription retries",
          );
          subscription.unsubscribe();
        }
      },
    });

    return () => subscription.unsubscribe();
  }, [sections.length]);

  // Fetch student name data for each section
  useEffect(() => {
    if (sections.length === 0) return;
    const validSections = sections.filter(
      (s) => s != null && s.id != null && s.code,
    );
    if (validSections.length === 0) return;

    async function fetchStudentNames() {
      const nameMap = {};
      for (const section of validSections) {
        const result = await listSectionStudents(section.code);
        if (result.success && result.students) {
          result.students.forEach((student) => {
            nameMap[student.id] = student;
          });
        }
      }
      setSectionStudents(nameMap);
    }
    fetchStudentNames();
  }, [sections]);

  // Fetch unit names for assignment display
  useEffect(() => {
    if (sections.length === 0) return;
    const subscription = client.models.Unit.observeQuery().subscribe({
      next: ({ items }) => {
        const map = {};
        items
          .filter((u) => u != null && u.id != null)
          .forEach((u) => {
            map[u.id] = u;
          });
        setAllUnits(map);
      },
      error: (err) =>
        console.warn("[InstructorDashboard] Unit subscription error:", err),
    });
    return () => subscription.unsubscribe();
  }, [sections.length]);

  // Calculate statistics for each section
  useEffect(() => {
    if (sections.length === 0 || allGrades.length === 0) {
      setLoading(false);
      return;
    }

    const calculateSectionStats = async () => {
      const stats = {};

      // Filter out null sections before iterating
      const validSections = sections.filter((s) => s != null && s.id != null);

      for (const section of validSections) {
        const sectionAssignments = allAssignments.filter(
          (a) => a.sectionID === section.id,
        );

        // Get unique students who have submitted work in this section
        const studentGradesMap = {};

        allGrades.forEach((grade) => {
          // Match by unitID + sectionID — Grade model has no assignmentID field
          const assignment = sectionAssignments.find(
            (a) => a.unitID === grade.unitID,
          );
          if (!assignment) return;
          if (grade.sectionID && grade.sectionID !== section.id) return;

          if (!studentGradesMap[grade.owner]) {
            studentGradesMap[grade.owner] = {
              totalGrade: 0,
              count: 0,
              completedAssignments: new Set(),
              allGrades: [],
            };
          }

          studentGradesMap[grade.owner].allGrades.push(grade);
          studentGradesMap[grade.owner].completedAssignments.add(
            assignment.unitID,
          );
        });

        // Calculate student averages and rankings
        const studentRankings = Object.entries(studentGradesMap).map(
          ([studentId, data]) => {
            // Group grades by assignment (unitID) and take highest
            const gradesByAssignment = {};
            data.allGrades.forEach((grade) => {
              const assignment = sectionAssignments.find(
                (a) => a.unitID === grade.unitID,
              );
              if (!assignment) return;

              if (
                !gradesByAssignment[assignment.unitID] ||
                grade.accuracy > gradesByAssignment[assignment.unitID].accuracy
              ) {
                gradesByAssignment[assignment.unitID] = grade;
              }
            });

            const grades = Object.values(gradesByAssignment).map(
              (g) => g.accuracy,
            );
            const average =
              grades.length > 0
                ? grades.reduce((sum, g) => sum + g, 0) / grades.length
                : 0;

            const completion =
              sectionAssignments.length > 0
                ? (data.completedAssignments.size / sectionAssignments.length) *
                  100
                : 0;

            return {
              studentId,
              average,
              completion,
              assignmentsCompleted: data.completedAssignments.size,
              totalAssignments: sectionAssignments.length,
            };
          },
        );

        // Sort by average grade descending
        studentRankings.sort((a, b) => b.average - a.average);

        stats[section.id] = {
          studentCount: studentRankings.length,
          averageGrade:
            studentRankings.length > 0
              ? Math.round(
                  studentRankings.reduce((sum, s) => sum + s.average, 0) /
                    studentRankings.length,
                )
              : 0,
          averageCompletion:
            studentRankings.length > 0
              ? Math.round(
                  studentRankings.reduce((sum, s) => sum + s.completion, 0) /
                    studentRankings.length,
                )
              : 0,
          leaderboard: studentRankings.slice(0, 10), // Top 10
          assignmentCount: sectionAssignments.length,
        };
      }

      setSectionStats(stats);
      setLoading(false);
    };

    calculateSectionStats();
  }, [sections, allGrades, allAssignments]);

  // Calculate aggregate stats
  const aggregateStats = React.useMemo(() => {
    const totalStudents = Object.values(sectionStats).reduce(
      (sum, s) => sum + s.studentCount,
      0,
    );
    const avgGrade =
      Object.values(sectionStats).length > 0
        ? Math.round(
            Object.values(sectionStats).reduce(
              (sum, s) => sum + s.averageGrade,
              0,
            ) / Object.values(sectionStats).length,
          )
        : 0;
    const avgCompletion =
      Object.values(sectionStats).length > 0
        ? Math.round(
            Object.values(sectionStats).reduce(
              (sum, s) => sum + s.averageCompletion,
              0,
            ) / Object.values(sectionStats).length,
          )
        : 0;
    const totalAssignments = Object.values(sectionStats).reduce(
      (sum, s) => sum + s.assignmentCount,
      0,
    );

    return { totalStudents, avgGrade, avgCompletion, totalAssignments };
  }, [sectionStats]);

  if (sections.length === 0) {
    return null;
  }

  const validSections = sections.filter((s) => s != null && s.id != null);
  const globalAtRiskCount = Object.values(sectionStats).reduce(
    (n, s) => n + (s.leaderboard?.filter((l) => l.average < 60).length || 0),
    0,
  );

  return (
    <Box sx={{ mb: 4, mx: "auto", width: "90vw", maxWidth: "80rem" }}>
      {/* ── HERO SUMMARY BAR ───────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(30,50,30,0.95) 0%, rgba(10,30,20,0.98) 100%)"
              : "linear-gradient(135deg, rgba(27,94,32,0.92) 0%, rgba(46,125,50,0.97) 100%)",
          color: "#fff",
          p: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <TrendingUpIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t("instructorDashboard.overallPerformance")}
          </Typography>
          <Chip
            label={`${validSections.length} section${validSections.length !== 1 ? "s" : ""}`}
            size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", ml: "auto" }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: { xs: 2, sm: 4 }, flexWrap: "wrap" }}>
          {[
            {
              icon: <PeopleIcon />,
              label: t("instructorDashboard.totalStudents"),
              value: aggregateStats.totalStudents,
              color: "#81c784",
            },
            {
              icon: <AssignmentIcon />,
              label: t("instructorDashboard.totalAssignments"),
              value: aggregateStats.totalAssignments,
              color: "#64b5f6",
            },
            {
              icon: <EmojiEventsIcon />,
              label: t("instructorDashboard.averageGrade"),
              value: `${aggregateStats.avgGrade}%`,
              color:
                aggregateStats.avgGrade >= 80
                  ? "#a5d6a7"
                  : aggregateStats.avgGrade >= 60
                    ? "#fff176"
                    : "#ef9a9a",
            },
            {
              icon: <CheckCircleIcon />,
              label: t("instructorDashboard.averageCompletion"),
              value: `${aggregateStats.avgCompletion}%`,
              color: aggregateStats.avgCompletion >= 80 ? "#a5d6a7" : "#fff176",
            },
          ].map(({ icon, label, value, color }) => (
            <Box
              key={label}
              sx={{ display: "flex", flexDirection: "column", minWidth: 80 }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 0.5, color }}
              >
                {React.cloneElement(icon, { sx: { fontSize: "1rem" } })}
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, lineHeight: 1, color }}
                >
                  {value}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.7)", mt: 0.25 }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
        {globalAtRiskCount > 0 && (
          <Box sx={{ mt: 2 }}>
            <Chip
              icon={<WarningAmberIcon />}
              label={`${globalAtRiskCount} student${globalAtRiskCount !== 1 ? "s" : ""} at risk (avg < 60%)`}
              color="warning"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        )}
      </Paper>

      {/* ── SECTION CARDS ──────────────────────────────────────────────── */}
      {loading ? (
        <Stack spacing={2}>
          {validSections.map((s) => (
            <Skeleton
              key={s.id}
              variant="rounded"
              height={200}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Stack>
      ) : (
        <Stack spacing={3}>
          {validSections.map((section) => {
            const stats = sectionStats[section.id] || {
              studentCount: 0,
              averageGrade: 0,
              averageCompletion: 0,
              leaderboard: [],
              assignmentCount: 0,
            };
            const sectionAssignments = allAssignments.filter(
              (a) => a.sectionID === section.id,
            );
            const atRisk = stats.leaderboard.filter((s) => s.average < 60);
            const perfect = stats.leaderboard.filter((s) => s.average >= 90);
            const top5 = stats.leaderboard.slice(0, 5);
            const MEDAL = ["🥇", "🥈", "🥉"];

            return (
              <Card
                key={section.id}
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                {/* ── Section header ── */}
                <Box
                  sx={{
                    px: 2.5,
                    pt: 2,
                    pb: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {section.name}
                      </Typography>
                      {section.code && <CopyableCode code={section.code} />}
                    </Box>
                    {section.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.25, lineHeight: 1.4 }}
                      >
                        {section.description}
                      </Typography>
                    )}
                  </Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    flexShrink={0}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Chip
                      icon={<PeopleIcon />}
                      label={`${stats.studentCount} students`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<AssignmentIcon />}
                      label={`${stats.assignmentCount} assignments`}
                      size="small"
                      variant="outlined"
                    />
                    {atRisk.length > 0 && (
                      <Chip
                        icon={<WarningAmberIcon />}
                        label={`${atRisk.length} at risk`}
                        size="small"
                        color="warning"
                      />
                    )}
                    {perfect.length > 0 && (
                      <Chip
                        icon={<EmojiEventsIcon />}
                        label={`${perfect.length} excelling`}
                        size="small"
                        color="success"
                      />
                    )}
                  </Stack>
                </Box>

                <Box sx={{ p: 2.5 }}>
                  {/* ── Progress bars ── */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                      mb: 2.5,
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Avg Grade
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: `${gradeColor(stats.averageGrade)}.main`,
                          }}
                        >
                          {stats.averageGrade}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={stats.averageGrade}
                        color={gradeColor(stats.averageGrade)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Avg Completion
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: `${gradeColor(stats.averageCompletion)}.main`,
                          }}
                        >
                          {stats.averageCompletion}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={stats.averageCompletion}
                        color={gradeColor(stats.averageCompletion)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Box>

                  {/* ── Assignment submission breakdown ── */}
                  {sectionAssignments.length > 0 && (
                    <Box sx={{ mb: 2.5 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          display: "block",
                          mb: 1,
                        }}
                      >
                        Assignment Submissions
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {sectionAssignments.map((assignment) => {
                          const submitted = allGrades.filter(
                            (g) =>
                              g.unitID === assignment.unitID &&
                              (!g.sectionID || g.sectionID === section.id) &&
                              g.complete,
                          ).length;
                          const unitName =
                            allUnits[assignment.unitID]?.name ||
                            assignment.unitID.slice(0, 8);
                          const pct =
                            stats.studentCount > 0
                              ? Math.round(
                                  (submitted / stats.studentCount) * 100,
                                )
                              : 0;
                          return (
                            <Tooltip
                              key={assignment.id}
                              title={`${unitName}: ${submitted}/${stats.studentCount} submitted (${pct}%)`}
                            >
                              <Chip
                                label={`${unitName.slice(0, 18)}${unitName.length > 18 ? "…" : ""} · ${submitted}/${stats.studentCount}`}
                                size="small"
                                color={
                                  pct === 100
                                    ? "success"
                                    : pct >= 50
                                      ? "warning"
                                      : "default"
                                }
                                variant={pct === 100 ? "filled" : "outlined"}
                                sx={{ fontSize: "0.72rem" }}
                              />
                            </Tooltip>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* ── At-risk alert ── */}
                  {atRisk.length > 0 && (
                    <Alert
                      severity="warning"
                      icon={<WarningAmberIcon />}
                      sx={{ mb: 2, py: 0.5 }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Students needing support:
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 0.5 }}
                      >
                        {atRisk.map((s) => (
                          <Chip
                            key={s.studentId}
                            avatar={
                              <DiceBearAvatar
                                seed={s.studentId}
                                size={20}
                                style="simple"
                              />
                            }
                            label={`${formatLastFirst(sectionStudents[s.studentId] || { id: s.studentId })} · ${Math.round(s.average)}%`}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Alert>
                  )}

                  {/* ── Leaderboard (top 5) ── */}
                  {top5.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          display: "block",
                          mb: 1,
                        }}
                      >
                        Top Students
                      </Typography>
                      <Stack spacing={0.75}>
                        {top5.map((student, idx) => (
                          <Box
                            key={student.studentId}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              px: 1.5,
                              py: 0.75,
                              borderRadius: 2,
                              bgcolor:
                                idx === 0
                                  ? "rgba(255,215,0,0.08)"
                                  : idx === 1
                                    ? "rgba(192,192,192,0.08)"
                                    : idx === 2
                                      ? "rgba(205,127,50,0.08)"
                                      : "action.hover",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "1rem",
                                width: 24,
                                textAlign: "center",
                              }}
                            >
                              {MEDAL[idx] || `#${idx + 1}`}
                            </Typography>
                            <DiceBearAvatar
                              seed={student.studentId}
                              size={28}
                              style="simple"
                              label={formatLastFirst(
                                sectionStudents[student.studentId] || {
                                  id: student.studentId,
                                },
                              )}
                            />
                            <Typography
                              variant="body2"
                              sx={{ flex: 1, fontWeight: idx < 3 ? 600 : 400 }}
                              noWrap
                            >
                              {formatLastFirst(
                                sectionStudents[student.studentId] || {
                                  id: student.studentId,
                                },
                              )}
                            </Typography>
                            <Chip
                              label={`${Math.round(student.average)}%`}
                              size="small"
                              color={gradeColor(student.average)}
                              sx={{ fontWeight: 700, minWidth: 52 }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              {student.assignmentsCompleted}/
                              {student.totalAssignments} done
                            </Typography>
                            <Box sx={{ width: 48 }}>
                              <LinearProgress
                                variant="determinate"
                                value={student.completion}
                                color={gradeColor(student.completion)}
                                sx={{ height: 5, borderRadius: 3 }}
                              />
                            </Box>
                          </Box>
                        ))}
                        {stats.leaderboard.length > 5 && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ textAlign: "center", pt: 0.5 }}
                          >
                            +{stats.leaderboard.length - 5} more students
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  )}

                  {stats.leaderboard.length === 0 && (
                    <Typography
                      color="text.secondary"
                      sx={{ textAlign: "center", py: 2 }}
                    >
                      {t("instructorDashboard.noDataYet")}
                    </Typography>
                  )}
                </Box>

                {/* ── Footer actions ── */}
                <Box
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    alignItems: "center",
                    bgcolor: "action.hover",
                  }}
                >
                  <Button
                    component="a"
                    href={`/section/${section.id}`}
                    size="small"
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Manage Section
                  </Button>
                  <SkillTreePopupButton
                    sectionId={section.id}
                    label={section.name}
                  />
                  <Button
                    component="a"
                    href={`/section/${section.id}#peer-review`}
                    size="small"
                    variant="outlined"
                    startIcon={<RateReviewIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Peer Review
                  </Button>
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
{
  /* Aggregate Statistics */
}
