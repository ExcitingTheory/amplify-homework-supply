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
import { fromEnv } from "@aws-sdk/credential-providers";

// ============================================================================
// GraphQL Operations
// ============================================================================

const GET_STUDENT_PROFILE = `query GetStudentProfile($studentId: String!, $cohortId: String) {
  listStudentProfiles(filter: { studentId: { eq: $studentId }, cohortId: { eq: $cohortId } }) {
    items { id studentId cohortId totalXP level nailedItCount completedAssignments onTimeSubmissions currentStreak longestStreak lastActivityDate badges { badgeType sourceId awardedAt cohortId unitID count isAnti } easterEggs { easterEggId discoveredAt xpReward } reasonCounts totalSubmissions maxFailedAttemptsOnSingleRef recentSubmissionTimestamps activeDaysCount _version }
  }
}`;

const GET_SECTION_PROGRESS = `query GetSectionProgress($studentId: String!, $sectionId: String!) {
  listSectionProgresses(filter: { studentId: { eq: $studentId }, sectionId: { eq: $sectionId } }) {
    items { id studentId sectionId totalXP level nailedItCount completedAssignments onTimeSubmissions currentStreak longestStreak lastActivityDate badges { badgeType sourceId awardedAt cohortId unitID count isAnti } reasonCounts totalSubmissions maxFailedAttemptsOnSingleRef recentSubmissionTimestamps activeDaysCount _version }
  }
}`;

const CREATE_SECTION_PROGRESS = `mutation CreateSectionProgress($input: CreateSectionProgressInput!) {
  createSectionProgress(input: $input) { id _version }
}`;

const UPDATE_SECTION_PROGRESS = `mutation UpdateSectionProgress($input: UpdateSectionProgressInput!) {
  updateSectionProgress(input: $input) { id totalXP level _version }
}`;

const GET_PLATFORM_SETTINGS = `query GetPlatformSettings {
  listPlatformSettings(limit: 1) {
    items { id levelThresholds xpMultipliers badgesEnabled antiBadgesEnabled }
  }
}`;

const UPDATE_STUDENT_PROFILE = `mutation UpdateStudentProfile($input: UpdateStudentProfileInput!) {
  updateStudentProfile(input: $input) { id totalXP level _version }
}`;

const CHECK_BADGES_BATCH = `mutation CheckBadgesBatch($entries: AWSJSON!) {
  checkBadgesBatch(entries: $entries)
}`;

const CREATE_NOTIFICATION = `mutation CreateNotification($input: CreateNotificationInput!) {
  createNotification(input: $input) { id }
}`;

const LIST_ACTIVE_CHALLENGES_BY_COHORT = `query ListActiveChallenges($cohortId: String!) {
  listGroupChallenges(filter: { cohortId: { eq: $cohortId }, active: { eq: true } }) {
    items { id cohortId title targetXP currentXP active deadline rewardXP bonusMultiplier rewardBadge linkedUnitIds contributions { studentId xpContributed contributedAt } _version }
  }
}`;

