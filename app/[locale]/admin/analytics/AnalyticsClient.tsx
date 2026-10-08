"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import PeopleIcon from "@mui/icons-material/People";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DevicesIcon from "@mui/icons-material/Devices";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TimerIcon from "@mui/icons-material/Timer";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import GradeIcon from "@mui/icons-material/Grade";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RemoveIcon from "@mui/icons-material/Remove";
import AdminRouteGuard from "../_components/AdminRouteGuard";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { TrendChart } from "./TrendChart";
import {
  detectAnomaliesAcrossMetrics,
  type Anomaly,
  type TrendPoint,
} from "./analyticsInsights";

// ============================================================================
// Types
// ============================================================================

interface AnalyticsSummaryRecord {
  id: string;
  date: string;
  sectionId?: string | null;
  dailyActiveUsers: number;
  totalPageViews: number;
  totalSessions: number;
  avgSessionDurationMs?: number | null;
  totalEngagedTimeMs: number;
  avgEngagedTimeMs?: number | null;
  gradesSubmitted: number;
  avgAccuracy?: number | null;
  workbooksStarted: number;
  workbooksCompleted: number;
  studentChatMessagesSent?: number;
  instructorChatMessagesSent?: number;
  documentsAnalyzed: number;
  topPages?: { path: string; views: number }[] | null;
}

// ============================================================================
// Utility
// ============================================================================

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

interface TrendInfo {
  direction: "up" | "down" | "flat";
  changePct: number;
}

/** First-half vs second-half of the selected date range — a simple, dependency-free trend signal. */
function computeTrend(
  summaries: AnalyticsSummaryRecord[],
  extract: (s: AnalyticsSummaryRecord) => number,
): TrendInfo | undefined {
  if (summaries.length < 4) return undefined;
  const midpoint = Math.floor(summaries.length / 2);
  const average = (records: AnalyticsSummaryRecord[]) =>
    records.reduce((sum, s) => sum + extract(s), 0) / (records.length || 1);
  const firstHalfAvg = average(summaries.slice(0, midpoint));
  const secondHalfAvg = average(summaries.slice(midpoint));
  if (firstHalfAvg === 0 && secondHalfAvg === 0) return undefined;
  const changePct =
    firstHalfAvg === 0
      ? 100
      : Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);
  // Treat small fluctuations (< 3%) as flat rather than noisy up/down churn.
  const direction =
    Math.abs(changePct) < 3 ? "flat" : changePct > 0 ? "up" : "down";
  return { direction, changePct };
}

function TrendIndicator({ trend }: { trend: TrendInfo }) {
  const Icon =
    trend.direction === "up"
      ? ArrowUpwardIcon
      : trend.direction === "down"
        ? ArrowDownwardIcon
        : RemoveIcon;
  const color =
    trend.direction === "up"
      ? "success.main"
      : trend.direction === "down"
        ? "error.main"
        : "text.secondary";
  return (
    <Box
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, color }}
    >
      <Icon sx={{ fontSize: "0.9rem" }} />
      <Typography variant="caption" sx={{ fontWeight: 700, color: "inherit" }}>
        {Math.abs(trend.changePct)}%
      </Typography>
    </Box>
  );
}

// ============================================================================
// Stat Card Component
// ============================================================================

function StatCard({
  title,
  value,
  subtitle,
  loading,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  trend?: TrendInfo;
}) {
  return (
    <Card
      variant="outlined"
      sx={{ height: "100%" }}
      data-testid="analytics-stat-card"
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color: "text.disabled", display: "flex" }}>{icon}</Box>
          )}
        </Box>
        {loading ? (
          <Skeleton variant="text" width="60%" height={40} />
        ) : (
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {trend && <TrendIndicator trend={trend} />}
          </Box>
        )}
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Analytics Dashboard
// ============================================================================

