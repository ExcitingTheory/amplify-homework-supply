"use client";
import React from "react";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

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
  /** next-intl translator scoped to "pages"; falls back to English when omitted. */
  t?: (key: string) => string;
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
  t,
}: AccountPreferencesViewProps) {
  const s = preferences ?? {};
  const tr = (key: string, fallback: string) => (t ? t(key) : fallback);
  return (
    <>
      {/* Privacy */}
      <Card sx={CARD_SX}>
        <Typography variant="h5" gutterBottom>
          {tr("settings.privacy.heading", "Privacy")}
        </Typography>
        <FormControlLabel
          data-testid="setting-leaderboard-opt-in"
          control={
            <Switch
              checked={s.leaderboardOptIn !== false}
              onChange={(e) => onToggle("leaderboardOptIn", e.target.checked)}
            />
          }
          label={tr("settings.privacy.leaderboardOptIn", "Show me on leaderboards")}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          {tr(
            "settings.privacy.leaderboardOptInHint",
            "When off, you won't appear on any public leaderboards.",
          )}
        </Typography>
      </Card>

      {/* Accessibility */}
      <Card sx={CARD_SX}>
        <Typography variant="h5" gutterBottom>
          Accessibility
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These settings apply across the entire app. The system-level
          &ldquo;reduce motion&rdquo; preference from your device is always
          respected automatically.
        </Typography>
        <FormControlLabel
          data-testid="setting-reduced-motion"
          control={
            <Switch
              checked={s.reducedMotion === true}
              onChange={(e) => onToggle("reducedMotion", e.target.checked)}
            />
          }
          label="Reduced Motion"
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ ml: 4, mb: 1 }}
        >
          Disable animations, transitions, and auto-playing effects throughout
          the app. Useful for reducing distractions or if motion causes
          discomfort.
        </Typography>
        <FormControlLabel
          data-testid="setting-high-contrast"
          control={
            <Switch
              checked={s.highContrastMode === true}
              onChange={(e) => onToggle("highContrastMode", e.target.checked)}
            />
          }
          label="High Contrast Mode"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          Increase contrast for text and UI elements to improve readability.
        </Typography>
      </Card>

      {/* Profile Visibility */}
      <Card sx={CARD_SX}>
        <Typography variant="h5" gutterBottom>
          Profile Visibility
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose what others can see on your profile page.
        </Typography>
        <FormControlLabel
          data-testid="setting-show-badges"
          control={
            <Switch
              checked={s.showBadgesOnProfile !== false}
              onChange={(e) => onToggle("showBadgesOnProfile", e.target.checked)}
            />
          }
          label="Show badges on profile"
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ ml: 4, mb: 1 }}
        >
          Display your earned achievement badges on your public profile.
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
          label="Show anti-badges on profile"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          Display anti-badges on your profile. These are humorous, not punitive
          — show them off if you want!
        </Typography>
      </Card>
    </>
  );
}

export default AccountPreferencesView;
