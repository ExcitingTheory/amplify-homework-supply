# Load Testing Plan

## Overview

This document outlines the load testing strategy for the Homework Supply application, including tools, scenarios, benchmarks, and monitoring approaches.

## Objectives

- Validate application performance under realistic load
- Identify performance bottlenecks and capacity limits
- Establish baseline performance metrics
- Test auto-scaling capabilities
- Ensure graceful degradation under stress

## Performance Benchmarks

### Response Time Targets

| Operation | Target | Threshold | Notes |
|-----------|--------|-----------|-------|
| Page Load | < 2s | < 3s | Time to First Contentful Paint |
| Time to Interactive | < 3s | < 5s | User can interact with page |
| GraphQL Query | < 200ms | < 500ms | Simple queries |
| GraphQL Mutation | < 500ms | < 1s | Create/update operations |
| Grade Submission | < 1s | < 2s | End-to-end submission |
| File Upload (1MB) | < 5s | < 10s | S3 upload completion |
| Chat Response (streaming) | < 3s | < 5s | First token received |
| Yjs Sync | < 500ms | < 1s | Between two clients |
| DataStore Query | < 200ms | < 500ms | observeQuery initial response |

### Throughput Targets

| Metric | Normal Load | Peak Load | Stress Load |
|--------|-------------|-----------|-------------|
| Concurrent Users | 50 | 200 | 500 |
| Requests/sec | 100 | 500 | 1000 |
| DB Connections | 20 | 100 | 200 |
| WebSocket Connections | 50 | 200 | 500 |

### Resource Utilization Limits

| Resource | Warning | Critical |
|----------|---------|----------|
| CPU Usage | > 70% | > 85% |
| Memory Usage | > 75% | > 90% |
| DB Connections | > 80% pool | > 95% pool |
| API Gateway Throttle | > 5% | > 10% |
| Lambda Cold Starts | > 10% | > 20% |

## Testing Tools

### Primary Tools

#### 1. k6 (Recommended for API Load Testing)

**Why k6:**
- Modern JavaScript-based load testing
- Excellent for GraphQL API testing
- Built-in WebSocket support
- Great reporting and metrics
- CI/CD friendly

**Installation:**
```bash
brew install k6  # macOS
# or
npm install -g k6
```

**Example k6 Script:**
```javascript
// load-tests/graphql-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
  },
};

export default function () {
  const query = `
    query ListUnits {
      listUnits(limit: 20) {
        items {
          id
          name
          status
        }
      }
    }
  `;

  const res = http.post(
    'https://your-api.amazonaws.com/graphql',
    JSON.stringify({ query }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN',
      },
    }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run k6 test:**
```bash
k6 run load-tests/graphql-load.js
```

#### 2. Artillery (Alternative for Complex Scenarios)

**Why Artillery:**
- YAML-based configuration
- Built-in support for HTTP, WebSocket, Socket.io
- Great for multi-step scenarios
- Excellent reporting

**Installation:**
```bash
npm install -g artillery
```

**Example Artillery Config:**
```yaml
# load-tests/artillery-config.yml
config:
  target: 'https://your-app.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 120
      arrivalRate: 100
      name: "Peak load"
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "Student Workflow"
    flow:
      - get:
          url: "/api/units"
          capture:
            json: "$.data[0].id"
            as: "unitId"
      - post:
          url: "/api/grades"
          json:
            unitId: "{{ unitId }}"
            accuracy: 85
            complete: true
