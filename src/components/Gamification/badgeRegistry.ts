/**
 * Badge Registry — Maps each BadgeType to a React Icon component,
 * background style (solid color or gradient), and animation preset.
 *
 * Uses react-icons for the icon library instead of emojis or DiceBear.
 *
 * @module badgeRegistry
 */

import type { IconType } from "react-icons";

// Game Icons (gi) — rich line-art, great for achievements
import {
  GiArcheryTarget,
  GiSpyglass,
  GiLightningBow,
  GiCrossedSwords,
  GiCalendar,
  GiShakingHands,
  GiBrain,
  GiLaurelCrown,
  GiCutDiamond,
  GiPalette,
  GiPaintBrush,
  GiTopHat,
  GiMirrorMirror,
  GiRobotGolem,
  GiCyberEye,
  GiArtificialIntelligence,
  GiCircuitry,
  GiFire,
  GiMountainRoad,
  GiEggClutch,
  GiStarMedal,
  GiReturnArrow,
  GiFireShield,
  GiAllSeeingEye,
  GiRingedPlanet,
  GiHammerNails,
  // Storybook documentation promo badges
  GiSpellBook,
  GiTeacher,
  GiBookCover,
  GiEarthAmerica,
  GiMagnifyingGlass,
  GiTrophy,
} from "react-icons/gi";

// ============================================================================
// Types
// ============================================================================

export type BadgeShape = "circle" | "hexagon" | "shield" | "diamond";

export type BadgeAnimationPreset =
  | "draw" // SVG path draw-in (stroke-dashoffset)
  | "pulse" // gentle scale pulse loop
  | "spin-in" // rotates in from 0 to 360
  | "bounce-in" // spring bounce on mount
  | "glow" // outer glow pulse
  | "shake" // quick horizontal shake
  | "none";

export interface BadgeGradient {
  type: "linear" | "radial";
  /** CSS angle for linear gradients (e.g. '135deg') */
  angle?: string;
  stops: Array<{ color: string; position: string }>;
}