const UPDATE_GROUP_CHALLENGE = `mutation UpdateGroupChallenge($input: UpdateGroupChallengeInput!) {
  updateGroupChallenge(input: $input) { id currentXP active _version }
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
  cohortId: string,
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
            cohortId,
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
              credentials: await fromEnv()(),
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
  studentId: string;
  xpAmount: number;
  reason: string;
  accuracy?: number;
  cohortId?: string;
  unitID?: string;
  referenceId?: string;
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
      studentId: img.studentId?.S || "",
      xpAmount: parseInt(img.xpAmount?.N || "0", 10),
      reason: img.reason?.S || "",
      accuracy: img.accuracy?.N ? parseFloat(img.accuracy.N) : undefined,
      cohortId: img.cohortId?.S || undefined,
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
    const key = `${rec.studentId}|${rec.cohortId || ""}`;
    const existing = grouped.get(key) || { records: [], totalDelta: 0 };
    existing.records.push(rec);
    existing.totalDelta += rec.xpAmount;
    grouped.set(key, existing);
  }

  // Process each student+cohort group — collect badge check entries with pre-fetched data
  const badgeEntries: any[] = [];

  for (const [, group] of grouped) {
    const { records, totalDelta } = group;
    const { studentId, cohortId, unitID } = records[0];

    try {
      // 1. Rollup: increment totalXP on StudentProfile
      const { data: profileData } = await (gqlClient as any).graphql({
        query: GET_STUDENT_PROFILE,
        variables: { studentId, cohortId: cohortId || null },
      });
      const profiles = profileData?.listStudentProfiles?.items || [];
      const profile = profiles[0];

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

      if (profile) {
        const oldXP = profile.totalXP || 0;
        const oldLevel = profile.level || 1;
        const newXP = oldXP + totalDelta;
        const newLevel = calculateLevel(newXP);

        // Count nailed-it in this batch
        const nailedItDelta = records.filter(
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
        for (const rec of records) {
          if (rec.reason) {
            reasonCounts[rec.reason] = (reasonCounts[rec.reason] || 0) + 1;
          }
        }

        // totalSubmissions: count HOMEWORK_SUBMITTED in this batch
        const submissionDelta = records.filter(
          (r) => r.reason === "HOMEWORK_SUBMITTED",
        ).length;
        const newTotalSubmissions =
          (profile.totalSubmissions || 0) + submissionDelta;

        // onTimeSubmissions: count ON_TIME_SUBMISSION in this batch
        const onTimeDelta = records.filter(
          (r) => r.reason === "ON_TIME_SUBMISSION",
        ).length;
        const newOnTimeSubmissions =
          (profile.onTimeSubmissions || 0) + onTimeDelta;

        // maxFailedAttemptsOnSingleRef: track max 0-XP logs per referenceId
        let maxFailed = profile.maxFailedAttemptsOnSingleRef || 0;
        const failedInBatch = records.filter(
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
              _version: profile._version ?? 1,
            },
          },
        });

        // 2. Level-up notification
        if (newLevel > oldLevel) {
          await (gqlClient as any).graphql({
            query: CREATE_NOTIFICATION,
            variables: {
              input: {
                recipientId: studentId,
                type: "LEVEL_UP",
                title: `Level Up! You reached level ${newLevel}`,
                body: `Congratulations! You've advanced from level ${oldLevel} to level ${newLevel}.`,
                referenceId: `level-${newLevel}`,
                referenceType: "StudentProfile",
                senderName: "System",
              },
            },
          });
        }

        // 3. XP milestone notification
        for (const milestone of XP_MILESTONES) {
          if (newXP >= milestone && oldXP < milestone) {
            await (gqlClient as any).graphql({
              query: CREATE_NOTIFICATION,
              variables: {
                input: {
                  recipientId: studentId,
                  type: "XP_MILESTONE",
                  title: `XP Milestone: ${milestone} XP reached!`,
                  body: `You've earned a total of ${milestone} XP. Keep up the great work!`,
                  referenceId: `xp-milestone-${milestone}`,
                  referenceType: "StudentProfile",
                  senderName: "System",
                },
              },
            });
            break; // Only one milestone per batch
          }
        }

        // 4. Update SectionProgress (per-student, per-section tracking)
        let sectionLevel = newLevel;
        if (cohortId) {
          try {
            const { data: spData } = await (gqlClient as any).graphql({
              query: GET_SECTION_PROGRESS,
              variables: { studentId, sectionId: cohortId },
            });
            const spItems = spData?.listSectionProgresses?.items || [];
            const sectionProgress = spItems[0];

            if (sectionProgress) {
              // Update existing SectionProgress
              const spOldXP = sectionProgress.totalXP || 0;
              const spNewXP = spOldXP + totalDelta;
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
              for (const rec of records) {
                if (rec.reason) {
                  spReasonCounts[rec.reason] =
                    (spReasonCounts[rec.reason] || 0) + 1;
                }
              }
              // Track per-ref failures in section
              let spMaxFailed =
                sectionProgress.maxFailedAttemptsOnSingleRef || 0;
              for (const rec of failedInBatch) {
                const fKey = `__fail_${rec.referenceId}`;
                spReasonCounts[fKey] = (spReasonCounts[fKey] || 0) + 1;
                if (spReasonCounts[fKey] > spMaxFailed) {
                  spMaxFailed = spReasonCounts[fKey];
                }
              }

              const spRecentTimestamps: string[] = (() => {
                try {
                  const p =
                    typeof sectionProgress.recentSubmissionTimestamps ===
                    "string"
                      ? JSON.parse(sectionProgress.recentSubmissionTimestamps)
                      : sectionProgress.recentSubmissionTimestamps;
                  return Array.isArray(p) ? p : [];
                } catch {
                  return [];
                }
              })();
              if (submissionDelta > 0) {
                const now = new Date().toISOString();
                for (let i = 0; i < submissionDelta; i++) {
                  spRecentTimestamps.push(now);
                }
                while (spRecentTimestamps.length > 5) {
                  spRecentTimestamps.shift();
                }
              }

              const spLastActivity = sectionProgress.lastActivityDate || "";
              let spActiveDaysCount = sectionProgress.activeDaysCount || 0;
              if (spLastActivity !== today) spActiveDaysCount += 1;

              await (gqlClient as any).graphql({
                query: UPDATE_SECTION_PROGRESS,
                variables: {
                  input: {
                    id: sectionProgress.id,
                    totalXP: spNewXP,
                    level: sectionLevel,
                    nailedItCount:
                      (sectionProgress.nailedItCount || 0) + nailedItDelta,
                    lastUpdated: new Date().toISOString(),
                    lastActivityDate: today,
                    reasonCounts: JSON.stringify(spReasonCounts),
                    totalSubmissions:
                      (sectionProgress.totalSubmissions || 0) + submissionDelta,
                    onTimeSubmissions:
                      (sectionProgress.onTimeSubmissions || 0) + onTimeDelta,
                    maxFailedAttemptsOnSingleRef: spMaxFailed,
                    recentSubmissionTimestamps:
                      JSON.stringify(spRecentTimestamps),
                    activeDaysCount: spActiveDaysCount,
                    _version: sectionProgress._version ?? 1,
                  },
                },
              });
            } else {
              // Create new SectionProgress for this student+section
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
              for (const rec of failedInBatch) {
                const fKey = `__fail_${rec.referenceId}`;
                initReasonCounts[fKey] = (initReasonCounts[fKey] || 0) + 1;
                if (initReasonCounts[fKey] > initMaxFailed) {
                  initMaxFailed = initReasonCounts[fKey];
                }
              }

              const initTimestamps: string[] = [];
              if (submissionDelta > 0) {
                const now = new Date().toISOString();
                for (let i = 0; i < submissionDelta; i++) {
                  initTimestamps.push(now);
                }
              }

              await (gqlClient as any).graphql({
                query: CREATE_SECTION_PROGRESS,
                variables: {
                  input: {
                    studentId,
                    sectionId: cohortId,
                    totalXP: totalDelta,
                    level: sectionLevel,
                    nailedItCount: nailedItDelta,
                    completedAssignments: 0,
                    onTimeSubmissions: onTimeDelta,
                    currentStreak: 0,
                    longestStreak: 0,
                    lastActivityDate: today,
                    lastUpdated: new Date().toISOString(),
                    reasonCounts: JSON.stringify(initReasonCounts),
                    totalSubmissions: submissionDelta,
                    maxFailedAttemptsOnSingleRef: initMaxFailed,
                    recentSubmissionTimestamps: JSON.stringify(initTimestamps),
                    activeDaysCount: 1,
                  },
                },
              });
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
              query: LIST_ACTIVE_CHALLENGES_BY_COHORT,
              variables: { cohortId },
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

              // Scoped XP: if linkedUnitIds is populated, only credit XP from matching units
              let creditableDelta = totalDelta;
              if (
                challenge.linkedUnitIds &&
                challenge.linkedUnitIds.length > 0
              ) {
                creditableDelta = records
                  .filter(
                    (r: XPRecord) =>
                      r.unitID && challenge.linkedUnitIds.includes(r.unitID),
                  )
                  .reduce((sum: number, r: XPRecord) => sum + r.xpAmount, 0);
                if (creditableDelta <= 0) continue; // No XP from linked units — skip
              }

              const oldChallengeXP = challenge.currentXP || 0;
              const newChallengeXP = oldChallengeXP + creditableDelta;
              const goalReached = newChallengeXP >= challenge.targetXP;
              const existingContributions = challenge.contributions || [];
              const updatedContributions = [
                ...existingContributions,
                {
                  studentId,
                  xpContributed: creditableDelta,
                  contributedAt: new Date().toISOString(),
                },
              ];

              let updateSucceeded = false;
              try {
                await (gqlClient as any).graphql({
                  query: UPDATE_GROUP_CHALLENGE,
                  variables: {
                    input: {
                      id: challenge.id,
                      currentXP: newChallengeXP,
                      active: !goalReached,
                      contributions: updatedContributions,
                      _version: challenge._version ?? 1,
                    },
                  },
                });
                updateSucceeded = true;
              } catch (updateErr: any) {
                // Version conflict from concurrent stream events — expected, skip
                const msg =
                  updateErr?.message || updateErr?.errors?.[0]?.message || "";
                if (
                  msg.includes("ConditionalCheckFailedException") ||
                  msg.includes("version")
                ) {
                  console.warn(
                    `[xpStream] challenge ${challenge.id} version conflict — skipping`,
                  );
                } else {
                  console.error(
                    `[xpStream] challenge update error for ${challenge.id}:`,
                    updateErr,
                  );
                }
              }

              // Award completion bonus XP to all contributors only if WE
              // successfully set active: false (prevents double-awarding on retries)
              if (goalReached && updateSucceeded) {
                const baseRewardXP = challenge.rewardXP || 500;
                const multiplier = challenge.bonusMultiplier || 1.5;
                const finalRewardXP = Math.round(baseRewardXP * multiplier);

                const contributorIds = new Set<string>(
                  updatedContributions
                    .map((c: any) => c.studentId)
                    .filter((id: string) => !!id),
                );

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
                          cohortId,
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
                        cohortId,
                      );
                    } catch (badgeErr) {
                      console.warn(
                        `[xpStream] badge reward error for ${contributorId}:`,
                        badgeErr,
                      );
                    }
                  }
                }

                // Notify all contributors of the victory
                for (const contributorId of contributorIds) {
                  try {
                    await (gqlClient as any).graphql({
                      query: CREATE_NOTIFICATION,
                      variables: {
                        input: {
                          recipientId: contributorId,
                          type: "CHALLENGE_COMPLETE",
                          title: `Challenge Complete: ${challenge.title}`,
                          body: `Your cohort completed the challenge! You earned ${finalRewardXP} bonus XP.`,
                          referenceId: `challenge-${challenge.id}`,
                          referenceType: "GroupChallenge",
                          senderName: "System",
                        },
                      },
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
              `[xpStream] challenge rollup failed for cohort ${cohortId}:`,
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
          cohortId: cohortId || null,
          unitID: unitID || null,
          // Pre-fetched profile data
          profileId: profile.id,
          profileVersion: profile._version + 1, // version incremented by the update above
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
      }
    } catch (err) {
      console.error(
        `[xpStream] profile rollup failed for ${records[0]?.studentId}:`,
        err,
      );
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
