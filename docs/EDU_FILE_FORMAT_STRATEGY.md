# Educational & Document File Format Strategy

## Problem

The platform has three gates a file must pass through to become analyzed content with embeddings:

1. **Upload gate** — `ACCEPTABLE_FILE_TYPES` in `DragDropPastePlugin.js` + `accept=` in `FileManager2.jsx`
2. **Analysis gate** — `isAnalyzableDocument()` in `fileUploadUtils.jsx`
3. **Extraction gate** — file extension routing in `documentAnalysis/handler.ts`

**6 file types currently pass gates 1+2 but crash at gate 3** (Lambda throws `Unsupported file type`). Educational interchange formats (SCORM, QTI, IMS Common Cartridge) are not supported at any gate.

---

## Complete Format Matrix

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Working |
| ❌ | Missing — needs implementation |
| ⚠️ | Broken — frontend accepts but Lambda rejects |
| 🚫 | Intentionally excluded |
| — | Not applicable (upload-only, not analyzable) |

### Document & Office Formats

| Extension | MIME Type | Upload | Analyzable | Lambda Extracts | Library | Status |
|-----------|----------|--------|------------|-----------------|---------|--------|
| `.pdf` | `application/pdf` | ✅ | ✅ | ✅ | `pdfjs-dist` | Working |
| `.txt` | `text/plain` | ✅ | ✅ | ✅ | `Buffer.toString` | Working |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | ✅ | ✅ | ✅ | `mammoth` | Working |
| `.csv` | `text/csv` | ✅ | ✅ | ✅ | `Buffer.toString` | Working |
| `.md` | `text/markdown` | ✅ | ✅ | ⚠️ | `Buffer.toString` | **Fix: trivial — same as .txt** |
| `.doc` | `application/msword` | ✅ | ✅ | ⚠️ | `mammoth` (verify .doc support) | **Fix: add .doc branch** |
| `.xls` | `application/vnd.ms-excel` | ✅ | ✅ | ⚠️ | `xlsx` (SheetJS) | **Fix: add extraction** |
| `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | ✅ | ✅ | ⚠️ | `xlsx` (SheetJS) | **Fix: add extraction** |
| `.ppt` | `application/vnd.ms-powerpoint` | ✅ | ✅ | ⚠️ | `jszip` + XML parse | **Fix: add extraction** |
| `.pptx` | `application/vnd.openxmlformats-officedocument.presentationml.presentation` | ✅ | ✅ | ⚠️ | `jszip` + XML parse | **Fix: add extraction** |
| `.odt` | `application/vnd.oasis.opendocument.text` | ✅ | ❌ | ❌ | `jszip` + parse `content.xml` | **Add to all 3 gates** |
| `.ods` | `application/vnd.oasis.opendocument.spreadsheet` | ✅ | ❌ | ❌ | `jszip` + parse `content.xml` | **Add to all 3 gates** |
| `.odp` | `application/vnd.oasis.opendocument.presentation` | ✅ | ❌ | ❌ | `jszip` + parse `content.xml` | **Add to all 3 gates** |

### Educational Interchange Formats (New)

| Extension | MIME Type | Browser Reports As | Upload | Analyzable | Lambda Extracts | Library | Status |
|-----------|----------|-------------------|--------|------------|-----------------|---------|--------|
| `.zip` (SCORM) | `application/zip` | `application/zip` | ✅ | ❌ | ❌ | `jszip`, `fast-xml-parser`, `html-to-text` | **Add** |
| `.imscc` | `application/zip` | `application/zip` / `application/octet-stream` | ❌ | ❌ | ❌ | `jszip`, `fast-xml-parser`, `html-to-text` | **Add** |
| `.qti.xml` | `text/xml` | `text/xml` / `application/xml` | ❌ | ❌ | ❌ | `fast-xml-parser` | **Add** |
| `.epub` | `application/epub+zip` | `application/epub+zip` | ❌ | ❌ | ❌ | `jszip`, `fast-xml-parser`, `html-to-text` | **Add** |
| `.gift` | `text/plain` | `text/plain` | ✅ | ✅ | ❌ | built-in (regex parser) | **Add Lambda extraction** |

### Archive Formats (Upload-Only — Not Analyzable)

| Extension | MIME Type | Upload | Analyzable | Notes |
|-----------|----------|--------|------------|-------|
| `.zip` (generic) | `application/zip` | ✅ | — | Keep upload-only unless detected as SCORM/IMS CC |
| `.rar` | `application/x-rar-compressed` | ✅ | — | Generic archive |
| `.7z` | `application/x-7z-compressed` | ✅ | — | Generic archive |
| `.tar` | `application/x-tar` | ✅ | — | Generic archive |
| `.bz2` | `application/x-bzip2` | ✅ | — | Generic archive |
| `.gz` | `application/gzip` | ✅ | — | Generic archive |
| `.xz` | `application/x-xz` | ✅ | — | Generic archive |

### Should Remove

| Extension | MIME Type | Reason |
|-----------|----------|--------|
| `.exe` | `application/x-msdownload` | Security risk — no educational use case |

---

## Pipeline Flow

```
User uploads file
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│  UPLOAD GATE (frontend)                                 │
│  DragDropPastePlugin.js: ACCEPTABLE_FILE_TYPES          │
│  FileManager2.jsx: accept= attribute                    │
│  + filename-based MIME correction for .imscc/.epub/.gift│
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  S3 UPLOAD + FILE RECORD                                │
│  fileUploadUtils.jsx: uploadFile()                      │
│  → Upload to S3                                         │
│  → Create File record (with corrected mimeType)         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  ANALYSIS GATE (frontend)                               │
│  fileUploadUtils.jsx: isAnalyzableDocument()            │
│  → If analyzable: create Document record (status:       │
│    'uploaded') + set sourceFormat                        │
│  → If not: stop here (file is just stored)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  EXTRACTION GATE (Lambda)                               │
│  documentAnalysis/handler.ts                            │
│                                                         │
│  Route by extension:                                    │
│  .pdf          → extractPdfText()           [pdfjs]     │
│  .txt/.md/.gift→ Buffer.toString('utf-8')   [built-in]  │
│  .csv          → Buffer.toString('utf-8')   [built-in]  │
│  .doc/.docx    → mammoth.extractRawText()   [mammoth]   │
│  .xls/.xlsx    → xlsx.read() → sheet→text   [xlsx]      │
│  .odt          → jszip → content.xml→text   [jszip+xml] │
│  .ods          → jszip → content.xml→text   [jszip+xml] │
│  .ppt/.pptx    → jszip → slide XML→text    [jszip+xml]  │
│  .odp          → jszip → content.xml→text   [jszip+xml] │
│  .epub         → extractEpub()              [jszip+xml]  │
│  .imscc        → extractIMSCC()             [jszip+xml]  │
│  .zip          → detectAndExtractZip()      [jszip+xml]  │
│  .qti.xml/.xml → extractQTI()              [xml]         │
│                                                         │
│  All extractors return:                                 │
│  { text: string, pages: [{pageNumber, text}],           │
│    pageCount: number, metadata?: object,                │
│    directContent?: { questionsJSON?, vocabularyJSON? } } │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  GPT-4o ANALYSIS                                        │
│  handler.ts → OpenAI chat.completions.create()          │
│                                                         │
│  Input: extracted text + any direct content              │
│  Output → ParsedContent record:                         │
│    • vocabularyJSON  [{word, definition, context, page}] │
│    • summariesJSON   [{title, content, page_range}]     │
│    • objectivesJSON  [{objective, bloom_level}]         │
│    • conceptsJSON    [{concept, description, related}]  │
│    • questionsJSON   [{prompt, answer, hint, difficulty}]│
│                                                         │
│  For QTI/GIFT: merge directContent.questionsJSON with   │
│  GPT-enhanced metadata (bloom_level, hints)             │
│                                                         │
│  Document status: 'analyzing' → 'completed'             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  EMBEDDING GENERATION (Lambda)                          │
│  embeddings/handler.ts: generateEmbeddings(fileID)      │
│                                                         │
│  Reads ParsedContent → generates text-embedding-3-small │
│  for vocabulary + summaries → stores in                 │
│  ParsedContent.metadata                                 │
│                                                         │
│  Document status: 'completed' → 'embedded'              │
│                                                         │
│  NO CHANGES NEEDED — works for all formats              │
└─────────────────────────────────────────────────────────┘
```

---

## ZIP-Based Format Detection

Since SCORM packages, IMS CC, EPUB, and QTI packages all arrive as `application/zip`, the Lambda must peek inside to determine format:

```
.zip file arrives at Lambda →
  1. Open with jszip, read file listing
  2. Check for detection markers:

     ┌─ Has imsmanifest.xml?
     │   ├─ YES → read manifest XML
     │   │   ├─ Contains adlcp:scormtype or adlcp namespace?
     │   │   │   → SCORM (check version from <schemaversion>)
     │   │   │     sourceFormat = 'scorm-1.2' | 'scorm-2004'
     │   │   │
     │   │   └─ No SCORM markers?
     │   │       → IMS Content Package / Common Cartridge
     │   │         sourceFormat = 'imscc-1.3' | 'imscp-1.2'
     │   │
     │   └─ NO imsmanifest.xml
     │       ├─ Has META-INF/container.xml?
     │       │   → EPUB
     │       │     sourceFormat = 'epub-3' | 'epub-2'
     │       │
     │       ├─ Has *.qti.xml or imsqti namespace in any XML?
     │       │   → QTI Package
     │       │     sourceFormat = 'qti-2.1' | 'qti-3.0'
     │       │
     │       └─ None of the above
     │           → Generic ZIP — not analyzable, skip
     └
