import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { openaiHandler } from '../functions/openai/resource';
import { sectionHandler } from '../functions/section/resource';
import { embeddingsHandler } from '../functions/embeddings/resource';
import { moderationHandler } from '../functions/moderation/resource';
import { documentAnalysisHandler } from '../functions/documentAnalysis/resource';
import { aiHandler } from '../functions/ai/resource';
import { assistantHandler } from '../functions/assistant/resource';

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

const PublishedStatus = a.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

const FileProtectionLevels = a.enum(['PUBLIC', 'PRIVATE', 'PROTECTED']);

const AiContentType = a.enum([
  'CHAT_MESSAGE',
  'CONTENT_COMPLETION',
  'AUDIO_GENERATION',
  'IMAGE_GENERATION',
  'DOCUMENT_ANALYSIS',
  'VOCABULARY_EXTRACTION',
  'TRANSCRIPTION',
  'IMAGE_DESCRIPTION',
  'GRADING_FEEDBACK',
  'BLOCK_SUGGESTION',
]);

const AiFeedbackType = a.enum(['POSITIVE', 'NEGATIVE']);

const AiFeedbackReason = a.enum([
  'INCORRECT',
  'INCOMPLETE',
  'INAPPROPRIATE',
  'NOT_HELPFUL',
  'IRRELEVANT',
  'POOR_QUALITY',
  'OTHER',
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
// MAIN SCHEMA DEFINITION
// ============================================================================

const schema = a.schema({
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
  // CORE MODELS
  // ========================================================================

  Unit: a
    .model({
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
      // Relationships
      assignments: a.hasMany('Assignment', ['unitID']),
      grades: a.hasMany('Grade', ['unitID']),
      unitFiles: a.hasMany('UnitFile', ['unitID']),
      unitWords: a.hasMany('UnitWord', ['unitID']),
      questionUnits: a.hasMany('QuestionUnit', ['unitID']),
      unitDocuments: a.hasMany('UnitDocument', ['unitID']),
      agentJobs: a.hasMany('AgentJob', ['unitID']),
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
    })
    .authorization((allow) => [
      // Owners (creators - typically Instructors) have full control
      allow.owner(),
      // Admins have full access
      allow.group('Admins'),
      // Instructors can create new units
      allow.group('Instructors').to(['create']),
      // Learners can read all units (for published/assigned content)
      allow.group('Learners').to(['read']),
      // Note: readableGroups/writableGroups used for client-side filtering
      // Cannot use allow.groupsDefinedIn() - it generates invalid containsAny subscription filters
    ]),

  Assignment: a
    .model({
      dueDate: a.datetime(),
      status: PublishedStatus,
      // Foreign keys for relationships
      sectionID: a.id().required(),
      unitID: a.id().required(),
      section: a.belongsTo('Section', ['sectionID']),
      unit: a.belongsTo('Unit', ['unitID']),
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
      allow.group('Admins'),
      // Instructors and Learners have access based on section membership
      allow.group('Instructors'),
      allow.group('Learners').to(['read']),
      // Note: readableGroups/writableGroups used for client-side filtering
      // Cannot use allow.groupsDefinedIn() - it generates invalid containsAny subscription filters
    ]),

  Grade: a
    .model({
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
      // Foreign keys
      unitID: a.id().required(),
      unit: a.belongsTo('Unit', ['unitID']),
      sectionID: a.id(), // Section this grade is for (for section-based authorization)
      // Dynamic group authorization - single instructor group that can grade this submission
      // Format: 'section-{sectionId}-instructors'
      instructorGroup: a.string(),
      instructor: a.string(),
      // Metadata
      identityId: a.string(),
      moderation: ModerationInfo,
    })
    .authorization((allow) => [
      // Student owns their grade
      allow.owner(),
      // Admins have full access
      allow.group('Admins'),
      // Dynamic group authorization: only instructors of the section can read/update
      // Single group with access to this grade
      allow.groupDefinedIn('instructorGroup').to(['read', 'update']),
    ]),

  Section: a
    .model({
      name: a.string(),
      description: a.string(),
      status: PublishedStatus,
      code: a.string(),
      instructor: a.string(), // User ID of instructor
      // Relationships
      assignments: a.hasMany('Assignment', ['sectionID']),
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
      learner: a.string(),// For student access
      owner: a.string(),
      identityId: a.string(),
      // Gradebook curve settings
      curveEnabled: a.boolean(),
      curveMethod: a.string(), // 'scale-to-top' or 'linear-adjustment'
      curveAssignments: a.string().array(), // Array of unitIDs to apply curve to
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Admins'),
      allow.group('Instructors'),
      allow.group('Learners').to(['read']),
      allow.authenticated().to(['read']), // Allow authenticated users to find sections by code
      // Note: readableGroups/writableGroups used for client-side filtering
      // Cannot use allow.groupsDefinedIn() - it generates invalid containsAny subscription filters
    ]),

  // ========================================================================
  // CONTENT MODELS
  // ========================================================================

  Question: a
    .model({
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
      questionUnits: a.hasMany('QuestionUnit', ['questionID']),
      questionWords: a.hasMany('QuestionWord', ['questionID']),
      questionFiles: a.hasMany('QuestionFile', ['questionID']),
      documentQuestions: a.hasMany('DocumentQuestion', ['questionID']),
      // Yjs CRDT snapshot for conflict-free collaborative editing
      yjsSnapshot: a.string(), // Base64-encoded Y.Doc state
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Learners').to(['read']),
      allow.group('Admins'),
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
   */  File: a
    .model({
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
      document: a.belongsTo('Document', ['documentID']),
      unitFiles: a.hasMany('UnitFile', ['fileID']),
      wordFiles: a.hasMany('WordFile', ['fileID']),
      questionFiles: a.hasMany('QuestionFile', ['fileID']),
      chatFiles: a.hasMany('AssistantChatFile', ['fileID']),
      parsedContent: a.hasMany('ParsedContent', ['fileID']),
      // Metadata for semantic search
      embedding: EmbeddingInfo,
      // Yjs CRDT snapshot for conflict-free file metadata management
      yjsSnapshot: a.string(), // Base64-encoded Y.Doc state
    })
    .authorization((allow) => [
      // Owner has full control
      allow.owner(),
      // Instructors can create and manage files
      allow.group('Instructors'),
      // Learners can read files (for embedded content, shared resources)
      allow.group('Learners').to(['read']),
      // Admins have full access
      allow.group('Admins'),
    ]),

  Word: a
    .model({
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
      unitWords: a.hasMany('UnitWord', ['wordID']),
      wordFiles: a.hasMany('WordFile', ['wordID']),
      questionWords: a.hasMany('QuestionWord', ['wordID']),
      documentWords: a.hasMany('DocumentWord', ['wordID']),
      // Yjs CRDT snapshot for conflict-free collaborative editing
      yjsSnapshot: a.string(), // Base64-encoded Y.Doc state
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Learners').to(['read']),
      allow.group('Admins'),
    ]),

  // ========================================================================
  // JOIN TABLES (Explicit Many-to-Many)
  // ========================================================================

  UnitFile: a
    .model({
      unitID: a.id().required(),
      unit: a.belongsTo('Unit', ['unitID']),
      fileID: a.id().required(),
      file: a.belongsTo('File', ['fileID']),
    })
    .authorization((allow) => [allow.owner(), allow.group('Admins')]),

  UnitWord: a
    .model({
      unitID: a.id().required(),
      unit: a.belongsTo('Unit', ['unitID']),
      wordID: a.id().required(),
      word: a.belongsTo('Word', ['wordID']),
    })
    .authorization((allow) => [allow.owner(), allow.group('Admins')]),

  QuestionUnit: a
    .model({
      questionID: a.id().required(),
      question: a.belongsTo('Question', ['questionID']),
      unitID: a.id().required(),
      unit: a.belongsTo('Unit', ['unitID']),
    })
    .authorization((allow) => [allow.owner(), allow.group('Admins')]),

  UnitDocument: a
    .model({
      unitID: a.id().required(),
      unit: a.belongsTo('Unit', ['unitID']),
      documentID: a.id().required(),
      document: a.belongsTo('Document', ['documentID']),
    })
    .authorization((allow) => [allow.owner(), allow.group('Admins')]),

  QuestionFile: a
    .model({
      questionID: a.id().required(),
      question: a.belongsTo('Question', ['questionID']),
      fileID: a.id().required(),
      file: a.belongsTo('File', ['fileID']),
    })
    .authorization((allow) => [allow.owner(), allow.group('Admins')]),

  WordFile: a
    .model({
      wordID: a.id().required(),
      word: a.belongsTo('Word', ['wordID']),
      fileID: a.id().required(),
      file: a.belongsTo('File', ['fileID']),
    })
    .authorization((allow) => [allow.owner(), allow.group('Admins')]),

  QuestionWord: a
    .model({
      questionID: a.id().required(),
      question: a.belongsTo('Question', ['questionID']),
      wordID: a.id().required(),
      word: a.belongsTo('Word', ['wordID']),
    })
    .authorization((allow) => [allow.owner(), allow.group('Admins')]),

  DocumentWord: a
    .model({
      documentID: a.id().required(),
      document: a.belongsTo('Document', ['documentID']),
      wordID: a.id().required(),
      word: a.belongsTo('Word', ['wordID']),
    })
    .authorization((allow) => [allow.owner(), allow.group('Admins')]),

  DocumentQuestion: a
    .model({
      documentID: a.id().required(),
      document: a.belongsTo('Document', ['documentID']),
      questionID: a.id().required(),
      question: a.belongsTo('Question', ['questionID']),
    })
    .authorization((allow) => [allow.owner(), allow.group('Admins')]),

  AssistantChatFile: a
    .model({
      chatID: a.id().required(),
      chat: a.belongsTo('AssistantChat', ['chatID']),
      fileID: a.id().required(),
      file: a.belongsTo('File', ['fileID']),
    })
    .authorization((allow) => [allow.owner(), allow.group('Admins')]),

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
   */  Document: a
    .model({
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
      uploadedAt: a.datetime(),
      // Processing State - for resuming long-running operations on timeout
      resumeState: a.json(), // { lastProcessedPage, accumulatedPages, totalPages }
      // Note: pageEmbeddings kept in separate ParsedContent table to avoid item size limits
      // Relationships
      files: a.hasMany('File', ['documentID']), // Metadata records for uploaded files
      parsedContent: a.hasMany('ParsedContent', ['documentID']), // Extracted vocabulary, questions, summaries
      agentJobs: a.hasMany('AgentJob', ['documentID']), // Track OpenAI API calls and costs
      unitDocuments: a.hasMany('UnitDocument', ['documentID']), // Associate documents with curriculum units
      documentWords: a.hasMany('DocumentWord', ['documentID']), // Extracted vocabulary from document
      documentQuestions: a.hasMany('DocumentQuestion', ['documentID']), // Generated comprehension questions
      // Metadata
      metadata: a.json(),
      // Yjs CRDT snapshot for conflict-free document status management
      yjsSnapshot: a.string(), // Base64-encoded Y.Doc state
    })
    .authorization((allow) => [
      // Document owner (student) can manage their documents
      allow.owner(),
      // Admins have full access
      allow.group('Admins'),
      // Instructors can create and manage documents
      allow.group('Instructors'),
      // Learners can read documents (section-based access controlled by Lambda/client-side)
      allow.group('Learners').to(['read']),
      // Note: readableGroups/writableGroups used for client-side filtering
      // Cannot use allow.groupsDefinedIn() - it generates invalid containsAny subscription filters
    ]),

  ParsedContent: a
    .model({
      // Ownership
      owner: a.string(),
      identityId: a.string(),
      // Foreign keys
      documentID: a.id().required(),
      document: a.belongsTo('Document', ['documentID']),
      fileID: a.id(),
      file: a.belongsTo('File', ['fileID']),
      // Note: This model is referenced by File via parsedContentID for one-to-one relationship
      // Extracted content (as JSON for flexibility)
      vocabularyJSON: a.json(), // [{word, definition, context, page}]
      summariesJSON: a.json(), // [{title, content, page_range}]
      objectivesJSON: a.json(), // [{objective, bloom_level}]
      conceptsJSON: a.json(), // [{concept, description, related_vocabulary}]
      questionsJSON: a.json(), // [{question, expectedAnswer, hint, type}]
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
      allow.group('Learners').to(['read']),
      allow.group('Admins'),
    ]),

  AgentJob: a
    .model({
      // Job tracking
      type: a.string().required(), // pdf_analysis, exercise_generation, vocabulary_extraction
      status: a.string().required(), // queued, processing, completed, failed, cancelled
      // Foreign keys
      documentID: a.id(),
      document: a.belongsTo('Document', ['documentID']),
      unitID: a.id(),
      unit: a.belongsTo('Unit', ['unitID']),
      // API tracking
      responseId: a.string(),
      webhookData: a.json(),
      error: a.json(), // {message, code, stack, timestamp}
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
      allow.group('Learners').to(['read']),
      allow.group('Admins'),
      allow.authenticated(),
    ]),

  // ========================================================================
  // CHAT & ASSISTANT MODELS
  // ========================================================================

  AssistantChat: a
    .model({
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
      chatFiles: a.hasMany('AssistantChatFile', ['chatID']),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Admins'),
    ]),

  // ========================================================================
  // USER & SETTINGS MODELS
  // ========================================================================

  Settings: a
    .model({
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
      metadata: a.json(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Admins'),
      allow.authenticated(),
    ]),

  AIFeedback: a
    .model({
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
      allow.group('Admins'),
      allow.authenticated(),
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
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  verifyWord: a
    .query()
    .arguments({
      word: a.string().required(),
      expected: a.string().required(),
      definition: a.string().required(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  verifyShortAnswer: a
    .query()
    .arguments({
      expected: a.string().required(),
      answer: a.string().required(),
      prompt: a.string().required(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  transcribe: a
    .query()
    .arguments({
      audio: a.string().required(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  verifyAudio: a
    .query()
    .arguments({
      expected: a.string().required(),
      audio: a.string().required(),
      model: a.string(),
      chatModel: a.string().required(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  verifyAudioUrl: a
    .query()
    .arguments({
      expected: a.string().required(),
      audioUrl: a.string().required(),
      model: a.string().required(),
      chatModel: a.string().required(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  transcribeUrl: a
    .query()
    .arguments({
      audioUrl: a.string().required(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  processImage: a
    .query()
    .arguments({
      image: a.string().required(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  processImageUrl: a
    .query()
    .arguments({
      imageUrl: a.string().required(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  verifyImage: a
    .query()
    .arguments({
      expected: a.string().required(),
      image: a.string().required(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  verifyImageUrl: a
    .query()
    .arguments({
      expected: a.string().required(),
      imageUrl: a.string().required(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  // Chat & Content Mutations
  chat: a
    .mutation()
    .arguments({
      messages: a.string().required(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  generateAudio: a
    .mutation()
    .arguments({
      phrase: a.string().required(),
      voice: a.string(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  generateAudioFile: a
    .mutation()
    .arguments({
      phrase: a.string().required(),
      voice: a.string().required(),
      model: a.string().required(),
    })
    .returns(a.ref('File'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  generateImage: a
    .mutation()
    .arguments({
      phrase: a.string().required(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  generateImageFile: a
    .mutation()
    .arguments({
      phrase: a.string().required(),
      model: a.string(),
    })
    .returns(a.ref('File'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(openaiHandler)),

  // Document Analysis Mutations
  analyzeDocument: a
    .mutation()
    .arguments({
      fileID: a.id().required(),
    })
    .returns(a.ref('AnalyzeDocumentResult'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(documentAnalysisHandler)),

  cancelDocumentAnalysis: a
    .mutation()
    .arguments({
      fileID: a.id().required(),
    })
    .returns(a.ref('CancelDocumentAnalysisResult'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(documentAnalysisHandler)),

  // Embeddings Mutations
  generateEmbeddings: a
    .mutation()
    .arguments({
      fileID: a.id().required(),
    })
    .returns(a.ref('GenerateEmbeddingsResult'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(embeddingsHandler)),

  generateEmbedding: a
    .mutation()
    .arguments({
      content: a.string().required(),
      model: a.string(),
      dimensions: a.integer(),
    })
    .returns(a.ref('EmbeddingResult'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(embeddingsHandler)),

  // Content & AI Mutations
  contentCompletion: a
    .mutation()
    .arguments({
      prompt: a.string().required(),
      context: a.json(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(aiHandler)),

  suggestBlocks: a
    .mutation()
    .arguments({
      unitStructure: a.json().required(),
      currentContext: a.json(),
      userHistory: a.json(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(aiHandler)),

  // Moderation Mutation
  moderateContent: a
    .mutation()
    .arguments({
      content: a.string().required(),
    })
    .returns(a.ref('ModerationResult'))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(moderationHandler)),

  // Unit Prediction Mutations
  predictUnitData: a
    .mutation()
    .arguments({
      unitID: a.id().required(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(aiHandler)),

  predictUnitByData: a
    .mutation()
    .arguments({
      data: a.string().required(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(aiHandler)),

  // Assistant Editor Mutations
  initAssistantEditor: a
    .mutation()
    .arguments({
      model: a.string().required(),
      additionalInstructions: a.string().required(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(assistantHandler)),

  updateAssistantEditor: a
    .mutation()
    .arguments({
      assistantId: a.string().required(),
      additionalInstructions: a.string().required(),
      model: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(assistantHandler)),

  deleteAssistantEditor: a
    .mutation()
    .arguments({
      assistantId: a.string().required(),
      threadId: a.string().required(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(assistantHandler)),

  useAssistantEditor: a
    .mutation()
    .arguments({
      threadInstructions: a.string().required(),
      assistantId: a.string().required(),
      threadId: a.string().required(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(assistantHandler)),

  chatAssistantThread: a
    .mutation()
    .arguments({
      assistantId: a.string().required(),
      messages: a.string().required(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(assistantHandler)),

  // Section Management Mutations
  createSectionGroup: a
    .mutation()
    .arguments({
      name: a.string().required(),
      description: a.string().required(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(sectionHandler)),

  addSelfToSection: a
    .mutation()
    .arguments({
      code: a.string().required(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(sectionHandler)),

  // Section Management Queries
  listSectionStudents: a
    .query()
    .arguments({
      sectionCode: a.string().required(),
    })
    .returns(a.ref('StudentInfo').array())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(sectionHandler)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
  // Enable optimistic concurrency control for data consistency
  // All models will have _version, _lastChangedAt, _deleted fields
  conflictResolution: {
    resolutionStrategy: 'OPTIMISTIC_CONCURRENCY'
  }
});
