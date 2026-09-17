"use client";
import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

export interface ProfileCardViewProps {
  /** Avatar slot — the real profile page passes <AvatarSection />, callers
   * without gamification context can pass an <AvatarDisplay /> directly. */
  avatar: React.ReactNode;
  /** Display name shown under the avatar. */
  displayName: React.ReactNode;
  /** Optional streak-freeze shield (or any status element) shown at the bottom. */
  streakShield?: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * ProfileCardView — the presentational profile "avatar card" used on the
 * profile page. Avatar / streak content is provided via slots so it renders
 * both with (profile page) and without (design showcase) gamification context.
 */
export function ProfileCardView({
  avatar,
  displayName,
  streakShield,
  sx,
}: ProfileCardViewProps) {
  return (
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
        ...sx,
      }}
    >
      {avatar}
      <Typography variant="h5">{displayName}</Typography>
      {streakShield && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {streakShield}
        </Box>
      )}
    </Card>
  );
}

export default ProfileCardView;
