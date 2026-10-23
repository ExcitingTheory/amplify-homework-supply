/**
 * BadgeEditor — Instructor UI for customizing badge criteria.
 *
 * Shows all hardcoded badges with their current event trigger and threshold,
 * and allows creating custom badges from available events.
 *
 * @module BadgeEditor
 */

import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Slider from "@mui/material/Slider";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Collapse from "@mui/material/Collapse";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import PaletteIcon from "@mui/icons-material/Palette";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import { BadgeIcon } from "./BadgeIcon";
import { BADGE_REGISTRY, type BadgeVisualConfig } from "./badgeRegistry";
import { BadgeVisualPicker, resolveIcon } from "./BadgeVisualPicker";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AIBadgeDesigner from "./AIBadgeDesigner";
import { useTranslations } from "next-intl";

// ============================================================================
// Constants — available XP events that can trigger badges
// ============================================================================

export const BADGE_EVENTS = [
  { value: "HOMEWORK_SUBMITTED", label: "Homework Submitted" },
  { value: "AI_FEEDBACK_REVISED", label: "AI Feedback Revised" },
  { value: "ON_TIME_SUBMISSION", label: "On-Time Submission" },
  { value: "PERFECT_SCORE", label: "Perfect Score" },
  { value: "STREAK_7DAY", label: "7-Day Streak" },
  { value: "STREAK_14DAY", label: "14-Day Streak" },
  { value: "STREAK_30DAY", label: "30-Day Streak" },
  { value: "PEER_REVIEW_GIVEN", label: "Peer Review Given" },
  { value: "PRACTICE_DRILL_COMPLETED", label: "Practice Drill Completed" },
  { value: "COMEBACK", label: "Comeback (streak resumed)" },
  { value: "EASTER_EGG", label: "Easter Egg Found" },
  { value: "NAILED_IT", label: "Nailed It (100% accuracy)" },
  { value: "PEER_REVIEW_HOSTED", label: "Peer Review Hosted" },
  {
    value: "PEER_REVIEW_TOP_REVIEWER",
    label: "Peer Review Top Reviewer (bonus XP)",
  },
  { value: "PRACTICE_DRILL_ACCURACY_BONUS", label: "Drill Accuracy Bonus" },
  { value: "STREAK_3DAY", label: "3-Day Streak" },
] as const;

export type BadgeEventType = (typeof BADGE_EVENTS)[number]["value"];

export const RARITY_OPTIONS: BadgeVisualConfig["rarity"][] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

/**
 * Default criteria for hardcoded badges.
 * Maps badge type → { event, threshold, comparator }
 */
export const DEFAULT_BADGE_CRITERIA: Record<
  string,
  { event: string; threshold: number; comparator: "gte" | "any" | "xp_gte" }
> = {
  FIRST_SUBMISSION: {
    event: "HOMEWORK_SUBMITTED",
    threshold: 1,
    comparator: "any",
  },
  GOOD_EYE: { event: "AI_FEEDBACK_REVISED", threshold: 1, comparator: "any" },
  QUICK_DRAW: { event: "ON_TIME_SUBMISSION", threshold: 1, comparator: "any" },
  SHARPSHOOTER: { event: "PERFECT_SCORE", threshold: 3, comparator: "gte" },
  CONSISTENT: { event: "STREAK_7DAY", threshold: 1, comparator: "any" },
  TEAM_PLAYER: { event: "PEER_REVIEW_GIVEN", threshold: 3, comparator: "gte" },
  DEEP_THINKER: {
    event: "AI_FEEDBACK_REVISED",
    threshold: 5,
    comparator: "gte",
  },
  TOP_OF_CLASS: { event: "", threshold: 500, comparator: "xp_gte" },
  PERFECTIONIST: { event: "PERFECT_SCORE", threshold: 5, comparator: "gte" },
  DRILL_MASTER: {
    event: "PRACTICE_DRILL_COMPLETED",
    threshold: 10,
    comparator: "gte",
  },
  COMEBACK_KID: { event: "COMEBACK", threshold: 1, comparator: "any" },
  STREAK_14: { event: "STREAK_14DAY", threshold: 1, comparator: "any" },
  STREAK_30: { event: "STREAK_30DAY", threshold: 1, comparator: "any" },
  EASTER_EGG_HUNTER: { event: "EASTER_EGG", threshold: 3, comparator: "gte" },
};

