import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncCollection, AsyncItem } from "@aws-amplify/datastore";

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

type EagerAssistant = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Assistant, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly model?: string | null;
  readonly assistantId?: string | null;
  readonly threadInstructions?: string | null;
  readonly additionalInstructions?: string | null;
  readonly messages?: string | null;
  readonly moderationFlag?: boolean | null;
  readonly identityId?: string | null;
  readonly threadId?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyAssistant = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Assistant, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly model?: string | null;
  readonly assistantId?: string | null;
  readonly threadInstructions?: string | null;
  readonly additionalInstructions?: string | null;
  readonly messages?: string | null;
  readonly moderationFlag?: boolean | null;
  readonly identityId?: string | null;
  readonly threadId?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Assistant = LazyLoading extends LazyLoadingDisabled ? EagerAssistant : LazyAssistant

export declare const Assistant: (new (init: ModelInit<Assistant>) => Assistant) & {
  copyOf(source: Assistant, mutator: (draft: MutableModel<Assistant>) => MutableModel<Assistant> | void): Assistant;
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
  readonly answerAudio?: (string | null)[] | null;
  readonly generated?: boolean | null;
  readonly model?: string | null;
  readonly promptHex?: string | null;
  readonly byPromptHex?: string | null;
  readonly thumbnail?: string | null;
  readonly units?: (QuestionUnit | null)[] | null;
  readonly words?: (QuestionWord | null)[] | null;
  readonly files?: (QuestionFile | null)[] | null;
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
  readonly answerAudio?: (string | null)[] | null;
  readonly generated?: boolean | null;
  readonly model?: string | null;
  readonly promptHex?: string | null;
  readonly byPromptHex?: string | null;
  readonly thumbnail?: string | null;
  readonly units: AsyncCollection<QuestionUnit>;
  readonly words: AsyncCollection<QuestionWord>;
  readonly files: AsyncCollection<QuestionFile>;
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
  readonly units?: (UnitFile | null)[] | null;
  readonly words?: (WordFile | null)[] | null;
  readonly questions?: (QuestionFile | null)[] | null;
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
  readonly units: AsyncCollection<UnitFile>;
  readonly words: AsyncCollection<WordFile>;
  readonly questions: AsyncCollection<QuestionFile>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type File = LazyLoading extends LazyLoadingDisabled ? EagerFile : LazyFile

export declare const File: (new (init: ModelInit<File>) => File) & {
  copyOf(source: File, mutator: (draft: MutableModel<File>) => MutableModel<File> | void): File;
}

type EagerChatHistory = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ChatHistory, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly messages?: string | null;
  readonly model?: string | null;
  readonly inputTokens?: string | null;
  readonly outputTokens?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyChatHistory = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ChatHistory, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly owner?: string | null;
  readonly messages?: string | null;
  readonly model?: string | null;
  readonly inputTokens?: string | null;
  readonly outputTokens?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type ChatHistory = LazyLoading extends LazyLoadingDisabled ? EagerChatHistory : LazyChatHistory

export declare const ChatHistory: (new (init: ModelInit<ChatHistory>) => ChatHistory) & {
  copyOf(source: ChatHistory, mutator: (draft: MutableModel<ChatHistory>) => MutableModel<ChatHistory> | void): ChatHistory;
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
  readonly files?: (UnitFile | null)[] | null;
  readonly words?: (UnitWord | null)[] | null;
  readonly questions?: (QuestionUnit | null)[] | null;
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
  readonly files: AsyncCollection<UnitFile>;
  readonly words: AsyncCollection<UnitWord>;
  readonly questions: AsyncCollection<QuestionUnit>;
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
  readonly definitionAudio?: (string | null)[] | null;
  readonly rubyTags?: string | null;
  readonly units?: (UnitWord | null)[] | null;
  readonly files?: (WordFile | null)[] | null;
  readonly questions?: (QuestionWord | null)[] | null;
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
  readonly definitionAudio?: (string | null)[] | null;
  readonly rubyTags?: string | null;
  readonly units: AsyncCollection<UnitWord>;
  readonly files: AsyncCollection<WordFile>;
  readonly questions: AsyncCollection<QuestionWord>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Word = LazyLoading extends LazyLoadingDisabled ? EagerWord : LazyWord

export declare const Word: (new (init: ModelInit<Word>) => Word) & {
  copyOf(source: Word, mutator: (draft: MutableModel<Word>) => MutableModel<Word> | void): Word;
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