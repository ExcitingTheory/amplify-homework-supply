# Chatbot Tour Integration - Implementation Summary

## ✅ Completed Work

### Phase 1: Tour Control Tools (COMPLETE)

Added 4 new chatbot tools to control the onboarding/tour system:

#### 1. `list_tours`
- **Purpose**: Discover available guided tours
- **Parameters**: `persona` (optional), `category` (optional)
- **Returns**: List of tours with metadata (title, description, estimated time, etc.)
- **Example**: User asks "What tours are available for instructors?"

#### 2. `start_tour`  
- **Purpose**: Launch a specific guided tour
- **Parameters**: `tourId` (required), `mode` (tutorial/quiz, optional)
- **Returns**: Action instruction for UI layer to start tour
- **Example**: User says "Start the create unit tutorial"

#### 3. `get_tour_info`
- **Purpose**: Get detailed information about a tour
- **Parameters**: `tourId` (required)
- **Returns**: Full tour details including instructions and steps
- **Example**: User asks "Tell me about the quiz block tour"

#### 4. `stop_tour`
- **Purpose**: Stop/close current tour
- **Parameters**: None
- **Returns**: Action instruction to stop tour
- **Example**: User says "Stop the tour" or "Exit tutorial"

### Phase 2: Tour Context Provider (COMPLETE)

Created `src/context/tourContext.tsx`:

**Features**:
- React Context for managing tour state across app
- `startTour()` and `stopTour()` methods
- Custom event system for communication (`tour:start`, `tour:stop`)
- Tracks current tour, mode, and active status
- Exports `useTour()` and `useTourSafe()` hooks
- Initializes tour task data for chatbot tools

**Data**:
- Includes 10 most common tours inline
- Covers instructor and learner workflows
- Can be expanded to include all 28 tours from Storybook

### Files Modified

1. **src/utils/chatTools.js**
   - Added 4 tour tool definitions
   - Added 4 tour execution functions
   - Added `setTourTasksData()` for initialization
   - Updated `executeTool()` tool map

2. **src/context/tourContext.tsx** (NEW)
   - Tour state management
   - Event-based communication
   - Hook exports

3. **CHATBOT_TOUR_CONTROL_PLAN.md** (NEW)
   - Complete implementation plan
   - Architecture documentation
   - Task checklist

## 🚧 Remaining Work

### Phase 3: ChatSidebar Integration (TODO)

Update `src/components/ChatSidebar.js` to handle tour tool responses:

```javascript
// In ChatSidebar.js
import { useTour } from '../context/tourContext';

// Inside component:
const { startTour, stopTour } = useTour();

// Handle tool responses in useEffect:
useEffect(() => {
  messages.forEach(message => {
    message.parts?.forEach(part => {
      if (part.type?.startsWith('tool-') && part.state === 'output-available') {
        const output = part.output;
        
        // Handle tour actions
        if (output?.action === 'start_tour') {
          startTour(output.tourId, output.mode);
        } else if (output?.action === 'stop_tour') {
          stopTour();
        }
      }
    });
  });
}, [messages, startTour, stopTour]);
```

### Phase 4: SpotlightOverlay Integration (TODO)

Two options:

#### Option A: Copy SpotlightOverlay to main app
1. Copy `.storybook/components/SpotlightOverlay.tsx` to `src/components/`
2. Copy `.storybook/code/spotlight-configs.ts` to `src/utils/`
3. Add SpotlightOverlay to app root that listens to tour context events

#### Option B: Use existing Storybook component (simpler)
1. Tour links navigate to Storybook stories (already working in OnboardingPanel)
2. Chatbot provides tour links instead of inline tours
3. Less code but requires Storybook to be running

**Recommended**: Option B for MVP, Option A for production

### Phase 5: App Root Integration (TODO)

Add TourProvider to app root:

```javascript
// In pages/_app.js
import { TourProvider } from '../src/context/tourContext';

function MyApp({ Component, pageProps }) {
  return (
    <TourProvider>
      {/* existing providers */}
      <Component {...pageProps} />
    </TourProvider>
  );
}
```

