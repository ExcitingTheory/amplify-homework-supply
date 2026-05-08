"use client";
import * as React from "react";
import { NailedItWall } from "@/components/Gamification/NailedItWall";
import { AvatarEditor } from "@/components/AvatarEditor";
import { useXP } from "@/context/gamificationContext";
import { LevelBadge } from "@/components/Gamification/LevelBadge";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { Card, Typography, Box } from "@mui/material";
import { useTranslations } from "next-intl";

/**
 * Live NailedIt subscription — must be client-side.
 */
export function NailedItSection({ profileUsername }: { profileUsername: string }) {
  const t = useTranslations("pages");
  const [nailedItBlocks, setNailedItBlocks] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!profileUsername) return;
    const client = getAmplifyClient();

    const sub = client.models.NailedIt?.observeQuery?.({
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
        {t("profile.nailedItWall", "Nailed It Wall")}
      </Typography>
      <NailedItWall blocks={nailedItBlocks} />
    </Card>
  );
}

/**
 * Avatar section — editable for own profile, static for others.
 */
export function AvatarSection({
  isOwnProfile,
  profileUsername,
}: {
  isOwnProfile: boolean;
  profileUsername: string;
}) {
  const { level } = useXP();

  if (isOwnProfile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <AvatarEditor />
        <LevelBadge level={level} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <LevelBadge level={level} />
    </Box>
  );
}
