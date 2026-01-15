# Monitoring & Alerting Runbook

## Document Status

**Last Updated**: January 14, 2026  
**Status**: DRAFT - Actual monitoring configuration unknown  
**Owner**: Infrastructure Team  

## Purpose

This document describes monitoring and alerting procedures for the AWS multi-account infrastructure.

## Current Monitoring Status

**Critical Disclaimer**: The actual configuration of monitoring and alerting is UNKNOWN. This document describes what SHOULD exist, not what DOES exist.

### Verification Required

Before relying on this runbook:
1. Verify CloudTrail is enabled in all accounts
2. Verify CloudWatch alarms are configured
3. Verify Security Hub is enabled and integrated
4. Verify AWS Config rules are deployed
5. Verify notification destinations (SNS topics, email, etc.)
6. Test that alerts actually trigger and reach on-call personnel

## AWS Services Available for Monitoring

### CloudTrail
**Purpose**: API activity logging and audit trail  
**Status**: UNKNOWN if enabled  
**Expected Configuration**:
- Enabled in all accounts
- Logs centralized to management account S3 bucket
- Log file integrity validation enabled
- CloudWatch Logs integration enabled

**What It Does NOT Do**:
- Does not alert automatically
- Does not detect anomalies automatically
- Logs only AWS API calls, not application-level events

### CloudWatch
**Purpose**: Metrics, logs, and alarms  
**Status**: Available but specific configuration UNKNOWN

**Expected Metrics**:
- Lambda invocation count, errors, duration
- DynamoDB read/write capacity, throttles
- API Gateway requests, latency, errors
- Cognito authentication attempts, failures

**What It Does NOT Do**:
- Does not configure alarms automatically
- Does not correlate events across services automatically

### AWS Config
**Purpose**: Resource configuration tracking and compliance  
**Status**: UNKNOWN if enabled

**Expected Rules**:
- S3 bucket encryption enabled
- CloudTrail enabled
- IAM password policy compliance
- Security group ingress restrictions

**What It Does NOT Do**:
- Does not prevent non-compliant configurations (only detects)
- Does not alert automatically without SNS configuration

### Security Hub
**Purpose**: Centralized security findings  
**Status**: UNKNOWN if enabled

**Expected Integrations**:
- GuardDuty (anomaly detection)
- Inspector (vulnerability scanning)
- IAM Access Analyzer
- Config compliance findings

**What It Does NOT Do**:
- Does not remediate issues automatically
- Requires manual review unless alerts configured

### GuardDuty
**Purpose**: Threat detection using ML  
**Status**: UNKNOWN if enabled

**Detects**:
- Compromised credentials
- Unusual API activity
- Cryptocurrency mining
- Data exfiltration attempts

## Monitoring by Account

### Management Account (et-mgmt)

**What to Monitor**:
- Organization-wide CloudTrail activity
- Billing anomalies
- Organization structure changes (new accounts, OU changes)
- SCP modifications

**Critical Alerts** (UNDEFINED - not known if configured):
- New IAM user created in management account
- Root account usage
- Organization policy changes
- Billing threshold exceeded

### Shared Services Account (et-shared)

**What to Monitor**:
- CI/CD pipeline failures
- Cross-account role assumption attempts
- Failed deployments
- Unusual API activity

**Critical Alerts** (UNDEFINED - not known if configured):
- Pipeline failure
- Unauthorized access attempt
- Cross-account role assumption from unknown source

### Customer Accounts (Institution OU)

**What to Monitor**:
- Application errors (Lambda, API Gateway)
- Authentication failures (Cognito)
- Database throttling (DynamoDB)
- Storage capacity (S3)
- Unauthorized data access attempts

**Critical Alerts** (UNDEFINED - not known if configured):
- High error rate (> 5% of requests)
- Repeated authentication failures (brute force attempt)
- DynamoDB throttling (capacity issue)
- CloudTrail disabled
- Data access from unexpected IP range

## Alert Severity Definitions

| Severity | Response Time | Examples | Action |
|----------|--------------|----------|--------|
| **P0 - Critical** | Immediate | Service down, data breach, CloudTrail disabled | Page on-call immediately |
| **P1 - High** | 15 minutes | High error rate, authentication service degraded | Alert on-call |
| **P2 - Medium** | 1 hour | Elevated errors, capacity warning | Create ticket, notify during business hours |
| **P3 - Low** | Next business day | Config drift, cost anomaly | Create ticket |

**Current Status**: Alert severity thresholds NOT defined in AWS

## Alerting Channels

**Status**: UNDEFINED

