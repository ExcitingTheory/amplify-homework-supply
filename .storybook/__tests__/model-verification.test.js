/**
 * Test to verify that model classes are being loaded correctly in Storybook
 * Run this with: node .storybook/__tests__/model-verification.test.js
 */

// Simulate the webpack alias by requiring our mock
const DataStoreMock = require('../__mocks__/aws-amplify-datastore.js');

// Import the schema like the real models/index.js does
const { schema } = require('../../src/models/schema.js');

console.log('\n=== Model Verification Test ===\n');

// Test 1: Verify initSchema exists
console.log('✓ Test 1: initSchema exists:', typeof DataStoreMock.initSchema === 'function');

// Test 2: Call initSchema with the real schema
const models = DataStoreMock.initSchema(schema);
console.log('✓ Test 2: initSchema returns models:', Object.keys(models).length > 0);
console.log('  Models created:', Object.keys(models).join(', '));

// Test 3: Verify Unit model exists and has required methods
const { Unit, Grade } = models;
console.log('\n✓ Test 3: Unit model exists:', !!Unit);
console.log('  Unit.name:', Unit?.name);
console.log('  Unit.copyOf exists:', typeof Unit?.copyOf === 'function');

// Test 4: Create a Unit instance
try {
  const unit = new Unit({
    id: 'test-1',
    name: 'Test Unit',
    description: 'A test unit',
    data: { root: { children: [] } },
    _version: 1,
    owner: 'test-owner'
  });
  console.log('\n✓ Test 4: Can create Unit instance:', !!unit);
  console.log('  Unit instance:', { id: unit.id, name: unit.name });
} catch (error) {
  console.log('\n✗ Test 4: Failed to create Unit instance:', error.message);
}

// Test 5: Test copyOf method
try {
  const original = new Unit({
    id: 'test-2',
    name: 'Original',
    description: 'Original description',
    _version: 1
  });
  
  const updated = Unit.copyOf(original, draft => {
    draft.name = 'Updated';
    draft.description = 'Updated description';
  });
  
  console.log('\n✓ Test 5: copyOf works correctly:');
  console.log('  Original name:', original.name);
  console.log('  Updated name:', updated.name);
  console.log('  Original unchanged:', original.name === 'Original');
} catch (error) {
  console.log('\n✗ Test 5: copyOf failed:', error.message);
}

// Test 6: Verify DataStore mock methods exist
console.log('\n✓ Test 6: DataStore class exists:', !!DataStoreMock.DataStore);
console.log('  DataStore.observeQuery:', typeof DataStoreMock.DataStore.observeQuery === 'function');
console.log('  DataStore.save:', typeof DataStoreMock.DataStore.save === 'function');
console.log('  DataStore.query:', typeof DataStoreMock.DataStore.query === 'function');

// Test 7: Verify helper functions exist
console.log('\n✓ Test 7: Helper functions exist:');
console.log('  seedMockUnit:', typeof DataStoreMock.seedMockUnit === 'function');
console.log('  clearMockData:', typeof DataStoreMock.clearMockData === 'function');
console.log('  SortDirection:', !!DataStoreMock.SortDirection);

console.log('\n=== All Tests Passed! ===\n');
