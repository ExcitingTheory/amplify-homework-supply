# Copilot Instructions - Homework Supply

elearning platform built with Next.js, AWS Amplify Gen 2, and OpenAI.

## Core Principles

- **Never choose lazy solutions.** Always choose the most technically correct approach. No shortcuts, workarounds, or "good enough" implementations when a proper solution exists.
- **Always verify library versions before writing code or answering questions.** Check `package.json` for the installed version, then gather the correct API documentation for that version (use Context7 or official docs). Do not assume API shapes from memory — confirm them first.
- **Never trust internal repo documentation blindly.** Docs, READMEs, and inline comments in this repo can be outdated or mid-upgrade. Always cross-check claims against the actual source code, `package.json`, and current file contents before relying on them.

## Architecture Overview

**Stack**: Next.js 20 + AWS Amplify Gen 2 (GraphQL/Data Client) + Material UI + Lexical Editor + OpenAI  
**Database**: DynamoDB via Amplify Data Client with real-time sync and versioning  
**Auth**: AWS Cognito with user groups (Admins,Moderators, Instructors, Learners)m owner-based auth, and dynamic group auth by creating Cognito groups and including them in the model fields (we use both read and write groups) and @auth directives
**Storage**: S3 for files (audio/video/PDFs), organized by protection level, however we can use base64 and http(s) URLs for testing without S3 uploads
**AI Features**: OpenAI API (GPT-4, Whisper, TTS) via Lambda + Vercel AI SDK for streaming chat

### Key Architectural Patterns

**React Contexts for Shared State**: The app heavily uses React Context to prevent subscription duplication. Core contexts:

- `UnitContext` ([src/context/unitContext.js](src/context/unitContext.js)) - Unit data, dictionary, files, question bank, grading
- `SectionContext` ([src/context/sectionContext.js](src/context/sectionContext.js)) - Class sections and assignments
- `FilesContext` ([src/context/filesContext.js](src/context/filesContext.js)) - File management and S3 operations
- `DictionaryContext` ([src/context/dictionaryContext.js](src/context/dictionaryContext.js)) - Vocabulary words and questions
- `SettingsContext` ([src/context/settingsContext.js](src/context/settingsContext.js)) - User settings

**Always use existing contexts** instead of creating new subscriptions. Import and consume via `React.useContext()`.

**Data Client Subscription Management**: Critical performance pattern:

- Use `client.models.Model.observeQuery()` for real-time updates
- **One subscription per model** - use client-side filtering instead of multiple queries
- Always unsubscribe in cleanup: `return () => subscription.unsubscribe()`
- Lazy load relationships as needed

Example consolidated pattern:

```javascript
const subscription = client.models.Grade.observeQuery().subscribe({
  next: ({ items }) => {
    const validItems = items.filter((item) => item != null);
    const incomplete = validItems.filter((g) => !g.complete);
    const complete = validItems.filter((g) => g.complete);
    setCurrentGrade(incomplete[0]);
    setRecentGrades(complete.slice(0, 5));
  },
});
```

## Data Models & GraphQL

**Core Models** (see [docs/API.md](docs/API.md) and [amplify/data/resource.ts](amplify/data/resource.ts)):

- `Unit` - Learning modules with Lexical JSON content in `data` field
- `Assignment` - Units assigned to a Section with due dates
- `Grade` - Student submissions with `data` JSON (question responses) and `accuracy` fields
- `Section` - Student groups (classes) with join codes
- `Word` - Vocabulary with phonetic, definition, audio files
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
```

**Amplify Schema Changes**:

1. Edit `amplify/data/resource.ts`
2. Run `npx ampx sandbox` (or `npm run sandbox:with-logs`)
3. After schema changes, restart Next.js dev server
4. Types auto-generated in `amplify_outputs.json`

**Testing**: Cypress E2E tests in `cypress/e2e/`. Run with `npm run cypress:open`.

## Code Conventions

**File Organization**:

- `pages/` - Next.js routes (mixing `.js` and `.tsx` during TS migration)
- `src/components/` - React components (mix of JS/TS)
- `src/context/` - React Context providers
- `src/utils/` - Pure functions and helpers
- `src/graphql/` - GraphQL queries/mutations/subscriptions (TypeScript)
- `amplify/functions/` - Lambda functions (TypeScript)

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

**Data Client CRUD Patterns**:

```javascript
// Create new
await client.models.Unit.create({ name, description });