**Required Configuration** (not known if exists):
- SNS topics for alerts
- Email distribution lists
- PagerDuty/OpsGenie integration: UNKNOWN
- Slack integration: UNKNOWN
- On-call rotation: UNDEFINED

## Critical Alarms (Should Exist - Status Unknown)

### Security Alarms

| Alarm Name | Condition | Threshold | Current Status |
|------------|-----------|-----------|----------------|
| CloudTrail Disabled | CloudTrail log delivery stopped | Any occurrence | UNKNOWN |
| Root Account Usage | Root credentials used | Any occurrence | UNKNOWN |
| IAM Policy Changes | IAM policy modified | Any occurrence | UNKNOWN |
| Security Group Changes | Security group made overly permissive (0.0.0.0/0) | Any occurrence | UNKNOWN |
| Unusual API Activity | API calls from new region or IP | Unusual pattern | UNKNOWN |
| Failed Authentication | Cognito auth failures | > 10 in 5 minutes from same IP | UNKNOWN |
| MFA Disabled | MFA disabled for user | Any occurrence | UNKNOWN |

### Application Alarms

| Alarm Name | Condition | Threshold | Current Status |
|------------|-----------|-----------|----------------|
| Lambda Errors | Lambda function errors | > 5% error rate | UNKNOWN |
| API Gateway 5XX | API Gateway server errors | > 1% of requests | UNKNOWN |
| DynamoDB Throttles | DynamoDB read/write throttles | > 10 in 5 minutes | UNKNOWN |
| Cognito Failures | Authentication service errors | > 5% failure rate | UNKNOWN |

### Operational Alarms

| Alarm Name | Condition | Threshold | Current Status |
|------------|-----------|-----------|----------------|
| High Latency | API response time | > 3 seconds (p99) | UNKNOWN |
| Low Disk Space | EBS volume utilization | > 80% | UNKNOWN |
| High CPU | EC2/Lambda CPU usage | > 80% sustained | UNKNOWN |
| Billing Anomaly | Daily costs | > 20% increase over baseline | UNKNOWN |

## Monitoring Dashboards

**Status**: UNDEFINED

**Should Exist** (not known if configured):
- Executive dashboard: Service health overview
- Security dashboard: Security findings, compliance status
- Application dashboard: Error rates, latency, throughput per customer account
- Cost dashboard: Daily spend by account and service

**Current Location**: UNKNOWN

## Log Retention

**Status**: UNDEFINED

**Should Be Defined**:
- CloudTrail logs: [RETENTION PERIOD - UNDEFINED]
- CloudWatch Logs: [RETENTION PERIOD - UNDEFINED]
- Application logs: [RETENTION PERIOD - UNDEFINED]
- VPC Flow Logs: [IF ENABLED - UNKNOWN, RETENTION - UNDEFINED]

**FERPA Requirement**: Logs containing student data must be protected for same period as student records and deleted accordingly.

## Responding to Alerts

### General Response Process

1. **Acknowledge Alert**
   - Confirm receipt
   - Note acknowledgment time
   - Begin investigation

2. **Assess Severity**
   - Is service impacted?
   - Is student data at risk?
   - Is this a false positive?

3. **Investigate**
   - Check CloudTrail for related API calls
   - Review CloudWatch logs
   - Check Security Hub for related findings
   - Correlate with recent changes

4. **Remediate**
   - Follow incident response procedures if security incident
   - Deploy fix if application issue
   - Adjust alarm threshold if false positive

5. **Document**
   - Record findings in incident ticket
   - Update this runbook if new alert type
   - Post-mortem for P0/P1 incidents

### Specific Alert Responses

#### CloudTrail Disabled

**Immediate Actions**:
1. Re-enable CloudTrail immediately
2. Investigate who disabled it (check CloudTrail logs before gap)
3. Assume security incident until proven otherwise
4. Check for unauthorized resource changes during gap
5. Report to security team

**Follow-up**:
- Implement SCP to prevent CloudTrail deletion
- Add Config rule to detect CloudTrail disabled
- Review IAM permissions

#### High Error Rate

**Immediate Actions**:
1. Check CloudWatch dashboard for affected component
2. Review recent deployments (rollback if needed)
3. Check dependency services (DynamoDB, Cognito)
4. Review Lambda/API Gateway logs for error details

**Escalation**:
- If error rate > 10%: Page on-call immediately
- If impacting multiple customers: Escalate to incident commander

#### Authentication Failures

**Immediate Actions**:
1. Determine if brute force attack or service issue
2. Check source IP addresses (single IP or distributed)
3. If attack: Consider temporary IP blocking via WAF (if configured)
4. If service issue: Check Cognito service health

