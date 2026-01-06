# AI-Powered Block Suggestions (Phase 3) - Documentation

## Overview

**Phase 3** enhances the Block Suggestion Plugin with AI-powered pedagogical reasoning. Instead of just pattern-matching, GPT-4 analyzes your entire lesson structure and suggests blocks with **educational explanations** for why each suggestion makes sense.

## What's New in Phase 3

### Before (Phase 1): Rule-Based
```
After explanation paragraph:
💡 Add Vocabulary Practice
💡 Add Custom Practice
💡 Add Quiz
```

### After (Phase 3): AI-Powered with Reasoning
```
🤖 Add Vocabulary Practice - HIGH PRIORITY
"After presenting three examples, learners need active recall 
practice. Vocabulary exercises reinforce the new particles
while preventing passive learning."

🤖 Add Quiz - MEDIUM PRIORITY
"A quiz now would provide formative assessment, but consider
adding more examples first to build confidence."
```

## Features

- **🤖 GPT-4 Analysis**: Analyzes entire lesson structure, not just previous block
- **📚 Pedagogical Reasoning**: Explains **why** each suggestion improves learning
- **🎯 Priority Levels**: HIGH/MEDIUM/LOW based on educational impact
- **⚡ Dual Mode**: Falls back to rule-based if AI fails (graceful degradation)
- **🔄 Context-Aware**: Uses unit name/description for domain-specific suggestions
- **💡 Toggle-able**: Can switch between AI and rule-based modes

## How It Works

### Workflow

```
1. User positions cursor on empty line
   ↓
2. Plugin waits 500ms (debounce)
   ↓
3. Extracts all lesson blocks with content
   ↓
4. Sends to /api/suggest-block
   ↓
5. GPT-4 analyzes pedagogical structure
   ↓
6. Returns 2-4 suggestions with reasoning
   ↓
7. Displays in enhanced menu
   ↓
8. User selects → block inserted
```

### API Request Example

**POST `/api/suggest-block`**

```json
{
  "unitStructure": [
    {
      "type": "heading",
      "content": "Japanese Particles"
    },
    {
      "type": "explanation",
      "content": "Particles are essential elements..."
    },
    {
      "type": "explanation",
      "content": "The particle は marks the topic..."
    }
  ],
  "currentContext": {
    "position": "End of lesson",
    "lastBlockType": "explanation",
    "lastBlockContent": "The particle は marks..."
  },
  "userHistory": []
}
```

**Response:**

```json
{
  "suggestions": [
    {
      "type": "answer",
      "label": "Add Vocabulary Practice",
      "icon": "✍️",
      "reasoning": "After explaining two particles, learners need active practice to distinguish between は and を. Vocabulary exercises provide immediate application.",
      "priority": "high"
    },
    {
      "type": "quiz",
      "label": "Add Comprehension Quiz",
      "icon": "📊",
      "reasoning": "A quiz here checks understanding before moving forward. However, consider adding examples first to build confidence.",
      "priority": "medium"
    }
  ],
  "overallAssessment": "The lesson has strong explanatory content but lacks practice opportunities. Add exercises before summary."
}
```

## Usage

### In Editor3

AI mode is enabled by default:

```javascript
// src/components/Editor3/index.js
<BlockSuggestionPlugin useAI={true} />
```

### Disabling AI Mode

For faster, free suggestions:

```javascript
<BlockSuggestionPlugin useAI={false} />
```

### In Custom Editors

```jsx
import BlockSuggestionPlugin from './plugins/BlockSuggestionPlugin';

function MyEditor() {
  const [useAI, setUseAI] = useState(true);
  
  return (
    <LexicalComposer initialConfig={{ /* ... */ }}>
      {/* Toggle button */}
      <button onClick={() => setUseAI(!useAI)}>
        {useAI ? '🤖 AI Mode' : '💡 Rule Mode'}
      </button>
      
      {/* Plugin with AI toggle */}
      <BlockSuggestionPlugin useAI={useAI} />
    </LexicalComposer>
  );
}
```

## Configuration

### Adjusting AI Behavior

Edit system prompt in [pages/api/suggest-block.js](../pages/api/suggest-block.js):

```javascript
function buildPedagogicalSystemMessage() {
  return `You are an expert educational content strategist...
  
  Pedagogical Principles:
  1. Scaffolding: Build from simple to complex
  2. Active Learning: Include regular practice
  3. Spaced Repetition: Reinforce through variety
  4. Assessment: Check understanding
  5. Reflection: Consolidate knowledge
  
  // Add your own principles here
  `;
}
```

### Priority Thresholds

GPT-4 assigns priorities:

```javascript
// In buildPedagogicalSystemMessage()
Prioritize suggestions:
- "high": Strongly recommended (addresses gap or best practice)
- "medium": Good option (improves flow/variety)
- "low": Optional enhancement (nice-to-have)
```

### Debounce Timing

Adjust wait time before API call in [BlockSuggestionPlugin.js](../src/components/Editor3/plugins/BlockSuggestionPlugin.js):