```

**Run Artillery:**
```bash
artillery run load-tests/artillery-config.yml
```

#### 3. Lighthouse CI (Frontend Performance)

**Why Lighthouse CI:**
- Automated performance audits
- Core Web Vitals tracking
- Regression detection
- CI/CD integration

**Installation:**
```bash
npm install -g @lhci/cli
```

**Configuration:**
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/units',
        'http://localhost:3000/assignments',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

**Run Lighthouse CI:**
```bash
lhci autorun
```

### Supporting Tools

#### 4. AWS CloudWatch (Monitoring)

- Monitor Lambda execution times
- Track DynamoDB throttling
- Monitor API Gateway latency
- Set up alarms for thresholds

#### 5. Chrome DevTools Performance Profiler

- Record user interactions
- Identify rendering bottlenecks
- Analyze JavaScript execution
- Memory leak detection

#### 6. React DevTools Profiler

- Component render times
- Identify unnecessary re-renders
- Optimize component trees

## Test Scenarios

### Scenario 1: Normal Operating Load

**Profile:** Typical weekday usage

- **Users:** 50 concurrent
- **Duration:** 30 minutes
- **Operations:**
  - 60% read operations (view units, assignments)
  - 30% write operations (submit grades, upload files)
  - 10% real-time collaboration (Yjs editing)

**Success Criteria:**
- All response times within target
- Error rate < 0.1%
- No throttling or rate limiting

### Scenario 2: Peak Load (Class Release)

**Profile:** New assignment released to 200 students

- **Users:** 200 concurrent (spike in 5 minutes)
- **Duration:** 1 hour
- **Operations:**
  - Initial surge: 200 users access assignment (first 5 min)
  - Sustained: 100 users actively working (next 30 min)
  - Submission peak: 150 submissions (final 15 min)

**Success Criteria:**
- Response times within threshold
- Successful grade submission rate > 99%
- Auto-scaling responds within 2 minutes
- Error rate < 1%

### Scenario 3: Stress Test

**Profile:** Beyond expected capacity

- **Users:** 500 concurrent
- **Duration:** 15 minutes
- **Operations:** Mixed load (read/write/real-time)

**Success Criteria:**
- System remains stable (no crashes)
- Graceful degradation (slower, not broken)
- Clear error messages to users
- Recovery within 5 minutes after load ends

### Scenario 4: Sustained High Load

**Profile:** Extended period of high usage (exam period)

- **Users:** 100-150 concurrent
- **Duration:** 4 hours
- **Operations:** Consistent mixed load

**Success Criteria:**
- No memory leaks
- No connection pool exhaustion
- Consistent performance (no degradation over time)
- Error rate < 0.5%

### Scenario 5: Real-time Collaboration Stress

**Profile:** Multiple classes using Yjs simultaneously

- **Concurrent Editors:** 5-10 per document
- **Active Documents:** 20
- **Duration:** 30 minutes

**Success Criteria:**
- Sync latency < 500ms
- Data consistency 100%
- WebSocket connections stable
- No conflict resolution errors

## Test Execution Plan

### Phase 1: Baseline Establishment (Week 1)

1. Run Scenario 1 (Normal Load) to establish baseline
2. Document current performance metrics
3. Identify any immediate bottlenecks
4. Set up monitoring dashboards

### Phase 2: Capacity Testing (Week 2)

1. Run Scenario 2 (Peak Load)
2. Test auto-scaling behavior
3. Identify breaking points
4. Optimize resource allocation

### Phase 3: Stress Testing (Week 3)

1. Run Scenario 3 (Stress Test)
2. Verify graceful degradation
3. Test error handling and recovery
4. Document failure modes

### Phase 4: Endurance Testing (Week 4)

1. Run Scenario 4 (Sustained Load)
2. Monitor for memory leaks
3. Check connection pool health
4. Verify long-term stability

### Phase 5: Specialized Testing (Week 5)

1. Run Scenario 5 (Real-time Collaboration)
2. Test Yjs performance limits
3. Validate WebSocket scaling
4. Test conflict resolution at scale

## Monitoring and Metrics

### Key Metrics to Track

**Application Metrics:**
- Response time (p50, p95, p99)
- Throughput (requests/second)
- Error rate (%)
- Active users
- Database query times

**Infrastructure Metrics:**
- Lambda invocations and duration
- Lambda cold starts
- DynamoDB read/write capacity
- API Gateway latency
- S3 upload times
- WebSocket connection count

**User Experience Metrics:**
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

### Monitoring Tools

1. **AWS CloudWatch**
   - Set up dashboards for all AWS services
   - Configure alarms for threshold violations
   - Enable detailed monitoring for critical resources

2. **Application Performance Monitoring (APM)**
   - Consider: New Relic, Datadog, or AWS X-Ray
   - Track end-to-end request traces
   - Identify slow database queries
   - Monitor external API calls (OpenAI)

3. **Real User Monitoring (RUM)**
   - Track actual user experience
   - Geographic performance variations
   - Browser/device-specific issues

## Continuous Load Testing

### CI/CD Integration

**Add to deployment pipeline:**

1. **Pre-deployment (Staging):**
   ```bash
   # Run quick smoke test
   k6 run --duration 2m --vus 10 load-tests/smoke-test.js
   ```

2. **Post-deployment (Production):**
   ```bash
   # Run abbreviated load test
   k6 run --duration 5m --vus 25 load-tests/production-check.js
   ```

3. **Scheduled (Nightly):**
   ```bash
   # Run full test suite
   npm run test:load:full
   ```

### Regression Testing

- Run baseline tests before each major release
- Compare current metrics to baseline
- Flag significant performance regressions (> 20% slower)
- Require investigation before deployment

## Test Data Management

### Seed Data for Load Tests

Create realistic test data in sandbox environment:

```bash
# Seed test users (student1-500@example.com)
npm run sandbox:seed -- --users 500

