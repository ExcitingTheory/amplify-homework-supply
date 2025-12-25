/**
 * Mock getCachedUrl utility for Storybook
 * Returns appropriate data URLs for generated content
 */

// Proper WAV audio file with actual audio data (440Hz tone, ~0.5 seconds)
// This is a complete WAV file with RIFF header, fmt chunk, and data chunk containing audio samples
const MOCK_AUDIO_BASE64 = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAD//wAA';

const getCachedUrl = async (path, level, identityId) => {
  console.log('[Mock getCachedUrl]', { path, level, identityId });
  
  // Handle undefined or null path
  if (!path) {
    console.warn('[Mock getCachedUrl] No path provided, returning empty string');
    return '';
  }
  
  // Short circuit if already base64 data
  if (path.startsWith('data:')) {
    return path;
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return appropriate mock URLs based on file type
  if (path.includes('generated')) {
    if (path.includes('.png') || path.includes('.jpg') || path.includes('.jpeg')) {
      // Return a colorful placeholder image (100x100 blue square)
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    } else if (path.includes('.mp3') || path.includes('.wav')) {
      // Return real valid audio file
      return MOCK_AUDIO_BASE64;
    }
  }
  
  // For existing mock files, return placeholder URLs
  if (path.includes('.png') || path.includes('.jpg') || path.includes('.jpeg')) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
  } else if (path.includes('.mp3') || path.includes('.wav')) {
    // Return real valid audio file for all audio requests
    return MOCK_AUDIO_BASE64;
  }
  
  // Default: return mock S3 URL
  return `https://mock-s3-bucket.s3.amazonaws.com/${path}`;
};

export default getCachedUrl;
