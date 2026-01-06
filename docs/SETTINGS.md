# Settings

## AI Content Feedback System

The application now includes a comprehensive feedback system for all AI-generated content. This allows users to provide thumbs up/down ratings and specify reasons for negative feedback, helping improve AI quality over time.

### Overview

Every AI-generated piece of content can be rated by users:
- **Thumbs up** - Content was helpful and accurate
- **Thumbs down** - Content needs improvement (with optional reasons)

### Feedback Reasons

When users give negative feedback, they can select from predefined reasons:
- **Incorrect** - Factually wrong information
- **Incomplete** - Missing important details
- **Inappropriate** - Offensive or inappropriate content
- **Not Helpful** - Doesn't answer the question
- **Irrelevant** - Off-topic or irrelevant
- **Poor Quality** - Grammar, formatting, or presentation issues
- **Other** - Custom reason (with free-text comment)

### Where Feedback Appears

Feedback is available for:
1. **Chat Messages** - Each AI assistant response in the chat sidebar
2. **Content Completion** - Editor auto-completion suggestions (auto-tracked)
3. **Audio Generation** - Generated audio files
4. **Image Generation** - Generated images
5. **Document Analysis** - PDF analysis and vocabulary extraction
6. **Grading Feedback** - AI-generated feedback on student work
7. **Block Suggestions** - AI-suggested content blocks

### Data Model

Feedback is stored in the `AIFeedback` model with these fields:

```graphql
type AIFeedback {
  id: ID!
  owner: String
  contentType: AIContentType!      # Type of AI content
  feedbackType: AIFeedbackType!    # POSITIVE or NEGATIVE
  reasons: [AIFeedbackReason]      # Why content was bad
  comment: String                   # Optional free-form comment
  model: String                     # AI model used (e.g., "gpt-4")
  prompt: String                    # The prompt used
  generatedContent: String          # The actual content
  unitID: ID
  gradeID: ID
  documentID: ID
  messageId: String                 # For chat messages
  sessionId: String                 # Group related feedback
  metadata: AWSJSON                 # Additional context
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

### Using the Feedback Widget

#### Basic Usage

```jsx
import AIFeedbackWidget from '../components/AIFeedbackWidget';

<AIFeedbackWidget
  contentType="CHAT_MESSAGE"
  generatedContent={message.content}
  model="gpt-4"
  messageId={message.id}
  unitId={currentUnit.id}
/>
```

#### With Callback

```jsx
<AIFeedbackWidget
  contentType="CONTENT_COMPLETION"
  generatedContent={suggestion}
  model="gpt-4"
  onFeedbackSubmitted={(feedback) => {
    console.log('User feedback:', feedback);
    // Track analytics, show thank you message, etc.
  }}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `contentType` | `AIContentType` | Yes | Type of AI content |
| `generatedContent` | `string` | Yes | The AI-generated text |
| `model` | `string` | No | AI model used |
| `prompt` | `string` | No | Prompt that generated content |
| `messageId` | `string` | No | For chat messages |
| `unitId` | `string` | No | Related unit |
| `gradeId` | `string` | No | Related grade |
| `documentId` | `string` | No | Related document |
| `sessionId` | `string` | No | Session grouping |
| `metadata` | `object` | No | Additional context |
| `onFeedbackSubmitted` | `function` | No | Callback on submit |
| `size` | `'small' \| 'medium' \| 'large'` | No | Button size |
| `showLabels` | `boolean` | No | Show text labels |

### Utility Functions

```typescript
import {
  createAIFeedback,
  getFeedbackByContentType,
  getFeedbackByUnit,
  getFeedbackStats,
  submitPositiveFeedback,
  submitNegativeFeedback,
} from '../utils/aiFeedbackUtils';

// Submit positive feedback quickly
await submitPositiveFeedback('CHAT_MESSAGE', content, {
  model: 'gpt-4',
  unitId: unit.id,
});

// Submit negative feedback with reasons
await submitNegativeFeedback(
  'CONTENT_COMPLETION',
  content,
  ['INCORRECT', 'INCOMPLETE'],
  'The grammar explanation was confusing',
  { model: 'gpt-4', unitId: unit.id }
);

// Get statistics
const stats = await getFeedbackStats('CHAT_MESSAGE');
console.log(`Positive rate: ${stats.positiveRate}%`);
console.log('Common issues:', stats.commonReasons);
```

### Implementation Examples

#### Chat Sidebar

The chat sidebar automatically shows feedback buttons for each AI assistant message:

```jsx
// In ChatSidebar.js
{message.role === 'assistant' && (
  <Box className="chat-feedback">
    <AIFeedbackWidget
      contentType="CHAT_MESSAGE"
      messageId={message.id}
      generatedContent={message.content}
      model="gpt-4"
      unitId={unit?.id}
    />
  </Box>
)}
```

#### Content Completion Plugin

The AI content completion plugin automatically tracks when users:
- **Accept** a suggestion (Tab/Arrow key) - Positive signal
- **Dismiss** a suggestion (ESC key) - Negative feedback sent
- **Continue typing** - Neutral (no feedback)

```javascript
// In AIContentCompletionPlugin.js
const dismissSuggestion = async (sendNegativeFeedback = false) => {
  if (sendNegativeFeedback && suggestion) {
    await DataStore.save(new AIFeedback({
      contentType: AIContentType.CONTENT_COMPLETION,
      feedbackType: AIFeedbackType.NEGATIVE,
      generatedContent: suggestion,
      // ... other fields
    }));
  }
  setSuggestion(null);
};
```

### Viewing Feedback Analytics

To view feedback data for analysis:

```typescript
// Get all feedback for a specific unit
const unitFeedback = await getFeedbackByUnit(unitId);

// Calculate statistics
const stats = await getFeedbackStats('CHAT_MESSAGE', unitId);
console.log(`Total feedback: ${stats.total}`);
console.log(`Positive: ${stats.positive} (${stats.positiveRate.toFixed(1)}%)`);
console.log(`Negative: ${stats.negative} (${stats.negativeRate.toFixed(1)}%)`);

// Most common issues
stats.commonReasons.forEach(({ reason, count }) => {
  console.log(`${reason}: ${count} reports`);
});
```

### Privacy & Security

- All feedback is tied to the authenticated user (`owner` field)
- Only the user who created feedback can view it (enforced by `@auth` rules)
- Admins can view all feedback for quality monitoring
- Feedback data is stored in DynamoDB via Amplify DataStore
- No personally identifiable information is required in comments

### Future Enhancements

Potential improvements:
- Admin dashboard for aggregated feedback analytics
- Automatic quality alerts when negative feedback exceeds thresholds
- A/B testing different AI models based on feedback
- Fine-tuning prompts based on common negative feedback reasons
- User-specific AI model preferences based on their feedback history

---

## Other Settings

Add comprehensive flags so users can disable any of the plugins that have AI Generated Content features.

Or allow users to collaborate with each other without administrative consent. For example, a teacher may want to share a curriculum with another teacher for feedback or co-development. Students can talk about their homework with each other in study groups. This could be done through shared workspaces or direct sharing of files and resources. Instructors could monitor these collaborations to ensure they are productive and appropriate with the help of ai moderation tools.