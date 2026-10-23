"use client";
/**
 * BadgeShelf — Grid display of achievement badges.
 * Earned badges show in full color; unearned badges are grayed out with a lock overlay.
 *
 * @module BadgeShelf
 */

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { useTranslations } from "next-intl";
import { BadgeIcon } from "./BadgeIcon";
import { getBadgeConfig } from "./badgeRegistry";
import { getAntiBadgeConfig } from "./antiBadgeRegistry";
import type { AntiBadgeConfig } from "./antiBadgeRegistry";
import { SEMANTIC_THEME } from "../../themes/semanticTheme";

export type BadgeType =
  | "FIRST_SUBMISSION"
  | "GOOD_EYE"
  | "QUICK_DRAW"
  | "SHARPSHOOTER"
  | "CONSISTENT"
  | "TEAM_PLAYER"
  | "DEEP_THINKER"
  | "TOP_OF_CLASS"
  | "PERFECTIONIST"
  // Avatar unlock badges
  | "AVATAR_COLORS"
  | "AVATAR_DETAILED"
  | "AVATAR_ACCESSORIES"
  | "AVATAR_PORTRAIT"
  // Bot Whisperer tiered badges
  | "BOT_WHISPERER_I"
  | "BOT_WHISPERER_II"
  | "BOT_WHISPERER_III"
  | "BOT_WHISPERER_IV"
  // Avatar powerup badges
  | "AVATAR_GLOW"
  // Storybook documentation promo badges
  | "DOCS_EXPLORER"
  | "INSTRUCTOR_ONBOARD"
  | "LEARNER_ONBOARD"
  | "TRANSLATOR_ONBOARD"
  | "A11Y_CHAMPION"
  | "DOCS_CHAMPION";

type Translate = ReturnType<typeof useTranslations<"components">>;

interface BadgeDefinition {
  name: string;
  description: string;
}

const BADGE_TYPE_ORDER: BadgeType[] = [
  "FIRST_SUBMISSION",
  "GOOD_EYE",
  "QUICK_DRAW",
  "SHARPSHOOTER",
  "CONSISTENT",
  "TEAM_PLAYER",
  "DEEP_THINKER",
  "TOP_OF_CLASS",
  "PERFECTIONIST",
  "AVATAR_COLORS",
  "AVATAR_DETAILED",
  "AVATAR_ACCESSORIES",
  "AVATAR_PORTRAIT",
  "BOT_WHISPERER_I",
  "BOT_WHISPERER_II",
  "BOT_WHISPERER_III",
  "BOT_WHISPERER_IV",
  "AVATAR_GLOW",
  "DOCS_EXPLORER",
  "INSTRUCTOR_ONBOARD",
  "LEARNER_ONBOARD",
  "TRANSLATOR_ONBOARD",
  "A11Y_CHAMPION",
  "DOCS_CHAMPION",
];

