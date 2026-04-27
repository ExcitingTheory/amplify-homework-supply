import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

// Mock getS3Object before importing the module
vi.mock('../../amplify/functions/documentAnalysis/textExtraction', () => ({
  getS3Object: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send: vi.fn() })),
  GetObjectCommand: vi.fn(),
}));

import { getS3Object } from '../../amplify/functions/documentAnalysis/textExtraction';
import {
  extractSpreadsheetText,
  extractPresentationText,
  extractOdfText,
} from '../../amplify/functions/documentAnalysis/officeExtraction';

const mockedGetS3Object = vi.mocked(getS3Object);

describe('officeExtraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractSpreadsheetText', () => {
    it('extracts text from a single-sheet XLSX', async () => {
      const wb = XLSX.utils.book_new();
      const data = [
        ['Word', 'Definition'],
        ['photosynthesis', 'Process of converting light to energy'],
        ['mitosis', 'Cell division process'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Vocabulary');

      const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractSpreadsheetText('test/vocab.xlsx');

      expect(result.text).toContain('photosynthesis');
      expect(result.text).toContain('mitosis');
      expect(result.text).toContain('Vocabulary');
      expect(result.pages).toHaveLength(1);
      expect(result.metadata?.sheetNames).toEqual(['Vocabulary']);
    });

    it('extracts text from multiple sheets', async () => {
      const wb = XLSX.utils.book_new();

      const sheet1 = XLSX.utils.aoa_to_sheet([
        ['Term', 'Translation'],
        ['bonjour', 'hello'],
      ]);
      XLSX.utils.book_append_sheet(wb, sheet1, 'French');

      const sheet2 = XLSX.utils.aoa_to_sheet([
        ['Term', 'Translation'],
        ['hola', 'hello'],
      ]);
      XLSX.utils.book_append_sheet(wb, sheet2, 'Spanish');

      const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractSpreadsheetText('test/multi.xlsx');

      expect(result.pages).toHaveLength(2);
      expect(result.text).toContain('bonjour');
      expect(result.text).toContain('hola');
      expect(result.text).toContain('French');
      expect(result.text).toContain('Spanish');
    });

    it('handles XLS format', async () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['Name', 'Value'], ['test', '42']]);
      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xls' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractSpreadsheetText('test/data.xls');

      expect(result.text).toContain('test');
      expect(result.text).toContain('42');
    });

    it('skips empty sheets', async () => {
      const wb = XLSX.utils.book_new();
      const emptySheet = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(wb, emptySheet, 'Empty');
      const dataSheet = XLSX.utils.aoa_to_sheet([['content', 'here']]);
      XLSX.utils.book_append_sheet(wb, dataSheet, 'Data');

      const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractSpreadsheetText('test/mixed.xlsx');

      // At least the Data sheet should be extracted
      expect(result.text).toContain('content');
    });
  });

  describe('extractPresentationText', () => {
    it('extracts text from PPTX slides', async () => {
      const zip = new JSZip();

      // Minimal PPTX structure with slide XML containing <a:t> text elements
      zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>Introduction to Biology</a:t></a:r></a:p>
          <a:p><a:r><a:t>Chapter 1: Cells</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

      zip.file('ppt/slides/slide2.xml', `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>DNA Structure</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractPresentationText('test/lecture.pptx');

      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].text).toContain('Biology');
      expect(result.pages[1].text).toContain('DNA');
      expect(result.pageCount).toBe(2);
    });

    it('sorts slides numerically', async () => {
      const zip = new JSZip();

      // Add slides out of order
      zip.file('ppt/slides/slide10.xml', `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Slide Ten</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld>
</p:sld>`);

      zip.file('ppt/slides/slide2.xml', `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Slide Two</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld>
</p:sld>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractPresentationText('test/sorted.pptx');

      expect(result.pages[0].text).toContain('Slide Two');
      expect(result.pages[1].text).toContain('Slide Ten');
    });

    it('handles empty presentations', async () => {
      const zip = new JSZip();
      // No slide files
      zip.file('ppt/presentation.xml', '<presentation/>');

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractPresentationText('test/empty.pptx');

      expect(result.pages).toHaveLength(0);
      expect(result.text).toBe('');
    });
  });

  describe('extractOdfText', () => {
    it('extracts text from ODT content.xml', async () => {
      const zip = new JSZip();

      zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:text>
      <text:h>Chapter 1</text:h>
      <text:p>This is an introduction to chemistry.</text:p>
      <text:p>Atoms are the building blocks of matter.</text:p>
    </office:text>
  </office:body>
</office:document-content>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractOdfText('test/doc.odt', 'odt');

      expect(result.text).toContain('chemistry');
      expect(result.text).toContain('Atoms');
    });

    it('extracts table content from ODS', async () => {
      const zip = new JSZip();

      zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:spreadsheet>
      <table:table table:name="Vocabulary">
        <table:table-row>
          <table:table-cell><text:p>Word</text:p></table:table-cell>
          <table:table-cell><text:p>Definition</text:p></table:table-cell>
        </table:table-row>
        <table:table-row>
          <table:table-cell><text:p>entropy</text:p></table:table-cell>
          <table:table-cell><text:p>Measure of disorder</text:p></table:table-cell>
        </table:table-row>
      </table:table>
    </office:spreadsheet>
  </office:body>
</office:document-content>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractOdfText('test/sheet.ods', 'ods');

      expect(result.text).toContain('entropy');
      expect(result.text).toContain('disorder');
    });

    it('throws on missing content.xml', async () => {
      const zip = new JSZip();
      zip.file('readme.txt', 'no content xml');

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      await expect(extractOdfText('test/bad.odt', 'odt')).rejects.toThrow('missing content.xml');
    });

    it('handles ODP presentations', async () => {
      const zip = new JSZip();

      zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:presentation>
      <text:p>Slide 1: Welcome</text:p>
      <text:p>Slide 2: Overview</text:p>
    </office:presentation>
  </office:body>
</office:document-content>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractOdfText('test/slides.odp', 'odp');

      expect(result.text).toContain('Welcome');
      expect(result.text).toContain('Overview');
    });
  });
});