```

---

## Extraction Strategy Per Format

### Existing Formats (Fix Broken Ones)

#### `.md` — Markdown
```
Buffer.toString('utf-8') → text
```
Trivial fix. Same as `.txt`.

#### `.doc` — Legacy Word
```
mammoth.extractRawText({ buffer }) → text
```
Mammoth supports `.doc` (binary) in addition to `.docx`. Verify and add branch.

#### `.xls` / `.xlsx` — Excel Spreadsheets
```
xlsx.read(buffer) → workbook
For each sheet:
  xlsx.utils.sheet_to_csv(sheet) → csv text
  Concatenate with sheet name headers
```
Sheet-to-CSV preserves tabular structure. GPT-4o handles CSV well for vocab/quiz extraction.

#### `.ppt` / `.pptx` — PowerPoint
```
jszip.loadAsync(buffer) → zip
For each ppt/slides/slide{N}.xml:
  Parse XML → extract <a:t> text nodes
  Each slide = one "page"
Sort slides by number
```
PPTX is an OOXML ZIP. Slide text lives in `<a:t>` elements within `ppt/slides/slide*.xml`.

#### `.odt` / `.ods` / `.odp` — OpenDocument Formats
```
jszip.loadAsync(buffer) → zip
Read content.xml
Parse XML → extract text:p, text:span, text:h elements
For .ods: also parse table:table-row/table:table-cell
```
ODF files are ZIPs with `content.xml` containing the document structure.

### New Educational Formats

#### SCORM Package (`.zip` with `imsmanifest.xml`)

**Extraction:**
```
jszip.loadAsync(buffer) → zip
1. Parse imsmanifest.xml:
   - <organization> → course structure, titles
   - <item> hierarchy → module/lesson tree
   - <adlcp:prerequisites> → objectivesJSON
   - <imsss:objectives> → objectivesJSON
   - <resource> → list of HTML/media files