// Update existing - pass _version for optimistic locking
await client.models.Unit.update({
  id: currentUnit.id,
  name: newName,
  data: JSON.stringify(editorContent),
  _version: currentUnit._version,
});

// Delete
await client.models.Unit.delete({ id: unit.id, _version: unit._version });
```

## AI Integration

**OpenAI via Lambda** (see [amplify/functions/openai/](amplify/functions/openai/)):

- Audio transcription: `verifyAudioUrl` query
- Text generation: `chat` mutation
- Image analysis: `processImageUrl` query
- Audio generation: `generateAudioFile` mutation
- All API keys stored in AWS SSM, never in frontend

**Streaming Chat**:

- Uses Vercel AI SDK
- `useChat` hook from `@ai-sdk/react` in components like [ChatSidebar.js](src/components/ChatSidebar.js)
- System messages built with current context (unit, files, dictionary)
  **CRITICAL - Chat Message Format**:
  Messages from `useChat` hook use `message.parts` array - **DO NOT modify message parsing without checking current code**:

```javascript
{
  id: string,
  role: 'user' | 'assistant',
  parts: [  // Array of message parts - ALWAYS use this format
    {
      type: 'text',
      text: string  // Extract text from parts, not from message.content
    },
    {
      type: 'tool-search_content' | 'tool-*',  // Tool calls
      toolCallId: string,
      state: 'output-available' | 'call',
      input: object,  // Tool arguments
      output: object  // Tool results (when state is 'output-available')
    }
  ]
}
```

**Before changing message rendering**:

1. Check git history: `git log --oneline -- src/components/ChatSidebar.js`
2. View current working code: `git show HEAD:src/components/ChatSidebar.js`
3. Verify mock data format in `.storybook/__mocks__/ui-data/` matches actual data structure
4. Extract text: `message.parts.filter(p => p.type === 'text').map(p => p.text).join('')`
5. Extract tools: `message.parts.filter(p => p.type?.startsWith('tool-'))`

**Embeddings** (Lambda functions `generateEmbedding` and `generateEmbeddings`):

- Uses `text-embedding-3-small` model
- Stored in model fields like `embedding`, `embeddingModel`, `embeddingDimensions`
- Generated for Units, Words, Questions for semantic search

**Document Analysis** ([amplify/functions/analyzeDocument/](amplify/functions/analyzeDocument/)):

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
const gradedBlockTypes = [
  "quiz",
  "meaning-association",
  "answer",
  "custom-answer",
];
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
import { uploadData } from "aws-amplify/storage";

const result = await uploadData({
  key: `public/audio/${filename}`,
  data: file,
  options: {
    contentType: file.type,
    onProgress: ({ transferredBytes, totalBytes }) => {
      console.log(`${Math.round((transferredBytes / totalBytes) * 100)}%`);
    },
  },
}).result;
```

**Cached URLs**: Use `getCachedUrl(filePath)` utility to avoid repeated S3 calls. Pass the full Gen 2 path (e.g., `'protected/{identityId}/files/doc.pdf'`).

## Common Pitfalls

**Before Making Structural Changes**:

1. Check git history to see how code evolved: `git log --oneline -- <filepath>`
2. View working version from specific commit: `git show <commit>:<filepath>`
3. Search for existing patterns: `grep -r "pattern" src/`
4. Verify mock data matches actual data structure in `.storybook/__mocks__/`

**REST API Calls**:

- Always use Amplify's `post()` from `aws-amplify/api` for REST calls to Lambda functions, which handles auth tokens automatically.

**Authentication Context**: Always check `session.username` exists before data operations that require auth:

```javascript
const { session } = React.useContext(UnitContext);
if (!session.username) return; // Wait for auth
```

**Subscription Best Practices**: Don't create duplicate subscriptions - check if a Context already provides the data.

**Editor Content Saving**: Don't directly mutate `unit.data` - always use `saveEditorContent()` from UnitContext which handles JSON serialization and proper updates.
**Editor Content**: Use the Lexical state management to make changes, not direct DOM manipulation.

