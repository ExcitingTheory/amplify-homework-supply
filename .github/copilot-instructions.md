# Copilot Instructions - Homework Supply

Japanese language learning platform built with Next.js, AWS Amplify Gen 1, and OpenAI.

## Architecture Overview

**Stack**: Next.js 16 + AWS Amplify Gen 1 (GraphQL/DataStore) + Material UI + Lexical Editor + OpenAI  
**Database**: DynamoDB via Amplify DataStore with real-time sync  
**Auth**: AWS Cognito with user groups (Admins, Instructors, Learners)  
**Storage**: S3 for files (audio/video/PDFs), organized by protection level  
**AI Features**: OpenAI API (GPT-4, Whisper, TTS) via Lambda + Vercel AI SDK for streaming chat

### Key Architectural Patterns

**React Contexts for Shared State**: The app heavily uses React Context to prevent DataStore subscription duplication. Core contexts:
- `UnitContext` ([src/context/unitContext.js](src/context/unitContext.js)) - Unit data, dictionary, files, question bank, grading
- `SectionContext` - Class sections and assignments  
- `FilesContext` - File management and S3 operations
- `DictionaryContext` - Vocabulary words and questions
- `SettingsContext` - User settings

**Always use existing contexts** instead of creating new DataStore subscriptions. Import and consume via `React.useContext()`.

**DataStore Subscription Management**: Critical performance pattern - see [DATASTORE_OPTIMIZATION_CHANGES.md](DATASTORE_OPTIMIZATION_CHANGES.md):
- Use `DataStore.observeQuery()` for real-time updates (preferred over `.observe()`)
- **One subscription per model** - use client-side filtering instead of multiple queries
- Always unsubscribe in cleanup: `return () => subscription.unsubscribe()`
- Lazy load relationships: `await unit.words.toArray()` for ManyToMany joins

Example consolidated pattern:
```javascript
const subscription = DataStore.observeQuery(Grade).subscribe(({ items }) => {
  const incomplete = items.filter(g => !g.complete);
  const complete = items.filter(g => g.complete);
  setCurrentGrade(incomplete[0]);
  setRecentGrades(complete.slice(0, 5));
});
```

## Data Models & GraphQL

**Core Models** (see [docs/API.md](docs/API.md) and [amplify/backend/api/japanese5/schema.graphql](amplify/backend/api/japanese5/schema.graphql)):
- `Unit` - Learning modules with Lexical JSON content in `data` field
- `Assignment` - Units assigned to students with due dates
- `Grade` - Student submissions with `data` JSON (question responses) and `accuracy` fields
- `Section` - Student groups (classes) with join codes
- `Word` - Japanese vocabulary with phonetic, definition, audio files
- `Question` - Practice questions with audio, images, answers
- `File` - S3 objects with metadata (audio/video/images/PDFs)
- `Document` - PDF analysis results with extracted text and vocabulary

**Auth Rules**: Most models use `@auth` with:
- `allow: owner` for user-created content
- `allow: groups` for Admins/Instructors
- `allow: public, operations: [read]` for published content

**ManyToMany Joins**: Use lazy loading - `await unit.words.toArray()` automatically handles join tables like `UnitWord`.

## Development Workflow

**Starting Development**:
```bash
npm run dev          # Next.js dev server (port 3000)
npm run storybook    # Component development (port 6006)
npm run build:amplify:dev  # Push backend changes to dev environment
```

**Amplify Schema Changes**:
1. Edit `amplify/backend/api/japanese5/schema.graphql`
2. Run `amplify push` (or `npm run build:amplify:dev`)
3. **Increment SCHEMA_VERSION in [pages/_app.js](pages/_app.js)** to trigger DataStore clear
4. Models auto-generated in `src/models/`

**Testing**: Cypress E2E tests in `cypress/e2e/`. Run with `npm run cypress:open`.

## Code Conventions

**File Organization**:
- `pages/` - Next.js routes (mixing `.js` and `.tsx` during TS migration)
- `src/components/` - React components (mix of JS/TS)
- `src/context/` - React Context providers
- `src/utils/` - Pure functions and helpers
- `src/graphql/` - GraphQL queries/mutations/subscriptions (TypeScript)
- `amplify/backend/function/` - Lambda functions (Node.js)

**TypeScript Migration in Progress** (see [docs/TYPESCRIPT_MIGRATION.md](docs/TYPESCRIPT_MIGRATION.md)):
- New files should be `.tsx` when possible
- Existing `.js` files can remain until refactored
- `tsconfig.json` has `"allowJs": true` for gradual conversion
- Always define interfaces for component props

**Naming Patterns**:
- Components: PascalCase (e.g., `ChatSidebar`, `QuestionEditor2`)
- Context files: camelCase + `Context.js` (e.g., `unitContext.js`)
- Utilities: camelCase (e.g., `getCachedUrl.js`)
- `2` suffix indicates second major version (e.g., `DictionaryEditor2.js`)

**DataStore Save Patterns**:
```javascript
// Create new
await DataStore.save(new Unit({ name, description }));

// Update existing - always use Unit.copyOf()
await DataStore.save(Unit.copyOf(currentUnit, updated => {
  updated.name = newName;
  updated.data = JSON.stringify(editorContent);
}));

// Delete
await DataStore.delete(unit);
```

