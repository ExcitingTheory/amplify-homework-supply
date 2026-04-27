/**
 * Gamification Handler
 *
 * Manages XP awards, badge checks, streaks, leaderboard rebuilds,
 * and student memory updates.
 *
 * All operations use IAM-authenticated GraphQL to read/write DynamoDB models.
 */

import type { Handler } from 'aws-lambda'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { fromEnv } from '@aws-sdk/credential-providers'

// ============================================================================
// GraphQL Queries & Mutations
// ============================================================================

const CREATE_XP_LOG = `mutation CreateStudentXPLog($input: CreateStudentXPLogInput!) {
  createStudentXPLog(input: $input) { id studentId xpAmount reason referenceId _version }
}`

const LIST_XP_LOGS_BY_STUDENT = `query ListXPLogsByStudent($studentId: String!) {
  listStudentXPLogByStudentId(studentId: $studentId) {
    items { id studentId xpAmount reason referenceId createdAt _version }
  }
}`

const CREATE_BADGE = `mutation CreateStudentBadge($input: CreateStudentBadgeInput!) {
  createStudentBadge(input: $input) { id studentId badgeType awardedAt _version }
}`

const LIST_BADGES_BY_STUDENT = `query ListBadgesByStudent($studentId: String!) {
  listStudentBadgeByStudentId(studentId: $studentId) {
    items { id studentId badgeType awardedAt _version }
  }
}`

const GET_STREAK = `query GetStreakByStudent($studentId: String!) {
  listStudentStreakByStudentId(studentId: $studentId) {
    items { id studentId currentStreak longestStreak lastActivityDate _version }
  }
}`

const CREATE_STREAK = `mutation CreateStudentStreak($input: CreateStudentStreakInput!) {
  createStudentStreak(input: $input) { id studentId currentStreak longestStreak lastActivityDate _version }
}`

const UPDATE_STREAK = `mutation UpdateStudentStreak($input: UpdateStudentStreakInput!) {
  updateStudentStreak(input: $input) { id studentId currentStreak longestStreak lastActivityDate _version }
}`

const GET_STUDENT_MEMORY = `query GetStudentMemory($studentId: String!) {
  listStudentMemoryByStudentId(studentId: $studentId) {
    items { id studentId memoryMarkdown structuredProfile lastUpdatedBy version _version }
  }
}`

const CREATE_STUDENT_MEMORY = `mutation CreateStudentMemory($input: CreateStudentMemoryInput!) {
  createStudentMemory(input: $input) { id studentId memoryMarkdown structuredProfile _version }
}`

const UPDATE_STUDENT_MEMORY = `mutation UpdateStudentMemory($input: UpdateStudentMemoryInput!) {
  updateStudentMemory(input: $input) { id studentId memoryMarkdown structuredProfile version _version }
}`

// StudentUnitMemory queries/mutations
const LIST_UNIT_MEMORY_BY_STUDENT = `query ListUnitMemoryByStudent($studentId: String!) {
  listStudentUnitMemoryByStudentId(studentId: $studentId) {
    items {
      id studentId unitID weakConcepts strongConcepts confusionPairs
      accuracyBySource totalAttempts averageAccuracy reviewPriority lastPracticedAt _version
    }
  }
}`

const LIST_UNIT_MEMORY_BY_UNIT = `query ListUnitMemoryByUnit($unitID: String!) {
  listStudentUnitMemoryByUnitID(unitID: $unitID) {
    items {
      id studentId unitID weakConcepts strongConcepts
      accuracyBySource totalAttempts averageAccuracy reviewPriority lastPracticedAt _version
    }
  }
}`

const CREATE_UNIT_MEMORY = `mutation CreateStudentUnitMemory($input: CreateStudentUnitMemoryInput!) {
  createStudentUnitMemory(input: $input) {
    id studentId unitID weakConcepts strongConcepts confusionPairs
    accuracyBySource totalAttempts averageAccuracy reviewPriority lastPracticedAt _version
  }
}`

const UPDATE_UNIT_MEMORY = `mutation UpdateStudentUnitMemory($input: UpdateStudentUnitMemoryInput!) {
  updateStudentUnitMemory(input: $input) {
    id studentId unitID weakConcepts strongConcepts confusionPairs
    accuracyBySource totalAttempts averageAccuracy reviewPriority lastPracticedAt _version
  }
}`

const LIST_XP_LOGS_FOR_COHORT = `query ListXPLogsByStudent($studentId: String!) {
  listStudentXPLogByStudentId(studentId: $studentId) {
    items { id studentId xpAmount reason }
  }
}`

const CREATE_LEADERBOARD_ENTRY = `mutation CreateLeaderboardEntry($input: CreateLeaderboardEntryInput!) {
  createLeaderboardEntry(input: $input) { id cohortId studentId totalXP level nailedItCount _version }
}`

const UPDATE_LEADERBOARD_ENTRY = `mutation UpdateLeaderboardEntry($input: UpdateLeaderboardEntryInput!) {
  updateLeaderboardEntry(input: $input) { id cohortId studentId totalXP level nailedItCount _version }
}`

