# Storybook Inventory - Phase 1

**Date**: January 24, 2026  
**Total Story Files**: 51  
**Total Mock Data Files (ui-data)**: 6  
**Total Mock Files**: 35+

---

## 1.1 Story Files Inventory

| # | Component | File Path | Variants | Status | Notes |
|---|-----------|-----------|----------|--------|-------|
| 1 | AIFeedbackWidget | src/components/AIFeedbackWidget.stories.jsx | 6+ | ✅ | ChatMessage, ContentCompletion, WithLabels, LargeButtons, InChatContext, WithCallback |
| 2 | ChatSidebar | src/components/ChatSidebar.stories.jsx | 7+ | ✅ | **FIXED** - All 7 variants now have proper conversation examples with messages in correct parts array format |
| 3 | SearchResults | src/components/ChatSidebar/SearchResults.stories.jsx | 9+ | ✅ | AllResultTypes, FilesOnly, VocabularyOnly, QuestionsOnly, SectionsOnly, UnitsOnly, LoadingState, EmptyState, HighRelevanceScores |
| 4 | Editor | src/components/Editor3/Editor.stories.jsx | 4 | ⚠️ | **HIGH PRIORITY** - EmptyEditorTextFormatting, EmptyEditorCustomBlocks, EditorWithContent, KitchenSink None of these have contents loaded |
| 5 | Workbook | src/components/Editor3/Workbook.stories.jsx | 5 | ⚠️ | **HIGH PRIORITY** - EmptyWorkbook, WorkbookWithContent, WorkbookWithProgress, KitchenSink, DataPluginDemo. None of these have contents loaded |
| 6 | AudioWaveformPlayer | src/components/Editor3/components/AudioWaveformPlayer.stories.jsx | 9+ | ✅ | WithWaveformData, CompactPlayer, WithTitle, NoDuration, VariousSizes, MultiplePlayersInList, NoAudioSource, WithRecording, RecordingWithCallback |
| 7 | EditorComponents | src/components/Editor3/components/EditorComponents.stories.jsx | 9+ | ⚠️ | QuizDefault, QuizMultipleChoice, AnswerInput, AnswerWithValue, ImageDefault, ImageWithCaption, ImageSmall, AudioPlayer, VideoPlayerComponent. Audio player and video player are not configured with media and the types need ot be expanded so we can upload mp4 |
| 8 | EnhancedGeneration | src/components/Editor3/components/EnhancedGeneration.stories.jsx | 5 | ⚠️ | UnifiedImageGeneration, UnifiedAudioGeneration, ImageMaskEditorDemo, CompleteWorkflow, FeatureDocumentation. The mask stuff doesn't work, it doesn't show the mask being drawn |
| 9 | FileManager2 | src/components/Editor3/components/FileManager2.stories.jsx | 4 | ⚠️ | Default, WithExpandedContent, EmptyState, ExpandedPDFContent: the sidebars is beginning to show some info but the tab content from parsedContent is not fully loaded, I suspect the data format changed in the loading of the component |
| 10 | MetadataEditor | src/components/Editor3/components/MetadataEditor.stories.tsx | 9+ | ✅ | Default, QuickAutoSave, MinimalFile, LargeMetadata, AIGeneratedImage, TTSAudioFile, AllFileTypes, Playground, NearCharacterLimits |
| 11 | AIContentCompletionPlugin | src/components/Editor3/plugins/AIContentCompletionPlugin.stories.jsx | 4 | ⚠️ | EmptyEditor, PartialExplanation, MidLesson, StreamingDemo |
| 12 | AnswerPlugin (Audio/Drawing) | src/components/Editor3/plugins/AnswerPlugin.audio-drawing.stories.jsx | 6 | ✅ | AudioPronunciation, DrawingVocabulary, MultiModalVocabulary, ListeningComprehension, DefinitionToDrawing, FeatureDocumentation |
| 13 | AnswerPlugin | src/components/Editor3/plugins/AnswerPlugin.stories.jsx | 3 | ✅ | EditableEmpty, EditableWithAnswer, ReadOnlyWithAnswer |
| 14 | AutoEmbedPlugin | src/components/Editor3/plugins/AutoEmbedPlugin.stories.jsx | 2 | ✅ | EditableEmpty, EditableWithInstructions |
| 15 | AutocompletePlugin | src/components/Editor3/plugins/AutocompletePlugin.stories.jsx | 2 | ✅ | EditableEmpty, EditableWithInstructions |
| 16 | BlockSuggestionPlugin | src/components/Editor3/plugins/BlockSuggestionPlugin.stories.jsx | 4 | ⚠️ | EmptyEditor, AfterHeading, AfterExplanation, AfterQuiz |
| 17 | BlockSuggestionPluginAI | src/components/Editor3/plugins/BlockSuggestionPluginAI.stories.jsx | 5 | ⚠️ | CompareAIvsRules, AfterExplanation, ComplexLessonStructure, AfterQuiz, EmptyLesson `AIContentCompletionPlugin.js:114 Error fetching suggestion: TypeError: Cannot destructure property 'body' of '(intermediate value)' as it is undefined.    at AIContentCompletionPlugin.useCallback[fetchSuggestion] (AIContentCompletionPlugin.js:89:1)`|
| 18 | ColorPicker | src/components/Editor3/plugins/ColorPicker.stories.jsx | 3 | ✅ | Standalone, EditorIntegration, EditorWithColorfulText |
| 19 | CustomAnswerPlugin (Audio/Drawing) | src/components/Editor3/plugins/CustomAnswerPlugin.audio-drawing.stories.jsx | 7 | ✅ | AudioOnlyQuestion, DrawingOnlyQuestion, MultiModalQuestion, LanguagePronunciation, FeatureDocumentation, AnsweredAudioQuestion, AnsweredDrawingQuestion |
| 20 | CustomAnswerPlugin | src/components/Editor3/plugins/CustomAnswerPlugin.stories.jsx | 3 | ✅ | EditableEmpty, EditableWithCustomAnswer, ReadOnlyWithCustomAnswer |
| 21 | DragDropPastePlugin | src/components/Editor3/plugins/DragDropPastePlugin.stories.jsx | 2 | ✅ | EditableEmpty, EditableWithInstructions |
| 22 | DraggableBlockPlugin | src/components/Editor3/plugins/DraggableBlockPlugin.stories.jsx | 2 | ⚠️ | EditableEmpty, EditableWithDraggableBlocks: Layout changes and cannot see gutter any more |
| 23 | FloatingLinkEditorPlugin | src/components/Editor3/plugins/FloatingLinkEditorPlugin.stories.jsx | 2 | ✅ | EditableEmpty, EditableWithLinks |
| 24 | ImagesPlugin | src/components/Editor3/plugins/ImagesPlugin.stories.jsx | 3 | ✅ | EditableEmpty, EditableWithImage, ReadOnlyWithImage |
| 25 | LayoutPlugin | src/components/Editor3/plugins/LayoutPlugin.stories.jsx | 3 | ✅ | EditableEmpty, EditableWithLayout, ReadOnlyWithLayout |
| 26 | LinkPlugin | src/components/Editor3/plugins/LinkPlugin.stories.jsx | 3 | ✅ | EditableEmpty, EditableWithLinks, ReadOnlyWithLinks |
| 27 | MeaningAssociationPlugin | src/components/Editor3/plugins/MeaningAssociationPlugin.stories.jsx | 3 | ⚠️ | EditableEmpty, EditableWithExercise, ReadOnlyWithExercise. None of these display anything, also it doesn't look good empty and there are no instructions, also we need to be able to set learn/easy/hard the different phases don't scramble the letters, we need to be able to go from word to definition and play audio and the phases dont transition to the next one making it confusing, we should block the ui for each completed phase and offer a restart button |
| 28 | PlaylistPlugin | src/components/Editor3/plugins/PlaylistPlugin.stories.jsx | 3 | ⚠️ | EditableEmpty, EditableWithPlaylist, ReadOnlyWithPlaylist. `MediaPlayerComponent.options.sources [{…}]0: src: nulltype: "audio/mp3"[[Prototype]]: Objectlength: 1[[Prototype]]: Array(0) MediaPlayerComponent.js:236 VIDEOJS: ERROR: (CODE:4 MEDIA_ERR_SRC_NOT_SUPPORTED) No compatible source was found for this media. MediaError {code: 4, message: 'No compatible source was found for this media.'}` |
| 29 | QuizPlugin | src/components/Editor3/plugins/QuizPlugin.stories.jsx | 3 | ⚠️ | EditableEmpty, EditableWithQuiz, ReadOnlyWithQuiz. Quiz Plugin - Editable Mode has no add answer, also I think if we click edit it should autofocus the add action input or the last displayed text input that is empty. |
| 30 | SearchHighlightPlugin | src/components/Editor3/plugins/SearchHighlightPlugin.stories.jsx | 3 | ⚠️ | Default, WithMultipleMatches, CaseInsensitive. When you type the full word the highlight disappears but only the very top instance in the docs page |
| 31 | TablePlugin | src/components/Editor3/plugins/TablePlugin.stories.jsx | 3 | ⚠️ | EditableEmpty, EditableWithTable, ReadOnlyWithTable |
| 32 | UnitCompletedPlugin | src/components/Editor3/plugins/UnitCompletedPlugin.stories.jsx | 1 | ✅ | Interactive |
| 33 | WordBlockPlugin | src/components/Editor3/plugins/WordBlockPlugin.stories.jsx | 3 | ✅ | EditableEmpty, EditableWithWordBlock, ReadOnlyWithWordBlock |
| 34 | YouTubePlugin | src/components/Editor3/plugins/YouTubePlugin.stories.jsx | 3 | ✅ | EditableEmpty, EditableWithVideo, ReadOnlyWithVideo |
| 35 | MainToolbar | src/components/MainToolbar.stories.jsx | 4 | ✅ | FullToolbar, SettingsMenuOnly, HelpMenuOnly, UserMenuOnly |
| 36 | MeaningAssociation | src/components/MeaningAssociationExercise/MeaningAssociation.stories.jsx | 6 | ⚠️ | EasyExercise, EasyExerciseCompleted, HardExercise, HardExerciseCompleted, LearnExercise, LearnExerciseCompleted |
| 37 | ModerationBadge | src/components/ModerationBadge.stories.jsx | 8+ | ✅ | ApprovedContent, ApprovedWithDetails, FlaggedSingleCategory, FlaggedWithDetails, FlaggedMultipleCategories, UncheckedContent, IconOnly, InContentList |
| 38 | ModerationPanel | src/components/ModerationPanel.stories.jsx | 8+ | ✅ | SingleCategoryFlagged, MultipleCategoriesFlagged, LowConfidenceFlag, ApprovedContent, UncheckedContent, CustomTitle, InstructorReviewWorkflow, MalformedFlags |
| 39 | PdfThumbnail | src/components/PdfThumbnail.stories.tsx | 9 | 🔍 | Default, WithPageNumber, LargeThumbnail, SmallThumbnail, Clickable, FileListExample, ThumbnailGrid, LoadingState, ErrorState |
| 40 | QuestionBlock | src/components/QuestionBlock.stories.jsx | 3 | ✅ | MultipleChoice, TrueFalse, ManyAnswers This should show the ruby tags if available |
| 41 | QuestionsReview2 | src/components/QuestionsReview2.stories.tsx | 9 | ✅ | Default, WithSearchHighlight, LargeList, EssayQuestions, ComprehensionQuestions, MixedDifficulty, WithMediaAttachments, AlreadyImported, MinimalData |
| 42 | RecordingStudio2 | src/components/RecordingStudio2.stories.jsx | 4 | ✅ | ForWord, ForQuestion, WithFeedback, WithRecordedAnswer |
| 43 | RecordingStudio3 | src/components/RecordingStudio3.stories.jsx | 9+ | 🔍 | CoffeeShopDialogue, JapaneseVocabularyWord, QuizQuestionAudio, ComparingMultipleTakes, PreviewMode, StartFromScratch, Interactive, GuidedTutorial, ScriptEditorDemo. This doesn't display fully functional in a small screen |
| 44 | SafeHydrate | src/components/SafeHydrate.stories.jsx | 2 | ✅ | Default, WithComplexContent |
| 45 | SectionAssigner | src/components/SectionAssigner.stories.jsx | 3 | ✅ | Default, Closed, NoSections. NEed to now also add the permissions to the unit for the section |
| 46 | SortableAnswers | src/components/SortableAnswers.stories.jsx | 3 | ✅ | Default, SingleAnswer, ManyAnswers |
| 47 | VocabularyReview2 | src/components/VocabularyReview2.stories.tsx | 8 | ✅ | Default, WithSearchHighlight, LargeList, AlreadyImported, MinimalData, NoVocabulary, WithSummariesExpanded, Playground |
| 48 | Button | src/stories/Button.stories.ts | 4 | ✅ | Primary, Secondary, Large, Small |
| 49 | Header | src/stories/Header.stories.ts | 2 | ✅ | LoggedIn, LoggedOut |
| 50 | OnboardingExamples | src/stories/OnboardingExamples.stories.tsx | 4 | ⚠️ | AutoDetectTaskCompletion, ManualTaskTracking, DisplayOnboardingStatus, EventEmissionExample. Except the display status page it appears to work |
| 51 | Page | src/stories/Page.stories.ts | 2 | ✅ | LoggedOut, LoggedIn |
| 52 | Application Pages | src/pages/pages.mdx | 14 | ❌ | Index, Profile, Sections, Units, Section Detail, Section Detail Student, Unit Detail, workbook, Index No Sections, Units Empty, Sections Empty, Password Workbook Timed, Index Assignments. These still use DataStore and are super import and because they are all the components in context of a page |

