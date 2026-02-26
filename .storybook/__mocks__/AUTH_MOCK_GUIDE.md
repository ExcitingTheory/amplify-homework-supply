# AuthContext Mock Guide

The AuthContext mock provides authentication state for Storybook stories, preventing crashes in components that depend on authentication.

## Overview

The mock AuthContext is automatically provided to all stories through the Storybook decorator chain. It provides the same interface as the real AuthContext:

```typescript
{
  user: {
    attributes: {
      sub: string;
      email: string;
      name?: string;
    }
  };
  session: {
    identityId: string;
    idToken: { toString: () => string };
  };
  isLoading: boolean;
  error?: Error;
}
```

## Default Mock Data

By default, all stories receive a mock student user:

```javascript
user: {
  attributes: {
    sub: 'student-alice-sub',
    email: 'alice@example.com',
    name: 'Alice Student',
  }
}
session: {
  identityId: 'us-east-1:mock-identity-123',
  idToken: { toString: () => 'mock-id-token' }
}
isLoading: false
error: undefined
```

## Customizing Auth State

### Set Custom User

```jsx
export const InstructorView = {
  parameters: {
    mockAuth: {
      user: {
        attributes: {
          sub: 'instructor-bob-sub',
          email: 'bob@example.com',
          name: 'Bob Instructor',
        },
      },
    },
  },
  render: () => <MyComponent />,
};
```

### Simulate Loading State

```jsx
export const LoadingAuth = {
  parameters: {
    mockAuth: {
      isLoading: true,
    },
  },
  render: () => <MyComponent />,
};
```

### Simulate Error State

```jsx
export const AuthError = {
  parameters: {
    mockAuth: {
      error: new Error('Failed to authenticate'),
      isLoading: false,
    },
  },
  render: () => <MyComponent />,
};
```

### Unauthenticated State

```jsx
export const NotLoggedIn = {
  parameters: {
    mockAuth: {
      user: undefined,
      session: undefined,
      isLoading: false,
    },
  },
  render: () => <MyComponent />,
};
```

## Using with Other Contexts

The AuthContext is provided at the outermost level of the decorator chain, before other contexts like UnitContext, SectionContext, etc. This matches the production app structure where authentication is established before other context providers initialize.

```jsx
<AuthProvider>
  <AudioPlayerProvider>
    <FilesProvider>
      <DictionaryProvider>
        <UnitProvider>
          <SectionProvider>
            <YourComponent />
          </SectionProvider>
        </UnitProvider>
      </DictionaryProvider>
    </FilesProvider>
  </AudioPlayerProvider>
</AuthProvider>
```

## Implementation Details

### Webpack Alias

The mock is activated via Vite alias in `.storybook/main.ts`:

```typescript
config.resolve.alias = {
  '@/context/authContext': path.resolve(__dirname, './__mocks__/authContext.js'),
  '../context/authContext': path.resolve(__dirname, './__mocks__/authContext.js'),
  '../../context/authContext': path.resolve(__dirname, './__mocks__/authContext.js'),
};
```

This redirects all imports of `authContext` to the mock implementation.

### Mock Implementation

The mock (`__mocks__/authContext.js`) provides:
- `AuthProvider` component that accepts `mockUser`, `mockSession`, `isLoading`, and `error` props
- Default values for all props
- Console logging to help debug auth state
- Same context interface as the real AuthContext

### Integration with aws-amplify/auth Mock

The AuthContext mock works alongside the `aws-amplify/auth` mock. While the aws-amplify mock provides the low-level auth functions (`fetchUserAttributes`, `fetchAuthSession`), the AuthContext mock provides the React context that components consume.

## Common Patterns

### Admin User

```jsx
export const AdminView = {
  parameters: {
    mockAuth: {
      user: {
        attributes: {
          sub: 'admin-user-sub',
          email: 'admin@example.com',
          name: 'Admin User',
          'cognito:groups': ['Admins'],
        },
      },
    },
  },
};
```

### Moderator User

```jsx
export const ModeratorView = {
  parameters: {
    mockAuth: {
      user: {
        attributes: {
          sub: 'moderator-user-sub',
          email: 'moderator@example.com',
          name: 'Moderator User',
          'cognito:groups': ['Moderators'],
        },
      },
    },
  },
};
```

### Multiple User Scenarios

Test components with different user types:

```jsx
export const StudentScenarios = {
  render: () => <MyComponent />,
};

export const InstructorScenarios = {
  parameters: {
    mockAuth: {
      user: {
        attributes: {
          sub: 'instructor-sub',
          email: 'instructor@example.com',
          'cognito:groups': ['Instructors'],
        },
      },
    },
  },
  render: () => <MyComponent />,
};

export const UnauthenticatedScenarios = {
  parameters: {
    mockAuth: {
      user: undefined,
      session: undefined,
    },
  },
  render: () => <MyComponent />,
};
```

## Troubleshooting

### Component shows "not authenticated" in Storybook

Check that you haven't set `user: undefined` in your story parameters. The default mock provides a user.

### Changes to mockAuth parameters not reflected

Make sure you're setting parameters, not args:

```jsx
// ✅ Correct
export const MyStory = {
  parameters: {
    mockAuth: { ... }
  }
};

// ❌ Wrong
export const MyStory = {
  args: {
    mockAuth: { ... }
  }
};
```

### Console shows auth errors

Check the browser console for `[Mock AuthContext]` logs. These show what auth state is being provided.

## Related Files

- `.storybook/__mocks__/authContext.js` - Mock implementation
- `.storybook/__mocks__/aws-amplify-auth.js` - Low-level auth functions mock
- `.storybook/preview.jsx` - AuthProvider integration in decorator chain
- `src/context/authContext.jsx` - Real AuthContext implementation
