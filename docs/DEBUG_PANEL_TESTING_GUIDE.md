# Testing Guide: Debug Panel & State Inspector

**Last Updated**: February 6, 2026  
**Test Framework**: Vitest  
**Coverage Target**: >80%  
**TypeScript**: Strict mode required for all test files

## Test Strategy

### Unit Test Coverage Goals
- **Utilities**: 90% coverage (pure functions, easy to test)
- **Components**: 80% coverage (UI behavior, harder edge cases)
- **Integration**: 70% coverage (S3, network, multi-component)

### Test Framework Setup
- **Framework**: Vitest (faster than Jest, native ESM support)
- **React Testing**: @testing-library/react
- **Mocking**: Vitest vi.fn() and vi.mock()
- **Type Checking**: Run `tsc --noEmit` on test files

### Testing Layers
1. **Unit Tests** - Individual functions and classes
2. **Component Tests** - React component behavior
3. **Integration Tests** - Multi-component workflows
4. **E2E Tests** (future) - Full debug panel workflow in Cypress

## Test Scenarios

### Phase 1: Core Infrastructure

#### ComponentTreeStore Tests

**Happy Path**:
```typescript
describe('ComponentTreeStore', () => {
  it('should register a component', () => {
    const store = new ComponentTreeStore();
    store.register({
      name: 'TestComponent',
      props: { id: 1 },
      state: { count: 0 },
      mountTime: Date.now(),
      renderCount: 1,
      lastRenderTime: Date.now()
    });
    
    const tree = store.getTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('TestComponent');
  });

  it('should unregister a component', () => {
    const store = new ComponentTreeStore();
    store.register({ name: 'Test', /* ... */ });
    store.unregister('Test');
    expect(store.getTree()).toHaveLength(0);
  });

  it('should notify subscribers on changes', () => {
    const store = new ComponentTreeStore();
    const listener = vi.fn();
    store.subscribe(listener);
    
    store.register({ name: 'Test', /* ... */ });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
```

**Edge Cases**:
```typescript
describe('ComponentTreeStore edge cases', () => {
  it('should handle empty tree', () => {
    const store = new ComponentTreeStore();
    expect(store.getTree()).toEqual([]);
  });

  it('should handle unregister of non-existent component', () => {
    const store = new ComponentTreeStore();
    expect(() => store.unregister('DoesNotExist')).not.toThrow();
  });

  it('should handle multiple components with same name', () => {
    const store = new ComponentTreeStore();
    store.register({ name: 'Test', mountTime: 100, /* ... */ });
    store.register({ name: 'Test', mountTime: 200, /* ... */ });
    expect(store.getTree()).toHaveLength(2);
  });
});
```

**Error Handling**:
```typescript
describe('ComponentTreeStore errors', () => {
  it('should handle circular references in props', () => {
    const store = new ComponentTreeStore();
    const circular: any = { self: null };
    circular.self = circular;
    
    // Should not throw, sanitization handles it
    expect(() => store.register({
      name: 'Test',
      props: circular,
      /* ... */
    })).not.toThrow();
  });
});
```

#### DebugLogger Tests

**Happy Path**:
```typescript
describe('DebugLogger', () => {
  it('should capture console.log calls', () => {
    const logger = new DebugLogger();
    console.log('test message', { data: 123 });
    
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('log');
    expect(logs[0].message).toContain('test message');
  });

  it('should filter logs by level', () => {
    const logger = new DebugLogger();
    console.log('info');
    console.error('error');
    
    const errors = logger.getLogs({ level: 'error' });
    expect(errors).toHaveLength(1);
    expect(errors[0].level).toBe('error');
  });

  it('should search logs by text', () => {
    const logger = new DebugLogger();
    console.log('find me');
    console.log('skip me');
    
    const results = logger.getLogs({ search: 'find' });
    expect(results).toHaveLength(1);
  });
});
```

**Edge Cases**:
```typescript
describe('DebugLogger edge cases', () => {
  it('should handle max log limit', () => {
    const logger = new DebugLogger();
    for (let i = 0; i < 1100; i++) {
      console.log(`Log ${i}`);
    }
    expect(logger.getLogs()).toHaveLength(1000);
  });

  it('should handle null/undefined arguments', () => {
    const logger = new DebugLogger();
    console.log(null, undefined);
    const logs = logger.getLogs();
    expect(logs[0].message).toContain('null');
  });

  it('should handle non-serializable objects', () => {
    const logger = new DebugLogger();
    const circular: any = {};
    circular.self = circular;
    
    expect(() => console.log(circular)).not.toThrow();
  });
});
```

#### Sanitization Tests

**Happy Path**:
```typescript
describe('sanitizeProps', () => {
  it('should convert functions to string', () => {
    const result = sanitizeProps({ onClick: () => {} });
    expect(result.onClick).toBe('[Function]');
  });

  it('should convert React elements to string', () => {
    const result = sanitizeProps({ children: <div>test</div> });
    expect(result.children).toBe('[ReactElement]');
  });

  it('should preserve primitives', () => {
    const result = sanitizeProps({ 
      str: 'hello',
      num: 123,
      bool: true
    });
    expect(result).toEqual({ str: 'hello', num: 123, bool: true });
  });
});
```

**Edge Cases**:
```typescript
describe('sanitizeProps edge cases', () => {
  it('should handle null props', () => {
    expect(sanitizeProps(null)).toEqual({});
  });

  it('should handle undefined props', () => {
    expect(sanitizeProps(undefined)).toEqual({});
  });

  it('should handle circular references', () => {
    const circular: any = { self: null };
    circular.self = circular;
    
    const result = sanitizeProps({ obj: circular });
    expect(result.obj).toContain('[Object:');
  });
});
```

