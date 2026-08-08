import { a, defineData, type ClientSchema } from "@aws-amplify/backend";
import { openaiHandler } from "../functions/openai/resource";
import { sectionHandler } from "../functions/section/resource";
import { embeddingsHandler } from "../functions/embeddings/resource";
import { moderationHandler } from "../functions/moderation/resource";
import { documentAnalysisHandler } from "../functions/documentAnalysis/resource";

import { mediaConvertHandler } from "../functions/mediaConvert/resource";
import { imageProcessHandler } from "../functions/imageProcess/resource";
import { documentThumbnailHandler } from "../functions/documentThumbnail/resource";
import { gamificationHandler } from "../functions/gamification/resource";
import { peerReviewAIHandler } from "../functions/peerReviewAI/resource";
import { generatePracticeDrillHandler } from "../functions/generatePracticeDrill/resource";
import { publishUnitHandler } from "../functions/publishUnit/resource";
import { rebuildNgramIndexHandler } from "../functions/rebuildNgramIndex/resource";
import { recycleBinHandler } from "../functions/recycleBin/resource";

/**
 * Amplify Gen 2 Data Schema
 *
 * Migrated from Gen 1 GraphQL schema with simplified/consolidated fields:
 * - EmbeddingInfo type consolidates embedding fields
 * - ModerationInfo type consolidates moderation fields
 * - File-based organization by domain
 *
 * Note: Streaming operations (chatStream, contentCompletionStream, suggestBlocksStream)
 * are handled via HTTP API endpoints in amplify/backend.ts, not GraphQL mutations.
 *
 * Gen 2 Notes:
 * - Use hasOne/belongsTo for one-to-many relationships
 * - Many-to-many: explicit join tables (UnitFile, UnitWord, etc.)
 * - Authorization: allow.owner(), allow.group('name'), allow.authenticated()
 */

// ============================================================================
// ENUMS & SHARED TYPES
// ============================================================================

const PublishedStatus = a.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

const CollaboratorPermission = a.enum(["READ", "EDIT"]);

const FileProtectionLevels = a.enum(["PUBLIC", "PRIVATE", "PROTECTED"]);

const AiContentType = a.enum([
  "CHAT_MESSAGE",
  "CONTENT_COMPLETION",
  "AUDIO_GENERATION",
  "IMAGE_GENERATION",
  "DOCUMENT_ANALYSIS",
  "VOCABULARY_EXTRACTION",
  "TRANSCRIPTION",
  "IMAGE_DESCRIPTION",
  "GRADING_FEEDBACK",
  "BLOCK_SUGGESTION",
]);

const AiFeedbackType = a.enum(["POSITIVE", "NEGATIVE"]);

const AiFeedbackReason = a.enum([
  "INCORRECT",
  "INCOMPLETE",
  "INAPPROPRIATE",
  "NOT_HELPFUL",
  "IRRELEVANT",
  "POOR_QUALITY",
  "OTHER",
]);

const PracticeDrillType = a.enum([
  "MIXED",
  "VOCABULARY",
  "COMPREHENSION",
  "REVIEW",
]);

const NotificationType = a.enum([
  "ASSIGNMENT_NEW",
  "ASSIGNMENT_DUE_SOON",
  "ASSIGNMENT_DUE_NOW",
  "GRADE_RECEIVED",
  "PEER_REVIEW_COMPLETE",
  "PEER_REVIEW_INVITE",
  "PRACTICE_SESSION_INVITE",
  "WORKBOOK_SESSION_INVITE",
  "HOMEWORK_ROOM_OPENED",
  "XP_MILESTONE",
  "LEVEL_UP",
  "BADGE_EARNED",
  "BADGE_LOST",
  "DEBUFF_APPLIED",
  "DEBUFF_EXPIRED",
  "STREAK_MILESTONE",
  "STREAK_AT_RISK",
  "PERSONAL_BEST",
  "CHALLENGE_STARTED",
  "CHALLENGE_ENDING_SOON",
  "CHALLENGE_COMPLETED",
  "SQUAD_POST_NEW",
  "SQUAD_MEMBER_JOINED",
  "SQUAD_METADATA_UPDATED",
  "SQUAD_INVITE",
  "GUILD_POST_NEW",
  "GUILD_MEMBER_JOINED",
  "CHAT_MENTION",
  "CHAT_NEW_MESSAGE",
  "MODERATION_FLAGGED",
  "SYSTEM_ANNOUNCEMENT",
  "SYSTEM_MAINTENANCE",
]);

const NotificationCategory = a.enum([
  "ASSIGNMENT",
  "COLLABORATION",
  "GAMIFICATION",
  "MODERATION",
  "SQUAD",
  "GUILD",
  "CHAT",
  "SYSTEM",
]);

// Phase 6 — CloudFront signed cookie values returned by getUnitsCdnCookie
const CdnCookies = a.customType({
  policy: a.string().required(),
  signature: a.string().required(),
  keyPairId: a.string().required(),
});

// Consolidated types for DRY principles
const EmbeddingInfo = a.customType({
  // Vector data moved to S3: private/{identityId}/embeddings/{model}/{id}.json
  model: a.string(),
  dimensions: a.integer(),
  version: a.timestamp(), // Cache key — fetch from S3 when version changes
  wordCount: a.integer(),
  pageCount: a.integer(), // Number of page embeddings (for multi-page files)
});

const ModerationInfo = a.customType({
  status: a.string(), // "pending", "approved", "flagged"
  flags: a.json(),
  checkedAt: a.datetime(),
});

// @ts-ignore - used via a.ref() string references in schema returns
const Choice = a.customType({
  choice: a.string(),
  correct: a.boolean(),
});

// ============================================================================
// PHASE 1: TYPED CUSTOM TYPES (replace a.json() usage)
// ============================================================================

// --- Gamification settings custom types ---
const LevelThreshold = a.customType({
  level: a.integer().required(),
  xpRequired: a.integer().required(),
  title: a.string(), // Optional custom title for this level (e.g., "Apprentice", "Master")
});

const BadgeConfig = a.customType({
  badgeType: a.string().required(),
  enabled: a.boolean().required(),
  // Override criteria thresholds per section
  thresholdOverride: a.integer(),
});

const CustomBadgeDefinition = a.customType({
  id: a.string().required(),
  title: a.string().required(),
  description: a.string(),
  icon: a.string(), // URL or emoji
  shape: a.string(), // "circle" | "hexagon" | "shield" | "diamond"
  rarity: a.string(), // "common" | "uncommon" | "rare" | "epic" | "legendary"
  category: a.string(),
  criteria: a.json(), // Evaluation criteria object
  isAnti: a.boolean(), // Whether this is an anti-badge
  autoEvaluate: a.boolean(),
});

const SectionGamificationConfig = a.customType({
  // Feature toggles — null means "use platform default"
  xpEnabled: a.boolean(), // Toggle XP earning and display (default: platform)
  leaderboardEnabled: a.boolean(), // Toggle leaderboard visibility (default: platform)
  badgesEnabled: a.boolean(), // Toggle badge awarding (default: platform)
  antiBadgesEnabled: a.boolean(), // Toggle anti-badge awarding (default: platform)
  easterEggsEnabled: a.boolean(), // Toggle easter egg discovery (default: platform)
  groupChallengesEnabled: a.boolean(), // Toggle group/boss battle challenges (default: platform)
  squadsEnabled: a.boolean(), // Toggle squad formation (default: platform)
  skillTreesEnabled: a.boolean(), // Toggle skill tree progression (default: platform)
  streaksEnabled: a.boolean(), // Toggle streak tracking (default: platform)
  collaborativePracticeEnabled: a.boolean(), // Toggle collaborative drill mode (default: platform)
  cosmeticsEnabled: a.boolean(), // Toggle avatar/cosmetic unlocks (default: platform)
  contentLocksEnabled: a.boolean(), // Toggle XP/badge-gated content locks (default: platform)
  // Streak settings
  streakFreezesAllowed: a.integer(), // Per-section freeze cap override
  // Badge configuration — which badge types are active in this section
  badgeConfigs: a.ref("BadgeConfig").array(),
  // Custom badge definitions — instructor-created badges for this section
  customBadges: a.ref("CustomBadgeDefinition").array(),
});

// --- Gamification aggregates ---
const BadgeEntry = a.customType({
  badgeType: a.string().required(),
  sourceId: a.string(),
  awardedAt: a.datetime(),
  cohortId: a.string(),
  unitID: a.string(),
  count: a.integer(),
  isAnti: a.boolean(),
});

const ModuleProgressEntry = a.customType({
  moduleId: a.string().required(),
  completionPercent: a.float().required(),
  totalWorkbooks: a.integer(),
  completedWorkbooks: a.integer(),
  lastUpdatedAt: a.datetime(),
});

const PersonalBestEntry = a.customType({
  unitID: a.string().required(),
  bestScore: a.float().required(),
  achievedAt: a.datetime(),
  previousBest: a.float(),
});

const SkillProgressEntry = a.customType({
  skillId: a.string().required(),
  status: a.string().required(), // LOCKED | AVAILABLE | IN_PROGRESS | MASTERED
});

const UnitMemoryEntry = a.customType({
  unitID: a.string().required(),
  weakConcepts: a.string().array(),
  strongConcepts: a.string().array(),
  totalAttempts: a.integer(),
  averageAccuracy: a.float(),
  reviewPriority: a.float(),
  lastPracticedAt: a.datetime(),
});

const SquadMember = a.customType({
  studentId: a.string().required(),
  role: a.string(), // LEADER | MEMBER
  joinedAt: a.datetime(),
  // Denormalized avatar config — synced from StudentProfile on rebuild
  avatarStyle: a.string(),
  avatarOverrides: a.json(),
  avatarSeed: a.string(),
});

const SquadPostEntry = a.customType({
  authorId: a.string().required(),
  title: a.string().required(),
  data: a.string(),
  createdAt: a.datetime(),
});

