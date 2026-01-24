# Storybook Mock Data Migration to Gen 2

**Status:** Planned  
**Priority:** Medium  
**Dependencies:** Gen 2 backend migration complete

## Overview

The Storybook mock system currently uses Gen 1 Amplify patterns (DataStore, amplify config). This document outlines the migration path to Gen 2 patterns using the new Data client API.

## Current State

### Mock Files Using Gen 1 Patterns

1. **`.storybook/__mocks__/aws-amplify-datastore.js`** (1590 lines)
   - Implements full Gen 1 DataStore API
   - Provides `DataStore.save()`, `DataStore.query()`, `DataStore.observe()`, `DataStore.observeQuery()`
   - Uses `initSchema()` for model creation
   - In-memory storage with subscription support

2. **`.storybook/__mocks__/amplifyconfig.js`**
   - Uses Gen 1 config format with `aws_appsync_graphqlEndpoint`
   - Should use Gen 2 `amplify_outputs.json` format

3. **`.storybook/__mocks__/aws-amplify-auth.js`**
   - May need verification for Gen 2 auth token format

4. **`.storybook/__mocks__/aws-amplify-api.js`**
   - Has good Gen 2 REST API support
   - Contains legacy GraphQL comments that need cleanup

### Documentation Using Gen 1 Patterns

- `MOCK_DATA_GUIDE.md` - References DataStore operations
- `README.md` - Lists DataStore methods
- `IMPLEMENTATION_SUMMARY.md` - Mentions DataStore schema compatibility

### Stories Using Old Patterns

Based on grep analysis, these stories import from Gen 1 mocks:
- `ChatSidebar.stories.jsx` - uses `seedMockAssistantChats`
- `VocabularyReview2.stories.tsx` - uses `seedMockDocuments`, `seedMockParsedContent`
- `RecordingStudio2.stories.jsx` - uses `seedMockFiles`
- `Editor3/plugins/CustomAnswerPlugin.audio-drawing.stories.jsx` - uses `seedMockUnit`
- Multiple other Editor3 plugin stories

## Migration Plan

### Phase 1: Core Mock Infrastructure (High Priority)

#### 1.1 Create New Gen 2 Data Client Mock

**File:** `.storybook/__mocks__/aws-amplify-data.js` (new)

Replace DataStore pattern with Gen 2 client pattern:

**Gen 1 (current):**
```javascript
import { DataStore } from 'aws-amplify/datastore';

await DataStore.save(new Unit({ name: 'Test' }));
const units = await DataStore.query(Unit);
DataStore.observeQuery(Unit).subscribe(({ items }) => {});
```

**Gen 2 (target):**
```javascript
import { generateClient } from 'aws-amplify/data';

const client = generateClient();
await client.models.Unit.create({ name: 'Test' });
const { data: units } = await client.models.Unit.list();
client.models.Unit.observeQuery().subscribe(({ items }) => {});
```

**Implementation:**
- Create mock `generateClient()` function
- Return mock client with `models` object
- Each model has: `create()`, `update()`, `delete()`, `get()`, `list()`, `observeQuery()`
- Maintain in-memory storage (keep existing mockUnits, mockGrades, etc.)
- Support subscription callbacks (keep activeSubscriptions pattern)

#### 1.2 Update Amplify Config Mock

**File:** `.storybook/__mocks__/amplifyconfig.js`

Replace Gen 1 config with Gen 2 outputs format:

**Gen 1 (current):**
```javascript
{
  aws_appsync_graphqlEndpoint: 'https://...',
  aws_user_pools_id: 'mock-pool-id',
  // ...
}
```

**Gen 2 (target):**
```javascript
{
  version: '1',
  auth: {
    user_pool_id: 'mock-pool-id',
    user_pool_client_id: 'mock-client-id',
    // ...
  },
  data: {
    url: 'https://mock-endpoint.appsync-api.us-east-1.amazonaws.com/graphql',
    api_key: 'mock-api-key',
    default_authorization_type: 'AMAZON_COGNITO_USER_POOLS',
    // ...
  },
  // ...
}
```

#### 1.3 Update Webpack Aliases

