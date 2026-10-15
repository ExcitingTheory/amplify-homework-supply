/**
 * XP Stream Handler (post-award processing)
 *
 * Processes DynamoDB Stream events from the StudentXPLog table.
 * On INSERT, performs all post-XP-award work via incremental rollup:
 *
 * 1. Increment totalXP on StudentProfile (rollup — no re-read of all logs)
 * 2. Recalculate level from new totalXP
 * 3. Emit level-up / XP milestone notifications
 * 4. Check badges (criteria evaluation)
 *
 * The profile update IS the leaderboard update — the leaderboard is just a
 * sorted query of StudentProfile by totalXP within a cohort. No separate
 * rebuild step needed.
 *
 * A full rebuildLeaderboard mutation remains available for admin reconciliation
 * (correcting drift from failed writes, etc.) but is NOT triggered per-event.
 *
 * This decouples ALL expensive post-award work from the XP award hot path.
 * The awardXP mutation now only: validates, creates the log entry, returns.
 */

import type { DynamoDBStreamHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import {
  MAX_RETRY_ATTEMPTS,
  sleep,
  backoffMs,
  isConditionalCheckFailure,
} from "../shared/concurrency";

// ============================================================================
// GraphQL Operations
// ============================================================================

const GET_STUDENT_PROFILE = `query GetStudentProfile($studentId: String!, $sectionID: String) {
  listStudentProfiles(filter: { studentId: { eq: $studentId }, sectionID: { eq: $sectionID } }) {
    items { id studentId sectionID totalXP level nailedItCount completedAssignments onTimeSubmissions currentStreak longestStreak lastActivityDate badges { badgeType sourceId awardedAt sectionID unitID count isAnti } easterEggs { easterEggId discoveredAt xpReward } reasonCounts totalSubmissions maxFailedAttemptsOnSingleRef recentSubmissionTimestamps activeDaysCount _version }
  }
}`;

const GET_SECTION_PROGRESS = `query GetSectionProgress($studentId: String!, $sectionId: String!) {
  listSectionProgresses(filter: { studentId: { eq: $studentId }, sectionId: { eq: $sectionId } }) {
    items { id studentId sectionId totalXP level nailedItCount completedAssignments onTimeSubmissions currentStreak longestStreak lastActivityDate badges { badgeType sourceId awardedAt sectionID unitID count isAnti } reasonCounts totalSubmissions maxFailedAttemptsOnSingleRef recentSubmissionTimestamps activeDaysCount _version }
  }
}`;

const CREATE_SECTION_PROGRESS = `mutation CreateSectionProgress($input: CreateSectionProgressInput!) {
  createSectionProgress(input: $input) { id _version }
}`;

const UPDATE_SECTION_PROGRESS = `mutation UpdateSectionProgress($input: UpdateSectionProgressInput!, $condition: ModelSectionProgressConditionInput) {
  updateSectionProgress(input: $input, condition: $condition) { id totalXP level _version }
}`;

const GET_PLATFORM_SETTINGS = `query GetPlatformSettings {
  listPlatformSettings(limit: 1) {
    items { id levelThresholds xpMultipliers badgesEnabled antiBadgesEnabled }
  }
}`;

const UPDATE_STUDENT_PROFILE = `mutation UpdateStudentProfile($input: UpdateStudentProfileInput!, $condition: ModelStudentProfileConditionInput) {
  updateStudentProfile(input: $input, condition: $condition) { id totalXP level _version }
}`;

const CHECK_BADGES_BATCH = `mutation CheckBadgesBatch($entries: AWSJSON!) {
  checkBadgesBatch(entries: $entries)
}`;

const CREATE_NOTIFICATION = `mutation CreateNotification($input: CreateNotificationInput!) {
  createNotification(input: $input) { id }
}`;

// Dedup check before creating level-up/milestone notifications — scoped to the
// recipient's own notifications via the existing byRecipient index, filtered by
// referenceId (bounded by one student's notification count, not a table scan).
const LIST_NOTIFICATIONS_BY_RECIPIENT_AND_REF = `query ListNotificationsByRecipientAndRef($recipientId: String!, $referenceId: String!) {
  listNotificationByRecipientId(recipientId: $recipientId, filter: { referenceId: { eq: $referenceId } }, limit: 1) {
    items { id }
  }
}`;

const LIST_ACTIVE_CHALLENGES_BY_SECTION = `query ListActiveChallenges($sectionID: String!) {
  listGroupChallenges(filter: { sectionID: { eq: $sectionID }, active: { eq: true } }) {
    items { id sectionID title targetXP currentXP active deadline rewardXP bonusMultiplier rewardBadge linkedUnitIds contributions { studentId xpContributed contributedAt } creditedXpLogIds _version }
  }
}`;

const UPDATE_GROUP_CHALLENGE = `mutation UpdateGroupChallenge($input: UpdateGroupChallengeInput!, $condition: ModelGroupChallengeConditionInput) {
  updateGroupChallenge(input: $input, condition: $condition) { id currentXP active _version }
}`;

const GET_GROUP_CHALLENGE = `query GetGroupChallenge($id: ID!) {
  getGroupChallenge(id: $id) {
    id sectionID title targetXP currentXP active deadline rewardXP bonusMultiplier rewardBadge linkedUnitIds contributions { studentId xpContributed contributedAt } creditedXpLogIds _version
  }
}`;

const CREATE_STUDENT_XP_LOG = `mutation CreateStudentXPLog($input: CreateStudentXPLogInput!) {
  createStudentXPLog(input: $input) { id }
}`;

const GET_STUDENT_PROFILE_FOR_REWARDS = `query GetStudentProfileForRewards($studentId: String!) {
  listStudentProfiles(filter: { studentId: { eq: $studentId } }) {
    items { id studentId cosmeticRewards badges _version }
  }
}`;

const UPDATE_STUDENT_PROFILE_REWARDS = `mutation UpdateStudentProfileRewards($input: UpdateStudentProfileInput!) {
  updateStudentProfile(input: $input) { id _version }
}`;

// ============================================================================
// Reward helpers — called from challenge completion with IAM credentials
// ============================================================================

async function grantCosmeticRewardToProfile(
  gqlClient: any,
  studentId: string,
  rewardCosmetic: string,
  sourceId: string,
): Promise<void> {
  const parts = rewardCosmetic.split(":");
  if (parts.length < 2) return;

  const type = parts[0];
  const value = parts.slice(1, parts.length > 2 ? -1 : undefined).join(":");
  const durationStr = parts.length > 2 ? parts[parts.length - 1] : null;

  let expiresAt: string | null = null;
  let durationHours: number | null = null;
  if (durationStr && durationStr !== "permanent") {
    const parsed = parseInt(durationStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      durationHours = parsed;
      expiresAt = new Date(Date.now() + parsed * 60 * 60 * 1000).toISOString();
    }
  }

  const { data } = await (gqlClient as any).graphql({
    query: GET_STUDENT_PROFILE_FOR_REWARDS,
    variables: { studentId },
  });
  const profile = data?.listStudentProfiles?.items?.[0];
  if (!profile) return;

  const existing = profile.cosmeticRewards || [];
  const alreadyGranted = existing.some(
    (r: any) => r.sourceId === sourceId && r.type === type && r.value === value,
  );
  if (alreadyGranted) return;

  await (gqlClient as any).graphql({
    query: UPDATE_STUDENT_PROFILE_REWARDS,
    variables: {
      input: {
        id: profile.id,
        cosmeticRewards: [
          ...existing,
          {
            type,
            value,
            durationHours,
            awardedAt: new Date().toISOString(),
            expiresAt,
            sourceId,
            label: `${type}: ${value}`,
          },
        ],
        _version: profile._version ?? 1,
      },
    },
  });
}

async function grantChallengeBadgeToProfile(
  gqlClient: any,
  studentId: string,
  badgeType: string,
  challengeId: string,
  sectionID: string,
): Promise<void> {
  const { data } = await (gqlClient as any).graphql({
    query: GET_STUDENT_PROFILE_FOR_REWARDS,
    variables: { studentId },
  });
  const profile = data?.listStudentProfiles?.items?.[0];
  if (!profile) return;

  const existingBadges = profile.badges || [];
  const alreadyGranted = existingBadges.some(
    (b: any) =>
      b.badgeType === badgeType && b.sourceId === `challenge-${challengeId}`,
  );
  if (alreadyGranted) return;

  await (gqlClient as any).graphql({
    query: UPDATE_STUDENT_PROFILE_REWARDS,
    variables: {
      input: {
        id: profile.id,
        badges: [
          ...existingBadges,
          {
            badgeType,
            sourceId: `challenge-${challengeId}`,
            awardedAt: new Date().toISOString(),
            sectionID,
          },
        ],
        _version: profile._version ?? 1,
      },
    },
  });
}

// ============================================================================
// Constants
// ============================================================================

// Level calculation (mirrors gamification handler)
function calculateLevel(totalXP: number): number {
  if (totalXP <= 0) return 1;
  // Each level requires progressively more XP: level N needs N*100 XP
  let xpRemaining = totalXP;
  let level = 1;
  while (xpRemaining >= level * 100) {
    xpRemaining -= level * 100;
    level++;
  }
  return level;
}

// Level calculation using custom section thresholds
function calculateLevelWithThresholds(
  totalXP: number,
  thresholds: { level: number; xpRequired: number }[] | null,
): number {
  if (!thresholds || thresholds.length === 0) return calculateLevel(totalXP);
  // Thresholds are sorted by level ascending
  const sorted = [...thresholds].sort((a, b) => a.level - b.level);
  let level = 1;
  for (const t of sorted) {
    if (totalXP >= t.xpRequired) {
      level = t.level;
    } else {
      break;
    }
  }
  return level;
}

const XP_MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000];

