# Component Quality Improvement Plan

## Executive Summary

This document outlines necessary improvements for Editor3 components across four key areas:
1. **Documentation Quality** - Gaps, inaccuracies, and missing coverage
2. **Storybook Coverage** - Missing stories and incomplete component state coverage
3. **Testing** - Missing Jest tests and remove Cypress tests
4. **State Management** - Complex components needing refactoring

**Estimated Total Effort**: 80-120 hours of development work

---

## 1. Documentation Issues

### 1.1 Critical Documentation Gaps ❌

#### Missing Component Documentation

**Components Without Dedicated Docs:**
- FileMetadataComponent (only mentioned in BLOCK_ACCESSIBILITY_STANDARDIZATION.md)
- PdfViewerComponent (only mentioned in BLOCK_ACCESSIBILITY_STANDARDIZATION.md)
- ExcalidrawNode (disabled, needs status clarification)
- FileManager2 (4234 lines, no dedicated documentation)
- AudioWaveformPlayer (complex component, undocumented)
- RecordingStudio3 (has RECORDING_STUDIO_3.md but incomplete)

**Recommended Action**: Create dedicated docs for each major component with:
- Purpose and use cases
- Props API reference
- Integration examples
- Common patterns and anti-patterns

#### Inaccurate/Outdated Documentation

**[src/components/Editor3/README.md](src/components/Editor3/README.md)**

❌ **Issue 1: S3 Path Pattern Contradictions**
```markdown
<!-- Two different patterns proposed with no resolution -->
Pattern 1: identityId/uploaded/audio/{datetime}.mp3
Pattern 2: identityId/generated/audio/{digest}.mp3
```
**Fix**: Document the ACTUAL pattern being used in production and remove commented alternatives. Reference USER_SUBMISSION_STORAGE.md for the authoritative pattern.

❌ **Issue 2: Incomplete Plugin List**
Missing from custom plugins list:
- FileMetadataPlugin
- BlockSuggestionPlugin (mentioned in BLOCK_SUGGESTION_PLUGIN.md)
- AIContentCompletionPlugin (mentioned in AI_CONTENT_COMPLETION.md)
- FloatingLinkEditorPlugin (has stories)

**Fix**: Generate complete plugin list from actual codebase, categorize by type (content, editing, AI, grading, etc.)

❌ **Issue 3: Missing Context Documentation**
The README doesn't document the critical Context architecture:
- UnitContext (primary state manager)
- FilesContext
- DictionaryContext
- SectionContext
- SettingsContext
- SuggestionContext (src/components/Editor3/context/SuggestionContext.js)

