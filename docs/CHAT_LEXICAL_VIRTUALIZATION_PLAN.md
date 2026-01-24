# Chat Messages with Lexical Editor & Virtual Scrolling

**Status:** Planning  
**Priority:** Medium  
**Created:** January 25, 2026  
**Dependencies:** Lexical Editor, ChatSidebar component

---

## Overview

Implement markdown rendering for chat messages using Lexical editor surfaces with virtual scrolling for performance. This creates a unified editing and reading experience across the application.

**Goals:**
- 📝 Render markdown in chat messages using Lexical (read-only mode)
- ⚡ Virtual scrolling for long chat histories (100+ messages)
- 🎨 Unified editing experience - same Lexical components everywhere
- 🔄 Support streaming markdown from AI responses
- 💬 Enable rich formatting in chat (code blocks, lists, links, etc.)

---

## Current State

### ChatSidebar Component Architecture

**File:** [src/components/ChatSidebar.js](../src/components/ChatSidebar.js)

**Current Message Rendering:**
```jsx
// Simple text rendering
{message.parts
  .filter(p => p.type === 'text')
  .map(p => p.text)
  .join('')}
```

**Issues:**
1. No markdown parsing - plain text only
2. Large chat histories cause performance issues
3. No code syntax highlighting
4. Inconsistent with editor's rich text experience
5. No virtual scrolling - renders all messages at once

---

## Proposed Architecture

### 1. Lexical Message Renderer Component

**New File:** `src/components/ChatSidebar/LexicalMessageRenderer.jsx`

**Purpose:** Read-only Lexical editor for rendering individual chat messages

**Features:**
- Parse markdown to Lexical JSON on message receive
- Read-only editor state
- Support all Lexical nodes (code, list, link, heading, etc.)
- Inline rendering (no scrollbars)
- Minimal toolbar/chrome

**Example Usage:**
```jsx
<LexicalMessageRenderer
  content={message.markdown}
  isStreaming={message.isStreaming}
  onStreamUpdate={handleStreamUpdate}
/>
```

---

### 2. Virtual Scrolling Integration

**Library:** `react-window` or `@tanstack/react-virtual`

**Recommendation:** `@tanstack/react-virtual` (better TypeScript support, more flexible)

**Install:**
```bash
npm install @tanstack/react-virtual
```

**New File:** `src/components/ChatSidebar/VirtualizedMessageList.jsx`

**Features:**
- Render only visible messages
- Dynamic height calculation per message
- Scroll to bottom on new message
- Preserve scroll position when loading history
- Smooth scrolling animations

**Example Structure:**
```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedMessageList = ({ messages }) => {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated message height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <LexicalMessageRenderer content={message.content} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

### 3. Markdown to Lexical Conversion

**Existing Utility:** [src/components/Editor3/utils/markdown.js](../src/components/Editor3/utils/markdown.js)

**Current Functions:**
- `$convertFromMarkdownString()` - Convert markdown to Lexical nodes
- `$convertToMarkdownString()` - Convert Lexical nodes to markdown

**Enhancement Needed:**
Create streaming-compatible version for AI chat responses:

**New File:** `src/components/ChatSidebar/utils/markdownStreaming.js`

```javascript
import { $convertFromMarkdownString } from '../../Editor3/utils/markdown';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

/**
 * Convert streaming markdown chunks to Lexical state
 * Handles incomplete markdown during AI streaming
 */
