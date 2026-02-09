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
  bucket: z.string().nullish(),
  region: z.string().nullish(),
  level: protectionLevelSchema,
  type: fileTypeSchema,
  mimeType: z.string().nullish(),
  size: z.number().nullish(),
  duration: z.number().nullish(), // For audio/video files
  width: z.number().nullish(), // For images
  height: z.number().nullish(), // For images
  thumbnail: z.string().nullish(), // Thumbnail URL or key
  url: z.string().url().nullish(), // Cached/public URL
  owner: z.string().nullish(),
  unitID: z.string().nullish(),
  questionID: z.string().nullish(),
  wordID: z.string().nullish(),
  documentID: z.string().nullish(),
  parsedContentID: z.string().nullish(),
  identityId: z.string().nullish(),
  description: z.string().nullish(),
  prompt: z.string().nullish(),
  model: z.string().nullish(),
  variant: z.string().nullish(),
  path: z.string().nullish(),
  generated: z.boolean().nullish(),
  hex: z.string().nullish(),
  byHex: z.string().nullish(),
  waveformData: z.string().nullish(),
  embedding: z.any().nullish(),
  createdAt: z.string().datetime().nullish(),
  updatedAt: z.string().datetime().nullish(),
  _version: z.number().nullish(),
  _deleted: z.boolean().nullish(),
  _lastChangedAt: z.number().nullish(),
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
