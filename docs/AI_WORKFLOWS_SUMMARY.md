# AI Workflows Summary - Homework Supply Platform

**Status**: Production Ready  
**Last Updated**: February 2, 2026  
**Platform**: Next.js + AWS Amplify Gen 2 + OpenAI

---

## Overview

This document summarizes all AI-powered workflows developed for the Homework Supply e-learning platform. These workflows enhance content creation, automate translations, provide intelligent assistance, and ensure quality through automated testing.

---

## 1. Educational Content Authoring System

**Purpose**: Help instructors create high-quality educational content with AI assistance

### Phase 1: Rule-Based Block Suggestions ✅
**Files**: 
- [BlockSuggestionPlugin.js](../src/components/Editor3/plugins/BlockSuggestionPlugin.js)
- [BlockSuggestionMenu.js](../src/components/Editor3/components/BlockSuggestionMenu.js)

**What It Does**:
- Pattern-matches content structure (Explanation → Practice → Quiz)
- Suggests pedagogically sound next blocks
- Floating menu appears on empty lines
- Keyboard navigation (↑↓ to browse, Tab to select)

**Performance**:
- Response: Instant (< 1ms)
- Cost: $0 (rule-based)
- Works offline: ✅

**Example**:
```
After typing explanation about particles:
┌─────────────────────────────────┐
│ 💡 Suggested blocks:            │
│   ✍️ Add Vocabulary Practice    │
│   📋 Add Custom Practice        │
│   📊 Add Quiz                   │
└─────────────────────────────────┘
```

### Phase 2: AI Content Completion ✅
**Files**:
- [AIContentCompletionPlugin.js](../src/components/Editor3/plugins/AIContentCompletionPlugin.js)
- [AIContentSuggestion.js](../src/components/Editor3/components/AIContentSuggestion.js)
- [pages/api/complete.js](../pages/api/complete.js)

**What It Does**:
- Streams sentence/paragraph completions as you write
- Ghost text display (GitHub Copilot style)
- Context-aware (understands unit topic)
- Triggered after sentence end + 800ms pause

**Performance**:
- Response: 1-3 seconds (streaming)
- Cost: ~$0.001 per suggestion
- Model: GPT-4o

**Example**:
```
You type: "Hiragana is one of three Japanese writing systems."
AI suggests: "It consists of 46 basic characters..."
Press Tab to accept →
```

### Phase 3: AI Block Suggestions ✅
**Files**:
- [pages/api/suggest-block.js](../pages/api/suggest-block.js)
- Enhanced BlockSuggestionPlugin with `useAI={true}`

**What It Does**:
- GPT-4o analyzes entire lesson structure
- Provides pedagogical reasoning for each suggestion
- Priority levels: HIGH/MEDIUM/LOW
- Falls back to Phase 1 if API fails

**Performance**:
- Response: 1-3 seconds
- Cost: ~$0.002 per suggestion
- Model: GPT-4o

**Example**:
```
After 3 consecutive explanations:
┌──────────────────────────────────────────┐
│ 🤖 Add Vocabulary Practice - HIGH        │
│ "After three explanations, learners need │
│ active recall. Practice prevents passive │
│ learning and reinforces particles."      │
└──────────────────────────────────────────┘
```

**Monthly Cost Estimate**: ~$11 for 10 active instructors
- Phase 1: $0
- Phase 2: $0.50
- Phase 3: $0.40
- Chat: $10.00

---

## 2. AI Feedback Collection System ✅

**Purpose**: Collect user feedback on all AI-generated content for continuous improvement

**Files**:
- [AIFeedbackWidget.tsx](../src/components/AIFeedbackWidget.tsx)
- [aiFeedbackUtils.ts](../src/utils/aiFeedbackUtils.ts)
- [schema.graphql](../amplify/data/resource.ts) - AIFeedback model

**What It Does**:
- Thumbs up/down ratings on AI content
- Predefined reasons for negative feedback
- Optional free-text comments
- Auto-tracking of content completion dismissals

**Content Types Supported** (10):
1. `CHAT_MESSAGE` - AI assistant responses
2. `CONTENT_COMPLETION` - Editor auto-completion
3. `AUDIO_GENERATION` - Generated audio files
4. `IMAGE_GENERATION` - Generated images
5. `DOCUMENT_ANALYSIS` - PDF analysis results
6. `VOCABULARY_EXTRACTION` - Extracted vocabulary
7. `TRANSCRIPTION` - Audio transcription
8. `IMAGE_DESCRIPTION` - Image descriptions
9. `GRADING_FEEDBACK` - Automated grading
10. `BLOCK_SUGGESTION` - Content block suggestions

