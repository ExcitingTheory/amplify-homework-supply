# Performance Tests

This directory contains performance and load testing infrastructure for the Homework Supply application.

## Test Files

### 1. `concurrent-users.test.ts`
Tests application performance under load with multiple concurrent users.

**Test Scenarios:**
- 5-10 concurrent grade submissions
- Concurrent data queries  
- Mixed read/write operations
- Performance metrics tracking

**Run:**
```bash
npm test test/performance/concurrent-users.test.ts
```

### 2. `yjs-collaboration.test.ts`
Tests Yjs real-time collaboration performance with multiple concurrent editors.

**Test Scenarios:**
- Two-client synchronization
- Multi-client collaboration (3-5 clients)
- Undo/redo performance
- Conflict resolution
- Data consistency verification

**Run:**
```bash
npm test test/performance/yjs-collaboration.test.ts
```

### 3. `datastore-sync.test.ts`
Tests DataStore.observeQuery subscription performance.

**Test Scenarios:**
- Query performance with various dataset sizes
- Real-time update propagation
- Subscription cleanup and memory management
- Concurrent subscriptions
- Filter performance

**Run:**
```bash
npm test test/performance/datastore-sync.test.ts
```

### 4. `load-testing-plan.md`
Comprehensive documentation for load testing strategy, including:
- Performance benchmarks
- Testing tools (k6, Artillery, Lighthouse CI)
- Test scenarios
- Execution plan
- Monitoring and metrics

### 5. Cypress Performance Tests
Located at `cypress/e2e/performance-metrics.cy.ts`

Tests real-world browser performance metrics:
- Page load times
- Core Web Vitals (LCP, FCP, CLS)
- Time to Interactive (TTI)
- Resource loading performance
- Network performance

**Run:**
```bash
npm run test:performance:browser
```

## Performance Benchmarks

### Response Time Targets

| Operation | Target | Threshold |
|-----------|--------|-----------|
| Page Load | < 2s | < 3s |
| Time to Interactive | < 3s | < 5s |
| GraphQL Query | < 200ms | < 500ms |
| Grade Submission | < 1s | < 2s |
| File Upload (1MB) | < 5s | < 10s |
| Yjs Sync | < 500ms | < 1s |
| DataStore Query | < 200ms | < 500ms |

## Quick Start

### Prerequisites

1. **Sandbox Environment Running:**
   ```bash
   npx ampx sandbox
   ```

2. **Test Users Created:**
   - student1-10@example.com
   - instructor1@example.com
   - admin@example.com

3. **Environment Variables:**
   ```bash
   export TEST_USER_PASSWORD="your_test_password"
   ```

### Run All Performance Tests

```bash
# Unit tests (Vitest)
npm run test:performance

# Browser tests (Cypress)
npm run test:performance:browser

# All tests
npm run test:performance:all
```

### Run Specific Test Suites

```bash
# Concurrent users only
npm test test/performance/concurrent-users.test.ts

# Yjs collaboration only
npm test test/performance/yjs-collaboration.test.ts

# DataStore sync only
npm test test/performance/datastore-sync.test.ts

# Cypress performance metrics
npx cypress run --spec cypress/e2e/performance-metrics.cy.ts
```

## Interpreting Results

### Success Criteria

Tests pass when:
- ✅ All response times are within target thresholds
- ✅ Concurrent operations complete successfully (>95% success rate)
- ✅ No memory leaks detected
- ✅ Data consistency maintained (100%)
- ✅ Graceful degradation under stress

### Performance Metrics

Each test logs detailed metrics:

**Concurrent Users:**
```
✓ 5 concurrent grade submissions completed in 2847ms
  Average: 569ms per submission
```

**Yjs Collaboration:**
```
📊 Yjs Performance Benchmark Report:
=====================================
  Two-client sync:        12.45ms
  Five-client full sync:  89.32ms
  Conflict resolution:    15.67ms
  Undo operation:         3.21ms
  Large doc sync (10KB):  234.56ms
```

**DataStore Sync:**
```
📊 DataStore Performance Benchmark Report:
==========================================
  Simple query (10 items):    156.78ms
  Large query (100 items):    523.45ms
  Filtered query:             287.91ms
  Subscription setup:         45.32ms
  Subscription cleanup:       12.67ms
```

## Load Testing Tools

For more comprehensive load testing beyond unit tests, see [load-testing-plan.md](./load-testing-plan.md).

### Recommended Tools

1. **k6** - API and GraphQL load testing
2. **Artillery** - Complex scenario testing
3. **Lighthouse CI** - Frontend performance audits
4. **AWS CloudWatch** - Infrastructure monitoring

### Example k6 Test

```bash
# Install k6
brew install k6  # macOS

# Run basic load test
k6 run load-tests/graphql-load.js
```

## Continuous Testing

### CI/CD Integration

Add to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Performance Tests
  run: |
    npm run test:performance
    npm run test:performance:browser
```

### Scheduled Testing

Run nightly comprehensive tests:

```bash
# Run full performance test suite
npm run test:performance:all

# Generate report
npm run test:performance:report
```

## Troubleshooting

### Common Issues

**1. Tests timing out:**
```bash
# Increase timeout
npm test test/performance/concurrent-users.test.ts -- --testTimeout=60000
```

**2. Authentication errors:**
```bash
# Verify test user password
echo $TEST_USER_PASSWORD

# Reset test users in Cognito
npm run manage-admins
```

**3. Sandbox not responding:**
```bash
# Restart sandbox
npm run sandbox:delete
npx ampx sandbox
```

**4. Memory issues:**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm test
```

## Performance Optimization

Based on test results, common optimizations:

1. **DataStore Subscriptions**
   - Consolidate duplicate subscriptions
   - Use client-side filtering
   - Implement proper cleanup

2. **Yjs Collaboration**
   - Debounce sync operations
   - Optimize update frequency
   - Use incremental updates

3. **Concurrent Operations**
   - Implement request batching
   - Use connection pooling
   - Add caching layers

4. **Page Load**
   - Code splitting
   - Lazy loading
   - Image optimization

## Monitoring in Production

### Key Metrics to Track

1. **Application Metrics:**
   - Response time (p50, p95, p99)
   - Error rate
   - Throughput

2. **Infrastructure Metrics:**
   - Lambda duration
   - DynamoDB capacity
   - API Gateway latency

3. **User Experience Metrics:**
   - Core Web Vitals
   - Time to Interactive
   - Bounce rate

### AWS CloudWatch Dashboards

Create dashboards for:
- Lambda performance
- DynamoDB metrics
- API Gateway requests
- S3 operations

## Contributing

When adding new performance tests:

1. Follow existing patterns (see test files)
2. Document performance thresholds
3. Add helpful logging/metrics
4. Update this README
5. Verify tests pass in CI/CD

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Cypress Performance Testing](https://docs.cypress.io/guides/references/best-practices#Performance)
- [k6 Documentation](https://k6.io/docs/)
- [Web Performance Best Practices](https://web.dev/fast/)
- [AWS Performance Testing](https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar)
