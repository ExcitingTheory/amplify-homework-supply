# Disaster Recovery Plan

## Document Status

**Last Updated**: January 14, 2026  
**Status**: TEMPLATE - Actual backup/DR configuration unknown  
**Owner**: Infrastructure Team  
**Test Status**: NEVER TESTED  

---

**NOTICE**: This plan documents what SHOULD exist for disaster recovery. Actual backup configurations, recovery procedures, and capabilities are UNKNOWN and UNTESTED. Do not assume disaster recovery capability exists.

---

## Purpose

This plan defines procedures to recover from disasters affecting the AWS infrastructure and student data.

## Scope

This plan covers:
- Data loss (accidental deletion, corruption, ransomware)
- AWS service outages (regional or service-specific)
- Account compromise or unauthorized access
- Natural disasters affecting AWS regions
- Complete account deletion

## Recovery Objectives

**Status**: UNDEFINED

**Must Be Defined Per Customer Account**:

| Account | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) | Status |
|---------|-------------------------------|--------------------------------|--------|
| Management | [UNDEFINED] | [UNDEFINED] | NOT DEFINED |
| Shared Services | [UNDEFINED] | [UNDEFINED] | NOT DEFINED |
| Customer Account 1 | [UNDEFINED] | [UNDEFINED] | NOT DEFINED |
| Customer Account 2 (us-east-1) | [UNDEFINED] | [UNDEFINED] | NOT DEFINED |
| Customer Account 2 (ap-southeast-1) | [UNDEFINED] | [UNDEFINED] | NOT DEFINED |
| Hosting Account | [UNDEFINED] | [UNDEFINED] | NOT DEFINED |

**RTO** = How long can service be down?  
**RPO** = How much data can we afford to lose?

**Examples** (NOT our actual targets):
- RTO: 4 hours = Service must be restored within 4 hours
- RPO: 1 hour = Can lose up to 1 hour of data

## Current Backup Status

**Critical Disclaimer**: Actual backup configuration is UNKNOWN. The following describes what COULD be configured, not what IS configured.

### DynamoDB Backups

**Point-in-Time Recovery (PITR)**:
- **Status**: UNKNOWN if enabled
- **If enabled**: Can restore to any point in last 35 days
- **If disabled**: No automatic backups

**On-Demand Backups**:
- **Status**: UNKNOWN if created
- **Retention**: UNKNOWN
- **Schedule**: UNKNOWN

**Verification Required**:
```bash
# Check if PITR enabled
aws dynamodb describe-continuous-backups --table-name [TABLE_NAME]

# List on-demand backups
aws dynamodb list-backups
```

### S3 Data

**Versioning**:
- **Status**: UNKNOWN if enabled
- **If enabled**: All versions of objects retained
- **If disabled**: Deleted objects are gone forever

**Replication**:
- **Cross-region replication**: NOT configured (confirmed by architecture)
- **Same-region replication**: UNKNOWN

**Lifecycle Policies**:
- **Status**: UNKNOWN
- **Old version retention**: UNKNOWN

**Verification Required**:
```bash
# Check versioning status
aws s3api get-bucket-versioning --bucket [BUCKET_NAME]

# Check replication
aws s3api get-bucket-replication --bucket [BUCKET_NAME]
```

### RDS/Aurora (if applicable)

**Automated Backups**:
- **Status**: UNKNOWN if RDS/Aurora exists
- **If exists**: Retention period UNKNOWN
- **Backup window**: UNKNOWN

**Snapshots**:
- **Manual snapshots**: UNKNOWN if created
- **Retention**: UNKNOWN

### EBS Volumes (if applicable)

**Snapshots**:
- **Status**: UNKNOWN if EC2 instances exist
- **Schedule**: UNKNOWN
- **Retention**: UNKNOWN

### Application Code

