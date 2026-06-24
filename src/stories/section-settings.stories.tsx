/**
 * @fileoverview Stories for section-level settings pages
 *
 * These pages use `useParams()` for the section ID and load data via subscriptions.
 * In Storybook, the nextjs.navigation parameter provides the route params.
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import SectionAISettingsPage from '../../app/[locale]/section/[id]/settings/ai/page';
import GamificationSettingsPage from '../../app/[locale]/section/[id]/settings/gamification/page';

const aiMeta: Meta<typeof SectionAISettingsPage> = {
  title: '📄 Pages/Section Settings/AI Settings',
  component: SectionAISettingsPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/section/test-section-123/settings/ai',
        params: { id: 'test-section-123' },
      },
    },
  },
};

export default aiMeta;
type AIStory = StoryObj<typeof SectionAISettingsPage>;

export const AISettings: AIStory = {};

// ─── Gamification Settings ─────────────────────────────────────────────

export const GamificationSettings: StoryObj<typeof GamificationSettingsPage> = {
  render: () => <GamificationSettingsPage />,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/section/test-section-456/settings/gamification',
        params: { id: 'test-section-456' },
      },
    },
  },
};
