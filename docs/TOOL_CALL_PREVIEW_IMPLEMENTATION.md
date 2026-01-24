# Tool Call Preview and Content Generation Implementation

**Date**: January 25, 2026  
**Status**: ✅ Complete

## Overview

This implementation adds **user confirmation for tool calls** and **Lexical content preview/insertion** capabilities to the ChatSidebar. Users can now verify tool parameters before execution and preview AI-generated content before inserting it into the editor.

## New Components

### 1. ToolCallPreview Component

**Location**: [src/components/ChatSidebar/ToolCallPreview.tsx](../src/components/ChatSidebar/ToolCallPreview.tsx)

**Purpose**: Displays tool call parameters with interactive confirmation UI.

**Features**:
- ✅ Preview all tool parameters with types and descriptions
- ✅ Edit parameters before execution
- ✅ Confirm or cancel tool execution
- ✅ Visual state indicators (pending, executing, executed, error)
- ✅ Support for all tool types (search, create, delete, generate)
- ✅ Compact and expanded view modes

**Usage Example**:
```tsx
import ToolCallPreview from './ChatSidebar/ToolCallPreview';

<ToolCallPreview
  toolName="generate_unit_content"
  toolCallId="call_123"
  parameters={{
    contentType: 'explanation',
    topic: 'Japanese Particles',
    instructions: 'Include examples',
  }}
  toolDefinition={toolDefinitions.find(t => t.function.name === 'generate_unit_content')}
  state="pending"
  onConfirm={(params) => executeToolWithParams(params)}
  onCancel={() => cancelTool()}
  onEdit={(params) => updateParams(params)}
/>
```

**States**:
- `pending` - Awaiting user confirmation (shows Edit/Cancel/Execute buttons)
- `confirmed` - User confirmed, ready to execute
- `executing` - Currently running (shows progress indicator)
- `executed` - Completed successfully (shows checkmark)
- `error` - Failed execution (shows error message)

### 2. ContentPreview Component

**Location**: [src/components/ChatSidebar/ContentPreview.tsx](../src/components/ChatSidebar/ContentPreview.tsx)

**Purpose**: Renders AI-generated content with Lexical preview and insertion capability.

**Features**:
- ✅ Render markdown content as Lexical nodes (live preview)
- ✅ Toggle between Preview and Raw (code) view modes
- ✅ Copy to clipboard functionality
- ✅ Insert directly into editor
- ✅ Regenerate content option
- ✅ Support for multiple content types (explanation, practice, quiz, etc.)

**Usage Example**:
```tsx
import ContentPreview from './ChatSidebar/ContentPreview';

<ContentPreview
  contentType="explanation"
  topic="Japanese Particles"
  generatedContent={markdownContent}
  format="markdown"
  onInsert={(content, format) => insertIntoEditor(content)}
  onCopy={() => console.log('Copied!')}
  onRegenerate={() => regenerateContent()}
  showInsertButton={true}
/>
```

**Content Types Supported**:
- `explanation` - Educational explanations with key points
- `example` - Practical examples with demonstrations
- `practice` - Exercise sets with answers
- `quiz` - Quiz questions with answers
- `summary` - Concise summaries with takeaways
- `vocabulary_section` - Structured vocabulary tables
- `custom` - Custom educational content

**View Modes**:
- **Preview** - Lexical-rendered live preview with formatting
- **Raw** - Code view showing raw markdown/HTML

## Tool Call Confirmation Workflow

### Current Flow (Without Confirmation)

```
User: "Generate an explanation about particles"
  ↓
AI: Calls generate_unit_content tool
  ↓
Tool executes immediately
  ↓
AI: Returns result in text response
```

### New Flow (With Confirmation)

```
User: "Generate an explanation about particles"
  ↓
AI: Calls generate_unit_content tool with confirmed=false
  ↓
Tool returns { requiresConfirmation: true, ... }
  ↓
ChatSidebar renders ToolCallPreview component
  ↓
User reviews parameters and clicks "Execute"
  ↓
AI calls tool again with confirmed=true
  ↓
Tool executes and generates content
  ↓
ChatSidebar renders ContentPreview component
  ↓
User previews content and clicks "Insert into Editor"
  ↓
Content inserted as Lexical nodes
```

## Implementation Details

### 1. Enhanced chatTools.js

**File**: [src/utils/chatTools.js](../src/utils/chatTools.js)

**Changes**:

#### Added `confirmed` Parameter to Tool Definitions
```javascript
{
  name: 'generate_unit_content',
  parameters: {
    // ... existing parameters
    confirmed: {
      type: 'boolean',
      description: 'Set to true when user has confirmed the parameters',
      default: false
    }
  }
}
```

