# Observability and Event Replay Plan

Comprehensive telemetry, logging, monitoring, and event replay strategy for Amplify Homework Supply.

## Overview

This document outlines the strategy for collecting telemetry, logging errors, monitoring system health in AWS, and implementing event replay capabilities for debugging and recovery.

## Architecture Components

### 1. Logging Strategy

#### Frontend Logging (Next.js)
```javascript
// Centralized error tracking
- Browser errors → CloudWatch via API endpoint
- User actions → CloudWatch Logs Insights
- Performance metrics → CloudWatch RUM (Real User Monitoring)
```

**Implementation:**
- Create `/pages/api/log.js` endpoint to receive frontend logs
- Use AWS CloudWatch RUM SDK for browser monitoring
- Log levels: ERROR, WARN, INFO, DEBUG
- Include context: userId, sessionId, unitId, timestamp, userAgent

#### Backend Logging (Lambda Functions)

**Current Lambda functions to instrument:**
- `openai` - AI operations (chat, transcription, TTS)
- `analyzeDocument` - PDF processing
- `generateEmbedding/generateEmbeddings` - Vector operations
- `AdminQueries` - User management
- Custom API functions

**Standard log structure:**
```json
{
  "timestamp": "2026-01-09T10:30:00Z",
  "level": "ERROR|WARN|INFO|DEBUG",
  "requestId": "abc-123-def",
  "userId": "user-id",
  "function": "openai",
  "operation": "chat",
  "duration": 1234,
  "error": {
    "message": "OpenAI API timeout",
    "stack": "...",
    "code": "TIMEOUT"
  },
  "context": {
    "unitId": "unit-123",
    "model": "gpt-4"
  }
}
```

#### AppSync GraphQL Logging

Enable CloudWatch logging for AppSync:
- Request/response logging
- Field-level resolver logs
- Subscription connection logs
- Error logs with resolver context

#### DynamoDB & DataStore Logging

- Enable CloudWatch Contributor Insights for DynamoDB tables
- Track throttled requests, hot partitions
- Monitor DataStore sync conflicts and errors

---

### 2. Metrics & Telemetry Collection

#### CloudWatch Metrics

**Custom Metrics to Track:**

**Frontend Metrics:**
- `EditorSaveLatency` - Time to save unit content
- `DataStoreSyncTime` - DataStore synchronization duration
- `FileUploadDuration` - S3 upload times
- `APICallLatency` - GraphQL/REST API response times
- `ErrorRate` - Errors per minute by type
- `UserSessionDuration` - Active session length

**Backend Metrics:**
- `LambdaExecutionTime` - Per function
- `OpenAITokenUsage` - Track costs
- `OpenAILatency` - AI response times
- `DocumentProcessingTime` - PDF analysis duration
- `EmbeddingGenerationTime` - Vector creation time
- `S3UploadSuccess/Failure` - File operation success rate
- `DataStoreConflicts` - Sync conflict frequency

**Business Metrics:**
- `ActiveUsers` - Daily/weekly active users
- `UnitsCreated` - Content creation rate
- `AssignmentsCompleted` - Student progress
- `GradesSubmitted` - Submission rate
- `AudioGenerations` - TTS usage
- `ChatMessages` - AI assistant usage

#### AWS X-Ray Tracing

Enable X-Ray for distributed tracing:
- AppSync → Lambda → DynamoDB/S3 traces
- Frontend API calls → Backend traces
- Identify bottlenecks and latency issues
- Trace OpenAI API calls

**Implementation:**
```javascript
// In Lambda functions
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

// Capture subsegments for external calls
const segment = AWSXRay.getSegment();
const subsegment = segment.addNewSubsegment('OpenAI-Chat');
try {
  const result = await openai.chat.completions.create(...);
  subsegment.close();
  return result;
} catch (error) {
  subsegment.addError(error);
  subsegment.close();
  throw error;
}
```

---

### 3. Monitoring & Alerting

#### CloudWatch Dashboards

**Dashboard 1: System Health**
- Lambda error rates (by function)
- API Gateway 4xx/5xx errors
- DynamoDB read/write throttles
- S3 error rates
- DataStore sync errors

