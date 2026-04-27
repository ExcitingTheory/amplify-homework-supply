import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';

// Mock getS3Object before importing the module
vi.mock('../../amplify/functions/documentAnalysis/textExtraction', () => ({
  getS3Object: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send: vi.fn() })),
  GetObjectCommand: vi.fn(),
}));

import { getS3Object } from '../../amplify/functions/documentAnalysis/textExtraction';
import { detectAndExtractZip } from '../../amplify/functions/documentAnalysis/zipDetector';

const mockedGetS3Object = vi.mocked(getS3Object);

describe('zipDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectAndExtractZip', () => {
    it('detects SCORM package by adlcp namespace in manifest', async () => {
      const zip = new JSZip();

      zip.file('imsmanifest.xml', `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata><schemaversion>1.2</schemaversion></metadata>
  <organizations>
    <organization identifier="org1">
      <title>SCORM Course</title>
      <item identifier="item1"><title>Lesson 1</title></item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" href="index.html" adlcp:scormtype="sco">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`);

      zip.file('index.html', '<html><body><p>SCORM lesson content here.</p></body></html>');

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await detectAndExtractZip('test/scorm-package.zip');

      expect(result.sourceFormat).toMatch(/^scorm/);
      expect(result.text).toContain('SCORM lesson content');
    });

    it('detects SCORM 2004 by imsss namespace', async () => {
      const zip = new JSZip();

      zip.file('imsmanifest.xml', `<?xml version="1.0"?>
<manifest xmlns:imsss="http://www.imsglobal.org/xsd/imsss">
  <metadata><schemaversion>2004 4th Edition</schemaversion></metadata>
  <organizations>
    <organization><title>Advanced Course</title>
      <imsss:sequencing>
        <imsss:objectives>
          <imsss:primaryObjective objectiveID="obj1"/>
        </imsss:objectives>
      </imsss:sequencing>
    </organization>
  </organizations>
  <resources/>
</manifest>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await detectAndExtractZip('test/scorm2004.zip');
      expect(result.sourceFormat).toBe('scorm-2004');
    });

    it('detects IMS CC when manifest has no SCORM markers', async () => {
      const zip = new JSZip();

      zip.file('imsmanifest.xml', `<?xml version="1.0"?>
<manifest>
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.3.0</schemaversion>
  </metadata>
  <organizations>
    <organization>
      <item identifier="i1"><title>Module 1</title></item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="r1" type="webcontent" href="page.html">
      <file href="page.html"/>
    </resource>
  </resources>
</manifest>`);

      zip.file('page.html', '<html><body><p>Course content for IMS CC.</p></body></html>');

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await detectAndExtractZip('test/course.zip');

      expect(result.sourceFormat).toMatch(/^imscc/);
    });

    it('detects EPUB by META-INF/container.xml', async () => {
      const zip = new JSZip();

      zip.file('META-INF/container.xml', `<?xml version="1.0"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

      zip.file('OEBPS/content.opf', `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Test Book</dc:title>
  </metadata>
  <manifest>
    <item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="ch1"/>
  </spine>
</package>`);

      zip.file('OEBPS/chapter1.xhtml', `<?xml version="1.0"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<body><p>Chapter 1: The beginning of the story.</p></body>
</html>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await detectAndExtractZip('test/book.zip');

      expect(result.sourceFormat).toMatch(/^epub/);
      expect(result.text).toContain('beginning of the story');
    });

    it('detects QTI package by .qti.xml files', async () => {
      const zip = new JSZip();

      zip.file('assessment/question1.qti.xml', `<?xml version="1.0"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
  identifier="q1" title="Sample Question">
  <itemBody>
    <p>What is 2 + 2?</p>
  </itemBody>
</assessmentItem>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await detectAndExtractZip('test/quiz-pack.zip');

      expect(result.sourceFormat).toMatch(/^qti/);
      expect(result.directContent?.questionsJSON).toBeDefined();
    });

    it('detects QTI by namespace in XML files', async () => {
      const zip = new JSZip();

      zip.file('quiz.xml', `<?xml version="1.0"?>
<assessmentTest xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1">
  <assessmentItem identifier="q1" title="NS Detection">
    <itemBody><p>Detected by namespace?</p></itemBody>
  </assessmentItem>
</assessmentTest>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await detectAndExtractZip('test/ns-qti.zip');

      expect(result.sourceFormat).toMatch(/^qti/);
    });

    it('throws for generic ZIP with no educational markers', async () => {
      const zip = new JSZip();
      zip.file('readme.txt', 'Just a regular ZIP file');
      zip.file('data.json', '{"key": "value"}');

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      await expect(detectAndExtractZip('test/generic.zip'))
        .rejects.toThrow('does not contain a recognized educational format');
    });

    it('ignores __MACOSX directories when checking XML files', async () => {
      const zip = new JSZip();
      zip.file('__MACOSX/._quiz.xml', 'mac metadata');
      zip.file('notes.txt', 'Just plain notes');

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      await expect(detectAndExtractZip('test/macos.zip'))
        .rejects.toThrow('does not contain a recognized educational format');
    });

    it('prioritizes SCORM over IMS CC when both markers present', async () => {
      const zip = new JSZip();

      // Manifest with both IMS and SCORM markers — SCORM wins
      zip.file('imsmanifest.xml', `<?xml version="1.0"?>
<manifest xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations>
    <organization><title>Hybrid</title></organization>
  </organizations>
  <resources/>
</manifest>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await detectAndExtractZip('test/hybrid.zip');

      expect(result.sourceFormat).toMatch(/^scorm/);
    });
  });
});