const LIST_LEADERBOARD_BY_COHORT = `query ListLeaderboardByCohort($cohortId: String!) {
  listLeaderboardEntryByCohortId(cohortId: $cohortId) {
    items { id cohortId studentId studentName totalXP level _version }
  }
}`

const LIST_GRADES_BY_SECTION = `query ListGradesBySectionID($sectionID: String!) {
  listGradeBySectionID(sectionID: $sectionID) {
    items { id owner sectionID complete accuracy _version }
  }
}`

const LIST_STREAKS_BY_STUDENT = `query ListStreaksByStudent($studentId: String!) {
  listStudentStreakByStudentId(studentId: $studentId) {
    items { id currentStreak longestStreak lastActivityDate _version }
  }
}`

const GET_SECTION = `query GetSection($id: ID!) {
  getSection(id: $id) { id leaderboardEnabled _version }
}`

const GET_SETTINGS_BY_OWNER = `query GetSettings($owner: String!) {
  listSettings(filter: { owner: { eq: $owner } }) {
    items { id owner leaderboardOptIn }
  }
}`

// ============================================================================
// XP Amount Constants
// ============================================================================

const XP_AMOUNTS: Record<string, number> = {
  HOMEWORK_SUBMITTED: 50,
  AI_FEEDBACK_REVISED: 25,
  ALL_BLOCKS_COMPLETED: 75,
  PEER_REVIEW_GIVEN: 40,
  PEER_REVIEW_HOSTED: 30,
  NAILED_IT: 20,
  ON_TIME_SUBMISSION: 15,
  STREAK_3DAY: 30,
  STREAK_7DAY: 75,
  PERFECT_SCORE: 100,
  PRACTICE_DRILL_COMPLETED: 30,
  PRACTICE_DRILL_ACCURACY_BONUS: 15,
}

// ============================================================================
// Practice Drill Diminishing Returns
// ============================================================================

const PRACTICE_DIMINISH_FACTOR = 0.5
const PRACTICE_FLOOR_XP = 5

function calculatePracticeDrillXP(baseXP: number, sessionsToday: number): number {
  return Math.max(PRACTICE_FLOOR_XP, Math.floor(baseXP * Math.pow(PRACTICE_DIMINISH_FACTOR, sessionsToday)))
}

// ============================================================================
// Level Thresholds
// ============================================================================

const LEVELS = [
  { level: 1, xpRequired: 0, label: 'Beginner' },
  { level: 2, xpRequired: 150, label: 'Explorer' },
  { level: 3, xpRequired: 400, label: 'Practitioner' },
  { level: 4, xpRequired: 800, label: 'Contributor' },
  { level: 5, xpRequired: 1500, label: 'Expert' },
  { level: 6, xpRequired: 2500, label: 'Master' },
]

function calculateLevel(totalXP: number): number {
  let level = 1
  for (const l of LEVELS) {
    if (totalXP >= l.xpRequired) level = l.level
  }
  return level
}

// ============================================================================
// Badge Criteria
// ============================================================================

interface BadgeCriteria {
  badgeType: string
  check: (context: {
    xpLogs: any[]
    badges: any[]
    totalXP: number
  }) => boolean
}

const BADGE_CRITERIA: BadgeCriteria[] = [
  {
    badgeType: 'FIRST_SUBMISSION',
    check: ({ xpLogs }) =>
      xpLogs.some((l: any) => l.reason === 'HOMEWORK_SUBMITTED'),
  },
  {
    badgeType: 'GOOD_EYE',
    check: ({ xpLogs }) =>
      xpLogs.some((l: any) => l.reason === 'AI_FEEDBACK_REVISED'),
  },
  {
    badgeType: 'QUICK_DRAW',
    check: ({ xpLogs }) =>
      xpLogs.some((l: any) => l.reason === 'ON_TIME_SUBMISSION'),
  },
  {
    badgeType: 'SHARPSHOOTER',
    check: ({ xpLogs }) =>
      xpLogs.filter((l: any) => l.reason === 'PERFECT_SCORE').length >= 3,
  },
  {
    badgeType: 'CONSISTENT',
    check: ({ xpLogs }) =>
      xpLogs.some((l: any) => l.reason === 'STREAK_7DAY'),
  },
  {
    badgeType: 'TEAM_PLAYER',
    check: ({ xpLogs }) =>
      xpLogs.filter((l: any) => l.reason === 'PEER_REVIEW_GIVEN').length >= 3,
  },
  {
    badgeType: 'DEEP_THINKER',
    check: ({ xpLogs }) =>
      xpLogs.filter((l: any) => l.reason === 'AI_FEEDBACK_REVISED').length >= 5,
  },
  {
    badgeType: 'TOP_OF_CLASS',
    check: ({ xpLogs, totalXP }) =>
      // Approximation: awarded if student is high XP (500+). Full check requires leaderboard query.
      totalXP >= 500,
  },
  {
    badgeType: 'PERFECTIONIST',
    check: ({ xpLogs }) =>
      xpLogs.filter((l: any) => l.reason === 'PERFECT_SCORE').length >= 5,
  },
  {
    badgeType: 'DRILL_MASTER',
    check: ({ xpLogs }) =>
      xpLogs.filter((l: any) => l.reason === 'PRACTICE_DRILL_COMPLETED').length >= 10,
  },
]