export function $convertStreamingMarkdown(accumulatedMarkdown, isComplete = false) {
  try {
    // Try to parse as complete markdown
    if (isComplete) {
      return $convertFromMarkdownString(accumulatedMarkdown);
    }
    
    // During streaming, handle incomplete markdown gracefully
    // Split by double newline to get complete paragraphs
    const completeParagraphs = accumulatedMarkdown.split('\n\n');
    const incomplete = completeParagraphs.pop(); // Last paragraph might be incomplete
    
    // Parse complete paragraphs
    const completeMarkdown = completeParagraphs.join('\n\n');
    if (completeMarkdown) {
      $convertFromMarkdownString(completeMarkdown);
    }
    
    // Append incomplete text as plain paragraph
    if (incomplete) {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(incomplete));
      root.append(paragraph);
    }
  } catch (error) {
    console.error('Error parsing streaming markdown:', error);
    // Fallback to plain text
    const root = $getRoot();
    root.clear();
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode(accumulatedMarkdown));
    root.append(paragraph);
  }
}
```

---

### 4. Unified Editor Surfaces

**Component Hierarchy:**

```
Editor3/ (Base Lexical Editor)
├── Toolbar (conditional)
├── ContentEditable (conditional read-only)
├── Plugins
│   ├── MarkdownPlugin
│   ├── CodeHighlightPlugin
│   ├── LinkPlugin
│   └── ListPlugin
│
└── Usage Contexts:
    ├── Full Editor (units page)
    ├── Chat Input (ChatSidebar - editable)
    └── Chat Messages (ChatSidebar - read-only)
```

**Shared Configuration:**

**New File:** `src/components/Editor3/configs/chatMessageConfig.js`

```javascript
import { HeadingNode } from '@lexical/rich-text';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';

