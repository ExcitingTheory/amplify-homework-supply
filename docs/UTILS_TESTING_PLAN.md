# Utility Functions Testing Plan

## Priority Matrix

Tests prioritized by **Impact × Risk × Complexity**:
- **Impact**: How critical is this utility to core functionality?
- **Risk**: How likely is it to break or cause bugs?
- **Complexity**: How complex is the logic?

### Priority 1: Critical - Security & Privacy (Implement First)

| Utility | Impact | Risk | Complexity | Total | Tests | Status |
|---------|--------|------|------------|-------|-------|--------|
| **piiDetection.js** | HIGH | HIGH | MEDIUM | **90** | ✅ Already done | ✅ Complete |
| **moderateContent.js** | HIGH | HIGH | MEDIUM | **85** | 8 tests needed | ⬜ Pending |
| **userSubmissionStorage.js** | HIGH | MEDIUM | MEDIUM | **75** | 6 tests needed | ⬜ Pending |

**Why First**: FERPA compliance, content safety, student privacy - non-negotiable legal requirements.

### Priority 2: Core Infrastructure (Implement Second)

| Utility | Impact | Risk | Complexity | Total | Tests | Status |
|---------|--------|------|------------|-------|-------|--------|
| **fileUploadUtils.js** | HIGH | HIGH | HIGH | **85** | 12 tests needed | ⬜ Pending |
| **getCachedUrl.js** | HIGH | MEDIUM | LOW | **70** | 5 tests needed | ⬜ Pending |
| **vectorStoreDB.js** | HIGH | MEDIUM | MEDIUM | **70** | 10 tests needed | ⬜ Pending |
| **streamingRequest.js** | HIGH | HIGH | MEDIUM | **75** | 7 tests needed | ⬜ Pending |

**Why Second**: Used everywhere, performance-critical, S3/storage operations.

### Priority 3: AI & Search (Implement Third)

| Utility | Impact | Risk | Complexity | Total | Tests | Status |
|---------|--------|------|------------|-------|-------|--------|
| **embeddingGenerator.js** | MEDIUM | MEDIUM | HIGH | **65** | 8 tests needed | ⬜ Pending |
| **chatTools.js** | MEDIUM | HIGH | HIGH | **70** | 15 tests needed | ⬜ Pending |
| **headlessEditorExtractor.js** | MEDIUM | MEDIUM | MEDIUM | **60** | 6 tests needed | ⬜ Pending |

**Why Third**: AI features critical for value prop, search impacts user experience.

### Priority 4: Data Management (Implement Fourth)

| Utility | Impact | Risk | Complexity | Total | Tests | Status |
|---------|--------|------|------------|-------|-------|--------|
| **vocabularyImportUtils.js** | MEDIUM | MEDIUM | MEDIUM | **60** | 9 tests needed | ⬜ Pending |
| **tabStateUtils.js** | LOW | LOW | MEDIUM | **40** | 7 tests needed | ⬜ Pending |

### Priority 5: Simple Utilities (Implement Last)

| Utility | Impact | Risk | Complexity | Total | Tests | Status |
|---------|--------|------|------------|-------|-------|--------|
| **calculateWaveformData.js** | LOW | LOW | MEDIUM | **35** | ✅ 7 tests complete | ✅ Complete |
| **hexToRgb.js** | LOW | LOW | LOW | **20** | ✅ 10 tests complete | ✅ Complete |
| **previewUtils.js** | LOW | LOW | MEDIUM | **35** | ✅ 7 tests complete | ✅ Complete |

---

## Implementation Order

### Phase 1: Security & Privacy (Week 1) ✅ COMPLETE
1. ✅ piiDetection.js - 30+ tests
2. ✅ moderateContent.js - 8 tests
3. ✅ userSubmissionStorage.js - 6 tests

### Phase 2: Core Infrastructure (Week 2) ✅ COMPLETE
4. ✅ fileUploadUtils.js - 12 tests (most complex)
5. ✅ getCachedUrl.js - 5 tests
6. ✅ vectorStoreDB.js - 10 tests
7. ✅ streamingRequest.js - 7 tests

### Phase 3: AI & Search (Week 3)
8. ⬜ **embeddingGenerator.js** - 8 tests needed
9. ⬜ **headlessEditorExtractor.js** - 6 tests needed
10. ⬜ **chatTools.js** - 15 tests needed (most complex)

### Phase 4: Data Management (Week 4) ✅ COMPLETE
11. ✅ **vocabularyImportUtils.js** - 9 tests (import workflow, duplicate handling, progress tracking)
12. ✅ **tabStateUtils.js** - 7 tests (localStorage + URL syncing, encoding/decoding)

### Phase 5: Simple Utilities (Week 5) ✅ COMPLETE
13. ✅ **calculateWaveformData.js** - 7 tests (input handling, downsampling, normalization, errors)
14. ✅ **hexToRgb.js** - 10 tests (hex parsing, RGB conversion, edge cases)
15. ✅ **previewUtils.js** - 7 tests (URL fetching, srcSet generation, preview detection)

---

## Detailed Test Specs

