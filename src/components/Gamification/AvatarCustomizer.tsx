/**
 * AvatarCustomizer — Progressive customization dialog for DiceBear avatars.
 * Unlocks features based on student level:
 *   L1: Background color, skin tone, basic face (eyebrows, eyes, mouth)
 *   L2: + hair color, clothes color, hair/top, clothing
 *   L3: + facial hair, accessories, full toon head features, style selector
 *
 * Color customization is ALWAYS available from L1. Detail features unlock
 * progressively within each style.
 *
 * Options are limited to the documented DiceBear API for each style.
 *
 * @module AvatarCustomizer
 */

import React, { useState, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LockIcon from "@mui/icons-material/Lock";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import {
  DiceBearAvatar,
  getUnlockedStyleTier,
  getUnlockedStyles,
  STYLE_CONFIG,
} from "./DiceBearAvatar";
import type {
  AvatarStyleTier,
  AvatarOverrides,
  AvatarUnlockConfig,
  FeatureUnlockLevels,
} from "./DiceBearAvatar";
import { GLOW_COLOR_PRESETS, DEFAULT_GLOW_COLORS } from "./AvatarGlowRing";
import type { GlowRingConfig } from "./AvatarGlowRing";
import { useTranslations } from "next-intl";

// ============================================================================
// Types
// ============================================================================

export interface AvatarCustomizerProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Current student level */
  level: number;
  /** Avatar seed (username or studentId) */
  seed: string;
  /** Currently selected style */
  selectedStyle?: AvatarStyleTier;
  /** Current overrides (persisted in settings) */
  overrides?: AvatarOverrides;
  /** Called when overrides change — parent persists to Settings.metadata */
  onSave: (
    overrides: AvatarOverrides,
    style: AvatarStyleTier,
    glowRing?: GlowRingConfig | null,
  ) => void;
  /** Full avatar unlock config (from section xpConfig) — used for relative feature unlock calculation */
  avatarUnlockConfig?: AvatarUnlockConfig | null;
  /** Current glow ring config */
  glowRing?: GlowRingConfig | null;
  /** Robot (bottts) styles are selectable only after all Bot Whisperer badges are earned */
  robotStylesUnlocked?: boolean;
}

// ============================================================================
// Documented option constants (from DiceBear v9.x docs)
// ============================================================================

const BACKGROUND_COLORS = [
  "b6e3f4",
  "c0aede",
  "d1d4f9",
  "ffd5dc",
  "ffdfbf",
  "d1f4d1",
  "fff3b0",
  "f0f0f0",
];

// -- Avataaars Neutral (simple) --
// -- Avataaars (detailed) — same face options + clothing/hair/accessories --
const DETAILED_SKIN_COLORS = [
  "614335",
  "ae5d29",
  "d08b5b",
  "edb98a",
  "f8d25c",
  "fd9841",
  "ffdbb4",
];

const DETAILED_HAIR_COLORS = [
  "2c1b18",
  "4a312c",
  "724133",
  "a55728",
  "b58143",
  "c93305",
  "d6b370",
  "e8e1e1",
  "ecdcbf",
  "f59797",
];

const DETAILED_CLOTHES_COLORS = [
  "3c4f5c",
  "65c9ff",
  "262e33",
  "5199e4",
  "25557c",
  "929598",
  "a7ffc4",
  "b1e2ff",
  "e6e6e6",
  "ff5c5c",
  "ff488e",
  "ffafb9",
  "ffdeb5",
  "ffffb1",
  "ffffff",
];

// -- Toon Head --
const TOONHEAD_SKIN_COLORS = ["5c3829", "a36b4f", "b98e6a", "c68e7a", "f1c3a5"];

const TOONHEAD_HAIR_COLORS = ["2c1b18", "724133", "a55728", "b58143", "d6b370"];

const TOONHEAD_CLOTHES_COLORS = [
  "0b3286",
  "147f3c",
  "731ac3",
  "151613",
  "545454",
  "b11f1f",
  "e8e9e6",
  "eab308",
  "ec4899",
  "f97316",
];

// -- Bottts (robot) — unlocked only after all Bot Whisperer badges --
const ROBOT_STYLES: AvatarStyleTier[] = ["bottts", "bottts-neutral"];

