/**
 * InstructorGamificationPanel — Admin UI for managing gamification features:
 * - Section selector (scopes all data by sectionID)
 * - Skill tree editor (multi-field with unit linking)
 * - Campaign editor (narrative setting, stakes, chapter text)
 * - Squad management (create/edit squads, assign students)
 * - Easter egg CRUD (create/edit/delete triggers)
 * - Boss battle CRUD (create with progress display)
 *
 * Each section is a collapsible accordion panel.
 *
 * @module InstructorGamificationPanel
 */

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import GroupsIcon from "@mui/icons-material/Groups";
import SearchIcon from "@mui/icons-material/Search";
import SportsKabaddiIcon from "@mui/icons-material/SportsKabaddi";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { SectionSelector, SectionOption } from "./SectionSelector";
import { SkillForm, SkillFormData, UnitOption } from "./SkillForm";
import { SkillTree, SkillNodeData } from "./SkillTree";
import { BossBattleForm, BossBattleFormData } from "./BossBattleForm";
import {
  GroupChallengeEditor,
  GroupChallengeEditorData,
} from "../GroupChallengeEditor";
import { EmptyState } from "../EmptyState";
import { BossBattleProgress, Contributor } from "./BossBattleProgress";
import {
  EasterEggForm,
  EasterEggFormData,
  EasterEggTriggerType,
  BadgeOption,
} from "./EasterEggForm";
import { BadgeEditor, BadgeOverride, CustomBadge } from "./BadgeEditor";
import {
  ANTI_BADGE_REGISTRY,
  getAllAntiBadgeTypes,
  getAntiBadgeConfig,
} from "./antiBadgeRegistry";
import type { AntiBadgeConfig } from "./antiBadgeRegistry";
import { BadgeIcon } from "./BadgeIcon";
import {
  BADGE_REGISTRY,
  getAllBadgeTypes,
  getBadgeConfig,
} from "./badgeRegistry";
import { XPTunerDialog, XPTunerConfig, XPTunerInline } from "./XPTunerDialog";
import type { XPMultiplierConfig } from "./XPTunerDialog";
import { AvatarUnlockEditor } from "./AvatarUnlockEditor";
import { ThemeUnlockEditor } from "./ThemeUnlockEditor";
import FaceIcon from "@mui/icons-material/Face";
import TuneIcon from "@mui/icons-material/Tune";
import LockIcon from "@mui/icons-material/Lock";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import LinearScaleIcon from "@mui/icons-material/LinearScale";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Slider from "@mui/material/Slider";

// Defer mounting each panel's contents until first expansion, then keep them
// mounted so in-progress form drafts survive collapsing.
const LAZY_ACCORDION_SLOT_PROPS = { transition: { mountOnEnter: true } };

// ============================================================================
// Types
// ============================================================================

export interface SkillEntry {
  id: string;
  title: string;
  description?: string;
  xpReward?: number;
  prerequisites?: string[];
  unitIds?: string[];
  minimumAccuracy?: number;
}

export interface CampaignEntry {
  id: string;
  title: string;
  setting?: string;
  stakes?: string;
  narrative?: string;
}

export interface SquadEntry {
  id: string;
  name: string;
  memberCount: number;
}

export interface EasterEggEntry {
  id: string;
  type: EasterEggTriggerType;
  message: string;
  xpReward: number;
  /** KEYWORD trigger value */
  keyword?: string;
  /** SCHEDULE: JSON with start/end ISO dates */
  triggerValue?: string;
  /** SECRET_LINK: unit ID */
  secretLinkUnitId?: string;
  /** ACHIEVEMENT: rule string like "accuracy>=95" */
  achievementRule?: string;
}

export interface BossEntry {
  id: string;
  title: string;
  targetXP: number;
  currentXP: number;
  active: boolean;
  startDate?: string;
  deadline?: string;
  bonusMultiplier?: number;
  setting?: string;
  stakes?: string;
  featuredImage?: string;
  contributors?: Contributor[];
}

/** Per-unit lock requirements (set by instructor) */
export interface UnitLockRequirement {
  /** Minimum XP needed to unlock (0 = no XP requirement) */
  requiredXP?: number;
  /** Badge type that must be earned to unlock */
  requiredBadgeId?: string;
  /** Module completion percentage needed (0–100, 0 = none) */
  requiredModuleCompletion?: number;
}

