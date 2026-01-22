# Component Redesign Visual Guide

## FileManager2 Layout

### Old Layout: Confusing Horizontal Tabs
```
╔════════════════════════════════════════════╗
║  🔍 [All Files] [Images] [Audio] [Docs]   ║ ← Tab confusion
║                                            ║
║ File List (Full Width)                     ║
║ ┌────────────────────────────────────────┐ ║
║ │ □ 📷 photo1.jpg         [→] [↓] [✓] [×]│ ║
║ │   Details mixed in row - hard to read  │ ║
║ │ □ 📷 photo2.jpg         [→] [↓] [✓] [×]│ ║
║ │ □ 🎵 music.mp3          [→] [↓] [✓] [×]│ ║
║ │ □ 📄 document.pdf       [→] [↓] [✓] [×]│ ║
║ │                                        │ ║
║ │ EXPANDED FILE:                         │ ║
║ │ Name: document.pdf                     │ ║
║ │ [Metadata Editor Modal]                │ ║
║ │ [Tabs: Vocab | Questions | Summary]    │ ║
║ │                                        │ ║
║ └────────────────────────────────────────┘ ║
╚════════════════════════════════════════════╝
```

### New Layout: Clear Split-Panel Tree View
```
╔════════════════════════════════════════════╗
║ 🔍 Search files...      [Select All][Clear] ║
╠═══════════════════╦══════════════════════════╣
║                   ║                          ║
║  FILE TREE (35%)  ║  PREVIEW PANEL (65%)    ║
║                   ║                          ║
║  📁 PRIVATE (12)  ║  ┌─ File Header ───────┐║
║   🖼️ Images (5)   ║  │ 📄 document.pdf     ║║
║    • photo1.jpg ✓ ║  │ 2.5 MB • PDF        ║║
║    • photo2.jpg □ ║  │ [Edit]              ║║
║    • scan.png  □  ║  ├─ Metadata ─────────┐║
║    • img4.jpg  □  ║  │ Description: ___   ║║
║    • img5.webp □  ║  │ AI Prompt: ______  ║║
║                   ║  │ Model: __[Variant] ║║
║   🎵 Audio (4)    ║  │                    ║║
║    • voice.m4a □  ║  │ Type: PDF          ║║
║    • music.mp3 □  ║  │ Protection: PUBLIC ║║
║    • podcast.m4a□ ║  │ Created: 01/18/26  ║║
║    • speech.wav □ ║  │ [Cancel] [Save]    ║║
║                   ║  ├─ Content Preview ──┐║
║   📄 Documents(3) ║  │ ▼ Vocabulary (23)  ║║
║    • notes.txt □  ║  │ ▼ Questions (8)    ║║
║    • guide.pdf □  ║  │ • Summaries (4)    ║║
║    • data.csv  □  ║  │ • Objectives (2)   ║║
║                   ║  │ • Concepts (6)     ║║
║  📁 PUBLIC (8)    ║  │                    ║║
║   📄 Documents(8) ║  │ [Scrollable]       ║║
║    • ...         ║  │                    ║║
║                   ║  └────────────────────┘║
║ [⬇️ Scroll Tree]  ║ [⬇️ Scroll Preview]   ║
║                   ║                          ║
╚═══════════════════╩══════════════════════════╝
```

---

## File Tree Organization

### Hierarchical Structure
```
Root
├── PRIVATE (Protection Level)
│   └── (Organized by File Type)
│       ├── Images
│       │   ├── photo1.jpg
│       │   ├── photo2.jpg
│       │   └── scan.png
│       ├── Audio
│       │   ├── voice.m4a
│       │   └── music.mp3
│       ├── Documents
│       │   ├── notes.txt
│       │   └── guide.pdf
│       └── Other
│           └── data.csv
│
├── PUBLIC (Protection Level)
│   └── (Organized by File Type)
│       ├── Images
│       │   └── shared_image.jpg
│       └── Documents
│           └── shared_doc.pdf
│
├── PROTECTED (Protection Level)
│   └── (Organized by File Type)
│       └── ...
│
└── UNSET (Protection Level)
    └── (Organized by File Type)
        └── ...
```

---

## File Row Component

