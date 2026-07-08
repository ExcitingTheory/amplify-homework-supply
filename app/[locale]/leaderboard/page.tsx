import { getServerClient } from "@/utils/amplifyServerClient";
import { AppBar, Box, Typography } from "@mui/material";
import { getTranslations } from "next-intl/server";
import MainToolbar from "@/components/MainToolbar";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { LiveLeaderboard } from "./LiveLeaderboard";

export default async function LeaderboardPage() {
  const t = await getTranslations("pages");

  let initialEntries: any[] = [];

  try {
    const client = getServerClient();

    const { data: profiles } = await (client as any).models.StudentProfile.list({
      limit: 100,
    });

    const byStudent = new Map<string, any>();
    for (const entry of (profiles || []).filter((p: any) => p != null)) {
      const existing = byStudent.get(entry.studentId);
      if (!existing || (entry.totalXP || 0) > existing.totalXP) {
        let parsedReportCard = entry.reportCard;
        if (typeof parsedReportCard === "string") {
          try { parsedReportCard = JSON.parse(parsedReportCard); } catch { parsedReportCard = undefined; }
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
        });
      }
    }
    initialEntries = Array.from(byStudent.values());
  } catch (err) {
    console.error("[Leaderboard RSC] Data fetch error:", err);
  }

  return (
      <GamificationProviderWrapper cohortId={undefined}>
        <LiveLeaderboard initialEntries={initialEntries} />
      </GamificationProviderWrapper>
  );
}
