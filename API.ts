/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type AIFeedback = {
  __typename: "AIFeedback",
  comment?: string | null,
  contentType?: AIFeedbackContentType | null,
  createdAt: string,
  documentID?: string | null,
  feedbackType?: AIFeedbackFeedbackType | null,
  generatedContent?: string | null,
  gradeID?: string | null,
  id: string,
  identityId?: string | null,
  messageId?: string | null,
  metadata?: string | null,
  model?: string | null,
  owner?: string | null,
  prompt?: string | null,
  reasons?: AIFeedbackReasons | null,
  sessionId?: string | null,
  unitID?: string | null,
  updatedAt: string,
};

export enum AIFeedbackContentType {
  AUDIO_GENERATION = "AUDIO_GENERATION",
  BLOCK_SUGGESTION = "BLOCK_SUGGESTION",
  CHAT_MESSAGE = "CHAT_MESSAGE",
  CONTENT_COMPLETION = "CONTENT_COMPLETION",
  DOCUMENT_ANALYSIS = "DOCUMENT_ANALYSIS",
  GRADING_FEEDBACK = "GRADING_FEEDBACK",
  IMAGE_DESCRIPTION = "IMAGE_DESCRIPTION",
  IMAGE_GENERATION = "IMAGE_GENERATION",
  TRANSCRIPTION = "TRANSCRIPTION",
  VOCABULARY_EXTRACTION = "VOCABULARY_EXTRACTION",
}


export enum AIFeedbackFeedbackType {
  NEGATIVE = "NEGATIVE",
  POSITIVE = "POSITIVE",
}


export enum AIFeedbackReasons {
  INAPPROPRIATE = "INAPPROPRIATE",
  INCOMPLETE = "INCOMPLETE",
  INCORRECT = "INCORRECT",
  IRRELEVANT = "IRRELEVANT",
  NOT_HELPFUL = "NOT_HELPFUL",
  OTHER = "OTHER",
  POOR_QUALITY = "POOR_QUALITY",
}


export type AgentJob = {
  __typename: "AgentJob",
  completedAt?: string | null,
  createdAt: string,
  document?: Document | null,
  documentID?: string | null,
  error?: string | null,
  estimatedCost?: number | null,
  id: string,
  identityId?: string | null,
  metadata?: string | null,
  modelUsed?: string | null,
  owner?: string | null,
  responseId?: string | null,
  retryCount?: number | null,
  startedAt?: string | null,
  status: string,
  tokensUsed?: number | null,
  type: string,
  unit?: Unit | null,
  unitID?: string | null,
  updatedAt: string,
  webhookData?: string | null,
};

export type Document = {
  __typename: "Document",
  agentJobs?: ModelAgentJobConnection | null,
  createdAt: string,
  documentQuestions?: ModelDocumentQuestionConnection | null,
  documentWords?: ModelDocumentWordConnection | null,
  extractedText?: string | null,
  fileSize?: number | null,
  filename: string,
  files?: ModelFileConnection | null,
  id: string,
  identityId?: string | null,
  learner?: string | null,
  metadata?: string | null,
  mimeType?: string | null,
  owner?: string | null,
  pageCount?: number | null,
  parsedContent?: ModelParsedContentConnection | null,
  readableGroups?: Array< string | null > | null,
  resumeState?: string | null,
  s3Key: string,
  sectionID?: string | null,
  status: string,
  unitDocuments?: ModelUnitDocumentConnection | null,
  updatedAt: string,
  uploadedAt?: string | null,
  writableGroups?: Array< string | null > | null,
  yjsSnapshot?: string | null,
};

export type ModelAgentJobConnection = {
  __typename: "ModelAgentJobConnection",
  items:  Array<AgentJob | null >,
  nextToken?: string | null,
};

export type ModelDocumentQuestionConnection = {
  __typename: "ModelDocumentQuestionConnection",
  items:  Array<DocumentQuestion | null >,
  nextToken?: string | null,
};

export type DocumentQuestion = {
  __typename: "DocumentQuestion",
  createdAt: string,
  document?: Document | null,
  documentID: string,
  id: string,
  owner?: string | null,
  question?: Question | null,
  questionID: string,
  updatedAt: string,
};

export type Question = {
  __typename: "Question",
  answer?: string | null,
  answerAudio?: Array< string | null > | null,
  answerAudioWaveformData?: string | null,
  audio?: Array< string | null > | null,
  audioWaveformData?: string | null,
  byPromptHex?: string | null,
  choices?: string | null,
  createdAt: string,
  difficulty?: string | null,
  documentQuestions?: ModelDocumentQuestionConnection | null,
  embedding?: QuestionEmbedding | null,
  generated?: boolean | null,
  hint?: string | null,
  id: string,
  identityId?: string | null,
  importedAt?: string | null,
  metadata?: string | null,
  model?: string | null,
  moderation?: QuestionModeration | null,
  owner?: string | null,
  prompt?: string | null,
  promptHex?: string | null,
  questionFiles?: ModelQuestionFileConnection | null,
  questionUnits?: ModelQuestionUnitConnection | null,
  questionWords?: ModelQuestionWordConnection | null,
  thumbnail?: string | null,
  updatedAt: string,
  yjsSnapshot?: string | null,
};

export type QuestionEmbedding = {
  __typename: "QuestionEmbedding",
  dimensions?: number | null,
  embedding?: string | null,
  model?: string | null,
  version?: number | null,
  wordCount?: number | null,
};

export type QuestionModeration = {
  __typename: "QuestionModeration",
  checkedAt?: string | null,
  flags?: string | null,
  status?: string | null,
};

export type ModelQuestionFileConnection = {
  __typename: "ModelQuestionFileConnection",
  items:  Array<QuestionFile | null >,
  nextToken?: string | null,
};

export type QuestionFile = {
  __typename: "QuestionFile",
  createdAt: string,
  file?: File | null,
  fileID: string,
  id: string,
  owner?: string | null,
  question?: Question | null,
  questionID: string,
  updatedAt: string,
};

export type File = {
  __typename: "File",
  byHex?: string | null,
  chatFiles?: ModelAssistantChatFileConnection | null,
  createdAt: string,
  description?: string | null,
  document?: Document | null,
  documentID?: string | null,
  duration?: number | null,
  embedding?: FileEmbedding | null,
  generated?: boolean | null,
  hex?: string | null,
  id: string,
  identityId: string,
  level?: FileLevel | null,
  mimeType?: string | null,
  model?: string | null,
  name?: string | null,
  owner: string,
  parsedContent?: ModelParsedContentConnection | null,
  path: string,
  prompt?: string | null,
  questionFiles?: ModelQuestionFileConnection | null,
  size?: number | null,
  thumbnail?: string | null,
  unitFiles?: ModelUnitFileConnection | null,
  updatedAt: string,
  variant?: string | null,
  waveformData?: string | null,
  wordFiles?: ModelWordFileConnection | null,
  yjsSnapshot?: string | null,
};

export type ModelAssistantChatFileConnection = {
  __typename: "ModelAssistantChatFileConnection",
  items:  Array<AssistantChatFile | null >,
  nextToken?: string | null,
};

export type AssistantChatFile = {
  __typename: "AssistantChatFile",
  chat?: AssistantChat | null,
  chatID: string,
  createdAt: string,
  file?: File | null,
  fileID: string,
  id: string,
  owner?: string | null,
  updatedAt: string,
};

export type AssistantChat = {
  __typename: "AssistantChat",
  additionalInstructions?: string | null,
  archived?: boolean | null,
  chatFiles?: ModelAssistantChatFileConnection | null,
  createdAt: string,
  draft?: string | null,
  id: string,
  inputTokens?: string | null,
  messages?: string | null,
  model?: string | null,
  moderationFlag?: boolean | null,
  outputTokens?: string | null,
  owner?: string | null,
  threadId?: string | null,
  threadInstructions?: string | null,
  updatedAt: string,
};

export type FileEmbedding = {
  __typename: "FileEmbedding",
  dimensions?: number | null,
  embedding?: string | null,
  model?: string | null,
  version?: number | null,
  wordCount?: number | null,
};

export enum FileLevel {
  PRIVATE = "PRIVATE",
  PROTECTED = "PROTECTED",
  PUBLIC = "PUBLIC",
}


export type ModelParsedContentConnection = {
  __typename: "ModelParsedContentConnection",
  items:  Array<ParsedContent | null >,
  nextToken?: string | null,
};

export type ParsedContent = {
  __typename: "ParsedContent",
  conceptsJSON?: string | null,
  createdAt: string,
  document?: Document | null,
  documentID: string,
  file?: File | null,
  fileID?: string | null,
  id: string,
  identityId?: string | null,
  importedAt?: string | null,
  metadata?: string | null,
  modelUsed?: string | null,
  objectivesJSON?: string | null,
  owner?: string | null,
  processingTime?: number | null,
  questionsJSON?: string | null,
  responseId?: string | null,
  summariesJSON?: string | null,
  tokensUsed?: number | null,
  updatedAt: string,
  vocabularyJSON?: string | null,
};

export type ModelUnitFileConnection = {
  __typename: "ModelUnitFileConnection",
  items:  Array<UnitFile | null >,
  nextToken?: string | null,
};

export type UnitFile = {
  __typename: "UnitFile",
  createdAt: string,
  file?: File | null,
  fileID: string,
  id: string,
  owner?: string | null,
  unit?: Unit | null,
  unitID: string,
  updatedAt: string,
};

export type Unit = {
  __typename: "Unit",
  agentJobs?: ModelAgentJobConnection | null,
  assignments?: ModelAssignmentConnection | null,
  createdAt: string,
  data?: string | null,
  description?: string | null,
  embedding?: UnitEmbedding | null,
  featuredImage?: string | null,
  grades?: ModelGradeConnection | null,
  id: string,
  identityId?: string | null,
  isDraft?: boolean | null,
  moderation?: UnitModeration | null,
  name?: string | null,
  number?: number | null,
  owner?: string | null,
  publishedAt?: number | null,
  questionUnits?: ModelQuestionUnitConnection | null,
  readableGroups?: Array< string | null > | null,
  status?: UnitStatus | null,
  thumbnail?: string | null,
  timeLimitSeconds?: number | null,
  unitDocuments?: ModelUnitDocumentConnection | null,
  unitFiles?: ModelUnitFileConnection | null,
  unitWords?: ModelUnitWordConnection | null,
  updatedAt: string,
  writableGroups?: Array< string | null > | null,
  yjsSnapshot?: string | null,
};

export type ModelAssignmentConnection = {
  __typename: "ModelAssignmentConnection",
  items:  Array<Assignment | null >,
  nextToken?: string | null,
};

export type Assignment = {
  __typename: "Assignment",
  createdAt: string,
  dueDate?: string | null,
  id: string,
  learner?: string | null,
  owner?: string | null,
  readableGroups?: Array< string | null > | null,
  section?: Section | null,
  sectionID: string,
  status?: AssignmentStatus | null,
  unit?: Unit | null,
  unitID: string,
  updatedAt: string,
  writableGroups?: Array< string | null > | null,
};

export type Section = {
  __typename: "Section",
  assignments?: ModelAssignmentConnection | null,
  backgroundColor?: string | null,
  code?: string | null,
  createdAt: string,
  curveAssignments?: Array< string | null > | null,
  curveEnabled?: boolean | null,
  curveMethod?: string | null,
  description?: string | null,
  embedding?: SectionEmbedding | null,
  featuredImage?: string | null,
  id: string,
  identityId?: string | null,
  instructor?: string | null,
  learner?: string | null,
  name?: string | null,
  owner?: string | null,
  readableGroups?: Array< string | null > | null,
  status?: SectionStatus | null,
  thumbnail?: string | null,
  updatedAt: string,
  writableGroups?: Array< string | null > | null,
};

export type SectionEmbedding = {
  __typename: "SectionEmbedding",
  dimensions?: number | null,
  embedding?: string | null,
  model?: string | null,
  version?: number | null,
  wordCount?: number | null,
};

export enum SectionStatus {
  ARCHIVED = "ARCHIVED",
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}


export enum AssignmentStatus {
  ARCHIVED = "ARCHIVED",
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}


export type UnitEmbedding = {
  __typename: "UnitEmbedding",
  dimensions?: number | null,
  embedding?: string | null,
  model?: string | null,
  version?: number | null,
  wordCount?: number | null,
};

export type ModelGradeConnection = {
  __typename: "ModelGradeConnection",
  items:  Array<Grade | null >,
  nextToken?: string | null,
};

export type Grade = {
  __typename: "Grade",
  accuracy?: number | null,
  complete?: boolean | null,
  createdAt: string,
  data?: string | null,
  feedback?: string | null,
  files?: Array< string | null > | null,
  id: string,
  identityId?: string | null,
  instructor?: string | null,
  instructorGroup?: string | null,
  moderation?: GradeModeration | null,
  owner?: string | null,
  percentComplete?: number | null,
  sectionID?: string | null,
  timerStarted?: boolean | null,
  unit?: Unit | null,
  unitID: string,
  unitVersion?: number | null,
  updatedAt: string,
};

export type GradeModeration = {
  __typename: "GradeModeration",
  checkedAt?: string | null,
  flags?: string | null,
  status?: string | null,
};

export type UnitModeration = {
  __typename: "UnitModeration",
  checkedAt?: string | null,
  flags?: string | null,
  status?: string | null,
};

export type ModelQuestionUnitConnection = {
  __typename: "ModelQuestionUnitConnection",
  items:  Array<QuestionUnit | null >,
  nextToken?: string | null,
};

export type QuestionUnit = {
  __typename: "QuestionUnit",
  createdAt: string,
  id: string,
  owner?: string | null,
  question?: Question | null,
  questionID: string,
  unit?: Unit | null,
  unitID: string,
  updatedAt: string,
};

export enum UnitStatus {
  ARCHIVED = "ARCHIVED",
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}


export type ModelUnitDocumentConnection = {
  __typename: "ModelUnitDocumentConnection",
  items:  Array<UnitDocument | null >,
  nextToken?: string | null,
};

export type UnitDocument = {
  __typename: "UnitDocument",
  createdAt: string,
  document?: Document | null,
  documentID: string,
  id: string,
  owner?: string | null,
  unit?: Unit | null,
  unitID: string,
  updatedAt: string,
};

export type ModelUnitWordConnection = {
  __typename: "ModelUnitWordConnection",
  items:  Array<UnitWord | null >,
  nextToken?: string | null,
};

export type UnitWord = {
  __typename: "UnitWord",
  createdAt: string,
  id: string,
  owner?: string | null,
  unit?: Unit | null,
  unitID: string,
  updatedAt: string,
  word?: Word | null,
  wordID: string,
};

export type Word = {
  __typename: "Word",
  audio?: Array< string | null > | null,
  createdAt: string,
  definition?: string | null,
  definitionAudio?: Array< string | null > | null,
  definitionWaveformData?: string | null,
  documentWords?: ModelDocumentWordConnection | null,
  embedding?: WordEmbedding | null,
  id: string,
  identityId?: string | null,
  importedAt?: string | null,
  moderation?: WordModeration | null,
  owner?: string | null,
  phrase?: string | null,
  pronunciation?: string | null,
  questionWords?: ModelQuestionWordConnection | null,
  rubyTags?: string | null,
  unitWords?: ModelUnitWordConnection | null,
  updatedAt: string,
  waveformData?: string | null,
  wordFiles?: ModelWordFileConnection | null,
  yjsSnapshot?: string | null,
};

export type ModelDocumentWordConnection = {
  __typename: "ModelDocumentWordConnection",
  items:  Array<DocumentWord | null >,
  nextToken?: string | null,
};

export type DocumentWord = {
  __typename: "DocumentWord",
  createdAt: string,
  document?: Document | null,
  documentID: string,
  id: string,
  owner?: string | null,
  updatedAt: string,
  word?: Word | null,
  wordID: string,
};

export type WordEmbedding = {
  __typename: "WordEmbedding",
  dimensions?: number | null,
  embedding?: string | null,
  model?: string | null,
  version?: number | null,
  wordCount?: number | null,
};

export type WordModeration = {
  __typename: "WordModeration",
  checkedAt?: string | null,
  flags?: string | null,
  status?: string | null,
};

export type ModelQuestionWordConnection = {
  __typename: "ModelQuestionWordConnection",
  items:  Array<QuestionWord | null >,
  nextToken?: string | null,
};

export type QuestionWord = {
  __typename: "QuestionWord",
  createdAt: string,
  id: string,
  owner?: string | null,
  question?: Question | null,
  questionID: string,
  updatedAt: string,
  word?: Word | null,
  wordID: string,
};

export type ModelWordFileConnection = {
  __typename: "ModelWordFileConnection",
  items:  Array<WordFile | null >,
  nextToken?: string | null,
};

export type WordFile = {
  __typename: "WordFile",
  createdAt: string,
  file?: File | null,
  fileID: string,
  id: string,
  owner?: string | null,
  updatedAt: string,
  word?: Word | null,
  wordID: string,
};

export type ModelFileConnection = {
  __typename: "ModelFileConnection",
  items:  Array<File | null >,
  nextToken?: string | null,
};

export type Settings = {
  __typename: "Settings",
  assistantVoice?: string | null,
  autoAnalyzeDocuments?: boolean | null,
  createdAt: string,
  defaultAIModel?: string | null,
  documentAnalysisModel?: string | null,
  editorFontSize?: number | null,
  editorTheme?: string | null,
  emailNotifications?: boolean | null,
  id: string,
  identityId?: string | null,
  language?: string | null,
  metadata?: string | null,
  owner?: string | null,
  timezone?: string | null,
  updatedAt: string,
  webhookNotifications?: boolean | null,
};

export type ModelAIFeedbackFilterInput = {
  and?: Array< ModelAIFeedbackFilterInput | null > | null,
  comment?: ModelStringInput | null,
  contentType?: ModelAIFeedbackContentTypeInput | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  feedbackType?: ModelAIFeedbackFeedbackTypeInput | null,
  generatedContent?: ModelStringInput | null,
  gradeID?: ModelIDInput | null,
  id?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  messageId?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  model?: ModelStringInput | null,
  not?: ModelAIFeedbackFilterInput | null,
  or?: Array< ModelAIFeedbackFilterInput | null > | null,
  owner?: ModelStringInput | null,
  prompt?: ModelStringInput | null,
  reasons?: ModelAIFeedbackReasonsInput | null,
  sessionId?: ModelStringInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelStringInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  _null = "_null",
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
}


export type ModelSizeInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelAIFeedbackContentTypeInput = {
  eq?: AIFeedbackContentType | null,
  ne?: AIFeedbackContentType | null,
};

export type ModelIDInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export type ModelAIFeedbackFeedbackTypeInput = {
  eq?: AIFeedbackFeedbackType | null,
  ne?: AIFeedbackFeedbackType | null,
};

export type ModelAIFeedbackReasonsInput = {
  eq?: AIFeedbackReasons | null,
  ne?: AIFeedbackReasons | null,
};

export type ModelAIFeedbackConnection = {
  __typename: "ModelAIFeedbackConnection",
  items:  Array<AIFeedback | null >,
  nextToken?: string | null,
};

export type ModelAgentJobFilterInput = {
  and?: Array< ModelAgentJobFilterInput | null > | null,
  completedAt?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  error?: ModelStringInput | null,
  estimatedCost?: ModelFloatInput | null,
  id?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  modelUsed?: ModelStringInput | null,
  not?: ModelAgentJobFilterInput | null,
  or?: Array< ModelAgentJobFilterInput | null > | null,
  owner?: ModelStringInput | null,
  responseId?: ModelStringInput | null,
  retryCount?: ModelIntInput | null,
  startedAt?: ModelStringInput | null,
  status?: ModelStringInput | null,
  tokensUsed?: ModelIntInput | null,
  type?: ModelStringInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
  webhookData?: ModelStringInput | null,
};

export type ModelFloatInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelIntInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelAssignmentFilterInput = {
  and?: Array< ModelAssignmentFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  dueDate?: ModelStringInput | null,
  id?: ModelIDInput | null,
  learner?: ModelStringInput | null,
  not?: ModelAssignmentFilterInput | null,
  or?: Array< ModelAssignmentFilterInput | null > | null,
  owner?: ModelStringInput | null,
  readableGroups?: ModelStringInput | null,
  sectionID?: ModelIDInput | null,
  status?: ModelAssignmentStatusInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
  writableGroups?: ModelStringInput | null,
};

export type ModelAssignmentStatusInput = {
  eq?: AssignmentStatus | null,
  ne?: AssignmentStatus | null,
};

