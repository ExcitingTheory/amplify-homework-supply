# Storybook Mocks

This directory contains mock implementations of AWS Amplify modules and utilities for Storybook.

## How It Works

Webpack aliases in `.storybook/main.js` redirect all imports to these mock files:

```javascript
'aws-amplify/api' → '__mocks__/aws-amplify-api.js'
'aws-amplify/auth' → '__mocks__/aws-amplify-auth.js'
'aws-amplify/storage' → '__mocks__/aws-amplify-storage.js'
'aws-amplify/datastore' → '__mocks__/aws-amplify-datastore.js'
'aws-amplify/utils' → '__mocks__/aws-amplify-utils.js'
'../src/utils/getCachedUrl' → '__mocks__/getCachedUrl.js'
```

## Mock Files

### `aws-amplify-api.js`
Mocks the GraphQL client with support for:
- ✨ **AI Generation**: `generateImageFile` and `generateAudioFile` mutations
- 💬 **Chat**: OpenAI chat completions
- 🤖 **Assistant**: Thread and run management
- ⏱️ Simulates realistic network delays (~1.5s)

### `aws-amplify-auth.js`
Mocks authentication functions:
- `fetchAuthSession()` - Returns mock identity and tokens
- `getCurrentUser()` - Returns mock user data
- `fetchUserAttributes()` - Returns mock user attributes

### `aws-amplify-storage.js`
Mocks S3 storage operations:
- `uploadData()` - Simulates file uploads with progress
- `remove()` - Simulates file deletion
- `getUrl()` - Returns placeholder URLs

### `aws-amplify-datastore.js`
Mocks DataStore operations with in-memory storage:
- `DataStore.save()` - Saves to memory
- `DataStore.query()` - Queries from memory
- `DataStore.delete()` - Removes from memory
- `DataStore.observe()` - Observable subscriptions

### `getCachedUrl.js`
Mocks the utility for fetching presigned S3 URLs:
- Returns data URLs for generated content
- Returns SVG placeholders for images
- Returns mock audio data for audio files

## Usage in Stories

No special imports needed! Just write your stories normally:

```jsx
import FileManager from './FileManager';

export const Default = {
  render: () => <FileManager />
};
```

The mocks are automatically active for all stories.

## Testing AI Generation

The AI generation mocks simulate:

1. **Text-to-Image** (DALL-E):
   - 1.5s delay
   - Returns path: `protected/images/generated-{timestamp}.png`
   - getCachedUrl returns a placeholder image data URL

2. **Text-to-Speech** (OpenAI TTS):
   - 1.5s delay  
   - Returns path: `protected/audio/generated-{timestamp}.mp3`
   - getCachedUrl returns a silent audio data URL
   - Includes mock waveform data

## Debugging

All mocks include console.log statements. Check the browser console to see:
- `[Mock API]` - GraphQL calls
- `[Mock Auth]` - Authentication calls
- `[Mock Storage]` - S3 operations
- `[Mock getCachedUrl]` - URL generation

## Adding New Mocks

1. Create a new mock file in this directory
2. Add webpack alias in `.storybook/main.js`
3. Export the mocked functions/objects
4. Update this README

## Why Not Jest Mocks?

Storybook doesn't use Jest, so `jest.mock()` doesn't work. Instead, we use:
- Webpack module aliasing for global mocks
- Works consistently across all stories
- No need to repeat mock setup in each story file
- Better performance (mocks resolved at build time)
