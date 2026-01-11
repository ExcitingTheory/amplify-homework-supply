# Context API

This directory contains the implementation and documentation for the Contexts used in our application. The Context API allows for efficient state management and data sharing across different components without the need for prop drilling.

```js
// get identityId
const userAttributes = await fetchUserAttributes();
      const {
        identityId,
      } = await fetchAuthSession();

// get owner 
      const { sub: username } = await fetchUserAttributes();

```

## Available Contexts

1. *AuthContext*: Manages user authentication state and provides user information throughout the app.
2. *DictionaryContext*: Handles dictionary data and operations, allowing components to access and manipulate dictionary entries.
3. *FileContext*: Manages file-related data and operations, enabling components to read and write files seamlessly.
4. *GutterContext*: Provides state management for gutter-related features in the application.
5. *SectionContext*: Manages sections of content, allowing for dynamic updates and organization.
6. *SettingsContext*: Handles application settings, enabling components to read and update user preferences.
7. *UnitContext*: Manages unit-related data and operations, facilitating unit conversions and calculations.
8. *VectorStoreContext*: Provides access to vector store functionalities, allowing components to perform vector operations.
