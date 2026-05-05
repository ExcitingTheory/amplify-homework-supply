import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Gamification Lambda function resource
 *
 * Handles:
 * - awardXP: Creates StudentXPLog entry for an action
 * - checkBadges: Evaluates badge criteria after XP write
 * - updateStreak: Updates StudentStreak (called on Grade submit)
 * - rebuildLeaderboard: Rebuilds LeaderboardEntry rows for a cohort
 * - updateStudentMemory: Appends AI feedback to StudentMemory markdown
 * - generateSkillTree: Extracts skills from unit content via GPT-4o
 *
 * Authorization: Called via custom mutations from authenticated users and triggers
 */

export const gamificationHandler = defineFunction({
  timeoutSeconds: 60,
  memoryMB: 512,
  resourceGroupName: 'data',
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});