### Compact Visual Layout
```
Before: Expanded Row (Cluttered)
┌──────────────────────────────────────────────────┐
│ Checkbox  Icon  Filename
│ X       Details across multiple lines
│         Size, Status, Badges
│ Buttons: [Expand][Insert][Download][Delete]
│ [Metadata Editor takes entire row when expanded]
└──────────────────────────────────────────────────┘

After: Compact Row (Scannable)
┌──────────────────────────────────────────────────┐
│ □ 🖼️ photo.jpg      234 KB • JPEG          [+][⬇️][✓]
└──────────────────────────────────────────────────┘
```

### File Row Internal Structure
```
┌─────────────────────────────────────────────────────────┐
│ [☑] [🖼️] [filename.jpg] 234 KB • JPEG [+][⬇️][✓][✗] │
│ ↑    ↑    ↑                           ↑ ↑ ↑ ↑ ↑      ↑
│ Sel  Icon Name & Details            Actions        Delete
│      Type                            Insert Download
│                                      Editor  File
└─────────────────────────────────────────────────────────┘
```

---

## Metadata Editor Panel

### With Edit Mode Off (Viewing)
```
┌──────────────────────────────────────────┐
│ 📄 document.pdf                    [Edit] │
│ 2.5 MB • application/pdf                 │
├──────────────────────────────────────────┤
│ Description: "Lecture notes on..."       │
│ AI Prompt: "Summarize the key..."        │
│                                          │
│ Model: gpt-4        Variant: turbo       │
│                                          │
│ ─── Read-Only Info ──────────────────    │
│ Type: PDF            Protection: PUBLIC   │
│ Created: Jan 18, 2026                    │
└──────────────────────────────────────────┘
```

### With Edit Mode On (Editing)
```
╔══════════════════════════════════════════╗
║ 📄 document.pdf                          ║
║ 2.5 MB • application/pdf                 ║
╠══════════════════════════════════════════╣
║ Description: [__________________]        ║ Yellow
║ (unsaved changes)                        ║ Highlight
║                                          ║
║ AI Prompt: [_____________________]       ║
║                                          ║
║ Model: [gpt-4____] Variant: [turbo]      ║
║                                          ║
║ ─── Read-Only Info ───────────────────   ║
║ Type: PDF            Protection: PUBLIC   ║
║ Created: Jan 18, 2026                    ║
║                                          ║
║                   [Cancel] [Save]        ║
╚══════════════════════════════════════════╝
```

---

## Content Preview Section

### For PDF Documents
```
┌──────────────────────────────────────────┐
│ ▼ 🔤 Vocabulary (15 words)               │
│ ▶ ❓ Questions (8)                       │
│ ▶ 📝 Summaries (3)                       │
│ ▶ 🎯 Objectives (2)                      │
│ ▶ 💡 Concepts (5)                        │
│                                          │
│ [Scrollable content for selected tab]    │
│ Shows vocabulary to import, questions,   │
│ etc. with inline editing capability      │
└──────────────────────────────────────────┘
```

### For Audio/Image Files
```
┌──────────────────────────────────────────┐
│ 📋 Extracted Content                     │
│                                          │
│ Description:                             │
│ "Photo shows a Japanese garden..."       │
│                                          │
│ Transcription:                           │
│ "これは美しい庭園です..."                 │
│                                          │
│ [Search highlighting applied]            │
└──────────────────────────────────────────┘
```

---

## VocabularyReview2 Pattern (Reference)

### Word Card Expanded View
```
┌──────────────────────────────────────────┐
│ □ ▼ 📖 Japanese Word        [File src]   │
├──────────────────────────────────────────┤
│ Word: 日本            (Lexical editor)   │
│ Phonetic: にほん                         │
│ Definition: A country in East Asia...    │
│ Context: 日本は...                        │
│                                          │
│ Badges: ✓ In Dictionary  [p.15]          │
├──────────────────────────────────────────┤
│ Auto-save enabled                        │
│ Undo/Redo: Ctrl+Z / Ctrl+Y               │
└──────────────────────────────────────────┘
```

---

## Future: DictionaryEditor2 Pattern

