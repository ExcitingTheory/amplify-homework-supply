/**
 * ContentLockCard — A card overlay for locked content.
 * Shows requirements (XP, badge, or module completion) needed to unlock.
 *
 * @module ContentLockCard
 */

import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LinearProgress from "@mui/material/LinearProgress";
import getCachedUrl from "@/utils/getCachedUrl";
import { getBlurredPreviewPath } from "@/utils/getBlurredPreviewPath";

export interface ContentLockCardProps {
  /** Title of the locked content. */
  title: string;
  /** Whether the content is currently locked. */
  isLocked: boolean;
  /** Raw S3 path of the unit's cover image — a blurred teaser is derived from this. */
  thumbnailPath?: string | null;
  /** XP required to unlock (if any). */
  requiredXP?: number;
  /** Current student XP. */
  currentXP?: number;
  /** Required badge name (if any). */
  requiredBadge?: string;
  /** Required module completion 0-100 (if any). */
  requiredCompletion?: number;
  /** Current module completion 0-100. */
  currentCompletion?: number;
  /** Unit ID that must be completed first (linear lock). */
  requiredPriorUnitId?: string;
  /** Display name of the prior unit (linear lock). */
  requiredPriorUnitName?: string;
  /** Date when content unlocks automatically. */
  unlockDate?: string;
  /** Children rendered when unlocked. */
  children?: React.ReactNode;
}

export function ContentLockCard({
  title,
  isLocked,
  thumbnailPath,
  requiredXP,
  currentXP = 0,
  requiredBadge,
  requiredCompletion,
  currentCompletion = 0,
  requiredPriorUnitId,
  requiredPriorUnitName,
  unlockDate,
  children,
}: ContentLockCardProps) {
  const [blurredUrl, setBlurredUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    const blurredPath = getBlurredPreviewPath(thumbnailPath);
    if (!blurredPath) {
      setBlurredUrl(null);
      return;
    }
    let cancelled = false;
    getCachedUrl(blurredPath)
      .then((url) => {
        if (!cancelled) setBlurredUrl(url || null);
      })
      .catch(() => {
        if (!cancelled) setBlurredUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [thumbnailPath]);

  if (!isLocked) {
    return <>{children}</>;
  }

  const xpProgress = requiredXP
    ? Math.min(100, Math.round((currentXP / requiredXP) * 100))
    : null;
  const completionProgress = requiredCompletion
    ? Math.min(100, Math.round((currentCompletion / requiredCompletion) * 100))
    : null;

  return (
    <Card
      sx={{
        border: "1px solid",
        borderColor: "divider",
        opacity: 0.75,
        position: "relative",
        overflow: "visible",
        ...(blurredUrl && {
          backgroundImage: `url(${blurredUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }),
      }}
    >
      <CardContent
        sx={
          blurredUrl
            ? {
                backgroundColor: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(2px)",
                borderRadius: "inherit",
              }
            : undefined
        }
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <LockIcon
            color={blurredUrl ? "inherit" : "action"}
            sx={blurredUrl ? { color: "common.white" } : undefined}
          />
          <Typography
            variant="subtitle2"
            color={blurredUrl ? "common.white" : "text.secondary"}
          >
            {title}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          color={blurredUrl ? "common.white" : "text.secondary"}
          sx={{ mb: 1 }}
        >
          Unlock requirements:
        </Typography>

        {requiredXP != null && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {currentXP} / {requiredXP} XP
            </Typography>
            <LinearProgress
              variant="determinate"
              value={xpProgress ?? 0}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {requiredBadge && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 0.5 }}
          >
            🏅 Requires badge: {requiredBadge}
          </Typography>
        )}

        {requiredCompletion != null && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Module: {currentCompletion}% / {requiredCompletion}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={completionProgress ?? 0}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {requiredPriorUnitId && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 0.5 }}
          >
            🔗 Complete &ldquo;{requiredPriorUnitName || "the previous unit"}
            &rdquo; first
          </Typography>
        )}

        {unlockDate && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 0.5 }}
          >
            📅 Unlocks on {new Date(unlockDate).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default ContentLockCard;
