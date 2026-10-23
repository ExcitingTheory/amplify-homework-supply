import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "../utils/amplifyClient";
import {
  Box,
  Card,
  Typography,
  Paper,
  Chip,
  Stack,
  Tooltip,
  Alert,
  Skeleton,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Badge,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { getGrainySheenSx } from "../utils/grainySheen";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import AddIcon from "@mui/icons-material/Add";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RateReviewIcon from "@mui/icons-material/RateReview";
import FlagIcon from "@mui/icons-material/Flag";
import BoltIcon from "@mui/icons-material/Bolt";
import GppBadIcon from "@mui/icons-material/GppBad";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TuneIcon from "@mui/icons-material/Tune";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { AvatarDisplay } from "./Gamification/AvatarDisplay";
import { Link } from "../i18n/navigation";
import { EmptyState } from "./EmptyState";
import { SkillTreePopupButton } from "./SkillTreePopupButton";
import { listSectionStudents } from "../../app/actions/section";
import { formatLastFirst } from "../utils/formatUserName";
import { DASHBOARD_TOKENS } from "./Dashboard/constants";
import { ParentSectionCard } from "./Dashboard/ParentSectionCard";
import { SectionHeader } from "./Dashboard/SectionHeader";
import { CompactStudentTable } from "./Dashboard/CompactStudentTable";
import { GradeDistributionDonut } from "./Dashboard/GradeDistributionDonut";
import { WeeklyParticipationChart } from "./Dashboard/WeeklyParticipationChart";
import { SectionComparisonChart } from "./Dashboard/SectionComparisonChart";
import { UnitDifficultyList } from "./Dashboard/UnitDifficultyList";
import { TrendSparkline } from "./Dashboard/TrendSparkline";
import { SubmissionTimingBar } from "./Dashboard/SubmissionTimingBar";
import { GradeRangeBar, CompletionBar } from "./Dashboard/GradeRangeBar";

// ── Helpers ──────────────────────────────────────────────────────────────────
function gradeColor(pct) {
  if (pct >= 80) return "success";
  if (pct >= 60) return "warning";
  return "error";
}

function isRecentlyActive(dateStr) {
  if (!dateStr) return false;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(dateStr).getTime() > sevenDaysAgo;
}

// Min/mean/max for a unit's best-per-student accuracies — null when nobody has submitted yet.
function computeGradeStats(values) {
  if (!values || values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return { min, avg, max };
}

// Day-bucketed counts for the trailing 7 days (oldest first, today last) — shared by the participation and flagged-trend sparklines.
function computeDailyCounts(items, getTimestamp) {
  const dayStarts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dayStarts.push(d);
  }
  return dayStarts.map((dayStart) => {
    const dayEnd = dayStart.getTime() + 24 * 60 * 60 * 1000;
    const count = items.filter((item) => {
      const ts = getTimestamp(item);
      if (!ts) return false;
      const t = new Date(ts).getTime();
      return t >= dayStart.getTime() && t < dayEnd;
    }).length;
    return { date: dayStart.toISOString(), count };
  });
}

// Trailing 7 UTC-day counts from the Lambda-maintained Section.activityFeed.activityByDay
// map (keyed by UTC YYYY-MM-DD, since the rollup Lambda runs in UTC) — zero-fills any day
// with no activity instead of only including days that happen to have an entry.
function weeklyParticipationFromActivityByDay(activityByDay) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    days.push({ date: dateKey, count: activityByDay?.[dateKey] || 0 });
  }
  return days;
}

// Lambda-maintained a.json() rollup fields (Assignment.gradeSummary, Section.studentProgress)
// come back as JSON strings, same convention as Section.gradeOverrides/accommodations.
function parseJsonMaybe(value) {
  if (value == null) return null;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

// Formats Grade.engagedTimeMs-derived durations (e.g. "4m 30s", "1h 12m") for display.
function formatEngagedTime(ms, t) {
  if (ms == null || !(ms > 0)) return null;
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0)
    return t("instructorDashboard.engagedHoursMinutes", { hours, minutes });
  if (minutes > 0)
    return t("instructorDashboard.engagedMinutesSeconds", { minutes, seconds });
  return t("instructorDashboard.engagedSeconds", { seconds });
}

// Mirrors SectionDetailClient's per-assignment curve methods so the instructor
// dashboard's "curved" grade bar matches what students actually see.
function applyCurveToGrade(grade, method, maxScore, avgScore) {
  if (method === "scale-to-top") {
    const adjustment = maxScore > 0 ? 100 / maxScore : 1;
    return Math.min(100, Math.round(grade * adjustment));
  }
  if (method === "linear-adjustment") {
    const adjustment = 75 - avgScore;
    return Math.min(100, Math.max(0, Math.round(grade + adjustment)));
  }
  return grade;
}

const HERO_STAT_ICON_SX = { fontSize: "1rem" };
const DUE_DATE_FORMAT = { month: "short", day: "numeric" };
const TOOLTIP_SEGMENT_SEPARATOR = " · ";

