# Global Chat E2E Tests

Comprehensive end-to-end tests for the global chat feature that validate chat functionality across the entire application.

## Test File

**`global-chat.cy.ts`** - Main test suite for global chat integration

## Test Coverage

### 1. Global Chat Button Visibility
Tests that the global chat button appears on all pages:
- ✅ Home page (instructor)
- ✅ Sections page
- ✅ Units page
- ✅ Profile page
- ✅ Home page (learner)

**Purpose**: Ensures consistent access to chat from any page

### 2. Chat Opening and Closing
Tests the basic open/close functionality:
- ✅ Opens chat drawer when button clicked
- ✅ Closes chat drawer when close button clicked
- ✅ Hides chat button when chat is open
- ✅ Shows chat button when chat is closed

**Purpose**: Validates core UI interaction patterns

### 3. Keyboard Shortcut Toggle
Tests keyboard shortcuts for power users:
- ✅ Cmd+Shift+C opens chat (Mac)
- ✅ Cmd+Shift+C closes chat (Mac)
- ✅ Multiple toggles work correctly

**Purpose**: Ensures keyboard navigation support

### 4. Chat Persistence Across Navigation
Tests that chat state persists during navigation:
- ✅ Open state maintained across pages
- ✅ Closed state maintained across pages
- ✅ Closing on one page keeps chat closed on next page

**Purpose**: Validates global state management via ChatContext

### 5. Context-Aware Chat Functionality
Tests that chat context changes based on current page:
- ✅ Sections context on home page
- ✅ Sections context on sections page  
- ✅ Units context on units page
- ✅ Context changes when navigating between pages

**Purpose**: Validates useChatPageContext hook and pageContext state

### 6. Chat History Persistence
Tests message history management:
- ✅ Messages persist when closing/reopening chat
- ✅ Messages persist across page navigation
- ✅ AssistantChat model saves messages to DynamoDB

**Purpose**: Ensures reliable chat history via DataStore subscriptions

### 7. Responsive Behavior
Tests responsive design:
- ✅ Persistent drawer on desktop (1920x1080)
- ✅ Temporary drawer on mobile (375x667)
- ✅ Graceful viewport resize handling

**Purpose**: Validates mobile-first design approach

### 8. Navigation Prompts
Tests prompts when tools require unavailable context:
- ✅ Navigation prompt shown when context missing
- ✅ Prompt contains action to navigate to required page

**Purpose**: Validates NavigationPrompt component integration

### 9. Error Handling
Tests error edge cases:
- ✅ Empty messages handled gracefully
- ✅ Very long messages handled gracefully

**Purpose**: Ensures robustness

### 10. Accessibility
Tests ARIA labels and keyboard navigation:
- ✅ Chat button has proper aria-label
- ✅ Close button has proper aria-label
- ✅ Keyboard navigable
- ✅ Visible focus indicators

**Purpose**: WCAG 2.1 AA compliance

### 11. Real Chat Interaction
Tests actual AI conversations:
- ✅ Sends user messages successfully
- ✅ Receives AI responses
- ✅ Multiple message exchanges work

**Purpose**: Integration test with real OpenAI API

## Test Selectors

### Data Test IDs
- `data-testid="global-chat-button"` - Floating action button
- `data-testid="global-chat-drawer"` - Chat drawer container
- `data-testid="chat-input"` - Message input field
- `data-testid="chat-send"` - Send button
- `data-testid="chat-messages"` - Messages container
- `data-testid="chat-close-button"` - Close drawer button
- `data-testid="navigation-prompt"` - Navigation prompt component
- `data-role="user"` - User message bubble
- `data-role="assistant"` - Assistant message bubble

## Prerequisites

### Required Services
1. **Amplify Sandbox**
   ```bash
   npx ampx sandbox --stream-function-logs
   ```

2. **Seed Test Users**
   ```bash
   npx ampx sandbox seed
   ```
   Creates:
   - `instructor1@example.com / TestPassword123!` (TEACHER_USERNAME/PASSWORD)
   - `student1@example.com / TestPassword123!` (LEARNER_USERNAME/PASSWORD)

3. **Development Server**
   ```bash
   npm run dev
   ```

4. **OpenAI API Key**
   - Configured in Amplify sandbox secrets (SSM)
   - Required for AI interactions in tests

### Environment Variables
Set in `cypress.env.json`:
```json
{
  "TEACHER_USERNAME": "instructor1@example.com",
  "TEACHER_PASSWORD": "TestPassword123!",
  "LEARNER_USERNAME": "student1@example.com",
  "LEARNER_PASSWORD": "TestPassword123!"
}
```

## Running Tests

### Headless Mode (CI)
```bash
# Run all global chat tests
npx cypress run --spec "cypress/e2e/global-chat.cy.ts"

# Run specific test suite
npx cypress run --spec "cypress/e2e/global-chat.cy.ts" --grep "Chat Opening and Closing"
```

### Interactive Mode (Development)
```bash
# Open Cypress Test Runner
npx cypress open

# Select global-chat.cy.ts from the test list
```

### Watch Mode
```bash
# Run tests and rerun on file changes
npx cypress run --spec "cypress/e2e/global-chat.cy.ts" --headed --watch
```

