import { describe, it, expect } from 'vitest';
import {
  isAnalyzableDocument,
  detectMimeType,
  FILE_INPUT_ACCEPT,
} from '../../src/utils/fileUploadUtils';

describe('fileUploadUtils', () => {
  describe('isAnalyzableDocument', () => {
    it('returns false for null/undefined', () => {
      expect(isAnalyzableDocument(null)).toBe(false);
      expect(isAnalyzableDocument(undefined)).toBe(false);
    });

    it('returns true for PDF', () => {
      expect(isAnalyzableDocument('application/pdf')).toBe(true);
    });

    it('returns true for plain text', () => {
      expect(isAnalyzableDocument('text/plain')).toBe(true);
    });

    it('returns true for markdown', () => {
      expect(isAnalyzableDocument('text/markdown')).toBe(true);
    });

    it('returns true for CSV', () => {
      expect(isAnalyzableDocument('text/csv')).toBe(true);
    });

    it('returns true for Word documents', () => {
      expect(isAnalyzableDocument('application/msword')).toBe(true);
      expect(isAnalyzableDocument('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    });

    it('returns true for Excel spreadsheets', () => {
      expect(isAnalyzableDocument('application/vnd.ms-excel')).toBe(true);
      expect(isAnalyzableDocument('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
    });

    it('returns true for PowerPoint presentations', () => {
      expect(isAnalyzableDocument('application/vnd.ms-powerpoint')).toBe(true);
      expect(isAnalyzableDocument('application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe(true);
    });

    // New format support
    it('returns true for ODF formats', () => {
      expect(isAnalyzableDocument('application/vnd.oasis.opendocument.text')).toBe(true);
      expect(isAnalyzableDocument('application/vnd.oasis.opendocument.spreadsheet')).toBe(true);
      expect(isAnalyzableDocument('application/vnd.oasis.opendocument.presentation')).toBe(true);
    });

    it('returns true for EPUB', () => {
      expect(isAnalyzableDocument('application/epub+zip')).toBe(true);
    });

    it('returns true for IMS Common Cartridge', () => {
      expect(isAnalyzableDocument('application/x-imscc+zip')).toBe(true);
    });

    it('returns true for QTI XML', () => {
      expect(isAnalyzableDocument('application/x-qti+xml')).toBe(true);
    });

    it('returns true for GIFT format', () => {
      expect(isAnalyzableDocument('text/x-gift')).toBe(true);
    });

    it('returns true for ZIP (SCORM/IMS CC detection at Lambda)', () => {
      expect(isAnalyzableDocument('application/zip')).toBe(true);
    });

    it('returns false for images', () => {
      expect(isAnalyzableDocument('image/png')).toBe(false);
      expect(isAnalyzableDocument('image/jpeg')).toBe(false);
    });

    it('returns false for audio', () => {
      expect(isAnalyzableDocument('audio/mpeg')).toBe(false);
    });

    it('returns false for .exe', () => {
      expect(isAnalyzableDocument('application/x-msdownload')).toBe(false);
    });
  });

  describe('detectMimeType', () => {
    function mockFile(name, type) {
      return { name, type };
    }

    it('returns original type for standard files', () => {
      expect(detectMimeType(mockFile('doc.pdf', 'application/pdf'))).toBe('application/pdf');
    });

    it('corrects IMSCC files', () => {
      expect(detectMimeType(mockFile('course.imscc', 'application/zip'))).toBe('application/x-imscc+zip');
    });

    it('corrects EPUB files', () => {
      expect(detectMimeType(mockFile('book.epub', 'application/octet-stream'))).toBe('application/epub+zip');
    });

    it('corrects GIFT files', () => {
      expect(detectMimeType(mockFile('quiz.gift', 'text/plain'))).toBe('text/x-gift');
    });

    it('corrects ODT files', () => {
      expect(detectMimeType(mockFile('document.odt', 'application/zip'))).toBe('application/vnd.oasis.opendocument.text');
    });

    it('corrects ODS files', () => {
      expect(detectMimeType(mockFile('spreadsheet.ods', 'application/zip'))).toBe('application/vnd.oasis.opendocument.spreadsheet');
    });

    it('corrects ODP files', () => {
      expect(detectMimeType(mockFile('slides.odp', 'application/zip'))).toBe('application/vnd.oasis.opendocument.presentation');
    });

    it('corrects RTF files', () => {
      expect(detectMimeType(mockFile('notes.rtf', 'text/rtf'))).toBe('application/rtf');
    });

    it('preserves type for unknown extensions', () => {
      expect(detectMimeType(mockFile('file.xyz', 'application/octet-stream'))).toBe('application/octet-stream');
    });
  });

  describe('RTF', () => {
    it('is analyzable under both MIME types browsers report', () => {
      expect(isAnalyzableDocument('application/rtf')).toBe(true);
      expect(isAnalyzableDocument('text/rtf')).toBe(true);
    });
  });

  describe('FILE_INPUT_ACCEPT', () => {
    it('lists the document extensions the file list and analysis support', () => {
      const accepted = FILE_INPUT_ACCEPT.split(',');
      for (const ext of ['.rtf', '.qti', '.qti.xml', '.zip', '.epub', '.imscc', '.gift']) {
        expect(accepted).toContain(ext);
      }
    });
  });
});