// ============================================================================
// Client Setup
// ============================================================================

let client: any = null;

function getClient(): any {
  if (!client) {
    Amplify.configure(
      {
        API: {
          GraphQL: {
            endpoint: process.env.API_ENDPOINT!,
            defaultAuthMode: "iam",
            region: process.env.AWS_REGION!,
          },
        },
      },
      {
        Auth: {
          credentialsProvider: {
            getCredentialsAndIdentityId: async () => ({
              credentials: await fromNodeProviderChain()(),
            }),
            clearCredentialsAndIdentityId: () => {},
          },
        },
      },
    );
    client = generateClient({ authMode: "iam" });
  }
  return client;
}

// ============================================================================
// Stream Handler
// ============================================================================

interface XPRecord {
  id: string;
  studentId: string;
  xpAmount: number;
  reason: string;
  accuracy?: number;
  sectionID?: string;
  unitID?: string;
  referenceId?: string;
}

// ============================================================================
// Hardening helpers — redelivery idempotency (retry/backoff come from shared/concurrency)
// ============================================================================

const RECENT_XP_LOG_IDS_CAP = 100;

/**
 * Splits a batch's records into "already applied" (its id is in the target
 * row's recentXpLogIds) vs genuinely new, so a DynamoDB Streams redelivery of
 * the same batch doesn't double-apply the cumulative XP/counter sums.
 */
