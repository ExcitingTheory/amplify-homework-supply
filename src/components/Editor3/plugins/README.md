# Editor3 Plugins

This directory contains Lexical editor plugins and their corresponding custom nodes for the Editor3 component.

## Table of Contents

- [Plugin Architecture](#plugin-architecture)
- [Plugins](#plugins)
  - [AnswerPlugin.js](#answerpluginjs)
  - [AutocompletePlugin.js](#autocompletepluginjs)
  - [AutoEmbedPlugin.js](#autoembedpluginjs)
  - [AutoLinkPlugin.js](#autolinkpluginjs)
  - [ColorPicker.js](#colorpickerjs)
  - [CustomAnswerPlugin.js](#customanswerpluginjs)
  - [CustomListPlugin.js](#customlistpluginjs)
  - [DataPlugin.tsx](#dataplugintsx)
  - [DragDropPastePlugin.js](#dragdroppastepluginjs)
  - [DraggableBlockPlugin.js](#draggableblockpluginjs)
  - [FloatingLinkEditorPlugin.js](#floatinglinkeditorpluginjs)
  - [ImagesPlugin.js](#imagespluginjs)
  - [LayoutPlugin.js](#layoutpluginjs)
  - [LinkPlugin.js](#linkpluginjs)
  - [MeaningAssociationPlugin.js](#meaningassociationpluginjs)
  - [PlaylistPlugin.js](#playlistpluginjs)
  - [QuizPlugin.js](#quizpluginjs)
  - [QuizRoPlugin.js](#quizropluginjs)
  - [TableCellResizerPlugin.js](#tablecellresizerpluginjs)
  - [TablePlugin.js](#tablepluginjs)
  - [ToolBarPlugin.js](#toolbarpluginjs)
  - [ToolBarRoPlugin.js](#toolbarropluginjs)
  - [UnitCompletedPlugin.js](#unitcompletedpluginjs)  
  - [WordBlockPlugin.js](#wordblockpluginjs)
  - [YouTubePlugin.js](#youtubepluginjs)
- [Plugin Usage Patterns](#plugin-usage-patterns)
- [Development Guidelines](#development-guidelines)

## Plugin Architecture

Each plugin typically consists of:
- A custom Lexical Node class (extends `DecoratorNode` or `DecoratorBlockNode`)
- A React component for rendering the node
- A plugin component that registers commands and handles insertions
- Import/export functionality for serialization

## Plugins

### AnswerPlugin.js
**Node Type:** `answer` (DecoratorNode)

**Usage:** Creates interactive answer fields that prompt learners to provide translations or definitions of vocabulary words.

**Node Data:**
- `wordIDs` - Array of Word IDs to quiz on
- `requestDefinition` - Boolean, whether to request definition or phrase
- `allowedInput` - Configuration for accepted input types
- `promptMethod` - Array defining how to prompt the user

**Editor Component:** `AnswerEditor`  
**Display Component:** `AnswerComponent`

### AutocompletePlugin.js
**Node Type:** N/A (Editor Enhancement Plugin)

**Usage:** Provides autocomplete functionality for mentions, hashtags, or custom triggers within the editor. Enhances typing experience with suggestions.

**Features:**
- Trigger-based suggestions
- Customizable autocomplete sources
- Keyboard navigation support

### AutoEmbedPlugin.js
**Node Type:** N/A (URL Processing Plugin)

**Usage:** Automatically detects and converts URLs into embedded content (YouTube, Twitter, etc.) when pasted into the editor.

**Features:**
- URL pattern matching
- Auto-conversion to embed nodes
- Support for multiple embed types

### AutoLinkPlugin.js
**Node Type:** N/A (Text Processing Plugin)

**Usage:** Automatically converts URLs in text into clickable links without manual formatting.

**Features:**
- Real-time link detection
- URL validation
- Automatic link node creation

### ColorPicker.js
**Node Type:** N/A (UI Component)

**Usage:** Provides a color picker interface for text and background color selection in the toolbar.

**Features:**
- Color palette selection
- Custom color input
- Applies color to selected text

### CustomAnswerPlugin.js
**Node Type:** `custom-answer` (DecoratorNode)

**Usage:** Creates custom answer exercises with flexible question-answer pairs defined by the educator.

**Node Data:**
- `ids` - Array of Question IDs
- `allowedInput` - Input validation configuration
- `promptMethod` - Customizable prompting strategy

**Editor Component:** `CustomAnswerEditor`  
**Display Component:** `CustomAnswerComponent`

**Schema:**

```json
[{
  "prompt": "string",
  "answer": "string"
}]
```

### CustomListPlugin.js
**Node Type:** N/A (List Enhancement Plugin)

**Usage:** Extends Lexical's built-in list functionality with custom list types and behaviors.

**Features:**
- Custom list markers
- Nested list support
- List conversion utilities

### DataPlugin.tsx
**Node Type:** N/A (Data Coordination Plugin)

**Usage:** Lightweight coordinator between Yjs real-time collaboration and Amplify DataStore persistence.

**Features:**
- Minimal coordination layer for Yjs-based saving
- Future: Force save on unmount
- Future: Metadata sync independent of editor content

**Migration Note:** With Yjs integration (Phase 1), initial state loading and version tracking are now handled by CollaborationPlugin and useYjsUnit hook. This plugin provides coordination only.

### DragDropPastePlugin.js
**Node Type:** N/A (Event Handling Plugin)

**Usage:** Handles drag-and-drop and paste operations for files, images, and rich content.

**Features:**
- File upload on drop
- Image paste handling
- Rich text paste processing

### DraggableBlockPlugin.js
**Node Type:** N/A (UI Enhancement Plugin)

**Usage:** Enables drag-and-drop reordering of editor blocks with visual handles.

**Features:**
- Drag handles for blocks
- Visual feedback during drag
- Block reordering

### FloatingLinkEditorPlugin.js
**Node Type:** N/A (UI Component Plugin)

**Usage:** Provides a floating toolbar for editing link URLs and opening links in new tabs.

**Features:**
- Floating link editor
- Link validation
- Quick link editing

### ImagesPlugin.js
**Node Type:** `image` (DecoratorNode)

**Usage:** Inserts and manages images in the editor with support for captions, resizing, and alignment.

**Node Data:**
- `src` - Image source URL
- `altText` - Alternative text for accessibility
- `width` - Image width
- `height` - Image height

**Command:** `INSERT_IMAGE_COMMAND`

### LayoutPlugin.js
**Node Type:** Layout nodes (DecoratorBlockNode)

**Usage:** Provides column-based layouts for organizing content in multiple columns.

**Features:**
- Multi-column layouts
- Responsive columns
- Column content editing

### LinkPlugin.js
**Node Type:** `link` (ElementNode)

**Usage:** Manages hyperlinks in the editor with support for URL editing and opening links.

**Features:**
- Link creation and editing
- Link validation
- Target window control

### MeaningAssociationPlugin.js
**Node Type:** `meaning-association` (DecoratorNode)

**Usage:** Creates vocabulary matching exercises where learners associate words with their meanings/definitions.

**Node Data:**
- `wordIDs` - Array of Word IDs to include in the exercise

**Editor Component:** `MeaningAssociationEditor`  
**Display Component:** `MeaningAssociationExercise`

**Exercise Types:**
- Easy mode - Direct matching
- Hard mode - Mixed matching with distractors
- Learn mode - Study flashcards

### PlaylistPlugin.js
**Node Type:** `playlist` (DecoratorNode)

**Usage:** Embeds audio/video playlists with playback controls and track navigation.

**Node Data:**
- `fileIDs` - Array of File IDs (audio files) to include in playlist

**Editor Component:** `PlaylistEditor`  
**Display Component:** `MediaPlayerComponent`

**Features:**
- Multi-track playback
- Playlist navigation
- Progress tracking

### QuizPlugin.js
**Node Type:** `quiz` (DecoratorNode)

**Usage:** Creates interactive multiple-choice or fill-in-the-blank quizzes.

**Node Data:**
- `data` - Quiz questions and answers configuration

**Editor Component:** `QuizEditor`  
**Display Component:** `QuizComponent`

**Features:**
- Multiple question types
- Automatic grading
- Progress tracking

### QuizRoPlugin.js
**Node Type:** N/A (Read-Only Quiz Plugin)

**Usage:** Read-only version of QuizPlugin for displaying completed quizzes or quiz results.

**Features:**
- Display quiz results
- Show correct/incorrect answers
- Score visualization

### TableCellResizerPlugin.js
**Node Type:** N/A (Table Enhancement Plugin)

**Usage:** Enables column and row resizing in tables with drag handles.

**Features:**
- Visual resize handles
- Column width adjustment
- Row height adjustment

### TablePlugin.js
**Node Type:** `table` (ElementNode)

**Usage:** Implements rich table functionality with cell formatting, merging, and manipulation.

**Features:**
- Table creation and editing
- Cell merging/splitting
- Row/column insertion and deletion
- Cell formatting

### ToolBarPlugin.js
**Node Type:** N/A (UI Component Plugin)

**Usage:** Main toolbar for the editor with formatting controls, insert options, and editor commands.

**Features:**
- Text formatting (bold, italic, etc.)
- Block type selection
- Insert media and exercises
- Alignment controls

### ToolBarRoPlugin.js
**Node Type:** N/A (Read-Only Toolbar)

**Usage:** Read-only version of the toolbar for view-only mode.

**Features:**
- Display current formatting
- No editing capabilities
- View-only indicators

### UnitCompletedPlugin.js
**Node Type:** N/A (Modal Plugin)

**Usage:** Displays a completion modal when a learner finishes a unit, showing their score and recent grades.

**Features:**
- Unit completion detection
- Grade display
- Completion celebration UI
- Recent grades history

**Context Used:** `UnitContext`

### WordBlockPlugin.js
**Node Type:** `word-block` (DecoratorBlockNode)

**Usage:** Displays a vocabulary word with its phrase, pronunciation, and definition in a formatted block.

**Node Data:**
- `wordID` - Single Word ID to display

**Component:** `WordBlockComponent`

**Display Format:**
- Word phrase
- Pronunciation
- Definition

### YouTubePlugin.js
**Node Type:** `youtube` (DecoratorBlockNode)

**Usage:** Embeds YouTube videos using iframe embed with privacy-enhanced mode.

**Node Data:**
- `videoID` - YouTube video identifier

**Features:**
- Responsive video embedding
- Privacy-enhanced mode (youtube-nocookie.com)
- Alignment controls
- Full-screen support

## Plugin Usage Patterns

### Inserting Nodes

Most plugins provide an `INSERT_*_COMMAND` that can be dispatched:

```javascript
editor.dispatchCommand(INSERT_ANSWER_COMMAND, { wordIDs: ['id1', 'id2'] });
```

### Node Data Access

Nodes expose getter/setter methods:

```javascript
const node = $getNodeByKey(key);
const wordIDs = node.getIds(); // For plugins with IDs
node.appendId('newId'); // Modify node data
```

### Custom Decorators
Decorator nodes render React components:
- Editor view: Interactive editing interface
- Display view: Learner-facing component with grading

## Development Guidelines

### Creating a New Plugin

1. **Define the Node Class**
   - Extend `DecoratorNode` or `DecoratorBlockNode`
   - Implement required methods: `getType()`, `clone()`, `importJSON()`, `exportJSON()`

2. **Implement DOM Conversion**
   - `createDOM()` - Creates DOM element
   - `exportDOM()` - Exports to HTML
   - `importDOM()` - Imports from HTML

3. **Create Components**
   - Editor component for content creation
   - Display component for learner interaction

4. **Register Plugin**
   - Create command for insertion
   - Add to editor's plugin list
   - Register node type

### Data Persistence
- Use `data-lexical-*` attributes for HTML export
- Store IDs as comma-separated strings or JSON
- Implement proper import/export for complex data structures