**Fix**: Add "State Management" section explaining Context usage and anti-patterns (e.g., don't create DataStore subscriptions when Context provides data).

**[docs/API.md](docs/API.md)**

❌ **Issue 4: Incomplete Grade Data Structure**
The Grade.data example doesn't match the actual structure used by graded blocks:
```json
// Documented
{
  "responses": [
    { "questionId": "q1", "userAnswer": 0, "correct": true }
  ]
}

// Actual (from BLOCK_ACCESSIBILITY_STANDARDIZATION.md)
{
  "block-id-1": { complete: true, accuracy: 85, userAnswer: "..." },
  "block-id-2": { complete: false, accuracy: 0 }
}
```
**Fix**: Update with the correct block-keyed structure and link to BLOCK_ACCESSIBILITY_STANDARDIZATION.md.

❌ **Issue 5: Missing Models**
Recent models not documented:
- Question (referenced in CustomAnswerEditor.js)
- QuestionFile (referenced in CustomAnswerEditor.js)
- QuestionUnit (referenced in CustomAnswerEditor.js)
- ParsedContent (referenced in FileManager2.js, seedData.js)
- Document (referenced in FileManager2.js)
- Settings (referenced in FileManager2.js)
- ChatHistory (has UI form generated)
- Assistant (has UI form generated)
- AgentJob (has UI form generated)
- Book (has UI form generated)

**Fix**: Run `amplify codegen models` output against docs, ensure all models are documented.

**[docs/ONBOARDING.md](docs/ONBOARDING.md)**

⚠️ **Issue 6: Incomplete AWS SSO Instructions**
```markdown
# The URL will be filled in by your supervisor
# Example: https://your-organization.awsapps.com/start
```
**Fix**: Either provide the actual URL or move to a .env.template file with clearer instructions.

⚠️ **Issue 7: Missing Storybook Development Workflow**
Onboarding doesn't mention:
- `npm run storybook` for component development
- Mock strategy for AWS services
- How to create new stories
- Component isolation workflow

**Fix**: Add "Component Development with Storybook" section.

### 1.2 Missing Cross-References

**Problem**: Documentation lacks interconnected navigation.

**Examples**:
- BLOCK_ACCESSIBILITY_STANDARDIZATION.md doesn't link to component stories
- API.md doesn't reference DATASTORE_OPTIMIZATION_CHANGES.md
- README files don't link to relevant docs/ guides

**Fix**: Add "See Also" sections with related documentation links.

### 1.3 Documentation Creation Tasks

**High Priority:**
- [ ] FileManager2 component guide (architecture, state management, search functionality)
- [ ] AudioWaveformPlayer component guide (audio playback, recording, waveform visualization)
- [ ] State Management Architecture doc (Context usage, DataStore patterns)
- [ ] Complete S3 storage patterns doc (consolidate scattered info)
- [ ] Grading system architecture (rubric calculation, block scoring)

**Medium Priority:**
- [ ] Testing guide (how to write Cypress E2E, Storybook interaction tests)
- [ ] AI integration patterns (streaming, tool calling, embeddings)
- [ ] Performance optimization guide (DataStore, lazy loading, memoization)
- [ ] Accessibility guidelines (keyboard nav, ARIA, screen readers)

**Low Priority:**
- [ ] Component migration guide (JS → TS, class → hooks)
- [ ] Common troubleshooting scenarios
- [ ] Deployment and environment setup guide

**Estimated Effort**: 20-30 hours

---

## 2. Storybook Coverage Gaps

### 2.1 Components Missing Stories Entirely

**Critical Missing Stories:**
1. ❌ **FileMetadataComponent** - Complex component with tabs, search, no stories
2. ❌ **PdfViewerComponent** - Has plugin stories but not component stories
3. ❌ **FileManager2** - 4234 lines, most complex component, NO STORIES
4. ❌ **AudioWaveformPlayer** - Has basic stories, missing states (recording, error, loading)
5. ❌ **TabsVerticalLeft / TabsVerticalRight** - UI layout components, no stories
6. ❌ **PromptMethodSelector / AllowedInputSelector** - Shared UI controls, no stories
7. ❌ **InsertLayoutDialog** - Layout selection modal, no stories
8. ❌ **TableOfContents** - Auto-generated TOC, no stories
9. ❌ **ContentEditable** - Custom editable area, no stories
10. ❌ **StaticWaveform** - Waveform visualization, no stories

### 2.2 Components with Incomplete Story Coverage

**Needs Additional States:**

#### QuizEditor ([QuizPlugin.stories.jsx](src/components/Editor3/plugins/QuizPlugin.stories.jsx))
✅ Has: Editable mode, read-only mode with empty quiz
❌ Missing:
- Quiz with attempted answers (partial completion)
- Quiz with all correct answers (100% completion)
- Quiz with mixed correct/incorrect answers
- Quiz with audio/image questions
- Quiz in edit mode
- Quiz selection/deletion states
- Invalid quiz state (missing required fields)
- Locked quiz state

#### AnswerEditor ([AnswerPlugin.stories.jsx](src/components/Editor3/plugins/AnswerPlugin.stories.jsx))
✅ Has: Editable mode, read-only mode with text input
❌ Missing:
- Answer block with audio input method
- Answer block with writing/drawing input method
- Answer block with multiple allowed input methods
- Answer block with audio prompt method
- Partially completed answer state
- Verified answers with feedback
- Edit mode states
- Different requestDefinition modes (translation, pronunciation, etc.)

#### MeaningAssociationEditor ([MeaningAssociationPlugin.stories.jsx](src/components/Editor3/plugins/MeaningAssociationPlugin.stories.jsx))
✅ Has: Editable mode with mock dictionary
❌ Missing:
- Partially matched pairs
- All pairs correctly matched
- Incorrect matches with feedback
- Edit mode
- Empty word list
- Large word list (10+ items)
- Word list with missing audio

#### CustomAnswerEditor ([CustomAnswerPlugin.audio-drawing.stories.jsx](src/components/Editor3/plugins/CustomAnswerPlugin.audio-drawing.stories.jsx))
✅ Has: Read-only mode with audio/drawing questions
❌ Missing:
- Editable mode
- Questions with existing audio recordings
- Questions with existing drawings
- Questions with prompt audio
- Questions with prompt images
- Error states (upload failed, etc.)
- Loading states (generating audio, etc.)

#### ImageComponent ([ImagesPlugin.stories.jsx](src/components/Editor3/plugins/ImagesPlugin.stories.jsx))
✅ Has: Basic image insertion
❌ Missing:
- Image with caption
- Resizable image states
- Image with different positions (left, center, right, inline)
- Image loading error
- Image with custom dimensions
- Selected vs unselected states

#### TableComponent ([TablePlugin.stories.jsx](src/components/Editor3/plugins/TablePlugin.stories.jsx))
⚠️ Needs verification of state coverage
❌ Likely Missing:
- Table cell selection states
- Table editing mode
- Table with sorted columns
- Table with merged cells (if supported)
- Large table (performance test)

#### PlaylistEditor ([PlaylistPlugin.stories.jsx](src/components/Editor3/plugins/PlaylistPlugin.stories.jsx))
⚠️ Needs verification
❌ Likely Missing:
- Playlist with audio files
- Playlist with video files
- Playlist with mixed media
- Playing state with progress
- Edit mode
- Empty playlist

### 2.3 Mock Data Gaps

**[.storybook/__mocks__/seedData.js](.storybook/__mocks__/seedData.js)**

✅ Well-structured vocabulary review mock data
❌ Missing mock data for:
- Question bank (audio questions, image questions, text questions)
- Grade submissions with various completion states
- File uploads (audio, video, PDF, images) - only vocabulary PDFs
- Assignment data with due dates
- Section data with students
- Chat history for AI interactions
- Agent jobs for background tasks
- Parsed content beyond vocabulary (summaries, objectives)

**Recommended Action**: Expand seedData.js with:
```javascript
export const seedQuestionBank = {
  withAudioQuestions({ questionIDs, owner }),
  withImageQuestions({ questionIDs, owner }),
  withDrawingQuestions({ questionIDs, owner }),
  withMixedQuestions({ questionIDs, owner }),
};

export const seedGradeData = {
  withPartialCompletion({ gradeId, unitId, percentage }),
  withFullCompletion({ gradeId, unitId, accuracy }),
  withNoProgress({ gradeId, unitId }),
  withMixedAccuracy({ gradeId, unitId }),
};

export const seedFileUploads = {
  withAudioFiles({ fileIds, owner }),
  withVideoFiles({ fileIds, owner }),
  withImageFiles({ fileIds, owner }),
  withPDFFiles({ fileIds, owner }),
  withMixedFiles({ fileIds, owner }),
};
```

### 2.4 Storybook Mock Verification

**[.storybook/__mocks__/](. storybook/__mocks__/)**

✅ Well-implemented mocks:
- aws-amplify-datastore.js (comprehensive DataStore mock)
- aws-amplify-auth.js (Auth mock)
- aws-amplify-storage.js (Storage mock)
- ai-react.js (useChat mock)
- media.js (base64 audio/images)

⚠️ Potential Issues:
- **aws-amplify-api.js**: Need to verify REST API mocking for Lambda functions
- **chat-api.js**: Verify `/api/chat` endpoint mocking
- **Embedding generation**: Check if embedding mocks support semantic search stories

### 2.5 Story Creation Priority

**Phase 1: Critical Components (2-3 weeks)**
1. FileManager2 - comprehensive stories for all states
2. AudioWaveformPlayer - all playback/recording states
3. FileMetadataComponent - file display and metadata editing

**Phase 2: Complete Existing Stories (1-2 weeks)**
4. QuizEditor - all quiz states and interactions
5. AnswerEditor - all input methods and feedback
6. CustomAnswerEditor - complete audio/drawing coverage
7. MeaningAssociationEditor - all matching states

**Phase 3: Missing UI Components (1 week)**
8. TabsVerticalLeft/Right - responsive layout states
9. PromptMethodSelector - all configuration options
10. InsertLayoutDialog - all layout templates
11. StaticWaveform - various waveform sizes/states

**Estimated Effort**: 30-40 hours

---

## 3. Testing Gaps

### 3.1 Current Test Coverage

**Existing Tests:**
- ✅ `.storybook/__tests__/model-verification.test.js` - DataStore mock verification
- ✅ `amplify/backend/function/chatStream/chatStream.test.js` - Lambda function test
- ❌ **No component-level Jest tests**
- ❌ **No Cypress E2E tests for Editor3 components**

**Critical Gap**: Zero unit/integration tests for React components.

### 3.2 Recommended Test Structure

```
src/components/Editor3/
├── __tests__/
│   ├── unit/
│   │   ├── QuizEditor.test.jsx
│   │   ├── AnswerEditor.test.jsx
│   │   ├── FileManager2.test.jsx
│   │   └── AudioWaveformPlayer.test.jsx
│   ├── integration/
│   │   ├── GradingFlow.test.jsx
│   │   ├── FileUploadFlow.test.jsx
│   │   └── BlockInteractions.test.jsx
│   └── utils/
│       ├── fileUploadUtils.test.js
│       ├── getCachedUrl.test.js
│       └── calculateWaveformData.test.js
├── cypress/
│   └── e2e/
│       ├── editor-basic-editing.cy.js
│       ├── quiz-creation-submission.cy.js
│       ├── file-upload-management.cy.js
│       └── assignment-workflow.cy.js
```

### 3.3 Priority Test Cases

**High Priority (Unit Tests):**

#### QuizEditor
```javascript
describe('QuizEditor', () => {
  it('should render quiz questions', () => {});
  it('should update quiz data on edit', () => {});
  it('should calculate score correctly', () => {});
  it('should save progress to Grade context', () => {});
  it('should handle selection/deletion via keyboard', () => {});
  it('should validate required fields', () => {});
});
```

#### FileManager2
```javascript
describe('FileManager2', () => {
  it('should list files from FilesContext', () => {});
  it('should upload files to S3', () => {});
  it('should perform keyword search', () => {});
  it('should perform semantic search with embeddings', () => {});
  it('should handle file deletion', () => {});
  it('should analyze PDF documents', () => {});
  it('should cancel PDF analysis', () => {});
});
```

#### AudioWaveformPlayer
```javascript
describe('AudioWaveformPlayer', () => {
  it('should play audio from URL', () => {});
  it('should record audio from microphone', () => {});
  it('should visualize waveform', () => {});
  it('should handle playback errors', () => {});
  it('should save recordings', () => {});
  it('should cleanup on unmount', () => {});
});
```

**High Priority (Integration Tests):**

```javascript
describe('Grading Flow', () => {
  it('should track progress across multiple blocks', () => {});
  it('should calculate overall unit accuracy', () => {});
  it('should persist grade to DataStore', () => {});
});

describe('File Upload Flow', () => {
  it('should upload file, create File record, and link to Unit', () => {});
  it('should generate embeddings for PDF', () => {});
  it('should extract vocabulary from PDF', () => {});
});
```

**High Priority (E2E Tests - Cypress):**

```javascript
describe('Quiz Workflow', () => {
  it('should create quiz, assign to section, submit answers', () => {
    // 1. Instructor creates quiz
    // 2. Instructor assigns to section
    // 3. Student views assignment
    // 4. Student answers questions
    // 5. Student submits
    // 6. Grade is calculated and visible to instructor
  });
});
```

### 3.4 Testing Infrastructure Setup

**Required Packages:**
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@lexical/react": "latest",
    "msw": "^2.0.0"
  }
}
```

**Jest Configuration:**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^aws-amplify/datastore$': '<rootDir>/.storybook/__mocks__/aws-amplify-datastore.js',
    '^aws-amplify/auth$': '<rootDir>/.storybook/__mocks__/aws-amplify-auth.js',
    '^aws-amplify/storage$': '<rootDir>/.storybook/__mocks__/aws-amplify-storage.js',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest'],
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/models/**',
  ],
};
```