function getBadgeDefinitions(t: Translate): Record<BadgeType, BadgeDefinition> {
  return {
    FIRST_SUBMISSION: {
      name: t("badgeShelf.badges.firstSubmissionName"),
      description: t("badgeShelf.badges.firstSubmissionDescription"),
    },
    GOOD_EYE: {
      name: t("badgeShelf.badges.goodEyeName"),
      description: t("badgeShelf.badges.goodEyeDescription"),
    },
    QUICK_DRAW: {
      name: t("badgeShelf.badges.quickDrawName"),
      description: t("badgeShelf.badges.quickDrawDescription"),
    },
    SHARPSHOOTER: {
      name: t("badgeShelf.badges.sharpshooterName"),
      description: t("badgeShelf.badges.sharpshooterDescription"),
    },
    CONSISTENT: {
      name: t("badgeShelf.badges.consistentName"),
      description: t("badgeShelf.badges.consistentDescription"),
    },
    TEAM_PLAYER: {
      name: t("badgeShelf.badges.teamPlayerName"),
      description: t("badgeShelf.badges.teamPlayerDescription"),
    },
    DEEP_THINKER: {
      name: t("badgeShelf.badges.deepThinkerName"),
      description: t("badgeShelf.badges.deepThinkerDescription"),
    },
    TOP_OF_CLASS: {
      name: t("badgeShelf.badges.topOfClassName"),
      description: t("badgeShelf.badges.topOfClassDescription"),
    },
    PERFECTIONIST: {
      name: t("badgeShelf.badges.perfectionistName"),
      description: t("badgeShelf.badges.perfectionistDescription"),
    },
    AVATAR_COLORS: {
      name: t("badgeShelf.badges.avatarColorsName"),
      description: t("badgeShelf.badges.avatarColorsDescription"),
    },
    AVATAR_DETAILED: {
      name: t("badgeShelf.badges.avatarDetailedName"),
      description: t("badgeShelf.badges.avatarDetailedDescription"),
    },
    AVATAR_ACCESSORIES: {
      name: t("badgeShelf.badges.avatarAccessoriesName"),
      description: t("badgeShelf.badges.avatarAccessoriesDescription"),
    },
    AVATAR_PORTRAIT: {
      name: t("badgeShelf.badges.avatarPortraitName"),
      description: t("badgeShelf.badges.avatarPortraitDescription"),
    },
    BOT_WHISPERER_I: {
      name: t("badgeShelf.badges.botWhispererIName"),
      description: t("badgeShelf.badges.botWhispererIDescription"),
    },
    BOT_WHISPERER_II: {
      name: t("badgeShelf.badges.botWhispererIiName"),
      description: t("badgeShelf.badges.botWhispererIiDescription"),
    },
    BOT_WHISPERER_III: {
      name: t("badgeShelf.badges.botWhispererIiiName"),
      description: t("badgeShelf.badges.botWhispererIiiDescription"),
    },
    BOT_WHISPERER_IV: {
      name: t("badgeShelf.badges.botWhispererIvName"),
      description: t("badgeShelf.badges.botWhispererIvDescription"),
    },
    AVATAR_GLOW: {
      name: t("badgeShelf.badges.avatarGlowName"),
      description: t("badgeShelf.badges.avatarGlowDescription"),
    },
    DOCS_EXPLORER: {
      name: t("badgeShelf.badges.docsExplorerName"),
      description: t("badgeShelf.badges.docsExplorerDescription"),
    },
    INSTRUCTOR_ONBOARD: {
      name: t("badgeShelf.badges.instructorOnboardName"),
      description: t("badgeShelf.badges.instructorOnboardDescription"),
    },
    LEARNER_ONBOARD: {
      name: t("badgeShelf.badges.learnerOnboardName"),
      description: t("badgeShelf.badges.learnerOnboardDescription"),
    },
    TRANSLATOR_ONBOARD: {
      name: t("badgeShelf.badges.translatorOnboardName"),
      description: t("badgeShelf.badges.translatorOnboardDescription"),
    },
    A11Y_CHAMPION: {
      name: t("badgeShelf.badges.a11yChampionName"),
      description: t("badgeShelf.badges.a11yChampionDescription"),
    },
    DOCS_CHAMPION: {
      name: t("badgeShelf.badges.docsChampionName"),
      description: t("badgeShelf.badges.docsChampionDescription"),
    },
  };
}

const ALL_BADGE_TYPES: BadgeType[] = BADGE_TYPE_ORDER;

export interface EarnedBadge {
  badgeType: BadgeType | string;
  awardedAt: string;
  /** The unit or entity ID this badge was earned in. */
  sourceId?: string | null;
  /** Number of times this badge has been earned (from model count field). */
  count?: number;
  /** Whether this is an anti-badge (earned for dubious achievements). */
  isAnti?: boolean;
}