2. For each referenced HTML resource:
   - Read from ZIP
   - html-to-text conversion → plain text
   - Track as page (by <item> order)

3. If embedded assessments found (quiz HTML):
   - Parse question structure → questionsJSON

4. Return concatenated text + objectives + questions
```

**Output mapping:**
- `imsmanifest.xml` organizations → `summariesJSON` (course structure)
- `imsmanifest.xml` objectives → `objectivesJSON` (learning objectives)
- HTML content → `vocabularyJSON` + `conceptsJSON` (via GPT-4o)
- Assessment HTML → `questionsJSON` (direct + GPT enhancement)

#### IMS Common Cartridge (`.imscc`)

**Extraction:**
```
jszip.loadAsync(buffer) → zip
1. Parse imsmanifest.xml:
   - <organization> → course structure
   - <resource type="imsqti_xmlv2p1"> → QTI assessment items
   - <resource type="webcontent"> → HTML content
   - <resource type="imswl_xmlv1p0"> → web links

2. For each QTI resource:
   - Parse QTI XML → direct questionsJSON extraction
   - Extract: prompt (itemBody), choices (simpleChoice),
     correct answer (correctResponse), question type

3. For each webcontent resource:
   - html-to-text → plain text

4. Return text + direct questionsJSON
```

**Output mapping:**
- QTI items → `questionsJSON` (direct extraction — highest fidelity)
- Web content → `vocabularyJSON` + `conceptsJSON` + `summariesJSON` (via GPT-4o)
- Manifest objectives → `objectivesJSON`

#### QTI XML (`.qti.xml` or detected by namespace)

**Extraction:**
```
Parse XML (fast-xml-parser)
1. Find all <assessmentItem> elements
2. For each item:
   - identifier, title, adaptive, timeDependent
   - <itemBody> → question prompt text
   - <choiceInteraction>/<textEntryInteraction>/etc → interaction type
   - <simpleChoice> → answer options
   - <correctResponse> → correct answer(s)
   - <outcomeDeclaration> → scoring/difficulty

