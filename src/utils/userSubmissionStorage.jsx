/**
 * User Submission Storage Utility (Amplify Gen 2)
 * 
 * Handles storage of student-submitted content (audio recordings, drawings, etc.)
 * with strict privacy controls and cost tracking separation.
 * 
 * Key Features:
 * - Uses PRIVATE access level (only owner can access directly)
 * - Gen 2 pattern: private/{userId}/user-submissions/{gradeId}/{nodeKey}/{filename}
 * - Separate from other File storage for cost tracking
 * - Teachers access via special backend endpoint that validates permissions
 * 
 * Gen 2 Notes:
 * - Uses `path` parameter with full S3 path including protection level prefix
 * - No `accessLevel` or `identityId` options needed (encoded in path)
 * - Returns result.path (not result.key) for uploaded files
 */

import { uploadData, remove } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';

/**
 * Upload a student submission file to private storage
 * 
 * @param {Object} params Upload parameters
 * @param {Blob} params.file The file to upload
 * @param {string} params.gradeId The grade ID this submission belongs to
 * @param {string} params.nodeKey The question node key
 * @param {string} params.fileType File extension (e.g., 'mp3', 'png')
 * @param {Object} params.metadata Optional metadata to store with file
 * @returns {Promise<Object>} Upload result with key and metadata
 */
export async function uploadStudentSubmission({ file, gradeId, nodeKey, fileType, metadata = {} }) {
  try {
    const timestamp = Date.now();
    const filename = `${gradeId}_${nodeKey}_${timestamp}.${fileType}`;
    
    // Get current user for metadata and path
    const { userId, username } = await getCurrentUser();
    
    // Gen 2 API: private files use private/{identityId}/* pattern
    // Note: identityId is automatically added by Amplify when accessing private storage
    const s3Path = `private/${userId}/user-submissions/${gradeId}/${nodeKey}/${filename}`;
    
    console.log(`[UserSubmission] Uploading to: ${s3Path}`);
    
    // Upload with Gen 2 API (no accessLevel option needed - it's in the path)
    const result = await uploadData({
      path: s3Path,
      data: file,
      options: {
        contentType: file.type,
      },
    }).result;
    
    console.log(`[UserSubmission] Upload successful: ${result.path}`);
    
    return {
      path: result.path,
      filename,
      gradeId,
      nodeKey,
      uploadedAt: timestamp,
      metadata: {
        userId,
        username,
        uploadedBy: username,
        uploadedAt: new Date().toISOString(),
        ...metadata,
      },
    };
  } catch (error) {
    console.error('[UserSubmission] Upload failed:', error);
    throw new Error(`Failed to upload student submission: ${error.message}`);
  }
}

/**
 * Delete a student submission file
 * 
 * @param {string} path The S3 path of the file to delete (full path including private/ prefix)
 * @returns {Promise<void>}
 */
export async function deleteStudentSubmission(path) {
  try {
    console.log(`[UserSubmission] Deleting: ${path}`);
    
    // Gen 2 API: use path directly, no accessLevel option
    await remove({
      path,
    });
    
    console.log(`[UserSubmission] Delete successful: ${path}`);
  } catch (error) {
    console.error('[UserSubmission] Delete failed:', error);
    throw new Error(`Failed to delete student submission: ${error.message}`);
  }
}

/**
 * Parse a submission key to extract metadata
 * 
 * @param {string} key S3 key (e.g., "user-submissions/grade123/audio-q1/grade123_audio-q1_1234567890.mp3")
 * @returns {Object} Parsed metadata
 */
export function parseSubmissionKey(key) {
  const parts = key.split('/');
  
  if (parts[0] !== 'user-submissions' || parts.length !== 4) {
    throw new Error('Invalid submission key format');
  }
  
  const [, gradeId, nodeKey, filename] = parts;
  const filenameParts = filename.split('_');
  const timestamp = parseInt(filenameParts[2]?.split('.')[0]);
  const extension = filename.split('.').pop();
  
  return {
    gradeId,
    nodeKey,
    filename,
    timestamp,
    extension,
    isValid: gradeId && nodeKey && !isNaN(timestamp),
  };
}

/**
 * Build a submission key from components
 * 
 * @param {Object} params Key components
 * @param {string} params.gradeId The grade ID
 * @param {string} params.nodeKey The question node key
 * @param {string} params.filename The filename
 * @returns {string} Full S3 key
 */
export function buildSubmissionKey({ gradeId, nodeKey, filename }) {
  return `user-submissions/${gradeId}/${nodeKey}/${filename}`;
}

/**
 * Get all submission keys for a specific grade
 * Useful for teachers reviewing all student submissions
 * 
 * @param {string} gradeId The grade ID
 * @returns {string} S3 prefix for listing
 */
export function getGradeSubmissionsPrefix(gradeId) {
  return `user-submissions/${gradeId}/`;
}

/**
 * Get all submission keys for a specific question in a grade
 * 
 * @param {string} gradeId The grade ID
 * @param {string} nodeKey The question node key
 * @returns {string} S3 prefix for listing
 */
export function getQuestionSubmissionsPrefix(gradeId, nodeKey) {
  return `user-submissions/${gradeId}/${nodeKey}/`;
}

/**
 * Validate that the current user owns the submission
 * This is a client-side check; backend validation is required for security
 * 
 * @param {string} identityId The identityId from the submission record
 * @returns {Promise<boolean>} True if user owns the submission
 */
export async function validateSubmissionOwnership(identityId) {
  try {
    const { userId } = await getCurrentUser();
    return userId === identityId;
  } catch (error) {
    console.error('[UserSubmission] Ownership validation failed:', error);
    return false;
  }
}
