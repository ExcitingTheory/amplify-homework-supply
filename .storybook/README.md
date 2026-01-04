# Storybook Configuration

This directory contains the Storybook configuration for the Homework Supply component documentation.

## Files

### `main.js`
Main Storybook configuration including:
- Story file locations (`**/*.mdx`, `**/*.stories.@(js|jsx|ts|tsx)`)
- Addons (docs, links, controls, actions)
- Webpack configuration for:
  - AWS Amplify mocks (DataStore, Auth, Storage, API, Utils)
  - AI React SDK mocks
  - Module federation for React singleton
  - TypeScript support
  - SWC compiler

### `preview.jsx`
Global decorators, parameters, and rendering configuration:
- Material UI ThemeProvider wrapper
- Context providers (Unit, Files, Dictionary, Section, AudioPlayer)
- Mock fetch for `/api/chat` endpoint
- Viewport configurations (mobile, tablet, desktop)
- Background color options
- Default layout settings

### `manager.js`
Storybook UI customization:
- Brand theme colors
- Typography
- Sidebar configuration
- Toolbar options

### `storybook.css`
Custom CSS for Storybook UI:
- Scrolling fixes for fullscreen stories
- Docs page styling
- Code block formatting
- Story preview styling

## Mock Strategy

All AWS services are mocked via webpack aliases in `main.js`:

```javascript
'aws-amplify/datastore': './__mocks__/aws-amplify-datastore.js'
'aws-amplify/auth': './__mocks__/aws-amplify-auth.js'
'aws-amplify/storage': './__mocks__/aws-amplify-storage.js'
'aws-amplify/api': './__mocks__/aws-amplify-api.js'
'aws-amplify/utils': './__mocks__/aws-amplify-utils.js'
'ai/react': './__mocks__/ai-react.js'
```

Mock implementations are in `.storybook/__mocks__/` directory.

## Directory Structure

```
.storybook/
├── main.js              # Main configuration
├── preview.jsx          # Global decorators and parameters
├── manager.js           # UI theme customization
├── storybook.css        # Custom styles
├── preview-head.html    # Custom <head> content
├── components/          # Shared Storybook components
│   └── DemoBanner.jsx   # Demo mode banner component
└── __mocks__/           # Mock implementations
    ├── aws-amplify-auth.js
    ├── aws-amplify-datastore.js
    ├── aws-amplify-storage.js
    ├── aws-amplify-api.js
    ├── aws-amplify-utils.js
    ├── ai-react.js
    ├── chat-api.js
    ├── media.js         # Mock media data (base64 audio/images)
    └── seedData.js      # Helper functions for seeding mock data
```

## Learn More

- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Writing Stories](https://storybook.js.org/docs/react/writing-stories/introduction)
- [Storybook for Next.js](https://storybook.js.org/docs/react/get-started/nextjs)
