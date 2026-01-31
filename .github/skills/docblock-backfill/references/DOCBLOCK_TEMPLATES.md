# Docblock Templates

Standard templates for different file types.

## Component Template

### Basic Component

```typescript
/**
 * ComponentName - Brief one-line description
 * 
 * @description
 * Detailed multi-line description explaining:
 * - What the component does
 * - Key features and capabilities
 * - Important behavior or constraints
 * 
 * @component
 * @example
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={variable}
 * />
 * ```
 */
export const ComponentName: React.FC<Props> = ({ ... }) => {
  // ...
};
```

### Component with Metadata

```typescript
/**
 * ChatSidebar - Streaming chat interface with AI tool calling
 * 
 * @description
 * Real-time AI chat component with message streaming, tool execution,
 * and context-aware responses. Integrates with Vercel AI SDK for
 * streaming chat completions and custom tool handlers for searching
 * content, generating audio, and analyzing images.
 * 
 * @component
 * @example
 * ```tsx
 * <ChatSidebar
 *   messages={messages}
 *   onSendMessage={handleSend}
 *   systemContext={{
 *     unit: currentUnit,
 *     files: availableFiles
 *   }}
 * />
 * ```
 * 
 * @metadata
 * - context: Chat panel heading shown to all users when sidebar opens
 * - usage: Primary AI interaction interface, visible in unit and assignment views
 * - impact: high - core AI feature for student assistance
 * - location: src/components/ChatSidebar.js
 * 
 * @see {@link public/locales/en/chat.json} for UI strings
 * @see {@link docs/CHATBOT_TOOLS.md} for tool calling reference
 */
```

### Component with Props Documentation

```typescript
/**
 * UnitCard - Learning unit display card component
 * 
 * @description
 * Displays unit information in card format with title, description,
 * progress indicator, and action buttons. Used in unit listing grids
 * and assignment selectors.
 * 
 * @component
 * @param {UnitCardProps} props - Component properties
 * @param {Unit} props.unit - Unit data model from DataStore
 * @param {boolean} [props.showProgress=false] - Display completion progress bar
 * @param {() => void} [props.onSelect] - Callback when card is clicked
 * @param {'compact' | 'full'} [props.variant='full'] - Display variant
 * 
 * @example
 * ```tsx
 * <UnitCard
 *   unit={unit}
 *   showProgress={true}
 *   onSelect={() => navigate(`/units/${unit.id}`)}
 * />
 * ```
 * 
 * @metadata
 * - location: src/components/UnitCard.tsx
 * - usage: Unit listing grid, assignment selector
 * - impact: medium - core content display element
 */
```

## Page Template

### Next.js Page

```typescript
/**
 * PageName - Page purpose and route
 * 
 * @description
 * Detailed description of page functionality and user flows.
 * 
 * @page
 * @route /path/to/page
 * @auth Required | Optional | None
 * 
 * @example
 * Navigate to: /units/[id]
 * 
 * @see {@link docs/ROUTING.md} for navigation patterns
 */
export default function PageName({ params }: PageProps) {
  // ...
}
```

### Page with Dynamic Route

```typescript
/**
 * UnitPage - Individual learning unit view
 * 
 * @description
 * Displays a single unit's content using the Lexical editor in read-only
 * mode for students, editable mode for instructors. Includes navigation,
 * grading panel, and AI chat sidebar.
 * 
 * @page
 * @route /units/[id]
 * @auth Required - Students and Instructors
 * 
 * @param {PageProps} props - Next.js page props
 * @param {Object} props.params - Route parameters
 * @param {string} props.params.id - Unit ID from URL
 * 
 * @example
 * Navigate to: /units/abc123
 * 
 * @metadata
 * - usage: Primary learning interface for students
 * - impact: critical - core product functionality
 * 
 * @see {@link docs/UNITS.md} for unit data model
 * @see {@link src/components/Editor3/} for editor implementation
 */
```

## Utility Template

### Pure Function

```typescript
/**
 * getCachedUrl - S3 URL caching utility
 * 
 * @description
 * Retrieves presigned S3 URLs and caches them in memory to avoid
 * repeated calls. Cache expires after 55 minutes (S3 URLs valid for 1 hour).
 * 
 * @module utils/fileUtils
 * 
 * @param {string} key - S3 object key
 * @param {'public' | 'protected' | 'private'} [level='public'] - Access level
 * @returns {Promise<string>} Presigned URL valid for 1 hour
 * 
 * @example
 * ```typescript
 * const audioUrl = await getCachedUrl('audio/intro.mp3', 'public');
 * ```
 * 
 * @see {@link docs/FILE_HANDLING_GUIDE.md} for S3 patterns
 */