### Phase 6: Add Missing Editor Tools (TODO)

Identified missing tools that should be added:

#### 1. `publish_unit`
```javascript
{
  name: 'publish_unit',
  description: 'Publish a unit to make it available to students',
  parameters: {
    unitId: { type: 'string', required: true },
    generateEmbeddings: { type: 'boolean', default: true }
  }
}
```

**Implementation**: Call UnitContext's `publishUnit()` method or DataStore update

#### 2. `navigate_to_editor_tab`
```javascript
{
  name: 'navigate_to_editor_tab',
  description: 'Open a specific tab in the editor sidebar',
  parameters: {
    tab: { 
      enum: ['assignments', 'toc', 'dictionary', 'questions', 'files', 'configuration']
    }
  }
}
```

**Implementation**: Dispatch UI event or use ref to EditorSidebar

#### 3. `get_editor_buttons`
```javascript
{
  name: 'get_editor_buttons',
  description: 'List all available editor controls and buttons',
  parameters: {}
}
```

**Returns**: Comprehensive list of UI controls with descriptions

### Phase 7: Testing (TODO)

1. **Unit Tests**
   - Test tour tool execution functions
   - Test TourContext state management
   - Test event dispatching

2. **Integration Tests**
   - Test chatbot → tour tool → context flow
   - Test tour start/stop via chat
   - Test tour filtering and search

3. **E2E Tests**
   ```typescript
   // cypress/e2e/chatbot-tours.cy.ts
   it('should list tours via chatbot', () => {
     cy.get('[data-tour="chat-input"]').type('What tours are available?');
     cy.get('[data-tour="chat-input"]').type('{enter}');
     // Assert tour list appears
   });
   
   it('should start tour via chatbot', () => {
     cy.get('[data-tour="chat-input"]').type('Start the create unit tutorial');
     cy.get('[data-tour="chat-input"]').type('{enter}');
     // Assert tour starts
   });
   ```

### Phase 8: Documentation (TODO)

1. Create `docs/CHATBOT_TOOLS.md` - Complete tool reference
2. Update `E2E_TEST_FIX_SUMMARY.md` - Add tour capabilities
3. Update `docs/AI_FEATURES_GUIDE.md` - Add tour section
4. Add JSDoc comments to all tour functions

## 📊 Current State Assessment

### What Works ✅
- Tour tool definitions in chatTools.js
- Tour execution functions (return instructions)
- TourContext provider with state management
- Tour data initialization
- Event-based architecture ready

### What's Missing ❌
- ChatSidebar doesn't handle tour tool responses yet
- TourProvider not added to app root
- SpotlightOverlay not integrated in main app
- Missing editor control tools (publish, navigate, etc.)
- No tests
- Incomplete documentation

### What's Partially Done ⚠️
- Tour data in TourContext (10 tours, not all 28)
- Tool execution functions (return actions, UI must handle)
- Documentation (plan exists, implementation guide needed)

## 🎯 Recommended Next Steps

### For MVP (Minimal Viable Product)
1. Add TourProvider to `pages/_app.js` (5 min)
2. Update ChatSidebar to handle tour actions (30 min)
3. Make tours link to Storybook (10 min)
4. Test basic flow (30 min)
5. Document in README (15 min)

**Total**: ~1.5 hours for basic chatbot tour control

### For Full Production
1. Complete MVP steps above
2. Copy SpotlightOverlay to main app (1 hour)
3. Add all 28 tour configs (1 hour)
4. Implement missing editor tools (2 hours)
5. Write comprehensive tests (2 hours)
6. Complete documentation (1 hour)

**Total**: ~7.5 hours for production-ready implementation

## 💡 Usage Examples

Once complete, users can interact with tours via chat:

### Example 1: Discover Tours
**User**: "What can you help me learn?"  
**Chatbot**: *Calls `list_tours`*  
**Chatbot**: "I can guide you through 10 different workflows:
- Set Up Your First Class (5 min)
- Create Your First Unit (10 min)
- Add a Quiz Block (5 min)
..."