3. Map to questionsJSON:
   {
     prompt: itemBody text,
     answer: correctResponse value,
     options: simpleChoice texts (for MC),
     questionType: interaction type mapping,
     difficulty: from outcomeDeclaration or 'medium',
     hint: feedbackInline text if present
   }

4. Concatenate all question text for GPT analysis
```

**Output mapping:**
- `assessmentItem` → `questionsJSON` (direct — native format)
- Question text → `vocabularyJSON` + `conceptsJSON` (via GPT-4o)

**QTI question type mapping:**

| QTI Interaction | Maps To |
|----------------|---------|
| `choiceInteraction` (maxChoices=1) | `multiple-choice` |
| `choiceInteraction` (maxChoices>1) | `select-all` |
| `textEntryInteraction` | `short-answer` |
| `extendedTextInteraction` | `essay` |
| `orderInteraction` | `ordering` |
| `matchInteraction` | `matching` |
| `inlineChoiceInteraction` | `fill-in-the-blank` |
| `hottextInteraction` | `highlight` |

#### EPUB (`.epub`)

**Extraction:**
```
jszip.loadAsync(buffer) → zip
1. Read META-INF/container.xml → find .opf file path
2. Parse .opf (Open Packaging Format):
   - <manifest> → list of all content files
   - <spine> → reading order of XHTML documents
   - <metadata> → title, author, language, subject
   - <guide> → TOC, cover references

3. For each spine item (in order):
   - Read XHTML file from ZIP
   - html-to-text → plain text
   - Each spine item = one "page"

4. Parse NCX/nav.xhtml → Table of Contents
   - TOC entries → summariesJSON structure

5. Return pages + TOC structure
```

**Output mapping:**
- Spine XHTML → pages of text → all 5 fields via GPT-4o
- TOC → `summariesJSON` (chapter structure with titles)
- Metadata → `objectivesJSON` if subject tags present

#### GIFT Format (`.gift`)

Moodle's plain-text question format. Detected by `.gift` extension (browser reports as `text/plain`).

**Extraction:**
```
Buffer.toString('utf-8') → raw text
Parse with regex:

// Question block separated by blank lines
// Title: ::title::
// Question text before { }
// Answers inside { }

