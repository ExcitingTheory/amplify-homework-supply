# Testing Automation Plan

## Overview

Comprehensive testing strategy for Homework Supply platform with emphasis on Storybook-driven component testing and E2E automation for critical user journeys. This plan prioritizes the most important features: Editing, File Management, AI Tools, Chat with AI, Agented Tasks, Workbook, Resume, Collaboration, and Instructor Drop-in.

**Current State**:
- ✅ Storybook configured with 44+ component stories
- ✅ Basic Cypress E2E testing setup
- ✅ Mock DataStore infrastructure for Storybook
- ⚠️ Limited E2E test coverage (1 workbook test)
- ❌ No unit testing framework
- ❌ No integration testing for API/AI services

---

## Testing Strategy

### Pyramid Approach

```
              ╱╲
             ╱  ╲  E2E Tests (Cypress)
            ╱────╲  Critical user journeys, slow, expensive
           ╱      ╲
          ╱        ╲ Integration Tests (Jest)
         ╱──────────╲ API, DataStore, AI services
        ╱            ╲
       ╱   Component   ╲ Storybook + Jest
      ╱     Tests       ╲ Interactive testing, visual regression
     ╱──────────────────╲
    ╱                    ╲ Unit Tests (Jest)
   ╱    Business Logic    ╲ Pure functions, utilities, fast
  ╱────────────────────────╲
```

### Test Types

1. **Storybook Component Tests** (Primary for UI)
   - Interactive component development
   - Visual regression testing
   - Accessibility testing
   - Mocked data scenarios

2. **Unit Tests** (Jest)
   - Pure functions and utilities
   - Business logic
   - Data transformations

3. **Integration Tests** (Jest)
   - DataStore operations
   - API endpoints (Lambda functions)
   - AI service integrations
   - File upload/download flows

4. **E2E Tests** (Cypress)
   - Critical user paths
   - Cross-feature workflows
   - Real browser interactions

---

## Priority 1: Storybook Component Testing

### Current Storybook Stories

**Existing Coverage** (44+ stories):
- ✅ `RecordingStudio3.stories.jsx` - Audio recording
- ✅ `MeaningAssociation.stories.jsx` - Vocabulary exercises
- ✅ `ChatSidebar.stories.jsx` - AI chat interface
- ✅ `AIFeedbackWidget.stories.jsx` - Feedback collection
- ✅ `QuestionBlock.stories.jsx` - Question rendering
- ✅ `FileManager2.stories.jsx` - File management UI
- ✅ `VocabularyReview.stories.jsx` - Vocabulary import
- ✅ `Editor3/*.stories.*` - Lexical editor components

### Storybook Enhancement Tasks

#### Phase 1: Interactive Testing Add-ons (Week 1)
- [ ] Install `@storybook/addon-interactions`
- [ ] Install `@storybook/testing-library`
- [ ] Install `@storybook/jest`
- [ ] Configure `play` functions for user interactions

**Example Enhancement**:
```javascript
// src/components/ChatSidebar.stories.jsx
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export const SendMessage = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Type message
    const input = canvas.getByPlaceholderText('Ask me anything...');
    await userEvent.type(input, 'Search for content about photosynthesis');
    
    // Click send
    const sendButton = canvas.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);
    
    // Wait for response
    await canvas.findByText(/searching/i, {}, { timeout: 3000 });
    
    // Verify assistant message appears
    const message = await canvas.findByText(/found/i, {}, { timeout: 10000 });
    expect(message).toBeInTheDocument();
  }
};
```

#### Phase 2: Visual Regression Testing (Week 2)
- [ ] Install `@storybook/addon-percy` or `chromatic`
- [ ] Configure visual snapshots for all stories
- [ ] Set up CI integration for visual diffs
- [ ] Establish baseline snapshots

#### Phase 3: Accessibility Testing (Week 2)
- [ ] Install `@storybook/addon-a11y`
- [ ] Add accessibility checks to all stories
- [ ] Configure WCAG 2.1 AA compliance rules
- [ ] Generate accessibility reports

**Example**:
```javascript
// .storybook/preview.js
import { withA11y } from '@storybook/addon-a11y';

export const decorators = [withA11y];

export const parameters = {
  a11y: {
    config: {
      rules: [
        {
          id: 'color-contrast',
          enabled: true,
        },
      ],
    },
  },
};
```

#### Phase 4: Component-Specific Stories (Weeks 3-4)

##### Editor Testing
- [ ] **ToolbarPlugin.stories.jsx** - All toolbar actions
  - Insert block types (headings, lists, quotes)
  - Format text (bold, italic, code)
  - Insert custom blocks (quiz, answer, meaning-association)
  - Test keyboard shortcuts
- [ ] **DragDropPastePlugin.stories.jsx** - File uploads
  - Drag image into editor
  - Paste image from clipboard
  - Upload audio/video files
  - Verify file previews
- [ ] **AutocompletePlugin.stories.jsx** - Word suggestions
  - Type partial word
  - Arrow key navigation
  - Select suggestion
  - Insert word with metadata
- [ ] **CollaborationPlugin.stories.jsx** (Future)
  - Multiple cursors simulation
  - Concurrent edits
  - Awareness indicators

