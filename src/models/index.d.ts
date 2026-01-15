import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncCollection, AsyncItem } from "aws-amplify/datastore";

export enum PublishedStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED"
}

export enum FileProtectionLevels {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  PROTECTED = "PROTECTED"
}

export enum AiFeedbackType {
  POSITIVE = "POSITIVE",
  NEGATIVE = "NEGATIVE"
}

export enum AiFeedbackReason {
  INCORRECT = "INCORRECT",
  INCOMPLETE = "INCOMPLETE",
  INAPPROPRIATE = "INAPPROPRIATE",
  NOT_HELPFUL = "NOT_HELPFUL",
  IRRELEVANT = "IRRELEVANT",
  POOR_QUALITY = "POOR_QUALITY",
  OTHER = "OTHER"
}

export enum AiContentType {
  CHAT_MESSAGE = "CHAT_MESSAGE",
  CONTENT_COMPLETION = "CONTENT_COMPLETION",
  AUDIO_GENERATION = "AUDIO_GENERATION",
  IMAGE_GENERATION = "IMAGE_GENERATION",
  DOCUMENT_ANALYSIS = "DOCUMENT_ANALYSIS",
  VOCABULARY_EXTRACTION = "VOCABULARY_EXTRACTION",
  TRANSCRIPTION = "TRANSCRIPTION",
  IMAGE_DESCRIPTION = "IMAGE_DESCRIPTION",
  GRADING_FEEDBACK = "GRADING_FEEDBACK",
  BLOCK_SUGGESTION = "BLOCK_SUGGESTION"
}

type EagerEmbeddingResult = {
  readonly embedding: number[];
  readonly model: string;
  readonly dimensions: number;
  readonly tokenCount: number;
  readonly error?: string | null;
}

type LazyEmbeddingResult = {
  readonly embedding: number[];
  readonly model: string;
  readonly dimensions: number;
  readonly tokenCount: number;
  readonly error?: string | null;
}

export declare type EmbeddingResult = LazyLoading extends LazyLoadingDisabled ? EagerEmbeddingResult : LazyEmbeddingResult

export declare const EmbeddingResult: (new (init: ModelInit<EmbeddingResult>) => EmbeddingResult)

type EagerModerationResult = {
  readonly flagged: boolean;
  readonly categories: string;
  readonly categoryScores: string;
  readonly model: string;
  readonly error?: string | null;
}

type LazyModerationResult = {
  readonly flagged: boolean;
  readonly categories: string;
  readonly categoryScores: string;
  readonly model: string;
  readonly error?: string | null;
}

export declare type ModerationResult = LazyLoading extends LazyLoadingDisabled ? EagerModerationResult : LazyModerationResult

export declare const ModerationResult: (new (init: ModelInit<ModerationResult>) => ModerationResult)

type EagerAnalyzeDocumentResult = {
  readonly success: boolean;
  readonly fileID: string;
  readonly documentID?: string | null;
  readonly responseId?: string | null;
  readonly pageCount?: number | null;
  readonly progress?: string | null;
  readonly message?: string | null;
}

type LazyAnalyzeDocumentResult = {
  readonly success: boolean;
  readonly fileID: string;
  readonly documentID?: string | null;
  readonly responseId?: string | null;
  readonly pageCount?: number | null;
  readonly progress?: string | null;
  readonly message?: string | null;
}

export declare type AnalyzeDocumentResult = LazyLoading extends LazyLoadingDisabled ? EagerAnalyzeDocumentResult : LazyAnalyzeDocumentResult

export declare const AnalyzeDocumentResult: (new (init: ModelInit<AnalyzeDocumentResult>) => AnalyzeDocumentResult)

type EagerCancelDocumentAnalysisResult = {
  readonly success: boolean;
  readonly fileID: string;
  readonly documentID?: string | null;
  readonly message?: string | null;
}

type LazyCancelDocumentAnalysisResult = {
  readonly success: boolean;
  readonly fileID: string;
  readonly documentID?: string | null;
  readonly message?: string | null;
}

export declare type CancelDocumentAnalysisResult = LazyLoading extends LazyLoadingDisabled ? EagerCancelDocumentAnalysisResult : LazyCancelDocumentAnalysisResult

export declare const CancelDocumentAnalysisResult: (new (init: ModelInit<CancelDocumentAnalysisResult>) => CancelDocumentAnalysisResult)

type EagerGenerateEmbeddingsResult = {
  readonly success: boolean;
  readonly fileID: string;
  readonly documentID?: string | null;
  readonly embeddingCount?: number | null;
  readonly message?: string | null;
}

type LazyGenerateEmbeddingsResult = {
  readonly success: boolean;
  readonly fileID: string;
  readonly documentID?: string | null;
  readonly embeddingCount?: number | null;
  readonly message?: string | null;
}

