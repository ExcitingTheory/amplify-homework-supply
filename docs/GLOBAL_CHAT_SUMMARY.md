# Global ChatSidebar - Quick Summary

## 📋 What We're Building

Make the AI chat assistant accessible from **every page** in the application with a **floating action button (FAB)** and shared state that persists across navigation.

## 🎯 Current State → Future State

### Current
- ✅ ChatSidebar fully functional
- ❌ Only in Unit Editor (commented out)
- ❌ No access from other pages
- ❌ State resets on navigation

### Future
- ✅ Floating chat button on all pages
- ✅ Drawer slides in from right
- ✅ State persists across pages
- ✅ Context-aware (knows what page you're on)
- ✅ Keyboard shortcut (Cmd/Ctrl+K)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    App Root (_app.jsx)                       │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │ ChatContextProvider (NEW)                         │       │
│  │  • Manages global chat state                      │       │
│  │  • Wraps entire app                               │       │
│  │  • Persists messages via TabContext               │       │
│  │  • Injects page-specific context                  │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │ GlobalChatButton (NEW)                            │       │
│  │  • FAB in bottom-right corner                     │       │
│  │  • Badge for unread messages                      │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │ GlobalChatDrawer (NEW)                            │       │
│  │  • Slides in from right                           │       │
│  │  • Contains ChatSidebar2                          │       │
│  │  • Resizable, closable                            │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 📦 New Files

```
src/
├── context/
│   └── chatContext.jsx              # NEW - Global chat state & persistence
├── components/
│   ├── ChatSidebar2.jsx             # NEW - Context-aware version
│   ├── GlobalChatButton.jsx         # NEW - FAB button
│   ├── GlobalChatDrawer.jsx         # NEW - Drawer wrapper
│   └── ChatSidebar/
│       └── NavigationPrompt.jsx     # NEW - Navigation offers
└── hooks/
    ├── useChatPageContext.jsx       # NEW - Register page context
    └── useGlobalChatShortcut.js     # NEW - Cmd/Ctrl+K handler
```

## 🔄 Page Context Registration

Each page registers its context with the chat:

```javascript
// In Unit Editor
useChatPageContext({
  unit,          // ✅ Chat knows current unit
  files,         // ✅ Can search/create files
  dictionary,    // ✅ Can add vocabulary
  questionBank,  // ✅ Can create questions
  editorRef,     // ✅ Can insert blocks
});

// In Sections page
useChatPageContext({
  sections,      // ✅ Can list/create sections
});

// In Home page
useChatPageContext({
  sections,      // ✅ Can assign work
  assignments,   // ✅ Can manage assignments
});
```

## ✨ Features

### ✅ Context-Aware Responses

**In Unit Editor:**
- "Insert a quiz block" → Inserts quiz into editor
- "Add a vocabulary word" → Adds to current unit's dictionary
- "Search for files about verbs" → Searches current unit's files

**In Sections Page:**
- "Create a section called Spanish 101" → Creates section
- "List all my classes" → Shows sections

**In Home Page:**
- "Assign Unit X to Section Y" → Creates assignment
- "What's due this week?" → Lists assignments

### ✅ Graceful Degradation with Navigation Offers

**Context Missing - Offers Navigation:**
- "Insert a quiz block" (on Profile page) →
  
  📢 **Navigation Prompt Appears:**
  ```
  ℹ️ To insert blocks, you need to be in the Unit Editor.
  
  [Not now]  [Go there →]
  ```
  
  Click "Go there" → Automatically navigates to Unit Editor → Tool executes

### ✅ Persistent State

- Messages saved to DynamoDB (AssistantChat model)
- State survives page navigation
- Multiple chat histories
- Archive old chats

### ✅ Keyboard Shortcuts

- **Cmd/Ctrl + K**: Toggle chat open/closed
- **Escape**: Close chat
- **Tab**: Navigate chat controls

## � VectorStoreContext Strategy

**Current**: Unit-specific semantic search (only in Editor)

**Decision**: Keep unit-scoped for MVP
- **Why**: Maintains semantic relevance to current unit
- **Fallback**: When unavailable, use keyword search across all content
- **Future**: Create global vector store for cross-unit search

**Behavior**:
```javascript
// Without VectorStoreContext (outside Editor)
search_content("photosynthesis") → Keyword search + suggestion:
  "Semantic search unavailable. Using keyword search.
   For better results, navigate to a unit. [Go to Units]"

// With VectorStoreContext (in Editor)
search_content("photosynthesis") → Embedding-based semantic search
  Returns top 10 most relevant results from current unit
```

## �📊 Tool Availability Matrix

| Tool | Home | Units | Sections | Editor | Workbook | Profile |
|------|------|-------|----------|--------|----------|---------|
| search_content | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_section | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_unit | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_assignment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_vocabulary | ✅ | ✅ | ✅ | ✅ (+ unit) | ✅ | ✅ |
| create_question | ✅ | ✅ | ✅ | ✅ (+ unit) | ✅ | ✅ |
| **insert_quiz** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **insert_answer** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **insert_blocks** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| list_tours | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| start_tour | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 📅 Implementation Timeline

### Phase 1: ChatContext (2-3 hours)
- [ ] Create ChatContext with state management
- [ ] Add ChatContextProvider to _app.jsx
- [ ] Add TabProvider to _app.jsx
- [ ] Create useChatPageContext hook

### Phase 2: ChatSidebar2 (3-4 hours)
- [ ] Version ChatSidebar → ChatSidebar2
- [ ] Consume ChatContext instead of local state
- [ ] Add graceful degradation for missing context
- [ ] Update tool execution with context checks
- [ ] Add navigation offers when context missing

### Phase 3: Global UI (4-5 hours)
- [ ] Create GlobalChatButton (FAB)
- [ ] Create NavigationPrompt component
- [ ] Create GlobalChatDrawer (includes NavigationPrompt)
- [ ] Add to _app.jsx
- [ ] Implement keyboard shortcut (Cmd/Ctrl+K)

### Phase 4: Update Pages (1-2 hours)
- [ ] Unit Editor: Register full context
- [ ] Sections: Register sections
- [ ] Home: Register sections + assignments
- [ ] Workbook: Register unit + grade
- [ ] Section Detail: Register section

### Phase 5: Testing (2-3 hours)
- [ ] E2E tests for global chat
- [ ] Unit tests for ChatContext
- [ ] Accessibility audit
- [ ] Performance testing

**Total: 18-23 hours (3-4 work days)**

## 🚀 Quick Start (After Implementation)

### For Users

1. Click **chat icon** (bottom-right FAB) or press **Cmd/Ctrl+K**
2. Type your question or request
3. Chat understands what page you're on
4. Get context-aware help

### For Developers

```javascript
// Register page context in any component
import { useChatPageContext } from '../hooks/useChatPageContext';

function MyPage() {
  const { data, actions } = useMyPageContext();
  
  // Register with chat
  useChatPageContext({
    data,
    actions,
  });
  
  return <div>My Page</div>;
}
```

## 🎨 Visual Design

### Floating Action Button (FAB)
```
┌─────────────────────────────────────────┐
│                                      ┌─┐│
│                                      │💬││
│                                      │ ││
│                                      │3││ ← Badge (unread count)
│                                      └─┘│
└─────────────────────────────────────────┘
  Bottom-right corner
  Primary color (#1976d2)
  Hover: Scale 1.1
  Click: Toggle chat
```

### Chat Drawer
```
┌───────────────────────────┬─────────────────────────┐
│                           │  AI Assistant        [X]│
│                           ├─────────────────────────┤
│                           │                         │
│   Main Content            │  Chat messages here     │
│                           │  • Context-aware        │
│                           │  • Streaming responses  │
│                           │  • Tool calls visible   │
│                           │                         │
│                           │                         │
│                           │                         │
│                           ├─────────────────────────┤
│                           │ [Type message...]  [📎] │
└───────────────────────────┴─────────────────────────┘
                             ↑
                        400px wide
                        Slides in from right
                        Resizable
```

## 🔐 Security & Performance

### Security
- ✅ Auth required to access chat
- ✅ DataStore auth rules enforced
- ✅ Tool execution respects @auth directives
- ✅ No sensitive data logged

### Performance
- ✅ Lazy load ChatSidebar2 (~30KB saved)
- ✅ Memoize context values
- ✅ Debounced message saves (1s)
- ✅ Virtualized message list
- **Bundle Impact**: +30KB total (+20%)

## ❓ FAQ

### Q: Will this break existing Editor chat?
**A:** No! ChatSidebar.jsx stays unchanged. ChatSidebar2 is new.

### Q: What if I'm on a page without a unit?
**A:** Chat still works! Editor-specific tools will show a navigation prompt: "To insert blocks, you need to be in the Unit Editor. [Go there →]" Click to navigate automatically.

### Q: Does chat reset when I navigate?
**A:** No! Messages persist across pages and are saved to DynamoDB. Navigation offers let you move between pages without losing chat context.

### Q: Can I customize the keyboard shortcut?
**A:** Yes, modify `useGlobalChatShortcut` hook.

### Q: How do I add context for my custom page?
**A:** Call `useChatPageContext({ myData, myActions })` in your component.

### Q: Can instructors and students both use global chat?
**A:** Yes! Auth is checked, tools respect permissions.

## 📚 Related Documentation

- [GLOBAL_CHAT_INTEGRATION_PLAN.md](GLOBAL_CHAT_INTEGRATION_PLAN.md) - Full detailed plan
- [CHATBOT_TOOLS.md](CHATBOT_TOOLS.md) - Available tools and usage
- [CHATBOT_TOUR_INTEGRATION_SUMMARY.md](CHATBOT_TOUR_INTEGRATION_SUMMARY.md) - Tour controls
- [API.md](API.md) - AssistantChat model schema

## ✅ Success Criteria

- [ ] Chat accessible from all pages
- [ ] State persists across navigation
- [ ] Context-aware responses based on page
- [ ] Graceful degradation for missing context
- [ ] Navigation offers when context missing
- [ ] Navigation preserves chat state
- [ ] VectorStoreContext fallback works (keyword search)
- [ ] Keyboard shortcut works
- [ ] E2E tests passing
- [ ] No performance regressions
- [ ] Documentation complete

---

**Status**: 📋 Planning Complete - Ready for Implementation  
**Next Step**: Review plan → Create feature branch → Start Phase 1
