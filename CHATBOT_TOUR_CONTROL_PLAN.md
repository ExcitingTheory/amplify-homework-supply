# Chatbot Tour Control Implementation Plan

## Overview
Enable the AI chatbot to control the product tour/onboarding system, allowing users to start guided tours through natural conversation.

## Current State Analysis

### Existing Tour System (✅ Complete)
- **SpotlightOverlay Component** - Visual tour overlay with highlighted elements
- **28 Task Configurations** - Complete spotlight configs for all personas
- **OnboardingPanel** - Storybook UI for managing tours
- **Event System** - Track task completion and progress
- **Two Modes**: Tutorial (detailed guidance) and Quiz (test knowledge)

### Current Gaps (❌ Missing)
1. **No chatbot integration** - Tours only accessible via Storybook OnboardingPanel
2. **No API in main app** - Tour system exists only in Storybook context
3. **Can't discover tours** - No way to list available tours programmatically
4. **Missing tour controls** - publish_unit, other editor buttons not exposed as tools

## Implementation Plan

### Phase 1: Add Tour Control Chatbot Tools ✅

Add 4 new chatbot tools to control the tour system:

#### 1. `list_tours`
**Purpose**: Discover available guided tours
**Parameters**:
- `persona` (optional): Filter by role ('instructor' | 'learner' | 'developer')
- `category` (optional): Filter by category

**Returns**:
```json
{
  "success": true,
  "count": 28,
  "tours": [
    {
      "id": "instructor-setup-class",
      "title": "Set Up Your First Class",
      "description": "Learn how to create class sections",
      "persona": "instructor",
      "category": "Getting Started",
      "estimatedTime": 180,
      "hasTutorial": true,
      "hasQuiz": true
    }
  ]
}
```

#### 2. `start_tour`
**Purpose**: Launch a specific guided tour
**Parameters**:
- `tourId` (required): ID of the tour to start
- `mode` (optional): 'tutorial' (default) or 'quiz'

**Returns**:
```json
{
  "success": true,
  "action": "start_tour",
  "tourId": "instructor-setup-class",
  "mode": "tutorial",
  "stepCount": 6,
  "message": "Starting 'Set Up Your First Class' tutorial with 6 steps..."
}
```

#### 3. `get_tour_info`
**Purpose**: Get detailed information about a tour
**Parameters**:
- `tourId` (required): ID of the tour

**Returns**:
```json
{
  "success": true,
  "tour": {
    "id": "instructor-setup-class",
    "title": "Set Up Your First Class",
    "description": "Learn how to create class sections",
    "instructions": [
      "Navigate to Sections page",
      "Click Create Section button",
      "Fill in section details"
    ],
    "persona": "instructor",
    "category": "Getting Started",
    "estimatedTime": 180,
    "tutorialSteps": 6,
    "quizSteps": 4
  }
}
```

#### 4. `stop_tour`
**Purpose**: Stop/close the current tour
**Parameters**: None

**Returns**:
```json
{
  "success": true,
  "action": "stop_tour",
  "message": "Tour stopped"
}
```

### Phase 2: Identify Missing Editor/UI Controls ✅

Audit to find controls not exposed as chatbot tools:

#### Missing Critical Tools:
1. **publish_unit** - Change unit status to published ⚡ HIGH PRIORITY
2. **navigate_to_page** - Navigate to specific app pages
3. **open_editor_tab** - Open left sidebar tabs (Dictionary, Questions, Files)
4. **toggle_editor_mode** - Switch between edit/preview modes
5. **export_unit** - Export unit content
6. **import_content** - Import content from files

#### Discovered from E2E Test Summary:
- ✅ `create_unit` - EXISTS
- ✅ `create_section` - EXISTS  
- ✅ `create_assignment` - EXISTS
- ✅ Block insertions - EXISTS (quiz, answer, meaning_association, custom_answer)
- ❌ **Publishing control** - MISSING
- ❌ **Dictionary tab** - MISSING
- ❌ **Questions tab** - MISSING
- ❌ **Files tab** - MISSING
- ❌ **Navigation** - MISSING

### Phase 3: Add Missing Editor Control Tools ✅

#### 5. `publish_unit`
**Purpose**: Publish a unit (change status from draft to published)
**Parameters**:
- `unitId` (required): ID of unit to publish
- `generateEmbeddings` (optional): Whether to generate embeddings (default: true)

**Implementation**: Call UnitContext's publish functionality

#### 6. `navigate_to_editor_tab`
**Purpose**: Open specific left sidebar tab in editor
**Parameters**:
- `tab`: 'assignments' | 'toc' | 'dictionary' | 'questions' | 'files' | 'configuration'

