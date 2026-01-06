# Mock Server Responses for AI Authoring

This directory contains comprehensive mock responses for the AI authoring Lambda functions. These mocks enable full-featured Storybook development without making actual API calls.

## Overview

The mock system simulates both Lambda endpoints with realistic data, timing, and edge cases:

- **`contentCompletion`** - AI-powered text completions (supports simulated streaming)
- **`suggestBlocks`** - Pedagogical block suggestions with reasoning

## Mock Architecture

```
mocks/responses/
├── README.md (this file)
├── index.js (exports all mocks)
├── contentCompletion.js (text completion scenarios)
└── suggestBlocks.js (block suggestion scenarios)
```

## Usage in Storybook

### Basic Usage

```javascript
import { mockContentCompletion, mockSuggestBlocks } from '../../../mocks/responses';

// In your story
export const WithAICompletion = {
  parameters: {
    apolloClient: {
      mocks: [
        mockContentCompletion.standardJapanese,
        mockSuggestBlocks.afterExplanation,
      ],
    },
  },
};
```

### Simulating Streaming

```javascript
import { mockContentCompletion } from '../../../mocks/responses';

// Simulate streaming with delays
const completion = await mockContentCompletion.standardJapanese.withStreamingDelay();
```

## Content Completion Mocks

### Standard Scenarios

| Mock Name | Description | Use Case |
|-----------|-------------|----------|
| `standardJapanese` | Typical Japanese language lesson completion | Default/happy path |
| `longCompletion` | Multi-sentence explanation (3-4 sentences) | Test UI with longer content |
| `shortCompletion` | Single brief sentence | Test minimal responses |
| `technicalContent` | Grammar/technical explanation | Test complex vocabulary |
| `conversational` | Casual dialogue completion | Test tone variation |
| `withKanji` | Completion with kanji, hiragana, katakana | Test character rendering |

### Edge Cases

| Mock Name | Description | Use Case |
|-----------|-------------|----------|
| `empty` | Returns empty string | Test graceful degradation |
| `veryLong` | Exceeds typical length (200+ chars) | Test overflow handling |
| `withSpecialChars` | Unicode, emoji, punctuation | Test encoding |
| `slowResponse` | Delayed response (3+ seconds) | Test loading states |
| `error` | API error response | Test error handling |
| `networkTimeout` | Simulated timeout | Test timeout handling |

### Streaming Simulation

All completion mocks support streaming simulation:

```javascript
// Character-by-character streaming
mockContentCompletion.standardJapanese.withStreaming({
  charsPerChunk: 5,
  delayMs: 50,
});

// Word-by-word streaming
mockContentCompletion.standardJapanese.withStreaming({
  mode: 'words',
  delayMs: 100,
});
```

## Block Suggestion Mocks

### Pedagogical Scenarios

| Mock Name | Description | Priority Levels | Reasoning Quality |
|-----------|-------------|-----------------|-------------------|
| `afterHeading` | Suggests explanation after new heading | HIGH | Foundation building |
| `afterExplanation` | Suggests practice after explanation | HIGH/MEDIUM | Active learning |
| `afterMultipleExplanations` | Urgent practice suggestion | HIGH | Cognitive overload warning |
| `afterQuiz` | Suggests summary or new topic | MEDIUM/LOW | Consolidation |
| `afterPractice` | Suggests assessment | MEDIUM | Formative assessment |
| `emptyLesson` | Cold start suggestions | HIGH/MEDIUM | Scaffolding guidance |
| `complexLesson` | Mixed block types with nuanced suggestions | VARIED | Advanced pedagogy |

### Edge Cases

| Mock Name | Description | Use Case |
|-----------|-------------|----------|
| `singleSuggestion` | Only one suggestion | Test minimal UI |
| `fourSuggestions` | Maximum suggestions (4) | Test full menu |
| `noHighPriority` | All MEDIUM/LOW priority | Test priority display |
| `allHighPriority` | All HIGH priority | Test urgency UI |
| `longReasoning` | Verbose explanations (100+ words) | Test text overflow |
| `shortReasoning` | Brief explanations (10 words) | Test minimal content |
| `error` | API error response | Test error handling |
| `malformedJSON` | Invalid response format | Test parsing errors |

### Suggestion Priorities

Each suggestion includes a priority level:

- **HIGH** (red badge) - Strongly recommended, addresses gap
- **MEDIUM** (yellow badge) - Good option, improves flow
- **LOW** (gray badge) - Optional enhancement

### Response Structure

```javascript
{
  suggestions: [
    {
      type: 'quiz',           // Block type identifier
      label: 'Add Quiz',      // Display text
      icon: '📊',             // Emoji icon
      reasoning: '...',       // Pedagogical explanation
      priority: 'high'        // high | medium | low
    }
  ],
  overallAssessment: 'The lesson...' // General feedback
}
```

## Timing & Performance Testing

### Simulating Network Conditions

```javascript
// Fast connection (100ms)
mockContentCompletion.standardJapanese.withDelay(100);

// Typical connection (500ms)
mockContentCompletion.standardJapanese.withDelay(500);

// Slow connection (2000ms)
mockContentCompletion.standardJapanese.withDelay(2000);

// Mobile/spotty connection (random 1-3s)
mockContentCompletion.standardJapanese.withRandomDelay(1000, 3000);
```

### Simulating Loading States

