"use client";
import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useTranslations } from "next-intl";

export interface AccountPreferences {
  leaderboardOptIn?: boolean;
  reducedMotion?: boolean;
  highContrastMode?: boolean;
  showBadgesOnProfile?: boolean;
  showAntiBadgesOnProfile?: boolean;
}

export interface AccountPreferencesViewProps {
  preferences?: AccountPreferences | null;
  onToggle: (key: keyof AccountPreferences, value: boolean) => void;
  /** next-intl translator scoped to "pages"; defaults to the "pages" namespace when omitted. */
  t?: (key: string) => string;
  /** "card" (default) renders each group as its own bordered Card. "bare"
   * renders all groups in a single container separated by dividers, for
   * embedding inside an AccordionDetails. */
  variant?: "card" | "bare";
}

const CARD_SX = {
  padding: "2rem 1rem",
  margin: "1rem auto",
  height: "fit-content",
  maxWidth: "60rem",
} as const;

/**
 * AccountPreferencesView — the presentational privacy, accessibility, and
 * profile-visibility preference cards from the settings page. Driven by a
 * plain `preferences` object + `onToggle` so it renders both in-app (settings
 * page) and standalone (design showcase).
 */
export function AccountPreferencesView({
  preferences,
  onToggle,
  t: tPagesProp,
  variant = "card",
}: AccountPreferencesViewProps) {
  const s = preferences ?? {};
  const t = useTranslations("components");
  const tPagesDefault = useTranslations("pages");
  const tPages: (key: string) => string = tPagesProp ?? tPagesDefault;
  const privacyHeading = tPages("settings.privacy.heading");
  const leaderboardOptInLabel = tPages("settings.privacy.leaderboardOptIn");
  const leaderboardOptInHint = tPages("settings.privacy.leaderboardOptInHint");
  const isBare = variant === "bare";
  const Group: React.ElementType = isBare ? Box : Card;
  const groupSx = isBare ? undefined : CARD_SX;

  const content = (
    <>
      {/* Privacy */}
      <Group sx={groupSx}>
        <Typography variant="h5" gutterBottom>
          {privacyHeading}
        </Typography>
        <FormControlLabel
          data-testid="setting-leaderboard-opt-in"
          control={
            <Switch
              checked={s.leaderboardOptIn !== false}
              onChange={(e) => onToggle("leaderboardOptIn", e.target.checked)}
            />
          }
          label={leaderboardOptInLabel}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          {leaderboardOptInHint}
        </Typography>
      </Group>

      {isBare && <Divider sx={{ my: 2 }} />}

      {/* Accessibility */}
      <Group sx={groupSx}>
        <Typography variant="h5" gutterBottom>
          {t("accountPreferencesView.accessibilityHeading")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("accountPreferencesView.accessibilityDescription")}
        </Typography>
        <FormControlLabel
          data-testid="setting-reduced-motion"
          control={
            <Switch
              checked={s.reducedMotion === true}
              onChange={(e) => onToggle("reducedMotion", e.target.checked)}
            />
          }
          label={t("accountPreferencesView.reducedMotionLabel")}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ ml: 4, mb: 1 }}
        >
          {t("accountPreferencesView.reducedMotionHint")}
        </Typography>
        <FormControlLabel
          data-testid="setting-high-contrast"
          control={
            <Switch
              checked={s.highContrastMode === true}
              onChange={(e) => onToggle("highContrastMode", e.target.checked)}
            />
          }
          label={t("accountPreferencesView.highContrastLabel")}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          {t("accountPreferencesView.highContrastHint")}
        </Typography>
      </Group>

      {isBare && <Divider sx={{ my: 2 }} />}

      {/* Profile Visibility */}
      <Group sx={groupSx}>
        <Typography variant="h5" gutterBottom>
          {t("accountPreferencesView.profileVisibilityHeading")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("accountPreferencesView.profileVisibilityDescription")}
        </Typography>
        <FormControlLabel
          data-testid="setting-show-badges"
          control={
            <Switch
              checked={s.showBadgesOnProfile !== false}
              onChange={(e) =>
                onToggle("showBadgesOnProfile", e.target.checked)
              }
            />
          }
          label={t("accountPreferencesView.showBadgesLabel")}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ ml: 4, mb: 1 }}
        >
          {t("accountPreferencesView.showBadgesHint")}
        </Typography>
        <FormControlLabel
          data-testid="setting-show-anti-badges"
          control={
            <Switch
              checked={s.showAntiBadgesOnProfile === true}
              onChange={(e) =>
                onToggle("showAntiBadgesOnProfile", e.target.checked)
              }
            />
          }
          label={t("accountPreferencesView.showAntiBadgesLabel")}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          {t("accountPreferencesView.showAntiBadgesHint")}
        </Typography>
      </Group>
    </>
  );

  return isBare ? <Box>{content}</Box> : content;
}

export default AccountPreferencesView;