**File:** `.storybook/main.js`

Add new alias for Gen 2 data client:
```javascript
'aws-amplify/data': path.resolve(__dirname, '__mocks__/aws-amplify-data.js'),
```

Keep old DataStore alias for backward compatibility during migration:
```javascript
'aws-amplify/datastore': path.resolve(__dirname, '__mocks__/aws-amplify-datastore.js'),
```

### Phase 2: Relationship Handling (High Priority)

#### 2.1 Update Relationship Patterns

**Gen 1 Pattern (current):**
```javascript
// In mock
unit.words = {
  toArray: async () => [...relationships]
};

// In components
const wordRelationships = await unit.words.toArray();
const words = await Promise.all(wordRelationships.map(r => r.word));
```

**Gen 2 Pattern (target):**
```javascript
// In mock client
client.models.UnitWord.list({ 
  filter: { unitID: { eq: unit.id }} 
});

// In components
const { data: unitWords } = await client.models.UnitWord.list({
  filter: { unitID: { eq: unitId }}
});
const wordIds = unitWords.map(uw => uw.wordID);
```

**Implementation:**
- Mock join table queries (UnitWord, UnitFile, QuestionUnit, etc.)
- Support nested data loading via `selectionSet`
- Maintain relationship data in mock storage

#### 2.2 Update Seed Functions

Current seed functions like `seedMockUnit()` add relationship methods. Update to store join table records instead:

```javascript
// Old
export const seedMockUnit = (unitData) => {
  const unit = {
    ...unitData,
    words: { toArray: async () => [...] },
  };
  mockUnits[unitData.id] = unit;
};

// New
export const seedMockUnit = (unitData, options = {}) => {
  // Store unit
  mockUnits[unitData.id] = unitData;
  
  // Store join table records if provided
  if (options.wordIDs) {
    options.wordIDs.forEach(wordID => {
      const joinId = `unitword-${unitData.id}-${wordID}`;
      mockUnitWords[joinId] = {
        id: joinId,
        unitID: unitData.id,
        wordID: wordID,
      };
    });
  }
};
```

### Phase 3: Documentation Updates (Medium Priority)

#### 3.1 Update MOCK_DATA_GUIDE.md

Replace all DataStore examples with Gen 2 client patterns:

**Before:**
```javascript
import { seedMockFiles } from '../../.storybook/__mocks__/aws-amplify-datastore';
```

**After:**
```javascript
import { seedMockFiles } from '../../.storybook/__mocks__/aws-amplify-data';
```

Update code examples throughout to use `client.models.*` instead of `DataStore.*`

#### 3.2 Update README.md

Section "Mock Files" needs updates:
- Rename `aws-amplify-datastore.js` → `aws-amplify-data.js`
- Update method list from DataStore to client.models API
- Add note about backward compatibility during transition

#### 3.3 Update IMPLEMENTATION_SUMMARY.md

Replace DataStore schema references with Gen 2 data client terminology.

### Phase 4: Story File Updates (Low Priority)

Update stories gradually as components are refactored. Stories will continue working with compatibility layer.

#### Example Migration Pattern

**Before:**
```javascript
import { seedMockUnit } from '../../.storybook/__mocks__/aws-amplify-datastore';

seedMockUnit({
  id: 'unit-1',
  name: 'Test Unit',
  data: editorContent,
});
```

**After:**
```javascript
import { seedMockUnit } from '../../.storybook/__mocks__/aws-amplify-data';

seedMockUnit({
  id: 'unit-1',
  name: 'Test Unit',
  data: editorContent,
}, {
  wordIDs: ['word-1', 'word-2'],
  fileIDs: ['file-1'],
});
```

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create `.storybook/__mocks__/aws-amplify-data.js`
  - [ ] Implement `generateClient()` mock
  - [ ] Create mock client with `models` object
  - [ ] Implement `create()`, `update()`, `delete()` methods
  - [ ] Implement `get()` and `list()` methods
  - [ ] Implement `observeQuery()` with subscriptions
  - [ ] Add filter/sort support