**Estimated Effort**: 25-35 hours

---

## 4. State Management Refactoring Opportunities

### 4.1 Components with Complex State

#### FileManager2.js (4234 lines) 🔴 CRITICAL

**Current State Hooks (30+ pieces of state):**
```javascript
const [search, setSearch] = React.useState('');
const [searchMode, setSearchMode] = React.useState('hybrid');
const [searching, setSearching] = React.useState(false);
const [selectedItems, setSelectedItems] = React.useState(new Set());
const [expandedItems, setExpandedItems] = React.useState(...);
const [contextMenu, setContextMenu] = React.useState(null);
const [confirmDialog, setConfirmDialog] = React.useState(...);
const [editingFileId, setEditingFileId] = React.useState(null);
const [expandedFileContent, setExpandedFileContent] = React.useState(new Set());
const [parsedContentData, setParsedContentData] = React.useState({});
const [semanticResults, setSemanticResults] = React.useState(null);
const [fileEmbeddings, setFileEmbeddings] = React.useState({});
// ... 18+ more state variables
```

**Issues:**
- State spread across 30+ `useState` calls
- Complex interdependencies between states
- No clear separation of concerns
- Difficult to test
- Hard to understand data flow

**Recommended Refactoring:**

1. **Extract Search Logic to useReducer**
```javascript
// src/components/Editor3/components/hooks/useFileSearch.js
const searchReducer = (state, action) => {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload, searching: true };
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload, searching: false };
    case 'SET_SEMANTIC_RESULTS':
      return { ...state, semanticResults: action.payload };
    case 'CLEAR_SEARCH':
      return initialSearchState;
    default:
      return state;
  }
};

export const useFileSearch = () => {
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);
  
  const performSearch = useCallback(async (query, mode) => {
    dispatch({ type: 'SET_QUERY', payload: query });
    dispatch({ type: 'SET_MODE', payload: mode });
    
    // Search logic...
    const results = await searchFiles(query, mode);
    
    dispatch({ type: 'SET_RESULTS', payload: results });
  }, []);
  
  return { searchState: state, performSearch, dispatch };
};
```

2. **Extract File Selection to Custom Hook**
```javascript
// src/components/Editor3/components/hooks/useFileSelection.js
export const useFileSelection = (files) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [expandedFileContent, setExpandedFileContent] = useState(new Set());
  
  const toggleSelection = useCallback((fileId) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(fileId) ? next.delete(fileId) : next.add(fileId);
      return next;
    });
  }, []);
  
  const selectAll = useCallback(() => {
    setSelectedItems(new Set(files.map(f => f.id)));
  }, [files]);
  
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);
  
  // ... more selection logic
  
  return {
    selectedItems,
    expandedItems,
    expandedFileContent,
    toggleSelection,
    selectAll,
    clearSelection,
    // ... more methods
  };
};
```

3. **Extract PDF Analysis to Custom Hook**
```javascript
// src/components/Editor3/components/hooks/usePDFAnalysis.js
export const usePDFAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(new Set());
  const [parsedContentData, setParsedContentData] = useState({});
  
  const startAnalysis = useCallback(async (fileId) => {
    setAnalyzing(prev => new Set(prev).add(fileId));
    
    try {
      const result = await analyzePDF(fileId);
      setParsedContentData(prev => ({ ...prev, [fileId]: result }));
    } finally {
      setAnalyzing(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  }, []);
  
  return { analyzing, parsedContentData, startAnalysis };
};
```

4. **Split FileManager2 into Smaller Components**
```
FileManager2.js (main)
├── FileList.jsx (virtualized list rendering)
├── FileItem.jsx (individual file row)
├── FileContextMenu.jsx (right-click menu)
├── FileUploadZone.jsx (drag-drop upload)
├── FileSearchBar.jsx (search UI)
├── PDFAnalysisPanel.jsx (analysis controls)
├── FileContentPreview.jsx (content expansion)
└── hooks/
    ├── useFileSearch.js
    ├── useFileSelection.js
    ├── usePDFAnalysis.js
    └── useFileEmbeddings.js
```

**Estimated Effort**: 15-20 hours for FileManager2 refactoring

#### AudioWaveformPlayer.js (complex audio state)