const ChallengeContribution = a.customType({
  studentId: a.string().required(),
  xpContributed: a.integer().required(),
  contributedAt: a.datetime(),
});

const CosmeticRewardEntry = a.customType({
  /** Type of cosmetic: ring | title | border | flair | style | theme */
  type: a.string().required(),
  /** Value: preset name, display text, style tier key, or theme key */
  value: a.string().required(),
  /** Duration in hours. null = permanent */
  durationHours: a.integer(),
  /** When this cosmetic was awarded */
  awardedAt: a.datetime(),
  /** When it expires (null = permanent) */
  expiresAt: a.datetime(),
  /** Source challenge/badge that granted it */
  sourceId: a.string(),
  /** Human-readable label for UI display */
  label: a.string(),
});

const SquadRecapEntry = a.customType({
  challengeId: a.string().required(),
  challengeTitle: a.string(),
  recap: a.string().required(),
  rivalSquadId: a.string(),
  rivalSquadName: a.string(),
  performance: a.string(),
  generatedAt: a.datetime(),
});

const EasterEggDiscoveryEntry = a.customType({
  studentId: a.string().required(),
  discoveredAt: a.datetime(),
});

const EasterEggProfileEntry = a.customType({
  easterEggId: a.string().required(),
  discoveredAt: a.datetime(),
  xpReward: a.integer(),
});

// --- Document analysis ---
const VocabularyEntry = a.customType({
  word: a.string().required(),
  definition: a.string(),
  context: a.string(),
  page: a.integer(),
});

const SummaryEntry = a.customType({
  title: a.string().required(),
  content: a.string(),
  pageRange: a.string(),
});

const CourseOutlineEntry = a.customType({
  unitId: a.id().required(),
  name: a.string().required(),
  number: a.float(),
  summary: a.string(),
  vocabularyCount: a.integer(),
  questionCount: a.integer(),
  fileCount: a.integer(),
  documentSummaries: a.string(),
});

const ObjectiveEntry = a.customType({
  objective: a.string().required(),
  bloomLevel: a.string(),
});

const ConceptEntry = a.customType({
  concept: a.string().required(),
  description: a.string(),
  relatedVocabulary: a.string().array(),
});

const QuestionEntry = a.customType({
  question: a.string().required(),
  expectedAnswer: a.string(),
  hint: a.string(),
  type: a.string(),
});

const PendingMediaEntry = a.customType({
  filename: a.string().required(),
  mimeType: a.string().required(),
  s3Key: a.string().required(),
  size: a.integer().required(),
  description: a.string(),
  approved: a.boolean(),
});

// --- Practice / Insights ---
const SourcesEnabled = a.customType({
  vocabulary: a.boolean(),
  questions: a.boolean(),
  text: a.boolean(),
});

const CoverageSnapshot = a.customType({
  total: a.integer(),
  covered: a.integer(),
});

const BlockBreakdown = a.customType({
  vocabulary: a.float(),
  questions: a.float(),
  text: a.float(),
});

// --- Document processing ---
const ResumeState = a.customType({
  lastProcessedPage: a.integer(),
  accumulatedPages: a.integer(),
  totalPages: a.integer(),
});

// --- Grading ---
const CurveSettings = a.customType({
  unitID: a.string().required(),
  method: a.string().required(), // scale-to-top | linear-adjustment
});

// --- Workbook comments ---
const CommentReply = a.customType({
  authorId: a.string().required(),
  content: a.string().required(),
  createdAt: a.datetime(),
});

// --- Agent job ---
const JobError = a.customType({
  message: a.string(),
  code: a.string(),
  stack: a.string(),
  timestamp: a.datetime(),
});

// --- Student memory ---
const ConceptStrength = a.customType({
  concept: a.string().required(),
  sourceType: a.string(),
  frequency: a.integer(),
  lastSeen: a.datetime(),
});

const ConfusionPair = a.customType({
  conceptA: a.string().required(),
  conceptB: a.string().required(),
  frequency: a.integer(),
});

// --- Report Card (grade rollup stats) ---
const GradeStats = a.customType({
  min: a.float().required(),
  max: a.float().required(),
  avg: a.float().required(),
  count: a.integer().required(),
});

const TimeStats = a.customType({
  min: a.integer().required(), // fastest completion (ms)
  max: a.integer().required(), // slowest completion (ms)
  avg: a.integer().required(), // mean completion time (ms)
  count: a.integer().required(),
});

const ReportCard = a.customType({
  gradeStats: a.ref("GradeStats"),
  timeStats: a.ref("TimeStats"),
  lastUpdated: a.datetime(),
});

// ============================================================================
// MAIN SCHEMA DEFINITION
// ============================================================================

