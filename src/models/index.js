// @ts-check
import { initSchema } from '@aws-amplify/datastore';
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

const { Assistant, Question, File, ChatHistory, Section, Assignment, Grade, Unit, Word, Document, ParsedContent, AgentJob, Settings, QuestionUnit, QuestionWord, QuestionFile, DocumentQuestion, UnitFile, WordFile, UnitWord, UnitDocument, DocumentWord, EmbeddingResult, AnalyzeDocumentResult, CancelDocumentAnalysisResult, GenerateEmbeddingsResult, StudentInfo, Choice, PageEmbedding } = initSchema(schema);

export {
  Assistant,
  Question,
  File,
  ChatHistory,
  Section,
  Assignment,
  Grade,
  Unit,
  Word,
  Document,
  ParsedContent,
  AgentJob,
  Settings,
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
  EmbeddingResult,
  AnalyzeDocumentResult,
  CancelDocumentAnalysisResult,
  GenerateEmbeddingsResult,
  StudentInfo,
  Choice,
  PageEmbedding
};