**Current State:**
```javascript
const [localTime, setLocalTime] = useState(0);
const [localDuration, setLocalDuration] = useState(0);
const [localProgress, setLocalProgress] = useState(0);
const [isReady, setIsReady] = useState(false);
const [blobUrl, setBlobUrl] = useState(null);
const [isSeeking, setIsSeeking] = useState(false);
const [recording, setRecording] = useState(false);
const [mediaRecorder, setMediaRecorder] = useState(null);
const [audioBlob, setAudioBlob] = useState(null);
const [recordedWaveformData, setRecordedWaveformData] = useState(null);
const [pendingRecordingStart, setPendingRecordingStart] = useState(false);
const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
```

**Recommended Refactoring:**

```javascript
// src/components/Editor3/components/hooks/useAudioPlayback.js
const playbackReducer = (state, action) => {
  switch (action.type) {
    case 'READY':
      return { ...state, isReady: true, duration: action.payload };
    case 'PLAY':
      return { ...state, playing: true };
    case 'PAUSE':
      return { ...state, playing: false };
    case 'SEEK':
      return { ...state, time: action.payload, seeking: true };
    case 'UPDATE_PROGRESS':
      return { 
        ...state, 
        time: action.payload, 
        progress: action.payload / state.duration,
        seeking: false 
      };
    default:
      return state;
  }
};

export const useAudioPlayback = (audioSrc) => {
  const [state, dispatch] = useReducer(playbackReducer, initialState);
  
  // Playback logic...
  
  return { playbackState: state, dispatch };
};

// src/components/Editor3/components/hooks/useAudioRecording.js
export const useAudioRecording = () => {
  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    mediaRecorder: null,
    audioBlob: null,
    waveformData: null,
  });
  
  const startRecording = useCallback(async () => {
    // Recording logic...
  }, []);
  
  const stopRecording = useCallback(() => {
    // Stop logic...
  }, []);
  
  return { recordingState, startRecording, stopRecording };
};
```

**Estimated Effort**: 8-10 hours

#### QuizEditor.js

**Current State:**
```javascript
const [editMode, setEditMode] = useState(false);
const [isLocked, setIsLocked] = useState(false);
const [grade, setGrade] = useState(0.0);
const [attemptedAnswers, setAttemptedAnswers] = useState({});
const [correct, setCorrect] = useState({});
const [questionValue, _setQuestionValue] = useState(data);
const [invalidQuestion, setInvalidQuestion] = useState(false);
const [verifiedAnswers, setVerifiedAnswers] = useState({});
```

**Recommended Refactoring:**

```javascript
// src/components/Editor3/components/hooks/useQuizState.js
const quizReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_EDIT_MODE':
      return { ...state, editMode: !state.editMode };
    case 'SUBMIT_ANSWER':
      return {
        ...state,
        attemptedAnswers: {
          ...state.attemptedAnswers,
          [action.questionId]: action.answer
        }
      };
    case 'VERIFY_ANSWER':
      const isCorrect = action.correctAnswer === state.attemptedAnswers[action.questionId];
      return {
        ...state,
        verifiedAnswers: {
          ...state.verifiedAnswers,
          [action.questionId]: isCorrect
        },
        correct: {
          ...state.correct,
          [action.questionId]: isCorrect
        }
      };
    case 'LOCK_QUIZ':
      return { ...state, isLocked: true };
    case 'CALCULATE_GRADE':
      const correctCount = Object.values(state.correct).filter(Boolean).length;
      const totalCount = Object.keys(state.attemptedAnswers).length;
      return { ...state, grade: totalCount > 0 ? correctCount / totalCount : 0 };
    default:
      return state;
  }
};

export const useQuizState = (initialData, nodeKey) => {
  const [state, dispatch] = useReducer(quizReducer, {
    editMode: false,
    isLocked: false,
    grade: 0.0,
    attemptedAnswers: {},
    correct: {},
    verifiedAnswers: {},
    questionValue: initialData,
    invalidQuestion: false,
  });
  
  const { saveGrade } = useContext(UnitContext);
  
  const submitAnswer = useCallback((questionId, answer) => {
    dispatch({ type: 'SUBMIT_ANSWER', questionId, answer });
  }, []);
  
  const verifyAnswer = useCallback((questionId, correctAnswer) => {
    dispatch({ type: 'VERIFY_ANSWER', questionId, correctAnswer });
    dispatch({ type: 'CALCULATE_GRADE' });
    
    // Save to context
    saveGrade(nodeKey, state);
  }, [nodeKey, state, saveGrade]);
  
  return { quizState: state, submitAnswer, verifyAnswer, dispatch };
};
```

**Estimated Effort**: 5-6 hours

### 4.2 Context Optimization

**FileManagerContext Already Exists**: Good pattern, but verify usage across FileManager2.

**Potential New Contexts:**
```javascript
// src/components/Editor3/context/searchContext.js
export const SearchProvider = ({ children }) => {
  // Global search state for entire editor
  // Coordinate search across FileManager, Dictionary, etc.
};

// src/components/Editor3/context/gradingContext.js
export const GradingProvider = ({ children }) => {
  // Separate grading logic from UnitContext
  // Handle rubric calculation, grade submission, feedback
};
```

**Estimated Effort**: 10-12 hours

---

## 5. Implementation Roadmap

### Phase 1: Documentation Foundation (Week 1-2)
**Priority: Critical**

1. Fix Editor3 README inaccuracies (4 hours)
   - Resolve S3 path pattern conflicts
   - Complete plugin list
   - Add Context architecture section

2. Fix API.md model documentation (6 hours)
   - Correct Grade.data structure
   - Document missing models
   - Add cross-references

3. Create FileManager2 architecture doc (8 hours)
   - State management overview
   - Search functionality (keyword + semantic)
   - PDF analysis workflow
   - Component breakdown

4. Create State Management guide (6 hours)
   - Context usage patterns
   - DataStore subscription anti-patterns
   - When to use useReducer vs useState
   - Custom hook patterns

**Total: 24 hours**

### Phase 2: Storybook Coverage (Week 3-5)
**Priority: High**

1. FileManager2 stories (12 hours)
   - Empty state
   - Files list (audio, video, images, PDFs)
   - Search states (keyword, semantic, hybrid)
   - PDF analysis states
   - Upload in progress
   - Error states

2. Complete existing component stories (16 hours)
   - QuizEditor - all quiz states
   - AnswerEditor - all input methods
   - CustomAnswerEditor - audio/drawing
   - MeaningAssociationEditor - matching states
   - ImageComponent - all configurations
   - TableComponent - editing states
   - PlaylistEditor - media playback

3. Missing UI component stories (8 hours)
   - FileMetadataComponent
   - AudioWaveformPlayer (expanded)
   - TabsVerticalLeft/Right
   - PromptMethodSelector
   - InsertLayoutDialog
   - StaticWaveform

4. Expand mock data (4 hours)
   - Question bank mocks
   - Grade submission mocks
   - File upload mocks
   - Assignment/Section mocks

