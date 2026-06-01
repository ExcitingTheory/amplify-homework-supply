export { NailedItBadge } from "./NailedItBadge";
export type { NailedItBadgeProps } from "./NailedItBadge";

export { NailedItCelebration } from "./NailedItCelebration";
export type { NailedItCelebrationProps } from "./NailedItCelebration";

export { NailedItWall } from "./NailedItWall";
export type { NailedItWallProps, NailedItBlock } from "./NailedItWall";

export { XPToast } from "./XPToast";
export type { XPToastProps } from "./XPToast";

export { HomeworkXPSummary } from "./HomeworkXPSummary";
export type {
  HomeworkXPSummaryProps,
  XPLineItemData,
} from "./HomeworkXPSummary";

export { LevelBadge } from "./LevelBadge";
export type { LevelBadgeProps } from "./LevelBadge";

export { StreakIndicator } from "./StreakIndicator";
export type { StreakIndicatorProps } from "./StreakIndicator";

export { BadgeShelf } from "./BadgeShelf";
export type { BadgeShelfProps, EarnedBadge, BadgeType } from "./BadgeShelf";

export { ProgressRings } from "./ProgressRings";
export type { ProgressRingsProps, ModuleProgress } from "./ProgressRings";

export { PersonalBestBanner } from "./PersonalBestBanner";
export type { PersonalBestBannerProps } from "./PersonalBestBanner";

export { StreakShield } from "./StreakShield";
export type { StreakShieldProps } from "./StreakShield";

export { ContentLockCard } from "./ContentLockCard";
export type { ContentLockCardProps } from "./ContentLockCard";

export { EasterEggToast } from "./EasterEggToast";
export type { EasterEggToastProps } from "./EasterEggToast";

export { AnimatedXPCounter } from "./AnimatedXPCounter";
export type { AnimatedXPCounterProps } from "./AnimatedXPCounter";

export { RankChangeToast } from "./RankChangeToast";
export type { RankChangeToastProps } from "./RankChangeToast";

export { BadgeCoinFlip } from "./BadgeCoinFlip";
export type { BadgeCoinFlipProps } from "./BadgeCoinFlip";

export { BadgeIcon } from "./BadgeIcon";
export type { BadgeIconProps } from "./BadgeIcon";

export {
  AvatarGlowRing,
  isGlowActive,
  DEFAULT_GLOW_COLORS,
  GLOW_COLOR_PRESETS,
  GLOW_LEVEL_UP_DURATION_MS,
} from "./AvatarGlowRing";
export type { AvatarGlowRingProps, GlowRingConfig } from "./AvatarGlowRing";

export { AvatarUnlockEditor } from "./AvatarUnlockEditor";
export type { AvatarUnlockEditorProps } from "./AvatarUnlockEditor";

export {
  getBadgeConfig,
  getAllBadgeTypes,
  getBadgesByCategory,
  getBadgesByRarity,
  BADGE_REGISTRY,
  RARITY_EFFECTS,
} from "./badgeRegistry";
export type {
  BadgeVisualConfig,
  BadgeShape,
  BadgeAnimationPreset,
  BadgeGradient,
} from "./badgeRegistry";

export {
  ANTI_BADGE_REGISTRY,
  getAllAntiBadgeTypes,
  getAntiBadgeConfig,
  getRedeemableAntiBadges,
  getAntiBadgesByRarity,
} from "./antiBadgeRegistry";
export type {
  AntiBadgeConfig,
  BadgeDebuff,
  RedemptionCondition,
  RedemptionConditionType,
} from "./antiBadgeRegistry";

export { RedemptionConditionForm } from "./RedemptionConditionForm";
export type { RedemptionConditionFormProps } from "./RedemptionConditionForm";

export { ContentUnlockAnimation } from "./ContentUnlockAnimation";
export type { ContentUnlockAnimationProps } from "./ContentUnlockAnimation";

export { SkillTree } from "./SkillTree";
export type { SkillTreeProps, SkillNodeData, SkillStatus } from "./SkillTree";

export { SquadCrest } from "./SquadCrest";
export type { SquadCrestProps } from "./SquadCrest";

export { SquadLeaderboard } from "./SquadLeaderboard";
export type {
  SquadLeaderboardProps,
  SquadLeaderboardEntry,
} from "./SquadLeaderboard";

export { SquadJoinPanel } from "./SquadJoinPanel";
export type {
  SquadJoinPanelProps,
  SquadListEntry,
  SquadMemberEntry,
} from "./SquadJoinPanel";