##### File Management Testing
- [ ] **FileManager2.stories.jsx** - Enhanced scenarios
  - Upload multiple files
  - Delete file with confirmation
  - Search/filter files
  - Preview different file types
  - Generate embeddings for search
- [ ] **DocumentAnalysisStatus.stories.jsx** (New)
  - Upload PDF → Analyze → Complete flow
  - Cancel analysis mid-stream
  - Error handling (corrupted file)
  - Retry failed analysis

##### AI Tools Testing
- [ ] **ChatSidebar.stories.jsx** - Enhanced
  - Tool invocation (search_content)
  - Streaming responses
  - Error handling (API timeout)
  - Offline behavior
- [ ] **ContentCompletion.stories.jsx** (New)
  - Generate block suggestions
  - Accept/reject suggestions
  - Streaming completion
  - Context-aware generation
- [ ] **VocabularyImport.stories.jsx**
  - Import from text file
  - Parse CSV vocabulary
  - Generate embeddings
  - Save to dictionary

##### Workbook Testing
- [ ] **WorkbookPlayer.stories.jsx** (New)
  - Start timer
  - Navigate between blocks
  - Answer quiz questions
  - Record audio responses
  - Submit workbook
- [ ] **GradingView.stories.jsx** (New)
  - Review student submission
  - Audio playback
  - Provide feedback
  - Calculate scores

---

## Priority 2: Integration Testing with Storybook

### Why Storybook for Integration Tests?

**Advantages over traditional integration tests**:
- ✅ Real browser environment (Playwright)
- ✅ Visual feedback during development
- ✅ Network-level API mocking (MSW)
- ✅ Test component + context + API integration
- ✅ Faster than E2E, more realistic than unit tests
- ✅ Component catalog + tests in one place

### Storybook Test Runner Setup

**Installation** (Week 1):
```bash
npm install --save-dev @storybook/test-runner @storybook/addon-coverage msw msw-storybook-addon
npx msw init public/
```

**Configuration** `.storybook/test-runner.js`:
```javascript
const { getStoryContext } = require('@storybook/test-runner');

module.exports = {
  async postRender(page, context) {
    // Run accessibility tests on every story
    const storyContext = await getStoryContext(page, context);
    await page.evaluate(() => document.fonts.ready);
    
    // Check for console errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') logs.push(msg.text());
    });
    
    if (logs.length > 0) {
      throw new Error(`Console errors: ${logs.join('\n')}`);
    }
  }
};
```

**MSW Setup** `.storybook/preview.js`:
```javascript
import { initialize, mswDecorator } from 'msw-storybook-addon';

// Initialize MSW
initialize();

// Add MSW decorator
export const decorators = [mswDecorator];

export const parameters = {
  msw: {
    handlers: {
      // Default handlers for all stories
      auth: [
        rest.get('/api/user', (req, res, ctx) => {
          return res(ctx.json({ username: 'test-user' }));
        })
      ]
    }
  }
};
```

### Integration Test Examples

#### 1. DataStore Integration Test

```javascript
// src/components/FileManager2.integration.stories.jsx
import { FileManager2 } from './FileManager2';
import { FilesContext } from '../../context/fileContext';
import { DataStore } from 'aws-amplify/datastore';
import { File } from '../../models';
import { within, userEvent, waitFor } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export default {
  title: 'Integration/FileManager',
  component: FileManager2,
  parameters: {
    // Run DataStore in test mode
    amplify: {
      DataStore: {
        mode: 'test'
      }
    }
  }
};

export const UploadAndSearchFiles = {
  decorators: [
    (Story) => {
      // Use REAL FilesContext with test DataStore
      const [files, setFiles] = React.useState([]);
      
      React.useEffect(() => {
        // Seed test data
        const seedFiles = async () => {
          await DataStore.save(new File({
            name: 'test-image.jpg',
            key: 'public/test-image.jpg',
            type: 'image/jpeg',
            size: 1024
          }));
          
          const items = await DataStore.query(File);
          setFiles(items);
        };
        
        seedFiles();
        
        return () => DataStore.clear();
      }, []);
      
      return (
        <FilesContext.Provider value={{ files, setFiles }}>
          <Story />
        </FilesContext.Provider>
      );
    }
  ],
  
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify initial file appears
    await waitFor(() => 
      expect(canvas.getByText('test-image.jpg')).toBeInTheDocument()
    );
    
    // Upload new file
    const fileInput = canvas.getByLabelText(/upload/i);
    const file = new File(['content'], 'new-audio.wav', { type: 'audio/wav' });
    await userEvent.upload(fileInput, file);
    
    // Wait for DataStore save
    await waitFor(async () => {
      const items = await DataStore.query(File);
      expect(items).toHaveLength(2);
    }, { timeout: 5000 });
    
    // Verify new file appears
    expect(canvas.getByText('new-audio.wav')).toBeInTheDocument();
    
    // Search files
    const searchInput = canvas.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, 'audio');
    
    // Should show only audio file
    expect(canvas.getByText('new-audio.wav')).toBeInTheDocument();
    expect(canvas.queryByText('test-image.jpg')).not.toBeInTheDocument();
  }
};
```

#### 2. API Integration Test with MSW