export declare type GenerateEmbeddingsResult = LazyLoading extends LazyLoadingDisabled ? EagerGenerateEmbeddingsResult : LazyGenerateEmbeddingsResult

export declare const GenerateEmbeddingsResult: (new (init: ModelInit<GenerateEmbeddingsResult>) => GenerateEmbeddingsResult)

type EagerStudentInfo = {
  readonly id: string;
  readonly name?: string | null;
  readonly email?: string | null;
}

type LazyStudentInfo = {
  readonly id: string;
  readonly name?: string | null;
  readonly email?: string | null;
}

export declare type StudentInfo = LazyLoading extends LazyLoadingDisabled ? EagerStudentInfo : LazyStudentInfo

export declare const StudentInfo: (new (init: ModelInit<StudentInfo>) => StudentInfo)

type EagerChoice = {
  readonly choice?: string | null;
  readonly correct?: boolean | null;
}

type LazyChoice = {
  readonly choice?: string | null;
  readonly correct?: boolean | null;
}

export declare type Choice = LazyLoading extends LazyLoadingDisabled ? EagerChoice : LazyChoice

export declare const Choice: (new (init: ModelInit<Choice>) => Choice)

type EagerPageEmbedding = {
  readonly page: number;
  readonly embedding: number[];
  readonly text?: string | null;
}

type LazyPageEmbedding = {
  readonly page: number;
  readonly embedding: number[];
  readonly text?: string | null;
}

export declare type PageEmbedding = LazyLoading extends LazyLoadingDisabled ? EagerPageEmbedding : LazyPageEmbedding

export declare const PageEmbedding: (new (init: ModelInit<PageEmbedding>) => PageEmbedding)