**Total: 40 hours**

### Phase 3: Testing Infrastructure (Week 6-7)
**Priority: High**

1. Jest setup (4 hours)
   - Configure jest.config.js
   - Setup test utils
   - Configure coverage

2. Critical component tests (16 hours)
   - FileManager2 - search, upload, analysis
   - QuizEditor - state transitions, scoring
   - AudioWaveformPlayer - playback, recording
   - AnswerEditor - input methods, grading

3. Integration tests (8 hours)
   - Grading flow
   - File upload flow
   - Block interactions

4. E2E Cypress tests (12 hours)
   - Quiz workflow
   - File management workflow
   - Assignment submission workflow

**Total: 40 hours**

### Phase 4: State Management Refactoring (Week 8-10)
**Priority: Medium**

1. FileManager2 refactoring (20 hours)
   - Extract custom hooks (useFileSearch, useFileSelection, usePDFAnalysis rename as useDocumentAnalysis)
   - Split into smaller components
   - Implement useReducer for search state
   - Write tests for new hooks

2. AudioWaveformPlayer refactoring (10 hours)
   - Extract playback hook
   - Extract recording hook
   - Simplify component

3. QuizEditor refactoring (6 hours)
   - Implement useQuizState hook
   - Simplify grade calculation

4. Create additional contexts (10 hours)
   - SearchContext for global search
   - GradingContext for scoring logic

**Total: 46 hours**

---

## 6. Success Metrics

### Documentation
- ✅ All major components have dedicated documentation
- ✅ No conflicting information across docs
- ✅ All models documented in API.md
- ✅ Clear onboarding path for new developers

### Storybook
- ✅ Every presentational component has stories
- ✅ Every component state is represented
- ✅ Mock data covers all use cases
- ✅ Storybook runs without errors

### Testing
- ✅ Test coverage >70% for critical components
- ✅ All custom hooks have unit tests
- ✅ Critical user flows have E2E tests
- ✅ CI/CD pipeline runs tests on every PR

### State Management
- ✅ No components with >10 useState hooks
- ✅ Complex state uses useReducer
- ✅ Shared logic extracted to custom hooks
- ✅ Components <500 lines (except justified cases)

---

## 7. Open Questions & Decisions Needed

1. **ExcalidrawNode Status**: Should we remove it (unused) or implement it (planned feature)?
   
2. **FileManager2 Complexity**: Is a complete rewrite warranted, or incremental refactoring?
   
3. **Test Framework**: Jest + React Testing Library, or Vitest?
   
4. **Storybook Interaction Tests**: Should we use Storybook's interaction testing instead of Jest for component tests?
   
5. **TypeScript Migration**: Should refactored hooks be written in TypeScript?
   
6. **Documentation Format**: Should we use TypeDoc/JSDoc for auto-generated API docs?

---

## 8. Dependencies & Risks

### Dependencies
- Mock data quality affects Storybook and test reliability
- Refactoring FileManager2 requires understanding search/embedding system
- Testing infrastructure setup may reveal AWS mock gaps

### Risks
- **Breaking Changes**: Refactoring could introduce regressions without tests
  - Mitigation: Write tests BEFORE refactoring
  
- **Scope Creep**: FileManager2 refactoring could balloon
  - Mitigation: Strict time-boxing, incremental approach
  
- **Mock Drift**: Mocks may diverge from real AWS behavior
  - Mitigation: Regular integration testing against dev environment

---

## Appendix A: File Size Analysis

**Components >500 lines requiring attention:**

| Component | Lines | Primary Issue | Priority |
|-----------|-------|---------------|----------|
| FileManager2.js | 4234 | Complex state, multiple responsibilities | Critical |
| CustomAnswerEditor.js | 971 | Form complexity, API integration | High |
| AnswerEditor.js | 647 | Grade state management | Medium |
| QuizEditor.js | 450 | Quiz state management | Medium |
| PdfViewerComponent.js | 416 | PDF rendering logic | Low |

**Recommendation**: Focus refactoring on FileManager2 first, as it's an outlier at 4234 lines.

---

## Appendix B: Documentation Template

**Component Documentation Template:**

```markdown
# [ComponentName]

## Overview
Brief description of component purpose and use cases.

## Props API
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| ... | ... | ... | ... |

## State Management
Describe internal state and how it's managed.

## Integration
How to use this component in the editor:
- Code example
- Common patterns

## Accessibility
Keyboard shortcuts, ARIA labels, screen reader support.

## Testing
How to test this component (unit, integration, stories).

## Known Issues
List any current limitations or bugs.

## See Also
- Related components
- Related documentation
```

---

## Summary

**Total Estimated Effort**: 150 hours (4 weeks at 40hr/week)

**Immediate Priorities**:
1. Fix documentation inaccuracies (24 hours)
2. Create FileManager2 stories (12 hours)
3. Setup Jest testing infrastructure (20 hours)
4. Begin FileManager2 refactoring (20 hours)

**Long-term Goals**:
- Comprehensive Storybook coverage
- >70% test coverage
- Simplified state management
- Complete, accurate documentation
- WCAG 2.1 AA compliance across the site

---

## 9. Web Accessibility (a11y) Comprehensive Audit

### 9.1 Current Accessibility State

**Positive Findings ✅:**
- HTML lang attribute set (`<Html lang="en">`)
- Material UI components provide baseline accessibility
- Some ARIA labels present in menu.js
- Tab navigation implemented in some components
- AWS Amplify Authenticator has built-in accessibility
- Some keyboard handlers in Editor3 components

**Critical Gaps ❌:**

#### Missing Fundamental Features

1. **No Skip Navigation Links**
   - Users with screen readers must tab through entire navigation every page
   - **Impact**: Major time waste for keyboard-only users
   - **WCAG**: 2.4.1 Bypass Blocks (Level A)

2. **No Focus Management on Route Changes**
   - Next.js page transitions don't announce or move focus
   - **Impact**: Screen reader users don't know content changed
   - **WCAG**: 2.4.3 Focus Order (Level A)

3. **Inconsistent Focus Indicators**
   - Some components remove outline (Editor3/index.js: `outline: none`)
   - **Impact**: Keyboard users can't see where they are
   - **WCAG**: 2.4.7 Focus Visible (Level AA)

4. **Missing Landmarks**
   - No semantic HTML5 landmarks (`<main>`, `<nav>`, `<aside>`)
   - **Impact**: Screen reader users can't navigate by region
   - **WCAG**: 1.3.1 Info and Relationships (Level A)

5. **Form Accessibility Issues**
   - Many forms lack proper labels
   - Error messages not associated with fields
   - No live regions for dynamic errors
   - **WCAG**: 3.3.1 Error Identification (Level A), 3.3.2 Labels or Instructions (Level A)

6. **Missing Alt Text**
   - Images in components often lack descriptive alt text
   - Decorative images not marked with alt=""
   - **WCAG**: 1.1.1 Non-text Content (Level A)