export interface InstructorGamificationPanelProps {
  /** Available sections for scoping */
  sections?: SectionOption[];
  /** Currently selected section ID */
  selectedSectionId?: string | null;
  /** Section change handler */
  onSectionChange?: (sectionId: string | null) => void;
  /** Available units for skill linking (from section assignments) */
  availableUnits?: UnitOption[];
  /** Available badges for easter egg rewards */
  availableBadges?: BadgeOption[];
  /** Existing skills */
  skills?: SkillEntry[];
  /** Existing campaigns */
  campaigns?: CampaignEntry[];
  /** Existing squads */
  squads?: SquadEntry[];
  /** Existing easter eggs */
  easterEggs?: EasterEggEntry[];
  /** Existing boss battles */
  bossBattles?: BossEntry[];
  /** Callbacks for CRUD operations */
  onAddSkill?: (skill: SkillFormData) => void;
  onDeleteSkill?: (skillId: string) => void;
  onSkillClick?: (skillId: string) => void;
  onPrerequisiteChange?: (skillId: string, prerequisites: string[]) => void;
  onGenerateSkillTree?: (unitId: string) => void;
  onSaveCampaign?: (
    campaign: Omit<CampaignEntry, "id"> & { id?: string },
  ) => void;
  onDeleteCampaign?: (campaignId: string) => void;
  /** Generate campaign narrative via AI from a title prompt */
  onGenerateCampaign?: (title: string) => Promise<{ setting: string } | null>;
  onCreateSquad?: (name: string, sectionID: string) => void;
  onDeleteSquad?: (squadId: string) => void;
  onAddEasterEgg?: (egg: EasterEggFormData) => void;
  onDeleteEasterEgg?: (eggId: string) => void;
  onAddBoss?: (boss: BossBattleFormData | GroupChallengeEditorData) => void;
  onEditBoss?: (
    bossId: string,
    boss: BossBattleFormData | GroupChallengeEditorData,
  ) => void;
  onDeleteBoss?: (bossId: string) => void;
  onToggleBossActive?: (bossId: string, active: boolean) => void;
  /** Current badge overrides for hardcoded badges */
  badgeOverrides?: BadgeOverride[];
  /** Custom badges created by the instructor */
  customBadges?: CustomBadge[];
  /** Called when a hardcoded badge's criteria is changed */
  onBadgeOverrideChange?: (override: BadgeOverride) => void;
  /** Called when a hardcoded badge's override is reset to defaults */
  onBadgeOverrideReset?: (badgeType: string) => void;
  /** Called when a new custom badge is created */
  onAddCustomBadge?: (badge: Omit<CustomBadge, "id">) => void;
  /** Called when a custom badge is deleted */
  onDeleteCustomBadge?: (badgeId: string) => void;
  /** Current XP tuner config for the selected section */
  xpConfig?: XPTunerConfig;
  /** Called when instructor saves new XP config */
  onSaveXPConfig?: (config: XPTunerConfig) => void;
  /** @deprecated Use xpConfig instead */
  xpMultipliers?: XPMultiplierConfig;
  /** @deprecated Use onSaveXPConfig instead */
  onSaveXPMultipliers?: (config: XPMultiplierConfig) => void;
  /** Whether linear lock ordering is enabled for this section */
  linearLockEnabled?: boolean;
  /** Toggle linear lock on/off */
  onToggleLinearLock?: (enabled: boolean) => void;
  /** Per-unit lock requirements (keyed by unit ID) */
  unitLockRequirements?: Record<string, UnitLockRequirement>;
  /** Called when a unit's lock requirements are updated */
  onUpdateUnitLock?: (
    unitId: string,
    requirements: UnitLockRequirement,
  ) => void;
  /** Called when a unit's lock requirements are cleared */
  onClearUnitLock?: (unitId: string) => void;
  /** Copy gamification settings from another section */
  onCopyFromSection?: (sourceSectionId: string) => void;
  /** Whether badge awarding is enabled for this section (default: true) */
  badgesEnabled?: boolean;
  /** Toggle all badge awarding on/off for this section */
  onToggleBadges?: (enabled: boolean) => void;
  /** Whether anti-badge awarding is enabled for this section (default: true) */
  antiBadgesEnabled?: boolean;
  /** Toggle anti-badge awarding on/off for this section */
  onToggleAntiBadges?: (enabled: boolean) => void;
}

// ============================================================================
// Component
// ============================================================================

