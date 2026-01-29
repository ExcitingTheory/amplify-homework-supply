/**
 * @fileoverview Zod schemas for File/Storage mock data
 * 
 * Validates File model structure including S3 metadata.
 * 
 * @module schemas/file
 */

import { z } from 'zod';

/**
 * Protection level for S3 storage
 */
export const protectionLevelSchema = z.enum(['public', 'protected', 'private']);

/**
 * File type categories
 */
export const fileTypeSchema = z.enum([
  'audio',
  'video',
  'image',
  'pdf',
  'document',
  'other',
]);

/**
 * File model matching Amplify DataStore schema
 */
export const fileSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(), // S3 key
  bucket: z.string().optional(),
  region: z.string().optional(),
  level: protectionLevelSchema,
  type: fileTypeSchema,
  mimeType: z.string().optional(),
  size: z.number().optional(),
  duration: z.number().optional(), // For audio/video files
  width: z.number().optional(), // For images
  height: z.number().optional(), // For images
  thumbnail: z.string().optional(), // Thumbnail URL or key
  url: z.string().url().optional(), // Cached/public URL
  owner: z.string().optional(),
  unitID: z.string().optional(),
  questionID: z.string().optional(),
  wordID: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  _version: z.number().optional(),
  _deleted: z.boolean().optional(),
  _lastChangedAt: z.number().optional(),
});

/**
 * Array of files
 */
export const filesSchema = z.array(fileSchema);

/**
 * File upload result
 */
export const fileUploadResultSchema = z.object({
  key: z.string(),
  url: z.string().url().optional(),
  file: fileSchema.optional(),
});

export type File = z.infer<typeof fileSchema>;
export type FileUploadResult = z.infer<typeof fileUploadResultSchema>;
