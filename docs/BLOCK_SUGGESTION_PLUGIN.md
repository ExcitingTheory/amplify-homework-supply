# Block Suggestion Plugin - Documentation

## Overview

The **BlockSuggestionPlugin** is an intelligent authoring assistant that suggests pedagogically sound block types as you create educational content. It uses rule-based patterns to analyze your content structure and recommend what type of exercise or content block should naturally come next.

## Features

- **📊 Pedagogical Patterns**: Follows educational best practices (Explanation → Practice → Quiz)
- **⌨️ Keyboard Navigation**: Arrow keys, Tab/Enter to select, Esc to dismiss
- **🎯 Context-Aware**: Analyzes previous blocks to suggest relevant next steps
- **🚀 Zero Latency**: Rule-based (no API calls), instant suggestions
- **💡 Floating Menu**: Non-intrusive UI that appears only when appropriate

## How It Works

### Trigger Conditions

Suggestions appear when:
1. You're on an **empty line** (new paragraph)
2. You're at the **end of a paragraph** with substantial content (>20 chars)
3. There's a **previous block** to analyze for context

### Pedagogical Patterns

The plugin categorizes content blocks and suggests what typically comes next:

| After This Block | Suggestions |
|-----------------|-------------|
| **Heading** | Add Explanation (paragraph) |
| **Explanation** (long paragraph) | Add Vocabulary Practice<br>Add Custom Practice<br>Add Quiz |
| **Example** (short paragraph/list) | Add Vocabulary Practice<br>Add Custom Practice<br>Add Quiz |
| **Practice** (answer/custom-answer) | Add Quiz<br>Add Summary<br>New Section |
| **Quiz** | Add Summary<br>New Section |
| **Summary** | New Section (heading) |
| **Empty Document** | Add Heading<br>Add Explanation |

### Block Categories

The plugin intelligently categorizes blocks:

```javascript
// Heading detection
# Heading → HEADING category

// Explanation detection
Long paragraph (>100 chars) → EXPLANATION category

// Example detection
Short paragraph (<100 chars) OR List → EXAMPLE category

// Practice detection
AnswerNode OR CustomAnswerNode → PRACTICE category

// Quiz detection
QuizNode → QUIZ category

// Summary detection
Paragraph with keywords: "summary", "conclusion", "in summary", etc. → SUMMARY category
```

## Usage

### In Your Content

1. **Start with a heading**: Type `# Introduction` and press Enter
2. **See suggestion**: A floating menu appears suggesting "Add Explanation"
3. **Navigate**: Use ↑↓ arrow keys to browse suggestions
4. **Select**: Press Tab or Enter to insert the selected block
5. **Dismiss**: Press Esc if you don't want suggestions

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` | Navigate up in suggestion list |
| `↓` | Navigate down in suggestion list |
| `Tab` or `Enter` | Select highlighted suggestion |
| `Esc` | Dismiss suggestions menu |
| Click | Select suggestion directly |

## Integration

### In Editor3

The plugin is automatically enabled in the main `Editor3` component:

```javascript
// src/components/Editor3/index.js
import BlockSuggestionPlugin from './plugins/BlockSuggestionPlugin.js';

// In LexicalComposer
<BlockSuggestionPlugin />
```

### In Custom Editors

To use in a custom Lexical editor:

```jsx
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import BlockSuggestionPlugin from './plugins/BlockSuggestionPlugin';
import { QuizNode } from './plugins/QuizPlugin';
import { AnswerNode } from './plugins/AnswerPlugin';
import { CustomAnswerNode } from './plugins/CustomAnswerPlugin';

const nodes = [
  HeadingNode,
  QuizNode,
  AnswerNode,
  CustomAnswerNode,
  // ... other nodes
];

function MyEditor() {
  return (
    <LexicalComposer initialConfig={{ nodes, /* ... */ }}>
      {/* Other plugins */}
      <BlockSuggestionPlugin />
    </LexicalComposer>
  );
}
```

**Requirements:**
- Must include `QuizNode`, `AnswerNode`, `CustomAnswerNode` in editor config
- Must import corresponding plugins (`QuizPlugin`, `AnswerPlugin`, `CustomAnswerPlugin`)

## Customization

### Modifying Pedagogical Patterns

Edit `PEDAGOGICAL_PATTERNS` in [BlockSuggestionPlugin.js](src/components/Editor3/plugins/BlockSuggestionPlugin.js):

```javascript
const PEDAGOGICAL_PATTERNS = {
  [BLOCK_CATEGORIES.HEADING]: [
    { 
      type: 'paragraph', 
      label: 'Add Explanation', 
      icon: '📝', 
      category: BLOCK_CATEGORIES.EXPLANATION 
    },
    // Add more suggestions here
  ],
  // ... other categories
};
```

### Adding New Block Types

1. **Define the command** in your plugin:
```javascript
export const INSERT_MY_BLOCK_COMMAND = createCommand('INSERT_MY_BLOCK_COMMAND');
```

2. **Import in BlockSuggestionPlugin**:
```javascript
import { INSERT_MY_BLOCK_COMMAND } from './MyBlockPlugin';
```

3. **Add to suggestions**:
```javascript
const PEDAGOGICAL_PATTERNS = {
  [BLOCK_CATEGORIES.EXPLANATION]: [
    { type: 'my-block', label: 'Add My Block', icon: '🎨', category: BLOCK_CATEGORIES.PRACTICE },
  ],
};
```

4. **Handle insertion**:
```javascript
switch (selected.type) {
  case 'my-block':
    editor.dispatchCommand(INSERT_MY_BLOCK_COMMAND, null);
    break;
  // ... other cases
}
```

### Styling the Menu

Customize `BlockSuggestionMenu.js` Material-UI `sx` props:

```javascript
<Paper
  sx={{
    // Change colors, borders, shadows
    bgcolor: 'background.paper',
    border: '2px solid',
    borderColor: 'primary.main',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
  }}
