# Chatbot Tool Calling Implementation

**Date**: January 4, 2026  
**Status**: ✅ Complete

## Overview

The AI chatbot in [ChatSidebar.js](../src/components/ChatSidebar.js) now supports **tool calling** to perform actions directly in response to user requests. The chatbot can search content semantically, create/update/delete database records, manage assignments, **and generate markdown content suggestions for units**.

## Architecture

### Flow

1. **User sends message** → ChatSidebar component
2. **useChat hook** sends message + tool definitions to `/api/chat`
3. **OpenAI GPT-4** decides which tools to call (if any)
4. **Tool execution** happens **client-side** via `onToolCall` callback
5. **Results** are sent back to GPT-4, which formulates a natural language response
6. **User sees** both tool execution indicators and AI response

### Why Client-Side Execution?

The Edge Runtime used by `/api/chat` cannot import Amplify DataStore. Tool execution happens in the browser where we have full access to DataStore, Auth, and S3.

## Available Tools (13 Total)

### 1. Search & Discovery

#### `search_content`
- **Purpose**: Semantic search across Files, Words, and Questions using embeddings
- **Parameters**:
  - `query` (string, required): Search query text
  - `type` (enum: 'all', 'files', 'words', 'questions'): Content type filter
  - `limit` (number, default: 10): Max results
- **Returns**: Array of results with similarity scores
- **Example**: "Search for vocabulary about photosynthesis"

### 2. Section Management

#### `list_sections`
- **Purpose**: List all class sections
- **Parameters**: None
- **Returns**: Array of sections with name, description, learner, joinCode

#### `create_section`
- **Purpose**: Create a new class section
- **Parameters**:
  - `name` (string, required)
  - `description` (string)
  - `learner` (string): Learner group identifier
- **Returns**: Created section object
- **Example**: "Create a section called 'Japanese 101 Fall 2026'"

### 3. Unit Management

#### `list_units`
- **Purpose**: List all learning units
- **Parameters**:
  - `limit` (number): Max units to return
- **Returns**: Array of units with metadata

#### `get_unit_details`
- **Purpose**: Get detailed info about a specific unit
- **Parameters**:
  - `unitId` (string, required)
- **Returns**: Unit details + assignment/vocabulary/question counts

#### `create_unit`
- **Purpose**: Create a new learning unit
- **Parameters**:
  - `name` (string, required)
  - `description` (string)
  - `timeLimitSeconds` (number): Optional timer
- **Returns**: Created unit object
- **Example**: "Create a unit called 'Hiragana Practice' with a 30 minute timer"

#### `update_unit`
- **Purpose**: Update properties of an existing unit
- **Parameters**:
  - `unitId` (string, required)
  - `name` (string): New name
  - `description` (string): New description
  - `timeLimitSeconds` (number): New timer
- **Returns**: Updated unit info
- **Example**: "Change the timer on Unit X to 45 minutes"

#### `add_timer_to_unit`
- **Purpose**: Add or update a timer for a unit
- **Parameters**:
  - `unitId` (string, required)
  - `seconds` (number, required): Time limit in seconds
- **Returns**: Confirmation with new timer value
- **Example**: "Add a 20 minute timer to this unit"

### 4. Assignment Management

#### `create_assignment`
- **Purpose**: Assign a unit to a section with a due date
- **Parameters**:
  - `unitId` (string, required)
  - `sectionId` (string, required)
  - `dueDate` (string, required): ISO 8601 format
  - `learner` (string): Learner identifier (auto-filled from section)
- **Returns**: Created assignment object
- **Behavior**: Automatically adds section's learner to unit's dynamic group
- **Example**: "Assign Unit X to Section Y due next Friday at 5pm"

#### `delete_assignment`
- **Purpose**: Remove an assignment (unassign unit from section)
- **Parameters**:
  - `assignmentId` (string, required)
- **Returns**: Confirmation of deletion
- **Example**: "Delete the assignment for Section Z"

### 5. Content Creation

#### `create_vocabulary_word`
- **Purpose**: Add a new vocabulary word to the dictionary
- **Parameters**:
  - `phrase` (string, required): The word/phrase
  - `phonetic` (string): Pronunciation
  - `definition` (string, required)
  - `unitId` (string): Associate with a unit