**Grade Data Structure**: `Grade.data` is a JSON string that when parsed becomes an object keyed by block IDs:

```javascript
// Stored as string in Grade.data field
const gradeData = JSON.parse(grade.data);
// {
//   "block-id-1": { complete: true, accuracy: 85, userAnswer: "..." },
//   "block-id-2": { complete: false, accuracy: 0 }
// }

// When saving:
await client.models.Grade.update({
  id: currentGrade.id,
  data: JSON.stringify(gradeDataObject),
  _version: currentGrade._version,
});
```

## Key Files to Reference

- [docs/ONBOARDING.md](docs/ONBOARDING.md) - Developer setup guide
- [docs/API.md](docs/API.md) - Data models and GraphQL API
- [package.json](package.json) - Scripts and dependencies
- [src/context/unitContext.js](src/context/unitContext.js) - Core state management example
- [src/components/ChatSidebar.js](src/components/ChatSidebar.js) - AI SDK streaming example

## Storybook

Component development uses Storybook with mocked AWS services:

- Stories in `*.stories.tsx` or `*.stories.jsx`
- Mocks in `.storybook/__mocks__/` (Data Client, Auth, AI SDK)
- Mock data in `.storybook/__mocks__/ui-data/` is **extracted from working components** - treat as source of truth for data structures
- Run `npm run storybook` to develop components in isolation
- See [ChatSidebar.stories.jsx](src/components/ChatSidebar.stories.jsx) for advanced mocking patterns

**Critical**: When debugging component data handling:

1. Check mock data format first - it reflects actual runtime data
2. Don't modify component to match assumed data format
3. Verify actual data structure before changing parsing logic

## Gen 2 Versioning Pattern

**All models have versioning fields** (`_version`, `_lastChangedAt`, `_deleted`) for optimistic locking:

```typescript
// Schema definition (amplify/data/resource.ts)
const MyModel = a.model({
  // ... other fields
  _version: a.integer(),
  _lastChangedAt: a.timestamp(),
  _deleted: a.boolean(),
}).authorization(...)
```

**React change detection** - use `_version` (integer), NOT `updatedAt` (timestamp):

```javascript
const versionRef = useRef(0);

// In subscription callback:
if (versionRef.current === newItem?._version) return; // Skip - no change
versionRef.current = newItem?._version;
setItem(newItem);
```

**Lambda functions** - query and pass `_version` in updates:

```typescript
// Query includes _version
const { data } = await client.graphql({ query: GET_MODEL, variables: { id } });
const currentVersion = data.getModel._version;

// Update includes _version
await client.graphql({
  query: UPDATE_MODEL,
  variables: { input: { id, _version: currentVersion, ...updates } },
});
```

## Preferred MCP Usage

Use MCP servers intentionally based on task type. See [.github/prompts/mcp-tool-routing.prompt.md](.github/prompts/mcp-tool-routing.prompt.md) for a full routing checklist.

- **GitHub operations**: Prefer `io.github.github/github-mcp-server` for issues, PRs, reviews, labels, branch/commit metadata, and repository information.
- **Browser/UI verification**: Prefer `microsoft/playwright-mcp` for end-to-end interaction checks and reproducible UI validation.
- **Frontend runtime debugging**: Prefer `io.github.ChromeDevTools/chrome-devtools-mcp` for console/network/perf inspection in rendered pages.
- **Next.js diagnostics**: Prefer `io.github.vercel/next-devtools-mcp` for Next.js-specific runtime, route, and app diagnostics.
- **Framework/library docs**: Prefer `io.github.upstash/context7` for authoritative docs lookup (Next.js, Amplify Gen 2, Storybook, Lexical, MUI, Cypress, Vitest).

Selection rules:

- If task is GitHub state/change management, choose GitHub MCP first.
- If task requires real browser behavior, choose Playwright MCP first; use Chrome DevTools MCP for deep console/network/performance analysis.
- If task is specifically Next.js runtime or routes, choose Next DevTools MCP first.
- If task is implementation guidance from external docs, use Context7 before guessing.
- Avoid duplicating effort across MCPs unless one tool lacks required capability.
