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

## Usage in Stories

No special imports needed! Just write your stories normally:

```jsx
import FileManager from './FileManager';

export const Default = {
  render: () => <FileManager />
};
```

The mocks are automatically active for all stories.