- **Returns**: Created word object
- **Example**: "Add the word 'こんにちは' meaning 'hello'"

#### `create_question`
- **Purpose**: Create a new practice question
- **Parameters**:
  - `prompt` (string, required): Question text
  - `answer` (string, required): Correct answer
  - `unitId` (string): Associate with a unit
- **Returns**: Created question object
- **Example**: "Create a question asking what 'arigatou' means"

#### `generate_unit_content`
- **Purpose**: Generate markdown content suggestions that can be inserted into the current unit
- **Parameters**:
  - `contentType` (enum, required): Type of content - 'explanation', 'example', 'practice', 'quiz', 'summary', 'vocabulary_section', 'custom'
  - `topic` (string, required): Topic or subject for the content
  - `instructions` (string): Specific instructions or requirements
  - `includeMarkdown` (boolean, default: true): Whether to format with markdown
- **Returns**: Structured template and guidance for content generation
- **Behavior**: Provides a template structure, then AI generates the actual content
- **Example**: "Generate practice exercises about past tense verbs"
- **Use Cases**:
  - **Explanation**: Educational explanations with key points
  - **Example**: Practical examples with detailed explanations
  - **Practice**: Interactive exercises with answers
  - **Quiz**: Multiple choice or short answer questions
  - **Summary**: Concise summaries with main takeaways
  - **Vocabulary Section**: Structured vocabulary tables
  - **Custom**: Any other educational content

## Implementation Files

### 1. [src/utils/chatTools.js](../src/utils/chatTools.js) (NEW)
- **Exports**:
  - `toolDefinitions`: Array of 13 tool schemas (OpenAI format)
  - `executeTool(toolName, args)`: Main execution router
  - Individual `execute*` functions for each tool
- **Key Functions**:
  - `executeSearchContent()`: Uses embedding generation + cosine similarity
  - `executeCreateSection()`, `executeCreateUnit()`, etc.: DataStore CRUD
  - `executeGenerateUnitContent()`: Returns content templates and guidance
  - All return `{ success: boolean, ...data }` format
- **Dependencies**:
  - DataStore for CRUD operations
  - GraphQL `generateEmbedding` mutation for search
  - Cosine similarity utility for vector comparison

### 2. [pages/api/chat.js](../pages/api/chat.js) (UPDATED)
- **Changes**:
  - Accepts `tools` and `toolChoice` in request body
  - Passes tools to OpenAI completion config
  - Updated system message to list available tools
  - Instructs GPT-4 to use tools for actions
- **Note**: Edge Runtime, no DataStore access here

### 3. [src/components/ChatSidebar.js](../src/components/ChatSidebar.js) (UPDATED)
- **Changes**:
  - Imports `toolDefinitions` and `executeTool` from `chatTools.js`
  - Passes `tools` and `toolChoice: 'auto'` in `useChat` body
  - Implements `async onToolCall({ toolCall })` callback
  - Executes tool client-side, returns result to AI
  - Renders tool invocations in UI with status indicators
- **UI Enhancements**:
  - Tool calls shown with 🔧 icon
  - Success/failure status displayed
  - Tool name visible to user

## Usage Examples

### Example 1: Semantic Search
**User**: "Find all vocabulary about food"

**Flow**:
1. GPT-4 calls `search_content` with `{ query: "food", type: "words", limit: 10 }`
2. Client executes search using embeddings
3. Returns top 10 matching Word records
4. GPT-4 formats results in natural language

### Example 2: Create Assignment with Timer
**User**: "Create a new unit called 'Kanji Basics' with a 30 minute timer and assign it to Section A due next Monday at 3pm"

**Flow**:
1. GPT-4 calls `create_unit` with `{ name: "Kanji Basics", timeLimitSeconds: 1800 }`
2. Returns new unit with ID
3. GPT-4 calls `create_assignment` with new unitId, sectionId, and calculated dueDate
4. Returns assignment confirmation
5. GPT-4 responds: "I've created the unit 'Kanji Basics' with a 30-minute timer and assigned it to Section A with a due date of Monday, Jan 6, 2026 at 3:00 PM."