export type ModelAssistantChatFileFilterInput = {
  and?: Array< ModelAssistantChatFileFilterInput | null > | null,
  chatID?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  fileID?: ModelIDInput | null,
  id?: ModelIDInput | null,
  not?: ModelAssistantChatFileFilterInput | null,
  or?: Array< ModelAssistantChatFileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelAssistantChatFilterInput = {
  additionalInstructions?: ModelStringInput | null,
  and?: Array< ModelAssistantChatFilterInput | null > | null,
  archived?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  draft?: ModelStringInput | null,
  id?: ModelIDInput | null,
  inputTokens?: ModelStringInput | null,
  messages?: ModelStringInput | null,
  model?: ModelStringInput | null,
  moderationFlag?: ModelBooleanInput | null,
  not?: ModelAssistantChatFilterInput | null,
  or?: Array< ModelAssistantChatFilterInput | null > | null,
  outputTokens?: ModelStringInput | null,
  owner?: ModelStringInput | null,
  threadId?: ModelStringInput | null,
  threadInstructions?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelBooleanInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelAssistantChatConnection = {
  __typename: "ModelAssistantChatConnection",
  items:  Array<AssistantChat | null >,
  nextToken?: string | null,
};

export type ModelDocumentQuestionFilterInput = {
  and?: Array< ModelDocumentQuestionFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  id?: ModelIDInput | null,
  not?: ModelDocumentQuestionFilterInput | null,
  or?: Array< ModelDocumentQuestionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelDocumentWordFilterInput = {
  and?: Array< ModelDocumentWordFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  id?: ModelIDInput | null,
  not?: ModelDocumentWordFilterInput | null,
  or?: Array< ModelDocumentWordFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  wordID?: ModelIDInput | null,
};

export type ModelDocumentFilterInput = {
  and?: Array< ModelDocumentFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  extractedText?: ModelStringInput | null,
  fileSize?: ModelIntInput | null,
  filename?: ModelStringInput | null,
  id?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  learner?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  mimeType?: ModelStringInput | null,
  not?: ModelDocumentFilterInput | null,
  or?: Array< ModelDocumentFilterInput | null > | null,
  owner?: ModelStringInput | null,
  pageCount?: ModelIntInput | null,
  readableGroups?: ModelStringInput | null,
  resumeState?: ModelStringInput | null,
  s3Key?: ModelStringInput | null,
  sectionID?: ModelIDInput | null,
  status?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  uploadedAt?: ModelStringInput | null,
  writableGroups?: ModelStringInput | null,
  yjsSnapshot?: ModelStringInput | null,
};

export type ModelDocumentConnection = {
  __typename: "ModelDocumentConnection",
  items:  Array<Document | null >,
  nextToken?: string | null,
};

export type ModelFileFilterInput = {
  and?: Array< ModelFileFilterInput | null > | null,
  byHex?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  duration?: ModelIntInput | null,
  generated?: ModelBooleanInput | null,
  hex?: ModelStringInput | null,
  id?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  level?: ModelFileLevelInput | null,
  mimeType?: ModelStringInput | null,
  model?: ModelStringInput | null,
  name?: ModelStringInput | null,
  not?: ModelFileFilterInput | null,
  or?: Array< ModelFileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  path?: ModelStringInput | null,
  prompt?: ModelStringInput | null,
  size?: ModelIntInput | null,
  thumbnail?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  variant?: ModelStringInput | null,
  waveformData?: ModelStringInput | null,
  yjsSnapshot?: ModelStringInput | null,
};

export type ModelFileLevelInput = {
  eq?: FileLevel | null,
  ne?: FileLevel | null,
};

export type ModelGradeFilterInput = {
  accuracy?: ModelFloatInput | null,
  and?: Array< ModelGradeFilterInput | null > | null,
  complete?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  data?: ModelStringInput | null,
  feedback?: ModelStringInput | null,
  files?: ModelStringInput | null,
  id?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  instructor?: ModelStringInput | null,
  instructorGroup?: ModelStringInput | null,
  not?: ModelGradeFilterInput | null,
  or?: Array< ModelGradeFilterInput | null > | null,
  owner?: ModelStringInput | null,
  percentComplete?: ModelFloatInput | null,
  sectionID?: ModelIDInput | null,
  timerStarted?: ModelBooleanInput | null,
  unitID?: ModelIDInput | null,
  unitVersion?: ModelIntInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelParsedContentFilterInput = {
  and?: Array< ModelParsedContentFilterInput | null > | null,
  conceptsJSON?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  fileID?: ModelIDInput | null,
  id?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  importedAt?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  modelUsed?: ModelStringInput | null,
  not?: ModelParsedContentFilterInput | null,
  objectivesJSON?: ModelStringInput | null,
  or?: Array< ModelParsedContentFilterInput | null > | null,
  owner?: ModelStringInput | null,
  processingTime?: ModelIntInput | null,
  questionsJSON?: ModelStringInput | null,
  responseId?: ModelStringInput | null,
  summariesJSON?: ModelStringInput | null,
  tokensUsed?: ModelIntInput | null,
  updatedAt?: ModelStringInput | null,
  vocabularyJSON?: ModelStringInput | null,
};

export type ModelQuestionFileFilterInput = {
  and?: Array< ModelQuestionFileFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  fileID?: ModelIDInput | null,
  id?: ModelIDInput | null,
  not?: ModelQuestionFileFilterInput | null,
  or?: Array< ModelQuestionFileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelQuestionUnitFilterInput = {
  and?: Array< ModelQuestionUnitFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelQuestionUnitFilterInput | null,
  or?: Array< ModelQuestionUnitFilterInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelIDInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelQuestionWordFilterInput = {
  and?: Array< ModelQuestionWordFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelQuestionWordFilterInput | null,
  or?: Array< ModelQuestionWordFilterInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
  wordID?: ModelIDInput | null,
};

export type ModelQuestionFilterInput = {
  and?: Array< ModelQuestionFilterInput | null > | null,
  answer?: ModelStringInput | null,
  answerAudio?: ModelStringInput | null,
  answerAudioWaveformData?: ModelStringInput | null,
  audio?: ModelStringInput | null,
  audioWaveformData?: ModelStringInput | null,
  byPromptHex?: ModelStringInput | null,
  choices?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  difficulty?: ModelStringInput | null,
  generated?: ModelBooleanInput | null,
  hint?: ModelStringInput | null,
  id?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  importedAt?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  model?: ModelStringInput | null,
  not?: ModelQuestionFilterInput | null,
  or?: Array< ModelQuestionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  prompt?: ModelStringInput | null,
  promptHex?: ModelStringInput | null,
  thumbnail?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  yjsSnapshot?: ModelStringInput | null,
};

export type ModelQuestionConnection = {
  __typename: "ModelQuestionConnection",
  items:  Array<Question | null >,
  nextToken?: string | null,
};

export type StudentInfo = {
  __typename: "StudentInfo",
  email?: string | null,
  id: string,
  name?: string | null,
};

export type ModelSectionFilterInput = {
  and?: Array< ModelSectionFilterInput | null > | null,
  backgroundColor?: ModelStringInput | null,
  code?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  curveAssignments?: ModelStringInput | null,
  curveEnabled?: ModelBooleanInput | null,
  curveMethod?: ModelStringInput | null,
  description?: ModelStringInput | null,
  featuredImage?: ModelStringInput | null,
  id?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  instructor?: ModelStringInput | null,
  learner?: ModelStringInput | null,
  name?: ModelStringInput | null,
  not?: ModelSectionFilterInput | null,
  or?: Array< ModelSectionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  readableGroups?: ModelStringInput | null,
  status?: ModelSectionStatusInput | null,
  thumbnail?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  writableGroups?: ModelStringInput | null,
};

export type ModelSectionStatusInput = {
  eq?: SectionStatus | null,
  ne?: SectionStatus | null,
};

export type ModelSectionConnection = {
  __typename: "ModelSectionConnection",
  items:  Array<Section | null >,
  nextToken?: string | null,
};

export type ModelSettingsFilterInput = {
  and?: Array< ModelSettingsFilterInput | null > | null,
  assistantVoice?: ModelStringInput | null,
  autoAnalyzeDocuments?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  defaultAIModel?: ModelStringInput | null,
  documentAnalysisModel?: ModelStringInput | null,
  editorFontSize?: ModelIntInput | null,
  editorTheme?: ModelStringInput | null,
  emailNotifications?: ModelBooleanInput | null,
  id?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  language?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  not?: ModelSettingsFilterInput | null,
  or?: Array< ModelSettingsFilterInput | null > | null,
  owner?: ModelStringInput | null,
  timezone?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  webhookNotifications?: ModelBooleanInput | null,
};

export type ModelSettingsConnection = {
  __typename: "ModelSettingsConnection",
  items:  Array<Settings | null >,
  nextToken?: string | null,
};

export type ModelUnitDocumentFilterInput = {
  and?: Array< ModelUnitDocumentFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  id?: ModelIDInput | null,
  not?: ModelUnitDocumentFilterInput | null,
  or?: Array< ModelUnitDocumentFilterInput | null > | null,
  owner?: ModelStringInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelUnitFileFilterInput = {
  and?: Array< ModelUnitFileFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  fileID?: ModelIDInput | null,
  id?: ModelIDInput | null,
  not?: ModelUnitFileFilterInput | null,
  or?: Array< ModelUnitFileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelUnitWordFilterInput = {
  and?: Array< ModelUnitWordFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelUnitWordFilterInput | null,
  or?: Array< ModelUnitWordFilterInput | null > | null,
  owner?: ModelStringInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
  wordID?: ModelIDInput | null,
};

export type ModelUnitFilterInput = {
  and?: Array< ModelUnitFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  data?: ModelStringInput | null,
  description?: ModelStringInput | null,
  featuredImage?: ModelStringInput | null,
  id?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  isDraft?: ModelBooleanInput | null,
  name?: ModelStringInput | null,
  not?: ModelUnitFilterInput | null,
  number?: ModelFloatInput | null,
  or?: Array< ModelUnitFilterInput | null > | null,
  owner?: ModelStringInput | null,
  publishedAt?: ModelIntInput | null,
  readableGroups?: ModelStringInput | null,
  status?: ModelUnitStatusInput | null,
  thumbnail?: ModelStringInput | null,
  timeLimitSeconds?: ModelIntInput | null,
  updatedAt?: ModelStringInput | null,
  writableGroups?: ModelStringInput | null,
  yjsSnapshot?: ModelStringInput | null,
};

export type ModelUnitStatusInput = {
  eq?: UnitStatus | null,
  ne?: UnitStatus | null,
};

export type ModelUnitConnection = {
  __typename: "ModelUnitConnection",
  items:  Array<Unit | null >,
  nextToken?: string | null,
};

export type ModelWordFileFilterInput = {
  and?: Array< ModelWordFileFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  fileID?: ModelIDInput | null,
  id?: ModelIDInput | null,
  not?: ModelWordFileFilterInput | null,
  or?: Array< ModelWordFileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  wordID?: ModelIDInput | null,
};

export type ModelWordFilterInput = {
  and?: Array< ModelWordFilterInput | null > | null,
  audio?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  definition?: ModelStringInput | null,
  definitionAudio?: ModelStringInput | null,
  definitionWaveformData?: ModelStringInput | null,
  id?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  importedAt?: ModelStringInput | null,
  not?: ModelWordFilterInput | null,
  or?: Array< ModelWordFilterInput | null > | null,
  owner?: ModelStringInput | null,
  phrase?: ModelStringInput | null,
  pronunciation?: ModelStringInput | null,
  rubyTags?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  waveformData?: ModelStringInput | null,
  yjsSnapshot?: ModelStringInput | null,
};

export type ModelWordConnection = {
  __typename: "ModelWordConnection",
  items:  Array<Word | null >,
  nextToken?: string | null,
};

export type AnalyzeDocumentResult = {
  __typename: "AnalyzeDocumentResult",
  documentID?: string | null,
  fileID: string,
  message?: string | null,
  pageCount?: number | null,
  progress?: string | null,
  responseId?: string | null,
  success: boolean,
};

export type CancelDocumentAnalysisResult = {
  __typename: "CancelDocumentAnalysisResult",
  documentID?: string | null,
  fileID: string,
  message?: string | null,
  success: boolean,
};

export type ModelAIFeedbackConditionInput = {
  and?: Array< ModelAIFeedbackConditionInput | null > | null,
  comment?: ModelStringInput | null,
  contentType?: ModelAIFeedbackContentTypeInput | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  feedbackType?: ModelAIFeedbackFeedbackTypeInput | null,
  generatedContent?: ModelStringInput | null,
  gradeID?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  messageId?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  model?: ModelStringInput | null,
  not?: ModelAIFeedbackConditionInput | null,
  or?: Array< ModelAIFeedbackConditionInput | null > | null,
  owner?: ModelStringInput | null,
  prompt?: ModelStringInput | null,
  reasons?: ModelAIFeedbackReasonsInput | null,
  sessionId?: ModelStringInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateAIFeedbackInput = {
  comment?: string | null,
  contentType?: AIFeedbackContentType | null,
  documentID?: string | null,
  feedbackType?: AIFeedbackFeedbackType | null,
  generatedContent?: string | null,
  gradeID?: string | null,
  id?: string | null,
  identityId?: string | null,
  messageId?: string | null,
  metadata?: string | null,
  model?: string | null,
  owner?: string | null,
  prompt?: string | null,
  reasons?: AIFeedbackReasons | null,
  sessionId?: string | null,
  unitID?: string | null,
};

export type ModelAgentJobConditionInput = {
  and?: Array< ModelAgentJobConditionInput | null > | null,
  completedAt?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  error?: ModelStringInput | null,
  estimatedCost?: ModelFloatInput | null,
  identityId?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  modelUsed?: ModelStringInput | null,
  not?: ModelAgentJobConditionInput | null,
  or?: Array< ModelAgentJobConditionInput | null > | null,
  owner?: ModelStringInput | null,
  responseId?: ModelStringInput | null,
  retryCount?: ModelIntInput | null,
  startedAt?: ModelStringInput | null,
  status?: ModelStringInput | null,
  tokensUsed?: ModelIntInput | null,
  type?: ModelStringInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
  webhookData?: ModelStringInput | null,
};

export type CreateAgentJobInput = {
  completedAt?: string | null,
  documentID?: string | null,
  error?: string | null,
  estimatedCost?: number | null,
  id?: string | null,
  identityId?: string | null,
  metadata?: string | null,
  modelUsed?: string | null,
  responseId?: string | null,
  retryCount?: number | null,
  startedAt?: string | null,
  status: string,
  tokensUsed?: number | null,
  type: string,
  unitID?: string | null,
  webhookData?: string | null,
};

export type ModelAssignmentConditionInput = {
  and?: Array< ModelAssignmentConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  dueDate?: ModelStringInput | null,
  learner?: ModelStringInput | null,
  not?: ModelAssignmentConditionInput | null,
  or?: Array< ModelAssignmentConditionInput | null > | null,
  owner?: ModelStringInput | null,
  readableGroups?: ModelStringInput | null,
  sectionID?: ModelIDInput | null,
  status?: ModelAssignmentStatusInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
  writableGroups?: ModelStringInput | null,
};

export type CreateAssignmentInput = {
  dueDate?: string | null,
  id?: string | null,
  learner?: string | null,
  owner?: string | null,
  readableGroups?: Array< string | null > | null,
  sectionID: string,
  status?: AssignmentStatus | null,
  unitID: string,
  writableGroups?: Array< string | null > | null,
};

export type ModelAssistantChatConditionInput = {
  additionalInstructions?: ModelStringInput | null,
  and?: Array< ModelAssistantChatConditionInput | null > | null,
  archived?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  draft?: ModelStringInput | null,
  inputTokens?: ModelStringInput | null,
  messages?: ModelStringInput | null,
  model?: ModelStringInput | null,
  moderationFlag?: ModelBooleanInput | null,
  not?: ModelAssistantChatConditionInput | null,
  or?: Array< ModelAssistantChatConditionInput | null > | null,
  outputTokens?: ModelStringInput | null,
  owner?: ModelStringInput | null,
  threadId?: ModelStringInput | null,
  threadInstructions?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateAssistantChatInput = {
  additionalInstructions?: string | null,
  archived?: boolean | null,
  draft?: string | null,
  id?: string | null,
  inputTokens?: string | null,
  messages?: string | null,
  model?: string | null,
  moderationFlag?: boolean | null,
  outputTokens?: string | null,
  owner?: string | null,
  threadId?: string | null,
  threadInstructions?: string | null,
};

export type ModelAssistantChatFileConditionInput = {
  and?: Array< ModelAssistantChatFileConditionInput | null > | null,
  chatID?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  fileID?: ModelIDInput | null,
  not?: ModelAssistantChatFileConditionInput | null,
  or?: Array< ModelAssistantChatFileConditionInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateAssistantChatFileInput = {
  chatID: string,
  fileID: string,
  id?: string | null,
};

export type ModelDocumentConditionInput = {
  and?: Array< ModelDocumentConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  extractedText?: ModelStringInput | null,
  fileSize?: ModelIntInput | null,
  filename?: ModelStringInput | null,
  identityId?: ModelStringInput | null,
  learner?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  mimeType?: ModelStringInput | null,
  not?: ModelDocumentConditionInput | null,
  or?: Array< ModelDocumentConditionInput | null > | null,
  owner?: ModelStringInput | null,
  pageCount?: ModelIntInput | null,
  readableGroups?: ModelStringInput | null,
  resumeState?: ModelStringInput | null,
  s3Key?: ModelStringInput | null,
  sectionID?: ModelIDInput | null,
  status?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  uploadedAt?: ModelStringInput | null,
  writableGroups?: ModelStringInput | null,
  yjsSnapshot?: ModelStringInput | null,
};

export type CreateDocumentInput = {
  extractedText?: string | null,
  fileSize?: number | null,
  filename: string,
  id?: string | null,
  identityId?: string | null,
  learner?: string | null,
  metadata?: string | null,
  mimeType?: string | null,
  owner?: string | null,
  pageCount?: number | null,
  readableGroups?: Array< string | null > | null,
  resumeState?: string | null,
  s3Key: string,
  sectionID?: string | null,
  status: string,
  uploadedAt?: string | null,
  writableGroups?: Array< string | null > | null,
  yjsSnapshot?: string | null,
};

export type ModelDocumentQuestionConditionInput = {
  and?: Array< ModelDocumentQuestionConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  not?: ModelDocumentQuestionConditionInput | null,
  or?: Array< ModelDocumentQuestionConditionInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateDocumentQuestionInput = {
  documentID: string,
  id?: string | null,
  questionID: string,
};

export type ModelDocumentWordConditionInput = {
  and?: Array< ModelDocumentWordConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  not?: ModelDocumentWordConditionInput | null,
  or?: Array< ModelDocumentWordConditionInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  wordID?: ModelIDInput | null,
};

export type CreateDocumentWordInput = {
  documentID: string,
  id?: string | null,
  wordID: string,
};

export type ModelFileConditionInput = {
  and?: Array< ModelFileConditionInput | null > | null,
  byHex?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  duration?: ModelIntInput | null,
  generated?: ModelBooleanInput | null,
  hex?: ModelStringInput | null,
  identityId?: ModelStringInput | null,
  level?: ModelFileLevelInput | null,
  mimeType?: ModelStringInput | null,
  model?: ModelStringInput | null,
  name?: ModelStringInput | null,
  not?: ModelFileConditionInput | null,
  or?: Array< ModelFileConditionInput | null > | null,
  owner?: ModelStringInput | null,
  path?: ModelStringInput | null,
  prompt?: ModelStringInput | null,
  size?: ModelIntInput | null,
  thumbnail?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  variant?: ModelStringInput | null,
  waveformData?: ModelStringInput | null,
  yjsSnapshot?: ModelStringInput | null,
};

export type CreateFileInput = {
  byHex?: string | null,
  description?: string | null,
  documentID?: string | null,
  duration?: number | null,
  embedding?: FileEmbeddingInput | null,
  generated?: boolean | null,
  hex?: string | null,
  id?: string | null,
  identityId: string,
  level?: FileLevel | null,
  mimeType?: string | null,
  model?: string | null,
  name?: string | null,
  owner: string,
  path: string,
  prompt?: string | null,
  size?: number | null,
  thumbnail?: string | null,
  variant?: string | null,
  waveformData?: string | null,
  yjsSnapshot?: string | null,
};

export type FileEmbeddingInput = {
  dimensions?: number | null,
  embedding?: string | null,
  model?: string | null,
  version?: number | null,
  wordCount?: number | null,
};

export type ModelGradeConditionInput = {
  accuracy?: ModelFloatInput | null,
  and?: Array< ModelGradeConditionInput | null > | null,
  complete?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  data?: ModelStringInput | null,
  feedback?: ModelStringInput | null,
  files?: ModelStringInput | null,
  identityId?: ModelStringInput | null,
  instructor?: ModelStringInput | null,
  instructorGroup?: ModelStringInput | null,
  not?: ModelGradeConditionInput | null,
  or?: Array< ModelGradeConditionInput | null > | null,
  owner?: ModelStringInput | null,
  percentComplete?: ModelFloatInput | null,
  sectionID?: ModelIDInput | null,
  timerStarted?: ModelBooleanInput | null,
  unitID?: ModelIDInput | null,
  unitVersion?: ModelIntInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateGradeInput = {
  accuracy?: number | null,
  complete?: boolean | null,
  data?: string | null,
  feedback?: string | null,
  files?: Array< string | null > | null,
  id?: string | null,
  identityId?: string | null,
  instructor?: string | null,
  instructorGroup?: string | null,
  moderation?: GradeModerationInput | null,
  percentComplete?: number | null,
  sectionID?: string | null,
  timerStarted?: boolean | null,
  unitID: string,
  unitVersion?: number | null,
};

export type GradeModerationInput = {
  checkedAt?: string | null,
  flags?: string | null,
  status?: string | null,
};

export type ModelParsedContentConditionInput = {
  and?: Array< ModelParsedContentConditionInput | null > | null,
  conceptsJSON?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  fileID?: ModelIDInput | null,
  identityId?: ModelStringInput | null,
  importedAt?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  modelUsed?: ModelStringInput | null,
  not?: ModelParsedContentConditionInput | null,
  objectivesJSON?: ModelStringInput | null,
  or?: Array< ModelParsedContentConditionInput | null > | null,
  owner?: ModelStringInput | null,
  processingTime?: ModelIntInput | null,
  questionsJSON?: ModelStringInput | null,
  responseId?: ModelStringInput | null,
  summariesJSON?: ModelStringInput | null,
  tokensUsed?: ModelIntInput | null,
  updatedAt?: ModelStringInput | null,
  vocabularyJSON?: ModelStringInput | null,
};

export type CreateParsedContentInput = {
  conceptsJSON?: string | null,
  documentID: string,
  fileID?: string | null,
  id?: string | null,
  identityId?: string | null,
  importedAt?: string | null,
  metadata?: string | null,
  modelUsed?: string | null,
  objectivesJSON?: string | null,
  owner?: string | null,
  processingTime?: number | null,
  questionsJSON?: string | null,
  responseId?: string | null,
  summariesJSON?: string | null,
  tokensUsed?: number | null,
  vocabularyJSON?: string | null,
};

export type ModelQuestionConditionInput = {
  and?: Array< ModelQuestionConditionInput | null > | null,
  answer?: ModelStringInput | null,
  answerAudio?: ModelStringInput | null,
  answerAudioWaveformData?: ModelStringInput | null,
  audio?: ModelStringInput | null,
  audioWaveformData?: ModelStringInput | null,
  byPromptHex?: ModelStringInput | null,
  choices?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  difficulty?: ModelStringInput | null,
  generated?: ModelBooleanInput | null,
  hint?: ModelStringInput | null,
  identityId?: ModelStringInput | null,
  importedAt?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  model?: ModelStringInput | null,
  not?: ModelQuestionConditionInput | null,
  or?: Array< ModelQuestionConditionInput | null > | null,
  owner?: ModelStringInput | null,
  prompt?: ModelStringInput | null,
  promptHex?: ModelStringInput | null,
  thumbnail?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  yjsSnapshot?: ModelStringInput | null,
};

export type CreateQuestionInput = {
  answer?: string | null,
  answerAudio?: Array< string | null > | null,
  answerAudioWaveformData?: string | null,
  audio?: Array< string | null > | null,
  audioWaveformData?: string | null,
  byPromptHex?: string | null,
  choices?: string | null,
  difficulty?: string | null,
  embedding?: QuestionEmbeddingInput | null,
  generated?: boolean | null,
  hint?: string | null,
  id?: string | null,
  identityId?: string | null,
  importedAt?: string | null,
  metadata?: string | null,
  model?: string | null,
  moderation?: QuestionModerationInput | null,
  owner?: string | null,
  prompt?: string | null,
  promptHex?: string | null,
  thumbnail?: string | null,
  yjsSnapshot?: string | null,
};

export type QuestionEmbeddingInput = {
  dimensions?: number | null,
  embedding?: string | null,
  model?: string | null,
  version?: number | null,
  wordCount?: number | null,
};

export type QuestionModerationInput = {
  checkedAt?: string | null,
  flags?: string | null,
  status?: string | null,
};

export type ModelQuestionFileConditionInput = {
  and?: Array< ModelQuestionFileConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  fileID?: ModelIDInput | null,
  not?: ModelQuestionFileConditionInput | null,
  or?: Array< ModelQuestionFileConditionInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateQuestionFileInput = {
  fileID: string,
  id?: string | null,
  questionID: string,
};

export type ModelQuestionUnitConditionInput = {
  and?: Array< ModelQuestionUnitConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  not?: ModelQuestionUnitConditionInput | null,
  or?: Array< ModelQuestionUnitConditionInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelIDInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateQuestionUnitInput = {
  id?: string | null,
  questionID: string,
  unitID: string,
};

export type ModelQuestionWordConditionInput = {
  and?: Array< ModelQuestionWordConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  not?: ModelQuestionWordConditionInput | null,
  or?: Array< ModelQuestionWordConditionInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
  wordID?: ModelIDInput | null,
};

export type CreateQuestionWordInput = {
  id?: string | null,
  questionID: string,
  wordID: string,
};

export type ModelSectionConditionInput = {
  and?: Array< ModelSectionConditionInput | null > | null,
  backgroundColor?: ModelStringInput | null,
  code?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  curveAssignments?: ModelStringInput | null,
  curveEnabled?: ModelBooleanInput | null,
  curveMethod?: ModelStringInput | null,
  description?: ModelStringInput | null,
  featuredImage?: ModelStringInput | null,
  identityId?: ModelStringInput | null,
  instructor?: ModelStringInput | null,
  learner?: ModelStringInput | null,
  name?: ModelStringInput | null,
  not?: ModelSectionConditionInput | null,
  or?: Array< ModelSectionConditionInput | null > | null,
  owner?: ModelStringInput | null,
  readableGroups?: ModelStringInput | null,
  status?: ModelSectionStatusInput | null,
  thumbnail?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  writableGroups?: ModelStringInput | null,
};

export type CreateSectionInput = {
  backgroundColor?: string | null,
  code?: string | null,
  curveAssignments?: Array< string | null > | null,
  curveEnabled?: boolean | null,
  curveMethod?: string | null,
  description?: string | null,
  embedding?: SectionEmbeddingInput | null,
  featuredImage?: string | null,
  id?: string | null,
  identityId?: string | null,
  instructor?: string | null,
  learner?: string | null,
  name?: string | null,
  owner?: string | null,
  readableGroups?: Array< string | null > | null,
  status?: SectionStatus | null,
  thumbnail?: string | null,
  writableGroups?: Array< string | null > | null,
};

export type SectionEmbeddingInput = {
  dimensions?: number | null,
  embedding?: string | null,
  model?: string | null,
  version?: number | null,
  wordCount?: number | null,
};

export type ModelSettingsConditionInput = {
  and?: Array< ModelSettingsConditionInput | null > | null,
  assistantVoice?: ModelStringInput | null,
  autoAnalyzeDocuments?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  defaultAIModel?: ModelStringInput | null,
  documentAnalysisModel?: ModelStringInput | null,
  editorFontSize?: ModelIntInput | null,
  editorTheme?: ModelStringInput | null,
  emailNotifications?: ModelBooleanInput | null,
  identityId?: ModelStringInput | null,
  language?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  not?: ModelSettingsConditionInput | null,
  or?: Array< ModelSettingsConditionInput | null > | null,
  owner?: ModelStringInput | null,
  timezone?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  webhookNotifications?: ModelBooleanInput | null,
};

export type CreateSettingsInput = {
  assistantVoice?: string | null,
  autoAnalyzeDocuments?: boolean | null,
  defaultAIModel?: string | null,
  documentAnalysisModel?: string | null,
  editorFontSize?: number | null,
  editorTheme?: string | null,
  emailNotifications?: boolean | null,
  id?: string | null,
  identityId?: string | null,
  language?: string | null,
  metadata?: string | null,
  owner?: string | null,
  timezone?: string | null,
  webhookNotifications?: boolean | null,
};

export type ModelUnitConditionInput = {
  and?: Array< ModelUnitConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  data?: ModelStringInput | null,
  description?: ModelStringInput | null,
  featuredImage?: ModelStringInput | null,
  identityId?: ModelStringInput | null,
  isDraft?: ModelBooleanInput | null,
  name?: ModelStringInput | null,
  not?: ModelUnitConditionInput | null,
  number?: ModelFloatInput | null,
  or?: Array< ModelUnitConditionInput | null > | null,
  owner?: ModelStringInput | null,
  publishedAt?: ModelIntInput | null,
  readableGroups?: ModelStringInput | null,
  status?: ModelUnitStatusInput | null,
  thumbnail?: ModelStringInput | null,
  timeLimitSeconds?: ModelIntInput | null,
  updatedAt?: ModelStringInput | null,
  writableGroups?: ModelStringInput | null,
  yjsSnapshot?: ModelStringInput | null,
};

export type CreateUnitInput = {
  data?: string | null,
  description?: string | null,
  embedding?: UnitEmbeddingInput | null,
  featuredImage?: string | null,
  id?: string | null,
  identityId?: string | null,
  isDraft?: boolean | null,
  moderation?: UnitModerationInput | null,
  name?: string | null,
  number?: number | null,
  owner?: string | null,
  publishedAt?: number | null,
  readableGroups?: Array< string | null > | null,
  status?: UnitStatus | null,
  thumbnail?: string | null,
  timeLimitSeconds?: number | null,
  writableGroups?: Array< string | null > | null,
  yjsSnapshot?: string | null,
};

export type UnitEmbeddingInput = {
  dimensions?: number | null,
  embedding?: string | null,
  model?: string | null,
  version?: number | null,
  wordCount?: number | null,
};

export type UnitModerationInput = {
  checkedAt?: string | null,
  flags?: string | null,
  status?: string | null,
};

export type ModelUnitDocumentConditionInput = {
  and?: Array< ModelUnitDocumentConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  documentID?: ModelIDInput | null,
  not?: ModelUnitDocumentConditionInput | null,
  or?: Array< ModelUnitDocumentConditionInput | null > | null,
  owner?: ModelStringInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateUnitDocumentInput = {
  documentID: string,
  id?: string | null,
  unitID: string,
};

export type ModelUnitFileConditionInput = {
  and?: Array< ModelUnitFileConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  fileID?: ModelIDInput | null,
  not?: ModelUnitFileConditionInput | null,
  or?: Array< ModelUnitFileConditionInput | null > | null,
  owner?: ModelStringInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateUnitFileInput = {
  fileID: string,
  id?: string | null,
  unitID: string,
};

export type ModelUnitWordConditionInput = {
  and?: Array< ModelUnitWordConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  not?: ModelUnitWordConditionInput | null,
  or?: Array< ModelUnitWordConditionInput | null > | null,
  owner?: ModelStringInput | null,
  unitID?: ModelIDInput | null,
  updatedAt?: ModelStringInput | null,
  wordID?: ModelIDInput | null,
};

export type CreateUnitWordInput = {
  id?: string | null,
  unitID: string,
  wordID: string,
};

export type ModelWordConditionInput = {
  and?: Array< ModelWordConditionInput | null > | null,
  audio?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  definition?: ModelStringInput | null,
  definitionAudio?: ModelStringInput | null,
  definitionWaveformData?: ModelStringInput | null,
  identityId?: ModelStringInput | null,
  importedAt?: ModelStringInput | null,
  not?: ModelWordConditionInput | null,
  or?: Array< ModelWordConditionInput | null > | null,
  owner?: ModelStringInput | null,
  phrase?: ModelStringInput | null,
  pronunciation?: ModelStringInput | null,
  rubyTags?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  waveformData?: ModelStringInput | null,
  yjsSnapshot?: ModelStringInput | null,
};

export type CreateWordInput = {
  audio?: Array< string | null > | null,
  definition?: string | null,
  definitionAudio?: Array< string | null > | null,
  definitionWaveformData?: string | null,
  embedding?: WordEmbeddingInput | null,
  id?: string | null,
  identityId?: string | null,
  importedAt?: string | null,
  moderation?: WordModerationInput | null,
  owner?: string | null,
  phrase?: string | null,
  pronunciation?: string | null,
  rubyTags?: string | null,
  waveformData?: string | null,
  yjsSnapshot?: string | null,
};

export type WordEmbeddingInput = {
  dimensions?: number | null,
  embedding?: string | null,
  model?: string | null,
  version?: number | null,
  wordCount?: number | null,
};

export type WordModerationInput = {
  checkedAt?: string | null,
  flags?: string | null,
  status?: string | null,
};

export type ModelWordFileConditionInput = {
  and?: Array< ModelWordFileConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  fileID?: ModelIDInput | null,
  not?: ModelWordFileConditionInput | null,
  or?: Array< ModelWordFileConditionInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  wordID?: ModelIDInput | null,
};

export type CreateWordFileInput = {
  fileID: string,
  id?: string | null,
  wordID: string,
};

export type DeleteAIFeedbackInput = {
  id: string,
};

export type DeleteAgentJobInput = {
  id: string,
};

export type DeleteAssignmentInput = {
  id: string,
};

export type DeleteAssistantChatInput = {
  id: string,
};

export type DeleteAssistantChatFileInput = {
  id: string,
};

export type DeleteDocumentInput = {
  id: string,
};

export type DeleteDocumentQuestionInput = {
  id: string,
};

export type DeleteDocumentWordInput = {
  id: string,
};

export type DeleteFileInput = {
  id: string,
};

export type DeleteGradeInput = {
  id: string,
};

export type DeleteParsedContentInput = {
  id: string,
};

export type DeleteQuestionInput = {
  id: string,
};

export type DeleteQuestionFileInput = {
  id: string,
};

export type DeleteQuestionUnitInput = {
  id: string,
};

export type DeleteQuestionWordInput = {
  id: string,
};

export type DeleteSectionInput = {
  id: string,
};

export type DeleteSettingsInput = {
  id: string,
};

export type DeleteUnitInput = {
  id: string,
};

export type DeleteUnitDocumentInput = {
  id: string,
};

export type DeleteUnitFileInput = {
  id: string,
};

export type DeleteUnitWordInput = {
  id: string,
};

export type DeleteWordInput = {
  id: string,
};

export type DeleteWordFileInput = {
  id: string,
};

export type EmbeddingResult = {
  __typename: "EmbeddingResult",
  dimensions: number,
  embedding: Array< number | null >,
  error?: string | null,
  model: string,
  tokenCount: number,
};

export type GenerateEmbeddingsResult = {
  __typename: "GenerateEmbeddingsResult",
  documentID?: string | null,
  embeddingCount?: number | null,
  fileID: string,
  message?: string | null,
  success: boolean,
};

export type ModerationResult = {
  __typename: "ModerationResult",
  categories: string,
  categoryScores: string,
  error?: string | null,
  flagged: boolean,
  model: string,
};

export type UpdateAIFeedbackInput = {
  comment?: string | null,
  contentType?: AIFeedbackContentType | null,
  documentID?: string | null,
  feedbackType?: AIFeedbackFeedbackType | null,
  generatedContent?: string | null,
  gradeID?: string | null,
  id: string,
  identityId?: string | null,
  messageId?: string | null,
  metadata?: string | null,
  model?: string | null,
  owner?: string | null,
  prompt?: string | null,
  reasons?: AIFeedbackReasons | null,
  sessionId?: string | null,
  unitID?: string | null,
};

export type UpdateAgentJobInput = {
  completedAt?: string | null,
  documentID?: string | null,
  error?: string | null,
  estimatedCost?: number | null,
  id: string,
  identityId?: string | null,
  metadata?: string | null,
  modelUsed?: string | null,
  responseId?: string | null,
  retryCount?: number | null,
  startedAt?: string | null,
  status?: string | null,
  tokensUsed?: number | null,
  type?: string | null,
  unitID?: string | null,
  webhookData?: string | null,
};

export type UpdateAssignmentInput = {
  dueDate?: string | null,
  id: string,
  learner?: string | null,
  owner?: string | null,
  readableGroups?: Array< string | null > | null,
  sectionID?: string | null,
  status?: AssignmentStatus | null,
  unitID?: string | null,
  writableGroups?: Array< string | null > | null,
};

export type UpdateAssistantChatInput = {
  additionalInstructions?: string | null,
  archived?: boolean | null,
  draft?: string | null,
  id: string,
  inputTokens?: string | null,
  messages?: string | null,
  model?: string | null,
  moderationFlag?: boolean | null,
  outputTokens?: string | null,
  owner?: string | null,
  threadId?: string | null,
  threadInstructions?: string | null,
};

export type UpdateAssistantChatFileInput = {
  chatID?: string | null,
  fileID?: string | null,
  id: string,
};

export type UpdateDocumentInput = {
  extractedText?: string | null,
  fileSize?: number | null,
  filename?: string | null,
  id: string,
  identityId?: string | null,
  learner?: string | null,
  metadata?: string | null,
  mimeType?: string | null,
  owner?: string | null,
  pageCount?: number | null,
  readableGroups?: Array< string | null > | null,
  resumeState?: string | null,
  s3Key?: string | null,
  sectionID?: string | null,
  status?: string | null,
  uploadedAt?: string | null,
  writableGroups?: Array< string | null > | null,
  yjsSnapshot?: string | null,
};

export type UpdateDocumentQuestionInput = {
  documentID?: string | null,
  id: string,
  questionID?: string | null,
};

export type UpdateDocumentWordInput = {
  documentID?: string | null,
  id: string,
  wordID?: string | null,
};

export type UpdateFileInput = {
  byHex?: string | null,
  description?: string | null,
  documentID?: string | null,
  duration?: number | null,
  embedding?: FileEmbeddingInput | null,
  generated?: boolean | null,
  hex?: string | null,
  id: string,
  identityId?: string | null,
  level?: FileLevel | null,
  mimeType?: string | null,
  model?: string | null,
  name?: string | null,
  owner?: string | null,
  path?: string | null,
  prompt?: string | null,
  size?: number | null,
  thumbnail?: string | null,
  variant?: string | null,
  waveformData?: string | null,
  yjsSnapshot?: string | null,
};

export type UpdateGradeInput = {
  accuracy?: number | null,
  complete?: boolean | null,
  data?: string | null,
  feedback?: string | null,
  files?: Array< string | null > | null,
  id: string,
  identityId?: string | null,
  instructor?: string | null,
  instructorGroup?: string | null,
  moderation?: GradeModerationInput | null,
  percentComplete?: number | null,
  sectionID?: string | null,
  timerStarted?: boolean | null,
  unitID?: string | null,
  unitVersion?: number | null,
};

export type UpdateParsedContentInput = {
  conceptsJSON?: string | null,
  documentID?: string | null,
  fileID?: string | null,
  id: string,
  identityId?: string | null,
  importedAt?: string | null,
  metadata?: string | null,
  modelUsed?: string | null,
  objectivesJSON?: string | null,
  owner?: string | null,
  processingTime?: number | null,
  questionsJSON?: string | null,
  responseId?: string | null,
  summariesJSON?: string | null,
  tokensUsed?: number | null,
  vocabularyJSON?: string | null,
};

export type UpdateQuestionInput = {
  answer?: string | null,
  answerAudio?: Array< string | null > | null,
  answerAudioWaveformData?: string | null,
  audio?: Array< string | null > | null,
  audioWaveformData?: string | null,
  byPromptHex?: string | null,
  choices?: string | null,
  difficulty?: string | null,
  embedding?: QuestionEmbeddingInput | null,
  generated?: boolean | null,
  hint?: string | null,
  id: string,
  identityId?: string | null,
  importedAt?: string | null,
  metadata?: string | null,
  model?: string | null,
  moderation?: QuestionModerationInput | null,
  owner?: string | null,
  prompt?: string | null,
  promptHex?: string | null,
  thumbnail?: string | null,
  yjsSnapshot?: string | null,
};

export type UpdateQuestionFileInput = {
  fileID?: string | null,
  id: string,
  questionID?: string | null,
};

export type UpdateQuestionUnitInput = {
  id: string,
  questionID?: string | null,
  unitID?: string | null,
};

export type UpdateQuestionWordInput = {
  id: string,
  questionID?: string | null,
  wordID?: string | null,
};

export type UpdateSectionInput = {
  backgroundColor?: string | null,
  code?: string | null,
  curveAssignments?: Array< string | null > | null,
  curveEnabled?: boolean | null,
  curveMethod?: string | null,
  description?: string | null,
  embedding?: SectionEmbeddingInput | null,
  featuredImage?: string | null,
  id: string,
  identityId?: string | null,
  instructor?: string | null,
  learner?: string | null,
  name?: string | null,
  owner?: string | null,
  readableGroups?: Array< string | null > | null,
  status?: SectionStatus | null,
  thumbnail?: string | null,
  writableGroups?: Array< string | null > | null,
};

export type UpdateSettingsInput = {
  assistantVoice?: string | null,
  autoAnalyzeDocuments?: boolean | null,
  defaultAIModel?: string | null,
  documentAnalysisModel?: string | null,
  editorFontSize?: number | null,
  editorTheme?: string | null,
  emailNotifications?: boolean | null,
  id: string,
  identityId?: string | null,
  language?: string | null,
  metadata?: string | null,
  owner?: string | null,
  timezone?: string | null,
  webhookNotifications?: boolean | null,
};

export type UpdateUnitInput = {
  data?: string | null,
  description?: string | null,
  embedding?: UnitEmbeddingInput | null,
  featuredImage?: string | null,
  id: string,
  identityId?: string | null,
  isDraft?: boolean | null,
  moderation?: UnitModerationInput | null,
  name?: string | null,
  number?: number | null,
  owner?: string | null,
  publishedAt?: number | null,
  readableGroups?: Array< string | null > | null,
  status?: UnitStatus | null,
  thumbnail?: string | null,
  timeLimitSeconds?: number | null,
  writableGroups?: Array< string | null > | null,
  yjsSnapshot?: string | null,
};

export type UpdateUnitDocumentInput = {
  documentID?: string | null,
  id: string,
  unitID?: string | null,
};

export type UpdateUnitFileInput = {
  fileID?: string | null,
  id: string,
  unitID?: string | null,
};

export type UpdateUnitWordInput = {
  id: string,
  unitID?: string | null,
  wordID?: string | null,
};

export type UpdateWordInput = {
  audio?: Array< string | null > | null,
  definition?: string | null,
  definitionAudio?: Array< string | null > | null,
  definitionWaveformData?: string | null,
  embedding?: WordEmbeddingInput | null,
  id: string,
  identityId?: string | null,
  importedAt?: string | null,
  moderation?: WordModerationInput | null,
  owner?: string | null,
  phrase?: string | null,
  pronunciation?: string | null,
  rubyTags?: string | null,
  waveformData?: string | null,
  yjsSnapshot?: string | null,
};

export type UpdateWordFileInput = {
  fileID?: string | null,
  id: string,
  wordID?: string | null,
};

export type ModelSubscriptionAIFeedbackFilterInput = {
  and?: Array< ModelSubscriptionAIFeedbackFilterInput | null > | null,
  comment?: ModelSubscriptionStringInput | null,
  contentType?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  documentID?: ModelSubscriptionIDInput | null,
  feedbackType?: ModelSubscriptionStringInput | null,
  generatedContent?: ModelSubscriptionStringInput | null,
  gradeID?: ModelSubscriptionIDInput | null,
  id?: ModelSubscriptionIDInput | null,
  identityId?: ModelSubscriptionStringInput | null,
  messageId?: ModelSubscriptionStringInput | null,
  metadata?: ModelSubscriptionStringInput | null,
  model?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionAIFeedbackFilterInput | null > | null,
  owner?: ModelStringInput | null,
  prompt?: ModelSubscriptionStringInput | null,
  reasons?: ModelSubscriptionStringInput | null,
  sessionId?: ModelSubscriptionStringInput | null,
  unitID?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionStringInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionIDInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionAgentJobFilterInput = {
  and?: Array< ModelSubscriptionAgentJobFilterInput | null > | null,
  completedAt?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  documentID?: ModelSubscriptionIDInput | null,
  error?: ModelSubscriptionStringInput | null,
  estimatedCost?: ModelSubscriptionFloatInput | null,
  id?: ModelSubscriptionIDInput | null,
  identityId?: ModelSubscriptionStringInput | null,
  metadata?: ModelSubscriptionStringInput | null,
  modelUsed?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionAgentJobFilterInput | null > | null,
  owner?: ModelStringInput | null,
  responseId?: ModelSubscriptionStringInput | null,
  retryCount?: ModelSubscriptionIntInput | null,
  startedAt?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  tokensUsed?: ModelSubscriptionIntInput | null,
  type?: ModelSubscriptionStringInput | null,
  unitID?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  webhookData?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionFloatInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionIntInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionAssignmentFilterInput = {
  and?: Array< ModelSubscriptionAssignmentFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  dueDate?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  learner?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionAssignmentFilterInput | null > | null,
  owner?: ModelStringInput | null,
  readableGroups?: ModelSubscriptionStringInput | null,
  sectionID?: ModelSubscriptionIDInput | null,
  status?: ModelSubscriptionStringInput | null,
  unitID?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  writableGroups?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionAssistantChatFilterInput = {
  additionalInstructions?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionAssistantChatFilterInput | null > | null,
  archived?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  draft?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  inputTokens?: ModelSubscriptionStringInput | null,
  messages?: ModelSubscriptionStringInput | null,
  model?: ModelSubscriptionStringInput | null,
  moderationFlag?: ModelSubscriptionBooleanInput | null,
  or?: Array< ModelSubscriptionAssistantChatFilterInput | null > | null,
  outputTokens?: ModelSubscriptionStringInput | null,
  owner?: ModelStringInput | null,
  threadId?: ModelSubscriptionStringInput | null,
  threadInstructions?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionBooleanInput = {
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelSubscriptionAssistantChatFileFilterInput = {
  and?: Array< ModelSubscriptionAssistantChatFileFilterInput | null > | null,
  chatID?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  fileID?: ModelSubscriptionIDInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionAssistantChatFileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionDocumentFilterInput = {
  and?: Array< ModelSubscriptionDocumentFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  extractedText?: ModelSubscriptionStringInput | null,
  fileSize?: ModelSubscriptionIntInput | null,
  filename?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  identityId?: ModelSubscriptionStringInput | null,
  learner?: ModelSubscriptionStringInput | null,
  metadata?: ModelSubscriptionStringInput | null,
  mimeType?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionDocumentFilterInput | null > | null,
  owner?: ModelStringInput | null,
  pageCount?: ModelSubscriptionIntInput | null,
  readableGroups?: ModelSubscriptionStringInput | null,
  resumeState?: ModelSubscriptionStringInput | null,
  s3Key?: ModelSubscriptionStringInput | null,
  sectionID?: ModelSubscriptionIDInput | null,
  status?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  uploadedAt?: ModelSubscriptionStringInput | null,
  writableGroups?: ModelSubscriptionStringInput | null,
  yjsSnapshot?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionDocumentQuestionFilterInput = {
  and?: Array< ModelSubscriptionDocumentQuestionFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  documentID?: ModelSubscriptionIDInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionDocumentQuestionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionDocumentWordFilterInput = {
  and?: Array< ModelSubscriptionDocumentWordFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  documentID?: ModelSubscriptionIDInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionDocumentWordFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  wordID?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionFileFilterInput = {
  and?: Array< ModelSubscriptionFileFilterInput | null > | null,
  byHex?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  documentID?: ModelSubscriptionIDInput | null,
  duration?: ModelSubscriptionIntInput | null,
  generated?: ModelSubscriptionBooleanInput | null,
  hex?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  identityId?: ModelSubscriptionStringInput | null,
  level?: ModelSubscriptionStringInput | null,
  mimeType?: ModelSubscriptionStringInput | null,
  model?: ModelSubscriptionStringInput | null,
  name?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionFileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  path?: ModelSubscriptionStringInput | null,
  prompt?: ModelSubscriptionStringInput | null,
  size?: ModelSubscriptionIntInput | null,
  thumbnail?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  variant?: ModelSubscriptionStringInput | null,
  waveformData?: ModelSubscriptionStringInput | null,
  yjsSnapshot?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionGradeFilterInput = {
  accuracy?: ModelSubscriptionFloatInput | null,
  and?: Array< ModelSubscriptionGradeFilterInput | null > | null,
  complete?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  data?: ModelSubscriptionStringInput | null,
  feedback?: ModelSubscriptionStringInput | null,
  files?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  identityId?: ModelSubscriptionStringInput | null,
  instructor?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionGradeFilterInput | null > | null,
  owner?: ModelStringInput | null,
  percentComplete?: ModelSubscriptionFloatInput | null,
  sectionID?: ModelSubscriptionIDInput | null,
  timerStarted?: ModelSubscriptionBooleanInput | null,
  unitID?: ModelSubscriptionIDInput | null,
  unitVersion?: ModelSubscriptionIntInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionParsedContentFilterInput = {
  and?: Array< ModelSubscriptionParsedContentFilterInput | null > | null,
  conceptsJSON?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  documentID?: ModelSubscriptionIDInput | null,
  fileID?: ModelSubscriptionIDInput | null,
  id?: ModelSubscriptionIDInput | null,
  identityId?: ModelSubscriptionStringInput | null,
  importedAt?: ModelSubscriptionStringInput | null,
  metadata?: ModelSubscriptionStringInput | null,
  modelUsed?: ModelSubscriptionStringInput | null,
  objectivesJSON?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionParsedContentFilterInput | null > | null,
  owner?: ModelStringInput | null,
  processingTime?: ModelSubscriptionIntInput | null,
  questionsJSON?: ModelSubscriptionStringInput | null,
  responseId?: ModelSubscriptionStringInput | null,
  summariesJSON?: ModelSubscriptionStringInput | null,
  tokensUsed?: ModelSubscriptionIntInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  vocabularyJSON?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionQuestionFilterInput = {
  and?: Array< ModelSubscriptionQuestionFilterInput | null > | null,
  answer?: ModelSubscriptionStringInput | null,
  answerAudio?: ModelSubscriptionStringInput | null,
  answerAudioWaveformData?: ModelSubscriptionStringInput | null,
  audio?: ModelSubscriptionStringInput | null,
  audioWaveformData?: ModelSubscriptionStringInput | null,
  byPromptHex?: ModelSubscriptionStringInput | null,
  choices?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  difficulty?: ModelSubscriptionStringInput | null,
  generated?: ModelSubscriptionBooleanInput | null,
  hint?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  identityId?: ModelSubscriptionStringInput | null,
  importedAt?: ModelSubscriptionStringInput | null,
  metadata?: ModelSubscriptionStringInput | null,
  model?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionQuestionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  prompt?: ModelSubscriptionStringInput | null,
  promptHex?: ModelSubscriptionStringInput | null,
  thumbnail?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  yjsSnapshot?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionQuestionFileFilterInput = {
  and?: Array< ModelSubscriptionQuestionFileFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  fileID?: ModelSubscriptionIDInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionQuestionFileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionQuestionUnitFilterInput = {
  and?: Array< ModelSubscriptionQuestionUnitFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionQuestionUnitFilterInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelSubscriptionIDInput | null,
  unitID?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionQuestionWordFilterInput = {
  and?: Array< ModelSubscriptionQuestionWordFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionQuestionWordFilterInput | null > | null,
  owner?: ModelStringInput | null,
  questionID?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  wordID?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionSectionFilterInput = {
  and?: Array< ModelSubscriptionSectionFilterInput | null > | null,
  backgroundColor?: ModelSubscriptionStringInput | null,
  code?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  curveAssignments?: ModelSubscriptionStringInput | null,
  curveEnabled?: ModelSubscriptionBooleanInput | null,
  curveMethod?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  featuredImage?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  identityId?: ModelSubscriptionStringInput | null,
  instructor?: ModelSubscriptionStringInput | null,
  learner?: ModelSubscriptionStringInput | null,
  name?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionSectionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  readableGroups?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  thumbnail?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  writableGroups?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionSettingsFilterInput = {
  and?: Array< ModelSubscriptionSettingsFilterInput | null > | null,
  assistantVoice?: ModelSubscriptionStringInput | null,
  autoAnalyzeDocuments?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  defaultAIModel?: ModelSubscriptionStringInput | null,
  documentAnalysisModel?: ModelSubscriptionStringInput | null,
  editorFontSize?: ModelSubscriptionIntInput | null,
  editorTheme?: ModelSubscriptionStringInput | null,
  emailNotifications?: ModelSubscriptionBooleanInput | null,
  id?: ModelSubscriptionIDInput | null,
  identityId?: ModelSubscriptionStringInput | null,
  language?: ModelSubscriptionStringInput | null,
  metadata?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionSettingsFilterInput | null > | null,
  owner?: ModelStringInput | null,
  timezone?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  webhookNotifications?: ModelSubscriptionBooleanInput | null,
};

export type ModelSubscriptionUnitFilterInput = {
  and?: Array< ModelSubscriptionUnitFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  data?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  featuredImage?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  identityId?: ModelSubscriptionStringInput | null,
  isDraft?: ModelSubscriptionBooleanInput | null,
  name?: ModelSubscriptionStringInput | null,
  number?: ModelSubscriptionFloatInput | null,
  or?: Array< ModelSubscriptionUnitFilterInput | null > | null,
  owner?: ModelStringInput | null,
  publishedAt?: ModelSubscriptionIntInput | null,
  readableGroups?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  thumbnail?: ModelSubscriptionStringInput | null,
  timeLimitSeconds?: ModelSubscriptionIntInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  writableGroups?: ModelSubscriptionStringInput | null,
  yjsSnapshot?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionUnitDocumentFilterInput = {
  and?: Array< ModelSubscriptionUnitDocumentFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  documentID?: ModelSubscriptionIDInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionUnitDocumentFilterInput | null > | null,
  owner?: ModelStringInput | null,
  unitID?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionUnitFileFilterInput = {
  and?: Array< ModelSubscriptionUnitFileFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  fileID?: ModelSubscriptionIDInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionUnitFileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  unitID?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionUnitWordFilterInput = {
  and?: Array< ModelSubscriptionUnitWordFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionUnitWordFilterInput | null > | null,
  owner?: ModelStringInput | null,
  unitID?: ModelSubscriptionIDInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  wordID?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionWordFilterInput = {
  and?: Array< ModelSubscriptionWordFilterInput | null > | null,
  audio?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  definition?: ModelSubscriptionStringInput | null,
  definitionAudio?: ModelSubscriptionStringInput | null,
  definitionWaveformData?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  identityId?: ModelSubscriptionStringInput | null,
  importedAt?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionWordFilterInput | null > | null,
  owner?: ModelStringInput | null,
  phrase?: ModelSubscriptionStringInput | null,
  pronunciation?: ModelSubscriptionStringInput | null,
  rubyTags?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  waveformData?: ModelSubscriptionStringInput | null,
  yjsSnapshot?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionWordFileFilterInput = {
  and?: Array< ModelSubscriptionWordFileFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  fileID?: ModelSubscriptionIDInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionWordFileFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  wordID?: ModelSubscriptionIDInput | null,
};

export type GetAIFeedbackQueryVariables = {
  id: string,
};

export type GetAIFeedbackQuery = {
  getAIFeedback?:  {
    __typename: "AIFeedback",
    comment?: string | null,
    contentType?: AIFeedbackContentType | null,
    createdAt: string,
    documentID?: string | null,
    feedbackType?: AIFeedbackFeedbackType | null,
    generatedContent?: string | null,
    gradeID?: string | null,
    id: string,
    identityId?: string | null,
    messageId?: string | null,
    metadata?: string | null,
    model?: string | null,
    owner?: string | null,
    prompt?: string | null,
    reasons?: AIFeedbackReasons | null,
    sessionId?: string | null,
    unitID?: string | null,
    updatedAt: string,
  } | null,
};

export type GetAgentJobQueryVariables = {
  id: string,
};

export type GetAgentJobQuery = {
  getAgentJob?:  {
    __typename: "AgentJob",
    completedAt?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    error?: string | null,
    estimatedCost?: number | null,
    id: string,
    identityId?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    owner?: string | null,
    responseId?: string | null,
    retryCount?: number | null,
    startedAt?: string | null,
    status: string,
    tokensUsed?: number | null,
    type: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID?: string | null,
    updatedAt: string,
    webhookData?: string | null,
  } | null,
};

export type GetAssignmentQueryVariables = {
  id: string,
};

export type GetAssignmentQuery = {
  getAssignment?:  {
    __typename: "Assignment",
    createdAt: string,
    dueDate?: string | null,
    id: string,
    learner?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    section?:  {
      __typename: "Section",
      backgroundColor?: string | null,
      code?: string | null,
      createdAt: string,
      curveAssignments?: Array< string | null > | null,
      curveEnabled?: boolean | null,
      curveMethod?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      instructor?: string | null,
      learner?: string | null,
      name?: string | null,
      owner?: string | null,
      readableGroups?: Array< string | null > | null,
      status?: SectionStatus | null,
      thumbnail?: string | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
    } | null,
    sectionID: string,
    status?: AssignmentStatus | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type GetAssistantChatQueryVariables = {
  id: string,
};

export type GetAssistantChatQuery = {
  getAssistantChat?:  {
    __typename: "AssistantChat",
    additionalInstructions?: string | null,
    archived?: boolean | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    draft?: string | null,
    id: string,
    inputTokens?: string | null,
    messages?: string | null,
    model?: string | null,
    moderationFlag?: boolean | null,
    outputTokens?: string | null,
    owner?: string | null,
    threadId?: string | null,
    threadInstructions?: string | null,
    updatedAt: string,
  } | null,
};

export type GetAssistantChatFileQueryVariables = {
  id: string,
};

export type GetAssistantChatFileQuery = {
  getAssistantChatFile?:  {
    __typename: "AssistantChatFile",
    chat?:  {
      __typename: "AssistantChat",
      additionalInstructions?: string | null,
      archived?: boolean | null,
      createdAt: string,
      draft?: string | null,
      id: string,
      inputTokens?: string | null,
      messages?: string | null,
      model?: string | null,
      moderationFlag?: boolean | null,
      outputTokens?: string | null,
      owner?: string | null,
      threadId?: string | null,
      threadInstructions?: string | null,
      updatedAt: string,
    } | null,
    chatID: string,
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type GetDocumentQueryVariables = {
  id: string,
};

export type GetDocumentQuery = {
  getDocument?:  {
    __typename: "Document",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    extractedText?: string | null,
    fileSize?: number | null,
    filename: string,
    files?:  {
      __typename: "ModelFileConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    learner?: string | null,
    metadata?: string | null,
    mimeType?: string | null,
    owner?: string | null,
    pageCount?: number | null,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    resumeState?: string | null,
    s3Key: string,
    sectionID?: string | null,
    status: string,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    uploadedAt?: string | null,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type GetDocumentQuestionQueryVariables = {
  id: string,
};

export type GetDocumentQuestionQuery = {
  getDocumentQuestion?:  {
    __typename: "DocumentQuestion",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type GetDocumentWordQueryVariables = {
  id: string,
};

export type GetDocumentWordQuery = {
  getDocumentWord?:  {
    __typename: "DocumentWord",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type GetFileQueryVariables = {
  id: string,
};

export type GetFileQuery = {
  getFile?:  {
    __typename: "File",
    byHex?: string | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    duration?: number | null,
    embedding?:  {
      __typename: "FileEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hex?: string | null,
    id: string,
    identityId: string,
    level?: FileLevel | null,
    mimeType?: string | null,
    model?: string | null,
    name?: string | null,
    owner: string,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    path: string,
    prompt?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    size?: number | null,
    thumbnail?: string | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    variant?: string | null,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type GetGradeQueryVariables = {
  id: string,
};

export type GetGradeQuery = {
  getGrade?:  {
    __typename: "Grade",
    accuracy?: number | null,
    complete?: boolean | null,
    createdAt: string,
    data?: string | null,
    feedback?: string | null,
    files?: Array< string | null > | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    instructorGroup?: string | null,
    moderation?:  {
      __typename: "GradeModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    percentComplete?: number | null,
    sectionID?: string | null,
    timerStarted?: boolean | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    unitVersion?: number | null,
    updatedAt: string,
  } | null,
};

export type GetParsedContentQueryVariables = {
  id: string,
};

export type GetParsedContentQuery = {
  getParsedContent?:  {
    __typename: "ParsedContent",
    conceptsJSON?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    objectivesJSON?: string | null,
    owner?: string | null,
    processingTime?: number | null,
    questionsJSON?: string | null,
    responseId?: string | null,
    summariesJSON?: string | null,
    tokensUsed?: number | null,
    updatedAt: string,
    vocabularyJSON?: string | null,
  } | null,
};

export type GetQuestionQueryVariables = {
  id: string,
};

export type GetQuestionQuery = {
  getQuestion?:  {
    __typename: "Question",
    answer?: string | null,
    answerAudio?: Array< string | null > | null,
    answerAudioWaveformData?: string | null,
    audio?: Array< string | null > | null,
    audioWaveformData?: string | null,
    byPromptHex?: string | null,
    choices?: string | null,
    createdAt: string,
    difficulty?: string | null,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "QuestionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hint?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    model?: string | null,
    moderation?:  {
      __typename: "QuestionModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    prompt?: string | null,
    promptHex?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    thumbnail?: string | null,
    updatedAt: string,
    yjsSnapshot?: string | null,
  } | null,
};

export type GetQuestionFileQueryVariables = {
  id: string,
};

export type GetQuestionFileQuery = {
  getQuestionFile?:  {
    __typename: "QuestionFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type GetQuestionUnitQueryVariables = {
  id: string,
};

export type GetQuestionUnitQuery = {
  getQuestionUnit?:  {
    __typename: "QuestionUnit",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type GetQuestionWordQueryVariables = {
  id: string,
};

export type GetQuestionWordQuery = {
  getQuestionWord?:  {
    __typename: "QuestionWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type GetSectionQueryVariables = {
  id: string,
};

export type GetSectionQuery = {
  getSection?:  {
    __typename: "Section",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    backgroundColor?: string | null,
    code?: string | null,
    createdAt: string,
    curveAssignments?: Array< string | null > | null,
    curveEnabled?: boolean | null,
    curveMethod?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "SectionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    learner?: string | null,
    name?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    status?: SectionStatus | null,
    thumbnail?: string | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type GetSettingsQueryVariables = {
  id: string,
};

export type GetSettingsQuery = {
  getSettings?:  {
    __typename: "Settings",
    assistantVoice?: string | null,
    autoAnalyzeDocuments?: boolean | null,
    createdAt: string,
    defaultAIModel?: string | null,
    documentAnalysisModel?: string | null,
    editorFontSize?: number | null,
    editorTheme?: string | null,
    emailNotifications?: boolean | null,
    id: string,
    identityId?: string | null,
    language?: string | null,
    metadata?: string | null,
    owner?: string | null,
    timezone?: string | null,
    updatedAt: string,
    webhookNotifications?: boolean | null,
  } | null,
};

export type GetUnitQueryVariables = {
  id: string,
};

export type GetUnitQuery = {
  getUnit?:  {
    __typename: "Unit",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    data?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "UnitEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    grades?:  {
      __typename: "ModelGradeConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    isDraft?: boolean | null,
    moderation?:  {
      __typename: "UnitModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    name?: string | null,
    number?: number | null,
    owner?: string | null,
    publishedAt?: number | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    status?: UnitStatus | null,
    thumbnail?: string | null,
    timeLimitSeconds?: number | null,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type GetUnitDocumentQueryVariables = {
  id: string,
};

export type GetUnitDocumentQuery = {
  getUnitDocument?:  {
    __typename: "UnitDocument",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type GetUnitFileQueryVariables = {
  id: string,
};

export type GetUnitFileQuery = {
  getUnitFile?:  {
    __typename: "UnitFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type GetUnitWordQueryVariables = {
  id: string,
};

export type GetUnitWordQuery = {
  getUnitWord?:  {
    __typename: "UnitWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type GetWordQueryVariables = {
  id: string,
};

export type GetWordQuery = {
  getWord?:  {
    __typename: "Word",
    audio?: Array< string | null > | null,
    createdAt: string,
    definition?: string | null,
    definitionAudio?: Array< string | null > | null,
    definitionWaveformData?: string | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "WordEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    moderation?:  {
      __typename: "WordModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    phrase?: string | null,
    pronunciation?: string | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    rubyTags?: string | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type GetWordFileQueryVariables = {
  id: string,
};

export type GetWordFileQuery = {
  getWordFile?:  {
    __typename: "WordFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type ListAIFeedbacksQueryVariables = {
  filter?: ModelAIFeedbackFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAIFeedbacksQuery = {
  listAIFeedbacks?:  {
    __typename: "ModelAIFeedbackConnection",
    items:  Array< {
      __typename: "AIFeedback",
      comment?: string | null,
      contentType?: AIFeedbackContentType | null,
      createdAt: string,
      documentID?: string | null,
      feedbackType?: AIFeedbackFeedbackType | null,
      generatedContent?: string | null,
      gradeID?: string | null,
      id: string,
      identityId?: string | null,
      messageId?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      reasons?: AIFeedbackReasons | null,
      sessionId?: string | null,
      unitID?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListAgentJobsQueryVariables = {
  filter?: ModelAgentJobFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAgentJobsQuery = {
  listAgentJobs?:  {
    __typename: "ModelAgentJobConnection",
    items:  Array< {
      __typename: "AgentJob",
      completedAt?: string | null,
      createdAt: string,
      documentID?: string | null,
      error?: string | null,
      estimatedCost?: number | null,
      id: string,
      identityId?: string | null,
      metadata?: string | null,
      modelUsed?: string | null,
      owner?: string | null,
      responseId?: string | null,
      retryCount?: number | null,
      startedAt?: string | null,
      status: string,
      tokensUsed?: number | null,
      type: string,
      unitID?: string | null,
      updatedAt: string,
      webhookData?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListAssignmentsQueryVariables = {
  filter?: ModelAssignmentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAssignmentsQuery = {
  listAssignments?:  {
    __typename: "ModelAssignmentConnection",
    items:  Array< {
      __typename: "Assignment",
      createdAt: string,
      dueDate?: string | null,
      id: string,
      learner?: string | null,
      owner?: string | null,
      readableGroups?: Array< string | null > | null,
      sectionID: string,
      status?: AssignmentStatus | null,
      unitID: string,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListAssistantChatFilesQueryVariables = {
  filter?: ModelAssistantChatFileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAssistantChatFilesQuery = {
  listAssistantChatFiles?:  {
    __typename: "ModelAssistantChatFileConnection",
    items:  Array< {
      __typename: "AssistantChatFile",
      chatID: string,
      createdAt: string,
      fileID: string,
      id: string,
      owner?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListAssistantChatsQueryVariables = {
  filter?: ModelAssistantChatFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAssistantChatsQuery = {
  listAssistantChats?:  {
    __typename: "ModelAssistantChatConnection",
    items:  Array< {
      __typename: "AssistantChat",
      additionalInstructions?: string | null,
      archived?: boolean | null,
      createdAt: string,
      draft?: string | null,
      id: string,
      inputTokens?: string | null,
      messages?: string | null,
      model?: string | null,
      moderationFlag?: boolean | null,
      outputTokens?: string | null,
      owner?: string | null,
      threadId?: string | null,
      threadInstructions?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListDocumentQuestionsQueryVariables = {
  filter?: ModelDocumentQuestionFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListDocumentQuestionsQuery = {
  listDocumentQuestions?:  {
    __typename: "ModelDocumentQuestionConnection",
    items:  Array< {
      __typename: "DocumentQuestion",
      createdAt: string,
      documentID: string,
      id: string,
      owner?: string | null,
      questionID: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListDocumentWordsQueryVariables = {
  filter?: ModelDocumentWordFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListDocumentWordsQuery = {
  listDocumentWords?:  {
    __typename: "ModelDocumentWordConnection",
    items:  Array< {
      __typename: "DocumentWord",
      createdAt: string,
      documentID: string,
      id: string,
      owner?: string | null,
      updatedAt: string,
      wordID: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListDocumentsQueryVariables = {
  filter?: ModelDocumentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListDocumentsQuery = {
  listDocuments?:  {
    __typename: "ModelDocumentConnection",
    items:  Array< {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListFilesQueryVariables = {
  filter?: ModelFileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListFilesQuery = {
  listFiles?:  {
    __typename: "ModelFileConnection",
    items:  Array< {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListGradesQueryVariables = {
  filter?: ModelGradeFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListGradesQuery = {
  listGrades?:  {
    __typename: "ModelGradeConnection",
    items:  Array< {
      __typename: "Grade",
      accuracy?: number | null,
      complete?: boolean | null,
      createdAt: string,
      data?: string | null,
      feedback?: string | null,
      files?: Array< string | null > | null,
      id: string,
      identityId?: string | null,
      instructor?: string | null,
      instructorGroup?: string | null,
      owner?: string | null,
      percentComplete?: number | null,
      sectionID?: string | null,
      timerStarted?: boolean | null,
      unitID: string,
      unitVersion?: number | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListParsedContentsQueryVariables = {
  filter?: ModelParsedContentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListParsedContentsQuery = {
  listParsedContents?:  {
    __typename: "ModelParsedContentConnection",
    items:  Array< {
      __typename: "ParsedContent",
      conceptsJSON?: string | null,
      createdAt: string,
      documentID: string,
      fileID?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      modelUsed?: string | null,
      objectivesJSON?: string | null,
      owner?: string | null,
      processingTime?: number | null,
      questionsJSON?: string | null,
      responseId?: string | null,
      summariesJSON?: string | null,
      tokensUsed?: number | null,
      updatedAt: string,
      vocabularyJSON?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListQuestionFilesQueryVariables = {
  filter?: ModelQuestionFileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListQuestionFilesQuery = {
  listQuestionFiles?:  {
    __typename: "ModelQuestionFileConnection",
    items:  Array< {
      __typename: "QuestionFile",
      createdAt: string,
      fileID: string,
      id: string,
      owner?: string | null,
      questionID: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListQuestionUnitsQueryVariables = {
  filter?: ModelQuestionUnitFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListQuestionUnitsQuery = {
  listQuestionUnits?:  {
    __typename: "ModelQuestionUnitConnection",
    items:  Array< {
      __typename: "QuestionUnit",
      createdAt: string,
      id: string,
      owner?: string | null,
      questionID: string,
      unitID: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListQuestionWordsQueryVariables = {
  filter?: ModelQuestionWordFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListQuestionWordsQuery = {
  listQuestionWords?:  {
    __typename: "ModelQuestionWordConnection",
    items:  Array< {
      __typename: "QuestionWord",
      createdAt: string,
      id: string,
      owner?: string | null,
      questionID: string,
      updatedAt: string,
      wordID: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListQuestionsQueryVariables = {
  filter?: ModelQuestionFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListQuestionsQuery = {
  listQuestions?:  {
    __typename: "ModelQuestionConnection",
    items:  Array< {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListSectionStudentsQueryVariables = {
  sectionCode: string,
};

export type ListSectionStudentsQuery = {
  listSectionStudents?:  Array< {
    __typename: "StudentInfo",
    email?: string | null,
    id: string,
    name?: string | null,
  } | null > | null,
};

export type ListSectionsQueryVariables = {
  filter?: ModelSectionFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListSectionsQuery = {
  listSections?:  {
    __typename: "ModelSectionConnection",
    items:  Array< {
      __typename: "Section",
      backgroundColor?: string | null,
      code?: string | null,
      createdAt: string,
      curveAssignments?: Array< string | null > | null,
      curveEnabled?: boolean | null,
      curveMethod?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      instructor?: string | null,
      learner?: string | null,
      name?: string | null,
      owner?: string | null,
      readableGroups?: Array< string | null > | null,
      status?: SectionStatus | null,
      thumbnail?: string | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListSettingsQueryVariables = {
  filter?: ModelSettingsFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListSettingsQuery = {
  listSettings?:  {
    __typename: "ModelSettingsConnection",
    items:  Array< {
      __typename: "Settings",
      assistantVoice?: string | null,
      autoAnalyzeDocuments?: boolean | null,
      createdAt: string,
      defaultAIModel?: string | null,
      documentAnalysisModel?: string | null,
      editorFontSize?: number | null,
      editorTheme?: string | null,
      emailNotifications?: boolean | null,
      id: string,
      identityId?: string | null,
      language?: string | null,
      metadata?: string | null,
      owner?: string | null,
      timezone?: string | null,
      updatedAt: string,
      webhookNotifications?: boolean | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListUnitDocumentsQueryVariables = {
  filter?: ModelUnitDocumentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUnitDocumentsQuery = {
  listUnitDocuments?:  {
    __typename: "ModelUnitDocumentConnection",
    items:  Array< {
      __typename: "UnitDocument",
      createdAt: string,
      documentID: string,
      id: string,
      owner?: string | null,
      unitID: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListUnitFilesQueryVariables = {
  filter?: ModelUnitFileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUnitFilesQuery = {
  listUnitFiles?:  {
    __typename: "ModelUnitFileConnection",
    items:  Array< {
      __typename: "UnitFile",
      createdAt: string,
      fileID: string,
      id: string,
      owner?: string | null,
      unitID: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListUnitWordsQueryVariables = {
  filter?: ModelUnitWordFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUnitWordsQuery = {
  listUnitWords?:  {
    __typename: "ModelUnitWordConnection",
    items:  Array< {
      __typename: "UnitWord",
      createdAt: string,
      id: string,
      owner?: string | null,
      unitID: string,
      updatedAt: string,
      wordID: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListUnitsQueryVariables = {
  filter?: ModelUnitFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUnitsQuery = {
  listUnits?:  {
    __typename: "ModelUnitConnection",
    items:  Array< {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListWordFilesQueryVariables = {
  filter?: ModelWordFileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListWordFilesQuery = {
  listWordFiles?:  {
    __typename: "ModelWordFileConnection",
    items:  Array< {
      __typename: "WordFile",
      createdAt: string,
      fileID: string,
      id: string,
      owner?: string | null,
      updatedAt: string,
      wordID: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListWordsQueryVariables = {
  filter?: ModelWordFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListWordsQuery = {
  listWords?:  {
    __typename: "ModelWordConnection",
    items:  Array< {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ProcessImageQueryVariables = {
  image: string,
  model?: string | null,
};

export type ProcessImageQuery = {
  processImage?: string | null,
};

export type ProcessImageUrlQueryVariables = {
  imageUrl: string,
  model?: string | null,
};

export type ProcessImageUrlQuery = {
  processImageUrl?: string | null,
};

export type TranscribeQueryVariables = {
  audio: string,
  model?: string | null,
};

export type TranscribeQuery = {
  transcribe?: string | null,
};

export type TranscribeUrlQueryVariables = {
  audioUrl: string,
  model?: string | null,
};

export type TranscribeUrlQuery = {
  transcribeUrl?: string | null,
};

export type VerifyAudioQueryVariables = {
  audio: string,
  chatModel: string,
  expected: string,
  model?: string | null,
};

export type VerifyAudioQuery = {
  verifyAudio?: string | null,
};

export type VerifyAudioUrlQueryVariables = {
  audioUrl: string,
  chatModel: string,
  expected: string,
  model: string,
};

export type VerifyAudioUrlQuery = {
  verifyAudioUrl?: string | null,
};

export type VerifyDefinitionQueryVariables = {
  definition: string,
  expected: string,
  model?: string | null,
  phrase: string,
};

export type VerifyDefinitionQuery = {
  verifyDefinition?: string | null,
};

export type VerifyImageQueryVariables = {
  expected: string,
  image: string,
  model?: string | null,
};

export type VerifyImageQuery = {
  verifyImage?: string | null,
};

export type VerifyImageUrlQueryVariables = {
  expected: string,
  imageUrl: string,
  model?: string | null,
};

export type VerifyImageUrlQuery = {
  verifyImageUrl?: string | null,
};

export type VerifyShortAnswerQueryVariables = {
  answer: string,
  expected: string,
  model?: string | null,
  prompt: string,
};

export type VerifyShortAnswerQuery = {
  verifyShortAnswer?: string | null,
};

export type VerifyWordQueryVariables = {
  definition: string,
  expected: string,
  model?: string | null,
  word: string,
};

export type VerifyWordQuery = {
  verifyWord?: string | null,
};

export type AddSelfToSectionMutationVariables = {
  code: string,
};

export type AddSelfToSectionMutation = {
  addSelfToSection?: string | null,
};

export type AnalyzeDocumentMutationVariables = {
  fileID: string,
};

export type AnalyzeDocumentMutation = {
  analyzeDocument?:  {
    __typename: "AnalyzeDocumentResult",
    documentID?: string | null,
    fileID: string,
    message?: string | null,
    pageCount?: number | null,
    progress?: string | null,
    responseId?: string | null,
    success: boolean,
  } | null,
};

export type CancelDocumentAnalysisMutationVariables = {
  fileID: string,
};

export type CancelDocumentAnalysisMutation = {
  cancelDocumentAnalysis?:  {
    __typename: "CancelDocumentAnalysisResult",
    documentID?: string | null,
    fileID: string,
    message?: string | null,
    success: boolean,
  } | null,
};

export type ChatMutationVariables = {
  messages: string,
  model?: string | null,
};

export type ChatMutation = {
  chat?: string | null,
};

export type ChatAssistantThreadMutationVariables = {
  assistantId: string,
  messages: string,
};

export type ChatAssistantThreadMutation = {
  chatAssistantThread?: string | null,
};

export type ContentCompletionMutationVariables = {
  context?: string | null,
  prompt: string,
};

export type ContentCompletionMutation = {
  contentCompletion?: string | null,
};

export type CreateAIFeedbackMutationVariables = {
  condition?: ModelAIFeedbackConditionInput | null,
  input: CreateAIFeedbackInput,
};

export type CreateAIFeedbackMutation = {
  createAIFeedback?:  {
    __typename: "AIFeedback",
    comment?: string | null,
    contentType?: AIFeedbackContentType | null,
    createdAt: string,
    documentID?: string | null,
    feedbackType?: AIFeedbackFeedbackType | null,
    generatedContent?: string | null,
    gradeID?: string | null,
    id: string,
    identityId?: string | null,
    messageId?: string | null,
    metadata?: string | null,
    model?: string | null,
    owner?: string | null,
    prompt?: string | null,
    reasons?: AIFeedbackReasons | null,
    sessionId?: string | null,
    unitID?: string | null,
    updatedAt: string,
  } | null,
};

export type CreateAgentJobMutationVariables = {
  condition?: ModelAgentJobConditionInput | null,
  input: CreateAgentJobInput,
};

export type CreateAgentJobMutation = {
  createAgentJob?:  {
    __typename: "AgentJob",
    completedAt?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    error?: string | null,
    estimatedCost?: number | null,
    id: string,
    identityId?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    owner?: string | null,
    responseId?: string | null,
    retryCount?: number | null,
    startedAt?: string | null,
    status: string,
    tokensUsed?: number | null,
    type: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID?: string | null,
    updatedAt: string,
    webhookData?: string | null,
  } | null,
};

export type CreateAssignmentMutationVariables = {
  condition?: ModelAssignmentConditionInput | null,
  input: CreateAssignmentInput,
};

export type CreateAssignmentMutation = {
  createAssignment?:  {
    __typename: "Assignment",
    createdAt: string,
    dueDate?: string | null,
    id: string,
    learner?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    section?:  {
      __typename: "Section",
      backgroundColor?: string | null,
      code?: string | null,
      createdAt: string,
      curveAssignments?: Array< string | null > | null,
      curveEnabled?: boolean | null,
      curveMethod?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      instructor?: string | null,
      learner?: string | null,
      name?: string | null,
      owner?: string | null,
      readableGroups?: Array< string | null > | null,
      status?: SectionStatus | null,
      thumbnail?: string | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
    } | null,
    sectionID: string,
    status?: AssignmentStatus | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type CreateAssistantChatMutationVariables = {
  condition?: ModelAssistantChatConditionInput | null,
  input: CreateAssistantChatInput,
};

export type CreateAssistantChatMutation = {
  createAssistantChat?:  {
    __typename: "AssistantChat",
    additionalInstructions?: string | null,
    archived?: boolean | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    draft?: string | null,
    id: string,
    inputTokens?: string | null,
    messages?: string | null,
    model?: string | null,
    moderationFlag?: boolean | null,
    outputTokens?: string | null,
    owner?: string | null,
    threadId?: string | null,
    threadInstructions?: string | null,
    updatedAt: string,
  } | null,
};

export type CreateAssistantChatFileMutationVariables = {
  condition?: ModelAssistantChatFileConditionInput | null,
  input: CreateAssistantChatFileInput,
};

export type CreateAssistantChatFileMutation = {
  createAssistantChatFile?:  {
    __typename: "AssistantChatFile",
    chat?:  {
      __typename: "AssistantChat",
      additionalInstructions?: string | null,
      archived?: boolean | null,
      createdAt: string,
      draft?: string | null,
      id: string,
      inputTokens?: string | null,
      messages?: string | null,
      model?: string | null,
      moderationFlag?: boolean | null,
      outputTokens?: string | null,
      owner?: string | null,
      threadId?: string | null,
      threadInstructions?: string | null,
      updatedAt: string,
    } | null,
    chatID: string,
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type CreateDocumentMutationVariables = {
  condition?: ModelDocumentConditionInput | null,
  input: CreateDocumentInput,
};

export type CreateDocumentMutation = {
  createDocument?:  {
    __typename: "Document",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    extractedText?: string | null,
    fileSize?: number | null,
    filename: string,
    files?:  {
      __typename: "ModelFileConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    learner?: string | null,
    metadata?: string | null,
    mimeType?: string | null,
    owner?: string | null,
    pageCount?: number | null,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    resumeState?: string | null,
    s3Key: string,
    sectionID?: string | null,
    status: string,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    uploadedAt?: string | null,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type CreateDocumentQuestionMutationVariables = {
  condition?: ModelDocumentQuestionConditionInput | null,
  input: CreateDocumentQuestionInput,
};

export type CreateDocumentQuestionMutation = {
  createDocumentQuestion?:  {
    __typename: "DocumentQuestion",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type CreateDocumentWordMutationVariables = {
  condition?: ModelDocumentWordConditionInput | null,
  input: CreateDocumentWordInput,
};

export type CreateDocumentWordMutation = {
  createDocumentWord?:  {
    __typename: "DocumentWord",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type CreateFileMutationVariables = {
  condition?: ModelFileConditionInput | null,
  input: CreateFileInput,
};

export type CreateFileMutation = {
  createFile?:  {
    __typename: "File",
    byHex?: string | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    duration?: number | null,
    embedding?:  {
      __typename: "FileEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hex?: string | null,
    id: string,
    identityId: string,
    level?: FileLevel | null,
    mimeType?: string | null,
    model?: string | null,
    name?: string | null,
    owner: string,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    path: string,
    prompt?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    size?: number | null,
    thumbnail?: string | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    variant?: string | null,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type CreateGradeMutationVariables = {
  condition?: ModelGradeConditionInput | null,
  input: CreateGradeInput,
};

export type CreateGradeMutation = {
  createGrade?:  {
    __typename: "Grade",
    accuracy?: number | null,
    complete?: boolean | null,
    createdAt: string,
    data?: string | null,
    feedback?: string | null,
    files?: Array< string | null > | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    instructorGroup?: string | null,
    moderation?:  {
      __typename: "GradeModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    percentComplete?: number | null,
    sectionID?: string | null,
    timerStarted?: boolean | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    unitVersion?: number | null,
    updatedAt: string,
  } | null,
};

export type CreateParsedContentMutationVariables = {
  condition?: ModelParsedContentConditionInput | null,
  input: CreateParsedContentInput,
};

export type CreateParsedContentMutation = {
  createParsedContent?:  {
    __typename: "ParsedContent",
    conceptsJSON?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    objectivesJSON?: string | null,
    owner?: string | null,
    processingTime?: number | null,
    questionsJSON?: string | null,
    responseId?: string | null,
    summariesJSON?: string | null,
    tokensUsed?: number | null,
    updatedAt: string,
    vocabularyJSON?: string | null,
  } | null,
};

export type CreateQuestionMutationVariables = {
  condition?: ModelQuestionConditionInput | null,
  input: CreateQuestionInput,
};

export type CreateQuestionMutation = {
  createQuestion?:  {
    __typename: "Question",
    answer?: string | null,
    answerAudio?: Array< string | null > | null,
    answerAudioWaveformData?: string | null,
    audio?: Array< string | null > | null,
    audioWaveformData?: string | null,
    byPromptHex?: string | null,
    choices?: string | null,
    createdAt: string,
    difficulty?: string | null,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "QuestionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hint?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    model?: string | null,
    moderation?:  {
      __typename: "QuestionModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    prompt?: string | null,
    promptHex?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    thumbnail?: string | null,
    updatedAt: string,
    yjsSnapshot?: string | null,
  } | null,
};

export type CreateQuestionFileMutationVariables = {
  condition?: ModelQuestionFileConditionInput | null,
  input: CreateQuestionFileInput,
};

export type CreateQuestionFileMutation = {
  createQuestionFile?:  {
    __typename: "QuestionFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type CreateQuestionUnitMutationVariables = {
  condition?: ModelQuestionUnitConditionInput | null,
  input: CreateQuestionUnitInput,
};

export type CreateQuestionUnitMutation = {
  createQuestionUnit?:  {
    __typename: "QuestionUnit",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type CreateQuestionWordMutationVariables = {
  condition?: ModelQuestionWordConditionInput | null,
  input: CreateQuestionWordInput,
};

export type CreateQuestionWordMutation = {
  createQuestionWord?:  {
    __typename: "QuestionWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type CreateSectionMutationVariables = {
  condition?: ModelSectionConditionInput | null,
  input: CreateSectionInput,
};

export type CreateSectionMutation = {
  createSection?:  {
    __typename: "Section",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    backgroundColor?: string | null,
    code?: string | null,
    createdAt: string,
    curveAssignments?: Array< string | null > | null,
    curveEnabled?: boolean | null,
    curveMethod?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "SectionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    learner?: string | null,
    name?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    status?: SectionStatus | null,
    thumbnail?: string | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type CreateSectionGroupMutationVariables = {
  description: string,
  name: string,
};

export type CreateSectionGroupMutation = {
  createSectionGroup?: string | null,
};

export type CreateSettingsMutationVariables = {
  condition?: ModelSettingsConditionInput | null,
  input: CreateSettingsInput,
};

export type CreateSettingsMutation = {
  createSettings?:  {
    __typename: "Settings",
    assistantVoice?: string | null,
    autoAnalyzeDocuments?: boolean | null,
    createdAt: string,
    defaultAIModel?: string | null,
    documentAnalysisModel?: string | null,
    editorFontSize?: number | null,
    editorTheme?: string | null,
    emailNotifications?: boolean | null,
    id: string,
    identityId?: string | null,
    language?: string | null,
    metadata?: string | null,
    owner?: string | null,
    timezone?: string | null,
    updatedAt: string,
    webhookNotifications?: boolean | null,
  } | null,
};

export type CreateUnitMutationVariables = {
  condition?: ModelUnitConditionInput | null,
  input: CreateUnitInput,
};

export type CreateUnitMutation = {
  createUnit?:  {
    __typename: "Unit",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    data?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "UnitEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    grades?:  {
      __typename: "ModelGradeConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    isDraft?: boolean | null,
    moderation?:  {
      __typename: "UnitModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    name?: string | null,
    number?: number | null,
    owner?: string | null,
    publishedAt?: number | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    status?: UnitStatus | null,
    thumbnail?: string | null,
    timeLimitSeconds?: number | null,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type CreateUnitDocumentMutationVariables = {
  condition?: ModelUnitDocumentConditionInput | null,
  input: CreateUnitDocumentInput,
};

export type CreateUnitDocumentMutation = {
  createUnitDocument?:  {
    __typename: "UnitDocument",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type CreateUnitFileMutationVariables = {
  condition?: ModelUnitFileConditionInput | null,
  input: CreateUnitFileInput,
};

export type CreateUnitFileMutation = {
  createUnitFile?:  {
    __typename: "UnitFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type CreateUnitWordMutationVariables = {
  condition?: ModelUnitWordConditionInput | null,
  input: CreateUnitWordInput,
};

export type CreateUnitWordMutation = {
  createUnitWord?:  {
    __typename: "UnitWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type CreateWordMutationVariables = {
  condition?: ModelWordConditionInput | null,
  input: CreateWordInput,
};

export type CreateWordMutation = {
  createWord?:  {
    __typename: "Word",
    audio?: Array< string | null > | null,
    createdAt: string,
    definition?: string | null,
    definitionAudio?: Array< string | null > | null,
    definitionWaveformData?: string | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "WordEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    moderation?:  {
      __typename: "WordModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    phrase?: string | null,
    pronunciation?: string | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    rubyTags?: string | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type CreateWordFileMutationVariables = {
  condition?: ModelWordFileConditionInput | null,
  input: CreateWordFileInput,
};

export type CreateWordFileMutation = {
  createWordFile?:  {
    __typename: "WordFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type DeleteAIFeedbackMutationVariables = {
  condition?: ModelAIFeedbackConditionInput | null,
  input: DeleteAIFeedbackInput,
};

export type DeleteAIFeedbackMutation = {
  deleteAIFeedback?:  {
    __typename: "AIFeedback",
    comment?: string | null,
    contentType?: AIFeedbackContentType | null,
    createdAt: string,
    documentID?: string | null,
    feedbackType?: AIFeedbackFeedbackType | null,
    generatedContent?: string | null,
    gradeID?: string | null,
    id: string,
    identityId?: string | null,
    messageId?: string | null,
    metadata?: string | null,
    model?: string | null,
    owner?: string | null,
    prompt?: string | null,
    reasons?: AIFeedbackReasons | null,
    sessionId?: string | null,
    unitID?: string | null,
    updatedAt: string,
  } | null,
};

export type DeleteAgentJobMutationVariables = {
  condition?: ModelAgentJobConditionInput | null,
  input: DeleteAgentJobInput,
};

export type DeleteAgentJobMutation = {
  deleteAgentJob?:  {
    __typename: "AgentJob",
    completedAt?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    error?: string | null,
    estimatedCost?: number | null,
    id: string,
    identityId?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    owner?: string | null,
    responseId?: string | null,
    retryCount?: number | null,
    startedAt?: string | null,
    status: string,
    tokensUsed?: number | null,
    type: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID?: string | null,
    updatedAt: string,
    webhookData?: string | null,
  } | null,
};

export type DeleteAssignmentMutationVariables = {
  condition?: ModelAssignmentConditionInput | null,
  input: DeleteAssignmentInput,
};

export type DeleteAssignmentMutation = {
  deleteAssignment?:  {
    __typename: "Assignment",
    createdAt: string,
    dueDate?: string | null,
    id: string,
    learner?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    section?:  {
      __typename: "Section",
      backgroundColor?: string | null,
      code?: string | null,
      createdAt: string,
      curveAssignments?: Array< string | null > | null,
      curveEnabled?: boolean | null,
      curveMethod?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      instructor?: string | null,
      learner?: string | null,
      name?: string | null,
      owner?: string | null,
      readableGroups?: Array< string | null > | null,
      status?: SectionStatus | null,
      thumbnail?: string | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
    } | null,
    sectionID: string,
    status?: AssignmentStatus | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type DeleteAssistantChatMutationVariables = {
  condition?: ModelAssistantChatConditionInput | null,
  input: DeleteAssistantChatInput,
};

export type DeleteAssistantChatMutation = {
  deleteAssistantChat?:  {
    __typename: "AssistantChat",
    additionalInstructions?: string | null,
    archived?: boolean | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    draft?: string | null,
    id: string,
    inputTokens?: string | null,
    messages?: string | null,
    model?: string | null,
    moderationFlag?: boolean | null,
    outputTokens?: string | null,
    owner?: string | null,
    threadId?: string | null,
    threadInstructions?: string | null,
    updatedAt: string,
  } | null,
};

export type DeleteAssistantChatFileMutationVariables = {
  condition?: ModelAssistantChatFileConditionInput | null,
  input: DeleteAssistantChatFileInput,
};

export type DeleteAssistantChatFileMutation = {
  deleteAssistantChatFile?:  {
    __typename: "AssistantChatFile",
    chat?:  {
      __typename: "AssistantChat",
      additionalInstructions?: string | null,
      archived?: boolean | null,
      createdAt: string,
      draft?: string | null,
      id: string,
      inputTokens?: string | null,
      messages?: string | null,
      model?: string | null,
      moderationFlag?: boolean | null,
      outputTokens?: string | null,
      owner?: string | null,
      threadId?: string | null,
      threadInstructions?: string | null,
      updatedAt: string,
    } | null,
    chatID: string,
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type DeleteAssistantEditorMutationVariables = {
  assistantId: string,
  threadId: string,
};

export type DeleteAssistantEditorMutation = {
  deleteAssistantEditor?: string | null,
};

export type DeleteDocumentMutationVariables = {
  condition?: ModelDocumentConditionInput | null,
  input: DeleteDocumentInput,
};

export type DeleteDocumentMutation = {
  deleteDocument?:  {
    __typename: "Document",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    extractedText?: string | null,
    fileSize?: number | null,
    filename: string,
    files?:  {
      __typename: "ModelFileConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    learner?: string | null,
    metadata?: string | null,
    mimeType?: string | null,
    owner?: string | null,
    pageCount?: number | null,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    resumeState?: string | null,
    s3Key: string,
    sectionID?: string | null,
    status: string,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    uploadedAt?: string | null,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type DeleteDocumentQuestionMutationVariables = {
  condition?: ModelDocumentQuestionConditionInput | null,
  input: DeleteDocumentQuestionInput,
};

export type DeleteDocumentQuestionMutation = {
  deleteDocumentQuestion?:  {
    __typename: "DocumentQuestion",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type DeleteDocumentWordMutationVariables = {
  condition?: ModelDocumentWordConditionInput | null,
  input: DeleteDocumentWordInput,
};

export type DeleteDocumentWordMutation = {
  deleteDocumentWord?:  {
    __typename: "DocumentWord",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type DeleteFileMutationVariables = {
  condition?: ModelFileConditionInput | null,
  input: DeleteFileInput,
};

export type DeleteFileMutation = {
  deleteFile?:  {
    __typename: "File",
    byHex?: string | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    duration?: number | null,
    embedding?:  {
      __typename: "FileEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hex?: string | null,
    id: string,
    identityId: string,
    level?: FileLevel | null,
    mimeType?: string | null,
    model?: string | null,
    name?: string | null,
    owner: string,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    path: string,
    prompt?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    size?: number | null,
    thumbnail?: string | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    variant?: string | null,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type DeleteGradeMutationVariables = {
  condition?: ModelGradeConditionInput | null,
  input: DeleteGradeInput,
};

export type DeleteGradeMutation = {
  deleteGrade?:  {
    __typename: "Grade",
    accuracy?: number | null,
    complete?: boolean | null,
    createdAt: string,
    data?: string | null,
    feedback?: string | null,
    files?: Array< string | null > | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    instructorGroup?: string | null,
    moderation?:  {
      __typename: "GradeModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    percentComplete?: number | null,
    sectionID?: string | null,
    timerStarted?: boolean | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    unitVersion?: number | null,
    updatedAt: string,
  } | null,
};

export type DeleteParsedContentMutationVariables = {
  condition?: ModelParsedContentConditionInput | null,
  input: DeleteParsedContentInput,
};

export type DeleteParsedContentMutation = {
  deleteParsedContent?:  {
    __typename: "ParsedContent",
    conceptsJSON?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    objectivesJSON?: string | null,
    owner?: string | null,
    processingTime?: number | null,
    questionsJSON?: string | null,
    responseId?: string | null,
    summariesJSON?: string | null,
    tokensUsed?: number | null,
    updatedAt: string,
    vocabularyJSON?: string | null,
  } | null,
};

export type DeleteQuestionMutationVariables = {
  condition?: ModelQuestionConditionInput | null,
  input: DeleteQuestionInput,
};

export type DeleteQuestionMutation = {
  deleteQuestion?:  {
    __typename: "Question",
    answer?: string | null,
    answerAudio?: Array< string | null > | null,
    answerAudioWaveformData?: string | null,
    audio?: Array< string | null > | null,
    audioWaveformData?: string | null,
    byPromptHex?: string | null,
    choices?: string | null,
    createdAt: string,
    difficulty?: string | null,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "QuestionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hint?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    model?: string | null,
    moderation?:  {
      __typename: "QuestionModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    prompt?: string | null,
    promptHex?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    thumbnail?: string | null,
    updatedAt: string,
    yjsSnapshot?: string | null,
  } | null,
};

export type DeleteQuestionFileMutationVariables = {
  condition?: ModelQuestionFileConditionInput | null,
  input: DeleteQuestionFileInput,
};

export type DeleteQuestionFileMutation = {
  deleteQuestionFile?:  {
    __typename: "QuestionFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type DeleteQuestionUnitMutationVariables = {
  condition?: ModelQuestionUnitConditionInput | null,
  input: DeleteQuestionUnitInput,
};

export type DeleteQuestionUnitMutation = {
  deleteQuestionUnit?:  {
    __typename: "QuestionUnit",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type DeleteQuestionWordMutationVariables = {
  condition?: ModelQuestionWordConditionInput | null,
  input: DeleteQuestionWordInput,
};

export type DeleteQuestionWordMutation = {
  deleteQuestionWord?:  {
    __typename: "QuestionWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type DeleteSectionMutationVariables = {
  condition?: ModelSectionConditionInput | null,
  input: DeleteSectionInput,
};

export type DeleteSectionMutation = {
  deleteSection?:  {
    __typename: "Section",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    backgroundColor?: string | null,
    code?: string | null,
    createdAt: string,
    curveAssignments?: Array< string | null > | null,
    curveEnabled?: boolean | null,
    curveMethod?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "SectionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    learner?: string | null,
    name?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    status?: SectionStatus | null,
    thumbnail?: string | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type DeleteSettingsMutationVariables = {
  condition?: ModelSettingsConditionInput | null,
  input: DeleteSettingsInput,
};

export type DeleteSettingsMutation = {
  deleteSettings?:  {
    __typename: "Settings",
    assistantVoice?: string | null,
    autoAnalyzeDocuments?: boolean | null,
    createdAt: string,
    defaultAIModel?: string | null,
    documentAnalysisModel?: string | null,
    editorFontSize?: number | null,
    editorTheme?: string | null,
    emailNotifications?: boolean | null,
    id: string,
    identityId?: string | null,
    language?: string | null,
    metadata?: string | null,
    owner?: string | null,
    timezone?: string | null,
    updatedAt: string,
    webhookNotifications?: boolean | null,
  } | null,
};

export type DeleteUnitMutationVariables = {
  condition?: ModelUnitConditionInput | null,
  input: DeleteUnitInput,
};

export type DeleteUnitMutation = {
  deleteUnit?:  {
    __typename: "Unit",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    data?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "UnitEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    grades?:  {
      __typename: "ModelGradeConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    isDraft?: boolean | null,
    moderation?:  {
      __typename: "UnitModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    name?: string | null,
    number?: number | null,
    owner?: string | null,
    publishedAt?: number | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    status?: UnitStatus | null,
    thumbnail?: string | null,
    timeLimitSeconds?: number | null,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type DeleteUnitDocumentMutationVariables = {
  condition?: ModelUnitDocumentConditionInput | null,
  input: DeleteUnitDocumentInput,
};

export type DeleteUnitDocumentMutation = {
  deleteUnitDocument?:  {
    __typename: "UnitDocument",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type DeleteUnitFileMutationVariables = {
  condition?: ModelUnitFileConditionInput | null,
  input: DeleteUnitFileInput,
};

export type DeleteUnitFileMutation = {
  deleteUnitFile?:  {
    __typename: "UnitFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type DeleteUnitWordMutationVariables = {
  condition?: ModelUnitWordConditionInput | null,
  input: DeleteUnitWordInput,
};

export type DeleteUnitWordMutation = {
  deleteUnitWord?:  {
    __typename: "UnitWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type DeleteWordMutationVariables = {
  condition?: ModelWordConditionInput | null,
  input: DeleteWordInput,
};

export type DeleteWordMutation = {
  deleteWord?:  {
    __typename: "Word",
    audio?: Array< string | null > | null,
    createdAt: string,
    definition?: string | null,
    definitionAudio?: Array< string | null > | null,
    definitionWaveformData?: string | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "WordEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    moderation?:  {
      __typename: "WordModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    phrase?: string | null,
    pronunciation?: string | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    rubyTags?: string | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type DeleteWordFileMutationVariables = {
  condition?: ModelWordFileConditionInput | null,
  input: DeleteWordFileInput,
};

export type DeleteWordFileMutation = {
  deleteWordFile?:  {
    __typename: "WordFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type GenerateAudioMutationVariables = {
  model?: string | null,
  phrase: string,
  voice?: string | null,
};

export type GenerateAudioMutation = {
  generateAudio?: string | null,
};

export type GenerateAudioFileMutationVariables = {
  model: string,
  phrase: string,
  voice: string,
};

export type GenerateAudioFileMutation = {
  generateAudioFile?:  {
    __typename: "File",
    byHex?: string | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    duration?: number | null,
    embedding?:  {
      __typename: "FileEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hex?: string | null,
    id: string,
    identityId: string,
    level?: FileLevel | null,
    mimeType?: string | null,
    model?: string | null,
    name?: string | null,
    owner: string,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    path: string,
    prompt?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    size?: number | null,
    thumbnail?: string | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    variant?: string | null,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type GenerateEmbeddingMutationVariables = {
  content: string,
  dimensions?: number | null,
  model?: string | null,
};

export type GenerateEmbeddingMutation = {
  generateEmbedding?:  {
    __typename: "EmbeddingResult",
    dimensions: number,
    embedding: Array< number | null >,
    error?: string | null,
    model: string,
    tokenCount: number,
  } | null,
};

export type GenerateEmbeddingsMutationVariables = {
  fileID: string,
};

export type GenerateEmbeddingsMutation = {
  generateEmbeddings?:  {
    __typename: "GenerateEmbeddingsResult",
    documentID?: string | null,
    embeddingCount?: number | null,
    fileID: string,
    message?: string | null,
    success: boolean,
  } | null,
};

export type GenerateImageMutationVariables = {
  model?: string | null,
  phrase: string,
};

export type GenerateImageMutation = {
  generateImage?: string | null,
};

export type GenerateImageFileMutationVariables = {
  model?: string | null,
  phrase: string,
};

export type GenerateImageFileMutation = {
  generateImageFile?:  {
    __typename: "File",
    byHex?: string | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    duration?: number | null,
    embedding?:  {
      __typename: "FileEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hex?: string | null,
    id: string,
    identityId: string,
    level?: FileLevel | null,
    mimeType?: string | null,
    model?: string | null,
    name?: string | null,
    owner: string,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    path: string,
    prompt?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    size?: number | null,
    thumbnail?: string | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    variant?: string | null,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type InitAssistantEditorMutationVariables = {
  additionalInstructions: string,
  model: string,
};

export type InitAssistantEditorMutation = {
  initAssistantEditor?: string | null,
};

export type ModerateContentMutationVariables = {
  content: string,
};

export type ModerateContentMutation = {
  moderateContent?:  {
    __typename: "ModerationResult",
    categories: string,
    categoryScores: string,
    error?: string | null,
    flagged: boolean,
    model: string,
  } | null,
};

export type PredictUnitByDataMutationVariables = {
  data: string,
};

export type PredictUnitByDataMutation = {
  predictUnitByData?: string | null,
};

export type PredictUnitDataMutationVariables = {
  unitID: string,
};

export type PredictUnitDataMutation = {
  predictUnitData?: string | null,
};

export type SuggestBlocksMutationVariables = {
  currentContext?: string | null,
  unitStructure: string,
  userHistory?: string | null,
};

export type SuggestBlocksMutation = {
  suggestBlocks?: string | null,
};

export type UpdateAIFeedbackMutationVariables = {
  condition?: ModelAIFeedbackConditionInput | null,
  input: UpdateAIFeedbackInput,
};

export type UpdateAIFeedbackMutation = {
  updateAIFeedback?:  {
    __typename: "AIFeedback",
    comment?: string | null,
    contentType?: AIFeedbackContentType | null,
    createdAt: string,
    documentID?: string | null,
    feedbackType?: AIFeedbackFeedbackType | null,
    generatedContent?: string | null,
    gradeID?: string | null,
    id: string,
    identityId?: string | null,
    messageId?: string | null,
    metadata?: string | null,
    model?: string | null,
    owner?: string | null,
    prompt?: string | null,
    reasons?: AIFeedbackReasons | null,
    sessionId?: string | null,
    unitID?: string | null,
    updatedAt: string,
  } | null,
};

export type UpdateAgentJobMutationVariables = {
  condition?: ModelAgentJobConditionInput | null,
  input: UpdateAgentJobInput,
};

export type UpdateAgentJobMutation = {
  updateAgentJob?:  {
    __typename: "AgentJob",
    completedAt?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    error?: string | null,
    estimatedCost?: number | null,
    id: string,
    identityId?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    owner?: string | null,
    responseId?: string | null,
    retryCount?: number | null,
    startedAt?: string | null,
    status: string,
    tokensUsed?: number | null,
    type: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID?: string | null,
    updatedAt: string,
    webhookData?: string | null,
  } | null,
};

export type UpdateAssignmentMutationVariables = {
  condition?: ModelAssignmentConditionInput | null,
  input: UpdateAssignmentInput,
};

export type UpdateAssignmentMutation = {
  updateAssignment?:  {
    __typename: "Assignment",
    createdAt: string,
    dueDate?: string | null,
    id: string,
    learner?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    section?:  {
      __typename: "Section",
      backgroundColor?: string | null,
      code?: string | null,
      createdAt: string,
      curveAssignments?: Array< string | null > | null,
      curveEnabled?: boolean | null,
      curveMethod?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      instructor?: string | null,
      learner?: string | null,
      name?: string | null,
      owner?: string | null,
      readableGroups?: Array< string | null > | null,
      status?: SectionStatus | null,
      thumbnail?: string | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
    } | null,
    sectionID: string,
    status?: AssignmentStatus | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type UpdateAssistantChatMutationVariables = {
  condition?: ModelAssistantChatConditionInput | null,
  input: UpdateAssistantChatInput,
};

export type UpdateAssistantChatMutation = {
  updateAssistantChat?:  {
    __typename: "AssistantChat",
    additionalInstructions?: string | null,
    archived?: boolean | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    draft?: string | null,
    id: string,
    inputTokens?: string | null,
    messages?: string | null,
    model?: string | null,
    moderationFlag?: boolean | null,
    outputTokens?: string | null,
    owner?: string | null,
    threadId?: string | null,
    threadInstructions?: string | null,
    updatedAt: string,
  } | null,
};

export type UpdateAssistantChatFileMutationVariables = {
  condition?: ModelAssistantChatFileConditionInput | null,
  input: UpdateAssistantChatFileInput,
};

export type UpdateAssistantChatFileMutation = {
  updateAssistantChatFile?:  {
    __typename: "AssistantChatFile",
    chat?:  {
      __typename: "AssistantChat",
      additionalInstructions?: string | null,
      archived?: boolean | null,
      createdAt: string,
      draft?: string | null,
      id: string,
      inputTokens?: string | null,
      messages?: string | null,
      model?: string | null,
      moderationFlag?: boolean | null,
      outputTokens?: string | null,
      owner?: string | null,
      threadId?: string | null,
      threadInstructions?: string | null,
      updatedAt: string,
    } | null,
    chatID: string,
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type UpdateAssistantEditorMutationVariables = {
  additionalInstructions: string,
  assistantId: string,
  model?: string | null,
};

export type UpdateAssistantEditorMutation = {
  updateAssistantEditor?: string | null,
};

export type UpdateDocumentMutationVariables = {
  condition?: ModelDocumentConditionInput | null,
  input: UpdateDocumentInput,
};

export type UpdateDocumentMutation = {
  updateDocument?:  {
    __typename: "Document",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    extractedText?: string | null,
    fileSize?: number | null,
    filename: string,
    files?:  {
      __typename: "ModelFileConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    learner?: string | null,
    metadata?: string | null,
    mimeType?: string | null,
    owner?: string | null,
    pageCount?: number | null,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    resumeState?: string | null,
    s3Key: string,
    sectionID?: string | null,
    status: string,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    uploadedAt?: string | null,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type UpdateDocumentQuestionMutationVariables = {
  condition?: ModelDocumentQuestionConditionInput | null,
  input: UpdateDocumentQuestionInput,
};

export type UpdateDocumentQuestionMutation = {
  updateDocumentQuestion?:  {
    __typename: "DocumentQuestion",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type UpdateDocumentWordMutationVariables = {
  condition?: ModelDocumentWordConditionInput | null,
  input: UpdateDocumentWordInput,
};

export type UpdateDocumentWordMutation = {
  updateDocumentWord?:  {
    __typename: "DocumentWord",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type UpdateFileMutationVariables = {
  condition?: ModelFileConditionInput | null,
  input: UpdateFileInput,
};

export type UpdateFileMutation = {
  updateFile?:  {
    __typename: "File",
    byHex?: string | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    duration?: number | null,
    embedding?:  {
      __typename: "FileEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hex?: string | null,
    id: string,
    identityId: string,
    level?: FileLevel | null,
    mimeType?: string | null,
    model?: string | null,
    name?: string | null,
    owner: string,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    path: string,
    prompt?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    size?: number | null,
    thumbnail?: string | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    variant?: string | null,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type UpdateGradeMutationVariables = {
  condition?: ModelGradeConditionInput | null,
  input: UpdateGradeInput,
};

export type UpdateGradeMutation = {
  updateGrade?:  {
    __typename: "Grade",
    accuracy?: number | null,
    complete?: boolean | null,
    createdAt: string,
    data?: string | null,
    feedback?: string | null,
    files?: Array< string | null > | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    instructorGroup?: string | null,
    moderation?:  {
      __typename: "GradeModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    percentComplete?: number | null,
    sectionID?: string | null,
    timerStarted?: boolean | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    unitVersion?: number | null,
    updatedAt: string,
  } | null,
};

export type UpdateParsedContentMutationVariables = {
  condition?: ModelParsedContentConditionInput | null,
  input: UpdateParsedContentInput,
};

export type UpdateParsedContentMutation = {
  updateParsedContent?:  {
    __typename: "ParsedContent",
    conceptsJSON?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    objectivesJSON?: string | null,
    owner?: string | null,
    processingTime?: number | null,
    questionsJSON?: string | null,
    responseId?: string | null,
    summariesJSON?: string | null,
    tokensUsed?: number | null,
    updatedAt: string,
    vocabularyJSON?: string | null,
  } | null,
};

export type UpdateQuestionMutationVariables = {
  condition?: ModelQuestionConditionInput | null,
  input: UpdateQuestionInput,
};

export type UpdateQuestionMutation = {
  updateQuestion?:  {
    __typename: "Question",
    answer?: string | null,
    answerAudio?: Array< string | null > | null,
    answerAudioWaveformData?: string | null,
    audio?: Array< string | null > | null,
    audioWaveformData?: string | null,
    byPromptHex?: string | null,
    choices?: string | null,
    createdAt: string,
    difficulty?: string | null,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "QuestionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hint?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    model?: string | null,
    moderation?:  {
      __typename: "QuestionModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    prompt?: string | null,
    promptHex?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    thumbnail?: string | null,
    updatedAt: string,
    yjsSnapshot?: string | null,
  } | null,
};

export type UpdateQuestionFileMutationVariables = {
  condition?: ModelQuestionFileConditionInput | null,
  input: UpdateQuestionFileInput,
};

export type UpdateQuestionFileMutation = {
  updateQuestionFile?:  {
    __typename: "QuestionFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type UpdateQuestionUnitMutationVariables = {
  condition?: ModelQuestionUnitConditionInput | null,
  input: UpdateQuestionUnitInput,
};

export type UpdateQuestionUnitMutation = {
  updateQuestionUnit?:  {
    __typename: "QuestionUnit",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type UpdateQuestionWordMutationVariables = {
  condition?: ModelQuestionWordConditionInput | null,
  input: UpdateQuestionWordInput,
};

export type UpdateQuestionWordMutation = {
  updateQuestionWord?:  {
    __typename: "QuestionWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type UpdateSectionMutationVariables = {
  condition?: ModelSectionConditionInput | null,
  input: UpdateSectionInput,
};

export type UpdateSectionMutation = {
  updateSection?:  {
    __typename: "Section",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    backgroundColor?: string | null,
    code?: string | null,
    createdAt: string,
    curveAssignments?: Array< string | null > | null,
    curveEnabled?: boolean | null,
    curveMethod?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "SectionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    learner?: string | null,
    name?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    status?: SectionStatus | null,
    thumbnail?: string | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type UpdateSettingsMutationVariables = {
  condition?: ModelSettingsConditionInput | null,
  input: UpdateSettingsInput,
};

export type UpdateSettingsMutation = {
  updateSettings?:  {
    __typename: "Settings",
    assistantVoice?: string | null,
    autoAnalyzeDocuments?: boolean | null,
    createdAt: string,
    defaultAIModel?: string | null,
    documentAnalysisModel?: string | null,
    editorFontSize?: number | null,
    editorTheme?: string | null,
    emailNotifications?: boolean | null,
    id: string,
    identityId?: string | null,
    language?: string | null,
    metadata?: string | null,
    owner?: string | null,
    timezone?: string | null,
    updatedAt: string,
    webhookNotifications?: boolean | null,
  } | null,
};

export type UpdateUnitMutationVariables = {
  condition?: ModelUnitConditionInput | null,
  input: UpdateUnitInput,
};

export type UpdateUnitMutation = {
  updateUnit?:  {
    __typename: "Unit",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    data?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "UnitEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    grades?:  {
      __typename: "ModelGradeConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    isDraft?: boolean | null,
    moderation?:  {
      __typename: "UnitModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    name?: string | null,
    number?: number | null,
    owner?: string | null,
    publishedAt?: number | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    status?: UnitStatus | null,
    thumbnail?: string | null,
    timeLimitSeconds?: number | null,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type UpdateUnitDocumentMutationVariables = {
  condition?: ModelUnitDocumentConditionInput | null,
  input: UpdateUnitDocumentInput,
};

export type UpdateUnitDocumentMutation = {
  updateUnitDocument?:  {
    __typename: "UnitDocument",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type UpdateUnitFileMutationVariables = {
  condition?: ModelUnitFileConditionInput | null,
  input: UpdateUnitFileInput,
};

export type UpdateUnitFileMutation = {
  updateUnitFile?:  {
    __typename: "UnitFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type UpdateUnitWordMutationVariables = {
  condition?: ModelUnitWordConditionInput | null,
  input: UpdateUnitWordInput,
};

export type UpdateUnitWordMutation = {
  updateUnitWord?:  {
    __typename: "UnitWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type UpdateWordMutationVariables = {
  condition?: ModelWordConditionInput | null,
  input: UpdateWordInput,
};

export type UpdateWordMutation = {
  updateWord?:  {
    __typename: "Word",
    audio?: Array< string | null > | null,
    createdAt: string,
    definition?: string | null,
    definitionAudio?: Array< string | null > | null,
    definitionWaveformData?: string | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "WordEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    moderation?:  {
      __typename: "WordModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    phrase?: string | null,
    pronunciation?: string | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    rubyTags?: string | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type UpdateWordFileMutationVariables = {
  condition?: ModelWordFileConditionInput | null,
  input: UpdateWordFileInput,
};

export type UpdateWordFileMutation = {
  updateWordFile?:  {
    __typename: "WordFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type UseAssistantEditorMutationVariables = {
  assistantId: string,
  threadId: string,
  threadInstructions: string,
};

export type UseAssistantEditorMutation = {
  useAssistantEditor?: string | null,
};

export type OnCreateAIFeedbackSubscriptionVariables = {
  filter?: ModelSubscriptionAIFeedbackFilterInput | null,
  owner?: string | null,
};

export type OnCreateAIFeedbackSubscription = {
  onCreateAIFeedback?:  {
    __typename: "AIFeedback",
    comment?: string | null,
    contentType?: AIFeedbackContentType | null,
    createdAt: string,
    documentID?: string | null,
    feedbackType?: AIFeedbackFeedbackType | null,
    generatedContent?: string | null,
    gradeID?: string | null,
    id: string,
    identityId?: string | null,
    messageId?: string | null,
    metadata?: string | null,
    model?: string | null,
    owner?: string | null,
    prompt?: string | null,
    reasons?: AIFeedbackReasons | null,
    sessionId?: string | null,
    unitID?: string | null,
    updatedAt: string,
  } | null,
};

export type OnCreateAgentJobSubscriptionVariables = {
  filter?: ModelSubscriptionAgentJobFilterInput | null,
  owner?: string | null,
};

export type OnCreateAgentJobSubscription = {
  onCreateAgentJob?:  {
    __typename: "AgentJob",
    completedAt?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    error?: string | null,
    estimatedCost?: number | null,
    id: string,
    identityId?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    owner?: string | null,
    responseId?: string | null,
    retryCount?: number | null,
    startedAt?: string | null,
    status: string,
    tokensUsed?: number | null,
    type: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID?: string | null,
    updatedAt: string,
    webhookData?: string | null,
  } | null,
};

export type OnCreateAssignmentSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentFilterInput | null,
  owner?: string | null,
};

export type OnCreateAssignmentSubscription = {
  onCreateAssignment?:  {
    __typename: "Assignment",
    createdAt: string,
    dueDate?: string | null,
    id: string,
    learner?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    section?:  {
      __typename: "Section",
      backgroundColor?: string | null,
      code?: string | null,
      createdAt: string,
      curveAssignments?: Array< string | null > | null,
      curveEnabled?: boolean | null,
      curveMethod?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      instructor?: string | null,
      learner?: string | null,
      name?: string | null,
      owner?: string | null,
      readableGroups?: Array< string | null > | null,
      status?: SectionStatus | null,
      thumbnail?: string | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
    } | null,
    sectionID: string,
    status?: AssignmentStatus | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type OnCreateAssistantChatSubscriptionVariables = {
  filter?: ModelSubscriptionAssistantChatFilterInput | null,
  owner?: string | null,
};

export type OnCreateAssistantChatSubscription = {
  onCreateAssistantChat?:  {
    __typename: "AssistantChat",
    additionalInstructions?: string | null,
    archived?: boolean | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    draft?: string | null,
    id: string,
    inputTokens?: string | null,
    messages?: string | null,
    model?: string | null,
    moderationFlag?: boolean | null,
    outputTokens?: string | null,
    owner?: string | null,
    threadId?: string | null,
    threadInstructions?: string | null,
    updatedAt: string,
  } | null,
};

export type OnCreateAssistantChatFileSubscriptionVariables = {
  filter?: ModelSubscriptionAssistantChatFileFilterInput | null,
  owner?: string | null,
};

export type OnCreateAssistantChatFileSubscription = {
  onCreateAssistantChatFile?:  {
    __typename: "AssistantChatFile",
    chat?:  {
      __typename: "AssistantChat",
      additionalInstructions?: string | null,
      archived?: boolean | null,
      createdAt: string,
      draft?: string | null,
      id: string,
      inputTokens?: string | null,
      messages?: string | null,
      model?: string | null,
      moderationFlag?: boolean | null,
      outputTokens?: string | null,
      owner?: string | null,
      threadId?: string | null,
      threadInstructions?: string | null,
      updatedAt: string,
    } | null,
    chatID: string,
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type OnCreateDocumentSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentFilterInput | null,
  owner?: string | null,
};

export type OnCreateDocumentSubscription = {
  onCreateDocument?:  {
    __typename: "Document",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    extractedText?: string | null,
    fileSize?: number | null,
    filename: string,
    files?:  {
      __typename: "ModelFileConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    learner?: string | null,
    metadata?: string | null,
    mimeType?: string | null,
    owner?: string | null,
    pageCount?: number | null,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    resumeState?: string | null,
    s3Key: string,
    sectionID?: string | null,
    status: string,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    uploadedAt?: string | null,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnCreateDocumentQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentQuestionFilterInput | null,
  owner?: string | null,
};

export type OnCreateDocumentQuestionSubscription = {
  onCreateDocumentQuestion?:  {
    __typename: "DocumentQuestion",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type OnCreateDocumentWordSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentWordFilterInput | null,
  owner?: string | null,
};

export type OnCreateDocumentWordSubscription = {
  onCreateDocumentWord?:  {
    __typename: "DocumentWord",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type OnCreateFileSubscriptionVariables = {
  filter?: ModelSubscriptionFileFilterInput | null,
  owner?: string | null,
};

export type OnCreateFileSubscription = {
  onCreateFile?:  {
    __typename: "File",
    byHex?: string | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    duration?: number | null,
    embedding?:  {
      __typename: "FileEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hex?: string | null,
    id: string,
    identityId: string,
    level?: FileLevel | null,
    mimeType?: string | null,
    model?: string | null,
    name?: string | null,
    owner: string,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    path: string,
    prompt?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    size?: number | null,
    thumbnail?: string | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    variant?: string | null,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnCreateGradeSubscriptionVariables = {
  filter?: ModelSubscriptionGradeFilterInput | null,
  owner?: string | null,
};

export type OnCreateGradeSubscription = {
  onCreateGrade?:  {
    __typename: "Grade",
    accuracy?: number | null,
    complete?: boolean | null,
    createdAt: string,
    data?: string | null,
    feedback?: string | null,
    files?: Array< string | null > | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    instructorGroup?: string | null,
    moderation?:  {
      __typename: "GradeModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    percentComplete?: number | null,
    sectionID?: string | null,
    timerStarted?: boolean | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    unitVersion?: number | null,
    updatedAt: string,
  } | null,
};

export type OnCreateParsedContentSubscriptionVariables = {
  filter?: ModelSubscriptionParsedContentFilterInput | null,
  owner?: string | null,
};

export type OnCreateParsedContentSubscription = {
  onCreateParsedContent?:  {
    __typename: "ParsedContent",
    conceptsJSON?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    objectivesJSON?: string | null,
    owner?: string | null,
    processingTime?: number | null,
    questionsJSON?: string | null,
    responseId?: string | null,
    summariesJSON?: string | null,
    tokensUsed?: number | null,
    updatedAt: string,
    vocabularyJSON?: string | null,
  } | null,
};

export type OnCreateQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionFilterInput | null,
  owner?: string | null,
};

export type OnCreateQuestionSubscription = {
  onCreateQuestion?:  {
    __typename: "Question",
    answer?: string | null,
    answerAudio?: Array< string | null > | null,
    answerAudioWaveformData?: string | null,
    audio?: Array< string | null > | null,
    audioWaveformData?: string | null,
    byPromptHex?: string | null,
    choices?: string | null,
    createdAt: string,
    difficulty?: string | null,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "QuestionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hint?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    model?: string | null,
    moderation?:  {
      __typename: "QuestionModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    prompt?: string | null,
    promptHex?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    thumbnail?: string | null,
    updatedAt: string,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnCreateQuestionFileSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionFileFilterInput | null,
  owner?: string | null,
};

export type OnCreateQuestionFileSubscription = {
  onCreateQuestionFile?:  {
    __typename: "QuestionFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type OnCreateQuestionUnitSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionUnitFilterInput | null,
  owner?: string | null,
};

export type OnCreateQuestionUnitSubscription = {
  onCreateQuestionUnit?:  {
    __typename: "QuestionUnit",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type OnCreateQuestionWordSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionWordFilterInput | null,
  owner?: string | null,
};

export type OnCreateQuestionWordSubscription = {
  onCreateQuestionWord?:  {
    __typename: "QuestionWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type OnCreateSectionSubscriptionVariables = {
  filter?: ModelSubscriptionSectionFilterInput | null,
  owner?: string | null,
};

export type OnCreateSectionSubscription = {
  onCreateSection?:  {
    __typename: "Section",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    backgroundColor?: string | null,
    code?: string | null,
    createdAt: string,
    curveAssignments?: Array< string | null > | null,
    curveEnabled?: boolean | null,
    curveMethod?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "SectionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    learner?: string | null,
    name?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    status?: SectionStatus | null,
    thumbnail?: string | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type OnCreateSettingsSubscriptionVariables = {
  filter?: ModelSubscriptionSettingsFilterInput | null,
  owner?: string | null,
};

export type OnCreateSettingsSubscription = {
  onCreateSettings?:  {
    __typename: "Settings",
    assistantVoice?: string | null,
    autoAnalyzeDocuments?: boolean | null,
    createdAt: string,
    defaultAIModel?: string | null,
    documentAnalysisModel?: string | null,
    editorFontSize?: number | null,
    editorTheme?: string | null,
    emailNotifications?: boolean | null,
    id: string,
    identityId?: string | null,
    language?: string | null,
    metadata?: string | null,
    owner?: string | null,
    timezone?: string | null,
    updatedAt: string,
    webhookNotifications?: boolean | null,
  } | null,
};

export type OnCreateUnitSubscriptionVariables = {
  filter?: ModelSubscriptionUnitFilterInput | null,
  owner?: string | null,
};

export type OnCreateUnitSubscription = {
  onCreateUnit?:  {
    __typename: "Unit",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    data?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "UnitEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    grades?:  {
      __typename: "ModelGradeConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    isDraft?: boolean | null,
    moderation?:  {
      __typename: "UnitModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    name?: string | null,
    number?: number | null,
    owner?: string | null,
    publishedAt?: number | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    status?: UnitStatus | null,
    thumbnail?: string | null,
    timeLimitSeconds?: number | null,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnCreateUnitDocumentSubscriptionVariables = {
  filter?: ModelSubscriptionUnitDocumentFilterInput | null,
  owner?: string | null,
};

export type OnCreateUnitDocumentSubscription = {
  onCreateUnitDocument?:  {
    __typename: "UnitDocument",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type OnCreateUnitFileSubscriptionVariables = {
  filter?: ModelSubscriptionUnitFileFilterInput | null,
  owner?: string | null,
};

export type OnCreateUnitFileSubscription = {
  onCreateUnitFile?:  {
    __typename: "UnitFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type OnCreateUnitWordSubscriptionVariables = {
  filter?: ModelSubscriptionUnitWordFilterInput | null,
  owner?: string | null,
};

export type OnCreateUnitWordSubscription = {
  onCreateUnitWord?:  {
    __typename: "UnitWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type OnCreateWordSubscriptionVariables = {
  filter?: ModelSubscriptionWordFilterInput | null,
  owner?: string | null,
};

export type OnCreateWordSubscription = {
  onCreateWord?:  {
    __typename: "Word",
    audio?: Array< string | null > | null,
    createdAt: string,
    definition?: string | null,
    definitionAudio?: Array< string | null > | null,
    definitionWaveformData?: string | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "WordEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    moderation?:  {
      __typename: "WordModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    phrase?: string | null,
    pronunciation?: string | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    rubyTags?: string | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnCreateWordFileSubscriptionVariables = {
  filter?: ModelSubscriptionWordFileFilterInput | null,
  owner?: string | null,
};

export type OnCreateWordFileSubscription = {
  onCreateWordFile?:  {
    __typename: "WordFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type OnDeleteAIFeedbackSubscriptionVariables = {
  filter?: ModelSubscriptionAIFeedbackFilterInput | null,
  owner?: string | null,
};

export type OnDeleteAIFeedbackSubscription = {
  onDeleteAIFeedback?:  {
    __typename: "AIFeedback",
    comment?: string | null,
    contentType?: AIFeedbackContentType | null,
    createdAt: string,
    documentID?: string | null,
    feedbackType?: AIFeedbackFeedbackType | null,
    generatedContent?: string | null,
    gradeID?: string | null,
    id: string,
    identityId?: string | null,
    messageId?: string | null,
    metadata?: string | null,
    model?: string | null,
    owner?: string | null,
    prompt?: string | null,
    reasons?: AIFeedbackReasons | null,
    sessionId?: string | null,
    unitID?: string | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteAgentJobSubscriptionVariables = {
  filter?: ModelSubscriptionAgentJobFilterInput | null,
  owner?: string | null,
};

export type OnDeleteAgentJobSubscription = {
  onDeleteAgentJob?:  {
    __typename: "AgentJob",
    completedAt?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    error?: string | null,
    estimatedCost?: number | null,
    id: string,
    identityId?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    owner?: string | null,
    responseId?: string | null,
    retryCount?: number | null,
    startedAt?: string | null,
    status: string,
    tokensUsed?: number | null,
    type: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID?: string | null,
    updatedAt: string,
    webhookData?: string | null,
  } | null,
};

export type OnDeleteAssignmentSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentFilterInput | null,
  owner?: string | null,
};

export type OnDeleteAssignmentSubscription = {
  onDeleteAssignment?:  {
    __typename: "Assignment",
    createdAt: string,
    dueDate?: string | null,
    id: string,
    learner?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    section?:  {
      __typename: "Section",
      backgroundColor?: string | null,
      code?: string | null,
      createdAt: string,
      curveAssignments?: Array< string | null > | null,
      curveEnabled?: boolean | null,
      curveMethod?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      instructor?: string | null,
      learner?: string | null,
      name?: string | null,
      owner?: string | null,
      readableGroups?: Array< string | null > | null,
      status?: SectionStatus | null,
      thumbnail?: string | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
    } | null,
    sectionID: string,
    status?: AssignmentStatus | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type OnDeleteAssistantChatSubscriptionVariables = {
  filter?: ModelSubscriptionAssistantChatFilterInput | null,
  owner?: string | null,
};

export type OnDeleteAssistantChatSubscription = {
  onDeleteAssistantChat?:  {
    __typename: "AssistantChat",
    additionalInstructions?: string | null,
    archived?: boolean | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    draft?: string | null,
    id: string,
    inputTokens?: string | null,
    messages?: string | null,
    model?: string | null,
    moderationFlag?: boolean | null,
    outputTokens?: string | null,
    owner?: string | null,
    threadId?: string | null,
    threadInstructions?: string | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteAssistantChatFileSubscriptionVariables = {
  filter?: ModelSubscriptionAssistantChatFileFilterInput | null,
  owner?: string | null,
};

export type OnDeleteAssistantChatFileSubscription = {
  onDeleteAssistantChatFile?:  {
    __typename: "AssistantChatFile",
    chat?:  {
      __typename: "AssistantChat",
      additionalInstructions?: string | null,
      archived?: boolean | null,
      createdAt: string,
      draft?: string | null,
      id: string,
      inputTokens?: string | null,
      messages?: string | null,
      model?: string | null,
      moderationFlag?: boolean | null,
      outputTokens?: string | null,
      owner?: string | null,
      threadId?: string | null,
      threadInstructions?: string | null,
      updatedAt: string,
    } | null,
    chatID: string,
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteDocumentSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentFilterInput | null,
  owner?: string | null,
};

export type OnDeleteDocumentSubscription = {
  onDeleteDocument?:  {
    __typename: "Document",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    extractedText?: string | null,
    fileSize?: number | null,
    filename: string,
    files?:  {
      __typename: "ModelFileConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    learner?: string | null,
    metadata?: string | null,
    mimeType?: string | null,
    owner?: string | null,
    pageCount?: number | null,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    resumeState?: string | null,
    s3Key: string,
    sectionID?: string | null,
    status: string,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    uploadedAt?: string | null,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnDeleteDocumentQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentQuestionFilterInput | null,
  owner?: string | null,
};

export type OnDeleteDocumentQuestionSubscription = {
  onDeleteDocumentQuestion?:  {
    __typename: "DocumentQuestion",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteDocumentWordSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentWordFilterInput | null,
  owner?: string | null,
};

export type OnDeleteDocumentWordSubscription = {
  onDeleteDocumentWord?:  {
    __typename: "DocumentWord",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type OnDeleteFileSubscriptionVariables = {
  filter?: ModelSubscriptionFileFilterInput | null,
  owner?: string | null,
};

export type OnDeleteFileSubscription = {
  onDeleteFile?:  {
    __typename: "File",
    byHex?: string | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    duration?: number | null,
    embedding?:  {
      __typename: "FileEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hex?: string | null,
    id: string,
    identityId: string,
    level?: FileLevel | null,
    mimeType?: string | null,
    model?: string | null,
    name?: string | null,
    owner: string,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    path: string,
    prompt?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    size?: number | null,
    thumbnail?: string | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    variant?: string | null,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnDeleteGradeSubscriptionVariables = {
  filter?: ModelSubscriptionGradeFilterInput | null,
  owner?: string | null,
};

export type OnDeleteGradeSubscription = {
  onDeleteGrade?:  {
    __typename: "Grade",
    accuracy?: number | null,
    complete?: boolean | null,
    createdAt: string,
    data?: string | null,
    feedback?: string | null,
    files?: Array< string | null > | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    instructorGroup?: string | null,
    moderation?:  {
      __typename: "GradeModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    percentComplete?: number | null,
    sectionID?: string | null,
    timerStarted?: boolean | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    unitVersion?: number | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteParsedContentSubscriptionVariables = {
  filter?: ModelSubscriptionParsedContentFilterInput | null,
  owner?: string | null,
};

export type OnDeleteParsedContentSubscription = {
  onDeleteParsedContent?:  {
    __typename: "ParsedContent",
    conceptsJSON?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    objectivesJSON?: string | null,
    owner?: string | null,
    processingTime?: number | null,
    questionsJSON?: string | null,
    responseId?: string | null,
    summariesJSON?: string | null,
    tokensUsed?: number | null,
    updatedAt: string,
    vocabularyJSON?: string | null,
  } | null,
};

export type OnDeleteQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionFilterInput | null,
  owner?: string | null,
};

export type OnDeleteQuestionSubscription = {
  onDeleteQuestion?:  {
    __typename: "Question",
    answer?: string | null,
    answerAudio?: Array< string | null > | null,
    answerAudioWaveformData?: string | null,
    audio?: Array< string | null > | null,
    audioWaveformData?: string | null,
    byPromptHex?: string | null,
    choices?: string | null,
    createdAt: string,
    difficulty?: string | null,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "QuestionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hint?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    model?: string | null,
    moderation?:  {
      __typename: "QuestionModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    prompt?: string | null,
    promptHex?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    thumbnail?: string | null,
    updatedAt: string,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnDeleteQuestionFileSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionFileFilterInput | null,
  owner?: string | null,
};

export type OnDeleteQuestionFileSubscription = {
  onDeleteQuestionFile?:  {
    __typename: "QuestionFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteQuestionUnitSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionUnitFilterInput | null,
  owner?: string | null,
};

export type OnDeleteQuestionUnitSubscription = {
  onDeleteQuestionUnit?:  {
    __typename: "QuestionUnit",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteQuestionWordSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionWordFilterInput | null,
  owner?: string | null,
};

export type OnDeleteQuestionWordSubscription = {
  onDeleteQuestionWord?:  {
    __typename: "QuestionWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type OnDeleteSectionSubscriptionVariables = {
  filter?: ModelSubscriptionSectionFilterInput | null,
  owner?: string | null,
};

export type OnDeleteSectionSubscription = {
  onDeleteSection?:  {
    __typename: "Section",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    backgroundColor?: string | null,
    code?: string | null,
    createdAt: string,
    curveAssignments?: Array< string | null > | null,
    curveEnabled?: boolean | null,
    curveMethod?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "SectionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    learner?: string | null,
    name?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    status?: SectionStatus | null,
    thumbnail?: string | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type OnDeleteSettingsSubscriptionVariables = {
  filter?: ModelSubscriptionSettingsFilterInput | null,
  owner?: string | null,
};

export type OnDeleteSettingsSubscription = {
  onDeleteSettings?:  {
    __typename: "Settings",
    assistantVoice?: string | null,
    autoAnalyzeDocuments?: boolean | null,
    createdAt: string,
    defaultAIModel?: string | null,
    documentAnalysisModel?: string | null,
    editorFontSize?: number | null,
    editorTheme?: string | null,
    emailNotifications?: boolean | null,
    id: string,
    identityId?: string | null,
    language?: string | null,
    metadata?: string | null,
    owner?: string | null,
    timezone?: string | null,
    updatedAt: string,
    webhookNotifications?: boolean | null,
  } | null,
};

export type OnDeleteUnitSubscriptionVariables = {
  filter?: ModelSubscriptionUnitFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUnitSubscription = {
  onDeleteUnit?:  {
    __typename: "Unit",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    data?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "UnitEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    grades?:  {
      __typename: "ModelGradeConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    isDraft?: boolean | null,
    moderation?:  {
      __typename: "UnitModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    name?: string | null,
    number?: number | null,
    owner?: string | null,
    publishedAt?: number | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    status?: UnitStatus | null,
    thumbnail?: string | null,
    timeLimitSeconds?: number | null,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnDeleteUnitDocumentSubscriptionVariables = {
  filter?: ModelSubscriptionUnitDocumentFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUnitDocumentSubscription = {
  onDeleteUnitDocument?:  {
    __typename: "UnitDocument",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteUnitFileSubscriptionVariables = {
  filter?: ModelSubscriptionUnitFileFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUnitFileSubscription = {
  onDeleteUnitFile?:  {
    __typename: "UnitFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteUnitWordSubscriptionVariables = {
  filter?: ModelSubscriptionUnitWordFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUnitWordSubscription = {
  onDeleteUnitWord?:  {
    __typename: "UnitWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type OnDeleteWordSubscriptionVariables = {
  filter?: ModelSubscriptionWordFilterInput | null,
  owner?: string | null,
};

export type OnDeleteWordSubscription = {
  onDeleteWord?:  {
    __typename: "Word",
    audio?: Array< string | null > | null,
    createdAt: string,
    definition?: string | null,
    definitionAudio?: Array< string | null > | null,
    definitionWaveformData?: string | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "WordEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    moderation?:  {
      __typename: "WordModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    phrase?: string | null,
    pronunciation?: string | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    rubyTags?: string | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnDeleteWordFileSubscriptionVariables = {
  filter?: ModelSubscriptionWordFileFilterInput | null,
  owner?: string | null,
};

export type OnDeleteWordFileSubscription = {
  onDeleteWordFile?:  {
    __typename: "WordFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type OnUpdateAIFeedbackSubscriptionVariables = {
  filter?: ModelSubscriptionAIFeedbackFilterInput | null,
  owner?: string | null,
};

export type OnUpdateAIFeedbackSubscription = {
  onUpdateAIFeedback?:  {
    __typename: "AIFeedback",
    comment?: string | null,
    contentType?: AIFeedbackContentType | null,
    createdAt: string,
    documentID?: string | null,
    feedbackType?: AIFeedbackFeedbackType | null,
    generatedContent?: string | null,
    gradeID?: string | null,
    id: string,
    identityId?: string | null,
    messageId?: string | null,
    metadata?: string | null,
    model?: string | null,
    owner?: string | null,
    prompt?: string | null,
    reasons?: AIFeedbackReasons | null,
    sessionId?: string | null,
    unitID?: string | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateAgentJobSubscriptionVariables = {
  filter?: ModelSubscriptionAgentJobFilterInput | null,
  owner?: string | null,
};

export type OnUpdateAgentJobSubscription = {
  onUpdateAgentJob?:  {
    __typename: "AgentJob",
    completedAt?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    error?: string | null,
    estimatedCost?: number | null,
    id: string,
    identityId?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    owner?: string | null,
    responseId?: string | null,
    retryCount?: number | null,
    startedAt?: string | null,
    status: string,
    tokensUsed?: number | null,
    type: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID?: string | null,
    updatedAt: string,
    webhookData?: string | null,
  } | null,
};

export type OnUpdateAssignmentSubscriptionVariables = {
  filter?: ModelSubscriptionAssignmentFilterInput | null,
  owner?: string | null,
};

export type OnUpdateAssignmentSubscription = {
  onUpdateAssignment?:  {
    __typename: "Assignment",
    createdAt: string,
    dueDate?: string | null,
    id: string,
    learner?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    section?:  {
      __typename: "Section",
      backgroundColor?: string | null,
      code?: string | null,
      createdAt: string,
      curveAssignments?: Array< string | null > | null,
      curveEnabled?: boolean | null,
      curveMethod?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      instructor?: string | null,
      learner?: string | null,
      name?: string | null,
      owner?: string | null,
      readableGroups?: Array< string | null > | null,
      status?: SectionStatus | null,
      thumbnail?: string | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
    } | null,
    sectionID: string,
    status?: AssignmentStatus | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type OnUpdateAssistantChatSubscriptionVariables = {
  filter?: ModelSubscriptionAssistantChatFilterInput | null,
  owner?: string | null,
};

export type OnUpdateAssistantChatSubscription = {
  onUpdateAssistantChat?:  {
    __typename: "AssistantChat",
    additionalInstructions?: string | null,
    archived?: boolean | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    draft?: string | null,
    id: string,
    inputTokens?: string | null,
    messages?: string | null,
    model?: string | null,
    moderationFlag?: boolean | null,
    outputTokens?: string | null,
    owner?: string | null,
    threadId?: string | null,
    threadInstructions?: string | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateAssistantChatFileSubscriptionVariables = {
  filter?: ModelSubscriptionAssistantChatFileFilterInput | null,
  owner?: string | null,
};

export type OnUpdateAssistantChatFileSubscription = {
  onUpdateAssistantChatFile?:  {
    __typename: "AssistantChatFile",
    chat?:  {
      __typename: "AssistantChat",
      additionalInstructions?: string | null,
      archived?: boolean | null,
      createdAt: string,
      draft?: string | null,
      id: string,
      inputTokens?: string | null,
      messages?: string | null,
      model?: string | null,
      moderationFlag?: boolean | null,
      outputTokens?: string | null,
      owner?: string | null,
      threadId?: string | null,
      threadInstructions?: string | null,
      updatedAt: string,
    } | null,
    chatID: string,
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateDocumentSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentFilterInput | null,
  owner?: string | null,
};

export type OnUpdateDocumentSubscription = {
  onUpdateDocument?:  {
    __typename: "Document",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    extractedText?: string | null,
    fileSize?: number | null,
    filename: string,
    files?:  {
      __typename: "ModelFileConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    learner?: string | null,
    metadata?: string | null,
    mimeType?: string | null,
    owner?: string | null,
    pageCount?: number | null,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    resumeState?: string | null,
    s3Key: string,
    sectionID?: string | null,
    status: string,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    uploadedAt?: string | null,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnUpdateDocumentQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentQuestionFilterInput | null,
  owner?: string | null,
};

export type OnUpdateDocumentQuestionSubscription = {
  onUpdateDocumentQuestion?:  {
    __typename: "DocumentQuestion",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateDocumentWordSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentWordFilterInput | null,
  owner?: string | null,
};

export type OnUpdateDocumentWordSubscription = {
  onUpdateDocumentWord?:  {
    __typename: "DocumentWord",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type OnUpdateFileSubscriptionVariables = {
  filter?: ModelSubscriptionFileFilterInput | null,
  owner?: string | null,
};

export type OnUpdateFileSubscription = {
  onUpdateFile?:  {
    __typename: "File",
    byHex?: string | null,
    chatFiles?:  {
      __typename: "ModelAssistantChatFileConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    description?: string | null,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID?: string | null,
    duration?: number | null,
    embedding?:  {
      __typename: "FileEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hex?: string | null,
    id: string,
    identityId: string,
    level?: FileLevel | null,
    mimeType?: string | null,
    model?: string | null,
    name?: string | null,
    owner: string,
    parsedContent?:  {
      __typename: "ModelParsedContentConnection",
      nextToken?: string | null,
    } | null,
    path: string,
    prompt?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    size?: number | null,
    thumbnail?: string | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    variant?: string | null,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnUpdateGradeSubscriptionVariables = {
  filter?: ModelSubscriptionGradeFilterInput | null,
  owner?: string | null,
};

export type OnUpdateGradeSubscription = {
  onUpdateGrade?:  {
    __typename: "Grade",
    accuracy?: number | null,
    complete?: boolean | null,
    createdAt: string,
    data?: string | null,
    feedback?: string | null,
    files?: Array< string | null > | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    instructorGroup?: string | null,
    moderation?:  {
      __typename: "GradeModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    percentComplete?: number | null,
    sectionID?: string | null,
    timerStarted?: boolean | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    unitVersion?: number | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateParsedContentSubscriptionVariables = {
  filter?: ModelSubscriptionParsedContentFilterInput | null,
  owner?: string | null,
};

export type OnUpdateParsedContentSubscription = {
  onUpdateParsedContent?:  {
    __typename: "ParsedContent",
    conceptsJSON?: string | null,
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    modelUsed?: string | null,
    objectivesJSON?: string | null,
    owner?: string | null,
    processingTime?: number | null,
    questionsJSON?: string | null,
    responseId?: string | null,
    summariesJSON?: string | null,
    tokensUsed?: number | null,
    updatedAt: string,
    vocabularyJSON?: string | null,
  } | null,
};

export type OnUpdateQuestionSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionFilterInput | null,
  owner?: string | null,
};

export type OnUpdateQuestionSubscription = {
  onUpdateQuestion?:  {
    __typename: "Question",
    answer?: string | null,
    answerAudio?: Array< string | null > | null,
    answerAudioWaveformData?: string | null,
    audio?: Array< string | null > | null,
    audioWaveformData?: string | null,
    byPromptHex?: string | null,
    choices?: string | null,
    createdAt: string,
    difficulty?: string | null,
    documentQuestions?:  {
      __typename: "ModelDocumentQuestionConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "QuestionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    generated?: boolean | null,
    hint?: string | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    metadata?: string | null,
    model?: string | null,
    moderation?:  {
      __typename: "QuestionModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    prompt?: string | null,
    promptHex?: string | null,
    questionFiles?:  {
      __typename: "ModelQuestionFileConnection",
      nextToken?: string | null,
    } | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    thumbnail?: string | null,
    updatedAt: string,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnUpdateQuestionFileSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionFileFilterInput | null,
  owner?: string | null,
};

export type OnUpdateQuestionFileSubscription = {
  onUpdateQuestionFile?:  {
    __typename: "QuestionFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateQuestionUnitSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionUnitFilterInput | null,
  owner?: string | null,
};

export type OnUpdateQuestionUnitSubscription = {
  onUpdateQuestionUnit?:  {
    __typename: "QuestionUnit",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateQuestionWordSubscriptionVariables = {
  filter?: ModelSubscriptionQuestionWordFilterInput | null,
  owner?: string | null,
};

export type OnUpdateQuestionWordSubscription = {
  onUpdateQuestionWord?:  {
    __typename: "QuestionWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    question?:  {
      __typename: "Question",
      answer?: string | null,
      answerAudio?: Array< string | null > | null,
      answerAudioWaveformData?: string | null,
      audio?: Array< string | null > | null,
      audioWaveformData?: string | null,
      byPromptHex?: string | null,
      choices?: string | null,
      createdAt: string,
      difficulty?: string | null,
      generated?: boolean | null,
      hint?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      metadata?: string | null,
      model?: string | null,
      owner?: string | null,
      prompt?: string | null,
      promptHex?: string | null,
      thumbnail?: string | null,
      updatedAt: string,
      yjsSnapshot?: string | null,
    } | null,
    questionID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type OnUpdateSectionSubscriptionVariables = {
  filter?: ModelSubscriptionSectionFilterInput | null,
  owner?: string | null,
};

export type OnUpdateSectionSubscription = {
  onUpdateSection?:  {
    __typename: "Section",
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    backgroundColor?: string | null,
    code?: string | null,
    createdAt: string,
    curveAssignments?: Array< string | null > | null,
    curveEnabled?: boolean | null,
    curveMethod?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "SectionEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    id: string,
    identityId?: string | null,
    instructor?: string | null,
    learner?: string | null,
    name?: string | null,
    owner?: string | null,
    readableGroups?: Array< string | null > | null,
    status?: SectionStatus | null,
    thumbnail?: string | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
  } | null,
};

export type OnUpdateSettingsSubscriptionVariables = {
  filter?: ModelSubscriptionSettingsFilterInput | null,
  owner?: string | null,
};

export type OnUpdateSettingsSubscription = {
  onUpdateSettings?:  {
    __typename: "Settings",
    assistantVoice?: string | null,
    autoAnalyzeDocuments?: boolean | null,
    createdAt: string,
    defaultAIModel?: string | null,
    documentAnalysisModel?: string | null,
    editorFontSize?: number | null,
    editorTheme?: string | null,
    emailNotifications?: boolean | null,
    id: string,
    identityId?: string | null,
    language?: string | null,
    metadata?: string | null,
    owner?: string | null,
    timezone?: string | null,
    updatedAt: string,
    webhookNotifications?: boolean | null,
  } | null,
};

export type OnUpdateUnitSubscriptionVariables = {
  filter?: ModelSubscriptionUnitFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUnitSubscription = {
  onUpdateUnit?:  {
    __typename: "Unit",
    agentJobs?:  {
      __typename: "ModelAgentJobConnection",
      nextToken?: string | null,
    } | null,
    assignments?:  {
      __typename: "ModelAssignmentConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    data?: string | null,
    description?: string | null,
    embedding?:  {
      __typename: "UnitEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    featuredImage?: string | null,
    grades?:  {
      __typename: "ModelGradeConnection",
      nextToken?: string | null,
    } | null,
    id: string,
    identityId?: string | null,
    isDraft?: boolean | null,
    moderation?:  {
      __typename: "UnitModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    name?: string | null,
    number?: number | null,
    owner?: string | null,
    publishedAt?: number | null,
    questionUnits?:  {
      __typename: "ModelQuestionUnitConnection",
      nextToken?: string | null,
    } | null,
    readableGroups?: Array< string | null > | null,
    status?: UnitStatus | null,
    thumbnail?: string | null,
    timeLimitSeconds?: number | null,
    unitDocuments?:  {
      __typename: "ModelUnitDocumentConnection",
      nextToken?: string | null,
    } | null,
    unitFiles?:  {
      __typename: "ModelUnitFileConnection",
      nextToken?: string | null,
    } | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    writableGroups?: Array< string | null > | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnUpdateUnitDocumentSubscriptionVariables = {
  filter?: ModelSubscriptionUnitDocumentFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUnitDocumentSubscription = {
  onUpdateUnitDocument?:  {
    __typename: "UnitDocument",
    createdAt: string,
    document?:  {
      __typename: "Document",
      createdAt: string,
      extractedText?: string | null,
      fileSize?: number | null,
      filename: string,
      id: string,
      identityId?: string | null,
      learner?: string | null,
      metadata?: string | null,
      mimeType?: string | null,
      owner?: string | null,
      pageCount?: number | null,
      readableGroups?: Array< string | null > | null,
      resumeState?: string | null,
      s3Key: string,
      sectionID?: string | null,
      status: string,
      updatedAt: string,
      uploadedAt?: string | null,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    documentID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateUnitFileSubscriptionVariables = {
  filter?: ModelSubscriptionUnitFileFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUnitFileSubscription = {
  onUpdateUnitFile?:  {
    __typename: "UnitFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateUnitWordSubscriptionVariables = {
  filter?: ModelSubscriptionUnitWordFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUnitWordSubscription = {
  onUpdateUnitWord?:  {
    __typename: "UnitWord",
    createdAt: string,
    id: string,
    owner?: string | null,
    unit?:  {
      __typename: "Unit",
      createdAt: string,
      data?: string | null,
      description?: string | null,
      featuredImage?: string | null,
      id: string,
      identityId?: string | null,
      isDraft?: boolean | null,
      name?: string | null,
      number?: number | null,
      owner?: string | null,
      publishedAt?: number | null,
      readableGroups?: Array< string | null > | null,
      status?: UnitStatus | null,
      thumbnail?: string | null,
      timeLimitSeconds?: number | null,
      updatedAt: string,
      writableGroups?: Array< string | null > | null,
      yjsSnapshot?: string | null,
    } | null,
    unitID: string,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};

export type OnUpdateWordSubscriptionVariables = {
  filter?: ModelSubscriptionWordFilterInput | null,
  owner?: string | null,
};

export type OnUpdateWordSubscription = {
  onUpdateWord?:  {
    __typename: "Word",
    audio?: Array< string | null > | null,
    createdAt: string,
    definition?: string | null,
    definitionAudio?: Array< string | null > | null,
    definitionWaveformData?: string | null,
    documentWords?:  {
      __typename: "ModelDocumentWordConnection",
      nextToken?: string | null,
    } | null,
    embedding?:  {
      __typename: "WordEmbedding",
      dimensions?: number | null,
      embedding?: string | null,
      model?: string | null,
      version?: number | null,
      wordCount?: number | null,
    } | null,
    id: string,
    identityId?: string | null,
    importedAt?: string | null,
    moderation?:  {
      __typename: "WordModeration",
      checkedAt?: string | null,
      flags?: string | null,
      status?: string | null,
    } | null,
    owner?: string | null,
    phrase?: string | null,
    pronunciation?: string | null,
    questionWords?:  {
      __typename: "ModelQuestionWordConnection",
      nextToken?: string | null,
    } | null,
    rubyTags?: string | null,
    unitWords?:  {
      __typename: "ModelUnitWordConnection",
      nextToken?: string | null,
    } | null,
    updatedAt: string,
    waveformData?: string | null,
    wordFiles?:  {
      __typename: "ModelWordFileConnection",
      nextToken?: string | null,
    } | null,
    yjsSnapshot?: string | null,
  } | null,
};

export type OnUpdateWordFileSubscriptionVariables = {
  filter?: ModelSubscriptionWordFileFilterInput | null,
  owner?: string | null,
};

export type OnUpdateWordFileSubscription = {
  onUpdateWordFile?:  {
    __typename: "WordFile",
    createdAt: string,
    file?:  {
      __typename: "File",
      byHex?: string | null,
      createdAt: string,
      description?: string | null,
      documentID?: string | null,
      duration?: number | null,
      generated?: boolean | null,
      hex?: string | null,
      id: string,
      identityId: string,
      level?: FileLevel | null,
      mimeType?: string | null,
      model?: string | null,
      name?: string | null,
      owner: string,
      path: string,
      prompt?: string | null,
      size?: number | null,
      thumbnail?: string | null,
      updatedAt: string,
      variant?: string | null,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    fileID: string,
    id: string,
    owner?: string | null,
    updatedAt: string,
    word?:  {
      __typename: "Word",
      audio?: Array< string | null > | null,
      createdAt: string,
      definition?: string | null,
      definitionAudio?: Array< string | null > | null,
      definitionWaveformData?: string | null,
      id: string,
      identityId?: string | null,
      importedAt?: string | null,
      owner?: string | null,
      phrase?: string | null,
      pronunciation?: string | null,
      rubyTags?: string | null,
      updatedAt: string,
      waveformData?: string | null,
      yjsSnapshot?: string | null,
    } | null,
    wordID: string,
  } | null,
};