**Feedback Reasons**:
- Inaccurate information
- Poor quality
- Inappropriate tone/language
- Not relevant
- Too short/long
- Grammatical errors

**Data Collected**:
- Content type and sentiment
- AI model used
- Prompt and generated content
- Related entities (unit, grade, document)
- User identification
- Timestamps

**Integration Example**:
```jsx
<AIFeedbackWidget
  contentType="CHAT_MESSAGE"
  generatedContent={message.content}
  model="gpt-4o"
  unitId={currentUnit.id}
/>
```

---

## 3. Intelligent Chatbot with Tool Calling ✅

**Purpose**: Enable natural language database operations and content creation

**Files**:
- [ChatSidebar.js](../src/components/ChatSidebar.js)
- [chatTools.js](../src/utils/chatTools.js)
- [pages/api/chat.js](../pages/api/chat.js)

**Architecture**:
- Uses Vercel AI SDK v6 with `experimental_tools`
- Client-side tool execution (DataStore access)
- Automatic execution with `experimental_sendAutomaticallyWhen`
- Streaming responses via Edge Runtime

### Client-Side CRUD Tools (12 tools)

**Search Tools** (2):
- `search_content` - Semantic search using embeddings (Files, Words, Questions)
- `search_content_files` - File-specific search

**List Tools** (3):
- `list_sections` - List all class sections
- `list_units` - List all learning units
- `get_unit_details` - Get detailed unit information

**Create Tools** (5):
- `create_section` - Create new class section
- `create_unit` - Create new learning unit
- `create_vocabulary_word` - Add vocabulary to dictionary
- `create_question` - Add practice question
- `create_assignment` - Assign unit to section with due date

**Update Tools** (2):
- `add_timer_to_unit` - Add/update time limit
- `update_unit` - Update unit properties

**Delete Tools** (1):
- `delete_assignment` - Remove assignment

### Server-Side Block Tools (4 tools)
- Insert quiz block
- Insert answer block
- Insert meaning association block
- Insert custom answer block

**Example Usage**:
```
User: "Create a unit called 'Kanji Basics' with a 30 minute timer 
       and assign it to Section A due next Monday at 3pm"

Flow:
1. GPT-4 calls create_unit → Returns new unit ID
2. GPT-4 calls create_assignment → Returns assignment
3. GPT-4 responds: "I've created the unit 'Kanji Basics' 
   with a 30-minute timer and assigned it to Section A..."
```

**Semantic Search Implementation**:
- Uses `text-embedding-3-small` (512 dimensions)
- Cosine similarity ranking
- Fallback to keyword search if no embeddings

---

## 4. LLM-as-a-Judge Automated Testing ✅

**Purpose**: Automatically test all chat tools using AI evaluation

**Files**:
- [test-chat-tools-llm-judge.ts](../scripts/test-chat-tools-llm-judge.ts)

**What It Does**:
- Uses Claude 4.5 to evaluate tool execution quality
- Tests all 12 CRUD tools automatically
- Scores 0-100 with detailed reasoning
- Generates JSON reports
- Tracks created resources

**Usage**:
```bash
# Run all tests
npx tsx scripts/test-chat-tools-llm-judge.ts

# Verbose output
npx tsx scripts/test-chat-tools-llm-judge.ts --verbose

# Test specific tool
npx tsx scripts/test-chat-tools-llm-judge.ts --tool=create_section
```

**Output**:
```
🤖 LLM-as-a-Judge: Chat Tools Testing

Running 14 tests...

📋 Testing: create_section
   ✓ PASSED (88/100)

📊 Test Summary
Total Tests: 14
Passed: 12
Failed: 2
Pass Rate: 85.7%
```

**Evaluation Criteria**:
- Was correct tool called?
- Were parameters appropriate?
- Did execution succeed?
- Was response quality good?
- Any errors or issues?

**Cost**: ~$0.04 per full test run (14 tests)  
**Monthly**: ~$12 for continuous testing (10 runs/day)

---

## 5. Multi-Model Translation System ✅

**Purpose**: High-quality translations with consensus validation and cryptographic proof

**Files**:
- [.github/skills/multi-model-ai-translation/](../.github/skills/multi-model-ai-translation/)
- [translate-with-proof.ts](../.github/skills/multi-model-ai-translation/scripts/translate-with-proof.ts)

