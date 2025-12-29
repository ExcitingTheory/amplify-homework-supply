/**
 * Mock aws-amplify/storage for Storybook
 */

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

export const getUrl = async ({ key, options = {} }) => {
  console.log('Mock getUrl called with:', key);
  
  // If key is a data URL, return it as-is
  if (key?.startsWith('data:')) {
    return { url: { href: key } };
  }
  
  // If it's a PDF, return a mock PDF blob URL
  if (key?.endsWith('.pdf')) {
    return { url: { href: createMockPdfUrl() } };
  }
  
  // Otherwise return the key wrapped in URL object
  return { url: { href: key || 'mock-url' } };
};

export const uploadData = ({ key, data, options = {} }) => {
  console.log('[Mock Storage] uploadData called with:', { key, options });
  
  // Simulate the upload process
  const mockPath = key || `mock-path-${Date.now()}`;
  
  return {
    result: Promise.resolve({ 
      key: mockPath,
      path: mockPath
    }),
    state: 'SUCCESS',
    cancel: () => console.log('[Mock Storage] Upload cancelled')
  };
};

export const remove = async () => ({});

export const list = async () => ({ items: [] });
