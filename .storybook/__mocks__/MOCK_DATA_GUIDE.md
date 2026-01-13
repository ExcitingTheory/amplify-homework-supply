## Mock Data with Base64 Media for Storybook

Comprehensive mock data files for testing FileManager, Dictionary Editor, Question Editor, and Semantic Search in isolated Storybook environments without S3 dependencies.

**✨ New: All Words and Questions now include realistic embeddings for semantic search testing!**

## 📁 Files Created

### Core Mock Data Files

1. **`mockMediaData.js`** - Base64-encoded media samples
   - Images (PNG, JPEG, SVG)
   - Audio (MP3, WAV)
   - Video (MP4)
   - Documents (PDF)
   - Waveform data generators

2. **`mockFileData.js`** - File records with embedded base64 URIs
   - 15+ complete File records across all media types
   - Audio files with waveform data
   - Images with dimensions
   - Videos with duration
   - PDFs with page counts
   - **NEW**: Automatic embeddings generated from descriptions

3. **`mockWordData.js`** - Dictionary/vocabulary records
   - 20+ Word records across multiple languages
   - Japanese, Spanish, French vocabulary
   - Biology, Philosophy, Earth Science terms
   - Linked to audio and image files
   - **NEW**: 1536-dimensional embeddings for semantic search

4. **`mockQuestionData.js`** - Question/quiz records
   - 25+ Question records with various types
   - Multiple choice, short answer, drawing, translation
   - Linked to audio, image, and video files
   - Hints and explanations included
   - **NEW**: 1536-dimensional embeddings for semantic search

5. **`mockEmbeddingUtils.js`** - Embedding generation utilities
   - Deterministic mock embedding generation
   - Mimics OpenAI text-embedding-3-small (1536 dimensions)
   - Semantic similarity calculations
   - Cosine similarity functions
   - Similar item search utilities

6. **`mockSemanticSearchExample.js`** - Semantic search examples
   - Ready-to-use search functions
   - Word and Question search
   - Similar item finder
   - Storybook integration helpers
   - Example usage demonstrations

7. **`chatMockData.js`** - Chat SSE stream mocks
   - Vercel AI SDK Stream Protocol compatible
   - Text streaming (token-by-token)
   - Tool/function calling examples
   - Multi-tool sequences
   - Error handling and cancellation
   - See [CHAT_MOCK_GUIDE.md](./CHAT_MOCK_GUIDE.md) for details

## 🚀 Quick Start

### Import and Use in Stories

```javascript
// In your .stories.jsx file
import { MOCK_FILES_ALL } from '../../.storybook/__mocks__/mockFileData';
import { MOCK_WORDS_ALL } from '../../.storybook/__mocks__/mockWordData';
import { MOCK_QUESTIONS_ALL } from '../../.storybook/__mocks__/mockQuestionData';
import { seedMockFiles, seedMockWords, seedMockQuestions } from '../../.storybook/__mocks__/aws-amplify-datastore';

export const FileManagerStory = {
  loaders: [
    async () => {
      // Seed all mock files
      seedMockFiles(MOCK_FILES_ALL);
    }
  ],
  render: () => <FileManager />,
};
```

### Using Specific Media Types

```javascript
import MOCK_FILES from '../../.storybook/__mocks__/mockFileData';

// Audio files only
seedMockFiles(MOCK_FILES.BY_TYPE.AUDIO);

// Images and videos
seedMockFiles([
  ...MOCK_FILES.BY_TYPE.IMAGE,
  ...MOCK_FILES.BY_TYPE.VIDEO
]);

// Specific file
seedMockFiles([MOCK_FILES.AUDIO.JAPANESE]);
```

### Dictionary Editor Example

```javascript
import MOCK_WORDS from '../../.storybook/__mocks__/mockWordData';

export const DictionaryEditorStory = {
  loaders: [
    async () => {
      // Seed Japanese vocabulary
      seedMockWords(MOCK_WORDS.BY_LANGUAGE.JAPANESE);
      
      // Also seed related audio files
      seedMockFiles(MOCK_FILES.BY_TYPE.AUDIO);
    }
  ],
  render: () => <DictionaryEditor />,
};
```

### Question Editor Example

