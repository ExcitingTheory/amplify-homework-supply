"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MyAuth from "@/components/AmplifyAuthenticator";
import { InstructorGamificationPanel } from "@/components/Gamification/InstructorGamificationPanel";
import {
  useSkillTree,
  useCampaign,
  useGuild,
} from "@/context/gamificationContext";
import { GamificationProviderWrapper } from "@/context/gamificationProviderWrapper";
import SectionContext from "@/context/sectionContext";
import { SectionProvider } from "@/context/sectionContext";
import { getAmplifyClient } from "@/utils/amplifyClient";
import { generateCampaignNarrative } from "../../../actions/gamification";
import { useRouter, useParams, usePathname } from "next/navigation";

// ============================================================================
// Trigger type mapping (identity — schema now uses new enum directly)
// ============================================================================

const TRIGGER_TYPE_TO_SCHEMA = {
  KEYWORD: "KEYWORD",
  SCHEDULE: "SCHEDULE",
  SECRET_LINK: "SECRET_LINK",
  ACHIEVEMENT: "ACHIEVEMENT",
};

const SCHEMA_TO_TRIGGER_TYPE = {
  KEYWORD: "KEYWORD",
  SCHEDULE: "SCHEDULE",
  SECRET_LINK: "SECRET_LINK",
  ACHIEVEMENT: "ACHIEVEMENT",
};

// ============================================================================
// Container component — wires context data + CRUD to the panel
// ============================================================================

