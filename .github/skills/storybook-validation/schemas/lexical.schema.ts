/**
 * @fileoverview Zod schemas for Lexical editor state
 * 
 * Validates Lexical EditorState JSON format used in Unit.data field.
 * 
 * @module schemas/lexical
 */

import { z } from 'zod';

/**
 * Base node properties common to all Lexical nodes
 */
const baseNodeSchema = z.object({
  type: z.string(),
  version: z.number().optional(),
});

/**
 * Text node
 */
export const textNodeSchema = baseNodeSchema.extend({
  type: z.literal('text'),
  text: z.string(),
  format: z.number().optional(),
  style: z.string().optional(),
  mode: z.string().optional(),
  detail: z.number().optional(),
});

/**
 * Paragraph node
 */
export const paragraphNodeSchema = baseNodeSchema.extend({
  type: z.literal('paragraph'),
  children: z.array(z.lazy(() => nodeSchema)),
  format: z.string().optional(),
  indent: z.number().optional(),
  direction: z.enum(['ltr', 'rtl']).nullable().optional(),
});

/**
 * Heading node
 */
export const headingNodeSchema = baseNodeSchema.extend({
  type: z.literal('heading'),
  tag: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
  children: z.array(z.lazy(() => nodeSchema)),
  format: z.string().optional(),
  indent: z.number().optional(),
  direction: z.enum(['ltr', 'rtl']).nullable().optional(),
});

/**
 * Quiz block node (custom)
 */
export const quizNodeSchema = baseNodeSchema.extend({
  type: z.literal('quiz'),
  id: z.string(),
  question: z.string(),
  answers: z.array(z.string()),
  correctAnswer: z.number().optional(),
  explanation: z.string().optional(),
});

/**
 * Answer block node (custom)
 */
export const answerNodeSchema = baseNodeSchema.extend({
  type: z.literal('answer'),
  id: z.string(),
  question: z.string().optional(),
  expectedAnswer: z.string().optional(),
});

/**
 * Custom answer block node (audio/drawing)
 */
export const customAnswerNodeSchema = baseNodeSchema.extend({
  type: z.literal('custom-answer'),
  id: z.string(),
  inputType: z.enum(['audio', 'drawing', 'both']),
  prompt: z.string().optional(),
  rubricPoints: z.number().optional(),
});

/**
 * Meaning association block node (custom)
 */
export const meaningAssociationNodeSchema = baseNodeSchema.extend({
  type: z.literal('meaning-association'),
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.object({
    wordId: z.string(),
    word: z.string(),
    meaning: z.string(),
  })),
});

/**
 * Generic node (for unknown/custom node types)
 */
const genericNodeSchema = baseNodeSchema.extend({
  children: z.array(z.lazy(() => nodeSchema)).optional(),
}).passthrough(); // Allow additional properties

/**
 * Union of all node types
 */
export const nodeSchema: z.ZodType<any> = z.union([
  textNodeSchema,
  paragraphNodeSchema,
  headingNodeSchema,
  quizNodeSchema,
  answerNodeSchema,
  customAnswerNodeSchema,
  meaningAssociationNodeSchema,
  genericNodeSchema,
]);

/**
 * Root node
 */
export const rootNodeSchema = z.object({
  type: z.literal('root'),
  format: z.string().optional(),
  indent: z.number().optional(),
  direction: z.enum(['ltr', 'rtl']).nullable().optional(),
  version: z.number(),
  children: z.array(nodeSchema),
});

/**
 * Complete Lexical editor state
 */
export const lexicalEditorStateSchema = z.object({
  root: rootNodeSchema,
});

export type LexicalEditorState = z.infer<typeof lexicalEditorStateSchema>;
export type LexicalNode = z.infer<typeof nodeSchema>;
