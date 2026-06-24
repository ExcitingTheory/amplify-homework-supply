"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AdminRouteGuard from "../_components/AdminRouteGuard";
import { InstructorGamificationPanel } from "@/components/Gamification/InstructorGamificationPanel";
import { AIAgentConfig as AIAgentConfigComponent } from "@/components/AIAgentConfig";
import {
  useSkillTree,
  useCampaign,
  useSquad,
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
  const { sections } = React.useContext(SectionContext) as { sections: any[] };
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(
    () => (params.section as string) || null,
  );

  // Update URL when section changes
  const handleSectionChange = React.useCallback(
    (sectionId: string | null) => {
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
      setSelectedSectionId(params.section as string);
    }
  }, [params.section]);

  // --- Data from existing gamification context hooks ---
  const { skillNodes } = useSkillTree();
  const { campaign, activeChallenges, completedChallenges } = useCampaign();
  const { squadLeaderboard } = useSquad();

  // --- Local state for models not in the gamification context ---
  const [easterEggs, setEasterEggs] = React.useState<any[]>([]);
  const [bossBattles, setBossBattles] = React.useState<any[]>([]);
  const [badgeOverrides, setBadgeOverrides] = React.useState<any[]>([]);
  const [customBadges, setCustomBadges] = React.useState<any[]>([]);
  const [xpConfig, setXpConfig] = React.useState<any>(null);
  const [platformSettingsRecord, setPlatformSettingsRecord] =
    React.useState<any>(null);
  const [linearLockEnabled, setLinearLockEnabled] = React.useState(false);
  const [unitLockRequirements, setUnitLockRequirements] = React.useState<Record<string, any>>({});
  const [availableUnits, setAvailableUnits] = React.useState<any[]>([]);
  const [availableBadges, setAvailableBadges] = React.useState<any[]>([]);

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
        const locks: Record<string, any> = {};
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

  // Load available badges for the selected section
  React.useEffect(() => {
    if (!client?.models?.Badge) return;
    const sub = client.models.Badge.observeQuery().subscribe({
      next: ({ items }) => {
        const valid = items.filter((b) => b != null && !b._deleted);
        const filtered = selectedSectionId
          ? valid.filter((b) => !b.cohortId || b.cohortId === selectedSectionId)
          : valid;
        setAvailableBadges(
          filtered.map((b) => ({ id: b.id, title: b.title || b.id })),
        );
      },
      error: (err) =>
        console.warn("[GamificationAdmin] Badge subscription error:", err),
    });
    return () => sub.unsubscribe();
  }, [client, selectedSectionId]);

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
            type: (SCHEMA_TO_TRIGGER_TYPE as any)[egg.trigger as string] || egg.trigger,
            message: egg.revealMessage || "",
            xpReward: egg.xpReward || 0,
            keyword:
              egg.trigger === "KEYWORD" ? egg.triggerValue || "" : undefined,
            triggerValue: egg.triggerValue || "",
            achievementRule:
              egg.trigger === "ACHIEVEMENT"
                ? egg.triggerValue || ""
                : undefined,
            secretLinkUnitId:
              egg.trigger === "SECRET_LINK"
                ? egg.triggerValue || ""
                : undefined,
            badgeId: egg.badgeId || undefined,
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
            startDate: (boss as any).startDate || undefined,
            deadline: boss.deadline || undefined,
            bonusMultiplier: boss.bonusMultiplier || 1.5,
            setting: boss.setting || undefined,
            stakes: boss.stakes || undefined,
            featuredImage: boss.featuredImage || undefined,
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
  const skills: any[] = React.useMemo(
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

  const squads = React.useMemo(
    () =>
      squadLeaderboard.map((g) => ({
        id: g.id,
        name: g.name || "",
        memberCount: g.memberCount,
      })),
    [squadLeaderboard],
  );

  // --- CRUD Callbacks ---

  const handlePrerequisiteChange = React.useCallback(
    async (skillId: string, prerequisites: any) => {
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
    async (skill: any) => {
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
    async (skillId: string) => {
      try {
        const { data } = await client.models.Skill.get({ id: skillId });
        await (client.models.Skill as any).delete({
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
    async (campaignData: any) => {
      // Campaign model was removed — campaigns are now GroupChallenge records with chapterOrder
      console.warn("[GamificationAdmin] handleSaveCampaign called but Campaign model no longer exists. Use GroupChallenge instead.");
    },
    [],
  );

  const handleDeleteCampaign = React.useCallback(
    async (campaignId: string) => {
      // Campaign model was removed — campaigns are now GroupChallenge records with chapterOrder
      console.warn("[GamificationAdmin] handleDeleteCampaign called but Campaign model no longer exists. Use GroupChallenge instead.");
    },
    [],
  );

  const handleGenerateCampaign = React.useCallback(async (title: string) => {
    return generateCampaignNarrative(title, selectedSectionId || undefined);
  }, [selectedSectionId]);

  // --- Badge customization handlers ---
  const handleBadgeOverrideChange = React.useCallback((override: any) => {
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

  const handleBadgeOverrideReset = React.useCallback((badgeType: string) => {
    setBadgeOverrides((prev) => prev.filter((o) => o.badgeType !== badgeType));
  }, []);

  const handleAddCustomBadge = React.useCallback((badge: any) => {
    setCustomBadges((prev) => [
      ...prev,
      {
        ...badge,
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
    ]);
  }, []);

  const handleDeleteCustomBadge = React.useCallback((badgeId: string) => {
    setCustomBadges((prev) => prev.filter((b) => b.id !== badgeId));
  }, []);

  const handleCreateSquad = React.useCallback(
    async (name: string, cohortId: string) => {
      try {
        await client.models.Squad.create({
          name,
          cohortId,
          totalXP: 0,
        });
      } catch (err) {
        console.error("[GamificationAdmin] Failed to create Squad:", err);
      }
    },
    [client],
  );

  const handleDeleteSquad = React.useCallback(
    async (squadId: string) => {
      try {
        const { data } = await client.models.Squad.get({ id: squadId });
        await (client.models.Squad as any).delete({
          id: squadId,
          _version: data?._version,
        });
      } catch (err) {
        console.error("[GamificationAdmin] Failed to delete Squad:", err);
      }
    },
    [client],
  );

  const handleAddEasterEgg = React.useCallback(
    async (egg: any) => {
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
          trigger: (TRIGGER_TYPE_TO_SCHEMA as any)[egg.type] || "KEYWORD",
          triggerValue,
          xpReward: egg.xpReward || 50,
          revealMessage: egg.message,
          active: true,
          cohortId: selectedSectionId || undefined,
          badgeId: egg.badgeId || undefined,
        });
      } catch (err) {
        console.error("[GamificationAdmin] Failed to create EasterEgg:", err);
      }
    },
    [client, selectedSectionId],
  );

  const handleDeleteEasterEgg = React.useCallback(
    async (eggId: string) => {
      try {
        const existing = easterEggs.find((e) => e.id === eggId);
        await (client.models.EasterEgg as any).delete({
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
    async (bossId: string) => {
      try {
        const existing = bossBattles.find((b) => b.id === bossId);
        await (client.models.GroupChallenge as any).delete({
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
    async (bossData: any) => {
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
        } as any);
      } catch (err) {
        console.error(
          "[GamificationAdmin] Failed to create GroupChallenge:",
          err,
        );
      }
    },
    [client, selectedSectionId],
  );

  const handleEditBoss = React.useCallback(
    async (bossId: string, bossData: any) => {
      try {
        const existing = bossBattles.find((b) => b.id === bossId);
        await client.models.GroupChallenge.update({
          id: bossId,
          title: bossData.title,
          targetXP: bossData.targetXP,
          bonusMultiplier: bossData.bonusMultiplier || 1.5,
          startDate: bossData.startDate || undefined,
          deadline: bossData.deadline || undefined,
          setting: bossData.setting || "",
          stakes: bossData.stakes || "",
          featuredImage: bossData.featuredImage || undefined,
          _version: existing?._version,
        } as any);
      } catch (err) {
        console.error(
          "[GamificationAdmin] Failed to update GroupChallenge:",
          err,
        );
      }
    },
    [client, bossBattles],
  );

  const handleToggleBossActive = React.useCallback(
    async (bossId: string, active: boolean) => {
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
    async (newConfig: any) => {
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
          } as any);
        } else {
          // Create the singleton record
          await client.models.PlatformSettings.create(input as any);
        }
        setXpConfig(newConfig);
      } catch (err) {
        console.error("[GamificationAdmin] Failed to save XP config:", err);
      }
    },
    [client, platformSettingsRecord],
  );

  const handleToggleLinearLock = React.useCallback(
    async (enabled: boolean) => {
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
    async (unitId: string, requirements: any) => {
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
    async (unitId: string) => {
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
    async (sourceSectionId: string) => {
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
          availableBadges={availableBadges}
          skills={skills}
          campaigns={campaigns}
          squads={squads}
          easterEggs={easterEggs}
          bossBattles={bossBattles}
          onAddSkill={handleAddSkill}
          onDeleteSkill={handleDeleteSkill}
          onPrerequisiteChange={handlePrerequisiteChange}
          onSaveCampaign={handleSaveCampaign}
          onDeleteCampaign={handleDeleteCampaign}
          onGenerateCampaign={handleGenerateCampaign}
          onCreateSquad={handleCreateSquad}
          onDeleteSquad={handleDeleteSquad}
          onAddEasterEgg={handleAddEasterEgg}
          onDeleteEasterEgg={handleDeleteEasterEgg}
          onAddBoss={handleAddBoss}
          onEditBoss={handleEditBoss}
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
      <Box
        sx={{
          maxWidth: "80rem",
          margin: "0 auto 3rem",
          padding: "1rem",
        }}
      >
        <AdminAIConfig
          platformSettings={platformSettingsRecord}
          client={client}
        />
      </Box>
    </>
  );
}

// ============================================================================
// Admin AI Configuration — reads/writes PlatformSettings agent fields
// ============================================================================

function AdminAIConfig({
  platformSettings,
  client,
}: {
  platformSettings: any;
  client: any;
}) {
  const [values, setValues] = React.useState<any>({});
  const [saving, setSaving] = React.useState(false);

  // Hydrate from PlatformSettings record
  React.useEffect(() => {
    if (!platformSettings) return;
    setValues({
      defaultAIModel: platformSettings.defaultAIModel || "gpt-4o",
      kaiModel: platformSettings.kaiModel || "",
      sageModel: platformSettings.sageModel || "",
      kaiTemperature: platformSettings.kaiTemperature ?? null,
      sageTemperature: platformSettings.sageTemperature ?? null,
      kaiMaxTokens: platformSettings.kaiMaxTokens ?? null,
      sageMaxTokens: platformSettings.sageMaxTokens ?? null,
      agentMaxSteps: platformSettings.agentMaxSteps ?? null,
      kaiMaxSteps: platformSettings.kaiMaxSteps ?? null,
      sageMaxSteps: platformSettings.sageMaxSteps ?? null,
      searchThreshold: platformSettings.searchThreshold ?? null,
      searchDefaultLimit: platformSettings.searchDefaultLimit ?? null,
      memoryEnabled: platformSettings.memoryEnabled ?? true,
      memorySummarizationModel:
        platformSettings.memorySummarizationModel || "gpt-4o-mini",
      kaiEnabled: platformSettings.kaiEnabled ?? true,
      sageEnabled: platformSettings.sageEnabled ?? true,
      kaiSystemPromptOverride:
        platformSettings.kaiSystemPromptOverride || "",
      sageSystemPromptOverride:
        platformSettings.sageSystemPromptOverride || "",
      systemPromptBudget: platformSettings.systemPromptBudget ?? null,
      toolResultBudget: platformSettings.toolResultBudget ?? null,
      totalTurnBudget: platformSettings.totalTurnBudget ?? null,
      kaiSystemPromptBudget: platformSettings.kaiSystemPromptBudget ?? null,
      sageSystemPromptBudget: platformSettings.sageSystemPromptBudget ?? null,
      kaiToolResultBudget: platformSettings.kaiToolResultBudget ?? null,
      sageToolResultBudget: platformSettings.sageToolResultBudget ?? null,
      kaiTotalTurnBudget: platformSettings.kaiTotalTurnBudget ?? null,
      sageTotalTurnBudget: platformSettings.sageTotalTurnBudget ?? null,
    });
  }, [platformSettings]);

  const handleSave = React.useCallback(async () => {
    if (!platformSettings?.id || !client?.models?.PlatformSettings) return;
    setSaving(true);
    try {
      const updatePayload: any = {
        id: platformSettings.id,
        _version: platformSettings._version,
      };

      // Only include non-default values
      if (values.defaultAIModel)
        updatePayload.defaultAIModel = values.defaultAIModel;
      if (values.kaiModel) updatePayload.kaiModel = values.kaiModel;
      if (values.sageModel) updatePayload.sageModel = values.sageModel;
      if (values.kaiTemperature != null)
        updatePayload.kaiTemperature = values.kaiTemperature;
      if (values.sageTemperature != null)
        updatePayload.sageTemperature = values.sageTemperature;
      if (values.kaiMaxTokens != null)
        updatePayload.kaiMaxTokens = values.kaiMaxTokens;
      if (values.sageMaxTokens != null)
        updatePayload.sageMaxTokens = values.sageMaxTokens;
      if (values.agentMaxSteps != null)
        updatePayload.agentMaxSteps = values.agentMaxSteps;
      if (values.kaiMaxSteps != null)
        updatePayload.kaiMaxSteps = values.kaiMaxSteps;
      if (values.sageMaxSteps != null)
        updatePayload.sageMaxSteps = values.sageMaxSteps;
      if (values.searchThreshold != null)
        updatePayload.searchThreshold = values.searchThreshold;
      if (values.searchDefaultLimit != null)
        updatePayload.searchDefaultLimit = values.searchDefaultLimit;
      updatePayload.memoryEnabled = values.memoryEnabled ?? true;
      if (values.memorySummarizationModel)
        updatePayload.memorySummarizationModel =
          values.memorySummarizationModel;
      updatePayload.kaiEnabled = values.kaiEnabled ?? true;
      updatePayload.sageEnabled = values.sageEnabled ?? true;
      if (values.kaiSystemPromptOverride)
        updatePayload.kaiSystemPromptOverride =
          values.kaiSystemPromptOverride;
      if (values.sageSystemPromptOverride)
        updatePayload.sageSystemPromptOverride =
          values.sageSystemPromptOverride;
      // Token budgets
      if (values.systemPromptBudget != null)
        updatePayload.systemPromptBudget = values.systemPromptBudget;
      if (values.toolResultBudget != null)
        updatePayload.toolResultBudget = values.toolResultBudget;
      if (values.totalTurnBudget != null)
        updatePayload.totalTurnBudget = values.totalTurnBudget;
      if (values.kaiSystemPromptBudget != null)
        updatePayload.kaiSystemPromptBudget = values.kaiSystemPromptBudget;
      if (values.sageSystemPromptBudget != null)
        updatePayload.sageSystemPromptBudget = values.sageSystemPromptBudget;
      if (values.kaiToolResultBudget != null)
        updatePayload.kaiToolResultBudget = values.kaiToolResultBudget;
      if (values.sageToolResultBudget != null)
        updatePayload.sageToolResultBudget = values.sageToolResultBudget;
      if (values.kaiTotalTurnBudget != null)
        updatePayload.kaiTotalTurnBudget = values.kaiTotalTurnBudget;
      if (values.sageTotalTurnBudget != null)
        updatePayload.sageTotalTurnBudget = values.sageTotalTurnBudget;

      await client.models.PlatformSettings.update(updatePayload);
    } catch (err) {
      console.error("[AdminAIConfig] Save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [platformSettings, client, values]);

  if (!platformSettings) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading platform settings...
      </Typography>
    );
  }

  return (
    <AIAgentConfigComponent
      values={values}
      onChange={setValues}
      onSave={handleSave}
      saving={saving}
      mode="platform"
    />
  );
}

export default function WrappedPage() {
  return (
      <AdminRouteGuard>
        <SectionProvider unitId={undefined as any}>
          <GamificationProviderWrapper cohortId={undefined as any}>
            <GamificationAdmin />
          </GamificationProviderWrapper>
        </SectionProvider>
      </AdminRouteGuard>
  );
}