```javascript
// src/components/ChatSidebar.integration.stories.jsx
import { ChatSidebar } from './ChatSidebar';
import { rest } from 'msw';
import { within, userEvent, waitFor } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export default {
  title: 'Integration/ChatSidebar',
  component: ChatSidebar
};

export const StreamingChatResponse = {
  parameters: {
    msw: {
      handlers: [
        // Mock chat streaming endpoint
        rest.post('/chat', async (req, res, ctx) => {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              // Simulate streaming response
              controller.enqueue(encoder.encode('0:"Hello "\n'));
              setTimeout(() => {
                controller.enqueue(encoder.encode('0:"there!"\n'));
                controller.close();
              }, 100);
            }
          });
          
          return res(
            ctx.status(200),
            ctx.set('Content-Type', 'text/plain; charset=utf-8'),
            ctx.body(stream)
          );
        })
      ]
    }
  },
  
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Type message
    const input = canvas.getByPlaceholderText(/ask me anything/i);
    await userEvent.type(input, 'Hello');
    
    // Send message
    const sendButton = canvas.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);
    
    // Wait for user message
    await waitFor(() => 
      expect(canvas.getByText('Hello')).toBeInTheDocument()
    );
    
    // Wait for streaming response
    await waitFor(() => 
      expect(canvas.getByText(/Hello there!/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );
  }
};

export const ToolExecutionFlow = {
  parameters: {
    msw: {
      handlers: [
        rest.post('/chat', async (req, res, ctx) => {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              // Tool call
              controller.enqueue(encoder.encode('9:{"tool-call":"search_content","args":{"query":"test"}}\n'));
              setTimeout(() => {
                // Tool result
                controller.enqueue(encoder.encode('a:{"tool-result":{"toolCallId":"1","result":"Found 3 items"}}\n'));
                // Response
                controller.enqueue(encoder.encode('0:"I found 3 items about test."\n'));
                controller.close();
              }, 500);
            }
          });
          
          return res(ctx.status(200), ctx.body(stream));
        }),
        
        // Mock search endpoint
        rest.post('/search', (req, res, ctx) => {
          return res(ctx.json([
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
            { id: '3', name: 'Item 3' }
          ]));
        })
      ]
    }
  },
  
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await userEvent.type(canvas.getByPlaceholderText(/ask/i), 'Search for test');
    await userEvent.click(canvas.getByRole('button', { name: /send/i }));
    
    // Verify tool execution indicator
    await waitFor(() => 
      expect(canvas.getByText(/🔧.*search_content/i)).toBeInTheDocument()
    );
    
    // Verify tool result
    await waitFor(() => 
      expect(canvas.getByText(/Found 3 items/i)).toBeInTheDocument(),
      { timeout: 2000 }
    );
    
    // Verify AI response
    await waitFor(() => 
      expect(canvas.getByText(/I found 3 items/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );
  }
};
```

#### 3. Context + API Integration

```javascript
// src/components/DictionaryEditor2.integration.stories.jsx
import { DictionaryEditor2 } from './DictionaryEditor2';
import { DictionaryContext } from '../../context/dictionaryContext';
import { rest } from 'msw';
import { within, userEvent, waitFor } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export default {
  title: 'Integration/DictionaryEditor',
  component: DictionaryEditor2
};

export const GenerateEmbeddings = {
  decorators: [
    (Story) => {
      const [words, setWords] = React.useState([
        { id: '1', word: 'こんにちは', phonetic: 'konnichiwa', definition: 'hello' }
      ]);
      
      return (
        <DictionaryContext.Provider value={{ words, setWords }}>
          <Story />
        </DictionaryContext.Provider>
      );
    }
  ],
  
  parameters: {
    msw: {
      handlers: [
        // Mock embedding generation
        rest.post('/api/graphql', async (req, res, ctx) => {
          const body = await req.json();
          
          if (body.query.includes('generateEmbeddings')) {
            return res(ctx.json({
              data: {
                generateEmbeddings: {
                  success: true,
                  embeddings: [
                    { wordID: '1', embedding: [0.1, 0.2, 0.3] }
                  ]
                }
              }
            }));
          }
        })
      ]
    }
  },
  
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click generate embeddings
    const generateButton = canvas.getByRole('button', { name: /generate embeddings/i });
    await userEvent.click(generateButton);
    
    // Verify loading state
    expect(canvas.getByText(/generating/i)).toBeInTheDocument();
    
    // Wait for completion
    await waitFor(() => 
      expect(canvas.getByText(/embeddings generated/i)).toBeInTheDocument(),
      { timeout: 5000 }
    );
    
    // Verify embedding indicator appears on word
    const wordChip = canvas.getByText('こんにちは').closest('[data-testid="word-chip"]');
    expect(within(wordChip).getByTitle(/has embedding/i)).toBeInTheDocument();
  }
};
```

#### 4. Document Analysis Integration