function AnalyticsDashboard({
  initialSections = [],
}: {
  initialSections?: any[];
}) {
  const [summaries, setSummaries] = React.useState<AnalyticsSummaryRecord[]>(
    [],
  );
  const [sections, setSections] = React.useState<
    { id: string; name: string }[]
  >(initialSections.map((s: any) => ({ id: s.id, name: s.name || s.id })));
  const [loading, setLoading] = React.useState(true);
  const [dateRange, setDateRange] = React.useState(7);
  const [selectedSection, setSelectedSection] = React.useState<string>("all");

  // Fetch sections for the filter dropdown (skip if pre-fetched)
  React.useEffect(() => {
    if (sections.length > 0) return;
    async function fetchSections() {
      try {
        const client = getAmplifyClient();
        const { data: items } = await (client.models as any).Section.list();
        const valid = (items || [])
          .filter((s: any) => s != null && s.id)
          .map((s: any) => ({ id: s.id, name: s.name || s.id }));
        setSections(valid);
      } catch (err) {
        console.warn("[Analytics] Failed to fetch sections:", err);
      }
    }
    fetchSections();
  }, []);

  React.useEffect(() => {
    async function fetchSummaries() {
      setLoading(true);
      try {
        const client = getAmplifyClient();
        const dates = getDateRange(dateRange);
        const filter: any = {
          date: { between: [dates[0], dates[dates.length - 1]] },
        };
        if (selectedSection === "all") {
          filter.sectionId = { attributeExists: false };
        } else {
          filter.sectionId = { eq: selectedSection };
        }
        const { data: items } = await (
          client.models as any
        ).AnalyticsSummary.list({
          filter,
        });
        const valid = (items || []).filter(
          (item: any) => item != null,
        ) as AnalyticsSummaryRecord[];
        valid.sort((a: AnalyticsSummaryRecord, b: AnalyticsSummaryRecord) =>
          a.date.localeCompare(b.date),
        );
        setSummaries(valid);
      } catch (err) {
        console.warn("[Analytics] Failed to fetch summaries:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummaries();
  }, [dateRange, selectedSection]);

  // Aggregate stats across the date range
  const totals = React.useMemo(() => {
    if (summaries.length === 0)
      return {
        dau: 0,
        pageViews: 0,
        sessions: 0,
        avgSession: 0,
        engagedTime: 0,
        avgEngaged: 0,
        grades: 0,
        avgAccuracy: 0,
        started: 0,
        completed: 0,
        chatMessages: 0,
        documents: 0,
      };

    const sum = summaries.reduce(
      (acc, s) => ({
        dau: acc.dau + (s.dailyActiveUsers || 0),
        pageViews: acc.pageViews + (s.totalPageViews || 0),
        sessions: acc.sessions + (s.totalSessions || 0),
        sessionDuration:
          acc.sessionDuration +
          (s.avgSessionDurationMs || 0) * (s.totalSessions || 1),
        engagedTime: acc.engagedTime + (s.totalEngagedTimeMs || 0),
        grades: acc.grades + (s.gradesSubmitted || 0),
        accuracySum:
          acc.accuracySum + (s.avgAccuracy || 0) * (s.gradesSubmitted || 0),
        started: acc.started + (s.workbooksStarted || 0),
        completed: acc.completed + (s.workbooksCompleted || 0),
        chatMessages:
          acc.chatMessages +
          (s.studentChatMessagesSent || 0) +
          (s.instructorChatMessagesSent || 0),
        documents: acc.documents + (s.documentsAnalyzed || 0),
      }),
      {
        dau: 0,
        pageViews: 0,
        sessions: 0,
        sessionDuration: 0,
        engagedTime: 0,
        grades: 0,
        accuracySum: 0,
        started: 0,
        completed: 0,
        chatMessages: 0,
        documents: 0,
      },
    );

    const days = summaries.length || 1;
    return {
      dau: Math.round(sum.dau / days),
      pageViews: sum.pageViews,
      sessions: sum.sessions,
      avgSession: sum.sessions
        ? Math.round(sum.sessionDuration / sum.sessions)
        : 0,
      engagedTime: sum.engagedTime,
      avgEngaged: sum.grades ? Math.round(sum.engagedTime / sum.grades) : 0,
      grades: sum.grades,
      avgAccuracy: sum.grades
        ? Math.round((sum.accuracySum / sum.grades) * 10) / 10
        : 0,
      started: sum.started,
      completed: sum.completed,
      chatMessages: sum.chatMessages,
      documents: sum.documents,
    };
  }, [summaries]);

  // First-half vs second-half trend per stat card metric
  const statTrends = React.useMemo(
    () => ({
      dau: computeTrend(summaries, (s) => s.dailyActiveUsers || 0),
      pageViews: computeTrend(summaries, (s) => s.totalPageViews || 0),
      sessions: computeTrend(summaries, (s) => s.totalSessions || 0),
      avgSession: computeTrend(summaries, (s) => s.avgSessionDurationMs || 0),
      engagedTime: computeTrend(summaries, (s) => s.totalEngagedTimeMs || 0),
      avgEngaged: computeTrend(summaries, (s) => s.avgEngagedTimeMs || 0),
      started: computeTrend(summaries, (s) => s.workbooksStarted || 0),
      completed: computeTrend(summaries, (s) => s.workbooksCompleted || 0),
      grades: computeTrend(summaries, (s) => s.gradesSubmitted || 0),
      avgAccuracy: computeTrend(summaries, (s) => s.avgAccuracy || 0),
      chatMessages: computeTrend(
        summaries,
        (s) =>
          (s.studentChatMessagesSent || 0) +
          (s.instructorChatMessagesSent || 0),
      ),
      documents: computeTrend(summaries, (s) => s.documentsAnalyzed || 0),
    }),
    [summaries],
  );

  // Per-day trend series for the chart cards
  const trendSeries = React.useMemo(() => {
    const toPoints = (
      extract: (s: AnalyticsSummaryRecord) => number,
    ): TrendPoint[] =>
      summaries.map((s) => ({ date: s.date, value: extract(s) }));
    return {
      dailyActiveUsers: toPoints((s) => s.dailyActiveUsers || 0),
      totalSessions: toPoints((s) => s.totalSessions || 0),
      gradesSubmitted: toPoints((s) => s.gradesSubmitted || 0),
      avgAccuracy: toPoints((s) => s.avgAccuracy || 0),
    };
  }, [summaries]);

  // Statistical anomalies (z-score vs. the range's own mean) across trend metrics
  const anomalies: Anomaly[] = React.useMemo(
    () =>
      detectAnomaliesAcrossMetrics([
        {
          key: "dailyActiveUsers",
          label: "Daily Active Users",
          points: trendSeries.dailyActiveUsers,
        },
        {
          key: "totalSessions",
          label: "Total Sessions",
          points: trendSeries.totalSessions,
        },
        {
          key: "gradesSubmitted",
          label: "Grades Submitted",
          points: trendSeries.gradesSubmitted,
        },
        {
          key: "avgAccuracy",
          label: "Avg Accuracy",
          points: trendSeries.avgAccuracy,
        },
      ]),
    [trendSeries],
  );

  const anomalyDatesByMetric = React.useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const a of anomalies) {
      if (!map[a.metricKey]) map[a.metricKey] = new Set();
      map[a.metricKey].add(a.date);
    }
    return map;
  }, [anomalies]);

  const formatMetricValue = React.useCallback(
    (metricKey: string, value: number) =>
      metricKey === "avgAccuracy"
        ? `${Math.round(value)}%`
        : Math.round(value).toLocaleString(),
    [],
  );

  const countFormatter = React.useCallback(
    (v: number) => Math.round(v).toLocaleString(),
    [],
  );
  const percentFormatter = React.useCallback(
    (v: number) => `${Math.round(v)}%`,
    [],
  );

  return (
    <Box data-tour="analytics-page" sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h4">Platform Analytics</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Section</InputLabel>
            <Select
              value={selectedSection}
              label="Section"
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <MenuItem value="all">All Sections (Platform)</MenuItem>
              {sections.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(Number(e.target.value))}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={14}>Last 14 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {!loading && anomalies.length > 0 && (
        <Alert
          severity={
            anomalies.some((a) => a.severity === "error") ? "error" : "warning"
          }
          sx={{ mb: 3 }}
          data-testid="analytics-anomaly-alert"
        >
          <AlertTitle>Unusual activity detected</AlertTitle>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {anomalies.slice(0, 5).map((a) => (
              <li key={`${a.metricKey}-${a.date}`}>
                <Typography variant="body2">
                  {a.metricLabel} was unusually {a.direction} on {a.date}:{" "}
                  {formatMetricValue(a.metricKey, a.value)} (typical ~
                  {formatMetricValue(a.metricKey, a.mean)})
                </Typography>
              </li>
            ))}
          </Box>
          {anomalies.length > 5 && (
            <Typography variant="caption" color="text.secondary">
              +{anomalies.length - 5} more
            </Typography>
          )}
        </Alert>
      )}

      {/* User Activity */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        User Activity
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Daily Active Users"
            value={totals.dau}
            loading={loading}
            icon={<PeopleIcon fontSize="small" />}
            trend={statTrends.dau}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Page Views"
            value={totals.pageViews.toLocaleString()}
            loading={loading}
            icon={<VisibilityIcon fontSize="small" />}
            trend={statTrends.pageViews}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Sessions"
            value={totals.sessions.toLocaleString()}
            loading={loading}
            icon={<DevicesIcon fontSize="small" />}
            trend={statTrends.sessions}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Session Duration"
            value={formatDuration(totals.avgSession)}
            loading={loading}
            icon={<AccessTimeIcon fontSize="small" />}
            trend={statTrends.avgSession}
          />
        </Grid>
      </Grid>

      {/* Engagement */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Engagement
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Engaged Time"
            value={formatDuration(totals.engagedTime)}
            loading={loading}
            icon={<TimerIcon fontSize="small" />}
            trend={statTrends.engagedTime}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Engaged Time / Grade"
            value={formatDuration(totals.avgEngaged)}
            loading={loading}
            icon={<HourglassBottomIcon fontSize="small" />}
            trend={statTrends.avgEngaged}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Workbooks Started"
            value={totals.started}
            loading={loading}
            icon={<PlayCircleOutlineIcon fontSize="small" />}
            trend={statTrends.started}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Workbooks Completed"
            value={totals.completed}
            subtitle={
              totals.started
                ? `${Math.round((totals.completed / totals.started) * 100)}% completion rate`
                : undefined
            }
            loading={loading}
            icon={<CheckCircleIcon fontSize="small" />}
            trend={statTrends.completed}
          />
        </Grid>
      </Grid>

      {/* Academic Performance */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Academic Performance
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Grades Submitted"
            value={totals.grades}
            loading={loading}
            icon={<AssignmentTurnedInIcon fontSize="small" />}
            trend={statTrends.grades}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Accuracy"
            value={totals.avgAccuracy ? `${totals.avgAccuracy}%` : "—"}
            loading={loading}
            icon={<GradeIcon fontSize="small" />}
            trend={statTrends.avgAccuracy}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Chat Messages"
            value={totals.chatMessages}
            loading={loading}
            icon={<ChatBubbleOutlineIcon fontSize="small" />}
            trend={statTrends.chatMessages}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Documents Analyzed"
            value={totals.documents}
            loading={loading}
            icon={<DescriptionIcon fontSize="small" />}
            trend={statTrends.documents}
          />
        </Grid>
      </Grid>

      {/* Trends */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Trends
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TrendChart
            title="Daily Active Users"
            points={trendSeries.dailyActiveUsers}
            formatValue={countFormatter}
            anomalyDates={anomalyDatesByMetric.dailyActiveUsers}
            loading={loading}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TrendChart
            title="Total Sessions"
            points={trendSeries.totalSessions}
            formatValue={countFormatter}
            anomalyDates={anomalyDatesByMetric.totalSessions}
            loading={loading}
            color="#7b1fa2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TrendChart
            title="Grades Submitted"
            points={trendSeries.gradesSubmitted}
            formatValue={countFormatter}
            anomalyDates={anomalyDatesByMetric.gradesSubmitted}
            loading={loading}
            color="#2e7d32"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TrendChart
            title="Avg Accuracy"
            points={trendSeries.avgAccuracy}
            formatValue={percentFormatter}
            anomalyDates={anomalyDatesByMetric.avgAccuracy}
            loading={loading}
            color="#ed6c02"
          />
        </Grid>
      </Grid>

      {/* Daily breakdown table */}
      {!loading && summaries.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Daily Breakdown
          </Typography>
          <Card variant="outlined">
            <Box sx={{ overflowX: "auto" }}>
              <table
                data-testid="analytics-daily-table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #e0e0e0",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "12px 16px" }}>Date</th>
                    <th style={{ padding: "12px 16px" }}>DAU</th>
                    <th style={{ padding: "12px 16px" }}>Page Views</th>
                    <th style={{ padding: "12px 16px" }}>Grades</th>
                    <th style={{ padding: "12px 16px" }}>Avg Accuracy</th>
                    <th style={{ padding: "12px 16px" }}>Engaged Time</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => (
                    <tr
                      key={s.id}
                      style={{ borderBottom: "1px solid #f0f0f0" }}
                    >
                      <td style={{ padding: "8px 16px" }}>{s.date}</td>
                      <td style={{ padding: "8px 16px" }}>
                        {s.dailyActiveUsers}
                      </td>
                      <td style={{ padding: "8px 16px" }}>
                        {s.totalPageViews}
                      </td>
                      <td style={{ padding: "8px 16px" }}>
                        {s.gradesSubmitted}
                      </td>
                      <td style={{ padding: "8px 16px" }}>
                        {s.avgAccuracy != null
                          ? `${Math.round(s.avgAccuracy)}%`
                          : "—"}
                      </td>
                      <td style={{ padding: "8px 16px" }}>
                        {formatDuration(s.totalEngagedTimeMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Card>
        </>
      )}

      {!loading && summaries.length === 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary" align="center">
              No analytics data yet. Data populates daily once the platform is
              active.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// ============================================================================
// Page wrapper with auth
// ============================================================================

export default function AnalyticsPage({
  initialSections = [],
}: {
  initialSections?: any[];
}) {
  return (
    <AdminRouteGuard>
      <AnalyticsDashboard initialSections={initialSections} />
    </AdminRouteGuard>
  );
}
