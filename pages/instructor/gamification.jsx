import * as React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../../next-i18next.config';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MainToolbar from '../../src/components/MainToolbar';
import MyAuth from '../../src/components/AmplifyAuthenticator';
import { InstructorGamificationPanel } from '../../src/components/Gamification/InstructorGamificationPanel';
import { useSkillTree, useCampaign, useGuild } from '../../src/context/gamificationContext';
import { GamificationProviderWrapper } from '../../src/context/gamificationProviderWrapper';
import SectionContext from '../../src/context/sectionContext';
import { SectionProvider } from '../../src/context/sectionContext';
import { getAmplifyClient } from '../../src/utils/amplifyClient';

// ============================================================================
// Map schema enum values to UI type values and back
// ============================================================================

const TRIGGER_TO_UI = {
  KEYWORD: 'KEYWORD',
  UI_INTERACTION: 'CLICK',
  TIME_BASED: 'TIME',
  SUBMISSION_QUALITY: 'INTERACTION',
};

const UI_TO_TRIGGER = {
  KEYWORD: 'KEYWORD',
  CLICK: 'UI_INTERACTION',
  TIME: 'TIME_BASED',
  INTERACTION: 'SUBMISSION_QUALITY',
};

// ============================================================================
// Container component — wires context data + CRUD to the panel
// ============================================================================

