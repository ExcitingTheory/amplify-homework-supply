# Screenplay Editor

A Lexical-based rich text editor that enforces professional screenplay formatting standards while maintaining a simple, distraction-free writing experience.

## Features

### ✨ Industry-Standard Formatting

Automatically enforces all standard screenplay format rules:

- **12-point Courier Font** - Industry standard typeface
- **Precise Margins** - 1.5" left, 1" right/top/bottom
- **~55 Lines Per Page** - Standard page density
- **Element-Specific Spacing** - Each element type has proper indentation and alignment

### 📝 Screenplay Element Types

All standard screenplay elements are supported:

| Element | Formatting | Auto-Features |
|---------|-----------|---------------|
| **Scene Heading** | Left-aligned, uppercase, bold | Auto-capitalizes |
| **Action** | Left-aligned, normal text | Standard paragraph |
| **Character** | Indented 3.7" from left, uppercase | Auto-capitalizes |
| **Parenthetical** | Indented 3.1" from left | Auto-wraps in () |
| **Dialogue** | Indented 2.5" from left, narrow width | Follows character |
| **Transition** | Right-aligned, uppercase | Auto-capitalizes |
| **Shot** | Left-aligned, uppercase | Auto-capitalizes |
| **Fade In** | Left-aligned, uppercase | Auto-adds colon |
| **Fade Out** | Right-aligned, uppercase | Script ending |

### 🎯 Smart Writing Experience

- **Tab to Cycle Formats** - Quick switching between element types
- **Smart Enter Key** - Auto-selects logical next format:
  - Scene Heading → Action
  - Character → Dialogue
  - Dialogue → Action
  - Transition → Scene Heading
- **Floating Format Selector** - Shows current line format with dropdown
- **Undo/Redo Support** - Full history via Lexical HistoryPlugin
- **Auto-Capitalization** - Scene headings, characters, transitions uppercase automatically
- **Auto-Wrapping** - Parentheticals get wrapped in parentheses

### 🎨 Clean Interface

- **Distraction-Free** - Minimal UI, focus on writing
- **Visual Feedback** - Floating selector shows current format
- **Paper-Like Display** - 8.5" x 11" white page on gray background
- **Professional Typography** - Courier font at exact 12pt size

## Usage

### Basic Usage

```jsx
import ScreenplayEditor from './components/RecordingStudio3/ScreenplayEditor';

function MyApp() {
  return <ScreenplayEditor />;
}
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Cycle through format types |
| `Enter` | New line with smart format selection |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |

### Format Selection

Three ways to change format:

1. **Tab Key** - Cycles through common formats
2. **Dropdown Selector** - Click to choose specific format
3. **Smart Enter** - Auto-selects based on context

## Architecture

### Component Structure

```
ScreenplayEditor.js              # Main editor component
├── nodes/
│   └── ScreenplayParagraphNode.js  # Custom paragraph with screenplay types
├── plugins/
│   └── ScreenplayFormatPlugin.js   # Auto-formatting and validation
└── theme/
    └── ScreenplayTheme.js          # Lexical theme configuration
