"use client";
import * as React from "react";
import { NailedItWall } from "@/components/Gamification/NailedItWall";
import { AvatarEditor } from "@/components/AvatarEditor";
import { useXP, useContentLock } from "@/context/gamificationContext";
import { LevelBadge } from "@/components/Gamification/LevelBadge";
import { AvatarDisplay } from "@/components/Gamification/AvatarDisplay";
import { useAvatarConfig } from "@/hooks/useAvatarConfig";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { Card, Typography, Box, LinearProgress, Chip } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { useTranslations } from "next-intl";
import AuthContext from "@/context/authContext";

/**
 * Live NailedIt subscription — must be client-side.
 */
export function NailedItSection({ profileUsername }: { profileUsername: string }) {
  const t = useTranslations("pages");
  const [nailedItBlocks, setNailedItBlocks] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!profileUsername) return;
    const client = getAmplifyClient();

    const sub = (client.models as any).NailedIt?.observeQuery?.({
      filter: { owner: { eq: profileUsername } },
    })?.subscribe?.({
      next: ({ items }: any) => {
        const valid = items.filter((i: any) => i != null && i.id != null);
        setNailedItBlocks(
          valid.map((n: any) => ({
            id: n.id,
            question: n.question || "",
            nailedItReason: n.nailedItReason || "",
            homeworkTitle: n.homeworkTitle || "",
            createdAt: n.createdAt || new Date().toISOString(),
          })),
        );
      },
      error: (err: any) =>
        console.error("[Profile] NailedIt subscription error:", err),
    });

    return () => {
      sub?.unsubscribe?.();
    };
  }, [profileUsername]);

  return (
    <Card
      sx={{
        padding: "2rem 1rem",
        margin: "1rem auto",
        height: "fit-content",
        maxWidth: "60rem",
      }}
    >
      <Typography variant="h5" gutterBottom>
        {t("profile.nailedItWall" as any)}
      </Typography>
      <NailedItWall blocks={nailedItBlocks} />
    </Card>
  );
}

/**
 * Avatar section — uses AvatarDisplay (with streak, level, border effects)
 * for both own and other profiles. Editable for own profile.
 * Detects own profile client-side via AuthContext to ensure the same seed
 * and config as the toolbar avatar.
 */
export function AvatarSection({
  isOwnProfile: isOwnProfileHint,
  profileUsername,
  streak = 0,
}: {
  isOwnProfile: boolean;
  profileUsername: string;
  streak?: number;
}) {
  const { level } = useXP();
  const { style: avatarStyle, overrides: avatarOverrides, seed: configSeed, isLoaded, glowRing } = useAvatarConfig();
  const { user } = React.useContext(AuthContext) as any;

  // Detect own profile client-side: compare route username with current user
  const currentUsername = user?.username || user?.attributes?.sub || "";
  const isOwnProfile = isOwnProfileHint || (currentUsername && currentUsername === profileUsername);

  // Always use configSeed for own profile (matches toolbar), profileUsername for others
  const avatarSeed = isOwnProfile ? (configSeed || profileUsername) : profileUsername;

  if (isOwnProfile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        {isLoaded ? (
          <AvatarEditor />
        ) : (
          <Box sx={{ width: 128, height: 128 }} />
        )}
        <LevelBadge level={level} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      {isLoaded ? (
        <AvatarDisplay
          seed={avatarSeed}
          size={96}
          style={avatarStyle}
          overrides={avatarOverrides}
          streak={streak}
          level={level}
          glowRing={glowRing}
        />
      ) : (
        <Box sx={{ width: 96, height: 96 }} />
      )}
    </Box>
  );
}

/**
 * Unlock Roadmap — shows locked content with progress toward unlocking.
 * Uses useContentLock() from GamificationContext to show all current locks
 * and the student's progress toward each requirement.
 */
export function UnlockRoadmap() {
  const t = useTranslations("pages");
  const { locks, isLoading } = useContentLock();
  const { totalXP, level } = useXP();

  // Only show locks that are still locked
  const activeLocks = locks.filter((l) => l.isLocked);

  if (isLoading) return null;
  if (activeLocks.length === 0) return null;

  return (
    <Card sx={{ padding: "2rem 1rem", mb: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <LockIcon fontSize="small" />
        {t("profile.unlockRoadmap" as any) || "Unlock Roadmap"}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {activeLocks.map((lock) => {
          const xpProgress = lock.requiredXP
            ? Math.min(100, Math.round(((lock.currentXP ?? totalXP) / lock.requiredXP) * 100))
            : null;
          const completionProgress = lock.requiredCompletion
            ? Math.min(100, Math.round(((lock.currentCompletion ?? 0) / lock.requiredCompletion) * 100))
            : null;

          return (
            <Box
              key={lock.contentId}
              sx={{
                p: 2,
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                opacity: 0.85,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <LockIcon fontSize="small" color="action" />
                <Typography variant="subtitle1" fontWeight={600}>
                  {lock.contentId}
                </Typography>
              </Box>

              {/* XP requirement */}
              {lock.requiredXP != null && (
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t("profile.xpRequired" as any) || "XP Required"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {lock.currentXP ?? totalXP} / {lock.requiredXP}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={xpProgress ?? 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}

              {/* Badge requirement */}
              {lock.requiredBadge && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Chip
                    size="small"
                    icon={lock.hasBadge ? <LockOpenIcon /> : <LockIcon />}
                    label={lock.requiredBadge}
                    color={lock.hasBadge ? "success" : "default"}
                    variant={lock.hasBadge ? "filled" : "outlined"}
                  />
                </Box>
              )}

              {/* Module completion requirement */}
              {lock.requiredCompletion != null && (
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t("profile.completionRequired" as any) || "Completion Required"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {lock.currentCompletion ?? 0}% / {lock.requiredCompletion}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={completionProgress ?? 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}

              {/* Linear lock requirement */}
              {lock.requiredPriorUnitId && (
                <Typography variant="body2" color="text.secondary">
                  {t("profile.completePriorUnit" as any) || "Complete prior unit first"}
                  {lock.requiredPriorUnitName && `: ${lock.requiredPriorUnitName}`}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}