7. **Color Contrast Issues**
   - Need audit of all text/background combinations
   - Placeholder text often too light
   - **WCAG**: 1.4.3 Contrast (Minimum) (Level AA)

8. **No Reduced Motion Support**
   - Animations/transitions don't respect prefers-reduced-motion
   - **Impact**: Users with vestibular disorders
   - **WCAG**: 2.3.3 Animation from Interactions (Level AAA)

### 9.2 Component-Level Accessibility Issues

#### Editor3 Components

**QuizEditor** ([src/components/Editor3/components/QuizEditor.js](src/components/Editor3/components/QuizEditor.js))
- ❌ No ARIA labels for quiz questions
- ❌ No role="group" for question sets
- ❌ Answer choices not properly associated with questions
- ❌ No aria-invalid/aria-describedby for wrong answers
- ❌ Progress not announced to screen readers
- ✅ Has keyboard selection (from BLOCK_ACCESSIBILITY_STANDARDIZATION.md)

**AnswerEditor** ([src/components/Editor3/components/AnswerEditor.js](src/components/Editor3/components/AnswerEditor.js))
- ❌ Input methods (text/audio/drawing) not announced
- ❌ No aria-label on input toggle buttons
- ❌ Verification feedback not in live region
- ✅ Has some aria-controls/aria-haspopup for menus

**FileManager2** ([src/components/Editor3/components/FileManager2.js](src/components/Editor3/components/FileManager2.js))
- ❌ 4234 lines, likely many a11y issues
- ❌ No aria-labels on icon-only buttons
- ❌ File upload drag-drop not keyboard accessible
- ❌ Search mode toggles unlabeled
- ❌ No aria-live for search results count
- ⚠️ Uses tabIndex={-1} which may remove from tab order inappropriately

**AudioWaveformPlayer** ([src/components/Editor3/components/AudioWaveformPlayer.js](src/components/Editor3/components/AudioWaveformPlayer.js))
- ❌ Waveform canvas not accessible to screen readers
- ❌ No text alternative for audio content
- ❌ Playback controls missing ARIA labels
- ❌ Progress slider needs aria-valuemin/max/now
- ❌ Recording state not announced

**RecordingStudio2/3**
- ❌ Recording state changes not announced
- ❌ Icon-only buttons (Play/Pause/Stop/Record) lack labels
- ❌ Waveform visualization not accessible

**FileMetadataComponent**
- ❌ Tabs lack proper keyboard navigation
- ❌ No keyboard shortcut to close/remove
- ✅ Has role="tabpanel" and aria-labelledby

**TableComponent**
- ⚠️ Complex table navigation, needs testing
- ❌ Likely missing scope attributes
- ❌ Sortable headers need aria-sort
- ✅ Has some tabIndex management

#### Main Application Components

**Navigation Menu** ([src/menu.js](src/menu.js))
- ✅ Good ARIA labels on icon buttons
- ✅ aria-controls and aria-haspopup properly used
- ✅ aria-label on search input
- ⚠️ Mobile menu drawer needs focus trap
- ❌ Menu items need role="menuitem"

**ChatSidebar** ([src/components/ChatSidebar.js](src/components/ChatSidebar.js))
- ❌ Chat messages need role="log" or role="status"
- ❌ Streaming messages not announced incrementally
- ❌ File uploads not keyboard accessible (onClick on ref.click())
- ❌ Icon-only buttons lack labels
- ✅ Has onKeyPress for Enter key on input

**DictionaryEditor2**
- ❌ DataGrid accessibility needs verification
- ❌ Expand/collapse buttons unlabeled
- ❌ Edit mode changes not announced
- ❌ Delete confirmations need proper dialog role

**SectionAssigner**
- ✅ Dialog has aria-labelledby/describedby
- ❌ Checkbox selection needs better labels
- ❌ Assignment creation form needs validation feedback

### 9.3 Keyboard Navigation Gaps

**Components Missing Full Keyboard Support:**

1. **FileManager2**
   - Drag-drop file upload: No keyboard alternative
   - File selection: Click-only
   - Context menus: Right-click only
   - Fix: Add Enter/Space handlers, keyboard shortcuts

2. **SketchPad** (drawing component)
   - Canvas drawing: Mouse-only
   - No keyboard drawing alternative
   - Fix: Provide text input alternative, or skip link

3. **Image Resizing** (ImageComponent)
   - Resize handles: Mouse drag only
   - Fix: Arrow key + modifier for resize

4. **Draggable Blocks**
   - Block reordering: Mouse drag only
   - Fix: Ctrl+Up/Down for reordering

5. **Color Picker** (mentioned in CUSTOM_BLOCKS_PLAN.md)
   - Noted as missing keyboard support
   - Fix: Arrow keys for hue/saturation, Tab for inputs

### 9.4 Screen Reader Issues

**Dynamic Content Not Announced:**

1. **Quiz Feedback**
   - Correct/incorrect answers appear visually
   - Not in aria-live region
   - Fix: Add aria-live="polite" to feedback containers

2. **File Upload Progress**
   - Upload percentage shown visually
   - Progress bar needs aria-label with percentage
   - Fix: aria-label="Upload progress: 45%"

3. **Grade Calculation**
   - Score updates not announced
   - Fix: aria-live region for score changes

4. **Search Results**
   - Result count not announced
   - Loading state not announced
   - Fix: aria-live="polite" for result messages

5. **Chat Streaming**
   - AI responses stream in character-by-character
   - Screen reader doesn't announce until complete
   - Fix: aria-live="polite" on message container

**Missing Semantic Structure:**

1. **Editor Content**
   - Lexical editor content needs proper heading hierarchy
   - Custom blocks (quiz, answer) need semantic roles
   - Fix: Ensure h1 → h2 → h3 nesting, add role="article" to blocks

2. **Form Groups**
   - Related form fields not grouped
   - Fix: Use `<fieldset>` and `<legend>`

3. **Lists**
   - File lists, word lists not using `<ul>`/`<li>`
   - Fix: Use semantic list elements or role="list"

### 9.5 WCAG 2.1 Compliance Checklist

#### Level A (Must Have)

