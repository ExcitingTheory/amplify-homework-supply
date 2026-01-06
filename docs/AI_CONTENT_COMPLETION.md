# AI Content Completion Plugin - Documentation

## Overview

The **AIContentCompletionPlugin** provides GitHub Copilot-style content completion for educational content creation. As you write explanations, examples, and lesson content, the AI intelligently suggests what should come next based on context.

## Features

- **🤖 GPT-4 Powered**: Uses state-of-the-art language model for high-quality suggestions
- **⚡ Streaming Responses**: Suggestions appear character-by-character as they're generated
- **🎯 Context-Aware**: Understands your unit's topic and writing style
- **⌨️ Smart Triggers**: Activates after complete sentences (minimum 50 characters)
- **🎨 Ghost Text UI**: Non-intrusive inline suggestions styled like GitHub Copilot
- **📊 Debounced**: Waits for you to stop typing before calling API (800ms delay)

## How It Works

### Trigger Conditions

AI suggestions appear when ALL of these are true:

1. ✅ You've typed at least **50 characters**
2. ✅ You're at the **end of a text node**
3. ✅ Last character is **sentence-ending punctuation**: `.` `!` `?` `。`
4. ✅ You've **stopped typing** for 800ms
5. ✅ You're NOT in a heading

### Visual Example

```
You're typing:
┌─────────────────────────────────────────────────────────┐
│ Hiragana is one of three Japanese writing systems.█     │
└─────────────────────────────────────────────────────────┘
         ↓ (800ms pause after typing period)
         
AI suggests:
┌─────────────────────────────────────────────────────────┐
│ Hiragana is one of three Japanese writing systems.      │
│ | It consists of 46 basic characters that represent...  │ ← Ghost text
│ └─ Tab to accept                                         │
└─────────────────────────────────────────────────────────┘
```

### Workflow

```
1. User types complete sentence + punctuation
   ↓
2. Plugin waits 800ms (debounce)
   ↓
3. Extracts last 200 chars for context
   ↓
4. Sends to /api/complete endpoint
   ↓
5. GPT-4 generates continuation
   ↓
6. Response streams character-by-character
   ↓
7. Displays as gray italic ghost text
   ↓
8. User accepts (Tab/→) or dismisses (Esc/continue typing)
```

## Usage

### In the Editor

1. **Write normally**: Type your content as usual
2. **End with punctuation**: Finish sentences with `.` `!` `?` or `。`
3. **Wait briefly**: Pause for ~1 second
4. **See suggestion**: Ghost text appears after cursor
5. **Accept**: Press Tab or → (arrow right) to insert
6. **Dismiss**: Press Esc or just keep typing

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Accept entire suggestion |
| `→` (Right Arrow) | Accept entire suggestion (when at end of text) |
| `Esc` | Dismiss suggestion |
| Any other key | Dismiss and continue typing |

## API Endpoint

### `/api/complete`

**Method**: POST  
**Runtime**: Edge (Vercel)  
**Model**: GPT-4o

**Request Body**:
```json
{
  "prompt": "Last 200 characters of content for context",
  "context": {
    "unit": {
      "name": "Unit name",
      "description": "Unit description"
    },
    "subject": "Japanese language learning",
    "level": "intermediate"
  }
}
```

**Response**: Streaming text (Server-Sent Events)

**Example**:
```bash
curl -X POST http://localhost:3000/api/complete \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hiragana is one of three Japanese writing systems.",
    "context": {
      "unit": { "name": "Introduction to Hiragana" },
      "subject": "Japanese language learning"
    }
  }'

# Streams: "It consists of 46 basic characters..."
```

## Configuration

### Adjusting Trigger Behavior

Edit constants in [AIContentCompletionPlugin.js](../src/components/Editor3/plugins/AIContentCompletionPlugin.js):

```javascript
const DEBOUNCE_DELAY = 800;         // ms to wait after typing stops
const MIN_CONTENT_LENGTH = 50;      // minimum chars before suggesting
const TRIGGER_CHARS = ['.', '!', '?', '。']; // punctuation that triggers
```

### Customizing Context

The plugin sends context from `UnitContext`:

```javascript
const { currentUnit } = useContext(UnitContext);

// Sent to API:
context: {
  unit: {
    name: currentUnit.name,
    description: currentUnit.description,
  },
  subject: 'Japanese language learning',
  level: 'intermediate',
}
```

To add more context, modify `fetchSuggestion()`:

```javascript
fetchSuggestion(contextText, {
  subject: 'Japanese language learning',
  level: 'intermediate',
  previousBlocks: ['explanation', 'example'], // Add block history
  vocabulary: recentWords, // Add recent vocab
});
```

