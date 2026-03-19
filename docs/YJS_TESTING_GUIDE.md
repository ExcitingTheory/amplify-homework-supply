# Testing Guide: Yjs Real-Time Collaboration

**Last Updated**: 2026-02-16

## Test Strategy

- **Unit test coverage goal**: >80%
- **Integration tests**: Multi-tab, offline, cross-device
- **E2E tests**: Full user workflows
- **Framework**: Vitest (unit) + Cypress (E2E)

## Test Scenarios

### Happy Path Tests

#### Phase 1: Editor Content

**Test: Multi-user editing without conflicts**
```typescript
// Two users edit different parts of document
it('should merge edits from two users at different positions', async () => {
  const provider1 = new YjsDocProvider({ docName: 'unit-1' });
  const provider2 = new YjsDocProvider({ docName: 'unit-1' });
  
  const ytext1 = provider1.getText('editorContent');
  const ytext2 = provider2.getText('editorContent');
  
  ytext1.insert(0, 'Hello ');
  await wait(100); // Wait for sync
  
  ytext2.insert(ytext2.length, 'World');
  await wait(100);
  
  expect(ytext1.toString()).toBe('Hello World');
  expect(ytext2.toString()).toBe('Hello World');
});
```

**Test: Debounced DataStore save**
```typescript
it('should debounce saves to DataStore (5s delay)', async () => {
  const saveToDataStore = vi.fn();
  const { provider } = useYjsUnit('unit-1', { saveToDataStore });
  
  const ytext = provider.getText('editorContent');
  
  ytext.insert(0, 'A');
  ytext.insert(1, 'B');
  ytext.insert(2, 'C');
  
  // Should not save immediately
  expect(saveToDataStore).not.toHaveBeenCalled();
  
  await wait(5000);
  
  // Should save once after debounce
  expect(saveToDataStore).toHaveBeenCalledTimes(1);
  expect(saveToDataStore).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.stringContaining('ABC')
    })
  );
});
```

#### Phase 2: Grade Submissions

**Test: Real-time grade visibility**
```typescript
it('should show student submission to instructor in real-time', async () => {
  const studentProvider = new YjsDocProvider({ docName: 'grade-1' });
  const instructorProvider = new YjsDocProvider({ docName: 'grade-1' });
  
  const studentGrade = studentProvider.getMap('data');
  const instructorGrade = instructorProvider.getMap('data');
  
  studentGrade.set('quiz-block-1', { 
    complete: true, 
    userAnswer: 'こんにちは',
    accuracy: 0 // Student can't set accuracy
  });
  
  await wait(100);
  
  const instructorView = instructorGrade.get('quiz-block-1');
  expect(instructorView.userAnswer).toBe('こんにちは');
  expect(instructorView.complete).toBe(true);
});
```

**Test: Instructor feedback propagates to student**
```typescript
it('should send instructor feedback to student', async () => {
  const instructorProvider = new YjsDocProvider({ docName: 'grade-1' });
  const studentProvider = new YjsDocProvider({ docName: 'grade-1' });
  
  const instructorFeedback = instructorProvider.getMap('feedback');
  const studentFeedback = studentProvider.getMap('feedback');
  
  instructorFeedback.set('quiz-block-1', 'Great work! Perfect pronunciation.');
  
  await wait(100);
  
  expect(studentFeedback.get('quiz-block-1')).toBe('Great work! Perfect pronunciation.');
});
```

#### Phase 3: Chat Messages

**Test: Instant message delivery**
```typescript
it('should deliver messages instantly', async () => {
  const user1 = new YjsDocProvider({ docName: 'chat-1' });
  const user2 = new YjsDocProvider({ docName: 'chat-1' });
  
  const messages1 = user1.getArray('chatMessages');
  const messages2 = user2.getArray('chatMessages');
  
  const msg = new Y.Map([
    ['id', 'msg-1'],
    ['author', 'user1'],
    ['content', 'Hello!'],
    ['timestamp', Date.now()]
  ]);
  
  messages1.push([msg]);
  
  await wait(100);
  
  expect(messages2.length).toBe(1);
  expect(messages2.get(0).get('content')).toBe('Hello!');
});
```

**Test: Typing awareness**
```typescript
it('should show typing indicator', async () => {
  const { provider, awareness } = useYjsChat('chat-1');
  const { setLocalState, remoteStates } = useAwareness(awareness);
  
  setLocalState({ typing: true, userId: 'user1', userName: 'John' });
  
  await wait(100);
  
  const typingUsers = Array.from(remoteStates.values())
    .filter(state => state.typing);
  
  expect(typingUsers).toHaveLength(1);
  expect(typingUsers[0].userName).toBe('John');
});
```

