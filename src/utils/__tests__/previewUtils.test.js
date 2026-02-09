/**
 * Unit tests for previewUtils.jsx
 * Tests responsive preview image utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS Amplify Storage
vi.mock('aws-amplify/storage', () => ({
  getUrl: vi.fn(),
}));

import {
  getPreviewUrl,
  getResponsiveSrcSet,
  getResponsiveImageProps,
  hasPreview,
  getBestPreview,
} from '../previewUtils.jsx';
import { getUrl } from 'aws-amplify/storage';

describe('previewUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    vi.mocked(getUrl).mockImplementation(({ key }) => {
      return Promise.resolve({
        url: { toString: () => `https://s3.amazonaws.com/${key}` }
      });
    });
  });
  
  describe('getPreviewUrl', () => {
    it('should get preview URL for specified size', async () => {
      const item = {
        previewSmall: 'previews/small.webp',
        previewMedium: 'previews/medium.webp',
        previewLarge: 'previews/large.webp',
      };
      
      const result = await getPreviewUrl(item, 'medium', 'protected');
      
      expect(getUrl).toHaveBeenCalledWith({
        key: 'previews/medium.webp',
        options: {
          accessLevel: 'protected',
          validateObjectExistence: false,
        },
      });
      expect(result).toBe('https://s3.amazonaws.com/previews/medium.webp');
    });
    
    it('should handle all size options', async () => {
      const item = {
        previewSvg: 'previews/image.svg',
        previewThumbnail: 'previews/thumb.webp',
        previewSmall: 'previews/small.webp',
        previewMedium: 'previews/medium.webp',
        previewLarge: 'previews/large.webp',
        previewOriginal: 'previews/original.png',
      };
      
      const sizes = ['svg', 'thumbnail', 'small', 'medium', 'large', 'original'];
      
      for (const size of sizes) {
        const result = await getPreviewUrl(item, size);
        expect(result).toContain(size === 'svg' ? '.svg' : size === 'original' ? '.png' : '.webp');
      }
    });
    
    it('should return null for missing preview size', async () => {
      const item = {
        previewSmall: 'previews/small.webp',
      };
      
      const result = await getPreviewUrl(item, 'large');
      
      expect(result).toBeNull();
      expect(getUrl).not.toHaveBeenCalled();
    });
    
    it('should return null for null item', async () => {
      const result = await getPreviewUrl(null, 'medium');
      
      expect(result).toBeNull();
    });
    
    it('should handle different access levels', async () => {
      const item = {
        previewMedium: 'previews/medium.webp',
      };
      
      await getPreviewUrl(item, 'medium', 'public');
      expect(getUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            accessLevel: 'public',
          }),
        })
      );
      
      await getPreviewUrl(item, 'medium', 'private');
      expect(getUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            accessLevel: 'private',
          }),
        })
      );
    });
    
    it('should handle S3 errors gracefully', async () => {
      const item = {
        previewMedium: 'previews/medium.webp',
      };
      
      vi.mocked(getUrl).mockRejectedValue(new Error('S3 error'));
      
      const result = await getPreviewUrl(item, 'medium');
      
      expect(result).toBeNull();
    });
  });
  
  describe('getResponsiveSrcSet', () => {
    it('should build responsive srcSet with multiple sizes', async () => {
      const item = {
        previewSmall: 'previews/small.webp',
        previewMedium: 'previews/medium.webp',
        previewLarge: 'previews/large.webp',
      };
      
      const result = await getResponsiveSrcSet(item, 'protected');
      
      expect(result.src).toBe('https://s3.amazonaws.com/previews/medium.webp');
      expect(result.srcSet).toContain('400w');
      expect(result.srcSet).toContain('800w');
      expect(result.srcSet).toContain('1200w');
    });
    
    it('should include AVIF srcSet when available', async () => {
      const item = {
        previewSmall: 'previews/small.webp',
        previewMedium: 'previews/medium.webp',
        previewLarge: 'previews/large.webp',
        previewAvif: 'previews/image.avif',
      };
      
      const result = await getResponsiveSrcSet(item);
      
      expect(result.avifSrcSet).toContain('previews/image.avif');
      expect(result.avifSrcSet).toContain('800w');
    });
    
    it('should handle missing sizes gracefully', async () => {
      const item = {
        previewMedium: 'previews/medium.webp',
        // No small or large
      };
      
      const result = await getResponsiveSrcSet(item);
      
      expect(result.src).toBe('https://s3.amazonaws.com/previews/medium.webp');
      expect(result.srcSet).toContain('800w');
      expect(result.srcSet).not.toContain('400w');
      expect(result.srcSet).not.toContain('1200w');
    });
    
    it('should return null values for null item', async () => {
      const result = await getResponsiveSrcSet(null);
      
      expect(result.src).toBeNull();
      expect(result.srcSet).toBeNull();
      expect(result.avifSrcSet).toBeNull();
    });
    
    it('should handle AVIF fetch errors', async () => {
      const item = {
        previewMedium: 'previews/medium.webp',
        previewAvif: 'previews/broken.avif',
      };
      
      vi.mocked(getUrl).mockImplementation(({ key }) => {
        if (key.includes('avif')) {
          return Promise.reject(new Error('AVIF not found'));
        }
        return Promise.resolve({
          url: { toString: () => `https://s3.amazonaws.com/${key}` }
        });
      });
      
      const result = await getResponsiveSrcSet(item);
      
      expect(result.src).toBeTruthy();
      expect(result.avifSrcSet).toBeNull();
    });
  });
  
  describe('getResponsiveImageProps', () => {
    it('should return props for picture element', async () => {
      const item = {
        previewSmall: 'previews/small.webp',
        previewMedium: 'previews/medium.webp',
        previewLarge: 'previews/large.webp',
        previewAvif: 'previews/image.avif',
      };
      
      const result = await getResponsiveImageProps(item, {
        alt: 'Test image',
        className: 'responsive-image',
      });
      
      expect(result.sources).toBeDefined();
      expect(result.sources.length).toBe(2); // AVIF + WebP
      expect(result.sources[0].type).toBe('image/avif');
      expect(result.sources[1].type).toBe('image/webp');
      
      expect(result.img).toEqual({
        src: expect.stringContaining('medium.webp'),
        alt: 'Test image',
        className: 'responsive-image',
        loading: 'lazy',
        decoding: 'async',
      });
    });
    
    it('should use default options when not provided', async () => {
      const item = {
        previewMedium: 'previews/medium.webp',
      };
      
      const result = await getResponsiveImageProps(item);
      
      expect(result.img.alt).toBe('');
      expect(result.img.className).toBe('');
      expect(result.img.loading).toBe('lazy');
      expect(result.img.decoding).toBe('async');
    });
    
    it('should filter out missing sources', async () => {
      const item = {
        previewMedium: 'previews/medium.webp',
        // No AVIF
      };
      
      const result = await getResponsiveImageProps(item);
      
      // Should only have WebP source, not AVIF
      expect(result.sources.length).toBe(1);
      expect(result.sources[0].type).toBe('image/webp');
    });
    
    it('should include custom sizes attribute', async () => {
      const item = {
        previewSmall: 'previews/small.webp',
        previewMedium: 'previews/medium.webp',
      };
      
      const customSizes = '(max-width: 768px) 100vw, 50vw';
      const result = await getResponsiveImageProps(item, { sizes: customSizes });
      
      expect(result.sources[0].sizes).toBe(customSizes);
    });
  });
  
  describe('hasPreview', () => {
    it('should return true when item has any preview', () => {
      const testCases = [
        { previewSvg: 'image.svg' },
        { previewThumbnail: 'thumb.webp' },
        { previewSmall: 'small.webp' },
        { previewMedium: 'medium.webp' },
        { previewLarge: 'large.webp' },
        { previewAvif: 'image.avif' },
      ];
      
      testCases.forEach(item => {
        expect(hasPreview(item)).toBe(true);
      });
    });
    
    it('should return false when item has no previews', () => {
      const item = {
        name: 'test.pdf',
        mimeType: 'application/pdf',
      };
      
      expect(hasPreview(item)).toBe(false);
    });
    
    it('should return false for null item', () => {
      expect(hasPreview(null)).toBe(false);
    });
    
    it('should return true when item has multiple previews', () => {
      const item = {
        previewSmall: 'small.webp',
        previewMedium: 'medium.webp',
        previewLarge: 'large.webp',
        previewAvif: 'image.avif',
      };
      
      expect(hasPreview(item)).toBe(true);
    });
  });
  
  describe('getBestPreview', () => {
    it('should prefer SVG when preferVector is true', async () => {
      const item = {
        previewSvg: 'image.svg',
        previewMedium: 'medium.webp',
        previewLarge: 'large.webp',
      };
      
      const result = await getBestPreview(item, 'protected', true);
      
      expect(result).toContain('image.svg');
    });
    
    it('should prefer medium raster when preferVector is false', async () => {
      const item = {
        previewSvg: 'image.svg',
        previewMedium: 'medium.webp',
        previewLarge: 'large.webp',
      };
      
      const result = await getBestPreview(item, 'protected', false);
      
      expect(result).toContain('medium.webp');
    });
    
    it('should fallback to next available size', async () => {
      const item = {
        // No SVG or medium
        previewLarge: 'large.webp',
      };
      
      const result = await getBestPreview(item, 'protected', true);
      
      expect(result).toContain('large.webp');
    });
    
    it('should return null when no previews available', async () => {
      const item = {
        name: 'no-preview.pdf',
      };
      
      const result = await getBestPreview(item);
      
      expect(result).toBeNull();
    });
    
    it('should try all sizes in order', async () => {
      // Mock to track which sizes are requested
      const requestedSizes = [];
      vi.mocked(getUrl).mockImplementation(({ key }) => {
        requestedSizes.push(key);
        // Only thumbnail exists
        if (key === 'previews/thumbnail.webp') {
          return Promise.resolve({
            url: { toString: () => `https://s3.amazonaws.com/${key}` }
          });
        }
        return Promise.resolve({
          url: { toString: () => null }
        });
      });
      
      const item = {
        previewThumbnail: 'previews/thumbnail.webp',
      };
      
      const result = await getBestPreview(item, 'protected', true);
      
      expect(result).toContain('thumbnail.webp');
    });
    
    it('should use provided access level', async () => {
      const item = {
        previewMedium: 'previews/medium.webp',
      };
      
      await getBestPreview(item, 'public', true);
      
      expect(getUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            accessLevel: 'public',
          }),
        })
      );
    });
  });
});
