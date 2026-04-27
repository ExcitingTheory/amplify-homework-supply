/**
 * Unit tests for getCachedUrl.js
 * Tests S3 URL caching with TTL (Gen 2 path-based API)
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
      const filePath = 'protected/us-east-1:123456/images/test-image.png';
      const cachedUrl = 'https://s3.amazonaws.com/bucket/cached-url';
      
      vi.mocked(Cache.getItem).mockResolvedValue(cachedUrl);
      
      const result = await getCachedUrl(filePath);
      
      expect(Cache.getItem).toHaveBeenCalledWith(`getCachedUrl_${filePath}`);
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
        url: { href: s3Url }
      });
      
      const result = await getCachedUrl(filePath);
      
      // Should call getUrl with Gen 2 path-based API
      expect(getUrl).toHaveBeenCalledWith({ path: filePath });
      
      // Should cache the result with 59-minute expiration
      const expectedExpires = new Date('2026-01-21T12:00:00Z').getTime() + 3540000;
      expect(Cache.setItem).toHaveBeenCalledWith(
        `getCachedUrl_${filePath}`,
        s3Url,
        { expires: expectedExpires }
      );
      
      expect(result).toBe(s3Url);
    });
    
    it('should set cache expiration to 59 minutes from current time', async () => {
      const filePath = 'protected/us-east-1:user1/images/test.png';
      const s3Url = 'https://s3.amazonaws.com/url';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: { href: s3Url }
      });
      
      await getCachedUrl(filePath);
      
      const currentTime = new Date('2026-01-21T12:00:00Z').getTime();
      const expectedExpires = currentTime + 3540000;
      
      expect(Cache.setItem).toHaveBeenCalledWith(
        expect.any(String),
        s3Url,
        { expires: expectedExpires }
      );
    });
    
    it('should handle missing url.href gracefully', async () => {
      const filePath = 'protected/us-east-1:user1/images/broken.png';
      
      vi.mocked(Cache.getItem).mockResolvedValue(null);
      vi.mocked(getUrl).mockResolvedValue({
        url: null
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
        url: { href: cachedUrl }
      });
      
      const filePath1 = 'protected/us-east-1:user1/files/doc.pdf';
      const filePath2 = 'protected/us-east-1:user2/files/doc.pdf';
      
      await getCachedUrl(filePath1);
      await getCachedUrl(filePath2);
      
      expect(Cache.getItem).toHaveBeenCalledWith(`getCachedUrl_${filePath1}`);
      expect(Cache.getItem).toHaveBeenCalledWith(`getCachedUrl_${filePath2}`);
    });
  });
});