```javascript
aiRequestTimer.current = setTimeout(async () => {
  const aiSuggestions = await fetchAISuggestions();
  // ...
}, 500); // Change from 500ms to your preference
```

## UI Customization

### Menu Appearance

The menu automatically adapts based on mode:

```javascript
// BlockSuggestionMenu.js
<Paper
  sx={{
    minWidth: useAI ? 400 : 280,  // Wider for AI reasoning
    maxWidth: useAI ? 600 : 400,
    borderColor: useAI ? 'primary.main' : 'divider',  // Blue border for AI
  }}
>
```

### Priority Badges

Priority chips are color-coded:

```javascript
<Chip 
  label={suggestion.priority} 
  color={
    suggestion.priority === 'high' ? 'error' :      // Red
    suggestion.priority === 'medium' ? 'warning' :   // Orange
    'default'  // Gray for low
  }
/>
```

## Pedagogical Principles Used

GPT-4 is prompted with research-backed principles:

### 1. Scaffolding
Build from simple to complex. Don't overwhelm learners.

**Example:**
```
❌ BAD: "Add advanced grammar quiz" after basic introduction
✅ GOOD: "Add basic practice exercises before moving to complex structures"
```

### 2. Active Learning
Balance input (explanations) with output (practice).

**Example:**
```
❌ BAD: "Add another explanation" after 3 explanations
✅ GOOD: "Add practice exercise - learners have absorbed enough theory"
```

### 3. Spaced Repetition
Reinforce concepts through varied exercises.

**Example:**
```
✅ "Add vocabulary practice here, then quiz later for spaced recall"
```

### 4. Formative Assessment
Check understanding before advancing.

**Example:**
```
✅ "Add quiz now to identify gaps before introducing new concepts"
```

### 5. Reflection & Consolidation
Help learners synthesize knowledge.

**Example:**
```
✅ "Add summary after quiz - reflection reinforces what was learned"
```

## Comparison: AI vs Rule-Based

| Aspect | Rule-Based (Phase 1) | AI-Powered (Phase 3) |
|--------|---------------------|----------------------|
| **Speed** | Instant (< 1ms) | 1-3 seconds |
| **Cost** | Free | ~$0.002 per request |
| **Context** | Previous block only | Entire lesson structure |
| **Reasoning** | None | Educational explanation |
| **Priorities** | Equal weight | HIGH/MEDIUM/LOW |
| **Adaptability** | Fixed patterns | Subject/level aware |
| **Offline** | ✅ Yes | ❌ Requires API |

### When to Use Each

**Rule-Based (Phase 1)**:
- Quick authoring sessions
- Predictable content structures
- No internet connection
- Cost-sensitive environments
- Mobile devices (performance)

**AI-Powered (Phase 3)**:
- Creating new curricula
- Complex lesson structures
- Need pedagogical guidance
- Exploring teaching approaches
- Professional development

## Performance

### API Call Optimization

**Debouncing (500ms)**:
- Prevents API spam while navigating
- Gives time for cursor positioning
- Reduces costs

**Fallback Strategy**:
```javascript
try {
  const aiSuggestions = await fetchAISuggestions();
  if (aiSuggestions && aiSuggestions.length > 0) {
    setSuggestions(aiSuggestions);  // Use AI
  } else {
    throw new Error('No AI suggestions');
  }
} catch (error) {
  // Gracefully fall back to rule-based
  const ruleSuggestions = $analyzePreviousBlocks();
  setSuggestions(ruleSuggestions.suggestions);
}
```

**Abort In-Flight Requests**:
```javascript
// Cancel previous request when new one starts
if (abortController.current) {
  abortController.current.abort();
}
```

### Token Usage

Typical request:
- **System message**: ~300 tokens
- **Unit structure**: ~100-300 tokens
- **Completion**: ~200 tokens
- **Total**: ~600-800 tokens per request

**Cost (GPT-4o pricing)**:
- Input: $0.005 / 1K tokens
- Output: $0.015 / 1K tokens
- **Per suggestion**: ~$0.002 (two-tenths of a cent)

**Daily usage** (10 instructors, 20 suggestions each):
- Requests: 200
- Tokens: 140K
- **Cost: ~$0.40/day** or **~$12/month**

Very affordable for productivity gains!

## Storybook Examples

Test AI mode in Storybook:

```bash
npm run storybook
```

Navigate to: **Editor3 → Plugins → BlockSuggestionPlugin (AI Mode)**

### 5 Interactive Stories:

1. **Compare AI vs Rules** - Toggle between modes to see difference
2. **After Explanation** - AI suggests practice with reasoning
3. **Complex Lesson Structure** - AI analyzes multiple concepts
4. **After Quiz** - AI suggests post-assessment activities
5. **Empty Lesson** - AI helps structure from scratch

Each story includes a toggle button to switch between AI and rule-based modes instantly.

## User Acceptance Tracking (Future)

Phase 3 includes placeholders for learning from user behavior:

```javascript
// In fetchAISuggestions()
userHistory: [
  { after: 'explanation', preferred: 'quiz' },
  { after: 'practice', preferred: 'summary' },
]
```

