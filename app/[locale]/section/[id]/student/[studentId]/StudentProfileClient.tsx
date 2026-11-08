"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getAmplifyClient } from "@/utils/amplifyClient";
import {
  createStudentActionRecord,
  generateSectionStudentSummary,
  saveSectionStudentSummary,
} from "../../../../../actions/studentProfile";

type ProfileRecord = any;
type MemoryRecord = any;
type ActionRecord = any;

interface StudentProfileClientProps {
  sectionId: string;
  studentId: string;
  sectionName: string;
  initialProfile: ProfileRecord | null;
  initialMemory: MemoryRecord | null;
  initialActions: ActionRecord[];
  studentLabel: string;
}

export function StudentProfileClient({
  sectionId,
  studentId,
  sectionName,
  initialProfile,
  initialMemory,
  initialActions,
  studentLabel,
}: StudentProfileClientProps) {
  const [profile, setProfile] = useState<ProfileRecord | null>(initialProfile);
  const [memory, setMemory] = useState<MemoryRecord | null>(initialMemory);
  const [actions, setActions] = useState<ActionRecord[]>(initialActions);
  const [sectionProfiles, setSectionProfiles] = useState<ProfileRecord[]>([]);
  const [summary, setSummary] = useState<{
    rollupVersion: string;
    generatedAt: string;
    summary: string;
    note: string;
    aggregate: { completionRate: number; xp: number; level: number; streak: number };
  } | null>(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planned");
  const [actionType, setActionType] = useState("follow-up");
  const [targetDate, setTargetDate] = useState("");
  const [outcome, setOutcome] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getAmplifyClient();
    const load = async () => {
      try {
        const [profileRes, memoryRes, actionRes, sectionProfilesRes] =
          await Promise.all([
            (client as any).models.StudentProfile.list({
              filter: {
                sectionID: { eq: sectionId },
                studentId: { eq: studentId },
              },
              limit: 20,
            }),
            (client as any).models.StudentMemory.list({
              filter: {
                sectionID: { eq: sectionId },
                studentId: { eq: studentId },
              },
              limit: 20,
            }),
            (client as any).models.StudentActionRecord.list({
              filter: {
                sectionID: { eq: sectionId },
                studentId: { eq: studentId },
              },
              limit: 50,
            }),
            (client as any).models.StudentProfile.list({
              filter: {
                sectionID: { eq: sectionId },
              },
              limit: 200,
            }),
          ]);

        const nextProfile = (profileRes?.data || [])[0] || initialProfile;
        const nextMemory = (memoryRes?.data || [])[0] || initialMemory;
        const nextActions = actionRes?.data || initialActions;
        const nextSectionProfiles = sectionProfilesRes?.data || [];

        setProfile(nextProfile);
        setMemory(nextMemory);
        setActions(nextActions);
        setSectionProfiles(nextSectionProfiles);

        const generatedSummary = await generateSectionStudentSummary({
          sectionName,
          studentLabel,
          profile: nextProfile,
          sectionProfiles: nextSectionProfiles,
        });
        setSummary(generatedSummary);

        const persisted = await saveSectionStudentSummary({
          sectionId,
          studentId,
          sectionName,
          studentLabel,
          summaryText: generatedSummary.summary,
          summaryVersion: generatedSummary.rollupVersion,
          note: generatedSummary.note,
          aggregate: generatedSummary.aggregate,
        });

        if (!persisted.success) {
          console.warn("[StudentProfileClient] Failed to persist summary", persisted.error);
        }
      } catch (loadError) {
        console.error("[StudentProfileClient] Failed to load data", loadError);
      }
    };

    void load();
  }, [sectionId, sectionName, studentId, studentLabel, initialActions, initialMemory, initialProfile]);

  const reportCard = useMemo(() => {
    if (!profile?.reportCard) return null;
    if (typeof profile.reportCard === "string") {
      try {
        return JSON.parse(profile.reportCard);
      } catch {
        return null;
      }
    }
    return profile.reportCard;
  }, [profile]);

  const completionRate = useMemo(() => {
    if (profile?.completedAssignments == null || profile?.totalSubmissions == null)
      return null;
    if (profile.totalSubmissions === 0) return 0;
    return Math.round(
      (Number(profile.completedAssignments) / Number(profile.totalSubmissions)) * 100,
    );
  }, [profile]);

  const median = (values: number[]) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  };

  const sectionBenchmark = useMemo(() => {
    const values = sectionProfiles
      .map((entry) => {
        const totalSubmissions = Number(entry?.totalSubmissions ?? 0);
        const completedAssignments = Number(entry?.completedAssignments ?? 0);
        const completion =
          totalSubmissions > 0
            ? Math.round((completedAssignments / totalSubmissions) * 100)
            : 0;

        return {
          xp: Number(entry?.totalXP ?? 0),
          level: Number(entry?.level ?? 1),
          streak: Number(entry?.currentStreak ?? 0),
          completion,
        };
      })
      .filter((entry) => Number.isFinite(entry.xp));

    if (!values.length) {
      return null;
    }

    const metric = (selector: (item: (typeof values)[number]) => number) => {
      const numbers = values.map(selector);
      return {
        average: numbers.reduce((sum, value) => sum + value, 0) / numbers.length,
        minimum: Math.min(...numbers),
        maximum: Math.max(...numbers),
        median: median(numbers),
      };
    };

    return {
      xp: metric((item) => item.xp),
      level: metric((item) => item.level),
      streak: metric((item) => item.streak),
      completion: metric((item) => item.completion),
    };
  }, [sectionProfiles]);

  const recommendations = useMemo(() => {
    if (!profile) return [];

    const rules: Array<{ id: string; title: string; description: string }> = [];

    if (completionRate !== null && completionRate < 60) {
      rules.push({
        id: "completion",
        title: "Completion check",
        description:
          "This student’s completion rate is below the default 60% threshold for a section checkpoint. Revisit missed assignments and schedule a quick follow-up.",
      });
    }

    if ((profile?.currentStreak ?? 0) < 3) {
      rules.push({
        id: "streak",
        title: "Streak support",
        description:
          "The current streak is below the default 3-day support threshold. A brief check-in or practice plan can help rebuild momentum.",
      });
    }

    if (
      sectionBenchmark &&
      ((profile?.totalXP ?? 0) < Math.round(sectionBenchmark.xp.average))
    ) {
      rules.push({
        id: "xp",
        title: "XP pacing",
        description:
          "This student’s XP is below the section average. A short review of recent missed practice work can help bring them back to pace.",
      });
    }

    if (!rules.length) {
      rules.push({
        id: "healthy",
        title: "Healthy pacing",
        description:
          "No default rule is currently triggering. Continue the current plan and use the section benchmark as context for future checkpoints.",
      });
    }

    return rules;
  }, [completionRate, profile, sectionBenchmark]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Add a short action description before saving.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const result = await createStudentActionRecord({
        sectionId,
        studentId,
        description: description.trim(),
        status: status || "planned",
        actionType: actionType || "follow-up",
        targetDate: targetDate || null,
        outcome: outcome.trim() || null,
        followUp: followUp.trim() || null,
        previousActionId: actions[0]?.id || null,
      });

      if (!result.success || !result.action) {
        throw new Error(result.error || "Unable to create action record.");
      }

      setDescription("");
      setStatus("planned");
      setActionType("follow-up");
      setTargetDate("");
      setOutcome("");
      setFollowUp("");
      setActions((current) => [result.action, ...current]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save the action record.",
      );
    } finally {
      setSaving(false);
    }
  };

  const summaryText = useMemo(() => {
    if (!profile) {
      return "No section-scoped student profile data is available yet.";
    }

    const xp = profile.totalXP || 0;
    const streak = profile.currentStreak || 0;
    const level = profile.level || 1;
    const submissions = profile.totalSubmissions || 0;
    return `${studentLabel} is at level ${level} with ${xp} XP, a ${streak}-day streak, and ${submissions} tracked submissions in this section.`;
  }, [profile, studentLabel]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary">
              {sectionName}
            </Typography>
            <Typography variant="h4">{studentLabel}</Typography>
          </Box>
          <Button component={Link} href={`/section/${sectionId}/students`} variant="outlined">
            Back to section roster
          </Button>
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Level</Typography>
              <Typography variant="h5">{profile?.level || 1}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">XP</Typography>
              <Typography variant="h5">{profile?.totalXP || 0}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Streak</Typography>
              <Typography variant="h5">{profile?.currentStreak || 0} days</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Completion</Typography>
              <Typography variant="h5">
                {completionRate == null ? "-" : `${completionRate}%`}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick read
            </Typography>
            <Typography variant="body1">{summaryText}</Typography>
            {reportCard ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Report-card snapshot: {JSON.stringify(reportCard)}
                </Typography>
              </Box>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Section rollup summary
            </Typography>
            {summary ? (
              <Stack spacing={1.5}>
                <Typography variant="body1">{summary.summary}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Rollup version: {summary.rollupVersion} • Generated: {new Date(summary.generatedAt).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.note}
                </Typography>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Generating a section-scoped summary…
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Section comparison
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Benchmark is computed from the current section roster and uses the
              same section-scoped student rollup for each metric.
            </Typography>
            {sectionBenchmark ? (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                }}
              >
                {[
                  { label: "XP", value: sectionBenchmark.xp },
                  { label: "Level", value: sectionBenchmark.level },
                  { label: "Streak", value: sectionBenchmark.streak },
                  { label: "Completion", value: sectionBenchmark.completion },
                ].map((metric) => (
                  <Box key={metric.label} sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <Typography variant="overline" color="text.secondary">
                      {metric.label}
                    </Typography>
                    <Typography variant="body2">
                      Avg: {Math.round(metric.value.average)}
                    </Typography>
                    <Typography variant="body2">
                      Min: {Math.round(metric.value.minimum)}
                    </Typography>
                    <Typography variant="body2">
                      Median: {Math.round(metric.value.median)}
                    </Typography>
                    <Typography variant="body2">
                      Max: {Math.round(metric.value.maximum)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Not enough section data to calculate benchmarks yet.
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recommendation rules
            </Typography>
            <Stack spacing={1.5}>
              {recommendations.map((item) => (
                <Box
                  key={item.id}
                  sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 2 }}
                >
                  <Typography variant="subtitle2">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Student memory
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {memory?.memoryMarkdown ||
                "No section-scoped memory is currently available for this student."}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Action history
            </Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Stack spacing={2}>
              <TextField
                label="Action description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                multiline
                minRows={3}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="student-action-status-label">Status</InputLabel>
                  <Select
                    labelId="student-action-status-label"
                    value={status}
                    label="Status"
                    onChange={(event) => setStatus(String(event.target.value))}
                  >
                    <MenuItem value="planned">Planned</MenuItem>
                    <MenuItem value="in_progress">In progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="dismissed">Dismissed</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="student-action-type-label">Type</InputLabel>
                  <Select
                    labelId="student-action-type-label"
                    value={actionType}
                    label="Type"
                    onChange={(event) => setActionType(String(event.target.value))}
                  >
                    <MenuItem value="follow-up">Follow-up</MenuItem>
                    <MenuItem value="check-in">Check-in</MenuItem>
                    <MenuItem value="intervention">Intervention</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Target date"
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Outcome"
                  value={outcome}
                  onChange={(event) => setOutcome(event.target.value)}
                  fullWidth
                />
              </Stack>

              <TextField
                label="Follow-up notes"
                value={followUp}
                onChange={(event) => setFollowUp(event.target.value)}
                multiline
                minRows={2}
              />

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={saving || !description.trim()}
              >
                {saving ? "Saving..." : "Save action"}
              </Button>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Stack spacing={2}>
              {actions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No action records yet for this student in this section.
                </Typography>
              ) : (
                actions.map((action) => (
                  <Box key={action.id || `${action.createdAt}-${action.description}`} sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                      <Typography variant="subtitle2">
                        {action.actionType || "follow-up"} • {action.status || "planned"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {action.createdBy || "teacher"} • {action.createdAt ? new Date(action.createdAt).toLocaleDateString() : "unknown date"}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {action.previousActionId ? "Revision of prior action" : "Original action"} • v{action.version ?? 1}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                      {action.description}
                    </Typography>
                    {action.outcome ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Outcome: {action.outcome}
                      </Typography>
                    ) : null}
                    {action.followUp ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Follow-up: {action.followUp}
                      </Typography>
                    ) : null}
                  </Box>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
