import { defineFunction } from "@aws-amplify/backend";

/**
 * Leaderboard Stream Lambda
 *
 * Triggered by DynamoDB Streams on the StudentXPLog table.
 * On INSERT events, extracts the cohortId and triggers a debounced
 * leaderboard rebuild via the gamification handler's rebuildLeaderboard mutation.
 *
 * This decouples leaderboard rebuilds from the XP award hot path,
 * preventing timeout risk and enabling natural batching (DynamoDB Streams
 * deliver records in batches of up to 100).
 */
export const leaderboardStreamHandler = defineFunction({
  timeoutSeconds: 120, // Leaderboard rebuilds can be slow for large cohorts
  memoryMB: 256,
  resourceGroupName: "data",
});