```javascript
// src/components/DocumentAnalysis.integration.stories.jsx
export const AnalyzeAndImportVocabulary = {
  parameters: {
    msw: {
      handlers: [
        // Mock file upload
        rest.put('https://s3.amazonaws.com/*', (req, res, ctx) => {
          return res(ctx.status(200));
        }),
        
        // Mock document analysis
        rest.post('/api/graphql', async (req, res, ctx) => {
          const body = await req.json();
          
          if (body.query.includes('analyzeDocument')) {
            return res(ctx.json({
              data: {
                analyzeDocument: {
                  fileID: 'test-file-id',
                  status: 'analyzing'
                }
              }
            }));
          }
          
          if (body.query.includes('ParsedContent')) {
            return res(ctx.json({
              data: {
                listParsedContents: {
                  items: [{
                    id: '1',
                    fileID: 'test-file-id',
                    vocabulary: [
                      { word: '光合成', phonetic: 'こうごうせい', definition: 'photosynthesis' },
                      { word: '葉緑体', phonetic: 'ようりょくたい', definition: 'chloroplast' }
                    ]
                  }]
                }
              }
            }));
          }
        })
      ]
    }
  },
  
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Upload PDF
    const fileInput = canvas.getByLabelText(/upload pdf/i);
    const pdfFile = new File(['pdf content'], 'biology.pdf', { type: 'application/pdf' });
    await userEvent.upload(fileInput, pdfFile);
    
    // Confirm analysis
    const analyzeButton = await canvas.findByRole('button', { name: /analyze/i });
    await userEvent.click(analyzeButton);
    
    // Wait for analyzing status
    await waitFor(() => 
      expect(canvas.getByText(/analyzing/i)).toBeInTheDocument(),
      { timeout: 2000 }
    );
    
    // Wait for vocabulary to appear
    await waitFor(() => {
      expect(canvas.getByText('光合成')).toBeInTheDocument();
      expect(canvas.getByText('葉緑体')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Select and import vocabulary
    await userEvent.click(canvas.getByLabelText(/select all/i));
    await userEvent.click(canvas.getByRole('button', { name: /import/i }));
    
    // Verify success message
    await waitFor(() => 
      expect(canvas.getByText(/imported 2 words/i)).toBeInTheDocument()
    );
  }
};
```

### Running Integration Tests

```bash
# Run all Storybook stories as tests
npm run test:storybook

# Run with coverage
npm run test:storybook:coverage

# Run specific story
npm run test:storybook -- --stories-json ./storybook-static/stories.json --url http://localhost:6006 --grep "Integration/ChatSidebar"

# Watch mode during development
npm run storybook & npm run test:storybook -- --watch
```

---

## Priority 3: Unit Testing (Jest)

### Setup (Week 1)
- [ ] Install Jest and React Testing Library
  ```bash
  npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```
- [ ] Install Storybook Test Runner
  ```bash
  npm install --save-dev @storybook/test-runner @storybook/addon-coverage
  ```
- [ ] Install MSW (Mock Service Worker) for API mocking
  ```bash
  npm install --save-dev msw msw-storybook-addon
  ```
- [ ] Configure `jest.config.js`:
  - Mock AWS Amplify modules
  - Mock Lexical editor
  - Setup test environment (jsdom)
- [ ] Add test scripts to `package.json`:
  ```json
  {
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage",
      "test:storybook": "test-storybook",
      "test:storybook:coverage": "test-storybook --coverage"
    }
  }
  ```

### Utility Functions (Week 2)

#### Color Utilities
- [ ] `src/utils/colorUtils.test.js`
  - `hexToRgb()` - Convert hex to RGB
  - `rgbToLab()` - RGB to LAB color space
  - `calculateColorDistance()` - Delta E accuracy
  - `generateColorPalette()` - Distinct colors

#### Content Sanitization
- [ ] `src/utils/contentSanitizer.test.js`
  - `sanitizeInstructorNotes()` - Filter by visibility
  - `stripPrivateBlocks()` - Remove private content
  - `extractGradableBlocks()` - Get quiz/answer blocks

#### File Upload
- [ ] `src/utils/fileUploadUtils.test.js`
  - `validateFileType()` - MIME type checking
  - `generateThumbnail()` - Image resizing
  - `uploadToS3()` - Mock S3 upload
  - `getCachedUrl()` - Cache behavior

#### Grading Logic
- [ ] `src/utils/gradingUtils.test.js`
  - `calculateAccuracy()` - Score calculation
  - `aggregateBlockGrades()` - Overall grade
  - `compareAudioToText()` - Transcription matching

#### Chat Tools
- [ ] `src/utils/chatTools.test.js`
  - `executeTool()` - Tool execution
  - `executeSearchContent()` - Vector search
  - `executeCreateSection()` - DataStore create

#### Embedding Worker
- [ ] `src/utils/embeddingWorkerManager.test.js`
  - `calculateSimilarities()` - Cosine similarity
  - `keywordSearch()` - Fallback search
  - `sortAndLimit()` - Result ranking

### Context Providers (Week 3)

#### UnitContext
- [ ] `src/context/unitContext.test.js`
  - Load unit data
  - Save editor content
  - Update rubric
  - Calculate grade

#### FilesContext
- [ ] `src/context/fileContext.test.js`
  - Load files from DataStore
  - Populate vector store
  - Search embeddings
  - Handle offline sync

#### SectionContext
- [ ] `src/context/sectionContext.test.js`
  - Load sections
  - Subscribe to assignments
  - Create join codes