export async function getCachedUrl(key: string, level = 'public'): Promise<string> {
  // ...
}
```

### Hook Template

```typescript
/**
 * useDataStoreSubscription - Managed DataStore subscription hook
 * 
 * @description
 * Creates and manages a DataStore.observeQuery subscription with automatic
 * cleanup. Prevents memory leaks by unsubscribing on unmount. Includes error
 * handling and optional client-side filtering.
 * 
 * @hook
 * 
 * @template T - DataStore model type
 * @param {ModelConstructor<T>} model - DataStore model class
 * @param {QueryPredicate<T>} [predicate] - Optional query filter
 * @param {(items: T[]) => void} callback - Called when data updates
 * 
 * @example
 * ```typescript
 * useDataStoreSubscription(Grade, undefined, (grades) => {
 *   setGrades(grades);
 * });
 * ```
 * 
 * @see {@link docs/DATASTORE_OPTIMIZATION_CHANGES.md}
 */
```

## Context Provider Template

```typescript
/**
 * UnitContext - Unit data and operations provider
 * 
 * @description
 * React Context providing unit data, files, dictionary words, question bank,
 * and grading functionality. Manages DataStore subscriptions and caches data
 * to prevent duplicate queries across components.
 * 
 * @context
 * 
 * Key Features:
 * - Single source of truth for unit data
 * - Consolidated DataStore subscriptions
 * - Editor state management
 * - File upload/download helpers
 * - Grading operations
 * 
 * @example
 * ```tsx
 * // Provider usage
 * <UnitProvider unitId={id}>
 *   <UnitEditor />
 *   <FileManager />
 * </UnitProvider>
 * 
 * // Consumer usage
 * const { currentUnit, saveEditorContent } = useContext(UnitContext);
 * ```
 * 
 * @metadata
 * - location: src/context/unitContext.js
 * - usage: Wraps all unit-related pages and components
 * - impact: critical - core data layer for unit features
 * 
 * @see {@link docs/DATASTORE_OPTIMIZATION_CHANGES.md}
 */
```

## TypeScript Interface Template

```typescript
/**
 * ChatMessage - Chat message structure from useChat hook
 * 
 * @interface
 * 
 * @description
 * Message format returned by Vercel AI SDK's useChat hook. Messages contain
 * an array of parts which can be text content or tool call information.
 * 
 * @property {string} id - Unique message identifier
 * @property {'user' | 'assistant'} role - Message sender
 * @property {MessagePart[]} parts - Array of message content parts
 * 
 * @example
 * ```typescript
 * const message: ChatMessage = {
 *   id: 'msg_123',
 *   role: 'assistant',
 *   parts: [
 *     { type: 'text', text: 'Hello!' },
 *     { type: 'tool-search_content', toolCallId: 'call_456', state: 'call' }
 *   ]
 * };
 * ```
 * 
 * @see {@link docs/CLIENT_SIDE_TOOL_HANDLING.md}
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
}
```

## Lambda Function Template

```typescript
/**
 * openai - OpenAI API Lambda function handler
 * 
 * @lambda
 * @runtime Node.js 18.x
 * 
 * @description
 * AppSync Lambda resolver for OpenAI API operations:
 * - Audio transcription (Whisper)
 * - Chat completions (GPT-4)
 * - Image analysis (GPT-4 Vision)
 * - Audio generation (TTS)
 * 
 * API keys stored in AWS Systems Manager Parameter Store.
 * 
 * @param {AppSyncEvent} event - AppSync resolver event
 * @param {Context} context - Lambda context
 * @returns {Promise<ResolverResponse>} GraphQL response
 * 
 * @env OPENAI_API_KEY_PARAM - SSM parameter name for API key
 * 
 * @example
 * GraphQL Query:
 * ```graphql
 * query VerifyAudio($audioUrl: String!) {
 *   verifyAudioUrl(audioUrl: $audioUrl) {
 *     transcript
 *     confidence
 *   }
 * }
 * ```
 * 
 * @see {@link docs/AI_FEATURES_GUIDE.md}
 */
export const handler = async (event: AppSyncEvent, context: Context) => {
  // ...
};
```

## Test File Template

```typescript
/**
 * Component.test - Unit tests for Component
 * 
 * @test
 * @component Component
 * 
 * Test Coverage:
 * - Rendering with default props
 * - User interactions (click, input)
 * - Data loading states
 * - Error handling
 * - Accessibility compliance
 * 
 * @see {@link src/components/Component.tsx}
 */
describe('Component', () => {
  // ...
});
```

## Minimal Template (Auto-Generated)

If no metadata available, generates minimal docblock:

```typescript
/**
 * FileName - Brief description based on filename and exports
 * 
 * @description
 * [Auto-generated] Requires manual review and enhancement.
 * 
 * Generated by: docblock-backfill skill
 * Date: 2026-01-30
 */
```

## Template Selection Logic

```typescript
const templates = {
  component: componentTemplate,      // src/components/**
  page: pageTemplate,                // pages/**
  utility: utilityTemplate,          // src/utils/**
  context: contextTemplate,          // src/context/**
  hook: hookTemplate,                // use*.ts files
  lambda: lambdaTemplate,            // amplify/backend/function/**
  test: testTemplate,                // *.test.*, *.spec.*
  minimal: minimalTemplate           // fallback
};

function selectTemplate(filePath: string): Template {
  if (filePath.includes('/components/')) return templates.component;
  if (filePath.startsWith('pages/')) return templates.page;
  // ... etc
}
```
