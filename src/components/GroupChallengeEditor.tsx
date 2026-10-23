/**
 * GroupChallengeEditor — Full creation/edit form for group challenges (boss battles).
 *
 * Includes title, target XP, deadline, bonus multiplier, campaign narrative fields,
 * active toggle, and a progress display with countdown timer.
 *
 * @module GroupChallengeEditor
 */

import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Autocomplete from "@mui/material/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import SaveIcon from "@mui/icons-material/Save";
import TimerIcon from "@mui/icons-material/Timer";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ImageIcon from "@mui/icons-material/Image";
import { generateImage } from "../../app/actions/generate";
import getCachedUrl from "../utils/getCachedUrl";
import { calculateFeasibility } from "../utils/chapterFeasibility";
import { useTranslations } from "next-intl";

// ============================================================================
// Types
// ============================================================================

export interface GroupChallengeEditorData {
  title: string;
  targetXP: number;
  deadline?: string; // ISO datetime
  startDate?: string; // ISO datetime
  bonusMultiplier: number;
  setting?: string;
  stakes?: string;
  systemPromptSeed?: string;
  active: boolean;
  featuredImage?: string;
  linkedUnitIds?: string[];
}

export interface GroupChallengeEditorProps {
  /** Initial data for editing (omit for create mode) */
  initialData?: Partial<GroupChallengeEditorData> & { currentXP?: number };
  /** Called when form is submitted */
  onSubmit: (data: GroupChallengeEditorData) => void;
  /** Disable during submission */
  submitting?: boolean;
  /** Available units for linking (id + name pairs) */
  availableUnits?: Array<{ id: string; name: string }>;
}

// ============================================================================
// Helpers
// ============================================================================

function formatCountdown(
  deadline: string,
  t: ReturnType<typeof useTranslations>,
): { text: string; expired: boolean } {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0)
    return { text: t("groupChallengeEditor.expired"), expired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0)
    return {
      text: t("groupChallengeEditor.daysHoursRemaining", { days, hours }),
      expired: false,
    };
  if (hours > 0)
    return {
      text: t("groupChallengeEditor.hoursMinutesRemaining", { hours, minutes }),
      expired: false,
    };
  return {
    text: t("groupChallengeEditor.minutesRemaining", { minutes }),
    expired: false,
  };
}

// ============================================================================
// Component
// ============================================================================