### Edge Case Tests

#### Offline Editing

**Test: Edit while offline, sync when reconnected**
```typescript
it('should sync offline edits when reconnected', async () => {
  const { provider } = useYjsUnit('unit-1');
  const ytext = provider.getText('editorContent');
  
  // Go offline
  provider.disconnect();
  
  ytext.insert(0, 'Offline edit ');
  
  // Should persist to IndexedDB
  const cached = await indexedDB.get('unit-1');
  expect(cached).toBeDefined();
  
  // Reconnect
  provider.reconnect();
  await wait(1000);
  
  // Should sync to server
  expect(provider.isSynced()).toBe(true);
});
```

**Test: IndexedDB persistence**
```typescript
it('should persist Y.Doc to IndexedDB', async () => {
  const provider = new YjsDocProvider({ 
    docName: 'unit-1', 
    persistence: true 
  });
  
  const ytext = provider.getText('editorContent');
  ytext.insert(0, 'Persistent content');
  
  await wait(500); // Wait for IndexedDB write
  
  // Destroy provider
  provider.destroy();
  
  // Create new provider with same docName
  const newProvider = new YjsDocProvider({ 
    docName: 'unit-1', 
    persistence: true 
  });
  
  await wait(500); // Wait for IndexedDB load
  
  const newText = newProvider.getText('editorContent');
  expect(newText.toString()).toBe('Persistent content');
});
```

#### Version Conflicts

**Test: Handle DataStore version conflict**
```typescript
it('should handle version conflict gracefully', async () => {
  const client = getAmplifyClient();
  const nextVersionRef = { current: 5 };
  
  // Mock version conflict error
  client.models.Unit.update = vi.fn().mockRejectedValueOnce(
    new Error('ConditionalCheckFailedException: _version')
  );
  
  const { updateMetadata } = useYjsUnit('unit-1', { nextVersionRef });
  
  // Attempt update
  await expect(updateMetadata({ name: 'New Name' })).rejects.toThrow('version');
  
  // Should reload from DataStore
  expect(client.models.Unit.get).toHaveBeenCalledWith({ id: 'unit-1' });
});
```

#### Null/Undefined Handling

**Test: Handle missing data gracefully**
```typescript
it('should handle null data field', async () => {
  const client = getAmplifyClient();
  client.models.Unit.get = vi.fn().mockResolvedValue({
    data: { id: 'unit-1', data: null }
  });
  
  const { unit } = useYjsUnit('unit-1');
  
  await wait(100);
  
  expect(unit).toBeDefined();
  expect(unit.data).toBeNull();
});

it('should parse empty JSON string correctly', () => {
  const gradeData = JSON.parse('{}');
  expect(gradeData).toEqual({});
  
  const gradeDataWithDefault = JSON.parse(null || '{}');
  expect(gradeDataWithDefault).toEqual({});
});
```

#### Long Offline Periods

**Test: Refresh from DataStore after 24h offline**
```typescript
it('should refresh from DataStore if offline > 24h', async () => {
  const provider = new YjsDocProvider({ docName: 'unit-1' });
  
  // Mock last sync time = 25 hours ago
  const lastSync = Date.now() - (25 * 60 * 60 * 1000);
  localStorage.setItem('unit-1_lastSync', lastSync.toString());
  
  const { refreshFromDataStore } = useYjsUnit('unit-1', { provider });
  
  // Should trigger refresh
  await wait(100);
  
  expect(client.models.Unit.get).toHaveBeenCalledWith({ id: 'unit-1' });
});
```

### Error Handling Tests

#### WebSocket Errors

**Test: Reconnect after WebSocket error**
```typescript
it('should reconnect after WebSocket disconnect', async () => {
  const provider = new YjsDocProvider({ 
    docName: 'unit-1', 
    connect: true 
  });
  
  const wsProvider = (provider as any).wsProvider;
  
  // Simulate disconnect
  wsProvider.emit('connection-error', new Error('Connection lost'));
  
  await wait(1000); // Wait for reconnection attempt
  
  expect(wsProvider.isConnected).toBe(true);
});
```

#### Invalid JSON

**Test: Handle corrupted DataStore data**
```typescript
it('should handle invalid JSON in DataStore', async () => {
  const client = getAmplifyClient();
  client.models.Unit.get = vi.fn().mockResolvedValue({
    data: { id: 'unit-1', data: '{invalid json}' }
  });
  
  const { unit, error } = useYjsUnit('unit-1');
  
  await wait(100);
  
  expect(error).toBeDefined();
  expect(error.message).toContain('JSON');
});
```

#### Permission Errors