```

### Custom Nodes

**ScreenplayParagraphNode** extends Lexical's `ParagraphNode`:
- Adds `__screenplayType` property
- Applies element-specific CSS styling
- Handles margin/indentation per spec
- Supports serialization/deserialization

### Plugins

**ScreenplayEnterPlugin**
- Intercepts Enter key
- Determines next logical format
- Creates new paragraph with correct type

**ScreenplayTabPlugin**
- Intercepts Tab key
- Cycles through format types
- Updates current paragraph

**ScreenplayFormatPlugin**
- Auto-capitalizes text for certain elements
- Adds parentheses to parentheticals
- Adds colon to "FADE IN"
- Validates formatting rules

**FloatingFormatSelectorPlugin**
- Tracks current selection
- Displays format dropdown
- Updates on selection change

**InitializeScreenplayPlugin**
- Sets up blank screenplay
- Adds initial FADE IN and Scene Heading

## Standard Screenplay Format Reference

### Page Layout
- **Paper Size**: 8.5" x 11" (US Letter)
- **Font**: 12-point Courier (monospaced)
- **Margins**:
  - Left: 1.5 inches
  - Right: 1 inch (0.5" - 1.25" acceptable, ragged)
  - Top: 1 inch
  - Bottom: 1 inch
- **Lines Per Page**: Approximately 55 lines
- **Page Numbers**: Top right, 0.5" from top, flush right with period after

### Element Positioning

Measurements from left edge of page:

- **Scene Heading**: 0" (flush left at margin)
- **Action**: 0" (flush left at margin)
- **Character**: 3.7" (2.2" from left margin)
- **Parenthetical**: 3.1" (1.6" from left margin)
- **Dialogue**: 2.5" (1.0" from left margin)
- **Transition**: Right-aligned
- **Shot**: 0" (flush left at margin)

### Element Rules

**Scene Heading (Slug Line)**
- Format: `INT./EXT. LOCATION - TIME OF DAY`
- All caps, left-aligned
- Examples:
  - `INT. COFFEE SHOP - DAY`
  - `EXT. GRAND CANYON - SUNSET`

**Action**
- Present tense descriptions
- Important props/sounds in CAPS
- Standard paragraph formatting

**Character**
- Speaker name in ALL CAPS
- Centered at 3.7" from left
- Extensions: `(V.O.)`, `(O.S.)`, `(CONT'D)`

**Parenthetical (Wryly)**
- Actor direction in parentheses
- Between character and dialogue
- Used sparingly

**Dialogue**
- Follows character name or parenthetical
- Narrower width (2.5" left, ~6" right)
- Standard capitalization
- Emphasis via underline (sparingly)

**Transition**
- All caps, right-aligned
- Examples: `CUT TO:`, `FADE TO:`, `DISSOLVE TO:`
- Used sparingly (editor may remove)

**Special Elements**
- `FADE IN:` - First line of script
- `FADE OUT.` - Last line of script
- Chyrons/titles - Described in action lines
- Montages - Special formatting with begin/end markers

## Development

### Running in Storybook

```bash
npm run storybook
```

Navigate to: `RecordingStudio3/ScreenplayEditor`

### Testing

The editor includes several Storybook stories:
- **Default** - Blank screenplay
- **With Instructions** - User guide included
- **Sample Script** - Pre-populated example
- **Minimal Interface** - Clean writing mode

### Extending

To add new screenplay element types:

1. Add type to `SCREENPLAY_TYPES` in [ScreenplayEditor.js](ScreenplayEditor.js)
2. Add formatting rules in `ScreenplayParagraphNode.applyScreenplayFormatting()`
3. Update Enter key logic in `ScreenplayEnterPlugin` if needed
4. Add to Tab cycle in `ScreenplayTabPlugin`

## Future Enhancements

Potential additions:
- [ ] Page numbers with proper formatting
- [ ] Title page generation
- [ ] Scene/page counters
- [ ] Import/export to FDX (Final Draft XML)
- [ ] PDF export with exact formatting
- [ ] Collaboration features
- [ ] Revision tracking (colored pages)
- [ ] Character name autocomplete
- [ ] Dual dialogue support
- [ ] Production script features (scene numbers, A-pages)
- [ ] Beat board / outline view
- [ ] Character/location/prop tracking

## References

- [Screenplay Format Guide](https://www.scriptreaderpro.com/screenplay-format/)
- [BBC Writers Room Format Guide](https://www.bbc.co.uk/writersroom/scripts/formatting-your-script)
- [Industry Standard Script Format](https://johnaugust.com/2013/proper-screenplay-format)

## Credits

Built with:
- [Lexical](https://lexical.dev/) - Extensible text editor framework
- [Material-UI](https://mui.com/) - UI components
- [React](https://react.dev/) - Component library

## License

MIT