**Dashboard 2: Performance**
- Lambda execution durations (p50, p95, p99)
- AppSync query latencies
- DynamoDB latencies
- S3 upload/download times
- Frontend page load times (CloudWatch RUM)

**Dashboard 3: Business Metrics**
- Active users (daily/weekly)
- Content creation (units, assignments)
- Student engagement (grades, submissions)
- AI usage (tokens, generations)
- Cost metrics (OpenAI spend, AWS costs)

**Dashboard 4: AI Operations**
- OpenAI API latency and errors
- Token usage by operation type
- Audio transcription/generation rates
- Document processing pipeline status
- Embedding generation metrics

#### CloudWatch Alarms

**Critical Alarms (PagerDuty/SNS):**
- Lambda error rate > 5% (5-minute window)
- AppSync 5xx errors > 10/minute
- DynamoDB throttling > 50 requests/minute
- S3 upload failure rate > 10%
- OpenAI API failures > 20% (cost protection)
- DataStore sync failures > 100/hour

**Warning Alarms (Email/Slack):**
- Lambda duration approaching timeout (> 80%)
- DynamoDB consumed capacity > 80%
- OpenAI token usage > daily budget
- Unusual error patterns (CloudWatch Anomaly Detection)
- High latency (p95 > threshold)

#### CloudWatch Logs Insights Queries

**Pre-built queries for common investigations:**

```sql
-- Find all errors in last hour
fields @timestamp, @message, level, function, error.message
| filter level = "ERROR"
| sort @timestamp desc
| limit 100

-- Track OpenAI API failures
fields @timestamp, function, operation, error.message, context.model
| filter function = "openai" and level = "ERROR"
| stats count() by operation, error.message

-- Slow Lambda executions
fields @timestamp, function, duration, operation
| filter duration > 3000
| sort duration desc
| limit 50

-- User-specific error investigation
fields @timestamp, @message, function, operation, error
| filter userId = "user-xyz"
| sort @timestamp desc

-- DataStore sync conflicts
fields @timestamp, @message, model, conflictType
| filter @message like /DataStore.*conflict/
| stats count() by model, conflictType
```

---

### 4. Event Replay Architecture

#### Why Event Replay?

- Debug production issues by replaying exact sequence
- Recover from data corruption or bugs
- Test fixes against real production scenarios
- Audit trail for compliance

#### Strategy 1: DynamoDB Streams + Event Archive

**Architecture:**
```
DynamoDB Tables
    ↓ (Streams enabled)
Lambda Function (Event Processor)
    ↓
EventBridge Event Bus
    ↓ (Archive enabled)
S3 Bucket (Event Archive)
    ↓ (When needed)
Replay Lambda → Reconstruct State
```

**Implementation Steps:**

1. **Enable DynamoDB Streams on all tables**
   ```bash
   amplify update api
   # Select "Yes" for DynamoDB Streams
   # Choose "New and old images" for stream view type
   ```

2. **Create Event Processor Lambda**
   ```javascript
   // amplify/backend/function/eventProcessor/src/index.js
   const { EventBridge } = require('@aws-sdk/client-eventbridge');
   const eventbridge = new EventBridge();

   exports.handler = async (event) => {
     const entries = event.Records.map(record => ({
       Time: new Date(record.dynamodb.ApproximateCreationDateTime * 1000),
       Source: 'homework-supply.datastore',
       DetailType: `${record.eventName}`,
       Detail: JSON.stringify({
         tableName: record.eventSourceARN.split('/')[1],
         keys: record.dynamodb.Keys,
         oldImage: record.dynamodb.OldImage,
         newImage: record.dynamodb.NewImage,
         eventId: record.eventID,
         userIdentity: record.userIdentity
       })
     }));

     await eventbridge.putEvents({ Entries: entries });
   };
   ```

3. **Enable EventBridge Archive**
   - Archive all events for 90 days (configurable)
   - Tag events by severity, user, operation
   - Query archive by time range, pattern