**Test: Block student from setting accuracy**
```typescript
it('should prevent student from modifying accuracy', async () => {
  const isInstructor = false;
  const { gradeData, updateGrade } = useYjsGrade('grade-1', { isInstructor });
  
  // Attempt to set accuracy
  const result = await updateGrade('quiz-block-1', {
    complete: true,
    accuracy: 100 // Student shouldn't be able to set this
  });
  
  expect(result.error).toBeDefined();
  expect(result.error.message).toContain('permission');
});
```

## Validation Checklist

### Unit Tests
- [ ] All hooks have tests
- [ ] Type safety validated (tsc --noEmit passes)
- [ ] Error cases covered
- [ ] Edge cases tested
- [ ] Mocks for Amplify client
- [ ] Coverage > 80%

### Integration Tests
- [ ] Multi-tab collaboration works
- [ ] Offline editing + sync works
- [ ] Version conflicts resolve correctly
- [ ] Cross-device sync works
- [ ] File uploads work

### E2E Tests
- [ ] Full editor workflow
- [ ] Grade submission workflow
- [ ] Chat conversation workflow
- [ ] Document analysis workflow
- [ ] View state persistence

### Performance Tests
- [ ] Edit latency < 100ms
- [ ] Sync bandwidth < 500 bytes
- [ ] Memory usage < 5MB (100k chars)
- [ ] CPU merge time < 100ms (1k updates)

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run specific test file
npm test yjs/hooks.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Integration Tests
```bash
# Multi-tab test (requires 2 browser instances)
npm run test:integration

# Offline test
npm run test:offline
```

### E2E Tests
```bash
# Run Cypress tests
npm run cypress:open

# Headless mode
npm run cypress:run

# Specific test
npm run cypress:run -- --spec "cypress/e2e/yjs-collaboration.cy.ts"
```

### TypeScript Validation
```bash
# Check types
tsc --noEmit --project tsconfig.json

# Strict mode
tsc --noEmit --project tsconfig.json --strict
```

## Test Data

### Mock Unit
```typescript
const mockUnit = {
  id: 'unit-1',
  name: 'Test Unit',
  data: JSON.stringify({
    root: {
      children: [
        { type: 'paragraph', children: [{ text: 'Test content' }] }
      ]
    }
  }),
  yjsSnapshot: null,
  owner: 'user-1',
  _version: 1
};
```

### Mock Grade
```typescript
const mockGrade = {
  id: 'grade-1',
  unitID: 'unit-1',
  owner: 'student-1',
  data: JSON.stringify({
    'quiz-block-1': {
      complete: true,
      accuracy: 85,
      userAnswer: 'こんにちは'
    }
  }),
  complete: false,
  accuracy: 0,
  _version: 1
};
```

### Mock Chat Messages
```typescript
const mockMessages = [
  {
    id: 'msg-1',
    author: 'user-1',
    authorName: 'John Doe',
    content: 'Hello!',
    timestamp: Date.now(),
    edited: false
  },
  {
    id: 'msg-2',
    author: 'user-2',
    authorName: 'Jane Smith',
    content: 'Hi there!',
    timestamp: Date.now() + 1000,
    edited: false
  }
];
```

## Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| YjsProvider | >90% | 92% ✅ |
| hooks.ts | >80% | 0% ❌ |
| useYjsUnit | >80% | 0% ❌ |
| useYjsGrade | >80% | 0% ❌ |
| useYjsChat | >80% | 0% ❌ |
| SyncAdapter | >80% | 0% ❌ |

## Continuous Integration

### Pre-commit Hooks
```bash
# Add to .husky/pre-commit
npm run type-check
npm test -- --run --coverage
```

### GitHub Actions
```yaml
# .github/workflows/yjs-tests.yml
name: Yjs Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      - run: npm test -- --coverage
      - run: npm run build-storybook
```

## Debugging Tips

### Enable Yjs Debug Logs
```typescript
import * as Y from 'yjs';
Y.setLogger(console.log);
```

### Monitor WebSocket Traffic
```typescript
const wsProvider = (provider as any).wsProvider;
wsProvider.on('sync', (isSynced) => console.log('Sync:', isSynced));
wsProvider.on('status', ({ status }) => console.log('Status:', status));
wsProvider.on('connection-error', (error) => console.error('Error:', error));
```

### Inspect IndexedDB
```javascript
// Browser console
const db = await indexedDB.open('y-indexeddb');
const tx = db.transaction(['docs'], 'readonly');
const store = tx.objectStore('docs');
const allDocs = await store.getAll();
console.log(allDocs);
```

### Check DataStore Sync Status
```typescript
import { Hub } from 'aws-amplify/utils';

Hub.listen('datastore', (data) => {
  console.log('DataStore event:', data.payload);
});
```