type EagerAssistantChat = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AssistantChat, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly model?: string | null;
  readonly threadInstructions?: string | null;
  readonly additionalInstructions?: string | null;
  readonly threadId?: string | null;
  readonly moderationFlag?: boolean | null;
  readonly messages?: string | null;
  readonly draft?: string | null;
  readonly archived?: boolean | null;
  readonly inputTokens?: string | null;
  readonly outputTokens?: string | null;
  readonly files?: (AssistantChatFile | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyAssistantChat = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AssistantChat, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly model?: string | null;
  readonly threadInstructions?: string | null;
  readonly additionalInstructions?: string | null;
  readonly threadId?: string | null;
  readonly moderationFlag?: boolean | null;
  readonly messages?: string | null;
  readonly draft?: string | null;
  readonly archived?: boolean | null;
  readonly inputTokens?: string | null;
  readonly outputTokens?: string | null;
  readonly files: AsyncCollection<AssistantChatFile>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type AssistantChat = LazyLoading extends LazyLoadingDisabled ? EagerAssistantChat : LazyAssistantChat

export declare const AssistantChat: (new (init: ModelInit<AssistantChat>) => AssistantChat) & {
  copyOf(source: AssistantChat, mutator: (draft: MutableModel<AssistantChat>) => MutableModel<AssistantChat> | void): AssistantChat;
}

type EagerQuestion = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Question, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly answer?: string | null;
  readonly choices?: (Choice | null)[] | null;
  readonly hint?: string | null;
  readonly prompt?: string | null;
  readonly audio?: (string | null)[] | null;
  readonly audioWaveformData?: string | null;
  readonly answerAudio?: (string | null)[] | null;
  readonly answerAudioWaveformData?: string | null;
  readonly generated?: boolean | null;
  readonly model?: string | null;
  readonly promptHex?: string | null;
  readonly byPromptHex?: string | null;
  readonly thumbnail?: string | null;
  readonly difficulty?: string | null;
  readonly metadata?: string | null;
  readonly importedAt?: string | null;
  readonly embedding?: (number | null)[] | null;
  readonly embeddingModel?: string | null;
  readonly embeddingDimensions?: number | null;
  readonly embeddingVersion?: number | null;
  readonly embeddingWordCount?: number | null;
  readonly moderationStatus?: string | null;
  readonly moderationFlags?: string | null;
  readonly moderationCheckedAt?: string | null;
  readonly units?: (QuestionUnit | null)[] | null;
  readonly words?: (QuestionWord | null)[] | null;
  readonly files?: (QuestionFile | null)[] | null;
  readonly documents?: (DocumentQuestion | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyQuestion = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Question, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly answer?: string | null;
  readonly choices?: (Choice | null)[] | null;
  readonly hint?: string | null;
  readonly prompt?: string | null;
  readonly audio?: (string | null)[] | null;
  readonly audioWaveformData?: string | null;
  readonly answerAudio?: (string | null)[] | null;
  readonly answerAudioWaveformData?: string | null;
  readonly generated?: boolean | null;
  readonly model?: string | null;
  readonly promptHex?: string | null;
  readonly byPromptHex?: string | null;
  readonly thumbnail?: string | null;
  readonly difficulty?: string | null;
  readonly metadata?: string | null;
  readonly importedAt?: string | null;
  readonly embedding?: (number | null)[] | null;
  readonly embeddingModel?: string | null;
  readonly embeddingDimensions?: number | null;
  readonly embeddingVersion?: number | null;
  readonly embeddingWordCount?: number | null;
  readonly moderationStatus?: string | null;
  readonly moderationFlags?: string | null;
  readonly moderationCheckedAt?: string | null;
  readonly units: AsyncCollection<QuestionUnit>;
  readonly words: AsyncCollection<QuestionWord>;
  readonly files: AsyncCollection<QuestionFile>;
  readonly documents: AsyncCollection<DocumentQuestion>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Question = LazyLoading extends LazyLoadingDisabled ? EagerQuestion : LazyQuestion

export declare const Question: (new (init: ModelInit<Question>) => Question) & {
  copyOf(source: Question, mutator: (draft: MutableModel<Question>) => MutableModel<Question> | void): Question;
}

type EagerFile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<File, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name?: string | null;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly description?: string | null;
  readonly prompt?: string | null;
  readonly model?: string | null;
  readonly variant?: string | null;
  readonly mimeType?: string | null;
  readonly level?: FileProtectionLevels | keyof typeof FileProtectionLevels | null;
  readonly path?: string | null;
  readonly duration?: number | null;
  readonly size?: number | null;
  readonly generated?: boolean | null;
  readonly hex?: string | null;
  readonly byHex?: string | null;
  readonly thumbnail?: string | null;
  readonly waveformData?: string | null;
  readonly embedding?: (number | null)[] | null;
  readonly documentID?: string | null;
  readonly document?: Document | null;
  readonly parsedContentID?: string | null;
  readonly parsedContent?: ParsedContent | null;
  readonly units?: (UnitFile | null)[] | null;
  readonly words?: (WordFile | null)[] | null;
  readonly questions?: (QuestionFile | null)[] | null;
  readonly chats?: (AssistantChatFile | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyFile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<File, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name?: string | null;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly description?: string | null;
  readonly prompt?: string | null;
  readonly model?: string | null;
  readonly variant?: string | null;
  readonly mimeType?: string | null;
  readonly level?: FileProtectionLevels | keyof typeof FileProtectionLevels | null;
  readonly path?: string | null;
  readonly duration?: number | null;
  readonly size?: number | null;
  readonly generated?: boolean | null;
  readonly hex?: string | null;
  readonly byHex?: string | null;
  readonly thumbnail?: string | null;
  readonly waveformData?: string | null;
  readonly embedding?: (number | null)[] | null;
  readonly documentID?: string | null;
  readonly document: AsyncItem<Document | undefined>;
  readonly parsedContentID?: string | null;
  readonly parsedContent: AsyncItem<ParsedContent | undefined>;
  readonly units: AsyncCollection<UnitFile>;
  readonly words: AsyncCollection<WordFile>;
  readonly questions: AsyncCollection<QuestionFile>;
  readonly chats: AsyncCollection<AssistantChatFile>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type File = LazyLoading extends LazyLoadingDisabled ? EagerFile : LazyFile

export declare const File: (new (init: ModelInit<File>) => File) & {
  copyOf(source: File, mutator: (draft: MutableModel<File>) => MutableModel<File> | void): File;
}

type EagerSection = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Section, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name?: string | null;
  readonly owner?: string | null;
  readonly learner?: string | null;
  readonly description?: string | null;
  readonly status?: PublishedStatus | keyof typeof PublishedStatus | null;
  readonly code?: string | null;
  readonly assignments?: (Assignment | null)[] | null;
  readonly featuredImage?: string | null;
  readonly identityId?: string | null;
  readonly thumbnail?: string | null;
  readonly backgroundColor?: string | null;
  readonly embedding?: (number | null)[] | null;
  readonly embeddingModel?: string | null;
  readonly embeddingDimensions?: number | null;
  readonly embeddingVersion?: number | null;
  readonly embeddingWordCount?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazySection = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Section, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name?: string | null;
  readonly owner?: string | null;
  readonly learner?: string | null;
  readonly description?: string | null;
  readonly status?: PublishedStatus | keyof typeof PublishedStatus | null;
  readonly code?: string | null;
  readonly assignments: AsyncCollection<Assignment>;
  readonly featuredImage?: string | null;
  readonly identityId?: string | null;
  readonly thumbnail?: string | null;
  readonly backgroundColor?: string | null;
  readonly embedding?: (number | null)[] | null;
  readonly embeddingModel?: string | null;
  readonly embeddingDimensions?: number | null;
  readonly embeddingVersion?: number | null;
  readonly embeddingWordCount?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Section = LazyLoading extends LazyLoadingDisabled ? EagerSection : LazySection

export declare const Section: (new (init: ModelInit<Section>) => Section) & {
  copyOf(source: Section, mutator: (draft: MutableModel<Section>) => MutableModel<Section> | void): Section;
}

type EagerAssignment = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Assignment, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly dueDate?: string | null;
  readonly learner?: string | null;
  readonly owner?: string | null;
  readonly status?: PublishedStatus | keyof typeof PublishedStatus | null;
  readonly sectionID?: string | null;
  readonly unitID?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyAssignment = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Assignment, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly dueDate?: string | null;
  readonly learner?: string | null;
  readonly owner?: string | null;
  readonly status?: PublishedStatus | keyof typeof PublishedStatus | null;
  readonly sectionID?: string | null;
  readonly unitID?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Assignment = LazyLoading extends LazyLoadingDisabled ? EagerAssignment : LazyAssignment

export declare const Assignment: (new (init: ModelInit<Assignment>) => Assignment) & {
  copyOf(source: Assignment, mutator: (draft: MutableModel<Assignment>) => MutableModel<Assignment> | void): Assignment;
}

type EagerGrade = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Grade, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly percentComplete?: number | null;
  readonly accuracy?: number | null;
  readonly timerStarted?: boolean | null;
  readonly complete?: boolean | null;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly instructor?: string | null;
  readonly unitVersion?: number | null;
  readonly data?: string | null;
  readonly feedback?: string | null;
  readonly files?: (string | null)[] | null;
  readonly unitID?: string | null;
  readonly moderationStatus?: string | null;
  readonly moderationFlags?: string | null;
  readonly moderationCheckedAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyGrade = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Grade, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly percentComplete?: number | null;
  readonly accuracy?: number | null;
  readonly timerStarted?: boolean | null;
  readonly complete?: boolean | null;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly instructor?: string | null;
  readonly unitVersion?: number | null;
  readonly data?: string | null;
  readonly feedback?: string | null;
  readonly files?: (string | null)[] | null;
  readonly unitID?: string | null;
  readonly moderationStatus?: string | null;
  readonly moderationFlags?: string | null;
  readonly moderationCheckedAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Grade = LazyLoading extends LazyLoadingDisabled ? EagerGrade : LazyGrade

export declare const Grade: (new (init: ModelInit<Grade>) => Grade) & {
  copyOf(source: Grade, mutator: (draft: MutableModel<Grade>) => MutableModel<Grade> | void): Grade;
}

type EagerUnit = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Unit, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly number?: number | null;
  readonly name?: string | null;
  readonly owner?: string | null;
  readonly description?: string | null;
  readonly data?: string | null;
  readonly status?: PublishedStatus | keyof typeof PublishedStatus | null;
  readonly timeLimitSeconds?: number | null;
  readonly assignments?: (Assignment | null)[] | null;
  readonly grades?: (Grade | null)[] | null;
  readonly featuredImage?: string | null;
  readonly identityId?: string | null;
  readonly thumbnail?: string | null;
  readonly embedding?: (number | null)[] | null;
  readonly embeddingModel?: string | null;
  readonly embeddingDimensions?: number | null;
  readonly embeddingVersion?: number | null;
  readonly embeddingWordCount?: number | null;
  readonly publishedAt?: number | null;
  readonly isDraft?: boolean | null;
  readonly files?: (UnitFile | null)[] | null;
  readonly words?: (UnitWord | null)[] | null;
  readonly questions?: (QuestionUnit | null)[] | null;
  readonly documents?: (UnitDocument | null)[] | null;
  readonly agentJobs?: (AgentJob | null)[] | null;
  readonly moderationStatus?: string | null;
  readonly moderationFlags?: string | null;
  readonly moderationCheckedAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUnit = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Unit, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly number?: number | null;
  readonly name?: string | null;
  readonly owner?: string | null;
  readonly description?: string | null;
  readonly data?: string | null;
  readonly status?: PublishedStatus | keyof typeof PublishedStatus | null;
  readonly timeLimitSeconds?: number | null;
  readonly assignments: AsyncCollection<Assignment>;
  readonly grades: AsyncCollection<Grade>;
  readonly featuredImage?: string | null;
  readonly identityId?: string | null;
  readonly thumbnail?: string | null;
  readonly embedding?: (number | null)[] | null;
  readonly embeddingModel?: string | null;
  readonly embeddingDimensions?: number | null;
  readonly embeddingVersion?: number | null;
  readonly embeddingWordCount?: number | null;
  readonly publishedAt?: number | null;
  readonly isDraft?: boolean | null;
  readonly files: AsyncCollection<UnitFile>;
  readonly words: AsyncCollection<UnitWord>;
  readonly questions: AsyncCollection<QuestionUnit>;
  readonly documents: AsyncCollection<UnitDocument>;
  readonly agentJobs: AsyncCollection<AgentJob>;
  readonly moderationStatus?: string | null;
  readonly moderationFlags?: string | null;
  readonly moderationCheckedAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Unit = LazyLoading extends LazyLoadingDisabled ? EagerUnit : LazyUnit

export declare const Unit: (new (init: ModelInit<Unit>) => Unit) & {
  copyOf(source: Unit, mutator: (draft: MutableModel<Unit>) => MutableModel<Unit> | void): Unit;
}

type EagerWord = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Word, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly phrase?: string | null;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly pronunciation?: string | null;
  readonly definition?: string | null;
  readonly audio?: (string | null)[] | null;
  readonly waveformData?: string | null;
  readonly definitionAudio?: (string | null)[] | null;
  readonly definitionWaveformData?: string | null;
  readonly rubyTags?: string | null;
  readonly importedAt?: string | null;
  readonly embedding?: (number | null)[] | null;
  readonly embeddingModel?: string | null;
  readonly embeddingDimensions?: number | null;
  readonly embeddingVersion?: number | null;
  readonly embeddingWordCount?: number | null;
  readonly units?: (UnitWord | null)[] | null;
  readonly files?: (WordFile | null)[] | null;
  readonly questions?: (QuestionWord | null)[] | null;
  readonly documents?: (DocumentWord | null)[] | null;
  readonly moderationStatus?: string | null;
  readonly moderationFlags?: string | null;
  readonly moderationCheckedAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyWord = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Word, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly phrase?: string | null;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly pronunciation?: string | null;
  readonly definition?: string | null;
  readonly audio?: (string | null)[] | null;
  readonly waveformData?: string | null;
  readonly definitionAudio?: (string | null)[] | null;
  readonly definitionWaveformData?: string | null;
  readonly rubyTags?: string | null;
  readonly importedAt?: string | null;
  readonly embedding?: (number | null)[] | null;
  readonly embeddingModel?: string | null;
  readonly embeddingDimensions?: number | null;
  readonly embeddingVersion?: number | null;
  readonly embeddingWordCount?: number | null;
  readonly units: AsyncCollection<UnitWord>;
  readonly files: AsyncCollection<WordFile>;
  readonly questions: AsyncCollection<QuestionWord>;
  readonly documents: AsyncCollection<DocumentWord>;
  readonly moderationStatus?: string | null;
  readonly moderationFlags?: string | null;
  readonly moderationCheckedAt?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Word = LazyLoading extends LazyLoadingDisabled ? EagerWord : LazyWord

export declare const Word: (new (init: ModelInit<Word>) => Word) & {
  copyOf(source: Word, mutator: (draft: MutableModel<Word>) => MutableModel<Word> | void): Word;
}

type EagerDocument = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Document, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly filename: string;
  readonly s3Key: string;
  readonly status: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly learner?: string | null;
  readonly extractedText?: string | null;
  readonly pageCount?: number | null;
  readonly fileSize?: number | null;
  readonly mimeType?: string | null;
  readonly uploadedAt?: string | null;
  readonly resumeState?: string | null;
  readonly pageEmbeddings?: (PageEmbedding | null)[] | null;
  readonly embeddingsS3Key?: string | null;
  readonly parsedContent?: (ParsedContent | null)[] | null;
  readonly agentJobs?: (AgentJob | null)[] | null;
  readonly metadata?: string | null;
  readonly units?: (UnitDocument | null)[] | null;
  readonly words?: (DocumentWord | null)[] | null;
  readonly questions?: (DocumentQuestion | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyDocument = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Document, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly filename: string;
  readonly s3Key: string;
  readonly status: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly learner?: string | null;
  readonly extractedText?: string | null;
  readonly pageCount?: number | null;
  readonly fileSize?: number | null;
  readonly mimeType?: string | null;
  readonly uploadedAt?: string | null;
  readonly resumeState?: string | null;
  readonly pageEmbeddings?: (PageEmbedding | null)[] | null;
  readonly embeddingsS3Key?: string | null;
  readonly parsedContent: AsyncCollection<ParsedContent>;
  readonly agentJobs: AsyncCollection<AgentJob>;
  readonly metadata?: string | null;
  readonly units: AsyncCollection<UnitDocument>;
  readonly words: AsyncCollection<DocumentWord>;
  readonly questions: AsyncCollection<DocumentQuestion>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Document = LazyLoading extends LazyLoadingDisabled ? EagerDocument : LazyDocument

export declare const Document: (new (init: ModelInit<Document>) => Document) & {
  copyOf(source: Document, mutator: (draft: MutableModel<Document>) => MutableModel<Document> | void): Document;
}

type EagerParsedContent = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ParsedContent, 'id'>;
    readOnlyFields: 'updatedAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly documentID: string;
  readonly document?: Document | null;
  readonly fileID?: string | null;
  readonly file?: File | null;
  readonly vocabularyJSON?: string | null;
  readonly summariesJSON?: string | null;
  readonly objectivesJSON?: string | null;
  readonly conceptsJSON?: string | null;
  readonly questionsJSON?: string | null;
  readonly responseId?: string | null;
  readonly modelUsed?: string | null;
  readonly tokensUsed?: number | null;
  readonly processingTime?: number | null;
  readonly createdAt?: string | null;
  readonly importedAt?: string | null;
  readonly metadata?: string | null;
  readonly updatedAt?: string | null;
}

type LazyParsedContent = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ParsedContent, 'id'>;
    readOnlyFields: 'updatedAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly documentID: string;
  readonly document: AsyncItem<Document | undefined>;
  readonly fileID?: string | null;
  readonly file: AsyncItem<File | undefined>;
  readonly vocabularyJSON?: string | null;
  readonly summariesJSON?: string | null;
  readonly objectivesJSON?: string | null;
  readonly conceptsJSON?: string | null;
  readonly questionsJSON?: string | null;
  readonly responseId?: string | null;
  readonly modelUsed?: string | null;
  readonly tokensUsed?: number | null;
  readonly processingTime?: number | null;
  readonly createdAt?: string | null;
  readonly importedAt?: string | null;
  readonly metadata?: string | null;
  readonly updatedAt?: string | null;
}

export declare type ParsedContent = LazyLoading extends LazyLoadingDisabled ? EagerParsedContent : LazyParsedContent

export declare const ParsedContent: (new (init: ModelInit<ParsedContent>) => ParsedContent) & {
  copyOf(source: ParsedContent, mutator: (draft: MutableModel<ParsedContent>) => MutableModel<ParsedContent> | void): ParsedContent;
}

type EagerAgentJob = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AgentJob, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly type: string;
  readonly status: string;
  readonly documentID?: string | null;
  readonly document?: Document | null;
  readonly unitID?: string | null;
  readonly unit?: Unit | null;
  readonly responseId?: string | null;
  readonly webhookData?: string | null;
  readonly error?: string | null;
  readonly startedAt?: string | null;
  readonly completedAt?: string | null;
  readonly modelUsed?: string | null;
  readonly tokensUsed?: number | null;
  readonly estimatedCost?: number | null;
  readonly retryCount?: number | null;
  readonly metadata?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyAgentJob = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AgentJob, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly type: string;
  readonly status: string;
  readonly documentID?: string | null;
  readonly document: AsyncItem<Document | undefined>;
  readonly unitID?: string | null;
  readonly unit: AsyncItem<Unit | undefined>;
  readonly responseId?: string | null;
  readonly webhookData?: string | null;
  readonly error?: string | null;
  readonly startedAt?: string | null;
  readonly completedAt?: string | null;
  readonly modelUsed?: string | null;
  readonly tokensUsed?: number | null;
  readonly estimatedCost?: number | null;
  readonly retryCount?: number | null;
  readonly metadata?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type AgentJob = LazyLoading extends LazyLoadingDisabled ? EagerAgentJob : LazyAgentJob

export declare const AgentJob: (new (init: ModelInit<AgentJob>) => AgentJob) & {
  copyOf(source: AgentJob, mutator: (draft: MutableModel<AgentJob>) => MutableModel<AgentJob> | void): AgentJob;
}

type EagerSettings = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Settings, 'id'>;
    readOnlyFields: 'createdAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly autoAnalyzeDocuments?: boolean | null;
  readonly documentAnalysisModel?: string | null;
  readonly editorTheme?: string | null;
  readonly editorFontSize?: number | null;
  readonly defaultAIModel?: string | null;
  readonly assistantVoice?: string | null;
  readonly emailNotifications?: boolean | null;
  readonly webhookNotifications?: boolean | null;
  readonly language?: string | null;
  readonly timezone?: string | null;
  readonly metadata?: string | null;
  readonly updatedAt?: string | null;
  readonly createdAt?: string | null;
}

type LazySettings = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Settings, 'id'>;
    readOnlyFields: 'createdAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly autoAnalyzeDocuments?: boolean | null;
  readonly documentAnalysisModel?: string | null;
  readonly editorTheme?: string | null;
  readonly editorFontSize?: number | null;
  readonly defaultAIModel?: string | null;
  readonly assistantVoice?: string | null;
  readonly emailNotifications?: boolean | null;
  readonly webhookNotifications?: boolean | null;
  readonly language?: string | null;
  readonly timezone?: string | null;
  readonly metadata?: string | null;
  readonly updatedAt?: string | null;
  readonly createdAt?: string | null;
}