---

## Priority 4: Integration Testing with Jest

### API Testing (Week 4)

#### Lambda Functions
- [ ] **Chat Endpoint** (`chatStream/src/app.js`)
  ```javascript
  // __tests__/chatStream.integration.test.js
  describe('Chat Stream API', () => {
    it('should stream AI response', async () => {
      const response = await fetch('/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          context: { unit: mockUnit }
        })
      });
      
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/plain');
      
      const reader = response.body.getReader();
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(new TextDecoder().decode(value));
      }
      
      expect(chunks.join('')).toContain('Hello');
    });
  });
  ```

- [ ] **Content Completion** (`contentCompletion/src/index.js`)
  - Generate block suggestions
  - Validate streaming format
  - Test context integration

- [ ] **Document Analysis** (`analyzeDocument/src/index.js`)
  - Upload PDF
  - Extract text
  - Generate vocabulary
  - Handle cancellation

- [ ] **Embedding Generation** (`generateEmbeddings/src/index.js`)
  - Create embeddings for text
  - Batch processing
  - Error handling

### DataStore Integration (Week 5)

#### CRUD Operations
- [ ] **Unit Operations**
  ```javascript
  // __tests__/datastore-unit.integration.test.js
  describe('Unit DataStore', () => {
    beforeEach(async () => {
      await DataStore.clear();
    });
    
    it('should create and retrieve unit', async () => {
      const unit = await DataStore.save(new Unit({
        name: 'Test Unit',
        description: 'Description',
        data: JSON.stringify({ root: { children: [] } })
      }));
      
      const retrieved = await DataStore.query(Unit, unit.id);
      expect(retrieved.name).toBe('Test Unit');
    });
    
    it('should update unit with copyOf', async () => {
      const original = await DataStore.save(new Unit({ name: 'Original' }));
      
      const updated = await DataStore.save(Unit.copyOf(original, draft => {
        draft.name = 'Updated';
      }));
      
      expect(updated.name).toBe('Updated');
      expect(updated._version).toBe(original._version + 1);
    });
  });
  ```

- [ ] **Grade Operations**
  - Create grade with student response
  - Update accuracy scores
  - Handle concurrent updates

- [ ] **File Operations**
  - Upload file metadata
  - Associate with unit
  - Generate embeddings

#### Subscriptions
- [ ] **ObserveQuery**
  ```javascript
  it('should receive updates via observeQuery', async () => {
    const updates = [];
    
    const subscription = DataStore.observeQuery(Unit).subscribe(({ items }) => {
      updates.push(items.length);
    });
    
    await DataStore.save(new Unit({ name: 'Unit 1' }));
    await DataStore.save(new Unit({ name: 'Unit 2' }));
    
    await waitFor(() => expect(updates).toContain(2));
    
    subscription.unsubscribe();
  });
  ```

### AI Service Integration (Week 6)

#### OpenAI API
- [ ] **Chat Completion**
  - Send messages
  - Receive streaming response
  - Tool calls
  - Error handling (rate limits, timeouts)

- [ ] **Whisper (Audio Transcription)**
  - Upload audio file
  - Receive transcript
  - Language detection
  - Timestamp handling

- [ ] **TTS (Text-to-Speech)**
  - Generate audio from text
  - Voice selection
  - SSML support

- [ ] **Embeddings**
  - Generate text embeddings
  - Batch processing
  - Dimension validation

---

## Priority 5: E2E Testing (Cypress)

### Critical User Journeys (Weeks 7-10)

#### Journey 1: Instructor Creates Unit
```javascript
// cypress/e2e/instructor-create-unit.cy.js
describe('Instructor: Create Unit', () => {
  beforeEach(() => {
    cy.login('instructor');
    cy.visit('/units');
  });
  
  it('should create unit with content', () => {
    // Create unit
    cy.get('[data-testid="create-unit-button"]').click();
    cy.get('input[name="name"]').type('Japanese Lesson 1');
    cy.get('textarea[name="description"]').type('Introduction to hiragana');
    cy.get('button[type="submit"]').click();
    
    // Wait for editor to load
    cy.get('[data-lexical-editor="true"]').should('be.visible');
    
    // Add heading
    cy.get('[data-testid="toolbar-heading"]').click();
    cy.get('[data-lexical-editor="true"]').type('Vocabulary');
    
    // Insert quiz block
    cy.get('[data-testid="insert-quiz"]').click();
    cy.get('[data-testid="quiz-prompt"]').type('What is the hiragana for "a"?');
    cy.get('[data-testid="quiz-answer"]').type('あ');
    
    // Save
    cy.get('[data-testid="save-unit"]').click();
    cy.contains('Unit saved successfully');
    
    // Verify in list
    cy.visit('/units');
    cy.contains('Japanese Lesson 1').should('be.visible');
  });
});
```