## Test Duration

- **Expected Duration**: ~10-15 minutes (AI operations are slower)
- **Fastest Tests**: Button visibility, state management (~30 seconds)
- **Slowest Tests**: Real chat interactions with AI (~2-3 minutes)

## Dependencies

### Application Code
- `src/context/chatContext.jsx` - Global chat state management
- `src/context/tabContext.jsx` - Sidebar tab management (optional)
- `src/hooks/useChatPageContext.jsx` - Page context registration
- `src/hooks/useGlobalChatShortcut.js` - Keyboard shortcut handler
- `src/components/GlobalChatButton.jsx` - FAB component
- `src/components/GlobalChatDrawer.jsx` - Drawer wrapper
- `src/components/ChatSidebar.jsx` - Chat UI
- `src/components/ChatSidebar/NavigationPrompt.jsx` - Navigation prompts
- `src/components/ChatSidebar/VirtualizedMessageList.jsx` - Message list

### Amplify Backend
- `amplify/backend/api/japanese5/schema.graphql` - AssistantChat model
- `amplify/backend/function/openai/` - Lambda functions for AI
- `pages/api/chat.js` - Edge function for streaming chat

### Custom Commands
Uses standard Cypress commands plus custom helpers defined in test file:
- `loginAsInstructor()` - Authenticates as teacher
- `loginAsLearner()` - Authenticates as student
- `verifyChatButtonExists()` - Checks button visibility
- `openChatViaButton()` - Opens chat drawer
- `closeChatViaButton()` - Closes chat drawer
- `toggleChatViaKeyboard()` - Keyboard shortcut toggle
- `sendChatMessage()` - Sends message and waits for response

## Troubleshooting

### Tests Fail to Authenticate
- Verify sandbox is running: `npx ampx sandbox`
- Check user credentials in `cypress.env.json`
- Ensure seed script created test users

### Chat Messages Don't Send
- Check OpenAI API key configuration
- Verify Lambda functions are deployed
- Check browser console for GraphQL errors
- Ensure AssistantChat record exists in DynamoDB

### Chat Button Not Visible
- Check GlobalChatButton component is rendered in `_app.jsx`
- Verify ChatContextProvider wraps application
- Check for CSS/z-index conflicts

### Context Not Changing Between Pages
- Verify useChatPageContext hook is called on each page
- Check pageContext state in ChatContext
- Ensure cleanup in useEffect unmount

### Keyboard Shortcuts Don't Work
- Verify useGlobalChatShortcut hook is called in `_app.jsx`
- Check event listener is attached to window
- Ensure no other shortcuts conflict

## Known Issues

### TypeScript Compile Errors in Test File
- **Status**: Expected behavior
- **Cause**: Cypress globals (`cy`, `Cypress`, `describe`, `it`) not available at compile time
- **Impact**: None - tests run successfully at runtime
- **Resolution**: Add `/// <reference types="cypress" />` at top of file (already done)

### ChatSidebar Parsing Errors
- **Status**: Fixed
- **Cause**: Corrupted code during merge (line 322)
- **Resolution**: Fixed conditional chaining in tour action handling

## Future Enhancements

### Test Coverage Gaps
- [ ] Test chat with multiple concurrent users
- [ ] Test chat history search functionality
- [ ] Test voice input when implemented
- [ ] Test file attachments in chat
- [ ] Test collaborative chat features
- [ ] Test offline/online behavior

### Performance Tests
- [ ] Measure chat open/close animation performance
- [ ] Test with 100+ message history
- [ ] Measure keyboard shortcut response time
- [ ] Test navigation performance with chat open

### Accessibility Tests
- [ ] Screen reader compatibility
- [ ] High contrast mode support
- [ ] Focus management during drawer transitions
- [ ] Keyboard-only workflow completion

## Related Documentation

- [docs/GLOBAL_CHAT_INTEGRATION_PLAN.md](../../docs/GLOBAL_CHAT_INTEGRATION_PLAN.md) - Implementation plan
- [docs/AI_FEATURES_GUIDE.md](../../docs/AI_FEATURES_GUIDE.md) - AI features overview
- [docs/E2E_TESTING_GUIDE.md](../../docs/E2E_TESTING_GUIDE.md) - General E2E testing guide
- [cypress/support/commands.ts](../support/commands.ts) - Custom Cypress commands
- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) - Project architecture

## Contributing

When adding new global chat features:

1. **Add Test IDs**: Use `data-testid` attributes for new interactive elements
2. **Update Tests**: Add test cases in appropriate describe block
3. **Document Selectors**: Update "Test Selectors" section above
4. **Update Coverage**: Update "Test Coverage" section with new scenarios
5. **Run Tests**: Verify all tests pass: `npx cypress run --spec "cypress/e2e/global-chat.cy.ts"`

## Support

For issues or questions:
- Check troubleshooting section above
- Review [GLOBAL_CHAT_INTEGRATION_PLAN.md](../../docs/GLOBAL_CHAT_INTEGRATION_PLAN.md)
- Search existing issues in repository
- Create new issue with test output and environment details
