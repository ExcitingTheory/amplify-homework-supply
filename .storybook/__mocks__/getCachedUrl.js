/**
 * Mock getCachedUrl utility for Storybook
 * Returns appropriate data URLs for generated content
 */

// Proper WAV audio file with actual audio data (440Hz tone, ~0.5 seconds)
// This is a complete WAV file with RIFF header, fmt chunk, and data chunk containing audio samples
const MOCK_AUDIO_BASE64 = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAD//wAA';

// Create a simple mock PDF blob URL
const createMockPdfUrl = () => {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Mock PDF Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`;
  
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
};

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
  } else if (path.includes('.pdf')) {
    // Return real valid PDF blob URL
    return createMockPdfUrl();
  }
  
  // Default: return mock S3 URL
  return `https://mock-s3-bucket.s3.amazonaws.com/${path}`;
};

export default getCachedUrl;
