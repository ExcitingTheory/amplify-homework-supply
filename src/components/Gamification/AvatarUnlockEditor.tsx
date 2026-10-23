/**
 * AvatarUnlockEditor — Instructor UI for configuring which DiceBear avatar
 * styles unlock at which student levels.
 *
 * Shows a preview of each style with a level number input. Instructors can
 * add/remove styles and reorder the unlock schedule.
 *
 * @module AvatarUnlockEditor
 */

import React, { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

import { DiceBearAvatar } from "./DiceBearAvatar";
import { ALL_AVATAR_STYLES, STYLE_CONFIG } from "./DiceBearAvatar";
import type {
  AvatarStyleTier,
  AvatarUnlockConfig,
  AvatarUnlockEntry,
  FeatureUnlockLevels,
} from "./DiceBearAvatar";

// ============================================================================
// Types
// ============================================================================

export interface AvatarUnlockEditorProps {
  /** Current config (from section's xpConfig.avatarUnlocks) */
  config?: AvatarUnlockConfig | null;
  /** Called when instructor saves changes */
  onSave: (config: AvatarUnlockConfig) => void;
  /** Optional section name for display */
  sectionName?: string;
}

// ============================================================================
// Defaults
// ============================================================================

const PREVIEW_AVATAR_SEED = "preview-student";

const DEFAULT_UNLOCKS: AvatarUnlockEntry[] = [
  { minLevel: 1, tier: "simple" },
  { minLevel: 2, tier: "detailed" },
  { minLevel: 3, tier: "toonhead" },
];

// ============================================================================
// Component
// ============================================================================

export function AvatarUnlockEditor({
  config,
  onSave,
  sectionName,
}: AvatarUnlockEditorProps) {
  const t = useTranslations("components");
  const [unlocks, setUnlocks] = useState<AvatarUnlockEntry[]>(() =>
    config?.unlocks?.length
      ? [...config.unlocks].sort((a, b) => a.minLevel - b.minLevel)
      : DEFAULT_UNLOCKS,
  );
  const [glowOnLevelUp, setGlowOnLevelUp] = useState(
    config?.glowOnLevelUp ?? true,
  );
  const [featureUnlockLevels, setFeatureUnlockLevels] =
    useState<FeatureUnlockLevels>(
      () =>
        config?.featureUnlockLevels ?? { hairAndClothing: 2, accessories: 3 },
    );
  const [dirty, setDirty] = useState(false);

  // First style start level — only this is manually editable
  const [startLevel, setStartLevel] = useState<number>(() =>
    unlocks.length > 0 ? unlocks[0].minLevel : 1,
  );

  const usedStyles = new Set(unlocks.map((u) => u.tier));
  const availableStyles = ALL_AVATAR_STYLES.filter((s) => !usedStyles.has(s));

  // Compute cascaded levels: each style starts after the previous style's accessories unlock
  const hairOffset = featureUnlockLevels.hairAndClothing ?? 2;
  const accOffset = featureUnlockLevels.accessories ?? 3;
  const computedUnlocks = useMemo(() => {
    const entries: AvatarUnlockEntry[] = [];
    for (let index = 0; index < unlocks.length; index++) {
      if (index === 0) {
        entries.push({ ...unlocks[index], minLevel: startLevel });
      } else {
        entries.push({
          ...unlocks[index],
          minLevel: entries[index - 1].minLevel + accOffset + 1,
        });
      }
    }
    return entries;
  }, [unlocks, startLevel, accOffset]);

  const handleStyleChange = useCallback(
    (index: number, tier: AvatarStyleTier) => {
      setUnlocks((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], tier };
        return next;
      });
      setDirty(true);
    },
    [],
  );

  const handleAdd = useCallback(() => {
    if (availableStyles.length === 0) return;
    setUnlocks((prev) => [...prev, { minLevel: 0, tier: availableStyles[0] }]);
    setDirty(true);
  }, [availableStyles]);

  const handleRemove = useCallback((index: number) => {
    setUnlocks((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }, []);

  const handleReset = useCallback(() => {
    setUnlocks(DEFAULT_UNLOCKS);
    setStartLevel(1);
    setGlowOnLevelUp(true);
    setFeatureUnlockLevels({ hairAndClothing: 2, accessories: 3 });
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    // Save with computed levels
    onSave({ unlocks: computedUnlocks, glowOnLevelUp, featureUnlockLevels });
    setDirty(false);
  }, [computedUnlocks, glowOnLevelUp, featureUnlockLevels, onSave]);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {t("avatarUnlockEditor.title")}
        {sectionName && (
          <Chip
            label={sectionName}
            size="small"
            sx={{ ml: 1 }}
            variant="outlined"
          />
        )}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("avatarUnlockEditor.description")}
      </Typography>

      {/* Starting level input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label={t("avatarUnlockEditor.startingLevel")}
          type="number"
          size="small"
          value={startLevel}
          onChange={(e) => {
            setStartLevel(Math.max(1, parseInt(e.target.value, 10) || 1));
            setDirty(true);
          }}
          inputProps={{ min: 1, max: 20 }}
          helperText={t("avatarUnlockEditor.startingLevelHelper")}
          sx={{ width: 140 }}
        />
      </Box>

      <Stack spacing={1}>
        {computedUnlocks.flatMap((entry, index) => {
          const styleStart = entry.minLevel;
          const hairLevel = styleStart + hairOffset;
          const accLevel = styleStart + accOffset;
          const styleName = STYLE_CONFIG[entry.tier]?.displayName ?? entry.tier;

          return [
            // Colors & Face card
            <Paper
              key={`${entry.tier}-${index}-colors`}
              variant="outlined"
              sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 2 }}
            >
              <DiceBearAvatar
                seed={PREVIEW_AVATAR_SEED}
                size={40}
                style={entry.tier}
              />
              <Chip
                size="small"
                label={t("avatarUnlockEditor.levelChip", { level: styleStart })}
                variant="status"
                color="success"
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {t("avatarUnlockEditor.colorsAndFace", { styleName })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("avatarUnlockEditor.colorsAndFaceDetail")}
                </Typography>
              </Box>
              {/* Style selector on first phase only */}
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>{t("avatarUnlockEditor.styleLabel")}</InputLabel>
                <Select
                  value={entry.tier}
                  label={t("avatarUnlockEditor.styleLabel")}
                  onChange={(e) =>
                    handleStyleChange(index, e.target.value as AvatarStyleTier)
                  }
                >
                  <MenuItem value={entry.tier}>{styleName}</MenuItem>
                  {availableStyles.map((s) => (
                    <MenuItem key={s} value={s}>
                      {STYLE_CONFIG[s]?.displayName ?? s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title={t("avatarUnlockEditor.removeStyle")}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(index)}
                    disabled={unlocks.length <= 1}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Paper>,

            // Hair & Clothing card
            <Paper
              key={`${entry.tier}-${index}-hair`}
              variant="outlined"
              sx={{
                p: 1.5,
                pl: 4,
                display: "flex",
                alignItems: "center",
                gap: 2,
                borderLeft: "3px solid",
                borderLeftColor: "primary.main",
              }}
            >
              <Chip
                size="small"
                label={t("avatarUnlockEditor.levelChip", { level: hairLevel })}
                variant="status"
                color="primary"
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {t("avatarUnlockEditor.hairAndClothing", { styleName })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("avatarUnlockEditor.hairAndClothingDetail")}
                </Typography>
              </Box>
            </Paper>,

            // Accessories card
            <Paper
              key={`${entry.tier}-${index}-acc`}
              variant="outlined"
              sx={{
                p: 1.5,
                pl: 4,
                display: "flex",
                alignItems: "center",
                gap: 2,
                borderLeft: "3px solid",
                borderLeftColor: "secondary.main",
                mb: index < computedUnlocks.length - 1 ? 2 : 0,
              }}
            >
              <Chip
                size="small"
                label={t("avatarUnlockEditor.levelChip", { level: accLevel })}
                variant="status"
                color="secondary"
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {t("avatarUnlockEditor.accessories", { styleName })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("avatarUnlockEditor.accessoriesDetail")}
                </Typography>
              </Box>
            </Paper>,
          ];
        })}
      </Stack>

      {/* Add new unlock */}
      {availableStyles.length > 0 && (
        <Button
          startIcon={<AddIcon />}
          onClick={handleAdd}
          size="small"
          sx={{ mt: 1.5 }}
        >
          {t("avatarUnlockEditor.addStyle", { count: availableStyles.length })}
        </Button>
      )}

      {/* Glow ring toggle */}
      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={glowOnLevelUp}
              onChange={(_, checked) => {
                setGlowOnLevelUp(checked);
                setDirty(true);
              }}
            />
          }
          label={t("avatarUnlockEditor.glowOnLevelUp")}
        />
      </Box>

      {/* Feature unlock levels */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {t("avatarUnlockEditor.offsetsTitle")}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1.5 }}
        >
          {t("avatarUnlockEditor.offsetsDescription")}
        </Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            label={t("avatarUnlockEditor.hairOffsetLabel")}
            type="number"
            size="small"
            value={featureUnlockLevels.hairAndClothing ?? 2}
            onChange={(e) => {
              setFeatureUnlockLevels((prev) => ({
                ...prev,
                hairAndClothing: Math.max(1, parseInt(e.target.value, 10) || 2),
              }));
              setDirty(true);
            }}
            inputProps={{ min: 1, max: 20 }}
            helperText={t("avatarUnlockEditor.hairOffsetHelper")}
            sx={{ width: 220 }}
          />
          <TextField
            label={t("avatarUnlockEditor.accessoriesOffsetLabel")}
            type="number"
            size="small"
            value={featureUnlockLevels.accessories ?? 3}
            onChange={(e) => {
              setFeatureUnlockLevels((prev) => ({
                ...prev,
                accessories: Math.max(1, parseInt(e.target.value, 10) || 3),
              }));
              setDirty(true);
            }}
            inputProps={{ min: 1, max: 20 }}
            helperText={t("avatarUnlockEditor.accessoriesOffsetHelper")}
            sx={{ width: 220 }}
          />
        </Stack>
      </Box>

      {/* Action buttons */}
      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!dirty}
          size="small"
        >
          {t("avatarUnlockEditor.save")}
        </Button>
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={handleReset}
          size="small"
        >
          {t("avatarUnlockEditor.reset")}
        </Button>
      </Box>
    </Box>
  );
}

export default AvatarUnlockEditor;
