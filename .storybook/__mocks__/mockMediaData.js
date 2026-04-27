/**
 * Mock Media Data - Static file URLs for Storybook
 * 
 * All media references point to real files served from /story-mocks/
 * (mapped from the mocks/ directory via Storybook staticDirs config).
 * No base64-encoded data — everything is a URL to a real file.
 */

// Images — real files from mocks/ served at /story-mocks/
export const MOCK_IMAGE_PNG_BASE64 = '/story-mocks/pattern-9842070_640.png';
export const MOCK_IMAGE_JPEG_BASE64 = '/story-mocks/320px-Test_sign.jpg';
export const MOCK_IMAGE_SVG_BASE64 = '/story-mocks/sample-diagram.svg';

// Audio — real files from mocks/
export const MOCK_AUDIO_MP3_BASE64 = '/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3';
export const MOCK_AUDIO_WAV_BASE64 = '/story-mocks/sample-tone.wav';

// Video — real file from mocks/
export const MOCK_VIDEO_MP4_BASE64 = '/story-mocks/326739_medium.mp4';

// PDF — real file from mocks/
export const MOCK_PDF_BASE64 = '/story-mocks/science-lesson-water-cycle.pdf';

// Mock waveform data (simulates an audio waveform)
export const generateMockWaveformData = (length = 600) => {
  return Array.from({ length }, (_, i) => {
    const position = i / length;
    const envelope = Math.sin(position * Math.PI);
    const detail = Math.sin(i * 0.1) * 0.3 + Math.sin(i * 0.05) * 0.2;
    return Math.max(0, Math.min(1, envelope * (0.5 + detail)));
  });
};

export const mockWaveformData = generateMockWaveformData();

// Import high-quality featured images (real file URLs)
import { FEATURED_IMAGES } from './featuredImagesData.js';
import { FEATURED_IMAGES_CROPPED } from './featuredImagesCroppedData.js';

// Export all as a collection for easy access
export const MOCK_MEDIA = {
  IMAGE_PNG: MOCK_IMAGE_PNG_BASE64,
  IMAGE_JPEG: MOCK_IMAGE_JPEG_BASE64,
  IMAGE_SVG: MOCK_IMAGE_SVG_BASE64,
  AUDIO_MP3: MOCK_AUDIO_MP3_BASE64,
  AUDIO_WAV: MOCK_AUDIO_WAV_BASE64,
  VIDEO_MP4: MOCK_VIDEO_MP4_BASE64,
  PDF: MOCK_PDF_BASE64,
  
  // High-quality featured images for Units and Sections (full size)
  FEATURED: FEATURED_IMAGES,
  
  // Smaller cropped versions for card thumbnails (300x200, ~0.1 MB total)
  FEATURED_CROPPED: FEATURED_IMAGES_CROPPED,
};

export default MOCK_MEDIA;