const schema = a
  .schema({
    // ========================================================================
    // CUSTOM TYPES FOR LAMBDA FUNCTION RETURNS
    // ========================================================================

    StudentInfo: a.customType({
      id: a.id().required(),
      name: a.string(),
      email: a.string(),
    }),

    PageEmbedding: a.customType({
      page: a.integer().required(),
      embedding: a.float().array().required(),
      text: a.string(),
    }),

    EmbeddingResult: a.customType({
      embedding: a.float().array().required(),
      model: a.string().required(),
      dimensions: a.integer().required(),
      tokenCount: a.integer().required(),
      error: a.string(),
    }),

    ModerationResult: a.customType({
      flagged: a.boolean().required(),
      categories: a.json().required(), // OpenAI moderation categories
      categoryScores: a.json().required(),
      model: a.string().required(),
      error: a.string(),
      transcript: a.string(), // Populated for audio moderation (Whisper output)
    }),

    AnalyzeDocumentResult: a.customType({
      success: a.boolean().required(),
      fileID: a.id().required(),
      documentID: a.id(),
      responseId: a.string(),
      pageCount: a.integer(),
      progress: a.string(),
      message: a.string(),
    }),

    CancelDocumentAnalysisResult: a.customType({
      success: a.boolean().required(),
      fileID: a.id().required(),
      documentID: a.id(),
      message: a.string(),
    }),

    ApproveMediaResult: a.customType({
      success: a.boolean().required(),
      parsedContentID: a.id().required(),
      approvedCount: a.integer(),
      message: a.string(),
    }),

    GenerateEmbeddingsResult: a.customType({
      success: a.boolean().required(),
      fileID: a.id().required(),
      documentID: a.id(),
      embeddingCount: a.integer(),
      message: a.string(),
    }),

    // ========================================================================
    // REGISTERED CUSTOM TYPES (defined above, referenced via a.ref())
    // ========================================================================
    LevelThreshold,
    BadgeConfig,
    CustomBadgeDefinition,
    SectionGamificationConfig,
    BadgeEntry,
    ModuleProgressEntry,
    PersonalBestEntry,
    SkillProgressEntry,
    UnitMemoryEntry,
    SquadMember,
    SquadPostEntry,
    ChallengeContribution,
    CosmeticRewardEntry,
    SquadRecapEntry,
    EasterEggDiscoveryEntry,
    EasterEggProfileEntry,
    VocabularyEntry,
    SummaryEntry,
    CourseOutlineEntry,
    ObjectiveEntry,
    ConceptEntry,
    QuestionEntry,
    PendingMediaEntry,
    SourcesEnabled,
    CoverageSnapshot,
    BlockBreakdown,
    ResumeState,
    CurveSettings,
    CommentReply,
    JobError,
    ConceptStrength,
    ConfusionPair,
    GradeStats,
    TimeStats,
    ReportCard,
    CdnCookies,

    // ========================================================================
    // CORE MODELS
    // ========================================================================

    Unit: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        identityId: a.string(),
        number: a.float(),
        name: a.string(),
        description: a.string(),
        // S3-backed content versioning (content stored in S3, not DynamoDB)
        contentVersion: a.integer(),
        publishedContentVersion: a.integer(),
        status: PublishedStatus,
        timeLimitSeconds: a.integer(),
        retryEnabled: a.boolean(),
        // Relationships
        assignments: a.hasMany("Assignment", ["unitID"]),
        grades: a.hasMany("Grade", ["unitID"]),
        unitFiles: a.hasMany("UnitFile", ["unitID"]),
        unitWords: a.hasMany("UnitWord", ["unitID"]),
        questionUnits: a.hasMany("QuestionUnit", ["unitID"]),
        unitDocuments: a.hasMany("UnitDocument", ["unitID"]),
        agentJobs: a.hasMany("AgentJob", ["unitID"]),
        collaborators: a.hasMany("CollaboratorAccess", ["unitID"]),
        // Dynamic group authorization - students and instructors can read
        // Format: ['section-{sectionId}-instructors', 'section-{sectionId}-learners']
        readableGroups: a.string().array(),
        // Dynamic group authorization - only instructors can update
        // Format: ['section-{sectionId}-instructors']
        writableGroups: a.string().array(),
        // Metadata
        featuredImage: a.string(),
        featuredVideo: a.string(),
        thumbnail: a.string(),
        embedding: EmbeddingInfo,
        moderation: ModerationInfo,
        publishedAt: a.timestamp(),
        isDraft: a.boolean(),
        // AI-generated summary of unit content (headings + key points)
        // Written on publish by publishUnit Lambda; used for course outline context
        summary: a.string(),
        // Content gating (absorbed from ContentLock model)
        requiredXP: a.integer(),
        requiredBadgeId: a.string(),
        requiredModuleCompletion: a.float(),
        // Soft delete
        deletedAt: a.datetime(),
        deletedBy: a.string(),
      })
      .authorization((allow) => [
        // Owners (creators - typically Instructors) have full control
        allow.owner(),
        // Admins have full access
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        // Instructors can create new units
        allow.group("Instructors").to(["create"]),
        // Learners can read all units (for published/assigned content)
        allow.group("Learners").to(["read"]),
        // Note: readableGroups/writableGroups used for client-side filtering
        // Cannot use allow.groupsDefinedIn() - it generates invalid containsAny subscription filters
      ]),

    Assignment: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        dueDate: a.datetime(),
        unlockDate: a.datetime(),
        status: PublishedStatus,
        // Foreign keys for relationships
        sectionID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unitID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        section: a.belongsTo("Section", ["sectionID"]),
        unit: a.belongsTo("Unit", ["unitID"]),
        // Dynamic group authorization - students and instructors can read
        // Format: ['section-{sectionId}-instructors', 'section-{sectionId}-learners']
        readableGroups: a.string().array(),
        // Dynamic group authorization - only instructors can update
        // Format: ['section-{sectionId}-instructors']
        writableGroups: a.string().array(),
        // Tracking
        learner: a.string(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
      })
      .authorization((allow) => [
        // Student owns their assignment
        allow.owner(),
        // Admins have full access
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        // Instructors and Learners have access based on section membership
        allow.group("Instructors"),
        allow.group("Learners").to(["read"]),
        // Note: readableGroups/writableGroups used for client-side filtering
        // Cannot use allow.groupsDefinedIn() - it generates invalid containsAny subscription filters
      ]),

    Grade: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        // Completion tracking
        percentComplete: a.float(),
        accuracy: a.float(),
        timerStarted: a.boolean(),
        complete: a.boolean(),
        // Submission data
        data: a.json(), // JSON object keyed by block IDs with { complete, accuracy, userAnswer, feedback }
        feedback: a.json(), // Generated feedback by block
        files: a.string().array(), // Submitted file paths
        // Engaged time — accumulated ms of active interaction (visible + focused + not idle)
        engagedTimeMs: a.integer(),
        unitVersion: a.integer(),
        // Peer review
        reviewRoomId: a.id(),
        aiReviewSummary: a.string(),
        nailedItCount: a.integer(),
        // Dynamic group auth for peer review — Cognito group name like 'review-{roomId}-peers'
        peerReviewGroup: a.string(),
        // Practice drill link — null for workbook grades
        practiceSessionID: a.id(),
        attempt: a.integer(),
        // Foreign keys
        unitID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unit: a.belongsTo("Unit", ["unitID"]),
        sectionID: a.id(), // Section this grade is for (for section-based authorization)
        // Dynamic group authorization - single instructor group that can grade this submission
        // Format: 'section-{sectionId}-instructors'
        instructorGroup: a.string(),
        instructor: a.string(),
        // Metadata
        identityId: a.string(),
        moderation: ModerationInfo,
      })
      .secondaryIndexes((index) => [
        index("practiceSessionID").name("byPracticeSession"),
        index("sectionID").name("bySectionID"),
      ])
      .authorization((allow) => [
        // Student owns their grade
        allow.owner(),
        // Admins have full access
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        // Dynamic group authorization: only instructors of the section can read/update
        // Single group with access to this grade
        allow.groupDefinedIn("instructorGroup").to(["read", "update"]),
        // Dynamic group authorization: peers invited to review can read
        allow.groupDefinedIn("peerReviewGroup").to(["read"]),
      ]),

    Section: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        name: a.string(),
        description: a.string(),
        status: PublishedStatus,
        code: a.string(),
        instructor: a.string(), // User ID of instructor
        // Relationships
        assignments: a.hasMany("Assignment", ["sectionID"]),
        // Dynamic group authorization - students and instructors can read
        // Format: ['section-{sectionId}-instructors', 'section-{sectionId}-learners']
        readableGroups: a.string().array(),
        // Dynamic group authorization - only instructors can update
        // Format: ['section-{sectionId}-instructors']
        writableGroups: a.string().array(),
        // Metadata
        featuredImage: a.string(),
        featuredVideo: a.string(),
        thumbnail: a.string(),
        backgroundColor: a.string(),
        embedding: EmbeddingInfo,
        learner: a.string(), // For student access
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        identityId: a.string(),
        // Gradebook curve settings — per-assignment
        curveSettings: a.ref("CurveSettings").array(),
        // Instructor grade overrides — per-student per-unit
        gradeOverrides: a.json(), // { [studentId]: { [unitID]: { score: number, updatedAt: string } } }
        // Leaderboard
        leaderboardEnabled: a.boolean(), // Instructor toggle — show leaderboard for this section
        leaderboardRebuiltAt: a.datetime(), // Timestamp of last successful leaderboard rebuild (debounce)
        leaderboardUpdateInProgressAt: a.datetime(), // Lock timestamp — prevents concurrent rebuilds; ignored after staleness threshold
        // Linear progression — lock units in due-date order until prior is completed
        linearLockEnabled: a.boolean(),
        // XP tuner — per-section overrides for XP multipliers and caps
        // { multipliers?: Record<XPReason, number>, dailyCap?: number, weeklyCap?: number, enabled?: boolean }
        xpConfig: a.json(),
        // Badge toggles — per-section control over badge awarding
        badgesEnabled: a.boolean(), // Instructor toggle — enable/disable all badge awarding for this section (default: true)
        antiBadgesEnabled: a.boolean(), // Instructor toggle — enable/disable anti-badge awarding specifically (default: true)
        // Per-section gamification feature config (typed)
        gamificationConfig: a.ref("SectionGamificationConfig"),
        // AI-generated course outline — rolled up from published unit summaries
        // Ordered by unit number; rebuilt on each unit publish
        courseOutline: a.ref("CourseOutlineEntry").array(),
        // Per-section AI configuration overrides — JSON shape:
        // { kaiEnabled?, sageEnabled?, kaiModel?, sageModel?, kaiTemperature?, sageTemperature?,
        //   kaiMaxTokens?, sageMaxTokens?, kaiMaxSteps?, sageMaxSteps?,
        //   kaiSystemPromptAppend?, sageSystemPromptAppend?, searchThreshold?, memoryEnabled? }
        aiConfig: a.json(),
        // Soft delete
        deletedAt: a.datetime(),
        deletedBy: a.string(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.group("Instructors"),
        allow.group("Learners").to(["read"]),
        allow.authenticated().to(["read"]), // Allow authenticated users to find sections by code
        // Note: readableGroups/writableGroups used for client-side filtering
        // Cannot use allow.groupsDefinedIn() - it generates invalid containsAny subscription filters
      ]),

    // ========================================================================
    // CONTENT MODELS
    // ========================================================================

    Question: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        identityId: a.string(),
        // Question content
        prompt: a.string(),
        answer: a.string(),
        hint: a.string(),
        choices: a.json(), // Array of Choice objects
        // Audio/media
        audio: a.string().array(),
        answerAudio: a.string().array(),
        // Generation metadata
        generated: a.boolean(),
        model: a.string(),
        promptHex: a.string(),
        byPromptHex: a.string(),
        // Visual
        thumbnail: a.string(),
        difficulty: a.string(),
        metadata: a.string(),
        importedAt: a.datetime(),
        // Embeddings
        embedding: EmbeddingInfo,
        // Moderation
        moderation: ModerationInfo,
        // Relationships
        questionUnits: a.hasMany("QuestionUnit", ["questionID"]),
        questionWords: a.hasMany("QuestionWord", ["questionID"]),
        questionFiles: a.hasMany("QuestionFile", ["questionID"]),
        documentQuestions: a.hasMany("DocumentQuestion", ["questionID"]),
        // Yjs CRDT snapshot for conflict-free collaborative editing
        yjsSnapshot: a.string(), // Base64-encoded Y.Doc state
        // Soft delete
        deletedAt: a.datetime(),
        deletedBy: a.string(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Learners").to(["read"]),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    /**
     * File Model - Associates S3 storage with database records for file metadata tracking
     *
     * Stores metadata for files uploaded to Storage, enabling:
     * - File ownership and protection level tracking
     * - Associations with Units, Words, Questions, Documents
     * - Embedding and moderation metadata
     *
     * Integration with Storage:
     * - path field points to S3 location (e.g., "public/units/file-123.json")
     * - level field (PUBLIC/PROTECTED/PRIVATE) determines S3 access pattern
     * - owner field auto-populated by Cognito at creation
     *
     * Owner Authorization Pattern:
     * - File owner can create/read/update/delete their files
     * - Learners group can read all files (for embedded content access)
     * - Admins have full access
     * - Storage layer enforces identity-based path access (protected/{identityId}/*)
     *
     * Frontend workflow:
     * 1. Upload to Storage: uploadData({ path: `public/file-${id}.ext`, data })
     * 2. Create File record: client.models.File.create({ path, owner, level, ... })
     * 3. Get signed URL: getUrl({ path: file.path })
     * 4. Associate: Create join record (UnitFile, WordFile, etc.)
     */ File: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership - auto-populated by Cognito, controls Data model access
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Instructors").to(["create", "read"]),
            allow.group("Learners").to(["read"]),
            allow.group("Admins").to(["create", "read", "delete"]),
          ]),
        identityId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]), // Cognito Identity ID for protected/{identityId}/* paths
        // File metadata
        name: a.string(),
        description: a.string(),
        // Generation metadata - if generated by AI
        prompt: a.string(),
        model: a.string(),
        variant: a.string(),
        // File details
        mimeType: a.string(),
        level: FileProtectionLevels, // PUBLIC, PROTECTED, PRIVATE - determines S3 path prefix
        path: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]), // Full S3 path (e.g., "public/units/file-123.json"),
        size: a.integer(),
        duration: a.integer(),
        generated: a.boolean(),
        hex: a.string(),
        byHex: a.string(),
        thumbnail: a.string(),
        // Relationships - enable querying files by associated model
        documentID: a.id(),
        document: a.belongsTo("Document", ["documentID"]),
        unitFiles: a.hasMany("UnitFile", ["fileID"]),
        wordFiles: a.hasMany("WordFile", ["fileID"]),
        questionFiles: a.hasMany("QuestionFile", ["fileID"]),
        chatFiles: a.hasMany("AssistantChatFile", ["fileID"]),
        parsedContent: a.hasMany("ParsedContent", ["fileID"]),
        // Metadata for semantic search
        embedding: EmbeddingInfo,
        // Yjs CRDT snapshot for conflict-free file metadata management
        yjsSnapshot: a.string(), // Base64-encoded Y.Doc state
        // HLS transcoding — populated by MediaConvert pipeline
        hlsUrl: a.string(), // S3 path to .m3u8 manifest (e.g. protected/{identityId}/{fileId}/{fileId}.m3u8)
        transcodeStatus: a.string(), // PENDING | PROCESSING | COMPLETE | ERROR
        mediaConvertJobId: a.string(), // AWS MediaConvert job ID for tracking
        // Per-file settings (e.g. audioCleanupStrength override from RecordingStudio3)
        settings: a.json(),
        // Soft delete
        deletedAt: a.datetime(),
        deletedBy: a.string(),
      })
      .authorization((allow) => [
        // Owner has full control
        allow.owner(),
        // Instructors can create and manage files
        allow.group("Instructors"),
        // Learners can read files (for embedded content, shared resources)
        allow.group("Learners").to(["read"]),
        // Admins have full access
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        // Note: Lambda function access (openai, documentAnalysis, embeddings, mediaConvert)
        // is granted via schema-level .authorization() - see bottom of schema definition
      ]),

    Word: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        identityId: a.string(),
        // Content
        phrase: a.string(),
        pronunciation: a.string(),
        definition: a.string(),
        rubyTags: a.string(),
        // Audio
        audio: a.string().array(),
        definitionAudio: a.string().array(),
        // Metadata
        importedAt: a.datetime(),
        // Embeddings
        embedding: EmbeddingInfo,
        // Moderation
        moderation: ModerationInfo,
        // Relationships
        unitWords: a.hasMany("UnitWord", ["wordID"]),
        wordFiles: a.hasMany("WordFile", ["wordID"]),
        questionWords: a.hasMany("QuestionWord", ["wordID"]),
        documentWords: a.hasMany("DocumentWord", ["wordID"]),
        // Yjs CRDT snapshot for conflict-free collaborative editing
        yjsSnapshot: a.string(), // Base64-encoded Y.Doc state
        // Soft delete
        deletedAt: a.datetime(),
        deletedBy: a.string(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Learners").to(["read"]),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    // ========================================================================
    // JOIN TABLES (Explicit Many-to-Many)
    // ========================================================================

    UnitFile: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unitID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unit: a.belongsTo("Unit", ["unitID"]),
        fileID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        file: a.belongsTo("File", ["fileID"]),
        deletedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    UnitWord: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unitID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unit: a.belongsTo("Unit", ["unitID"]),
        wordID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        word: a.belongsTo("Word", ["wordID"]),
        deletedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    QuestionUnit: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        questionID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        question: a.belongsTo("Question", ["questionID"]),
        unitID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unit: a.belongsTo("Unit", ["unitID"]),
        deletedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    UnitDocument: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unitID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unit: a.belongsTo("Unit", ["unitID"]),
        documentID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        document: a.belongsTo("Document", ["documentID"]),
        deletedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    QuestionFile: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        questionID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        question: a.belongsTo("Question", ["questionID"]),
        fileID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        file: a.belongsTo("File", ["fileID"]),
        deletedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    WordFile: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        wordID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        word: a.belongsTo("Word", ["wordID"]),
        fileID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        file: a.belongsTo("File", ["fileID"]),
        deletedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    QuestionWord: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        questionID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        question: a.belongsTo("Question", ["questionID"]),
        wordID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        word: a.belongsTo("Word", ["wordID"]),
        deletedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    DocumentWord: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        documentID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        document: a.belongsTo("Document", ["documentID"]),
        wordID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        word: a.belongsTo("Word", ["wordID"]),
        deletedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    DocumentQuestion: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        documentID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        document: a.belongsTo("Document", ["documentID"]),
        questionID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        question: a.belongsTo("Question", ["questionID"]),
        deletedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    AssistantChatFile: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        chatID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        chat: a.belongsTo("AssistantChat", ["chatID"]),
        fileID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        file: a.belongsTo("File", ["fileID"]),
        deletedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    // ========================================================================
    // COLLABORATION MODELS
    // ========================================================================

    /**
     * CollaboratorAccess - Grants instructor-to-instructor visibility on units
     *
     * Owner of the unit can share with other instructors at "read" or "edit" level.
     * Collaborators discover shared units by querying their own collaboratorId.
     */
    CollaboratorAccess: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // The unit being shared
        unitID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unit: a.belongsTo("Unit", ["unitID"]),
        // The instructor being granted access
        collaboratorId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        // Who granted the access
        grantedBy: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        // Permission level
        permission: CollaboratorPermission,
        // Metadata
        grantedAt: a.datetime(),
        // Owner = the unit owner (for auth purposes)
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.authenticated().to(["read"]),
      ]),

    // ========================================================================
    // ANALYSIS MODELS
    // ========================================================================

    /**
     * Document Model - Tracks PDF/document analysis processing pipeline
     *
     * Lifecycle:
     * 1. User uploads PDF → File record created, Document created (status: 'uploaded')
     * 2. Lambda triggered → Text extraction (status: 'extracting' → 'extracted')
     * 3. Lambda sends to OpenAI → Analysis (status: 'analyzing')
     * 4. Results saved → ParsedContent records with vocabulary, questions, summaries (status: 'completed')
     * 5. On error → status: 'failed', resumeState cleared
     *
     * Async Processing:
     * - Initial request returns immediately with status 'uploaded'
     * - Lambda invokes itself asynchronously with isAsyncInvocation: true
     * - Lambda handles timeouts via resumeState for large PDFs
     * - Client polls Document.status or subscribes via subscription
     *
     * Owner Authorization:
     * - Document owner (student uploading) can read/update/delete their documents
     * - Learners can read all documents (collaborative learning)
     * - Admins have full access
     */ Document: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership - auto-populated by Cognito, tracks document creator
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        identityId: a.string(),
        learner: a.string(), // Alternate learner reference
        // Section context - for section-based authorization
        sectionID: a.id(), // Section this document is associated with (optional for backwards compatibility)
        // Dynamic group authorization - contains group names with read access to this document
        // Format: ['section-{sectionId}-instructors', 'section-{sectionId}-learners']
        readableGroups: a.string().array(),
        // Dynamic group authorization - contains group names with write access to this document
        // Format: ['section-{sectionId}-instructors']
        writableGroups: a.string().array(),
        // Document metadata
        filename: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        s3Key: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        status: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]), // uploaded, extracting, extracted, analyzing, completed, failed, cancelled
        // Content (full text stored in S3: private/{identityId}/documents/{id}/extracted-text.txt)
        textExtractedAt: a.timestamp(), // Signals text is available in S3
        pageCount: a.integer(),
        fileSize: a.integer(),
        mimeType: a.string(),
        sourceFormat: a.string(), // Detected format: pdf, txt, md, csv, doc, docx, xls, xlsx, ppt, pptx, odt, ods, odp, scorm-1.2, scorm-2004, imscc-1.1, imscc-1.2, imscc-1.3, imscp-1.2, qti-2.1, qti-3.0, epub-2, epub-3, gift
        uploadedAt: a.datetime(),
        // Processing State - for resuming long-running operations on timeout
        resumeState: a.ref("ResumeState"),
        // Note: pageEmbeddings kept in separate ParsedContent table to avoid item size limits
        // Relationships
        files: a.hasMany("File", ["documentID"]), // Metadata records for uploaded files
        parsedContent: a.hasMany("ParsedContent", ["documentID"]), // Extracted vocabulary, questions, summaries
        agentJobs: a.hasMany("AgentJob", ["documentID"]), // Track OpenAI API calls and costs
        unitDocuments: a.hasMany("UnitDocument", ["documentID"]), // Associate documents with curriculum units
        documentWords: a.hasMany("DocumentWord", ["documentID"]), // Extracted vocabulary from document
        documentQuestions: a.hasMany("DocumentQuestion", ["documentID"]), // Generated comprehension questions
        // Metadata
        metadata: a.json(),
        // Yjs CRDT snapshot for conflict-free document status management
        yjsSnapshot: a.string(), // Base64-encoded Y.Doc state
        // Soft delete
        deletedAt: a.datetime(),
        deletedBy: a.string(),
      })
      .authorization((allow) => [
        // Document owner (student) can manage their documents
        allow.owner(),
        // Admins have full access
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        // Instructors can create and manage documents
        allow.group("Instructors"),
        // Learners can read documents (section-based access controlled by Lambda/client-side)
        allow.group("Learners").to(["read"]),
        // Note: Lambda function access (documentAnalysis, embeddings)
        // is granted via schema-level .authorization() - see bottom of schema definition
        // Note: readableGroups/writableGroups used for client-side filtering
        // Cannot use allow.groupsDefinedIn() - it generates invalid containsAny subscription filters
      ]),

    ParsedContent: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        identityId: a.string(),
        // Foreign keys
        documentID: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        document: a.belongsTo("Document", ["documentID"]),
        fileID: a.id(),
        file: a.belongsTo("File", ["fileID"]),
        // Note: This model is referenced by File via parsedContentID for one-to-one relationship
        // Extracted content (as JSON for flexibility)
        vocabularyJSON: a.ref("VocabularyEntry").array(),
        summariesJSON: a.ref("SummaryEntry").array(),
        objectivesJSON: a.ref("ObjectiveEntry").array(),
        conceptsJSON: a.ref("ConceptEntry").array(),
        questionsJSON: a.ref("QuestionEntry").array(),
        pendingMediaJSON: a.ref("PendingMediaEntry").array(),
        // API tracking
        responseId: a.string(), // OpenAI response ID
        modelUsed: a.string(),
        tokensUsed: a.integer(),
        processingTime: a.integer(),
        // Timestamps (createdAt/updatedAt auto-generated)
        importedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Learners").to(["read"]),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        // Note: Lambda function access (documentAnalysis, embeddings)
        // is granted via schema-level .authorization() - see bottom of schema definition
      ]),

    AgentJob: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        // Job tracking
        type: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]), // pdf_analysis, exercise_generation, vocabulary_extraction
        status: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]), // queued, processing, completed, failed, cancelled
        // Foreign keys
        documentID: a.id(),
        document: a.belongsTo("Document", ["documentID"]),
        unitID: a.id(),
        unit: a.belongsTo("Unit", ["unitID"]),
        // API tracking
        responseId: a.string(),
        webhookData: a.json(),
        error: a.ref("JobError"),
        // Processing details
        startedAt: a.datetime(),
        completedAt: a.datetime(),
        modelUsed: a.string(),
        tokensUsed: a.integer(),
        estimatedCost: a.float(),
        retryCount: a.integer(),
        metadata: a.json(),
        identityId: a.string(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Learners").to(["read"]),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.authenticated(),
      ]),

    // ========================================================================
    // CHAT & ASSISTANT MODELS
    // ========================================================================

    AssistantChat: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        // Record type: "chat" (default) or "memory" (aggregated conversation memory)
        type: a.enum(["chat", "memory"]),
        // Scoping — which unit/section this chat or memory belongs to
        unitID: a.id(),
        sectionID: a.id(),
        // Assistant configuration
        model: a.string(),
        threadInstructions: a.string(),
        additionalInstructions: a.string(),
        threadId: a.string(), // OpenAI thread ID
        moderationFlag: a.boolean(),
        // Chat session (type=chat)
        messages: a.json(), // Chat messages as JSON array
        draft: a.string(), // Current draft message
        archived: a.boolean(),
        // Usage tracking (legacy string fields kept for backward compat)
        inputTokens: a.string(),
        outputTokens: a.string(),
        // Token usage tracking (actual values from LLM responses)
        totalPromptTokens: a.integer(), // Cumulative prompt tokens for this chat
        totalCompletionTokens: a.integer(), // Cumulative completion tokens
        totalTokens: a.integer(), // Cumulative total tokens (prompt + completion)
        turnCount: a.integer(), // Number of chat turns (for averaging)
        lastTurnPromptTokens: a.integer(), // Most recent turn prompt tokens
        lastTurnCompletionTokens: a.integer(), // Most recent turn completion tokens
        // Memory fields (type=memory) — rolling conversation summaries & insights
        summary: a.string(), // Rolling summary of recent conversations
        insights: a.json(), // [{topic, insight, confidence, updatedAt}]
        topicsDiscussed: a.json(), // [{topic, lastDiscussedAt, depth, wasResolved}]
        // Embedding for semantic memory recall
        embedding: a.string(), // JSON-encoded 384d vector
        embeddingModel: a.string(), // e.g. "Xenova/all-MiniLM-L6-v2"
        embeddingDimensions: a.integer(), // e.g. 384
        // Relationships
        chatFiles: a.hasMany("AssistantChatFile", ["chatID"]),
        // Soft delete
        deletedAt: a.datetime(),
        deletedBy: a.string(),
      })
      .secondaryIndexes((index) => [
        index("unitID").sortKeys(["type"]).name("byUnit"),
      ])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    // ========================================================================
    // USER & SETTINGS MODELS
    // ========================================================================

    Settings: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        identityId: a.string(),
        // Document analysis
        autoAnalyzeDocuments: a.boolean(),
        documentAnalysisModel: a.string(),
        // Editor
        editorTheme: a.string(),
        editorFontSize: a.integer(),
        // AI assistant
        defaultAIModel: a.string(),
        assistantVoice: a.string(),
        // Notifications
        emailNotifications: a.boolean(),
        webhookNotifications: a.boolean(),
        // Localization
        language: a.string(),
        timezone: a.string(),
        // Profile
        displayName: a.string(),
        // Profile visibility — what others see on your profile page
        showBadgesOnProfile: a.boolean(), // Show earned badges on profile (default: true)
        showAntiBadgesOnProfile: a.boolean(), // Show anti-badges on profile (default: false)
        profileThemeId: a.string(), // Cosmetic theme applied to profile page (from CosmeticSelector)
        customThemePalette: a.json(), // User-mixed custom theme colors (when profileThemeId is 'custom')
        // Leaderboard & gamification
        leaderboardOptIn: a.boolean(), // Student opt-in for overall leaderboard
        // Recording settings
        audioCleanupStrength: a.string(), // 'off' | 'light' | 'standard' | 'aggressive' (default: 'standard')
        metadata: a.json(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.authenticated(),
      ]),

    Notification: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        recipientId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.authenticated().to(["read"]),
            allow.group("Admins").to(["create", "read", "delete"]),
          ]),
        type: NotificationType,
        category: NotificationCategory,
        title: a
          .string()
          .required()
          .authorization((allow) => [
            allow.authenticated().to(["read"]),
            allow.group("Admins").to(["create", "read"]),
          ]),
        body: a.string(),
        linkPath: a.string(),
        linkLabel: a.string(),
        referenceId: a.string(),
        referenceType: a.string(),
        senderName: a.string(),
        seen: a.boolean().default(false),
        interacted: a.boolean().default(false),
        expiresAt: a.datetime(),
        metadata: a.json(),
      })
      .secondaryIndexes((index) => [
        index("recipientId").name("byRecipient"),
        index("type").name("byType"),
      ])
      .authorization((allow) => [
        allow.ownerDefinedIn("recipientId"),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
      ]),

    AIFeedback: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        identityId: a.string(),
        // Content type
        contentType: AiContentType,
        feedbackType: AiFeedbackType,
        reasons: AiFeedbackReason,
        comment: a.string(),
        // AI metadata
        model: a.string(),
        prompt: a.string(),
        generatedContent: a.string(),
        // Context
        unitID: a.id(),
        gradeID: a.id(),
        documentID: a.id(),
        messageId: a.string(),
        sessionId: a.string(),
        metadata: a.json(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.authenticated(),
      ]),

    // ========================================================================
    // GAMIFICATION, PEER REVIEW & AI MEMORY MODELS
    // ========================================================================

    WorkbookComment: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        gradeId: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        blockId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        threadId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        content: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        resolved: a.boolean(),
        replies: a.ref("CommentReply").array(),
      })
      .secondaryIndexes((index) => [
        index("gradeId").sortKeys(["blockId"]).name("byGradeBlock"),
      ])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.group("Instructors"),
      ]),

    HomeworkRoom: a
      .model({
        _version: a
          .integer()
          .authorization((allow) => [
            allow.owner().to(["read"]),
            allow.group("Admins").to(["read"]),
            allow.group("Instructors").to(["read"]),
            allow.groupDefinedIn("peerGroup").to(["read"]),
          ]),
        _lastChangedAt: a
          .timestamp()
          .authorization((allow) => [
            allow.owner().to(["read"]),
            allow.group("Admins").to(["read"]),
            allow.group("Instructors").to(["read"]),
            allow.groupDefinedIn("peerGroup").to(["read"]),
          ]),
        _deleted: a
          .boolean()
          .authorization((allow) => [
            allow.owner().to(["read"]),
            allow.group("Admins").to(["read"]),
            allow.group("Instructors").to(["read"]),
            allow.groupDefinedIn("peerGroup").to(["read"]),
          ]),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        gradeId: a
          .id()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        ownerId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        sectionID: a.id(), // Section this room belongs to (for same-section validation)
        status: a.enum(["OPEN", "IN_REVIEW", "REVIEW_COMPLETE"]),
        code: a.string(), // Short join code for self-join (like Section.code)
        invitedUserIds: a.string().array(),
        messages: a.json(),
        aiReviewSummary: a.string(),
        closedAt: a.datetime(),
        // Dynamic group auth — Cognito group name like 'review-{roomId}-peers'
        peerGroup: a.string(),
      })
      .secondaryIndexes((index) => [
        index("gradeId").name("byGrade"),
        index("ownerId").name("byOwner"),
        index("code").name("byCode"),
      ])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.group("Instructors").to(["read"]),
        // Invited peers can read the room
        allow.groupDefinedIn("peerGroup").to(["read"]),
      ]),

    StudentXPLog: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        studentId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        xpAmount: a
          .integer()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        accuracy: a.float(),
        reason: a.enum([
          "HOMEWORK_SUBMITTED",
          "AI_FEEDBACK_REVISED",
          "ALL_BLOCKS_COMPLETED",
          "PEER_REVIEW_GIVEN",
          "PEER_REVIEW_HOSTED",
          "NAILED_IT",
          "ON_TIME_SUBMISSION",
          "STREAK_3DAY",
          "STREAK_7DAY",
          "STREAK_14DAY",
          "STREAK_30DAY",
          "PERFECT_SCORE",
          "COMEBACK",
          "PERSONAL_BEST",
          "EASTER_EGG",
          "SQUAD_CHALLENGE_BONUS",
          "PRACTICE_DRILL_COMPLETED",
          "PRACTICE_DRILL_ACCURACY_BONUS",
        ]),
        referenceId: a.string(),
        cohortId: a.string(),
        unitID: a.string(),
      })
      .secondaryIndexes((index) => [
        index("studentId").name("byStudent"),
        index("cohortId").name("byCohort"),
      ])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.authenticated().to(["read"]),
      ]),

    // Aggregate student gamification profile (absorbs 7 models)
    StudentProfile: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        studentId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        cohortId: a.string(),
        studentName: a.string(),
        // XP & Level (computed from StudentXPLog by Lambda)
        totalXP: a.integer().default(0),
        level: a.integer().default(1),
        // Streak (was StudentStreak)
        currentStreak: a.integer().default(0),
        longestStreak: a.integer().default(0),
        lastActivityDate: a.date(),
        freezesRemaining: a.integer().default(0),
        freezesUsed: a.integer().default(0),
        // Badges (was StudentBadge)
        badges: a.ref("BadgeEntry").array(),
        // Module progress (was StudentProgress)
        moduleProgress: a.ref("ModuleProgressEntry").array(),
        // Personal bests (was StudentPersonalBest)
        personalBests: a.ref("PersonalBestEntry").array(),
        // Skill progress (was StudentSkillProgress)
        skillProgress: a.ref("SkillProgressEntry").array(),
        // Unit memory summaries (was StudentUnitMemory)
        unitMemories: a.ref("UnitMemoryEntry").array(),
        // Leaderboard fields (was LeaderboardEntry)
        completedAssignments: a.integer(),
        onTimeSubmissions: a.integer().default(0),
        nailedItCount: a.integer(),
        lastUpdated: a.datetime(),
        // Rollup counters — maintained by XP stream handler, eliminates log scans
        reasonCounts: a.json(), // { "PERFECT_SCORE": 5, "NAILED_IT": 12, ... }
        totalSubmissions: a.integer().default(0),
        maxFailedAttemptsOnSingleRef: a.integer().default(0),
        recentSubmissionTimestamps: a.json(), // last 5 HOMEWORK_SUBMITTED timestamps
        activeDaysCount: a.integer().default(0),
        // Cosmetic penalty (boss battle consequence)
        cosmeticPenalty: a.json(),
        // Earned cosmetic rewards (rings, titles, borders, styles, themes)
        cosmeticRewards: a.ref("CosmeticRewardEntry").array(),
        // Active debuffs from anti-badges (JSON array with expiry timestamps)
        activeDebuffs: a.json(),
        // Easter eggs discovered by this student
        easterEggs: a.ref("EasterEggProfileEntry").array(),
        // Report card — rollup of grade accuracy and engaged time stats
        reportCard: a.ref("ReportCard"),
        // Denormalized avatar config — synced from Settings.metadata on save & rebuild
        avatarStyle: a.string(),
        avatarOverrides: a.json(),
        avatarSeed: a.string(),
      })
      .secondaryIndexes((index) => [
        index("studentId").name("byStudent"),
        index("cohortId").name("byCohort"),
      ])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.authenticated().to(["read"]),
      ]),

    // Global platform settings — admin-only singleton for all platform-wide configuration
    PlatformSettings: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // === Gamification Feature Defaults ===
        // These are the system-wide defaults. Teachers can override per section.
        xpEnabled: a.boolean().default(true), // Master XP toggle
        badgesEnabled: a.boolean().default(true),
        antiBadgesEnabled: a.boolean().default(true),
        leaderboardEnabled: a.boolean().default(true),
        leaderboardAnonymous: a.boolean().default(false),
        streaksEnabled: a.boolean().default(true),
        easterEggsEnabled: a.boolean().default(true),
        groupChallengesEnabled: a.boolean().default(true),
        squadsEnabled: a.boolean().default(true),
        skillTreesEnabled: a.boolean().default(true),
        collaborativePracticeEnabled: a.boolean().default(true),
        cosmeticsEnabled: a.boolean().default(true),
        contentLocksEnabled: a.boolean().default(true),
        // === Gamification Tuning ===
        // Leveling curve — ordered thresholds defining XP needed per level
        levelThresholds: a.ref("LevelThreshold").array(),
        // XP multipliers per reason (overrides global defaults)
        xpMultipliers: a.json(), // { "PERFECT_SCORE": 1.5, "NAILED_IT": 2.0, ... }
        // XP caps
        dailyCap: a.integer(),
        weeklyCap: a.integer(),
        // Badge toggles — which badge/anti-badge types are active
        badgeConfigs: a.ref("BadgeConfig").array(),
        // Streak settings
        streakFreezesAllowed: a.integer().default(3),
        // Custom badge definitions (admin-created badges)
        customBadges: a.ref("CustomBadgeDefinition").array(),
        // Avatar unlock schedule — JSON: { unlocks: [{minLevel, tier}], glowOnLevelUp?, featureUnlockLevels? }
        avatarUnlockConfig: a.json(),
        // === AI & Document Analysis ===
        autoAnalyzeDocuments: a.boolean().default(true),
        documentAnalysisModel: a.string(), // e.g. "gpt-4", "gpt-4o"
        defaultAIModel: a.string().default("gpt-4o-mini"), // default model for chat/assistant
        // === Bot Personas ===
        kaiEnabled: a.boolean().default(true), // Student tutor bot
        sageEnabled: a.boolean().default(true), // Instructor assistant bot
        kaiModel: a.string(), // Model override for Kai (defaults to defaultAIModel)
        sageModel: a.string(), // Model override for Sage
        kaiSystemPromptOverride: a.string(), // Custom system prompt (replaces default)
        sageSystemPromptOverride: a.string(), // Custom system prompt (replaces default)
        // === Agent Behavior Tuning ===
        agentMaxSteps: a.integer(), // Max tool-calling rounds per turn (default: 5)
        kaiTemperature: a.float(), // Temperature override for Kai (default: 0.7)
        kaiMaxTokens: a.integer(), // Max output tokens for Kai (default: 2000)
        kaiMaxSteps: a.integer(), // Max agent steps for Kai
        sageTemperature: a.float(), // Temperature override for Sage (default: 0.7)
        sageMaxTokens: a.integer(), // Max output tokens for Sage (default: 4000)
        sageMaxSteps: a.integer(), // Max agent steps for Sage
        // === Search Tuning ===
        searchThreshold: a.float(), // Min cosine similarity (default: 0.3)
        searchDefaultLimit: a.integer(), // Default result count (default: 5)
        // === Memory ===
        memoryEnabled: a.boolean().default(true), // Enable conversation memory
        memorySummarizationModel: a.string(), // Model for summarization (default: gpt-4o-mini)
        // === Token Budgets ===
        systemPromptBudget: a.integer(), // Max tokens for system prompt (default: 2000)
        toolResultBudget: a.integer(), // Max tokens per tool result (default: 4000)
        totalTurnBudget: a.integer(), // Max total tokens per agent turn (default: 16000)
        kaiSystemPromptBudget: a.integer(), // Per-persona system prompt budget
        sageSystemPromptBudget: a.integer(),
        kaiToolResultBudget: a.integer(), // Per-persona tool result budget
        sageToolResultBudget: a.integer(),
        kaiTotalTurnBudget: a.integer(), // Per-persona total turn budget
        sageTotalTurnBudget: a.integer(),
        enforceTokenBudget: a.boolean(), // Whether to actively enforce totalTurnBudget (default: true)
        // === Ownership ===
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.authenticated().to(["read"]),
      ]),

    // Per-student, per-section progress — enables different XP/level/badges per section
    SectionProgress: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        studentId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        sectionId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        studentName: a.string(),
        // XP & Level (scoped to this section, computed using section's leveling curve)
        totalXP: a.integer().default(0),
        level: a.integer().default(1),
        // Streak (scoped to this section)
        currentStreak: a.integer().default(0),
        longestStreak: a.integer().default(0),
        lastActivityDate: a.date(),
        freezesRemaining: a.integer().default(0),
        freezesUsed: a.integer().default(0),
        // Badges earned in this section
        badges: a.ref("BadgeEntry").array(),
        // Active debuffs from anti-badges
        activeDebuffs: a.json(),
        // Easter eggs discovered in this section
        easterEggs: a.ref("EasterEggProfileEntry").array(),
        // Leaderboard position fields
        completedAssignments: a.integer().default(0),
        onTimeSubmissions: a.integer().default(0),
        nailedItCount: a.integer().default(0),
        lastUpdated: a.datetime(),
        // Rollup counters — maintained by stream handler (same as StudentProfile)
        reasonCounts: a.json(),
        totalSubmissions: a.integer().default(0),
        maxFailedAttemptsOnSingleRef: a.integer().default(0),
        recentSubmissionTimestamps: a.json(),
        activeDaysCount: a.integer().default(0),
        // Module progress within this section
        moduleProgress: a.ref("ModuleProgressEntry").array(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        // Denormalized avatar config — synced from Settings.metadata on save & rebuild
        avatarStyle: a.string(),
        avatarOverrides: a.json(),
        avatarSeed: a.string(),
      })
      .secondaryIndexes((index) => [
        index("studentId").name("byStudent"),
        index("sectionId").name("bySection"),
      ])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.authenticated().to(["read"]),
      ]),

    StudentMemory: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        studentId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unitID: a.string(), // null = global memory, set = per-unit memory
        memoryMarkdown: a.string(),
        structuredProfile: a.json(),
        lastUpdatedBy: a.string(),
        version: a.integer(),
        // Per-unit concept tracking (populated when unitID is set)
        weakConcepts: a.ref("ConceptStrength").array(),
        strongConcepts: a.ref("ConceptStrength").array(),
        confusionPairs: a.ref("ConfusionPair").array(),
        accuracyBySource: a.json(),
        totalAttempts: a.integer().default(0),
        averageAccuracy: a.float(),
        reviewPriority: a.float(),
        lastPracticedAt: a.datetime(),
      })
      .secondaryIndexes((index) => [
        index("studentId").name("byStudent"),
        index("unitID").name("byUnit"),
      ])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.group("Instructors").to(["read"]),
      ]),

    EasterEgg: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        trigger: a.enum(["KEYWORD", "SCHEDULE", "SECRET_LINK", "ACHIEVEMENT"]),
        triggerValue: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        xpReward: a
          .integer()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        badgeId: a.string(),
        revealMessage: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        active: a.boolean().default(true),
        cohortId: a.string(),
        // Embedded discoveries (absorbed from EasterEggDiscovery)
        discoveries: a.ref("EasterEggDiscoveryEntry").array(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.group("Instructors"),
        allow.authenticated().to(["read"]),
      ]),

    Skill: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        title: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        description: a.string(),
        prerequisites: a.json(),
        xpReward: a.integer(),
        cohortId: a.string(),
        unitIds: a.string().array(),
        minimumAccuracy: a.integer().default(70),
      })
      .secondaryIndexes((index) => [index("cohortId").name("byCohort")])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.group("Instructors"),
        allow.authenticated().to(["read"]),
      ]),

    Squad: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        name: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        cohortId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        totalXP: a.integer().default(0),
        description: a.string(),
        // Embedded members (absorbed from SquadMembership)
        members: a.ref("SquadMember").array(),
        // Embedded posts (absorbed from SquadPost)
        posts: a.ref("SquadPostEntry").array(),
        // Squad identity
        crestSvg: a.string(),
        featuredImage: a.string(),
        // Per-challenge recaps (generated at challenge resolution)
        recaps: a.ref("SquadRecapEntry").array(),
      })
      .secondaryIndexes((index) => [index("cohortId").name("byCohort")])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.authenticated().to(["read", "create", "update"]),
      ]),

    GroupChallenge: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        cohortId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        title: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        targetXP: a
          .integer()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        currentXP: a.integer().default(0),
        deadline: a.datetime(),
        active: a.boolean().default(true),
        bonusMultiplier: a.float().default(1.5),
        // Campaign narrative (absorbed from Campaign model)
        setting: a.string(),
        stakes: a.string(),
        systemPromptSeed: a.string(),
        chapterOrder: a.integer(),
        unlockDate: a.datetime(),
        // Image generation
        featuredImage: a.string(),
        bodyImages: a.json(),
        // Resolution / outcome
        outcome: a.string(),
        // Cloning provenance
        clonedFrom: a.id(),
        // Rewards on completion
        rewardXP: a.integer(), // bonus XP awarded to all contributors on victory
        rewardBadge: a.string(), // badge type key to award on victory
        rewardCosmetic: a.string(), // cosmetic item key (title/border/flair)
        unlockContentId: a.id(), // Unit ID to unlock on victory
        // Scoped XP: only XP from these units contributes to this chapter
        linkedUnitIds: a.string().array(),
        // Embedded contributions (absorbed from GroupChallengeContribution)
        contributions: a.ref("ChallengeContribution").array(),
      })
      .secondaryIndexes((index) => [index("cohortId").name("byCohort")])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.group("Instructors"),
        allow.authenticated().to(["read"]),
      ]),

    Badge: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        title: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        description: a.string(),
        icon: a.string(),
        shape: a.enum(["circle", "hexagon", "shield", "diamond"]),
        rarity: a.enum(["common", "uncommon", "rare", "epic", "legendary"]),
        category: a.string(),
        criteria: a.json(),
        cohortId: a.string(),
        autoEvaluate: a.boolean().default(true),
      })
      .secondaryIndexes((index) => [index("cohortId").name("byCohort")])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.group("Instructors"),
        allow.authenticated().to(["read"]),
      ]),

    // ========================================================================
    // SQUAD MESSAGING
    // ========================================================================

    SquadMessage: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        cohortId: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        // Target squads (one or many)
        recipientSquadIds: a
          .string()
          .array()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        // Template with {{SQUAD_NAME}}, {{SQUAD_RIVAL}}, {{SQUAD_XP}} vars
        template: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        // Hydrated per-squad messages [{squadId, squadName, body}]
        resolvedMessages: a.json(),
        sentAt: a.datetime(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
      })
      .secondaryIndexes((index) => [index("cohortId").name("byCohort")])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.group("Instructors"),
        allow.authenticated().to(["read"]),
      ]),

    // ========================================================================
    // PRACTICE DRILL MODELS
    // ========================================================================

    PracticeSession: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        owner: a
          .string()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        unitID: a
          .string()
          .required()
          .authorization((allow) => [
            allow.owner().to(["create", "read", "delete"]),
            allow.group("Admins").to(["create", "read", "delete"]),
            allow.authenticated().to(["read"]),
          ]),
        drillType: PracticeDrillType,
        data: a.json(), // Same format as Grade.data — keyed by generated block IDs
        accuracy: a.float(), // Overall accuracy 0-100
        blockCount: a.integer(), // How many blocks in this drill
        blocksCompleted: a.integer(),
        complete: a.boolean().default(false),
        xpAwarded: a.integer().default(0),
        generatedContent: a.json(), // PracticeDrillBlock[] for replay/review
        sourcesEnabled: a.ref("SourcesEnabled"),
        coverageSnapshot: a.ref("CoverageSnapshot").array(),
        // Collaborative practice
        collaborative: a.boolean().default(false),
        roomCode: a.string(), // Short join code for group sessions
        maxParticipants: a.integer(),
        participantIds: a.json(), // string[] — Cognito subs of participants
        // Instructor insight fields (absorbed from InstructorInsight)
        insightStudentId: a.string(),
        weakAreas: a.string().array(),
        strongAreas: a.string().array(),
        sourcesUsedList: a.string().array(),
        blockBreakdown: a.ref("BlockBreakdown"),
        insightTimestamp: a.datetime(),
      })
      .secondaryIndexes((index) => [
        index("unitID").name("byUnit"),
        index("roomCode").name("byRoomCode"),
      ])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins").to(["read", "create", "update", "delete"]),
        allow.group("Instructors").to(["read"]),
        allow.authenticated().to(["read"]),
      ]),

    // ========================================================================
    // ANALYTICS — daily rollups for admin dashboard
    // ========================================================================

    AnalyticsSummary: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // ─── Dimension keys ───
        date: a.date().required(),
        scope: a.string().required(),
        scopeId: a.string().required(),
        sectionId: a.string(), // Parent section (for unit/squad/section records)
        unitId: a.string(), // Set when scope = "unit"
        squadId: a.string(), // Set when scope = "squad"
        isWorkbook: a.boolean(), // true = workbook content
        isReview: a.boolean(), // true = peer review content
        // ─── Geolocation ───
        country: a.string(), // ISO 3166-1 alpha-2 (e.g., "US", "JP", "BR")
        region: a.string(), // Region/state (e.g., "California", "Tokyo")
        city: a.string(), // City name (optional, for page/perf scope)
        // ─── User activity ───
        dailyActiveUsers: a.integer().default(0),
        totalPageViews: a.integer().default(0),
        totalSessions: a.integer().default(0),
        avgSessionDurationMs: a.integer(),
        // ─── Engagement ───
        totalEngagedTimeMs: a.integer().default(0),
        avgEngagedTimeMs: a.integer(),
        // ─── Academic ───
        gradesSubmitted: a.integer().default(0),
        avgAccuracy: a.float(),
        workbooksStarted: a.integer().default(0),
        workbooksCompleted: a.integer().default(0),
        // ─── Chat (split by role) ───
        studentChatMessagesSent: a.integer().default(0),
        instructorChatMessagesSent: a.integer().default(0),
        // ─── AI usage ───
        documentsAnalyzed: a.integer().default(0),
        // ─── Performance (Web Vitals p75) ───
        p75LCP: a.integer(), // Largest Contentful Paint (ms)
        p75INP: a.integer(), // Interaction to Next Paint (ms)
        p75TTFB: a.integer(), // Time to First Byte (ms)
        p75FCP: a.integer(), // First Contentful Paint (ms)
        p75CLS: a.float(), // Cumulative Layout Shift (score)
        perfSampleCount: a.integer(), // Number of measurements
        // ─── JSON Rollups (on platform/section records) ───
        topPages: a.json(), // [{ path, views, avgTimeMs }]
        slowestPages: a.json(), // [{ path, p75LCP, p75INP, sampleCount }]
        topUnits: a.json(), // [{ unitId, name, completions, avgAccuracy }]
        bottomUnits: a.json(), // [{ unitId, name, completions, avgAccuracy }]
        topSquads: a.json(), // [{ squadId, name, xp, avgAccuracy }]
        bottomSquads: a.json(), // [{ squadId, name, xp, avgAccuracy }]
        topCountries: a.json(), // [{ country, sessions, avgEngagedTimeMs, p75LCP }]
      })
      .secondaryIndexes((index) => [
        index("date").sortKeys(["scope"]).name("byDate"),
        index("sectionId").sortKeys(["scope"]).name("bySection"),
        index("scope").sortKeys(["date"]).name("byScope"),
        index("country").sortKeys(["date"]).name("byCountry"),
      ])
      .authorization((allow) => [
        allow.group("Admins").to(["create", "read", "update", "delete"]),
        allow.group("Instructors").to(["read"]),
      ]),

    // ========================================================================
    // CUSTOM QUERIES & MUTATIONS (Phase D - Lambda Integration)
    // ========================================================================

    // OpenAI & Verification Queries
    verifyDefinition: a
      .query()
      .arguments({
        phrase: a.string().required(),
        expected: a.string().required(),
        definition: a.string().required(),
        model: a.string(),
        studentMemory: a.string(),
        contentContext: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    verifyWord: a
      .query()
      .arguments({
        word: a.string().required(),
        expected: a.string().required(),
        definition: a.string().required(),
        model: a.string(),
        studentMemory: a.string(),
        contentContext: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    verifyShortAnswer: a
      .query()
      .arguments({
        expected: a.string().required(),
        answer: a.string().required(),
        prompt: a.string().required(),
        model: a.string(),
        studentMemory: a.string(),
        contentContext: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    transcribe: a
      .query()
      .arguments({
        audio: a.string().required(),
        model: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    verifyAudio: a
      .query()
      .arguments({
        expected: a.string().required(),
        audio: a.string().required(),
        model: a.string(),
        chatModel: a.string().required(),
        studentMemory: a.string(),
        contentContext: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    verifyAudioUrl: a
      .query()
      .arguments({
        expected: a.string().required(),
        audioUrl: a.string().required(),
        model: a.string().required(),
        chatModel: a.string().required(),
        studentMemory: a.string(),
        contentContext: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    transcribeUrl: a
      .query()
      .arguments({
        audioUrl: a.string().required(),
        model: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    processImage: a
      .query()
      .arguments({
        image: a.string().required(),
        model: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    processImageUrl: a
      .query()
      .arguments({
        imageUrl: a.string().required(),
        model: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    verifyImage: a
      .query()
      .arguments({
        expected: a.string().required(),
        image: a.string().required(),
        model: a.string(),
        studentMemory: a.string(),
        contentContext: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    verifyImageUrl: a
      .query()
      .arguments({
        expected: a.string().required(),
        imageUrl: a.string().required(),
        model: a.string(),
        studentMemory: a.string(),
        contentContext: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    summarizeFeedback: a
      .query()
      .arguments({
        gradeData: a.string().required(),
        assignmentData: a.string().required(),
        model: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    // Chat & Content Mutations
    chat: a
      .mutation()
      .arguments({
        messages: a.string().required(),
        model: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    generateAudio: a
      .mutation()
      .arguments({
        phrase: a.string().required(),
        voice: a.string(),
        model: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    generateAudioFile: a
      .mutation()
      .arguments({
        phrase: a.string().required(),
        voice: a.string().required(),
        model: a.string().required(),
      })
      .returns(a.ref("File"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    generateImage: a
      .mutation()
      .arguments({
        phrase: a.string().required(),
        model: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    generateImageFile: a
      .mutation()
      .arguments({
        phrase: a.string().required(),
        model: a.string(),
      })
      .returns(a.ref("File"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(openaiHandler)),

    // Document Analysis Mutations

    generatePracticeDrill: a
      .mutation()
      .arguments({
        unitId: a.string().required(),
        drillType: a.string().required(),
        count: a.integer().required(),
        sourcesEnabled: a.json().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(generatePracticeDrillHandler)),

    analyzeDocument: a
      .mutation()
      .arguments({
        fileID: a.id().required(),
      })
      .returns(a.ref("AnalyzeDocumentResult"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(documentAnalysisHandler)),

    cancelDocumentAnalysis: a
      .mutation()
      .arguments({
        fileID: a.id().required(),
      })
      .returns(a.ref("CancelDocumentAnalysisResult"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(documentAnalysisHandler)),

    approveMedia: a
      .mutation()
      .arguments({
        parsedContentID: a.id().required(),
        approvedIndices: a.integer().array().required(),
      })
      .returns(a.ref("ApproveMediaResult"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(documentAnalysisHandler)),

    // Embeddings Mutations
    generateEmbeddings: a
      .mutation()
      .arguments({
        fileID: a.id().required(),
      })
      .returns(a.ref("GenerateEmbeddingsResult"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(embeddingsHandler)),

    generateEmbedding: a
      .mutation()
      .arguments({
        content: a.string().required(),
        model: a.string(),
        dimensions: a.integer(),
      })
      .returns(a.ref("EmbeddingResult"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(embeddingsHandler)),

    // Moderation Mutations
    // modelName + recordId are optional — when provided, the Lambda persists
    // moderation result directly to the record (server-authoritative write).
    moderateContent: a
      .mutation()
      .arguments({
        content: a.string().required(),
        modelName: a.string(),
        recordId: a.id(),
      })
      .returns(a.ref("ModerationResult"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(moderationHandler)),

    moderateImage: a
      .mutation()
      .arguments({
        imageUrl: a.string().required(),
        modelName: a.string(),
        recordId: a.id(),
      })
      .returns(a.ref("ModerationResult"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(moderationHandler)),

    moderateAudio: a
      .mutation()
      .arguments({
        audioUrl: a.string().required(),
        modelName: a.string(),
        recordId: a.id(),
      })
      .returns(a.ref("ModerationResult"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(moderationHandler)),

    // Section Management Mutations
    createSectionGroup: a
      .mutation()
      .arguments({
        name: a.string().required(),
        description: a.string().required(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(sectionHandler)),

    addSelfToSection: a
      .mutation()
      .arguments({
        code: a.string().required(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(sectionHandler)),

    // Peer Review Mutations
    createPeerReviewRoom: a
      .mutation()
      .arguments({
        gradeId: a.id().required(),
        invitedUserIds: a.string().array(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(sectionHandler)),

    joinPeerReview: a
      .mutation()
      .arguments({
        code: a.string().required(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(sectionHandler)),

    // Section Management Queries
    listSectionStudents: a
      .query()
      .arguments({
        sectionCode: a.string().required(),
      })
      .returns(a.ref("StudentInfo").array())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(sectionHandler)),

    // Returns a short-lived presigned/signed URL for a student's private submission file.
    // AppSync enforces that only Instructors and Admins can call this query.
    // The Lambda further validates the caller is an instructor of the grade's section
    // and that the submissionKey belongs to the grade owner (path traversal prevention).
    getStudentSubmissionUrl: a
      .query()
      .arguments({
        gradeId: a.id().required(),
        submissionKey: a.string().required(),
      })
      .returns(a.string())
      .authorization((allow) => [
        allow.group("Instructors"),
        allow.group("Admins"),
      ])
      .handler(a.handler.function(sectionHandler)),

    // Phase 6 — Issues CloudFront signed cookie values for the protected/units/* path prefix.
    // Authenticated users receive a 4-hour custom-policy cookie so their browser can fetch
    // published unit JSON, images, and audio directly from CloudFront without per-request
    // signing. The app/providers.tsx AuthGate sets these via document.cookie on login.
    getUnitsCdnCookie: a
      .query()
      .returns(a.ref("CdnCookies"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(sectionHandler)),

    // Phase 6 — Reads the unit draft from S3, rewrites media paths, and writes
    // protected/units/{unitId}/published.json. Also updates Unit.publishedContentVersion
    // and publishedAt in DynamoDB. Replaces the client-side publishContent() call.
    publishUnit: a
      .mutation()
      .arguments({
        unitId: a.id().required(),
      })
      .returns(a.json())
      .authorization((allow) => [
        allow.group("Instructors"),
        allow.group("Admins"),
      ])
      .handler(a.handler.function(publishUnitHandler)),

    // Phase 6 — Admin-only mutation that scans all published units and writes a
    // bigram/trigram frequency index to protected/units/ngrams/v1.json for the
    // layout suggestion system. Served via CloudFront behind the signed cookie.
    rebuildNgramIndex: a
      .mutation()
      .returns(a.json())
      .authorization((allow) => [allow.group("Admins")])
      .handler(a.handler.function(rebuildNgramIndexHandler)),

    // Gamification Mutations
    awardXP: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
        reason: a.string().required(),
        referenceId: a.string(),
        cohortId: a.string(),
        unitID: a.string(),
        accuracy: a.float(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    checkBadges: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    checkBadgesBatch: a
      .mutation()
      .arguments({
        entries: a.json().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    updateStreak: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    rebuildLeaderboard: a
      .mutation()
      .arguments({
        cohortId: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    upsertStudentMemory: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
        feedbackMarkdown: a.string().required(),
        source: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    bootstrapStudentMemory: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    updateStudentUnitMemoryFromGrade: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
        unitID: a.string().required(),
        accuracy: a.float().required(),
        weakAreas: a.json(),
        strongAreas: a.json(),
        confusionPairs: a.json(),
        accuracyBySource: a.json(),
        sourceType: a.string(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    rebuildStudentMemoryProfile: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    checkPersonalBest: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
        unitID: a.string().required(),
        score: a.float().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    recomputeProgress: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
        moduleId: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    checkEasterEggs: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
        submissionText: a.string().required(),
        triggerType: a.string(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    discoverEasterEgg: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
        eggId: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    updateSquadXP: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
        xpAmount: a.integer().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    contributeToChallenge: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
        cohortId: a.string().required(),
        xpContributed: a.integer().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    generateSkillTree: a
      .mutation()
      .arguments({
        unitID: a.id().required(),
        cohortId: a.string(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    advanceSkillProgress: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
        skillId: a.string().required(),
        newStatus: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    evaluateSkillsForUnit: a
      .mutation()
      .arguments({
        studentId: a.string().required(),
        unitId: a.string().required(),
        cohortId: a.string(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    claimStorybookBadges: a
      .mutation()
      .arguments({
        completedTasks: a.string().array().required(),
        completedPersonas: a.string().array().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(gamificationHandler)),

    // Peer Review AI Mutations
    handleAIMention: a
      .mutation()
      .arguments({
        roomId: a.id().required(),
        message: a.string().required(),
        chatHistory: a.string(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(peerReviewAIHandler)),

    generateReviewSummary: a
      .mutation()
      .arguments({
        roomId: a.id().required(),
        chatLog: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(peerReviewAIHandler)),

    // Image Processing Mutations
    processFileImage: a
      .mutation()
      .arguments({
        fileID: a.id().required(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(imageProcessHandler)),

    // Document Thumbnail Mutations
    processDocumentThumbnail: a
      .mutation()
      .arguments({
        fileID: a.id().required(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(documentThumbnailHandler)),

    // ========================================================================
    // RECYCLE BIN OPERATIONS
    // ========================================================================

    softDelete: a
      .mutation()
      .arguments({
        modelName: a.string().required(),
        id: a.id().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(recycleBinHandler)),

    restoreRecord: a
      .mutation()
      .arguments({
        modelName: a.string().required(),
        id: a.id().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(recycleBinHandler)),

    permanentDelete: a
      .mutation()
      .arguments({
        modelName: a.string().required(),
        id: a.id().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(recycleBinHandler)),

    unarchiveRecord: a
      .mutation()
      .arguments({
        archiveKey: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.group("Admins")])
      .handler(a.handler.function(recycleBinHandler)),

    listArchives: a
      .query()
      .arguments({
        modelName: a.string(),
        limit: a.integer(),
        continuationToken: a.string(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.group("Admins")])
      .handler(a.handler.function(recycleBinHandler)),

    getArchive: a
      .query()
      .arguments({
        archiveKey: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.group("Admins")])
      .handler(a.handler.function(recycleBinHandler)),
  })
  .authorization((allow) => [
    allow.resource(openaiHandler),
    allow.resource(documentAnalysisHandler),
    allow.resource(embeddingsHandler),
    allow.resource(mediaConvertHandler),
    allow.resource(imageProcessHandler),
    allow.resource(documentThumbnailHandler),
    allow.resource(gamificationHandler),
    allow.resource(moderationHandler),
    allow.resource(recycleBinHandler),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
  // Note: Versioning fields (_version, _lastChangedAt, _deleted) are provided automatically
  // by AppSync on versioned tables. The CDK Aspect in backend.ts enables the DynamoDB-level
  // conflict resolution (syncConfig: VERSION) which provides these fields at runtime.
});
