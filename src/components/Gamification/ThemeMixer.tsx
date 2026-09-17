/**
 * ThemeMixer — Color picker UI for creating custom themes.
 *
 * Users can adjust primary, secondary, background, and accent colors.
 * Generates both light and dark palette variants from chosen colors.
 *
 * @module ThemeMixer
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Tooltip from "@mui/material/Tooltip";
import { useThemeDrafts } from "../../themes/themeDrafts";
import type { UseThemeDraftsResult } from "../../themes/themeDrafts";

// ============================================================================
// Types
// ============================================================================

/** The user-editable fields stored in Settings.customThemePalette */
export interface CustomThemePaletteInput {
  primaryMain: string;
  secondaryMain: string;
  backgroundDefault: string;
  backgroundPaper: string;
  accentColor: string;
  // Optional full-palette overrides. When omitted, each value is auto-derived
  // from the core colors above (see resolveCustomPalette).
  errorMain?: string;
  warningMain?: string;
  infoMain?: string;
  successMain?: string;
  textPrimary?: string;
  textSecondary?: string;
  chatBubbleUser?: string;
  chatBubbleAssistant?: string;
  editorBackground?: string;
  codeBlock?: string;
  searchHighlight?: string;
  subtleBorder?: string;
  // Backgrounds & gradients (auto-derived from the core colors when omitted).
  glassNavbarColor?: string;
  heroGradientStart?: string;
  heroGradientEnd?: string;
}

/** MUI's default status colors — used as fallbacks when not overridden. */
const STATUS_DEFAULTS = {
  errorMain: "#d32f2f",
  warningMain: "#ed6c02",
  infoMain: "#0288d1",
  successMain: "#2e7d32",
} as const;

/** Default starting palette (the "default" theme colors) */
const DEFAULT_CUSTOM_PALETTE: CustomThemePaletteInput = {
  primaryMain: "#556cd6",
  secondaryMain: "#19857b",
  backgroundDefault: "#fafafa",
  backgroundPaper: "#ffffff",
  accentColor: "#ffeb3b",
};

/** A named starting palette the user can load as a base for mixing */
export interface SourceTheme {
  id: string;
  name: string;
  palette: CustomThemePaletteInput;
}

/**
 * Built-in source themes users can start from before mixing their own.
 * Mirrors the preset editor themes offered elsewhere in the app.
 */