// ============================================================================
// Configure Amplify (once)
// ============================================================================

let client: any = null

function getClient() {
  if (!client) {
    Amplify.configure(
      {
        API: {
          GraphQL: {
            endpoint: process.env.API_ENDPOINT || '',
            region: process.env.AWS_REGION || 'us-east-1',
            defaultAuthMode: 'iam',
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
    )
    client = generateClient({ authMode: 'iam' })
  }
  return client
}

// ============================================================================
// Handler
// ============================================================================

export const handler: Handler = async (event) => {
  const { fieldName, arguments: args, identity } = event
  const gqlClient = getClient()

  try {
    switch (fieldName) {
      case 'awardXP':
        return await handleAwardXP(gqlClient, args, identity)
      case 'checkBadges':
        return await handleCheckBadges(gqlClient, args)
      case 'updateStreak':
        return await handleUpdateStreak(gqlClient, args)
      case 'rebuildLeaderboard':
        return await handleRebuildLeaderboard(gqlClient, args)
      case 'upsertStudentMemory':
        return await handleUpdateStudentMemory(gqlClient, args)
      case 'bootstrapStudentMemory':
        return await handleBootstrapStudentMemory(gqlClient, args)
      case 'updateStudentUnitMemoryFromGrade':
        return await handleUpdateStudentUnitMemory(gqlClient, args)
      case 'rebuildStudentMemoryProfile':
        return await handleRebuildStudentMemoryProfile(gqlClient, args)
      default:
        throw new Error(`Unknown operation: ${fieldName}`)
    }
  } catch (error: any) {
    console.error(`[gamification] ${fieldName} error:`, error)
    throw error
  }
}

// ============================================================================
// awardXP — Creates an XP log entry and returns the new total
// ============================================================================

async function handleAwardXP(
  gqlClient: any,
  args: { studentId: string; reason: string; referenceId?: string },
  identity: any,
) {
  const { studentId, reason, referenceId } = args
  let xpAmount = XP_AMOUNTS[reason]
  if (!xpAmount) throw new Error(`Invalid XP reason: ${reason}`)

  // Fetch logs upfront — needed for both duplicate check and diminishing returns
  const { data: allLogsResult } = await gqlClient.graphql({
    query: LIST_XP_LOGS_BY_STUDENT,
    variables: { studentId },
  })
  const allLogs = allLogsResult?.listStudentXPLogByStudentId?.items || []

  // Apply diminishing returns for practice drill XP reasons
  if (reason === 'PRACTICE_DRILL_COMPLETED' || reason === 'PRACTICE_DRILL_ACCURACY_BONUS') {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayPracticeLogs = allLogs.filter(
      (l: any) => l.reason === reason && l.createdAt?.startsWith(todayStr),
    )
    xpAmount = calculatePracticeDrillXP(xpAmount, todayPracticeLogs.length)
  }

  // Prevent duplicate XP for same action+reference
  if (referenceId) {
    const duplicate = allLogs.find(
      (l: any) => l.reason === reason && l.referenceId === referenceId,
    )
    if (duplicate) {
      return { alreadyAwarded: true, xpAmount: 0, totalXP: allLogs.reduce((s: number, l: any) => s + l.xpAmount, 0) }
    }
  }

  // Create log entry
  await gqlClient.graphql({
    query: CREATE_XP_LOG,
    variables: {
      input: {
        studentId,
        xpAmount,
        reason,
        referenceId: referenceId || null,
      },
    },
  })

  // Calculate new total (re-fetch to include the newly created log)
  const { data: updatedLogsResult } = await gqlClient.graphql({
    query: LIST_XP_LOGS_BY_STUDENT,
    variables: { studentId },
  })
  const totalXP = (updatedLogsResult?.listStudentXPLogByStudentId?.items || []).reduce(
    (sum: number, l: any) => sum + l.xpAmount,
    0,
  )

  // Auto-check badges after awarding XP
  try {
    await handleCheckBadges(gqlClient, { studentId })
  } catch (err) {
    console.error('[gamification] Auto-checkBadges after awardXP failed:', err)
  }

  return { alreadyAwarded: false, xpAmount, totalXP }
}

// ============================================================================
// checkBadges — Evaluates badge criteria and awards new badges
// ============================================================================

async function handleCheckBadges(
  gqlClient: any,
  args: { studentId: string },
) {
  const { studentId } = args

  // Fetch XP logs and existing badges
  const [xpResult, badgeResult] = await Promise.all([
    gqlClient.graphql({
      query: LIST_XP_LOGS_BY_STUDENT,
      variables: { studentId },
    }),
    gqlClient.graphql({
      query: LIST_BADGES_BY_STUDENT,
      variables: { studentId },
    }),
  ])

  const xpLogs = xpResult?.data?.listStudentXPLogByStudentId?.items || []
  const existingBadges = badgeResult?.data?.listStudentBadgeByStudentId?.items || []
  const existingTypes = new Set(existingBadges.map((b: any) => b.badgeType))
  const totalXP = xpLogs.reduce((s: number, l: any) => s + l.xpAmount, 0)

  const newBadges: string[] = []

  for (const criteria of BADGE_CRITERIA) {
    if (existingTypes.has(criteria.badgeType)) continue
    if (criteria.check({ xpLogs, badges: existingBadges, totalXP })) {
      await gqlClient.graphql({
        query: CREATE_BADGE,
        variables: {
          input: {
            studentId,
            badgeType: criteria.badgeType,
            awardedAt: new Date().toISOString(),
          },
        },
      })
      newBadges.push(criteria.badgeType)
    }
  }

  return { newBadges, totalBadges: existingBadges.length + newBadges.length }
}

// ============================================================================
// updateStreak — Updates the student's activity streak
// ============================================================================

async function handleUpdateStreak(
  gqlClient: any,
  args: { studentId: string },
) {
  const { studentId } = args
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  const { data: streakResult } = await gqlClient.graphql({
    query: GET_STREAK,
    variables: { studentId },
  })
  const streaks = streakResult?.listStudentStreakByStudentId?.items || []
  const existing = streaks[0]

  if (!existing) {
    // First activity ever
    const { data: created } = await gqlClient.graphql({
      query: CREATE_STREAK,
      variables: {
        input: {
          studentId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
        },
      },
    })
    return created.createStudentStreak
  }

  // Already active today
  if (existing.lastActivityDate === today) {
    return existing
  }

  // Check if yesterday
  const lastDate = new Date(existing.lastActivityDate)
  const todayDate = new Date(today)
  const diffDays = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (86400 * 1000),
  )

  let newStreak: number
  if (diffDays === 1) {
    // Consecutive day
    newStreak = existing.currentStreak + 1
  } else {
    // Streak broken
    newStreak = 1
  }

  const longestStreak = Math.max(existing.longestStreak, newStreak)

  const { data: updated } = await gqlClient.graphql({
    query: UPDATE_STREAK,
    variables: {
      input: {
        id: existing.id,
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: today,
        _version: existing._version,
      },
    },
  })
  return updated.updateStudentStreak
}

// ============================================================================
// rebuildLeaderboard — Rebuilds leaderboard entries for a cohort (section)
// ============================================================================

async function handleRebuildLeaderboard(
  gqlClient: any,
  args: { cohortId: string },
) {
  const { cohortId } = args

  // Check if leaderboard is enabled for this section
  const { data: sectionResult } = await gqlClient.graphql({
    query: GET_SECTION,
    variables: { id: cohortId },
  })
  const section = sectionResult?.getSection
  if (section?.leaderboardEnabled === false) {
    // Leaderboard disabled — delete existing entries for this cohort
    const { data: lbResult } = await gqlClient.graphql({
      query: LIST_LEADERBOARD_BY_COHORT,
      variables: { cohortId },
    })
    const existing = lbResult?.listLeaderboardEntryByCohortId?.items || []
    for (const entry of existing) {
      await gqlClient.graphql({
        query: `mutation DeleteLeaderboardEntry($input: DeleteLeaderboardEntryInput!) {
          deleteLeaderboardEntry(input: $input) { id }
        }`,
        variables: { input: { id: entry.id, _version: entry._version } },
      })
    }
    return { updated: 0, created: 0, deleted: existing.length, total: 0 }
  }

  // Get all grades for this section to find student IDs
  const { data: gradesResult } = await gqlClient.graphql({
    query: LIST_GRADES_BY_SECTION,
    variables: { sectionID: cohortId },
  })
  const grades = gradesResult?.listGradeBySectionID?.items || []

  // Unique students
  const studentIds = [...new Set(grades.map((g: any) => g.owner).filter(Boolean))] as string[]

  // Fetch opt-out settings for all students to apply privacy at the data layer
  const optedOutIds = new Set<string>()
  for (const studentId of studentIds) {
    try {
      const { data: settingsResult } = await gqlClient.graphql({
        query: GET_SETTINGS_BY_OWNER,
        variables: { owner: studentId },
      })
      const settings = settingsResult?.listSettings?.items?.[0]
      if (settings?.leaderboardOptIn === false) {
        optedOutIds.add(studentId)
      }
    } catch {
      // Settings not found — default to opted-in
    }
  }

  // Get existing leaderboard entries
  const { data: lbResult } = await gqlClient.graphql({
    query: LIST_LEADERBOARD_BY_COHORT,
    variables: { cohortId },
  })
  const existingEntries = lbResult?.listLeaderboardEntryByCohortId?.items || []
  const existingByStudent = new Map<string, any>(existingEntries.map((e: any) => [e.studentId, e]))

  let updated = 0
  let created = 0

  for (const studentId of studentIds) {
    // Get XP total
    const { data: xpResult } = await gqlClient.graphql({
      query: LIST_XP_LOGS_FOR_COHORT,
      variables: { studentId },
    })
    const xpLogs = xpResult?.listStudentXPLogByStudentId?.items || []
    const totalXP = xpLogs.reduce(
      (s: number, l: any) => s + l.xpAmount,
      0,
    )

    const level = calculateLevel(totalXP)
    const completedAssignments = grades.filter(
      (g: any) => g.owner === studentId && g.complete,
    ).length

    // Count nailed-it XP awards
    const nailedItCount = xpLogs.filter((l: any) => l.reason === 'NAILED_IT').length

    // Get streak
    const { data: streakResult } = await gqlClient.graphql({
      query: LIST_STREAKS_BY_STUDENT,
      variables: { studentId },
    })
    const streak = streakResult?.listStudentStreakByStudentId?.items?.[0]
    const currentStreak = streak?.currentStreak || 0

    const existing = existingByStudent.get(studentId)
    // Apply privacy: anonymize name for students who opted out
    const displayName = optedOutIds.has(studentId) ? 'Anonymous Student' : studentId
    const displayColor = optedOutIds.has(studentId) ? '#9e9e9e' : undefined

    if (existing) {
      await gqlClient.graphql({
        query: UPDATE_LEADERBOARD_ENTRY,
        variables: {
          input: {
            id: existing.id,
            studentName: displayName,
            ...(displayColor ? { avatarColor: displayColor } : {}),
            totalXP,
            level,
            completedAssignments,
            currentStreak,
            nailedItCount,
            lastUpdated: new Date().toISOString(),
            _version: existing._version,
          },
        },
      })
      updated++
    } else {
      await gqlClient.graphql({
        query: CREATE_LEADERBOARD_ENTRY,
        variables: {
          input: {
            cohortId,
            studentId,
            studentName: displayName,
            ...(displayColor ? { avatarColor: displayColor } : {}),
            totalXP,
            level,
            completedAssignments,
            currentStreak,
            nailedItCount,
            lastUpdated: new Date().toISOString(),
          },
        },
      })
      created++
    }
  }

  return { updated, created, total: studentIds.length }
}

// ============================================================================
// updateStudentMemory — Appends AI feedback to student's memory markdown
// ============================================================================

async function handleUpdateStudentMemory(
  gqlClient: any,
  args: { studentId: string; feedbackMarkdown: string; source: string },
) {
  const { studentId, feedbackMarkdown, source } = args

  const { data: memResult } = await gqlClient.graphql({
    query: GET_STUDENT_MEMORY,
    variables: { studentId },
  })
  const entries = memResult?.listStudentMemoryByStudentId?.items || []
  const existing = entries[0]

  const timestamp = new Date().toISOString()
  const newSection = `\n\n---\n### ${source} (${timestamp})\n${feedbackMarkdown}`

  if (existing) {
    const updatedMarkdown = existing.memoryMarkdown + newSection
    const { data: updated } = await gqlClient.graphql({
      query: UPDATE_STUDENT_MEMORY,
      variables: {
        input: {
          id: existing.id,
          memoryMarkdown: updatedMarkdown,
          lastUpdatedBy: source,
          version: (existing.version || 0) + 1,
          _version: existing._version,
        },
      },
    })
    return updated.updateStudentMemory
  } else {
    const { data: created } = await gqlClient.graphql({
      query: CREATE_STUDENT_MEMORY,
      variables: {
        input: {
          studentId,
          memoryMarkdown: `# Student Memory\n\nAutomatically maintained by AI feedback system.${newSection}`,
          lastUpdatedBy: source,
          version: 1,
        },
      },
    })
    return created.createStudentMemory
  }
}

// ============================================================================
// bootstrapStudentMemory — One-time memory generation for existing students
// ============================================================================

const LIST_ALL_GRADES = `query ListGrades($nextToken: String) {
  listGrades(limit: 1000, nextToken: $nextToken) {
    items { id owner accuracy complete data _version }
    nextToken
  }
}`

async function handleBootstrapStudentMemory(
  gqlClient: any,
  args: { studentId: string },
) {
  const { studentId } = args

  // Check if memory already exists
  const { data: memResult } = await gqlClient.graphql({
    query: GET_STUDENT_MEMORY,
    variables: { studentId },
  })
  const existing = memResult?.listStudentMemoryByStudentId?.items?.[0]
  if (existing) {
    return { skipped: true, message: 'Memory already exists for this student' }
  }

  // Fetch all grades for this student
  const { data: xpResult } = await gqlClient.graphql({
    query: LIST_XP_LOGS_BY_STUDENT,
    variables: { studentId },
  })
  const xpLogs = xpResult?.listStudentXPLogByStudentId?.items || []
  const totalXP = xpLogs.reduce((s: number, l: any) => s + l.xpAmount, 0)
  const level = calculateLevel(totalXP)
  const levelInfo = LEVELS.find((l) => l.level === level) || LEVELS[0]

  // Get badges
  const { data: badgeResult } = await gqlClient.graphql({
    query: LIST_BADGES_BY_STUDENT,
    variables: { studentId },
  })
  const badges = badgeResult?.listStudentBadgeByStudentId?.items || []

  // Count submissions and nailed-its
  const submissions = xpLogs.filter((l: any) => l.reason === 'HOMEWORK_SUBMITTED').length
  const nailedIts = xpLogs.filter((l: any) => l.reason === 'NAILED_IT').length
  const revisions = xpLogs.filter((l: any) => l.reason === 'AI_FEEDBACK_REVISED').length
  const peerReviews = xpLogs.filter((l: any) =>
    l.reason === 'PEER_REVIEW_GIVEN' || l.reason === 'PEER_REVIEW_HOSTED'
  ).length

  // Build initial memory document
  const memoryMarkdown = `# Student Memory: ${studentId}
Last Updated: ${new Date().toISOString()}

## Learning Profile
- Current Level: ${levelInfo.label} (Level ${level})
- Total XP: ${totalXP}
- Assignments Submitted: ${submissions}
- Revisions After Feedback: ${revisions}
- Peer Reviews: ${peerReviews}

## Achievements
${badges.length > 0 ? badges.map((b: any) => `- ${b.badgeType} (${b.awardedAt})`).join('\n') : '- No badges earned yet'}

## Nailed It Moments
${nailedIts > 0 ? `- ${nailedIts} blocks flagged as excellent by AI` : '- None yet'}

## Notes for AI Tutor
- This memory was auto-generated from existing activity history.
- Observe the student's responses to build a more detailed profile over time.
`

  const { data: created } = await gqlClient.graphql({
    query: CREATE_STUDENT_MEMORY,
    variables: {
      input: {
        studentId,
        memoryMarkdown,
        lastUpdatedBy: 'bootstrap',
        version: 1,
      },
    },
  })

  return { created: true, id: created.createStudentMemory.id }
}

// ============================================================================
// updateStudentUnitMemory — Incremental merge of per-unit learning data
// ============================================================================

interface ConceptEntry {
  concept: string
  sourceType: string
  frequency: number
  lastSeen: string
}

interface ConfusionPair {
  item1: string
  item2: string
  frequency: number
}

const WEAK_THRESHOLD = 70
const STRONG_THRESHOLD = 90
const REVIEW_PRIORITY_DECAY_DAYS = 7

function mergeConceptLists(
  existing: ConceptEntry[],
  incoming: string[],
  sourceType: string,
  timestamp: string,
): ConceptEntry[] {
  const map = new Map<string, ConceptEntry>()
  for (const e of existing) {
    map.set(e.concept, e)
  }
  for (const concept of incoming) {
    const prev = map.get(concept)
    if (prev) {
      map.set(concept, { ...prev, frequency: prev.frequency + 1, lastSeen: timestamp })
    } else {
      map.set(concept, { concept, sourceType, frequency: 1, lastSeen: timestamp })
    }
  }
  return Array.from(map.values())
}

function calculateReviewPriority(
  averageAccuracy: number,
  weakCount: number,
  totalConcepts: number,
  confusionCount: number,
  daysSinceLastPractice: number,
): number {
  // Accuracy factor: lower accuracy = higher priority (0-1 scale, inverted)
  const accuracyFactor = Math.max(0, 1 - (averageAccuracy / 100))
  // Weakness ratio: more weak concepts relative to total = higher priority
  const weaknessRatio = totalConcepts > 0 ? weakCount / totalConcepts : 0
  // Confusion factor: more confusion pairs = higher priority (capped at 1)
  const confusionFactor = Math.min(1, confusionCount / 5)
  // Spaced repetition decay: more days since practice = higher priority (capped at 1)
  const decayFactor = Math.min(1, daysSinceLastPractice / REVIEW_PRIORITY_DECAY_DAYS)

  return Math.min(1, (accuracyFactor * 0.35) + (weaknessRatio * 0.25) + (confusionFactor * 0.2) + (decayFactor * 0.2))
}

async function handleUpdateStudentUnitMemory(
  gqlClient: any,
  args: {
    studentId: string
    unitID: string
    accuracy: number
    weakAreas: string[]
    strongAreas: string[]
    confusionPairs?: ConfusionPair[]
    accuracyBySource?: Record<string, number>
    sourceType?: string
  },
) {
  const {
    studentId,
    unitID,
    accuracy,
    weakAreas = [],
    strongAreas = [],
    confusionPairs: incomingPairs = [],
    accuracyBySource: incomingAccBySource = {},
    sourceType = 'practice',
  } = args

  const timestamp = new Date().toISOString()

  // Fetch existing unit memory
  const { data: listResult } = await gqlClient.graphql({
    query: LIST_UNIT_MEMORY_BY_STUDENT,
    variables: { studentId },
  })
  const allEntries = listResult?.listStudentUnitMemoryByStudentId?.items || []
  const existing = allEntries.find((e: any) => e.unitID === unitID)

  if (existing) {
    // Merge concepts
    const prevWeak: ConceptEntry[] = existing.weakConcepts ? JSON.parse(JSON.stringify(existing.weakConcepts)) : []
    const prevStrong: ConceptEntry[] = existing.strongConcepts ? JSON.parse(JSON.stringify(existing.strongConcepts)) : []
    const prevPairs: ConfusionPair[] = existing.confusionPairs ? JSON.parse(JSON.stringify(existing.confusionPairs)) : []
    const prevAccBySource: Record<string, number> = existing.accuracyBySource
      ? JSON.parse(JSON.stringify(existing.accuracyBySource))
      : {}
    const prevAttempts = existing.totalAttempts || 0
    const prevAvgAcc = existing.averageAccuracy || 0

    // Merge weak/strong concepts with frequency tracking
    const mergedWeak = mergeConceptLists(prevWeak, weakAreas, sourceType, timestamp)
    const mergedStrong = mergeConceptLists(prevStrong, strongAreas, sourceType, timestamp)

    // Remove concepts from weak if they're now strong (student improved)
    const strongSet = new Set(strongAreas)
    const filteredWeak = mergedWeak.filter((c) => !strongSet.has(c.concept))

    // Remove concepts from strong if they're now weak (student regressed)
    const weakSet = new Set(weakAreas)
    const filteredStrong = mergedStrong.filter((c) => !weakSet.has(c.concept))

    // Merge confusion pairs
    const pairMap = new Map<string, ConfusionPair>()
    for (const p of prevPairs) {
      pairMap.set(`${p.item1}|${p.item2}`, p)
    }
    for (const p of incomingPairs) {
      const key = `${p.item1}|${p.item2}`
      const prev = pairMap.get(key)
      if (prev) {
        pairMap.set(key, { ...prev, frequency: prev.frequency + p.frequency })
      } else {
        pairMap.set(key, p)
      }
    }
    const mergedPairs = Array.from(pairMap.values())

    // Rolling average for accuracy by source
    const mergedAccBySource = { ...prevAccBySource }
    for (const [src, acc] of Object.entries(incomingAccBySource)) {
      if (mergedAccBySource[src] !== undefined) {
        mergedAccBySource[src] = Math.round(((mergedAccBySource[src] + acc) / 2) * 100) / 100
      } else {
        mergedAccBySource[src] = acc
      }
    }

    // Running average accuracy
    const newAttempts = prevAttempts + 1
    const newAvgAcc = Math.round(((prevAvgAcc * prevAttempts + accuracy) / newAttempts) * 100) / 100

    // Days since now (0, since we just practiced)
    const totalConcepts = filteredWeak.length + filteredStrong.length
    const reviewPriority = calculateReviewPriority(newAvgAcc, filteredWeak.length, totalConcepts, mergedPairs.length, 0)

    const { data: updated } = await gqlClient.graphql({
      query: UPDATE_UNIT_MEMORY,
      variables: {
        input: {
          id: existing.id,
          weakConcepts: filteredWeak,
          strongConcepts: filteredStrong,
          confusionPairs: mergedPairs,
          accuracyBySource: mergedAccBySource,
          totalAttempts: newAttempts,
          averageAccuracy: newAvgAcc,
          reviewPriority,
          lastPracticedAt: timestamp,
          _version: existing._version,
        },
      },
    })
    return updated.updateStudentUnitMemory
  } else {
    // Create new unit memory
    const totalConcepts = weakAreas.length + strongAreas.length
    const reviewPriority = calculateReviewPriority(accuracy, weakAreas.length, totalConcepts, incomingPairs.length, 0)

    const { data: created } = await gqlClient.graphql({
      query: CREATE_UNIT_MEMORY,
      variables: {
        input: {
          studentId,
          unitID,
          weakConcepts: weakAreas.map((c) => ({ concept: c, sourceType, frequency: 1, lastSeen: timestamp })),
          strongConcepts: strongAreas.map((c) => ({ concept: c, sourceType, frequency: 1, lastSeen: timestamp })),
          confusionPairs: incomingPairs,
          accuracyBySource: incomingAccBySource,
          totalAttempts: 1,
          averageAccuracy: accuracy,
          reviewPriority,
          lastPracticedAt: timestamp,
        },
      },
    })
    return created.createStudentUnitMemory
  }
}

// ============================================================================
// rebuildStudentMemoryProfile — Aggregate per-unit data into central profile
// ============================================================================

const MAX_TOP_CONCEPTS = 10
const MAX_TREND_POINTS = 20
const MAX_MEMORY_MARKDOWN_LENGTH = 2000

async function handleRebuildStudentMemoryProfile(
  gqlClient: any,
  args: { studentId: string },
) {
  const { studentId } = args

  // Fetch all StudentUnitMemory records for this student
  const { data: unitMemResult } = await gqlClient.graphql({
    query: LIST_UNIT_MEMORY_BY_STUDENT,
    variables: { studentId },
  })
  const unitMemories = (unitMemResult?.listStudentUnitMemoryByStudentId?.items || [])
    .filter((item: any) => item != null)

  if (unitMemories.length === 0) {
    return { skipped: true, message: 'No unit memories to aggregate' }
  }

  // Aggregate weak concepts across all units by frequency
  const weakMap = new Map<string, { concept: string; frequency: number; units: number }>()
  const strongMap = new Map<string, { concept: string; frequency: number; units: number }>()

  // Aggregate accuracy by source across all units
  const sourceAccSums: Record<string, { sum: number; count: number }> = {}

  for (const um of unitMemories) {
    const weak: ConceptEntry[] = um.weakConcepts || []
    for (const w of weak) {
      const prev = weakMap.get(w.concept)
      if (prev) {
        weakMap.set(w.concept, {
          concept: w.concept,
          frequency: prev.frequency + w.frequency,
          units: prev.units + 1,
        })
      } else {
        weakMap.set(w.concept, { concept: w.concept, frequency: w.frequency, units: 1 })
      }
    }

    const strong: ConceptEntry[] = um.strongConcepts || []
    for (const s of strong) {
      const prev = strongMap.get(s.concept)
      if (prev) {
        strongMap.set(s.concept, {
          concept: s.concept,
          frequency: prev.frequency + s.frequency,
          units: prev.units + 1,
        })
      } else {
        strongMap.set(s.concept, { concept: s.concept, frequency: s.frequency, units: 1 })
      }
    }

    const accBySrc: Record<string, number> = um.accuracyBySource || {}
    for (const [src, acc] of Object.entries(accBySrc)) {
      if (!sourceAccSums[src]) sourceAccSums[src] = { sum: 0, count: 0 }
      sourceAccSums[src].sum += acc
      sourceAccSums[src].count += 1
    }
  }

  // Sort by frequency descending, take top N
  const topWeak = Array.from(weakMap.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, MAX_TOP_CONCEPTS)
  const topStrong = Array.from(strongMap.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, MAX_TOP_CONCEPTS)

  // Determine dominant source weakness
  const sourceAvg: Record<string, number> = {}
  for (const [src, data] of Object.entries(sourceAccSums)) {
    sourceAvg[src] = Math.round((data.sum / data.count) * 100) / 100
  }
  const dominantSourceWeakness = Object.entries(sourceAvg)
    .sort(([, a], [, b]) => a - b)[0]?.[0] || null

  // Build accuracy trend (sorted by lastPracticedAt)
  const accuracyTrend = unitMemories
    .filter((um: any) => um.lastPracticedAt && um.averageAccuracy != null)
    .sort((a: any, b: any) => new Date(a.lastPracticedAt).getTime() - new Date(b.lastPracticedAt).getTime())
    .slice(-MAX_TREND_POINTS)
    .map((um: any) => ({
      unitID: um.unitID,
      accuracy: um.averageAccuracy,
      date: um.lastPracticedAt,
    }))

  // Build structured profile
  const structuredProfile = {
    topWeakConcepts: topWeak,
    topStrongConcepts: topStrong,
    accuracyTrend,
    dominantSourceWeakness,
    sourceAverages: sourceAvg,
    unitsStudied: unitMemories.length,
    lastUpdated: new Date().toISOString(),
  }

  // Build capped markdown summary for chat context
  const weakBullets = topWeak.slice(0, 5).map((w) => `- ${w.concept} (×${w.frequency})`).join('\n')
  const strongBullets = topStrong.slice(0, 5).map((s) => `- ${s.concept} (×${s.frequency})`).join('\n')
  const sourceLine = Object.entries(sourceAvg).map(([s, a]) => `${s}: ${a}%`).join(', ')

  let summaryMarkdown = `## Cross-Unit Summary (auto-generated)\n`
  summaryMarkdown += `Units studied: ${unitMemories.length} | Dominant weakness: ${dominantSourceWeakness || 'none'}\n\n`
  if (weakBullets) summaryMarkdown += `### Needs Review\n${weakBullets}\n\n`
  if (strongBullets) summaryMarkdown += `### Strengths\n${strongBullets}\n\n`
  if (sourceLine) summaryMarkdown += `### By Source\n${sourceLine}\n`

  // Truncate if needed
  if (summaryMarkdown.length > MAX_MEMORY_MARKDOWN_LENGTH) {
    summaryMarkdown = summaryMarkdown.slice(0, MAX_MEMORY_MARKDOWN_LENGTH - 3) + '...'
  }

  // Upsert StudentMemory with the profile
  const { data: memResult } = await gqlClient.graphql({
    query: GET_STUDENT_MEMORY,
    variables: { studentId },
  })
  const existingMem = memResult?.listStudentMemoryByStudentId?.items?.[0]

  if (existingMem) {
    const { data: updated } = await gqlClient.graphql({
      query: UPDATE_STUDENT_MEMORY,
      variables: {
        input: {
          id: existingMem.id,
          memoryMarkdown: summaryMarkdown,
          structuredProfile: JSON.stringify(structuredProfile),
          lastUpdatedBy: 'profile-rebuild',
          version: (existingMem.version || 0) + 1,
          _version: existingMem._version,
        },
      },
    })
    return { updated: true, profile: structuredProfile }
  } else {
    const { data: created } = await gqlClient.graphql({
      query: CREATE_STUDENT_MEMORY,
      variables: {
        input: {
          studentId,
          memoryMarkdown: summaryMarkdown,
          structuredProfile: JSON.stringify(structuredProfile),
          lastUpdatedBy: 'profile-rebuild',
          version: 1,
        },
      },
    })
    return { created: true, id: created.createStudentMemory.id, profile: structuredProfile }
  }
}