export declare type Settings = LazyLoading extends LazyLoadingDisabled ? EagerSettings : LazySettings

export declare const Settings: (new (init: ModelInit<Settings>) => Settings) & {
  copyOf(source: Settings, mutator: (draft: MutableModel<Settings>) => MutableModel<Settings> | void): Settings;
}

type EagerAIFeedback = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AIFeedback, 'id'>;
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly contentType: AiContentType | keyof typeof AiContentType;
  readonly feedbackType: AiFeedbackType | keyof typeof AiFeedbackType;
  readonly reasons?: (AiFeedbackReason | null)[] | Array<keyof typeof AiFeedbackReason> | null;
  readonly comment?: string | null;
  readonly model?: string | null;
  readonly prompt?: string | null;
  readonly generatedContent?: string | null;
  readonly unitID?: string | null;
  readonly gradeID?: string | null;
  readonly documentID?: string | null;
  readonly messageId?: string | null;
  readonly sessionId?: string | null;
  readonly metadata?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type LazyAIFeedback = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AIFeedback, 'id'>;
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly identityId?: string | null;
  readonly contentType: AiContentType | keyof typeof AiContentType;
  readonly feedbackType: AiFeedbackType | keyof typeof AiFeedbackType;
  readonly reasons?: (AiFeedbackReason | null)[] | Array<keyof typeof AiFeedbackReason> | null;
  readonly comment?: string | null;
  readonly model?: string | null;
  readonly prompt?: string | null;
  readonly generatedContent?: string | null;
  readonly unitID?: string | null;
  readonly gradeID?: string | null;
  readonly documentID?: string | null;
  readonly messageId?: string | null;
  readonly sessionId?: string | null;
  readonly metadata?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export declare type AIFeedback = LazyLoading extends LazyLoadingDisabled ? EagerAIFeedback : LazyAIFeedback

