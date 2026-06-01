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
import AdminRouteGuard from "../_components/AdminRouteGuard";
import { getAmplifyClient } from "@/utils/amplifyClient";

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
  chatMessagesSent: number;
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

// ============================================================================
// Stat Card Component
// ============================================================================

function StatCard({
  title,
  value,
  subtitle,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  loading?: boolean;
}) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width="60%" height={40} />
        ) : (
          <Typography variant="h4" component="div">
            {value}
          </Typography>
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

function AnalyticsDashboard() {
  const [summaries, setSummaries] = React.useState<AnalyticsSummaryRecord[]>(
    [],
  );
  const [sections, setSections] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [dateRange, setDateRange] = React.useState(7);
  const [selectedSection, setSelectedSection] = React.useState<string>("all");

  // Fetch sections for the filter dropdown
  React.useEffect(() => {
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
        const { data: items } = await (client.models as any).AnalyticsSummary.list({
          filter,
        });
        const valid = (items || []).filter(
          (item: any) => item != null,
        ) as AnalyticsSummaryRecord[];
        valid.sort(
          (a: AnalyticsSummaryRecord, b: AnalyticsSummaryRecord) =>
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
          acc.sessionDuration + (s.avgSessionDurationMs || 0) * (s.totalSessions || 1),
        engagedTime: acc.engagedTime + (s.totalEngagedTimeMs || 0),
        grades: acc.grades + (s.gradesSubmitted || 0),
        accuracySum:
          acc.accuracySum + (s.avgAccuracy || 0) * (s.gradesSubmitted || 0),
        started: acc.started + (s.workbooksStarted || 0),
        completed: acc.completed + (s.workbooksCompleted || 0),
        chatMessages: acc.chatMessages + (s.chatMessagesSent || 0),
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
      avgSession: sum.sessions ? Math.round(sum.sessionDuration / sum.sessions) : 0,
      engagedTime: sum.engagedTime,
      avgEngaged: sum.grades
        ? Math.round(sum.engagedTime / sum.grades)
        : 0,
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

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
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
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Page Views"
            value={totals.pageViews.toLocaleString()}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Sessions"
            value={totals.sessions.toLocaleString()}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Session Duration"
            value={formatDuration(totals.avgSession)}
            loading={loading}
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
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Engaged Time / Grade"
            value={formatDuration(totals.avgEngaged)}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Workbooks Started"
            value={totals.started}
            loading={loading}
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
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Accuracy"
            value={totals.avgAccuracy ? `${totals.avgAccuracy}%` : "—"}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Chat Messages"
            value={totals.chatMessages}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Documents Analyzed"
            value={totals.documents}
            loading={loading}
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

export default function AnalyticsPage() {
  return (
      <AdminRouteGuard>
        <AnalyticsDashboard />
      </AdminRouteGuard>
  );
}