**Repository**:
- **Location**: Git repository (location UNDEFINED)
- **Backup**: Assumed backed up by Git provider
- **Recovery**: Re-deploy from Git

### Infrastructure as Code (CDK)

**Repository**:
- **Location**: This repository (`accounts/` directories)
- **Backup**: Git repository
- **Recovery**: Re-deploy infrastructure from code

## Disaster Scenarios

### Scenario 1: Accidental Data Deletion

**Example**: Administrator accidentally deletes DynamoDB table or S3 bucket

**Current Capability**: UNKNOWN

**Recovery Procedure** (if backups exist):

1. **Assess Scope**
   - What was deleted?
   - When was it deleted?
   - How much data affected?

2. **Check Backup Availability**
   - DynamoDB: Check PITR status and on-demand backups
   - S3: Check if versioning enabled, check for deleted object markers

3. **Restore from Backup**
   
   **DynamoDB PITR**:
   ```bash
   aws dynamodb restore-table-to-point-in-time \
     --source-table-name original-table \
     --target-table-name restored-table \
     --restore-date-time 2026-01-14T12:00:00Z
   ```
   
   **S3 Versioning**:
   ```bash
   # List deleted objects
   aws s3api list-object-versions --bucket BUCKET --prefix PREFIX
   
   # Restore specific version
   aws s3api copy-object \
     --bucket BUCKET \
     --copy-source BUCKET/KEY?versionId=VERSION \
     --key KEY
   ```

4. **Verify Data Integrity**
   - Compare record counts
   - Validate data consistency
   - Test application functionality

5. **Document Incident**
   - What happened
   - How it was recovered
   - Lessons learned

**Recovery Time**: UNKNOWN (depends on data size and backup method)

**Data Loss**: UNKNOWN (depends on RPO)

### Scenario 2: Data Corruption or Ransomware

**Example**: Application bug corrupts student records, or ransomware encrypts data

**Current Capability**: UNKNOWN

**Recovery Procedure**:

1. **Immediately Stop Writes**
   - Disable application access
   - Prevent corruption from spreading
   - DO NOT delete corrupted data yet (may need for forensics)

2. **Identify Last Known Good State**
   - When did corruption start?
   - What data is affected?
   - What backups exist before corruption?

3. **Restore from Clean Backup**
   - Restore to point before corruption occurred
   - Verify restored data is clean
   - Data created after backup point will be lost

4. **Recover Lost Data** (if possible)
   - Replay CloudTrail events to recreate transactions
   - Request data re-submission from users (if applicable)
   - Accept data loss if within RPO

5. **Forensic Investigation**
   - How did corruption occur?
   - Fix application bug or security vulnerability
   - Prevent recurrence

**Recovery Time**: UNKNOWN

**Data Loss**: All data created between last backup and corruption discovery

### Scenario 3: AWS Region Failure

**Example**: us-east-1 region experiences prolonged outage

**Current Capability**: NONE - No multi-region failover configured

**Multi-Region Architecture**:
- Customer Account 2: Has resources in both us-east-1 and ap-southeast-1
- Data does NOT replicate between regions
- Each region operates independently

**If us-east-1 Fails**:
- Customer Account 1: COMPLETE OUTAGE (only in us-east-1)
- Customer Account 2: Partial outage
  - Students in us-east-1 region: Affected
  - Students in ap-southeast-1 region: Unaffected (different data)

**Recovery Options** (NOT currently implemented):

1. **Wait for AWS to restore region**
   - No action required from us
   - Downtime: Unknown (hours to days)

2. **Deploy to alternate region** (requires preparation):
   - Restore backups to new region
   - Update DNS to point to new region
   - Downtime: Hours to days depending on data size

**Preparation Required** (NOT done):
- Cross-region backup replication
- Infrastructure as Code to deploy in any region
- DNS failover configuration
- Documented failover procedures
- Regular failover testing

**Current Status**: NO MULTI-REGION FAILOVER CAPABILITY