### Adjusting Completion Length

In [pages/api/complete.js](../pages/api/complete.js):

```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  stream: true,
  messages,
  temperature: 0.7,    // Creativity (0.0-2.0)
  max_tokens: 150,     // Length (increase for longer suggestions)
});
```

**Guidelines**:
- `max_tokens: 50-100` → One sentence
- `max_tokens: 150-200` → Two sentences (current default)
- `max_tokens: 300-500` → Paragraph

## Styling

### Ghost Text Appearance

Customize in [AIContentSuggestion.js](../src/components/Editor3/components/AIContentSuggestion.js):

```javascript
<Typography
  sx={{
    color: 'text.disabled',    // Text color
    opacity: 0.5,              // Transparency
    fontStyle: 'italic',       // Italic style
    borderLeft: '2px solid',   // Left border indicator
    borderColor: 'primary.main',
    paddingLeft: 0.5,
  }}
>
  {suggestion}
</Typography>
```

**Theme Integration**:
- Uses Material-UI theme colors automatically
- Respects dark/light mode
- Adapts to editor font family

### Loading Indicator

Customize the streaming state:

```javascript
{isLoading && (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <CircularProgress size={12} sx={{ color: 'text.disabled' }} />
    <Typography variant="caption">
      Generating...
    </Typography>
  </Box>
)}
```

## Performance

### API Call Optimization

**Debouncing (800ms)**:
- Prevents excessive API calls while typing
- Saves costs and rate limits
- Improves UX by not interrupting flow

**Context Window (200 chars)**:
- Balances quality vs. token cost
- Provides enough context without bloat
- Can increase if suggestions need more context

**Streaming**:
- Shows progress immediately
- User sees suggestions forming in real-time
- Better perceived performance

### Token Usage

Typical request:
- **System message**: ~100 tokens
- **User prompt** (200 chars): ~50 tokens
- **Completion**: ~40 tokens
- **Total per suggestion**: ~190 tokens

Cost (GPT-4o pricing as of Jan 2026):
- Input: $0.005 / 1K tokens
- Output: $0.015 / 1K tokens
- **Per suggestion**: ~$0.001 (tenth of a cent)

### Rate Limiting

Consider implementing:

```javascript
// In AIContentCompletionPlugin.js
const [requestCount, setRequestCount] = useState(0);
const [lastResetTime, setLastResetTime] = useState(Date.now());

const fetchSuggestion = useCallback(async (prompt, context) => {
  // Reset counter every minute
  if (Date.now() - lastResetTime > 60000) {
    setRequestCount(0);
    setLastResetTime(Date.now());
  }
  
  // Limit to 10 requests per minute
  if (requestCount >= 10) {
    console.warn('Rate limit reached');
    return;
  }
  
  setRequestCount(prev => prev + 1);
  // ... rest of function
}, [requestCount, lastResetTime]);
```

## Storybook Examples

View live demos in Storybook:

```bash
npm run storybook
```

Navigate to: **Editor3 → Plugins → AIContentCompletionPlugin**

### Stories:

1. **Empty Editor**: Start writing from scratch
2. **Partial Explanation**: AI completes your explanation
3. **Mid Lesson**: Context-aware suggestions based on surrounding content
4. **Streaming Demo**: Watch suggestions appear character-by-character

## Architecture

### Components

```
AIContentCompletionPlugin.js (Main logic)
├── Monitors editor state for trigger conditions
├── Debounces API calls (800ms)
├── Manages streaming responses
├── Handles keyboard shortcuts
└── Dispatches text insertion

AIContentSuggestion.js (UI)
├── Renders ghost text inline
├── Positions at cursor
├── Shows loading state
└── Displays acceptance hints

/api/complete.js (Backend)
├── Validates request
├── Builds context-aware prompt
├── Calls GPT-4o with streaming
└── Returns Server-Sent Events stream
```

### State Management

```javascript
// Plugin state
const [suggestion, setSuggestion] = useState(null);       // Current suggestion text
const [isLoading, setIsLoading] = useState(false);        // API call in progress
const [anchorElement, setAnchorElement] = useState(null); // Cursor position

// Refs for cleanup
const debounceTimer = useRef(null);      // Debounce timeout
const abortController = useRef(null);    // Cancel in-flight requests
```

### Data Flow

```
User types → registerUpdateListener fires
   ↓
Check trigger conditions
   ↓
Extract context (200 chars)
   ↓
Debounce (800ms)
   ↓
fetchSuggestion() → POST /api/complete
   ↓
OpenAI streaming response
   ↓
setSuggestion() on each chunk
   ↓
AIContentSuggestion renders ghost text
   ↓
User accepts (Tab) → insertNodes([textNode])
   ↓
Clear suggestion
```

