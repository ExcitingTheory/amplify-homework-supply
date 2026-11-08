# Editor

## Authoring Layout

- The editable document is a bounded, theme-aware paper surface on a subtly
  tinted workspace, with rounded corners, a soft shadow, and space around it.
  The block-control gutter sits outside the rounded paper surface. Paper edges
  have 24px of breathing room around desktop prose (16px on small screens), while
  the document keeps its existing reading width.
  The gutter follows the editable reading column, with one number per top-level
  block (wrapped text keeps its number). The insert button follows the hovered
  block like the drag handle (and stays put while its menu is open); it opens the
  toolbar's block menu and inserts below without replacing text. Clicking a
  line number or drag handle selects its whole block (in editable mode); double- and triple-click in text keep
  the browser's word and paragraph selection.
- Gutter controls are ordered handle, line number (`1.`), insert, and share a
  28px button size. Numbers and insert buttons gain an outline on hover; the
  drag handle has no hover effect. The targeted line number, open insert menu,
  and dragged handle use an inset "pressed" outline. Line numbers are
  keyboard-accessible links.
  Line-number and table-of-contents navigation scroll the document pane below
  the measured top menu, without moving the surrounding page. Exercise-table
  action icons use the theme's text color in light and dark mode.
- Authoring and workbook content share a responsive 64rem reading column. Prose
  and exercise text share an inset and body typography; exercise and vocabulary
  cards use subtle borders and tints without hover elevation. Saved paragraph
  alignment, right-to-left text, grading colors, and selection cues are preserved.
  Layout and surface values come from `SEMANTIC_THEME.editor.lesson`; the shared
  `getSemanticLessonContentStyles` helper also powers the design-system showcase.
- The left sidebar starts at 640px. Drag either sidebar edge to widen it beyond
  800px, up to the available workspace. Panels have consistent headers and close
  buttons, and always open as non-modal overlays from their tab rails, so the
  document never shifts. With no backdrop, items can still be dragged onto the
  uncovered document; Escape or the close button dismisses a panel. Both panels
  stay open only when they would not overlap.
- Editor focus is indicated on the whole lesson paper, so the cue lines up with
  the gutter wings at the top and bottom of the document.
- Vocabulary terms stay on one line, with compact selection controls and wrapping
  definitions. Exceptionally long terms can scroll horizontally within their column.
- Unit name and description inputs fill their header rows. The description grows
  to three lines before scrolling, keeping the toolbar bounded.
- Scrolling the document pane past 50px collapses that header and portals a
  compact, read-only stacked title/description into the main app bar row beside
  the menu button; clipped text reveals with a hover marquee (`OverflowRevealText`).
  Scrolling back above 10px restores the editable header.
- The workspace fills the viewport below the measured top menu, without a footer
  reservation. The document pane scrolls internally and can shrink within that
  height, rather than pushing a blank region below the editor. The app shell
  reserves menu space with padding so its top margin cannot collapse through the
  page body and leave a menu-height blank region at the bottom.
- File details have independent collapsible preview, metadata, and extracted-content
  sections. Long sections and analysis tabs scroll internally; vocabulary and
  question lists keep their virtual scrolling. Previews support images, audio,
  video, PDFs, and plain-text formats. Other formats remain downloadable.
  With nothing selected, the file list uses the whole panel instead of reserving
  an empty details column. Below a 520px panel width, selection details stack
  beneath the file list.
- PDF previews show the generated thumbnail, or render the first page with PDF.js
  when no thumbnail is available. The file download link spans the bottom of the
  preview section.
- Embedded PDF pages use their natural height, without a grey surround or a
  nested vertical scrollbar. The controls bar is sticky, staying flush under the
  editor toolbar while the PDF is in view, and spans up to the available width;
  zoomed pages scroll horizontally beneath it. `.editor-container` uses
  `overflow-x: clip` (not `hidden`) so it does not trap sticky descendants, and
  the document pane exposes `--editor-scroll-padding` for flush sticky offsets.
  Zoom keeps the page's aspect ratio: the viewer exempts react-pdf output from
  the editor's global `max-width: 100%` rule.
- The PDF full screen button uses the browser Fullscreen API, falling back to a
  fixed in-page overlay (closed with Escape) where element fullscreen is
  unavailable, such as iPhone Safari.
- Dark pages recolor PDF pages with a CSS invert and hue-rotate filter. They
  default to the app's resolved color scheme (the system preference under the
  `auto` theme). Toggling to a value different from the scheme stores an
  override in `localStorage` (`pdfViewer.darkPages`); toggling back clears it.
- ArrowDown on the last line above a custom block selects it. A second ArrowDown
  moves to the paragraph below, creating one if needed, and scrolls it into view.
- Block suggestions run only while the right-hand suggestions tab is open.
  Review the non-interactive block preview and use Accept or Reject; there is no
  floating popup or Tab/Enter interception.
- AI autocomplete is enabled by default and can be disabled in user settings.
  Its preference is stored in Settings metadata (`aiAutocompleteEnabled`) and
  does not disable the block-suggestions sidebar.

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

### Interactive Block Markdown
Custom blocks can be written as standalone Markdown lines using short codes:

- `:::quiz[question-id,...]` — quiz using question IDs
- `:::answer[word-id,...]` — vocabulary answer exercise
- `:::meaning[word-id,...]` — word-to-meaning association exercise
- `:::custom-answer[question-id,...]` — custom answer exercise
- `:::word[word-id]` — standalone vocabulary word card
- `:::playlist[file-id,...]` — audio/video playlist
- `:::conversation-playlist[audio-file-id,...]` — conversation playlist
- `:::file[file-id]` — generic file metadata and parsed-content card
- `:::pdf[file-id]` — embedded PDF viewer
- `:::image[file-id]` — inserted image
- `:::youtube[video-id]` — YouTube video embed using its 11-character video ID
- `:::call-response[question-id,...]` — call-and-response from questions with prompts and answers

AI autocomplete and sidebar block suggestions support these codes using temporary references such
as `q1`, `w1`, and `f1`. It resolves them to selected unit resources in the
browser before parsing; UUIDs are not sent to the model. File, PDF, image, and
media playlist references are limited to the files available in that completion
snapshot. `:::file` inserts the generic file metadata card, not a PDF embed;
use `:::pdf` for a PDF viewer. File-backed codes and call-response are
context-bound and are only parsed when the completion context is provided.
Ghost text uses that same completion snapshot to render custom blocks as
non-interactive previews before acceptance, including during streaming updates.

Answer blocks accept optional named configuration:

- `:::answer[w1,w2]{direction=word-to-definition;prompt=text,audio;input=text,audio,writing}`
- `:::custom-answer[q1]{direction=answer-to-question;prompt=text;input=text}`

For `answer`, direction is `word-to-definition` or `definition-to-word`;
prompts support `text` and `audio`. For `custom-answer`, direction is
`question-to-answer` or `answer-to-question`; prompts support `text`, `audio`,
`phrase`, `definition`, and `pronunciation`. Both blocks support `text`, `audio`,
and `writing` input. Each option is optional; omitted values keep the node's
existing defaults.

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