/** DiceBear option chips with translated labels, keyed by option group */
function useAvatarOptions() {
  const t = useTranslations("components");
  return useMemo(
    () => ({
      neutralEyebrows: [
        {
          id: "angry",
          label: t("avatarCustomizer.options.neutralEyebrows.angry"),
        },
        {
          id: "angryNatural",
          label: t("avatarCustomizer.options.neutralEyebrows.angryNatural"),
        },
        {
          id: "default",
          label: t("avatarCustomizer.options.neutralEyebrows.default"),
        },
        {
          id: "defaultNatural",
          label: t("avatarCustomizer.options.neutralEyebrows.defaultNatural"),
        },
        {
          id: "flatNatural",
          label: t("avatarCustomizer.options.neutralEyebrows.flatNatural"),
        },
        {
          id: "frownNatural",
          label: t("avatarCustomizer.options.neutralEyebrows.frownNatural"),
        },
        {
          id: "raisedExcited",
          label: t("avatarCustomizer.options.neutralEyebrows.raisedExcited"),
        },
        {
          id: "raisedExcitedNatural",
          label: t(
            "avatarCustomizer.options.neutralEyebrows.raisedExcitedNatural",
          ),
        },
        {
          id: "sadConcerned",
          label: t("avatarCustomizer.options.neutralEyebrows.sadConcerned"),
        },
        {
          id: "sadConcernedNatural",
          label: t(
            "avatarCustomizer.options.neutralEyebrows.sadConcernedNatural",
          ),
        },
        {
          id: "unibrowNatural",
          label: t("avatarCustomizer.options.neutralEyebrows.unibrowNatural"),
        },
        {
          id: "upDown",
          label: t("avatarCustomizer.options.neutralEyebrows.upDown"),
        },
        {
          id: "upDownNatural",
          label: t("avatarCustomizer.options.neutralEyebrows.upDownNatural"),
        },
      ],
      neutralEyes: [
        {
          id: "closed",
          label: t("avatarCustomizer.options.neutralEyes.closed"),
        },
        { id: "cry", label: t("avatarCustomizer.options.neutralEyes.cry") },
        {
          id: "default",
          label: t("avatarCustomizer.options.neutralEyes.default"),
        },
        {
          id: "eyeRoll",
          label: t("avatarCustomizer.options.neutralEyes.eyeRoll"),
        },
        { id: "happy", label: t("avatarCustomizer.options.neutralEyes.happy") },
        {
          id: "hearts",
          label: t("avatarCustomizer.options.neutralEyes.hearts"),
        },
        { id: "side", label: t("avatarCustomizer.options.neutralEyes.side") },
        {
          id: "squint",
          label: t("avatarCustomizer.options.neutralEyes.squint"),
        },
        {
          id: "surprised",
          label: t("avatarCustomizer.options.neutralEyes.surprised"),
        },
        { id: "wink", label: t("avatarCustomizer.options.neutralEyes.wink") },
        {
          id: "winkWacky",
          label: t("avatarCustomizer.options.neutralEyes.winkWacky"),
        },
        {
          id: "xDizzy",
          label: t("avatarCustomizer.options.neutralEyes.xDizzy"),
        },
      ],
      neutralMouth: [
        {
          id: "concerned",
          label: t("avatarCustomizer.options.neutralMouth.concerned"),
        },
        {
          id: "default",
          label: t("avatarCustomizer.options.neutralMouth.default"),
        },
        {
          id: "disbelief",
          label: t("avatarCustomizer.options.neutralMouth.disbelief"),
        },
        {
          id: "eating",
          label: t("avatarCustomizer.options.neutralMouth.eating"),
        },
        {
          id: "grimace",
          label: t("avatarCustomizer.options.neutralMouth.grimace"),
        },
        { id: "sad", label: t("avatarCustomizer.options.neutralMouth.sad") },
        {
          id: "screamOpen",
          label: t("avatarCustomizer.options.neutralMouth.screamOpen"),
        },
        {
          id: "serious",
          label: t("avatarCustomizer.options.neutralMouth.serious"),
        },
        {
          id: "smile",
          label: t("avatarCustomizer.options.neutralMouth.smile"),
        },
        {
          id: "tongue",
          label: t("avatarCustomizer.options.neutralMouth.tongue"),
        },
        {
          id: "twinkle",
          label: t("avatarCustomizer.options.neutralMouth.twinkle"),
        },
        {
          id: "vomit",
          label: t("avatarCustomizer.options.neutralMouth.vomit"),
        },
      ],
      detailedTop: [
        {
          id: "bigHair",
          label: t("avatarCustomizer.options.detailedTop.bigHair"),
        },
        { id: "bob", label: t("avatarCustomizer.options.detailedTop.bob") },
        { id: "bun", label: t("avatarCustomizer.options.detailedTop.bun") },
        { id: "curly", label: t("avatarCustomizer.options.detailedTop.curly") },
        { id: "curvy", label: t("avatarCustomizer.options.detailedTop.curvy") },
        {
          id: "dreads",
          label: t("avatarCustomizer.options.detailedTop.dreads"),
        },
        {
          id: "dreads01",
          label: t("avatarCustomizer.options.detailedTop.dreads01"),
        },
        {
          id: "dreads02",
          label: t("avatarCustomizer.options.detailedTop.dreads02"),
        },
        { id: "frida", label: t("avatarCustomizer.options.detailedTop.frida") },
        {
          id: "frizzle",
          label: t("avatarCustomizer.options.detailedTop.frizzle"),
        },
        { id: "fro", label: t("avatarCustomizer.options.detailedTop.fro") },
        {
          id: "froBand",
          label: t("avatarCustomizer.options.detailedTop.froBand"),
        },
        { id: "hat", label: t("avatarCustomizer.options.detailedTop.hat") },
        { id: "hijab", label: t("avatarCustomizer.options.detailedTop.hijab") },
        {
          id: "longButNotTooLong",
          label: t("avatarCustomizer.options.detailedTop.longButNotTooLong"),
        },
        {
          id: "miaWallace",
          label: t("avatarCustomizer.options.detailedTop.miaWallace"),
        },
        {
          id: "shaggy",
          label: t("avatarCustomizer.options.detailedTop.shaggy"),
        },
        {
          id: "shaggyMullet",
          label: t("avatarCustomizer.options.detailedTop.shaggyMullet"),
        },
        {
          id: "shavedSides",
          label: t("avatarCustomizer.options.detailedTop.shavedSides"),
        },
        {
          id: "shortCurly",
          label: t("avatarCustomizer.options.detailedTop.shortCurly"),
        },
        {
          id: "shortFlat",
          label: t("avatarCustomizer.options.detailedTop.shortFlat"),
        },
        {
          id: "shortRound",
          label: t("avatarCustomizer.options.detailedTop.shortRound"),
        },
        {
          id: "shortWaved",
          label: t("avatarCustomizer.options.detailedTop.shortWaved"),
        },
        { id: "sides", label: t("avatarCustomizer.options.detailedTop.sides") },
        {
          id: "straight01",
          label: t("avatarCustomizer.options.detailedTop.straight01"),
        },
        {
          id: "straight02",
          label: t("avatarCustomizer.options.detailedTop.straight02"),
        },
        {
          id: "straightAndStrand",
          label: t("avatarCustomizer.options.detailedTop.straightAndStrand"),
        },
        {
          id: "theCaesar",
          label: t("avatarCustomizer.options.detailedTop.theCaesar"),
        },
        {
          id: "theCaesarAndSidePart",
          label: t("avatarCustomizer.options.detailedTop.theCaesarAndSidePart"),
        },
        {
          id: "turban",
          label: t("avatarCustomizer.options.detailedTop.turban"),
        },
        {
          id: "winterHat1",
          label: t("avatarCustomizer.options.detailedTop.winterHat1"),
        },
        {
          id: "winterHat02",
          label: t("avatarCustomizer.options.detailedTop.winterHat02"),
        },
        {
          id: "winterHat03",
          label: t("avatarCustomizer.options.detailedTop.winterHat03"),
        },
        {
          id: "winterHat04",
          label: t("avatarCustomizer.options.detailedTop.winterHat04"),
        },
      ],
      detailedClothing: [
        {
          id: "blazerAndShirt",
          label: t("avatarCustomizer.options.detailedClothing.blazerAndShirt"),
        },
        {
          id: "blazerAndSweater",
          label: t(
            "avatarCustomizer.options.detailedClothing.blazerAndSweater",
          ),
        },
        {
          id: "collarAndSweater",
          label: t(
            "avatarCustomizer.options.detailedClothing.collarAndSweater",
          ),
        },
        {
          id: "graphicShirt",
          label: t("avatarCustomizer.options.detailedClothing.graphicShirt"),
        },
        {
          id: "hoodie",
          label: t("avatarCustomizer.options.detailedClothing.hoodie"),
        },
        {
          id: "overall",
          label: t("avatarCustomizer.options.detailedClothing.overall"),
        },
        {
          id: "shirtCrewNeck",
          label: t("avatarCustomizer.options.detailedClothing.shirtCrewNeck"),
        },
        {
          id: "shirtScoopNeck",
          label: t("avatarCustomizer.options.detailedClothing.shirtScoopNeck"),
        },
        {
          id: "shirtVNeck",
          label: t("avatarCustomizer.options.detailedClothing.shirtVNeck"),
        },
      ],
      detailedFacialHair: [
        {
          id: "beardLight",
          label: t("avatarCustomizer.options.detailedFacialHair.beardLight"),
        },
        {
          id: "beardMajestic",
          label: t("avatarCustomizer.options.detailedFacialHair.beardMajestic"),
        },
        {
          id: "beardMedium",
          label: t("avatarCustomizer.options.detailedFacialHair.beardMedium"),
        },
        {
          id: "moustacheFancy",
          label: t(
            "avatarCustomizer.options.detailedFacialHair.moustacheFancy",
          ),
        },
        {
          id: "moustacheMagnum",
          label: t(
            "avatarCustomizer.options.detailedFacialHair.moustacheMagnum",
          ),
        },
      ],
      detailedAccessories: [
        {
          id: "eyepatch",
          label: t("avatarCustomizer.options.detailedAccessories.eyepatch"),
        },
        {
          id: "kurt",
          label: t("avatarCustomizer.options.detailedAccessories.kurt"),
        },
        {
          id: "prescription01",
          label: t(
            "avatarCustomizer.options.detailedAccessories.prescription01",
          ),
        },
        {
          id: "prescription02",
          label: t(
            "avatarCustomizer.options.detailedAccessories.prescription02",
          ),
        },
        {
          id: "round",
          label: t("avatarCustomizer.options.detailedAccessories.round"),
        },
        {
          id: "sunglasses",
          label: t("avatarCustomizer.options.detailedAccessories.sunglasses"),
        },
        {
          id: "wayfarers",
          label: t("avatarCustomizer.options.detailedAccessories.wayfarers"),
        },
      ],
      toonheadEyebrows: [
        {
          id: "angry",
          label: t("avatarCustomizer.options.toonheadEyebrows.angry"),
        },
        {
          id: "happy",
          label: t("avatarCustomizer.options.toonheadEyebrows.happy"),
        },
        {
          id: "neutral",
          label: t("avatarCustomizer.options.toonheadEyebrows.neutral"),
        },
        {
          id: "raised",
          label: t("avatarCustomizer.options.toonheadEyebrows.raised"),
        },
        {
          id: "sad",
          label: t("avatarCustomizer.options.toonheadEyebrows.sad"),
        },
      ],
      toonheadEyes: [
        { id: "bow", label: t("avatarCustomizer.options.toonheadEyes.bow") },
        {
          id: "happy",
          label: t("avatarCustomizer.options.toonheadEyes.happy"),
        },
        {
          id: "humble",
          label: t("avatarCustomizer.options.toonheadEyes.humble"),
        },
        { id: "wide", label: t("avatarCustomizer.options.toonheadEyes.wide") },
        { id: "wink", label: t("avatarCustomizer.options.toonheadEyes.wink") },
      ],
      toonheadHair: [
        { id: "bun", label: t("avatarCustomizer.options.toonheadHair.bun") },
        {
          id: "sideComed",
          label: t("avatarCustomizer.options.toonheadHair.sideComed"),
        },
        {
          id: "spiky",
          label: t("avatarCustomizer.options.toonheadHair.spiky"),
        },
        {
          id: "undercut",
          label: t("avatarCustomizer.options.toonheadHair.undercut"),
        },
      ],
      toonheadMouth: [
        {
          id: "agape",
          label: t("avatarCustomizer.options.toonheadMouth.agape"),
        },
        {
          id: "angry",
          label: t("avatarCustomizer.options.toonheadMouth.angry"),
        },
        {
          id: "laugh",
          label: t("avatarCustomizer.options.toonheadMouth.laugh"),
        },
        { id: "sad", label: t("avatarCustomizer.options.toonheadMouth.sad") },
        {
          id: "smile",
          label: t("avatarCustomizer.options.toonheadMouth.smile"),
        },
      ],
      toonheadBeard: [
        { id: "chin", label: t("avatarCustomizer.options.toonheadBeard.chin") },
        {
          id: "chinMoustache",
          label: t("avatarCustomizer.options.toonheadBeard.chinMoustache"),
        },
        {
          id: "fullBeard",
          label: t("avatarCustomizer.options.toonheadBeard.fullBeard"),
        },
        {
          id: "longBeard",
          label: t("avatarCustomizer.options.toonheadBeard.longBeard"),
        },
        {
          id: "moustacheTwirl",
          label: t("avatarCustomizer.options.toonheadBeard.moustacheTwirl"),
        },
      ],
      toonheadClothes: [
        {
          id: "dress",
          label: t("avatarCustomizer.options.toonheadClothes.dress"),
        },
        {
          id: "openJacket",
          label: t("avatarCustomizer.options.toonheadClothes.openJacket"),
        },
        {
          id: "shirt",
          label: t("avatarCustomizer.options.toonheadClothes.shirt"),
        },
        {
          id: "tShirt",
          label: t("avatarCustomizer.options.toonheadClothes.tShirt"),
        },
        {
          id: "turtleNeck",
          label: t("avatarCustomizer.options.toonheadClothes.turtleNeck"),
        },
      ],
      toonheadRearHair: [
        {
          id: "longStraight",
          label: t("avatarCustomizer.options.toonheadRearHair.longStraight"),
        },
        {
          id: "longWavy",
          label: t("avatarCustomizer.options.toonheadRearHair.longWavy"),
        },
        {
          id: "neckHigh",
          label: t("avatarCustomizer.options.toonheadRearHair.neckHigh"),
        },
        {
          id: "shoulderHigh",
          label: t("avatarCustomizer.options.toonheadRearHair.shoulderHigh"),
        },
      ],
      robotEyes: [
        {
          id: "bulging",
          label: t("avatarCustomizer.options.robotEyes.bulging"),
        },
        { id: "dizzy", label: t("avatarCustomizer.options.robotEyes.dizzy") },
        { id: "eva", label: t("avatarCustomizer.options.robotEyes.eva") },
        { id: "frame1", label: t("avatarCustomizer.options.robotEyes.frame1") },
        { id: "frame2", label: t("avatarCustomizer.options.robotEyes.frame2") },
        { id: "glow", label: t("avatarCustomizer.options.robotEyes.glow") },
        { id: "happy", label: t("avatarCustomizer.options.robotEyes.happy") },
        { id: "hearts", label: t("avatarCustomizer.options.robotEyes.hearts") },
        {
          id: "robocop",
          label: t("avatarCustomizer.options.robotEyes.robocop"),
        },
        { id: "round", label: t("avatarCustomizer.options.robotEyes.round") },
        {
          id: "roundFrame01",
          label: t("avatarCustomizer.options.robotEyes.roundFrame01"),
        },
        {
          id: "roundFrame02",
          label: t("avatarCustomizer.options.robotEyes.roundFrame02"),
        },
        { id: "sensor", label: t("avatarCustomizer.options.robotEyes.sensor") },
        {
          id: "shade01",
          label: t("avatarCustomizer.options.robotEyes.shade01"),
        },
      ],
      robotMouth: [
        { id: "bite", label: t("avatarCustomizer.options.robotMouth.bite") },
        {
          id: "diagram",
          label: t("avatarCustomizer.options.robotMouth.diagram"),
        },
        {
          id: "grill01",
          label: t("avatarCustomizer.options.robotMouth.grill01"),
        },
        {
          id: "grill02",
          label: t("avatarCustomizer.options.robotMouth.grill02"),
        },
        {
          id: "grill03",
          label: t("avatarCustomizer.options.robotMouth.grill03"),
        },
        {
          id: "smile01",
          label: t("avatarCustomizer.options.robotMouth.smile01"),
        },
        {
          id: "smile02",
          label: t("avatarCustomizer.options.robotMouth.smile02"),
        },
        {
          id: "square01",
          label: t("avatarCustomizer.options.robotMouth.square01"),
        },
        {
          id: "square02",
          label: t("avatarCustomizer.options.robotMouth.square02"),
        },
      ],
      robotTop: [
        {
          id: "antenna",
          label: t("avatarCustomizer.options.robotTop.antenna"),
        },
        {
          id: "antennaCrooked",
          label: t("avatarCustomizer.options.robotTop.antennaCrooked"),
        },
        { id: "bulb01", label: t("avatarCustomizer.options.robotTop.bulb01") },
        {
          id: "glowingBulb01",
          label: t("avatarCustomizer.options.robotTop.glowingBulb01"),
        },
        {
          id: "glowingBulb02",
          label: t("avatarCustomizer.options.robotTop.glowingBulb02"),
        },
        { id: "horns", label: t("avatarCustomizer.options.robotTop.horns") },
        { id: "lights", label: t("avatarCustomizer.options.robotTop.lights") },
        {
          id: "pyramid",
          label: t("avatarCustomizer.options.robotTop.pyramid"),
        },
        { id: "radar", label: t("avatarCustomizer.options.robotTop.radar") },
      ],
    }),
    [t],
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ColorPalette({
  colors,
  selected,
  onSelect,
  label,
}: {
  colors: string[];
  selected?: string;
  onSelect: (color: string) => void;
  label: string;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
        {colors.map((color) => (
          <Box
            key={color}
            onClick={() => onSelect(color)}
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              bgcolor: `#${color}`,
              cursor: "pointer",
              border:
                selected === color ? "3px solid" : "2px solid transparent",
              borderColor: selected === color ? "primary.main" : "transparent",
              outline: "1px solid rgba(0,0,0,0.1)",
              transition: "border-color 0.15s",
              "&:hover": { transform: "scale(1.15)" },
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function OptionGrid({
  options,
  selected,
  onSelect,
  label,
}: {
  options: Array<{ id: string; label: string }>;
  selected?: string[];
  onSelect: (id: string) => void;
  label: string;
}) {
  const t = useTranslations("components");
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
        <Chip
          label={t("avatarCustomizer.random")}
          size="small"
          variant={!selected || selected.length === 0 ? "filled" : "outlined"}
          color={!selected || selected.length === 0 ? "primary" : "default"}
          onClick={() => onSelect("")}
        />
        {options.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            size="small"
            variant={selected?.includes(opt.id) ? "filled" : "outlined"}
            color={selected?.includes(opt.id) ? "primary" : "default"}
            onClick={() => onSelect(opt.id)}
          />
        ))}
      </Stack>
    </Box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AvatarCustomizer({
  open,
  onClose,
  level,
  seed,
  selectedStyle,
  overrides = {},
  onSave,
  avatarUnlockConfig,
  glowRing,
  robotStylesUnlocked = false,
}: AvatarCustomizerProps) {
  const t = useTranslations("components");
  const avatarOptions = useAvatarOptions();
  const glowPresetLabels: Record<string, string> = {
    rainbow: t("avatarCustomizer.glowPresetRainbow"),
    fire: t("avatarCustomizer.glowPresetFire"),
    ice: t("avatarCustomizer.glowPresetIce"),
    aurora: t("avatarCustomizer.glowPresetAurora"),
    sunset: t("avatarCustomizer.glowPresetSunset"),
    ocean: t("avatarCustomizer.glowPresetOcean"),
    neon: t("avatarCustomizer.glowPresetNeon"),
  };
  const highestTier = useMemo(
    () => getUnlockedStyleTier(level, avatarUnlockConfig),
    [level, avatarUnlockConfig],
  );
  const unlockedStyles = useMemo(
    () => getUnlockedStyles(level, avatarUnlockConfig),
    [level, avatarUnlockConfig],
  );

  const [style, setStyle] = useState<AvatarStyleTier>(
    selectedStyle || highestTier,
  );
  const [draft, setDraft] = useState<AvatarOverrides>(overrides);
  const [glowDraft, setGlowDraft] = useState<GlowRingConfig | null>(
    glowRing ?? null,
  );

  // Reset draft when dialog opens with new overrides
  React.useEffect(() => {
    if (open) {
      setDraft(overrides);
      setStyle(selectedStyle || highestTier);
      setGlowDraft(glowRing ?? null);
    }
  }, [open, overrides, selectedStyle, highestTier, glowRing]);

  const handleColorSelect = useCallback(
    (field: keyof AvatarOverrides, color: string) => {
      setDraft((prev) => ({ ...prev, [field]: [color] }));
    },
    [],
  );

  const handleOptionSelect = useCallback(
    (field: keyof AvatarOverrides, id: string) => {
      setDraft((prev) => {
        if (!id) {
          const next = { ...prev };
          delete next[field];
          if (field === "facialHair") delete next.facialHairProbability;
          if (field === "beard") delete next.beardProbability;
          if (field === "rearHair") delete next.rearHairProbability;
          if (field === "accessories") delete next.accessoriesProbability;
          return next;
        }
        return {
          ...prev,
          [field]: [id],
          ...(field === "facialHair" ? { facialHairProbability: 100 } : {}),
          ...(field === "beard" ? { beardProbability: 100 } : {}),
          ...(field === "rearHair" ? { rearHairProbability: 100 } : {}),
          ...(field === "accessories" ? { accessoriesProbability: 100 } : {}),
        };
      });
    },
    [],
  );

  const handleReset = useCallback(() => {
    setDraft({});
  }, []);

  const handleSave = useCallback(() => {
    onSave(draft, style, glowDraft);
    onClose();
  }, [draft, style, glowDraft, onSave, onClose]);

  // Progressive feature gates — relative to the selected style's unlock level
  // e.g., if style unlocks at L3 and offset is 2, hair/clothing requires L5
  const styleMinLevel = useMemo(() => {
    const unlocks = avatarUnlockConfig?.unlocks;
    if (!unlocks?.length) return 1;
    const entry = unlocks.find((e) => e.tier === style);
    return entry?.minLevel ?? 1;
  }, [avatarUnlockConfig, style]);

  const hairClothesOffset =
    avatarUnlockConfig?.featureUnlockLevels?.hairAndClothing ?? 2;
  const accessoriesOffset =
    avatarUnlockConfig?.featureUnlockLevels?.accessories ?? 3;
  const hairClothesLevel = styleMinLevel + hairClothesOffset;
  const accessoriesLevel = styleMinLevel + accessoriesOffset;
  const canCustomizeHairClothes = level >= hairClothesLevel;
  const canCustomizeAccessories = level >= accessoriesLevel;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: (theme) => theme.zIndex.modal + 3 }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {t("avatarCustomizer.title")}
        <Tooltip title={t("avatarCustomizer.resetToRandom")}>
          <IconButton onClick={handleReset} size="small">
            <RestartAltIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Live preview */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <DiceBearAvatar
              seed={seed}
              style={style}
              size={96}
              overrides={draft}
              glowRing={glowDraft}
            />
          </Box>

          {/* Style selector — show when multiple styles unlocked */}
          {(unlockedStyles.length > 1 || robotStylesUnlocked) && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("avatarCustomizer.avatarStyle")}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {[
                  ...(["simple", "detailed", "toonhead"] as AvatarStyleTier[]),
                  ...ROBOT_STYLES,
                ].map((tier) => {
                  const isRobot = ROBOT_STYLES.includes(tier);
                  const isUnlocked = isRobot
                    ? robotStylesUnlocked
                    : unlockedStyles.includes(tier);
                  return (
                    <Chip
                      key={tier}
                      label={STYLE_CONFIG[tier].displayName}
                      size="small"
                      variant={style === tier ? "filled" : "outlined"}
                      color={style === tier ? "primary" : "default"}
                      disabled={!isUnlocked}
                      icon={
                        !isUnlocked ? (
                          <LockIcon sx={{ fontSize: 14 }} />
                        ) : undefined
                      }
                      onClick={() => isUnlocked && setStyle(tier)}
                    />
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* ── Simple (avataaars-neutral): colors always, face features always ── */}
          {style === "simple" && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">
                {t("avatarCustomizer.colors")}
              </Typography>
              <ColorPalette
                colors={BACKGROUND_COLORS}
                selected={draft.backgroundColor?.[0]}
                onSelect={(c) => handleColorSelect("backgroundColor", c)}
                label={t("avatarCustomizer.background")}
              />
              <ColorPalette
                colors={DETAILED_SKIN_COLORS}
                selected={draft.skinColor?.[0]}
                onSelect={(c) => handleColorSelect("skinColor", c)}
                label={t("avatarCustomizer.skinTone")}
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {t("avatarCustomizer.face")}
              </Typography>
              <OptionGrid
                options={avatarOptions.neutralEyebrows}
                selected={draft.eyebrows}
                onSelect={(id) => handleOptionSelect("eyebrows", id)}
                label={t("avatarCustomizer.eyebrows")}
              />
              <OptionGrid
                options={avatarOptions.neutralEyes}
                selected={draft.eyes}
                onSelect={(id) => handleOptionSelect("eyes", id)}
                label={t("avatarCustomizer.eyes")}
              />
              <OptionGrid
                options={avatarOptions.neutralMouth}
                selected={draft.mouth}
                onSelect={(id) => handleOptionSelect("mouth", id)}
                label={t("avatarCustomizer.mouth")}
              />
              {!canCustomizeHairClothes && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  <LockIcon
                    sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}
                  />
                  {t("avatarCustomizer.unlockHairClothingColorOptions", {
                    level: hairClothesLevel,
                  })}
                </Typography>
              )}
            </Stack>
          )}

          {/* ── Detailed (avataaars): colors always, features gated progressively ── */}
          {style === "detailed" && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">
                {t("avatarCustomizer.colors")}
              </Typography>
              <ColorPalette
                colors={BACKGROUND_COLORS}
                selected={draft.backgroundColor?.[0]}
                onSelect={(c) => handleColorSelect("backgroundColor", c)}
                label={t("avatarCustomizer.background")}
              />
              <ColorPalette
                colors={DETAILED_SKIN_COLORS}
                selected={draft.skinColor?.[0]}
                onSelect={(c) => handleColorSelect("skinColor", c)}
                label={t("avatarCustomizer.skinTone")}
              />
              {canCustomizeHairClothes && (
                <>
                  <ColorPalette
                    colors={DETAILED_HAIR_COLORS}
                    selected={draft.hairColor?.[0]}
                    onSelect={(c) => handleColorSelect("hairColor", c)}
                    label={t("avatarCustomizer.hairColor")}
                  />
                  <ColorPalette
                    colors={DETAILED_CLOTHES_COLORS}
                    selected={draft.clothesColor?.[0] as string | undefined}
                    onSelect={(c) => handleColorSelect("clothesColor", c)}
                    label={t("avatarCustomizer.clothesColor")}
                  />
                </>
              )}

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {t("avatarCustomizer.face")}
              </Typography>
              <OptionGrid
                options={avatarOptions.neutralEyebrows}
                selected={draft.eyebrows}
                onSelect={(id) => handleOptionSelect("eyebrows", id)}
                label={t("avatarCustomizer.eyebrows")}
              />
              <OptionGrid
                options={avatarOptions.neutralEyes}
                selected={draft.eyes}
                onSelect={(id) => handleOptionSelect("eyes", id)}
                label={t("avatarCustomizer.eyes")}
              />
              <OptionGrid
                options={avatarOptions.neutralMouth}
                selected={draft.mouth}
                onSelect={(id) => handleOptionSelect("mouth", id)}
                label={t("avatarCustomizer.mouth")}
              />

              {canCustomizeHairClothes && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    {t("avatarCustomizer.hairAndClothing")}
                  </Typography>
                  <OptionGrid
                    options={avatarOptions.detailedTop}
                    selected={draft.top}
                    onSelect={(id) => handleOptionSelect("top", id)}
                    label={t("avatarCustomizer.hairTop")}
                  />
                  <OptionGrid
                    options={avatarOptions.detailedClothing}
                    selected={draft.clothing}
                    onSelect={(id) => handleOptionSelect("clothing", id)}
                    label={t("avatarCustomizer.clothing")}
                  />
                </>
              )}

              {canCustomizeAccessories && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    {t("avatarCustomizer.accessoriesAndExtras")}
                  </Typography>
                  <OptionGrid
                    options={avatarOptions.detailedFacialHair}
                    selected={draft.facialHair}
                    onSelect={(id) => handleOptionSelect("facialHair", id)}
                    label={t("avatarCustomizer.facialHair")}
                  />
                  <OptionGrid
                    options={avatarOptions.detailedAccessories}
                    selected={draft.accessories}
                    onSelect={(id) => handleOptionSelect("accessories", id)}
                    label={t("avatarCustomizer.accessories")}
                  />
                </>
              )}

              {!canCustomizeHairClothes && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  <LockIcon
                    sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}
                  />
                  {t("avatarCustomizer.unlockHairClothingColors", {
                    level: hairClothesLevel,
                  })}
                </Typography>
              )}
              {canCustomizeHairClothes && !canCustomizeAccessories && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  <LockIcon
                    sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}
                  />
                  {t("avatarCustomizer.unlockAccessories", {
                    level: accessoriesLevel,
                  })}
                </Typography>
              )}
            </Stack>
          )}

          {/* ── Toon Head: colors always, detail features progressive ── */}
          {style === "toonhead" && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">
                {t("avatarCustomizer.colors")}
              </Typography>
              <ColorPalette
                colors={BACKGROUND_COLORS}
                selected={draft.backgroundColor?.[0]}
                onSelect={(c) => handleColorSelect("backgroundColor", c)}
                label={t("avatarCustomizer.background")}
              />
              <ColorPalette
                colors={TOONHEAD_SKIN_COLORS}
                selected={draft.skinColor?.[0]}
                onSelect={(c) => handleColorSelect("skinColor", c)}
                label={t("avatarCustomizer.skinTone")}
              />
              <ColorPalette
                colors={TOONHEAD_HAIR_COLORS}
                selected={draft.hairColor?.[0]}
                onSelect={(c) => handleColorSelect("hairColor", c)}
                label={t("avatarCustomizer.hairColor")}
              />
              <ColorPalette
                colors={TOONHEAD_CLOTHES_COLORS}
                selected={(draft.clothesColor as string[] | undefined)?.[0]}
                onSelect={(c) => handleColorSelect("clothesColor", c)}
                label={t("avatarCustomizer.clothesColor")}
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {t("avatarCustomizer.face")}
              </Typography>
              <OptionGrid
                options={avatarOptions.toonheadEyes}
                selected={draft.eyes}
                onSelect={(id) => handleOptionSelect("eyes", id)}
                label={t("avatarCustomizer.eyes")}
              />
              <OptionGrid
                options={avatarOptions.toonheadEyebrows}
                selected={draft.eyebrows}
                onSelect={(id) => handleOptionSelect("eyebrows", id)}
                label={t("avatarCustomizer.eyebrows")}
              />
              <OptionGrid
                options={avatarOptions.toonheadMouth}
                selected={draft.mouth}
                onSelect={(id) => handleOptionSelect("mouth", id)}
                label={t("avatarCustomizer.mouth")}
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {t("avatarCustomizer.hairAndClothing")}
              </Typography>
              <OptionGrid
                options={avatarOptions.toonheadHair}
                selected={draft.hair}
                onSelect={(id) => handleOptionSelect("hair", id)}
                label={t("avatarCustomizer.hair")}
              />
              <OptionGrid
                options={avatarOptions.toonheadRearHair}
                selected={draft.rearHair}
                onSelect={(id) => handleOptionSelect("rearHair", id)}
                label={t("avatarCustomizer.rearHair")}
              />
              <OptionGrid
                options={avatarOptions.toonheadClothes}
                selected={draft.clothes}
                onSelect={(id) => handleOptionSelect("clothes", id)}
                label={t("avatarCustomizer.clothes")}
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {t("avatarCustomizer.extras")}
              </Typography>
              <OptionGrid
                options={avatarOptions.toonheadBeard}
                selected={draft.beard}
                onSelect={(id) => handleOptionSelect("beard", id)}
                label={t("avatarCustomizer.beard")}
              />
            </Stack>
          )}

          {/* ── Bottts (robot): unlocked via all Bot Whisperer badges ── */}
          {ROBOT_STYLES.includes(style) && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">
                {t("avatarCustomizer.colors")}
              </Typography>
              <ColorPalette
                colors={BACKGROUND_COLORS}
                selected={draft.backgroundColor?.[0]}
                onSelect={(c) => handleColorSelect("backgroundColor", c)}
                label={t("avatarCustomizer.background")}
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {t("avatarCustomizer.face")}
              </Typography>
              <OptionGrid
                options={avatarOptions.robotEyes}
                selected={draft.eyes}
                onSelect={(id) => handleOptionSelect("eyes", id)}
                label={t("avatarCustomizer.eyes")}
              />
              <OptionGrid
                options={avatarOptions.robotMouth}
                selected={draft.mouth}
                onSelect={(id) => handleOptionSelect("mouth", id)}
                label={t("avatarCustomizer.mouth")}
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {t("avatarCustomizer.antenna")}
              </Typography>
              <OptionGrid
                options={avatarOptions.robotTop}
                selected={draft.top}
                onSelect={(id) => handleOptionSelect("top", id)}
                label={t("avatarCustomizer.top")}
              />
            </Stack>
          )}

          {/* ── Gradient Ring Editor ── */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={glowDraft?.active ?? false}
                  onChange={(_, checked) => {
                    if (checked) {
                      setGlowDraft({
                        colors: glowDraft?.colors ?? [...DEFAULT_GLOW_COLORS],
                        speed: glowDraft?.speed ?? 4,
                        thickness: glowDraft?.thickness ?? 3,
                        active: true,
                        expiresAt: null,
                      });
                    } else {
                      setGlowDraft(
                        glowDraft ? { ...glowDraft, active: false } : null,
                      );
                    }
                  }}
                />
              }
              label={
                <Typography variant="subtitle2">
                  {t("avatarCustomizer.gradientRing")}
                </Typography>
              }
            />
            {glowDraft?.active && (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t("avatarCustomizer.choosePreset")}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {Object.entries(GLOW_COLOR_PRESETS).map(([name, colors]) => {
                    const isSelected =
                      glowDraft.colors.join(",") === colors.join(",");
                    return (
                      <Chip
                        key={name}
                        label={
                          glowPresetLabels[name] ??
                          name.charAt(0).toUpperCase() + name.slice(1)
                        }
                        size="small"
                        variant={isSelected ? "filled" : "outlined"}
                        color={isSelected ? "primary" : "default"}
                        onClick={() =>
                          setGlowDraft({ ...glowDraft, colors: [...colors] })
                        }
                        avatar={
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: `conic-gradient(${colors.slice(0, 4).join(", ")})`,
                            }}
                          />
                        }
                      />
                    );
                  })}
                </Stack>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("avatarCustomizer.customColorStops")}
                  </Typography>
                  <Stack
                    direction="row"
                    gap={0.5}
                    sx={{ mt: 0.5, flexWrap: "wrap" }}
                  >
                    {glowDraft.colors.map((color, i) => (
                      <Box
                        key={i}
                        sx={{
                          position: "relative",
                          width: 32,
                          height: 32,
                        }}
                      >
                        <Box
                          component="input"
                          type="color"
                          value={color}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            const newColors = [...glowDraft.colors];
                            newColors[i] = e.target.value;
                            setGlowDraft({ ...glowDraft, colors: newColors });
                          }}
                          sx={{
                            width: 32,
                            height: 32,
                            border: "2px solid",
                            borderColor: "divider",
                            borderRadius: "50%",
                            cursor: "pointer",
                            padding: 0,
                            appearance: "none",
                            "&::-webkit-color-swatch-wrapper": { padding: 0 },
                            "&::-webkit-color-swatch": {
                              borderRadius: "50%",
                              border: "none",
                            },
                          }}
                        />
                      </Box>
                    ))}
                    {glowDraft.colors.length < 8 && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          setGlowDraft({
                            ...glowDraft,
                            colors: [...glowDraft.colors, "#ffffff"],
                          })
                        }
                        sx={{ width: 32, height: 32 }}
                      >
                        +
                      </IconButton>
                    )}
                    {glowDraft.colors.length > 2 && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          setGlowDraft({
                            ...glowDraft,
                            colors: glowDraft.colors.slice(0, -1),
                          })
                        }
                        sx={{ width: 32, height: 32 }}
                      >
                        −
                      </IconButton>
                    )}
                  </Stack>
                </Box>
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("avatarCustomizer.cancel")}</Button>
        <Button onClick={handleSave} variant="contained">
          {t("avatarCustomizer.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AvatarCustomizer;