# Seed test units and assignments
npm run sandbox:seed -- --units 100 --assignments 50

# Seed test grades
npm run sandbox:seed -- --grades 1000
```

### Data Cleanup

After load tests, clean up test data:

```bash
npm run sandbox:cleanup -- --date-range "last-24h"
```

## Recommendations

### Immediate Actions

1. **Set up k6** for API load testing (highest priority)
2. **Configure CloudWatch dashboards** for key metrics
3. **Run baseline tests** to establish current performance
4. **Document bottlenecks** discovered in testing

### Short-term (1-2 months)

1. Implement artillery for complex scenarios
2. Set up Lighthouse CI for frontend performance
3. Run monthly comprehensive load tests
4. Optimize identified bottlenecks

### Long-term (3-6 months)

1. Implement APM solution (AWS X-Ray or Datadog)
2. Set up automated regression testing
3. Create custom load testing for Yjs collaboration
4. Establish SLAs based on test results

## Performance Optimization Priorities

Based on architecture analysis, focus on:

1. **DataStore Subscription Optimization**
   - Reduce duplicate subscriptions
   - Implement efficient filtering
   - Test with large datasets

2. **Yjs Collaboration Scaling**
   - WebSocket connection pooling
   - Optimize sync frequency
   - Test with 10+ concurrent editors

3. **Lambda Cold Start Reduction**
   - Implement provisioned concurrency for critical functions
   - Optimize bundle sizes
   - Use Lambda layers for common dependencies

4. **DynamoDB Throughput**
   - Monitor and adjust on-demand capacity
   - Optimize query patterns
   - Implement caching where appropriate

5. **S3 Upload Performance**
   - Implement multipart uploads for large files
   - Use CloudFront for faster downloads
   - Optimize file processing

## Success Metrics

Load testing program is successful when:

- ✅ All benchmark targets are met under normal load
- ✅ System handles 2x expected peak load
- ✅ Graceful degradation under stress
- ✅ Monitoring catches issues before users
- ✅ Performance regressions detected in CI/CD
- ✅ Clear capacity planning data available

## Appendix

### Useful Commands

```bash
# k6 tests
k6 run load-tests/graphql-load.js
k6 run --vus 100 --duration 30s load-tests/quick-test.js

# Artillery tests
artillery run load-tests/artillery-config.yml
artillery quick --count 50 --num 10 https://your-app.com

# Lighthouse CI
lhci autorun
lhci collect --url="http://localhost:3000"

# AWS CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

### Resources

- [k6 Documentation](https://k6.io/docs/)
- [Artillery Documentation](https://www.artillery.io/docs)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [AWS Performance Testing Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/test-at-production-scale.html)
- [Web Vitals](https://web.dev/vitals/)