### Example 2: Start a Tour
**User**: "Show me how to create a quiz"  
**Chatbot**: *Calls `start_tour` with tourId='instructor-add-quiz'*  
**App**: SpotlightOverlay appears, highlights editor controls, guides step-by-step

### Example 3: Get Tour Info
**User**: "Tell me about the vocabulary tour"  
**Chatbot**: *Calls `get_tour_info`*  
**Chatbot**: "The 'Add Vocabulary Words' tour teaches you how to build your class dictionary. It takes about 6 minutes and covers:
1. Navigate to Dictionary Editor
2. Click Add Word button
3. Enter word and definition
..."

### Example 4: Stop Tour
**User**: "I'm done with this tutorial"  
**Chatbot**: *Calls `stop_tour`*  
**App**: SpotlightOverlay closes

## 🔧 Technical Notes

### Event Communication
Tours use CustomEvents for loose coupling:
```javascript
// Start tour
window.dispatchEvent(new CustomEvent('tour:start', {
  detail: { tourId, mode, tour }
}));

// Stop tour
window.dispatchEvent(new CustomEvent('tour:stop'));
```

### Tool Response Format
Tour tools return action instructions:
```json
{
  "success": true,
  "action": "start_tour",
  "tourId": "instructor-create-unit",
  "mode": "tutorial",
  "tour": { /* tour metadata */ },
  "message": "Starting tour..."
}
```

ChatSidebar must detect `action` field and call appropriate TourContext method.

### Data Flow
```
User Chat → ChatSidebar → AI → Tool Call → chatTools
                                              ↓
                                        Returns action
                                              ↓
ChatSidebar detects action → TourContext.startTour()
                                              ↓
                                    Dispatches tour:start event
                                              ↓
                                    SpotlightOverlay listens → Shows tour
```

## 📋 Complete File List

### Created Files
- `src/context/tourContext.tsx` - Tour state management
- `CHATBOT_TOUR_CONTROL_PLAN.md` - Implementation plan
- `docs/CHATBOT_TOUR_INTEGRATION_SUMMARY.md` - This file

### Modified Files
- `src/utils/chatTools.js` - Added 4 tour tools + execution functions

### Files to Modify (Next Steps)
- `src/components/ChatSidebar.js` - Handle tour actions
- `pages/_app.js` - Add TourProvider
- `src/components/SpotlightOverlay.tsx` - Copy from Storybook (optional)
- `src/utils/spotlight-configs.ts` - Copy from Storybook (optional)

### Files to Create (Next Steps)
- `docs/CHATBOT_TOOLS.md` - Complete tool reference
- `cypress/e2e/chatbot-tours.cy.ts` - E2E tests
- `src/utils/chatTools.test.js` - Unit tests

## 🎓 Learning Resources

For understanding the tour system:
- `docs/ONBOARDING_README.md` - Overview of onboarding system
- `docs/ONBOARDING_SPOTLIGHT_QUICK_START.md` - How to add tour support
- `.storybook/components/SpotlightOverlay.tsx` - Tour UI component
- `.storybook/code/spotlight-configs.ts` - All 28 tour configurations
- `.storybook/components/OnboardingPanel.tsx` - Working example

## ✅ Success Criteria

The implementation will be complete when:
- [ ] User can ask "What tours are available?" and see a list
- [ ] User can say "Start the X tutorial" and tour begins
- [ ] User can say "Stop tour" and tour closes
- [ ] Tours work in both tutorial and quiz modes
- [ ] All editor controls exposed as chatbot tools
- [ ] Tests pass with >80% coverage
- [ ] Documentation is comprehensive and accurate

---

**Status**: Phase 1-2 complete, Phase 3-8 pending  
**Next Action**: Add TourProvider to app root + update ChatSidebar  
**Estimated Time to MVP**: 1.5 hours  
**Estimated Time to Production**: 7.5 hours  
