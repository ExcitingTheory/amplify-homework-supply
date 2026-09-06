import { getServerClient } from "@/utils/amplifyServerClient";
import { Box, Card, Typography } from "@mui/material";
import { getTranslations } from "next-intl/server";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import { BadgeShelf } from "@/components/Gamification/BadgeShelf";
import { StreakCalendar } from "@/components/Gamification/StreakCalendar";
import { ProgressRings } from "@/components/Gamification/ProgressRings";
import { StreakShield } from "@/components/Gamification/StreakShield";
import {
  NailedItSection,
  AvatarSection,
  UnlockRoadmap,
} from "./ProfileClientSections";
import ProfileThemeWrapper from "./ProfileThemeWrapper";

interface Props {
  params: Promise<{ username: string }>;
}

/**
 * Profile data fetch. Uses auth cookies so cannot be cached with "use cache".
 * Revalidation handled by Next.js route-level caching and revalidateTag.
 */
async function getCachedProfileData(routeUsername: string) {
  let earnedBadges: any[] = [];
  let activeDays: string[] = [];
  let progressModules: any[] = [];
  let currentStreak = 0;
  let freezesRemaining = 0;
  let freezesUsed = 0;
  let displayName = routeUsername;
  let showBadgesOnProfile = true;
  let showAntiBadgesOnProfile = false;
  let profileThemeId: string | null = null;
  let customThemePalette: any = null;
  let nailedItBlocks: any[] = [];

  try {
    const client = getServerClient() as any;

    // Fetch the StudentProfile for this user
    const { data: profiles } = await client.models.StudentProfile.list({
      filter: { studentId: { eq: routeUsername } },
    });

    const profile = (profiles || []).filter((p: any) => p != null)?.[0];
    if (profile) {
      displayName = profile.studentName || routeUsername;
      currentStreak = profile.currentStreak || 0;
      freezesRemaining = profile.freezesRemaining || 0;
      freezesUsed = profile.freezesUsed || 0;

      // Badges
      earnedBadges = (profile.badges || []).map((b: any) => ({
        badgeType: b.badgeType,
        awardedAt: b.awardedAt || new Date().toISOString(),
        sourceId: b.sourceId || null,
        isAnti: b.isAnti || false,
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

    // Fetch the user's Settings for profile visibility preferences
    const { data: settingsList } = await client.models.Settings.list({
      filter: { owner: { eq: routeUsername } },
    });
    const userSettings = (settingsList || []).filter(
      (s: any) => s != null,
    )?.[0];
    if (userSettings) {
      showBadgesOnProfile = userSettings.showBadgesOnProfile !== false;
      showAntiBadgesOnProfile = userSettings.showAntiBadgesOnProfile === true;
      profileThemeId = userSettings.profileThemeId || null;
      customThemePalette = userSettings.customThemePalette || null;
    }

    // Filter badges based on the user's visibility preferences
    earnedBadges = earnedBadges.filter((b: any) => {
      if (b.isAnti) return showAntiBadgesOnProfile;
      return showBadgesOnProfile;
    });

    // Resolve unit names for progress modules
    if (progressModules.length > 0) {
      const unitIds = progressModules.map((m: any) => m.moduleId);
      const unitResults = await Promise.all(
        unitIds.map((id: string) =>
          client.models.Unit.get({ id }).catch(() => ({ data: null })),
        ),
      );
      const nameMap: Record<string, string> = {};
      unitResults.forEach((res: any) => {
        if (res?.data?.id && res.data.name) {
          nameMap[res.data.id] = res.data.name;
        }
      });
      progressModules = progressModules.map((m: any) => ({
        ...m,
        moduleName: nameMap[m.moduleId] || m.moduleId,
      }));
    }

    // Fetch XP logs for activity calendar (current month)
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const { data: xpLogs } = await client.models.StudentXPLog.list({
      filter: {
        studentId: { eq: routeUsername },
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

    // Build Nailed It wall entries from XP logs (legacy NailedIt model removed)
    const { data: nailedItLogs } = await client.models.StudentXPLog.list({
      filter: {
        studentId: { eq: routeUsername },
        reason: { eq: "NAILED_IT" },
      },
    });

    nailedItBlocks = (nailedItLogs || [])
      .filter((l: any) => l != null)
      .sort((a: any, b: any) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 12)
      .map((log: any, idx: number) => ({
        id: log.id || `profile-nailed-it-${idx}`,
        question: log.sourceId || "Workbook mastery moment",
        nailedItReason:
          "Excellent understanding demonstrated in a completed task.",
        homeworkTitle: "Learner Workbook",
        createdAt: log.createdAt || new Date().toISOString(),
      }));
  } catch (err) {
    console.error("[Profile RSC] Data fetch error:", err);
  }

  return {
    earnedBadges,
    activeDays,
    progressModules,
    currentStreak,
    freezesRemaining,
    freezesUsed,
    displayName,
    showBadgesOnProfile,
    showAntiBadgesOnProfile,
    profileThemeId,
    customThemePalette,
    nailedItBlocks,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username: routeUsername } = await params;
  const t = await getTranslations("pages");

  const {
    earnedBadges,
    activeDays,
    progressModules,
    currentStreak,
    freezesRemaining,
    freezesUsed,
    displayName,
    showBadgesOnProfile,
    showAntiBadgesOnProfile,
    profileThemeId,
    customThemePalette,
    nailedItBlocks,
  } = await getCachedProfileData(routeUsername);

  const isOwnProfile = false;

  // Parse custom palette if it's a JSON string
  const parsedCustomPalette = customThemePalette
    ? typeof customThemePalette === "string"
      ? JSON.parse(customThemePalette)
      : customThemePalette
    : null;

  return (
    <ProfileThemeWrapper
      themeId={profileThemeId}
      customPalette={parsedCustomPalette}
    >
      <GamificationProviderWrapper cohortId={undefined as any}>
        <Box
          data-tour="profile-page"
          sx={{
            marginTop: "1rem",
            px: 2,
            pb: 3,
            maxWidth: "60rem",
            mx: "auto",
            boxSizing: "border-box",
          }}
        >
          {/* Top row: Avatar + Activity side by side */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              mb: 2,
            }}
          >
            {/* Avatar Card */}
            <Card
              sx={{
                padding: "2rem 1rem",
                paddingTop: "2.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                overflow: "visible",
              }}
            >
              <AvatarSection
                isOwnProfile={isOwnProfile}
                profileUsername={routeUsername}
                streak={currentStreak}
              />
              <Typography variant="h5">{displayName}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <StreakShield
                  freezesRemaining={freezesRemaining}
                  freezesUsed={freezesUsed}
                />
              </Box>
            </Card>

            {/* Activity Calendar Card */}
            <Card
              sx={{
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h5" gutterBottom>
                {t("profile.activity" as any)}
              </Typography>
              <StreakCalendar activeDays={new Set(activeDays)} />
            </Card>
          </Box>

          {/* Progress Rings */}
          {progressModules.length > 0 && (
            <Card
              sx={{
                padding: "2rem 1rem",
                mb: 2,
              }}
            >
              <Typography variant="h5" gutterBottom>
                {t("profile.progress" as any)}
              </Typography>
              <ProgressRings modules={progressModules} />
            </Card>
          )}

          {/* Badges — only shown if user opted in and has badges */}
          {earnedBadges.length > 0 && (
            <Card
              sx={{
                padding: "2rem 1rem",
                mb: 2,
              }}
            >
              <Typography variant="h5" gutterBottom>
                {t("profile.badges" as any)}
              </Typography>
              <BadgeShelf earnedBadges={earnedBadges} />
            </Card>
          )}

          {/* Unlock Roadmap (live lock state — client component) */}
          <UnlockRoadmap />

          {/* Nailed It Wall (from XP logs) */}
          <NailedItSection nailedItBlocks={nailedItBlocks} />
        </Box>
      </GamificationProviderWrapper>
    </ProfileThemeWrapper>
  );
}
