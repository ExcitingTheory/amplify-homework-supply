# Next.js Router Mock for Storybook

This guide explains how to use the Next.js router mock in Storybook stories.

## Overview

The router mock intercepts `useRouter()` calls from `next/router` and provides a configurable mock router object. This allows components that use Next.js routing to work properly in Storybook.

## Setup

The mock is automatically configured via:
1. **Webpack alias** in `.storybook/main.ts` - redirects `next/router` to our mock
2. **RouterContext Provider** in `.storybook/preview.jsx` - wraps all stories
3. **Mock implementation** in `.storybook/__mocks__/next-router.js`

## Basic Usage

### Default Router (No Configuration Needed)

Components will automatically receive a default mock router:

```javascript
export default {
  title: 'Components/MyComponent',
  component: MyComponent,
};

export const Default = {
  args: {
    // Your props
  }
};
```

The default router has:
- `pathname: '/'`
- `query: {}`
- `asPath: '/'`
- Mock functions for `push()`, `replace()`, etc. that log to console

### Custom Router Configuration

Configure the router for specific stories using the `nextRouter` parameter:

```javascript
export default {
  title: 'Components/UnitEditor',
  component: UnitEditor,
  parameters: {
    nextRouter: {
      pathname: '/units/[id]',
      query: { id: 'unit-123' },
      asPath: '/units/unit-123',
    }
  }
};

export const EditMode = {
  parameters: {
    nextRouter: {
      pathname: '/units/[id]/edit',
      query: { id: 'unit-456', tab: 'content' },
      asPath: '/units/unit-456/edit?tab=content',
    }
  }
};
```

### Testing Router Actions

The mock router logs all navigation attempts to the console:

```javascript
// In your component
const router = useRouter();
router.push('/units/new'); // Logs: [Mock Router] push: { url: '/units/new', as: undefined, options: undefined }
router.replace('/dashboard'); // Logs: [Mock Router] replace: { url: '/dashboard', ... }
```

### Testing with Router Events

The router includes a mock event emitter:

```javascript
export const WithRouteChange = {
  render: (args) => {
    const [count, setCount] = React.useState(0);
    
    React.useEffect(() => {
      const router = useRouter();
      const handleRouteChange = () => setCount(c => c + 1);
      
      router.events.on('routeChangeComplete', handleRouteChange);
      return () => router.events.off('routeChangeComplete', handleRouteChange);
    }, []);
    
    return <MyComponent {...args} routeChangeCount={count} />;
  }
};
```

## Advanced Usage

### Story-Specific Router Overrides

You can override any router property:

```javascript
export const CustomRouter = {
  parameters: {
    nextRouter: {
      pathname: '/custom',
      isReady: false, // Simulate router not ready
      isPreview: true, // Simulate preview mode
      locale: 'ja',
      locales: ['en', 'ja', 'es'],
      push: async (url) => {
        console.log('Custom push handler:', url);
        // Custom logic here
        return true;
      }
    }
  }
};
```

### Testing Query Parameters

Useful for components that read URL parameters:

```javascript
export const WithQueryParams = {
  parameters: {
    nextRouter: {
      query: {
        search: 'hiragana',
        filter: 'beginner',
        sort: 'recent',
      }
    }
  }
};
```

### Testing Dynamic Routes

```javascript
export const DynamicRoute = {
  parameters: {
    nextRouter: {
      pathname: '/units/[unitId]/assignments/[assignmentId]',
      query: {
        unitId: 'unit-123',
        assignmentId: 'assign-456',
      },
      asPath: '/units/unit-123/assignments/assign-456',
    }
  }
};
```

## Common Patterns

### Tab Navigation with URL Sync

For components using `useTabState` that sync with URL:

```javascript
export const TabsWithURLSync = {
  parameters: {
    nextRouter: {
      query: {
        leftTab: 'editor',
        rightTab: 'preview',
        leftWidth: '60',
      }
    }
  }
};
```

### Authenticated Routes

```javascript
export const AuthenticatedPage = {
  parameters: {
    nextRouter: {
      pathname: '/dashboard',
      query: { from: '/login' }, // Simulates redirect after auth
    }
  }
};
```

### Search Results Page

```javascript
export const SearchResults = {
  parameters: {
    nextRouter: {
      pathname: '/search',
      query: {
        q: 'vocabulary',
        page: '2',
        limit: '20',
      },
      asPath: '/search?q=vocabulary&page=2&limit=20',
    }
  }
};
```

## Debugging

All router actions are logged to the console with the `[Mock Router]` prefix:

```
[Mock Router] push: { url: '/units/new', as: undefined, options: undefined }
[Mock Router] replace: { url: '/dashboard', as: undefined, options: { shallow: true } }
[Mock Router] useRouter called outside of RouterContext. Using default router.
```

## Limitations

- Router navigation doesn't actually change URLs or render new pages
- Router events must be manually triggered if needed in tests
- Back/forward browser buttons don't work (they're mocked)
- Server-side routing features (like `getServerSideProps`) are not available

## Related Components

This mock is particularly useful for:
- `MainToolbar` - Uses router for navigation
- `UnitEditor` - Syncs tabs with URL query params via `useTabState`
- `ToolBarPlugin` - Uses router for navigation
- Any component using `useRouter()` from `next/router`

## See Also

- [Next.js Router Documentation](https://nextjs.org/docs/api-reference/next/router)
- [Storybook Next.js Framework](https://storybook.js.org/docs/react/get-started/frameworks/nextjs)