function dedupeNewRecords(
  allRecords: XPRecord[],
  recentIds: string[] | string | null | undefined,
): { newRecords: XPRecord[]; nextRecentIds: string[] } {
  const existing = Array.isArray(recentIds) ? recentIds : [];
  const seen = new Set(existing);
  const newRecords = allRecords.filter((r) => !seen.has(r.id));
  const nextRecentIds = [...existing, ...newRecords.map((r) => r.id)].slice(
    -RECENT_XP_LOG_IDS_CAP,
  );
  return { newRecords, nextRecentIds };
}

/** Creates a notification only if one with the same recipient+referenceId doesn't already exist — guards against duplicate level-up/milestone notifications on stream redelivery. */
async function createNotificationIfNew(
  gqlClient: any,
  input: {
    recipientId: string;
    type: string;
    title: string;
    body: string;
    referenceId: string;
    referenceType: string;
    senderName: string;
  },
): Promise<void> {
  const { data } = await gqlClient.graphql({
    query: LIST_NOTIFICATIONS_BY_RECIPIENT_AND_REF,
    variables: {
      recipientId: input.recipientId,
      referenceId: input.referenceId,
    },
  });
  if ((data?.listNotificationByRecipientId?.items?.length || 0) > 0) return;
  await gqlClient.graphql({
    query: CREATE_NOTIFICATION,
    variables: { input },
  });
}

