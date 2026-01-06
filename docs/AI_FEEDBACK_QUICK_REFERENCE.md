# AI Feedback System - Quick Reference

## Overview

User feedback collection for all AI-generated content with thumbs up/down and predefined reasons.

## Quick Import

```typescript
import AIFeedbackWidget from '../components/AIFeedbackWidget';
import { submitPositiveFeedback, submitNegativeFeedback } from '../utils/aiFeedbackUtils';
```

## Content Types

- `CHAT_MESSAGE` - AI assistant responses
- `CONTENT_COMPLETION` - Editor auto-completion
- `AUDIO_GENERATION` - Generated audio files
- `IMAGE_GENERATION` - Generated images
- `DOCUMENT_ANALYSIS` - PDF analysis results
- `VOCABULARY_EXTRACTION` - Extracted vocabulary
- `TRANSCRIPTION` - Audio transcription
- `IMAGE_DESCRIPTION` - Image descriptions
- `GRADING_FEEDBACK` - Automated grading
- `BLOCK_SUGGESTION` - Content block suggestions

## Feedback Reasons (for thumbs down)

- `INCORRECT` - Factually wrong
- `INCOMPLETE` - Missing details
- `INAPPROPRIATE` - Offensive content
- `NOT_HELPFUL` - Doesn't answer question
- `IRRELEVANT` - Off-topic
- `POOR_QUALITY` - Grammar/formatting issues
- `OTHER` - Custom reason

## Basic Widget Usage

```jsx
<AIFeedbackWidget
  contentType="CHAT_MESSAGE"
  generatedContent={aiResponse}
  model="gpt-4"
  messageId={msg.id}
  unitId={unit.id}
  size="small"
  showLabels={false}
  onFeedbackSubmitted={(feedback) => console.log(feedback)}
/>
```

## Programmatic Submission

```typescript
// Positive feedback
await submitPositiveFeedback('CHAT_MESSAGE', content, {
  model: 'gpt-4',
  unitId: unit.id,
});

// Negative feedback with reasons
await submitNegativeFeedback(
  'CONTENT_COMPLETION',
  content,
  ['INCORRECT', 'INCOMPLETE'],
  'Optional comment',
  { model: 'gpt-4' }
);
```

## Query Feedback

```typescript
// Get stats
const stats = await getFeedbackStats('CHAT_MESSAGE', unitId);
// { total, positive, negative, positiveRate, negativeRate, commonReasons }

// Get by content type
const feedback = await getFeedbackByContentType('CHAT_MESSAGE');

// Get by unit
const unitFeedback = await getFeedbackByUnit(unitId);

// Get by message
const msgFeedback = await getFeedbackByMessage(messageId);
```

## Auto-tracking Examples

### Chat Messages
```jsx
{message.role === 'assistant' && (
  <AIFeedbackWidget
    contentType="CHAT_MESSAGE"
    messageId={message.id}
    generatedContent={message.content}
    model="gpt-4"
    unitId={unit?.id}
  />
)}
```

### Content Completion (Auto-dismiss tracking)
```javascript
const dismissSuggestion = async (sendNegativeFeedback = false) => {
  if (sendNegativeFeedback && suggestion) {
    await submitNegativeFeedback(
      'CONTENT_COMPLETION',
      suggestion,
      [],
      undefined,
      { unitId: currentUnit?.id }
    );
  }
};
```

## Schema

```graphql
type AIFeedback @model {
  id: ID!
  owner: String
  contentType: AIContentType!
  feedbackType: AIFeedbackType!    # POSITIVE | NEGATIVE
  reasons: [AIFeedbackReason]
  comment: String
  model: String
  prompt: String
  generatedContent: String
  unitID: ID
  gradeID: ID
  documentID: ID
  messageId: String
  sessionId: String
  metadata: AWSJSON
}
```

## When to Add Feedback

✅ **Always add feedback for:**
- Chat assistant responses
- Generated vocabulary/questions
- Document analysis results
- Audio/image generation
- Grading feedback

⚠️ **Auto-track (no widget needed):**
- Content completion accepts/dismisses
- Implicit user actions

❌ **Don't add feedback for:**
- User-created content
- Static content
- File uploads
- Non-AI operations

## Best Practices

1. **Always provide context**: Include `unitId`, `gradeId`, or `documentId` when available
2. **Track the model**: Store which AI model was used
3. **Store prompts**: Help debug issues by storing the original prompt
4. **Use metadata**: Add extra context in the `metadata` field
5. **Handle callbacks**: Use `onFeedbackSubmitted` for UI updates or analytics

## Storybook

View examples in Storybook:
```bash
npm run storybook
# Navigate to Components → AIFeedbackWidget
```
