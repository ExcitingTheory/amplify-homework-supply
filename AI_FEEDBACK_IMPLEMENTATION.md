# AI Feedback System - Implementation Summary

## What Was Added

A comprehensive user feedback system for all AI-generated content with thumbs up/down ratings and predefined reasons for negative feedback.

## Files Created

1. **`src/components/AIFeedbackWidget.tsx`** - Reusable feedback component
2. **`src/components/AIFeedbackWidget.stories.jsx`** - Storybook stories
3. **`src/utils/aiFeedbackUtils.ts`** - Helper functions for feedback management
4. **`docs/AI_FEEDBACK_QUICK_REFERENCE.md`** - Quick reference guide

## Files Modified

1. **`amplify/backend/api/japanese5/schema.graphql`** - Added AIFeedback model with enums
2. **`src/components/ChatSidebar.js`** - Added feedback widget to AI messages
3. **`src/components/Editor3/plugins/AIContentCompletionPlugin.js`** - Auto-track dismissals
4. **`docs/SETTINGS.md`** - Comprehensive documentation

## Next Steps

### 1. Push Amplify Schema Changes

The schema now includes the `AIFeedback` model. You need to push these changes:

```bash
cd amplify/backend
amplify push -y
```

This will:
- Create the `AIFeedback` table in DynamoDB
- Generate TypeScript models in `src/models/`
- Add the new enums: `AIFeedbackType`, `AIFeedbackReason`, `AIContentType`

### 2. Update SCHEMA_VERSION

After `amplify push` completes, increment the `SCHEMA_VERSION` in `pages/_app.js` to clear DataStore cache:

```javascript
// pages/_app.js
const SCHEMA_VERSION = 15; // Increment from current value
```

### 3. Test the Implementation

**In Storybook:**
```bash
npm run storybook
# Navigate to Components → AIFeedbackWidget
```

**In the App:**
1. Start the dev server: `npm run dev`
2. Open the ChatSidebar and send a message to the AI
3. Look for thumbs up/down buttons on AI responses
4. Test the feedback flow:
   - Click thumbs up → should show filled icon
   - Click thumbs down → should show reason selection popover
   - Select reasons and submit → should show success message

**In the Editor:**
1. Navigate to a unit editor
2. Type substantial content (>50 chars ending in punctuation)
3. Wait for AI completion suggestion
4. Press ESC to dismiss → negative feedback auto-submitted

### 4. Optional: Add Feedback to Other AI Features

The widget can be added to other AI-generated content:

**Audio Generation:**
```jsx
<AIFeedbackWidget
  contentType="AUDIO_GENERATION"
  generatedContent={audioText}
  model="tts-1"
  unitId={unit.id}
/>
```

**Image Generation:**
```jsx
<AIFeedbackWidget
  contentType="IMAGE_GENERATION"
  generatedContent={imagePrompt}
  model="dall-e-3"
  unitId={unit.id}
/>
```

**Document Analysis:**
```jsx
<AIFeedbackWidget
  contentType="DOCUMENT_ANALYSIS"
  generatedContent={analysisResults}
  model="gpt-4"
  documentId={doc.id}
  unitId={unit.id}
/>
```

### 5. Query Feedback (For Analytics)

You can query feedback for analytics:

```typescript
import { getFeedbackStats } from '../utils/aiFeedbackUtils';

// Get stats for chat messages in a specific unit
const stats = await getFeedbackStats('CHAT_MESSAGE', unitId);
console.log(`Positive rate: ${stats.positiveRate.toFixed(1)}%`);
console.log('Most common issues:', stats.commonReasons);
```

## Features

### For Users

- ✅ Thumbs up/down on all AI-generated content
- ✅ Predefined reasons for negative feedback
- ✅ Optional free-text comments
- ✅ Simple, unobtrusive UI
- ✅ Real-time feedback submission

### For Developers

- ✅ Reusable `AIFeedbackWidget` component
- ✅ Utility functions for programmatic feedback
- ✅ Auto-tracking for content completion
- ✅ Comprehensive TypeScript types
- ✅ DataStore integration with auth
- ✅ Metadata support for context

### Data Collected

Each feedback entry includes:
- Content type (chat, completion, generation, etc.)
- Positive or negative sentiment
- Reasons (for negative feedback)
- The AI model used
- The prompt and generated content
- Related entities (unit, grade, document)
- User identification (owner, identityId)
- Timestamps

## Architecture

**DataStore Model:**
```
AIFeedback
├── contentType (enum) - What kind of AI content
├── feedbackType (enum) - POSITIVE | NEGATIVE
├── reasons (array) - Why it was bad
├── comment (string) - Additional details
├── model (string) - AI model used
├── generatedContent (string) - The content
└── context (unitID, gradeID, documentID, etc.)
```

**Component Usage:**
```
User Interface
└── AIFeedbackWidget (thumbs up/down)
    └── Popover (reason selection)
        └── aiFeedbackUtils.createAIFeedback()
            └── DataStore.save(new AIFeedback(...))
```

## Troubleshooting

**If feedback doesn't save:**
1. Check that `amplify push` completed successfully
2. Verify models are generated in `src/models/`
3. Check browser console for auth errors
4. Ensure user is authenticated (session exists)

**If widget doesn't appear:**
1. Check import paths
2. Verify component is rendered conditionally (only for assistant messages)
3. Check browser console for TypeScript errors

**If Storybook fails:**
1. Ensure DataStore mocks exist in `.storybook/__mocks__/`
2. Check that stories import correctly
3. Run `npm run storybook` from project root

## Future Enhancements

- [ ] Admin dashboard for aggregated analytics
- [ ] Automatic alerts for high negative feedback rates
- [ ] A/B testing different AI models
- [ ] Fine-tuning prompts based on feedback
- [ ] User-specific AI preferences based on feedback history
- [ ] Export feedback data for external analysis
- [ ] Integration with monitoring/observability tools
