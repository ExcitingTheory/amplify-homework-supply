import { defineFunction } from '@aws-amplify/backend';

/**
 * Gamification Lambda function resource
 *
 * Handles:
 * - awardXP: Creates StudentXPLog entry for an action
 * - checkBadges: Evaluates badge criteria after XP write
 * - updateStreak: Updates StudentStreak (called on Grade submit)
 * - rebuildLeaderboard: Rebuilds LeaderboardEntry rows for a cohort
 * - updateStudentMemory: Appends AI feedback to StudentMemory markdown
 *
 * Authorization: Called via custom mutations from authenticated users and triggers
 */

export const gamificationHandler = defineFunction({
  timeoutSeconds: 30,
  memoryMB: 256,
  resourceGroupName: 'data',
});
