import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "../utils/amplifyClient";
import {
  Box,
  Card,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Stack,
  Tooltip,
  Alert,
  Skeleton,
  Button,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RateReviewIcon from "@mui/icons-material/RateReview";
import FlagIcon from "@mui/icons-material/Flag";
import BoltIcon from "@mui/icons-material/Bolt";
import HistoryIcon from "@mui/icons-material/History";
import GppBadIcon from "@mui/icons-material/GppBad";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { AvatarDisplay } from "./Gamification/AvatarDisplay";
import { SkillTreePopupButton } from "./SkillTreePopupButton";
import { listSectionStudents } from "../../app/actions/section";
import { formatLastFirst } from "../utils/formatUserName";

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

function isRecentlyActive(dateStr) {
  if (!dateStr) return false;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(dateStr).getTime() > sevenDaysAgo;
}

// ── Grade distribution helper ─────────────────────────────────────────────
/** Stacked bar showing share of students in each grade band. */
function GradeDistributionBar({ distribution }) {
  const { a = 0, b = 0, c = 0, f = 0, total = 0 } = distribution;
  if (total === 0) return null;
  const bands = [
    { key: "a", label: "A (90+)", count: a, color: "#66bb6a" },
    { key: "b", label: "B (80–89)", count: b, color: "#42a5f5" },
    { key: "c", label: "C (60–79)", count: c, color: "#ffa726" },
    { key: "f", label: "F (<60)", count: f, color: "#ef5350" },
  ].filter((band) => band.count > 0);

  return (
    <Tooltip
      title={bands
        .map((b) => `${b.label}: ${b.count} student${b.count !== 1 ? "s" : ""}`)
        .join(" · ")}
    >
      <Box
        sx={{
          display: "flex",
          height: 8,
          borderRadius: 4,
          overflow: "hidden",
          gap: "1px",
          cursor: "default",
        }}
      >
        {bands.map((band) => (
          <Box
            key={band.key}
            sx={{
              flex: band.count,
              bgcolor: band.color,
              minWidth: 4,
            }}
          />
        ))}
      </Box>
    </Tooltip>
  );
}


export default function InstructorDashboard({ sections = [] }) {
  const t = useTranslations("components");
  const client = getAmplifyClient();

  const [sectionStats, setSectionStats] = useState({});
  const [allGrades, setAllGrades] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [flaggedGrades, setFlaggedGrades] = useState([]);
  const [flaggedChats, setFlaggedChats] = useState([]);
  const [sectionStudents, setSectionStudents] = useState({});
  const [allUnits, setAllUnits] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch all completed grades (no assignment filter — section-based)
  useEffect(() => {
    if (sections.length === 0) {
      setLoading(false);
      return;
    }

    const subscription = client.models.Grade.observeQuery().subscribe({
      next: ({ items }) => {
        const validItems = items.filter(
          (item) => item != null && item.id != null,
        );
        setAllGrades(validItems);

        // Extract moderation-flagged grades
        const flagged = validItems.filter(
          (g) =>
            g.moderation?.status === "flagged" ||
            g.moderation?.status === "pending",
        );
        setFlaggedGrades(flagged);
      },
      error: (err) => {
        if (
          err?.message?.includes("No current user") ||
          err?.message?.includes("DuplicatedOperationError")
        ) {
          console.warn("[InstructorDashboard] Grade subscription:", err.message);
          subscription.unsubscribe();
        }
      },
    });

    return () => subscription.unsubscribe();
  }, [sections.length]);

  // Fetch assignments for all instructor sections (for per-unit completion rates)
  useEffect(() => {
    if (sections.length === 0) return;
    const validSections = sections.filter((s) => s != null && s.id != null);
    if (validSections.length === 0) return;
    const sectionIDs = validSections.map((s) => s.id);

    const subscription = client.models.Assignment.observeQuery({
      filter: { or: sectionIDs.map((id) => ({ sectionID: { eq: id } })) },
    }).subscribe({
      next: ({ items }) => {
        setAllAssignments(items.filter((item) => item != null && item.id != null));
      },
      error: (err) => {
        if (
          err?.message?.includes("No current user") ||
          err?.message?.includes("DuplicatedOperationError")
        ) {
          console.warn("[InstructorDashboard] Assignment subscription:", err.message);
          subscription.unsubscribe();
        }
      },
    });

    return () => subscription.unsubscribe();
  }, [sections.length]);

  // Fetch flagged chats
  useEffect(() => {
    if (sections.length === 0) return;

    const subscription = client.models.AssistantChat.observeQuery({
      filter: { moderationFlag: { eq: true } },
    }).subscribe({
      next: ({ items }) => {
        const validItems = items.filter(
          (item) => item != null && item.id != null,
        );
        setFlaggedChats(validItems);
      },
      error: (err) => {
        if (
          err?.message?.includes("DuplicatedOperationError") ||
          err?.message?.includes("No current user")
        ) {
          console.warn("[InstructorDashboard] Chat subscription:", err.message);
          subscription.unsubscribe();
        }
      },
    });

    return () => subscription.unsubscribe();
  }, [sections.length]);

  // Fetch student names
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

  // Fetch unit names
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

  // Calculate per-section analytics
  useEffect(() => {
    if (sections.length === 0) {
      setLoading(false);
      return;
    }

    const stats = {};
    const validSections = sections.filter((s) => s != null && s.id != null);

    for (const section of validSections) {
      // Grades for this section
      const sectionGrades = allGrades.filter(
        (g) => g.sectionID === section.id,
      );
      const completedGrades = sectionGrades.filter(
        (g) => g.complete && g.accuracy != null,
      );

      // Per-student aggregation
      const studentMap = {};
      completedGrades.forEach((grade) => {
        if (!studentMap[grade.owner]) {
          studentMap[grade.owner] = { grades: [], lastActive: null };
        }
        studentMap[grade.owner].grades.push(grade);
        const ts = grade._lastChangedAt || grade.createdAt;
        if (
          ts &&
          (!studentMap[grade.owner].lastActive ||
            ts > studentMap[grade.owner].lastActive)
        ) {
          studentMap[grade.owner].lastActive = ts;
        }
      });

      const studentRankings = Object.entries(studentMap)
        .map(([studentId, data]) => {
          // Best grade per unit
          const byUnit = {};
          data.grades.forEach((g) => {
            if (!byUnit[g.unitID] || g.accuracy > byUnit[g.unitID].accuracy) {
              byUnit[g.unitID] = g;
            }
          });
          const grades = Object.values(byUnit).map((g) => g.accuracy);
          const average =
            grades.length > 0
              ? grades.reduce((sum, g) => sum + g, 0) / grades.length
              : 0;
          return {
            studentId,
            average,
            unitsCompleted: grades.length,
            lastActive: data.lastActive,
          };
        })
        .sort((a, b) => b.average - a.average);

      const activeThisWeek = studentRankings.filter((s) =>
        isRecentlyActive(
          s.lastActive ? new Date(s.lastActive).toISOString() : null,
        ),
      ).length;

      // Recent completions (last 5 grades for this section)
      const recentActivity = [...completedGrades]
        .sort(
          (a, b) =>
            (b._lastChangedAt || 0) - (a._lastChangedAt || 0),
        )
        .slice(0, 5);

      // Grade distribution buckets (per unique student's average)
      const distribution = { a: 0, b: 0, c: 0, f: 0, total: studentRankings.length };
      studentRankings.forEach(({ average }) => {
        if (average >= 90) distribution.a++;
        else if (average >= 80) distribution.b++;
        else if (average >= 60) distribution.c++;
        else distribution.f++;
      });

      // Per-unit completion: for each assignment in this section, how many unique
      // students have a completed grade?
      const sectionAssignments = allAssignments.filter(
        (a) => a.sectionID === section.id,
      );
      const unitCompletion = sectionAssignments.map((assignment) => {
        const submitters = new Set(
          completedGrades
            .filter((g) => g.unitID === assignment.unitID)
            .map((g) => g.owner),
        );
        return {
          assignmentId: assignment.id,
          unitID: assignment.unitID,
          dueDate: assignment.dueDate,
          submittedCount: submitters.size,
          totalStudents: studentRankings.length,
        };
      });

      stats[section.id] = {
        studentCount: studentRankings.length,
        activeThisWeek,
        averageGrade:
          studentRankings.length > 0
            ? Math.round(
                studentRankings.reduce((sum, s) => sum + s.average, 0) /
                  studentRankings.length,
              )
            : 0,
        distribution,
        unitCompletion,
        leaderboard: studentRankings.slice(0, 10),
        recentActivity,
        flaggedCount: flaggedGrades.filter(
          (g) => g.sectionID === section.id,
        ).length,
      };
    }

    setSectionStats(stats);
    setLoading(false);
  }, [sections, allGrades, allAssignments, flaggedGrades]);

  // Aggregate stats
  const aggregateStats = React.useMemo(() => {
    const totalStudents = Object.values(sectionStats).reduce(
      (sum, s) => sum + s.studentCount,
      0,
    );
    const activeThisWeek = Object.values(sectionStats).reduce(
      (sum, s) => sum + s.activeThisWeek,
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
    const moderationAlerts = flaggedGrades.length + flaggedChats.length;

    return { totalStudents, activeThisWeek, avgGrade, moderationAlerts };
  }, [sectionStats, flaggedGrades, flaggedChats]);

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
              icon: <BoltIcon />,
              label: "Active This Week",
              value: aggregateStats.activeThisWeek,
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
              icon: <FlagIcon />,
              label: "Moderation Alerts",
              value: aggregateStats.moderationAlerts,
              color:
                aggregateStats.moderationAlerts > 0 ? "#ef9a9a" : "#a5d6a7",
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

      {/* ── MODERATION NOTICES ─────────────────────────────────────────── */}
      {(flaggedGrades.length > 0 || flaggedChats.length > 0) && (
        <Alert
          severity="error"
          icon={<GppBadIcon />}
          sx={{ mb: 3, borderRadius: 3 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Content flagged for review ({flaggedGrades.length + flaggedChats.length} item{flaggedGrades.length + flaggedChats.length !== 1 ? "s" : ""})
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {flaggedGrades.map((grade) => (
              <Chip
                key={grade.id}
                icon={<GppBadIcon />}
                avatar={
                  <AvatarDisplay seed={grade.owner} size={20} style="simple" />
                }
                label={`${formatLastFirst(sectionStudents[grade.owner] || { id: grade.owner })} — ${allUnits[grade.unitID]?.name || "Submission"}`}
                size="small"
                color="error"
                variant="outlined"
                component="a"
                href={`/section/${grade.sectionID}#grade-${grade.id}`}
                clickable
                sx={{ "& .MuiChip-icon": { order: -1 } }}
              />
            ))}
            {flaggedChats.map((chat) => (
              <Chip
                key={chat.id}
                icon={<ChatBubbleOutlineIcon />}
                avatar={
                  <AvatarDisplay seed={chat.owner} size={20} style="simple" />
                }
                label={`${formatLastFirst(sectionStudents[chat.owner] || { id: chat.owner })} — Chat session flagged`}
                size="small"
                color="error"
                variant="outlined"
                component="a"
                href={chat.sectionID ? `/section/${chat.sectionID}` : "#"}
                clickable
                sx={{ "& .MuiChip-icon": { order: -1 } }}
              />
            ))}
          </Stack>
        </Alert>
      )}

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
              activeThisWeek: 0,
              averageGrade: 0,
              distribution: { a: 0, b: 0, c: 0, f: 0, total: 0 },
              unitCompletion: [],
              leaderboard: [],
              recentActivity: [],
              flaggedCount: 0,
            };
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
                      icon={<BoltIcon />}
                      label={`${stats.activeThisWeek} active`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                    {stats.flaggedCount > 0 && (
                      <Chip
                        icon={<FlagIcon />}
                        label={`${stats.flaggedCount} flagged`}
                        size="small"
                        color="error"
                      />
                    )}
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
                  {/* ── Avg Grade + distribution ── */}
                  <Box sx={{ mb: 2.5 }}>
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
                      sx={{ height: 8, borderRadius: 4, mb: 0.75 }}
                    />
                    <GradeDistributionBar distribution={stats.distribution} />
                    {stats.distribution.total > 0 && (
                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ mt: 0.5 }}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {stats.distribution.a > 0 && (
                          <Typography variant="caption" sx={{ color: "#66bb6a" }}>
                            A: {stats.distribution.a}
                          </Typography>
                        )}
                        {stats.distribution.b > 0 && (
                          <Typography variant="caption" sx={{ color: "#42a5f5" }}>
                            B: {stats.distribution.b}
                          </Typography>
                        )}
                        {stats.distribution.c > 0 && (
                          <Typography variant="caption" sx={{ color: "#ffa726" }}>
                            C: {stats.distribution.c}
                          </Typography>
                        )}
                        {stats.distribution.f > 0 && (
                          <Typography variant="caption" sx={{ color: "#ef5350" }}>
                            F: {stats.distribution.f}
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </Box>

                  {/* ── Class progress by unit ── */}
                  {stats.unitCompletion.length > 0 && (
                    <Box sx={{ mb: 2.5 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mb: 1,
                        }}
                      >
                        <AssignmentTurnedInIcon sx={{ fontSize: "0.85rem" }} />
                        Class Progress by Unit
                      </Typography>
                      <Stack spacing={0.75}>
                        {stats.unitCompletion.map((uc) => {
                          const pct =
                            uc.totalStudents > 0
                              ? Math.round(
                                  (uc.submittedCount / uc.totalStudents) * 100,
                                )
                              : 0;
                          const unitName =
                            allUnits[uc.unitID]?.name ||
                            uc.unitID?.slice(0, 8) ||
                            "Unit";
                          return (
                            <Box key={uc.assignmentId}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  mb: 0.25,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                  sx={{ maxWidth: "65%" }}
                                >
                                  {unitName}
                                  {uc.dueDate && (
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      color="text.disabled"
                                      sx={{ ml: 0.5 }}
                                    >
                                      · due{" "}
                                      {new Date(uc.dueDate).toLocaleDateString(
                                        undefined,
                                        { month: "short", day: "numeric" },
                                      )}
                                    </Typography>
                                  )}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 700,
                                    color:
                                      pct === 100
                                        ? "success.main"
                                        : pct >= 50
                                          ? "warning.main"
                                          : "text.secondary",
                                  }}
                                >
                                  {uc.submittedCount}/{uc.totalStudents}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                color={
                                  pct === 100
                                    ? "success"
                                    : pct >= 50
                                      ? "warning"
                                      : "inherit"
                                }
                                sx={{ height: 5, borderRadius: 3 }}
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* ── Recent Activity ── */}
                  {stats.recentActivity.length > 0 && (
                    <Box sx={{ mb: 2.5 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mb: 1,
                        }}
                      >
                        <HistoryIcon sx={{ fontSize: "0.85rem" }} />
                        Recent Activity
                      </Typography>
                      <Stack spacing={0.5}>
                        {stats.recentActivity.map((grade) => (
                          <Box
                            key={grade.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: "action.hover",
                            }}
                          >
                            <AvatarDisplay
                              seed={grade.owner}
                              size={22}
                              style="simple"
                            />
                            <Typography
                              variant="body2"
                              sx={{ flex: 1 }}
                              noWrap
                            >
                              {formatLastFirst(
                                sectionStudents[grade.owner] || {
                                  id: grade.owner,
                                },
                              )}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {allUnits[grade.unitID]?.name ||
                                grade.unitID?.slice(0, 8)}
                            </Typography>
                            <Chip
                              label={`${Math.round(grade.accuracy)}%`}
                              size="small"
                              color={gradeColor(grade.accuracy)}
                              sx={{ fontWeight: 700, minWidth: 44 }}
                            />
                          </Box>
                        ))}
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
                              <AvatarDisplay
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
                            <AvatarDisplay
                              seed={student.studentId}
                              size={28}
                              style="simple"
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
                              {student.unitsCompleted} units
                            </Typography>
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