```javascript
// Show loading indicator during delay
export const SlowLoading = {
  play: async ({ canvasElement }) => {
    // Mock will automatically delay
    await userEvent.type(input, 'Some text.');
    // Loading indicator appears for 2s
  },
  parameters: {
    apolloClient: {
      mocks: [
        mockContentCompletion.slowResponse,
      ],
    },
  },
};
```

## UI/UX Testing Scenarios

### Ghost Text Alignment (Content Completion)

Test these scenarios to ensure ghost text renders correctly:

1. **Short Line** - Completion on short paragraph
2. **Long Line** - Completion after 100+ character line
3. **End of Heading** - Completion in heading block
4. **Mid-Paragraph** - Completion mid-sentence
5. **With Japanese Characters** - Mixed Latin/Japanese rendering

### Menu Layout (Block Suggestions)

Test these scenarios for menu UI:

1. **Standard Menu** - 2-3 suggestions, varied priorities
2. **Full Menu** - 4 suggestions (maximum)
3. **Minimal Menu** - 1 suggestion
4. **Long Reasoning** - Text wrapping and overflow
5. **All Priorities** - HIGH/MEDIUM/LOW badges together

## Development Workflow

### 1. Start Storybook

```bash
npm run storybook
```

### 2. Navigate to AI Plugin Stories

- `Editor3/AIContentCompletionPlugin`
- `Editor3/BlockSuggestionPluginAI`

### 3. Test Different Scenarios

Use the controls panel to:
- Switch between mock scenarios
- Adjust timing parameters
- Toggle streaming on/off
- Test error states

### 4. Visual Regression Testing

Screenshots are captured for:
- Ghost text positioning
- Menu layout and badges
- Loading states
- Error states

## Adding New Mocks

### Content Completion

```javascript
// mocks/responses/contentCompletion.js

export const myNewMock = {
  request: {
    query: contentCompletion,
    variables: {
      prompt: expect.any(String),
      context: expect.any(String),
    },
  },
  result: {
    data: {
      contentCompletion: 'Your completion text here'
    },
  },
  delay: 300, // Optional delay in ms
};
```

### Block Suggestions

```javascript
// mocks/responses/suggestBlocks.js

export const myNewMock = {
  request: {
    query: suggestBlocks,
    variables: {
      unitStructure: expect.any(String),
      currentContext: expect.any(String),
      userHistory: expect.any(String),
    },
  },
  result: {
    data: {
      suggestBlocks: JSON.stringify({
        suggestions: [
          {
            type: 'quiz',
            label: 'Add Quiz',
            icon: '📊',
            reasoning: 'Your pedagogical reasoning here',
            priority: 'high'
          }
        ],
        overallAssessment: 'Your assessment here'
      })
    },
  },
  delay: 500,
};
```

## Testing Checklist

### Content Completion

- [ ] Ghost text appears after typing
- [ ] Tab/Right arrow accepts suggestion
- [ ] Esc dismisses suggestion
- [ ] Typing dismisses suggestion
- [ ] Loading indicator during fetch
- [ ] Error message on failure
- [ ] Works with Japanese characters
- [ ] Respects debounce timing
- [ ] Handles empty responses gracefully

### Block Suggestions

- [ ] Menu appears on empty line
- [ ] Up/Down arrow navigation works
- [ ] Enter/Tab selects suggestion
- [ ] Esc dismisses menu
- [ ] Priority badges display correctly
- [ ] Reasoning text wraps properly
- [ ] Loading indicator during AI fetch
- [ ] Fallback to rules when AI fails
- [ ] Toggle AI mode works
- [ ] Menu positioning correct on scroll

## Performance Benchmarks

Target performance metrics:

| Metric | Target | Measured With |
|--------|--------|---------------|
| Content completion latency | < 1s | `delay` parameter |
| Block suggestion latency | < 1.5s | `delay` parameter |
| Ghost text render time | < 100ms | Storybook interaction test |
| Menu open time | < 50ms | Storybook interaction test |
| Streaming chunk delay | 30-50ms | `withStreaming` config |

## Common Issues & Solutions

### Issue: Mocks not loading

**Solution:** Check that:
1. Mock is exported from `index.js`
2. GraphQL query imports match exactly
3. `apolloClient.mocks` is set in story parameters

### Issue: Streaming not working

**Solution:** Use `withStreaming()` helper:
```javascript
mockContentCompletion.standardJapanese.withStreaming()
```

### Issue: Delay not applying

**Solution:** Set `delay` property:
```javascript
{
  ...mockContentCompletion.standardJapanese,
  delay: 1000,
}
```

### Issue: Variable matching fails

**Solution:** Use `expect.any(String)` for flexible matching:
```javascript
variables: {
  prompt: expect.any(String),
}
```

## Future Enhancements

- [ ] Add mock for partial acceptance (Phase 2+ feature)
- [ ] Add mock for multiple suggestion options
- [ ] Add mock for user preference tracking
- [ ] Add mock for subject-specific pedagogical frameworks
- [ ] Add mock for accessibility recommendations
- [ ] Add integration with Storybook's interaction testing
- [ ] Add visual regression testing with Chromatic

## Related Documentation

- [AI Content Completion Plugin](../../docs/AI_CONTENT_COMPLETION.md)
- [AI Block Suggestions Phase 3](../../docs/AI_BLOCK_SUGGESTIONS_PHASE3.md)
- [Storybook Testing Guide](../../docs/STORYBOOK_TESTING.md)
- [Main Mocking Guide](../BASE64_MOCK_GUIDE.md)

---

**Last Updated:** January 4, 2026  
**Maintainer:** Development Team  
**Version:** 1.0.0
