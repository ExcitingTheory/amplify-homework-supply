/**
 * BotCustomizer — Allows students to customize the AI assistant's avatar appearance.
 * Unlocked progressively via "Bot Whisperer" achievement badges.
 *
 * - Bot Whisperer I: Unlock background color
 * - Bot Whisperer II: Unlock style tier (detailed)
 * - Bot Whisperer III: Unlock eyes & mouth options
 * - Bot Whisperer IV: Full customization (toonhead style + all options)
 *
 * @module BotCustomizer
 */

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Chip from "@mui/material/Chip";
import LockIcon from "@mui/icons-material/Lock";
import { BotAvatar } from "./BotAvatar";
import type {
  AvatarStyleTier,
  AvatarOverrides,
} from "./Gamification/DiceBearAvatar";

// ============================================================================
// Types
// ============================================================================

export interface BotCustomizerProps {
  /** Which Bot Whisperer tier the student has reached (0 = none, 1–4 = badges) */
  botWhispererTier: number;
  /** Callback when customization changes. Caller should persist to Settings model. */
  onChange?: (config: BotConfig) => void;
  /** Initial config loaded from Settings. */
  initialConfig?: BotConfig;
}

export interface BotConfig {
  style: AvatarStyleTier;
  backgroundColor: string;
}

// ============================================================================
// Constants
// ============================================================================

const BG_COLORS = [
  "b6e3f4",
  "c0ffd4",
  "d1c4e9",
  "ffd8b1",
  "ffcdd2",
  "fff9c4",
] as const;

// ============================================================================
// Component
// ============================================================================

export function BotCustomizer({
  botWhispererTier,
  onChange,
  initialConfig,
}: BotCustomizerProps) {
  const t = useTranslations("components.botCustomizer");
  const [style, setStyle] = useState<AvatarStyleTier>(
    initialConfig?.style || "simple",
  );
  const [bgColor, setBgColor] = useState(
    initialConfig?.backgroundColor || "b6e3f4",
  );

  const styleOptions = [
    { value: "simple", label: t("styles.simple"), minTier: 0 },
    { value: "detailed", label: t("styles.detailed"), minTier: 2 },
    { value: "toonhead", label: t("styles.toon"), minTier: 4 },
  ] as Array<{ value: AvatarStyleTier; label: string; minTier: number }>;

  const colorLabels = [
    t("colors.sky"),
    t("colors.mint"),
    t("colors.lavender"),
    t("colors.peach"),
    t("colors.rose"),
    t("colors.gold"),
  ];

  const overrides: AvatarOverrides = { backgroundColor: [bgColor] };

  const handleStyleChange = useCallback(
    (_: unknown, newStyle: AvatarStyleTier | null) => {
      if (!newStyle) return;
      setStyle(newStyle);
      onChange?.({ style: newStyle, backgroundColor: bgColor });
    },
    [bgColor, onChange],
  );

  const handleBgChange = useCallback(
    (color: string) => {
      setBgColor(color);
      onChange?.({ style, backgroundColor: color });
    },
    [style, onChange],
  );

  // Sync if initialConfig changes externally
  useEffect(() => {
    if (initialConfig) {
      setStyle(initialConfig.style || "simple");
      setBgColor(initialConfig.backgroundColor || "b6e3f4");
    }
  }, [initialConfig]);

  if (botWhispererTier < 1) {
    return (
      <Box sx={{ textAlign: "center", py: 2, opacity: 0.6 }}>
        <LockIcon sx={{ fontSize: 32, mb: 1, color: "text.disabled" }} />
        <Typography variant="body2" color="text.secondary">
          {t("lockedMessage")}
        </Typography>
      </Box>
    );
  }

  const badgeLabel =
    botWhispererTier <= 1 ? t("badgeNames.tier1") : t("badgeNames.tier2");

  return (
    <Box>
      {/* Preview */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <BotAvatar size={64} style={style} overrides={overrides} />
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {t("previewTitle")}
          </Typography>
          <Chip
            label={badgeLabel}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Style selector */}
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {t("styleLabel")}
      </Typography>
      <ToggleButtonGroup
        value={style}
        exclusive
        onChange={handleStyleChange}
        size="small"
        sx={{ mb: 2 }}
      >
        {styleOptions.map((opt) => (
          <ToggleButton
            key={opt.value}
            value={opt.value}
            disabled={botWhispererTier < opt.minTier}
          >
            {botWhispererTier < opt.minTier && (
              <LockIcon sx={{ fontSize: 14, mr: 0.5 }} />
            )}
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Background color */}
      {botWhispererTier >= 1 && (
        <>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            {t("backgroundColorLabel")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {BG_COLORS.map((colorValue, index) => (
              <Box
                key={colorValue}
                onClick={() => handleBgChange(colorValue)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: `#${colorValue}`,
                  cursor: "pointer",
                  border:
                    bgColor === colorValue
                      ? "3px solid"
                      : "2px solid transparent",
                  borderColor:
                    bgColor === colorValue ? "primary.main" : "transparent",
                  transition: "border-color 0.2s",
                  "&:hover": { transform: "scale(1.1)" },
                }}
                title={colorLabels[index]}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

export default BotCustomizer;