export declare const AIFeedback: (new (init: ModelInit<AIFeedback>) => AIFeedback) & {
  copyOf(source: AIFeedback, mutator: (draft: MutableModel<AIFeedback>) => MutableModel<AIFeedback> | void): AIFeedback;
}

type EagerAssistantChatFile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AssistantChatFile, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly assistantChatId?: string | null;
  readonly fileId?: string | null;
  readonly assistantChat: AssistantChat;
  readonly file: File;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyAssistantChatFile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AssistantChatFile, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly assistantChatId?: string | null;
  readonly fileId?: string | null;
  readonly assistantChat: AsyncItem<AssistantChat>;
  readonly file: AsyncItem<File>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type AssistantChatFile = LazyLoading extends LazyLoadingDisabled ? EagerAssistantChatFile : LazyAssistantChatFile

export declare const AssistantChatFile: (new (init: ModelInit<AssistantChatFile>) => AssistantChatFile) & {
  copyOf(source: AssistantChatFile, mutator: (draft: MutableModel<AssistantChatFile>) => MutableModel<AssistantChatFile> | void): AssistantChatFile;
}

type EagerQuestionUnit = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<QuestionUnit, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly questionId?: string | null;
  readonly unitId?: string | null;
  readonly question: Question;
  readonly unit: Unit;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyQuestionUnit = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<QuestionUnit, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly questionId?: string | null;
  readonly unitId?: string | null;
  readonly question: AsyncItem<Question>;
  readonly unit: AsyncItem<Unit>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type QuestionUnit = LazyLoading extends LazyLoadingDisabled ? EagerQuestionUnit : LazyQuestionUnit

