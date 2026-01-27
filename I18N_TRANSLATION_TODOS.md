# I18n Translation TODO List

This document lists all locations where i18n translation tags (`{t('key')}`) need to be added to make literal strings translatable.

**Total Issues:** 785 (776 warnings + 9 errors)

---

## Files Needing Translation

### 1. pages/_document.js
- **Line 10:18** - `lang="en"` attribute

### 2. pages/grades.js
- **Line 114:87** - "Grades" in Typography
- **Line 139:21** - `<h1>Grades</h1>`
- **Line 169:37** - `<h1>Sections</h1>`
- **Line 205:37** - `<h1>My Sections</h1>`
- **Line 278:37** - `<th>Student</th>`
- **Line 279:37** - `<th>Assignment</th>`
- **Line 282:37** - `<th>Grade</th>`

### 3. pages/index.js (28 warnings)
- **Line 275:75** - "Homework Supply" in Typography
- **Line 314:18** - "Assignments" heading
- **Line 404:30** - "View Workbook" button text
- **Line 448:18** - "Completed Assignments" heading
- **Line 492-495** - Theme color strings: 'success.main', 'info.main', 'warning.main', 'error.main'
- **Line 615:30** - "View Workbook" button text (duplicate)
- **Line 631:37** - 'grayscale(1)' filter
- **Line 662:18** - "My Assignments" heading
- **Line 744:30** - "View Workbook" button text (duplicate)
- **Line 768:30** - "Edit Unit" button text
- **Line 828:75** - "No Sections Yet" message
- **Line 844:22** - "Join Section?" button text
- **Line 860:22** - "Create New Section" button text
- **Line 882:18** - "My Sections" heading
- **Line 919:49** - "Untitled Section" fallback
- **Line 922:56** - "No description" fallback
- **Line 947:30** - "View Section" button text
- **Line 992:18** - "Sections" heading
- **Line 1029:49** - "Untitled Section" fallback (duplicate)
- **Line 1032:56** - "No description" fallback (duplicate)
- **Line 1057:30** - "View Section" button text (duplicate)

### 4. pages/privacy.js (54 warnings)
- **Line 26:75** - "Privacy Policy" in AppBar
- **Line 47:81** - "Privacy Policy" page heading
- **Line 51:74** - "Last updated: January 15, 2026"
- **Line 55:88** - "1. Introduction" section heading
- **Line 58:51** - Introduction paragraph
- **Line 64:88** - "2. Information We Collect" section
- **Line 67:51** - Information collection description
- **Lines 72-84** - List items for collected information types (Account, Learning Data, User Content, Usage)
- **Line 85:88** - "3. How We Use Your Information"
- **Lines 88-104** - Usage description and list items
- **Line 109:88** - "4. Data Storage and Security"
- **Lines 112-126** - Storage and security descriptions
- **Line 131:88** - "5. Data Sharing"
- **Lines 134-149** - Data sharing policies and list items
- **Line 153:88** - "6. Your Rights"
- **Lines 156-176** - User rights descriptions and list items
- **Line 180:88** - "7. Cookies and Tracking"
- **Line 183:51** - Cookies description
- **Line 188:88** - "8. Children's Privacy"
- **Line 191:51** - Children's privacy notice
- **Line 197:88** - "9. Changes to This Policy"
- **Line 200:51** - Policy changes description
- **Line 205:88** - "10. Contact Us"
- **Line 208:51** - Contact information

### 5. pages/profile.js (20 warnings)
- **Line 208:75** - "My Profile" in AppBar
- **Line 229:15** - `<h1>My Profile</h1>`
- **Line 230:14** - Profile information description
- **Line 270:22** - "User Id" label
- **Line 280:22** - "Identity Id" label
- **Line 305:18** - "Cancel" button
- **Line 314:20** - "Update Profile" button
- **Line 341:78** - "Confirm your email" dialog title
- **Line 344:71** - Email confirmation message
- **Line 387:24** - "Confirm Email" button
- **Line 404:15** - `<h1>Change Password</h1>`
- **Line 405:14** - Password change description
- **Line 467:18** - "Change Password" button
- **Line 481:15** - `<h1>Advanced</h1>`
- **Line 482:14** - Cache clearing description
- **Line 490:12** - "Clear Local Cache" button
- **Line 501:58** - "Clear Local Data Cache?" dialog title
- **Line 505:72** - Cache clearing warning message
- **Line 515:14** - "Cancel" button
- **Line 523:14** - "Clear Cache" button