```javascript
import MOCK_QUESTIONS from '../../.storybook/__mocks__/mockQuestionData';

export const QuestionEditorStory = {
  loaders: [
    async () => {
      // Seed biology questions
      seedMockQuestions(MOCK_QUESTIONS.BY_SUBJECT.BIOLOGY);
      
      // Seed related media
      seedMockFiles([
        ...MOCK_FILES.BY_TYPE.IMAGE,
        ...MOCK_FILES.BY_TYPE.AUDIO,
      ]);
    }
  ],
  render: () => <QuestionEditor />,
};
```

### Semantic Search Example

```javascript
export const SemanticSearchStory = {
  loaders: [
    async () => {
      // Seed everything for comprehensive search testing
      seedMockFiles(MOCK_FILES.ALL);
      seedMockWords(MOCK_WORDS.ALL);
      seedMockQuestions(MOCK_QUESTIONS.ALL);
    }
  ],
  render: () => <SemanticSearch />,
};
```

## 📚 Available Collections

### Files by Type

```javascript
import MOCK_FILES from '../../.storybook/__mocks__/mockFileData';

MOCK_FILES.BY_TYPE.AUDIO    // 4 audio files
MOCK_FILES.BY_TYPE.IMAGE    // 4 image files
MOCK_FILES.BY_TYPE.VIDEO    // 2 video files
MOCK_FILES.BY_TYPE.PDF      // 5 PDF files
MOCK_FILES.ALL              // All 15 files
```

### Words by Language/Subject

```javascript
import MOCK_WORDS from '../../.storybook/__mocks__/mockWordData';

// By Language
MOCK_WORDS.BY_LANGUAGE.JAPANESE  // 5 Japanese words
MOCK_WORDS.BY_LANGUAGE.SPANISH   // 5 Spanish words
MOCK_WORDS.BY_LANGUAGE.FRENCH    // 4 French words

// By Subject
MOCK_WORDS.BY_SUBJECT.BIOLOGY     // 5 biology terms
MOCK_WORDS.BY_SUBJECT.PHILOSOPHY  // 3 philosophy terms
MOCK_WORDS.BY_SUBJECT.SCIENCE     // 3 science terms

MOCK_WORDS.ALL                    // All 25 words
```

### Questions by Language/Subject/Type

```javascript
import MOCK_QUESTIONS from '../../.storybook/__mocks__/mockQuestionData';

// By Language
MOCK_QUESTIONS.BY_LANGUAGE.JAPANESE  // 3 Japanese questions
MOCK_QUESTIONS.BY_LANGUAGE.SPANISH   // 3 Spanish questions
MOCK_QUESTIONS.BY_LANGUAGE.FRENCH    // 2 French questions

// By Subject
MOCK_QUESTIONS.BY_SUBJECT.BIOLOGY     // 8 biology questions
MOCK_QUESTIONS.BY_SUBJECT.PHILOSOPHY  // 3 philosophy questions
MOCK_QUESTIONS.BY_SUBJECT.SCIENCE     // 4 science questions

// By Type
MOCK_QUESTIONS.BY_TYPE.MULTIPLE_CHOICE  // 2 MC questions
MOCK_QUESTIONS.BY_TYPE.DRAWING          // 2 drawing questions

MOCK_QUESTIONS.ALL                      // All 25 questions
```

## 🔗 Relationships Between Mock Data

Files, Words, and Questions are linked via ID references:

```javascript
// Word with audio file
MOCK_WORDS.JAPANESE.KONNICHIWA
  audioFile: 'file-audio-japanese-1'  // → MOCK_FILES.AUDIO.JAPANESE

// Question with image file
MOCK_QUESTIONS.BIOLOGY.CELL
  imageFile: 'file-image-diagram-1'   // → MOCK_FILES.IMAGE.DIAGRAM

// Word with audio and image
MOCK_WORDS.BIOLOGY.PHOTOSYNTHESIS
  audioFile: 'file-audio-listening-1'
  imageFile: 'file-image-diagram-1'
```

When seeding data, make sure to include related files:

```javascript
// ✅ Correct - includes related files
seedMockWords([MOCK_WORDS.JAPANESE.KONNICHIWA]);
seedMockFiles([MOCK_FILES.AUDIO.JAPANESE]); // Audio file it references

// ❌ Incomplete - word references missing audio file
seedMockWords([MOCK_WORDS.JAPANESE.KONNICHIWA]);
// Audio file won't play!
```

## 🎨 Creating Custom Mock Data

### Custom File