export const DEFAULT_SOURCE_THEMES: SourceTheme[] = [
  {
    id: "default",
    name: "Default",
    palette: DEFAULT_CUSTOM_PALETTE,
  },
  {
    id: "midnight",
    name: "Midnight",
    palette: {
      primaryMain: "#00bcd4",
      secondaryMain: "#7c4dff",
      backgroundDefault: "#1a1a2e",
      backgroundPaper: "#232347",
      accentColor: "#ff4081",
    },
  },
  {
    id: "forest",
    name: "Forest",
    palette: {
      primaryMain: "#66bb6a",
      secondaryMain: "#26a69a",
      backgroundDefault: "#1b2d1b",
      backgroundPaper: "#243824",
      accentColor: "#cddc39",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    palette: {
      primaryMain: "#ff7043",
      secondaryMain: "#ec407a",
      backgroundDefault: "#2d1b1b",
      backgroundPaper: "#3a2424",
      accentColor: "#ffca28",
    },
  },
  {
    id: "aurora",
    name: "Aurora",
    palette: {
      primaryMain: "#ab47bc",
      secondaryMain: "#26c6da",
      backgroundDefault: "#0d1b2a",
      backgroundPaper: "#152536",
      accentColor: "#69f0ae",
    },
  },
  {
    id: "highContrast",
    name: "High Contrast",
    palette: {
      primaryMain: "#ffff00",
      secondaryMain: "#00ffff",
      backgroundDefault: "#000000",
      backgroundPaper: "#0a0a0a",
      accentColor: "#ff00ff",
    },
  },
];

// ============================================================================
// Helpers — auto-derive dark mode + custom tokens from user's picks
// ============================================================================

/** Darken a hex color by a factor (0–1) */
function darken(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.round(r * (1 - factor));
  const dg = Math.round(g * (1 - factor));
  const db = Math.round(b * (1 - factor));
  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`;
}

/** Lighten a hex color by a factor (0–1) */
function lighten(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

/** Add alpha to a hex color */
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ============================================================================
// HSL ↔ Hex conversions for color wheel
// ============================================================================

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ============================================================================
// Color Harmony Generators
// ============================================================================

type HarmonyType =
  "mono" | "analogous" | "split" | "complementary" | "triadic" | "square";

const HARMONY_LABELS: Record<HarmonyType, string> = {
  mono: "Mono",
  analogous: "Analogous",
  split: "Split",
  complementary: "Compl.",
  triadic: "Triadic",
  square: "Square",
};

/**
 * Given a base hue, generate 5 hues for the palette colors using the specified harmony.
 * Returns [primary, secondary, background, paper, accent] hues and adjusted S/L values.
 */
function generateHarmonyPalette(
  baseHue: number,
  harmony: HarmonyType,
): CustomThemePaletteInput {
  const hues: number[] = [];
  switch (harmony) {
    case "mono":
      hues.push(baseHue, baseHue, baseHue, baseHue, baseHue);
      break;
    case "analogous":
      hues.push(baseHue, baseHue + 30, baseHue, baseHue, baseHue - 30);
      break;
    case "split":
      hues.push(baseHue, baseHue + 150, baseHue, baseHue, baseHue - 150);
      break;
    case "complementary":
      hues.push(baseHue, baseHue + 180, baseHue, baseHue, baseHue + 180);
      break;
    case "triadic":
      hues.push(baseHue, baseHue + 120, baseHue, baseHue, baseHue + 240);
      break;
    case "square":
      hues.push(baseHue, baseHue + 90, baseHue, baseHue, baseHue + 270);
      break;
  }
  return {
    primaryMain: hslToHex(hues[0], 0.65, 0.45),
    secondaryMain: hslToHex(hues[1], 0.55, 0.4),
    backgroundDefault: hslToHex(hues[2], 0.05, 0.97),
    backgroundPaper: "#ffffff",
    accentColor: hslToHex(hues[4], 0.7, 0.55),
  };
}

/**
 * Resolve every palette field to a concrete hex value — using the user's
 * explicit override when present, otherwise deriving it from the core colors.
 * Exported so the mixer UI can show the effective value for each swatch.
 */
export function resolveCustomPalette(input: CustomThemePaletteInput) {
  return {
    primaryMain: input.primaryMain,
    secondaryMain: input.secondaryMain,
    backgroundDefault: input.backgroundDefault,
    backgroundPaper: input.backgroundPaper,
    accentColor: input.accentColor,
    errorMain: input.errorMain ?? STATUS_DEFAULTS.errorMain,
    warningMain: input.warningMain ?? STATUS_DEFAULTS.warningMain,
    infoMain: input.infoMain ?? STATUS_DEFAULTS.infoMain,
    successMain: input.successMain ?? STATUS_DEFAULTS.successMain,
    textPrimary: input.textPrimary ?? "#1a1a1a",
    textSecondary: input.textSecondary ?? "#666666",
    chatBubbleUser: input.chatBubbleUser ?? lighten(input.primaryMain, 0.85),
    chatBubbleAssistant:
      input.chatBubbleAssistant ?? lighten(input.secondaryMain, 0.9),
    editorBackground: input.editorBackground ?? input.backgroundPaper,
    codeBlock: input.codeBlock ?? lighten(input.backgroundDefault, 0.3),
    searchHighlight: input.searchHighlight ?? input.accentColor,
    subtleBorder: input.subtleBorder ?? darken(input.backgroundDefault, 0.15),
    glassNavbarColor: input.glassNavbarColor ?? input.backgroundDefault,
    heroGradientStart: input.heroGradientStart ?? input.primaryMain,
    heroGradientEnd: input.heroGradientEnd ?? darken(input.primaryMain, 0.3),
  };
}

/**
 * Build a full ThemePalette (light+dark) from the user's simple color picks.
 * This is exported so DynamicThemeProvider can call it directly.
 */
export function buildFullPaletteFromCustom(input: CustomThemePaletteInput) {
  const r = resolveCustomPalette(input);
  return {
    light: {
      primary: { main: r.primaryMain },
      secondary: { main: r.secondaryMain },
      error: { main: r.errorMain },
      warning: { main: r.warningMain },
      info: { main: r.infoMain },
      success: { main: r.successMain },
      background: {
        default: r.backgroundDefault,
        paper: r.backgroundPaper,
      },
      text: { primary: r.textPrimary, secondary: r.textSecondary },
      custom: {
        chatBubbleUser: r.chatBubbleUser,
        chatBubbleAssistant: r.chatBubbleAssistant,
        glassNavbar: withAlpha(r.glassNavbarColor, 0.85),
        editorBackground: r.editorBackground,
        codeBlock: r.codeBlock,
        searchHighlight: r.searchHighlight,
        subtleBorder: r.subtleBorder,
        heroCardGradient: `linear-gradient(135deg, ${r.heroGradientStart} 0%, ${r.heroGradientEnd} 100%)`,
      },
    },
    dark: {
      primary: { main: lighten(r.primaryMain, 0.2) },
      secondary: { main: lighten(r.secondaryMain, 0.2) },
      error: { main: lighten(r.errorMain, 0.2) },
      warning: { main: lighten(r.warningMain, 0.2) },
      info: { main: lighten(r.infoMain, 0.2) },
      success: { main: lighten(r.successMain, 0.2) },
      background: {
        default: darken(r.backgroundDefault, 0.85),
        paper: darken(r.backgroundPaper, 0.8),
      },
      text: { primary: "#e0e0e0", secondary: "#a0a0a0" },
      custom: {
        chatBubbleUser: darken(r.chatBubbleUser, 0.7),
        chatBubbleAssistant: darken(r.chatBubbleAssistant, 0.75),
        glassNavbar: withAlpha(darken(r.glassNavbarColor, 0.85), 0.85),
        editorBackground: darken(r.editorBackground, 0.8),
        codeBlock: darken(r.codeBlock, 0.6),
        searchHighlight: darken(r.searchHighlight, 0.5),
        subtleBorder: darken(r.subtleBorder, 0.45),
        heroCardGradient: `linear-gradient(135deg, ${darken(r.heroGradientStart, 0.6)} 0%, ${darken(r.heroGradientEnd, 0.5)} 100%)`,
      },
    },
  };
}

// ============================================================================
// Drafts bar — switch / create / duplicate / rename / delete draft themes
// ============================================================================

function DraftsBar({ drafts }: { drafts: UseThemeDraftsResult }) {
  const { drafts: list, activeId, activeDraft } = drafts;
  if (!activeDraft) return null;
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      sx={{ mb: 2 }}
    >
      <TextField
        select
        size="small"
        label="Draft"
        value={activeId ?? ""}
        onChange={(e) => drafts.selectDraft(e.target.value)}
        sx={{ minWidth: 140 }}
      >
        {list.map((d) => (
          <MenuItem key={d.id} value={d.id}>
            {d.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        size="small"
        label="Name"
        value={activeDraft.name}
        onChange={(e) => drafts.renameDraft(activeDraft.id, e.target.value)}
        sx={{ width: 150 }}
      />
      <Tooltip title="New draft">
        <IconButton
          size="small"
          onClick={() => drafts.createDraft(DEFAULT_CUSTOM_PALETTE)}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Duplicate draft">
        <IconButton
          size="small"
          onClick={() => drafts.duplicateDraft(activeDraft.id)}
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete draft">
        <span>
          <IconButton
            size="small"
            disabled={list.length <= 1}
            onClick={() => drafts.deleteDraft(activeDraft.id)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

// ============================================================================
// Component
// ============================================================================

export interface ThemeMixerProps {
  /** Current saved custom palette (from settings) */
  value?: CustomThemePaletteInput | null;
  /** Called when user saves their custom palette */
  onSave: (palette: CustomThemePaletteInput) => void;
  /**
   * Enable multi-draft mode: the working palette is backed by the shared
   * localStorage drafts store, so several themes can be edited and every
   * mounted mixer stays in sync.
   */
  enableDrafts?: boolean;
  /**
   * Named source themes the user can load as a starting point before mixing.
   * Defaults to {@link DEFAULT_SOURCE_THEMES}.
   */
  sourceThemes?: SourceTheme[];
}

export function ThemeMixer({
  value,
  onSave,
  enableDrafts = false,
  sourceThemes = DEFAULT_SOURCE_THEMES,
}: ThemeMixerProps) {
  const drafts = useThemeDrafts();
  const [localPalette, setLocalPalette] = useState<CustomThemePaletteInput>(
    () => value || DEFAULT_CUSTOM_PALETTE,
  );

  // Seed a first draft once the store has hydrated (drafts mode only).
  const didInitDrafts = useRef(false);
  useEffect(() => {
    if (!enableDrafts || !drafts.hydrated || didInitDrafts.current) return;
    didInitDrafts.current = true;
    drafts.ensureAtLeastOneDraft(value || DEFAULT_CUSTOM_PALETTE, "My Theme");
  }, [enableDrafts, drafts, value]);

  // In drafts mode the active draft is the single source of truth.
  const palette: CustomThemePaletteInput = enableDrafts
    ? (drafts.activeDraft?.input ?? value ?? DEFAULT_CUSTOM_PALETTE)
    : localPalette;

  const applyPalette = useCallback(
    (next: CustomThemePaletteInput) => {
      if (enableDrafts) drafts.updateActiveInput(next);
      else setLocalPalette(next);
    },
    [enableDrafts, drafts],
  );

  const handleChange = useCallback(
    (field: keyof CustomThemePaletteInput, newValue: string) => {
      applyPalette({ ...palette, [field]: newValue });
    },
    [applyPalette, palette],
  );

  const handleReset = useCallback(() => {
    applyPalette(DEFAULT_CUSTOM_PALETTE);
  }, [applyPalette]);

  const handleSourceTheme = useCallback(
    (id: string) => {
      const source = sourceThemes.find((t) => t.id === id);
      if (source) applyPalette(source.palette);
    },
    [applyPalette, sourceThemes],
  );

  const handleSave = useCallback(() => {
    onSave(palette);
  }, [palette, onSave]);

  const handleHarmony = useCallback(
    (harmony: HarmonyType) => {
      const [baseHue] = hexToHsl(palette.primaryMain);
      applyPalette(generateHarmonyPalette(baseHue, harmony));
    },
    [applyPalette, palette.primaryMain],
  );

  const handleWheelChange = useCallback(
    (field: keyof CustomThemePaletteInput, hex: string) => {
      applyPalette({ ...palette, [field]: hex });
    },
    [applyPalette, palette],
  );

  // Preview the derived palette
  const preview = useMemo(() => buildFullPaletteFromCustom(palette), [palette]);

  // Effective (override-or-derived) value for every editable swatch.
  const resolved = useMemo(() => resolveCustomPalette(palette), [palette]);

  // Which source preset (if any) exactly matches the current palette.
  const activeSourceId = useMemo(() => {
    const match = sourceThemes.find(
      (t) =>
        t.palette.primaryMain === palette.primaryMain &&
        t.palette.secondaryMain === palette.secondaryMain &&
        t.palette.backgroundDefault === palette.backgroundDefault &&
        t.palette.backgroundPaper === palette.backgroundPaper &&
        t.palette.accentColor === palette.accentColor,
    );
    return match?.id ?? "";
  }, [sourceThemes, palette]);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Mix Your Own Theme
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Pick your colors below. A dark mode variant is automatically generated.
      </Typography>

      {enableDrafts && <DraftsBar drafts={drafts} />}

      <Stack spacing={2}>
        {/* Source theme — load a preset palette as a starting point */}
        <TextField
          select
          size="small"
          label="Source theme"
          value={activeSourceId}
          onChange={(e) => handleSourceTheme(e.target.value)}
          helperText="Start from a preset, then customize below"
          sx={{ maxWidth: 240 }}
        >
          {activeSourceId === "" && (
            <MenuItem value="" disabled>
              Custom
            </MenuItem>
          )}
          {sourceThemes.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Color Wheel */}
        <ColorWheel palette={palette} onChange={handleWheelChange} />

        {/* Harmony presets */}
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 0.5, display: "block" }}
          >
            Color Harmonies
          </Typography>
          <ButtonGroup size="small" variant="outlined">
            {(Object.keys(HARMONY_LABELS) as HarmonyType[]).map((h) => (
              <Button key={h} onClick={() => handleHarmony(h)}>
                {HARMONY_LABELS[h]}
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        <Divider />

        {/* Color inputs */}
        <Stack direction="row" flexWrap="wrap" gap={2}>
          <ColorInput
            label="Primary"
            value={palette.primaryMain}
            onChange={(v) => handleChange("primaryMain", v)}
          />
          <ColorInput
            label="Secondary"
            value={palette.secondaryMain}
            onChange={(v) => handleChange("secondaryMain", v)}
          />
          <ColorInput
            label="Background"
            value={palette.backgroundDefault}
            onChange={(v) => handleChange("backgroundDefault", v)}
          />
          <ColorInput
            label="Paper"
            value={palette.backgroundPaper}
            onChange={(v) => handleChange("backgroundPaper", v)}
          />
          <ColorInput
            label="Accent"
            value={palette.accentColor}
            onChange={(v) => handleChange("accentColor", v)}
          />
        </Stack>

        <Divider />

        {/* Status colors */}
        <Typography variant="caption" color="text.secondary">
          Status colors
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={2}>
          <ColorInput
            label="Error"
            value={resolved.errorMain}
            onChange={(v) => handleChange("errorMain", v)}
          />
          <ColorInput
            label="Warning"
            value={resolved.warningMain}
            onChange={(v) => handleChange("warningMain", v)}
          />
          <ColorInput
            label="Info"
            value={resolved.infoMain}
            onChange={(v) => handleChange("infoMain", v)}
          />
          <ColorInput
            label="Success"
            value={resolved.successMain}
            onChange={(v) => handleChange("successMain", v)}
          />
        </Stack>

        <Divider />

        {/* Text colors */}
        <Typography variant="caption" color="text.secondary">
          Text colors
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={2}>
          <ColorInput
            label="Text primary"
            value={resolved.textPrimary}
            onChange={(v) => handleChange("textPrimary", v)}
          />
          <ColorInput
            label="Text secondary"
            value={resolved.textSecondary}
            onChange={(v) => handleChange("textSecondary", v)}
          />
        </Stack>

        <Divider />

        {/* Surface & accent tokens */}
        <Typography variant="caption" color="text.secondary">
          Surface &amp; accent tokens
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={2}>
          <ColorInput
            label="Chat bubble (you)"
            value={resolved.chatBubbleUser}
            onChange={(v) => handleChange("chatBubbleUser", v)}
          />
          <ColorInput
            label="Chat bubble (AI)"
            value={resolved.chatBubbleAssistant}
            onChange={(v) => handleChange("chatBubbleAssistant", v)}
          />
          <ColorInput
            label="Editor background"
            value={resolved.editorBackground}
            onChange={(v) => handleChange("editorBackground", v)}
          />
          <ColorInput
            label="Code block"
            value={resolved.codeBlock}
            onChange={(v) => handleChange("codeBlock", v)}
          />
          <ColorInput
            label="Search highlight"
            value={resolved.searchHighlight}
            onChange={(v) => handleChange("searchHighlight", v)}
          />
          <ColorInput
            label="Subtle border"
            value={resolved.subtleBorder}
            onChange={(v) => handleChange("subtleBorder", v)}
          />
        </Stack>

        <Divider />

        {/* Backgrounds & gradients */}
        <Typography variant="caption" color="text.secondary">
          Backgrounds &amp; gradients
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
          <ColorInput
            label="Navbar (glass)"
            value={resolved.glassNavbarColor}
            onChange={(v) => handleChange("glassNavbarColor", v)}
          />
          <ColorInput
            label="Gradient start"
            value={resolved.heroGradientStart}
            onChange={(v) => handleChange("heroGradientStart", v)}
          />
          <ColorInput
            label="Gradient end"
            value={resolved.heroGradientEnd}
            onChange={(v) => handleChange("heroGradientEnd", v)}
          />
          {/* Live gradient swatch */}
          <Box
            sx={{
              width: 96,
              height: 32,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              background: `linear-gradient(135deg, ${resolved.heroGradientStart} 0%, ${resolved.heroGradientEnd} 100%)`,
            }}
          />
        </Stack>

        <Divider />

        {/* Live Preview */}
        <Typography variant="caption" color="text.secondary">
          Preview
        </Typography>
        <Stack direction="row" gap={1.5}>
          {/* Light preview */}
          <Card variant="outlined" sx={{ width: 140, overflow: "hidden" }}>
            <Box
              sx={{
                height: 24,
                bgcolor: preview.light.primary.main,
                display: "flex",
                alignItems: "center",
                px: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#fff", fontSize: "0.65rem" }}
              >
                Light
              </Typography>
            </Box>
            <Box sx={{ p: 1, bgcolor: preview.light.background.default }}>
              <Box
                sx={{
                  height: 8,
                  bgcolor: preview.light.secondary.main,
                  borderRadius: 1,
                  mb: 0.5,
                }}
              />
              <Box
                sx={{
                  height: 4,
                  bgcolor: preview.light.custom.subtleBorder,
                  borderRadius: 1,
                  mb: 0.5,
                }}
              />
              <Box
                sx={{
                  height: 12,
                  bgcolor: preview.light.background.paper,
                  borderRadius: 0.5,
                  border: `1px solid ${preview.light.custom.subtleBorder}`,
                }}
              />
            </Box>
          </Card>
          {/* Dark preview */}
          <Card variant="outlined" sx={{ width: 140, overflow: "hidden" }}>
            <Box
              sx={{
                height: 24,
                bgcolor: preview.dark.primary.main,
                display: "flex",
                alignItems: "center",
                px: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#fff", fontSize: "0.65rem" }}
              >
                Dark
              </Typography>
            </Box>
            <Box sx={{ p: 1, bgcolor: preview.dark.background.default }}>
              <Box
                sx={{
                  height: 8,
                  bgcolor: preview.dark.secondary.main,
                  borderRadius: 1,
                  mb: 0.5,
                }}
              />
              <Box
                sx={{
                  height: 4,
                  bgcolor: preview.dark.custom.subtleBorder,
                  borderRadius: 1,
                  mb: 0.5,
                }}
              />
              <Box
                sx={{
                  height: 12,
                  bgcolor: preview.dark.background.paper,
                  borderRadius: 0.5,
                  border: `1px solid ${preview.dark.custom.subtleBorder}`,
                }}
              />
            </Box>
          </Card>
        </Stack>

        {/* Actions */}
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Custom Theme
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestoreIcon />}
            onClick={handleReset}
          >
            Reset
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

// ============================================================================
// Color Wheel — interactive HSL wheel with draggable sample points
// ============================================================================

const WHEEL_SIZE = 220;
const WHEEL_RADIUS = WHEEL_SIZE / 2;
const POINT_RADIUS = 10;

const POINT_FIELDS: { field: keyof CustomThemePaletteInput; label: string }[] =
  [
    { field: "primaryMain", label: "P" },
    { field: "secondaryMain", label: "S" },
    { field: "backgroundDefault", label: "B" },
    { field: "backgroundPaper", label: "W" },
    { field: "accentColor", label: "A" },
  ];

interface ColorWheelProps {
  palette: CustomThemePaletteInput;
  onChange: (field: keyof CustomThemePaletteInput, hex: string) => void;
}

function ColorWheel({ palette, onChange }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<keyof CustomThemePaletteInput | null>(null);

  // Draw the color wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = WHEEL_RADIUS;
    const cy = WHEEL_RADIUS;

    // Clear
    ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

    // Draw HSL wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * (Math.PI / 180);
      const endAngle = (angle + 1) * (Math.PI / 180);

      // Gradient from center (white) to edge (full saturation)
      const gradient = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        WHEEL_RADIUS,
      );
      gradient.addColorStop(0, `hsl(${angle}, 0%, 100%)`);
      gradient.addColorStop(0.5, `hsl(${angle}, 50%, 70%)`);
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, WHEEL_RADIUS - 2, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Darken edges with a subtle vignette
    const vignette = ctx.createRadialGradient(
      cx,
      cy,
      WHEEL_RADIUS * 0.7,
      cx,
      cy,
      WHEEL_RADIUS,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
  }, []);

  // Convert a hex color to wheel position (x, y)
  const hexToPosition = useCallback((hex: string): { x: number; y: number } => {
    const [h, s, l] = hexToHsl(hex);
    // Map saturation to distance from center, hue to angle
    const dist = s * (WHEEL_RADIUS - POINT_RADIUS - 4);
    const angleRad = (h - 90) * (Math.PI / 180); // -90 so 0° is top
    return {
      x: WHEEL_RADIUS + dist * Math.cos(angleRad),
      y: WHEEL_RADIUS + dist * Math.sin(angleRad),
    };
  }, []);

  // Convert wheel position to hex color
  const positionToHex = useCallback(
    (x: number, y: number, currentHex: string): string => {
      const dx = x - WHEEL_RADIUS;
      const dy = y - WHEEL_RADIUS;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), WHEEL_RADIUS - 4);
      const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
      const saturation = dist / (WHEEL_RADIUS - 4);
      // Preserve the lightness from the current color
      const [, , l] = hexToHsl(currentHex);
      return hslToHex(angle, saturation, l);
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find which point was clicked
      for (const { field } of POINT_FIELDS) {
        const pos = hexToPosition(palette[field] ?? "#000000");
        const dx = x - pos.x;
        const dy = y - pos.y;
        if (dx * dx + dy * dy <= (POINT_RADIUS + 4) * (POINT_RADIUS + 4)) {
          draggingRef.current = field;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          return;
        }
      }
    },
    [palette, hexToPosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(WHEEL_SIZE, e.clientX - rect.left));
      const y = Math.max(0, Math.min(WHEEL_SIZE, e.clientY - rect.top));
      const field = draggingRef.current;
      const hex = positionToHex(x, y, palette[field] ?? "#000000");
      onChange(field, hex);
    },
    [palette, onChange, positionToHex],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        alignSelf: "center",
        cursor: "crosshair",
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        width={WHEEL_SIZE}
        height={WHEEL_SIZE}
        style={{ borderRadius: "50%", display: "block" }}
      />
      {/* Draggable color points */}
      {POINT_FIELDS.map(({ field, label }) => {
        const pos = hexToPosition(palette[field] ?? "#000000");
        return (
          <Box
            key={field}
            sx={{
              position: "absolute",
              left: pos.x - POINT_RADIUS,
              top: pos.y - POINT_RADIUS,
              width: POINT_RADIUS * 2,
              height: POINT_RADIUS * 2,
              borderRadius: "50%",
              bgcolor: palette[field],
              border: "2px solid #fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.55rem",
                fontWeight: 700,
                color: "#fff",
                textShadow: "0 0 2px rgba(0,0,0,0.7)",
                lineHeight: 1,
              }}
            >
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ============================================================================
// Color Input — native color picker + hex text field
// ============================================================================

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Tooltip title={label}>
        <Box
          component="input"
          type="color"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          sx={{
            width: 32,
            height: 32,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            cursor: "pointer",
            p: 0,
            "&::-webkit-color-swatch-wrapper": { padding: 0 },
            "&::-webkit-color-swatch": { border: "none", borderRadius: 4 },
          }}
        />
      </Tooltip>
      <TextField
        size="small"
        label={label}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
        }}
        sx={{ width: 110 }}
        inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8rem" } }}
      />
    </Box>
  );
}

export default ThemeMixer;