**Architecture**:
- Parallel execution across 3 AI models
  - Claude Sonnet 4 (best for context/nuance)
  - GPT-4o (fast, multilingual)
  - Gemini 2.0 Flash (fastest, Asian languages)
- Consensus analysis (3/3, 2/3, 0/3 agreement)
- Reverse translation verification
- Cryptographic proof generation

**Modes**:

**Fake Mode** (Free, Fast):
- Uses Claude to simulate all models
- No API costs
- Demo/testing only
- No cryptographic proof

**Provable Mode** (~$5-10):
- Actual parallel API calls
- SHA-256 fingerprints
- Request IDs for verification
- Auditable in provider dashboards

**Workflow**:
1. **Multi-Model Translation**: Send to all 3 models in parallel
2. **Consensus Analysis**: Compare outputs key-by-key
3. **Reverse Translation**: Translate back to source language
4. **Semantic Similarity**: Calculate meaning preservation (0.0-1.0)
5. **Proof Generation**: Create verification document

**Consensus Levels**:
- **Full (3/3)**: All models agree - use with confidence
- **Partial (2/3)**: Majority wins - flag for review
- **None (0/3)**: All differ - human review required

**Semantic Similarity Thresholds**:
- 0.95-1.0: Excellent (meaning preserved)
- 0.85-0.94: Good (minor paraphrasing)
- 0.70-0.84: Fair (semantic drift detected)
- <0.70: Poor (meaning changed - FAIL)

**Use Cases**:
- UI localization (11 namespaces translated to Chinese)
- Legal documents (requires provable mode)
- Technical documentation
- Marketing content

**Example**:
```bash
# Translate auth namespace to Chinese
npx tsx .github/skills/multi-model-ai-translation/scripts/translate-with-proof.ts auth en zh
```

**Output Structure**:
```json
{
  "translation": "最终共识翻译",
  "consensus": {
    "level": "partial",
    "agreement": 0.67,
    "differences": [...]
  },
  "verification": {
    "passed": true,
    "semanticSimilarity": 0.95
  },
  "proof": {
    "fingerprints": { ... },
    "requestIds": { ... },
    "verified": true
  }
}
```

---

## 6. OpenAI Lambda Functions

**Purpose**: Backend AI operations via GraphQL API

**Files**:
- [amplify/functions/openai/handler.ts](../amplify/functions/openai/handler.ts)

### Text Operations
- Chat completions (GPT-4, GPT-4o)
- Text verification (definitions, words, short answers)
- Content generation

### Audio Operations
- **Transcription**: Whisper (files and URLs)
- **Generation**: TTS (sync and async)
- **Verification**: Audio grading with feedback

**Example Mutations**:
```graphql
# Transcribe audio file
mutation TranscribeAudio($url: String!) {
  transcribeUrl(url: $url)
}

# Generate audio (async)
mutation GenerateAudio($text: String!, $voice: String!) {
  generateAudioFile(text: $text, voice: $voice) {
    fileID
    status
  }
}
```

### Image Operations
- **Generation**: DALL-E (sync and async)
- **Analysis**: GPT-4 Vision
- **Verification**: Image descriptions

**Example Queries**:
```graphql
# Analyze image
query ProcessImage($url: String!) {
  processImageUrl(url: $url)
}

# Generate image
mutation GenerateImage($prompt: String!) {
  generateImage(prompt: $prompt)
}
```

### Embeddings
- **Model**: `text-embedding-3-small`
- **Dimensions**: 512
- **Used for**: Semantic search across Units, Words, Questions

**Example**:
```graphql
mutation GenerateEmbedding($content: String!) {
  generateEmbedding(content: $content) {
    embedding
    model
    dimensions
  }
}
```

---

## 7. Document Analysis Pipeline ✅

**Purpose**: Extract text and vocabulary from PDF documents

**Files**:
- [amplify/functions/documentAnalysis/handler.ts](../amplify/functions/documentAnalysis/handler.ts)

**Workflow**:
```
Upload PDF → Extract Text → Analyze Vocabulary → Create Records
   ↓            ↓              ↓                   ↓
uploaded → extracting → analyzing → completed
```

**Features**:
- 900-second timeout (15 minutes)
- 512MB memory allocation
- Cancellable mid-process
- Owner-based authorization
- Phoenix tracing integration

**Status Tracking**:
1. `uploaded` - File uploaded to S3
2. `extracting` - Text extraction in progress
3. `analyzing` - Vocabulary analysis running
4. `completed` - Analysis finished