export const chatMessageEditorConfig = {
  namespace: 'ChatMessage',
  theme: {
    // Minimal theme for chat messages
    paragraph: 'chat-message-paragraph',
    heading: {
      h1: 'chat-message-h1',
      h2: 'chat-message-h2',
      h3: 'chat-message-h3',
    },
    list: {
      ul: 'chat-message-ul',
      ol: 'chat-message-ol',
      listitem: 'chat-message-li',
    },
    code: 'chat-message-code',
    codeHighlight: {
      // Syntax highlighting classes
    },
    link: 'chat-message-link',
  },
  nodes: [
    HeadingNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    ListNode,
    ListItemNode,
  ],
  editable: false, // Read-only for message display
  onError: (error) => {
    console.error('Lexical chat message error:', error);
  },
};
```

---

## Implementation Plan

### Phase 1: LexicalMessageRenderer Component

**Tasks:**
1. Create `LexicalMessageRenderer.jsx` component
2. Integrate with existing Editor3 infrastructure
3. Add markdown parsing on mount
4. Support streaming updates
5. Add chat-specific styling

**Files:**
- `src/components/ChatSidebar/LexicalMessageRenderer.jsx` (new)
- `src/components/ChatSidebar/LexicalMessageRenderer.module.css` (new)
- `src/components/Editor3/configs/chatMessageConfig.js` (new)

**Testing:**
- Unit tests for markdown parsing
- Storybook stories for different message types
- Test streaming behavior

**Effort:** 6-8 hours

---

### Phase 2: Virtual Scrolling

**Tasks:**
1. Install `@tanstack/react-virtual`
2. Create `VirtualizedMessageList.jsx` component
3. Implement dynamic height measurement
4. Handle scroll-to-bottom on new messages
5. Preserve scroll position during updates
6. Add scroll indicators (e.g., "New messages below")

**Files:**
- `src/components/ChatSidebar/VirtualizedMessageList.jsx` (new)
- `src/components/ChatSidebar/VirtualizedMessageList.module.css` (new)

**Testing:**
- Test with 100+ messages
- Test dynamic height changes
- Test scroll behavior on message arrival
- Performance benchmarks (before/after)

**Effort:** 8-10 hours

---

### Phase 3: Streaming Markdown Support

**Tasks:**
1. Create `markdownStreaming.js` utility
2. Update `useChat` integration to accumulate markdown
3. Handle incomplete markdown during streaming
4. Update message parts parsing for markdown content
5. Add loading indicators for streaming messages

**Files:**
- `src/components/ChatSidebar/utils/markdownStreaming.js` (new)
- `src/components/ChatSidebar.js` (update)

**Testing:**
- Test with streaming AI responses
- Test with code blocks during streaming
- Test with lists and headings during streaming
- Test error recovery for malformed markdown

**Effort:** 6-8 hours

---

### Phase 4: ChatSidebar Integration

**Tasks:**
1. Replace current message rendering with `VirtualizedMessageList`
2. Update message data structure to store markdown
3. Migrate existing messages to markdown format
4. Update Storybook stories with new components
5. Add CSS for chat-specific Lexical styling

**Files:**
- `src/components/ChatSidebar.js` (update)
- `src/components/ChatSidebar.module.css` (update)
- `src/components/ChatSidebar.stories.jsx` (update)

**Testing:**
- Full integration test with ChatSidebar
- Test with real AI streaming
- Test with tool results
- Test message history loading

**Effort:** 8-10 hours

---

### Phase 5: Polish & Optimization

**Tasks:**
1. Add syntax highlighting for code blocks
2. Optimize re-renders (React.memo, useMemo)
3. Add animations (message fade-in, scroll)
4. Improve accessibility (ARIA labels, keyboard nav)
5. Add copy-to-clipboard for code blocks
6. Add message actions (edit, delete, regenerate)

**Files:**
- Various component updates
- CSS transitions and animations

**Testing:**
- Performance profiling
- Accessibility audit
- Cross-browser testing

**Effort:** 6-8 hours

---

## Total Effort: 34-44 hours (~1 week)

---

## Technical Considerations

### 1. Message Data Structure

**Current Structure (Vercel AI SDK):**
```javascript
{
  id: 'msg-123',
  role: 'user' | 'assistant',
  parts: [
    { type: 'text', text: 'Hello world' },
    { type: 'tool-search', toolCallId: '...', input: {...}, output: {...} }
  ]
}
```

**Proposed Enhanced Structure:**
```javascript
{
  id: 'msg-123',
  role: 'user' | 'assistant',
  content: {
    markdown: '# Hello\n\nThis is **markdown**',
    lexicalJSON: {...}, // Cached Lexical state
  },
  parts: [...], // Keep for tool calls
  isStreaming: false,
  metadata: {
    timestamp: Date,
    tokenCount: number,
  }
}
```

---

### 2. Performance Optimization

**Challenges:**
- Large chat histories (100+ messages)
- Real-time streaming updates
- Markdown parsing overhead
- Lexical editor instances (one per message)

**Solutions:**

**A. Virtual Scrolling:**
- Only render visible messages + overscan
- Estimated: ~10-15 messages rendered at once (vs 100+)
- Expected performance gain: 5-10x

**B. Memoization:**
```jsx
const LexicalMessageRenderer = React.memo(({ content, isStreaming }) => {
  // Only re-render if content or streaming status changes
}, (prevProps, nextProps) => {
  return prevProps.content === nextProps.content && 
         prevProps.isStreaming === nextProps.isStreaming;
});
```

**C. Lazy Markdown Parsing:**
```javascript
// Parse markdown only when message enters viewport
const useLazyMarkdownParsing = (markdown, isVisible) => {
  const [lexicalState, setLexicalState] = useState(null);
  
  useEffect(() => {
    if (isVisible && !lexicalState) {
      const parsed = parseMarkdownToLexical(markdown);
      setLexicalState(parsed);
    }
  }, [isVisible, markdown]);
  
  return lexicalState;
};
```

**D. Lexical State Caching:**
```javascript
// Cache parsed Lexical state to avoid re-parsing
const messageCache = new Map(); // message.id -> lexicalState

