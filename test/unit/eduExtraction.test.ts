import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';

// Mock getS3Object before importing the module
vi.mock('../../amplify/functions/documentAnalysis/textExtraction', () => ({
  getS3Object: vi.fn(),
}));

// Also mock S3Client since it's imported at module level in textExtraction
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send: vi.fn() })),
  GetObjectCommand: vi.fn(),
}));

import { getS3Object } from '../../amplify/functions/documentAnalysis/textExtraction';
import { extractIMSCC, extractSCORM, extractQTI } from '../../amplify/functions/documentAnalysis/eduExtraction';

const mockedGetS3Object = vi.mocked(getS3Object);

describe('eduExtraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractIMSCC', () => {
    it('extracts web content and structure from IMS CC package', async () => {
      const zip = new JSZip();

      // Create imsmanifest.xml with organization and resources
      zip.file('imsmanifest.xml', `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="test-manifest">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.3.0</schemaversion>
  </metadata>
  <organizations>
    <organization identifier="org1">
      <item identifier="item1">
        <title>Introduction to Biology</title>
      </item>
      <item identifier="item2">
        <title>Cell Structure</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" href="content/lesson1.html">
      <file href="content/lesson1.html"/>
    </resource>
  </resources>
</manifest>`);

      // Create HTML content
      zip.file('content/lesson1.html', `<html>
<body>
  <h1>Introduction to Biology</h1>
  <p>Biology is the study of living organisms.</p>
  <p>Cells are the basic unit of life.</p>
</body>
</html>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractIMSCC('test/course.imscc');

      expect(result.sourceFormat).toBe('imscc-1.3');
      expect(result.text).toContain('Biology');
      expect(result.pages.length).toBeGreaterThan(0);
      expect(result.directContent?.objectivesJSON).toBeDefined();
      expect(result.directContent!.objectivesJSON!.length).toBe(2);
    });

    it('throws on missing imsmanifest.xml', async () => {
      const zip = new JSZip();
      zip.file('readme.txt', 'no manifest here');
      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      await expect(extractIMSCC('test/bad.imscc')).rejects.toThrow('missing imsmanifest.xml');
    });

    it('extracts embedded QTI assessment items', async () => {
      const zip = new JSZip();

      zip.file('imsmanifest.xml', `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="test">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.2.0</schemaversion>
  </metadata>
  <organizations>
    <organization identifier="org1">
      <item identifier="i1"><title>Quiz 1</title></item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="imsqti_xmlv2p1" href="assessments/quiz1.xml">
      <file href="assessments/quiz1.xml"/>
    </resource>
  </resources>
</manifest>`);

      zip.file('assessments/quiz1.xml', `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
  identifier="q1" title="Cell Question">
  <itemBody>
    <p>What is the powerhouse of the cell?</p>
    <choiceInteraction responseIdentifier="RESPONSE" maxChoices="1">
      <simpleChoice identifier="A">Nucleus</simpleChoice>
      <simpleChoice identifier="B">Mitochondria</simpleChoice>
      <simpleChoice identifier="C">Ribosome</simpleChoice>
    </choiceInteraction>
  </itemBody>
  <responseDeclaration identifier="RESPONSE">
    <correctResponse><value>B</value></correctResponse>
  </responseDeclaration>
</assessmentItem>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractIMSCC('test/quiz.imscc');

      expect(result.sourceFormat).toBe('imscc-1.2');
      expect(result.directContent?.questionsJSON).toBeDefined();
      expect(result.directContent!.questionsJSON!.length).toBeGreaterThan(0);
    });

    it('detects CC version 1.1', async () => {
      const zip = new JSZip();
      zip.file('imsmanifest.xml', `<?xml version="1.0"?>
<manifest>
  <metadata><schemaversion>1.1.0</schemaversion></metadata>
  <organizations><organization><item><title>Test</title></item></organization></organizations>
  <resources/>
</manifest>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));
      mockedGetS3Object.mockResolvedValue(buffer);

      const result = await extractIMSCC('test/old.imscc');
      expect(result.sourceFormat).toBe('imscc-1.1');
    });
  });

  describe('extractSCORM', () => {
    it('extracts HTML content and organization structure', async () => {
      const zip = new JSZip();

      const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="scorm-test" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>Biology Course</title>
      <item identifier="item1">
        <title>Lesson 1: Cells</title>
      </item>
      <item identifier="item2">
        <title>Lesson 2: DNA</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" href="content/lesson1.html" adlcp:scormtype="sco">
      <file href="content/lesson1.html"/>
    </resource>
  </resources>
</manifest>`;

      zip.file('imsmanifest.xml', manifestXml);
      zip.file('content/lesson1.html', `<html><body><h1>Cells</h1><p>The cell is the fundamental unit of life.</p></body></html>`);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));

      const { XMLParser } = await import('fast-xml-parser');
      const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
      const manifest = parser.parse(manifestXml);

      const result = await extractSCORM('test/scorm.zip', buffer, zip, manifest);

      expect(result.sourceFormat).toBe('scorm-1.2');
      expect(result.text).toContain('cell');
      expect(result.directContent?.objectivesJSON).toBeDefined();
      expect(result.directContent?.summariesJSON).toBeDefined();
      expect(result.directContent!.summariesJSON!.length).toBeGreaterThan(0);
    });

    it('detects SCORM 2004 version', async () => {
      const zip = new JSZip();

      const manifestXml = `<?xml version="1.0"?>
<manifest>
  <metadata><schemaversion>2004 4th Edition</schemaversion></metadata>
  <organizations>
    <organization identifier="org1"><title>Course</title></organization>
  </organizations>
  <resources/>
</manifest>`;

      zip.file('imsmanifest.xml', manifestXml);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));

      const { XMLParser } = await import('fast-xml-parser');
      const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
      const manifest = parser.parse(manifestXml);

      const result = await extractSCORM('test/scorm2004.zip', buffer, zip, manifest);

      expect(result.sourceFormat).toBe('scorm-2004');
    });

    it('returns empty pages for packages without HTML content', async () => {
      const zip = new JSZip();

      const manifestXml = `<?xml version="1.0"?>
<manifest>
  <metadata><schemaversion>1.2</schemaversion></metadata>
  <organizations>
    <organization identifier="org1"><title>Empty Course</title></organization>
  </organizations>
  <resources/>
</manifest>`;

      zip.file('imsmanifest.xml', manifestXml);

      const buffer = Buffer.from(await zip.generateAsync({ type: 'uint8array' }));

      const { XMLParser } = await import('fast-xml-parser');
      const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
      const manifest = parser.parse(manifestXml);

      const result = await extractSCORM('test/empty.zip', buffer, zip, manifest);

      expect(result.text).toBe('');
      expect(result.pages).toHaveLength(0);
      expect(result.pageCount).toBe(1); // minimum 1
    });
  });

  describe('extractQTI', () => {
    it('extracts questions from QTI 2.1 XML', async () => {
      const qtiXml = `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
  identifier="q1" title="Vocabulary Question">
  <responseDeclaration identifier="RESPONSE" cardinality="single">
    <correctResponse><value>B</value></correctResponse>
  </responseDeclaration>
  <itemBody>
    <p>What does 'photosynthesis' mean?</p>
    <choiceInteraction responseIdentifier="RESPONSE" maxChoices="1">
      <simpleChoice identifier="A">Cell division</simpleChoice>
      <simpleChoice identifier="B">Converting light to energy</simpleChoice>
      <simpleChoice identifier="C">Water absorption</simpleChoice>
    </choiceInteraction>
  </itemBody>
</assessmentItem>`;

      mockedGetS3Object.mockResolvedValue(Buffer.from(qtiXml));

      const result = await extractQTI('test/quiz.qti.xml');

      expect(result.sourceFormat).toBe('qti-2.1');
      expect(result.directContent?.questionsJSON).toBeDefined();
      expect(result.directContent!.questionsJSON!.length).toBe(1);

      const q = result.directContent!.questionsJSON![0] as any;
      expect(q.prompt).toContain('photosynthesis');
      expect(q.questionType).toBe('multiple-choice');
      expect(q.options).toHaveLength(3);
      expect(q.answer).toBe('Converting light to energy');
    });

    it('detects QTI 3.0 version', async () => {
      const qtiXml = `<?xml version="1.0"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqti/qtiv3p0"
  identifier="q1" title="Test">
  <qti-item-body><p>Is this QTI 3?</p></qti-item-body>
</qti-assessment-item>`;

      mockedGetS3Object.mockResolvedValue(Buffer.from(qtiXml));

      const result = await extractQTI('test/v3.qti.xml');
      expect(result.sourceFormat).toBe('qti-3.0');
    });

    it('handles text entry interaction as short-answer', async () => {
      const qtiXml = `<?xml version="1.0"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
  identifier="q1" title="Fill In">
  <responseDeclaration identifier="RESPONSE">
    <correctResponse><value>mitochondria</value></correctResponse>
  </responseDeclaration>
  <itemBody>
    <p>The powerhouse of the cell is the <textEntryInteraction responseIdentifier="RESPONSE"/></p>
  </itemBody>
</assessmentItem>`;

      mockedGetS3Object.mockResolvedValue(Buffer.from(qtiXml));

      const result = await extractQTI('test/fill.qti.xml');
      const q = result.directContent!.questionsJSON![0] as any;
      expect(q.questionType).toBe('short-answer');
      expect(q.answer).toBe('mitochondria');
    });

    it('extracts feedback as hint', async () => {
      const qtiXml = `<?xml version="1.0"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
  identifier="q1" title="With Hint">
  <responseDeclaration identifier="RESPONSE">
    <correctResponse><value>Tokyo</value></correctResponse>
  </responseDeclaration>
  <itemBody>
    <p>What is the capital of Japan?</p>
    <textEntryInteraction responseIdentifier="RESPONSE"/>
    <feedbackInline outcomeIdentifier="FEEDBACK" showHide="show" identifier="correct">
      Tokyo has been the capital since 1868.
    </feedbackInline>
  </itemBody>
</assessmentItem>`;

      mockedGetS3Object.mockResolvedValue(Buffer.from(qtiXml));

      const result = await extractQTI('test/hint.qti.xml');
      const q = result.directContent!.questionsJSON![0] as any;
      expect(q.hint).toContain('1868');
    });

    it('returns text representation for GPT analysis', async () => {
      const qtiXml = `<?xml version="1.0"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
  identifier="q1" title="Simple">
  <responseDeclaration identifier="RESPONSE">
    <correctResponse><value>water</value></correctResponse>
  </responseDeclaration>
  <itemBody>
    <p>What is H2O commonly known as?</p>
    <textEntryInteraction responseIdentifier="RESPONSE"/>
  </itemBody>
</assessmentItem>`;

      mockedGetS3Object.mockResolvedValue(Buffer.from(qtiXml));

      const result = await extractQTI('test/text.qti.xml');
      expect(result.text).toContain('Q:');
      expect(result.text).toContain('A:');
      expect(result.text).toContain('H2O');
    });
  });
});