export { GroupChallengeCard } from "./GroupChallengeCard";
export type { GroupChallengeCardProps } from "./GroupChallengeCard";

export { GamificationToastLayer } from "./GamificationToastLayer";

export { StreakCalendar } from "./StreakCalendar";
export type { StreakCalendarProps } from "./StreakCalendar";

export { SectionXPGauge } from "./SectionXPGauge";
export type { SectionXPGaugeProps } from "./SectionXPGauge";

export { CampaignBriefing } from "./CampaignBriefing";
export type { CampaignBriefingProps } from "./CampaignBriefing";

export {
  DiceBearAvatar,
  getUnlockedStyleTier,
  getUnlockedStyles,
  getStyleTierStatus,
  STYLE_CONFIG,
} from "./DiceBearAvatar";
export type {
  DiceBearAvatarProps,
  AvatarStyleTier,
  AvatarOverrides,
} from "./DiceBearAvatar";

export { AvatarCustomizer } from "./AvatarCustomizer";
export type { AvatarCustomizerProps } from "./AvatarCustomizer";

export { AvatarDisplay } from "./AvatarDisplay";
export type {
  AvatarDisplayProps,
  AvatarBadge,
  AvatarBorderEffect,
} from "./AvatarDisplay";

export { CosmeticSelector, DEFAULT_EDITOR_THEMES } from "./CosmeticSelector";
export type { EditorTheme, CosmeticSelectorProps } from "./CosmeticSelector";

export { BossBattleCard } from "./BossBattleCard";
export type {
  BossBattleCardProps,
  BossPhase,
  BossContributor,
  BossPhaseStatus,
} from "./BossBattleCard";

export {
  HiddenEasterEgg,
  useEasterEggKeyword,
  useEasterEggTime,
  useEasterEggRapidClick,
  useEasterEggTrigger,
} from "./EasterEggTrigger";
export type {
  HiddenEasterEggProps,
  EasterEggConfig,
  EasterEggTriggerResult,
  EasterEggTriggerType,
} from "./EasterEggTrigger";

export { EasterEggLayer } from "./EasterEggLayer";

export { InstructorGamificationPanel } from "./InstructorGamificationPanel";
export type {
  InstructorGamificationPanelProps,
  SkillEntry,
  CampaignEntry,
  SquadEntry,
  EasterEggEntry,
  BossEntry,
  UnitLockRequirement,
} from "./InstructorGamificationPanel";

export { ArmoriaShield } from "./ArmoriaShield";
export type { ArmoriaShieldProps } from "./ArmoriaShield";
export { ArmorEditor } from "./ArmorEditor";
export type {
  ArmorEditorProps,
  ArmorEditorConfig,
  ChargeConfig,
} from "./ArmorEditor";
export { LexicalPlainTextField } from "./LexicalPlainTextField";
export type { LexicalPlainTextFieldProps } from "./LexicalPlainTextField";

export { SquadEditor } from "./SquadEditor";
export type { SquadEditorProps } from "./SquadEditor";

export { PixelSpriteMascot, STAGE_LABELS } from "./PixelSpriteMascot";
export type { PixelSpriteMascotProps } from "./PixelSpriteMascot";

export { XPTunerDialog, XPTunerInline } from "./XPTunerDialog";
export type {
  XPTunerDialogProps,
  XPTunerInlineProps,
  XPTunerConfig,
  XPMultipliers,
  XPMultiplierConfig,
} from "./XPTunerDialog";

export {
  BadgeVisualPicker,
  resolveIcon,
  getIconCatalog,
} from "./BadgeVisualPicker";
export type { BadgeVisualPickerProps } from "./BadgeVisualPicker";

export { BadgeEditor } from "./BadgeEditor";
export type {
  BadgeEditorProps,
  BadgeOverride,
  CustomBadge,
  CustomBadgeVisual,
  BadgeBuff,
} from "./BadgeEditor";

export { SquadMentionPill, renderSquadMentions } from "./SquadMentionPill";
export type { SquadMentionPillProps } from "./SquadMentionPill";

export { SquadMessagePanel } from "./SquadMessagePanel";
export type {
  SquadMessagePanelProps,
  SquadInfo,
  ResolvedMessage,
} from "./SquadMessagePanel";

export { ChallengeRecapCard } from "./ChallengeRecapCard";
export type { ChallengeRecapCardProps, RecapEntry } from "./ChallengeRecapCard";