#### useComponentInspector Hook Tests

**Component Test**:
```typescript
import { renderHook } from '@testing-library/react';

describe('useComponentInspector', () => {
  it('should register on mount', () => {
    const store = new ComponentTreeStore();
    window.__COMPONENT_TREE__ = store;
    
    const { result } = renderHook(() => 
      useComponentInspector('TestComp', { id: 1 })
    );
    
    expect(store.getTree()).toHaveLength(1);
    expect(result.current).toBe(1); // render count
  });

  it('should unregister on unmount', () => {
    const store = new ComponentTreeStore();
    window.__COMPONENT_TREE__ = store;
    
    const { unmount } = renderHook(() =>
      useComponentInspector('TestComp', {})
    );
    
    unmount();
    expect(store.getTree()).toHaveLength(0);
  });

  it('should increment render count', () => {
    const store = new ComponentTreeStore();
    window.__COMPONENT_TREE__ = store;
    
    const { result, rerender } = renderHook(() =>
      useComponentInspector('TestComp', {})
    );
    
    expect(result.current).toBe(1);
    rerender();
    expect(result.current).toBe(2);
  });
});
```

### Phase 2: UI Components

#### DebugPanel Tests

```typescript
describe('DebugPanel', () => {
  it('should not render in production by default', () => {
    const { container } = render(<DebugPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render when showInProduction=true', () => {
    const { getByRole } = render(<DebugPanel showInProduction={true} />);
    expect(getByRole('button')).toBeInTheDocument();
  });

  it('should open drawer on FAB click', async () => {
    const { getByRole, getByText } = render(<DebugPanel showInProduction={true} />);
    
    await userEvent.click(getByRole('button'));
    expect(getByText('Component Tree')).toBeInTheDocument();
  });

  it('should switch tabs', async () => {
    const { getByRole, getByText } = render(<DebugPanel defaultOpen={true} showInProduction={true} />);
    
    await userEvent.click(getByText('Logs'));
    expect(getByText(/log entries/i)).toBeInTheDocument();
  });
});
```

#### ComponentTreeView Tests

```typescript
describe('ComponentTreeView', () => {
  it('should display component count', () => {
    const store = new ComponentTreeStore();
    store.register({ name: 'Comp1', /* ... */ });
    store.register({ name: 'Comp2', /* ... */ });
    window.__COMPONENT_TREE__ = store;
    
    const { getByText } = render(<ComponentTreeView />);
    expect(getByText(/2 components/i)).toBeInTheDocument();
  });

  it('should expand component details on click', async () => {
    const store = new ComponentTreeStore();
    store.register({ 
      name: 'TestComp',
      props: { id: 123 },
      /* ... */
    });
    window.__COMPONENT_TREE__ = store;
    
    const { getByText } = render(<ComponentTreeView />);
    await userEvent.click(getByText('TestComp'));
    
    expect(getByText('Props')).toBeInTheDocument();
  });
});
```

### Phase 3: S3 Integration

#### uploadDiagnosticToS3 Tests

```typescript
import { uploadData } from 'aws-amplify/storage';

vi.mock('aws-amplify/storage', () => ({
  uploadData: vi.fn()
}));

describe('uploadDiagnosticToS3', () => {
  it('should upload snapshot to S3', async () => {
    const mockResult = { key: 'diagnostics/user/123.json' };
    (uploadData as any).mockResolvedValue({ result: mockResult });
    
    const result = await uploadDiagnosticToS3('Test issue');
    
    expect(result.success).toBe(true);
    expect(result.key).toBe(mockResult.key);
    expect(result.shareableId).toBeTruthy();
  });

  it('should handle upload failure', async () => {
    (uploadData as any).mockRejectedValue(new Error('Network error'));
    
    const result = await uploadDiagnosticToS3();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });
});
```

### Phase 4: Advanced Features

#### Error Boundary Tests

```typescript
describe('ErrorBoundary with Debug Panel', () => {
  it('should capture error in global store', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(window.__ERROR_BOUNDARY__?.getRecentErrors()).toHaveLength(1);
  });
});
```

## Validation Checklist

### Before Each Commit
- [ ] All new functions have tests
- [ ] Run `tsc --noEmit --project tsconfig.json` - must pass
- [ ] Run `npm test` - all tests pass
- [ ] Coverage >80% for new code
- [ ] No console errors/warnings
- [ ] ESLint passes

### Before Phase Completion
- [ ] All TODO items have tests
- [ ] Integration tests pass
- [ ] Storybook stories render correctly
- [ ] Documentation updated
- [ ] Coverage report reviewed

### Before Feature Completion
- [ ] All phases tested
- [ ] E2E user workflows tested
- [ ] Performance benchmarks met
- [ ] Security review complete
- [ ] Accessibility audit pass

## Test Commands

```bash
# Run all tests
npm test

# Run tests for specific file
npm test -- ComponentTreeStore.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Type check test files
tsc --noEmit --project tsconfig.json

# Run only changed tests
npm test -- --changed
```

## Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Utilities | 90% | TBD |
| Components | 80% | TBD |
| Integration | 70% | TBD |
| Overall | >80% | TBD |

## Known Test Challenges

1. **Mocking window globals** - ComponentTreeStore and DebugLogger live on window
   - Solution: Reset globals in beforeEach/afterEach

2. **Console interception** - DebugLogger modifies console
   - Solution: Restore original console after each test

3. **Async state snapshots** - DataStore queries are async
   - Solution: Use async/await and waitFor from testing-library

4. **S3 mocking** - AWS SDK needs mocking
   - Solution: Use vi.mock() for aws-amplify/storage

5. **React 18 concurrent mode** - May affect hook testing
   - Solution: Use @testing-library/react with React 18 support