4. **Create Replay Infrastructure**
   ```javascript
   // amplify/backend/function/eventReplay/src/index.js
   const { EventBridge } = require('@aws-sdk/client-eventbridge');
   
   exports.handler = async (event) => {
     const { startTime, endTime, pattern, targetQueue } = event;
     
     const params = {
       ArchiveName: 'homework-supply-events',
       EventStartTime: new Date(startTime),
       EventEndTime: new Date(endTime),
       Destination: {
         Arn: targetQueue // SQS queue for controlled replay
       }
     };
     
     if (pattern) {
       params.EventPattern = JSON.stringify(pattern);
     }
     
     const replay = await eventbridge.startReplay(params);
     return replay;
   };
   ```

#### Strategy 2: CloudWatch Logs as Event Source

For Lambda-level replay:

1. **Structured logging in all Lambdas**
   ```javascript
   // Add to all Lambda handlers
   const logEvent = (operation, data, result, error) => {
     console.log(JSON.stringify({
       timestamp: new Date().toISOString(),
       operation,
       input: data,
       output: result,
       error,
       requestId: context.requestId,
       replay: true // Flag for replay
     }));
   };
   ```

2. **Extract events from CloudWatch Logs**
   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/lambda/openai \
     --start-time 1704844800000 \
     --filter-pattern '{ $.replay = true }' \
     --query 'events[*].message' \
     --output text > events.jsonl
   ```

3. **Replay Lambda**
   ```javascript
   // Read events.jsonl and re-execute operations
   const replayEvents = async (eventsFile) => {
     const events = readEventsFromFile(eventsFile);
     for (const event of events) {
       // Re-execute with original input
       await executeLambda(event.operation, event.input);
     }
   };
   ```

#### Strategy 3: S3 Event Logging for File Operations

**Track all file operations:**
```javascript
// src/utils/fileUploadUtils.js enhancement
export const uploadWithLogging = async (key, file, options) => {
  const eventId = uuid();
  const event = {
    eventId,
    timestamp: Date.now(),
    operation: 'UPLOAD',
    key,
    size: file.size,
    contentType: file.type,
    userId: getCurrentUser().username
  };
  
  // Log to EventBridge
  await logFileEvent(event);
  
  try {
    const result = await uploadData({ key, data: file, options }).result;
    await logFileEvent({ ...event, status: 'SUCCESS', result });
    return result;
  } catch (error) {
    await logFileEvent({ ...event, status: 'FAILED', error });
    throw error;
  }
};
```

---

### 5. Implementation Roadmap

#### Phase 1: Foundation (Week 1-2)

- [ ] Enable CloudWatch Logs for all Lambda functions
- [ ] Set up structured logging format across all Lambdas
- [ ] Enable AppSync logging (request/response)
- [ ] Create frontend logging API endpoint (`/api/log.js`)
- [ ] Enable DynamoDB Contributor Insights

#### Phase 2: Metrics & Dashboards (Week 3-4)

- [ ] Implement custom CloudWatch metrics in Lambdas
- [ ] Create "System Health" dashboard
- [ ] Create "Performance" dashboard
- [ ] Set up basic alarms (errors, latency)
- [ ] Add CloudWatch RUM to frontend

#### Phase 3: Tracing (Week 5-6)

- [ ] Enable AWS X-Ray on AppSync
- [ ] Add X-Ray SDK to all Lambda functions
- [ ] Instrument OpenAI calls with subsegments
- [ ] Create service map visualizations

#### Phase 4: Event Replay (Week 7-8)

- [ ] Enable DynamoDB Streams on all tables
- [ ] Create Event Processor Lambda
- [ ] Set up EventBridge with Archive
- [ ] Build Replay Lambda function
- [ ] Create admin UI for event replay

#### Phase 5: Advanced Monitoring (Week 9-10)

- [ ] Implement CloudWatch Anomaly Detection
- [ ] Create "Business Metrics" dashboard
- [ ] Set up cost tracking and budgets
- [ ] Build alert aggregation (PagerDuty/Slack)
- [ ] Create runbooks for common issues

---

### 6. Cost Optimization

**Estimated Monthly Costs (assuming 1000 active users):**

- CloudWatch Logs: ~$50-100 (5GB ingestion, 30-day retention)
- CloudWatch Metrics: ~$30 (100 custom metrics)
- CloudWatch Dashboards: $3/dashboard
- CloudWatch RUM: ~$100 (1M events)
- AWS X-Ray: ~$50 (1M traces)
- EventBridge Archive: ~$20 (1GB/month storage)
- **Total: ~$250-350/month**

**Cost Reduction Strategies:**
- Use CloudWatch Logs Insights instead of exporting to S3
- Sample X-Ray traces (10-20% instead of 100%)
- Reduce log retention to 7-14 days for non-critical logs
- Use log filtering to reduce ingestion volume
- Archive old events to S3 Glacier

---

### 7. Development Tools

#### Local Development Logging

```javascript
// src/utils/logger.js
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  error: (message, context) => {
    console.error(message, context);
    if (!isDev) sendToCloudWatch('ERROR', message, context);
  },
  warn: (message, context) => {
    console.warn(message, context);
    if (!isDev) sendToCloudWatch('WARN', message, context);
  },
  info: (message, context) => {
    if (isDev) console.log(message, context);
    if (!isDev) sendToCloudWatch('INFO', message, context);
  },
  debug: (message, context) => {
    if (isDev) console.debug(message, context);
  }
};