**Mutations**:
```graphql
# Start analysis
mutation AnalyzeDocument($fileID: ID!) {
  analyzeDocument(fileID: $fileID) {
    id
    status
  }
}

# Cancel analysis
mutation CancelAnalysis($fileID: ID!) {
  cancelDocumentAnalysis(fileID: $fileID) {
    id
    status
  }
}
```

**Output**:
- Creates `ParsedContent` records
- Extracts vocabulary with definitions
- Links to source document
- Stores extracted text

---

## 8. Code Documentation & i18n Metadata Generation ✅

**Purpose**: AI-powered metadata generation for translation files

**Files**:
- [.github/skills/extract-code-documentation/](../.github/skills/extract-code-documentation/)

### Three Approaches

**Approach 1: Codebase Analysis** (`auto-generate-metadata.ts`)
- Scans for `t()` and `useTranslation()` calls
- Extracts JSDoc `@fileoverview` from components
- Generates metadata for all discovered keys
- Reports missing translations

**Approach 2: Fix Placeholders** (`regenerate-placeholder-metadata.ts`)
- Finds entries with `[NEEDS_*` placeholders
- Regenerates only incomplete metadata
- Preserves existing complete metadata
- Recently fixed 276/277 entries

**Approach 3: Fill Missing** (`generate-missing-metadata.ts`)
- Adds `_meta` to entries without it
- Converts `"value"` to `{value, _meta}` structure
- Preserves entries with existing metadata

**Generated Metadata Structure**:
```json
{
  "loginButton": {
    "value": "Sign In",
    "_meta": {
      "context": "Login button in authentication form",
      "component": {
        "location": "src/components/Authenticator.js",
        "description": "Authentication form component..."
      },
      "usage": "Primary action button",
      "impact": "Critical - enables user access",
      "userType": "all",
      "tone": "polite-formal",
      "alternativeTerms": ["Log In", "Login", "Sign On"]
    }
  }
}
```

**Usage**:
```bash
# Generate all metadata from code
npx tsx .github/skills/extract-code-documentation/scripts/auto-generate-metadata.ts

# Fix placeholder metadata
npx tsx .github/skills/extract-code-documentation/scripts/regenerate-placeholder-metadata.ts

# Add missing metadata
npx tsx .github/skills/extract-code-documentation/scripts/generate-missing-metadata.ts
```

**Requirements**: `ANTHROPIC_API_KEY` environment variable

---

## 9. Phoenix Observability & Tracing ✅

**Purpose**: Monitor and trace all LLM operations

**Files**:
- [amplify/functions/shared/phoenix-tracer.ts](../amplify/functions/shared/phoenix-tracer.ts)

**Instrumented Functions**:
1. **openai** - Text completions, audio, images
2. **ai** - Grading and verification
3. **section** - Section management
4. **documentAnalysis** - Document processing
5. **embeddings** - Vector generation

**What Gets Traced**:
- OpenAI API calls (completions, embeddings, audio, images)
- Request/response payloads
- Token usage
- Latency metrics
- Error tracking

**Integration Pattern**:
```typescript
import { initializePhoenixTracing, addTraceAttributes } from '../shared/phoenix-tracer';

// Initialize at module load
initializePhoenixTracing();

// Add custom attributes
addTraceAttributes({
  'operation.name': 'generateEmbedding',
  'user.id': userId,
  'content.length': contentLength
});
```

**Environment Variables**:
- `PHOENIX_COLLECTOR_ENDPOINT` - Phoenix server URL
- `PHOENIX_API_KEY` - Optional authentication

**Benefits**:
- Real-time monitoring
- Performance optimization
- Cost tracking
- Debugging support
- Audit trail

---

## 10. Translation Mode (Storybook Addon) 🆕

**Purpose**: Preview and validate translations in Storybook

**Files**:
- [.storybook/addons/translation-mode/decorator.tsx](../.storybook/addons/translation-mode/decorator.tsx)

**Features** (inferred):
- Switch between locales in Storybook
- Preview translated UI components
- Validate translation completeness
- i18n context management

**Usage**:
```bash
npm run storybook
# Use translation mode toolbar to switch locales
```

---

## Cost Analysis Summary

