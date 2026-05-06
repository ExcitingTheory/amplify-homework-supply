/**
 * Anti-Badge Registry — Sardonic, 4th-wall-breaking badges of shame.
 *
 * These are the "achievements" nobody asked for: punishments wrapped in
 * glitter, educational puns taken too far, and pointed commentary on
 * the very concept of gamifying homework.
 *
 * Each anti-badge comes with a **debuff** — a whimsical, mostly-harmless
 * penalty that makes earning them memorably funny rather than demoralizing.
 *
 * @module antiBadgeRegistry
 */

import type { IconType } from "react-icons";
import {
  GiSnail,
  GiSleepy,
  GiEmptyHourglass,
  GiBrokenShield,
  GiBrokenHeart,
  GiGhost,
  GiJesterHat,
  GiTombstone,
  GiClown,
  GiTiredEye,
  GiAlarmClock,
  GiSlime,
  GiTrashCan,
  GiCage,
  GiBrokenBone,
  GiTransparentSlime,
  GiSpikedSnail,
  GiDeadEye,
  GiBirdCage,
  GiPrisoner,
  GiBoxTrap,
  GiCoffin,
  GiDungeonGate,
  GiEarthWorm,
  GiWorms,
  GiAnvil,
  GiSpottedMushroom,
  GiCuckooClock,
  GiTurtle,
  GiStabbedNote,
  GiBugNet,
} from "react-icons/gi";

import type {
  BadgeVisualConfig,
  BadgeShape,
  BadgeGradient,
  BadgeAnimationPreset,
} from "./badgeRegistry";

// ============================================================================
// Types
// ============================================================================

/** A debuff penalty applied when an anti-badge is earned */
export interface BadgeDebuff {
  /** XP multiplier < 1 (e.g. 0.5 = half XP). Stacks with other effects. */
  xpMultiplier?: number;
  /** Duration of XP penalty in hours (0 = until next session) */
  xpMultiplierDurationHours?: number;
  /** Streak freeze tokens REMOVED (negative freezes) */
  streakFreezesRemoved?: number;
  /** Temporary avatar style downgrade ('simple' forces the basic avatar) */
  avatarDowngrade?: "simple";
  /** Cosmetic-only: flavour text shown on the student's profile */
  shameText?: string;
  /** Cosmetic-only: force a temporary title/flair next to the student's name */
  temporaryTitle?: string;
  /** Duration of cosmetic effects in hours (default 24) */
  cosmeticDurationHours?: number;
  /** Number of extra practice drills assigned as "community service" */
  extraDrills?: number;
  /** Leaderboard visibility: temporarily hides student's rank */
  hideFromLeaderboard?: boolean;
  /** Duration of leaderboard hiding in hours */
  hideFromLeaderboardHours?: number;
}

/** Full anti-badge configuration */
export interface AntiBadgeConfig extends BadgeVisualConfig {
  /** Anti-badges are always in the 'anti' category */
  category: "anti";
  /** The debuff applied when this badge is "awarded" */
  debuff: BadgeDebuff;
  /** Whether this badge can be cleared by performing a redemption action */
  redeemable?: boolean;
  /** Description of how to clear/redeem this badge */
  redemptionHint?: string;
  /** Machine-evaluatable redemption condition (auto-redeems when met) */
  redemptionCondition?: RedemptionCondition;
}

// ============================================================================
// Redemption Condition Types
// ============================================================================

export type RedemptionConditionType =
  | "CONSECUTIVE_ON_TIME"
  | "LOGIN_STREAK"
  | "COMPLETE_ASSIGNMENT"
  | "ACCURACY_ABOVE"
  | "ACTIVITY_COUNT"
  | "BUILD_STREAK"
  | "SUBMIT_ANY"
  | "EARN_XP"
  | "COMPLETE_DRILLS"
  | "WAIT_PERIOD"
  | "SCORE_ON_TOPIC";

export interface RedemptionCondition {
  /** The type of condition to check */
  type: RedemptionConditionType;
  /** Number required (e.g. 3 on-time submissions, 7-day streak, 100 XP) */
  count?: number;
  /** Percentage threshold (for ACCURACY_ABOVE, SCORE_ON_TOPIC) */
  percent?: number;
  /** Hours to wait (for WAIT_PERIOD) */
  hours?: number;
  /** Period constraint: 'day' | 'week' (for ACTIVITY_COUNT) */
  period?: "day" | "week";
}