export function GroupChallengeEditor({
  initialData,
  onSubmit,
  submitting = false,
  availableUnits = [],
}: GroupChallengeEditorProps) {
  const t = useTranslations("components");
  const [title, setTitle] = useState(initialData?.title || "");
  const [targetXP, setTargetXP] = useState(initialData?.targetXP ?? 1000);
  const [deadline, setDeadline] = useState(initialData?.deadline || "");
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [bonusMultiplier, setBonusMultiplier] = useState(
    initialData?.bonusMultiplier ?? 1.5,
  );
  const [setting, setSetting] = useState(initialData?.setting || "");
  const [stakes, setStakes] = useState(initialData?.stakes || "");
  const [systemPromptSeed, setSystemPromptSeed] = useState(
    initialData?.systemPromptSeed || "",
  );
  const [active, setActive] = useState(initialData?.active ?? true);
  const [countdown, setCountdown] = useState<{
    text: string;
    expired: boolean;
  } | null>(null);
  const [featuredImage, setFeaturedImage] = useState(
    initialData?.featuredImage || "",
  );
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageGenerating, setImageGenerating] = useState(false);
  const [linkedUnitIds, setLinkedUnitIds] = useState<string[]>(
    initialData?.linkedUnitIds || [],
  );

  const currentXP = initialData?.currentXP ?? 0;
  const progress =
    targetXP > 0 ? Math.min(100, (currentXP / targetXP) * 100) : 0;
  const isValid = title.trim().length > 0 && targetXP > 0;

  // Resolve existing featured image URL
  useEffect(() => {
    if (featuredImage && !featuredImageUrl) {
      getCachedUrl(featuredImage)
        .then(setFeaturedImageUrl)
        .catch(() => {});
    }
  }, [featuredImage, featuredImageUrl]);

  // Live countdown timer
  useEffect(() => {
    if (!deadline) {
      setCountdown(null);
      return;
    }
    setCountdown(formatCountdown(deadline, t));
    const interval = setInterval(() => {
      setCountdown(formatCountdown(deadline, t));
    }, 60_000);
    return () => clearInterval(interval);
  }, [deadline, t]);

  const handleGenerateImage = async () => {
    const prompt =
      imagePrompt.trim() || `Fantasy battle scene: ${title}. ${setting}`;
    setImageGenerating(true);
    try {
      const result = await generateImage({
        phrase: prompt,
        model: "dall-e-3",
        size: "1792x1024",
      });
      setFeaturedImage(result.path);
      const url = await getCachedUrl(result.path);
      setFeaturedImageUrl(url);
    } catch (err) {
      console.error("Image generation failed:", err);
    } finally {
      setImageGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({
      title,
      targetXP,
      deadline: deadline || undefined,
      startDate: startDate || undefined,
      bonusMultiplier,
      setting: setting || undefined,
      stakes: stakes || undefined,
      systemPromptSeed: systemPromptSeed || undefined,
      active,
      featuredImage: featuredImage || undefined,
      linkedUnitIds: linkedUnitIds.length > 0 ? linkedUnitIds : undefined,
    });
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Typography variant="h6">
              {initialData?.title
                ? t("groupChallengeEditor.editTitle")
                : t("groupChallengeEditor.createTitle")}
            </Typography>

            {/* Progress display (only in edit mode with current XP) */}
            {initialData?.currentXP != null && (
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("groupChallengeEditor.progress", {
                      current: currentXP,
                      target: targetXP,
                    })}
                  </Typography>
                  {countdown && (
                    <Chip
                      icon={<TimerIcon />}
                      label={countdown.text}
                      size="small"
                      color={countdown.expired ? "error" : "default"}
                    />
                  )}
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
            )}

            {/* Active toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
              }
              label={t("groupChallengeEditor.activeLabel")}
            />

            {/* Core fields */}
            <TextField
              label={t("groupChallengeEditor.titleLabel")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={t("groupChallengeEditor.titlePlaceholder")}
            />

            <TextField
              label={t("groupChallengeEditor.targetXpLabel")}
              type="number"
              value={targetXP}
              onChange={(e) =>
                setTargetXP(Math.max(1, parseInt(e.target.value) || 0))
              }
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">⚡</InputAdornment>
                ),
              }}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label={t("groupChallengeEditor.startDateLabel")}
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label={t("groupChallengeEditor.deadlineLabel")}
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <TextField
              label={t("groupChallengeEditor.bonusMultiplierLabel")}
              type="number"
              value={bonusMultiplier}
              onChange={(e) =>
                setBonusMultiplier(Math.max(1, parseFloat(e.target.value) || 1))
              }
              inputProps={{ step: 0.1, min: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">×</InputAdornment>
                ),
              }}
              helperText={t("groupChallengeEditor.bonusMultiplierHelper")}
            />

            <Divider>
              <Chip
                label={t("groupChallengeEditor.campaignNarrative")}
                icon={<EmojiEventsIcon />}
              />
            </Divider>

            {/* Campaign narrative fields */}
            <TextField
              label={t("groupChallengeEditor.settingLabel")}
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              multiline
              rows={2}
              placeholder={t("groupChallengeEditor.settingPlaceholder")}
              helperText={t("groupChallengeEditor.settingHelper")}
            />

            <TextField
              label={t("groupChallengeEditor.stakesLabel")}
              value={stakes}
              onChange={(e) => setStakes(e.target.value)}
              multiline
              rows={2}
              placeholder={t("groupChallengeEditor.stakesPlaceholder")}
              helperText={t("groupChallengeEditor.stakesHelper")}
            />

            <TextField
              label={t("groupChallengeEditor.systemPromptSeedLabel")}
              value={systemPromptSeed}
              onChange={(e) => setSystemPromptSeed(e.target.value)}
              multiline
              rows={2}
              placeholder={t(
                "groupChallengeEditor.systemPromptSeedPlaceholder",
              )}
              helperText={t("groupChallengeEditor.systemPromptSeedHelper")}
            />

            {/* Featured Image Generation */}
            <Divider>
              <Chip
                label={t("groupChallengeEditor.linkedUnitsScoped")}
                icon={<EmojiEventsIcon />}
              />
            </Divider>

            {availableUnits.length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary">
                  {t("groupChallengeEditor.linkedUnitsHint")}
                </Typography>
                <Autocomplete
                  multiple
                  options={availableUnits}
                  getOptionLabel={(opt) => opt.name}
                  value={availableUnits.filter((u) =>
                    linkedUnitIds.includes(u.id),
                  )}
                  onChange={(_, newValue) =>
                    setLinkedUnitIds(newValue.map((v) => v.id))
                  }
                  disableCloseOnSelect
                  renderOption={(props, option, { selected }) => (
                    <li {...props} key={option.id}>
                      <Checkbox checked={selected} sx={{ mr: 1 }} />
                      {option.name}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("groupChallengeEditor.linkedUnitsLabel")}
                      placeholder={t(
                        "groupChallengeEditor.linkedUnitsPlaceholder",
                      )}
                    />
                  )}
                />
                {linkedUnitIds.length > 0 &&
                  targetXP > 0 &&
                  (() => {
                    const feasibility = calculateFeasibility(
                      targetXP,
                      linkedUnitIds.length,
                      { bonusMultiplier },
                    );
                    return (
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: feasibility.achievableWithoutDrills
                            ? "success.50"
                            : feasibility.achievableWithinWeek
                              ? "warning.50"
                              : "error.50",
                          border: "1px solid",
                          borderColor: feasibility.achievableWithoutDrills
                            ? "success.main"
                            : feasibility.achievableWithinWeek
                              ? "warning.main"
                              : "error.main",
                        }}
                      >
                        <Typography variant="caption" fontWeight={600}>
                          {t("groupChallengeEditor.feasibility", {
                            verdict: feasibility.verdict.toUpperCase(),
                          })}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          {feasibility.drillSessionsNeeded > 0
                            ? t("groupChallengeEditor.oneTimeXpWithDrills", {
                                min: feasibility.oneTimeXPConservative,
                                max: feasibility.oneTimeXPOptimistic,
                                drills: feasibility.drillSessionsNeeded,
                              })
                            : t("groupChallengeEditor.oneTimeXp", {
                                min: feasibility.oneTimeXPConservative,
                                max: feasibility.oneTimeXPOptimistic,
                              })}
                        </Typography>
                        {feasibility.warning && (
                          <Typography
                            variant="caption"
                            color="error.main"
                            display="block"
                          >
                            {feasibility.warning}
                          </Typography>
                        )}
                      </Box>
                    );
                  })()}
              </>
            )}

            <Divider>
              <Chip
                label={t("groupChallengeEditor.featuredImage")}
                icon={<ImageIcon />}
              />
            </Divider>

            <TextField
              label={t("groupChallengeEditor.imagePromptLabel")}
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              multiline
              rows={2}
              placeholder={t("groupChallengeEditor.imagePromptPlaceholder", {
                title: title || t("groupChallengeEditor.exampleTitle"),
                setting: setting || t("groupChallengeEditor.exampleSetting"),
              })}
              helperText={t("groupChallengeEditor.imagePromptHelper")}
            />

            <Button
              variant="outlined"
              startIcon={
                imageGenerating ? <CircularProgress size={16} /> : <ImageIcon />
              }
              onClick={handleGenerateImage}
              disabled={
                imageGenerating || (!imagePrompt.trim() && !title.trim())
              }
            >
              {imageGenerating
                ? t("groupChallengeEditor.generating")
                : featuredImage
                  ? t("groupChallengeEditor.regenerateImage")
                  : t("groupChallengeEditor.generateFeaturedImage")}
            </Button>

            {featuredImageUrl && (
              <Box sx={{ borderRadius: 2, overflow: "hidden" }}>
                <img
                  src={featuredImageUrl}
                  alt={t("groupChallengeEditor.featuredImageAlt")}
                  style={{ width: "100%", maxHeight: 300, objectFit: "cover" }}
                />
              </Box>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!isValid || submitting}
            >
              {initialData?.title
                ? t("groupChallengeEditor.saveChallenge")
                : t("groupChallengeEditor.createChallenge")}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
