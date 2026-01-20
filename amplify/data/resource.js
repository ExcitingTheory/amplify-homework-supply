"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
var backend_1 = require("@aws-amplify/backend");
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
var PublishedStatus = backend_1.a.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
var FileProtectionLevels = backend_1.a.enum(['PUBLIC', 'PRIVATE', 'PROTECTED']);
var AiContentType = backend_1.a.enum([
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
var AiFeedbackType = backend_1.a.enum(['POSITIVE', 'NEGATIVE']);
var AiFeedbackReason = backend_1.a.enum([
    'INCORRECT',
    'INCOMPLETE',
    'INAPPROPRIATE',
    'NOT_HELPFUL',
    'IRRELEVANT',
    'POOR_QUALITY',
    'OTHER',
]);
// Consolidated types for DRY principles
var EmbeddingInfo = backend_1.a.customType({
    embedding: backend_1.a.json(), // Array of PageEmbedding objects
    model: backend_1.a.string(),
    dimensions: backend_1.a.integer(),
    version: backend_1.a.timestamp(),
    wordCount: backend_1.a.integer(),
});
var ModerationInfo = backend_1.a.customType({
    status: backend_1.a.string(), // "pending", "approved", "flagged"
    flags: backend_1.a.json(),
    checkedAt: backend_1.a.datetime(),
});
// @ts-ignore - used via a.ref() string references in schema returns
var Choice = backend_1.a.customType({
    choice: backend_1.a.string(),
    correct: backend_1.a.boolean(),
});
// ============================================================================
// MAIN SCHEMA DEFINITION
// ============================================================================
var schema = backend_1.a.schema({
    // ========================================================================
    // CUSTOM TYPES FOR LAMBDA FUNCTION RETURNS
    // ========================================================================
    StudentInfo: backend_1.a.customType({
        id: backend_1.a.id().required(),
        name: backend_1.a.string(),
        email: backend_1.a.string(),
    }),
    PageEmbedding: backend_1.a.customType({
        page: backend_1.a.integer().required(),
        embedding: backend_1.a.float().array().required(),
        text: backend_1.a.string(),
    }),
    EmbeddingResult: backend_1.a.customType({
        embedding: backend_1.a.float().array().required(),
        model: backend_1.a.string().required(),
        dimensions: backend_1.a.integer().required(),
        tokenCount: backend_1.a.integer().required(),
        error: backend_1.a.string(),
    }),
    ModerationResult: backend_1.a.customType({
        flagged: backend_1.a.boolean().required(),
        categories: backend_1.a.json().required(), // OpenAI moderation categories
        categoryScores: backend_1.a.json().required(),
        model: backend_1.a.string().required(),
        error: backend_1.a.string(),
    }),
    AnalyzeDocumentResult: backend_1.a.customType({
        success: backend_1.a.boolean().required(),
        fileID: backend_1.a.id().required(),
        documentID: backend_1.a.id(),
        responseId: backend_1.a.string(),
        pageCount: backend_1.a.integer(),
        progress: backend_1.a.string(),
        message: backend_1.a.string(),
    }),
    CancelDocumentAnalysisResult: backend_1.a.customType({
        success: backend_1.a.boolean().required(),
        fileID: backend_1.a.id().required(),
        documentID: backend_1.a.id(),
        message: backend_1.a.string(),
    }),
    GenerateEmbeddingsResult: backend_1.a.customType({
        success: backend_1.a.boolean().required(),
        fileID: backend_1.a.id().required(),
        documentID: backend_1.a.id(),
        embeddingCount: backend_1.a.integer(),
        message: backend_1.a.string(),
    }),
    // ========================================================================
    // CORE MODELS
    // ========================================================================
    Unit: backend_1.a
        .model({
        number: backend_1.a.float(),
        name: backend_1.a.string(),
        description: backend_1.a.string(),
        // Editor content as Lexical JSON
        data: backend_1.a.json(),
        status: PublishedStatus,
        timeLimitSeconds: backend_1.a.integer(),
        // Relationships
        assignments: backend_1.a.hasMany('Assignment', ['unitID']),
        grades: backend_1.a.hasMany('Grade', ['unitID']),
        unitFiles: backend_1.a.hasMany('UnitFile', ['unitID']),
        unitWords: backend_1.a.hasMany('UnitWord', ['unitID']),
        questionUnits: backend_1.a.hasMany('QuestionUnit', ['unitID']),
        unitDocuments: backend_1.a.hasMany('UnitDocument', ['unitID']),
        agentJobs: backend_1.a.hasMany('AgentJob', ['unitID']),
        // Dynamic group authorization - students and instructors can read
        // Format: ['section-{sectionId}-instructors', 'section-{sectionId}-learners']
        readableGroups: backend_1.a.string().array(),
        // Dynamic group authorization - only instructors can update
        // Format: ['section-{sectionId}-instructors']
        writableGroups: backend_1.a.string().array(),
        // Metadata
        featuredImage: backend_1.a.string(),
        thumbnail: backend_1.a.string(),
        embedding: EmbeddingInfo,
        moderation: ModerationInfo,
        publishedAt: backend_1.a.timestamp(),
        isDraft: backend_1.a.boolean(),
    })
        .authorization(function (allow) { return [
        allow.owner(),
        allow.group('Learners').to(['read']),
        allow.group('Admins'),
        allow.groupsDefinedIn('readableGroups').to(['read']),
        allow.groupsDefinedIn('writableGroups').to(['update']),
    ]; }),
    Assignment: backend_1.a
        .model({
        dueDate: backend_1.a.datetime(),
        status: PublishedStatus,
        // Foreign keys for relationships
        sectionID: backend_1.a.id().required(),
        unitID: backend_1.a.id().required(),
        section: backend_1.a.belongsTo('Section', ['sectionID']),
        unit: backend_1.a.belongsTo('Unit', ['unitID']),
        // Dynamic group authorization - students and instructors can read
        // Format: ['section-{sectionId}-instructors', 'section-{sectionId}-learners']
        readableGroups: backend_1.a.string().array(),
        // Dynamic group authorization - only instructors can update
        // Format: ['section-{sectionId}-instructors']
        writableGroups: backend_1.a.string().array(),
        // Tracking
        learner: backend_1.a.string(),
        owner: backend_1.a.string(),
    })
        .authorization(function (allow) { return [
        // Student owns their assignment
        allow.owner(),
        // Admins have full access
        allow.group('Admins'),
        // Dynamic group authorization: instructors and learners can read
        allow.groupsDefinedIn('readableGroups').to(['read']),
        // Dynamic group authorization: only instructors can update
        allow.groupsDefinedIn('writableGroups').to(['update']),
    ]; }),
    Grade: backend_1.a
        .model({
        // Completion tracking
        percentComplete: backend_1.a.float(),
        accuracy: backend_1.a.float(),
        timerStarted: backend_1.a.boolean(),
        complete: backend_1.a.boolean(),
        // Submission data
        data: backend_1.a.json(), // JSON object keyed by block IDs with { complete, accuracy, userAnswer, feedback }
        feedback: backend_1.a.json(), // Generated feedback by block
        files: backend_1.a.string().array(), // Submitted file paths
        unitVersion: backend_1.a.integer(),
        // Foreign keys
        unitID: backend_1.a.id().required(),
        unit: backend_1.a.belongsTo('Unit', ['unitID']),
        sectionID: backend_1.a.id(), // Section this grade is for (for section-based authorization)
        // Dynamic group authorization - single instructor group that can grade this submission
        // Format: 'section-{sectionId}-instructors'
        instructorGroup: backend_1.a.string(),
        instructor: backend_1.a.string(),
        // Metadata
        identityId: backend_1.a.string(),
        moderation: ModerationInfo,
    })
        .authorization(function (allow) { return [
        // Student owns their grade
        allow.owner(),
        // Admins have full access
        allow.group('Admins'),
        // Dynamic group authorization: only instructors of the section can read/update
        // Single group with access to this grade
        allow.groupDefinedIn('instructorGroup').to(['read', 'update']),
    ]; }),
    Section: backend_1.a
        .model({
        name: backend_1.a.string(),
        description: backend_1.a.string(),
        status: PublishedStatus,
        code: backend_1.a.string(),
        // Relationships
        assignments: backend_1.a.hasMany('Assignment', ['sectionID']),
        // Dynamic group authorization - students and instructors can read
        // Format: ['section-{sectionId}-instructors', 'section-{sectionId}-learners']
        readableGroups: backend_1.a.string().array(),
        // Dynamic group authorization - only instructors can update
        // Format: ['section-{sectionId}-instructors']
        writableGroups: backend_1.a.string().array(),
        // Metadata
        featuredImage: backend_1.a.string(),
        thumbnail: backend_1.a.string(),
        backgroundColor: backend_1.a.string(),
        embedding: EmbeddingInfo,
        learner: backend_1.a.string(), // For student access
        owner: backend_1.a.string(),
        identityId: backend_1.a.string(),
    })
        .authorization(function (allow) { return [
        allow.owner(),
        allow.group('Admins'),
        allow.authenticated(),
        allow.groupsDefinedIn('readableGroups').to(['read']),
        allow.groupsDefinedIn('writableGroups').to(['update']),
    ]; }),
    // ========================================================================
    // CONTENT MODELS
    // ========================================================================
    Question: backend_1.a
        .model({
        // Ownership
        owner: backend_1.a.string(),
        identityId: backend_1.a.string(),
        // Question content
        prompt: backend_1.a.string(),
        answer: backend_1.a.string(),
        hint: backend_1.a.string(),
        choices: backend_1.a.json(), // Array of Choice objects
        // Audio/media
        audio: backend_1.a.string().array(),
        audioWaveformData: backend_1.a.json(),
        answerAudio: backend_1.a.string().array(),
        answerAudioWaveformData: backend_1.a.json(),
        // Generation metadata
        generated: backend_1.a.boolean(),
        model: backend_1.a.string(),
        promptHex: backend_1.a.string(),
        byPromptHex: backend_1.a.string(),
        // Visual
        thumbnail: backend_1.a.string(),
        difficulty: backend_1.a.string(),
        metadata: backend_1.a.string(),
        importedAt: backend_1.a.datetime(),
        // Embeddings
        embedding: EmbeddingInfo,
        // Moderation
        moderation: ModerationInfo,
        // Relationships
        questionUnits: backend_1.a.hasMany('QuestionUnit', ['questionID']),
        questionWords: backend_1.a.hasMany('QuestionWord', ['questionID']),
        questionFiles: backend_1.a.hasMany('QuestionFile', ['questionID']),
        documentQuestions: backend_1.a.hasMany('DocumentQuestion', ['questionID']),
    })
        .authorization(function (allow) { return [
        allow.owner(),
        allow.group('Learners').to(['read']),
        allow.group('Admins'),
    ]; }),
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
     */ File: backend_1.a
        .model({
        // Ownership - auto-populated by Cognito, controls Data model access
        owner: backend_1.a.string().required(),
        identityId: backend_1.a.string().required(), // Cognito Identity ID for protected/{identityId}/* paths
        // File metadata
        name: backend_1.a.string(),
        description: backend_1.a.string(),
        // Generation metadata - if generated by AI
        prompt: backend_1.a.string(),
        model: backend_1.a.string(),
        variant: backend_1.a.string(),
        // File details
        mimeType: backend_1.a.string(),
        level: FileProtectionLevels, // PUBLIC, PROTECTED, PRIVATE - determines S3 path prefix
        path: backend_1.a.string().required(), // Full S3 path (e.g., "public/units/file-123.json")
        size: backend_1.a.integer(),
        duration: backend_1.a.integer(),
        generated: backend_1.a.boolean(),
        hex: backend_1.a.string(),
        byHex: backend_1.a.string(),
        thumbnail: backend_1.a.string(),
        waveformData: backend_1.a.json(),
        // Relationships - enable querying files by associated model
        documentID: backend_1.a.id(),
        document: backend_1.a.belongsTo('Document', ['documentID']),
        unitFiles: backend_1.a.hasMany('UnitFile', ['fileID']),
        wordFiles: backend_1.a.hasMany('WordFile', ['fileID']),
        questionFiles: backend_1.a.hasMany('QuestionFile', ['fileID']),
        chatFiles: backend_1.a.hasMany('AssistantChatFile', ['fileID']),
        parsedContents: backend_1.a.hasMany('ParsedContent', ['fileID']),
        // Metadata for semantic search
        embedding: EmbeddingInfo,
    })
        .authorization(function (allow) { return [
        // Owner has full control
        allow.owner(),
        // Learners can read files (for embedded content, shared resources)
        allow.group('Learners').to(['read']),
        // Admins have full access
        allow.group('Admins'),
    ]; }),
    Word: backend_1.a
        .model({
        // Ownership
        owner: backend_1.a.string(),
        identityId: backend_1.a.string(),
        // Content
        phrase: backend_1.a.string(),
        pronunciation: backend_1.a.string(),
        definition: backend_1.a.string(),
        rubyTags: backend_1.a.string(),
        // Audio
        audio: backend_1.a.string().array(),
        waveformData: backend_1.a.json(),
        definitionAudio: backend_1.a.string().array(),
        definitionWaveformData: backend_1.a.json(),
        // Metadata
        importedAt: backend_1.a.datetime(),
        // Embeddings
        embedding: EmbeddingInfo,
        // Moderation
        moderation: ModerationInfo,
        // Relationships
        unitWords: backend_1.a.hasMany('UnitWord', ['wordID']),
        wordFiles: backend_1.a.hasMany('WordFile', ['wordID']),
        questionWords: backend_1.a.hasMany('QuestionWord', ['wordID']),
        documentWords: backend_1.a.hasMany('DocumentWord', ['wordID']),
    })
        .authorization(function (allow) { return [
        allow.owner(),
        allow.group('Learners').to(['read']),
        allow.group('Admins'),
    ]; }),
    // ========================================================================
    // JOIN TABLES (Explicit Many-to-Many)
    // ========================================================================
    UnitFile: backend_1.a
        .model({
        unitID: backend_1.a.id().required(),
        unit: backend_1.a.belongsTo('Unit', ['unitID']),
        fileID: backend_1.a.id().required(),
        file: backend_1.a.belongsTo('File', ['fileID']),
    })
        .authorization(function (allow) { return [allow.owner(), allow.group('Admins')]; }),
    UnitWord: backend_1.a
        .model({
        unitID: backend_1.a.id().required(),
        unit: backend_1.a.belongsTo('Unit', ['unitID']),
        wordID: backend_1.a.id().required(),
        word: backend_1.a.belongsTo('Word', ['wordID']),
    })
        .authorization(function (allow) { return [allow.owner(), allow.group('Admins')]; }),
    QuestionUnit: backend_1.a
        .model({
        questionID: backend_1.a.id().required(),
        question: backend_1.a.belongsTo('Question', ['questionID']),
        unitID: backend_1.a.id().required(),
        unit: backend_1.a.belongsTo('Unit', ['unitID']),
    })
        .authorization(function (allow) { return [allow.owner(), allow.group('Admins')]; }),
    UnitDocument: backend_1.a
        .model({
        unitID: backend_1.a.id().required(),
        unit: backend_1.a.belongsTo('Unit', ['unitID']),
        documentID: backend_1.a.id().required(),
        document: backend_1.a.belongsTo('Document', ['documentID']),
    })
        .authorization(function (allow) { return [allow.owner(), allow.group('Admins')]; }),
    QuestionFile: backend_1.a
        .model({
        questionID: backend_1.a.id().required(),
        question: backend_1.a.belongsTo('Question', ['questionID']),
        fileID: backend_1.a.id().required(),
        file: backend_1.a.belongsTo('File', ['fileID']),
    })
        .authorization(function (allow) { return [allow.owner(), allow.group('Admins')]; }),
    WordFile: backend_1.a
        .model({
        wordID: backend_1.a.id().required(),
        word: backend_1.a.belongsTo('Word', ['wordID']),
        fileID: backend_1.a.id().required(),
        file: backend_1.a.belongsTo('File', ['fileID']),
    })
        .authorization(function (allow) { return [allow.owner(), allow.group('Admins')]; }),
    QuestionWord: backend_1.a
        .model({
        questionID: backend_1.a.id().required(),
        question: backend_1.a.belongsTo('Question', ['questionID']),
        wordID: backend_1.a.id().required(),
        word: backend_1.a.belongsTo('Word', ['wordID']),
    })
        .authorization(function (allow) { return [allow.owner(), allow.group('Admins')]; }),
    DocumentWord: backend_1.a
        .model({
        documentID: backend_1.a.id().required(),
        document: backend_1.a.belongsTo('Document', ['documentID']),
        wordID: backend_1.a.id().required(),
        word: backend_1.a.belongsTo('Word', ['wordID']),
    })
        .authorization(function (allow) { return [allow.owner(), allow.group('Admins')]; }),
    DocumentQuestion: backend_1.a
        .model({
        documentID: backend_1.a.id().required(),
        document: backend_1.a.belongsTo('Document', ['documentID']),
        questionID: backend_1.a.id().required(),
        question: backend_1.a.belongsTo('Question', ['questionID']),
    })
        .authorization(function (allow) { return [allow.owner(), allow.group('Admins')]; }),
    AssistantChatFile: backend_1.a
        .model({
        chatID: backend_1.a.id().required(),
        chat: backend_1.a.belongsTo('AssistantChat', ['chatID']),
        fileID: backend_1.a.id().required(),
        file: backend_1.a.belongsTo('File', ['fileID']),
    })
        .authorization(function (allow) { return [allow.owner(), allow.group('Admins')]; }),
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
     */ Document: backend_1.a
        .model({
        // Ownership - auto-populated by Cognito, tracks document creator
        owner: backend_1.a.string().required(),
        identityId: backend_1.a.string(),
        learner: backend_1.a.string(), // Alternate learner reference
        // Section context - for section-based authorization
        sectionID: backend_1.a.id(), // Section this document is associated with (optional for backwards compatibility)
        // Dynamic group authorization - contains group names with read access to this document
        // Format: ['section-{sectionId}-instructors', 'section-{sectionId}-learners']
        readableGroups: backend_1.a.string().array(),
        // Dynamic group authorization - contains group names with write access to this document
        // Format: ['section-{sectionId}-instructors']
        writableGroups: backend_1.a.string().array(),
        // Document metadata
        filename: backend_1.a.string().required(),
        s3Key: backend_1.a.string().required(), // S3 path to original PDF
        status: backend_1.a.string().required(), // uploaded, extracting, extracted, analyzing, completed, failed, cancelled
        // Content
        extractedText: backend_1.a.string(), // Full text extracted from PDF
        pageCount: backend_1.a.integer(),
        fileSize: backend_1.a.integer(),
        mimeType: backend_1.a.string(),
        uploadedAt: backend_1.a.datetime(),
        // Processing State - for resuming long-running operations on timeout
        resumeState: backend_1.a.json(), // { lastProcessedPage, accumulatedPages, totalPages }
        // Note: pageEmbeddings kept in separate ParsedContent table to avoid item size limits
        // Relationships
        files: backend_1.a.hasMany('File', ['documentID']), // Metadata records for uploaded files
        parsedContent: backend_1.a.hasMany('ParsedContent', ['documentID']), // Extracted vocabulary, questions, summaries
        agentJobs: backend_1.a.hasMany('AgentJob', ['documentID']), // Track OpenAI API calls and costs
        unitDocuments: backend_1.a.hasMany('UnitDocument', ['documentID']), // Associate documents with curriculum units
        documentWords: backend_1.a.hasMany('DocumentWord', ['documentID']), // Extracted vocabulary from document
        documentQuestions: backend_1.a.hasMany('DocumentQuestion', ['documentID']), // Generated comprehension questions
        // Metadata
        metadata: backend_1.a.json(),
    })
        .authorization(function (allow) { return [
        // Document owner (student) can manage their documents
        allow.owner(),
        // Admins have full access
        allow.group('Admins'),
        // Dynamic group authorization: section instructors and learners can read
        // This enables collaborative document analysis within sections
        allow.groupsDefinedIn('readableGroups').to(['read']),
        // Dynamic group authorization: only instructors can update
        allow.groupsDefinedIn('writableGroups').to(['update']),
    ]; }),
    ParsedContent: backend_1.a
        .model({
        // Ownership
        owner: backend_1.a.string(),
        identityId: backend_1.a.string(),
        // Foreign keys
        documentID: backend_1.a.id().required(),
        document: backend_1.a.belongsTo('Document', ['documentID']),
        fileID: backend_1.a.id(),
        file: backend_1.a.belongsTo('File', ['fileID']),
        // Note: This model is referenced by File via parsedContentID for one-to-one relationship
        // Extracted content (as JSON for flexibility)
        vocabularyJSON: backend_1.a.json(), // [{word, definition, context, page}]
        summariesJSON: backend_1.a.json(), // [{title, content, page_range}]
        objectivesJSON: backend_1.a.json(), // [{objective, bloom_level}]
        conceptsJSON: backend_1.a.json(), // [{concept, description, related_vocabulary}]
        questionsJSON: backend_1.a.json(), // [{question, expectedAnswer, hint, type}]
        // API tracking
        responseId: backend_1.a.string(), // OpenAI response ID
        modelUsed: backend_1.a.string(),
        tokensUsed: backend_1.a.integer(),
        processingTime: backend_1.a.integer(),
        // Timestamps
        createdAt: backend_1.a.datetime(),
        importedAt: backend_1.a.datetime(),
        metadata: backend_1.a.json(),
    })
        .authorization(function (allow) { return [
        allow.owner(),
        allow.group('Learners').to(['read']),
        allow.group('Admins'),
    ]; }),
    AgentJob: backend_1.a
        .model({
        // Job tracking
        type: backend_1.a.string().required(), // pdf_analysis, exercise_generation, vocabulary_extraction
        status: backend_1.a.string().required(), // queued, processing, completed, failed, cancelled
        // Foreign keys
        documentID: backend_1.a.id(),
        document: backend_1.a.belongsTo('Document', ['documentID']),
        unitID: backend_1.a.id(),
        unit: backend_1.a.belongsTo('Unit', ['unitID']),
        // API tracking
        responseId: backend_1.a.string(),
        webhookData: backend_1.a.json(),
        error: backend_1.a.json(), // {message, code, stack, timestamp}
        // Processing details
        startedAt: backend_1.a.datetime(),
        completedAt: backend_1.a.datetime(),
        modelUsed: backend_1.a.string(),
        tokensUsed: backend_1.a.integer(),
        estimatedCost: backend_1.a.float(),
        retryCount: backend_1.a.integer(),
        metadata: backend_1.a.json(),
        identityId: backend_1.a.string(),
    })
        .authorization(function (allow) { return [
        allow.owner(),
        allow.group('Learners').to(['read']),
        allow.group('Admins'),
        allow.authenticated(),
    ]; }),
    // ========================================================================
    // CHAT & ASSISTANT MODELS
    // ========================================================================
    AssistantChat: backend_1.a
        .model({
        // Ownership
        owner: backend_1.a.string(),
        // Assistant configuration
        model: backend_1.a.string(),
        threadInstructions: backend_1.a.string(),
        additionalInstructions: backend_1.a.string(),
        threadId: backend_1.a.string(), // OpenAI thread ID
        moderationFlag: backend_1.a.boolean(),
        // Chat session
        messages: backend_1.a.json(), // Chat messages as JSON array
        draft: backend_1.a.string(), // Current draft message
        archived: backend_1.a.boolean(),
        // Usage tracking
        inputTokens: backend_1.a.string(),
        outputTokens: backend_1.a.string(),
        // Relationships
        chatFiles: backend_1.a.hasMany('AssistantChatFile', ['chatID']),
    })
        .authorization(function (allow) { return [
        allow.owner(),
        allow.group('Admins'),
    ]; }),
    // ========================================================================
    // USER & SETTINGS MODELS
    // ========================================================================
    Settings: backend_1.a
        .model({
        // Ownership
        owner: backend_1.a.string(),
        identityId: backend_1.a.string(),
        // Document analysis
        autoAnalyzeDocuments: backend_1.a.boolean(),
        documentAnalysisModel: backend_1.a.string(),
        // Editor
        editorTheme: backend_1.a.string(),
        editorFontSize: backend_1.a.integer(),
        // AI assistant
        defaultAIModel: backend_1.a.string(),
        assistantVoice: backend_1.a.string(),
        // Notifications
        emailNotifications: backend_1.a.boolean(),
        webhookNotifications: backend_1.a.boolean(),
        // Localization
        language: backend_1.a.string(),
        timezone: backend_1.a.string(),
        metadata: backend_1.a.json(),
        updatedAt: backend_1.a.datetime(),
    })
        .authorization(function (allow) { return [
        allow.owner(),
        allow.group('Admins'),
        allow.authenticated(),
    ]; }),
    AIFeedback: backend_1.a
        .model({
        // Ownership
        owner: backend_1.a.string(),
        identityId: backend_1.a.string(),
        // Content type
        contentType: AiContentType,
        feedbackType: AiFeedbackType,
        reasons: AiFeedbackReason,
        comment: backend_1.a.string(),
        // AI metadata
        model: backend_1.a.string(),
        prompt: backend_1.a.string(),
        generatedContent: backend_1.a.string(),
        // Context
        unitID: backend_1.a.id(),
        gradeID: backend_1.a.id(),
        documentID: backend_1.a.id(),
        messageId: backend_1.a.string(),
        sessionId: backend_1.a.string(),
        metadata: backend_1.a.json(),
        // Timestamps
        createdAt: backend_1.a.datetime().required(),
        updatedAt: backend_1.a.datetime().required(),
    })
        .authorization(function (allow) { return [
        allow.owner(),
        allow.group('Admins'),
        allow.authenticated(),
    ]; }),
    // ========================================================================
    // CUSTOM QUERIES & MUTATIONS (Phase D - Lambda Integration)
    // ========================================================================
    // OpenAI & Verification Queries
    verifyDefinition: backend_1.a
        .query()
        .arguments({
        phrase: backend_1.a.string().required(),
        expected: backend_1.a.string().required(),
        definition: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    verifyWord: backend_1.a
        .query()
        .arguments({
        word: backend_1.a.string().required(),
        expected: backend_1.a.string().required(),
        definition: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    verifyShortAnswer: backend_1.a
        .query()
        .arguments({
        expected: backend_1.a.string().required(),
        answer: backend_1.a.string().required(),
        prompt: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    transcribe: backend_1.a
        .query()
        .arguments({
        audio: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    verifyAudio: backend_1.a
        .query()
        .arguments({
        expected: backend_1.a.string().required(),
        audio: backend_1.a.string().required(),
        model: backend_1.a.string(),
        chatModel: backend_1.a.string().required(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    verifyAudioUrl: backend_1.a
        .query()
        .arguments({
        expected: backend_1.a.string().required(),
        audioUrl: backend_1.a.string().required(),
        model: backend_1.a.string().required(),
        chatModel: backend_1.a.string().required(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    transcribeUrl: backend_1.a
        .query()
        .arguments({
        audioUrl: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    processImage: backend_1.a
        .query()
        .arguments({
        image: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    processImageUrl: backend_1.a
        .query()
        .arguments({
        imageUrl: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    verifyImage: backend_1.a
        .query()
        .arguments({
        expected: backend_1.a.string().required(),
        image: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    verifyImageUrl: backend_1.a
        .query()
        .arguments({
        expected: backend_1.a.string().required(),
        imageUrl: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    // Chat & Content Mutations
    chat: backend_1.a
        .mutation()
        .arguments({
        messages: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    generateAudio: backend_1.a
        .mutation()
        .arguments({
        phrase: backend_1.a.string().required(),
        voice: backend_1.a.string(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    generateAudioFile: backend_1.a
        .mutation()
        .arguments({
        phrase: backend_1.a.string().required(),
        voice: backend_1.a.string().required(),
        model: backend_1.a.string().required(),
    })
        .returns(backend_1.a.ref('File'))
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    generateImage: backend_1.a
        .mutation()
        .arguments({
        phrase: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    generateImageFile: backend_1.a
        .mutation()
        .arguments({
        phrase: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.ref('File'))
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('openaiHandler')),
    // Document Analysis Mutations
    analyzeDocument: backend_1.a
        .mutation()
        .arguments({
        fileID: backend_1.a.id().required(),
    })
        .returns(backend_1.a.ref('AnalyzeDocumentResult'))
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('documentAnalysisHandler')),
    cancelDocumentAnalysis: backend_1.a
        .mutation()
        .arguments({
        fileID: backend_1.a.id().required(),
    })
        .returns(backend_1.a.ref('CancelDocumentAnalysisResult'))
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('documentAnalysisHandler')),
    // Embeddings Mutations
    generateEmbeddings: backend_1.a
        .mutation()
        .arguments({
        fileID: backend_1.a.id().required(),
    })
        .returns(backend_1.a.ref('GenerateEmbeddingsResult'))
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('embeddingsHandler')),
    generateEmbedding: backend_1.a
        .mutation()
        .arguments({
        content: backend_1.a.string().required(),
        model: backend_1.a.string(),
        dimensions: backend_1.a.integer(),
    })
        .returns(backend_1.a.ref('EmbeddingResult'))
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('embeddingsHandler')),
    // Content & AI Mutations
    contentCompletion: backend_1.a
        .mutation()
        .arguments({
        prompt: backend_1.a.string().required(),
        context: backend_1.a.json(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('aiHandler')),
    suggestBlocks: backend_1.a
        .mutation()
        .arguments({
        unitStructure: backend_1.a.json().required(),
        currentContext: backend_1.a.json(),
        userHistory: backend_1.a.json(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('aiHandler')),
    // Moderation Mutation
    moderateContent: backend_1.a
        .mutation()
        .arguments({
        content: backend_1.a.string().required(),
    })
        .returns(backend_1.a.ref('ModerationResult'))
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('moderationHandler')),
    // Unit Prediction Mutations
    predictUnitData: backend_1.a
        .mutation()
        .arguments({
        unitID: backend_1.a.id().required(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('aiHandler')),
    predictUnitByData: backend_1.a
        .mutation()
        .arguments({
        data: backend_1.a.string().required(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('aiHandler')),
    // Assistant Editor Mutations
    initAssistantEditor: backend_1.a
        .mutation()
        .arguments({
        model: backend_1.a.string().required(),
        additionalInstructions: backend_1.a.string().required(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('assistantHandler')),
    updateAssistantEditor: backend_1.a
        .mutation()
        .arguments({
        assistantId: backend_1.a.string().required(),
        additionalInstructions: backend_1.a.string().required(),
        model: backend_1.a.string(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('assistantHandler')),
    deleteAssistantEditor: backend_1.a
        .mutation()
        .arguments({
        assistantId: backend_1.a.string().required(),
        threadId: backend_1.a.string().required(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('assistantHandler')),
    useAssistantEditor: backend_1.a
        .mutation()
        .arguments({
        threadInstructions: backend_1.a.string().required(),
        assistantId: backend_1.a.string().required(),
        threadId: backend_1.a.string().required(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('assistantHandler')),
    chatAssistantThread: backend_1.a
        .mutation()
        .arguments({
        assistantId: backend_1.a.string().required(),
        messages: backend_1.a.string().required(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('assistantHandler')),
    // Section Management Mutations
    createSectionGroup: backend_1.a
        .mutation()
        .arguments({
        name: backend_1.a.string().required(),
        description: backend_1.a.string().required(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('sectionHandler')),
    addSelfToSection: backend_1.a
        .mutation()
        .arguments({
        code: backend_1.a.string().required(),
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('sectionHandler')),
    // Section Management Queries
    listSectionStudents: backend_1.a
        .query()
        .arguments({
        sectionCode: backend_1.a.string().required(),
    })
        .returns(backend_1.a.ref('StudentInfo').array())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function('sectionHandler')),
});
exports.data = (0, backend_1.defineData)({
    schema: schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});