export declare const QuestionUnit: (new (init: ModelInit<QuestionUnit>) => QuestionUnit) & {
  copyOf(source: QuestionUnit, mutator: (draft: MutableModel<QuestionUnit>) => MutableModel<QuestionUnit> | void): QuestionUnit;
}

type EagerQuestionWord = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<QuestionWord, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly questionId?: string | null;
  readonly wordId?: string | null;
  readonly question: Question;
  readonly word: Word;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyQuestionWord = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<QuestionWord, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly questionId?: string | null;
  readonly wordId?: string | null;
  readonly question: AsyncItem<Question>;
  readonly word: AsyncItem<Word>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type QuestionWord = LazyLoading extends LazyLoadingDisabled ? EagerQuestionWord : LazyQuestionWord

export declare const QuestionWord: (new (init: ModelInit<QuestionWord>) => QuestionWord) & {
  copyOf(source: QuestionWord, mutator: (draft: MutableModel<QuestionWord>) => MutableModel<QuestionWord> | void): QuestionWord;
}

type EagerQuestionFile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<QuestionFile, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly questionId?: string | null;
  readonly fileId?: string | null;
  readonly question: Question;
  readonly file: File;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyQuestionFile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<QuestionFile, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly questionId?: string | null;
  readonly fileId?: string | null;
  readonly question: AsyncItem<Question>;
  readonly file: AsyncItem<File>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type QuestionFile = LazyLoading extends LazyLoadingDisabled ? EagerQuestionFile : LazyQuestionFile