#### Journey 2: Student Completes Workbook
```javascript
// cypress/e2e/student-workbook.cy.js
describe('Student: Complete Workbook', () => {
  const assignmentId = 'test-assignment-id';
  
  beforeEach(() => {
    cy.login('student');
  });
  
  it('should complete workbook and submit', () => {
    cy.visit(`/workbook/unit-id/${assignmentId}`);
    
    // Start timer
    cy.get('[data-testid="start-workbook"]').click();
    cy.get('[data-testid="timer"]').should('contain', '00:');
    
    // Answer quiz question
    cy.get('[data-testid="quiz-answer-input"]').type('あ');
    cy.get('[data-testid="next-block"]').click();
    
    // Meaning association drag-and-drop
    cy.get('[data-testid="word-chip"]').first()
      .drag('[data-testid="definition-drop-zone"]').first();
    
    // Record audio
    cy.get('[data-testid="record-audio"]').click();
    cy.wait(2000);
    cy.get('[data-testid="stop-recording"]').click();
    cy.get('[data-testid="audio-preview"]').should('be.visible');
    
    // Submit workbook
    cy.get('[data-testid="submit-workbook"]').click();
    cy.get('[data-testid="confirm-submit"]').click();
    
    // Verify submission
    cy.contains('Workbook submitted successfully');
    cy.url().should('include', '/grades');
  });
});
```

#### Journey 3: Instructor Grades Workbook
```javascript
// cypress/e2e/instructor-grading.cy.js
describe('Instructor: Grade Workbook', () => {
  beforeEach(() => {
    cy.login('instructor');
    cy.visit('/grades');
  });
  
  it('should review and grade student submission', () => {
    // Select incomplete grade
    cy.get('[data-testid="grade-row"]').first().click();
    
    // Review quiz answer
    cy.get('[data-testid="quiz-student-answer"]').should('be.visible');
    cy.get('[data-testid="mark-correct"]').click();
    
    // Listen to audio
    cy.get('[data-testid="play-audio"]').click();
    cy.wait(2000);
    
    // Provide feedback
    cy.get('[data-testid="feedback-input"]').type('Good pronunciation!');
    
    // Set accuracy
    cy.get('[data-testid="accuracy-slider"]').invoke('val', 85).trigger('change');
    
    // Save grade
    cy.get('[data-testid="save-grade"]').click();
    cy.contains('Grade saved');
    
    // Verify in list
    cy.visit('/grades');
    cy.get('[data-testid="grade-row"]').first()
      .should('contain', '85%');
  });
});
```

#### Journey 4: File Upload & Management
```javascript
// cypress/e2e/file-management.cy.js
describe('File Management', () => {
  beforeEach(() => {
    cy.login('instructor');
    cy.visit('/unit/test-unit-id');
  });
  
  it('should upload and manage files', () => {
    // Upload image
    cy.get('[data-testid="upload-file"]').attachFile('test-image.jpg');
    cy.contains('Uploading...').should('be.visible');
    cy.contains('Upload complete', { timeout: 10000 });
    
    // Verify in file list
    cy.get('[data-testid="file-list"]').should('contain', 'test-image.jpg');
    
    // Generate embeddings
    cy.get('[data-testid="generate-embeddings"]').click();
    cy.contains('Embeddings generated', { timeout: 15000 });
    
    // Search files
    cy.get('[data-testid="search-files"]').type('image');
    cy.get('[data-testid="file-list"]').should('contain', 'test-image.jpg');
    
    // Delete file
    cy.get('[data-testid="delete-file"]').first().click();
    cy.get('[data-testid="confirm-delete"]').click();
    cy.get('[data-testid="file-list"]').should('not.contain', 'test-image.jpg');
  });
  
  it('should analyze PDF document', () => {
    cy.get('[data-testid="upload-file"]').attachFile('sample.pdf');
    
    // Confirm analysis
    cy.contains('Would you like to upload and analyze').should('be.visible');
    cy.get('[data-testid="confirm-analysis"]').click();
    
    // Wait for analysis
    cy.contains('Analyzing content...', { timeout: 5000 });
    cy.contains('Analysis complete', { timeout: 30000 });
    
    // Review vocabulary
    cy.get('[data-testid="review-vocabulary"]').click();
    cy.get('[data-testid="vocabulary-list"]').should('be.visible');
    
    // Import selected words
    cy.get('[data-testid="select-all-words"]').click();
    cy.get('[data-testid="import-vocabulary"]').click();
    cy.contains('Vocabulary imported');
  });
});
```

#### Journey 5: AI Chat & Tool Usage
```javascript
// cypress/e2e/ai-chat.cy.js
describe('AI Chat Integration', () => {
  beforeEach(() => {
    cy.login('instructor');
    cy.visit('/unit/test-unit-id');
  });
  
  it('should use AI chat with tools', () => {
    // Open chat sidebar
    cy.get('[data-testid="open-chat"]').click();
    
    // Send search request
    cy.get('[data-testid="chat-input"]').type('Search for content about photosynthesis');
    cy.get('[data-testid="send-message"]').click();
    
    // Verify tool execution
    cy.contains('🔧 search_content', { timeout: 10000 });
    cy.contains('Executing...').should('be.visible');
    cy.contains('✓ Success', { timeout: 15000 });
    
    // Verify AI response
    cy.contains(/found.*results/i, { timeout: 20000 });
    
    // Test error handling
    cy.get('[data-testid="chat-input"]').type('Invalid command xyz123');
    cy.get('[data-testid="send-message"]').click();
    cy.contains(/sorry|error|unknown/i, { timeout: 10000 });
  });
  
  it('should generate content with AI', () => {
    cy.get('[data-testid="open-chat"]').click();
    cy.get('[data-testid="chat-input"]').type('Generate a quiz about Japanese particles');
    cy.get('[data-testid="send-message"]').click();
    
    // Wait for streaming response
    cy.contains(/quiz|question/i, { timeout: 15000 });
    
    // Verify markdown rendering
    cy.get('[data-testid="chat-message"]').last()
      .should('contain', '**')
      .or('contain', '##');
  });
});
```