- [ ] Update `.storybook/__mocks__/amplifyconfig.js` to Gen 2 format
- [ ] Add new webpack alias in `.storybook/main.js`
- [ ] Test basic create/read/update/delete in isolation

### Phase 2: Relationships
- [ ] Add join table storage (mockUnitWords, mockUnitFiles, etc.)
- [ ] Implement join table queries in mock client
- [ ] Update all `seedMock*()` functions to accept relationship data
- [ ] Test relationship loading in stories

### Phase 3: Documentation
- [ ] Update `MOCK_DATA_GUIDE.md` with Gen 2 examples
- [ ] Update `README.md` mock file descriptions
- [ ] Update `IMPLEMENTATION_SUMMARY.md` terminology
- [ ] Create migration guide for story authors

### Phase 4: Story Updates (Gradual)
- [ ] ChatSidebar.stories.jsx
- [ ] VocabularyReview2.stories.tsx
- [ ] RecordingStudio2.stories.jsx
- [ ] Editor3 plugin stories
- [ ] Other component stories

## Backward Compatibility Strategy

During migration, maintain both old and new patterns:

1. **Keep old DataStore mock** - Redirect to new client internally
2. **Dual export** - Export both DataStore and generateClient from same file
3. **Deprecation warnings** - Console.warn when old patterns are used
4. **Gradual migration** - Update stories incrementally

Example compatibility layer:
```javascript
// In aws-amplify-data.js
export const DataStore = {
  save: async (model) => {
    console.warn('[Deprecated] Use client.models.*.create() instead of DataStore.save()');
    // Internally use new client
    return client.models[model.constructor.name].create(model);
  },
  // ... other methods
};

export const generateClient = () => client;
```

## Testing Strategy

### Unit Tests
- Test each mock client method in isolation
- Verify in-memory storage operations
- Test subscription callbacks
- Test filter/sort operations

### Integration Tests
- Run Storybook with new mocks
- Verify all stories render correctly
- Test interactive features (search, CRUD operations)
- Verify no console errors

### Manual Testing
- Open Storybook locally
- Test each major story category:
  - Editor3 stories
  - ChatSidebar stories
  - File management stories
  - Vocabulary/Question stories
- Verify mock data loads correctly
- Test subscriptions update properly

## Risks and Mitigation

### Risk: Breaking Existing Stories
**Mitigation:** Maintain backward compatibility layer, update incrementally

### Risk: Relationship Loading Complexity
**Mitigation:** Start with simple 1:1 relationships, add many-to-many support gradually

### Risk: Subscription Behavior Differences
**Mitigation:** Thoroughly test observeQuery patterns, match Gen 2 subscription semantics

### Risk: Large Refactor Scope
**Mitigation:** Break into phases, ship infrastructure first, update stories over time

## Success Criteria

- [ ] All Storybook stories render without errors
- [ ] Mock data operations use Gen 2 client API patterns
- [ ] Documentation reflects Gen 2 patterns
- [ ] No breaking changes for story authors during transition
- [ ] New stories can use pure Gen 2 patterns
- [ ] Console warnings guide migration for old patterns

## Timeline Estimate

- **Phase 1 (Core Infrastructure):** 2-3 days
- **Phase 2 (Relationships):** 1-2 days
- **Phase 3 (Documentation):** 1 day
- **Phase 4 (Story Updates):** Ongoing, 1-2 weeks for all stories

**Total:** ~1-2 weeks for core migration, then gradual story updates

## Related Documentation

- [GEN2_MIGRATION_PLAN.md](./GEN2_MIGRATION_PLAN.md) - Overall Gen 2 migration strategy
- [GEN2_MIGRATION_STATUS.md](./GEN2_MIGRATION_STATUS.md) - Current migration progress
- [MOCK_DATA_GUIDE.md](../.storybook/__mocks__/MOCK_DATA_GUIDE.md) - Mock data usage guide
- [Amplify Gen 2 Data Docs](https://docs.amplify.aws/gen2/build-a-backend/data/)

## Notes

- This migration is independent of production app Gen 2 migration
- Storybook mocks can be updated separately from main codebase
- No AWS resources needed - all mocked in-memory
- Focus on developer experience and documentation clarity
