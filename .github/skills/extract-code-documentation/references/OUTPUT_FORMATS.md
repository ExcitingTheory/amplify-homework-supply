# Extract Code Documentation - Output Formats

Detailed documentation of output formats for extracted docblocks.

## JSON Output Format

### Component Metadata
```json
{
  "components": [
    {
      "name": "ChatSidebar",
      "filePath": "src/components/ChatSidebar.tsx",
      "namespace": "components",
      "docblock": {
        "description": "Real-time chat interface with AI streaming",
        "tags": {
          "param": [
            {
              "name": "messages",
              "type": "Message[]",
              "description": "Array of chat messages with parts format"
            }
          ],
          "returns": {
            "type": "JSX.Element",
            "description": "Rendered chat sidebar"
          },
          "example": [
            "<ChatSidebar messages={messages} onSend={handleSend} />"
          ]
        }
      },
      "props": [
        {
          "name": "messages",
          "type": "Message[]",
          "required": true,
          "description": "Chat messages array"
        }
      ],
      "exports": ["ChatSidebar", "ChatSidebarProps"],
      "dependencies": ["@ai-sdk/react", "UnitContext"],
      "features": ["streaming", "tool-calls", "accessibility"]
    }
  ],
  "metadata": {
    "totalComponents": 42,
    "namespaces": ["components", "context", "utils"],
    "extractedAt": "2026-01-30T12:00:00Z",
    "version": "1.0.0"
  }
}
```

---

## Markdown Output Format

### Per-Component Documentation
```markdown
# ChatSidebar

**Path**: `src/components/ChatSidebar.tsx`  
**Namespace**: `components`

## Description
Real-time chat interface with AI streaming

## Props
| Name | Type | Required | Description |
|------|------|----------|-------------|
| messages | Message[] | ✓ | Chat messages array |
| onSend | (text: string) => void | ✓ | Message send handler |
| streaming | boolean | | Enable streaming mode |

## Examples
\`\`\`tsx
<ChatSidebar 
  messages={messages} 
  onSend={handleSend}
  streaming={true}
/>
\`\`\`

## Dependencies
- `@ai-sdk/react` - useChat hook
- `UnitContext` - Unit data provider

## Features
- ✅ Streaming responses
- ✅ Tool call handling
- ✅ Accessibility (ARIA)
- ✅ Keyboard shortcuts

## Related
- [ChatMessage](./ChatMessage.md)
- [MessagePart](./MessagePart.md)
```

---

## Translation Metadata Format

### For i18n Workflows
```json
{
  "translationMetadata": {
    "components": [
      {
        "name": "ChatSidebar",
        "namespace": "components",
        "translationKeys": [
          {
            "key": "chat.sidebar.placeholder",
            "defaultText": "Type a message...",
            "context": "Input placeholder",
            "location": "line 45"
          },
          {
            "key": "chat.sidebar.send",
            "defaultText": "Send",
            "context": "Submit button",
            "location": "line 67"
          }
        ],
        "ariaLabels": [
          {
            "key": "chat.sidebar.label",
            "defaultText": "Chat conversation",
            "element": "main container"
          }
        ]
      }
    ],
    "totalKeys": 156,
    "languages": ["en", "ja", "es", "fr"]
  }
}
```

---

## Namespace Organization

### Standard Namespaces
```json
{
  "namespaces": {
    "components": {
      "description": "React components",
      "pattern": "src/components/**/*.{tsx,jsx}",
      "count": 42
    },
    "context": {
      "description": "React Context providers",
      "pattern": "src/context/**/*.{ts,js}",
      "count": 8
    },
    "utils": {
      "description": "Utility functions",
      "pattern": "src/utils/**/*.{ts,js}",
      "count": 23
    },
    "hooks": {
      "description": "Custom React hooks",
      "pattern": "src/hooks/**/*.{ts,js}",
      "count": 15
    },
    "graphql": {
      "description": "GraphQL operations",
      "pattern": "src/graphql/**/*.ts",
      "count": 34
    }
  }
}
```

---

## Detailed Docblock Structure

### JSDoc/TSDoc Tag Mapping
```typescript
interface DocblockTags {
  // Basic info
  description?: string;
  deprecated?: string;
  since?: string;
  version?: string;
  
  // Parameters and returns
  param?: Array<{
    name: string;
    type: string;
    description: string;
    optional?: boolean;
    default?: string;
  }>;
  returns?: {
    type: string;
    description: string;
  };
  
  // Examples
  example?: string[];
  
  // Links and references
  see?: string[];
  link?: string[];
  related?: string[];
  
  // Custom project tags
  context?: string;        // "Requires UnitContext"
  datastore?: string[];    // ["Unit", "Grade"]
  amplify?: string[];      // ["Storage", "Auth"]
  experimental?: boolean;
  internal?: boolean;
}
```

---

## CSV Export Format

### For Spreadsheet Analysis
```csv
Name,FilePath,Namespace,Description,Props,Dependencies,Features
ChatSidebar,src/components/ChatSidebar.tsx,components,"Real-time chat interface","messages:Message[],onSend:Function","@ai-sdk/react,UnitContext","streaming,tool-calls"
Editor3,src/components/Editor3/Editor3.tsx,components,"Lexical rich text editor","initialContent:JSON,onSave:Function","lexical,UnitContext","custom-nodes,plugins"
```

---

## HTML Documentation Format

### For Static Site Generation
```html
<!DOCTYPE html>
<html>
<head>
  <title>ChatSidebar - Component Documentation</title>
</head>
<body>
  <article>
    <header>
      <h1>ChatSidebar</h1>
      <p class="path">src/components/ChatSidebar.tsx</p>
    </header>
    
    <section class="description">
      <p>Real-time chat interface with AI streaming</p>
    </section>
    
    <section class="props">
      <h2>Props</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Type</th><th>Required</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>messages</td>
            <td><code>Message[]</code></td>
            <td>✓</td>
          </tr>
        </tbody>
      </table>
    </section>
  </article>
</body>
</html>
```

---

## Integration Formats

### Storybook Meta Export
```typescript
// Auto-generated from docblocks
export default {
  title: 'Components/ChatSidebar',
  component: ChatSidebar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Real-time chat interface with AI streaming'
      }
    }
  },
  argTypes: {
    messages: {
      description: 'Chat messages array',
      control: 'object'
    }
  }
} satisfies Meta<typeof ChatSidebar>;
```

### TypeDoc Compatibility
```typescript
/**
 * Real-time chat interface with AI streaming
 * 
 * @remarks
 * This component handles message.parts format for streaming responses.
 * 
 * @param messages - Array of chat messages
 * @param onSend - Message send handler
 * 
 * @example
 * ```tsx
 * <ChatSidebar messages={messages} onSend={handleSend} />
 * ```
 * 
 * @see {@link ChatMessage}
 * @see {@link UnitContext}
 */
```
