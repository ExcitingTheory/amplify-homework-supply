import { defineFunction } from '@aws-amplify/backend';

/**
 * Streak Reset Cron Lambda
 *
 * Runs daily at midnight UTC to reset StudentStreak.currentStreak to 0
 * for any student whose lastActivityDate is before yesterday.
 *
 * This ensures streaks only survive consecutive calendar days of activity.
 */

export const streakResetCronHandler = defineFunction({
  name: 'streak-reset-cron',
  timeoutSeconds: 60,
  memoryMB: 256,
  resourceGroupName: 'data', // Must be in data stack — references AppSync API
  schedule: 'every day',
});