## Troubleshooting

### Suggestions not appearing

**Check:**
1. Did you type at least 50 characters?
2. Does text end with punctuation (. ! ? 。)?
3. Did you wait 800ms after typing?
4. Are you in a paragraph (not heading)?
5. Console errors? Check DevTools Network tab

**Debug:**
```javascript
// Add logging to plugin:
console.log('Text length:', text.length);
console.log('Last char:', lastChar);
console.log('Should trigger:', shouldTrigger);
```

### Slow suggestions

**Causes:**
- OpenAI API latency (typically 1-3 seconds)
- Large context window
- Network issues

**Solutions:**
- Reduce `max_tokens` in `/api/complete.js`
- Decrease context window from 200 to 100 chars
- Use faster model (gpt-3.5-turbo instead of gpt-4o)

### Incorrect suggestions

**Improve quality:**
1. **Add more context**: Increase context window to 300 chars
2. **Refine system prompt**: Edit `buildCompletionSystemMessage()` in `/api/complete.js`
3. **Provide unit metadata**: Ensure `currentUnit` has good name/description
4. **Adjust temperature**: Lower to 0.5 for more focused suggestions

### Ghost text positioning issues

**Fix:**
- Check `anchorElement` is valid Range
- Ensure no CSS transforms on editor
- Verify `position: absolute` has correct parent
- Test with different zoom levels

### Keyboard shortcuts conflicting

**Solutions:**
- Plugin uses `COMMAND_PRIORITY_LOW` - may be overridden
- Check other plugins registering same keys
- Verify event.preventDefault() is called
- Test in isolation (disable other plugins)

## Comparison with Other Features

| Feature | Trigger | Suggests | Use Case |
|---------|---------|----------|----------|
| **AutocompletePlugin** | 4+ chars typed | Dictionary words | Vocabulary completion |
| **BlockSuggestionPlugin** | Empty line after block | Block types (quiz, practice) | Structural guidance |
| **AIContentCompletionPlugin** | Sentence end | Full sentences | Content authoring |
| **ChatSidebar (tools)** | User request | Markdown templates | Intentional generation |

### When to use each:

- **Writing lesson content** → AIContentCompletionPlugin
- **Adding vocabulary** → AutocompletePlugin
- **Structuring lesson flow** → BlockSuggestionPlugin
- **Generating specific sections** → ChatSidebar with generate_unit_content tool

## Best Practices

### For Content Creators

1. **Write naturally**: Don't write for the AI, write for students
2. **Review suggestions**: AI can make mistakes - always verify
3. **Use as inspiration**: Treat suggestions as drafts to refine
4. **Build context**: Earlier paragraphs improve later suggestions
5. **Accept partially**: You can accept then edit immediately

### For Developers

1. **Monitor costs**: Track API usage in production
2. **Implement caching**: Cache common completions
3. **A/B test prompts**: Experiment with system messages
4. **Collect feedback**: Add thumbs up/down on suggestions
5. **Graceful degradation**: Handle API failures elegantly

## Future Enhancements

### Short Term
- [ ] Partial acceptance (accept first N words only)
- [ ] Multiple suggestions (show 2-3 options)
- [ ] Suggestion history (undo rejected suggestions)
- [ ] Offline mode (local model for basic completions)

### Medium Term
- [ ] Learning from edits (fine-tune on accepted vs rejected)
- [ ] Multi-paragraph suggestions (for complex explanations)
- [ ] Code completion (for embedding programming examples)
- [ ] Translation suggestions (Japanese → English explanations)

### Long Term
- [ ] Voice-to-text with AI polish
- [ ] Collaborative editing with merge suggestions
- [ ] Style transfer (match instructor's writing style)
- [ ] Adaptive difficulty (suggestions match learner level)

## Related Documentation

- [BlockSuggestionPlugin](./BLOCK_SUGGESTION_PLUGIN.md) - Structural block suggestions
- [AutocompletePlugin](../src/components/Editor3/plugins/AutocompletePlugin.js) - Word completion
- [ChatTools](./CHATBOT_TOOLS.md) - Content generation tools
- [Editor3 Architecture](./ONBOARDING.md#editor-system)

## Contributing

When improving completion quality:

1. **Test with real content**: Use actual lesson materials
2. **Measure accuracy**: Track how often suggestions are accepted
3. **Gather feedback**: Ask instructors what helps most
4. **Document prompts**: Explain reasoning behind system message changes
5. **Monitor costs**: Be mindful of token usage

---

**Created**: January 4, 2026  
**Version**: 1.0.0 (Phase 2 - AI Content Completion)  
**Author**: AI-Assisted Development