### Scenario 4: Account Compromise

**Example**: Attacker gains access to AWS account and deletes resources

**Current Capability**: Limited

**Immediate Actions**:

1. **Contain the Breach**
   - Disable compromised IAM credentials
   - Apply restrictive SCPs
   - Enable termination protection on critical resources
   - See: [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md)

2. **Assess Damage**
   - What was deleted or modified?
   - What data was accessed?
   - Check CloudTrail for attacker actions

3. **Preserve Evidence**
   - Take snapshots of affected resources
   - Save CloudTrail logs
   - DO NOT delete attacker's actions from logs

4. **Restore from Backups**
   - Restore deleted resources
   - Verify backups weren't compromised
   - Rotate all credentials before restore

5. **Secure Environment**
   - Fix vulnerability that allowed compromise
   - Implement additional controls
   - Monitor for attacker return

**Recovery Time**: UNKNOWN

**FERPA Notification**: Required if student data accessed - see incident response plan

### Scenario 5: Complete Account Deletion

**Example**: AWS account closed or deleted (accidentally or maliciously)

**Current Capability**: MINIMAL

**Prevention**:
- AWS account deletion requires contacting AWS Support
- 90-day grace period before permanent deletion

**Recovery**:
- Contact AWS Support immediately
- Request account recovery (if within grace period)
- If data deleted permanently: CATASTROPHIC - no recovery unless off-AWS backups exist

**Current Status**: NO OFF-AWS BACKUPS KNOWN

**Recommendation**: Export critical backups to external storage (outside AWS)

## Recovery Procedures by Service

### Cognito User Pools

**Backup**: UNKNOWN if users exported

**Recovery**:
- Cognito does not support user import with passwords
- Users must reset passwords after recovery
- Export user list regularly for disaster recovery

**Current Status**: USER BACKUP PROCESS UNDEFINED

### API Gateway / AppSync

**Backup**: Infrastructure defined in code (CDK)

**Recovery**:
- Re-deploy from CDK code
- API endpoints will change unless custom domains configured
- Client applications may need updates

**Recovery Time**: Minutes to hours (if code current)

### Lambda Functions

**Backup**: Code in Git repository

**Recovery**:
- Re-deploy from CI/CD pipeline
- Environment variables must be reconfigured
- IAM roles must be recreated

**Recovery Time**: Minutes to hours

### CloudFront (if configured)

**Backup**: Infrastructure as code

**Recovery**:
- Re-deploy from code
- DNS propagation delay: Up to 48 hours

## Multi-Region Failover (Customer Account 2 Only)

**Current Architecture**:
- Customer Account 2 has resources in us-east-1 AND ap-southeast-1
- Each region operates INDEPENDENTLY
- NO automatic failover
- NO data replication between regions

**Manual Failover Process** (UNTESTED):

1. **Trigger**: us-east-1 region failure
2. **Decision**: Determine if failover necessary (how long will outage last?)
3. **DNS Update**: Point application DNS to ap-southeast-1 endpoint
4. **User Communication**: Notify students data is separate per region
5. **Data Loss**: Students in us-east-1 cannot access their data until region recovers

**Limitations**:
- Students who use us-east-1 cannot fail over to ap-southeast-1 (different data)
- Only works if students naturally separated by region
- NO unified global data

**True Multi-Region Failover** (NOT implemented):
Would require:
- Active-active replication between regions
- Global database (DynamoDB Global Tables)
- Automatic DNS failover (Route 53 health checks)
- Regular failover testing

## Testing Disaster Recovery

**Current Status**: NEVER TESTED

**Must Be Tested**:
- [ ] Restore DynamoDB table from backup
- [ ] Restore S3 objects from versioning
- [ ] Restore RDS from snapshot (if applicable)
- [ ] Deploy infrastructure to new region from code
- [ ] Verify application functionality after restore
- [ ] Measure actual RTO and RPO
- [ ] Test failover to ap-southeast-1 (Customer Account 2)

