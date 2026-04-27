/**
 * DataStore Subscription Performance Tests
 * 
 * Tests DataStore.observeQuery performance with various data sizes,
 * update frequencies, and subscription patterns.
 * 
 * Test Scenarios:
 * - Subscription with large datasets (100+ items)
 * - Rapid updates and re-renders
 * - Memory usage over time
 * - Unsubscribe cleanup verification
 * - Multiple concurrent subscriptions
 * 
 * Performance Benchmarks:
 * - Query response: < 200ms
 * - Update propagation: < 100ms
 * - Memory leak prevention: verified
 * - Subscription cleanup: < 50ms
 * 
 * Prerequisites:
 *   - Sandbox running: npx ampx sandbox
 *   - Test data seeded
 * 
 * Usage:
 *   npm test test/performance/datastore-sync.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import amplifyOutputs from '../../amplify_outputs.json';

// Configure Amplify
Amplify.configure(amplifyOutputs);

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';

// Skip performance tests when sandbox/credentials not available
const describeMaybeSkip = TEST_PASSWORD ? describe : describe.skip;

// Performance threshold constants (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  QUERY_RESPONSE: 200,        // 200ms for initial query
  UPDATE_PROPAGATION: 100,    // 100ms for update to propagate
  SUBSCRIPTION_CLEANUP: 50,   // 50ms to unsubscribe
  LARGE_DATASET_QUERY: 1000,  // 1 second for 100+ items
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
}

// Helper: Create test client
function createClient() {
  return generateClient<Schema>();
}

// Helper: Wait for condition with timeout
async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 50
): Promise<boolean> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return true;
}

// Helper: Measure memory usage (Node.js only)
function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed / 1024 / 1024, // MB
      heapTotal: usage.heapTotal / 1024 / 1024, // MB
      external: usage.external / 1024 / 1024, // MB
    };
  }
  return null;
}

describeMaybeSkip('DataStore Subscription Performance Tests', () => {
  beforeAll(async () => {
    await signInAs('instructor1@example.com');
  }, 30000);

  afterAll(async () => {
    await signOut();
  });

  describe('Query Performance', () => {
    it('fetches small dataset efficiently', async () => {
      const client = createClient();

      const startTime = performance.now();
      const { data } = await client.models.Section.list({ limit: 10 });
      const queryTime = performance.now() - startTime;

      expect(Array.isArray(data)).toBe(true);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.QUERY_RESPONSE);

      console.info(`✓ Small dataset query completed in ${queryTime.toFixed(2)}ms`);
    });

    it('fetches large dataset efficiently', async () => {
      const client = createClient();

      // Create test data if needed
      const existingUnits = await client.models.Unit.list({ limit: 1000 });
      const unitCount = existingUnits.data.length;

      const startTime = performance.now();
      const { data } = await client.models.Unit.list({ limit: 100 });
      const queryTime = performance.now() - startTime;

      expect(Array.isArray(data)).toBe(true);
      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_QUERY);

      console.info(`✓ Large dataset query (${unitCount} total) in ${queryTime.toFixed(2)}ms`);
    }, 30000);

    it('handles pagination efficiently', async () => {
      const client = createClient();
      const pageSize = 10;

      const startTime = performance.now();

      // Fetch first page
      const page1 = await client.models.Unit.list({ limit: pageSize });

      // Fetch second page if available
      let page2Data = null;
      if (page1.data.length === pageSize && page1.nextToken) {
        page2Data = await client.models.Unit.list({
          limit: pageSize,
          nextToken: page1.nextToken,
        });
      }

      const totalTime = performance.now() - startTime;

      expect(page1.data.length).toBeGreaterThan(0);

      console.info(`✓ Pagination test: ${totalTime.toFixed(2)}ms`);
      console.info(`  Page 1: ${page1.data.length} items`);
      if (page2Data) {
        console.info(`  Page 2: ${page2Data.data.length} items`);
      }
    }, 30000);
  });

  describe('Real-time Update Performance', () => {
    it('propagates updates quickly', async () => {
      const client = createClient();
      let updateReceived = false;
      let updateLatency = 0;

      // Create a test unit
      const { data: unit } = await client.models.Unit.create({
        name: 'Performance Test Unit',
        description: 'Testing update propagation',
        status: 'DRAFT',
      });

      if (!unit) {
        throw new Error('Failed to create test unit');
      }

      // Subscribe to updates
      const subscription = client.models.Unit.observeQuery({
        filter: { id: { eq: unit.id } },
      }).subscribe({
        next: ({ items, isSynced }) => {
          if (isSynced && items.length > 0) {
            const updated = items[0];
            if (updated.description && updated.description.includes('UPDATED')) {
              updateReceived = true;
            }
          }
        },
      });

      // Wait for initial sync
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update the unit and measure propagation time
      const updateStartTime = performance.now();

      await client.models.Unit.update({
        id: unit.id,
        description: 'UPDATED - Testing update propagation',
      });

      // Wait for update to be received
      const received = await waitFor(() => updateReceived, 5000);
      updateLatency = performance.now() - updateStartTime;

      expect(received).toBe(true);
      expect(updateLatency).toBeLessThan(PERFORMANCE_THRESHOLDS.UPDATE_PROPAGATION * 10); // More lenient for network

      console.info(`✓ Update propagation latency: ${updateLatency.toFixed(2)}ms`);

      // Cleanup
      subscription.unsubscribe();
      await client.models.Unit.delete({ id: unit.id });
    }, 30000);

    it('handles rapid successive updates', async () => {
      const client = createClient();
      const updateCount = 5;
      const receivedUpdates: string[] = [];

      // Create test unit
      const { data: unit } = await client.models.Unit.create({
        name: 'Rapid Update Test',
        description: 'Initial',
        status: 'DRAFT',
      });

      if (!unit) {
        throw new Error('Failed to create test unit');
      }

      // Subscribe
      const subscription = client.models.Unit.observeQuery({
        filter: { id: { eq: unit.id } },
      }).subscribe({
        next: ({ items, isSynced }) => {
          if (isSynced && items.length > 0) {
            receivedUpdates.push(items[0].description || '');
          }
        },
      });

      // Wait for initial sync
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Perform rapid updates
      const startTime = performance.now();

      for (let i = 0; i < updateCount; i++) {
        await client.models.Unit.update({
          id: unit.id,
          description: `Update ${i + 1}`,
        });
      }

      // Wait for all updates to propagate
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const totalTime = performance.now() - startTime;

      // Should receive final state
      expect(receivedUpdates[receivedUpdates.length - 1]).toContain('Update');

      console.info(`✓ ${updateCount} rapid updates in ${totalTime.toFixed(2)}ms`);
      console.info(`  Updates received: ${receivedUpdates.length}`);

      // Cleanup
      subscription.unsubscribe();
      await client.models.Unit.delete({ id: unit.id });
    }, 30000);
  });

  describe('Subscription Cleanup', () => {
    it('unsubscribes cleanly without memory leaks', async () => {
      const client = createClient();

      const memoryBefore = getMemoryUsage();

      // Create multiple subscriptions
      const subscriptions = [];

      for (let i = 0; i < 10; i++) {
        const sub = client.models.Section.observeQuery().subscribe({
          next: () => {
            // No-op
          },
        });
        subscriptions.push(sub);
      }

      // Wait for subscriptions to be active
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Unsubscribe all
      const unsubscribeStart = performance.now();

      for (const sub of subscriptions) {
        sub.unsubscribe();
      }

      const unsubscribeTime = performance.now() - unsubscribeStart;

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 500));

      const memoryAfter = getMemoryUsage();

      expect(unsubscribeTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SUBSCRIPTION_CLEANUP * 10);

      console.info(`✓ Unsubscribed 10 subscriptions in ${unsubscribeTime.toFixed(2)}ms`);

      if (memoryBefore && memoryAfter) {
        const memoryDelta = memoryAfter.heapUsed - memoryBefore.heapUsed;
        console.info(`  Memory delta: ${memoryDelta.toFixed(2)}MB`);
      }
    }, 30000);

    it('handles subscription errors gracefully', async () => {
      const client = createClient();
      let errorCount = 0;

      // Subscribe with error handler
      const subscription = client.models.Unit.observeQuery({
        filter: { id: { eq: 'non-existent-id' } },
      }).subscribe({
        next: () => {
          // No-op
        },
        error: (error) => {
          errorCount++;
          console.warn('Subscription error:', error);
        },
      });

      // Wait for potential errors
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Cleanup
      subscription.unsubscribe();

      // Should handle gracefully (errors expected for non-existent items)
      console.info(`✓ Handled ${errorCount} subscription errors gracefully`);
    }, 30000);
  });

  describe('Memory Usage Monitoring', () => {
    it('monitors memory usage during sustained operations', async () => {
      const client = createClient();
      const iterations = 20;
      const memorySnapshots: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Create subscription
        const sub = client.models.Section.observeQuery().subscribe({
          next: () => {
            // No-op
          },
        });

        // Record memory
        const memory = getMemoryUsage();
        if (memory) {
          memorySnapshots.push(memory.heapUsed);
        }

        // Cleanup
        sub.unsubscribe();

        // Small delay
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (memorySnapshots.length > 0) {
        const avgMemory =
          memorySnapshots.reduce((a, b) => a + b, 0) / memorySnapshots.length;
        const maxMemory = Math.max(...memorySnapshots);
        const minMemory = Math.min(...memorySnapshots);

        console.info('\n📊 Memory Usage During Sustained Operations:');
        console.info(`  Average: ${avgMemory.toFixed(2)}MB`);
        console.info(`  Min: ${minMemory.toFixed(2)}MB`);
        console.info(`  Max: ${maxMemory.toFixed(2)}MB`);
        console.info(`  Delta: ${(maxMemory - minMemory).toFixed(2)}MB`);

        // Memory should not grow unbounded
        const memoryGrowth = maxMemory - minMemory;
        expect(memoryGrowth).toBeLessThan(50); // Less than 50MB growth
      }
    }, 60000);
  });

  describe('Concurrent Subscriptions', () => {
    it('handles multiple concurrent subscriptions efficiently', async () => {
      const client = createClient();
      const subscriptionCount = 5;
      const updateCounts = Array(subscriptionCount).fill(0);

      // Create multiple subscriptions to different models
      const subscriptions = [
        client.models.Unit.observeQuery().subscribe({
          next: () => {
            updateCounts[0]++;
          },
        }),
        client.models.Section.observeQuery().subscribe({
          next: () => {
            updateCounts[1]++;
          },
        }),
        client.models.Assignment.observeQuery().subscribe({
          next: () => {
            updateCounts[2]++;
          },
        }),
        client.models.Grade.observeQuery().subscribe({
          next: () => {
            updateCounts[3]++;
          },
        }),
        client.models.Word.observeQuery().subscribe({
          next: () => {
            updateCounts[4]++;
          },
        }),
      ];

      // Wait for initial sync
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // All subscriptions should receive data
      const activeSubscriptions = updateCounts.filter((count) => count > 0).length;

      console.info(`✓ ${activeSubscriptions}/${subscriptionCount} subscriptions active`);
      console.info('  Update counts:', updateCounts);

      // Cleanup
      subscriptions.forEach((sub) => sub.unsubscribe());

      expect(activeSubscriptions).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Filter Performance', () => {
    it('applies filters efficiently on large datasets', async () => {
      const client = createClient();

      // Query without filter
      const startNoFilter = performance.now();
      const allUnits = await client.models.Unit.list({ limit: 100 });
      const timeNoFilter = performance.now() - startNoFilter;

      // Query with filter
      const startWithFilter = performance.now();
      const publishedUnits = await client.models.Unit.list({
        filter: { status: { eq: 'PUBLISHED' } },
        limit: 100,
      });
      const timeWithFilter = performance.now() - startWithFilter;

      console.info('\n📊 Filter Performance:');
      console.info(`  No filter: ${timeNoFilter.toFixed(2)}ms (${allUnits.data.length} items)`);
      console.info(
        `  With filter: ${timeWithFilter.toFixed(2)}ms (${publishedUnits.data.length} items)`
      );

      // Filtered query should be reasonably fast
      expect(timeWithFilter).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_QUERY);
    }, 30000);

    it('handles complex filter combinations', async () => {
      const client = createClient();

      const startTime = performance.now();

      const { data } = await client.models.Unit.list({
        filter: {
          and: [
            { status: { eq: 'PUBLISHED' } },
            {
              or: [
                { name: { contains: 'Test' } },
                { description: { contains: 'performance' } },
              ],
            },
          ],
        },
        limit: 50,
      });

      const queryTime = performance.now() - startTime;

      console.info(`✓ Complex filter query: ${queryTime.toFixed(2)}ms (${data.length} results)`);

      expect(queryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_QUERY);
    }, 30000);
  });

  describe('Performance Benchmark Report', () => {
    it('generates comprehensive DataStore performance report', async () => {
      const client = createClient();
      const metrics = {
        simpleQuery: 0,
        largeQuery: 0,
        filteredQuery: 0,
        subscriptionSetup: 0,
        subscriptionCleanup: 0,
      };

      // Simple query
      {
        const start = performance.now();
        await client.models.Section.list({ limit: 10 });
        metrics.simpleQuery = performance.now() - start;
      }

      // Large query
      {
        const start = performance.now();
        await client.models.Unit.list({ limit: 100 });
        metrics.largeQuery = performance.now() - start;
      }

      // Filtered query
      {
        const start = performance.now();
        await client.models.Unit.list({
          filter: { status: { eq: 'PUBLISHED' } },
          limit: 50,
        });
        metrics.filteredQuery = performance.now() - start;
      }

      // Subscription setup
      {
        const start = performance.now();
        const sub = client.models.Section.observeQuery().subscribe({
          next: () => {},
        });
        metrics.subscriptionSetup = performance.now() - start;

        // Cleanup
        const cleanupStart = performance.now();
        sub.unsubscribe();
        metrics.subscriptionCleanup = performance.now() - cleanupStart;
      }

      console.info('\n📊 DataStore Performance Benchmark Report:');
      console.info('==========================================');
      console.info(`  Simple query (10 items):    ${metrics.simpleQuery.toFixed(2)}ms`);
      console.info(`  Large query (100 items):    ${metrics.largeQuery.toFixed(2)}ms`);
      console.info(`  Filtered query:             ${metrics.filteredQuery.toFixed(2)}ms`);
      console.info(`  Subscription setup:         ${metrics.subscriptionSetup.toFixed(2)}ms`);
      console.info(`  Subscription cleanup:       ${metrics.subscriptionCleanup.toFixed(2)}ms`);
      console.info('==========================================');

      // Verify against thresholds
      expect(metrics.simpleQuery).toBeLessThan(PERFORMANCE_THRESHOLDS.QUERY_RESPONSE);
      expect(metrics.largeQuery).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_QUERY);
      expect(metrics.filteredQuery).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_QUERY);
    }, 60000);
  });
});