### 6. pages/section/[id].js (31 warnings)
- **Line 945:25** - "No featured image set" message
- **Line 965:69** - "Join Code:" display
- **Line 982:36** - "Student View" / "Instructor View" toggle
- **Line 1005:90** - "Students" heading
- **Line 1017:30** - "Student" table header
- **Line 1018:44** - "Email" table header
- **Line 1019:44** - "Actions" table header
- **Line 1060:54** - "Gradebook" heading
- **Line 1063:85** - Assignment count display
- **Line 1109:31** - "Curve Method" label
- **Line 1127:66** - Curve debug information
- **Line 1147:30** - "Assignment" table header
- **Line 1148:44** - "Grade" table header
- **Line 1184:58** - "Total Average" cell
- **Line 1209:93** - Average/completion display
- **Line 1237:20** - "Learner" table header
- **Line 1255:98** - "Total (Completion)" header
- **Line 1409:12** - "Assignments" heading
- **Line 1476:43** - "View Workbook" button
- **Line 1526:76** - "Delete Section" button
- **Line 1536:24** - "Override Grade" dialog title
- **Line 1542-1545** - Grade override form labels
- **Line 1563:56** - "Cancel" button
- **Line 1564:91** - "Save Grade" button

### 7. pages/sections.js (7 warnings)
- **Line 236:61** - "New Section" dialog title
- **Line 238:48** - New section description
- **Line 271:110** - "Cancel" button
- **Line 274:87** - "Create" button
- **Line 307:28** - "Sections" heading
- **Line 310:121** - "Create New" button
- **Line 344:75** - "No Sections Yet" message
- **Line 359:20** - "Create New Section" button
- **Line 399:67** - "Untitled Section" fallback
- **Line 426:46** - "View Section" button

### 8. pages/unit/[id].js
- **Line 24:13** - "Loading…" message

### 9. pages/units.js (17 warnings)
- **Line 183:24** - "Units" heading
- **Line 186:112** - "Create New" button
- **Line 227:93** - "No Published Units Yet" message
- **Line 242:38** - "Create New Unit" button
- **Line 256:32** - "Published Units" heading
- **Line 289:71** - "Untitled Unit" fallback
- **Line 317:54** - "View Workbook" button
- **Line 340:54** - "Edit Unit" button
- **Line 369:32** - "My Drafts" heading
- **Line 402:71** - "Untitled Unit" fallback
- **Line 430:54** - "View Workbook" button
- **Line 453:54** - "Edit Unit" button
- **Line 479:32** - "Archived Units" heading
- **Line 512:71** - "Untitled Unit" fallback
- **Line 540:54** - "View Workbook" button
- **Line 563:54** - "Edit Unit" button

### 10. pages/workbook/[id].js (4 warnings)
- **Line 94:22** - Timer start instructions
- **Line 103:10** - "Start" button
- **Line 240:22** - Timer start instructions (duplicate)
- **Line 248:22** - "Start" button (duplicate)
- **Line 275:13** - "Loading…" message

### 11. src/Copyright.js (2 warnings)
- **Line 8:8** - "Copyright ©" text
- **Line 9:56** - "Your Website" link text

### 12. src/ProTip.js (3 warnings)
- **Line 17:64** - Pro tip message with link

### 13. src/components/AIFeedbackWidget.tsx (7 warnings)
- **Line 224:62** - "Helpful" label
- **Line 249:60** - "Needs improvement" label
- **Line 270:56** - "What could be improved?" label
- **Line 275:80** - "Select all that apply:" label
- **Line 315:14** - "Cancel" button
- **Line 323:14** - "Submit" button

### 14. src/components/ChatSidebar.js (52 warnings)
Multiple messages, labels, and UI text including:
- Error messages
- File drop zones
- History labels
- Chat UI elements
- Tool call previews
- Search results
- Content previews
- Vocabulary review dialogs

### 15. src/components/ChatSidebar/ContentPreview.tsx (5 warnings)
- Content type labels
- Topic displays
- Insert button text
- Success messages

### 16. src/components/ChatSidebar/LexicalMessageRenderer.jsx
- **Line 120:37** - "Error rendering message"

### 17. src/components/ChatSidebar/SearchResults.js (10 warnings)
- "show less" / "show more" toggles
- "No results found" message
- Search helper text
- Section toggles

### 18. src/components/ChatSidebar/ToolCallPreview.tsx (5 warnings)
- Button labels (Cancel, Execute, Confirm & Execute)
- Form option text

