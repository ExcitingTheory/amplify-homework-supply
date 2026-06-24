/**
 * @fileoverview Zod schemas for Word/Dictionary mock data
 * 
 * Validates Word and Question model structures.
 * 
 * @module schemas/word
 */

import { z } from 'zod';

/**
 * Word model matching Amplify DataStore schema
 */
export const wordSchema = z.object({
  id: z.string(),
  word: z.string(),
  phonetic: z.string().optional(),
  definition: z.string(),
  partOfSpeech: z.string().optional(),
  example: z.string().optional(),
  audioFileID: z.string().optional(),
  imageFileID: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.number().min(1).max(5).optional(),
  owner: z.string().optional(),
  published: z.boolean().optional(),
  embedding: z.array(z.number()).optional(),
  embeddingModel: z.string().optional(),
  embeddingDimensions: z.number().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  _version: z.number().optional(),
  _deleted: z.boolean().optional(),
  _lastChangedAt: z.number().optional(),
});

/**
 * Array of words
 */
export const wordsSchema = z.array(wordSchema);

/**
 * Question type enum
 */
export const questionTypeSchema = z.enum([
  'multiple-choice',
  'fill-in-blank',
  'audio-response',
  'drawing',
  'matching',
]);

/**
 * Question model matching Amplify DataStore schema
 */
export const questionSchema = z.object({
  id: z.string(),
  type: questionTypeSchema,
  question: z.string(),
  answers: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number()]).optional(),
  explanation: z.string().optional(),
  audioFileID: z.string().optional(),
  imageFileID: z.string().optional(),
  wordID: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.number().min(1).max(5).optional(),
  owner: z.string().optional(),
  published: z.boolean().optional(),
  embedding: z.array(z.number()).optional(),
  embeddingModel: z.string().optional(),
  embeddingDimensions: z.number().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  _version: z.number().optional(),
  _deleted: z.boolean().optional(),
  _lastChangedAt: z.number().optional(),
});

/**
 * Array of questions
 */
export const questionsSchema = z.array(questionSchema);

export type Word = z.infer<typeof wordSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;