| Workflow | Per Operation | Monthly (10 instructors) |
|----------|--------------|-------------------------|
| **Content Authoring** | | |
| - Phase 1 (Rule-based) | $0 | $0 |
| - Phase 2 (Completion) | $0.001 | $0.50 |
| - Phase 3 (AI Blocks) | $0.002 | $0.40 |
| - Chat Tools | $0.01 | $10.00 |
| **Testing** | | |
| - LLM Judge | $0.04/run | $12 (10 runs/day) |
| **Translation** | | |
| - Multi-Model (Fake) | $0 | $0 |
| - Multi-Model (Provable) | $0.05-0.15/1K words | Variable |
| **Document Analysis** | $0.10/page | Variable |
| **Embeddings** | $0.0001/item | Minimal |
| **Total Core Features** | | **~$23/month** |

---

## Key Achievements

### 1. Comprehensive Authoring Assistance
- 3-phase system (rule-based + AI completion + AI reasoning)
- Works offline with graceful degradation
- Pedagogically sound suggestions

### 2. Production-Ready Feedback Loop
- All AI features have user feedback collection
- 10 content types supported
- Auto-tracking for implicit feedback

### 3. Multi-Model Verification
- Translation consensus across 3 models
- Cryptographic proofs for auditing
- Semantic similarity validation

### 4. Natural Language Database Operations
- 12 CRUD tools via chat interface
- Automatic tool execution
- Semantic search with embeddings

### 5. Automated Quality Assurance
- LLM-as-a-judge for tool testing
- Automated scoring and reporting
- Resource management and cleanup

### 6. Enterprise-Grade Observability
- Phoenix tracing throughout
- Real-time monitoring
- Cost and performance tracking

### 7. i18n Automation
- AI-powered translation metadata
- Context extraction from code
- JSDoc integration

---

## Architecture Patterns

### 1. Client-Side Tool Execution
```
User Message → Chat API → GPT-4 Decision → Tool Execution (Browser)
                                              ↓
                                         DataStore CRUD
                                              ↓
                                         Result → GPT-4 → Response
```

### 2. Streaming AI Responses
```
Edge Runtime → OpenAI API → Stream Response → Client Display
                  ↓
            Vercel AI SDK
```

### 3. Consensus Translation
```
Source Text → [Claude, GPT-4o, Gemini] (Parallel)
                         ↓
                   Compare Outputs
                         ↓
           [3/3 Consensus | 2/3 Majority | 0/3 Review]
                         ↓
                Reverse Translation
                         ↓
              Semantic Similarity Check
                         ↓
                  Final Translation
```

### 4. Feedback Loop
```
AI Generation → User Interaction → Feedback Collection → DataStore
                                                             ↓
                                                    Analytics/Training
```

---

## Best Practices Learned

1. **Always provide fallbacks** - Phase 3 falls back to Phase 1 if API fails
2. **Track user feedback** - Essential for continuous improvement
3. **Use consensus for critical content** - Multi-model agreement reduces errors
4. **Client-side execution when possible** - Better access to DataStore/Auth
5. **Streaming for better UX** - Ghost text and progressive display
6. **Comprehensive tracing** - Phoenix integration catches issues early
7. **Cost monitoring** - Usage alerts prevent surprise bills
8. **Automated testing** - LLM judges reduce manual QA

---

## Future Enhancements

### Short Term
- Track acceptance rates per feature
- A/B test different prompts
- Partial content completion acceptance
- Multi-suggestion display

### Medium Term
- Admin dashboard for feedback analytics
- Automatic prompt optimization
- Fine-tune models on accepted content
- Voice-to-text with AI polish

### Long Term
- Multi-language support beyond Japanese
- Collaborative editing with AI merge
- Style transfer (match instructor voice)
- Adaptive difficulty suggestions

---

## Related Documentation

- [AI_FEATURES_GUIDE.md](./AI_FEATURES_GUIDE.md) - Complete authoring system
- [CHATBOT_TOOLS.md](./CHATBOT_TOOLS.md) - Tool calling implementation
- [LLM_JUDGE_TESTING.md](./LLM_JUDGE_TESTING.md) - Testing guide
- [PHOENIX_TRACING_GUIDE.md](./PHOENIX_TRACING_GUIDE.md) - Observability
- [.github/skills/multi-model-ai-translation/SKILL.md](../.github/skills/multi-model-ai-translation/SKILL.md) - Translation system
- [.github/skills/extract-code-documentation/SKILL.md](../.github/skills/extract-code-documentation/SKILL.md) - Metadata generation

---

**Version**: 1.0.0  
**Status**: All workflows production ready  
**Total LOC**: 15,000+ across all AI features  
**Test Coverage**: 15+ Storybook stories, automated LLM judge tests  
**Maintainer**: Development Team  
**Last Verified**: February 2, 2026