```javascript
import { createMockFile } from '../../.storybook/__mocks__/mockFileData';
import { MOCK_MEDIA } from '../../.storybook/__mocks__/mockMediaData';

const customAudioFile = createMockFile({
  id: 'custom-audio-1',
  name: 'custom-pronunciation.mp3',
  path: MOCK_MEDIA.AUDIO_MP3, // Use existing base64 data
  mimeType: 'audio/mpeg',
  size: 64000,
  description: 'Custom pronunciation guide',
  waveformData: JSON.stringify(generateMockWaveformData(500)),
  duration: 3.0,
});

seedMockFiles([customAudioFile]);
```

### Custom Word

```javascript
import { createMockWord } from '../../.storybook/__mocks__/mockWordData';

const customWord = createMockWord({
  id: 'custom-word-1',
  word: 'おはよう',
  phonetic: 'ohayou',
  definition: 'Good morning',
  audioFile: 'custom-audio-1', // Reference custom file
  tags: ['greeting', 'morning'],
  difficulty: 'easy',
  partOfSpeech: 'interjection',
});

seedMockWords([customWord]);
```

### Custom Question

```javascript
import { createMockQuestion } from '../../.storybook/__mocks__/mockQuestionData';

const customQuestion = createMockQuestion({
  id: 'custom-q-1',
  prompt: 'How do you say "Good morning" in Japanese?',
  answer: 'おはよう (Ohayou)',
  audioFile: 'custom-audio-1',
  questionType: 'short-answer',
  difficulty: 'easy',
  tags: ['japanese', 'greeting'],
  hints: ['Used in the morning'],
});

seedMockQuestions([customQuestion]);
```

## 📊 Data Structure Reference

### File Record

```typescript
{
  id: string;
  name: string;
  path: string;              // Base64 data URI
  mimeType: string;          // 'audio/mpeg', 'image/png', etc.
  size: number;              // bytes
  description?: string;
  waveformData?: string;     // JSON array (audio files)
  duration?: number;         // seconds (audio/video)
  width?: number;            // pixels (images/video)
  height?: number;           // pixels (images/video)
  pages?: number;            // count (PDFs)
  owner: string;
  identityId: string;
  _version: number;
}
```

### Word Record

```typescript
{
  id: string;
  word: string;              // The vocabulary word
  phonetic?: string;         // Pronunciation guide
  definition: string;
  audioFile?: string;        // File ID reference
  imageFile?: string;        // File ID reference
  example?: string;
  notes?: string;
  tags: string;              // JSON array
  difficulty: 'easy' | 'medium' | 'hard';
  partOfSpeech?: string;
  owner: string;
  _version: number;
}
```

### Question Record

```typescript
{
  id: string;
  prompt: string;            // The question text
  answer: string;
  audioFile?: string;        // File ID reference
  imageFile?: string;        // File ID reference
  questionType: string;      // 'short-answer', 'multiple-choice', etc.
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string;              // JSON array
  hints: string;             // JSON array
  explanation?: string;
  owner: string;
  _version: number;
}
```

## 🎯 Common Use Cases

### Testing File Upload Preview

```javascript
import MOCK_FILES from '../../.storybook/__mocks__/mockFileData';

// Test image preview
seedMockFiles([MOCK_FILES.IMAGE.KANJI]);

// Test audio player
seedMockFiles([MOCK_FILES.AUDIO.JAPANESE]);

// Test PDF viewer
seedMockFiles([MOCK_FILES.PDF.TEXTBOOK]);

// Test video player
seedMockFiles([MOCK_FILES.VIDEO.DEMO]);
```

### Testing Vocabulary Import

```javascript
import MOCK_WORDS from '../../.storybook/__mocks__/mockWordData';

// Spanish verb conjugation lesson
seedMockWords(MOCK_WORDS.BY_LANGUAGE.SPANISH);
seedMockFiles(MOCK_FILES.BY_TYPE.AUDIO);
```

### Testing Question Bank

```javascript
import MOCK_QUESTIONS from '../../.storybook/__mocks__/mockQuestionData';

// Biology quiz
seedMockQuestions(MOCK_QUESTIONS.BY_SUBJECT.BIOLOGY);
seedMockFiles([
  ...MOCK_FILES.BY_TYPE.IMAGE,
  ...MOCK_FILES.BY_TYPE.AUDIO,
]);
```

### Testing Search Functionality