export function InstructorGamificationPanel({
  sections = [],
  selectedSectionId,
  onSectionChange,
  availableUnits = [],
  availableBadges = [],
  skills = [],
  campaigns = [],
  squads = [],
  easterEggs = [],
  bossBattles = [],
  onAddSkill,
  onDeleteSkill,
  onSkillClick,
  onPrerequisiteChange,
  onGenerateSkillTree,
  onSaveCampaign,
  onDeleteCampaign,
  onGenerateCampaign,
  onCreateSquad,
  onDeleteSquad,
  onAddEasterEgg,
  onDeleteEasterEgg,
  onAddBoss,
  onEditBoss,
  onDeleteBoss,
  onToggleBossActive,
  badgeOverrides = [],
  customBadges = [],
  onBadgeOverrideChange,
  onBadgeOverrideReset,
  onAddCustomBadge,
  onDeleteCustomBadge,
  xpConfig,
  onSaveXPConfig,
  xpMultipliers,
  onSaveXPMultipliers,
  linearLockEnabled,
  onToggleLinearLock,
  unitLockRequirements = {},
  onUpdateUnitLock,
  onClearUnitLock,
  onCopyFromSection,
  badgesEnabled,
  onToggleBadges,
  antiBadgesEnabled,
  onToggleAntiBadges,
}: InstructorGamificationPanelProps) {
  const t = useTranslations("components");
  // Local form state for inline creation
  const [newSquadName, setNewSquadName] = useState("");
  const [selectedSquadSection, setSelectedSquadSection] = useState<{
    id: string;
    name?: string;
    description?: string;
  } | null>(null);
  const [editingBossId, setEditingBossId] = useState<string | null>(null);
  const squadSectionFilter = React.useMemo(
    () =>
      createFilterOptions<{ id: string; name?: string; description?: string }>({
        stringify: (option) =>
          `${option.name || ""} ${option.description || ""}`,
      }),
    [],
  );
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignSetting, setCampaignSetting] = useState("");
  const [campaignGenerating, setCampaignGenerating] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(
    null,
  );

  // Build skill options for prerequisites (exclude self)
  const skillOptions = React.useMemo(
    () => skills.map((s) => ({ id: s.id, title: s.title })),
    [skills],
  );

  // Build badge options from registry + custom badges for typeahead
  const badgeOptions = React.useMemo(() => {
    const opts: Array<{ id: string; label: string; group: string }> = [];
    getAllBadgeTypes().forEach((key) => {
      const cfg = getBadgeConfig(key);
      opts.push({
        id: key,
        label: cfg.name || key,
        group: t("instructorGamificationPanel.badgeGroupBadges"),
      });
    });
    getAllAntiBadgeTypes().forEach((key) => {
      const cfg = getAntiBadgeConfig(key);
      if (cfg)
        opts.push({
          id: key,
          label: cfg.name || key,
          group: t("instructorGamificationPanel.badgeGroupAntiBadges"),
        });
    });
    customBadges.forEach((cb) => {
      opts.push({
        id: cb.id,
        label: cb.name || cb.id,
        group: t("instructorGamificationPanel.badgeGroupCustom"),
      });
    });
    return opts;
  }, [customBadges, t]);

  return (
    <Box sx={{ maxWidth: 800, margin: "0 auto" }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t("instructorGamificationPanel.title")}
      </Typography>

      {/* ---- Section Selector ---- */}
      {onSectionChange && (
        <SectionSelector
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSectionChange={onSectionChange}
        />
      )}

      {/* ---- Copy Settings From Section ---- */}
      {onCopyFromSection && selectedSectionId && sections.length > 1 && (
        <CopyFromSectionButton
          sections={sections.filter((s) => s.id !== selectedSectionId)}
          onCopy={onCopyFromSection}
        />
      )}

      {/* ---- XP Tuner ---- */}
      {(onSaveXPConfig || onSaveXPMultipliers) && (
        <Accordion
          defaultExpanded={false}
          slotProps={LAZY_ACCORDION_SLOT_PROPS}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <TuneIcon sx={{ mr: 1 }} />
            <Typography fontWeight={600}>
              {t("instructorGamificationPanel.xpTuner")}
            </Typography>
            {(xpConfig || xpMultipliers) &&
              (() => {
                const cfg = xpConfig || xpMultipliers || {};
                const count = Object.keys(cfg).length;
                return count > 0 ? (
                  <Chip
                    label={t("instructorGamificationPanel.customCount", {
                      count,
                    })}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 1, height: 20, fontSize: "0.65rem" }}
                  />
                ) : null;
              })()}
          </AccordionSummary>
          <AccordionDetails>
            <XPTunerInline
              config={xpConfig || xpMultipliers || {}}
              onSave={onSaveXPConfig || onSaveXPMultipliers!}
              sectionName={
                sections.find((s) => s.id === selectedSectionId)?.name
              }
              unitCount={availableUnits.length}
            />
          </AccordionDetails>
        </Accordion>
      )}

      {/* ---- Skill Tree Editor ---- */}
      {/* ---- Avatar Unlock Editor ---- */}
      {onSaveXPConfig && (
        <Accordion
          defaultExpanded={false}
          slotProps={LAZY_ACCORDION_SLOT_PROPS}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <FaceIcon sx={{ mr: 1 }} />
            <Typography fontWeight={600}>
              {t("instructorGamificationPanel.avatarStyleUnlocks")}
            </Typography>
            {xpConfig?.avatarUnlocks?.unlocks?.length ? (
              <Chip
                label={t("instructorGamificationPanel.styleCount", {
                  count: xpConfig.avatarUnlocks.unlocks.length,
                })}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ ml: 1, height: 20, fontSize: "0.65rem" }}
              />
            ) : null}
          </AccordionSummary>
          <AccordionDetails>
            <AvatarUnlockEditor
              config={xpConfig?.avatarUnlocks}
              sectionName={
                sections.find((s) => s.id === selectedSectionId)?.name
              }
              onSave={(avatarUnlocks) => {
                onSaveXPConfig({ ...xpConfig, avatarUnlocks });
              }}
            />
          </AccordionDetails>
        </Accordion>
      )}

      {/* ---- Theme Unlock Editor ---- */}
      {onSaveXPConfig && (
        <Accordion
          defaultExpanded={false}
          slotProps={LAZY_ACCORDION_SLOT_PROPS}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <TuneIcon sx={{ mr: 1 }} />
            <Typography fontWeight={600}>
              {t("instructorGamificationPanel.themeUnlockLevels")}
            </Typography>
            {xpConfig?.themeUnlocks?.unlocks?.length ? (
              <Chip
                label={t("instructorGamificationPanel.themeCount", {
                  count: xpConfig.themeUnlocks.unlocks.length,
                })}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ ml: 1, height: 20, fontSize: "0.65rem" }}
              />
            ) : null}
          </AccordionSummary>
          <AccordionDetails>
            <ThemeUnlockEditor
              config={xpConfig?.themeUnlocks}
              sectionName={
                sections.find((s) => s.id === selectedSectionId)?.name
              }
              onSave={(themeUnlocks) => {
                onSaveXPConfig({ ...xpConfig, themeUnlocks });
              }}
            />
          </AccordionDetails>
        </Accordion>
      )}

      <Accordion defaultExpanded={false} slotProps={LAZY_ACCORDION_SLOT_PROPS}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <AccountTreeIcon sx={{ mr: 1 }} />
          <Typography fontWeight={600}>
            {t("instructorGamificationPanel.skillTreeHeading", {
              count: skills.length,
            })}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SkillForm
            availableUnits={availableUnits}
            availableSkills={skillOptions}
            onSubmit={(data) => onAddSkill?.(data)}
            onGenerateFromUnit={onGenerateSkillTree}
          />
          <Divider sx={{ my: 2 }} />

          {/* Visual skill tree (React Flow DAG) */}
          {skills.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                {t("instructorGamificationPanel.visualLayout")}
              </Typography>
              <SkillTree
                skills={skills.map((s) => ({
                  skillId: s.id,
                  title: s.title,
                  description: s.description,
                  status: "AVAILABLE" as const,
                  xpReward: s.xpReward,
                  prerequisites: s.prerequisites,
                }))}
                onSkillClick={onSkillClick}
                onPrerequisiteChange={onPrerequisiteChange}
                editable={!!onPrerequisiteChange}
                height={Math.max(300, skills.length * 60)}
                sectionID={selectedSectionId || undefined}
                canGenerate={!!onGenerateSkillTree}
              />
            </Box>
          )}

          {/* Flat list for editing/deleting */}
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            {t("instructorGamificationPanel.allSkills")}
          </Typography>
          <List dense>
            {skills.map((skill) => (
              <ListItem key={skill.id} divider sx={{ gap: 1 }}>
                <ListItemText
                  primary={skill.title}
                  secondaryTypographyProps={{ component: "div" }}
                  secondary={
                    <Stack
                      direction="row"
                      spacing={0.5}
                      component="span"
                      flexWrap="wrap"
                    >
                      {skill.xpReward ? (
                        <Chip
                          label={t("instructorGamificationPanel.xpAmount", {
                            xp: skill.xpReward,
                          })}
                          size="small"
                          sx={{ height: 18, fontSize: "0.65rem" }}
                        />
                      ) : null}
                      {skill.unitIds && skill.unitIds.length > 0 && (
                        <Chip
                          label={t("instructorGamificationPanel.unitCount", {
                            count: skill.unitIds.length,
                          })}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: "0.65rem" }}
                        />
                      )}
                      {skill.minimumAccuracy != null && (
                        <Chip
                          label={t(
                            "instructorGamificationPanel.minimumAccuracy",
                            {
                              percent: skill.minimumAccuracy,
                            },
                          )}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: "0.65rem" }}
                        />
                      )}
                    </Stack>
                  }
                  sx={{ flex: 1, minWidth: 0 }}
                  primaryTypographyProps={{ noWrap: true }}
                />
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => onDeleteSkill?.(skill.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
            {skills.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                {t("instructorGamificationPanel.noSkills")}
              </Typography>
            )}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* ---- Campaign Editor ---- */}
      <Accordion defaultExpanded={false} slotProps={LAZY_ACCORDION_SLOT_PROPS}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <AutoStoriesIcon sx={{ mr: 1 }} />
          <Typography fontWeight={600}>
            {t("instructorGamificationPanel.campaignHeading", {
              count: campaigns.length,
            })}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2} sx={{ mb: 2 }}>
            <TextField
              size="small"
              label={t("instructorGamificationPanel.campaignTitleLabel")}
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              placeholder={t(
                "instructorGamificationPanel.campaignTitlePlaceholder",
              )}
              fullWidth
            />
            <TextField
              size="small"
              label={t("instructorGamificationPanel.campaignSettingLabel")}
              value={campaignSetting}
              onChange={(e) => setCampaignSetting(e.target.value)}
              placeholder={t(
                "instructorGamificationPanel.campaignSettingPlaceholder",
              )}
              multiline
              rows={2}
              fullWidth
              helperText={t(
                "instructorGamificationPanel.campaignSettingHelper",
              )}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                disabled={!campaignTitle.trim()}
                onClick={() => {
                  onSaveCampaign?.({
                    title: campaignTitle.trim(),
                    setting: campaignSetting.trim() || undefined,
                  });
                  setCampaignTitle("");
                  setCampaignSetting("");
                }}
              >
                {t("instructorGamificationPanel.saveCampaign")}
              </Button>
              {onGenerateCampaign && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={
                    campaignGenerating ? (
                      <CircularProgress size={16} />
                    ) : (
                      <AutoFixHighIcon />
                    )
                  }
                  disabled={!campaignTitle.trim() || campaignGenerating}
                  onClick={async () => {
                    setCampaignGenerating(true);
                    try {
                      const result = await onGenerateCampaign(
                        campaignTitle.trim(),
                      );
                      if (result) {
                        setCampaignSetting(result.setting);
                      }
                    } finally {
                      setCampaignGenerating(false);
                    }
                  }}
                >
                  {campaignGenerating
                    ? t("instructorGamificationPanel.generating")
                    : t("instructorGamificationPanel.generateWithAI")}
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Narrative display for existing campaigns */}
          {campaigns.map((c) => (
            <Card key={c.id} variant="outlined" sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    {c.title}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setExpandedCampaignId(
                          expandedCampaignId === c.id ? null : c.id,
                        )
                      }
                      aria-label={
                        expandedCampaignId === c.id
                          ? t("instructorGamificationPanel.collapseNarrative")
                          : t("instructorGamificationPanel.expandNarrative")
                      }
                    >
                      <ExpandMoreIcon
                        fontSize="small"
                        sx={{
                          transform:
                            expandedCampaignId === c.id
                              ? "rotate(180deg)"
                              : "none",
                          transition: "transform 0.2s",
                        }}
                      />
                    </IconButton>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => onDeleteCampaign?.(c.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
                {expandedCampaignId === c.id && (
                  <Box sx={{ mt: 1.5 }}>
                    {c.setting && (
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          {t("instructorGamificationPanel.setting")}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.25, fontStyle: "italic" }}
                        >
                          {c.setting}
                        </Typography>
                      </Box>
                    )}
                    {c.stakes && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          {t("instructorGamificationPanel.stakes")}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.25, fontStyle: "italic" }}
                        >
                          {c.stakes}
                        </Typography>
                      </Box>
                    )}
                    {!c.setting && !c.stakes && (
                      <Typography variant="body2" color="text.secondary">
                        {t("instructorGamificationPanel.noNarrative")}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </AccordionDetails>
      </Accordion>

      {/* ---- Squad Management ---- */}
      <Accordion defaultExpanded={false} slotProps={LAZY_ACCORDION_SLOT_PROPS}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <GroupsIcon sx={{ mr: 1 }} />
          <Typography fontWeight={600}>
            {t("instructorGamificationPanel.squadsHeading", {
              count: squads.length,
            })}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
            <Autocomplete
              options={sections}
              value={selectedSquadSection}
              onChange={(_, value) => setSelectedSquadSection(value)}
              filterOptions={squadSectionFilter}
              getOptionLabel={(option) => option.name || ""}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label={t("instructorGamificationPanel.sectionLabel")}
                />
              )}
              sx={{ minWidth: 200 }}
              size="small"
              noOptionsText={t("instructorGamificationPanel.noSectionsFound")}
            />
            <TextField
              size="small"
              label={t("instructorGamificationPanel.squadNameLabel")}
              value={newSquadName}
              onChange={(e) => setNewSquadName(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              disabled={!newSquadName.trim() || !selectedSquadSection}
              onClick={() => {
                onCreateSquad?.(newSquadName.trim(), selectedSquadSection!.id);
                setNewSquadName("");
                setSelectedSquadSection(null);
              }}
            >
              {t("instructorGamificationPanel.create")}
            </Button>
          </Stack>
          <List dense>
            {squads.map((g) => (
              <ListItem key={g.id} divider sx={{ gap: 1 }}>
                <ListItemText
                  primary={g.name}
                  secondary={t("instructorGamificationPanel.memberCount", {
                    count: g.memberCount,
                  })}
                  sx={{ flex: 1, minWidth: 0 }}
                  primaryTypographyProps={{ noWrap: true }}
                />
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => onDeleteSquad?.(g.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
            {squads.length === 0 && (
              <EmptyState
                dense
                title={t("instructorGamificationPanel.noSquads")}
                description={t("instructorGamificationPanel.noSquadsDescription")}
              />
            )}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* ---- Easter Egg CRUD ---- */}
      <Accordion defaultExpanded={false} slotProps={LAZY_ACCORDION_SLOT_PROPS}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <SearchIcon sx={{ mr: 1 }} />
          <Typography fontWeight={600}>
            {t("instructorGamificationPanel.easterEggsHeading", {
              count: easterEggs.length,
            })}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <EasterEggForm
            onSubmit={(data) => onAddEasterEgg?.(data)}
            availableUnits={availableUnits}
            availableBadges={availableBadges}
          />
          <Divider sx={{ my: 2 }} />
          <List dense>
            {easterEggs.map((egg) => (
              <ListItem key={egg.id} divider sx={{ gap: 1 }}>
                <ListItemText
                  primary={egg.message}
                  secondaryTypographyProps={{ component: "div" }}
                  secondary={
                    <Stack
                      direction="row"
                      spacing={0.5}
                      component="span"
                      flexWrap="wrap"
                    >
                      <Chip
                        label={egg.type}
                        size="small"
                        color="secondary"
                        sx={{ height: 18, fontSize: "0.65rem" }}
                      />
                      <Chip
                        label={t("instructorGamificationPanel.xpAmount", {
                          xp: egg.xpReward,
                        })}
                        size="small"
                        sx={{ height: 18, fontSize: "0.65rem" }}
                      />
                      {egg.keyword && (
                        <Chip
                          label={t("instructorGamificationPanel.quoted", {
                            value: egg.keyword,
                          })}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: "0.65rem" }}
                        />
                      )}
                      {egg.achievementRule && (
                        <Chip
                          label={egg.achievementRule}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: "0.65rem" }}
                        />
                      )}
                    </Stack>
                  }
                  sx={{ flex: 1, minWidth: 0 }}
                  primaryTypographyProps={{ noWrap: true }}
                />
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => onDeleteEasterEgg?.(egg.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* ---- Badge Customization ---- */}
      <Accordion defaultExpanded={false} slotProps={LAZY_ACCORDION_SLOT_PROPS}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <EmojiEventsIcon sx={{ mr: 1 }} />
          <Typography component="div" fontWeight={600}>
            {t("instructorGamificationPanel.badgesHeading", {
              customCount: customBadges.length,
              modifiedCount: badgeOverrides.length,
            })}
            {badgesEnabled === false && (
              <Chip
                label={t("instructorGamificationPanel.disabled")}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ ml: 1, height: 18, fontSize: "0.6rem" }}
              />
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {onToggleBadges && (
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={badgesEnabled !== false}
                    onChange={(_, checked) => onToggleBadges(checked)}
                  />
                }
                slotProps={{ typography: { component: "div" } }}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {t("instructorGamificationPanel.badgeAwarding")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t(
                        "instructorGamificationPanel.badgeAwardingDescription",
                      )}
                    </Typography>
                  </Box>
                }
              />
              <Divider sx={{ mt: 1.5 }} />
            </Box>
          )}
          <BadgeEditor
            overrides={badgeOverrides}
            customBadges={customBadges}
            onOverrideChange={onBadgeOverrideChange}
            onOverrideReset={onBadgeOverrideReset}
            onAddCustomBadge={onAddCustomBadge}
            onDeleteCustomBadge={onDeleteCustomBadge}
          />
        </AccordionDetails>
      </Accordion>

      {/* ---- Anti-Badges ---- */}
      <Accordion defaultExpanded={false} slotProps={LAZY_ACCORDION_SLOT_PROPS}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ReportProblemIcon sx={{ mr: 1, color: "error.main" }} />
          <Typography component="div" fontWeight={600}>
            {t("instructorGamificationPanel.antiBadgesHeading", {
              count: getAllAntiBadgeTypes().length,
            })}
            {antiBadgesEnabled === false && (
              <Chip
                label={t("instructorGamificationPanel.disabled")}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ ml: 1, height: 18, fontSize: "0.6rem" }}
              />
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {onToggleAntiBadges && (
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={antiBadgesEnabled !== false}
                    onChange={(_, checked) => onToggleAntiBadges(checked)}
                  />
                }
                slotProps={{ typography: { component: "div" } }}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {t("instructorGamificationPanel.antiBadgeAwarding")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t(
                        "instructorGamificationPanel.antiBadgeAwardingDescription",
                      )}
                    </Typography>
                  </Box>
                }
              />
              <Divider sx={{ mt: 1.5 }} />
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("instructorGamificationPanel.antiBadgesIntro")}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 1.5,
            }}
          >
            {getAllAntiBadgeTypes().map((badgeType) => {
              const config = getAntiBadgeConfig(badgeType);
              if (!config) return null;
              return (
                <Card
                  key={badgeType}
                  variant="outlined"
                  sx={{ borderColor: "error.light" }}
                >
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                    >
                      <Box sx={{ flexShrink: 0 }}>
                        <BadgeIcon
                          config={config}
                          size={44}
                          earned
                          animate={false}
                          drawIcon={false}
                        />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {config.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", lineHeight: 1.3, mb: 0.5 }}
                        >
                          {config.description}
                        </Typography>
                        {config.debuff.shameText && (
                          <Typography
                            variant="caption"
                            fontStyle="italic"
                            color="error"
                            sx={{
                              display: "block",
                              lineHeight: 1.3,
                              mb: 0.5,
                              opacity: 0.8,
                            }}
                          >
                            {t("instructorGamificationPanel.quoted", {
                              value: config.debuff.shameText,
                            })}
                          </Typography>
                        )}
                        <Stack
                          direction="row"
                          spacing={0.5}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {config.debuff.xpMultiplier != null && (
                            <Chip
                              label={t(
                                "instructorGamificationPanel.xpMultiplier",
                                {
                                  multiplier: config.debuff.xpMultiplier,
                                },
                              )}
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.6rem" }}
                            />
                          )}
                          {config.debuff.temporaryTitle && (
                            <Chip
                              label={t("instructorGamificationPanel.quoted", {
                                value: config.debuff.temporaryTitle,
                              })}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.6rem" }}
                            />
                          )}
                          {config.debuff.streakFreezesRemoved != null && (
                            <Chip
                              label={t(
                                "instructorGamificationPanel.freezesRemoved",
                                {
                                  count: config.debuff.streakFreezesRemoved,
                                },
                              )}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.6rem" }}
                            />
                          )}
                          {config.debuff.hideFromLeaderboard && (
                            <Chip
                              label={t(
                                "instructorGamificationPanel.hiddenFromLeaderboard",
                              )}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.6rem" }}
                            />
                          )}
                          {config.debuff.extraDrills != null && (
                            <Chip
                              label={t(
                                "instructorGamificationPanel.extraDrills",
                                {
                                  count: config.debuff.extraDrills,
                                },
                              )}
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.6rem" }}
                            />
                          )}
                          {config.redeemable && (
                            <Chip
                              label={
                                config.redemptionCondition
                                  ? t(
                                      "instructorGamificationPanel.autoRedeem",
                                      {
                                        condition: `${config.redemptionCondition.type.replace(/_/g, " ").toLowerCase()}${config.redemptionCondition.count ? ` (${config.redemptionCondition.count})` : ""}${config.redemptionCondition.percent ? ` (${config.redemptionCondition.percent}%)` : ""}`,
                                      },
                                    )
                                  : t("instructorGamificationPanel.redeemable")
                              }
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.6rem" }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* ---- Boss Battle Parameters ---- */}
      <Accordion defaultExpanded={false} slotProps={LAZY_ACCORDION_SLOT_PROPS}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <SportsKabaddiIcon sx={{ mr: 1 }} />
          <Typography fontWeight={600}>
            {t("instructorGamificationPanel.bossBattlesHeading", {
              count: bossBattles.length,
            })}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {editingBossId ? (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("instructorGamificationPanel.editingBoss", {
                  title:
                    bossBattles.find((b) => b.id === editingBossId)?.title ??
                    "",
                })}
              </Typography>
              <GroupChallengeEditor
                initialData={(() => {
                  const boss = bossBattles.find((b) => b.id === editingBossId);
                  if (!boss) return undefined;
                  return {
                    title: boss.title,
                    targetXP: boss.targetXP,
                    startDate: boss.startDate,
                    deadline: boss.deadline,
                    bonusMultiplier: boss.bonusMultiplier ?? 1.5,
                    setting: boss.setting,
                    stakes: boss.stakes,
                    featuredImage: boss.featuredImage,
                    active: boss.active,
                  };
                })()}
                availableUnits={availableUnits}
                onSubmit={(data) => {
                  onEditBoss?.(editingBossId, data);
                  setEditingBossId(null);
                }}
              />
              <Button
                size="small"
                onClick={() => setEditingBossId(null)}
                sx={{ mt: 1 }}
              >
                {t("instructorGamificationPanel.cancelEdit")}
              </Button>
            </Box>
          ) : (
            <GroupChallengeEditor
              availableUnits={availableUnits}
              onSubmit={(data) => onAddBoss?.(data)}
            />
          )}
          {bossBattles.length > 0 && <Divider sx={{ my: 2 }} />}
          {bossBattles.map((boss) => (
            <BossBattleProgress
              key={boss.id}
              id={boss.id}
              title={boss.title}
              currentXP={boss.currentXP}
              targetXP={boss.targetXP}
              active={boss.active}
              startDate={boss.startDate}
              deadline={boss.deadline}
              bonusMultiplier={boss.bonusMultiplier}
              setting={boss.setting}
              stakes={boss.stakes}
              contributors={boss.contributors}
              onToggleActive={onToggleBossActive}
              onDelete={onDeleteBoss}
              onEdit={onEditBoss ? (id) => setEditingBossId(id) : undefined}
            />
          ))}
          {bossBattles.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              {t("instructorGamificationPanel.noBossBattles")}
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* ---- Unit Progression & Lock Configuration ---- */}
      {(onToggleLinearLock || onUpdateUnitLock) && (
        <Accordion
          defaultExpanded={false}
          slotProps={LAZY_ACCORDION_SLOT_PROPS}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <LockIcon sx={{ mr: 1 }} />
            <Typography fontWeight={600}>
              {t("instructorGamificationPanel.unitProgression")}
              {linearLockEnabled && (
                <Chip
                  label={t("instructorGamificationPanel.linear")}
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ ml: 1, height: 18, fontSize: "0.6rem" }}
                />
              )}
              {Object.keys(unitLockRequirements).length > 0 && (
                <Chip
                  label={t("instructorGamificationPanel.gatedCount", {
                    count: Object.keys(unitLockRequirements).length,
                  })}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ ml: 0.5, height: 18, fontSize: "0.6rem" }}
                />
              )}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("instructorGamificationPanel.unitProgressionDescription")}
            </Typography>

            {/* ---- Progression Mode ---- */}
            {onToggleLinearLock && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  {t("instructorGamificationPanel.progressionMode")}
                </Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!linearLockEnabled}
                        onChange={(_, checked) => onToggleLinearLock(checked)}
                      />
                    }
                    label={
                      <Box>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <LinearScaleIcon fontSize="small" />
                          <Typography variant="body2" fontWeight={600}>
                            {t("instructorGamificationPanel.linearLockOrder")}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {t(
                            "instructorGamificationPanel.linearLockOrderDescription",
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={<Switch checked={skills.length > 0} disabled />}
                    label={
                      <Box>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <AccountTreeIcon fontSize="small" />
                          <Typography variant="body2" fontWeight={600}>
                            {t("instructorGamificationPanel.skillTreeOrder")}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {skills.length > 0
                            ? t(
                                "instructorGamificationPanel.skillTreeOrderConfigured",
                                {
                                  count: skills.length,
                                },
                              )
                            : t(
                                "instructorGamificationPanel.skillTreeOrderEmpty",
                              )}
                        </Typography>
                      </Box>
                    }
                  />
                </Stack>
                <Divider sx={{ mt: 2 }} />
              </Box>
            )}

            {/* ---- Per-Unit Lock Requirements ---- */}
            {onUpdateUnitLock && availableUnits.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  {t("instructorGamificationPanel.perUnitGates")}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1.5 }}
                >
                  {t("instructorGamificationPanel.perUnitGatesDescription")}
                </Typography>
                <Stack spacing={1.5}>
                  {availableUnits.map((unit) => {
                    const req = unitLockRequirements[unit.id] || {};
                    const hasReq =
                      (req.requiredXP && req.requiredXP > 0) ||
                      req.requiredBadgeId ||
                      (req.requiredModuleCompletion &&
                        req.requiredModuleCompletion > 0);
                    return (
                      <UnitLockRow
                        key={unit.id}
                        unitId={unit.id}
                        unitName={unit.name || unit.id}
                        requirement={req}
                        onUpdate={(r) => onUpdateUnitLock(unit.id, r)}
                        onClear={
                          onClearUnitLock
                            ? () => onClearUnitLock(unit.id)
                            : undefined
                        }
                        hasReq={!!hasReq}
                        badgeOptions={badgeOptions}
                      />
                    );
                  })}
                </Stack>
              </Box>
            )}
            {onUpdateUnitLock && availableUnits.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                {t("instructorGamificationPanel.noUnits")}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}