export declare const QuestionFile: (new (init: ModelInit<QuestionFile>) => QuestionFile) & {
  copyOf(source: QuestionFile, mutator: (draft: MutableModel<QuestionFile>) => MutableModel<QuestionFile> | void): QuestionFile;
}

type EagerDocumentQuestion = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<DocumentQuestion, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly questionId?: string | null;
  readonly documentId?: string | null;
  readonly question: Question;
  readonly document: Document;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyDocumentQuestion = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<DocumentQuestion, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly questionId?: string | null;
  readonly documentId?: string | null;
  readonly question: AsyncItem<Question>;
  readonly document: AsyncItem<Document>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type DocumentQuestion = LazyLoading extends LazyLoadingDisabled ? EagerDocumentQuestion : LazyDocumentQuestion

export declare const DocumentQuestion: (new (init: ModelInit<DocumentQuestion>) => DocumentQuestion) & {
  copyOf(source: DocumentQuestion, mutator: (draft: MutableModel<DocumentQuestion>) => MutableModel<DocumentQuestion> | void): DocumentQuestion;
}

type EagerUnitFile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UnitFile, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly fileId?: string | null;
  readonly unitId?: string | null;
  readonly file: File;
  readonly unit: Unit;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUnitFile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UnitFile, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly fileId?: string | null;
  readonly unitId?: string | null;
  readonly file: AsyncItem<File>;
  readonly unit: AsyncItem<Unit>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UnitFile = LazyLoading extends LazyLoadingDisabled ? EagerUnitFile : LazyUnitFile