**Future implementation:**
- Track which suggestions are accepted
- Build user-specific patterns
- Personalize AI suggestions
- A/B test different pedagogies

## Troubleshooting

### AI suggestions not appearing

**Check:**
1. Is `useAI={true}` set on plugin?
2. Did you wait 500ms after positioning cursor?
3. Is `OPENAI_API_KEY` environment variable set?
4. Check Network tab for `/api/suggest-block` errors
5. Does fallback to rule-based work?

**Debug:**
```javascript
// Add logging to plugin
console.log('Fetching AI suggestions...');
const aiSuggestions = await fetchAISuggestions();
console.log('AI response:', aiSuggestions);
```

### Slow responses

**Causes:**
- OpenAI API latency (typically 1-3s)
- Large lesson structures (>10 blocks)
- Network issues

**Solutions:**
- Reduce debounce from 500ms to 300ms for faster trigger
- Limit context to last 10 blocks instead of all
- Use faster model (gpt-3.5-turbo vs gpt-4o)
- Implement caching for common structures

### Irrelevant suggestions

**Improve quality:**
1. **Better context**: Ensure unit has descriptive name/description
2. **Refine prompt**: Edit pedagogical principles in system message
3. **Adjust temperature**: Lower to 0.5 for more focused suggestions
4. **Add examples**: Include few-shot examples in prompt

### High costs

**Cost control strategies:**
- Set per-user rate limits (10 requests/hour)
- Cache suggestions for identical structures
- Use rule-based mode by default, AI on-demand
- Implement request budget per account

## Architecture

```
┌─────────────────────────────────────────────────────┐
│         BlockSuggestionPlugin (useAI=true)         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  User positions cursor → 500ms debounce             │
│           ↓                                          │
│  Extract lesson structure                            │
│           ↓                                          │
│  POST /api/suggest-block                            │
│           ↓                                          │
│  ┌────────────────────────┐                         │
│  │   GPT-4 Analyzes:      │                         │
│  │ • Full lesson flow     │                         │
│  │ • Cognitive load       │                         │
│  │ • Active learning gaps │                         │
│  │ • Assessment timing    │                         │
│  └────────┬───────────────┘                         │
│           ↓                                          │
│  Returns suggestions with reasoning                  │
│           ↓                                          │
│  ┌────────────────────────┐                         │
│  │ BlockSuggestionMenu    │                         │
│  │ • Shows reasoning      │                         │
│  │ • Priority badges      │                         │
│  │ • Wider layout         │                         │
│  └────────────────────────┘                         │
│           ↓                                          │
│  User selects → Insert block                         │
│                                                      │
│  [Fallback: If AI fails → Rule-based suggestions]   │
└─────────────────────────────────────────────────────┘
```

## Best Practices

### For Content Creators

1. **Trust the reasoning**: AI explanations are based on learning science
2. **Use as learning tool**: Read reasoning to improve your teaching
3. **Don't over-rely**: You know your students best - AI is a suggestion
4. **Experiment**: Try suggestions you wouldn't have considered
5. **Toggle modes**: Use rule-based for speed, AI for guidance

### For Developers

1. **Monitor costs**: Track API usage per user/school
2. **Cache aggressively**: Same structure = same suggestions
3. **Fail gracefully**: Always fallback to rule-based
4. **Log acceptance**: Track which suggestions work best
5. **A/B test prompts**: Experiment with pedagogical frameworks

## Related Documentation

- [Block Suggestion Plugin (Phase 1)](./BLOCK_SUGGESTION_PLUGIN.md) - Rule-based version
- [AI Content Completion (Phase 2)](./AI_CONTENT_COMPLETION.md) - Sentence suggestions
- [AI Authoring Complete](./AI_AUTHORING_COMPLETE.md) - All phases overview
- [Chatbot Tools](./CHATBOT_TOOLS.md) - Content generation tools

## Future Enhancements

### Short Term
- [ ] Cache suggestions for identical lesson structures
- [ ] User acceptance tracking and personalization
- [ ] Confidence scores on suggestions
- [ ] Multi-language support in reasoning

### Medium Term
- [ ] Subject-specific pedagogical frameworks (STEM vs Language)
- [ ] Learning from community patterns (what works best)
- [ ] Integration with learning analytics
- [ ] Difficulty progression analysis

### Long Term
- [ ] Real-time collaboration suggestions
- [ ] Adaptive pedagogy based on student performance
- [ ] Automatic curriculum mapping
- [ ] Accessibility and UDL recommendations

## Contributing

When improving AI suggestions:

1. **Study learning science**: Read research on effective teaching
2. **Test with real lessons**: Use actual curriculum content
3. **Gather feedback**: Ask instructors about suggestion quality
4. **Document changes**: Explain prompt modifications
5. **Measure impact**: Track acceptance rates and lesson quality

---

**Created**: January 4, 2026  
**Version**: 1.0.0 (Phase 3 - AI-Powered Block Suggestions)  
**Author**: AI-Assisted Development  
**Status**: ✅ Production Ready
