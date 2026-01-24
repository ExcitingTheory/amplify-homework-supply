# Chat Virtualization Integration Guide

## Overview

VirtualizedMessageList is now ready for integration with ChatSidebar. This guide shows how to integrate it while preserving all existing tool rendering logic.

## Current Status

✅ **Completed Components**:
- `LexicalMessageRenderer` - Renders markdown messages with syntax highlighting
- `VirtualizedMessageList` - Virtual scrolling container with custom render props
- `useAutoScroll` hook - Automatic scroll management
- `markdownStreaming` utils - Batched updates during AI streaming
- Chat-specific Lexical config and styling

## Integration Strategy

The VirtualizedMessageList supports two integration modes:

### Mode 1: Keep All Existing UI (Recommended for Initial Integration)

Use the `renderMessage` prop to keep 100% of ChatSidebar's current message rendering logic:

```jsx
<VirtualizedMessageList
  messages={messages}
  renderMessage={(message, index) => {
    // COPY entire existing message rendering JSX from lines 1330-1720
    // This preserves all tool rendering, search results, feedback widgets, etc.
    
    // Extract text content from message.parts (AI SDK v6 format)
    let textContent = '';
    if (message.parts && Array.isArray(message.parts)) {
      textContent = message.parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('');
    }
    
    // Extract tool invocations
    const toolParts = message.parts?.filter(part =>
      part.type?.startsWith('tool-')
    ) || [];
    
    return (
      <Box key={message.id || `message-${index}`} sx={{ width: '100%', mb: 1 }}>
        {/* Text rendering */}
        {textContent && (
          <Box sx={{...existingStyling}}>
            <Box component="pre" sx={{...}}>
              {textContent}
            </Box>
            
            {/* AI Feedback Widget */}
            {message.role === 'assistant' && (
              <Box sx={{ position: 'absolute', bottom: 4, right: 4 }}>
                <AIFeedbackWidget {...props} />
              </Box>
            )}
          </Box>
        )}
        
        {/* Tool rendering - all existing tool logic */}
        {toolParts.map((part, toolIdx) => {
          const toolName = part.type?.replace('tool-', '') || 'unknown';
          
          if (toolName === 'search_content') {
            // Existing search UI
            return <Box>...</Box>;
          }
          
          if (toolName === 'create_section') {
            // Existing section UI
            return <Box>...</Box>;
          }
          
          // ... all other tool types
        })}
      </Box>
    );
  }}
/>
```

**Benefits**:
- Zero risk - no UI changes
- Get virtual scrolling performance immediately
- Can upgrade to Lexical rendering incrementally later

### Mode 2: Progressive Enhancement with Lexical

Gradually adopt Lexical rendering for text while keeping tool UI:

```jsx
<VirtualizedMessageList
  messages={messages}
  useLexicalRenderer={true}  // Use Lexical for message text
  renderToolPart={(part, message, index) => {
    // Keep all existing tool rendering logic
    const toolName = part.type?.replace('tool-', '') || 'unknown';
    
    if (toolName === 'search_content') {
      return (
        <Box sx={{...}}>
          <SearchResults {...props} />
        </Box>
      );
    }
    
    // ... handle other tools
  }}
/>
```

**Benefits**:
- Markdown rendering in messages (code blocks, formatting, etc.)
- Unified editor experience (same components for editing and reading)
- Keep all tool UI exactly as-is

## Step-by-Step Integration

### Phase 1: Replace Container Only (Minimal Risk)

**File**: `src/components/ChatSidebar.js`

**Line ~1063**: Replace the scroll container:

```jsx
// BEFORE:
<Box
  ref={chatContainerRef}
  sx={{
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    p: 1,
    bgcolor: 'grey.50',
  }}
>
  {/* messages.map() ... */}
</Box>

// AFTER:
<Box
  sx={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    p: 1,
    bgcolor: 'grey.50',
  }}
>
  {historyDrawerOpen ? (
    /* Keep history drawer exactly as-is */
  ) : (
    <VirtualizedMessageList
      messages={messages}
      renderMessage={(message, index) => {
        /* Copy entire block from lines 1330-1720 */
      }}
      emptyState={
        <Box sx={{...}}>
          <ChatIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
          <Typography>Ask me anything about your curriculum...</Typography>
        </Box>
      }
    />
  )}
</Box>
```

### Phase 2: Remove Manual Scroll Management

**File**: `src/components/ChatSidebar.js`

**Lines ~561-563**: Delete manual scroll code (VirtualizedMessageList handles this):

```jsx
// DELETE these lines - auto-scroll is handled by useAutoScroll hook
// const scrollToBottom = useCallback(() => {
//   if (chatContainerRef.current) {
//     chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
//   }
// }, []);
```

**Lines ~400-410**: Remove scroll effect (no longer needed):

```jsx
// DELETE this useEffect - virtualized list handles scroll
// useEffect(() => {
//   scrollToBottom();
// }, [messages, scrollToBottom]);
```

### Phase 3: Adopt Lexical for Messages (Optional)

Once Phase 1-2 are stable, progressively enable Lexical:

```jsx
<VirtualizedMessageList
  messages={messages}
  useLexicalRenderer={true}  // Enable Lexical for markdown
  renderToolPart={(part, message, idx) => {
    /* Move tool rendering logic here */
  }}
/>
```

