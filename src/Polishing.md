# Comprehensive Plan: Panel Polish & Storybook Stories

Based on the screenshots, here's a detailed plan to polish all UI panels and create comprehensive Storybook stories with mock data:

## Phase 1: Component Audit & Mock Data Structure

### Components to Polish:
2. **AI Assistant Panel** - search results, vocabulary/questions display, all tool cards and all states
3. **Cohort Chat Panel** - empty state needs content, content should word-wrap and show timestamps
4. **Unit Grades Panel** - empty state needs content, grade cards with accuracy visualization for each submission, ai feedback display if available
5. **AI Block Suggestions Panel** - suggestions list
6. **PDF Analysis Settings** - toggle + featured image dropzone
7. **File Browser** - status indicators, file lists, preview images, metadata, search highlight, 
10. **Learning Objectives** - Bloom taxonomy cards
11. **Timer/Due Date Forms** - assignment configuration

### Mock Data Needed:
- File metadata (PDFs, images, documents)
- Analysis status states (extracting, analyzing, completed)
- Vocabulary words (Japanese with phonetics, definitions, pages)
- Questions (various types: essay, short_answer, comprehension)
- Learning objectives with Bloom levels
- Chat messages with @mentions and #topics
- Grade submissions with accuracy scores
- AI suggestions for different block types

## Phase 2: UI/UX Polish Requirements

### File Metadata Panel
- **Current Issues**: Basic styling, no validation feedback
- **Improvements**:
  - Add character counters for fields
  - Better spacing and typography
  - Loading states during save
  - Success/error toast feedback
  - Disabled state styling for read-only mode

### AI Assistant Panel
- **Current Issues**: Results could be more scannable
- **Improvements**:
  - ✅ Better visual hierarchy for search results
  - ✅ Improve vocabulary/question card design
  - ✅ Add relevance score animations
  - ✅ Collapsible sections with better affordances
  - ✅ Markdown rendering for text content (basic **bold** support)
  - ✅ Empty state design
  - ✅ Loading skeletons during search
  - ✅ Support for all searchable types: Files, Vocabulary, Questions, **Sections**, **Units**
- **Status**: ✅ **COMPLETE** - SearchResults component enhanced with all improvements and full content type support


### Cohort Chat Panel
- **Current Issues**: Empty state only
- **Improvements**:
  - Message bubbles with avatars
  - @mention highlighting
  - #topic tags as chips
  - Timestamp formatting
  - Typing indicators
  - Input field with emoji picker

### Unit Grades Panel
- **Current Issues**: Empty state only
- **Improvements**:
  - Grade cards with accuracy visualizations
  - Progress bars or circular progress
  - Submission timestamp formatting
  - Filter/sort controls
  - Student name with avatar
  - Feedback preview

### AI Block Suggestions Panel
- **Current Issues**: Basic list, unclear interactivity
- **Improvements**:
  - Icon differentiation for block types
  - Hover states with preview
  - Priority indicators (visual weight)
  - Click-to-insert animation feedback
  - Loading states for AI generation
  - Empty/error states

### PDF Analysis Settings
- **Current Issues**: Toggle works, dropzone basic
- **Improvements**:
  - Better toggle design with description
  - Drag-over state for dropzone
  - Image preview with crop/adjust
  - Progress indicator during upload
  - Remove image button
  - Recommended dimensions helper text

### File Browser
- **Current Issues**: Status text unclear, basic layout
- **Improvements**:
  - Status badges with colors (extracting=yellow, completed=green)
  - File type icons
  - Size formatting (KB/MB)
  - Date formatting (relative times)
  - Thumbnail previews for images
  - Trim large images to save space and improve load times, use modern image formats (WebP), lazy load images
  - Expandable metadata
  - Batch action controls
  - Search/filter functionality
  - it should display in a tree structure with folders and files 

### Vocabulary Review
- **Current Issues**: Expand/collapse not obvious
- **Improvements**:
  - Better expand/collapse affordance
  - Highlight search terms
  - Page number chip styling
  - Audio playback button integration
  - Import checkbox styling
  - Batch selection controls
  - Phonetic text styling (distinct from definition)