### 1. moderateContent.js (8 tests)

**Test Coverage:**
- ✅ Extract text from strings
- ✅ Extract text from Lexical JSON
- ✅ Extract text from Grade data
- ✅ Handle empty/null content
- ✅ Call GraphQL moderation mutation
- ✅ Build moderation fields correctly
- ✅ Return non-flagged result on API error
- ✅ Get human-readable status messages

**Mocking Strategy:**
- Mock `generateClient().graphql()` to return moderation results
- Test with various content types (string, Lexical, Grade JSON)
- Verify error resilience (don't block saves on failure)

---

### 2. userSubmissionStorage.js (6 tests)

**Test Coverage:**
- ✅ Upload student submission to private storage
- ✅ Parse submission key correctly
- ✅ Build submission key from components
- ✅ Delete student submission
- ✅ Get grade/question submission prefixes
- ✅ Validate submission ownership

**Mocking Strategy:**
- Mock `uploadData()` and `remove()` from aws-amplify/storage
- Mock `getCurrentUser()` for ownership checks
- Test S3 key format validation

---

### 3. fileUploadUtils.js (12 tests)

**Test Coverage:**
- ✅ Upload image file to S3
- ✅ Upload audio file with waveform
- ✅ Upload PDF and create Document record
- ✅ Trigger PDF analysis
- ✅ Cancel PDF analysis
- ✅ Handle upload progress callbacks
- ✅ Link document to unit via UnitDocument
- ✅ Trigger embedding generation
- ✅ Handle upload errors gracefully
- ✅ Wait for document sync
- ✅ Validate file types
- ✅ Test combined uploadAndAnalyzePDF

**Mocking Strategy:**
- Mock `uploadData()`, `DataStore.save()`, `client.graphql()`
- Mock `calculateWaveformData()` for audio
- Test various file types (image, audio, PDF)

---

### 4. getCachedUrl.js (5 tests)

**Test Coverage:**
- ✅ Return data URLs directly
- ✅ Return HTTP(S) URLs directly
- ✅ Get cached URL from memory
- ✅ Get cached URL from localStorage  
- ✅ Fetch and cache new S3 URL

**Mocking Strategy:**
- Mock `Cache.getItem()` and `Cache.setItem()`
- Mock `getUrl()` from aws-amplify/storage
- Test cache TTL expiration

---

### 5. vectorStoreDB.js (10 tests)

**Test Coverage:**
- ✅ Save embeddings to IndexedDB
- ✅ Load embeddings by document ID
- ✅ Load all embeddings
- ✅ Delete embeddings for document
- ✅ Clear all embeddings
- ✅ Get database statistics
- ✅ Check embedding timestamp
- ✅ Load embeddings from S3 (JSON)
- ✅ Load embeddings from S3 (Brotli)
- ✅ Handle S3 download errors

**Mocking Strategy:**
- Mock `openDB` from 'idb' library
- Mock `downloadData()` for S3 operations
- Test both compressed and uncompressed formats

---

### 6. streamingRequest.js (7 tests)

**Test Coverage:**
- ✅ Create streaming request with auth
- ✅ Handle malformed chunks gracefully
- ✅ Retry on 401 with token refresh
- ✅ Handle non-200 responses
- ✅ Parse SSE format correctly
- ✅ Parse AI SDK format correctly
- ✅ Create AI SDK fetch function

**Mocking Strategy:**
- Mock `fetchAuthSession()` and `post()`
- Create mock ReadableStream with test chunks
- Test error recovery and retries

---

### 7. embeddingGenerator.js (8 tests)

**Test Coverage:**
- ✅ Generate embedding with caching
- ✅ Return cached embedding on duplicate query
- ✅ Clear embedding cache
- ✅ Generate unit embedding from sections
- ✅ Generate section embedding
- ✅ Generate word embedding
- ✅ Generate question embedding
- ✅ Get or generate unit embedding with staleness check

**Mocking Strategy:**
- Mock `client.graphql()` for embedding mutation
- Mock localStorage for cache
- Mock DataStore for model queries/saves

---

### 8. headlessEditorExtractor.js (6 tests)

**Test Coverage:**
- ✅ Extract plain text from Lexical JSON
- ✅ Extract HTML from Lexical JSON
- ✅ Extract structured content for embedding
- ✅ Extract from multiple editor states
- ✅ Extract with section markers
- ✅ Handle empty/invalid content

**Mocking Strategy:**
- Mock `createHeadlessEditor()` from @lexical/headless
- Test with various Lexical JSON structures
- Verify text cleaning and formatting

---

### 9. chatTools.js (15 tests)

**Test Coverage:**
- ✅ Execute search_content tool
- ✅ Execute create_section tool
- ✅ Execute create_unit tool
- ✅ Execute create_assignment tool
- ✅ Execute add_timer_to_unit tool
- ✅ Execute create_vocabulary_word tool
- ✅ Execute create_question tool
- ✅ Execute list_sections tool
- ✅ Execute list_units tool
- ✅ Execute get_unit_details tool
- ✅ Execute update_unit tool
- ✅ Execute delete_assignment tool
- ✅ Execute generate_unit_content tool
- ✅ Handle unknown tool names
- ✅ Set vector store search function

**Mocking Strategy:**
- Mock DataStore operations
- Mock embedding generation
- Mock vector store search
- Test tool parameter validation

---

### 10. vocabularyImportUtils.js (9 tests)

**Test Coverage:**
- ✅ Find existing word in dictionary
- ✅ Create new word
- ✅ Link word to unit
- ✅ Import vocabulary from ParsedContent
- ✅ Skip duplicate words
- ✅ Handle import errors gracefully
- ✅ Get vocabulary import status
- ✅ Update vocabulary item before import
- ✅ Progress callback during import

**Mocking Strategy:**
- Mock DataStore queries and saves
- Test with sample ParsedContent JSON
- Verify duplicate detection logic

---

### 11. tabStateUtils.js (7 tests)

**Test Coverage:**
- ✅ Load tab state from localStorage
- ✅ Save tab state to localStorage
- ✅ Parse tab state from URL
- ✅ Build URL query from tab state
- ✅ Merge URL and localStorage state
- ✅ Clear tab state
- ✅ Encode/decode sidebar state with tab names

**Mocking Strategy:**
- Mock localStorage
- Test URL parsing with various formats
- Verify state merging priority (URL > localStorage)

---

### 12. calculateWaveformData.js (7 tests)

**Test Coverage:**
- ✅ Calculate waveform from audio Blob
- ✅ Calculate waveform from ArrayBuffer
- ✅ Downsample to specified sample count
- ✅ Normalize amplitude values to 0-1
- ✅ Handle Web Audio API errors
- ✅ Clean up AudioContext properly
- ✅ Process stereo audio (use first channel)

**Mocking Strategy:**
- Mock Web Audio API (AudioContext, decodeAudioData)
- Create mock audio buffers with test patterns
- Verify output format and normalization

---

### 13. hexToRgb.js (10 tests)

**Test Coverage:**
- ✅ Convert standard 6-digit hex to RGB
- ✅ Handle lowercase hex values
- ✅ Handle mixed case hex values
- ✅ Return correct RGB object structure
- ✅ Handle edge case hex values
- ✅ Convert hex with leading hash symbol
- ✅ Handle common CSS colors
- ✅ Parse each color channel independently
- ✅ Handle hex values with all same digits
- ✅ Test various hex color conversions

**Mocking Strategy:**
- Simple unit tests, no mocks needed
- Test various hex formats and color values

---

### 14. previewUtils.js (7 tests)

**Test Coverage:**
- ✅ Get preview URL for specific size (svg/thumbnail/small/medium/large/original)
- ✅ Get responsive srcSet with multiple sizes
- ✅ Build responsive image props for <picture> element
- ✅ Check if item has any preview
- ✅ Get best available preview with vector preference
- ✅ Handle AVIF format srcSet
- ✅ Handle S3 access levels (public/protected/private)

**Mocking Strategy:**
- Mock `getUrl()` from aws-amplify/storage
- Test with various preview field combinations
- Verify WebP/AVIF format handling and fallbacks

---

## Testing Infrastructure

### Vitest Configuration

Already configured in `vitest.config.ts`:
- ✅ Global test environment
- ✅ Setup file (`test/setup.ts`)
- ✅ Coverage reporting
- ✅ Module aliases

### Mock Strategy

**Use Existing Storybook Mocks** (`.storybook/__mocks__/`):
- ✅ `aws-amplify-api.js` - GraphQL client
- ✅ `aws-amplify-auth.js` - Authentication
- ✅ `aws-amplify-storage.js` - S3 operations
- ✅ `aws-amplify-datastore.js` - DataStore
- ✅ `aws-amplify-utils.js` - Cache

**Import mocks in test files:**
```javascript
import { vi } from 'vitest';

// Mock Amplify modules before importing utility
vi.mock('aws-amplify/api', () => import('@storybook/__mocks__/aws-amplify-api.js'));
vi.mock('aws-amplify/storage', () => import('@storybook/__mocks__/aws-amplify-storage.js'));
```

### Test File Structure

```
src/utils/__tests__/
├── piiDetection.test.js ✅
├── moderateContent.test.js
├── userSubmissionStorage.test.js
├── fileUploadUtils.test.js
├── getCachedUrl.test.js
├── vectorStoreDB.test.js
├── streamingRequest.test.js
├── embeddingGenerator.test.js
├── headlessEditorExtractor.test.js
├── chatTools.test.js
├── vocabularyImportUtils.test.js
├── tabStateUtils.test.js
├── calculateWaveformData.test.js
├── hexToRgb.test.js
└── previewUtils.test.js
```

---

## Running Tests

```bash
# Run all utility tests
npm test src/utils/__tests__

# Run specific test file
npm test moderateContent.test.js

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

---

## Success Criteria

- ✅ 80%+ code coverage for each utility
- ✅ All edge cases tested
- ✅ Error handling verified
- ✅ Mocks properly isolated
- ✅ Fast test execution (<100ms per test)
- ✅ CI/CD integration ready