**Legend**:
- ✅ Renders correctly
- ⚠️ Renders with warnings
- ❌ Fails to render
- 🔍 Not yet tested (needs manual verification)

---

## 1.2 Mock Data Files (ui-data)

| File | Type | Size | Structure | Used By | Notes |
|------|------|------|-----------|---------|-------|
| chat-bot-2.0.json | JSON | - | Chat messages | ChatSidebar stories | Need to verify format matches useChat() |
| chat-bot-2.1.json | JSON | - | Chat messages | ChatSidebar stories | Version 2.1 |
| chat-bot-2.3.json | JSON | - | Chat messages | ChatSidebar stories | Version 2.3 - latest? |
| file-details.json | JSON | - | File metadata | FileManager2, MetadataEditor | S3 file structure |
| files.js | JS | - | File data | FileManager2 stories | JavaScript export |
| files.json | JSON | - | File data | FileManager2 stories | JSON version |

**Priority Check**: Verify chat-bot-*.json files use `message.parts` array format (NOT `message.content` string)

---

## 1.3 Mock Module Files (.storybook/__mocks__)

| File | Type | Purpose | Status |
|------|------|---------|--------|
| ai-react.js | Mock | @ai-sdk/react (useChat, useCompletion) | 🔍 |
| amplifyClient.js | Mock | Amplify Gen 2 client | 🔍 |
| amplifyconfig.js | Mock | Amplify configuration | 🔍 |
| aws-amplify-api.js | Mock | Amplify API module | 🔍 |
| aws-amplify-auth.js | Mock | Amplify Auth module | 🔍 |
| aws-amplify-data.js | Mock | Amplify Data module | 🔍 |
| aws-amplify-datastore.js | Mock | DataStore (Gen 1) | 🔍 |
| aws-amplify-storage.js | Mock | Amplify Storage (S3) | 🔍 |
| aws-amplify-utils.js | Mock | Amplify utilities | 🔍 |
| aws-amplify.js | Mock | Main Amplify mock | 🔍 |
| chat-api.js | Mock | Chat API endpoints | 🔍 |
| chatDataLoader.js | Util | Chat data loading | 🔍 |
| chatMockData.js | Data | Chat mock data | 🔍 |
| featuredImagesCroppedData.js | Data | Cropped image data | 🔍 |
| featuredImagesData.js | Data | Featured images | 🔍 |
| grade-examples.js | Data | Grade/Assignment data | 🔍 |
| index-page-examples.js | Data | Index page data | 🔍 |
| index.js | Entry | Main mock entry | 🔍 |
| media.js | Mock | Media utilities | 🔍 |
| mediaUrls.js | Data | Media URL mocks | 🔍 |
| mockDocuments.js | Data | Document/PDF data | 🔍 |
| mockEmbeddingUtils.js | Util | Embedding utilities | 🔍 |
| mockFileData.js | Data | File mock data | 🔍 |
| mockMediaData.js | Data | Media mock data | 🔍 |
| mockQuestionData.js | Data | Question bank data | 🔍 |
| mockSemanticSearchExample.js | Data | Search results | 🔍 |
| mockWordData.js | Data | Vocabulary/dictionary | 🔍 |
| next-router.js | Mock | Next.js router | 🔍 |
| seedData.js | Data | Seed data for stories | 🔍 |
| test-embeddings.js | Data | Test embedding vectors | 🔍 |