### 19. src/components/ChatSidebar/VirtualizedMessageList.jsx (6 warnings)
- Empty state messages
- Message separators
- Tool type parsing

### 20. src/components/DictionaryEditor2.js (5 warnings)
- Ruby tag instructions
- Field labels
- Dialog titles

### 21. src/components/Editor3/components/AnswerComponent.js (18 warnings)
- Input method toggles (Text, Audio, Writing)
- Error messages
- Border style strings
- Feedback messages

### 22. src/components/Editor3/components/AnswerEditor.js (6 warnings)
- Instructions
- Dialog titles
- Button labels
- Empty state messages

### 23. src/components/Editor3/components/AssignmentConfiguration.js (13 warnings)
- Timer configuration UI
- Due date assignment UI
- Section selection
- Button labels

### 24. src/components/Editor3/components/AudioWaveformPlayer.js
- **Line 489:78** - "No audio source provided"

### 25. src/components/Editor3/components/AutocompleteNode.js (2 warnings)
- **Line 78** - Mobile/desktop hints

### 26. src/components/Editor3/components/BlockSuggestionMenu.js (6 warnings)
- Suggestion UI text
- Empty states
- Helper text
- Button labels

### 27. src/components/Editor3/components/ConfigurationManager.js (8 warnings)
- PDF analysis settings
- Featured image UI
- Toggle labels

### 28. src/components/Editor3/components/DocumentUploader.js (11 warnings)
- Upload instructions
- File type information
- How it works steps
- Button labels

### 29. src/components/Editor3/components/EnhancedGenerators.js (4 warnings)
- Button labels
- Modal text

### 30. src/components/Editor3/components/FileManager2.js (71+ warnings)
- Extensive file management UI
- Metadata displays
- Button labels
- Status messages
- Filter text

### 31. src/components/Editor3/components/FreeSoloCreateOptionDialog.js (4 warnings)
- Dialog titles
- Form labels
- Button text

### 32. src/components/Editor3/components/ImageMaskEditor.js (5 warnings)
- Instructions
- Brush size display
- Zoom information
- Button labels

### 33. src/components/Editor3/components/ImageResizer.js
- **Line 227:10** - "Add Caption" button

### 34. src/components/Editor3/components/InsertLayoutDialog.js (2 warnings)
- Button labels

### 35. src/components/Editor3/components/MeaningAssociationEditor.js (6 warnings)
- Dialog titles
- Form descriptions
- Button labels

### 36. src/components/Editor3/components/MediaPlayerComponent.js (2 warnings)
- Display and type attributes

### 37. src/components/Editor3/components/MetadataEditor.tsx (16 warnings)
- Field labels
- File information displays
- Generation information

### 38. src/components/Editor3/components/MetadataField.jsx
- **Line 90:69** - "(unsaved changes)" text

### 39. src/components/Editor3/components/PdfViewerComponent.js (2 warnings)
- Loading messages
- Empty state text

### 40. src/components/Editor3/components/PlaylistEditor.js (4 warnings)
- Menu attributes
- Empty state messages

### 41. src/components/Editor3/components/PromptMethodSelector.js (8 warnings)
- Menu attributes
- Button labels

### 42. src/components/Editor3/components/QuizComponent.js
- **Line 151:18** - Grade display

### 43. src/components/Editor3/components/QuizEditor.js (4 warnings)
- Button labels
- Grade displays
- Status text

### 44. src/components/Editor3/components/SketchPad.js (3 warnings)
- Instructions
- Countdown displays
- Button labels

### 45. src/components/Editor3/components/StaticWaveform.js
- **Line 138:16** - "Error loading waveform"

### 46. src/components/Editor3/components/SuggestedContent.js (4 warnings)
- Owner/identity ID placeholders

### 47. src/components/Editor3/components/TableComponent.js (15 warnings)
- Context menu items
- Action labels

### 48. src/components/Editor3/components/TableOfContents.js (2 warnings)
- Empty state messages
- Section titles

### 49. src/components/Editor3/components/TabsVerticalLeft.js (7 warnings)
- Tab labels and attributes

### 50. src/components/Editor3/components/TabsVerticalRight.js (14 warnings)
- Tab panel content
- Instruction text
- Feature descriptions

### 51. src/components/Editor3/components/UnifiedGenerateModal.js (13 warnings)
- Loading states
- Dialog titles
- Button labels
- Preview text