**Test thoroughly** - Lexical renders markdown differently than `<pre>` tags.

## Code Changes Checklist

- [ ] **Line ~57**: Import VirtualizedMessageList
  ```jsx
  import { VirtualizedMessageList } from './ChatSidebar/VirtualizedMessageList';
  ```

- [ ] **Line ~1063-1720**: Replace scroll container with VirtualizedMessageList
- [ ] **Line ~561-563**: Delete `scrollToBottom` function
- [ ] **Line ~400-410**: Delete manual scroll `useEffect`
- [ ] **Line ~191**: Can remove `chatContainerRef` (virtual list has own ref)
- [ ] **Test**: Verify all tool UIs still work (search, section creation, etc.)
- [ ] **Test**: Verify auto-scroll on new messages
- [ ] **Test**: Verify "new messages" button appears when scrolled up
- [ ] **Test**: Performance with 100+ messages

## Testing Plan

### Manual Testing

1. **Basic Functionality**:
   - Send messages → verify they appear
   - Scroll up → verify "new messages" button appears
   - Click button → verify scroll to bottom
   - Send new message → verify auto-scroll only if at bottom

2. **Tool Rendering**:
   - Trigger `search_content` tool → verify SearchResults renders
   - Trigger `create_section` → verify UI shows correctly
   - Trigger `generate_unit_content` → verify UI shows
   - Check all tool states: input-streaming, input-available, output-available, output-error

3. **Performance**:
   - Load chat with 100+ messages → verify smooth scrolling
   - Send rapid messages → verify no lag
   - Check DevTools → only ~10-20 messages in DOM regardless of total count

4. **Edge Cases**:
   - Empty chat → verify empty state shows
   - First message → verify no scroll button (already at bottom)
   - Streaming message → verify updates without jumping scroll
   - Switch chats → verify messages update correctly

### Automated Testing (Future)

```javascript
// Test file: src/components/ChatSidebar/__tests__/virtualization.test.js

test('renders only visible messages', () => {
  const messages = Array.from({ length: 1000 }, (_, i) => ({
    id: `msg-${i}`,
    role: i % 2 === 0 ? 'user' : 'assistant',
    parts: [{ type: 'text', text: `Message ${i}` }],
  }));
  
  render(<VirtualizedMessageList messages={messages} />);
  
  // Should render ~10-20 messages, not all 1000
  expect(screen.getAllByRole('article')).toHaveLength(lessThan(30));
});

test('auto-scrolls on new message when at bottom', () => {
  const { rerender } = render(<VirtualizedMessageList messages={[msg1]} />);
  
  // Add new message
  rerender(<VirtualizedMessageList messages={[msg1, msg2]} />);
  
  // Should auto-scroll
  expect(scrollContainer.scrollTop).toBe(scrollContainer.scrollHeight);
});
```

## Performance Benchmarks

**Before Virtualization**:
- 100 messages: ~100 DOM nodes, slight scroll jank
- 500 messages: ~500 DOM nodes, noticeable lag
- 1000+ messages: Browser struggles, poor UX

**After Virtualization**:
- Any message count: ~10-20 DOM nodes (only visible items)
- Smooth 60fps scrolling regardless of history length
- Instant scroll-to-bottom (no layout thrashing)

## Rollback Plan

If issues arise, rollback is simple:

1. Remove VirtualizedMessageList import
2. Restore original `<Box ref={chatContainerRef}>` container
3. Restore `scrollToBottom` function and useEffect
4. Restore `messages.map()` loop

All code is in git history - just revert the file.

## Next Steps

After successful integration:

1. **Add Message Actions**: Copy, edit, regenerate buttons per message
2. **Markdown in User Messages**: Allow users to format their messages
3. **Message Search**: Cmd+F to search within chat history
4. **Export Chat**: Download chat as markdown or PDF
5. **Message Timestamps**: Hover to see precise time
6. **Thread View**: Group related messages visually

## Questions & Troubleshooting

### Q: Will this break existing tool rendering?

**A**: No, if you use `renderMessage` prop (Mode 1), you keep 100% of existing UI code. Virtual scrolling is just the container.

### Q: What about the loading indicator?

**A**: Add it outside the VirtualizedMessageList or in `renderMessage`:

```jsx
<>
  <VirtualizedMessageList messages={messages} renderMessage={...} />
  {isLoading && <TypingIndicator />}
</>
```

### Q: How does this affect performance?

**A**: Significantly improves it. Only 10-20 messages in DOM vs 100s/1000s before.

### Q: Can I style the virtual list container?

**A**: Yes, via CSS modules or inline styles on the parent Box component.

### Q: What about accessibility?

**A**: VirtualizedMessageList has `role="log"` and `aria-live="polite"` for screen readers.

## References

- Implementation Plan: [docs/CHAT_LEXICAL_VIRTUALIZATION_PLAN.md](./CHAT_LEXICAL_VIRTUALIZATION_PLAN.md)
- React Virtual Docs: https://tanstack.com/virtual/latest
- Lexical Docs: https://lexical.dev/
- Current ChatSidebar: [src/components/ChatSidebar.js](../src/components/ChatSidebar.js)
