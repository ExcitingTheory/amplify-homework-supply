import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

/**
 * Amplify Gen 2 Data Schema
 * 
 * Migrated from Gen 1 GraphQL schema with simplified/consolidated fields:
 * - EmbeddingInfo type consolidates embedding fields
 * - ModerationInfo type consolidates moderation fields
 * - File-based organization by domain
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

const Choice = a.customType({
  choice: a.string(),
  correct: a.boolean(),
});

const StudentInfo = a.customType({
  id: a.id().required(),
  name: a.string(),
  email: a.string(),
});

const PageEmbedding = a.customType({
  page: a.integer().required(),
  embedding: a.float().array().required(),
  text: a.string(),
});



// ============================================================================
// MAIN SCHEMA DEFINITION
// ============================================================================

const schema = a.schema({
  // ========================================================================
  // CORE MODELS
  // ========================================================================

  Unit: a
    .model({
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
      // Metadata
      featuredImage: a.string(),
      thumbnail: a.string(),
      embedding: EmbeddingInfo,
      moderation: ModerationInfo,
      publishedAt: a.timestamp(),
      isDraft: a.boolean(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Learners').to(['read']),
      allow.group('Admins'),
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
      // Tracking
      learner: a.string(),
      owner: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Admins'),
      allow.authenticated(),
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
      instructor: a.string(),
      // Metadata
      identityId: a.string(),
      moderation: ModerationInfo,
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Admins'),
      allow.authenticated(),
    ]),

  Section: a
    .model({
      name: a.string(),
      description: a.string(),
      status: PublishedStatus,
      code: a.string(),
      // Relationships
      assignments: a.hasMany('Assignment', ['sectionID']),
      // Metadata
      featuredImage: a.string(),
      thumbnail: a.string(),
      backgroundColor: a.string(),
      embedding: EmbeddingInfo,
      learner: a.string(), // For student access
      owner: a.string(),
      identityId: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Admins'),
      allow.authenticated(),
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
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Learners').to(['read']),
      allow.group('Admins'),
    ]),

  File: a
    .model({
      // Ownership
      owner: a.string(),
      identityId: a.string(),
      // File metadata
      name: a.string(),
      description: a.string(),
      // Generation metadata
      prompt: a.string(),
      model: a.string(),
      variant: a.string(),
      // File details
      mimeType: a.string(),
      level: FileProtectionLevels,
      path: a.string(), // S3 path
      size: a.integer(),
      duration: a.integer(),
      generated: a.boolean(),
      hex: a.string(),
      byHex: a.string(),
      thumbnail: a.string(),
      waveformData: a.json(),
      // Relationships
      documentID: a.id(),
      document: a.belongsTo('Document', ['documentID']),
      parsedContentID: a.id(), // Reference to primary ParsedContent (no relationship declaration)
      unitFiles: a.hasMany('UnitFile', ['fileID']),
      wordFiles: a.hasMany('WordFile', ['fileID']),
      questionFiles: a.hasMany('QuestionFile', ['fileID']),
      chatFiles: a.hasMany('AssistantChatFile', ['fileID']),
      parsedContents: a.hasMany('ParsedContent', ['fileID']),
      // Metadata
      embedding: EmbeddingInfo,
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Learners').to(['read']),
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

  Document: a
    .model({
      // Ownership
      owner: a.string(),
      identityId: a.string(),
      learner: a.string(),
      // Document metadata
      filename: a.string().required(),
      s3Key: a.string().required(),
      status: a.string().required(), // uploaded, extracting, extracted, analyzing, completed, failed
      // Content
      extractedText: a.string(),
      pageCount: a.integer(),
      fileSize: a.integer(),
      mimeType: a.string(),
      uploadedAt: a.datetime(),
      // Processing
      resumeState: a.json(), // For resuming long-running operations
      // Note: pageEmbeddings kept in separate ParsedContent table for storage
      // Relationships
      files: a.hasMany('File', ['documentID']), // Bidirectional for File.document
      parsedContent: a.hasMany('ParsedContent', ['documentID']),
      agentJobs: a.hasMany('AgentJob', ['documentID']),
      unitDocuments: a.hasMany('UnitDocument', ['documentID']),
      documentWords: a.hasMany('DocumentWord', ['documentID']),
      documentQuestions: a.hasMany('DocumentQuestion', ['documentID']),
      // Metadata
      metadata: a.json(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Learners').to(['read']),
      allow.group('Admins'),
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
      // Timestamps
      createdAt: a.datetime(),
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
      updatedAt: a.datetime(),
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
      // Timestamps
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Admins'),
      allow.authenticated(),
    ]),
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
});