function GamificationAdmin() {
  const client = React.useMemo(() => getAmplifyClient(), []);
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  // --- Section selection with URL persistence ---
  const { sections } = React.useContext(SectionContext);
  const [selectedSectionId, setSelectedSectionId] = React.useState(
    () => params.section || null,
  );

  // Update URL when section changes
  const handleSectionChange = React.useCallback(
    (sectionId) => {
      setSelectedSectionId(sectionId);
      const searchParams = new URLSearchParams();
      if (sectionId) {
        searchParams.set("section", sectionId);
      }
      router.replace(`${pathname}${sectionId ? `?section=${sectionId}` : ""}`, {
        scroll: false,
      });
    },
    [router, pathname],
  );

  // Sync from URL on initial load
  React.useEffect(() => {
    if (params.section && params.section !== selectedSectionId) {
      setSelectedSectionId(params.section);
    }
  }, [params.section]);

  // --- Data from existing gamification context hooks ---
  const { skillNodes } = useSkillTree();
  const { campaign, activeChallenges, completedChallenges } = useCampaign();
  const { guildLeaderboard } = useGuild();

  // --- Local state for models not in the gamification context ---
  const [easterEggs, setEasterEggs] = React.useState([]);
  const [bossBattles, setBossBattles] = React.useState([]);
  const [badgeOverrides, setBadgeOverrides] = React.useState([]);
  const [customBadges, setCustomBadges] = React.useState([]);
  const [xpConfig, setXpConfig] = React.useState(null);
  const [platformSettingsRecord, setPlatformSettingsRecord] =
    React.useState(null);
  const [linearLockEnabled, setLinearLockEnabled] = React.useState(false);
  const [unitLockRequirements, setUnitLockRequirements] = React.useState({});
  const [availableUnits, setAvailableUnits] = React.useState([]);

  // Load all units for the availableUnits list
  React.useEffect(() => {
    if (!client?.models?.Unit) return;
    const sub = client.models.Unit.observeQuery().subscribe({
      next: ({ items }) => {
        const units = items
          .filter((u) => u != null && !u._deleted)
          .map((u) => ({ id: u.id, name: u.name || u.id }));
        setAvailableUnits(units);

        // Build unit lock requirements from unit data
        const locks = {};
        items
          .filter((u) => u != null && !u._deleted)
          .forEach((u) => {
            if (
              u.requiredXP ||
              u.requiredBadgeId ||
              u.requiredModuleCompletion
            ) {
              locks[u.id] = {
                requiredXP: u.requiredXP || undefined,
                requiredBadgeId: u.requiredBadgeId || undefined,
                requiredModuleCompletion:
                  u.requiredModuleCompletion || undefined,
              };
            }
          });
        setUnitLockRequirements(locks);
      },
      error: (err) =>
        console.warn("[GamificationAdmin] Unit subscription error:", err),
    });
    return () => sub.unsubscribe();
  }, [client]);

  // Load xpConfig from global PlatformSettings (singleton)
  React.useEffect(() => {
    if (!client?.models?.PlatformSettings) return;
    const sub = client.models.PlatformSettings.observeQuery().subscribe({
      next: ({ items }) => {
        const valid = (items || []).filter((i) => i != null && i.id != null);
        const record = valid[0] || null;
        setPlatformSettingsRecord(record);
        if (record) {
          // Reconstruct XPTunerConfig shape from the flat PlatformSettings fields
          const multipliers = record.xpMultipliers
            ? typeof record.xpMultipliers === "string"
              ? JSON.parse(record.xpMultipliers)
              : record.xpMultipliers
            : undefined;
          const levelThresholds = record.levelThresholds
            ? typeof record.levelThresholds === "string"
              ? JSON.parse(record.levelThresholds)
              : record.levelThresholds
            : undefined;
          const avatarUnlocks = record.avatarUnlockConfig
            ? typeof record.avatarUnlockConfig === "string"
              ? JSON.parse(record.avatarUnlockConfig)
              : record.avatarUnlockConfig
            : undefined;
          setXpConfig({
            multipliers: multipliers || undefined,
            dailyCap: record.dailyCap ?? undefined,
            weeklyCap: record.weeklyCap ?? undefined,
            enabled: true,
            levelConfig: levelThresholds
              ? { thresholds: levelThresholds }
              : undefined,
            avatarUnlocks: avatarUnlocks || undefined,
          });
        } else {
          setXpConfig(null);
        }
      },
      error: (err) =>
        console.warn(
          "[GamificationAdmin] PlatformSettings subscription error:",
          err,
        ),
    });
    return () => sub.unsubscribe();
  }, [client]);

  // Load linearLockEnabled from the selected section (still section-specific)
  React.useEffect(() => {
    if (!selectedSectionId || !sections) {
      setLinearLockEnabled(false);
      return;
    }
    const section = sections.find((s) => s.id === selectedSectionId);
    setLinearLockEnabled(!!section?.linearLockEnabled);
  }, [selectedSectionId, sections]);

  // Subscribe to EasterEgg model — filter by selected section
  React.useEffect(() => {
    if (!client?.models?.EasterEgg) return;
    const sub = client.models.EasterEgg.observeQuery().subscribe({
      next: ({ items }) => {
        const valid = items.filter((item) => item != null && !item._deleted);
        // Client-side section filter (cohortId may not exist on all eggs yet)
        const filtered = selectedSectionId
          ? valid.filter(
              (egg) => !egg.cohortId || egg.cohortId === selectedSectionId,
            )
          : valid;
        setEasterEggs(
          filtered.map((egg) => ({
            id: egg.id,
            type: SCHEMA_TO_TRIGGER_TYPE[egg.trigger] || egg.trigger,
            message: egg.revealMessage || "",
            xpReward: egg.xpReward || 0,
            keyword:
              egg.trigger === "KEYWORD" ? egg.triggerValue || "" : undefined,
            triggerValue: egg.triggerValue || "",
            achievementRule:
              egg.trigger === "SUBMISSION_QUALITY"
                ? egg.triggerValue || ""
                : undefined,
            secretLinkUnitId:
              egg.trigger === "UI_INTERACTION"
                ? egg.triggerValue || ""
                : undefined,
            _version: egg._version,
          })),
        );
      },
      error: (err) =>
        console.warn("[GamificationAdmin] EasterEgg subscription error:", err),
    });
    return () => sub.unsubscribe();
  }, [client, selectedSectionId]);

  // Subscribe to GroupChallenge (boss battles) model — filter by section
  React.useEffect(() => {
    if (!client?.models?.GroupChallenge) return;
    const sub = client.models.GroupChallenge.observeQuery().subscribe({
      next: ({ items }) => {
        const valid = items.filter((item) => item != null && !item._deleted);
        const filtered = selectedSectionId
          ? valid.filter((boss) => boss.cohortId === selectedSectionId)
          : valid;
        setBossBattles(
          filtered.map((boss) => ({
            id: boss.id,
            title: boss.title || "",
            targetXP: boss.targetXP || 0,
            currentXP: boss.currentXP || 0,
            active: boss.active ?? true,
            startDate: boss.startDate || undefined,
            deadline: boss.deadline || undefined,
            bonusMultiplier: boss.bonusMultiplier || 1.5,
            setting: boss.setting || undefined,
            stakes: boss.stakes || undefined,
            contributors: boss.contributions || [],
            _version: boss._version,
          })),
        );
      },
      error: (err) =>
        console.warn(
          "[GamificationAdmin] GroupChallenge subscription error:",
          err,
        ),
    });
    return () => sub.unsubscribe();
  }, [client, selectedSectionId]);

  // --- Transform context data to panel prop shapes ---
  const skills = React.useMemo(
    () =>
      skillNodes.map((node) => ({
        id: node.skillId,
        title: node.title,
        description: node.description,
        xpReward: node.xpReward,
        prerequisites: node.prerequisites,
        unitIds: node.unitIds,
        minimumAccuracy: node.minimumAccuracy,
      })),
    [skillNodes],
  );

  // Build section options for the selector
  const sectionOptions = React.useMemo(
    () =>
      (sections || []).map((s) => ({
        id: s.id,
        name: s.name || s.id,
        description: s.description,
      })),
    [sections],
  );

  const campaigns = React.useMemo(() => {
    if (!campaign) return [];
    return [
      {
        id: campaign.id,
        title: campaign.title || "",
        setting: campaign.setting,
        stakes: campaign.stakes,
      },
    ];
  }, [campaign]);

  const guilds = React.useMemo(
    () =>
      guildLeaderboard.map((g) => ({
        id: g.id,
        name: g.name || "",
        memberCount: g.memberCount,
      })),
    [guildLeaderboard],
  );

  // --- CRUD Callbacks ---

  const handlePrerequisiteChange = React.useCallback(
    async (skillId, prerequisites) => {
      try {
        const { data } = await client.models.Skill.get({ id: skillId });
        await client.models.Skill.update({
          id: skillId,
          prerequisites: JSON.stringify(prerequisites),
          _version: data?._version,
        });
      } catch (err) {
        console.error(
          "[GamificationAdmin] Failed to update prerequisites:",
          err,
        );
      }
    },
    [client],
  );

  const handleAddSkill = React.useCallback(
    async (skill) => {
      try {
        await client.models.Skill.create({
          title: skill.title,
          description: skill.description || "",
          xpReward: skill.xpReward || 0,
          cohortId: selectedSectionId || undefined,
        });
      } catch (err) {
        console.error("[GamificationAdmin] Failed to create Skill:", err);
      }
    },
    [client, selectedSectionId],
  );

  const handleDeleteSkill = React.useCallback(
    async (skillId) => {
      try {
        const { data } = await client.models.Skill.get({ id: skillId });
        await client.models.Skill.delete({
          id: skillId,
          _version: data?._version,
        });
      } catch (err) {
        console.error("[GamificationAdmin] Failed to delete Skill:", err);
      }
    },
    [client],
  );

  const handleSaveCampaign = React.useCallback(
    async (campaignData) => {
      try {
        if (campaignData.id) {
          const { data } = await client.models.Campaign.get({
            id: campaignData.id,
          });
          await client.models.Campaign.update({
            id: campaignData.id,
            title: campaignData.title,
            setting: campaignData.setting || "",
            stakes: campaignData.stakes || "",
            _version: data?._version,
          });
        } else {
          await client.models.Campaign.create({
            title: campaignData.title,
            setting: campaignData.setting || "",
            stakes: campaignData.stakes || "",
          });
        }
      } catch (err) {
        console.error("[GamificationAdmin] Failed to save Campaign:", err);
      }
    },
    [client],
  );

  const handleDeleteCampaign = React.useCallback(
    async (campaignId) => {
      try {
        const { data } = await client.models.Campaign.get({ id: campaignId });
        await client.models.Campaign.delete({
          id: campaignId,
          _version: data?._version,
        });
      } catch (err) {
        console.error("[GamificationAdmin] Failed to delete Campaign:", err);
      }
    },
    [client],
  );

  const handleGenerateCampaign = React.useCallback(async (title) => {
    return generateCampaignNarrative(title);
  }, []);

  // --- Badge customization handlers ---
  const handleBadgeOverrideChange = React.useCallback((override) => {
    setBadgeOverrides((prev) => {
      const idx = prev.findIndex((o) => o.badgeType === override.badgeType);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = override;
        return next;
      }
      return [...prev, override];
    });
  }, []);

  const handleBadgeOverrideReset = React.useCallback((badgeType) => {
    setBadgeOverrides((prev) => prev.filter((o) => o.badgeType !== badgeType));
  }, []);

  const handleAddCustomBadge = React.useCallback((badge) => {
    setCustomBadges((prev) => [
      ...prev,
      {
        ...badge,
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
    ]);
  }, []);

  const handleDeleteCustomBadge = React.useCallback((badgeId) => {
    setCustomBadges((prev) => prev.filter((b) => b.id !== badgeId));
  }, []);

  const handleCreateGuild = React.useCallback(
    async (name, cohortId) => {
      try {
        await client.models.Guild.create({
          name,
          cohortId,
          totalXP: 0,
        });
      } catch (err) {
        console.error("[GamificationAdmin] Failed to create Guild:", err);
      }
    },
    [client],
  );

  const handleDeleteGuild = React.useCallback(
    async (guildId) => {
      try {
        const { data } = await client.models.Guild.get({ id: guildId });
        await client.models.Guild.delete({
          id: guildId,
          _version: data?._version,
        });
      } catch (err) {
        console.error("[GamificationAdmin] Failed to delete Guild:", err);
      }
    },
    [client],
  );

  const handleAddEasterEgg = React.useCallback(
    async (egg) => {
      try {
        // Build triggerValue based on type
        let triggerValue = "";
        switch (egg.type) {
          case "KEYWORD":
            triggerValue = egg.keyword || "";
            break;
          case "SCHEDULE":
            triggerValue = JSON.stringify({
              start: egg.scheduleStart,
              end: egg.scheduleEnd,
            });
            break;
          case "SECRET_LINK":
            triggerValue = egg.secretLinkUnitId || "";
            break;
          case "ACHIEVEMENT":
            triggerValue = egg.achievementRule || "";
            break;
        }

        await client.models.EasterEgg.create({
          trigger: TRIGGER_TYPE_TO_SCHEMA[egg.type] || "KEYWORD",
          triggerValue,
          xpReward: egg.xpReward || 50,
          revealMessage: egg.message,
          active: true,
          cohortId: selectedSectionId || undefined,
        });
      } catch (err) {
        console.error("[GamificationAdmin] Failed to create EasterEgg:", err);
      }
    },
    [client, selectedSectionId],
  );

  const handleDeleteEasterEgg = React.useCallback(
    async (eggId) => {
      try {
        const existing = easterEggs.find((e) => e.id === eggId);
        await client.models.EasterEgg.delete({
          id: eggId,
          _version: existing?._version,
        });
      } catch (err) {
        console.error("[GamificationAdmin] Failed to delete EasterEgg:", err);
      }
    },
    [client, easterEggs],
  );

  const handleDeleteBoss = React.useCallback(
    async (bossId) => {
      try {
        const existing = bossBattles.find((b) => b.id === bossId);
        await client.models.GroupChallenge.delete({
          id: bossId,
          _version: existing?._version,
        });
      } catch (err) {
        console.error(
          "[GamificationAdmin] Failed to delete GroupChallenge:",
          err,
        );
      }
    },
    [client, bossBattles],
  );

  const handleAddBoss = React.useCallback(
    async (bossData) => {
      try {
        await client.models.GroupChallenge.create({
          title: bossData.title,
          targetXP: bossData.targetXP,
          currentXP: 0,
          active: true,
          bonusMultiplier: bossData.bonusMultiplier || 1.5,
          startDate: bossData.startDate || undefined,
          deadline: bossData.deadline || undefined,
          setting: bossData.setting || "",
          stakes: bossData.stakes || "",
          cohortId: selectedSectionId || "",
        });
      } catch (err) {
        console.error(
          "[GamificationAdmin] Failed to create GroupChallenge:",
          err,
        );
      }
    },
    [client, selectedSectionId],
  );

  const handleToggleBossActive = React.useCallback(
    async (bossId, active) => {
      try {
        const existing = bossBattles.find((b) => b.id === bossId);
        await client.models.GroupChallenge.update({
          id: bossId,
          active,
          _version: existing?._version,
        });
      } catch (err) {
        console.error(
          "[GamificationAdmin] Failed to toggle GroupChallenge:",
          err,
        );
      }
    },
    [client, bossBattles],
  );

  const handleSaveXPConfig = React.useCallback(
    async (newConfig) => {
      try {
        // Convert XPTunerConfig shape into flat PlatformSettings fields
        const input = {
          xpMultipliers: newConfig.multipliers
            ? JSON.stringify(newConfig.multipliers)
            : null,
          dailyCap: newConfig.dailyCap ?? null,
          weeklyCap: newConfig.weeklyCap ?? null,
          levelThresholds: newConfig.levelConfig?.thresholds
            ? JSON.stringify(newConfig.levelConfig.thresholds)
            : null,
          avatarUnlockConfig: newConfig.avatarUnlocks
            ? JSON.stringify(newConfig.avatarUnlocks)
            : null,
          badgesEnabled: newConfig.enabled !== false,
        };

        if (platformSettingsRecord?.id) {
          // Update existing record
          await client.models.PlatformSettings.update({
            id: platformSettingsRecord.id,
            ...input,
          });
        } else {
          // Create the singleton record
          await client.models.PlatformSettings.create(input);
        }
        setXpConfig(newConfig);
      } catch (err) {
        console.error("[GamificationAdmin] Failed to save XP config:", err);
      }
    },
    [client, platformSettingsRecord],
  );

  const handleToggleLinearLock = React.useCallback(
    async (enabled) => {
      if (!selectedSectionId) return;
      try {
        const section = sections.find((s) => s.id === selectedSectionId);
        await client.models.Section.update({
          id: selectedSectionId,
          linearLockEnabled: enabled,
          _version: section?._version,
        });
        setLinearLockEnabled(enabled);
      } catch (err) {
        console.error("[GamificationAdmin] Failed to toggle linear lock:", err);
      }
    },
    [client, selectedSectionId, sections],
  );

  const handleUpdateUnitLock = React.useCallback(
    async (unitId, requirements) => {
      try {
        const { data: unit } = await client.models.Unit.get({ id: unitId });
        await client.models.Unit.update({
          id: unitId,
          requiredXP: requirements.requiredXP || null,
          requiredBadgeId: requirements.requiredBadgeId || null,
          requiredModuleCompletion:
            requirements.requiredModuleCompletion || null,
          _version: unit?._version,
        });
        setUnitLockRequirements((prev) => ({
          ...prev,
          [unitId]: requirements,
        }));
      } catch (err) {
        console.error("[GamificationAdmin] Failed to update unit lock:", err);
      }
    },
    [client],
  );

  const handleClearUnitLock = React.useCallback(
    async (unitId) => {
      try {
        const { data: unit } = await client.models.Unit.get({ id: unitId });
        await client.models.Unit.update({
          id: unitId,
          requiredXP: null,
          requiredBadgeId: null,
          requiredModuleCompletion: null,
          _version: unit?._version,
        });
        setUnitLockRequirements((prev) => {
          const next = { ...prev };
          delete next[unitId];
          return next;
        });
      } catch (err) {
        console.error("[GamificationAdmin] Failed to clear unit lock:", err);
      }
    },
    [client],
  );

  // Copy gamification settings from another section
  const handleCopyFromSection = React.useCallback(
    async (sourceSectionId) => {
      if (!selectedSectionId || !sourceSectionId) return;
      try {
        // 1. Copy Skills (reset progress, keep structure)
        const { data: sourceSkills } = await client.models.Skill.list({
          filter: { cohortId: { eq: sourceSectionId } },
        });
        for (const skill of sourceSkills || []) {
          await client.models.Skill.create({
            title: skill.title,
            description: skill.description,
            prerequisites: skill.prerequisites,
            xpReward: skill.xpReward,
            cohortId: selectedSectionId,
            unitIds: skill.unitIds || [],
            minimumAccuracy: skill.minimumAccuracy || 70,
          });
        }

        // 2. Copy Easter Eggs (reset discoveries)
        const { data: sourceEggs } = await client.models.EasterEgg.list({
          filter: { cohortId: { eq: sourceSectionId } },
        });
        for (const egg of sourceEggs || []) {
          await client.models.EasterEgg.create({
            trigger: egg.trigger,
            triggerValue: egg.triggerValue,
            xpReward: egg.xpReward,
            badgeId: egg.badgeId,
            revealMessage: egg.revealMessage,
            active: true,
            cohortId: selectedSectionId,
            discoveries: [],
          });
        }

        // 3. Copy Group Challenges (reset currentXP and contributions)
        const { data: sourceChallenges } =
          await client.models.GroupChallenge.list({
            filter: { cohortId: { eq: sourceSectionId } },
          });
        for (const challenge of sourceChallenges || []) {
          await client.models.GroupChallenge.create({
            title: challenge.title,
            targetXP: challenge.targetXP,
            currentXP: 0,
            deadline: challenge.deadline,
            active: true,
            bonusMultiplier: challenge.bonusMultiplier,
            setting: challenge.setting,
            stakes: challenge.stakes,
            systemPromptSeed: challenge.systemPromptSeed,
            chapterOrder: challenge.chapterOrder,
            cohortId: selectedSectionId,
            contributions: [],
          });
        }
      } catch (err) {
        console.error("[GamificationAdmin] Copy settings failed:", err);
      }
    },
    [client, selectedSectionId],
  );

  return (
    <>
      <Box
        sx={{
          marginTop: "1rem",
          marginBottom: "3rem",
          padding: "1rem",
          maxWidth: "80rem",
          margin: "1rem auto 3rem",
        }}
      >
        <InstructorGamificationPanel
          sections={sectionOptions}
          selectedSectionId={selectedSectionId}
          onSectionChange={handleSectionChange}
          availableUnits={availableUnits}
          skills={skills}
          campaigns={campaigns}
          guilds={guilds}
          easterEggs={easterEggs}
          bossBattles={bossBattles}
          onAddSkill={handleAddSkill}
          onDeleteSkill={handleDeleteSkill}
          onPrerequisiteChange={handlePrerequisiteChange}
          onSaveCampaign={handleSaveCampaign}
          onDeleteCampaign={handleDeleteCampaign}
          onGenerateCampaign={handleGenerateCampaign}
          onCreateGuild={handleCreateGuild}
          onDeleteGuild={handleDeleteGuild}
          onAddEasterEgg={handleAddEasterEgg}
          onDeleteEasterEgg={handleDeleteEasterEgg}
          onAddBoss={handleAddBoss}
          onDeleteBoss={handleDeleteBoss}
          onToggleBossActive={handleToggleBossActive}
          badgeOverrides={badgeOverrides}
          customBadges={customBadges}
          onBadgeOverrideChange={handleBadgeOverrideChange}
          onBadgeOverrideReset={handleBadgeOverrideReset}
          onAddCustomBadge={handleAddCustomBadge}
          onDeleteCustomBadge={handleDeleteCustomBadge}
          xpConfig={xpConfig || {}}
          onSaveXPConfig={handleSaveXPConfig}
          linearLockEnabled={linearLockEnabled}
          onToggleLinearLock={handleToggleLinearLock}
          unitLockRequirements={unitLockRequirements}
          onUpdateUnitLock={handleUpdateUnitLock}
          onClearUnitLock={handleClearUnitLock}
          onCopyFromSection={handleCopyFromSection}
        />
      </Box>
    </>
  );
}

export default function WrappedPage() {
  return (
    <MyAuth>
      <SectionProvider>
        <GamificationProviderWrapper>
          <GamificationAdmin />
        </GamificationProviderWrapper>
      </SectionProvider>
    </MyAuth>
  );
}