### 52. src/components/Editor3/components/VerticalTabsRo.js (7 warnings)
- Tab labels
- Overflow attributes

### 53. src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerComponent.js (14 warnings)
- Question displays
- Input toggles
- Border styles
- Feedback messages
- Button labels

### 54. src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerEditor.js (5 warnings)
- Instructions
- Button labels
- Dialog titles

### 55. src/components/Editor3/nodes/FileMetadataNode/FileMetadataComponent.js (21 warnings)
- Metadata field labels
- Content section headers
- Empty state messages

### 56. src/components/Editor3/plugins/AutoEmbedPlugin.js
- **Line 269:71** - "Embed" button

### 57. src/components/Editor3/plugins/ImagesPlugin.js (8 warnings)
- Input attributes
- Button labels

### 58. src/components/Editor3/plugins/TablePlugin.js (5 warnings)
- Dialog titles
- Input attributes
- Button labels

### 59. src/components/Editor3/plugins/ToolBarPlugin.js (26 warnings)
- Dialog titles
- Menu labels
- Button text
- Input labels
- Menu items

### 60. src/components/Editor3/plugins/ToolBarRoPlugin.js (2 warnings)
- Fallback text

### 61. src/components/Editor3/plugins/UnitCompletedPlugin.js (3 warnings)
- Completion messages
- Section headings
- Button labels

### 62. src/components/Editor3/plugins/WordBlockPlugin.js (2 warnings)
- Error messages
- Audio unavailable text

### 63. src/components/MainToolbar.js (8 warnings)
- Menu attributes
- Dialog titles
- Button labels

### 64. src/components/MeaningAssociationExercise/ (Multiple files, 4 warnings total)
- Layout direction attributes

### 65. src/components/ModerationBadge.js (3 warnings)
- Warning messages
- Category displays

### 66. src/components/ModerationPanel.js (6 warnings)
- Panel content
- Category descriptions
- Warning messages

### 67. src/components/QuestionBlock.js (5 warnings)
- Button labels
- Grade displays
- Status text

### 68. src/components/QuestionEditor2.js (2 warnings)
- Dialog titles
- Button labels

### 69. src/components/QuestionsReview2.tsx (17 warnings)
- Section headings
- Alert messages
- Button labels
- Filter displays

### 70. src/components/RecordingStudio2.js (3 warnings)
- Section headings
- Preview labels

### 71. src/components/RecordingStudio3.jsx (16 warnings)
- UI labels
- Button text
- Section headings
- Timeline displays

### 72. src/components/RecordingStudio3/ScreenplayEditor.js (2 warnings)
- Format labels
- Placeholder text

### 73. src/components/RecordingStudioEnhanced.js (10 warnings)
- Filter labels
- Button text
- Instructions
- Input labels

### 74. src/components/SavedPdfThumbnail.tsx (2 warnings)
- Error messages
- Page overlays

### 75. src/components/SectionAssigner.js (6 warnings)
- Dialog content
- Form labels
- Button text

### 76. src/components/SvgPreview.js (2 warnings)
- Empty state text
- Caption text

### 77. src/components/VocabularyReview2.tsx (17 warnings)
- Section headings
- Alert messages
- Button labels
- Summary displays

### 78. src/components/authenticator.js
- **Line 49:32** - Username attributes

### 79. src/components/embeddings/UnitEmbeddingComponents.js (4 warnings)
- Button labels
- Success/error messages

### 80. src/components/embeddings/WordEmbeddingIntegration.js (4 warnings)
- Alert messages
- Success confirmations

---

## Notes

1. **CSS/Theme strings** like color values (`'success.main'`, `'info.main'`) may not need translation
2. **Technical attributes** like `aria-*` and `data-*` attributes should generally remain as-is
3. **Owner/identity placeholders** in test files may not need translation
4. **Some layout strings** like `display="flex"` are CSS values and don't need translation

## Priority Levels (Suggested)

### High Priority
- User-facing UI text (buttons, labels, headings)
- Error messages
- Form field labels
- Dialog titles

### Medium Priority
- Helper text
- Tooltips
- Empty state messages
- Success messages

### Low Priority
- Debug/console messages
- CSS/style values
- Technical attributes
- Test file placeholders

## Translation Strategy

1. Create translation key files (e.g., `en.json`, `ja.json`)
2. Extract all literal strings systematically
3. Replace with `{t('namespace.key')}` calls
4. Test with English first, then add Japanese translations
5. Consider using extraction tools to automate the process
