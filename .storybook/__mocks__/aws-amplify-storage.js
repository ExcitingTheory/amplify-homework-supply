/**
 * Mock aws-amplify/storage for Storybook
 * 
 * Supports real recording round-trips: uploaded Blobs are converted to base64
 * data URIs and stored in memory so getUrl can return playable audio/image URLs.
 */

// Base path for GitHub Pages deployment (e.g. /amplify-homework-supply/).
// Ensures static assets resolve correctly when deployed under a subpath.
const BASE_PATH = (typeof import.meta !== 'undefined' && import.meta.env?.STORYBOOK_BASE_PATH) || '/';

// In-memory store for uploaded blob data URLs (keyed by storage path)
const uploadedBlobUrls = new Map();

/** Convert a Blob to a base64 data URI */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Create a simple mock PDF blob URL
const createMockPdfUrl = () => {
  // Create a minimal PDF with some text
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

export const getUrl = async ({ key, path, options = {} }) => {
  const resolvedKey = key || path;
  console.log('Mock getUrl called with:', resolvedKey);
  
  // Check in-memory uploaded blobs first (supports real recording round-trips)
  if (uploadedBlobUrls.has(resolvedKey)) {
    return { url: { href: uploadedBlobUrls.get(resolvedKey) } };
  }
  
  // If key is a data URL, return it as-is
  if (resolvedKey?.startsWith('data:')) {
    return { url: { href: resolvedKey } };
  }
  
  // For story-mock paths or /mocks/ paths, prepend base path for GitHub Pages
  if (resolvedKey?.includes('story-mocks/') || resolvedKey?.includes('/mocks/')) {
    let href = resolvedKey;
    // Prepend base path if not already present (avoids double-prefixing from Vite transform)
    if (BASE_PATH !== '/' && href.startsWith('/') && !href.startsWith(BASE_PATH)) {
      href = BASE_PATH + href.slice(1);
    }
    return { url: { href } };
  }
  
  // If it's a PDF without a known path, return a mock PDF blob URL
  if (resolvedKey?.endsWith('.pdf')) {
    return { url: { href: createMockPdfUrl() } };
  }
  
  // Otherwise return the key wrapped in URL object
  return { url: { href: resolvedKey || 'mock-url' } };
};

export const uploadData = ({ key, path, data, options = {} }) => {
  console.log('[Mock Storage] uploadData called with:', { key, path, options });
  
  // Simulate the upload process (Gen 2 uses path, Gen 1 uses key)
  const mockPath = path || key || `mock-path-${Date.now()}`;
  
  // If data is a Blob, convert to base64 data URL and store for later retrieval
  const resultPromise = (async () => {
    if (data instanceof Blob) {
      try {
        const dataUrl = await blobToDataUrl(data);
        uploadedBlobUrls.set(mockPath, dataUrl);
        console.log('[Mock Storage] Stored blob as data URL for path:', mockPath, `(${data.size} bytes, ${data.type})`);
      } catch (err) {
        console.warn('[Mock Storage] Failed to convert blob to data URL:', err);
      }
    }
    return { key: mockPath, path: mockPath };
  })();
  
  return {
    result: resultPromise,
    state: 'SUCCESS',
    cancel: () => console.log('[Mock Storage] Upload cancelled')
  };
};

export const downloadData = async ({ key, options = {} }) => {
  console.log('[Mock Storage] downloadData called with:', key);
  
  // Return a mock blob for downloads
  const mockContent = `Mock file content for ${key}`;
  const blob = new Blob([mockContent], { type: 'text/plain' });
  
  return {
    result: Promise.resolve({
      body: blob,
      contentType: 'text/plain',
      contentLength: blob.size,
      eTag: 'mock-etag',
      lastModified: new Date(),
    }),
  };
};

export const remove = async () => ({});

export const list = async () => ({ items: [] });
