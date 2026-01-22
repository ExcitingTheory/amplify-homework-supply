/**
 * Test to verify that model classes are being loaded correctly in Storybook
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Simulate the webpack alias by importing our mock
import * as DataStoreMock from '../__mocks__/aws-amplify-datastore.js';

// Import the schema like the real models/index.js does
import { schema } from '../../src/models/schema.js';

describe('Model Verification', () => {
  let models;
  let Unit;
  let Grade;

  beforeEach(() => {
    models = DataStoreMock.initSchema(schema);
    Unit = models.Unit;
    Grade = models.Grade;
  });

  describe('DataStore Mock', () => {
    it('should have initSchema function', () => {
      expect(typeof DataStoreMock.initSchema).toBe('function');
    });

    it('should return models from initSchema', () => {
      expect(Object.keys(models).length).toBeGreaterThan(0);
      expect(models).toHaveProperty('Unit');
      expect(models).toHaveProperty('Grade');
    });

    it('should have DataStore class with required methods', () => {
      expect(DataStoreMock.DataStore).toBeDefined();
      expect(typeof DataStoreMock.DataStore.observeQuery).toBe('function');
      expect(typeof DataStoreMock.DataStore.save).toBe('function');
      expect(typeof DataStoreMock.DataStore.query).toBe('function');
    });

    it('should have helper functions', () => {
      expect(typeof DataStoreMock.seedMockUnit).toBe('function');
      expect(typeof DataStoreMock.clearMockData).toBe('function');
      expect(DataStoreMock.SortDirection).toBeDefined();
    });
  });

  describe('Unit Model', () => {
    it('should exist with correct name', () => {
      expect(Unit).toBeDefined();
      expect(Unit.name).toBe('Unit');
    });

    it('should have copyOf method', () => {
      expect(typeof Unit.copyOf).toBe('function');
    });

    it('should create Unit instance', () => {
      const unit = new Unit({
        id: 'test-1',
        name: 'Test Unit',
        description: 'A test unit',
        data: { root: { children: [] } },
        _version: 1,
        owner: 'test-owner'
      });

      expect(unit).toBeDefined();
      expect(unit.id).toBe('test-1');
      expect(unit.name).toBe('Test Unit');
      expect(unit.description).toBe('A test unit');
    });

    it('should update instance with copyOf', () => {
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

      expect(original.name).toBe('Original');
      expect(original.description).toBe('Original description');
      expect(updated.name).toBe('Updated');
      expect(updated.description).toBe('Updated description');
    });
  });

  describe('Grade Model', () => {
    it('should exist with correct name', () => {
      expect(Grade).toBeDefined();
      expect(Grade.name).toBe('Grade');
    });

    it('should have copyOf method', () => {
      expect(typeof Grade.copyOf).toBe('function');
    });

    it('should create Grade instance', () => {
      const grade = new Grade({
        id: 'grade-1',
        data: '{}',
        complete: false,
        accuracy: 0,
        _version: 1
      });

      expect(grade).toBeDefined();
      expect(grade.id).toBe('grade-1');
      expect(grade.complete).toBe(false);
      expect(grade.accuracy).toBe(0);
    });
  });
});