// ============================================================================
// Anti-Badge Registry
// ============================================================================

export const ANTI_BADGE_REGISTRY: Record<string, AntiBadgeConfig> = {
  // ── The Classics: Late & Missing Work ─────────────────────────────────

  FASHIONABLY_LATE: {
    icon: GiSnail,
    name: "Fashionably Late",
    description:
      "Submitted homework so late it arrived in a different academic calendar.",
    bgColor: "#795548",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#a1887f", position: "0%" },
        { color: "#3e2723", position: "100%" },
      ],
    },
    iconColor: "#ffcc80",
    shape: "circle",
    animation: "draw",
    hoverAnimation: "pulse",
    rarity: "common",
    category: "anti",
    debuff: {
      xpMultiplier: 0.75,
      xpMultiplierDurationHours: 12,
      temporaryTitle: "⏰ Fashionably Late",
      cosmeticDurationHours: 24,
      shameText: "Time is a social construct, but due dates are not.",
    },
    redeemable: true,
    redemptionHint:
      "Submit your next 3 assignments on time to clear this badge.",
    redemptionCondition: { type: "CONSECUTIVE_ON_TIME", count: 3 },
  },

  THE_GHOST: {
    icon: GiGhost,
    name: "The Ghost",
    description:
      "Vanished from the platform for so long we filed a missing persons report.",
    bgColor: "#455a64",
    gradient: {
      type: "radial",
      stops: [
        { color: "#78909c", position: "0%" },
        { color: "#263238", position: "100%" },
      ],
    },
    iconColor: "#b0bec5",
    shape: "hexagon",
    animation: "pulse",
    hoverAnimation: "shake",
    rarity: "uncommon",
    category: "anti",
    debuff: {
      streakFreezesRemoved: 1,
      temporaryTitle: "👻 The Ghost",
      cosmeticDurationHours: 48,
      shameText:
        "They say if you whisper their username three times, they still won't log in.",
    },
    redeemable: true,
    redemptionHint: "Log in for 3 consecutive days to exorcise this badge.",
    redemptionCondition: { type: "LOGIN_STREAK", count: 3 },
  },

  HOMEWORK_ATE_MY_DOG: {
    icon: GiEarthWorm,
    name: "Homework Ate My Dog",
    description:
      "The excuse was so creative it deserved its own grade. The homework did not.",
    bgColor: "#e65100",
    gradient: {
      type: "linear",
      angle: "180deg",
      stops: [
        { color: "#ff9800", position: "0%" },
        { color: "#bf360c", position: "100%" },
      ],
    },
    iconColor: "#fff3e0",
    shape: "shield",
    animation: "bounce-in",
    hoverAnimation: "shake",
    rarity: "uncommon",
    category: "anti",
    debuff: {
      extraDrills: 1,
      temporaryTitle: "🐕 My Dog Ate My Excuse",
      cosmeticDurationHours: 24,
      shameText: "Plot twist: the homework ate the dog.",
    },
    redeemable: true,
    redemptionHint: "Complete the missing assignment to adopt a new excuse.",
    redemptionCondition: { type: "COMPLETE_ASSIGNMENT" },
  },

  // ── Academic Misadventures ────────────────────────────────────────────

  SPEED_RUN_SCHOLAR: {
    icon: GiAlarmClock,
    name: "Speed Run Scholar",
    description:
      "Completed a quiz in under 30 seconds. Either a genius or a very fast guesser.",
    bgColor: "#f44336",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#e57373", position: "0%" },
        { color: "#b71c1c", position: "100%" },
      ],
    },
    iconColor: "#ffcdd2",
    shape: "diamond",
    animation: "spin-in",
    hoverAnimation: "shake",
    rarity: "rare",
    category: "anti",
    debuff: {
      xpMultiplier: 0.5,
      xpMultiplierDurationHours: 6,
      temporaryTitle: "⚡ Speed Run Scholar",
      cosmeticDurationHours: 12,
      shameText: "Any% homework speedrun, no glitches (but also no reading).",
    },
    redeemable: true,
    redemptionHint: "Retake the quiz spending at least 2 minutes per question.",
    redemptionCondition: { type: "SUBMIT_ANY" },
  },

  CONSISTENTLY_WRONG: {
    icon: GiBrokenBone,
    name: "Consistently Wrong",
    description:
      "Got the same question wrong 5 times. At this point it's a commitment.",
    bgColor: "#880e4f",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#f48fb1", position: "0%" },
        { color: "#4a0028", position: "100%" },
      ],
    },
    iconColor: "#fce4ec",
    shape: "circle",
    animation: "shake",
    hoverAnimation: "shake",
    rarity: "uncommon",
    category: "anti",
    debuff: {
      extraDrills: 2,
      temporaryTitle: "🔄 Consistently Wrong™",
      cosmeticDurationHours: 24,
      shameText:
        "Wrong answers given with such confidence they almost became right.",
    },
    redeemable: true,
    redemptionHint:
      "Get the question right once. Just once. We believe in you.",
    redemptionCondition: { type: "ACCURACY_ABOVE", percent: 50 },
  },

  COPY_PASTE_CONNOISSEUR: {
    icon: GiStabbedNote,
    name: "Copy-Paste Connoisseur",
    description:
      "Submitted an answer that was suspiciously identical to the question prompt.",
    bgColor: "#37474f",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#607d8b", position: "0%" },
        { color: "#102027", position: "100%" },
      ],
    },
    iconColor: "#90a4ae",
    shape: "hexagon",
    animation: "draw",
    hoverAnimation: "pulse",
    rarity: "rare",
    category: "anti",
    debuff: {
      xpMultiplier: 0.25,
      xpMultiplierDurationHours: 24,
      avatarDowngrade: "simple",
      temporaryTitle: "📋 Ctrl+C Ctrl+V",
      cosmeticDurationHours: 48,
      shameText: '"I wrote this myself" — narrator: they did not.',
    },
    redeemable: true,
    redemptionHint: "Submit an original answer of at least 100 words.",
    redemptionCondition: { type: "SUBMIT_ANY" },
  },

  // ── Meta & 4th Wall Breaking ──────────────────────────────────────────

  BADGE_COLLECTOR_ANONYMOUS: {
    icon: GiBirdCage,
    name: "Badge Collector Anonymous",
    description:
      "You earned this badge for caring too much about badges. The irony is the reward.",
    bgColor: "#6a1b9a",
    gradient: {
      type: "radial",
      stops: [
        { color: "#ce93d8", position: "0%" },
        { color: "#38006b", position: "100%" },
      ],
    },
    iconColor: "#e1bee7",
    shape: "diamond",
    animation: "spin-in",
    hoverAnimation: "glow",
    rarity: "epic",
    category: "anti",
    debuff: {
      temporaryTitle: "🏅 Badge Addict",
      cosmeticDurationHours: 72,
      shameText:
        "Congratulations! You have earned a badge about earning badges. This is what peak gamification looks like.",
      hideFromLeaderboard: true,
      hideFromLeaderboardHours: 1,
    },
    redeemable: false,
  },

  GAMIFICATION_VICTIM: {
    icon: GiBoxTrap,
    name: "Gamification Victim",
    description:
      "You noticed you're being manipulated by points and still can't stop. Welcome.",
    bgColor: "#1a237e",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#3f51b5", position: "0%" },
        { color: "#0d0d3b", position: "100%" },
      ],
    },
    iconColor: "#c5cae9",
    shape: "hexagon",
    animation: "bounce-in",
    hoverAnimation: "shake",
    rarity: "legendary",
    category: "anti",
    debuff: {
      temporaryTitle: "🎮 Willing Participant",
      cosmeticDurationHours: 168,
      shameText:
        "B.F. Skinner would be proud. You are the pigeon. The XP is the pellet. Keep pecking.",
    },
    redeemable: false,
  },

  SKINNER_BOX_RESIDENT: {
    icon: GiCage,
    name: "Skinner Box Resident",
    description:
      "Checked the leaderboard more than 20 times today. The experiment is working.",
    bgColor: "#004d40",
    gradient: {
      type: "linear",
      angle: "180deg",
      stops: [
        { color: "#009688", position: "0%" },
        { color: "#001a14", position: "100%" },
      ],
    },
    iconColor: "#80cbc4",
    shape: "circle",
    animation: "pulse",
    hoverAnimation: "glow",
    rarity: "rare",
    category: "anti",
    debuff: {
      hideFromLeaderboard: true,
      hideFromLeaderboardHours: 6,
      temporaryTitle: "🐀 Lab Rat",
      cosmeticDurationHours: 24,
      shameText:
        "Variable-ratio reinforcement schedule applied successfully. Subject shows no signs of stopping.",
    },
    redeemable: true,
    redemptionHint: "Don't check the leaderboard for 24 hours. We dare you.",
    redemptionCondition: { type: "WAIT_PERIOD", hours: 24 },
  },

  // ── Educational Puns ──────────────────────────────────────────────────

  PARTICIPATION_ATROPHY: {
    icon: GiTiredEye,
    name: "Participation Atrophy",
    description:
      "Your participation has atrophied to the point where your avatar started yawning.",
    bgColor: "#5d4037",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#8d6e63", position: "0%" },
        { color: "#321911", position: "100%" },
      ],
    },
    iconColor: "#d7ccc8",
    shape: "circle",
    animation: "draw",
    hoverAnimation: "pulse",
    rarity: "common",
    category: "anti",
    debuff: {
      xpMultiplier: 0.8,
      xpMultiplierDurationHours: 48,
      avatarDowngrade: "simple",
      temporaryTitle: "💤 Participation Atrophy",
      cosmeticDurationHours: 48,
      shameText: "Your muscles aren't the only things you haven't exercised.",
    },
    redeemable: true,
    redemptionHint: "Complete 3 activities in a single day to rehabilitate.",
    redemptionCondition: { type: "ACTIVITY_COUNT", count: 3, period: "day" },
  },

  PROCRASTINATION_STATION: {
    icon: GiSleepy,
    name: "Procrastination Station",
    description:
      "Opened the assignment page 12 times without submitting. The buffer state of homework.",
    bgColor: "#1565c0",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#42a5f5", position: "0%" },
        { color: "#0a3069", position: "100%" },
      ],
    },
    iconColor: "#bbdefb",
    shape: "hexagon",
    animation: "pulse",
    hoverAnimation: "shake",
    rarity: "common",
    category: "anti",
    debuff: {
      temporaryTitle: "🚂 All Aboard the Procrastination Station",
      cosmeticDurationHours: 24,
      shameText:
        "You have earned a PhD in Looking At The Assignment Without Doing The Assignment.",
    },
    redeemable: true,
    redemptionHint: "Just... submit something. Anything. Please.",
    redemptionCondition: { type: "SUBMIT_ANY" },
  },

  SYLLABUS_SAYS_NO: {
    icon: GiDungeonGate,
    name: "Syllabus Says No",
    description:
      "Asked a question that was clearly answered on page 1 of the syllabus.",
    bgColor: "#b71c1c",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#ef5350", position: "0%" },
        { color: "#560027", position: "100%" },
      ],
    },
    iconColor: "#ffcdd2",
    shape: "shield",
    animation: "bounce-in",
    hoverAnimation: "shake",
    rarity: "uncommon",
    category: "anti",
    debuff: {
      extraDrills: 1,
      temporaryTitle: "📖 Did You Read The Syllabus?",
      cosmeticDurationHours: 24,
      shameText:
        "The syllabus weeps. It was all there. Page one. Bold. Underlined. Highlighted.",
    },
    redeemable: true,
    redemptionHint: "Read the syllabus. (We'll know.)",
    redemptionCondition: { type: "SUBMIT_ANY" },
  },

  EXTRA_CREDIT_JUNKIE: {
    icon: GiSpikedSnail,
    name: "Extra Credit Junkie",
    description:
      "Requested extra credit before completing the regular credit. The audacity.",
    bgColor: "#ff6f00",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#ffb74d", position: "0%" },
        { color: "#e65100", position: "100%" },
      ],
    },
    iconColor: "#fff8e1",
    shape: "circle",
    animation: "bounce-in",
    hoverAnimation: "pulse",
    rarity: "uncommon",
    category: "anti",
    debuff: {
      xpMultiplier: 0.9,
      xpMultiplierDurationHours: 24,
      temporaryTitle: "✨ Extra Credit Enthusiast",
      cosmeticDurationHours: 48,
      shameText:
        "Asking for extra credit is the academic equivalent of asking for dessert before dinner.",
    },
    redeemable: true,
    redemptionHint: "Complete all regular assignments first. Then we'll talk.",
    redemptionCondition: { type: "COMPLETE_ASSIGNMENT" },
  },

  // ── Making Fun of EdTech ──────────────────────────────────────────────

  ENGAGEMENT_METRICS: {
    icon: GiCuckooClock,
    name: "Engagement Metrics!",
    description:
      "Congratulations! Your 'time on platform' metric went up because you left the tab open overnight.",
    bgColor: "#00695c",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#26a69a", position: "0%" },
        { color: "#002f29", position: "100%" },
      ],
    },
    iconColor: "#b2dfdb",
    shape: "hexagon",
    animation: "spin-in",
    hoverAnimation: "pulse",
    rarity: "rare",
    category: "anti",
    debuff: {
      temporaryTitle: "📊 Metric Manipulator",
      cosmeticDurationHours: 24,
      shameText:
        "You boosted our engagement metrics! The investors will be thrilled. Learning? That's a different metric.",
    },
    redeemable: false,
  },

  AI_WHISPERER_ZERO: {
    icon: GiSlime,
    name: "AI Whisperer Zero",
    description:
      "Asked the AI tutor to do your homework for you. It said no. Even the robot judges you.",
    bgColor: "#4e342e",
    gradient: {
      type: "radial",
      stops: [
        { color: "#8d6e63", position: "0%" },
        { color: "#1b0e08", position: "100%" },
      ],
    },
    iconColor: "#a5d6a7",
    shape: "circle",
    animation: "draw",
    hoverAnimation: "shake",
    rarity: "rare",
    category: "anti",
    debuff: {
      xpMultiplier: 0.5,
      xpMultiplierDurationHours: 12,
      temporaryTitle: "🤖 Rejected by AI",
      cosmeticDurationHours: 24,
      shameText: "Even ChatGPT has boundaries. You found them.",
    },
    redeemable: true,
    redemptionHint: "Have a genuine learning conversation with the AI tutor.",
    redemptionCondition: { type: "SUBMIT_ANY" },
  },

  ACHIEVEMENT_UNLOCKED_UNLOCKED: {
    icon: GiJesterHat,
    name: "Achievement Unlocked: Unlocked",
    description:
      "You unlocked the achievement for unlocking achievements. We need to go deeper.",
    bgColor: "#ad1457",
    gradient: {
      type: "radial",
      stops: [
        { color: "#f06292", position: "0%" },
        { color: "#6a0034", position: "100%" },
      ],
    },
    iconColor: "#fce4ec",
    shape: "diamond",
    animation: "spin-in",
    hoverAnimation: "glow",
    rarity: "legendary",
    category: "anti",
    debuff: {
      temporaryTitle: "🎭 Meta Achievement Haver",
      cosmeticDurationHours: 168,
      shameText:
        "You are now 4 layers deep in gamification irony. There is no going back. The badges are watching.",
    },
    redeemable: false,
  },

  // ── Streak & Attendance Shame ─────────────────────────────────────────

  STREAK_BREAKER: {
    icon: GiBrokenShield,
    name: "Streak Breaker",
    description:
      "Broke a 14+ day streak. All those consecutive days, gone like tears in rain.",
    bgColor: "#263238",
    gradient: {
      type: "linear",
      angle: "180deg",
      stops: [
        { color: "#546e7a", position: "0%" },
        { color: "#000a12", position: "100%" },
      ],
    },
    iconColor: "#78909c",
    shape: "shield",
    animation: "shake",
    hoverAnimation: "pulse",
    rarity: "epic",
    category: "anti",
    debuff: {
      streakFreezesRemoved: 2,
      xpMultiplier: 0.7,
      xpMultiplierDurationHours: 48,
      temporaryTitle: "💔 Streak Breaker",
      cosmeticDurationHours: 48,
      shameText:
        "14 days of dedication, shattered. Your streak didn't die — it was murdered.",
    },
    redeemable: true,
    redemptionHint: "Build a new 7-day streak to earn forgiveness.",
    redemptionCondition: { type: "BUILD_STREAK", count: 7 },
  },

  GRAVEYARD_SHIFT: {
    icon: GiTombstone,
    name: "Graveyard Shift",
    description:
      "Submitted homework at 3 AM. The learning was questionable. The dedication was not.",
    bgColor: "#1a1a2e",
    gradient: {
      type: "linear",
      angle: "180deg",
      stops: [
        { color: "#16213e", position: "0%" },
        { color: "#0f0f1a", position: "100%" },
      ],
    },
    iconColor: "#a0a0b0",
    shape: "hexagon",
    animation: "draw",
    hoverAnimation: "glow",
    rarity: "common",
    category: "anti",
    debuff: {
      temporaryTitle: "🌙 Night Owl (Derogatory)",
      cosmeticDurationHours: 24,
      shameText: "Nothing good happens after 2 AM. Especially homework.",
    },
    redeemable: false,
  },

  // ── School-Specific Trouble ───────────────────────────────────────────

  DIGITAL_DETENTION: {
    icon: GiPrisoner,
    name: "Digital Detention",
    description:
      "Your behavior in the chat has earned you the world's first virtual detention.",
    bgColor: "#4a148c",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#7b1fa2", position: "0%" },
        { color: "#12005e", position: "100%" },
      ],
    },
    iconColor: "#e1bee7",
    shape: "shield",
    animation: "bounce-in",
    hoverAnimation: "shake",
    rarity: "epic",
    category: "anti",
    debuff: {
      hideFromLeaderboard: true,
      hideFromLeaderboardHours: 24,
      xpMultiplier: 0.5,
      xpMultiplierDurationHours: 24,
      temporaryTitle: "🔒 In Detention",
      cosmeticDurationHours: 24,
      shameText:
        "You will sit here and think about what you've done. Digitally.",
      extraDrills: 3,
    },
    redeemable: true,
    redemptionHint: "Complete your 3 community service drills to earn release.",
    redemptionCondition: { type: "COMPLETE_DRILLS", count: 3 },
  },

  THE_GREAT_DISCONNECT: {
    icon: GiBrokenHeart,
    name: "The Great Disconnect",
    description:
      "Closed the browser tab during a timed quiz. Brave. Foolish. But brave.",
    bgColor: "#c62828",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#ef5350", position: "0%" },
        { color: "#7f0000", position: "100%" },
      ],
    },
    iconColor: "#ffcdd2",
    shape: "diamond",
    animation: "shake",
    hoverAnimation: "pulse",
    rarity: "uncommon",
    category: "anti",
    debuff: {
      xpMultiplier: 0.6,
      xpMultiplierDurationHours: 12,
      temporaryTitle: "🔌 The Disconnector",
      cosmeticDurationHours: 24,
      shameText:
        '"My internet went out" — your internet, under oath, testifies otherwise.',
    },
    redeemable: true,
    redemptionHint:
      "Complete a quiz from start to finish without any... interruptions.",
    redemptionCondition: { type: "COMPLETE_ASSIGNMENT" },
  },

  LOREM_IPSUM_LAUREATE: {
    icon: GiWorms,
    name: "Lorem Ipsum Laureate",
    description:
      "Submitted placeholder text as a final answer. Bold strategy, Cotton.",
    bgColor: "#2e7d32",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#66bb6a", position: "0%" },
        { color: "#1b3e1f", position: "100%" },
      ],
    },
    iconColor: "#c8e6c9",
    shape: "hexagon",
    animation: "draw",
    hoverAnimation: "shake",
    rarity: "rare",
    category: "anti",
    debuff: {
      xpMultiplier: 0.3,
      xpMultiplierDurationHours: 24,
      avatarDowngrade: "simple",
      temporaryTitle: "📝 Lorem Ipsum Dolor Sit Amet",
      cosmeticDurationHours: 48,
      shameText:
        "Consectetur adipiscing elit. Sed do eiusmod tempor incididunt. See? We can do it too.",
    },
    redeemable: true,
    redemptionHint:
      "Replace Lorem Ipsum with actual words. In your language. About the topic.",
    redemptionCondition: { type: "SUBMIT_ANY" },
  },

  // ── Gamification Self-Awareness ───────────────────────────────────────

  NOTIFICATION_JUNKIE: {
    icon: GiClown,
    name: "Notification Junkie",
    description:
      "Clicked on every single notification within 5 seconds of it appearing. Pavlov sends his regards.",
    bgColor: "#d84315",
    gradient: {
      type: "radial",
      stops: [
        { color: "#ff8a65", position: "0%" },
        { color: "#801a00", position: "100%" },
      ],
    },
    iconColor: "#fbe9e7",
    shape: "circle",
    animation: "bounce-in",
    hoverAnimation: "shake",
    rarity: "uncommon",
    category: "anti",
    debuff: {
      temporaryTitle: "🔔 Ding Ding Ding",
      cosmeticDurationHours: 24,
      shameText:
        "You hear a notification sound. Your pupils dilate. You click. There is no new content. You wait.",
    },
    redeemable: false,
  },

  XP_ZERO_HERO: {
    icon: GiCoffin,
    name: "XP: Zero Hero",
    description:
      "Completed an entire session and earned exactly 0 XP. A statistical anomaly. A legend.",
    bgColor: "#212121",
    gradient: {
      type: "linear",
      angle: "180deg",
      stops: [
        { color: "#424242", position: "0%" },
        { color: "#000000", position: "100%" },
      ],
    },
    iconColor: "#757575",
    shape: "shield",
    animation: "draw",
    hoverAnimation: "glow",
    rarity: "legendary",
    category: "anti",
    debuff: {
      temporaryTitle: "🦸 Zero Hero",
      cosmeticDurationHours: 72,
      shameText:
        "In a system designed to give you points for breathing near homework, you earned none. Respect.",
    },
    redeemable: true,
    redemptionHint:
      "Earn any amount of XP. Literally any. One point. We beg you.",
    redemptionCondition: { type: "EARN_XP", count: 1 },
  },

  DUNNING_KRUGER_AWARD: {
    icon: GiSpottedMushroom,
    name: "Dunning-Kruger Award",
    description:
      "Rated your confidence as 'Expert' on a topic you scored 20% on. Peak human condition.",
    bgColor: "#f57f17",
    gradient: {
      type: "radial",
      stops: [
        { color: "#ffee58", position: "0%" },
        { color: "#f57f17", position: "50%" },
        { color: "#8c5100", position: "100%" },
      ],
    },
    iconColor: "#fff9c4",
    shape: "diamond",
    animation: "bounce-in",
    hoverAnimation: "glow",
    rarity: "epic",
    category: "anti",
    debuff: {
      xpMultiplier: 0.6,
      xpMultiplierDurationHours: 24,
      temporaryTitle: "🍄 Confidently Incorrect",
      cosmeticDurationHours: 48,
      shameText:
        "Mount Stupid has a new summit. Plant your flag. You've earned it.",
    },
    redeemable: true,
    redemptionHint:
      "Score 80%+ on the same topic to descend from Mount Stupid.",
    redemptionCondition: { type: "SCORE_ON_TOPIC", percent: 80 },
  },

  THE_TUTORIAL_SKIPPER: {
    icon: GiDeadEye,
    name: "The Tutorial Skipper",
    description:
      "Skipped every tutorial, help text, and instruction. Then asked how everything works.",
    bgColor: "#311b92",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#5c6bc0", position: "0%" },
        { color: "#0c0040", position: "100%" },
      ],
    },
    iconColor: "#c5cae9",
    shape: "circle",
    animation: "draw",
    hoverAnimation: "shake",
    rarity: "common",
    category: "anti",
    debuff: {
      extraDrills: 1,
      temporaryTitle: "⏩ TLDR Enthusiast",
      cosmeticDurationHours: 24,
      shameText:
        "Instructions? Where we're going, we don't need instructions. (You do. You really do.)",
    },
    redeemable: true,
    redemptionHint: "Complete the tutorial. The whole thing. Yes, all of it.",
    redemptionCondition: { type: "COMPLETE_ASSIGNMENT" },
  },

  INFINITE_LOOP_LEARNER: {
    icon: GiTurtle,
    name: "Infinite Loop Learner",
    description:
      "Watched the same lesson video 10+ times without attempting the practice. Loading...",
    bgColor: "#0d47a1",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#1976d2", position: "0%" },
        { color: "#051e3e", position: "100%" },
      ],
    },
    iconColor: "#bbdefb",
    shape: "hexagon",
    animation: "pulse",
    hoverAnimation: "spin-in",
    rarity: "uncommon",
    category: "anti",
    debuff: {
      temporaryTitle: "🔁 while(true) { watch(); }",
      cosmeticDurationHours: 24,
      shameText:
        "Watching ≠ learning. We checked. There's a whole field of research about this.",
    },
    redeemable: true,
    redemptionHint:
      "Attempt the practice activity. The video will still be there, we promise.",
    redemptionCondition: { type: "SUBMIT_ANY" },
  },

  MINIMALLY_VIABLE_STUDENT: {
    icon: GiAnvil,
    name: "Minimally Viable Student",
    description:
      "Consistently submits work that meets exactly 0.01% above the minimum threshold. An optimization marvel.",
    bgColor: "#546e7a",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#78909c", position: "0%" },
        { color: "#1c313a", position: "100%" },
      ],
    },
    iconColor: "#cfd8dc",
    shape: "shield",
    animation: "draw",
    hoverAnimation: "pulse",
    rarity: "rare",
    category: "anti",
    debuff: {
      xpMultiplier: 0.85,
      xpMultiplierDurationHours: 48,
      temporaryTitle: "📉 MVP (Minimum Viable Participant)",
      cosmeticDurationHours: 48,
      shameText:
        "You found the exact minimum effort threshold. Engineers call this optimization. Teachers call it something else.",
    },
    redeemable: true,
    redemptionHint:
      "Score above 90% on any assignment to prove the minimum isn't your maximum.",
    redemptionCondition: { type: "ACCURACY_ABOVE", percent: 90 },
  },

  EMPTY_CANVAS_ARTIST: {
    icon: GiTransparentSlime,
    name: "Empty Canvas Artist",
    description:
      "Submitted a completely blank response. It's not modern art. It's just blank.",
    bgColor: "#e0e0e0",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#fafafa", position: "0%" },
        { color: "#9e9e9e", position: "100%" },
      ],
    },
    iconColor: "#bdbdbd",
    shape: "circle",
    animation: "draw",
    hoverAnimation: "pulse",
    rarity: "common",
    category: "anti",
    debuff: {
      xpMultiplier: 0,
      xpMultiplierDurationHours: 6,
      temporaryTitle: '🎨 " "',
      cosmeticDurationHours: 12,
      shameText:
        "John Cage had 4'33\". You have 0 characters. Equally avant-garde. Equally ungraded.",
    },
    redeemable: true,
    redemptionHint:
      "Submit literally anything. A haiku. A grocery list. Just not nothing.",
    redemptionCondition: { type: "SUBMIT_ANY" },
  },

  BUG_REPORT_OR_EXCUSE: {
    icon: GiBugNet,
    name: "Bug Report or Excuse?",
    description:
      "Filed a 'bug report' that suspiciously coincided with a deadline. The platform worked fine for everyone else.",
    bgColor: "#1b5e20",
    gradient: {
      type: "linear",
      angle: "135deg",
      stops: [
        { color: "#43a047", position: "0%" },
        { color: "#0a2e0f", position: "100%" },
      ],
    },
    iconColor: "#a5d6a7",
    shape: "hexagon",
    animation: "bounce-in",
    hoverAnimation: "shake",
    rarity: "uncommon",
    category: "anti",
    debuff: {
      temporaryTitle: "🐛 QA Specialist (Self-Appointed)",
      cosmeticDurationHours: 24,
      shameText:
        "Steps to reproduce: 1) Have assignment due. 2) Don't do assignment. 3) Report 'bug'.",
    },
    redeemable: true,
    redemptionHint:
      "Submit the assignment and the 'bug' will mysteriously resolve itself.",
    redemptionCondition: { type: "SUBMIT_ANY" },
  },
};

// ============================================================================
// Helpers
// ============================================================================

/** Get all anti-badge types */
export function getAllAntiBadgeTypes(): string[] {
  return Object.keys(ANTI_BADGE_REGISTRY);
}

/** Get anti-badge config by type */
export function getAntiBadgeConfig(
  badgeType: string,
): AntiBadgeConfig | undefined {
  return ANTI_BADGE_REGISTRY[badgeType];
}

/** Get only redeemable anti-badges */
export function getRedeemableAntiBadges(): Array<[string, AntiBadgeConfig]> {
  return Object.entries(ANTI_BADGE_REGISTRY).filter(
    ([, config]) => config.redeemable,
  );
}

/** Get anti-badges by rarity */
export function getAntiBadgesByRarity(
  rarity: BadgeVisualConfig["rarity"],
): Array<[string, AntiBadgeConfig]> {
  return Object.entries(ANTI_BADGE_REGISTRY).filter(
    ([, config]) => config.rarity === rarity,
  );
}