**Do NOT**:
- Lock out legitimate users
- Block IP ranges without investigation

#### DynamoDB Throttling

**Immediate Actions**:
1. Check current read/write capacity vs. usage
2. Identify which table is throttled
3. Check for unusual query patterns
4. Temporary fix: Increase provisioned capacity (if using provisioned mode)

**Long-term**:
- Consider switching to on-demand mode
- Optimize queries
- Implement caching

#### Unusual API Activity

**Immediate Actions**:
1. Identify API calls, source IP, and IAM principal
2. Determine if legitimate or malicious
3. If suspicious: Disable credentials immediately
4. Preserve CloudTrail logs for investigation

**Escalation**:
- If confirmed malicious: Follow incident response plan
- If credentials compromised: Rotate all credentials

## Proactive Monitoring Tasks

**Status**: UNDEFINED - Not known if anyone performs these

### Daily Tasks (Should Be Done)

- [ ] Review Security Hub findings
- [ ] Check CloudWatch alarm status
- [ ] Review cost trends for anomalies
- [ ] Check backup success/failure

### Weekly Tasks (Should Be Done)

- [ ] Review CloudTrail for unusual patterns
- [ ] Review IAM credential usage and age
- [ ] Review Config compliance dashboard
- [ ] Review application error trends

### Monthly Tasks (Should Be Done)

- [ ] Review and update alarm thresholds
- [ ] Review IAM permissions (least privilege audit)
- [ ] Test disaster recovery procedures
- [ ] Review and archive old logs

## Testing Procedures

**Status**: NO TESTING CONDUCTED

**Should Be Tested**:
- [ ] Trigger test alert to verify on-call receives it
- [ ] Simulate CloudTrail disabled (in test account)
- [ ] Simulate high error rate
- [ ] Verify alert escalation paths
- [ ] Test dashboard accessibility

**Frequency**: Quarterly

## Known Gaps

This runbook describes what SHOULD exist. The following are UNKNOWN:

- ❌ Whether any CloudWatch alarms are actually configured
- ❌ Whether SNS topics exist for notifications
- ❌ Whether anyone receives alerts
- ❌ Whether on-call rotation exists
- ❌ Whether Security Hub is enabled
- ❌ Whether GuardDuty is enabled
- ❌ Whether Config rules are deployed
- ❌ What the actual alert thresholds are
- ❌ Whether dashboards exist
- ❌ Whether anyone monitors logs proactively

## Making This Runbook Operational

To make this runbook accurate and useful:

1. **Audit Existing Configuration**
   - Check each account for CloudTrail status
   - List all existing CloudWatch alarms
   - Document SNS topics and subscribers
   - Verify Security Hub and GuardDuty status

2. **Define and Configure Missing Alarms**
   - Create SNS topics for alert routing
   - Configure CloudWatch alarms per tables above
   - Set up email/PagerDuty/Slack notifications
   - Test each alarm triggers correctly

3. **Establish On-Call**
   - Define on-call rotation
   - Document contact information
   - Integrate with PagerDuty/OpsGenie
   - Test alert delivery

4. **Create Dashboards**
   - CloudWatch dashboards for each account
   - Security Hub dashboard
   - Cost dashboard

5. **Document Baselines**
   - Normal error rates
   - Normal traffic patterns
   - Normal API call volumes
   - Use baselines to set thresholds

6. **Test and Validate**
   - Trigger test alerts
   - Conduct tabletop exercises
   - Update runbook based on findings

## Related Documents

- [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md) - Incident response procedures
- [ACCOUNT-ARCHITECTURE.md](ACCOUNT-ARCHITECTURE.md) - Account structure
- [SECURITY-OPERATIONS-RUNBOOK.md](SECURITY-OPERATIONS-RUNBOOK.md) - (To be created)

## CloudWatch Alarms Quick Reference

### Creating an Alarm via AWS CLI

```bash
# Example: Lambda error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "lambda-error-rate-high" \
  --alarm-description "Lambda error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=my-function \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:my-topic
```

### Viewing Active Alarms

```bash
# List alarms in ALARM state
aws cloudwatch describe-alarms --state-value ALARM

# List all alarms
aws cloudwatch describe-alarms
```

### Checking CloudTrail Status

```bash
# Check CloudTrail status
aws cloudtrail get-trail-status --name my-trail

# List all trails
aws cloudtrail describe-trails
```

---

**CRITICAL**: This runbook documents what monitoring SHOULD exist, not what DOES exist. Verify actual AWS configurations before relying on any alerts or assuming monitoring is in place. An undefined monitoring system provides no protection.