### Questions Review
- **Current Issues**: Checkbox purpose unclear, answer hidden
- **Improvements**:
  - Difficulty/type badges
  - Expand to show full answer
  - Edit button placement
  - Import state (already imported vs. available)
  - Answer preview with "show more" link
  - Better spacing between questions

### Learning Objectives
- **Current Issues**: Bloom level needs better visual treatment
- **Improvements**:
  - Color-coded Bloom level badges
  - Objective cards with better shadows/borders
  - Icon for each Bloom level
  - Grouping by level option
  - Reorder functionality
  - Add/edit states

## Phase 3: Storybook Stories to Create

### Story Structure:
```
src/components/
├── FileMetadata/
│   ├── FileMetadata.stories.tsx (NEW)
│   └── FileMetadata.tsx (existing)
├── AIAssistant/
│   ├── AIAssistant.stories.tsx (extend existing)
│   └── SearchResults.stories.tsx (NEW)
├── CohortChat/
│   └── CohortChat.stories.tsx (NEW)
├── UnitGrades/
│   └── UnitGrades.stories.tsx (NEW)
├── AIBlockSuggestions/
│   └── AIBlockSuggestions.stories.tsx (NEW)
├── PDFAnalysis/
│   └── PDFAnalysisSettings.stories.tsx (NEW)
├── FileBrowser/
│   └── FileBrowser.stories.tsx (extend existing)
├── VocabularyReview/
│   └── VocabularyReview.stories.tsx (NEW)
├── QuestionsReview/
│   └── QuestionsReview.stories.tsx (NEW)
└── LearningObjectives/
    └── LearningObjectives.stories.tsx (NEW)
```

### Mock Data Files to Create:
```
.storybook/__mocks__/
├── files.mock.ts - file metadata with various types/statuses
├── vocabulary.mock.ts - Japanese words with full data
├── questions.mock.ts - various question types
├── objectives.mock.ts - learning objectives with Bloom levels
├── chat.mock.ts - chat messages with mentions/topics
├── grades.mock.ts - student submissions with scores
├── suggestions.mock.ts - AI block suggestions
└── analysis.mock.ts - PDF analysis results
```



## Also Needed:

Global search that can filter through files, vocabulary, questions and displays a popup with results categorized by type. Clicking the result navigates to the appropriate panel with that item selected. Or page if not in a panel.






## Phase 4: Implementation Priorities

### High Priority (Core User Flows):
1. File Metadata Panel + Story
2. AI Assistant Panel polish + extended stories
3. PDF Analysis Settings + Story
4. Vocabulary Review + Story
5. Questions Review + Story

### Medium Priority (Secondary Features):
6. File Browser enhancements + extended stories
7. AI Block Suggestions polish + Story
8. Learning Objectives + Story

### Lower Priority (Nice to Have):
9. Cohort Chat + Story (feature may change)
10. Unit Grades + Story (dependent on grading system)
11. Timer/Due Date forms (functional, low visibility)

## Phase 5: Design System Consistency

### Ensure Consistent Use Of:
- Material-UI theme tokens (spacing, colors, typography)
- Card elevation levels
- Button variants and sizes
- Badge colors and meanings
- Icon sizes and weights
- Loading states (CircularProgress, Skeleton)
- Empty state illustrations/messaging
- Error state patterns
- Success feedback (Snackbar, inline messages)

## Phase 6: Accessibility Checks

### For Each Panel:
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ ARIA labels for icons
- ✅ Screen reader announcements
- ✅ Color contrast ratios
- ✅ Form validation messages
- ✅ Loading announcements

## Implementation Strategy

1. **Create comprehensive mock data first** - ensures all stories can work
2. **Polish panels incrementally** - one at a time with immediate story
3. **Test in Storybook as you go** - verify with mock data
4. **Document props and variants** - ensure stories show all states
5. **Review in context** - test in actual app to ensure nothing breaks

Ready to proceed with implementation?








C. Revisit later Polish AI Block Suggestions by:
Making them actually useful with functional inserts that work in the editor (already implemented)
Creating comprehensive stories with various suggestion types and states (stories exist in BlockSuggestionPluginAI.stories.jsx)
