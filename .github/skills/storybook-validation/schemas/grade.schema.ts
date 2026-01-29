/**
 * @fileoverview Zod schemas for Grade/Assignment mock data
 * 
 * Validates Grade.data structure for workbook submissions.
 * 
 * @module schemas/grade
 */

import { z } from 'zod';

/**
 * Individual block grade data
 * Keyed by block ID in Grade.data JSON object
 */
export const blockGradeSchema = z.object({
  complete: z.boolean(),
  accuracy: z.number().min(0).max(100),
  userAnswer: z.any().optional(), // Can be string, array, object depending on block type
  feedback: z.string().optional(),
  attempts: z.number().min(0).optional(),
  lastAttemptAt: z.string().datetime().optional(),
});

/**
 * Grade.data structure (parsed from JSON string)
 * Object keyed by block IDs
 * 
 * @example
 * {
 *   "block-id-1": { complete: true, accuracy: 85, userAnswer: "..." },
 *   "block-id-2": { complete: false, accuracy: 0 }
 * }
 */
export const gradeDataSchema = z.record(z.string(), blockGradeSchema);

/**
 * Complete Grade model matching Amplify DataStore schema
 */
export const gradeSchema = z.object({
  id: z.string(),
  assignmentID: z.string(),
  unitID: z.string(),
  owner: z.string(), // Student username
  data: z.string(), // JSON stringified gradeDataSchema
  accuracy: z.number().min(0).max(100).optional(),
  complete: z.boolean(),
  completedAt: z.string().datetime().optional(),
  submittedAt: z.string().datetime().optional(),
  gradedBy: z.string().optional(), // Instructor username
  gradedAt: z.string().datetime().optional(),
  instructorFeedback: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  _version: z.number().optional(),
  _deleted: z.boolean().optional(),
  _lastChangedAt: z.number().optional(),
});

/**
 * Array of grades
 */
export const gradesSchema = z.array(gradeSchema);

/**
 * Assignment model
 */
export const assignmentSchema = z.object({
  id: z.string(),
  sectionID: z.string(),
  unitID: z.string(),
  dueDate: z.string().datetime().optional(),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
  published: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  _version: z.number().optional(),
  _deleted: z.boolean().optional(),
  _lastChangedAt: z.number().optional(),
});

export type Grade = z.infer<typeof gradeSchema>;
export type GradeData = z.infer<typeof gradeDataSchema>;
export type BlockGrade = z.infer<typeof blockGradeSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
