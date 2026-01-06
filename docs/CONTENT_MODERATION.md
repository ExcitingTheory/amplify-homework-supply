# Content Moderation System

**Status**: ✅ Implemented  
**Last Updated**: January 4, 2026

## Overview

The Homework Supply platform includes an **automated content moderation system** that screens all user-generated content using OpenAI's Moderation API. This system is designed to **flag potentially problematic content** without blocking it, allowing instructors to review and handle flagged content according to their institution's specific policies and local jurisdiction requirements.

### Key Principles

1. **Non-blocking**: Content is **always saved**, even if flagged
2. **Transparency**: Instructors can see what was flagged and why
3. **Policy-agnostic**: The system flags content but doesn't enforce specific policies
4. **Jurisdiction-aware**: Instructors handle content per local laws and school policies

## What Gets Moderated

All text content in the following models is automatically checked:

- **Units** - Instructor-created lesson content (via `saveEditorContent`)
- **Grades** - Student submission responses (via grade saves)
- **Questions** - Practice questions (prompt and answer fields)
- **Words** - Vocabulary definitions and phrases
- **Documents** - Future: PDF content analysis

### Content Categories Checked

OpenAI's moderation API checks for these categories:

| Category | Description |
|----------|-------------|
| `hate` | Content promoting hate based on identity |
| `hate/threatening` | Hateful content including violence/harm threats |
| `harassment` | Content intended to harass or bully |
| `harassment/threatening` | Harassment with violence/harm threats |
| `self-harm` | Content promoting self-harm acts |
| `self-harm/intent` | Expression of intent to self-harm |
| `self-harm/instructions` | Instructions for self-harm |
| `sexual` | Sexually explicit content |
| `sexual/minors` | Sexual content involving minors |
| `violence` | Content depicting violence or injury |
| `violence/graphic` | Graphic violent content |

## Architecture

### Backend - Lambda Function

**Location**: [amplify/backend/function/moderation/src/index.js](../amplify/backend/function/moderation/src/index.js)

The `moderation` Lambda function:
1. Receives text content via GraphQL mutation
2. Calls OpenAI's Moderation API (`text-moderation-latest` model)
3. Returns structured result with flagged categories and confidence scores
4. **Never throws errors** - returns non-flagged result on failure

```javascript
// Example response
{
  flagged: true,
  categories: {
    hate: false,
    violence: true,
    sexual: false,
    // ... other categories
  },
  categoryScores: {
    violence: 0.87,  // 87% confidence
    // ... other scores
  },
  model: 'text-moderation-latest'
}
```

### GraphQL Schema

**Location**: [amplify/backend/api/japanese5/schema.graphql](../amplify/backend/api/japanese5/schema.graphql)

#### Mutation

```graphql
moderateContent(content: String!): ModerationResult
```

#### Type Definition

```graphql
type ModerationResult {
  flagged: Boolean!
  categories: AWSJSON!
  categoryScores: AWSJSON!
  model: String!
  error: String
}
```

#### Model Fields

All moderated models include:

```graphql
moderationStatus: String       # "pending", "approved", "flagged", or null
moderationFlags: AWSJSON       # Detailed flag data (categories, scores, model)
moderationCheckedAt: AWSDateTime  # Timestamp of last check
```

### Frontend - Utilities

**Location**: [src/utils/moderateContent.js](../src/utils/moderateContent.js)

Key functions:

```javascript
// Check content and return moderation result
await moderateContent(textOrObject)

// Build DataStore fields from moderation result
buildModerationFields(moderationResult)

// Get human-readable status
getModerationStatus(item)

// Check if warning should display
shouldShowModerationWarning(item)
```

### Frontend - UI Components

#### ModerationBadge

**Location**: [src/components/ModerationBadge.js](../src/components/ModerationBadge.js)

Compact badge indicator:
- Shows warning chip for flagged content
- Tooltip reveals flagged categories
- Optional detailed view with `showDetails` prop
- Icon-only variant: `ModerationStatusIcon`

```jsx
import ModerationBadge, { ModerationStatusIcon } from '@/components/ModerationBadge';

<ModerationBadge item={unit} showDetails={true} />
<ModerationStatusIcon item={grade} />
```

#### ModerationPanel

**Location**: [src/components/ModerationPanel.js](../src/components/ModerationPanel.js)

Full moderation details panel:
- Expandable category details with confidence scores
- Category descriptions
- Policy guidance
- Timestamp and model information

```jsx
import ModerationPanel from '@/components/ModerationPanel';

<ModerationPanel item={grade} title="Student Submission Flagged" />
```

## Integration Points

### UnitContext - Editor Saves

**Location**: [src/context/unitContext.js](../src/context/unitContext.js)

When instructors save lesson content via `saveEditorContent()`:

```javascript
const moderationResult = await moderateContent(newContent);
const moderationFields = buildModerationFields(moderationResult);

await DataStore.save(Unit.copyOf(currentUnit, updated => {
  updated.data = newContent;
  updated.moderationStatus = moderationFields.moderationStatus;
  updated.moderationFlags = moderationFields.moderationFlags;
  updated.moderationCheckedAt = moderationFields.moderationCheckedAt;
}));
```

### UnitContext - Grade Saves

When students submit work via grade updates:

```javascript
const moderationResult = await moderateContent(data);
const moderationFields = buildModerationFields(moderationResult);

await DataStore.save(Grade.copyOf(grade, updated => {
  updated.data = data;
  updated.accuracy = unitAccuracy;
  // Add moderation fields
  updated.moderationStatus = moderationFields.moderationStatus;
  updated.moderationFlags = moderationFields.moderationFlags;
  updated.moderationCheckedAt = moderationFields.moderationCheckedAt;
}));
```

