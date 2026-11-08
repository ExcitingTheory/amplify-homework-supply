/**
 * Unit tests for getCachedUrl.js
 * Tests S3 URL caching against presigned URL expiry (Gen 2 path-based API)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AWS Amplify modules
vi.mock('aws-amplify/storage', () => ({
  getUrl: vi.fn(),
}));

vi.mock('aws-amplify/utils', () => ({
  Cache: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('../authSessionRecovery', async (importOriginal) => ({
  ...(await importOriginal()),
  recoverForbiddenIdentity: vi.fn().mockResolvedValue(undefined),
}));

import getCachedUrl from '../getCachedUrl.js';
import { recoverForbiddenIdentity } from '../authSessionRecovery';
import { getUrl } from 'aws-amplify/storage';
import { Cache } from 'aws-amplify/utils';

describe('getCachedUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-21T12:00:00Z'));
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  describe('Direct URL passthrough', () => {
    it('should return data URLs directly without caching', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      
      const result = await getCachedUrl(dataUrl);
      
      expect(result).toBe(dataUrl);
      expect(Cache.getItem).not.toHaveBeenCalled();
      expect(getUrl).not.toHaveBeenCalled();
    });
    
    it('should return http URLs directly without caching', async () => {
      const httpUrl = 'http://example.com/image.png';
      
      const result = await getCachedUrl(httpUrl);
      
      expect(result).toBe(httpUrl);
      expect(Cache.getItem).not.toHaveBeenCalled();
      expect(getUrl).not.toHaveBeenCalled();
    });
    
    it('should return https URLs directly without caching', async () => {
      const httpsUrl = 'https://example.com/image.png';
      
      const result = await getCachedUrl(httpsUrl);
      
      expect(result).toBe(httpsUrl);
      expect(Cache.getItem).not.toHaveBeenCalled();
      expect(getUrl).not.toHaveBeenCalled();
    });
    
    it('should return null for empty file path', async () => {
      const result = await getCachedUrl(null);
      
      expect(result).toBeNull();
      expect(Cache.getItem).not.toHaveBeenCalled();
    });
  });
  
  describe('Cache retrieval', () => {
    it('should return cached URL if available', async () => {
      const filePath = 'protected/us-east-1:123456/images/test-image.png';
      const cachedUrl = 'https://s3.amazonaws.com/bucket/cached-url';
      
      vi.mocked(Cache.getItem).mockResolvedValue(cachedUrl);
      
      const result = await getCachedUrl(filePath);
      
      expect(Cache.getItem).toHaveBeenCalledWith(`getCachedUrl_v3_${filePath}`);
      expect(result).toBe(cachedUrl);
      expect(getUrl).not.toHaveBeenCalled();
    });
  });
  
  describe('S3 URL fetching and caching', () => {
    it('should fetch from S3 and cache when not in cache', async () => {
      const filePath = 'protected/us-east-1:abc123/audio/recording.mp3';
      const s3Url = 'https://s3.amazonaws.com/bucket/audio/recording.mp3?signature=xyz';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: { href: s3Url },
        expiresAt: new Date('2026-01-21T13:00:00Z'),
      });
      
      const result = await getCachedUrl(filePath);
      
      // Should call getUrl with Gen 2 path-based API
      expect(getUrl).toHaveBeenCalledWith({
        path: filePath,
        options: { expiresIn: 3600 },
      });
      
      // Stop serving the cached URL one minute before its signed URL expires.
      const expectedExpires = new Date('2026-01-21T12:59:00Z').getTime();
      expect(Cache.setItem).toHaveBeenCalledWith(
        `getCachedUrl_v3_${filePath}`,
        s3Url,
        { expires: expectedExpires }
      );
      
      expect(result).toBe(s3Url);
    });
    
    it('should not cache a URL that is about to expire', async () => {
      const filePath = 'protected/us-east-1:user1/images/test.png';
      const s3Url = 'https://s3.amazonaws.com/url';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: { href: s3Url },
        expiresAt: new Date('2026-01-21T12:00:30Z'),
      });
      
      await getCachedUrl(filePath);
      
      expect(Cache.setItem).not.toHaveBeenCalled();
    });
    
    it('should handle missing url.href gracefully', async () => {
      const filePath = 'protected/us-east-1:user1/images/broken.png';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: null,
        expiresAt: new Date('2026-01-21T13:00:00Z'),
      });
      
      const result = await getCachedUrl(filePath);
      
      expect(result).toBeUndefined();
      expect(Cache.setItem).toHaveBeenCalled();
    });
  });
  
  describe('Cache key generation', () => {
    it('should generate unique cache keys per file path', async () => {
      const cachedUrl = 'https://s3.amazonaws.com/url';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: { href: cachedUrl },
        expiresAt: new Date('2026-01-21T12:15:00Z'),
      });
      
      const filePath1 = 'protected/us-east-1:user1/files/doc.pdf';
      const filePath2 = 'protected/us-east-1:user2/files/doc.pdf';
      
      await getCachedUrl(filePath1);
      await getCachedUrl(filePath2);
      
      expect(Cache.getItem).toHaveBeenCalledWith(`getCachedUrl_v3_${filePath1}`);
      expect(Cache.getItem).toHaveBeenCalledWith(`getCachedUrl_v3_${filePath2}`);
    });
  });

  describe('Stale identity recovery', () => {
    const filePath = 'protected/us-east-1:user1/files/doc.pdf';
    const forbidden = Object.assign(
      new Error("Access to Identity 'us-east-1:stale' is forbidden."),
      { name: 'NotAuthorizedException' },
    );

    it('recovers the identity and retries once on a forbidden identity', async () => {
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl)
        .mockRejectedValueOnce(forbidden)
        .mockResolvedValueOnce({
          url: { href: 'https://s3.example/fresh' },
          expiresAt: new Date('2026-01-21T13:00:00Z'),
        });

      await expect(getCachedUrl(filePath)).resolves.toBe('https://s3.example/fresh');
      expect(recoverForbiddenIdentity).toHaveBeenCalledOnce();
      expect(getUrl).toHaveBeenCalledTimes(2);
      expect(getUrl).toHaveBeenNthCalledWith(2, {
        path: filePath,
        options: { expiresIn: 3600 },
      });
      expect(Cache.setItem).toHaveBeenCalledWith(`getCachedUrl_v3_${filePath}`, 'https://s3.example/fresh', expect.any(Object));
    });

    it('rethrows other errors without recovery or caching', async () => {
      const denied = Object.assign(new Error('Access Denied'), { name: 'AccessDenied' });
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockRejectedValueOnce(denied);

      await expect(getCachedUrl(filePath)).rejects.toBe(denied);
      expect(recoverForbiddenIdentity).not.toHaveBeenCalled();
      expect(Cache.setItem).not.toHaveBeenCalled();
    });
  });
});