// ============================================================================
// Sub-component: UnitLockRow
// ============================================================================

function UnitLockRow({
  unitId,
  unitName,
  requirement,
  onUpdate,
  onClear,
  hasReq,
  badgeOptions = [],
}: {
  unitId: string;
  unitName: string;
  requirement: UnitLockRequirement;
  onUpdate: (req: UnitLockRequirement) => void;
  onClear?: () => void;
  hasReq: boolean;
  badgeOptions?: Array<{ id: string; label: string; group: string }>;
}) {
  const t = useTranslations("components");
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: hasReq ? "warning.main" : "divider",
        borderWidth: hasReq ? 1.5 : 1,
      }}
    >
      <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LockIcon fontSize="small" color={hasReq ? "warning" : "disabled"} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {unitName}
            </Typography>
            {hasReq && (
              <Stack direction="row" spacing={0.5}>
                {requirement.requiredXP ? (
                  <Chip
                    label={t("instructorGamificationPanel.xpAmount", {
                      xp: requirement.requiredXP,
                    })}
                    size="small"
                    color="primary"
                    sx={{ height: 18, fontSize: "0.6rem" }}
                  />
                ) : null}
                {requirement.requiredBadgeId ? (
                  <Chip
                    label={
                      badgeOptions?.find(
                        (b) => b.id === requirement.requiredBadgeId,
                      )?.label || requirement.requiredBadgeId
                    }
                    size="small"
                    color="secondary"
                    sx={{ height: 18, fontSize: "0.6rem" }}
                  />
                ) : null}
                {requirement.requiredModuleCompletion ? (
                  <Chip
                    label={t(
                      "instructorGamificationPanel.moduleCompletionChip",
                      {
                        percent: requirement.requiredModuleCompletion,
                      },
                    )}
                    size="small"
                    color="info"
                    sx={{ height: 18, fontSize: "0.6rem" }}
                  />
                ) : null}
              </Stack>
            )}
          </Box>
          {hasReq && onClear && (
            <IconButton size="small" onClick={onClear}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Stack>
        {expanded && (
          <Box sx={{ mt: 1.5 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={1.5}>
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                >
                  {t("instructorGamificationPanel.requiredXp", {
                    xp: requirement.requiredXP || 0,
                  })}
                </Typography>
                <Slider
                  size="small"
                  value={requirement.requiredXP || 0}
                  onChange={(_, val) =>
                    onUpdate({ ...requirement, requiredXP: val as number })
                  }
                  min={0}
                  max={5000}
                  step={50}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: "0" },
                    { value: 500, label: "500" },
                    { value: 1000, label: "1K" },
                    { value: 2500, label: "2.5K" },
                    { value: 5000, label: "5K" },
                  ]}
                  sx={{ "& .MuiSlider-markLabel": { fontSize: "0.6rem" } }}
                />
              </Box>
              <Autocomplete
                size="small"
                options={badgeOptions}
                groupBy={(option) => option.group}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.label
                }
                value={
                  badgeOptions.find(
                    (b) => b.id === requirement.requiredBadgeId,
                  ) || null
                }
                onChange={(_, newValue) => {
                  onUpdate({
                    ...requirement,
                    requiredBadgeId: newValue?.id || undefined,
                  });
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t("instructorGamificationPanel.requiredBadgeLabel")}
                    placeholder={t(
                      "instructorGamificationPanel.searchBadgesPlaceholder",
                    )}
                    helperText={t(
                      "instructorGamificationPanel.requiredBadgeHelper",
                    )}
                  />
                )}
                fullWidth
              />
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                >
                  {t("instructorGamificationPanel.requiredModuleCompletion", {
                    percent: requirement.requiredModuleCompletion || 0,
                  })}
                </Typography>
                <Slider
                  size="small"
                  value={requirement.requiredModuleCompletion || 0}
                  onChange={(_, val) =>
                    onUpdate({
                      ...requirement,
                      requiredModuleCompletion: val as number,
                    })
                  }
                  min={0}
                  max={100}
                  step={5}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) =>
                    t("instructorGamificationPanel.percent", { value: v })
                  }
                  marks={[
                    {
                      value: 0,
                      label: t("instructorGamificationPanel.percent", {
                        value: 0,
                      }),
                    },
                    {
                      value: 50,
                      label: t("instructorGamificationPanel.percent", {
                        value: 50,
                      }),
                    },
                    {
                      value: 100,
                      label: t("instructorGamificationPanel.percent", {
                        value: 100,
                      }),
                    },
                  ]}
                  sx={{ "& .MuiSlider-markLabel": { fontSize: "0.6rem" } }}
                />
              </Box>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/** Copy From Section button with section picker */
function CopyFromSectionButton({
  sections,
  onCopy,
}: {
  sections: SectionOption[];
  onCopy: (sectionId: string) => void;
}) {
  const t = useTranslations("components");
  const [open, setOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  return (
    <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center" }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<ContentCopyIcon />}
        onClick={() => setOpen(!open)}
      >
        {t("instructorGamificationPanel.copyFromSection")}
      </Button>
      {open && (
        <>
          <Autocomplete
            size="small"
            options={sections}
            getOptionLabel={(o) => o.name || o.id}
            onChange={(_, v) => setSelectedSource(v?.id || null)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("instructorGamificationPanel.sourceSection")}
                size="small"
                sx={{ minWidth: 200 }}
              />
            )}
          />
          <Button
            variant="contained"
            size="small"
            disabled={!selectedSource}
            onClick={() => {
              if (selectedSource) {
                onCopy(selectedSource);
                setOpen(false);
                setSelectedSource(null);
              }
            }}
          >
            {t("instructorGamificationPanel.copy")}
          </Button>
        </>
      )}
    </Box>
  );
}

export default InstructorGamificationPanel;