**Test Frequency**: UNDEFINED (recommend quarterly)

**Last Test**: NEVER

**Test Environment**:
- Use test account (not production)
- Simulate various disaster scenarios
- Document time and issues encountered
- Update this plan based on findings

## Backup Verification

**Current Status**: UNKNOWN if backups verified

**Verification Required**:
- [ ] Backups exist
- [ ] Backups complete successfully
- [ ] Backups can be restored
- [ ] Restored data is usable
- [ ] Backup age is within RPO

**Monitoring** (should exist but status UNKNOWN):
- Alert on backup failure
- Alert on backup age exceeding RPO
- Regular backup restoration tests

## Backup Retention

See: [DATA-RETENTION-POLICY.md](DATA-RETENTION-POLICY.md)

**Current Status**: UNDEFINED

**Conflicts**:
- FERPA compliance: Backups containing student data must be deleted when student data deleted
- Disaster recovery: Need backups for recovery
- Balance: Retain backups for [TIMEFRAME - UNDEFINED], then delete

## Dependencies and Third Parties

### AWS Service Dependencies

**If AWS Service Fails**:
- DynamoDB down: Application cannot read/write data
- Cognito down: Users cannot authenticate
- Lambda down: Application logic fails
- S3 down: File access fails

**Mitigation**: None (rely on AWS SLAs and multi-region if configured)

**AWS SLAs**:
- DynamoDB: 99.99% uptime (regional)
- S3: 99.99% availability
- Lambda: 99.95% uptime

### DNS Provider

**If DNS Fails**:
- Users cannot reach application (even if application healthy)

**Mitigation**:
- Use reliable DNS provider (Route 53, Cloudflare)
- Multi-provider DNS (UNDEFINED if configured)

### External Dependencies

**Current Status**: UNDEFINED

**Should Document**:
- Third-party APIs
- Payment processors
- Email services
- Other external dependencies

## Communication Plan

**During Disaster**:

1. **Internal Notification**
   - Alert on-call team
   - Update status page: [STATUS PAGE - UNDEFINED]
   - Incident command structure

2. **Customer Notification**
   - Email affected institutions
   - Post on status page
   - Estimate restoration time
   - Provide updates every [TIMEFRAME - UNDEFINED]

3. **Post-Recovery Notification**
   - Services restored
   - Data loss summary (if any)
   - Root cause explanation
   - Prevention measures

**Communication Templates**: See [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md)

## Roles and Responsibilities

**Status**: UNDEFINED

**Must Define**:

| Role | Responsibility | Contact |
|------|---------------|---------|
| Incident Commander | Overall recovery coordination | [UNDEFINED] |
| Infrastructure Lead | AWS resource restoration | [UNDEFINED] |
| Database Administrator | Data restore and validation | [UNDEFINED] |
| Application Team | Application verification | [UNDEFINED] |
| Customer Success | Customer communication | [UNDEFINED] |

## Recovery Playbooks

### Playbook 1: Restore Deleted DynamoDB Table

**Pre-requisites**: Point-in-time recovery enabled

1. Identify source table name and deletion time
2. Choose restore point (before deletion)
3. Run restore command:
   ```bash
   aws dynamodb restore-table-to-point-in-time \
     --source-table-name DELETED_TABLE \
     --target-table-name RESTORED_TABLE \
     --restore-date-time 2026-01-14T11:59:00Z
   ```
4. Wait for restore completion (may take hours for large tables)
5. Verify record count and data integrity
6. Update application to use restored table
7. Delete original table name if still exists

**Estimated Time**: 1-6 hours depending on table size

### Playbook 2: Restore Deleted S3 Objects

**Pre-requisites**: S3 versioning enabled

1. List deleted objects:
   ```bash
   aws s3api list-object-versions \
     --bucket BUCKET \
     --prefix PREFIX \
     --query 'DeleteMarkers[].[Key,VersionId]'
   ```