>
```

## Storybook Examples

View live examples in Storybook:

```bash
npm run storybook
```

Navigate to: **Editor3 → Plugins → BlockSuggestionPlugin**

### Stories:

1. **Empty Editor**: Start from scratch and see default suggestions
2. **After Heading**: Suggests adding explanation
3. **After Explanation**: Suggests practice/quiz blocks
4. **After Quiz**: Suggests summary or new section

## Architecture

### Components

```
BlockSuggestionPlugin.js (Main logic)
├── Analyzes editor state
├── Categorizes previous blocks
├── Determines suggestions
├── Handles keyboard navigation
└── Dispatches insert commands

BlockSuggestionMenu.js (UI)
├── Renders floating menu
├── Positions below cursor
├── Displays suggestions with icons
└── Handles click selection
```

### Data Flow

```
1. User types/positions cursor
   ↓
2. Plugin's registerUpdateListener fires
   ↓
3. $analyzePreviousBlocks() categorizes context
   ↓
4. getSuggestions() returns relevant blocks
   ↓
5. setState updates suggestions array
   ↓
6. BlockSuggestionMenu renders
   ↓
7. User selects → insertSelectedBlock()
   ↓
8. Plugin dispatches INSERT_*_COMMAND
   ↓
9. Corresponding plugin handles insertion
```

### State Management

```javascript
const [suggestions, setSuggestions] = useState(null);     // Array of suggestion objects
const [selectedIndex, setSelectedIndex] = useState(0);    // Highlighted suggestion
const [anchorElement, setAnchorElement] = useState(null); // Selection range for positioning
```

## Performance

- **Zero API latency**: Pure client-side, rule-based logic
- **Throttled updates**: Prevents excessive re-renders during typing
- **Conditional rendering**: Menu only renders when suggestions exist
- **Efficient categorization**: Simple node type checks (< 1ms)

## Troubleshooting

### Suggestions not appearing

**Check:**
1. Are you on an empty line or at end of paragraph?
2. Is there a previous block to analyze?
3. Are required plugins registered? (QuizPlugin, AnswerPlugin, etc.)
4. Console errors? Open DevTools

### Wrong suggestions

**Solution:**
- Adjust categorization logic in `categorizeNode()`
- Modify pattern rules in `PEDAGOGICAL_PATTERNS`
- Check paragraph length thresholds (100 chars for explanation/example)

### Menu positioning issues

**Fix:**
- Ensure `anchorElement` is a valid Range object
- Check for layout shifts/scrolling interfering with position
- Adjust `top`/`left` calculations in BlockSuggestionMenu

### Keyboard shortcuts not working

**Debug:**
- Check `COMMAND_PRIORITY_LOW` - may be overridden by higher-priority commands
- Verify `mergeRegister` properly unsubscribes
- Test if suggestions array is populated (`console.log(suggestions)`)

## Future Enhancements (Phase 2 & 3)

### Phase 2: AI Content Completion
- Use GPT to suggest **actual content** (sentences/paragraphs)
- Trigger on paragraph end
- Stream suggestions like GitHub Copilot

### Phase 3: AI Block Suggestions
- Analyze entire unit structure with GPT
- Provide **reasoning** for suggestions ("After a quiz, learners benefit from reflection...")
- Adaptive patterns based on user's teaching style

## Related Documentation

- [Editor3 Architecture](../../docs/ONBOARDING.md#editor-system)
- [Lexical Plugins Guide](https://lexical.dev/docs/concepts/plugins)
- [AutocompletePlugin](./AutocompletePlugin.js) (word-level completion)
- [ChatTools Documentation](../../../docs/CHATBOT_TOOLS.md) (AI content generation)

## Contributing

When adding new pedagogical patterns:

1. **Research best practices**: Consult educational theory
2. **Test with real content**: Use multiple subjects/levels
3. **Get instructor feedback**: Validate usefulness
4. **Document rationale**: Explain why pattern makes sense
5. **Update this doc**: Keep examples current

---

**Created**: January 4, 2026  
**Version**: 1.0.0 (Phase 1 - Rule-Based Suggestions)  
**Author**: AI-Assisted Development
