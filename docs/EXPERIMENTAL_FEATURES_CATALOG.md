# Experimental & Beta Features Catalog

**Last Updated:** January 6, 2026

This document catalogs all experimental, beta, or not-fully-tested features in the Homework Supply platform. These features can be disabled via configuration for production stability.

---

## 🤖 AI-Powered Features

### 1. **AI Chat Assistant** (ChatSidebar)
**Status:** ⚠️ EXPERIMENTAL  
**Files:** 
- `src/components/ChatSidebar.js`
- `pages/api/chat.js`
- `src/utils/chatTools.js`

**Description:** Real-time AI chat using Vercel AI SDK with streaming responses and tool calling.

**Dependencies:**
- OpenAI GPT-4 API
- Vercel AI SDK (@ai-sdk/react, @ai-sdk/openai)
- Vector store context for semantic search

**Risk Factors:**
- OpenAI API costs can escalate with heavy usage
- Streaming responses may fail on poor connections
- Tool calling is still in beta with AI SDK v3
- Limited error recovery for failed tool executions

**Resource Impact:**
- High: Requires Lambda invocations + OpenAI API calls per message
- Memory: Loads entire chat history into context

**Testing Status:** ❌ No automated tests

---

### 2. **AI Block Suggestions** (BlockSuggestionPlugin)
**Status:** ⚠️ EXPERIMENTAL (Phase 3)  
**Files:**
- `src/components/Editor3/plugins/BlockSuggestionPlugin.js`
- `src/components/Editor3/components/BlockSuggestionMenu.jsx`
- `src/components/Editor3/context/SuggestionContext.js`
- `pages/api/suggest-block.js` (if exists)

**Description:** GPT-4 analyzes lesson structure and suggests next blocks with pedagogical reasoning.

**Dependencies:**
- OpenAI GPT-4 API
- Lexical editor state

**Risk Factors:**
- Falls back to rule-based suggestions if API fails
- Can suggest inappropriate blocks for non-pedagogical content
- Debounce delay (500ms) may feel sluggish
- No user history tracking implemented (marked TODO)

**Resource Impact:**
- Medium: GPT-4 call on every cursor position change (debounced)

**Testing Status:** ❌ No automated tests

**Fallback:** ✅ Rule-based suggestions if AI disabled

---

### 3. **AI Content Completion** (Autocomplete)
**Status:** ⚠️ EXPERIMENTAL  
**Files:**
- `src/components/Editor3/plugins/AIContentCompletionPlugin.js`
- `src/components/Editor3/plugins/AutocompletePlugin.js`

**Description:** AI-powered text completion suggestions while typing.

**Risk Factors:**
- Can interrupt typing flow with unwanted suggestions
- Latency may cause delayed completions
- No documented API rate limiting

**Resource Impact:**
- High: Calls OpenAI API on keystroke (debounced)

**Testing Status:** ⚠️ Stories only (AutocompletePlugin.stories.jsx)

---

### 4. **AI Feedback Collection** (AIFeedbackWidget)
**Status:** ✅ STABLE (Recently implemented)  
**Files:**
- `src/components/AIFeedbackWidget.tsx`
- `src/utils/aiFeedbackUtils.ts`
- `amplify/backend/api/japanese5/schema.graphql` (AIFeedback model)

**Description:** Thumbs up/down feedback on all AI-generated content.

**Dependencies:**
- DataStore (AIFeedback model)
- Requires schema push and SCHEMA_VERSION increment

**Risk Factors:**
- New feature, minimal production usage
- No bulk feedback analysis tools yet

**Resource Impact:**
- Low: Simple DataStore writes

**Testing Status:** ✅ Storybook stories (AIFeedbackWidget.stories.jsx)

---

### 5. **Document Analysis & Vocabulary Extraction**
**Status:** ⚠️ BETA  
**Files:**
- `amplify/backend/function/analyzeDocument/`
- `src/components/VocabularyReview.js`
- `src/utils/fileUploadUtils.js` (uploadAndAnalyzePDF, analyzePDF)

**Description:** Uploads PDFs/documents, extracts text, generates vocabulary with AI.

**Dependencies:**
- Lambda function (analyzeDocument)
- OpenAI API for text extraction and vocabulary generation
- Document/ParsedContent models

**Risk Factors:**
- OCR quality varies by PDF quality
- Long-running process (can be cancelled)
- Status tracking via Document model updates
- Can fail mid-process with partial results

**Resource Impact:**
- High: Lambda + OpenAI API (GPT-4 Vision for OCR)
- S3 storage for uploaded documents

**Testing Status:** ❌ No automated tests

**Cancellation:** ✅ Supports cancel via cancelDocumentAnalysis mutation

---

## 🔍 Vector Store & Semantic Search

