"use client";
import React, { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { getCurrentUser } from "aws-amplify/auth";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Container,
} from "@mui/material";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import TimerIcon from "@mui/icons-material/Timer";
import GroupsIcon from "@mui/icons-material/Groups";
import { LeaderboardTable } from "@/components/Leaderboard/LeaderboardTable";
import { FastestCompletionsTable } from "@/components/Leaderboard/FastestCompletionsTable";
import type { FastestCompletionEntry } from "@/components/Leaderboard/FastestCompletionsTable";
import { SquadLeaderboard } from "@/components/Gamification/SquadLeaderboard";
import { useSquad } from "@/context/gamificationContext";
import {
  trackSquadLeaderboardViewed,
  trackSquadLeaderboardModeChanged,
} from "@/utils/analytics";

interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  avatarColor: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  completedAssignments: number;
  onTimeSubmissions: number;
  totalSubmissions: number;
  reportCard?: {
    timeStats?: { min: number; max: number; avg: number; count: number };
  };
  avatarStyle?: string;
  avatarOverrides?: any;
  avatarSeed?: string;
  avatarLoaded?: boolean;
}

/**
 * Live leaderboard updater — subscribes to StudentProfile for real-time XP changes.
 * Falls back to server-provided initial data until subscription emits.
 */
export function LiveLeaderboard({
  initialEntries,
}: {
  initialEntries: LeaderboardEntry[];
}) {
  const t = useTranslations("pages");
  const [mode, setMode] = useState("fastest");
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [currentUserId, setCurrentUserId] = useState("");
  const { squadLeaderboard, mySquad } = useSquad();
  const lastCountRef = useRef(initialEntries.length);

  // Track leaderboard viewed once on mount
  useEffect(() => {
    trackSquadLeaderboardViewed(mySquad?.cohortId || "");
  }, [mySquad?.cohortId]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setCurrentUserId(user?.username || user?.userId || "");
      })
      .catch(() => {});
  }, []);

  // Live subscription updates
  useEffect(() => {
    const client = getAmplifyClient();
    if (!client?.models?.StudentProfile) return;

    const subscription = client.models.StudentProfile.observeQuery().subscribe({
      next: ({ items }: any) => {
        const valid = items.filter(
          (item: any) => item != null && item.id != null,
        );
        // Skip if count hasn't changed (simple dedup for initial echo)
        if (valid.length === lastCountRef.current && lastCountRef.current > 0)
          return;
        lastCountRef.current = valid.length;

        const byStudent = new Map<string, LeaderboardEntry>();
        for (const entry of valid) {
          const existing = byStudent.get(entry.studentId);
          if (!existing || (entry.totalXP || 0) > existing.totalXP) {
            let parsedOverrides = entry.avatarOverrides;
            if (typeof parsedOverrides === "string") {
              try {
                parsedOverrides = JSON.parse(parsedOverrides);
              } catch {
                parsedOverrides = undefined;
              }
            }
            let parsedReportCard = entry.reportCard;
            if (typeof parsedReportCard === "string") {
              try {
                parsedReportCard = JSON.parse(parsedReportCard);
              } catch {
                parsedReportCard = undefined;
              }
            }
            byStudent.set(entry.studentId, {
              studentId: entry.studentId,
              studentName: entry.studentName || entry.studentId,
              avatarColor: "#6366f1",
              totalXP: entry.totalXP || 0,
              level: entry.level || 1,
              currentStreak: entry.currentStreak || 0,
              completedAssignments: entry.completedAssignments || 0,
              onTimeSubmissions: entry.onTimeSubmissions || 0,
              totalSubmissions: entry.totalSubmissions || 0,
              reportCard: parsedReportCard || undefined,
              avatarStyle: entry.avatarStyle || undefined,
              avatarOverrides: parsedOverrides,
              avatarSeed: entry.avatarSeed || entry.studentId,
              avatarLoaded: !!entry.avatarStyle,
            });
          }
        }
        setEntries(Array.from(byStudent.values()));
      },
      error: (error: any) => {
        if (error?.message?.includes("exceeds maximum value limit")) {
          console.warn("[Leaderboard] Filter limit — using client filtering");
          return;
        }
        if (error?.message?.includes("DuplicatedOperationError")) return;
        console.error("[Leaderboard] Subscription error:", error);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  // Squad entries with member avatars come directly from the Squad model (denormalized)
  const squadsWithMembers = React.useMemo(() => {
    return squadLeaderboard.map((g: any) => ({
      id: g.id,
      name: g.name,
      totalXP: g.totalXP || 0,
      memberCount: g.memberCount || 0,
      members: (g.members || []).map((m: any) => ({
        studentId: m.studentId,
        avatarStyle: m.avatarStyle,
        avatarOverrides: m.avatarOverrides,
        avatarSeed: m.avatarSeed || m.studentId,
      })),
    }));
  }, [squadLeaderboard]);

  const handleModeChange = (_event: any, newMode: string | null) => {
    if (newMode) {
      setMode(newMode);
      trackSquadLeaderboardModeChanged(mySquad?.cohortId || "", newMode);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3 }} data-tour="leaderboard-page">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          {t("leaderboard.heading")}
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
        >
          <ToggleButton value="xp" aria-label={t("leaderboard.xpMode")}>
            <LeaderboardIcon sx={{ mr: 0.5 }} />
            {t("leaderboard.xpMode")}
          </ToggleButton>
          <ToggleButton
            value="fastest"
            aria-label={t("leaderboard.fastestMode")}
          >
            <TimerIcon sx={{ mr: 0.5 }} />
            {t("leaderboard.fastestMode")}
          </ToggleButton>
          <ToggleButton value="squads" aria-label={t("leaderboard.squadsMode")}>
            <GroupsIcon sx={{ mr: 0.5 }} />
            {t("leaderboard.squadsMode")}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {mode === "xp" && (
        <LeaderboardTable
          entries={entries as any}
          currentStudentId={currentUserId}
          topN={10}
        />
      )}

      {mode === "fastest" && entries.length > 0 && (
        <FastestCompletionsTable
          entries={entries
            .filter(
              (e) =>
                e.reportCard?.timeStats && e.reportCard.timeStats.count > 0,
            )
            .map((e): FastestCompletionEntry => ({
              studentId: e.studentId,
              studentName: e.studentName,
              avgTimeMs: e.reportCard?.timeStats?.avg || 0,
              fastestTimeMs: e.reportCard?.timeStats?.min || 0,
              completedCount: e.completedAssignments || 0,
              onTimeCount: e.onTimeSubmissions || 0,
              totalSubmissions: e.totalSubmissions || 0,
              avatarStyle: e.avatarStyle as any,
              avatarOverrides: e.avatarOverrides,
              avatarSeed: e.avatarSeed,
              avatarLoaded: e.avatarLoaded,
            }))}
          currentStudentId={currentUserId}
        />
      )}

      {mode === "squads" && (
        <SquadLeaderboard squads={squadsWithMembers} mySquadId={mySquad?.id} />
      )}

      {entries.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {t("leaderboard.empty", {
              defaultValue:
                "No leaderboard data yet. Complete assignments to earn XP!",
            })}
          </Typography>
        </Box>
      )}
    </Container>
  );
}