export declare const UnitFile: (new (init: ModelInit<UnitFile>) => UnitFile) & {
  copyOf(source: UnitFile, mutator: (draft: MutableModel<UnitFile>) => MutableModel<UnitFile> | void): UnitFile;
}

type EagerWordFile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<WordFile, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly fileId?: string | null;
  readonly wordId?: string | null;
  readonly file: File;
  readonly word: Word;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyWordFile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<WordFile, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly fileId?: string | null;
  readonly wordId?: string | null;
  readonly file: AsyncItem<File>;
  readonly word: AsyncItem<Word>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type WordFile = LazyLoading extends LazyLoadingDisabled ? EagerWordFile : LazyWordFile

export declare const WordFile: (new (init: ModelInit<WordFile>) => WordFile) & {
  copyOf(source: WordFile, mutator: (draft: MutableModel<WordFile>) => MutableModel<WordFile> | void): WordFile;
}

type EagerUnitWord = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UnitWord, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly unitId?: string | null;
  readonly wordId?: string | null;
  readonly unit: Unit;
  readonly word: Word;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUnitWord = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UnitWord, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly unitId?: string | null;
  readonly wordId?: string | null;
  readonly unit: AsyncItem<Unit>;
  readonly word: AsyncItem<Word>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UnitWord = LazyLoading extends LazyLoadingDisabled ? EagerUnitWord : LazyUnitWord

export declare const UnitWord: (new (init: ModelInit<UnitWord>) => UnitWord) & {
  copyOf(source: UnitWord, mutator: (draft: MutableModel<UnitWord>) => MutableModel<UnitWord> | void): UnitWord;
}

type EagerUnitDocument = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UnitDocument, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly unitId?: string | null;
  readonly documentId?: string | null;
  readonly unit: Unit;
  readonly document: Document;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUnitDocument = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UnitDocument, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly unitId?: string | null;
  readonly documentId?: string | null;
  readonly unit: AsyncItem<Unit>;
  readonly document: AsyncItem<Document>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UnitDocument = LazyLoading extends LazyLoadingDisabled ? EagerUnitDocument : LazyUnitDocument

export declare const UnitDocument: (new (init: ModelInit<UnitDocument>) => UnitDocument) & {
  copyOf(source: UnitDocument, mutator: (draft: MutableModel<UnitDocument>) => MutableModel<UnitDocument> | void): UnitDocument;
}

type EagerDocumentWord = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<DocumentWord, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly wordId?: string | null;
  readonly documentId?: string | null;
  readonly word: Word;
  readonly document: Document;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyDocumentWord = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<DocumentWord, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly wordId?: string | null;
  readonly documentId?: string | null;
  readonly word: AsyncItem<Word>;
  readonly document: AsyncItem<Document>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type DocumentWord = LazyLoading extends LazyLoadingDisabled ? EagerDocumentWord : LazyDocumentWord

export declare const DocumentWord: (new (init: ModelInit<DocumentWord>) => DocumentWord) & {
  copyOf(source: DocumentWord, mutator: (draft: MutableModel<DocumentWord>) => MutableModel<DocumentWord> | void): DocumentWord;
}