```javascript
// Comprehensive search test - all content types
seedMockFiles(MOCK_FILES.ALL);
seedMockWords(MOCK_WORDS.ALL);
seedMockQuestions(MOCK_QUESTIONS.ALL);

// Subject-specific search (Biology)
seedMockWords(MOCK_WORDS.BY_SUBJECT.BIOLOGY);
seedMockQuestions(MOCK_QUESTIONS.BY_SUBJECT.BIOLOGY);
seedMockFiles([
  MOCK_FILES.IMAGE.DIAGRAM,
  MOCK_FILES.AUDIO.LISTENING,
]);
```

## 🔧 Troubleshooting

### Media Not Loading

**Problem**: Audio/video/image doesn't display  
**Solution**: Verify the file is seeded and the ID reference is correct

```javascript
// Check that both word and its audio file are seeded
seedMockWords([MOCK_WORDS.JAPANESE.KONNICHIWA]);
seedMockFiles([MOCK_FILES.AUDIO.JAPANESE]); // ← Don't forget this!
```

### Waveform Not Displaying

**Problem**: Audio file plays but no waveform  
**Solution**: Ensure `waveformData` is set

```javascript
// All audio mock files include waveformData
MOCK_FILES.AUDIO.JAPANESE.waveformData // ✓ JSON string array
```

### File Path Not Working

**Problem**: `getCachedUrl` errors or file doesn't load  
**Solution**: Mock files use base64 data URIs that work directly

```javascript
// Path is already a data URI - no S3 call needed
MOCK_FILES.AUDIO.JAPANESE.path  // "data:audio/mpeg;base64,..."
```

## 📝 Best Practices

1. **Seed Related Data Together**
   ```javascript
   // ✅ Good - includes all dependencies
   seedMockWords(MOCK_WORDS.BY_LANGUAGE.JAPANESE);
   seedMockFiles(MOCK_FILES.BY_TYPE.AUDIO);
   ```

2. **Use Collections for Realistic Tests**
   ```javascript
   // ✅ Better - realistic number of items
   seedMockWords(MOCK_WORDS.BY_SUBJECT.BIOLOGY); // 5 words
   
   // ❌ Avoid - too minimal
   seedMockWords([MOCK_WORDS.BIOLOGY.CELL]); // Only 1 word
   ```

3. **Match Language/Subject Across Types**
   ```javascript
   // ✅ Coherent story - all Japanese content
   seedMockWords(MOCK_WORDS.BY_LANGUAGE.JAPANESE);
   seedMockQuestions(MOCK_QUESTIONS.BY_LANGUAGE.JAPANESE);
   seedMockFiles([
     MOCK_FILES.AUDIO.JAPANESE,
     MOCK_FILES.IMAGE.KANJI,
   ]);
   ```

4. **Test Edge Cases**
   ```javascript
   // Test with minimal data
   seedMockWords([MOCK_WORDS.JAPANESE.KONNICHIWA]);
   
   // Test with maximum variety
   seedMockWords(MOCK_WORDS.ALL);
   seedMockFiles(MOCK_FILES.ALL);
   seedMockQuestions(MOCK_QUESTIONS.ALL);
   ```

## 🔍 Finding Specific Mock Data

All mock data exports follow consistent naming:

```javascript
// Pattern: MOCK_{TYPE}_{LANGUAGE/SUBJECT}_{SPECIFIC}

// Examples:
MOCK_FILES.AUDIO.JAPANESE
MOCK_WORDS.SPANISH.HABLAR
MOCK_QUESTIONS.BIOLOGY.PHOTOSYNTHESIS
```

Collections use:
```javascript
MOCK_{TYPE}_ALL          // All items
MOCK_{TYPE}S_{CATEGORY}  // Category group (plural)
```

## 🎓 Examples by Feature

### FileManager Story

See complete example in `.storybook/__mocks__/MOCK_DATA_GUIDE.md`

### DictionaryEditor Story

See complete example in `.storybook/__mocks__/MOCK_DATA_GUIDE.md`

### QuestionEditor Story

See complete example in `.storybook/__mocks__/MOCK_DATA_GUIDE.md`

### SemanticSearch Story

See complete example in `.storybook/__mocks__/MOCK_DATA_GUIDE.md`

---

## � Semantic Search with Embeddings

All Words and Questions now include **realistic 1536-dimensional embeddings** that enable semantic search testing without requiring OpenAI API calls.

### How Embeddings Work

The mock embeddings are:
- **Deterministic**: Same text always generates the same embedding
- **Semantically meaningful**: Similar content generates similar embeddings
- **Language-aware**: Japanese, Spanish, French content clusters separately
- **Subject-aware**: Biology, Philosophy, Science topics cluster together
- **Normalized**: Unit vectors like real OpenAI embeddings

