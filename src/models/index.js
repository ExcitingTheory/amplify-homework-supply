// @ts-check
import { initSchema } from 'aws-amplify/datastore';
import { schema } from './schema';

const PublishedStatus = {
  "DRAFT": "DRAFT",
  "PUBLISHED": "PUBLISHED",
  "ARCHIVED": "ARCHIVED"
};

const FileProtectionLevels = {
  "PUBLIC": "PUBLIC",
  "PRIVATE": "PRIVATE",
  "PROTECTED": "PROTECTED"
};

const AiFeedbackType = {
  "POSITIVE": "POSITIVE",
  "NEGATIVE": "NEGATIVE"
};

const AiFeedbackReason = {
  "INCORRECT": "INCORRECT",
  "INCOMPLETE": "INCOMPLETE",
  "INAPPROPRIATE": "INAPPROPRIATE",
  "NOT_HELPFUL": "NOT_HELPFUL",
  "IRRELEVANT": "IRRELEVANT",
  "POOR_QUALITY": "POOR_QUALITY",
  "OTHER": "OTHER"
};

const AiContentType = {
  "CHAT_MESSAGE": "CHAT_MESSAGE",
  "CONTENT_COMPLETION": "CONTENT_COMPLETION",
  "AUDIO_GENERATION": "AUDIO_GENERATION",
  "IMAGE_GENERATION": "IMAGE_GENERATION",
  "DOCUMENT_ANALYSIS": "DOCUMENT_ANALYSIS",
  "VOCABULARY_EXTRACTION": "VOCABULARY_EXTRACTION",
  "TRANSCRIPTION": "TRANSCRIPTION",
  "IMAGE_DESCRIPTION": "IMAGE_DESCRIPTION",
  "GRADING_FEEDBACK": "GRADING_FEEDBACK",
  "BLOCK_SUGGESTION": "BLOCK_SUGGESTION"
};

const { AssistantChat, Question, File, Section, Assignment, Grade, Unit, Word, Document, ParsedContent, AgentJob, Settings, AIFeedback, AssistantChatFile, QuestionUnit, QuestionWord, QuestionFile, DocumentQuestion, UnitFile, WordFile, UnitWord, UnitDocument, DocumentWord, EmbeddingResult, ModerationResult, AnalyzeDocumentResult, CancelDocumentAnalysisResult, GenerateEmbeddingsResult, StudentInfo, Choice, PageEmbedding } = initSchema(schema);

export {
  AssistantChat,
  Question,
  File,
  Section,
  Assignment,
  Grade,
  Unit,
  Word,
  Document,
  ParsedContent,
  AgentJob,
  Settings,
  AIFeedback,
  AssistantChatFile,
  QuestionUnit,
  QuestionWord,
  QuestionFile,
  DocumentQuestion,
  UnitFile,
  WordFile,
  UnitWord,
  UnitDocument,
  DocumentWord,
  PublishedStatus,
  FileProtectionLevels,
  AiFeedbackType,
  AiFeedbackReason,
  AiContentType,
  EmbeddingResult,
  ModerationResult,
  AnalyzeDocumentResult,
  CancelDocumentAnalysisResult,
  GenerateEmbeddingsResult,
  StudentInfo,
  Choice,
  PageEmbedding
};