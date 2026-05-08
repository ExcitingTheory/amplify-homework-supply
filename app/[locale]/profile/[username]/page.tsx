import { getServerClient } from "@/utils/amplifyServerClient";
import { Box, Card, Typography, AppBar } from "@mui/material";
import { getTranslations } from "next-intl/server";
import MainToolbar from "@/components/MainToolbar";
import MyAuth from "@/components/AmplifyAuthenticator";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { BadgeShelf } from "@/components/Gamification/BadgeShelf";
import { StreakCalendar } from "@/components/Gamification/StreakCalendar";
import { ProgressRings } from "@/components/Gamification/ProgressRings";
import { StreakShield } from "@/components/Gamification/StreakShield";
import { DiceBearAvatar } from "@/components/Gamification/DiceBearAvatar";
import { NailedItSection, AvatarSection } from "./ProfileClientSections";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username: routeUsername } = await params;
  const t = await getTranslations("pages");

  let profileData: any = null;
  let earnedBadges: any[] = [];
  let activeDays: string[] = [];
  let progressModules: any[] = [];
  let currentStreak = 0;
  let freezesRemaining = 0;
  let freezesUsed = 0;
  let isOwnProfile = false;
  let displayName = routeUsername;

  try {
    const client = getServerClient();

    // Fetch the StudentProfile for this user
    const { data: profiles } = await client.models.StudentProfile.list({
      filter: { studentId: { eq: routeUsername } },
    });

    const profile = (profiles || []).filter((p: any) => p != null)?.[0];
    if (profile) {
      profileData = profile;
      displayName = profile.studentName || routeUsername;
      currentStreak = profile.currentStreak || 0;
      freezesRemaining = profile.freezesRemaining || 0;
      freezesUsed = profile.freezesUsed || 0;

      // Badges
      earnedBadges = (profile.badges || []).map((b: any) => ({
        badgeType: b.badgeType,
        awardedAt: b.awardedAt || new Date().toISOString(),
        sourceId: b.sourceId || null,
        count: 1,
      }));

      // Progress modules
      progressModules = (profile.moduleProgress || []).map((p: any) => ({
        moduleId: p.moduleId,
        moduleName: p.moduleId,
        completionPercent: p.completionPercent || 0,
        totalWorkbooks: p.totalWorkbooks || 0,
        completedWorkbooks: p.completedWorkbooks || 0,
      }));
    }

    // Fetch XP logs for activity calendar (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: xpLogs } = await client.models.StudentXPLog.list({
      filter: {
        owner: { eq: routeUsername },
        createdAt: { ge: startOfMonth },
      },
    });

    const days = new Set<string>();
    (xpLogs || [])
      .filter((l: any) => l != null)
      .forEach((log: any) => {
        if (log.createdAt) days.add(log.createdAt.slice(0, 10));
      });
    activeDays = Array.from(days);
  } catch (err) {
    console.error("[Profile RSC] Data fetch error:", err);
  }

  return (
    <MyAuth>
      <GamificationProviderWrapper>
        <AppBar
          position="fixed"
          color="default"
          sx={{
            backgroundColor: "custom.glassNavbar",
            backdropFilter: "blur(8px)",
          }}
        >
          <MainToolbar>
            <Box sx={{ flexGrow: 1, margin: "1rem" }}>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                {t("profile.title")}
              </Typography>
            </Box>
          </MainToolbar>
        </AppBar>
        <Box
          sx={{
            position: "fixed",
            top: "5rem",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "1rem",
            paddingBottom: "3rem",
            overflow: "auto",
          }}
        >
          {/* Profile Avatar, Level & Streak */}
          <Card
            sx={{
              padding: "2rem 1rem",
              margin: "1rem auto",
              height: "fit-content",
              maxWidth: "60rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <DiceBearAvatar seed={routeUsername || "student"} size={96} style="simple" />
            <Typography variant="h5">{displayName}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AvatarSection isOwnProfile={isOwnProfile} profileUsername={routeUsername} />
              <StreakShield
                freezesRemaining={freezesRemaining}
                freezesUsed={freezesUsed}
              />
            </Box>
          </Card>

          {/* Progress Rings */}
          {progressModules.length > 0 && (
            <Card
              sx={{
                padding: "2rem 1rem",
                margin: "1rem auto",
                height: "fit-content",
                maxWidth: "60rem",
              }}
            >
              <Typography variant="h5" gutterBottom>
                {t("profile.progress", "Progress")}
              </Typography>
              <ProgressRings modules={progressModules} />
            </Card>
          )}

          {/* Activity Calendar */}
          <Card
            sx={{
              padding: "2rem 1rem",
              margin: "1rem auto",
              height: "fit-content",
              maxWidth: "60rem",
            }}
          >
            <Typography variant="h5" gutterBottom>
              {t("profile.activity", "Activity")}
            </Typography>
            <StreakCalendar activeDays={new Set(activeDays)} />
          </Card>

          {/* Badges */}
          <Card
            sx={{
              padding: "2rem 1rem",
              margin: "1rem auto",
              height: "fit-content",
              maxWidth: "60rem",
            }}
          >
            <Typography variant="h5" gutterBottom>
              {t("profile.badges", "Badges")}
            </Typography>
            <BadgeShelf earnedBadges={earnedBadges} columns={3} earnedOnly />
          </Card>

          {/* Nailed It Wall (live subscription — client component) */}
          <NailedItSection profileUsername={routeUsername} />
        </Box>
      </GamificationProviderWrapper>
    </MyAuth>
  );
}