// ── Section footer actions ────────────────────────────────────────────────
/** Secondary actions (Skills, overflow menu) stay left; Manage Section is the sole primary action, right-aligned. */
function SectionFooterActions({ section }) {
  const t = useTranslations("components");
  const [anchorEl, setAnchorEl] = useState(null);
  return (
    <Box
      sx={{
        px: 2.5,
        py: 1.5,
        borderTop: "1px solid",
        borderColor: "divider",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        bgcolor: "action.hover",
      }}
    >
      <Box
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}
      >
        <SkillTreePopupButton
          sectionId={section.id}
          label={section.name}
          size="small"
          sx={{ color: "text.secondary", borderColor: "divider" }}
        />
        <Tooltip title={t("instructorDashboard.moreActions")}>
          <IconButton
            size="small"
            onClick={(event) => setAnchorEl(event.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem
            component="a"
            href={`/section/${section.id}#peer-review`}
            onClick={() => setAnchorEl(null)}
          >
            <RateReviewIcon fontSize="small" sx={{ mr: 1 }} />
            {t("instructorDashboard.peerReview")}
          </MenuItem>
        </Menu>
      </Box>
      <Button
        component="a"
        href={`/section/${section.id}`}
        size="small"
        variant="contained"
        endIcon={<ArrowForwardIcon />}
      >
        {t("instructorDashboard.manageSection")}
      </Button>
    </Box>
  );
}

export default function InstructorDashboard({ sections = [] }) {
  const t = useTranslations("components");
  const gradeAggregationLabels = {
    MIN: t("instructorDashboard.gradeAggregationLowest"),
    MAX: t("instructorDashboard.gradeAggregationHighest"),
    AVG: t("instructorDashboard.gradeAggregationAverage"),
    MEDIAN: t("instructorDashboard.gradeAggregationMedian"),
  };
  const client = getAmplifyClient();
  const theme = useTheme();

  const [sectionStats, setSectionStats] = useState({});
  const [allAssignments, setAllAssignments] = useState([]);
  const [flaggedGrades, setFlaggedGrades] = useState([]);
  const [flaggedChats, setFlaggedChats] = useState([]);
  const [sectionStudents, setSectionStudents] = useState({});
  const [allUnits, setAllUnits] = useState({});
  const [allSkills, setAllSkills] = useState([]);
  const [allGroupChallenges, setAllGroupChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  // Per-section active tab (Overview / Needs Support / Activity / Top Students) — defaults computed per section below.
  const [sectionTabs, setSectionTabs] = useState({});
  const isMobile = useMediaQuery("(max-width:599.95px)");

  // Moderation-flagged grades only — recent activity, weekly participation, and
  // per-unit progress now all come from Lambda-maintained rollups (Section.activityFeed,
  // Section.studentProgress, Assignment.gradeSummary), so this subscription no longer
  // needs to hold every Grade row in component state.
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
          console.warn(
            "[InstructorDashboard] Grade subscription:",
            err.message,
          );
          subscription.unsubscribe();
        }
      },
    });

    return () => subscription.unsubscribe();
  }, [sections.length, client.models.Grade]);

  const sectionIDKey = sections
    .filter((s) => s != null && s.id != null)
    .map((s) => s.id)
    .join(",");

  // Fetch assignments for all instructor sections (for per-unit completion rates)
  useEffect(() => {
    if (!sectionIDKey) return;
    const sectionIDs = sectionIDKey.split(",");

    const subscription = client.models.Assignment.observeQuery({
      filter: { or: sectionIDs.map((id) => ({ sectionID: { eq: id } })) },
    }).subscribe({
      next: ({ items }) => {
        setAllAssignments(
          items.filter((item) => item != null && item.id != null),
        );
      },
      error: (err) => {
        if (
          err?.message?.includes("No current user") ||
          err?.message?.includes("DuplicatedOperationError")
        ) {
          console.warn(
            "[InstructorDashboard] Assignment subscription:",
            err.message,
          );
          subscription.unsubscribe();
        }
      },
    });

    return () => subscription.unsubscribe();
  }, [sectionIDKey, client.models.Assignment]);

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
  }, [sections.length, client.models.AssistantChat]);

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
  }, [sections.length, client.models.Unit]);

  // Fetch skills + group challenges (to detect gamification linked to draft units)
  useEffect(() => {
    if (sections.length === 0) return;
    const subscription = client.models.Skill.observeQuery().subscribe({
      next: ({ items }) => {
        setAllSkills(items.filter((s) => s != null && s.id != null));
      },
      error: (err) =>
        console.warn("[InstructorDashboard] Skill subscription error:", err),
    });
    return () => subscription.unsubscribe();
  }, [sections.length, client.models.Skill]);

  useEffect(() => {
    if (sections.length === 0) return;
    const subscription = client.models.GroupChallenge.observeQuery().subscribe({
      next: ({ items }) => {
        setAllGroupChallenges(items.filter((c) => c != null && c.id != null));
      },
      error: (err) =>
        console.warn(
          "[InstructorDashboard] GroupChallenge subscription error:",
          err,
        ),
    });
    return () => subscription.unsubscribe();
  }, [sections.length, client.models.GroupChallenge]);

  // Gamification items (skills, campaigns, unit gates) that reference a Unit still in DRAFT.
  // One issue per (source item, draft unit) pair so each chip can deep-link to that unit.
  const linkedDraftIssues = React.useMemo(() => {
    const issues = [];
    const unitName = (unitId) => allUnits[unitId]?.name || unitId;

    for (const skill of allSkills) {
      const draftUnitIds = (skill.unitIds || []).filter(
        (id) => allUnits[id]?.status === "DRAFT",
      );
      for (const unitId of draftUnitIds) {
        issues.push({
          key: `skill-${skill.id}-${unitId}`,
          unitId,
          label: t("instructorDashboard.draftIssueSkill", {
            skill: skill.title,
            unit: unitName(unitId),
          }),
        });
      }
    }

    for (const challenge of allGroupChallenges) {
      const draftUnitIds = (challenge.linkedUnitIds || []).filter(
        (id) => allUnits[id]?.status === "DRAFT",
      );
      if (
        challenge.unlockContentId &&
        allUnits[challenge.unlockContentId]?.status === "DRAFT"
      ) {
        draftUnitIds.push(challenge.unlockContentId);
      }
      for (const unitId of draftUnitIds) {
        issues.push({
          key: `challenge-${challenge.id}-${unitId}`,
          unitId,
          label: t("instructorDashboard.draftIssueCampaign", {
            campaign: challenge.title,
            unit: unitName(unitId),
          }),
        });
      }
    }

    for (const unit of Object.values(allUnits)) {
      if (
        unit.status === "DRAFT" &&
        (unit.requiredXP ||
          unit.requiredBadgeId ||
          unit.requiredModuleCompletion)
      ) {
        issues.push({
          key: `unit-gate-${unit.id}`,
          unitId: unit.id,
          label: t("instructorDashboard.draftIssueUnlockGate", {
            unit: unit.name || unit.id,
          }),
        });
      }
    }

    return issues;
  }, [allSkills, allGroupChallenges, allUnits, t]);

  // Calculate per-section analytics
  useEffect(() => {
    if (sections.length === 0) {
      setLoading(false);
      return;
    }

    const stats = {};
    const validSections = sections.filter((s) => s != null && s.id != null);

    for (const section of validSections) {
      // Per-student overall stats come straight from the Lambda-maintained
      // Section.studentProgress rollup (bounded by units assigned, not by
      // attempt count) — no client-side recomputation from raw Grade rows.
      const studentProgress = parseJsonMaybe(section.studentProgress) || {};
      const studentRankings = Object.entries(studentProgress)
        .map(([studentId, data]) => ({
          studentId,
          average: data?.averageGrade || 0,
          unitsCompleted: data?.unitsCompleted || 0,
          lastActive: data?.lastActive || null,
        }))
        .sort((a, b) => b.average - a.average);

      const activeThisWeek = studentRankings.filter((s) =>
        isRecentlyActive(s.lastActive),
      ).length;

      // Recent completions and weekly participation come from the Lambda-
      // maintained Section.activityFeed rollup (bounded day/entry window) —
      // no raw Grade scan of the section's full attempt history.
      const activityFeed = parseJsonMaybe(section.activityFeed) || {};
      const recentActivity = [...(activityFeed.recentActivity || [])]
        .reverse()
        .slice(0, 5)
        .map((a, i) => ({
          id: `${a.owner}-${a.unitID}-${a.timestamp}-${i}`,
          owner: a.owner,
          unitID: a.unitID,
          accuracy: a.accuracy,
        }));

      // Grade distribution buckets (per unique student's average)
      const distribution = {
        a: 0,
        b: 0,
        c: 0,
        f: 0,
        total: studentRankings.length,
      };
      studentRankings.forEach(({ average }) => {
        if (average >= 90) distribution.a++;
        else if (average >= 80) distribution.b++;
        else if (average >= 60) distribution.c++;
        else distribution.f++;
      });

      // Per-unit completion comes straight from the Lambda-maintained
      // Assignment.gradeSummary rollup (bounded by roster size, not attempt
      // count) — no client-side recomputation of best-per-student accuracy.
      const sectionAssignments = allAssignments.filter(
        (a) => a.sectionID === section.id,
      );

      // Per-assignment curve method, if this section has one configured.
      const curveByUnit = {};
      (section.curveSettings || []).forEach((setting) => {
        if (setting?.unitID) curveByUnit[setting.unitID] = setting.method;
      });

      // Per-assignment grade-aggregation method (which stat counts as "the"
      // grade across a student's attempts) — section-wide default, overridden
      // per-unit when present. The Lambda rollup already applies this method
      // into perStudentBest[*].effective; this map is only for the UI label.
      const gradeAggOverridesByUnit = {};
      (section.gradeAggregationOverrides || []).forEach((override) => {
        if (override?.unitID)
          gradeAggOverridesByUnit[override.unitID] = override.method;
      });

      const unitCompletion = sectionAssignments.map((assignment) => {
        const summary = parseJsonMaybe(assignment.gradeSummary) || {};
        const perStudentBest = summary.perStudentBest || {};
        // `effective` is "the" grade under the configured aggregation method —
        // fall back to `best` for rollups computed before this field existed.
        const rawGrades = Object.values(perStudentBest).map(
          (s) => s?.effective ?? s?.best ?? 0,
        );
        const gradeAggMethod =
          gradeAggOverridesByUnit[assignment.unitID] ||
          section.gradeAggregationMethod ||
          "MAX";
        const rawGradeStats = computeGradeStats(rawGrades);
        const curveMethod = curveByUnit[assignment.unitID] || null;
        const curvedGrades =
          curveMethod && rawGradeStats
            ? rawGrades.map((g) =>
                applyCurveToGrade(
                  g,
                  curveMethod,
                  rawGradeStats.max,
                  rawGradeStats.avg,
                ),
              )
            : null;
        // Days between each student's first completion and the due date
        // (negative = early) — also sourced from the rollup's perStudentBest
        // (each entry's firstCompletedAt), not a raw Grade timestamp scan.
        const timingOffsets = assignment.dueDate
          ? Object.values(perStudentBest)
              .map((s) => {
                if (!s?.firstCompletedAt) return null;
                return (
                  (new Date(s.firstCompletedAt).getTime() -
                    new Date(assignment.dueDate).getTime()) /
                  86400000
                );
              })
              .filter((v) => v != null)
          : [];
        // Avg time-on-task across students who've attempted this unit —
        // real engagement signal (Grade.engagedTimeMs), also from the rollup.
        const engagedTimes = Object.values(perStudentBest)
          .map((s) => s?.totalEngagedTimeMs)
          .filter((v) => typeof v === "number" && v > 0);
        const avgEngagedTimeMs =
          engagedTimes.length > 0
            ? engagedTimes.reduce((sum, v) => sum + v, 0) / engagedTimes.length
            : null;
        return {
          assignmentId: assignment.id,
          unitID: assignment.unitID,
          dueDate: assignment.dueDate,
          submittedCount: Object.keys(perStudentBest).length,
          totalStudents: studentRankings.length,
          rawGrades,
          curvedGrades,
          timingOffsets,
          avgEngagedTimeMs,
          gradeAggMethod,
        };
      });

      const possibleSubmissions = unitCompletion.reduce(
        (sum, unit) => sum + unit.totalStudents,
        0,
      );
      const completedSubmissions = unitCompletion.reduce(
        (sum, unit) => sum + unit.submittedCount,
        0,
      );

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
        weeklyParticipation: weeklyParticipationFromActivityByDay(
          activityFeed.activityByDay,
        ),
        completionRate: possibleSubmissions
          ? Math.round((completedSubmissions / possibleSubmissions) * 100)
          : 0,
        leaderboard: studentRankings.slice(0, 10),
        recentActivity,
        // Combined moderation-alert count (grades + chats) — must match the
        // per-section Alert banner below, which tallies both the same way.
        flaggedCount:
          flaggedGrades.filter((g) => g.sectionID === section.id).length +
          flaggedChats.filter((c) => c.sectionID === section.id).length,
      };
    }

    setSectionStats(stats);
    setLoading(false);
  }, [sections, allAssignments, flaggedGrades, flaggedChats]);

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
    const possibleSubmissions = Object.values(sectionStats).reduce(
      (sum, s) =>
        sum +
        (s.unitCompletion || []).reduce(
          (unitSum, unit) => unitSum + unit.totalStudents,
          0,
        ),
      0,
    );
    const completedSubmissions = Object.values(sectionStats).reduce(
      (sum, s) =>
        sum +
        (s.unitCompletion || []).reduce(
          (unitSum, unit) => unitSum + unit.submittedCount,
          0,
        ),
      0,
    );

    return {
      totalStudents,
      activeThisWeek,
      avgGrade,
      completionRate: possibleSubmissions
        ? Math.round((completedSubmissions / possibleSubmissions) * 100)
        : 0,
      moderationAlerts,
    };
  }, [sectionStats, flaggedGrades, flaggedChats]);

  // Cross-section rollup used by the global "Needs attention" panel —
  // surfaces intervention signals before per-section detail, instead of
  // leaving them buried inline on each section card.
  const needsAttentionSummary = React.useMemo(() => {
    const atRiskStudents = Object.values(sectionStats).reduce(
      (sum, s) =>
        sum + (s.leaderboard || []).filter((x) => x.average < 60).length,
      0,
    );
    const lowCompletionSections = sections
      .filter((s) => s != null && s.id != null)
      .filter((section) => {
        const stats = sectionStats[section.id];
        return !!stats && stats.studentCount > 0 && stats.completionRate < 50;
      });
    return { atRiskStudents, lowCompletionSections };
  }, [sectionStats, sections]);

  // Cross-section comparison — avg grade + completion rate per section, for spotting one struggling cohort against the rest.
  const sectionComparison = React.useMemo(() => {
    return sections
      .filter((s) => s != null && s.id != null)
      .map((section) => {
        const stats = sectionStats[section.id];
        return {
          id: section.id,
          name: section.name || t("instructorDashboard.untitledSection"),
          avgGrade: stats?.averageGrade ?? 0,
          completionRate: stats?.completionRate ?? 0,
          studentCount: stats?.studentCount ?? 0,
        };
      })
      .filter((section) => section.studentCount > 0);
  }, [sections, sectionStats, t]);

  // Hardest units across every section (lowest avg accuracy first) — the same unit taught in multiple sections is merged into one entry.
  const unitDifficulty = React.useMemo(() => {
    const byUnit = {};
    Object.values(sectionStats).forEach((stats) => {
      (stats.unitCompletion || []).forEach((uc) => {
        if (!uc.rawGrades || uc.rawGrades.length === 0) return;
        if (!byUnit[uc.unitID]) byUnit[uc.unitID] = [];
        byUnit[uc.unitID].push(...uc.rawGrades);
      });
    });
    return Object.entries(byUnit)
      .map(([unitID, grades]) => ({
        unitID,
        name: allUnits[unitID]?.name || unitID.slice(0, 8),
        avg: Math.round(grades.reduce((sum, g) => sum + g, 0) / grades.length),
        studentCount: grades.length,
      }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 6);
  }, [sectionStats, allUnits]);

  // Trailing 7-day count of newly flagged grades + chats, for the Needs Attention sparkline.
  const flaggedTrend = React.useMemo(
    () =>
      computeDailyCounts(
        [...flaggedGrades, ...flaggedChats],
        (item) => item._lastChangedAt || item.createdAt,
      ),
    [flaggedGrades, flaggedChats],
  );

  if (sections.length === 0) {
    return (
      <EmptyState
        icon={<PeopleIcon fontSize="inherit" />}
        title={t("instructorDashboard.noSectionsTitle")}
        description={t("instructorDashboard.noSectionsDescription")}
        action={
          <Button
            component="a"
            href="/sections"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              px: 4,
            }}
          >
            {t("instructorDashboard.createSection")}
          </Button>
        }
        sx={{ mb: 4, mx: "auto", width: "90vw", maxWidth: "80rem" }}
      />
    );
  }

  const validSections = sections.filter((s) => s != null && s.id != null);
  const heroStart = theme.palette.secondary.main;
  const heroEnd = theme.palette.error.main;
  // General contrast pick, not a heraldry tincture — use MUI's own API, not readableInk.
  const ink = theme.palette.getContrastText(heroStart);
  // "Pop" surface for the primary footer action — inverse of `ink` so it reads as a raised chip against the gradient either way.
  const heroPopBg =
    ink === theme.palette.common.white
      ? "rgba(255,255,255,0.95)"
      : "rgba(26,26,26,0.92)";
  const heroPopText =
    ink === theme.palette.common.white ? "#1a1a1a" : "#f5f5f5";
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <Box sx={{ mb: 4, mx: "auto", width: "90vw", maxWidth: "80rem" }}>
      {/* ── HERO SUMMARY BAR ───────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          // MUI's sx multiplies bare numeric borderRadius by theme.shape.borderRadius
          // (4) — must be an explicit px string or 6 silently becomes 24.
          borderRadius: `${DASHBOARD_TOKENS.radius.panel / 2}px`,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          ...getGrainySheenSx(heroStart, heroEnd),
          color: ink,
          p: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "inherit",
                opacity: 0.75,
                mb: 0.5,
              }}
            >
              {t("instructorDashboard.allSectionsDate", { date: todayLabel })}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingUpIcon sx={{ color: "inherit" }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: "inherit", lineHeight: 1.2 }}
              >
                {t("instructorDashboard.classHealth")}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: "inherit", opacity: 0.85, mt: 0.5, maxWidth: 520 }}
            >
              {t("instructorDashboard.classHealthSummary", {
                studentCount: aggregateStats.totalStudents,
                sectionCount: validSections.length,
                avgGrade: aggregateStats.avgGrade,
              })}
            </Typography>
          </Box>
          <Chip
            label={t("instructorDashboard.sectionCount", {
              count: validSections.length,
            })}
            size="small"
            sx={{
              bgcolor: alpha(ink, 0.18),
              border: "1px solid",
              borderColor: alpha(ink, 0.35),
              color: "inherit",
              fontWeight: 700,
              borderRadius: `${DASHBOARD_TOKENS.radius.chip}px`,
              flexShrink: 0,
            }}
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(5, minmax(0, 1fr))",
            },
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          {[
            {
              icon: <PeopleIcon />,
              label: t("instructorDashboard.totalStudents"),
              value: aggregateStats.totalStudents,
            },
            {
              icon: <BoltIcon />,
              label: t("instructorDashboard.activeThisWeek"),
              value: aggregateStats.activeThisWeek,
            },
            {
              icon: <EmojiEventsIcon />,
              label: t("instructorDashboard.averageGrade"),
              value: `${aggregateStats.avgGrade}%`,
            },
            {
              icon: <AssignmentTurnedInIcon />,
              label: t("instructorDashboard.completionRate"),
              value: `${aggregateStats.completionRate}%`,
            },
            {
              icon: <FlagIcon />,
              label: t("instructorDashboard.moderationAlerts"),
              value: aggregateStats.moderationAlerts,
            },
          ].map(({ icon, label, value }) => (
            <Box
              key={label}
              sx={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                gap: 0.25,
                px: 1.5,
                py: 1,
                borderRadius: `${DASHBOARD_TOKENS.radius.chip}px`,
                bgcolor: alpha(ink, 0.14),
                border: "1px solid",
                borderColor: alpha(ink, 0.24),
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "inherit",
                }}
              >
                {React.cloneElement(icon, { sx: HERO_STAT_ICON_SX })}
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, lineHeight: 1, color: "inherit" }}
                >
                  {value}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: "inherit", opacity: 0.7, mt: 0.25 }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
        <Stack
          direction="row"
          spacing={1}
          // eslint-disable-next-line i18next/no-literal-string -- CSS flex-wrap value
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 2 }}
        >
          <Button
            component="a"
            href="/admin/moderation"
            size="small"
            variant="outlined"
            startIcon={<FlagIcon />}
            sx={{
              color: "inherit",
              bgcolor: alpha(ink, 0.14),
              borderColor: alpha(ink, 0.35),
              whiteSpace: "nowrap",
              borderRadius: `${DASHBOARD_TOKENS.radius.chip}px`,
              "&:hover": { borderColor: ink, bgcolor: alpha(ink, 0.22) },
            }}
          >
            {t("instructorDashboard.reviewFlaggedContent")}
          </Button>
          {validSections[0] && (
            <Button
              component="a"
              href={`/section/${validSections[0].id}`}
              size="small"
              variant="outlined"
              startIcon={<AssignmentTurnedInIcon />}
              sx={{
                color: "inherit",
                bgcolor: alpha(ink, 0.14),
                borderColor: alpha(ink, 0.35),
                whiteSpace: "nowrap",
                borderRadius: `${DASHBOARD_TOKENS.radius.chip}px`,
                "&:hover": { borderColor: ink, bgcolor: alpha(ink, 0.22) },
              }}
            >
              {t("instructorDashboard.openGradeReview")}
            </Button>
          )}
          <Button
            component="a"
            href="/sections"
            size="small"
            variant="contained"
            disableElevation
            startIcon={<PeopleIcon />}
            sx={{
              bgcolor: heroPopBg,
              color: heroPopText,
              whiteSpace: "nowrap",
              borderRadius: `${DASHBOARD_TOKENS.radius.chip}px`,
              ml: { sm: "auto" },
              "&:hover": { bgcolor: heroPopBg, opacity: 0.88 },
            }}
          >
            {t("instructorDashboard.manageSections")}
          </Button>
        </Stack>
      </Paper>

      {/* ── NEEDS ATTENTION (cross-section rollup — distinct from the per-section
          flagged/at-risk alerts below, so instructors see the triage summary
          before drilling into any one section) ── */}
      {(aggregateStats.moderationAlerts > 0 ||
        needsAttentionSummary.atRiskStudents > 0 ||
        needsAttentionSummary.lowCompletionSections.length > 0 ||
        linkedDraftIssues.length > 0) && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
            border: "1px solid",
            borderColor: "warning.light",
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.06),
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <WarningAmberIcon color="warning" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {t("instructorDashboard.needsAttention")}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(auto-fit, minmax(220px, 1fr))",
              },
              gap: 2.5,
            }}
          >
            {aggregateStats.moderationAlerts > 0 && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {t("instructorDashboard.flaggedItemCount", {
                    count: aggregateStats.moderationAlerts,
                  })}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  {t("instructorDashboard.flaggedItemDescription")}
                </Typography>
                <TrendSparkline data={flaggedTrend} />
                <Button
                  component="a"
                  href="/admin/moderation"
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  {t("instructorDashboard.reviewFlaggedContent")}
                </Button>
              </Box>
            )}
            {needsAttentionSummary.atRiskStudents > 0 && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {t("instructorDashboard.atRiskStudentCount", {
                    count: needsAttentionSummary.atRiskStudents,
                  })}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  {t("instructorDashboard.atRiskDescription")}
                </Typography>
                {validSections[0] && (
                  <Button
                    component="a"
                    href={`/section/${validSections[0].id}#nav-section-gradebook`}
                    size="small"
                    variant="outlined"
                  >
                    {t("instructorDashboard.openGradeReview")}
                  </Button>
                )}
              </Box>
            )}
            {needsAttentionSummary.lowCompletionSections.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {t("instructorDashboard.sectionsBehindCount", {
                    count: needsAttentionSummary.lowCompletionSections.length,
                  })}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  {t("instructorDashboard.sectionsBehindDescription")}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  useFlexGap
                  // eslint-disable-next-line i18next/no-literal-string -- CSS flex-wrap value
                  flexWrap="wrap"
                >
                  {needsAttentionSummary.lowCompletionSections.map(
                    (section) => (
                      <Chip
                        key={section.id}
                        label={
                          section.name ||
                          t("instructorDashboard.untitledSection")
                        }
                        size="small"
                        variant="outlined"
                        component="a"
                        href={`/section/${section.id}`}
                        clickable
                      />
                    ),
                  )}
                </Stack>
              </Box>
            )}
            {linkedDraftIssues.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {t("instructorDashboard.gamificationIssueCount", {
                    count: linkedDraftIssues.length,
                  })}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  {t("instructorDashboard.gamificationIssueDescription")}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  useFlexGap
                  // eslint-disable-next-line i18next/no-literal-string -- CSS flex-wrap value
                  flexWrap="wrap"
                >
                  {linkedDraftIssues.map((issue) => (
                    <Tooltip
                      key={issue.key}
                      title={t("instructorDashboard.openUnitEditorToPublish")}
                    >
                      <Chip
                        label={issue.label}
                        size="small"
                        color="warning"
                        variant="outlined"
                        component="a"
                        href={`/unit/${issue.unitId}`}
                        clickable
                      />
                    </Tooltip>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* ── CROSS-SECTION INSIGHTS (section comparison + hardest units) —
          instructor-wide signals that don't belong to any single section
          card, placed after the urgent "Needs attention" triage above. ── */}
      {(sectionComparison.length > 1 || unitDifficulty.length > 0) && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2.5,
            mb: 3,
          }}
        >
          {sectionComparison.length > 1 && (
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  mb: 1.5,
                }}
              >
                {t("instructorDashboard.sectionComparison")}
              </Typography>
              <SectionComparisonChart sections={sectionComparison} />
            </Paper>
          )}
          {unitDifficulty.length > 0 && (
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  mb: 1.5,
                }}
              >
                {t("instructorDashboard.hardestUnits")}
              </Typography>
              <UnitDifficultyList units={unitDifficulty} />
            </Paper>
          )}
        </Box>
      )}

      {/* ── SECTION CARDS ──────────────────────────────────────────────── */}
      {loading ? (
        <Stack spacing={2}>
          {validSections.map((s) => (
            <Skeleton
              key={s.id}
              variant="rounded"
              height={200}
              sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.panel}px` }}
            />
          ))}
        </Stack>
      ) : (
        <Stack spacing={0}>
          {validSections.map((section) => {
            const stats = sectionStats[section.id] || {
              studentCount: 0,
              activeThisWeek: 0,
              averageGrade: 0,
              distribution: { a: 0, b: 0, c: 0, f: 0, total: 0 },
              unitCompletion: [],
              weeklyParticipation: [],
              leaderboard: [],
              recentActivity: [],
              flaggedCount: 0,
            };
            const atRisk = stats.leaderboard.filter((s) => s.average < 60);
            const perfect = stats.leaderboard.filter((s) => s.average >= 90);
            const top5 = stats.leaderboard.slice(0, 5);
            const sectionFlaggedGrades = flaggedGrades.filter(
              (g) => g.sectionID === section.id,
            );
            const sectionFlaggedChats = flaggedChats.filter(
              (c) => c.sectionID === section.id,
            );
            // Same total the header's "flagged" chip and the Activity tab badge use.
            const sectionFlaggedTotal =
              sectionFlaggedGrades.length + sectionFlaggedChats.length;
            // Default to the Needs Support tab when there's something to triage.
            const activeTab =
              sectionTabs[section.id] ||
              // eslint-disable-next-line i18next/no-literal-string -- tab value identifiers
              (atRisk.length > 0 ? "needs-support" : "overview");

            return (
              <ParentSectionCard
                key={section.id}
                expanded={!isMobile || expandedSections[section.id] === true}
                onToggle={() =>
                  setExpandedSections((current) => ({
                    ...current,
                    [section.id]: current[section.id] !== true,
                  }))
                }
                header={
                  <SectionHeader
                    name={section.name}
                    code={section.code}
                    description={section.description}
                    classSchedule={section.classSchedule}
                    averageGrade={stats.averageGrade}
                    studentCount={stats.studentCount}
                    activeCount={stats.activeThisWeek}
                    flaggedCount={stats.flaggedCount}
                    atRiskCount={atRisk.length}
                    excellingCount={perfect.length}
                  />
                }
              >
                {/* ── Flagged content (this section only) — full-bleed, flush
                    under the header, not inset with the rest of the body. ── */}
                {sectionFlaggedTotal > 0 && (
                  <Alert
                    severity="error"
                    icon={<GppBadIcon />}
                    sx={{
                      py: 0.5,
                      borderRadius: 0,
                      borderLeft: 0,
                      borderRight: 0,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {t("instructorDashboard.contentFlaggedForReview", {
                        count: sectionFlaggedTotal,
                      })}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      // eslint-disable-next-line i18next/no-literal-string -- CSS flex-wrap value
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {sectionFlaggedGrades.map((grade) => (
                        <Chip
                          key={grade.id}
                          avatar={
                            <AvatarDisplay
                              profileUsername={grade.owner}
                              seed={grade.owner}
                              size={20}
                              style="simple"
                            />
                          }
                          label={
                            <Link
                              href={`/section/${grade.sectionID}#grade-${grade.id}`}
                              style={{ color: "inherit", textDecoration: "none" }}
                            >
                              {t("instructorDashboard.flaggedGradeChip", {
                                student: formatLastFirst(
                                  sectionStudents[grade.owner] || {
                                    id: grade.owner,
                                  },
                                ),
                                unit:
                                  allUnits[grade.unitID]?.name ||
                                  t("instructorDashboard.submissionFallback"),
                              })}
                            </Link>
                          }
                          size="small"
                          color="error"
                          variant="outlined"
                          component="div"
                        />
                      ))}
                      {sectionFlaggedChats.map((chat) => (
                        <Chip
                          key={chat.id}
                          avatar={
                            <AvatarDisplay
                              profileUsername={chat.owner}
                              seed={chat.owner}
                              size={20}
                              style="simple"
                            />
                          }
                          label={
                            <Link
                              href={chat.sectionID ? `/section/${chat.sectionID}` : "#"}
                              style={{ color: "inherit", textDecoration: "none" }}
                            >
                              {t("instructorDashboard.flaggedChatChip", {
                                student: formatLastFirst(
                                  sectionStudents[chat.owner] || { id: chat.owner },
                                ),
                              })}
                            </Link>
                          }
                          size="small"
                          color="error"
                          variant="outlined"
                          component="div"
                        />
                      ))}
                    </Stack>
                  </Alert>
                )}

                <Box sx={{ p: 2.5, bgcolor: "background.default" }}>
                  {/* ── Section tabs: Overview / Needs Support / Activity / Top
                      Students — triage-first navigation instead of one long
                      scroll, defaulting to Needs Support when there's something
                      to act on. Skipped when the section has no student data
                      at all, in favor of a single empty state. ── */}
                  {stats.leaderboard.length === 0 ? (
                    <Typography
                      color="text.secondary"
                      sx={{ textAlign: "center", py: 2 }}
                    >
                      {t("instructorDashboard.noDataYet")}
                    </Typography>
                  ) : (
                    <>
                      <Tabs
                        value={activeTab}
                        onChange={(_, value) =>
                          setSectionTabs((current) => ({
                            ...current,
                            [section.id]: value,
                          }))
                        }
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                          mb: 2,
                          minHeight: 36,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          // Reserve room on the right so the last tab's badge
                          // isn't clipped by the scrollable container's edge.
                          "& .MuiTabs-scroller": { pr: 1.5 },
                          "& .MuiTab-root": {
                            minHeight: 36,
                            textTransform: "none",
                            fontWeight: 600,
                            py: 1,
                          },
                        }}
                      >
                        <Tab
                          value="overview"
                          label={t("instructorDashboard.tabOverview")}
                        />
                        <Tab
                          value="needs-support"
                          label={
                            atRisk.length > 0 ? (
                              <Badge
                                color="warning"
                                badgeContent={atRisk.length}
                              >
                                {t("instructorDashboard.tabNeedsSupport")}
                              </Badge>
                            ) : (
                              t("instructorDashboard.tabNeedsSupport")
                            )
                          }
                        />
                        <Tab
                          value="activity"
                          label={
                            sectionFlaggedTotal > 0 ? (
                              <Badge
                                color="error"
                                badgeContent={sectionFlaggedTotal}
                              >
                                {t("instructorDashboard.tabActivity")}
                              </Badge>
                            ) : (
                              t("instructorDashboard.tabActivity")
                            )
                          }
                        />
                        <Tab
                          value="top-students"
                          label={
                            perfect.length > 0 ? (
                              <Badge
                                color="success"
                                badgeContent={perfect.length}
                              >
                                {t("instructorDashboard.tabTopStudents")}
                              </Badge>
                            ) : (
                              t("instructorDashboard.tabTopStudents")
                            )
                          }
                        />
                      </Tabs>

                      {/* ── Overview: class health + progress by unit ── */}
                      {activeTab === "overview" && (
                        <Box>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                md: "1fr 2fr",
                              },
                              gap: 2.5,
                            }}
                          >
                            <Paper
                              elevation={0}
                              variant="outlined"
                              sx={{
                                p: 2,
                                borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
                                borderColor: "divider",
                              }}
                            >
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
                                {t("instructorDashboard.classHealthHeading")}
                              </Typography>
                              <GradeDistributionDonut
                                distribution={stats.distribution}
                              />
                              <Stack spacing={0.5} sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                  {t.rich(
                                    // eslint-disable-next-line i18next/no-literal-string -- next-intl rich-text key
                                    "instructorDashboard.averageGradeSummary",
                                    {
                                      value: stats.averageGrade,
                                      strong: (chunks) => (
                                        <strong>{chunks}</strong>
                                      ),
                                    },
                                  )}
                                </Typography>
                                <Typography variant="body2">
                                  {t.rich(
                                    // eslint-disable-next-line i18next/no-literal-string -- next-intl rich-text key
                                    "instructorDashboard.completionRateSummary",
                                    {
                                      value: stats.completionRate,
                                      strong: (chunks) => (
                                        <strong>{chunks}</strong>
                                      ),
                                    },
                                  )}
                                </Typography>
                              </Stack>
                            </Paper>

                            {stats.unitCompletion.length > 0 && (
                              <Paper
                                elevation={0}
                                variant="outlined"
                                sx={{
                                  p: 2,
                                  borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
                                  borderColor: "divider",
                                }}
                              >
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
                                  <AssignmentTurnedInIcon
                                    sx={{ fontSize: "0.85rem" }}
                                  />
                                  {t("instructorDashboard.classProgressByUnit")}
                                </Typography>
                                <Stack spacing={0.75}>
                                  {stats.unitCompletion.map((uc) => {
                                    const pct =
                                      uc.totalStudents > 0
                                        ? Math.round(
                                            (uc.submittedCount /
                                              uc.totalStudents) *
                                              100,
                                          )
                                        : 0;
                                    const unitName =
                                      allUnits[uc.unitID]?.name ||
                                      uc.unitID?.slice(0, 8) ||
                                      t("instructorDashboard.unitFallback");
                                    const engagedTime = formatEngagedTime(
                                      uc.avgEngagedTimeMs,
                                      t,
                                    );
                                    const completionTooltip = [
                                      t(
                                        "instructorDashboard.completionTooltip",
                                        {
                                          submitted: uc.submittedCount,
                                          total: uc.totalStudents,
                                          pct,
                                        },
                                      ),
                                      uc.dueDate &&
                                        t(
                                          "instructorDashboard.completionTooltipDue",
                                          {
                                            date: new Date(
                                              uc.dueDate,
                                            ).toLocaleDateString(
                                              undefined,
                                              DUE_DATE_FORMAT,
                                            ),
                                          },
                                        ),
                                      engagedTime &&
                                        t(
                                          "instructorDashboard.completionTooltipEngagement",
                                          { time: engagedTime },
                                        ),
                                    ]
                                      .filter(Boolean)
                                      .join(TOOLTIP_SEGMENT_SEPARATOR);
                                    const gradeBarBaseLabel = uc.curvedGrades
                                      ? t("instructorDashboard.rawGradesLabel")
                                      : t("instructorDashboard.gradesLabel");
                                    const gradeBarLabel =
                                      uc.gradeAggMethod &&
                                      uc.gradeAggMethod !== "MAX"
                                        ? t(
                                            "instructorDashboard.gradeBarLabelWithMethod",
                                            {
                                              label: gradeBarBaseLabel,
                                              method:
                                                gradeAggregationLabels[
                                                  uc.gradeAggMethod
                                                ] || uc.gradeAggMethod,
                                            },
                                          )
                                        : gradeBarBaseLabel;
                                    return (
                                      <Box key={uc.assignmentId}>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          noWrap
                                          sx={{ display: "block", mb: 0.5 }}
                                        >
                                          {unitName}
                                        </Typography>
                                        {/* Flush icon-led rows: completion, then
                                          grade-division pills (raw, then curved
                                          when the assignment has a curve) —
                                          same icon style as the answer block's
                                          meter rows, no verbose labels. */}
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                          }}
                                        >
                                          <Tooltip title={completionTooltip}>
                                            <DonutLargeIcon
                                              sx={{
                                                fontSize: 16,
                                                color: "text.disabled",
                                              }}
                                            />
                                          </Tooltip>
                                          <CompletionBar pct={pct} />
                                        </Box>
                                        {uc.rawGrades.length > 0 && (
                                          <GradeRangeBar
                                            icon={
                                              <CheckCircleIcon
                                                sx={{ fontSize: 16 }}
                                              />
                                            }
                                            label={gradeBarLabel}
                                            values={uc.rawGrades}
                                          />
                                        )}
                                        {uc.curvedGrades && (
                                          <GradeRangeBar
                                            icon={
                                              <TuneIcon sx={{ fontSize: 16 }} />
                                            }
                                            label={t(
                                              "instructorDashboard.curvedLabel",
                                            )}
                                            values={uc.curvedGrades}
                                          />
                                        )}
                                        {uc.timingOffsets.length > 0 && (
                                          <SubmissionTimingBar
                                            icon={
                                              <AccessTimeIcon
                                                sx={{ fontSize: 16 }}
                                              />
                                            }
                                            offsets={uc.timingOffsets}
                                          />
                                        )}
                                      </Box>
                                    );
                                  })}
                                </Stack>
                              </Paper>
                            )}
                          </Box>
                          {stats.weeklyParticipation.length > 0 && (
                            <Paper
                              elevation={0}
                              variant="outlined"
                              sx={{
                                mt: 2.5,
                                p: 2,
                                borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
                                borderColor: "divider",
                              }}
                            >
                              <WeeklyParticipationChart
                                days={stats.weeklyParticipation}
                              />
                            </Paper>
                          )}
                        </Box>
                      )}

                      {/* ── Needs Support: at-risk alert — full-bleed, flush
                          with the tab bar above, matching the flagged-content
                          alert's treatment rather than sitting inset. ── */}
                      {activeTab === "needs-support" &&
                        (atRisk.length > 0 ? (
                          <Alert
                            severity="warning"
                            icon={<WarningAmberIcon />}
                            action={
                              <Button
                                component="a"
                                href={`/section/${section.id}#nav-section-gradebook`}
                                size="small"
                                color="warning"
                              >
                                {t("instructorDashboard.reviewAll")}
                              </Button>
                            }
                            sx={{
                              py: 0.5,
                              mx: -2.5,
                              borderRadius: 0,
                              borderLeft: 0,
                              borderRight: 0,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {t("instructorDashboard.studentsNeedingSupport")}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              // eslint-disable-next-line i18next/no-literal-string -- CSS flex-wrap value
                              flexWrap="wrap"
                              useFlexGap
                              sx={{ mt: 0.5 }}
                            >
                              {atRisk.map((s) => (
                                <Chip
                                  key={s.studentId}
                                  avatar={
                                    <AvatarDisplay
                                      profileUsername={s.studentId}
                                      seed={s.studentId}
                                      size={20}
                                      style="simple"
                                    />
                                  }
                                  label={
                                    <Link
                                      href={`/section/${section.id}#nav-section-gradebook`}
                                      style={{ color: "inherit", textDecoration: "none" }}
                                    >
                                      {t(
                                        "instructorDashboard.atRiskStudentChip",
                                        {
                                          student: formatLastFirst(
                                            sectionStudents[s.studentId] || {
                                              id: s.studentId,
                                            },
                                          ),
                                          average: Math.round(s.average),
                                        },
                                      )}
                                    </Link>
                                  }
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  component="div"
                                />
                              ))}
                            </Stack>
                          </Alert>
                        ) : (
                          <Typography color="text.secondary" sx={{ py: 2 }}>
                            {t("instructorDashboard.noStudentsNeedSupport")}
                          </Typography>
                        ))}

                      {/* ── Activity: recent submissions ── */}
                      {activeTab === "activity" &&
                        (stats.recentActivity.length > 0 ? (
                          <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{
                              borderRadius: `${DASHBOARD_TOKENS.radius.card}px`,
                              overflow: "hidden",
                            }}
                          >
                            <Table
                              size="small"
                              aria-label={t(
                                "instructorDashboard.recentActivityTableLabel",
                              )}
                            >
                              <TableHead sx={{ bgcolor: "action.hover" }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 700 }}>
                                    {t("instructorDashboard.student")}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>
                                    {t("instructorDashboard.unitColumn")}
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 700 }}
                                    align="right"
                                  >
                                    {t("instructorDashboard.scoreColumn")}
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {stats.recentActivity.map((grade) => (
                                  <TableRow key={grade.id} hover>
                                    <TableCell>
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1.5}
                                      >
                                        <AvatarDisplay
                                          profileUsername={grade.owner}
                                          seed={grade.owner}
                                          size={22}
                                          style="simple"
                                        />
                                        <Typography variant="body2" noWrap>
                                          {formatLastFirst(
                                            sectionStudents[grade.owner] || {
                                              id: grade.owner,
                                            },
                                          )}
                                        </Typography>
                                      </Stack>
                                    </TableCell>
                                    <TableCell>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        noWrap
                                      >
                                        {allUnits[grade.unitID]?.name ||
                                          grade.unitID?.slice(0, 8)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 700,
                                          color:
                                            grade.accuracy < 80
                                              ? `${gradeColor(grade.accuracy)}.main`
                                              : "text.primary",
                                        }}
                                      >
                                        {Math.round(grade.accuracy)}%
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="text.secondary" sx={{ py: 2 }}>
                            {t("instructorDashboard.noRecentActivity")}
                          </Typography>
                        ))}

                      {/* ── Top Students: leaderboard ── */}
                      {activeTab === "top-students" &&
                        (top5.length > 0 ? (
                          <CompactStudentTable
                            students={top5.map((student) => ({
                              studentId: student.studentId,
                              name: formatLastFirst(
                                sectionStudents[student.studentId] || {
                                  id: student.studentId,
                                },
                              ),
                              average: student.average,
                              unitsCompleted: student.unitsCompleted,
                            }))}
                            totalCount={stats.leaderboard.length}
                          />
                        ) : (
                          <Typography color="text.secondary" sx={{ py: 2 }}>
                            {t("instructorDashboard.noDataYet")}
                          </Typography>
                        ))}
                    </>
                  )}
                </Box>

                {/* ── Footer actions ── */}
                <SectionFooterActions section={section} />
              </ParentSectionCard>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