### Example 3: Generate Unit Content
**User**: "Add an explanation section about Japanese counters to this unit"

**Flow**:
1. GPT-4 calls `generate_unit_content` with `{ contentType: "explanation", topic: "Japanese Counters" }`
2. Tool returns template structure and guidance
3. GPT-4 generates actual markdown content:
   ```markdown
   ## Japanese Counters
   
   Japanese uses special counter words when counting objects. The counter changes based on what you're counting.
   
   ### Key Points
   - Different objects use different counters
   - Counters attach to numbers
   - Some common counters: 本 (hon) for cylindrical objects, 枚 (mai) for flat objects
   
   ### Examples
   - 本を三冊買いました (I bought three books) - uses 冊 (satsu) for bound items
   - 紙を二枚ください (Please give me two sheets of paper) - uses 枚 (mai)
   ```
4. User can copy and paste this markdown into the editor

### Example 4: Generate Practice Exercises
**User**: "Create practice exercises for hiragana reading"

**FlContent Generation Workflow

The `generate_unit_content` tool works differently from CRUD tools:

1. **User requests content**: "Add a quiz about particles"
2. **Tool is called**: Returns template structure based on content type
3. **GPT-4 generates**: Uses the template to create actual markdown content
4. **User receives**: Ready-to-paste markdown that can be inserted into the editor

**Content Types Supported**:
- **Explanation**: Educational text with key points
- **Example**: Practical demonstrations with explanations
- **Practice**: Exercises with answers
- **Quiz**: Questions with multiple choice or short answers
- **Summary**: Concise overviews with takeaways
- **Vocabulary Section**: Structured vocabulary tables
- **Custom**: Any other educational content

**Markdown Format**: The editor supports markdown through `@lexical/markdown` with the `TRANSFORMERS` preset. Users can paste generated markdown directly into the editor, and it will be converted to Lexical nodes.

### ow**:
1. GPT-4 calls `generate_unit_content` with `{ contentType: "practice", topic: "Hiragana Reading" }`
2. GPT-4 generates structured exercises:
   ```markdown
   ### Practice: Hiragana Reading
   
   1. Read the following: さくら
      - Answer: sakura (cherry blossom)
   
   2. Read the following: ともだち
      - Answer: tomodachi (friend)
   
   3. Read the following: がっこう
      - Answer: gakkou (school)
   ```
3. Content can be directly inserted into unit

## Technical Details

### Embedding-Based Search

The `search_content` tool uses the same embedding system as [FileManager2.js](../src/components/Editor3/components/FileManager2.js):

1. **Generate query embedding** via `generateEmbedding` GraphQL mutation
   - Uses `text-embedding-3-small` model
   - 512 dimensions
2. **Retrieve candidate items** from DataStore
   - Files with `embedding` field
   - Words with `embedding` field
   - Questions with `embedding` field
3. **Compute cosine similarity** for each candidate
4. **Sort by similarity** descending
5. **Return top K results** (default 10)

**Fallback**: If no embeddings exist, falls back to keyword search (case-insensitive substring matching).

### DataStore CRUD Patterns

All create/update operations follow Amplify DataStore patterns:

```javascript
// Create
await DataStore.save(new Unit({ name, description }));

// Update
await DataStore.save(Unit.copyOf(existingUnit, updated => {
  updated.name = newName;
}));

// Delete
await DataStore.delete(existingUnit);
```

### Error Handling

All tool execution functions return:
```javascript
{
  success: boolean,
  error?: string,  // If success=false
  ...data          // Result data if success=true
}
```

Errors are:
1. Logged to console with tool name
2. Returned to GPT-4 in result
3. GPT-4 explains error to user

## Future Enhancements

### Potential Additional Tools

1. **`update_vocabulary_word`**: Edit existing words
2. **`delete_vocabulary_word`**: Remove words
3. **`update_question`**: Edit existing questions
4. **`bulk_import_vocabulary`**: Import from CSV/JSON
5. **`generate_quiz_from_vocabulary`**: Auto-create questions from words
6. **`analyze_student_progress`**: Query Grade data
7. **`insert_content_into_unit`**: Directly modify unit.data with Lexical JSON
8. **`search_students`**: Find students by name/section
9. **`export_vocabulary_list`**: Export to CSV/PDF
10. **`clone_unit`**: Duplicate an existing unit
11. **`generate_audio`**: TTS for vocabulary/content
12. **`extract_vocabulary_from_content`**: Parse unit content for words