// Use throughout app
logger.error('Failed to save unit', { unitId, error });
```

#### Testing Event Replay

```javascript
// cypress/e2e/event-replay.cy.js
describe('Event Replay', () => {
  it('should replay user actions', () => {
    // Record events during test
    cy.intercept('POST', '/api/log', (req) => {
      cy.writeFile('cypress/fixtures/events.json', req.body, { flag: 'a+' });
    });
    
    // Perform actions
    cy.visit('/unit/new');
    cy.get('[data-testid="unit-name"]').type('Test Unit');
    cy.get('[data-testid="save-button"]').click();
    
    // Later: Replay events
    cy.fixture('events.json').then((events) => {
      cy.task('replayEvents', events);
    });
  });
});
```

---

### 8. Debugging Workflows

#### Scenario 1: User Reports "Save Failed"

1. Search CloudWatch Logs for userId + "save" + ERROR
2. Check X-Ray trace for the request
3. Identify failing component (DataStore, Lambda, S3)
4. Extract event sequence from EventBridge archive
5. Replay events in staging environment
6. Fix bug, deploy, verify with replay

#### Scenario 2: "AI Chat Not Working"

1. Check CloudWatch Dashboard - OpenAI metrics
2. Review `/aws/lambda/openai` logs for errors
3. Check X-Ray trace for timeout/errors
4. Verify API key in SSM Parameter Store
5. Test with same input via Lambda console
6. Review EventBridge events for chat messages

#### Scenario 3: "Grade Not Updating"

1. Search DataStore sync logs for Grade model
2. Check DynamoDB Streams for Grade table updates
3. Review AppSync resolver logs
4. Identify conflict or authorization issue
5. Replay DynamoDB events to reconstruct state
6. Fix sync logic, test with replay

---

### 9. Security & Compliance

#### Log Sanitization

Never log:
- User passwords or tokens
- API keys (OpenAI, AWS credentials)
- PII without hashing (email, phone)
- Full S3 signed URLs (contain credentials)

**Implement log scrubbing:**
```javascript
const sanitizeLog = (data) => {
  const sensitive = ['password', 'token', 'apiKey', 'secret'];
  const sanitized = { ...data };
  
  for (const key of sensitive) {
    if (sanitized[key]) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
};
```

#### Access Control

- Restrict CloudWatch Logs access to admins only
- Use IAM roles for event replay (separate from production)
- Encrypt EventBridge archives with KMS
- Audit log access via CloudTrail

---

### 10. Next Steps

1. **Review and approve** this plan
2. **Prioritize phases** based on immediate needs
3. **Allocate time** for implementation (10 weeks total)
4. **Set up staging environment** for testing
5. **Create runbooks** for common debugging scenarios
6. **Train team** on CloudWatch Logs Insights queries
7. **Schedule monthly reviews** of dashboards and metrics

---

## References

- [AWS CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [AWS X-Ray](https://docs.aws.amazon.com/xray/latest/devguide/)
- [EventBridge Archive and Replay](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-archive-event.html)
- [DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)
- [CloudWatch RUM](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-RUM.html)