const getCachedLexicalState = (messageId, markdown) => {
  if (messageCache.has(messageId)) {
    return messageCache.get(messageId);
  }
  
  const state = parseMarkdownToLexical(markdown);
  messageCache.set(messageId, state);
  return state;
};
```

---

### 3. Streaming Updates Strategy

**Challenge:** AI responses stream character-by-character, but Lexical re-parsing is expensive

**Solution:** Batched Updates

```javascript
const useStreamingMarkdown = (initialContent = '') => {
  const [content, setContent] = useState(initialContent);
  const accumulatorRef = useRef('');
  const timeoutRef = useRef(null);
  
  const appendChunk = useCallback((chunk) => {
    accumulatorRef.current += chunk;
    
    // Debounce updates - only update Lexical every 100ms
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setContent(accumulatorRef.current);
    }, 100);
  }, []);
  
  const finalize = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setContent(accumulatorRef.current);
  }, []);
  
  return { content, appendChunk, finalize };
};
```

---

### 4. Scroll Behavior

**Requirements:**
1. Auto-scroll to bottom on new messages (user or AI)
2. Don't auto-scroll if user has scrolled up (reading history)
3. Show "New messages" indicator when not at bottom
4. Smooth scroll animation

**Implementation:**

```javascript
const useAutoScroll = (messages, containerRef) => {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  
  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
    
    setIsAtBottom(atBottom);
    
    if (atBottom) {
      setHasNewMessages(false);
    }
  }, []);
  
  // Auto-scroll on new message if at bottom
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else if (messages.length > 0) {
      setHasNewMessages(true);
    }
  }, [messages.length, isAtBottom]);
  
  const scrollToBottom = useCallback(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, []);
  
  return { isAtBottom, hasNewMessages, scrollToBottom, handleScroll };
};
```

---

## Code Examples

### Example 1: LexicalMessageRenderer

```jsx
// src/components/ChatSidebar/LexicalMessageRenderer.jsx
import React, { useEffect, useMemo } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertFromMarkdownString } from '../Editor3/utils/markdown';
import { chatMessageEditorConfig } from '../Editor3/configs/chatMessageConfig';
import styles from './LexicalMessageRenderer.module.css';

const MarkdownContentPlugin = ({ content, isStreaming }) => {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    if (!content) return;
    
    editor.update(() => {
      $convertFromMarkdownString(content, isStreaming ? 'partial' : 'complete');
    });
  }, [content, isStreaming, editor]);
  
  return null;
};

export const LexicalMessageRenderer = React.memo(({ 
  content, 
  isStreaming = false,
  className 
}) => {
  const config = useMemo(() => ({
    ...chatMessageEditorConfig,
    editorState: null, // Will be set by plugin
  }), []);
  
  return (
    <div className={`${styles.messageRenderer} ${className || ''}`}>
      <LexicalComposer initialConfig={config}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className={styles.contentEditable}
              ariaLabel="Message content"
            />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <MarkdownContentPlugin content={content} isStreaming={isStreaming} />
        <MarkdownShortcutPlugin />
      </LexicalComposer>
    </div>
  );
});

LexicalMessageRenderer.displayName = 'LexicalMessageRenderer';
```

---

### Example 2: VirtualizedMessageList

```jsx
// src/components/ChatSidebar/VirtualizedMessageList.jsx
import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LexicalMessageRenderer } from './LexicalMessageRenderer';
import { MessageHeader } from './MessageHeader';
import { ToolResults } from './ToolResults';
import styles from './VirtualizedMessageList.module.css';