**Implementation**: Dispatch UI event to change tab

#### 7. `get_editor_buttons`
**Purpose**: List all available editor buttons and controls
**Returns**: Comprehensive list of editor UI controls with descriptions

### Phase 4: Implement Tour Context Provider ✅

Create a React Context to expose tour controls outside Storybook:

**File**: `src/context/tourContext.tsx`

```tsx
interface TourContextValue {
  startTour: (tourId: string, mode: 'tutorial' | 'quiz') => void;
  stopTour: () => void;
  currentTour: string | null;
  isActive: boolean;
}
```

### Phase 5: Update ChatSidebar Integration ✅

Update ChatSidebar to:
1. Import tour tool definitions
2. Handle tour control tool responses
3. Integrate with TourContext
4. Show tour UI when active

## Expected User Flows

### Flow 1: Discover and Start Tour
**User**: "How do I publish a unit?"  
**Chatbot**: Searches for relevant tour, suggests "instructor-create-unit"  
**User**: "Show me a tutorial"  
**Chatbot**: Calls `start_tour` with tourId and mode='tutorial'  
**App**: SpotlightOverlay appears, guides user through publishing

### Flow 2: Get Help with Editor
**User**: "What buttons are available in the editor?"  
**Chatbot**: Calls `get_editor_buttons`  
**Chatbot**: Lists all buttons with descriptions  
**User**: "Take me through using the dictionary"  
**Chatbot**: Calls `start_tour` for dictionary tutorial

### Flow 3: Publish Unit via Chat
**User**: "Publish this unit"  
**Chatbot**: Calls `publish_unit` with current unit ID  
**App**: Unit status changes to published, embeddings generated  
**Chatbot**: "Unit published successfully!"

## Technical Architecture

```
┌─────────────────┐
│   ChatSidebar   │ ← User asks about features
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   chatTools.js  │ ← Defines tour control tools
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  TourContext    │ ← Manages tour state in main app
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│SpotlightOverlay │ ← Renders visual tour
└─────────────────┘
```

## Implementation Checklist

- [x] Phase 1: Add tour control tools to chatTools.js
  - [x] list_tours
  - [x] start_tour
  - [x] get_tour_info
  - [x] stop_tour
- [ ] Phase 2: Identify missing controls (documented above)
- [ ] Phase 3: Add missing editor tools
  - [ ] publish_unit
  - [ ] navigate_to_editor_tab
  - [ ] get_editor_buttons
- [ ] Phase 4: Create TourContext provider
- [ ] Phase 5: Update ChatSidebar
  - [ ] Handle tour tool calls
  - [ ] Integrate TourContext
  - [ ] Show tour UI
- [ ] Phase 6: Testing
  - [ ] Unit tests for tools
  - [ ] Integration tests
  - [ ] E2E test for chatbot tour control
- [ ] Phase 7: Documentation
  - [ ] Update CHATBOT_TOOLS.md
  - [ ] Add examples to docs
  - [ ] Update E2E_TEST_FIX_SUMMARY.md

## Files to Modify

1. **src/utils/chatTools.js** - Add tour control tools
2. **src/context/tourContext.tsx** - NEW - Tour state management
3. **src/components/ChatSidebar.js** - Handle tour responses
4. **pages/_app.js** - Wrap with TourContext provider
5. **docs/CHATBOT_TOOLS.md** - NEW - Document all tools
6. **E2E_TEST_FIX_SUMMARY.md** - Update with new capabilities

## Success Criteria

✅ Users can ask "What tours are available?" and see list  
✅ Users can say "Start the create unit tutorial" and tour begins  
✅ Users can say "Publish this unit" and it publishes  
✅ All 28 tours accessible via chat  
✅ Tours work in both tutorial and quiz modes  
✅ Documentation complete and accurate  

## Timeline

- **Phase 1**: 1-2 hours (tour control tools)
- **Phase 2**: 30 min (audit)
- **Phase 3**: 2-3 hours (missing tools)
- **Phase 4**: 1-2 hours (context provider)
- **Phase 5**: 2-3 hours (ChatSidebar integration)
- **Phase 6**: 2-3 hours (testing)
- **Phase 7**: 1 hour (docs)

**Total**: ~10-15 hours

## Notes

- Tour system is currently Storybook-only - needs React Context for main app
- SpotlightOverlay component is reusable but needs coordination with app state
- Consider security: validate tourId exists before starting
- Consider UX: Prevent multiple tours running simultaneously
- Consider persistence: Save tour progress in localStorage?
