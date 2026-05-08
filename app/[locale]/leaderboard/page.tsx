import { getServerClient } from "@/utils/amplifyServerClient";
import { AppBar, Box, Typography } from "@mui/material";
import { getTranslations } from "next-intl/server";
import MainToolbar from "@/components/MainToolbar";
import MyAuth from "@/components/AmplifyAuthenticator";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { LiveLeaderboard } from "./LiveLeaderboard";
import { useScrolledAppBar } from "@/hooks/useScrolledAppBar";

// ISR: revalidate every 60 seconds
export const revalidate = 60;

export default async function LeaderboardPage() {
  const t = await getTranslations("pages");

  let initialEntries: any[] = [];

  try {
    const client = getServerClient();

    const { data: profiles } = await client.models.StudentProfile.list();

    const byStudent = new Map<string, any>();
    for (const entry of (profiles || []).filter((p: any) => p != null)) {
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
    initialEntries = Array.from(byStudent.values());
  } catch (err) {
    console.error("[Leaderboard RSC] Data fetch error:", err);
  }

  return (
    <MyAuth>
      <GamificationProviderWrapper>
        <AppBar position="static" sx={{ transition: "all 0.3s ease" }}>
          <MainToolbar>
            <Box sx={{ flexGrow: 1, margin: "0.5rem 1rem", transition: "all 0.3s ease" }}>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                {t("leaderboard.title", "Leaderboard")}
              </Typography>
            </Box>
          </MainToolbar>
        </AppBar>
        <LiveLeaderboard initialEntries={initialEntries} />
      </GamificationProviderWrapper>
    </MyAuth>
  );
}