export interface BadgeShelfProps {
  /** Array of badges the student has earned. */
  earnedBadges: EarnedBadge[];
  /** When true, only earned badges are rendered (unearned are hidden). Defaults to false. */
  earnedOnly?: boolean;
}

export function BadgeShelf({
  earnedBadges,
  earnedOnly = false,
}: BadgeShelfProps) {
  const t = useTranslations("components");
  const badgeDefinitions = getBadgeDefinitions(t);
  // Split earned badges into regular and anti
  const regularEarned = earnedBadges.filter((b) => !b.isAnti);
  const antiEarned = earnedBadges.filter((b) => b.isAnti);

  const earnedSet = new Set(regularEarned.map((b) => b.badgeType));

  // Count how many times each badge was earned — prefer model count field, fall back to array duplicates
  const earnedCounts = earnedBadges.reduce<Record<string, number>>((acc, b) => {
    const badgeCount = b.count && b.count > 1 ? b.count : 1;
    acc[b.badgeType] = (acc[b.badgeType] || 0) + badgeCount;
    return acc;
  }, {});

  const badgesToShow = earnedOnly
    ? ALL_BADGE_TYPES.filter((type) => earnedSet.has(type))
    : ALL_BADGE_TYPES;

  // Popover state
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [activeBadge, setActiveBadge] = React.useState<string | null>(null);
  const [activeIsAnti, setActiveIsAnti] = React.useState(false);

  const handleClick = (
    event: React.MouseEvent<HTMLElement>,
    type: string,
    isAnti = false,
  ) => {
    setAnchorEl(event.currentTarget);
    setActiveBadge(type);
    setActiveIsAnti(isAnti);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveBadge(null);
    setActiveIsAnti(false);
  };

  const activeDef =
    activeBadge && !activeIsAnti
      ? badgeDefinitions[activeBadge as BadgeType]
      : null;
  const activeAntiConfig =
    activeBadge && activeIsAnti ? getAntiBadgeConfig(activeBadge) : null;
  const activeEarned = activeBadge
    ? earnedBadges.find((b) => b.badgeType === activeBadge)
    : null;
  const activeIsEarned = activeBadge
    ? activeIsAnti
      ? antiEarned.some((b) => b.badgeType === activeBadge)
      : earnedSet.has(activeBadge as BadgeType)
    : false;
  const activeCount = activeBadge ? earnedCounts[activeBadge] || 0 : 0;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          alignItems: "center",
        }}
      >
        {badgesToShow.map((type) => {
          const def = badgeDefinitions[type];
          const isEarned = earnedSet.has(type);
          const count = earnedCounts[type] || 0;

          return (
            <Tooltip key={type} title={def.name} arrow>
              <Box
                onClick={(e) => handleClick(e, type)}
                sx={{
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                <BadgeIcon
                  badgeType={type}
                  size={56}
                  earned={isEarned}
                  animate={isEarned}
                  drawIcon={isEarned}
                />
                {isEarned && count > 1 && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      fontSize: "0.625rem",
                      fontWeight: 800,
                      color: "primary.main",
                      bgcolor: "background.paper",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: 1,
                      lineHeight: 1,
                    }}
                  >
                    ×{count}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Anti-badges section */}
      {antiEarned.length > 0 && (
        <>
          <Divider sx={{ my: 2 }}>
            <Chip
              label={t("badgeShelf.antiBadges")}
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
            />
          </Divider>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              alignItems: "center",
            }}
          >
            {antiEarned.map((badge) => {
              const config = getAntiBadgeConfig(badge.badgeType);
              const count = earnedCounts[badge.badgeType] || 1;
              if (!config) return null;

              return (
                <Tooltip key={badge.badgeType} title={config.name} arrow>
                  <Box
                    onClick={(e) => handleClick(e, badge.badgeType, true)}
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: "error.main",
                      borderRadius: "50%",
                      p: 0.25,
                    }}
                  >
                    <BadgeIcon
                      config={config}
                      size={56}
                      earned
                      animate
                      drawIcon
                    />
                    {count > 1 && (
                      <Typography
                        variant="caption"
                        sx={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          fontSize: "0.625rem",
                          fontWeight: 800,
                          color: "error.main",
                          bgcolor: "background.paper",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: 1,
                          lineHeight: 1,
                        }}
                      >
                        ×{count}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </>
      )}

      {/* Detail popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              maxWidth: 260,
              borderRadius: `${SEMANTIC_THEME.radius.modal}px`,
            },
          },
        }}
      >
        {activeDef && !activeIsAnti && (
          <Stack spacing={0.5} alignItems="center">
            <BadgeIcon
              badgeType={activeBadge!}
              size={48}
              earned={activeIsEarned}
              animate={false}
              drawIcon={false}
            />
            <Typography variant="subtitle2" fontWeight={700}>
              {activeDef.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
            >
              {activeDef.description}
            </Typography>
            {activeIsEarned && activeEarned && (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {t("badgeShelf.earnedOn", {
                  date: new Date(activeEarned.awardedAt).toLocaleDateString(),
                })}
              </Typography>
            )}
            {activeIsEarned && activeCount > 1 && (
              <Typography
                variant="caption"
                fontWeight={700}
                color="primary.main"
              >
                {t("badgeShelf.earnedTimes", { count: activeCount })}
              </Typography>
            )}
            {!activeIsEarned && (
              <Typography
                variant="caption"
                color="text.disabled"
                fontStyle="italic"
              >
                {t("badgeShelf.locked")}
              </Typography>
            )}
          </Stack>
        )}
        {activeAntiConfig && activeIsAnti && (
          <Stack spacing={0.5} alignItems="center">
            <BadgeIcon
              config={activeAntiConfig}
              size={48}
              earned
              animate={false}
              drawIcon={false}
            />
            <Typography variant="subtitle2" fontWeight={700} color="error.main">
              {activeAntiConfig.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
            >
              {activeAntiConfig.description}
            </Typography>
            {activeAntiConfig.debuff.shameText && (
              <Typography
                variant="caption"
                fontStyle="italic"
                color="error"
                textAlign="center"
                sx={{ opacity: 0.8 }}
              >
                &ldquo;{activeAntiConfig.debuff.shameText}&rdquo;
              </Typography>
            )}
            {activeAntiConfig.debuff.xpMultiplier != null && (
              <Chip
                label={t("badgeShelf.xpMultiplierDebuff", {
                  multiplier: activeAntiConfig.debuff.xpMultiplier,
                  hours:
                    activeAntiConfig.debuff.xpMultiplierDurationHours || 24,
                })}
                size="small"
                color="error"
                variant="outlined"
                sx={{ fontSize: "0.65rem" }}
              />
            )}
            {activeAntiConfig.debuff.temporaryTitle && (
              <Chip
                label={t("badgeShelf.temporaryTitle", {
                  title: activeAntiConfig.debuff.temporaryTitle,
                })}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.65rem" }}
              />
            )}
            {activeAntiConfig.redeemable && activeAntiConfig.redemptionHint && (
              <Typography
                variant="caption"
                color="success.main"
                textAlign="center"
                sx={{ mt: 0.5 }}
              >
                {t("badgeShelf.redeemable", {
                  hint: activeAntiConfig.redemptionHint,
                })}
              </Typography>
            )}
            {activeIsEarned && activeEarned && (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {t("badgeShelf.receivedOn", {
                  date: new Date(activeEarned.awardedAt).toLocaleDateString(),
                })}
              </Typography>
            )}
            {activeCount > 1 && (
              <Typography variant="caption" fontWeight={700} color="error.main">
                {t("badgeShelf.receivedTimes", { count: activeCount })}
              </Typography>
            )}
          </Stack>
        )}
      </Popover>
    </>
  );
}

export default BadgeShelf;
