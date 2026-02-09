/**
 * Unit tests for userSubmissionStorage.jsx
 * Tests student submission file storage with privacy controls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS Amplify modules before importing
vi.mock('aws-amplify/storage', () => ({
  uploadData: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn(),
}));

import {
  uploadStudentSubmission,
  deleteStudentSubmission,
  parseSubmissionKey,
  buildSubmissionKey,
  getGradeSubmissionsPrefix,
  getQuestionSubmissionsPrefix,
  validateSubmissionOwnership,
} from '../userSubmissionStorage.jsx';
import { uploadData, remove } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';

describe('userSubmissionStorage', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Default mock user
    vi.mocked(getCurrentUser).mockResolvedValue({
      userId: 'student-alice-sub',
      username: 'alice',
      attributes: {
        sub: 'student-alice-sub',
        email: 'alice@example.com',
      },
    });
  });
  
  describe('uploadStudentSubmission', () => {
    it('should upload audio submission to private storage with correct key format', async () => {
      const mockFile = new Blob(['audio data'], { type: 'audio/mpeg' });
      const params = {
        file: mockFile,
        gradeId: 'grade-123',
        nodeKey: 'audio-question-1',
        fileType: 'mp3',
        metadata: {
          duration: 5.5,
        },
      };
      
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve({
          path: 'private/student-alice-sub/user-submissions/grade-123/audio-question-1/grade-123_audio-question-1_1234567890.mp3',
        }),
      });
      
      const result = await uploadStudentSubmission(params);
      
      // Verify uploadData was called with correct parameters
      expect(uploadData).toHaveBeenCalledWith({
        key: expect.stringMatching(/^user-submissions\/grade-123\/audio-question-1\/grade-123_audio-question-1_\d+\.mp3$/),
        data: mockFile,
        options: {
          accessLevel: 'private',
          contentType: 'audio/mpeg',
          metadata: {
            gradeId: 'grade-123',
            nodeKey: 'audio-question-1',
            uploadedBy: 'alice',
            uploadedAt: expect.any(String),
            duration: 5.5,
          },
        },
      });
      
      // Verify result structure
      expect(result.gradeId).toBe('grade-123');
      expect(result.nodeKey).toBe('audio-question-1');
      expect(result.filename).toMatch(/^grade-123_audio-question-1_\d+\.mp3$/);
      expect(result.metadata.userId).toBe('student-alice-sub');
      expect(result.metadata.username).toBe('alice');
      expect(result.metadata.duration).toBe(5.5);
    });
    
    it('should upload image submission with correct content type', async () => {
      const mockFile = new Blob(['image data'], { type: 'image/png' });
      const params = {
        file: mockFile,
        gradeId: 'grade-456',
        nodeKey: 'drawing-question-2',
        fileType: 'png',
      };
      
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve({
          path: 'private/student-alice-sub/user-submissions/grade-456/drawing-question-2/grade-456_drawing-question-2_9876543210.png',
        }),
      });
      
      await uploadStudentSubmission(params);
      
      expect(uploadData).toHaveBeenCalledWith({
        key: expect.stringMatching(/^user-submissions\/grade-456\/drawing-question-2\/grade-456_drawing-question-2_\d+\.png$/),
        data: mockFile,
        options: {
          accessLevel: 'private',
          contentType: 'image/png',
          metadata: expect.objectContaining({
            gradeId: 'grade-456',
            nodeKey: 'drawing-question-2',
          }),
        },
      });
    });
    
    it('should include current user metadata in upload', async () => {
      const mockFile = new Blob(['data'], { type: 'audio/mpeg' });
      const params = {
        file: mockFile,
        gradeId: 'grade-789',
        nodeKey: 'question-1',
        fileType: 'mp3',
      };
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        userId: 'student-bob-sub',
        username: 'bob-student',
        attributes: { sub: 'student-bob-sub' },
      });
      
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve({
          path: 'private/student-bob-sub/user-submissions/grade-789/question-1/file.mp3',
        }),
      });
      
      const result = await uploadStudentSubmission(params);
      
      expect(result.metadata.userId).toBe('student-bob-sub');
      expect(result.metadata.username).toBe('bob-student');
    });
    
    it('should handle upload errors gracefully', async () => {
      const mockFile = new Blob(['data'], { type: 'audio/mpeg' });
      const params = {
        file: mockFile,
        gradeId: 'grade-error',
        nodeKey: 'question-1',
        fileType: 'mp3',
      };
      
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.reject(new Error('S3 upload failed')),
      });
      
      await expect(uploadStudentSubmission(params)).rejects.toThrow(
        'Failed to upload student submission: S3 upload failed'
      );
    });
    
    it('should merge custom metadata with system metadata', async () => {
      const mockFile = new Blob(['data'], { type: 'audio/mpeg' });
      const params = {
        file: mockFile,
        gradeId: 'grade-123',
        nodeKey: 'question-1',
        fileType: 'mp3',
        metadata: {
          customField: 'custom value',
          attemptNumber: 2,
        },
      };
      
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve({ path: 'mock-path' }),
      });
      
      await uploadStudentSubmission(params);
      
      expect(uploadData).toHaveBeenCalledWith({
        key: expect.any(String),
        data: mockFile,
        options: {
          accessLevel: 'private',
          contentType: 'audio/mpeg',
          metadata: expect.objectContaining({
            gradeId: 'grade-123',
            nodeKey: 'question-1',
            uploadedBy: 'alice',
            uploadedAt: expect.any(String),
            customField: 'custom value',
            attemptNumber: 2,
          }),
        },
      });
    });
  });
  
  describe('deleteStudentSubmission', () => {
    it('should delete submission with private access level', async () => {
      const key = 'user-submissions/grade-123/question-1/grade-123_question-1_1234567890.mp3';
      
      vi.mocked(remove).mockResolvedValue(undefined);
      
      await deleteStudentSubmission(key);
      
      expect(remove).toHaveBeenCalledWith({
        key,
        options: {
          accessLevel: 'private',
        },
      });
    });
    
    it('should handle deletion errors gracefully', async () => {
      const key = 'user-submissions/grade-456/question-2/file.mp3';
      
      vi.mocked(remove).mockRejectedValue(new Error('Access denied'));
      
      await expect(deleteStudentSubmission(key)).rejects.toThrow(
        'Failed to delete student submission: Access denied'
      );
    });
  });
  
  describe('parseSubmissionKey', () => {
    it('should parse valid submission key correctly', () => {
      const key = 'user-submissions/grade-123/audio-q1/grade-123_audio-q1_1640000000000.mp3';
      
      const result = parseSubmissionKey(key);
      
      expect(result.gradeId).toBe('grade-123');
      expect(result.nodeKey).toBe('audio-q1');
      expect(result.filename).toBe('grade-123_audio-q1_1640000000000.mp3');
      expect(result.timestamp).toBe(1640000000000);
      expect(result.extension).toBe('mp3');
      expect(result.isValid).toBe(true);
    });
    
    it('should parse submission key with different file extension', () => {
      const key = 'user-submissions/grade-789/drawing-q5/grade-789_drawing-q5_1650000000000.png';
      
      const result = parseSubmissionKey(key);
      
      expect(result.extension).toBe('png');
      expect(result.isValid).toBe(true);
    });
    
    it('should throw error for invalid key format', () => {
      const invalidKey = 'public/some-other-file.mp3';
      
      expect(() => parseSubmissionKey(invalidKey)).toThrow('Invalid submission key format');
    });
    
    it('should throw error for wrong prefix', () => {
      const invalidKey = 'wrong-prefix/grade-123/question-1/file.mp3';
      
      expect(() => parseSubmissionKey(invalidKey)).toThrow('Invalid submission key format');
    });
    
    it('should mark as invalid if missing required parts', () => {
      const key = 'user-submissions///file.mp3';
      
      const result = parseSubmissionKey(key);
      
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('buildSubmissionKey', () => {
    it('should build correct submission key from components', () => {
      const params = {
        gradeId: 'grade-abc',
        nodeKey: 'question-xyz',
        filename: 'grade-abc_question-xyz_1234567890.mp3',
      };
      
      const key = buildSubmissionKey(params);
      
      expect(key).toBe('user-submissions/grade-abc/question-xyz/grade-abc_question-xyz_1234567890.mp3');
    });
    
    it('should handle different filenames', () => {
      const params = {
        gradeId: 'grade-123',
        nodeKey: 'draw-q1',
        filename: 'custom-name.png',
      };
      
      const key = buildSubmissionKey(params);
      
      expect(key).toBe('user-submissions/grade-123/draw-q1/custom-name.png');
    });
  });
  
  describe('getGradeSubmissionsPrefix', () => {
    it('should return correct prefix for grade', () => {
      const prefix = getGradeSubmissionsPrefix('grade-123');
      
      expect(prefix).toBe('user-submissions/grade-123/');
    });
    
    it('should handle different grade IDs', () => {
      const prefix = getGradeSubmissionsPrefix('grade-xyz-789');
      
      expect(prefix).toBe('user-submissions/grade-xyz-789/');
    });
  });
  
  describe('getQuestionSubmissionsPrefix', () => {
    it('should return correct prefix for specific question', () => {
      const prefix = getQuestionSubmissionsPrefix('grade-123', 'question-1');
      
      expect(prefix).toBe('user-submissions/grade-123/question-1/');
    });
    
    it('should handle different question keys', () => {
      const prefix = getQuestionSubmissionsPrefix('grade-456', 'audio-recording-q5');
      
      expect(prefix).toBe('user-submissions/grade-456/audio-recording-q5/');
    });
  });
  
  describe('validateSubmissionOwnership', () => {
    it('should return true when user owns the submission', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        userId: 'student-alice-sub',
        username: 'alice',
        attributes: { sub: 'student-alice-sub' },
      });
      
      const isOwner = await validateSubmissionOwnership('student-alice-sub');
      
      expect(isOwner).toBe(true);
    });
    
    it('should return false when user does not own the submission', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        userId: 'student-alice-sub',
        username: 'alice',
        attributes: { sub: 'student-alice-sub' },
      });
      
      const isOwner = await validateSubmissionOwnership('student-bob-sub');
      
      expect(isOwner).toBe(false);
    });
    
    it('should return false on authentication error', async () => {
      vi.mocked(getCurrentUser).mockRejectedValue(new Error('Not authenticated'));
      
      const isOwner = await validateSubmissionOwnership('student-alice-sub');
      
      expect(isOwner).toBe(false);
    });
    
    it('should handle undefined identityId', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        userId: 'student-alice-sub',
        username: 'alice',
        attributes: { sub: 'student-alice-sub' },
      });
      
      const isOwner = await validateSubmissionOwnership(undefined);
      
      expect(isOwner).toBe(false);
    });
  });
});
