# Storybook Performance Fixes

## Overview
Fixed excessive re-renders in Storybook stories, particularly affecting completion screens and components with context providers.

## Issues Identified

### 1. CompletionScreen - Excessive Timer Re-renders
**File:** [src/components/MeaningAssociationExercise/CompletionScreen.jsx](../src/components/MeaningAssociationExercise/CompletionScreen.jsx)

**Problems:**
- Timer running at 100ms intervals (10 re-renders per second)
- Inline style objects created on every render
- Calculated values not memoized
- `onContinue` dependency causing unnecessary effect re-runs

**Fixes:**
- Reduced timer interval from 100ms to 250ms (4 updates/sec instead of 10)
- Used `useRef` to store `onContinue` callback and avoid effect dependency
- Memoized all calculated values (`accuracyPercent`, `progressPercent`)
- Memoized all style objects using `React.useMemo()`
- Converted inline `style` props to `sx` props for better MUI optimization
- Wrapped `handleContinue` in `useCallback`

**Performance Impact:**
- Reduced re-renders by ~60% (10/sec → 4/sec)
- Eliminated unnecessary re-renders from style object creation
- Stable callback references prevent child re-renders

### 2. MeaningAssociation.stories.jsx - Context Recreation
**File:** [src/components/MeaningAssociationExercise/MeaningAssociation.stories.jsx](../src/components/MeaningAssociationExercise/MeaningAssociation.stories.jsx)

**Problem:**
- Context objects created inline in decorator function
- New object identities on every render triggered all context consumers to re-render

**Fix:**
```javascript
// Before:
const mockDictionaryContext = {
  dictionary: {},
  // ...
};

// After:
const mockDictionaryContext = React.useMemo(() => ({
  dictionary: {},
  // ...
}), []);
```

**Performance Impact:**
- Context consumers only render when props actually change
- Eliminated cascading re-renders through provider tree

### 3. RecordingStudio2.stories.jsx - Nested Provider Components
**File:** [src/components/RecordingStudio2.stories.jsx](../src/components/RecordingStudio2.stories.jsx)

**Problem:**
- Context providers defined as components inside decorator
- Provider components recreated on every decorator render
- Nested wrapper components causing multiple re-render cycles

**Fix:**
```javascript
// Before:
const MockUnitProvider = ({ children }) => {
  const mockUnitContextValue = { /* ... */ };
  return <UnitContext.Provider value={mockUnitContextValue}>{children}</UnitContext.Provider>;
};

// After:
const mockUnitContextValue = React.useMemo(() => ({
  /* ... */
}), []);
return <UnitContext.Provider value={mockUnitContextValue}>...</UnitContext.Provider>;
```

**Performance Impact:**
- Eliminated wrapper component overhead
- Context values stable across renders
- Direct provider usage more efficient

### 4. FileManager2.stories.jsx - Context Recreation
**File:** [src/components/Editor3/components/FileManager2.stories.jsx](../src/components/Editor3/components/FileManager2.stories.jsx)

**Problem:**
- Context objects created inline in wrapper component
- New context objects on every render

**Fix:**
- Added `React.useMemo()` around context value creation
- Stable context identities across renders

**Performance Impact:**
- FileManager2 and descendants only re-render when necessary
- Eliminated context provider re-render cascade

## Best Practices for Storybook Performance

### ✅ DO:
1. **Define mock data at module level** when it's static:
   ```javascript
   const mockDictionary = { /* ... */ };
   ```

2. **Use `React.useMemo()` for context values** in decorators:
   ```javascript
   const value = React.useMemo(() => ({ /* ... */ }), []);
   return <Context.Provider value={value}>...</Context.Provider>;
   ```

3. **Memoize calculated values** that depend on state:
   ```javascript
   const percent = React.useMemo(() => Math.round(value * 100), [value]);
   ```

4. **Memoize style objects** used in components:
   ```javascript
   const style = React.useMemo(() => ({ color: 'red' }), []);
   ```

5. **Use `useCallback` for event handlers** passed to children:
   ```javascript
   const onClick = React.useCallback(() => { /* ... */ }, []);
   ```

6. **Use refs for callbacks** in effects to avoid dependencies:
   ```javascript
   const callbackRef = React.useRef(callback);
   React.useEffect(() => { callbackRef.current = callback; }, [callback]);
   React.useEffect(() => { callbackRef.current(); }, []);
   ```

### ❌ DON'T:
1. **Don't create inline objects** for context providers:
   ```javascript
   // BAD
   <Context.Provider value={{ foo: 'bar' }}>
   ```

2. **Don't create wrapper components** inside decorators:
   ```javascript
   // BAD
   (Story) => {
     const Wrapper = ({ children }) => <Provider>...</Provider>;
     return <Wrapper><Story /></Wrapper>;
   }
   ```

3. **Don't use high-frequency timers** without memoization:
   ```javascript
   // BAD - causes 60 re-renders per second
   setInterval(() => setState(x => x + 1), 16);
   ```

4. **Don't create inline styles** on every render:
   ```javascript
   // BAD
   <div style={{ padding: '20px' }}>
   ```

5. **Don't skip memoization** for expensive calculations:
   ```javascript
   // BAD
   const result = expensiveCalculation(props.data);
   ```

## Testing Performance

Use React DevTools Profiler to measure:
1. **Render count** - should be minimal
2. **Render duration** - should be fast
3. **Why did this render** - should show legitimate prop/state changes

Enable in Storybook:
```javascript
// .storybook/preview.js
export const parameters = {
  options: {
    storySort: {
      method: 'alphabetical',
    },
  },
  // Enable React DevTools
  reactStrictMode: true,
};
```

## Files Modified

1. [src/components/MeaningAssociationExercise/CompletionScreen.jsx](../src/components/MeaningAssociationExercise/CompletionScreen.jsx)
2. [src/components/MeaningAssociationExercise/MeaningAssociation.stories.jsx](../src/components/MeaningAssociationExercise/MeaningAssociation.stories.jsx)
3. [src/components/RecordingStudio2.stories.jsx](../src/components/RecordingStudio2.stories.jsx)
4. [src/components/Editor3/components/FileManager2.stories.jsx](../src/components/Editor3/components/FileManager2.stories.jsx)

## Related Documentation

- [TYPESCRIPT_MIGRATION.md](./TYPESCRIPT_MIGRATION.md) - Component modernization
- [STORYBOOK_VALIDATION.md](./STORYBOOK_VALIDATION.md) - Story validation patterns
- [Copilot Instructions](../.github/copilot-instructions.md) - Architectural patterns

## Future Improvements

Consider:
1. **React.memo()** for expensive components
2. **Virtual scrolling** for long lists (already implemented in VirtualizedMessageList)
3. **Lazy loading** for heavy components
4. **Code splitting** for large story files
5. **Shared decorators** for common provider setups
