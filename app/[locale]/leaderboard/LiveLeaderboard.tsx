"use client";
import React, { useEffect, useState } from "react";
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
import GridOnIcon from "@mui/icons-material/GridOn";
import GroupsIcon from "@mui/icons-material/Groups";
import { LeaderboardTable } from "@/components/Leaderboard/LeaderboardTable";
import { CompletionGrid } from "@/components/Leaderboard/CompletionGrid";
import { GuildLeaderboard } from "@/components/Gamification/GuildLeaderboard";
import { useGuild } from "@/context/gamificationContext";

interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  avatarColor: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  completedAssignments: number;
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
  const [mode, setMode] = useState("completion");
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [currentUserId, setCurrentUserId] = useState("");
  const { guildLeaderboard, myGuild } = useGuild();

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
        const valid = items.filter((item: any) => item != null && item.id != null);
        const byStudent = new Map<string, LeaderboardEntry>();
        for (const entry of valid) {
          const existing = byStudent.get(entry.studentId);
          if (!existing || (entry.totalXP || 0) > existing.totalXP) {
            byStudent.set(entry.studentId, {
              studentId: entry.studentId,
              studentName: entry.studentName || entry.studentId,
              avatarColor: "#6366f1",
              totalXP: entry.totalXP || 0,
              level: entry.level || 1,
              currentStreak: entry.currentStreak || 0,
              completedAssignments: entry.completedAssignments || 0,
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

  const handleModeChange = (_event: any, newMode: string | null) => {
    if (newMode) setMode(newMode);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          {t("leaderboard.heading", "Overall Leaderboard")}
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
        >
          <ToggleButton value="xp" aria-label={t("leaderboard.xpMode", "XP")}>
            <LeaderboardIcon sx={{ mr: 0.5 }} />
            {t("leaderboard.xpMode", "XP")}
          </ToggleButton>
          <ToggleButton
            value="completion"
            aria-label={t("leaderboard.completionMode", "Completion")}
          >
            <GridOnIcon sx={{ mr: 0.5 }} />
            {t("leaderboard.completionMode", "Completion")}
          </ToggleButton>
          <ToggleButton
            value="guilds"
            aria-label={t("leaderboard.guildsMode", "Guilds")}
          >
            <GroupsIcon sx={{ mr: 0.5 }} />
            {t("leaderboard.guildsMode", "Guilds")}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {mode === "xp" && (
        <LeaderboardTable
          entries={entries}
          currentStudentId={currentUserId}
          topN={10}
        />
      )}

      {mode === "completion" && entries.length > 0 && (
        <CompletionGrid
          assignments={[{ id: "overall", title: "Completed" }]}
          students={entries.map((e) => ({
            studentId: e.studentId,
            studentName: e.studentName,
            assignments: {
              overall:
                e.completedAssignments > 0 ? "completed" : "not_started",
            },
          }))}
          currentStudentId={currentUserId}
        />
      )}

      {mode === "guilds" && (
        <GuildLeaderboard
          guilds={guildLeaderboard.map((g: any) => ({
            id: g.id,
            name: g.name,
            totalXP: g.totalXP || 0,
            memberCount: g.memberCount || 0,
          }))}
          myGuildId={myGuild?.id}
        />
      )}

      {entries.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {t(
              "leaderboard.empty",
              "No leaderboard data yet. Complete assignments to earn XP!",
            )}
          </Typography>
        </Box>
      )}
    </Container>
  );
}