// ============================================================================
// Types
// ============================================================================

export interface BadgeOverride {
  badgeType: string;
  event?: string;
  threshold?: number;
  rarity?: BadgeVisualConfig["rarity"];
}

/** Buffs granted when a badge is earned */
export interface BadgeBuff {
  /** Temporary XP multiplier (e.g. 1.5 = +50% XP) */
  xpMultiplier?: number;
  /** Duration of XP multiplier in hours (0 = permanent) */
  xpMultiplierDurationHours?: number;
  /** Number of streak freezes awarded */
  streakFreezes?: number;
  /** Unit/content IDs that become unlocked when badge is earned */
  contentUnlockIds?: string[];
}

/** Visual configuration for a custom badge */
export interface CustomBadgeVisual {
  /** react-icons icon name (e.g. 'GiTrophy', 'FaStar') — resolved at render time */
  iconName: string;
  /** Icon library prefix (e.g. 'gi', 'fa', 'md', 'hi') */
  iconLib: string;
  /** Badge shape */
  shape: BadgeVisualConfig["shape"];
  /** Solid background color */
  bgColor: string;
  /** Optional gradient */
  gradient?: BadgeVisualConfig["gradient"];
  /** Icon color */
  iconColor: string;
  /** Animation preset */
  animation: BadgeVisualConfig["animation"];
}

export interface CustomBadge {
  id: string;
  name: string;
  description: string;
  event: string;
  threshold: number;
  rarity: BadgeVisualConfig["rarity"];
  /** Visual design (icon, shape, colors) */
  visual?: CustomBadgeVisual;
  /** Buffs granted on earning this badge */
  buffs?: BadgeBuff;
}

export interface BadgeEditorProps {
  /** Current overrides for hardcoded badges (changed thresholds, rarity, etc.) */
  overrides?: BadgeOverride[];
  /** Custom badges created by the instructor */
  customBadges?: CustomBadge[];
  /** Called when a hardcoded badge's criteria is changed */
  onOverrideChange?: (override: BadgeOverride) => void;
  /** Called when a hardcoded badge's override is reset to defaults */
  onOverrideReset?: (badgeType: string) => void;
  /** Called when a new custom badge is created */
  onAddCustomBadge?: (badge: Omit<CustomBadge, "id">) => void;
  /** Called when a custom badge is deleted */
  onDeleteCustomBadge?: (badgeId: string) => void;
}

type Translate = ReturnType<typeof useTranslations<"components">>;

function getEventLabels(t: Translate): Record<string, string> {
  return {
    HOMEWORK_SUBMITTED: t("badgeEditor.eventHomeworkSubmitted"),
    AI_FEEDBACK_REVISED: t("badgeEditor.eventAiFeedbackRevised"),
    ON_TIME_SUBMISSION: t("badgeEditor.eventOnTimeSubmission"),
    PERFECT_SCORE: t("badgeEditor.eventPerfectScore"),
    STREAK_7DAY: t("badgeEditor.eventStreak7day"),
    STREAK_14DAY: t("badgeEditor.eventStreak14day"),
    STREAK_30DAY: t("badgeEditor.eventStreak30day"),
    PEER_REVIEW_GIVEN: t("badgeEditor.eventPeerReviewGiven"),
    PRACTICE_DRILL_COMPLETED: t("badgeEditor.eventPracticeDrillCompleted"),
    COMEBACK: t("badgeEditor.eventComeback"),
    EASTER_EGG: t("badgeEditor.eventEasterEgg"),
    NAILED_IT: t("badgeEditor.eventNailedIt"),
    PEER_REVIEW_HOSTED: t("badgeEditor.eventPeerReviewHosted"),
    PEER_REVIEW_TOP_REVIEWER: t("badgeEditor.eventPeerReviewTopReviewer"),
    PRACTICE_DRILL_ACCURACY_BONUS: t(
      "badgeEditor.eventPracticeDrillAccuracyBonus",
    ),
    STREAK_3DAY: t("badgeEditor.eventStreak3day"),
  };
}