function GamificationAdmin() {
  const client = React.useMemo(() => getAmplifyClient(), []);

  // --- Data from existing gamification context hooks ---
  const { skillNodes } = useSkillTree();
  const { campaign, activeChallenges, completedChallenges } = useCampaign();
  const { guildLeaderboard } = useGuild();
  const { sections } = React.useContext(SectionContext);

  // --- Local state for models not in the gamification context ---
  const [easterEggs, setEasterEggs] = React.useState([]);
  const [bossBattles, setBossBattles] = React.useState([]);

  // Subscribe to EasterEgg model
  React.useEffect(() => {
    if (!client?.models?.EasterEgg) return;
    const sub = client.models.EasterEgg.observeQuery().subscribe({
      next: ({ items }) => {
        const valid = items.filter((item) => item != null && !item._deleted);
        setEasterEggs(
          valid.map((egg) => ({
            id: egg.id,
            type: TRIGGER_TO_UI[egg.trigger] || egg.trigger,
            message: egg.revealMessage || '',
            xpReward: egg.xpReward || 0,
            keyword: egg.triggerValue || '',
            _version: egg._version,
          }))
        );
      },
      error: (err) => console.warn('[GamificationAdmin] EasterEgg subscription error:', err),
    });
    return () => sub.unsubscribe();
  }, [client]);

  // Subscribe to GroupChallenge (boss battles) model
  React.useEffect(() => {
    if (!client?.models?.GroupChallenge) return;
    const sub = client.models.GroupChallenge.observeQuery().subscribe({
      next: ({ items }) => {
        const valid = items.filter((item) => item != null && !item._deleted);
        setBossBattles(
          valid.map((boss) => ({
            id: boss.id,
            title: boss.title || '',
            totalHP: boss.targetXP || 0,
            phaseCount: 1, // Schema doesn't have phases yet
            active: boss.active ?? true,
            _version: boss._version,
          }))
        );
      },
      error: (err) => console.warn('[GamificationAdmin] GroupChallenge subscription error:', err),
    });
    return () => sub.unsubscribe();
  }, [client]);

  // --- Transform context data to panel prop shapes ---
  const skills = React.useMemo(
    () =>
      skillNodes.map((node) => ({
        id: node.skillId,
        title: node.title,
        description: node.description,
        xpReward: node.xpReward,
        prerequisites: node.prerequisites,
      })),
    [skillNodes]
  );

  const campaigns = React.useMemo(() => {
    if (!campaign) return [];
    return [
      {
        id: campaign.id,
        title: campaign.title || '',
        setting: campaign.setting,
        stakes: campaign.stakes,
      },
    ];
  }, [campaign]);

  const guilds = React.useMemo(
    () =>
      guildLeaderboard.map((g) => ({
        id: g.id,
        name: g.name || '',
        memberCount: g.memberCount,
      })),
    [guildLeaderboard]
  );

  // --- CRUD Callbacks ---

  const handleAddSkill = React.useCallback(
    async (skill) => {
      try {
        await client.models.Skill.create({
          title: skill.title,
          description: skill.description || '',
          xpReward: skill.xpReward || 0,
        });
      } catch (err) {
        console.error('[GamificationAdmin] Failed to create Skill:', err);
      }
    },
    [client]
  );

  const handleDeleteSkill = React.useCallback(
    async (skillId) => {
      try {
        const { data } = await client.models.Skill.get({ id: skillId });
        await client.models.Skill.delete({ id: skillId, _version: data?._version });
      } catch (err) {
        console.error('[GamificationAdmin] Failed to delete Skill:', err);
      }
    },
    [client]
  );

  const handleSaveCampaign = React.useCallback(
    async (campaignData) => {
      try {
        if (campaignData.id) {
          const { data } = await client.models.Campaign.get({ id: campaignData.id });
          await client.models.Campaign.update({
            id: campaignData.id,
            title: campaignData.title,
            setting: campaignData.setting || '',
            stakes: campaignData.stakes || '',
            _version: data?._version,
          });
        } else {
          await client.models.Campaign.create({
            title: campaignData.title,
            setting: campaignData.setting || '',
            stakes: campaignData.stakes || '',
          });
        }
      } catch (err) {
        console.error('[GamificationAdmin] Failed to save Campaign:', err);
      }
    },
    [client]
  );

  const handleDeleteCampaign = React.useCallback(
    async (campaignId) => {
      try {
        const { data } = await client.models.Campaign.get({ id: campaignId });
        await client.models.Campaign.delete({ id: campaignId, _version: data?._version });
      } catch (err) {
        console.error('[GamificationAdmin] Failed to delete Campaign:', err);
      }
    },
    [client]
  );

  const handleCreateGuild = React.useCallback(
    async (name, cohortId) => {
      try {
        await client.models.Guild.create({
          name,
          cohortId,
          totalXP: 0,
        });
      } catch (err) {
        console.error('[GamificationAdmin] Failed to create Guild:', err);
      }
    },
    [client]
  );

  const handleDeleteGuild = React.useCallback(
    async (guildId) => {
      try {
        const { data } = await client.models.Guild.get({ id: guildId });
        await client.models.Guild.delete({ id: guildId, _version: data?._version });
      } catch (err) {
        console.error('[GamificationAdmin] Failed to delete Guild:', err);
      }
    },
    [client]
  );

  const handleAddEasterEgg = React.useCallback(
    async (egg) => {
      try {
        await client.models.EasterEgg.create({
          trigger: UI_TO_TRIGGER[egg.type] || 'KEYWORD',
          triggerValue: egg.keyword || egg.message || '',
          xpReward: egg.xpReward || 50,
          revealMessage: egg.message,
          active: true,
        });
      } catch (err) {
        console.error('[GamificationAdmin] Failed to create EasterEgg:', err);
      }
    },
    [client]
  );

  const handleDeleteEasterEgg = React.useCallback(
    async (eggId) => {
      try {
        const existing = easterEggs.find((e) => e.id === eggId);
        await client.models.EasterEgg.delete({ id: eggId, _version: existing?._version });
      } catch (err) {
        console.error('[GamificationAdmin] Failed to delete EasterEgg:', err);
      }
    },
    [client, easterEggs]
  );

  const handleDeleteBoss = React.useCallback(
    async (bossId) => {
      try {
        const existing = bossBattles.find((b) => b.id === bossId);
        await client.models.GroupChallenge.delete({ id: bossId, _version: existing?._version });
      } catch (err) {
        console.error('[GamificationAdmin] Failed to delete GroupChallenge:', err);
      }
    },
    [client, bossBattles]
  );

  return (
    <>
      <AppBar position="fixed" color="inherit">
        <MainToolbar>
          <Box sx={{ flexGrow: 1, margin: '1rem' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Gamification Settings
            </Typography>
          </Box>
        </MainToolbar>
      </AppBar>
      <Box
        sx={{
          marginTop: '5rem',
          marginBottom: '3rem',
          padding: '1rem',
          maxWidth: '80rem',
          margin: '5rem auto 3rem',
        }}
      >
        <InstructorGamificationPanel
          sections={sections}
          skills={skills}
          campaigns={campaigns}
          guilds={guilds}
          easterEggs={easterEggs}
          bossBattles={bossBattles}
          onAddSkill={handleAddSkill}
          onDeleteSkill={handleDeleteSkill}
          onSaveCampaign={handleSaveCampaign}
          onDeleteCampaign={handleDeleteCampaign}
          onCreateGuild={handleCreateGuild}
          onDeleteGuild={handleDeleteGuild}
          onAddEasterEgg={handleAddEasterEgg}
          onDeleteEasterEgg={handleDeleteEasterEgg}
          onDeleteBoss={handleDeleteBoss}
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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'pages', 'components'], nextI18nextConfig)),
    },
  };
}