export const VirtualizedMessageList = ({ 
  messages, 
  onScrollToBottom,
  showScrollButton 
}) => {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // Estimated message height
    overscan: 5,
  });
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: 'end',
        behavior: 'smooth',
      });
    }
  }, [messages.length]);
  
  return (
    <div className={styles.container}>
      <div ref={parentRef} className={styles.scrollContainer}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const message = messages[virtualItem.index];
            const isUser = message.role === 'user';
            
            // Extract text and tool parts
            const textContent = message.parts
              ?.filter(p => p.type === 'text')
              .map(p => p.text)
              .join('') || '';
            
            const toolParts = message.parts
              ?.filter(p => p.type?.startsWith('tool-')) || [];
            
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className={`${styles.messageWrapper} ${isUser ? styles.user : styles.assistant}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <MessageHeader role={message.role} timestamp={message.createdAt} />
                
                {textContent && (
                  <LexicalMessageRenderer
                    content={textContent}
                    isStreaming={message.isStreaming}
                  />
                )}
                
                {toolParts.length > 0 && (
                  <ToolResults parts={toolParts} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {showScrollButton && (
        <button 
          className={styles.scrollToBottom}
          onClick={onScrollToBottom}
          aria-label="Scroll to bottom"
        >
          ↓ New messages
        </button>
      )}
    </div>
  );
};
```

---

### Example 3: Updated ChatSidebar Integration

```jsx
// src/components/ChatSidebar.js (updated)
import { VirtualizedMessageList } from './ChatSidebar/VirtualizedMessageList';
import { useAutoScroll } from './ChatSidebar/hooks/useAutoScroll';

export default function ChatSidebar({ open, onClose }) {
  const { messages, input, handleSubmit, handleInputChange, isLoading } = useChat({
    api: '/api/chat',
    // ... other options
  });
  
  const containerRef = useRef(null);
  const { isAtBottom, hasNewMessages, scrollToBottom, handleScroll } = useAutoScroll(
    messages,
    containerRef
  );
  
  return (
    <Drawer open={open} onClose={onClose}>
      <Box className={classes.chatContainer}>
        <VirtualizedMessageList
          messages={messages}
          onScrollToBottom={scrollToBottom}
          showScrollButton={!isAtBottom && hasNewMessages}
        />
        
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </Box>
    </Drawer>
  );
}
```

---

## Styling Considerations

### Chat-Specific Lexical Theme

```css
/* src/components/ChatSidebar/LexicalMessageRenderer.module.css */

.messageRenderer {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
}

.contentEditable {
  outline: none;
  padding: 0;
  min-height: auto;
}

/* Headings in chat should be smaller */
.messageRenderer :global(.chat-message-h1) {
  font-size: 1.5em;
  margin: 0.5em 0;
  font-weight: 600;
}

.messageRenderer :global(.chat-message-h2) {
  font-size: 1.3em;
  margin: 0.4em 0;
  font-weight: 600;
}

.messageRenderer :global(.chat-message-h3) {
  font-size: 1.1em;
  margin: 0.3em 0;
  font-weight: 600;
}

/* Code blocks */
.messageRenderer :global(.chat-message-code) {
  background: var(--code-bg);
  border-radius: 4px;
  padding: 12px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  overflow-x: auto;
  margin: 8px 0;
}

/* Inline code */
.messageRenderer :global(code) {
  background: var(--code-inline-bg);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

/* Lists */
.messageRenderer :global(.chat-message-ul),
.messageRenderer :global(.chat-message-ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.messageRenderer :global(.chat-message-li) {
  margin: 4px 0;
}

/* Links */
.messageRenderer :global(.chat-message-link) {
  color: var(--link-color);
  text-decoration: underline;
  cursor: pointer;
}

.messageRenderer :global(.chat-message-link:hover) {
  text-decoration: none;
}

/* Paragraphs */
.messageRenderer :global(.chat-message-paragraph) {
  margin: 8px 0;
}

.messageRenderer :global(.chat-message-paragraph:first-child) {
  margin-top: 0;
}

.messageRenderer :global(.chat-message-paragraph:last-child) {
  margin-bottom: 0;
}
```

---

## Testing Strategy

### Unit Tests

```javascript
// src/components/ChatSidebar/LexicalMessageRenderer.test.jsx
import { render, screen } from '@testing-library/react';
import { LexicalMessageRenderer } from './LexicalMessageRenderer';

describe('LexicalMessageRenderer', () => {
  it('renders plain text', () => {
    render(<LexicalMessageRenderer content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
  
  it('renders markdown headings', () => {
    render(<LexicalMessageRenderer content="# Heading\n\nParagraph" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading');
  });
  
  it('renders code blocks', () => {
    const code = '```javascript\nconst x = 1;\n```';
    render(<LexicalMessageRenderer content={code} />);
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });
  
  it('handles streaming content', () => {
    const { rerender } = render(
      <LexicalMessageRenderer content="Hello" isStreaming={true} />
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    
    rerender(<LexicalMessageRenderer content="Hello world" isStreaming={true} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
```

### Integration Tests

```javascript
// src/components/ChatSidebar/VirtualizedMessageList.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { VirtualizedMessageList } from './VirtualizedMessageList';

const mockMessages = Array.from({ length: 100 }, (_, i) => ({
  id: `msg-${i}`,
  role: i % 2 === 0 ? 'user' : 'assistant',
  parts: [{ type: 'text', text: `Message ${i}` }],
}));

describe('VirtualizedMessageList', () => {
  it('renders only visible messages', () => {
    render(<VirtualizedMessageList messages={mockMessages} />);
    
    // Should not render all 100 messages
    const visibleMessages = screen.getAllByText(/Message \d+/);
    expect(visibleMessages.length).toBeLessThan(20); // Only ~15 visible
  });
  
  it('scrolls to bottom on new message', async () => {
    const { rerender } = render(
      <VirtualizedMessageList messages={mockMessages.slice(0, 50)} />
    );
    
    rerender(<VirtualizedMessageList messages={mockMessages} />);
    
    await waitFor(() => {
      // Last message should be in view
      expect(screen.getByText('Message 99')).toBeInTheDocument();
    });
  });
});
```

### Performance Tests

```javascript
// test/performance/chat-rendering.test.js
import { render } from '@testing-library/react';
import { VirtualizedMessageList } from '@/components/ChatSidebar/VirtualizedMessageList';

describe('Chat Rendering Performance', () => {
  it('renders 1000 messages without lag', () => {
    const largeMessageList = Array.from({ length: 1000 }, (_, i) => ({
      id: `msg-${i}`,
      role: 'assistant',
      parts: [{ type: 'text', text: `Message ${i}` }],
    }));
    
    const startTime = performance.now();
    render(<VirtualizedMessageList messages={largeMessageList} />);
    const renderTime = performance.now() - startTime;
    
    // Should render in under 100ms
    expect(renderTime).toBeLessThan(100);
  });
});
```

---

## Migration Path

### Step 1: Add Dependencies
```bash
npm install @tanstack/react-virtual
```

### Step 2: Create Components (Phases 1-2)
- LexicalMessageRenderer
- VirtualizedMessageList
- Supporting utilities

### Step 3: Update ChatSidebar (Phase 4)
- Replace message rendering
- Integrate virtual scrolling
- Update Storybook

### Step 4: Test & Optimize (Phase 5)
- Performance profiling
- Accessibility
- Cross-browser

---

## Success Criteria

- [ ] Markdown rendering works in chat messages
- [ ] Code syntax highlighting functional
- [ ] Virtual scrolling improves performance (5x+ with 100+ messages)
- [ ] Streaming markdown updates smoothly
- [ ] Auto-scroll behavior feels natural
- [ ] All Storybook stories updated and passing
- [ ] No accessibility regressions
- [ ] Performance benchmarks meet targets:
  - Initial render: < 100ms (1000 messages)
  - Streaming update: < 16ms (60fps)
  - Scroll performance: 60fps

---

## Future Enhancements

1. **Message Actions:**
   - Copy message
   - Edit message
   - Regenerate response
   - Delete message

2. **Advanced Formatting:**
   - Tables (Lexical TablePlugin)
   - Images (inline from AI)
   - Collapsible sections
   - Math equations (KaTeX)

3. **Message Threading:**
   - Reply to specific messages
   - Branch conversations

4. **Export:**
   - Export chat as markdown
   - Export chat as PDF
   - Share conversation link

---

## References

- [Lexical Documentation](https://lexical.dev/docs/intro)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Editor3 Components](../src/components/Editor3/)
- [ChatSidebar Component](../src/components/ChatSidebar.js)

---

**Status:** Ready for Implementation  
**Estimated Timeline:** 1 week  
**Next Step:** Begin Phase 1 - Create LexicalMessageRenderer