### Using Semantic Search

```javascript
import { searchWords, searchQuestions, searchAll } from '../../.storybook/__mocks__/mockSemanticSearchExample';

// Search for vocabulary words
const results = searchWords('water', 5);
// Returns: [{ item: Word, similarity: 0.85 }, ...]

// Search for questions
const questionResults = searchQuestions('photosynthesis biology', 5);

// Search everything
const allResults = searchAll('philosophy ancient greece', 10);
// Returns: { all: [...], words: [...], questions: [...] }
```

### Finding Similar Items

```javascript
import { findSimilarWords, findSimilarQuestions } from '../../.storybook/__mocks__/mockSemanticSearchExample';

// Find words similar to a specific word
const waterWord = MOCK_WORDS.JAPANESE.find(w => w.word === '水');
const similar = findSimilarWords(waterWord, 5);
// Returns words related to water, liquids, science

// Find similar questions
const bioQuestion = MOCK_QUESTIONS.BIOLOGY[0];
const similarQuestions = findSimilarQuestions(bioQuestion, 5);
```

### Custom Embedding Generation

```javascript
import { generateMockEmbedding, cosineSimilarity } from '../../.storybook/__mocks__/mockEmbeddingUtils';

// Generate embedding for custom text
const embedding = generateMockEmbedding('Hello, how are you?');
// Returns: Float32Array(1536) normalized vector

// Calculate similarity
const embedding1 = generateMockEmbedding('water is H2O');
const embedding2 = generateMockEmbedding('agua es H2O');
const similarity = cosineSimilarity(embedding1, embedding2);
// Returns: 0.72 (high similarity despite different languages)
```

### Storybook Integration

```javascript
import { mockDataStoreSemanticSearch } from '../../.storybook/__mocks__/mockSemanticSearchExample';

export const SemanticSearchStory = {
  loaders: [
    async () => {
      seedMockWords(MOCK_WORDS.ALL);
      seedMockQuestions(MOCK_QUESTIONS.ALL);
    }
  ],
  decorators: [
    (Story) => {
      // Mock DataStore search with semantic search
      const mockObserveQuery = (model, criteria) => {
        if (criteria?.searchQuery) {
          const modelName = model.name; // 'Word' or 'Question'
          return mockDataStoreSemanticSearch(modelName, criteria.searchQuery, 10);
        }
        // ... regular mock behavior
      };
      
      return <Story />;
    }
  ],
  render: () => <SemanticSearch />
};
```

### Example Queries

Try these example searches to see semantic similarity in action:

**Water-related vocabulary** (finds words in multiple languages):
```javascript
searchWords('water liquid H2O')
// Finds: 水 (Japanese), agua (Spanish), eau (French)
```

**Biology questions**:
```javascript
searchQuestions('what is photosynthesis')
// Finds: Questions about plants, energy, cells
```

**Philosophy concepts**:
```javascript
searchWords('ancient greek philosopher')
// Finds: Thales, Anaximander, arche, apeiron
```

**Multi-language greetings**:
```javascript
searchWords('hello greeting welcome')
// Finds: こんにちは, hola, bonjour, ようこそ
```

---

## 📚 Related Documentation

- **[CHAT_MOCK_GUIDE.md](./CHAT_MOCK_GUIDE.md)** - Complete chat/SSE streaming guide
- **[BASE64_MOCK_GUIDE.md](../../mocks/BASE64_MOCK_GUIDE.md)** - Converting files to base64
- **[README.md](./README.md)** - General Storybook mocks guide
- **[aws-amplify-datastore.js](./aws-amplify-datastore.js)** - DataStore mock implementation

## 🎉 Summary

You now have **comprehensive mock data** with **real base64-encoded media**, **semantic search capabilities**, and **AI chat streaming** that works in isolated Storybook environments without any S3, AWS, or OpenAI dependencies!

- ✅ 15+ File records with embedded media
- ✅ 25+ Word (vocabulary) records with embeddings
- ✅ 25+ Question records with embeddings
- ✅ Audio, video, images, PDFs all working
- ✅ Realistic relationships between data types
- ✅ Multiple languages and subjects
- ✅ Semantic search and similarity calculations
- ✅ 1536-dimensional embedding vectors (text-embedding-3-small compatible)
- ✅ Chat SSE streams with tool calling (Vercel AI SDK compatible)
- ✅ Easy-to-use helper functions