### 6. **Local Vector Store** (VectorStoreContext)
**Status:** ⚠️ EXPERIMENTAL  
**Files:**
- `src/context/vectorStoreContext.js`
- `src/utils/vectorStoreDB.js`
- `src/utils/embeddingWorkerManager.js`
- `src/workers/embeddingWorker.js`
- `src/components/Editor3/components/FileManager2.js` (CourseVectorStore class)

**Description:** IndexedDB-backed vector store for semantic search using embeddings.

**Dependencies:**
- IndexedDB for persistence
- Web Workers for similarity calculations
- OpenAI embeddings (text-embedding-3-small)

**Risk Factors:**
- IndexedDB quota limits (browser-dependent)
- Worker thread failures fall back to main thread (performance hit)
- Embedding generation costs add up
- No automatic embedding updates when content changes

**Resource Impact:**
- Medium: IndexedDB storage (embeddings are ~1536 dimensions each)
- CPU: Similarity calculations in workers

**Testing Status:** ❌ No automated tests

**Browser Compatibility:** ⚠️ Requires IndexedDB and Web Worker support

---

### 7. **Embedding Generation & Management**
**Status:** ⚠️ BETA  
**Files:**
- `amplify/backend/function/generateEmbedding/`
- `amplify/backend/function/generateEmbeddings/`
- `src/hooks/useEmbeddings.js`
- `src/hooks/embeddingGenerator.js`

**Description:** Generates embeddings for Units, Words, Questions for semantic search.

**Dependencies:**
- Lambda functions
- OpenAI embeddings API
- DataStore models with embedding fields

**Risk Factors:**
- Embedding drift if content updated without regenerating
- No automatic regeneration triggers
- Costs scale with content volume

**Resource Impact:**
- High: OpenAI API costs per embedding

**Testing Status:** ❌ No automated tests

**Stored Fields:**
- `embedding` (JSON array)
- `embeddingModel` (string)
- `embeddingDimensions` (number)

---

## 🎙️ Audio & Media Features

### 8. **Audio Generation** (Text-to-Speech)
**Status:** ✅ STABLE  
**Files:**
- `amplify/backend/function/openai/` (generateAudioFile mutation)

**Description:** OpenAI TTS for vocabulary pronunciation.

**Risk Factors:**
- Audio quality depends on OpenAI TTS model
- S3 storage costs for audio files
- No caching strategy (may regenerate same audio)

**Resource Impact:**
- Medium: OpenAI TTS API + S3 storage

---

### 9. **Audio Transcription** (Speech-to-Text)
**Status:** ✅ STABLE  
**Files:**
- `amplify/backend/function/openai/` (verifyAudioUrl query)

**Description:** Whisper API for transcribing student recordings.

**Risk Factors:**
- Accuracy varies with audio quality
- Language detection may fail

**Resource Impact:**
- Medium: OpenAI Whisper API calls

---

### 10. **Recording Studio**
**Status:** ⚠️ INCOMPLETE (Multiple TODOs)  
**Files:**
- `src/components/RecordingStudio2.js`

**Description:** In-browser audio recording for vocabulary practice.

**Known Issues (from TODOs):**
- ❌ No way to delete recordings
- ❌ No multiple recording support
- ❌ Upload to S3 not implemented
- ❌ Load from S3 not implemented

**Risk Factors:**
- Browser API compatibility (MediaRecorder)
- Audio format inconsistencies across browsers

**Testing Status:** ❌ No automated tests

**Browser Compatibility:** ⚠️ Requires MediaRecorder API

---

## 🎨 Editor Features

### 11. **Collaborative Editing** (Yjs - Planned)
**Status:** 🚧 PLANNED (Not Implemented)  
**Files:**
- `YJS_NOTES.md`
- `YJS_PROVIDER_NOTES.md`
- `YJS_SELECTION.md`

**Description:** Real-time collaborative editing using Yjs.

**Current Status:** Documentation only, not implemented

---

### 12. **Drawing/Sketch Pad**
**Status:** ⚠️ BETA (TODO: Add versioning)  
**Files:**
- `src/components/Editor3/components/SketchPad.js`

**Description:** Canvas-based drawing tool for annotations.

**Known Issues:**
- ❌ No data versioning for conflict resolution

**Risk Factors:**
- Canvas data size can be large
- No compression strategy

---

### 13. **Tables** (Experimental Mode)
**Status:** 🚧 EXPERIMENTAL (Disabled by default)  
**Files:**
- `src/components/Editor3/plugins/ToolBarPlugin.js` (line 2532 comment)

**Description:** Table editing in Lexical.

**Current Status:** Commented out as "Experimental"

---

## 📊 Analytics & Tracking

### 14. **Settings System**
**Status:** ✅ STABLE (Recently expanded)  
**Files:**
- `src/context/settingsContext.js`
- `docs/SETTINGS.md`

**Description:** User preferences stored in Settings model.

**Features:**
- Language preferences
- Theme settings
- Feature flags (potential for disabling experimental features)

**Risk Factors:**
- Schema changes require SCHEMA_VERSION bumps