| Criterion | Status | Issue | Priority |
|-----------|--------|-------|----------|
| 1.1.1 Non-text Content | ❌ Partial | Missing alt text on many images | Critical |
| 1.3.1 Info and Relationships | ❌ Partial | No landmarks, improper heading hierarchy | Critical |
| 1.3.2 Meaningful Sequence | ⚠️ Unknown | Needs testing with screen reader | High |
| 1.3.3 Sensory Characteristics | ✅ Pass | No issues found | - |
| 1.4.1 Use of Color | ⚠️ Needs Audit | Color-only indicators? | High |
| 1.4.2 Audio Control | ✅ Pass | Audio can be paused | - |
| 2.1.1 Keyboard | ❌ Fail | Drag-drop, canvas, some menus | Critical |
| 2.1.2 No Keyboard Trap | ⚠️ Unknown | Needs testing | High |
| 2.1.4 Character Key Shortcuts | ✅ Pass | No single-char shortcuts | - |
| 2.2.1 Timing Adjustable | ⚠️ Unknown | Are there timed interactions? | Medium |
| 2.2.2 Pause, Stop, Hide | ⚠️ Unknown | Auto-playing content? | Medium |
| 2.3.1 Three Flashes | ✅ Pass | No flashing content | - |
| 2.4.1 Bypass Blocks | ❌ Fail | No skip links | Critical |
| 2.4.2 Page Titled | ✅ Pass | Next.js handles titles | - |
| 2.4.3 Focus Order | ⚠️ Partial | Some components OK, some not | High |
| 2.4.4 Link Purpose | ✅ Pass | Links are descriptive | - |
| 2.5.1 Pointer Gestures | ⚠️ Unknown | Touch gestures? | Medium |
| 2.5.2 Pointer Cancellation | ✅ Pass | onClick used (not onMouseDown) | - |
| 2.5.3 Label in Name | ⚠️ Unknown | Needs audit | Medium |
| 2.5.4 Motion Actuation | ✅ Pass | No device motion | - |
| 3.1.1 Language of Page | ✅ Pass | lang="en" set | - |
| 3.2.1 On Focus | ✅ Pass | No auto-submit on focus | - |
| 3.2.2 On Input | ✅ Pass | No unexpected context changes | - |
| 3.3.1 Error Identification | ❌ Fail | Errors not properly announced | Critical |
| 3.3.2 Labels or Instructions | ❌ Partial | Many forms lack labels | Critical |
| 4.1.1 Parsing | ✅ Pass | Valid HTML (React) | - |
| 4.1.2 Name, Role, Value | ❌ Partial | Custom components missing ARIA | Critical |
| 4.1.3 Status Messages | ❌ Fail | No aria-live regions | High |

**Level A Score: ~60%** (Many critical failures)

#### Level AA (Should Have)

| Criterion | Status | Issue | Priority |
|-----------|--------|-------|----------|
| 1.3.4 Orientation | ✅ Pass | Responsive design | - |
| 1.3.5 Identify Input Purpose | ❌ Fail | No autocomplete attributes | Medium |
| 1.4.3 Contrast (Minimum) | ⚠️ Needs Audit | Unknown contrast ratios | High |
| 1.4.4 Resize Text | ⚠️ Unknown | Test at 200% zoom | Medium |
| 1.4.5 Images of Text | ✅ Pass | Text is text | - |
| 1.4.10 Reflow | ⚠️ Unknown | Test at 320px width | Medium |
| 1.4.11 Non-text Contrast | ⚠️ Unknown | UI component contrast | Medium |
| 1.4.12 Text Spacing | ⚠️ Unknown | Test with increased spacing | Low |
| 1.4.13 Content on Hover | ⚠️ Unknown | Tooltips dismissible? | Medium |
| 2.4.5 Multiple Ways | ✅ Pass | Navigation, search | - |
| 2.4.6 Headings and Labels | ❌ Partial | Inconsistent heading levels | High |
| 2.4.7 Focus Visible | ❌ Fail | outline: none in many places | Critical |
| 3.1.2 Language of Parts | ⚠️ Unknown | Japanese text marked as lang="ja"? | Low |
| 3.2.3 Consistent Navigation | ✅ Pass | Nav is consistent | - |
| 3.2.4 Consistent Identification | ✅ Pass | Consistent UI patterns | - |
| 3.3.3 Error Suggestion | ❌ Fail | No correction suggestions | Medium |
| 3.3.4 Error Prevention | ❌ Partial | Some confirmations, not all | Medium |
| 4.1.3 Status Messages | ❌ Fail | (duplicate from Level A) | High |

**Level AA Score: ~45%** (Failing accessibility)

### 9.6 Implementation Plan

#### Phase 1: Critical Fixes (Week 1, 16 hours)

**Focus: Level A Blockers**

1. **Add Skip Navigation** (2 hours)
```jsx
// pages/_app.js
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

// src/theme.js - Add styles
skipLink: {
  position: 'absolute',
  top: '-40px',
  left: 0,
  background: '#000',
  color: '#fff',
  padding: '8px',
  zIndex: 100,
  '&:focus': {
    top: 0,
  }
}
```

2. **Add Semantic Landmarks** (3 hours)
```jsx
// Update all pages to use:
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main id="main-content" role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
```

3. **Fix Focus Management** (4 hours)
```jsx
// pages/_app.js - Focus on route change
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const mainRef = useRef(null);
  
  useEffect(() => {
    const handleRouteChange = () => {
      mainRef.current?.focus();
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);
  
  return <main ref={mainRef} tabIndex={-1}>...</main>;
}
```

4. **Restore Focus Outlines** (2 hours)
```css
/* src/components/Editor3/theme.css */
/* REMOVE outline: none */
/* ADD custom focus styles */
*:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* Keep outline: none only for mouse users */
*:focus:not(:focus-visible) {
  outline: none;
}
```

5. **Add Critical ARIA Labels** (5 hours)
   - Icon-only buttons in all components
   - Form inputs throughout app
   - Custom components (quiz, answer blocks)

#### Phase 2: Form Accessibility (Week 2, 12 hours)

1. **Associate Labels with Inputs** (4 hours)
```jsx
// Example: FileManager2 search
<TextField
  id="file-search-input"
  label="Search files"
  aria-label="Search files by name or content"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  aria-describedby={searching ? "search-status" : undefined}
/>
<span id="search-status" role="status" aria-live="polite">
  {searching ? "Searching..." : `${results.length} results found`}
</span>
```

2. **Add Error Announcements** (4 hours)
```jsx
// Example pattern for all forms
const [error, setError] = useState(null);

<TextField
  error={!!error}
  aria-invalid={!!error}
  aria-describedby={error ? "field-error" : undefined}
/>
{error && (
  <FormHelperText id="field-error" role="alert">
    {error}
  </FormHelperText>
)}
```

3. **Add autocomplete Attributes** (2 hours)
```jsx
<TextField
  name="email"
  type="email"
  autoComplete="email"
  ...
/>
```

4. **Field Validation & Live Regions** (2 hours)
   - aria-live="polite" for non-critical messages
   - role="alert" for errors

#### Phase 3: Keyboard Navigation (Week 3, 20 hours)

1. **FileManager2 Keyboard Access** (8 hours)
   - File selection: Enter/Space
   - Multi-select: Shift+Arrow, Ctrl+A
   - Context menu: Application/Menu key
   - File upload: Keyboard button instead of hidden input click
   - Delete: Delete key
   
```jsx
const handleKeyDown = (e, fileId) => {
  switch(e.key) {
    case 'Enter':
    case ' ':
      toggleSelection(fileId);
      break;
    case 'Delete':
      if (selectedItems.has(fileId)) {
        handleDelete();
      }
      break;
    case 'a':
      if (e.ctrlKey || e.metaKey) {
        selectAll();
      }
      break;
  }
};

<div
  role="row"
  tabIndex={0}
  onKeyDown={(e) => handleKeyDown(e, file.id)}
  aria-selected={selectedItems.has(file.id)}
>
  ...
</div>
```

