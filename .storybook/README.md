# Storybook Documentation

This project uses [Storybook](https://storybook.js.org/) for developing and testing UI components in isolation.

## Getting Started

### Running Storybook

To start the Storybook development server:

```bash
npm run storybook
```

This will start Storybook on [http://localhost:6006](http://localhost:6006).

### Building Storybook

To build a static version of Storybook for deployment:

```bash
npm run build-storybook
```

The built files will be in the `storybook-static` directory.

## Available Stories

### Editor Components

- **Editor**: The main Lexical-based editor component
  - Empty Editor
  - Editor with Sample Content
  
- **Workbook**: Read-only view of educational content
  - Empty Workbook
  - Workbook with Content
  - Workbook with Progress Tracking

### Individual Components

- **DisplayOrEdit Components**: Editable/display-only field components
  - Answer
  - Prompt
  - Hint
  - Definition
  - Phrase and Pronunciation

- **Editor Components**: Interactive editor elements
  - Quiz Component (Standard and Multiple Choice)
  - Answer Input Component
  - Image Component
  - Media Player Component (Audio/Video)

- **Meaning Association Exercises**: Drag-and-drop learning activities
  - Easy Exercise
  - Hard Exercise
  - Learn Exercise

- **Video Player**: Standalone video playback component

## Creating New Stories

To create a story for a new component:

1. Create a file named `ComponentName.stories.js` next to your component
2. Use this template:

```javascript
import React from 'react';
import YourComponent from './YourComponent';

export default {
  title: 'Category/ComponentName',
  component: YourComponent,
  parameters: {
    layout: 'padded', // or 'centered', 'fullscreen'
  },
};

export const Default = {
  args: {
    // Component props
  },
};

export const AnotherVariant = {
  render: () => (
    <YourComponent prop1="value1" prop2="value2" />
  ),
};
```

## Context Providers with Mocked DataStore

For components that depend on context providers (like UnitContext), use the real providers with mocked DataStore:

```javascript
import { UnitProvider } from '../src/context/unitContext';
import { seedMockUnit } from './__mocks__/aws-amplify-datastore';

export const YourStory = {
  render: () => {
    const unitId = 'your-story-unit-id';
    
    // Seed the mock DataStore with your test data
    seedMockUnit({
      id: unitId,
      name: 'Your Story Unit',
      description: 'Test data for your story',
      data: yourEditorState, // optional Lexical editor state
      _version: 1,
      owner: 'mock-user-sub', // must match mocked auth user
    });
    
    return (
      <UnitProvider id={unitId}>
        <YourComponent />
      </UnitProvider>
    );
  },
};
```

The webpack configuration aliases AWS Amplify imports to modular mock files in the `__mocks__/` directory, which provide mock implementations of DataStore, Auth, Storage, API, and Utils. This allows stories to test real provider logic while maintaining Storybook isolation.

## Storybook Addons

This project includes the following Storybook addons:

- **Essentials**: Controls, Actions, Viewport, Backgrounds, Toolbars, Measure, Outline
- **Interactions**: Test component interactions
- **Links**: Navigate between stories

## Tips

- Use the **Controls** panel to dynamically change component props
- Use the **Actions** panel to see event handlers fire
- Use the **Viewport** addon to test responsive designs
- Press `/` to search for stories
- Press `A` to toggle the addons panel
- Press `D` to toggle dark mode (if configured)

## Folder Structure

```
.storybook/
  ├── main.js       # Storybook configuration
  └── preview.js    # Global decorators and parameters

src/
  ├── components/
  │   ├── *.stories.js       # Component stories
  │   └── Editor3/
  │       ├── *.stories.js   # Editor stories
  │       └── mocks/         # Mock providers for testing
```

## Troubleshooting

### Components not rendering correctly

If components require AWS Amplify or other backend services, make sure to:
1. Use mock providers (see `MockUnitProvider.js`)
2. Mock any data fetching or API calls
3. Provide default props for all required data

### Styles not loading

Storybook automatically loads:
- MUI theme (configured in `.storybook/preview.js`)
- Editor CSS (`src/components/Editor3/theme.css`)
- Global styles from your Next.js app

If styles are missing, check the decorators in `.storybook/preview.js`.

## Learn More

- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Writing Stories](https://storybook.js.org/docs/react/writing-stories/introduction)
- [Storybook for Next.js](https://storybook.js.org/docs/react/get-started/nextjs)
