# Editor

## Lexical Official Plugins Used

This editor uses the following **official Lexical plugins**:

### Core Editing Plugins
- **LexicalRichTextPlugin** - Provides rich text editing capabilities
- **LexicalOnChangePlugin** - Tracks editor state changes with debounced saves
- **LexicalHistoryPlugin** - Undo/redo functionality with 300ms delay
- **LexicalAutoFocusPlugin** - Auto-focuses the editor on mount

### Formatting & Structure Plugins
- **LexicalListPlugin** - Ordered and unordered lists
- **LexicalCheckListPlugin** - Interactive checklists
- **LexicalTabIndentationPlugin** - Tab key indentation support
- **LexicalMarkdownShortcutPlugin** - Markdown shortcuts (e.g., `#` for headings, `*` for lists)

### Content Plugins
- **LexicalLinkPlugin** - Hyperlink support with URL validation (wrapped in custom plugin)
- **LexicalAutoLinkPlugin** - Automatic link detection for URLs and emails (wrapped in custom plugin)
- **LexicalClickableLinkPlugin** - Makes links clickable in read-only mode (Workbook component)
- **LexicalTablePlugin** - Table creation and editing
- **LexicalTableOfContentsPlugin** - Automatic table of contents generation
- **LexicalHorizontalRulePlugin** - Horizontal rule insertion
- **LexicalHashtagPlugin** - Hashtag support

### Utility Plugins
- **LexicalClearEditorPlugin** - Clears editor content
- **LexicalErrorBoundary** - Error handling for editor content

### Custom Plugins (Not Official)
The following are custom implementations specific to this application:
- **ToolBarPlugin** / **ToolBarRoPlugin** - Custom toolbar UI
- **CodeHighlightPlugin** / **CodeActionMenuPlugin** - Code syntax highlighting
- **AutoEmbedPlugin** - Auto-embed detection
- **YouTubePlugin** - YouTube video embedding
- **WordBlockPlugin** - Vocabulary word blocks
- **QuizPlugin** - Interactive quiz components
- **MeaningAssociationPlugin** - Vocabulary meaning associations
- **PlaylistPlugin** - Audio/video playlists
- **PdfViewerPlugin** - PDF document embedding
- **ImagesPlugin** - Image upload and management
- **DragDropPastePlugin** - Drag and drop file handling
- **DraggableBlockPlugin** - Block drag and drop reordering
- **LayoutPlugin** - Custom layout containers
- **AnswerPlugin** / **CustomAnswerPlugin** - Student answer components
- **DataPlugin** - DataStore integration for persistence
- **StoryProgressPlugin** - Progress tracking (Workbook only)
- **UnitCompletedPlugin** - Unit completion tracking (Workbook only)
- **AutocompletePlugin** - Autocomplete functionality

## Additional Schema

s3 paths are digests when using llm to generate. Otherwise when the file is uploaded, the filename is recorded and stored as a uuid in the db

```js
// option
identityId
├── uploaded
│   ├── audio
│   │   └── {datetime}.mp3
│   ├── images
│   │   └── {datetime}.png
│   └── videos
│       └── {datetime}.mpeg
├── generated
│   ├── feedback
│   │   ├── images
│   │   │   └── {digest}.png
│   │   ├── audio
│   │   │   └── {digest}.mp3
│   │   └── text
│   │       └── {digest}.txt
│   ├── videos
│   │   └── {digest}.mpeg
│   ├── images
│   │   └── {digest}.mpeg // check if it exists? if not, generate
│   ├── audio
│   │   └── {digest}.mp3
│   └── units // enable reusing of generated files for units?
│      └── {unitID}
│           ├── images
│           │   └── {digest}.png
│           ├── audio
│           │   └── {digest}.png
│           └── videos
│              └── {digest}.mpeg
└── grades
    └── {gradeID}
        ├── images
        │   └── {datetime}.png
        └── audio
            └── {datetime}.mp3
```

<!-- Propose another file path pattern

identityId/generated/audio/{digest}.mp3
identityId/generated/images/{digest}.png
identityId/generated/videos/{digest}.mpeg
identityId/generated/unit/images/{digest}.mpeg
identityId/generated/unit/audio/{datetime}.mp3
identityId/generated/unit/videos/{datetime}.mp3

identityId/uploaded/audio/{uuidv4}.mp3
identityId/uploaded/images/{uuidv4}.png
identityId/uploaded/videos/{uuidv4}.mpeg
identityId/uploaded/grades/{gradeID}/images/{datetime}.png


identityId/grades/{gradeID}/images/{datetime}.png
identityId/grades/{gradeID}/audio/{datetime}.mp3
 -->

Grades store user input audio and image files
Units store files generated from text snippets

## License

Parts of the following were derived from the following and are licensed under the MIT license: [lexical-playground](https://github.com/facebook/lexical/tree/main/packages/lexical-playground)

Other parts are licensed under the MIT license. See [LICENSE.md](./LICENSE.md) for more information.