#### Two-Phase Execution in `executeGenerateUnitContent`

**Phase 1 - Confirmation Preview** (confirmed=false):
```javascript
if (!confirmed) {
  return {
    success: true,
    requiresConfirmation: true,
    contentType,
    topic,
    guidance, // Instructions for AI content generation
    template, // Template structure
    message: "Ready to generate... Confirm to proceed."
  };
}
```

**Phase 2 - Actual Execution** (confirmed=true):
```javascript
return {
  success: true,
  confirmed: true,
  needsGeneration: true, // Signal to AI to generate actual content
  message: "Generating content..."
};
```

### 2. ChatSidebar Integration

**Key Integration Points**:

#### A. Detect Tools Requiring Confirmation

```javascript
// In message rendering loop
const toolParts = message.parts?.filter(part => 
  part.type?.startsWith('tool-')
) || [];

toolParts.forEach(part => {
  const toolName = part.type?.replace('tool-', '');
  
  // Check if tool result requires confirmation
  if (part.state === 'output-available' && part.output?.requiresConfirmation) {
    // Render ToolCallPreview instead of generic output
    return <ToolCallPreview ... />;
  }
  
  // Check if tool result has generated content
  if (part.output?.generatedContent) {
    // Render ContentPreview
    return <ContentPreview ... />;
  }
});
```

#### B. Handle User Confirmation

```javascript
const handleToolConfirmation = async (toolCallId, confirmedParams) => {
  // Re-execute tool with confirmed=true
  const result = await executeTool(toolName, {
    ...confirmedParams,
    confirmed: true
  });
  
  // Add tool output to message stream
  addToolOutput({
    toolCallId,
    output: result
  });
};
```

#### C. Handle Content Insertion into Editor

```javascript
const handleContentInsert = (content, format) => {
  if (!editorRef.current) return;
  
  const editor = editorRef.current;
  
  editor.update(() => {
    // Convert markdown to Lexical nodes
    if (format === 'markdown') {
      $convertFromMarkdownString(content, TRANSFORMERS);
    }
    
    // Or insert as plain text
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      selection.insertRawText(content);
    }
  });
};
```

### 3. Lexical Content Rendering

The ContentPreview component uses Lexical's built-in markdown support:

```tsx
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';

const editorConfig = {
  namespace: 'ContentPreview',
  editable: false,
  editorState: () => $convertFromMarkdownString(generatedContent, TRANSFORMERS),
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    CodeNode,
    // ... other nodes
  ]
};

<LexicalComposer initialConfig={editorConfig}>
  <RichTextPlugin ... />
</LexicalComposer>
```

**Supported Markdown Elements**:
- Headings (H1-H6)
- Lists (ordered/unordered)
- Code blocks
- Links
- Bold/italic text
- Quotes
- Tables (via custom node if needed)

## Storybook Stories

### ToolCallPreview Stories

**File**: [src/components/ChatSidebar/ToolCallPreview.stories.tsx](../src/components/ChatSidebar/ToolCallPreview.stories.tsx)

**Stories**:
- `SearchContentPending` - Search tool awaiting confirmation
- `CreateSectionPending` - Section creation tool
- `GenerateContentPending` - Content generation tool
- `ToolExecuting` - Tool in execution state
- `ToolExecuted` - Successfully completed tool
- `ToolError` - Failed tool execution
- `CompactView` - Collapsed view mode
- `AllToolTypes` - Showcase of multiple tool types

### ContentPreview Stories

**File**: [src/components/ChatSidebar/ContentPreview.stories.tsx](../src/components/ChatSidebar/ContentPreview.stories.tsx)

**Stories**:
- `ExplanationContent` - Educational explanation with markdown
- `PracticeExercises` - Practice exercises with answers
- `QuizContent` - Quiz questions and answers
- `VocabularySection` - Structured vocabulary table
- `CompactView` - Collapsed preview
- `RawViewMode` - Code view mode
- `WithoutInsertButton` - Preview only (no insertion)
- `MultipleContentCards` - Multiple previews stacked

## Testing

### Manual Testing Checklist

**Tool Call Preview**:
- [ ] All tool types render correctly (search, create, generate, etc.)
- [ ] Parameter editing works for all input types
- [ ] Required vs optional parameters indicated
- [ ] Enum parameters show dropdown
- [ ] Number parameters show numeric input
- [ ] State transitions work (pending → executing → executed)
- [ ] Error states display properly
- [ ] Compact/expanded modes toggle correctly

