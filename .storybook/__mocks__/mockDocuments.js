/**
 * Mock document files as static URLs for Storybook stories
 * 
 * All documents point to real files served from /story-mocks/
 * (mapped from the mocks/ directory via Storybook staticDirs config).
 * No base64-encoded data — everything is a URL to a real file.
 */

/**
 * Sample PDF document (science lesson)
 */
export const MOCK_PDF_BASE64 = '/story-mocks/science-lesson-water-cycle.pdf';

/**
 * Japanese Grammar Guide PDF
 */
export const MOCK_JAPANESE_GRAMMAR_PDF = '/story-mocks/japanese-grammar-guide.pdf';

/**
 * Vocabulary List PDF (reuses water cycle PDF as a real file)
 */
export const MOCK_VOCABULARY_LIST_PDF = '/story-mocks/science-lesson-water-cycle.pdf';

/**
 * Lesson Plan PDF (reuses japanese grammar PDF as a real file)
 */
export const MOCK_LESSON_PLAN_PDF = '/story-mocks/japanese-grammar-guide.pdf';

/**
 * Sample diagram image from mocks directory
 */
export const MOCK_DIAGRAM_IMAGE_BASE64 = '/story-mocks/img_Page_2_Image_0002.jpg';

/**
 * Helper function to generate a minimal valid PDF with custom text
 * Useful for creating additional mock PDFs in tests
 * 
 * @param {string} title - Title text to display in PDF
 * @param {string} content - Content text to display
 * @returns {string} Base64 encoded PDF data URL
 */
export function createMockPDF(title = 'Mock Document', content = 'Sample content') {
  // Escape parentheses in PDF strings
  const escapeTitle = title.replace(/[()]/g, '\\$&');
  const escapeContent = content.replace(/[()]/g, '\\$&');
  
  const pdfContent = `%PDF-1.4
%âãÏÓ
1 0 obj
<</Type/Catalog/Pages 2 0 R>>
endobj
2 0 obj
<</Type/Pages/Kids[3 0 R]/Count 1>>
endobj
3 0 obj
<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>
endobj
4 0 obj
<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>
endobj
5 0 obj
<</Length ${44 + escapeTitle.length + escapeContent.length}>>
stream
BT
/F1 14 Tf
100 700 Td
(${escapeTitle}) Tj
0 -20 Td
/F1 10 Tf
(${escapeContent}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000015 00000 n 
0000000064 00000 n 
0000000121 00000 n 
0000000245 00000 n 
0000000317 00000 n 
trailer
<</Size 6/Root 1 0 R>>
startxref
${411 + escapeTitle.length + escapeContent.length}
%%EOF
`;
  
  return `data:application/pdf;base64,${btoa(pdfContent)}`;
}