#### Journey 6: Collaboration & Instructor Drop-in
```javascript
// cypress/e2e/collaboration.cy.js
describe('Real-Time Collaboration', () => {
  it('should enable instructor to view student workbook live', () => {
    // Student starts workbook
    cy.login('student', 'student-session');
    cy.visit('/workbook/unit-id/assignment-id');
    cy.get('[data-testid="start-workbook"]').click();
    
    // Type in editor
    cy.get('[data-lexical-editor="true"]').type('Student is working...');
    
    // Instructor opens drop-in view in new session
    cy.login('instructor', 'instructor-session');
    cy.visit('/grades');
    cy.get('[data-testid="view-live"]').first().click();
    
    // Verify instructor sees student's work
    cy.get('[data-lexical-editor="true"]').should('contain', 'Student is working...');
    
    // Verify awareness indicator
    cy.contains('Instructor is viewing').should('be.visible');
    
    // Instructor adds comment
    cy.get('[data-testid="add-instructor-note"]').click();
    cy.get('[data-testid="note-content"]').type('Keep going!');
    cy.get('[data-testid="note-visibility"]').select('visible-to-student');
    cy.get('[data-testid="save-note"]').click();
    
    // Verify student sees comment in their session
    cy.session('student-session');
    cy.get('[data-testid="instructor-comment"]').should('contain', 'Keep going!');
  });
  
  it('should handle concurrent edits without conflicts', () => {
    // Two students edit same collaborative document
    cy.login('student1', 'session1');
    cy.visit('/workbook/collaborative-unit/assignment-1');
    
    cy.login('student2', 'session2');
    cy.visit('/workbook/collaborative-unit/assignment-1');
    
    // Student 1 types
    cy.session('session1');
    cy.get('[data-lexical-editor="true"]').type('Line 1');
    
    // Student 2 types
    cy.session('session2');
    cy.get('[data-lexical-editor="true"]').type('Line 2');
    
    // Both should see both lines (Y.js merge)
    cy.session('session1');
    cy.get('[data-lexical-editor="true"]').should('contain', 'Line 1');
    cy.get('[data-lexical-editor="true"]').should('contain', 'Line 2');
    
    cy.session('session2');
    cy.get('[data-lexical-editor="true"]').should('contain', 'Line 1');
    cy.get('[data-lexical-editor="true"]').should('contain', 'Line 2');
  });
});
```

#### Journey 7: Resume Functionality
```javascript
// cypress/e2e/resume-workbook.cy.js
describe('Resume Workbook', () => {
  it('should save progress and resume later', () => {
    cy.login('student');
    cy.visit('/workbook/unit-id/assignment-id');
    
    // Start workbook
    cy.get('[data-testid="start-workbook"]').click();
    
    // Answer first question
    cy.get('[data-testid="quiz-answer-input"]').first().type('Answer 1');
    cy.get('[data-testid="next-block"]').click();
    
    // Verify progress saved (auto-save)
    cy.contains('Progress saved').should('be.visible');
    
    // Close browser
    cy.visit('/grades');
    
    // Return to workbook
    cy.visit('/workbook/unit-id/assignment-id');
    
    // Verify resume prompt
    cy.contains('Resume where you left off').should('be.visible');
    cy.get('[data-testid="resume-workbook"]').click();
    
    // Verify previous answer persisted
    cy.get('[data-testid="quiz-answer-input"]').first()
      .should('have.value', 'Answer 1');
    
    // Complete workbook
    cy.get('[data-testid="quiz-answer-input"]').eq(1).type('Answer 2');
    cy.get('[data-testid="submit-workbook"]').click();
    cy.get('[data-testid="confirm-submit"]').click();
    
    // Verify cannot resume after submission
    cy.visit('/workbook/unit-id/assignment-id');
    cy.contains('Resume where you left off').should('not.exist');
  });
  
  it('should handle offline work and sync when online', () => {
    cy.login('student');
    cy.visit('/workbook/unit-id/assignment-id');
    cy.get('[data-testid="start-workbook"]').click();
    
    // Simulate offline
    cy.window().then(win => {
      win.dispatchEvent(new Event('offline'));
    });
    
    // Verify offline indicator
    cy.contains('Offline').should('be.visible');
    
    // Answer questions offline
    cy.get('[data-testid="quiz-answer-input"]').type('Offline answer');
    
    // Simulate online
    cy.window().then(win => {
      win.dispatchEvent(new Event('online'));
    });
    
    // Verify sync
    cy.contains('Syncing...').should('be.visible');
    cy.contains('Progress saved', { timeout: 10000 });
  });
});
```

---