export const handler: DynamoDBStreamHandler = async (event) => {
  const gqlClient = getClient();

  // Parse INSERT records into XP records
  const xpRecords: XPRecord[] = [];
  for (const record of event.Records) {
    if (record.eventName !== "INSERT") continue;
    const img = record.dynamodb?.NewImage;
    if (!img) continue;

    xpRecords.push({
      id: img.id?.S || "",
      studentId: img.studentId?.S || "",
      xpAmount: parseInt(img.xpAmount?.N || "0", 10),
      reason: img.reason?.S || "",
      accuracy: img.accuracy?.N ? parseFloat(img.accuracy.N) : undefined,
      sectionID: img.sectionID?.S || undefined,
      unitID: img.unitID?.S || undefined,
      referenceId: img.referenceId?.S || undefined,
    });
  }

  if (xpRecords.length === 0) return;

  // Group by student+cohort for batched profile updates
  const grouped = new Map<
    string,
    { records: XPRecord[]; totalDelta: number }
  >();
  for (const rec of xpRecords) {
    const key = `${rec.studentId}|${rec.sectionID || ""}`;
    const existing = grouped.get(key) || { records: [], totalDelta: 0 };
    existing.records.push(rec);
    existing.totalDelta += rec.xpAmount;
    grouped.set(key, existing);
  }

  // Process each student+cohort group — collect badge check entries with pre-fetched data
  const badgeEntries: any[] = [];

  for (const [, group] of grouped) {
    const { records, totalDelta } = group;
    const { studentId, sectionID, unitID } = records[0];

    try {
      // Fetch global PlatformSettings
      let sectionSettings: any = null;
      try {
        const { data: settingsData } = await (gqlClient as any).graphql({
          query: GET_PLATFORM_SETTINGS,
        });
        const settingsItems = settingsData?.listPlatformSettings?.items || [];
        sectionSettings = settingsItems[0] || null;
      } catch {
        // No settings = use defaults
      }

      // Parse level thresholds from section settings
      const levelThresholds: { level: number; xpRequired: number }[] | null =
        (() => {
          if (!sectionSettings?.levelThresholds) return null;
          try {
            const parsed =
              typeof sectionSettings.levelThresholds === "string"
                ? JSON.parse(sectionSettings.levelThresholds)
                : sectionSettings.levelThresholds;
            return Array.isArray(parsed) ? parsed : null;
          } catch {
            return null;
          }
        })();

      // 1. Rollup: increment totalXP on StudentProfile — retried with a fresh
      // re-read on optimistic-concurrency conflict; `newRecords` is this
      // attempt's not-yet-applied subset (dedup makes stream redelivery a no-op).
      let profileOutcome: {
        skipped: boolean;
        profile: any;
        oldXP: number;
        oldLevel: number;
        newXP: number;
        newLevel: number;
        newNailedItCount: number;
        reasonCounts: Record<string, number>;
        newTotalSubmissions: number;
        maxFailed: number;
        recentTimestamps: string[];
        newActiveDaysCount: number;
        today: string;
      } | null = null;

      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
        const { data: profileData } = await (gqlClient as any).graphql({
          query: GET_STUDENT_PROFILE,
          variables: { studentId, sectionID: sectionID || null },
        });
        const profile = profileData?.listStudentProfiles?.items?.[0];
        if (!profile) break; // No profile yet — permanent for this event, not retryable.

        const { newRecords, nextRecentIds } = dedupeNewRecords(
          records,
          profile.recentXpLogIds,
        );
        if (newRecords.length === 0) {
          // Entire batch already applied — redelivery, not a new event.
          profileOutcome = {
            skipped: true,
            profile,
            oldXP: profile.totalXP || 0,
            oldLevel: profile.level || 1,
            newXP: profile.totalXP || 0,
            newLevel: profile.level || 1,
            newNailedItCount: profile.nailedItCount || 0,
            reasonCounts: {},
            newTotalSubmissions: profile.totalSubmissions || 0,
            maxFailed: profile.maxFailedAttemptsOnSingleRef || 0,
            recentTimestamps: [],
            newActiveDaysCount: profile.activeDaysCount || 0,
            today: new Date().toISOString().split("T")[0],
          };
          break;
        }

        const newBatchDelta = newRecords.reduce(
          (sum, r) => sum + r.xpAmount,
          0,
        );
        const oldXP = profile.totalXP || 0;
        const oldLevel = profile.level || 1;
        const newXP = oldXP + newBatchDelta;
        const newLevel = calculateLevel(newXP);

        // Count nailed-it in this batch
        const nailedItDelta = newRecords.filter(
          (r) => r.reason === "NAILED_IT",
        ).length;
        const newNailedItCount = (profile.nailedItCount || 0) + nailedItDelta;

        // --- Maintain rollup counters ---

        // reasonCounts: increment count for each reason in this batch
        const reasonCounts: Record<string, number> = (() => {
          try {
            const parsed =
              typeof profile.reasonCounts === "string"
                ? JSON.parse(profile.reasonCounts)
                : profile.reasonCounts;
            return parsed || {};
          } catch {
            return {};
          }
        })();
        for (const rec of newRecords) {
          if (rec.reason) {
            reasonCounts[rec.reason] = (reasonCounts[rec.reason] || 0) + 1;
          }
        }

        // totalSubmissions: count HOMEWORK_SUBMITTED in this batch
        const submissionDelta = newRecords.filter(
          (r) => r.reason === "HOMEWORK_SUBMITTED",
        ).length;
        const newTotalSubmissions =
          (profile.totalSubmissions || 0) + submissionDelta;

        // onTimeSubmissions: count ON_TIME_SUBMISSION in this batch
        const onTimeDelta = newRecords.filter(
          (r) => r.reason === "ON_TIME_SUBMISSION",
        ).length;
        const newOnTimeSubmissions =
          (profile.onTimeSubmissions || 0) + onTimeDelta;

        // maxFailedAttemptsOnSingleRef: track max 0-XP logs per referenceId
        let maxFailed = profile.maxFailedAttemptsOnSingleRef || 0;
        const failedInBatch = newRecords.filter(
          (r) => r.xpAmount === 0 && r.referenceId,
        );
        if (failedInBatch.length > 0) {
          // We track the max across all refs — incrementing counts for refs in this batch
          // Since we don't store per-ref counts, we use reasonCounts pattern:
          // Track as a separate map within reasonCounts using a prefix
          for (const rec of failedInBatch) {
            const key = `__fail_${rec.referenceId}`;
            reasonCounts[key] = (reasonCounts[key] || 0) + 1;
            if (reasonCounts[key] > maxFailed) {
              maxFailed = reasonCounts[key];
            }
          }
        }

        // recentSubmissionTimestamps: sliding window of last 5 submission times
        const recentTimestamps: string[] = (() => {
          try {
            const parsed =
              typeof profile.recentSubmissionTimestamps === "string"
                ? JSON.parse(profile.recentSubmissionTimestamps)
                : profile.recentSubmissionTimestamps;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();
        if (submissionDelta > 0) {
          const now = new Date().toISOString();
          for (let i = 0; i < submissionDelta; i++) {
            recentTimestamps.push(now);
          }
          // Keep only last 5
          while (recentTimestamps.length > 5) {
            recentTimestamps.shift();
          }
        }

        // activeDaysCount: increment if today is a new active day
        const today = new Date().toISOString().split("T")[0];
        const lastActivity = profile.lastActivityDate || "";
        let newActiveDaysCount = profile.activeDaysCount || 0;
        if (lastActivity !== today) {
          newActiveDaysCount += 1;
        }

        const expectedVersion = profile._version ?? 1;
        try {
          await (gqlClient as any).graphql({
            query: UPDATE_STUDENT_PROFILE,
            variables: {
              input: {
                id: profile.id,
                totalXP: newXP,
                level: newLevel,
                nailedItCount: newNailedItCount,
                lastUpdated: new Date().toISOString(),
                lastActivityDate: today,
                reasonCounts: JSON.stringify(reasonCounts),
                totalSubmissions: newTotalSubmissions,
                onTimeSubmissions: newOnTimeSubmissions,
                maxFailedAttemptsOnSingleRef: maxFailed,
                recentSubmissionTimestamps: JSON.stringify(recentTimestamps),
                activeDaysCount: newActiveDaysCount,
                recentXpLogIds: nextRecentIds,
                _version: expectedVersion + 1,
              },
              condition: { _version: { eq: expectedVersion } },
            },
          });
          profileOutcome = {
            skipped: false,
            profile: {
              ...profile,
              id: profile.id,
              _version: expectedVersion + 1,
            },
            oldXP,
            oldLevel,
            newXP,
            newLevel,
            newNailedItCount,
            reasonCounts,
            newTotalSubmissions,
            maxFailed,
            recentTimestamps,
            newActiveDaysCount,
            today,
          };
          break; // Success.
        } catch (err) {
          if (
            isConditionalCheckFailure(err) &&
            attempt < MAX_RETRY_ATTEMPTS - 1
          ) {
            await sleep(backoffMs(attempt));
            continue; // Re-read and retry with fresh data.
          }
          throw err; // Exhausted retries or a non-conflict error — surface it.
        }
      }

      if (!profileOutcome || profileOutcome.skipped) {
        // No profile yet, or the whole batch was already applied (redelivery) — nothing left to do.
        continue;
      }

      const {
        profile,
        oldXP,
        oldLevel,
        newXP,
        newLevel,
        newNailedItCount,
        reasonCounts,
        newTotalSubmissions,
        maxFailed,
        recentTimestamps,
        newActiveDaysCount,
        today,
      } = profileOutcome;

      // 2. Level-up notification (deduped by referenceId — safe against redelivery)
      if (newLevel > oldLevel) {
        await createNotificationIfNew(gqlClient, {
          recipientId: studentId,
          type: "LEVEL_UP",
          title: `Level Up! You reached level ${newLevel}`,
          body: `Congratulations! You've advanced from level ${oldLevel} to level ${newLevel}.`,
          referenceId: `level-${newLevel}`,
          referenceType: "StudentProfile",
          senderName: "System",
        });
      }

      // 3. XP milestone notification (deduped by referenceId)
      for (const milestone of XP_MILESTONES) {
        if (newXP >= milestone && oldXP < milestone) {
          await createNotificationIfNew(gqlClient, {
            recipientId: studentId,
            type: "XP_MILESTONE",
            title: `XP Milestone: ${milestone} XP reached!`,
            body: `You've earned a total of ${milestone} XP. Keep up the great work!`,
            referenceId: `xp-milestone-${milestone}`,
            referenceType: "StudentProfile",
            senderName: "System",
          });
          break; // Only one milestone per batch
        }
      }

      // 4. Update SectionProgress (per-student, per-section tracking) —
      // same retry-with-condition + redelivery-dedup pattern as StudentProfile,
      // using its own recentXpLogIds since it's a separate row that can fall
      // behind the profile independently.
      let sectionLevel = newLevel;
      if (sectionID) {
        try {
          for (let spAttempt = 0; spAttempt < MAX_RETRY_ATTEMPTS; spAttempt++) {
            const { data: spData } = await (gqlClient as any).graphql({
              query: GET_SECTION_PROGRESS,
              variables: { studentId, sectionId: sectionID },
            });
            const sectionProgress = spData?.listSectionProgresses?.items?.[0];

            if (!sectionProgress) {
              // Create new SectionProgress for this student+section. A true
              // insert-insert race between two concurrent invocations is a
              // known, separate gap (would need a composite unique key).
              const spNailedItDelta = records.filter(
                (r) => r.reason === "NAILED_IT",
              ).length;
              const spSubmissionDelta = records.filter(
                (r) => r.reason === "HOMEWORK_SUBMITTED",
              ).length;
              const spOnTimeDelta = records.filter(
                (r) => r.reason === "ON_TIME_SUBMISSION",
              ).length;
              const spFailedInBatch = records.filter(
                (r) => r.xpAmount === 0 && r.referenceId,
              );
              sectionLevel = calculateLevelWithThresholds(
                totalDelta,
                levelThresholds,
              );

              const initReasonCounts: Record<string, number> = {};
              for (const rec of records) {
                if (rec.reason) {
                  initReasonCounts[rec.reason] =
                    (initReasonCounts[rec.reason] || 0) + 1;
                }
              }
              let initMaxFailed = 0;
              for (const rec of spFailedInBatch) {
                const fKey = `__fail_${rec.referenceId}`;
                initReasonCounts[fKey] = (initReasonCounts[fKey] || 0) + 1;
                if (initReasonCounts[fKey] > initMaxFailed) {
                  initMaxFailed = initReasonCounts[fKey];
                }
              }

              const initTimestamps: string[] = [];
              if (spSubmissionDelta > 0) {
                const now = new Date().toISOString();
                for (let i = 0; i < spSubmissionDelta; i++) {
                  initTimestamps.push(now);
                }
              }

              try {
                await (gqlClient as any).graphql({
                  query: CREATE_SECTION_PROGRESS,
                  variables: {
                    input: {
                      studentId,
                      sectionId: sectionID,
                      totalXP: totalDelta,
                      level: sectionLevel,
                      nailedItCount: spNailedItDelta,
                      completedAssignments: 0,
                      onTimeSubmissions: spOnTimeDelta,
                      currentStreak: 0,
                      longestStreak: 0,
                      lastActivityDate: today,
                      lastUpdated: new Date().toISOString(),
                      reasonCounts: JSON.stringify(initReasonCounts),
                      totalSubmissions: spSubmissionDelta,
                      maxFailedAttemptsOnSingleRef: initMaxFailed,
                      recentSubmissionTimestamps:
                        JSON.stringify(initTimestamps),
                      activeDaysCount: 1,
                      recentXpLogIds: records
                        .map((r) => r.id)
                        .slice(-RECENT_XP_LOG_IDS_CAP),
                    },
                  },
                });
                break; // Success.
              } catch (createErr) {
                // Another concurrent invocation likely created it first — retry as an update.
                if (spAttempt < MAX_RETRY_ATTEMPTS - 1) {
                  await sleep(backoffMs(spAttempt));
                  continue;
                }
                throw createErr;
              }
            }

            const { newRecords: spNewRecords, nextRecentIds: spNextRecentIds } =
              dedupeNewRecords(records, sectionProgress.recentXpLogIds);
            if (spNewRecords.length === 0) {
              // Already applied — redelivery.
              sectionLevel = sectionProgress.level || 1;
              break;
            }

            const spNailedItDelta = spNewRecords.filter(
              (r) => r.reason === "NAILED_IT",
            ).length;
            const spSubmissionDelta = spNewRecords.filter(
              (r) => r.reason === "HOMEWORK_SUBMITTED",
            ).length;
            const spOnTimeDelta = spNewRecords.filter(
              (r) => r.reason === "ON_TIME_SUBMISSION",
            ).length;
            const spFailedInBatch = spNewRecords.filter(
              (r) => r.xpAmount === 0 && r.referenceId,
            );
            const spBatchDelta = spNewRecords.reduce(
              (sum, r) => sum + r.xpAmount,
              0,
            );

            // Update existing SectionProgress
            const spOldXP = sectionProgress.totalXP || 0;
            const spNewXP = spOldXP + spBatchDelta;
            sectionLevel = calculateLevelWithThresholds(
              spNewXP,
              levelThresholds,
            );

            // Same rollup fields scoped to this section
            const spReasonCounts: Record<string, number> = (() => {
              try {
                const p =
                  typeof sectionProgress.reasonCounts === "string"
                    ? JSON.parse(sectionProgress.reasonCounts)
                    : sectionProgress.reasonCounts;
                return p || {};
              } catch {
                return {};
              }
            })();
            for (const rec of spNewRecords) {
              if (rec.reason) {
                spReasonCounts[rec.reason] =
                  (spReasonCounts[rec.reason] || 0) + 1;
              }
            }
            // Track per-ref failures in section
            let spMaxFailed = sectionProgress.maxFailedAttemptsOnSingleRef || 0;
            for (const rec of spFailedInBatch) {
              const fKey = `__fail_${rec.referenceId}`;
              spReasonCounts[fKey] = (spReasonCounts[fKey] || 0) + 1;
              if (spReasonCounts[fKey] > spMaxFailed) {
                spMaxFailed = spReasonCounts[fKey];
              }
            }

            const spRecentTimestamps: string[] = (() => {
              try {
                const p =
                  typeof sectionProgress.recentSubmissionTimestamps === "string"
                    ? JSON.parse(sectionProgress.recentSubmissionTimestamps)
                    : sectionProgress.recentSubmissionTimestamps;
                return Array.isArray(p) ? p : [];
              } catch {
                return [];
              }
            })();
            if (spSubmissionDelta > 0) {
              const now = new Date().toISOString();
              for (let i = 0; i < spSubmissionDelta; i++) {
                spRecentTimestamps.push(now);
              }
              while (spRecentTimestamps.length > 5) {
                spRecentTimestamps.shift();
              }
            }

            const spLastActivity = sectionProgress.lastActivityDate || "";
            let spActiveDaysCount = sectionProgress.activeDaysCount || 0;
            if (spLastActivity !== today) spActiveDaysCount += 1;

            const spExpectedVersion = sectionProgress._version ?? 1;
            try {
              await (gqlClient as any).graphql({
                query: UPDATE_SECTION_PROGRESS,
                variables: {
                  input: {
                    id: sectionProgress.id,
                    totalXP: spNewXP,
                    level: sectionLevel,
                    nailedItCount:
                      (sectionProgress.nailedItCount || 0) + spNailedItDelta,
                    lastUpdated: new Date().toISOString(),
                    lastActivityDate: today,
                    reasonCounts: JSON.stringify(spReasonCounts),
                    totalSubmissions:
                      (sectionProgress.totalSubmissions || 0) +
                      spSubmissionDelta,
                    onTimeSubmissions:
                      (sectionProgress.onTimeSubmissions || 0) + spOnTimeDelta,
                    maxFailedAttemptsOnSingleRef: spMaxFailed,
                    recentSubmissionTimestamps:
                      JSON.stringify(spRecentTimestamps),
                    activeDaysCount: spActiveDaysCount,
                    recentXpLogIds: spNextRecentIds,
                    _version: spExpectedVersion + 1,
                  },
                  condition: { _version: { eq: spExpectedVersion } },
                },
              });
              break; // Success.
            } catch (err) {
              if (
                isConditionalCheckFailure(err) &&
                spAttempt < MAX_RETRY_ATTEMPTS - 1
              ) {
                await sleep(backoffMs(spAttempt));
                continue; // Re-read and retry with fresh data.
              }
              throw err;
            }
          }
        } catch (spErr) {
          console.warn(
            `[xpStream] SectionProgress update failed for ${studentId}:`,
            spErr,
          );
        }

        // 4b. GroupChallenge rollup — increment currentXP on active challenges.
        // Students have read-only access to GroupChallenge; only this Lambda
        // (IAM credentials) can update challenge records.
        try {
          const { data: challengeData } = await (gqlClient as any).graphql({
            query: LIST_ACTIVE_CHALLENGES_BY_SECTION,
            variables: { sectionID },
          });
          const activeChallenges = (
            challengeData?.listGroupChallenges?.items || []
          ).filter((c: any) => c != null && c.active);

          for (const challenge of activeChallenges) {
            // Skip if past deadline
            if (
              challenge.deadline &&
              new Date(challenge.deadline) < new Date()
            ) {
              continue;
            }

            // Retried with a fresh re-read on optimistic-concurrency conflict;
            // dedupe is per-challenge (its own creditedXpLogIds), independent
            // of the StudentProfile/SectionProgress dedup above — this is a
            // separate row that can fall behind independently.
            let updateSucceeded = false;
            let goalReached = false;
            let contributorIds: Set<string> = new Set();
            let finalRewardXP = 0;

            for (let cAttempt = 0; cAttempt < MAX_RETRY_ATTEMPTS; cAttempt++) {
              let currentChallenge = challenge;
              if (cAttempt > 0) {
                const { data } = await (gqlClient as any).graphql({
                  query: GET_GROUP_CHALLENGE,
                  variables: { id: challenge.id },
                });
                currentChallenge = data?.getGroupChallenge;
                if (!currentChallenge) break; // Deleted concurrently.
              }

              const {
                newRecords: challengeNewRecords,
                nextRecentIds: nextCreditedIds,
              } = dedupeNewRecords(records, currentChallenge.creditedXpLogIds);
              if (challengeNewRecords.length === 0) break; // Already credited — redelivery.

              // Scoped XP: if linkedUnitIds is populated, only credit XP from matching units
              const creditableRecords =
                currentChallenge.linkedUnitIds &&
                currentChallenge.linkedUnitIds.length > 0
                  ? challengeNewRecords.filter(
                      (r: XPRecord) =>
                        r.unitID &&
                        currentChallenge.linkedUnitIds.includes(r.unitID),
                    )
                  : challengeNewRecords;
              const creditableDelta = creditableRecords.reduce(
                (sum: number, r: XPRecord) => sum + r.xpAmount,
                0,
              );
              if (creditableDelta <= 0) break; // No XP from linked units — skip.

              const oldChallengeXP = currentChallenge.currentXP || 0;
              const newChallengeXP = oldChallengeXP + creditableDelta;
              goalReached = newChallengeXP >= currentChallenge.targetXP;
              const existingContributions =
                currentChallenge.contributions || [];
              const updatedContributions = [
                ...existingContributions,
                {
                  studentId,
                  xpContributed: creditableDelta,
                  contributedAt: new Date().toISOString(),
                },
              ];

              const expectedVersion = currentChallenge._version ?? 1;
              try {
                await (gqlClient as any).graphql({
                  query: UPDATE_GROUP_CHALLENGE,
                  variables: {
                    input: {
                      id: currentChallenge.id,
                      currentXP: newChallengeXP,
                      active: !goalReached,
                      contributions: updatedContributions,
                      creditedXpLogIds: nextCreditedIds,
                      _version: expectedVersion + 1,
                    },
                    condition: { _version: { eq: expectedVersion } },
                  },
                });
                updateSucceeded = true;
                contributorIds = new Set<string>(
                  updatedContributions
                    .map((c: any) => c.studentId)
                    .filter((id: string) => !!id),
                );
                finalRewardXP = Math.round(
                  (currentChallenge.rewardXP || 500) *
                    (currentChallenge.bonusMultiplier || 1.5),
                );
                break; // Success.
              } catch (updateErr: any) {
                if (
                  isConditionalCheckFailure(updateErr) &&
                  cAttempt < MAX_RETRY_ATTEMPTS - 1
                ) {
                  await sleep(backoffMs(cAttempt));
                  continue; // Re-read and retry with fresh data.
                }
                console.error(
                  `[xpStream] challenge update error for ${challenge.id}:`,
                  updateErr,
                );
                break;
              }
            }

            // Award completion bonus XP to all contributors only if WE
            // successfully set active: false (prevents double-awarding on retries)
            if (goalReached && updateSucceeded) {
              for (const contributorId of contributorIds) {
                try {
                  // Create XP log directly (Lambda has IAM access)
                  // The resulting stream event will do the profile rollup
                  await (gqlClient as any).graphql({
                    query: CREATE_STUDENT_XP_LOG,
                    variables: {
                      input: {
                        studentId: contributorId,
                        xpAmount: finalRewardXP,
                        reason: "SQUAD_CHALLENGE_BONUS",
                        referenceId: `challenge-${challenge.id}`,
                        sectionID,
                      },
                    },
                  });
                } catch (bonusErr) {
                  console.error(
                    `[xpStream] challenge bonus XP error for ${contributorId}:`,
                    bonusErr,
                  );
                }

                // Grant cosmetic reward if configured
                if (challenge.rewardCosmetic) {
                  try {
                    await grantCosmeticRewardToProfile(
                      gqlClient,
                      contributorId,
                      challenge.rewardCosmetic,
                      challenge.id,
                    );
                  } catch (cosErr) {
                    console.warn(
                      `[xpStream] cosmetic reward error for ${contributorId}:`,
                      cosErr,
                    );
                  }
                }

                // Grant badge reward if configured
                if (challenge.rewardBadge) {
                  try {
                    await grantChallengeBadgeToProfile(
                      gqlClient,
                      contributorId,
                      challenge.rewardBadge,
                      challenge.id,
                      sectionID,
                    );
                  } catch (badgeErr) {
                    console.warn(
                      `[xpStream] badge reward error for ${contributorId}:`,
                      badgeErr,
                    );
                  }
                }
              }

              // Notify all contributors of the victory (deduped by referenceId)
              for (const contributorId of contributorIds) {
                try {
                  await createNotificationIfNew(gqlClient, {
                    recipientId: contributorId,
                    type: "CHALLENGE_COMPLETE",
                    title: `Challenge Complete: ${challenge.title}`,
                    body: `Your cohort completed the challenge! You earned ${finalRewardXP} bonus XP.`,
                    referenceId: `challenge-${challenge.id}`,
                    referenceType: "GroupChallenge",
                    senderName: "System",
                  });
                } catch (notifErr) {
                  console.warn(
                    "[xpStream] challenge completion notification error:",
                    notifErr,
                  );
                }
              }
            }
          }
        } catch (challengeErr) {
          console.warn(
            `[xpStream] challenge rollup failed for cohort ${sectionID}:`,
            challengeErr,
          );
        }
      }

      // 5. Collect badge check entry with pre-fetched data
      // Uses section-level for badge criteria when section settings exist
      // The batch mutation receives this so it can skip re-reading the profile
      // AND skip scanning XP logs — all criteria data is in rollup fields
      badgeEntries.push({
        studentId,
        sectionID: sectionID || null,
        unitID: unitID || null,
        // Pre-fetched profile data
        profileId: profile.id,
        profileVersion: profile._version, // already the post-update version — see profileOutcome above
        totalXP: newXP,
        level: sectionLevel,
        currentStreak: profile.currentStreak || 0,
        longestStreak: profile.longestStreak || 0,
        lastActivityDate: today,
        nailedItCount: newNailedItCount,
        completedAssignments: profile.completedAssignments || 0,
        badges: profile.badges || "[]",
        // Rollup fields — eliminates all XP log scans in badge evaluation
        reasonCounts: JSON.stringify(reasonCounts),
        totalSubmissions: newTotalSubmissions,
        maxFailedAttemptsOnSingleRef: maxFailed,
        recentSubmissionTimestamps: JSON.stringify(recentTimestamps),
        activeDaysCount: newActiveDaysCount,
        // Section settings for badge evaluation
        sectionBadgesEnabled: sectionSettings?.badgesEnabled ?? true,
        sectionAntiBadgesEnabled: sectionSettings?.antiBadgesEnabled ?? true,
      });
    } catch (err) {
      console.error(
        `[xpStream] profile rollup failed for ${records[0]?.studentId}:`,
        err,
      );
      throw err; // Surface genuine failures instead of swallowing — let Lambda retry / route to the DLQ.
    }
  }

  // 5. Fire single batch badge check — one Lambda invocation for all students
  if (badgeEntries.length > 0) {
    void (gqlClient as any)
      .graphql({
        query: CHECK_BADGES_BATCH,
        variables: { entries: JSON.stringify(badgeEntries) },
      })
      .catch((err: any) =>
        console.warn("[xpStream] checkBadgesBatch failed:", err),
      );
  }
};