---

## 1.4 Mock Documentation

| Document | Purpose | Status |
|----------|---------|--------|
| CHAT_MOCK_GUIDE.md | Guide for ChatSidebar mocks | ✅ Exists |
| GRADE_EXAMPLES_README.md | Grade data structure | ✅ Exists |
| IMPLEMENTATION_SUMMARY.md | Mock implementation overview | ✅ Exists |
| INDEX_PAGE_EXAMPLES_README.md | Index page examples | ✅ Exists |
| MOCK_DATA_GUIDE.md | General mock data guide | ✅ Exists |
| README.md | Main mock readme | ✅ Exists |
| ROUTER_MOCK_GUIDE.md | Router mock patterns | ✅ Exists |

---

## Summary Statistics

- **Total Story Files**: 51
- **Estimated Total Story Variants**: 200+
- **Mock Data Files (ui-data)**: 6
- **Mock Module Files**: 35+
- **Mock Documentation**: 7

---

## High Priority Components (From copilot-instructions)

1. **ChatSidebar** - 7 story variants
   - Must verify message format: `message.parts` array with `{type: 'text', text: string}` objects
   - Extract text via: `message.parts.filter(p => p.type === 'text').map(p => p.text).join('')`
   - Check against git history for regressions
   - Compare mock data to actual `useChat()` hook output

2. **Editor3** - 4 story variants
   - Lexical JSON state structure
   - Custom nodes: QuizNode, AnswerNode, MeaningAssociationNode, CustomAnswerNode
   - UnitContext dependencies

3. **Workbook** - 5 story variants  
   - Grade data structure validation
   - Rubric matching `gradedBlockTypes`
   - DataPlugin integration

4. **Grade/Assignment Components**
   - Verify `Grade.data` JSON structure
   - Check block ID references
   - Accuracy calculations

---

## Next Steps (Phase 1.3)

1. Start Storybook: `npm run storybook`
2. Systematically test each story:
   - Open story in browser
   - Check for visual rendering
   - Check browser console for errors
   - Document status (✅/⚠️/❌)
3. Update Status column in this document
4. Create list of broken stories for Phase 2

**Estimated Time**: 4-6 hours for complete manual testing of all 51 story files

---

**Last Updated**: January 24, 2026  
**Phase 1 Status**: Inventory Complete - Ready for Manual Testing