**Content Preview**:
- [ ] Markdown renders correctly in preview mode
- [ ] Raw mode shows source code
- [ ] Copy to clipboard works
- [ ] Insert button triggers callback
- [ ] Regenerate button triggers callback
- [ ] All content types display appropriate icons
- [ ] Lexical rendering shows formatted content
- [ ] Tab switching works smoothly

**Integration**:
- [ ] Tool calls appear in chat with preview
- [ ] Confirming tool re-executes with confirmed=true
- [ ] Generated content appears in ContentPreview
- [ ] Insert button adds content to editor
- [ ] Multiple tool calls in same message work
- [ ] Tool execution states update correctly
- [ ] Error handling shows user-friendly messages

### Test Commands

```bash
# Run Storybook to test components
npm run storybook

# Navigate to:
# - ChatSidebar/ToolCallPreview
# - ChatSidebar/ContentPreview

# Test in actual chat:
# 1. Open ChatSidebar
# 2. Type: "Generate an explanation about Japanese particles"
# 3. Verify ToolCallPreview appears
# 4. Edit parameters if needed
# 5. Click "Execute"
# 6. Verify ContentPreview appears with generated content
# 7. Click "Insert into Editor"
# 8. Verify content appears in editor as Lexical nodes
```

## Future Enhancements

### Planned Features

1. **Batch Tool Execution**
   - Select multiple tool calls and execute all at once
   - Progress tracking for batch operations

2. **Template Library**
   - Save custom content templates
   - Quick access to frequently used patterns
   - Share templates across team

3. **Advanced Content Editing**
   - In-place editing of generated content before insertion
   - WYSIWYG editor for content refinement
   - Grammar/spelling check integration

4. **Content History**
   - Track all generated content
   - Reuse previous generations
   - Compare different versions

5. **Custom Lexical Nodes from AI**
   - Generate QuizNode directly from AI
   - Create MeaningAssociationNode from vocab lists
   - Build WordBlock from extracted terms

6. **Collaborative Review**
   - Share tool confirmations with team members
   - Approval workflow for content generation
   - Comments on generated content

## Architecture Decisions

### Why Client-Side Tool Confirmation?

**Reasoning**:
1. **User Control** - Users should review AI actions before execution
2. **Data Safety** - Prevents accidental creates/deletes
3. **Parameter Refinement** - Users can adjust parameters based on preview
4. **Educational Value** - Users learn what parameters do

### Why Separate Preview Components?

**Reasoning**:
1. **Reusability** - Components can be used outside ChatSidebar
2. **Testability** - Easier to test in isolation via Storybook
3. **Maintainability** - Clear separation of concerns
4. **Type Safety** - TypeScript interfaces define clear contracts

### Why Lexical for Content Preview?

**Reasoning**:
1. **Consistency** - Same rendering as main editor
2. **Accuracy** - Preview shows exactly what will be inserted
3. **Feature Parity** - Supports all editor nodes/formatting
4. **Performance** - Efficient rendering with virtual DOM

## Troubleshooting

### Issue: Tool Confirmation Not Appearing

**Solution**: Check that tool executor returns `requiresConfirmation: true`:
```javascript
return {
  success: true,
  requiresConfirmation: true,
  // ... other fields
};
```

### Issue: Content Preview Not Rendering

**Solution**: Ensure Content Preview receives proper format:
```typescript
<ContentPreview
  format="markdown"  // Must be 'markdown' for Lexical rendering
  generatedContent="## Title\n\nContent"  // Valid markdown
/>
```

### Issue: Insert Button Not Working

**Solution**: Verify `onInsert` callback is provided and editor ref exists:
```javascript
const handleInsert = (content, format) => {
  if (!editorRef?.current) {
    console.error('Editor not available');
    return;
  }
  // ... insert logic
};
```

### Issue: Markdown Not Converting to Lexical

**Solution**: Check TRANSFORMERS import and node registration:
```typescript
import { TRANSFORMERS } from '@lexical/markdown';
import { HeadingNode, ListNode, ... } from '@lexical/rich-text';

const config = {
  nodes: [HeadingNode, ListNode, /* all required nodes */],
  editorState: () => $convertFromMarkdownString(content, TRANSFORMERS)
};
```

## Related Documentation

- [CHATBOT_TOOLS.md](./CHATBOT_TOOLS.md) - Tool calling implementation
- [CLIENT_SIDE_TOOL_HANDLING.md](./CLIENT_SIDE_TOOL_HANDLING.md) - Tool execution patterns
- [Editor3 README](../src/components/Editor3/plugins/README.md) - Lexical node documentation
- [TypeScript Migration Guide](./TYPESCRIPT_MIGRATION.md) - TS conversion patterns

## Contributors

- Implementation: GitHub Copilot (January 25, 2026)
- Based on existing ChatSidebar and Editor3 patterns
