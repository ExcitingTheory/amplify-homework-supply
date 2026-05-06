import { a, defineData, type ClientSchema } from "@aws-amplify/backend";
import { openaiHandler } from "../functions/openai/resource";
import { sectionHandler } from "../functions/section/resource";
import { embeddingsHandler } from "../functions/embeddings/resource";
import { moderationHandler } from "../functions/moderation/resource";
import { documentAnalysisHandler } from "../functions/documentAnalysis/resource";

import { mediaConvertHandler } from "../functions/mediaConvert/resource";
import { gamificationHandler } from "../functions/gamification/resource";
import { peerReviewAIHandler } from "../functions/peerReviewAI/resource";
import { generatePracticeDrillHandler } from "../functions/generatePracticeDrill/resource";

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

// Consolidated types for DRY principles
const EmbeddingInfo = a.customType({
  embedding: a.json(), // Array of PageEmbedding objects
  model: a.string(),
  dimensions: a.integer(),
  version: a.timestamp(),
  wordCount: a.integer(),
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

const GuildMember = a.customType({
  studentId: a.string().required(),
  role: a.string(), // LEADER | MEMBER
  joinedAt: a.datetime(),
});

const GuildPostEntry = a.customType({
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

const EasterEggDiscoveryEntry = a.customType({
  studentId: a.string().required(),
  discoveredAt: a.datetime(),
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
    BadgeEntry,
    ModuleProgressEntry,
    PersonalBestEntry,
    SkillProgressEntry,
    UnitMemoryEntry,
    GuildMember,
    GuildPostEntry,
    ChallengeContribution,
    EasterEggDiscoveryEntry,
    VocabularyEntry,
    SummaryEntry,
    ObjectiveEntry,
    ConceptEntry,
    QuestionEntry,
    SourcesEnabled,
    CoverageSnapshot,
    BlockBreakdown,
    ResumeState,
    CurveSettings,
    CommentReply,
    JobError,
    ConceptStrength,
    ConfusionPair,

    // ========================================================================
    // CORE MODELS
    // ========================================================================

    Unit: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership
        owner: a.string(),
        identityId: a.string(),
        number: a.float(),
        name: a.string(),
        description: a.string(),
        // Editor content as Lexical JSON
        data: a.json(),
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
        // Dynamic group authorization - students and instructors can read
        // Format: ['section-{sectionId}-instructors', 'section-{sectionId}-learners']
        readableGroups: a.string().array(),
        // Dynamic group authorization - only instructors can update
        // Format: ['section-{sectionId}-instructors']
        writableGroups: a.string().array(),
        // Metadata
        featuredImage: a.string(),
        thumbnail: a.string(),
        embedding: EmbeddingInfo,
        moderation: ModerationInfo,
        publishedAt: a.timestamp(),
        isDraft: a.boolean(),
        // Yjs CRDT snapshot for conflict-free collaborative editing
        yjsSnapshot: a.string(), // Base64-encoded Y.Doc state
        // Content gating (absorbed from ContentLock model)
        requiredXP: a.integer(),
        requiredBadgeId: a.string(),
        requiredModuleCompletion: a.float(),
      })
      .authorization((allow) => [
        // Owners (creators - typically Instructors) have full control
        allow.owner(),
        // Admins have full access
        allow.group("Admins"),
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
        status: PublishedStatus,
        // Foreign keys for relationships
        sectionID: a.id().required(),
        unitID: a.id().required(),
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
        owner: a.string(),
      })
      .authorization((allow) => [
        // Student owns their assignment
        allow.owner(),
        // Admins have full access
        allow.group("Admins"),
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
        // Completion tracking
        percentComplete: a.float(),
        accuracy: a.float(),
        timerStarted: a.boolean(),
        complete: a.boolean(),
        // Submission data
        data: a.json(), // JSON object keyed by block IDs with { complete, accuracy, userAnswer, feedback }
        feedback: a.json(), // Generated feedback by block
        files: a.string().array(), // Submitted file paths
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
        unitID: a.id().required(),
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
        allow.group("Admins"),
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
        thumbnail: a.string(),
        backgroundColor: a.string(),
        embedding: EmbeddingInfo,
        learner: a.string(), // For student access
        owner: a.string(),
        identityId: a.string(),
        // Gradebook curve settings — per-assignment
        curveSettings: a.ref("CurveSettings").array(),
        // Instructor grade overrides — per-student per-unit
        gradeOverrides: a.json(), // { [studentId]: { [unitID]: { score: number, updatedAt: string } } }
        // Leaderboard
        leaderboardEnabled: a.boolean(), // Instructor toggle — show leaderboard for this section
        // Linear progression — lock units in due-date order until prior is completed
        linearLockEnabled: a.boolean(),
        // XP tuner — per-section overrides for XP multipliers and caps
        // { multipliers?: Record<XPReason, number>, dailyCap?: number, weeklyCap?: number, enabled?: boolean }
        xpConfig: a.json(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins"),
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
        owner: a.string(),
        identityId: a.string(),
        // Question content
        prompt: a.string(),
        answer: a.string(),
        hint: a.string(),
        choices: a.json(), // Array of Choice objects
        // Audio/media
        audio: a.string().array(),
        audioWaveformData: a.json(),
        answerAudio: a.string().array(),
        answerAudioWaveformData: a.json(),
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
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Learners").to(["read"]),
        allow.group("Admins"),
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
        owner: a.string().required(),
        identityId: a.string().required(), // Cognito Identity ID for protected/{identityId}/* paths
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
        path: a.string().required(), // Full S3 path (e.g., "public/units/file-123.json")
        size: a.integer(),
        duration: a.integer(),
        generated: a.boolean(),
        hex: a.string(),
        byHex: a.string(),
        thumbnail: a.string(),
        waveformData: a.json(),
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
      })
      .authorization((allow) => [
        // Owner has full control
        allow.owner(),
        // Instructors can create and manage files
        allow.group("Instructors"),
        // Learners can read files (for embedded content, shared resources)
        allow.group("Learners").to(["read"]),
        // Admins have full access
        allow.group("Admins"),
        // Note: Lambda function access (openai, documentAnalysis, embeddings, mediaConvert)
        // is granted via schema-level .authorization() - see bottom of schema definition
      ]),

    Word: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership
        owner: a.string(),
        identityId: a.string(),
        // Content
        phrase: a.string(),
        pronunciation: a.string(),
        definition: a.string(),
        rubyTags: a.string(),
        // Audio
        audio: a.string().array(),
        waveformData: a.json(),
        definitionAudio: a.string().array(),
        definitionWaveformData: a.json(),
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
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Learners").to(["read"]),
        allow.group("Admins"),
      ]),

    // ========================================================================
    // JOIN TABLES (Explicit Many-to-Many)
    // ========================================================================

    UnitFile: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        unitID: a.id().required(),
        unit: a.belongsTo("Unit", ["unitID"]),
        fileID: a.id().required(),
        file: a.belongsTo("File", ["fileID"]),
      })
      .authorization((allow) => [allow.owner(), allow.group("Admins")]),

    UnitWord: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        unitID: a.id().required(),
        unit: a.belongsTo("Unit", ["unitID"]),
        wordID: a.id().required(),
        word: a.belongsTo("Word", ["wordID"]),
      })
      .authorization((allow) => [allow.owner(), allow.group("Admins")]),

    QuestionUnit: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        questionID: a.id().required(),
        question: a.belongsTo("Question", ["questionID"]),
        unitID: a.id().required(),
        unit: a.belongsTo("Unit", ["unitID"]),
      })
      .authorization((allow) => [allow.owner(), allow.group("Admins")]),

    UnitDocument: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        unitID: a.id().required(),
        unit: a.belongsTo("Unit", ["unitID"]),
        documentID: a.id().required(),
        document: a.belongsTo("Document", ["documentID"]),
      })
      .authorization((allow) => [allow.owner(), allow.group("Admins")]),

    QuestionFile: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        questionID: a.id().required(),
        question: a.belongsTo("Question", ["questionID"]),
        fileID: a.id().required(),
        file: a.belongsTo("File", ["fileID"]),
      })
      .authorization((allow) => [allow.owner(), allow.group("Admins")]),

    WordFile: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        wordID: a.id().required(),
        word: a.belongsTo("Word", ["wordID"]),
        fileID: a.id().required(),
        file: a.belongsTo("File", ["fileID"]),
      })
      .authorization((allow) => [allow.owner(), allow.group("Admins")]),

    QuestionWord: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        questionID: a.id().required(),
        question: a.belongsTo("Question", ["questionID"]),
        wordID: a.id().required(),
        word: a.belongsTo("Word", ["wordID"]),
      })
      .authorization((allow) => [allow.owner(), allow.group("Admins")]),

    DocumentWord: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        documentID: a.id().required(),
        document: a.belongsTo("Document", ["documentID"]),
        wordID: a.id().required(),
        word: a.belongsTo("Word", ["wordID"]),
      })
      .authorization((allow) => [allow.owner(), allow.group("Admins")]),

    DocumentQuestion: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        documentID: a.id().required(),
        document: a.belongsTo("Document", ["documentID"]),
        questionID: a.id().required(),
        question: a.belongsTo("Question", ["questionID"]),
      })
      .authorization((allow) => [allow.owner(), allow.group("Admins")]),

    AssistantChatFile: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        chatID: a.id().required(),
        chat: a.belongsTo("AssistantChat", ["chatID"]),
        fileID: a.id().required(),
        file: a.belongsTo("File", ["fileID"]),
      })
      .authorization((allow) => [allow.owner(), allow.group("Admins")]),

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
        owner: a.string(),
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
        filename: a.string().required(),
        s3Key: a.string().required(), // S3 path to original PDF
        status: a.string().required(), // uploaded, extracting, extracted, analyzing, completed, failed, cancelled
        // Content
        extractedText: a.string(), // Full text extracted from PDF
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
      })
      .authorization((allow) => [
        // Document owner (student) can manage their documents
        allow.owner(),
        // Admins have full access
        allow.group("Admins"),
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
        owner: a.string(),
        identityId: a.string(),
        // Foreign keys
        documentID: a.id().required(),
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
        // API tracking
        responseId: a.string(), // OpenAI response ID
        modelUsed: a.string(),
        tokensUsed: a.integer(),
        processingTime: a.integer(),
        // Timestamps (createdAt/updatedAt auto-generated)
        importedAt: a.datetime(),
        metadata: a.json(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Learners").to(["read"]),
        allow.group("Admins"),
        // Note: Lambda function access (documentAnalysis, embeddings)
        // is granted via schema-level .authorization() - see bottom of schema definition
      ]),

    AgentJob: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Job tracking
        type: a.string().required(), // pdf_analysis, exercise_generation, vocabulary_extraction
        status: a.string().required(), // queued, processing, completed, failed, cancelled
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
        allow.group("Admins"),
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
        owner: a.string(),
        // Assistant configuration
        model: a.string(),
        threadInstructions: a.string(),
        additionalInstructions: a.string(),
        threadId: a.string(), // OpenAI thread ID
        moderationFlag: a.boolean(),
        // Chat session
        messages: a.json(), // Chat messages as JSON array
        draft: a.string(), // Current draft message
        archived: a.boolean(),
        // Usage tracking
        inputTokens: a.string(),
        outputTokens: a.string(),
        // Relationships
        chatFiles: a.hasMany("AssistantChatFile", ["chatID"]),
      })
      .authorization((allow) => [allow.owner(), allow.group("Admins")]),

    // ========================================================================
    // USER & SETTINGS MODELS
    // ========================================================================

    Settings: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership
        owner: a.string(),
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
        // Leaderboard & gamification
        leaderboardOptIn: a.boolean(), // Student opt-in for overall leaderboard
        metadata: a.json(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins"),
        allow.authenticated(),
      ]),

    AIFeedback: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        // Ownership
        owner: a.string(),
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
        allow.group("Admins"),
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
        gradeId: a.id().required(),
        blockId: a.string().required(),
        threadId: a.string().required(),
        content: a.string().required(),
        resolved: a.boolean(),
        replies: a.ref("CommentReply").array(),
      })
      .secondaryIndexes((index) => [
        index("gradeId").sortKeys(["blockId"]).name("byGradeBlock"),
      ])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins"),
        allow.group("Instructors"),
      ]),

    HomeworkRoom: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        gradeId: a.id().required(),
        ownerId: a.string().required(),
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
        allow.group("Admins"),
        allow.group("Instructors").to(["read"]),
        // Invited peers can read the room
        allow.groupDefinedIn("peerGroup").to(["read"]),
      ]),

    StudentXPLog: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        studentId: a.string().required(),
        xpAmount: a.integer().required(),
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
          "GUILD_CHALLENGE_BONUS",
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
        allow.group("Admins"),
        allow.authenticated().to(["read"]),
      ]),

    // Aggregate student gamification profile (absorbs 7 models)
    StudentProfile: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        studentId: a.string().required(),
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
        nailedItCount: a.integer(),
        lastUpdated: a.datetime(),
        // Cosmetic penalty (boss battle consequence)
        cosmeticPenalty: a.json(),
        // Active debuffs from anti-badges (JSON array with expiry timestamps)
        activeDebuffs: a.json(),
      })
      .secondaryIndexes((index) => [
        index("studentId").name("byStudent"),
        index("cohortId").name("byCohort"),
      ])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins"),
        allow.authenticated().to(["read"]),
      ]),

    StudentMemory: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        studentId: a.string().required(),
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
        allow.group("Admins"),
        allow.group("Instructors").to(["read"]),
      ]),

    EasterEgg: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        trigger: a.enum([
          "KEYWORD",
          "UI_INTERACTION",
          "TIME_BASED",
          "SUBMISSION_QUALITY",
        ]),
        triggerValue: a.string().required(),
        xpReward: a.integer().required(),
        badgeId: a.string(),
        revealMessage: a.string().required(),
        active: a.boolean().default(true),
        // Embedded discoveries (absorbed from EasterEggDiscovery)
        discoveries: a.ref("EasterEggDiscoveryEntry").array(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins"),
        allow.group("Instructors"),
        allow.authenticated().to(["read"]),
      ]),

    Skill: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        title: a.string().required(),
        description: a.string(),
        prerequisites: a.json(),
        xpReward: a.integer(),
        cohortId: a.string(),
      })
      .secondaryIndexes((index) => [index("cohortId").name("byCohort")])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins"),
        allow.group("Instructors"),
        allow.authenticated().to(["read"]),
      ]),

    Guild: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        name: a.string().required(),
        cohortId: a.string().required(),
        totalXP: a.integer().default(0),
        description: a.string(),
        // Embedded members (absorbed from GuildMembership)
        members: a.ref("GuildMember").array(),
        // Embedded posts (absorbed from GuildPost)
        posts: a.ref("GuildPostEntry").array(),
      })
      .secondaryIndexes((index) => [index("cohortId").name("byCohort")])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins"),
        allow.authenticated().to(["read", "create", "update"]),
      ]),

    GroupChallenge: a
      .model({
        _version: a.integer(),
        _lastChangedAt: a.timestamp(),
        _deleted: a.boolean(),
        cohortId: a.string().required(),
        title: a.string().required(),
        targetXP: a.integer().required(),
        currentXP: a.integer().default(0),
        deadline: a.datetime(),
        active: a.boolean().default(true),
        bonusMultiplier: a.float().default(1.5),
        // Campaign narrative (absorbed from Campaign model)
        setting: a.string(),
        stakes: a.string(),
        systemPromptSeed: a.string(),
        // Embedded contributions (absorbed from GroupChallengeContribution)
        contributions: a.ref("ChallengeContribution").array(),
      })
      .secondaryIndexes((index) => [index("cohortId").name("byCohort")])
      .authorization((allow) => [
        allow.owner(),
        allow.group("Admins"),
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
        unitID: a.string().required(),
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

    updateGuildXP: a
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
  })
  .authorization((allow) => [
    allow.resource(openaiHandler),
    allow.resource(documentAnalysisHandler),
    allow.resource(embeddingsHandler),
    allow.resource(mediaConvertHandler),
    allow.resource(gamificationHandler),
    allow.resource(moderationHandler),
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
