/**
 * Unit tests for getCachedUrl.js
 * Tests S3 URL caching with TTL
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

import getCachedUrl from '../getCachedUrl.js';
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
      const filePath = 'images/test-image.png';
      const cachedUrl = 'https://s3.amazonaws.com/bucket/cached-url';
      const accessLevel = 'protected';
      const targetIdentityId = 'us-east-1:123456';
      
      vi.mocked(Cache.getItem).mockResolvedValue(cachedUrl);
      
      const result = await getCachedUrl(filePath, accessLevel, targetIdentityId);
      
      expect(Cache.getItem).toHaveBeenCalledWith(
        `getCachedUrl_${accessLevel}${targetIdentityId}${filePath}`
      );
      expect(result).toBe(cachedUrl);
      expect(getUrl).not.toHaveBeenCalled();
    });
    
    it('should use default access level when not specified', async () => {
      const filePath = 'images/test.png';
      const cachedUrl = 'https://s3.amazonaws.com/cached';
      
      vi.mocked(Cache.getItem).mockResolvedValue(cachedUrl);
      
      await getCachedUrl(filePath);
      
      expect(Cache.getItem).toHaveBeenCalledWith(
        `getCachedUrl_protected${null}${filePath}`
      );
    });
  });
  
  describe('S3 URL fetching and caching', () => {
    it('should fetch from S3 and cache when not in cache', async () => {
      const filePath = 'audio/recording.mp3';
      const accessLevel = 'protected';
      const targetIdentityId = 'us-east-1:abc123';
      const s3Url = 'https://s3.amazonaws.com/bucket/audio/recording.mp3?signature=xyz';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: { href: s3Url }
      });
      
      const result = await getCachedUrl(filePath, accessLevel, targetIdentityId);
      
      // Should call getUrl with correct parameters
      expect(getUrl).toHaveBeenCalledWith({
        key: filePath,
        options: {
          accessLevel,
          targetIdentityId,
          expiresIn: 3600
        }
      });
      
      // Should cache the result with 60-minute expiration
      const expectedExpires = new Date('2026-01-21T12:00:00Z').getTime() + 3540000;
      expect(Cache.setItem).toHaveBeenCalledWith(
        `getCachedUrl_${accessLevel}${targetIdentityId}${filePath}`,
        s3Url,
        { expires: expectedExpires }
      );
      
      expect(result).toBe(s3Url);
    });
    
    it('should handle public access level', async () => {
      const filePath = 'files/public-doc.pdf';
      const s3Url = 'https://s3.amazonaws.com/bucket/public/files/public-doc.pdf';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: { href: s3Url }
      });
      
      await getCachedUrl(filePath, 'public');
      
      expect(getUrl).toHaveBeenCalledWith({
        key: filePath,
        options: {
          accessLevel: 'public',
          targetIdentityId: null,
          expiresIn: 3600
        }
      });
    });
    
    it('should set cache expiration to 60 minutes from current time', async () => {
      const filePath = 'images/test.png';
      const s3Url = 'https://s3.amazonaws.com/url';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: { href: s3Url }
      });
      
      await getCachedUrl(filePath);
      
      // Current time: 2026-01-21T12:00:00Z
      // Expected expires: 2026-01-21T12:00:00Z + 3540000ms (59 minutes)
      const currentTime = new Date('2026-01-21T12:00:00Z').getTime();
      const expectedExpires = currentTime + 3540000;
      
      expect(Cache.setItem).toHaveBeenCalledWith(
        expect.any(String),
        s3Url,
        { expires: expectedExpires }
      );
    });
    
    it('should handle missing url.href gracefully', async () => {
      const filePath = 'images/broken.png';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: null
      });
      
      const result = await getCachedUrl(filePath);
      
      expect(result).toBeUndefined();
      // Should still attempt to cache even if undefined
      expect(Cache.setItem).toHaveBeenCalled();
    });
  });
  
  describe('Cache key generation', () => {
    it('should generate unique cache keys for different parameters', async () => {
      const filePath = 'images/test.png';
      const cachedUrl = 'https://s3.amazonaws.com/url';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: { href: cachedUrl }
      });
      
      // Different access levels should create different cache keys
      await getCachedUrl(filePath, 'public', null);
      await getCachedUrl(filePath, 'protected', null);
      await getCachedUrl(filePath, 'private', null);
      
      expect(Cache.getItem).toHaveBeenCalledWith('getCachedUrl_publicnullimages/test.png');
      expect(Cache.getItem).toHaveBeenCalledWith('getCachedUrl_protectednullimages/test.png');
      expect(Cache.getItem).toHaveBeenCalledWith('getCachedUrl_privatenullimages/test.png');
    });
    
    it('should include targetIdentityId in cache key', async () => {
      const filePath = 'files/doc.pdf';
      const identityId1 = 'us-east-1:user1';
      const identityId2 = 'us-east-1:user2';
      const cachedUrl = 'https://s3.amazonaws.com/url';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: { href: cachedUrl }
      });
      
      await getCachedUrl(filePath, 'protected', identityId1);
      await getCachedUrl(filePath, 'protected', identityId2);
      
      expect(Cache.getItem).toHaveBeenCalledWith(`getCachedUrl_protected${identityId1}${filePath}`);
      expect(Cache.getItem).toHaveBeenCalledWith(`getCachedUrl_protected${identityId2}${filePath}`);
    });
  });
});