### Performance Optimizations

- **Caching**: Cache embedding generation results for common queries
- **Batch Operations**: Support bulk creates/updates in single tool call
- **Lazy Loading**: Only load necessary relationships
- **Indexing**: Pre-compute embeddings for all content on app load

### UI Improvements

- **Confirmation Dialogs**: Ask user before creating/deleting
- **Inline Editing**: Show created items inline in chat
- **Content Preview**: Preview generated markdown before insertion
- **Copy Button**: Quick-copy generated content
- **Insert Button**: Direct insertion into editor (future enhancement)
- **UnGenerate explanation content
- [ ] Generate practice exercises
- [ ] Generate quiz questions
- [ ] Generate vocabulary section
- [ ] Generate summary
- [ ] Copy/paste generated markdown into editor
- [ ] Verify markdown converts to Lexical nodes
- [ ] do/Redo**: Support reversing tool actions
- **Progress Indicators**: Show progress for multi-step operations

## Testing

### Manual Testing Checklist

- [ ] Search vocabulary by keyword
- [ ] Search questions by topic
- [ ] Create a new section
- [ ] Create a new unit
- [ ] Add timer to existing unit
- [ ] Create assignment with due date
- [ ] Delete assignment
- [ ] Add vocabulary word
- [ ] Add practice question
- [ ] List all sections
- [ ] List all units
- [ ] Get details for specific unit
- [ ] Update unit properties
- [ ] Error handling (invalid IDs, missing params)

### Test Commands

```
// Search
"Find vocabulary about colors"
"Search for questions on grammar"

// Generate Content
"Add an explanation about Japanese particles to this unit"
"Create practice exercises for past tense verbs"
"Generate a quiz on katakana reading"
"Write a summary of this lesson"
"Make a vocabulary section for food words"
"Add examples of casual speech"

// Create
"Create a section called 'Advanced Japanese'"
"Make a new unit called 'Katakana Practice' with a 15 minute timer"
"Add a word: 'neko' means 'cat'"
"Create a question: What does 'arigatou' mean? Answer: thank you"

// Assign
"Assign the Hiragana unit to Section A due next Friday"

// Update
"Change the timer on unit X to 45 minutes"
"Update unit Y's description to 'Advanced grammar concepts'"

// Delete
"Remove the assignment for Section B"

// List/Query
"Show me all sections"
"List the first 5 units"
"Get details about unit Z"
```

## Troubleshooting

### Tools Not Being Called

**Issue**: GPT-4 doesn't use tools, just responds with text  
**Solution**: Check that:
- `toolDefinitions` is passed in `useChat` body
- `toolChoice: 'auto'` is set
- System message mentions tools
- User request is actionable (not just a question)

### Tool Execution Errors

**Issue**: Tool returns `{ success: false, error: "..." }`  
**Debugging**:
1. Check browser console for detailed error logs
2. Verify DataStore is synced (check Network tab)
3. Ensure user has required permissions
4. Validate input parameters match schema

### Embeddings Not Found

**Issue**: Search returns no results  
**Solutions**:
- Run embedding generation for content (see [src/utils/embeddingGenerator.js](../src/utils/embeddingGenerator.js))
- Check that models have `embedding` field populated
- Verify `generateEmbedding` Lambda is deployed
- Fall back to keyword search if embeddings unavailable

## Related Documentation

- [ONBOARDING.md](./ONBOARDING.md) - Developer setup
- [API.md](./API.md) - Data models
- [DATASTORE_OPTIMIZATION_CHANGES.md](../DATASTORE_OPTIMIZATION_CHANGES.md) - DataStore patterns
- [TYPESCRIPT_MIGRATION.md](./TYPESCRIPT_MIGRATION.md) - TS conversion guide
- Vercel AI SDK: https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling

## Contributors

- Implementation: GitHub Copilot (January 4, 2026)
- Based on existing patterns from [FileManager2.js](../src/components/Editor3/components/FileManager2.js) and context providers