export interface BadgeVisualConfig {
  /** The react-icons component to render */
  icon: IconType;
  /** Display name */
  name: string;
  /** Short description of the achievement */
  description: string;
  /** Solid background color (CSS) — used if gradient is not provided */
  bgColor: string;
  /** Optional gradient background — takes precedence over bgColor */
  gradient?: BadgeGradient;
  /** Icon stroke/fill color */
  iconColor: string;
  /** Shape of the badge container */
  shape: BadgeShape;
  /** Animation played on mount / hover */
  animation: BadgeAnimationPreset;
  /** Optional secondary animation on hover (if different from mount) */
  hoverAnimation?: BadgeAnimationPreset;
  /** Scale multiplier for the icon inside the badge (default 1) */
  iconScale?: number;
  /** Translate offset [x, y] in px for fine-tuning icon position */
  iconTranslate?: [number, number];
  /** Category grouping for UI organization */
  category: "core" | "avatar" | "bot-whisperer" | "streak" | "special" | "anti";
  /** Rarity tier — affects glow intensity and border treatment */
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

// ============================================================================
// Registry
// ============================================================================

export const BADGE_REGISTRY: Record<string, BadgeVisualConfig> = {
  // ── Core Achievement Badges ───────────────────────────────────────────

  FIRST_SUBMISSION: {
    icon: GiArcheryTarget,
    name: "First Submission",
    description: "Submitted your first homework",
    bgColor: "#4caf50",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#66bb6a", position: "0%" },
        { color: "#2e7d32", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "circle",
    animation: "draw",
    hoverAnimation: "pulse",
    category: "core",
    rarity: "common",
  },

  GOOD_EYE: {
    icon: GiSpyglass,
    name: "Good Eye",
    description: "Revised work after AI feedback",
    bgColor: "#7c4dff",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#b388ff", position: "0%" },
        { color: "#651fff", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "circle",
    animation: "draw",
    hoverAnimation: "pulse",
    category: "core",
    rarity: "common",
  },

  QUICK_DRAW: {
    icon: GiLightningBow,
    name: "Quick Draw",
    description: "Submitted before the due date",
    bgColor: "#ff9800",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#ffb74d", position: "0%" },
        { color: "#e65100", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "hexagon",
    animation: "bounce-in",
    hoverAnimation: "shake",
    category: "core",
    rarity: "common",
  },

  SHARPSHOOTER: {
    icon: GiCrossedSwords,
    name: "Sharpshooter",
    description: "Scored 90%+ on an assignment",
    bgColor: "#f44336",
    gradient: {
      type: "linear",
      angle: "160deg",
      stops: [
        { color: "#ef5350", position: "0%" },
        { color: "#b71c1c", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "shield",
    animation: "draw",
    hoverAnimation: "glow",
    category: "core",
    rarity: "uncommon",
  },

  CONSISTENT: {
    icon: GiCalendar,
    name: "Consistent",
    description: "Maintained a 7-day streak",
    bgColor: "#2196f3",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#64b5f6", position: "0%" },
        { color: "#1565c0", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "circle",
    animation: "draw",
    hoverAnimation: "pulse",
    category: "core",
    rarity: "uncommon",
  },

  TEAM_PLAYER: {
    icon: GiShakingHands,
    name: "Team Player",
    description: "Completed a peer review",
    bgColor: "#00bcd4",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#4dd0e1", position: "0%" },
        { color: "#00838f", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "circle",
    animation: "draw",
    hoverAnimation: "pulse",
    category: "core",
    rarity: "common",
  },

  DEEP_THINKER: {
    icon: GiBrain,
    name: "Deep Thinker",
    description: "Completed all blocks in a unit",
    bgColor: "#9c27b0",
    gradient: {
      type: "radial",
      stops: [
        { color: "#ce93d8", position: "0%" },
        { color: "#6a1b9a", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "hexagon",
    animation: "draw",
    hoverAnimation: "glow",
    category: "core",
    rarity: "rare",
  },

  TOP_OF_CLASS: {
    icon: GiLaurelCrown,
    name: "Top of Class",
    description: "Reached #1 on the leaderboard",
    bgColor: "#ffc107",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#ffd54f", position: "0%" },
        { color: "#ff8f00", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "shield",
    animation: "spin-in",
    hoverAnimation: "glow",
    iconScale: 1.1,
    category: "core",
    rarity: "epic",
  },

  PERFECTIONIST: {
    icon: GiCutDiamond,
    name: "Perfectionist",
    description: "Scored 100% on an assignment",
    bgColor: "#e91e63",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#f48fb1", position: "0%" },
        { color: "#880e4f", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "diamond",
    animation: "draw",
    hoverAnimation: "glow",
    category: "core",
    rarity: "epic",
  },

  // ── Avatar Unlock Badges ──────────────────────────────────────────────

  AVATAR_COLORS: {
    icon: GiPalette,
    name: "Color Unlocked",
    description: "Reached Level 2 — unlock avatar color picker",
    bgColor: "#e91e63",
    gradient: {
      type: "linear",
      angle: "90deg",
      stops: [
        { color: "#f44336", position: "0%" },
        { color: "#ff9800", position: "25%" },
        { color: "#ffeb3b", position: "50%" },
        { color: "#4caf50", position: "75%" },
        { color: "#2196f3", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "circle",
    animation: "spin-in",
    hoverAnimation: "pulse",
    category: "avatar",
    rarity: "uncommon",
  },

  AVATAR_DETAILED: {
    icon: GiPaintBrush,
    name: "New Look",
    description: "Reached Level 3 — unlocked detailed avatar style",
    bgColor: "#3f51b5",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#7986cb", position: "0%" },
        { color: "#283593", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "hexagon",
    animation: "draw",
    hoverAnimation: "pulse",
    category: "avatar",
    rarity: "uncommon",
  },

  AVATAR_ACCESSORIES: {
    icon: GiTopHat,
    name: "Accessorized",
    description: "Reached Level 4 — unlock avatar accessories",
    bgColor: "#795548",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#a1887f", position: "0%" },
        { color: "#4e342e", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "shield",
    animation: "bounce-in",
    hoverAnimation: "shake",
    category: "avatar",
    rarity: "rare",
  },

  AVATAR_PORTRAIT: {
    icon: GiMirrorMirror,
    name: "Portrait Mode",
    description:
      "Reached Level 5 — unlocked portrait avatar style & full customizer",
    bgColor: "#9c27b0",
    gradient: {
      type: "radial",
      stops: [
        { color: "#e1bee7", position: "0%" },
        { color: "#4a148c", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "diamond",
    animation: "draw",
    hoverAnimation: "glow",
    category: "avatar",
    rarity: "epic",
  },

  // ── Avatar Powerup Badges ────────────────────────────────────────────

  AVATAR_GLOW: {
    icon: GiRingedPlanet,
    name: "Glow Ring",
    description:
      "Level up! — rotating gradient ring around your avatar for 24 hours",
    bgColor: "#7c4dff",
    gradient: {
      type: "linear",
      angle: "90deg",
      stops: [
        { color: "#ff6b6b", position: "0%" },
        { color: "#feca57", position: "25%" },
        { color: "#48dbfb", position: "50%" },
        { color: "#ff9ff3", position: "75%" },
        { color: "#ff6b6b", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "circle",
    animation: "spin-in",
    hoverAnimation: "glow",
    category: "avatar",
    rarity: "rare",
  },

  // ── Bot Whisperer Tiered Badges ───────────────────────────────────────

  BOT_WHISPERER_I: {
    icon: GiRobotGolem,
    name: "Bot Whisperer I",
    description: "Had your first real conversation with the AI tutor",
    bgColor: "#607d8b",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#90a4ae", position: "0%" },
        { color: "#37474f", position: "100%" },
      ],
    },
    iconColor: "#b0bec5",
    shape: "hexagon",
    animation: "draw",
    hoverAnimation: "pulse",
    category: "bot-whisperer",
    rarity: "common",
  },

  BOT_WHISPERER_II: {
    icon: GiCyberEye,
    name: "Bot Whisperer II",
    description: "Earned Deep Thinker — upgraded your bot's style",
    bgColor: "#00acc1",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#4dd0e1", position: "0%" },
        { color: "#006064", position: "100%" },
      ],
    },
    iconColor: "#e0f7fa",
    shape: "hexagon",
    animation: "draw",
    hoverAnimation: "glow",
    category: "bot-whisperer",
    rarity: "uncommon",
  },

  BOT_WHISPERER_III: {
    icon: GiArtificialIntelligence,
    name: "Bot Whisperer III",
    description: "Used AI across 5 units — choose your bot's eyes & mouth",
    bgColor: "#1e88e5",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#42a5f5", position: "0%" },
        { color: "#0d47a1", position: "100%" },
      ],
    },
    iconColor: "#bbdefb",
    shape: "shield",
    animation: "draw",
    hoverAnimation: "glow",
    category: "bot-whisperer",
    rarity: "rare",
  },

  BOT_WHISPERER_IV: {
    icon: GiCircuitry,
    name: "Bot Whisperer IV",
    description: "AI mastery achieved — full bot customization unlocked",
    bgColor: "#7c4dff",
    gradient: {
      type: "radial",
      stops: [
        { color: "#b388ff", position: "0%" },
        { color: "#311b92", position: "100%" },
      ],
    },
    iconColor: "#ede7f6",
    shape: "diamond",
    animation: "spin-in",
    hoverAnimation: "glow",
    iconScale: 1.1,
    category: "bot-whisperer",
    rarity: "legendary",
  },

  // ── Additional Badges (from Lambda handler) ───────────────────────────

  DRILL_MASTER: {
    icon: GiFireShield,
    name: "Drill Master",
    description: "Completed 10 practice drills",
    bgColor: "#ff5722",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#ff8a65", position: "0%" },
        { color: "#bf360c", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "shield",
    animation: "bounce-in",
    hoverAnimation: "shake",
    category: "core",
    rarity: "uncommon",
  },

  COMEBACK_KID: {
    icon: GiReturnArrow,
    name: "Comeback Kid",
    description: "Returned after a break and got back on track",
    bgColor: "#009688",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#4db6ac", position: "0%" },
        { color: "#004d40", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "circle",
    animation: "bounce-in",
    hoverAnimation: "pulse",
    category: "special",
    rarity: "uncommon",
  },

  STREAK_14: {
    icon: GiFire,
    name: "14-Day Streak",
    description: "Maintained a 14-day activity streak",
    bgColor: "#ff5722",
    gradient: {
      type: "linear",
      angle: "180deg",
      stops: [
        { color: "#ffab91", position: "0%" },
        { color: "#ff3d00", position: "50%" },
        { color: "#dd2c00", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "hexagon",
    animation: "draw",
    hoverAnimation: "glow",
    category: "streak",
    rarity: "rare",
  },

  STREAK_30: {
    icon: GiMountainRoad,
    name: "30-Day Streak",
    description: "Maintained a 30-day activity streak — legendary commitment",
    bgColor: "#f44336",
    gradient: {
      type: "radial",
      stops: [
        { color: "#ffd54f", position: "0%" },
        { color: "#ff6f00", position: "40%" },
        { color: "#e65100", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "shield",
    animation: "spin-in",
    hoverAnimation: "glow",
    iconScale: 1.1,
    category: "streak",
    rarity: "legendary",
  },

  EASTER_EGG_HUNTER: {
    icon: GiEggClutch,
    name: "Easter Egg Hunter",
    description: "Discovered 3 hidden Easter eggs",
    bgColor: "#8bc34a",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#aed581", position: "0%" },
        { color: "#33691e", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "circle",
    animation: "bounce-in",
    hoverAnimation: "shake",
    category: "special",
    rarity: "rare",
  },

  NAILED_IT: {
    icon: GiHammerNails,
    name: "Nailed It",
    description: "Received a perfect AI evaluation on a block",
    bgColor: "#e65100",
    gradient: {
      type: "radial",
      stops: [
        { color: "#ffab40", position: "0%" },
        { color: "#bf360c", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "hexagon",
    animation: "bounce-in",
    hoverAnimation: "shake",
    category: "core",
    rarity: "rare",
  },

  // ── Additional Streak Badges ──────────────────────────────────────────

  STREAK_7: {
    icon: GiAllSeeingEye,
    name: "7-Day Streak",
    description: "Maintained a 7-day activity streak",
    bgColor: "#2196f3",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#64b5f6", position: "0%" },
        { color: "#0d47a1", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "circle",
    animation: "draw",
    hoverAnimation: "pulse",
    category: "streak",
    rarity: "common",
  },

  // ── Storybook Documentation Promo Badges ──────────────────────────────

  DOCS_EXPLORER: {
    icon: GiSpellBook,
    name: "Docs Explorer",
    description: "Visited the Storybook documentation and started onboarding",
    bgColor: "#5c6bc0",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#7986cb", position: "0%" },
        { color: "#283593", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "circle",
    animation: "draw",
    hoverAnimation: "pulse",
    category: "special",
    rarity: "common",
  },

  INSTRUCTOR_ONBOARD: {
    icon: GiTeacher,
    name: "Instructor Certified",
    description: "Completed the instructor onboarding in Storybook",
    bgColor: "#43a047",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#66bb6a", position: "0%" },
        { color: "#1b5e20", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "shield",
    animation: "draw",
    hoverAnimation: "glow",
    category: "special",
    rarity: "uncommon",
  },

  LEARNER_ONBOARD: {
    icon: GiBookCover,
    name: "Learner Certified",
    description: "Completed the learner onboarding in Storybook",
    bgColor: "#1e88e5",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#42a5f5", position: "0%" },
        { color: "#0d47a1", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "hexagon",
    animation: "draw",
    hoverAnimation: "glow",
    category: "special",
    rarity: "uncommon",
  },

  TRANSLATOR_ONBOARD: {
    icon: GiEarthAmerica,
    name: "Translator Certified",
    description: "Completed the translator onboarding in Storybook",
    bgColor: "#00897b",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#4db6ac", position: "0%" },
        { color: "#004d40", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "hexagon",
    animation: "draw",
    hoverAnimation: "glow",
    category: "special",
    rarity: "uncommon",
  },

  A11Y_CHAMPION: {
    icon: GiMagnifyingGlass,
    name: "Accessibility Champion",
    description: "Completed accessibility-related tasks in Storybook",
    bgColor: "#6a1b9a",
    gradient: {
      type: "radial",
      stops: [
        { color: "#ce93d8", position: "0%" },
        { color: "#4a148c", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "diamond",
    animation: "draw",
    hoverAnimation: "glow",
    category: "special",
    rarity: "rare",
  },

  DOCS_CHAMPION: {
    icon: GiTrophy,
    name: "Documentation Champion",
    description:
      "Completed all onboarding paths — instructor, learner, and translator",
    bgColor: "#f9a825",
    gradient: {
      type: "radial",
      stops: [
        { color: "#fff176", position: "0%" },
        { color: "#ff8f00", position: "50%" },
        { color: "#e65100", position: "100%" },
      ],
    },
    iconColor: "#ffffff",
    shape: "shield",
    animation: "spin-in",
    hoverAnimation: "glow",
    iconScale: 1.1,
    category: "special",
    rarity: "legendary",
  },
};

// ============================================================================
// Helpers
// ============================================================================

/** Get badge config by type, with a sensible fallback for unknown types. */
export function getBadgeConfig(badgeType: string): BadgeVisualConfig {
  return BADGE_REGISTRY[badgeType] ?? BADGE_REGISTRY.FIRST_SUBMISSION;
}

/** Get all registered badge types */
export function getAllBadgeTypes(): string[] {
  return Object.keys(BADGE_REGISTRY);
}

/** Get badges filtered by category */
export function getBadgesByCategory(
  category: BadgeVisualConfig["category"],
): Array<[string, BadgeVisualConfig]> {
  return Object.entries(BADGE_REGISTRY).filter(
    ([, config]) => config.category === category,
  );
}

/** Get badges filtered by rarity */
export function getBadgesByRarity(
  rarity: BadgeVisualConfig["rarity"],
): Array<[string, BadgeVisualConfig]> {
  return Object.entries(BADGE_REGISTRY).filter(
    ([, config]) => config.rarity === rarity,
  );
}

/**
 * Rarity → CSS border/glow config for rendering
 */
export const RARITY_EFFECTS: Record<
  BadgeVisualConfig["rarity"],
  {
    borderWidth: number;
    glowColor: string;
    glowIntensity: number;
  }
> = {
  common: { borderWidth: 1, glowColor: "transparent", glowIntensity: 0 },
  uncommon: {
    borderWidth: 1.5,
    glowColor: "rgba(76, 175, 80, 0.3)",
    glowIntensity: 4,
  },
  rare: {
    borderWidth: 2,
    glowColor: "rgba(33, 150, 243, 0.4)",
    glowIntensity: 8,
  },
  epic: {
    borderWidth: 2.5,
    glowColor: "rgba(156, 39, 176, 0.5)",
    glowIntensity: 12,
  },
  legendary: {
    borderWidth: 3,
    glowColor: "rgba(255, 193, 7, 0.6)",
    glowIntensity: 16,
  },
};