## AI Integration

**OpenAI via Lambda** (see [amplify/backend/function/openai/](amplify/backend/function/openai/)):
- Audio transcription: `verifyAudioUrl` query
- Text generation: `chat` mutation  
- Image analysis: `processImageUrl` query
- Audio generation: `generateAudioFile` mutation
- All API keys stored in AWS SSM, never in frontend

**Streaming Chat** ([pages/api/chat.js](pages/api/chat.js)):
- Uses Vercel AI SDK with Edge Runtime
- `useChat` hook from `@ai-sdk/react` in components like [ChatSidebar.js](src/components/ChatSidebar.js)
- System messages built with current context (unit, files, dictionary)
- Streams GPT-4 responses via `OpenAIStream` + `StreamingTextResponse`

**Embeddings** (Lambda functions `generateEmbedding` and `generateEmbeddings`):
- Uses `text-embedding-3-small` model
- Stored in model fields like `embedding`, `embeddingModel`, `embeddingDimensions`
- Generated for Units, Words, Questions for semantic search

**Document Analysis** ([amplify/backend/function/analyzeDocument/](amplify/backend/function/analyzeDocument/)):
- `analyzeDocument(fileID)` mutation extracts PDF text
- Creates `ParsedContent` records with vocabulary
- Status tracking: `uploaded` → `extracting` → `analyzing` → `completed`
- Cancellable via `cancelDocumentAnalysis(fileID)` mutation

## Editor System

**Lexical Editor** ([src/components/Editor3/](src/components/Editor3/)):
- Custom rich text editor built on Lexical framework
- Content stored as JSON in `Unit.data` field
- Custom nodes: `AnswerNode`, `QuizNode`, `MeaningAssociationNode`, `CustomAnswerNode`
- Plugins handle toolbar, media, autocomplete, markdown
- Save pattern: Update `editorStateRef.current`, call `saveEditorContent()` from UnitContext

**Graded Block Types** (see [src/context/unitContext.js](src/context/unitContext.js)):
```javascript
const gradedBlockTypes = ['quiz', 'meaning-association', 'answer', 'custom-answer'];
```
These block types are tracked in the `rubric` array for grade calculation.

## S3 File Management

**Storage Structure** (via Amplify Storage):
```
public/           # Publicly readable (unit content)
protected/{userId}/  # User-specific (student recordings)
private/{userId}/    # Owner-only (instructor materials)
```

**Upload Pattern** ([src/utils/fileUploadUtils.js](src/utils/fileUploadUtils.js) and contexts):
```javascript
import { uploadData } from 'aws-amplify/storage';

const result = await uploadData({
  key: `public/audio/${filename}`,
  data: file,
  options: {
    contentType: file.type,
    onProgress: ({ transferredBytes, totalBytes }) => {
      console.log(`${Math.round(transferredBytes/totalBytes * 100)}%`);
    }
  }
}).result;
```

**Cached URLs**: Use `getCachedUrl(key, level)` utility to avoid repeated S3 calls.

## Common Pitfalls

**Authentication Context**: Always check `session.username` exists before DataStore operations that require auth:
```javascript
const { session } = React.useContext(UnitContext);
if (!session.username) return; // Wait for auth
```

**Schema Version Changes**: After `amplify push` with schema changes, increment `SCHEMA_VERSION` in `_app.js` to clear stale DataStore cache.

**Observe Query Subscriptions**: Don't create duplicate subscriptions - check if a Context already provides the data. See `DATASTORE_OPTIMIZATION_CHANGES.md` for patterns.

**Editor Content Saving**: Don't directly mutate `unit.data` - always use `saveEditorContent()` from UnitContext which handles JSON serialization and DataStore.copyOf.

**Grade Data Structure**: `Grade.data` is a JSON object keyed by block IDs:
```javascript
{
  "block-id-1": { complete: true, accuracy: 85, userAnswer: "..." },
  "block-id-2": { complete: false, accuracy: 0 }
}
```

## Key Files to Reference

- [docs/ONBOARDING.md](docs/ONBOARDING.md) - Developer setup guide
- [docs/API.md](docs/API.md) - Data models and GraphQL API
- [DATASTORE_OPTIMIZATION_CHANGES.md](DATASTORE_OPTIMIZATION_CHANGES.md) - Subscription patterns
- [package.json](package.json) - Scripts and dependencies
- [src/context/unitContext.js](src/context/unitContext.js) - Core state management example
- [src/components/ChatSidebar.js](src/components/ChatSidebar.js) - AI SDK streaming example
- [pages/api/chat.js](pages/api/chat.js) - Edge function with OpenAI streaming

## Storybook

Component development uses Storybook with mocked AWS services:
- Stories in `*.stories.tsx` or `*.stories.jsx`
- Mocks in `.storybook/__mocks__/` (DataStore, Auth, AI SDK)
- Run `npm run storybook` to develop components in isolation
- See [ChatSidebar.stories.jsx](src/components/ChatSidebar.stories.jsx) for advanced mocking patterns