2. **AudioWaveformPlayer Keyboard** (4 hours)
   - Play/Pause: Space or K
   - Seek: Arrow keys (5s), Shift+Arrow (10s)
   - Volume: Up/Down arrows
   - Mute: M key
   
```jsx
<div
  role="region"
  aria-label={`Audio player: ${title}`}
  onKeyDown={handlePlayerKeyDown}
  tabIndex={0}
>
  <button aria-label="Play" onClick={play}>▶️</button>
  <input
    type="range"
    role="slider"
    aria-label="Seek"
    aria-valuemin={0}
    aria-valuemax={duration}
    aria-valuenow={currentTime}
    aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
  />
</div>
```

3. **Image Resize Keyboard Support** (3 hours)
   - Ctrl+Arrow keys to resize
   - Escape to cancel
   - Enter to confirm

4. **Block Drag-Drop Keyboard Alternative** (5 hours)
   - Ctrl+Up/Down to reorder
   - Or: Focus block, press M (move mode), arrow keys, Enter

#### Phase 4: Screen Reader Support (Week 4, 16 hours)

1. **Add Live Regions** (6 hours)
```jsx
// Quiz feedback
<div aria-live="polite" aria-atomic="true">
  {feedback && <Alert>{feedback}</Alert>}
</div>

// File upload progress
<div role="status" aria-live="polite" aria-label={`Upload progress: ${percent}%`}>
  <LinearProgress value={percent} />
</div>

// Search results
<div role="status" aria-live="polite">
  {!searching && `Found ${results.length} results`}
</div>
```

2. **Canvas Alternatives** (4 hours)
```jsx
// Waveform
<canvas aria-hidden="true">...</canvas>
<div className="sr-only">
  Audio duration: {formatTime(duration)}, 
  Current position: {formatTime(currentTime)}
</div>

// SketchPad
<canvas aria-label="Drawing canvas">...</canvas>
<button onClick={() => setDrawingMode(false)}>
  Switch to text input
</button>
```

3. **Semantic Structure** (4 hours)
   - Proper heading hierarchy (h1 → h2 → h3)
   - role="article" for quiz/answer blocks
   - role="list" for file/word lists
   - role="log" for chat messages

4. **ARIA Descriptions** (2 hours)
   - aria-describedby for complex interactions
   - Instructions for non-obvious UI

#### Phase 5: Testing & Refinement (Week 5, 16 hours)

1. **Automated Testing** (6 hours)
   - Install axe-core for Cypress
   - Add accessibility tests to all Cypress specs
   - Configure axe rules for WCAG 2.1 AA
   
```javascript
// cypress/support/commands.js
import 'cypress-axe';

Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y(null, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
    }
  });
});

// Use in tests
it('should be accessible', () => {
  cy.visit('/units');
  cy.checkA11y();
});
```

2. **Manual Screen Reader Testing** (6 hours)
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Complete user workflows:
     - Create assignment
     - Submit answers
     - Upload file
     - Search dictionary
   - Document issues

3. **Keyboard-Only Testing** (2 hours)
   - Unplug mouse
   - Complete all workflows
   - Verify focus indicators
   - Check tab order

4. **Color Contrast Audit** (2 hours)
   - Use browser dev tools or Lighthouse
   - Check all text/background pairs
   - Fix ratios < 4.5:1 (or 3:1 for large text)

#### Phase 6: Documentation & Training (Week 6, 8 hours)

1. **Create Accessibility Guide** (4 hours)
```markdown
# docs/ACCESSIBILITY_GUIDE.md

## Overview
This app targets WCAG 2.1 Level AA compliance.

## Development Standards
- All images must have alt text
- All interactive elements keyboard accessible
- Forms must have labels
- Dynamic content in aria-live regions
- Color is not the only visual differentiator
- Minimum contrast ratio: 4.5:1

## Testing Checklist
- [ ] Axe tests pass
- [ ] Keyboard navigation works
- [ ] Screen reader announces content
- [ ] Focus indicators visible
- [ ] Forms have labels and error messages
```

2. **Component Accessibility Patterns** (2 hours)
   - Document reusable patterns
   - Example: Accessible modal, accessible menu, etc.

3. **Add to Storybook** (2 hours)
   - Install @storybook/addon-a11y
   - Enable for all stories
   - Fix issues highlighted

### 9.7 Priority Summary

**Critical (Do First):**
1. Skip navigation links
2. Focus management
3. Restore focus outlines
4. ARIA labels on icon buttons
5. Form labels and error announcements
6. Keyboard access to FileManager2

**High Priority:**
7. Live regions for dynamic content
8. Semantic landmarks
9. Keyboard shortcuts for editor
10. Screen reader testing

**Medium Priority:**
11. Color contrast audit
12. Heading hierarchy
13. Canvas alternatives
14. autocomplete attributes

**Low Priority:**
15. lang attributes for Japanese text
16. Reduced motion support
17. Documentation

### 9.8 Tools & Resources

**Testing Tools:**
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome
- [cypress-axe](https://github.com/component-driven/cypress-axe) - Automated testing
- [@storybook/addon-a11y](https://storybook.js.org/addons/@storybook/addon-a11y) - Storybook addon

**Screen Readers:**
- NVDA (Windows, free)
- JAWS (Windows, paid)
- VoiceOver (Mac/iOS, built-in)
- TalkBack (Android, built-in)

**Learning Resources:**
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [The A11Y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

### 9.9 Estimated Effort

**Total Accessibility Work: 88 hours (11 days)**

- Phase 1: Critical fixes (16 hours)
- Phase 2: Forms (12 hours)
- Phase 3: Keyboard navigation (20 hours)
- Phase 4: Screen reader support (16 hours)
- Phase 5: Testing (16 hours)
- Phase 6: Documentation (8 hours)

**Quick Wins (Can do immediately, ~4 hours):**
1. Add skip links (30 min)
2. Fix focus outlines in CSS (30 min)
3. Add ARIA labels to menu icon buttons (1 hour)
4. Set autocomplete on email/password fields (30 min)
5. Add alt text to existing images (1.5 hours)

### 9.10 Success Metrics

- ✅ Lighthouse accessibility score >90
- ✅ Zero critical axe violations
- ✅ All user workflows completable via keyboard only
- ✅ All user workflows completable with screen reader
- ✅ WCAG 2.1 Level AA compliance
- ✅ No user reports of accessibility blockers

---

## Summary (Updated with Accessibility)

**Total Estimated Effort**: 238 hours (6 weeks at 40hr/week)

- Documentation: 24 hours
- Storybook: 40 hours  
- Testing Infrastructure: 40 hours
- State Refactoring: 46 hours
- **Accessibility: 88 hours**