function getRarityLabels(t: Translate): Record<string, string> {
  return {
    common: t("badgeEditor.rarityCommon"),
    uncommon: t("badgeEditor.rarityUncommon"),
    rare: t("badgeEditor.rarityRare"),
    epic: t("badgeEditor.rarityEpic"),
    legendary: t("badgeEditor.rarityLegendary"),
  };
}

// ============================================================================
// Sub-components
// ============================================================================

function HardcodedBadgeRow({
  badgeType,
  config,
  defaults,
  override,
  onOverrideChange,
  onOverrideReset,
}: {
  badgeType: string;
  config: BadgeVisualConfig;
  defaults: { event: string; threshold: number; comparator: string };
  override?: BadgeOverride;
  onOverrideChange?: (override: BadgeOverride) => void;
  onOverrideReset?: (badgeType: string) => void;
}) {
  const t = useTranslations("components");
  const eventLabels = useMemo(() => getEventLabels(t), [t]);
  const rarityLabels = useMemo(() => getRarityLabels(t), [t]);
  const [expanded, setExpanded] = useState(false);
  const hasOverride = !!override;
  const currentThreshold = override?.threshold ?? defaults.threshold;
  const currentRarity = override?.rarity ?? config.rarity;

  const eventLabel = useMemo(() => {
    const ev = override?.event ?? defaults.event;
    if (!ev) return t("badgeEditor.totalXp");
    return eventLabels[ev] ?? ev;
  }, [override?.event, defaults.event, t, eventLabels]);

  const criteriaText = useMemo(() => {
    if (defaults.comparator === "xp_gte")
      return t("badgeEditor.criteriaXp", { threshold: currentThreshold });
    if (defaults.comparator === "any")
      return t("badgeEditor.criteriaAny", { event: eventLabel });
    return t("badgeEditor.criteriaCount", {
      event: eventLabel,
      threshold: currentThreshold,
    });
  }, [defaults.comparator, currentThreshold, eventLabel, t]);

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        borderColor: hasOverride ? "warning.main" : "divider",
        borderWidth: hasOverride ? 1.5 : 1,
      }}
    >
      <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <BadgeIcon badgeType={badgeType} size={36} earned animate={false} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {config.name}
              </Typography>
              {hasOverride && (
                <Chip
                  label={t("badgeEditor.modified")}
                  size="small"
                  color="warning"
                  sx={{ height: 18, fontSize: "0.6rem" }}
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {criteriaText}
            </Typography>
          </Box>
          <Chip
            label={rarityLabels[currentRarity] ?? currentRarity}
            size="small"
            variant="outlined"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              textTransform: "capitalize",
            }}
          />
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            <ExpandMoreIcon
              fontSize="small"
              sx={{
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </IconButton>
        </Stack>
        <Collapse in={expanded}>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            {defaults.comparator !== "any" && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {defaults.comparator === "xp_gte"
                    ? t("badgeEditor.xpThreshold")
                    : t("badgeEditor.eventCountRequired")}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Slider
                    size="small"
                    value={currentThreshold}
                    onChange={(_e, val) => {
                      onOverrideChange?.({
                        badgeType,
                        threshold: val as number,
                        rarity:
                          currentRarity !== config.rarity
                            ? currentRarity
                            : undefined,
                        event: override?.event,
                      });
                    }}
                    min={defaults.comparator === "xp_gte" ? 100 : 1}
                    max={defaults.comparator === "xp_gte" ? 2000 : 50}
                    step={defaults.comparator === "xp_gte" ? 50 : 1}
                    valueLabelDisplay="auto"
                    sx={{ flex: 1 }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ minWidth: 40, textAlign: "right" }}
                  >
                    {currentThreshold}
                  </Typography>
                </Stack>
              </Box>
            )}
            <FormControl size="small" fullWidth>
              <InputLabel>{t("badgeEditor.rarity")}</InputLabel>
              <Select
                value={currentRarity}
                label={t("badgeEditor.rarity")}
                onChange={(e) => {
                  onOverrideChange?.({
                    badgeType,
                    rarity: e.target.value as BadgeVisualConfig["rarity"],
                    threshold:
                      currentThreshold !== defaults.threshold
                        ? currentThreshold
                        : undefined,
                    event: override?.event,
                  });
                }}
              >
                {RARITY_OPTIONS.map((r) => (
                  <MenuItem
                    key={r}
                    value={r}
                    sx={{ textTransform: "capitalize" }}
                  >
                    {rarityLabels[r] ?? r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {hasOverride && (
              <Button
                size="small"
                variant="text"
                startIcon={<UndoIcon />}
                onClick={() => onOverrideReset?.(badgeType)}
                color="warning"
              >
                {t("badgeEditor.resetToDefault")}
              </Button>
            )}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BadgeEditor({
  overrides = [],
  customBadges = [],
  onOverrideChange,
  onOverrideReset,
  onAddCustomBadge,
  onDeleteCustomBadge,
}: BadgeEditorProps) {
  const t = useTranslations("components");
  const eventLabels = useMemo(() => getEventLabels(t), [t]);
  const rarityLabels = useMemo(() => getRarityLabels(t), [t]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAIDesigner, setShowAIDesigner] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [newThreshold, setNewThreshold] = useState(1);
  const [newRarity, setNewRarity] =
    useState<BadgeVisualConfig["rarity"]>("common");
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [showBuffEditor, setShowBuffEditor] = useState(false);
  const [newVisual, setNewVisual] = useState<CustomBadgeVisual>({
    iconName: "GiTrophy",
    iconLib: "gi",
    shape: "circle",
    bgColor: "#4caf50",
    iconColor: "#ffffff",
    animation: "draw",
  });
  const [newBuffs, setNewBuffs] = useState<BadgeBuff>({});

  const overrideMap = useMemo(
    () => new Map(overrides.map((o) => [o.badgeType, o])),
    [overrides],
  );

  // Only show badges that have criteria (exclude avatar/bot-whisperer/storybook-only)
  const editableBadges = useMemo(
    () =>
      Object.entries(DEFAULT_BADGE_CRITERIA)
        .filter(([type]) => BADGE_REGISTRY[type])
        .map(([type, criteria]) => ({
          type,
          config: BADGE_REGISTRY[type],
          criteria,
        })),
    [],
  );

  const handleCreate = () => {
    if (!newName.trim() || !newEvent) return;
    const badge: Omit<CustomBadge, "id"> = {
      name: newName.trim(),
      description: newDescription.trim(),
      event: newEvent,
      threshold: newThreshold,
      rarity: newRarity,
    };
    if (showVisualEditor) badge.visual = { ...newVisual };
    const hasBuffs =
      (newBuffs.xpMultiplier && newBuffs.xpMultiplier !== 1) ||
      (newBuffs.streakFreezes && newBuffs.streakFreezes > 0) ||
      (newBuffs.contentUnlockIds && newBuffs.contentUnlockIds.length > 0);
    if (hasBuffs) badge.buffs = { ...newBuffs };
    onAddCustomBadge?.(badge);
    // Reset form
    setNewName("");
    setNewDescription("");
    setNewEvent("");
    setNewThreshold(1);
    setNewRarity("common");
    setShowVisualEditor(false);
    setShowBuffEditor(false);
    setNewVisual({
      iconName: "GiTrophy",
      iconLib: "gi",
      shape: "circle",
      bgColor: "#4caf50",
      iconColor: "#ffffff",
      animation: "draw",
    });
    setNewBuffs({});
    setShowCreateForm(false);
  };

  return (
    <Box>
      {/* ---- Hardcoded Badge Customization ---- */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        {t("badgeEditor.badgeCriteria")}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 1.5 }}
      >
        {t("badgeEditor.badgeCriteriaDescription")}
      </Typography>
      {editableBadges.map(({ type, config, criteria }) => (
        <HardcodedBadgeRow
          key={type}
          badgeType={type}
          config={config}
          defaults={criteria}
          override={overrideMap.get(type)}
          onOverrideChange={onOverrideChange}
          onOverrideReset={onOverrideReset}
        />
      ))}

      <Divider sx={{ my: 2 }} />

      {/* ---- Custom Badges ---- */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          {t("badgeEditor.customBadges", { count: customBadges.length })}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => {
              setShowAIDesigner(!showAIDesigner);
              setShowCreateForm(false);
            }}
            color={showAIDesigner ? "secondary" : "inherit"}
          >
            {showAIDesigner
              ? t("badgeEditor.cancelAi")
              : t("badgeEditor.aiGenerate")}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setShowAIDesigner(false);
            }}
          >
            {showCreateForm
              ? t("badgeEditor.cancel")
              : t("badgeEditor.newBadge")}
          </Button>
        </Stack>
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 1.5 }}
      >
        {t("badgeEditor.customBadgesDescription")}
      </Typography>

      <Collapse in={showAIDesigner}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <AIBadgeDesigner
              onAccept={(badge) => {
                // AI designer returns name, description, rarity, visual
                // We still need an event and threshold — use sensible defaults
                onAddCustomBadge?.({
                  name: badge.name,
                  description: badge.description,
                  rarity: badge.rarity,
                  visual: badge.visual,
                  event: "HOMEWORK_SUBMITTED",
                  threshold: 1,
                });
                setShowAIDesigner(false);
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              {t("badgeEditor.aiAfterGenerating")}
            </Typography>
          </CardContent>
        </Card>
      </Collapse>

      <Collapse in={showCreateForm}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label={t("badgeEditor.badgeName")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("badgeEditor.badgeNamePlaceholder")}
                fullWidth
              />
              <TextField
                size="small"
                label={t("badgeEditor.description")}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t("badgeEditor.descriptionPlaceholder")}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>{t("badgeEditor.triggerEvent")}</InputLabel>
                <Select
                  value={newEvent}
                  label={t("badgeEditor.triggerEvent")}
                  onChange={(e) => setNewEvent(e.target.value)}
                >
                  {BADGE_EVENTS.map((ev) => (
                    <MenuItem key={ev.value} value={ev.value}>
                      {eventLabels[ev.value] ?? ev.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {t("badgeEditor.timesRequired", { count: newThreshold })}
                </Typography>
                <Slider
                  size="small"
                  value={newThreshold}
                  onChange={(_e, val) => setNewThreshold(val as number)}
                  min={1}
                  max={50}
                  step={1}
                  valueLabelDisplay="auto"
                />
              </Box>
              <FormControl size="small" fullWidth>
                <InputLabel>{t("badgeEditor.rarity")}</InputLabel>
                <Select
                  value={newRarity}
                  label={t("badgeEditor.rarity")}
                  onChange={(e) =>
                    setNewRarity(e.target.value as BadgeVisualConfig["rarity"])
                  }
                >
                  {RARITY_OPTIONS.map((r) => (
                    <MenuItem
                      key={r}
                      value={r}
                      sx={{ textTransform: "capitalize" }}
                    >
                      {rarityLabels[r] ?? r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* ---- Visual Design Toggle ---- */}
              <Divider />
              <Button
                size="small"
                variant={showVisualEditor ? "contained" : "outlined"}
                startIcon={<PaletteIcon />}
                onClick={() => setShowVisualEditor(!showVisualEditor)}
                color={showVisualEditor ? "primary" : "inherit"}
              >
                {showVisualEditor
                  ? t("badgeEditor.visualDesignOn")
                  : t("badgeEditor.addVisualDesign")}
              </Button>
              <Collapse in={showVisualEditor}>
                <Box sx={{ pt: 1 }}>
                  <BadgeVisualPicker
                    value={newVisual}
                    onChange={setNewVisual}
                  />
                </Box>
              </Collapse>

              {/* ---- Buff Editor Toggle ---- */}
              <Button
                size="small"
                variant={showBuffEditor ? "contained" : "outlined"}
                startIcon={<CardGiftcardIcon />}
                onClick={() => setShowBuffEditor(!showBuffEditor)}
                color={showBuffEditor ? "secondary" : "inherit"}
              >
                {showBuffEditor
                  ? t("badgeEditor.badgeBuffsOn")
                  : t("badgeEditor.addBadgeBuffs")}
              </Button>
              <Collapse in={showBuffEditor}>
                <Box sx={{ pt: 1 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="caption" color="text.secondary">
                      {t("badgeEditor.buffsDescription")}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        size="small"
                        type="number"
                        label={t("badgeEditor.xpMultiplier")}
                        value={newBuffs.xpMultiplier ?? 1}
                        onChange={(e) =>
                          setNewBuffs((b) => ({
                            ...b,
                            xpMultiplier: Math.max(
                              0,
                              parseFloat(e.target.value) || 1,
                            ),
                          }))
                        }
                        inputProps={{ min: 0, max: 5, step: 0.25 }}
                        helperText={
                          (newBuffs.xpMultiplier ?? 1) === 1
                            ? t("badgeEditor.noBonus")
                            : t("badgeEditor.xpMultiplierValue", {
                                multiplier: newBuffs.xpMultiplier ?? 1,
                              })
                        }
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label={t("badgeEditor.durationHours")}
                        value={newBuffs.xpMultiplierDurationHours ?? 0}
                        onChange={(e) =>
                          setNewBuffs((b) => ({
                            ...b,
                            xpMultiplierDurationHours: Math.max(
                              0,
                              parseInt(e.target.value) || 0,
                            ),
                          }))
                        }
                        inputProps={{ min: 0, step: 1 }}
                        helperText={
                          (newBuffs.xpMultiplierDurationHours ?? 0) === 0
                            ? t("badgeEditor.permanent")
                            : t("badgeEditor.hoursValue", {
                                hours: newBuffs.xpMultiplierDurationHours ?? 0,
                              })
                        }
                        sx={{ flex: 1 }}
                      />
                    </Stack>
                    <TextField
                      size="small"
                      type="number"
                      label={t("badgeEditor.streakFreezesGranted")}
                      value={newBuffs.streakFreezes ?? 0}
                      onChange={(e) =>
                        setNewBuffs((b) => ({
                          ...b,
                          streakFreezes: Math.max(
                            0,
                            parseInt(e.target.value) || 0,
                          ),
                        }))
                      }
                      inputProps={{ min: 0, max: 10, step: 1 }}
                      helperText={
                        (newBuffs.streakFreezes ?? 0) === 0
                          ? t("badgeEditor.none")
                          : t("badgeEditor.freezeCount", {
                              count: newBuffs.streakFreezes ?? 0,
                            })
                      }
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label={t("badgeEditor.contentUnlockIds")}
                      value={(newBuffs.contentUnlockIds || []).join(", ")}
                      onChange={(e) =>
                        setNewBuffs((b) => ({
                          ...b,
                          contentUnlockIds: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }))
                      }
                      placeholder="unit-id-1, unit-id-2"
                      helperText={t("badgeEditor.contentUnlockIdsHelper")}
                      fullWidth
                    />
                  </Stack>
                </Box>
              </Collapse>

              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                disabled={!newName.trim() || !newEvent}
                onClick={handleCreate}
              >
                {t("badgeEditor.createBadge")}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Collapse>

      {/* ---- Custom badge list ---- */}
      {customBadges.map((badge) => {
        const eventLabel = eventLabels[badge.event] ?? badge.event;
        // Build BadgeIcon config if visual is present
        const visualIcon = badge.visual
          ? resolveIcon(badge.visual.iconName)
          : undefined;
        const badgePreviewConfig: BadgeVisualConfig | undefined =
          badge.visual && visualIcon
            ? {
                icon: visualIcon,
                name: badge.name,
                description: badge.description,
                bgColor: badge.visual.bgColor,
                gradient: badge.visual.gradient,
                iconColor: badge.visual.iconColor,
                shape: badge.visual.shape,
                animation: badge.visual.animation,
                category: "core",
                rarity: badge.rarity,
              }
            : undefined;
        const hasBuffs =
          badge.buffs &&
          ((badge.buffs.xpMultiplier && badge.buffs.xpMultiplier !== 1) ||
            (badge.buffs.streakFreezes && badge.buffs.streakFreezes > 0) ||
            (badge.buffs.contentUnlockIds &&
              badge.buffs.contentUnlockIds.length > 0));
        return (
          <Card key={badge.id} variant="outlined" sx={{ mb: 1 }}>
            <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                {badgePreviewConfig ? (
                  <BadgeIcon
                    config={badgePreviewConfig}
                    size={36}
                    earned
                    animate={false}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "action.hover",
                      borderRadius: "50%",
                    }}
                  >
                    <PaletteIcon fontSize="small" color="disabled" />
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {badge.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("badgeEditor.criteriaCount", {
                      event: eventLabel,
                      threshold: badge.threshold,
                    })}
                  </Typography>
                  {badge.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      {badge.description}
                    </Typography>
                  )}
                  {hasBuffs && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                      {badge.buffs!.xpMultiplier &&
                        badge.buffs!.xpMultiplier !== 1 && (
                          <Chip
                            label={t("badgeEditor.xpMultiplierValue", {
                              multiplier: badge.buffs!.xpMultiplier,
                            })}
                            size="small"
                            variant="status"
                            color="success"
                            sx={{ height: 18, fontSize: "0.6rem" }}
                          />
                        )}
                      {badge.buffs!.streakFreezes &&
                        badge.buffs!.streakFreezes > 0 && (
                          <Chip
                            label={t("badgeEditor.freezeCount", {
                              count: badge.buffs!.streakFreezes,
                            })}
                            size="small"
                            variant="status"
                            color="info"
                            sx={{ height: 18, fontSize: "0.6rem" }}
                          />
                        )}
                      {badge.buffs!.contentUnlockIds &&
                        badge.buffs!.contentUnlockIds.length > 0 && (
                          <Chip
                            label={t("badgeEditor.unlockCount", {
                              count: badge.buffs!.contentUnlockIds.length,
                            })}
                            size="small"
                            variant="status"
                            color="warning"
                            sx={{ height: 18, fontSize: "0.6rem" }}
                          />
                        )}
                    </Stack>
                  )}
                </Box>
                <Chip
                  label={rarityLabels[badge.rarity] ?? badge.rarity}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    textTransform: "capitalize",
                  }}
                />
                <Tooltip title={t("badgeEditor.deleteCustomBadge")}>
                  <IconButton
                    size="small"
                    onClick={() => onDeleteCustomBadge?.(badge.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
      {customBadges.length === 0 && !showCreateForm && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          {t("badgeEditor.noCustomBadges")}
        </Typography>
      )}
    </Box>
  );
}

export default BadgeEditor;