2. Remove delete markers:
   ```bash
   aws s3api delete-object \
     --bucket BUCKET \
     --key KEY \
     --version-id DELETE_MARKER_VERSION_ID
   ```

3. Verify objects restored:
   ```bash
   aws s3 ls s3://BUCKET/PREFIX --recursive
   ```

**Estimated Time**: Minutes to hours depending on object count

### Playbook 3: Recover from Regional Outage

**Pre-requisites**: Multi-region deployment, cross-region backups

**Current Status**: NOT POSSIBLE (not configured)

**If Configured** (future state):

1. Confirm region is down (check AWS Service Health Dashboard)
2. Estimate outage duration
3. If > [THRESHOLD - UNDEFINED]: Initiate failover
4. Restore latest backups to alternate region
5. Update DNS to point to alternate region
6. Verify application functionality
7. Notify customers of failover and any data loss

**Estimated Time**: 4-24 hours

## Known Limitations

**This disaster recovery plan has critical gaps**:

- ❌ Actual backup configuration UNKNOWN
- ❌ RTO and RPO NOT DEFINED
- ❌ Recovery procedures NEVER TESTED
- ❌ No multi-region failover capability (except limited for Customer Account 2)
- ❌ No automated failover
- ❌ No off-AWS backups
- ❌ Backup verification NOT automated
- ❌ No disaster recovery drills conducted
- ❌ Contact information UNDEFINED

**Risk Level**: HIGH - Cannot guarantee recovery capability

## Making This Plan Operational

To make this plan functional:

1. **Define Objectives**
   - Set RTO and RPO for each account
   - Get customer agreement on objectives
   - Document in service level agreements

2. **Configure Backups**
   - Enable DynamoDB PITR for all tables
   - Enable S3 versioning for all buckets
   - Create automated snapshot schedules
   - Configure cross-region backup replication

3. **Automate Recovery**
   - Create restore scripts
   - Document step-by-step procedures
   - Create runbooks for each scenario

4. **Test Regularly**
   - Quarterly restore tests
   - Annual full disaster recovery drill
   - Document test results
   - Improve based on findings

5. **Monitor Backups**
   - Alert on backup failures
   - Verify backup completion
   - Test backup restoration monthly

6. **Train Team**
   - Disaster recovery training
   - Tabletop exercises
   - Practice using runbooks

## Related Documents

- [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md) - Incident response procedures
- [DATA-RETENTION-POLICY.md](DATA-RETENTION-POLICY.md) - Backup retention periods
- [ACCOUNT-ARCHITECTURE.md](ACCOUNT-ARCHITECTURE.md) - Infrastructure architecture

## Appendix: AWS Backup Quick Reference

### Check DynamoDB PITR Status
```bash
aws dynamodb describe-continuous-backups --table-name TABLE_NAME
```

### Enable DynamoDB PITR
```bash
aws dynamodb update-continuous-backups \
  --table-name TABLE_NAME \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### Create DynamoDB On-Demand Backup
```bash
aws dynamodb create-backup \
  --table-name TABLE_NAME \
  --backup-name backup-$(date +%Y%m%d-%H%M%S)
```

### Enable S3 Versioning
```bash
aws s3api put-bucket-versioning \
  --bucket BUCKET_NAME \
  --versioning-configuration Status=Enabled
```

### Create RDS Snapshot
```bash
aws rds create-db-snapshot \
  --db-instance-identifier DB_NAME \
  --db-snapshot-identifier snapshot-$(date +%Y%m%d-%H%M%S)
```

---

**CRITICAL**: This is a disaster recovery plan template. It documents theoretical recovery procedures, not tested and validated capabilities. DO NOT assume disaster recovery is possible until backups are configured, tested, and validated. An untested disaster recovery plan is not a disaster recovery plan.