Patterns:
  Multiple choice:  { =correct ~wrong ~wrong }
  True/False:       { TRUE } or { FALSE } or { T } or { F }
  Short answer:     { =answer1 =answer2 }
  Matching:         { =item1 -> match1 =item2 -> match2 }
  Numerical:        { #answer:tolerance }
  Essay:            { }
  Missing word:     text { =answer } more text
```

**Example GIFT:**
```gift
::Japanese Greeting:: What does こんにちは mean? {
  =Hello / Good afternoon
  ~Goodbye
  ~Thank you
  ~Good morning
}

::True False:: Kanji originated from Chinese characters. {TRUE}

::Matching:: Match the greeting to the time of day. {
  =おはよう -> Morning
  =こんにちは -> Afternoon
  =こんばんは -> Evening
}
```

**Output mapping:**
- Parsed questions → `questionsJSON` (direct extraction)
- Question text → `vocabularyJSON` + `conceptsJSON` (via GPT-4o)

**GIFT question type mapping:**

| GIFT Pattern | Maps To |
|-------------|---------|
| `{ =correct ~wrong }` | `multiple-choice` |
| `{ TRUE }` / `{ FALSE }` | `true-false` |
| `{ =answer }` | `short-answer` |
| `{ =a -> b }` | `matching` |
| `{ #42:0.1 }` | `numerical` |
| `{ }` | `essay` |
| `text { =answer } text` | `fill-in-the-blank` |

---

## Direct Content Extraction vs GPT Analysis

Some formats contain structured data that maps directly to `ParsedContent` fields without needing GPT-4o interpretation. This is both faster and more accurate for those fields.

| Format | Direct Fields | GPT-Enhanced Fields |
|--------|--------------|-------------------|
| **QTI** | `questionsJSON` (prompt, answer, options, type) | `bloom_level`, `hint` enrichment; `vocabularyJSON`, `conceptsJSON` from question text |
| **GIFT** | `questionsJSON` (prompt, answer, options, type) | `bloom_level`, `hint` enrichment; `vocabularyJSON`, `conceptsJSON` from question text |
| **IMS CC** | `questionsJSON` (from embedded QTI); `objectivesJSON` (from manifest) | `vocabularyJSON`, `summariesJSON`, `conceptsJSON` from web content |
| **SCORM** | `objectivesJSON` (from manifest); `summariesJSON` (from org structure) | `vocabularyJSON`, `conceptsJSON`, `questionsJSON` from HTML content |
| **EPUB** | `summariesJSON` (from TOC) | All other fields from chapter text |
| **CSV** | `vocabularyJSON` (if word+definition columns); `questionsJSON` (if prompt+answer columns) | All other fields |
| **XLS/XLSX** | Same as CSV (per-sheet) | All other fields |
| **All others** | None — text only | All 5 fields via GPT-4o |

**Merge strategy:** When both direct and GPT content exist for the same field, direct content takes priority. GPT output is used to fill gaps (e.g., adding `bloom_level` to directly-extracted questions).

---

## Schema Change

Add `sourceFormat` field to the Document model in `amplify/data/resource.ts`:

```typescript
sourceFormat: a.string(),
```

**Valid values:**

| Value | Format |
|-------|--------|
| `pdf` | PDF |
| `txt` | Plain text |
| `md` | Markdown |
| `csv` | CSV |
| `doc` | Legacy Word |
| `docx` | Modern Word |
| `xls` | Legacy Excel |
| `xlsx` | Modern Excel |
| `ppt` | Legacy PowerPoint |
| `pptx` | Modern PowerPoint |
| `odt` | OpenDocument Text |
| `ods` | OpenDocument Spreadsheet |
| `odp` | OpenDocument Presentation |
| `scorm-1.2` | SCORM 1.2 |
| `scorm-2004` | SCORM 2004 |
| `imscc-1.1` | IMS Common Cartridge 1.1 |
| `imscc-1.2` | IMS Common Cartridge 1.2 |
| `imscc-1.3` | IMS Common Cartridge 1.3 |
| `imscp-1.2` | IMS Content Package 1.2 |
| `qti-2.1` | QTI 2.1 |
| `qti-3.0` | QTI 3.0 |
| `epub-2` | EPUB 2.x |
| `epub-3` | EPUB 3.x |
| `gift` | Moodle GIFT |

---

## Frontend MIME Detection

Browsers cannot detect `.imscc`, `.gift`, or `.epub` by content — they report generic MIME types. The `uploadFile()` function needs filename-based correction:

```javascript
function detectMimeType(file) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const overrides = {
    'imscc': 'application/x-imscc+zip',
    'epub':  'application/epub+zip',
    'gift':  'text/x-gift',
    'qti':   'application/x-qti+xml',
    'odt':   'application/vnd.oasis.opendocument.text',
    'ods':   'application/vnd.oasis.opendocument.spreadsheet',
    'odp':   'application/vnd.oasis.opendocument.presentation',
  };
  return overrides[ext] || file.type;
}
```

For `.zip` files, detection happens at the Lambda level (not frontend) since we need to peek inside the archive.

---

## New Lambda Dependencies

| Package | Version | Size | Purpose |
|---------|---------|------|---------|
| `jszip` | `^3.10` | ~160KB | Unzip SCORM/IMS CC/EPUB/PPTX/ODP/ODS/ODT in-memory |
| `fast-xml-parser` | `^4.3` | ~50KB | Parse imsmanifest.xml, QTI XML, ODF content.xml, PPTX slide XML |
| `html-to-text` | `^9.0` | ~40KB | Strip HTML tags from SCORM/IMS CC/EPUB content preserving structure |
| `xlsx` | `^0.18` | ~350KB | Parse .xls/.xlsx/.ods spreadsheets to text |

Total addition: ~600KB. Lambda has 512MB memory — well within limits.

`mammoth` (already installed) handles both `.doc` and `.docx`.

---

## New Files

| File | Description |
|------|-------------|
| `amplify/functions/documentAnalysis/eduExtraction.ts` | SCORM, IMS CC, QTI extractors |
| `amplify/functions/documentAnalysis/officeExtraction.ts` | XLS/XLSX, PPT/PPTX, ODF extractors |
| `amplify/functions/documentAnalysis/epubExtraction.ts` | EPUB extractor |
| `amplify/functions/documentAnalysis/giftParser.ts` | GIFT format parser |
| `amplify/functions/documentAnalysis/zipDetector.ts` | ZIP-based format detection |
| `amplify/functions/documentAnalysis/formatRegistry.ts` | Extension→extractor routing table |
| `test/unit/eduExtraction.test.ts` | Unit tests for edu extractors |
| `test/unit/giftParser.test.ts` | Unit tests for GIFT parser |
| `test/unit/officeExtraction.test.ts` | Unit tests for office format extractors |
| `test/unit/zipDetector.test.ts` | Unit tests for ZIP detection |
| `test/unit/fileUploadUtils.test.ts` | MIME detection tests |

---

## Edited Files

| File | Changes |
|------|---------|
| `amplify/data/resource.ts` | Add `sourceFormat: a.string()` to Document model |
| `amplify/package.json` | Add `jszip`, `fast-xml-parser`, `html-to-text`, `xlsx` |
| `amplify/functions/documentAnalysis/handler.ts` | Replace extension `if/else` chain with `formatRegistry` dispatch; set `sourceFormat` on Document |
| `amplify/functions/documentAnalysis/textExtraction.ts` | Export `getS3Object` for reuse by other extractors |
| `src/components/Editor3/plugins/DragDropPastePlugin.js` | Add edu + ODF MIME types to `ACCEPTABLE_FILE_TYPES`; remove `.exe` type |
| `src/components/Editor3/components/FileManager2.jsx` | Add `.imscc,.epub,.gift,.odt,.ods,.odp` to `accept=` attribute |
| `src/utils/fileUploadUtils.jsx` | Add edu + ODF types to `isAnalyzableDocument()`; add `detectMimeType()` for filename-based correction; add `.zip` analysis-gate logic (always create Document for .zip, let Lambda detect) |

---

## Implementation Order

```
Phase 1: Fix Broken Types (no new dependencies except xlsx)
  1a. Schema: add sourceFormat to Document
  1b. Lambda: add .md, .doc branches (trivial — reuse existing libs)
  1c. Lambda deps: add xlsx
  1d. Lambda: add .xls/.xlsx extraction
  1e. Lambda: add .ppt/.pptx extraction (jszip already needed for Phase 2)
  1f. Lambda: add .odt/.ods/.odp extraction
  1g. Frontend: add ODF types to all 3 gates
  1h. Frontend: remove .exe from ACCEPTABLE_FILE_TYPES
  1i. Tests for all Phase 1 extractors

Phase 2: Educational Formats
  2a. Lambda deps: add jszip, fast-xml-parser, html-to-text
  2b. Create zipDetector.ts
  2c. Create eduExtraction.ts (SCORM + IMS CC + QTI)
  2d. Create epubExtraction.ts
  2e. Create giftParser.ts
  2f. Create formatRegistry.ts — unified routing replacing if/else chain
  2g. Update handler.ts to use formatRegistry
  2h. Frontend: add edu MIME types + file extensions + detectMimeType()
  2i. Frontend: .zip analysis gate logic
  2j. Tests for all Phase 2 extractors

Phase 3: Enhanced Analysis
  3a. Direct content extraction for QTI → questionsJSON
  3b. Direct content extraction for GIFT → questionsJSON
  3c. CSV/XLS smart detection (vocab-shaped vs quiz-shaped)
  3d. Enhanced GPT-4o system prompt for edu content
  3e. Merge strategy: direct content + GPT enhancement
```

Phase 1 fixes existing broken promises. Phase 2 adds educational formats. Phase 3 adds intelligence. Each phase is independently deployable.

---

## Acceptance Criteria

- [ ] Every file type listed in `ACCEPTABLE_FILE_TYPES` that is also in `isAnalyzableDocument()` successfully extracts text in the Lambda
- [ ] SCORM 1.2 and 2004 packages are detected, extracted, and produce ParsedContent
- [ ] IMS Common Cartridge packages extract embedded QTI questions directly
- [ ] QTI XML files produce questionsJSON with prompt, answer, options, and type
- [ ] EPUB files extract chapter text in reading order
- [ ] GIFT files produce questionsJSON with all 7 question types
- [ ] ZIP files are auto-detected as SCORM/IMS CC/EPUB/QTI or rejected as non-analyzable
- [ ] Document.sourceFormat is set for every analyzed document
- [ ] `.exe` is no longer accepted for upload
- [ ] Embeddings generate successfully for all new format types (no changes to embedding Lambda needed)
- [ ] All extractors have unit tests with fixture data