### Similar to VocabularyReview2 but for Editor
```
Dictionary List:
┌─────────────────────────────────────────┐
│ □ ▼ 日本              [Ruby] [Record]    │
│      Definition: A country in East...    │
│      Size: 234 KB • Last: 2 months ago   │
│                                         │
│ □ □ 学生              [Ruby] [Record]    │
│      Definition: A person studying...    │
│      Size: 156 KB • Last: 1 month ago    │
│                                         │
│ □ □ 言葉              [Ruby] [Record]    │
│      Definition: Word, language...       │
│      Size: 189 KB • Last: 3 weeks ago    │
└─────────────────────────────────────────┘

On Expand:
├─ Word field (Lexical with highlighting)
├─ Phonetic field (Lexical)
├─ Definition field (Lexical, multiline)
├─ Audio controls (play/record)
├─ Ruby tags editor
└─ Auto-save indicator
```

---

## Future: QuestionEditor2 Pattern

### Questions with Type Badges
```
Question List:
┌──────────────────────────────────────────┐
│ □ ▼ "What is 日本?"         [🎵 📸]       │
│      Type: Multiple Choice               │
│      Difficulty: ⭐⭐⭐                  │
│                                          │
│ □ □ "Pronounce: 学生"         [🎵]       │
│      Type: Audio Input                   │
│      Difficulty: ⭐⭐                    │
│                                          │
│ □ □ "Write: 言葉"           [✏️]       │
│      Type: Text + Drawing                │
│      Difficulty: ⭐⭐⭐⭐               │
└──────────────────────────────────────────┘

On Expand:
├─ Question field (Lexical)
├─ Question type selector
├─ Input method toggles
│  ├─ Audio input
│  ├─ Drawing input
│  ├─ Text input
│  └─ Writing input
├─ Answer field(s)
├─ Explanation field
└─ Metadata (difficulty, tags, etc.)
```

---

## Color & Visual Indicators

### Status Indicators
- ✓ (Green checkmark) = Selected / Complete / Verified
- □ (Empty checkbox) = Not selected / Incomplete
- ⚠️ (Yellow warning) = Unsaved changes / Draft state
- 🔴 (Red) = Error / Delete pending
- 📌 (Pin) = Pinned / Favorite
- ⏳ (Hourglass) = Processing / Analyzing

### Protection Level Colors
```
PRIVATE    🔒 Navy Blue     (Private, owner only)
PUBLIC     🌍 Green         (Published, everyone)
PROTECTED  🔐 Purple        (Restricted, certain users)
UNSET      ⚪ Gray          (Unclassified)
```

### File Type Icons
```
🖼️  Images      - JPEG, PNG, WebP, SVG, etc.
🎵  Audio       - MP3, M4A, WAV, OGG, etc.
🎬  Video       - MP4, WebM, MOV, etc.
📄  Documents   - PDF, TXT, MD, DOCX, etc.
❓  Other       - Unknown types
```

---

## Responsive Considerations

### On Smaller Screens
```
Mobile (< 768px):
┌──────────────────────────┐
│ 🔍 Search [Sel][Clear]   │
├──────────────────────────┤
│ 📁 File Tree (100%)      │
│  □ ▼ PRIVATE            │
│   □ ▼ Images            │
│    • photo.jpg [+][⬇️][✗]│
│    • scan.png  [+][⬇️][✗]│
│                          │
│ [Show Preview Button]    │
│ or Swipe right to panel  │
└──────────────────────────┘

With Preview Open (Swipe):
┌──────────────────────────┐
│ [< Back]                 │
│ 📄 document.pdf   [Edit] │
│ 2.5 MB • PDF             │
│                          │
│ Description: ________    │
│ AI Prompt: _________     │
│                          │
│ [Preview content]        │
│                          │
│ [<] [Preview] [Tree>]    │
└──────────────────────────┘
```

---

## Keyboard Shortcuts

### File Tree Navigation
| Shortcut | Action |
|----------|--------|
| ↑ ↓ | Navigate tree items |
| → | Expand folder/category |
| ← | Collapse folder/category |
| Space | Toggle checkbox |
| Enter | Select/Preview file |
| Ctrl+A | Select all |
| Ctrl+Shift+A | Deselect all |
| Delete | Delete selected |
| Escape | Cancel operation |

### Editing
| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save metadata |
| Escape | Cancel edit |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Tab | Next field |
| Shift+Tab | Previous field |

---

**Visual Guide Last Updated**: January 18, 2026