## Test Data Management

### Mock Data Strategy

#### Storybook Mocks
Location: `.storybook/__mocks__/`

**Existing Mocks**:
- ✅ `aws-amplify-datastore.js` - DataStore CRUD operations
- ✅ `auth-mock.js` - Authentication state
- ✅ `@ai-sdk-react.js` - AI SDK hooks

**New Mocks Needed**:
- [ ] `y-websocket.js` - Y.js collaboration
- [ ] `@lexical/yjs.js` - Lexical collaboration plugin
- [ ] `aws-amplify-storage.js` - S3 file operations
- [ ] `openai.js` - OpenAI API responses

#### Test Fixtures
Location: `cypress/fixtures/`

- [ ] `units.json` - Sample units
- [ ] `assignments.json` - Sample assignments
- [ ] `grades.json` - Sample grades
- [ ] `files.json` - File metadata
- [ ] `test-audio.wav` - Audio file
- [ ] `test-image.jpg` - Image file
- [ ] `sample.pdf` - PDF document

#### Seed Data Scripts
- [ ] `cypress/support/seed-database.js`
  - Create test users (instructor, students)
  - Create sample units
  - Create assignments
  - Generate initial grades

---

## CI/CD Integration

### GitHub Actions Workflow
Location: `.github/workflows/test.yml`

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
  
  component-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build-storybook
      - run: npm run test-storybook
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm start &
      - uses: cypress-io/github-action@v5
        with:
          wait-on: 'http://localhost:3000'
          record: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          CYPRESS_TEACHER_USERNAME: ${{ secrets.TEACHER_USERNAME }}
          CYPRESS_TEACHER_PASSWORD: ${{ secrets.TEACHER_PASSWORD }}
  
  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run chromatic
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_TOKEN }}
```

---

## Test Coverage Goals

### Phase 1 (Weeks 1-4): Foundation
- **Storybook**: 80% of components with interactive stories + integration tests
- **Storybook Integration**: DataStore, API mocking with MSW
- **Unit Tests**: 70% coverage for utilities
- **E2E**: 3 critical paths (create unit, complete workbook, grade)

### Phase 2 (Weeks 5-8): Expansion
- **Storybook**: 95% of components, visual regression enabled
- **Storybook Integration**: All context providers, AI services
- **Unit Tests**: 80% coverage overall
- **E2E**: 7 critical paths (add file management, chat, collaboration)

### Phase 3 (Weeks 9-12): Polish
- **Storybook**: 100% coverage, accessibility tests passing
- **Storybook Integration**: Coverage reports, performance benchmarks
- **Unit Tests**: 85% coverage
- **E2E**: 10+ critical paths, performance benchmarks
- **Visual Regression**: Automated baseline management
- **CI/CD**: All tests running on every PR

---

## Monitoring & Reporting

### Test Dashboards
- [ ] **Cypress Cloud** - E2E test results, video recordings
- [ ] **Codecov** - Code coverage trending
- [ ] **Chromatic** - Visual regression reports
- [ ] **Storybook** - Published component catalog

### Metrics to Track
- Test execution time
- Flaky test rate
- Code coverage percentage
- Visual regression failures
- E2E pass rate
- Accessibility violations

---

## Automation Priorities

### Must-Have (Weeks 1-6)
1. ✅ Storybook interactive testing setup
2. ✅ Storybook Test Runner with MSW integration
3. ✅ Integration tests for DataStore, API, and Contexts
4. ✅ Jest unit testing framework
5. ✅ Critical E2E paths (3-5 journeys)
6. ✅ CI/CD integration
7. ✅ Mock data infrastructure

### Should-Have (Weeks 7-10)
8. Visual regression testing
9. Accessibility testing
10. Collaboration testing (Y.js)
11. Performance benchmarks

### Nice-to-Have (Weeks 11-12)
12. Load testing (100+ concurrent users)
13. Mobile responsive testing
14. Cross-browser testing (Safari, Firefox)
15. Internationalization testing
16. Security testing (XSS, CSRF)

---

## Maintenance Plan

### Weekly
- Review flaky tests
- Update snapshots
- Monitor coverage trends

### Monthly
- Review and update test data
- Refactor duplicate test code
- Update CI/CD pipeline

### Quarterly
- Audit test coverage gaps
- Evaluate new testing tools
- Performance optimization

---

## Success Criteria

### Developer Experience
- ✅ Tests run in < 5 minutes locally
- ✅ Clear error messages guide debugging
- ✅ Easy to add new tests (templates + docs)
- ✅ Mock data setup < 1 minute

### Quality Assurance
- ✅ 85%+ code coverage
- ✅ Zero flaky E2E tests
- ✅ All accessibility tests passing
- ✅ No visual regressions merged to main

### Continuous Integration
- ✅ All tests run on every PR
- ✅ Test results visible in GitHub PR
- ✅ Auto-block merge on test failures
- ✅ Performance budgets enforced

---

**Next Steps**: 
1. Set up Jest and Storybook interactive testing (Week 1)
2. Write first 10 component stories with `play` functions (Week 2)
3. Implement 3 critical E2E journeys (Weeks 3-4)
4. Configure CI/CD with GitHub Actions (Week 4)