---

## 🔧 Infrastructure Features

### 15. **Offline Support** (Planned)
**Status:** 🚧 PLANNED  
**Files:**
- `docs/OFFLINE_HYBRID_ARCHITECTURE.md`

**Description:** Comprehensive offline-first architecture with sync.

**Current Status:** Detailed spec, not implemented

---

## 🎯 Feature Flag System (NOT YET IMPLEMENTED)

### Current State
**Status:** ⚠️ MENTIONED BUT NOT BUILT  
**File:** `src/components/MainToolbar.js` (line 135: "Experimental features" toggle)

**Description:** UI toggle exists but no backend implementation.

**What's Needed:**
1. Settings model field: `experimentalFeaturesEnabled: Boolean`
2. Feature flag checks in components
3. Conditional rendering based on flags
4. Admin-level feature flag management

---

## 📈 Recommended Configuration Strategy

### Phase 1: Add Feature Flags to Settings Model

```graphql
type Settings @model @auth(rules: [
  { allow: owner }
  { allow: groups, groups: ["Admins"] }
]) {
  # ... existing fields ...
  
  # Experimental Feature Flags
  enableAIChat: Boolean @default(value: "false")
  enableAIBlockSuggestions: Boolean @default(value: "false")
  enableAIContentCompletion: Boolean @default(value: "false")
  enableVectorSearch: Boolean @default(value: "false")
  enableDocumentAnalysis: Boolean @default(value: "true")
  enableCollaborativeEditing: Boolean @default(value: "false")
  
  # Admin-only flags
  enableAllExperimentalFeatures: Boolean @default(value: "false")
}
```

### Phase 2: Create Feature Flag Hook

```javascript
// src/hooks/useFeatureFlags.js
export const useFeatureFlags = () => {
  const { settings } = useContext(SettingsContext);
  
  return {
    aiChat: settings?.enableAIChat || false,
    aiBlockSuggestions: settings?.enableAIBlockSuggestions || false,
    aiContentCompletion: settings?.enableAIContentCompletion || false,
    vectorSearch: settings?.enableVectorSearch || false,
    documentAnalysis: settings?.enableDocumentAnalysis ?? true,
    collaborativeEditing: settings?.enableCollaborativeEditing || false,
  };
};
```

### Phase 3: Wrap Features with Flags

```javascript
// Example: ChatSidebar
const ChatTab = () => {
  const { aiChat } = useFeatureFlags();
  
  if (!aiChat) {
    return (
      <Typography color="text.secondary">
        AI Chat is currently disabled. Enable in Settings.
      </Typography>
    );
  }
  
  return <ChatSidebar />;
};
```

---

## 🎚️ Priority Recommendations

### Disable by Default (High Risk)
1. ❌ **AI Chat** - High API costs, experimental tool calling
2. ❌ **AI Block Suggestions** - Unproven pedagogical value, API costs
3. ❌ **AI Content Completion** - Can interrupt workflow
4. ❌ **Vector Store** - Browser storage limits, untested scale

### Enable by Default (Stable Enough)
1. ✅ **Document Analysis** - Useful, has cancellation
2. ✅ **Audio Generation/Transcription** - Proven APIs
3. ✅ **AI Feedback Widget** - Low risk, valuable data

### Not Ready for Production
1. 🚫 **Recording Studio** - Too many TODOs
2. 🚫 **Collaborative Editing** - Not implemented
3. 🚫 **Tables** - Commented out as experimental

---

## 📋 Next Steps

1. **Implement Feature Flag System**
   - Add fields to Settings model
   - Create useFeatureFlags hook
   - Wrap experimental components

2. **Add Feature Flag UI**
   - Settings page with toggles
   - Descriptions and warnings for each feature
   - Admin-only master switch

3. **Document Risk Levels**
   - Performance impact
   - Cost impact
   - Stability rating

4. **Create Testing Plan**
   - Automated tests for stable features
   - Manual test checklist for experimental features

5. **Production Readiness Audit**
   - Default flags for production launch
   - Monitoring strategy for enabled features
   - Rollback plan for failures

---

## 🔗 Related Documentation

- [ROADMAP.md](docs/ROADMAP.md) - Overall project timeline
- [AI_FEEDBACK_IMPLEMENTATION.md](AI_FEEDBACK_IMPLEMENTATION.md) - AI Feedback details
- [AI_BLOCK_SUGGESTIONS_PHASE3.md](docs/AI_BLOCK_SUGGESTIONS_PHASE3.md) - Block suggestions
- [SETTINGS.md](docs/SETTINGS.md) - Settings system documentation
- [TYPESCRIPT_MIGRATION.md](docs/TYPESCRIPT_MIGRATION.md) - TypeScript migration status
- [OFFLINE_HYBRID_ARCHITECTURE.md](docs/OFFLINE_HYBRID_ARCHITECTURE.md) - Offline support plans