## Usage Examples

### Display Moderation Status in Grade List

```jsx
import ModerationBadge from '@/components/ModerationBadge';

{grades.map(grade => (
  <Box key={grade.id}>
    <Typography>{grade.owner}</Typography>
    <ModerationBadge item={grade} />
  </Box>
))}
```

### Show Detailed Panel for Flagged Content

```jsx
import ModerationPanel from '@/components/ModerationPanel';
import { shouldShowModerationWarning } from '@/utils/moderateContent';

{shouldShowModerationWarning(grade) && (
  <ModerationPanel item={grade} title="Student Submission Requires Review" />
)}
```

### Manual Moderation Check

```javascript
import { moderateContent, buildModerationFields } from '@/utils/moderateContent';

const text = "User-entered content to check";
const result = await moderateContent(text);

if (result.flagged) {
  console.warn('Content flagged:', result.categories);
  // Show warning, but don't block save
}
```

## Deployment

### Prerequisites

1. **OpenAI API Key** must be stored in AWS SSM Parameter Store
   - Same key used by existing `openai` Lambda function
   - Environment variable: `OPENAI_API_KEY`

2. **Schema Version** must be incremented after deploying schema changes
   - Edit [pages/_app.js](../pages/_app.js)
   - Update `SCHEMA_VERSION` constant (e.g., `'1.0.2'`)

### Deployment Steps

```bash
# 1. Install Lambda dependencies
cd amplify/backend/function/moderation/src
npm install

# 2. Push backend changes
cd ../../../../../
amplify push

# 3. Update schema version in pages/_app.js
# Change: const SCHEMA_VERSION = '1.0.2';

# 4. Deploy frontend
npm run build
# Deploy via your hosting platform
```

## Monitoring & Maintenance

### CloudWatch Logs

Lambda logs available at:
- Log group: `/aws/lambda/moderation-{env}`
- Search for: `"Moderation result"`, `"Moderation error"`

### Console Warnings

Frontend logs warnings when content is flagged:
```
[UnitContext] Content flagged by moderation, saving anyway for instructor review
[UnitContext] Student submission flagged by moderation, saving for instructor review
```

### Error Handling

Moderation failures **never block saves**:
- API errors return `flagged: false` with `error` field populated
- Network failures are logged but content saves proceed
- Malformed content returns empty categories

## Instructor Workflow

1. **Content Creation**: Create units, questions, vocabulary
   - Content automatically moderated on save
   - No blocking - all content saves successfully

2. **Review Flagged Content**: Check for moderation badges
   - Flagged items show warning icon/chip
   - Click for details on categories and scores

3. **Take Action**: Handle per institution policy
   - Edit content if inappropriate
   - Document review decision
   - Contact administration if needed
   - Follow local jurisdiction requirements

4. **Student Submissions**: Monitor Grade moderation
   - Review flagged student work
   - Provide appropriate feedback
   - Follow school's code of conduct

## Privacy & Compliance

- Content is sent to OpenAI's Moderation API endpoint
- OpenAI states moderation endpoint data is **not used for training**
- Check OpenAI's current moderation API terms: https://platform.openai.com/docs/guides/moderation
- Consult your institution's legal team for compliance requirements
- Consider FERPA, COPPA, GDPR implications for your jurisdiction

## Future Enhancements

- [ ] Batch moderation for bulk imports
- [ ] Moderation queue UI for instructors
- [ ] Historical moderation reports
- [ ] Custom policy rules per institution
- [ ] Audio/image content moderation
- [ ] Admin-level moderation dashboard
- [ ] Automated notifications for flagged content
- [ ] Moderation statistics and trends

## Testing

### Unit Tests

```javascript
// Test moderation utility
import { moderateContent } from '@/utils/moderateContent';

const result = await moderateContent("Test content");
expect(result).toHaveProperty('flagged');
expect(result).toHaveProperty('categories');
```

### Manual Testing

1. Create test content with policy-violating text
2. Verify moderation runs automatically
3. Check console for warnings
4. Verify UI components display correctly
5. Confirm content saves despite flags

## Troubleshooting

### Content Not Being Moderated

- Check CloudWatch logs for Lambda errors
- Verify OPENAI_API_KEY in SSM Parameter Store
- Check DataStore schema sync status
- Ensure `moderationStatus` field exists on models

### Moderation Always Returns Approved

- Verify OpenAI API key is valid
- Check Lambda execution logs for errors
- Test mutation directly in AppSync console
- Verify content extraction logic handles your data structure

### UI Components Not Showing

- Check that `moderationCheckedAt` field exists
- Verify item has `moderationStatus` and `moderationFlags`
- Ensure schema version was updated after deploy
- Clear browser DataStore cache

## Related Documentation

- [API.md](API.md) - GraphQL schema reference
- [ONBOARDING.md](ONBOARDING.md) - Development setup
- [TYPESCRIPT_MIGRATION.md](TYPESCRIPT_MIGRATION.md) - TS patterns for new components
- [OpenAI Moderation API](https://platform.openai.com/docs/guides/moderation)

## Support

For questions or issues with the moderation system:
1. Check this documentation
2. Review CloudWatch logs
3. Test moderation mutation in AppSync console
4. Check browser console for frontend errors
5. Create an issue with reproduction steps
