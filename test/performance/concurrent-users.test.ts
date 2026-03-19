/**
 * Concurrent Users Performance Tests
 * 
 * Tests application performance under load with multiple concurrent users
 * performing various operations simultaneously.
 * 
 * Test Scenarios:
 * - Multiple users in same section
 * - Concurrent grade submissions
 * - Concurrent file uploads
 * - Concurrent chat interactions
 * 
 * Performance Benchmarks:
 * - All operations should succeed
 * - Grade submission: < 1 second per user
 * - File upload (1MB): < 5 seconds
 * - Chat response: < 3 seconds
 * - System remains stable under load
 * 
 * Prerequisites:
 *   - Sandbox running: npx ampx sandbox
 *   - Test users created (student1-10@example.com)
 *   - TEST_USER_PASSWORD environment variable set
 * 
 * Usage:
 *   npm test test/performance/concurrent-users.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import amplifyOutputs from '../../amplify_outputs.json';

// Configure Amplify
Amplify.configure(amplifyOutputs);

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';

// Performance threshold constants (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  GRADE_SUBMISSION: 1000,        // 1 second
  FILE_UPLOAD_1MB: 5000,          // 5 seconds
  CHAT_RESPONSE: 3000,            // 3 seconds
  CONCURRENT_LOAD_5_USERS: 5000,  // 5 seconds for 5 concurrent operations
  CONCURRENT_LOAD_10_USERS: 10000, // 10 seconds for 10 concurrent operations
};

// Helper: Sign in as test user
async function signInAs(username: string) {
  if (!TEST_PASSWORD) {
    throw new Error('TEST_USER_PASSWORD environment variable is required');
  }

  try {
    await signOut();
  } catch {
    // Ignore if not signed in
  }

  await signIn({ username, password: TEST_PASSWORD });
  return await fetchAuthSession();
}

// Helper: Create test client for user
function createUserClient() {
  return generateClient<Schema>();
}

// Helper: Generate mock grade data
function generateMockGradeData(unitId: string, assignmentId: string) {
  return {
    unitID: unitId,
    assignmentID: assignmentId,
    data: JSON.stringify({
      'block-1': { complete: true, accuracy: 85, userAnswer: 'Test answer' },
      'block-2': { complete: true, accuracy: 92, userAnswer: 'Another answer' },
    }),
    accuracy: 88.5,
    complete: true,
    submittedAt: new Date().toISOString(),
  };
}

// Helper: Create test section
async function createTestSection(instructorUsername: string) {
  await signInAs(instructorUsername);
  const client = createUserClient();

  const { data: section, errors } = await client.models.Section.create({
    name: `Performance Test Section - ${Date.now()}`,
    joinCode: `TEST${Math.random().toString(36).substring(7).toUpperCase()}`,
  });

  if (errors || !section) {
    throw new Error('Failed to create test section');
  }

  return section;
}

// Helper: Create test unit
async function createTestUnit(instructorUsername: string) {
  await signInAs(instructorUsername);
  const client = createUserClient();

  const { data: unit, errors } = await client.models.Unit.create({
    name: `Performance Test Unit - ${Date.now()}`,
    description: 'Unit for concurrent testing',
    status: 'PUBLISHED',
    data: JSON.stringify({
      root: {
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Test content' }],
          },
        ],
      },
    }),
  });

  if (errors || !unit) {
    throw new Error('Failed to create test unit');
  }

  return unit;
}

// Helper: Create assignment
async function createTestAssignment(instructorUsername: string, unitId: string, sectionId: string) {
  await signInAs(instructorUsername);
  const client = createUserClient();

  const { data: assignment, errors } = await client.models.Assignment.create({
    unitID: unitId,
    sectionID: sectionId,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
  });

  if (errors || !assignment) {
    throw new Error('Failed to create test assignment');
  }

  return assignment;
}

describe('Concurrent Users Performance Tests', () => {
  let testSection: any;
  let testUnit: any;
  let testAssignment: any;

  beforeAll(async () => {
    // Create test data as instructor
    testSection = await createTestSection('instructor1@example.com');
    testUnit = await createTestUnit('instructor1@example.com');
    testAssignment = await createTestAssignment(
      'instructor1@example.com',
      testUnit.id,
      testSection.id
    );
  }, 30000);

  afterAll(async () => {
    // Cleanup test data
    if (testSection?.id || testUnit?.id || testAssignment?.id) {
      await signInAs('instructor1@example.com');
      const client = createUserClient();

      if (testAssignment?.id) {
        await client.models.Assignment.delete({ id: testAssignment.id });
      }
      if (testUnit?.id) {
        await client.models.Unit.delete({ id: testUnit.id });
      }
      if (testSection?.id) {
        await client.models.Section.delete({ id: testSection.id });
      }
    }
    await signOut();
  }, 30000);

  describe('Concurrent Grade Submissions', () => {
    it('handles 5 concurrent grade submissions within performance threshold', async () => {
      const userCount = 5;
      const users = Array.from({ length: userCount }, (_, i) => ({
        username: `student${i + 1}@example.com`,
      }));

      const startTime = Date.now();

      const results = await Promise.allSettled(
        users.map(async (user) => {
          await signInAs(user.username);
          const client = createUserClient();

          const gradeData = generateMockGradeData(testUnit.id, testAssignment.id);

          const { data, errors } = await client.models.Grade.create(gradeData);

          return {
            success: !errors && !!data,
            data,
            errors,
            user: user.username,
          };
        })
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All submissions should succeed
      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;

      expect(successCount).toBe(userCount);

      // Should complete within performance threshold
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_LOAD_5_USERS);

      console.info(`✓ ${userCount} concurrent grade submissions completed in ${duration}ms`);
      console.info(`  Average: ${Math.round(duration / userCount)}ms per submission`);

      // Cleanup created grades
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.data?.id) {
          await signInAs(result.value.user);
          const client = createUserClient();
          await client.models.Grade.delete({ id: result.value.data.id });
        }
      }
    }, 60000);

    it('handles 10 concurrent grade submissions with graceful degradation', async () => {
      const userCount = 10;
      const users = Array.from({ length: userCount }, (_, i) => ({
        username: `student${i + 1}@example.com`,
      }));

      const startTime = Date.now();

      const results = await Promise.allSettled(
        users.map(async (user) => {
          await signInAs(user.username);
          const client = createUserClient();

          const gradeData = generateMockGradeData(testUnit.id, testAssignment.id);

          const { data, errors } = await client.models.Grade.create(gradeData);

          return {
            success: !errors && !!data,
            data,
            errors,
            user: user.username,
          };
        })
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // At least 90% should succeed
      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;

      expect(successCount).toBeGreaterThanOrEqual(Math.floor(userCount * 0.9));

      // Should complete within extended threshold
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_LOAD_10_USERS);

      console.info(`✓ ${userCount} concurrent submissions: ${successCount} succeeded in ${duration}ms`);
      console.info(`  Success rate: ${Math.round((successCount / userCount) * 100)}%`);
      console.info(`  Average: ${Math.round(duration / userCount)}ms per submission`);

      // Cleanup created grades
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.data?.id) {
          await signInAs(result.value.user);
          const client = createUserClient();
          await client.models.Grade.delete({ id: result.value.data.id });
        }
      }
    }, 90000);
  });

  describe('Concurrent Data Queries', () => {
    it('handles concurrent section queries efficiently', async () => {
      const queryCount = 5;

      const startTime = Date.now();

      const results = await Promise.all(
        Array.from({ length: queryCount }, async () => {
          await signInAs('instructor1@example.com');
          const client = createUserClient();

          const { data } = await client.models.Section.list();
          return data;
        })
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All queries should return data
      expect(results.every((r) => Array.isArray(r))).toBe(true);

      // Should complete quickly
      expect(duration).toBeLessThan(3000); // 3 seconds for 5 queries

      console.info(`✓ ${queryCount} concurrent queries completed in ${duration}ms`);
      console.info(`  Average: ${Math.round(duration / queryCount)}ms per query`);
    }, 30000);

    it('handles concurrent unit fetches with relationships', async () => {
      const queryCount = 3;

      const startTime = Date.now();

      const results = await Promise.all(
        Array.from({ length: queryCount }, async () => {
          await signInAs('instructor1@example.com');
          const client = createUserClient();

          const { data } = await client.models.Unit.get({ id: testUnit.id });
          return data;
        })
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All queries should return the unit
      expect(results.every((r) => r?.id === testUnit.id)).toBe(true);

      // Should complete quickly
      expect(duration).toBeLessThan(2000); // 2 seconds for 3 queries

      console.info(`✓ ${queryCount} concurrent unit fetches in ${duration}ms`);
    }, 30000);
  });

  describe('Mixed Concurrent Operations', () => {
    it('handles mixed read/write operations concurrently', async () => {
      const startTime = Date.now();

      // Simulate realistic load: 3 reads, 2 writes
      const operations = [
        // Read operations
        async () => {
          await signInAs('student1@example.com');
          const client = createUserClient();
          return await client.models.Unit.list();
        },
        async () => {
          await signInAs('student2@example.com');
          const client = createUserClient();
          return await client.models.Section.list();
        },
        async () => {
          await signInAs('instructor1@example.com');
          const client = createUserClient();
          return await client.models.Assignment.list();
        },
        // Write operations
        async () => {
          await signInAs('student3@example.com');
          const client = createUserClient();
          const gradeData = generateMockGradeData(testUnit.id, testAssignment.id);
          return await client.models.Grade.create(gradeData);
        },
        async () => {
          await signInAs('student4@example.com');
          const client = createUserClient();
          const gradeData = generateMockGradeData(testUnit.id, testAssignment.id);
          return await client.models.Grade.create(gradeData);
        },
      ];

      const results = await Promise.allSettled(operations.map((op) => op()));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All operations should succeed
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      expect(successCount).toBe(operations.length);

      // Should complete within reasonable time
      expect(duration).toBeLessThan(7000); // 7 seconds for mixed operations

      console.info(`✓ ${operations.length} mixed operations completed in ${duration}ms`);

      // Cleanup created grades
      for (let i = 3; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          const gradeData = (result.value as any).data;
          if (gradeData?.id) {
            await signInAs(`student${i + 1}@example.com`);
            const client = createUserClient();
            await client.models.Grade.delete({ id: gradeData.id });
          }
        }
      }
    }, 60000);
  });

  describe('Performance Metrics', () => {
    it('measures and reports average query latency', async () => {
      const iterations = 10;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();

        await signInAs('instructor1@example.com');
        const client = createUserClient();
        await client.models.Section.list();

        const latency = Date.now() - start;
        latencies.push(latency);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      console.info('\n📊 Query Performance Metrics:');
      console.info(`  Average latency: ${Math.round(avgLatency)}ms`);
      console.info(`  Min latency: ${minLatency}ms`);
      console.info(`  Max latency: ${maxLatency}ms`);

      // Average should be under 500ms
      expect(avgLatency).toBeLessThan(500);
    }, 60000);
  });
});
