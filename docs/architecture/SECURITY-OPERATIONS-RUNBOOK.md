# Security Operations Runbook

## Document Status

**Last Updated**: January 14, 2026  
**Status**: TEMPLATE - Actual security operations unknown  
**Owner**: Security Team / Infrastructure Team  

---

**NOTICE**: This runbook describes what security operations SHOULD be performed. Actual implementation is UNKNOWN.

---

## Purpose

This runbook defines daily, weekly, and monthly security operational tasks to maintain the security posture of the AWS infrastructure.

## Security Operations Team

**Current Status**: UNDEFINED

**Should Be Defined**:
- Security team members and responsibilities
- On-call rotation for security incidents
- Escalation contacts
- Backup personnel

## Daily Security Tasks

**Status**: UNKNOWN if anyone performs these

### Task 1: Review Security Hub Findings

**Frequency**: Daily (business days)

**Procedure**:
1. Log into AWS Security Hub (Management account or delegated admin)
2. Review new high/critical severity findings
3. Triage findings:
   - True positive: Create remediation ticket
   - False positive: Suppress with justification
   - Needs investigation: Assign to team member
4. Document review completion

**Current Capability**: UNKNOWN if Security Hub enabled

### Task 2: Check CloudTrail Status

**Frequency**: Daily

**Procedure**:
1. Verify CloudTrail logging enabled in all accounts
2. Check for gaps in log delivery
3. Verify log file integrity validation
4. Alert if CloudTrail disabled or logging stopped

**Command**:
```bash
aws cloudtrail get-trail-status --name trail-name
```

**Current Capability**: UNKNOWN if CloudTrail enabled

### Task 3: Review High-Priority CloudWatch Alarms

**Frequency**: Daily

**Procedure**:
1. Check CloudWatch Console for alarms in ALARM state
2. Investigate triggered alarms
3. Escalate if security-related (root account usage, IAM changes, etc.)
4. Document investigation results

**Current Capability**: UNKNOWN if alarms configured

### Task 4: Monitor Authentication Failures

**Frequency**: Daily

**Procedure**:
1. Review Cognito sign-in failures
2. Check for patterns indicating brute force attacks
3. Identify suspicious IP addresses
4. Block IPs via WAF if attack confirmed (if WAF configured)

**Current Capability**: UNKNOWN

### Task 5: Review AWS Health Dashboard

**Frequency**: Daily

**Procedure**:
1. Check AWS Personal Health Dashboard
2. Review any security bulletins
3. Check for AWS service issues affecting used services
4. Plan actions if security patches needed

**Access**: AWS Console → AWS Health

## Weekly Security Tasks

**Status**: UNKNOWN if performed

### Task 1: Review IAM Credential Report

**Frequency**: Weekly

**Procedure**:
1. Generate IAM credential report for all accounts
   ```bash
   aws iam generate-credential-report
   aws iam get-credential-report
   ```
2. Check for:
   - Unused credentials (90+ days inactive)
   - Access keys not rotated (90+ days old)
   - Users without MFA
   - Password not changed in 90+ days
3. Follow up with users or disable credentials

**Current Capability**: Can be done, unknown if done

### Task 2: Review Security Group Changes

**Frequency**: Weekly

**Procedure**:
1. Query CloudTrail for security group modifications
2. Review new ingress rules
3. Flag overly permissive rules (0.0.0.0/0 on non-standard ports)
4. Verify changes have change request approval

**CloudTrail Query**:
```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AuthorizeSecurityGroupIngress \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --max-results 50
```

**Current Capability**: UNKNOWN if CloudTrail enabled

### Task 3: Review IAM Policy Changes

**Frequency**: Weekly

**Procedure**:
1. Query CloudTrail for IAM policy changes
2. Review new policies and permission grants
3. Verify least privilege maintained
4. Check for privilege escalation risks
5. Verify changes approved

**Events to Check**:
- CreatePolicy
- PutUserPolicy
- PutRolePolicy
- AttachUserPolicy
- AttachRolePolicy

**Current Capability**: UNKNOWN

### Task 4: Vulnerability Scan Review

**Frequency**: Weekly

**Procedure**:
1. Review AWS Inspector findings (if enabled)
2. Review application vulnerability scans (if configured)
3. Prioritize vulnerabilities (CVSS score, exploitability)
4. Create remediation tickets for high/critical findings

**Current Capability**: UNKNOWN if Inspector enabled

### Task 5: Review Backup Status

**Frequency**: Weekly

**Procedure**:
1. Verify DynamoDB backups completed
2. Verify S3 versioning active
3. Check RDS snapshots (if applicable)
4. Test restore of one backup (rotating selection)
5. Alert if backups failed

**Current Capability**: UNKNOWN - Backup configuration unknown

## Monthly Security Tasks

**Status**: UNKNOWN if performed

### Task 1: Comprehensive Access Review

**Frequency**: Monthly

**Procedure**:
1. Review all IAM users and their last activity
2. Review IAM roles and trust relationships
3. Check for unused roles and users
4. Verify MFA enabled for all users
5. Review cross-account access (AssumeRole permissions)
6. Document review results

**Current Capability**: Can be done manually

### Task 2: Security Patch Assessment

**Frequency**: Monthly

**Procedure**:
1. Review AWS security bulletins for services used
2. Check Lambda runtime versions (deprecated runtimes)
3. Review EC2 AMIs if applicable (patch level)
4. Plan patching for any identified vulnerabilities
5. Test patches in non-production

**Current Capability**: Manual review required

### Task 3: Config Rules Compliance Review

**Frequency**: Monthly

**Procedure**:
1. Review AWS Config compliance dashboard (if enabled)
2. Investigate non-compliant resources
3. Remediate or document exceptions
4. Update Config rules if needed

**Current Capability**: UNKNOWN if Config enabled

### Task 4: Log Review and Analysis

**Frequency**: Monthly

**Procedure**:
1. Review CloudTrail logs for anomalies
2. Check for:
   - API calls from unexpected regions
   - API calls from unexpected IP ranges
   - Unusual API call patterns
   - Failed API calls (potential reconnaissance)
3. Use CloudWatch Logs Insights for analysis

**Sample Query** (CloudWatch Logs Insights):
```sql
fields @timestamp, userIdentity.principalId, eventName, sourceIPAddress
| filter eventName like /Delete/ or eventName like /Terminate/
| sort @timestamp desc
| limit 100
```

**Current Capability**: UNKNOWN if logs centralized

### Task 5: Secrets Rotation Review

**Frequency**: Monthly

**Procedure**:
1. Review secrets in Secrets Manager / Parameter Store (if used)
2. Check last rotation date
3. Rotate secrets older than [POLICY - UNDEFINED] days
4. Verify automated rotation working

**Current Capability**: UNKNOWN if Secrets Manager used

## Quarterly Security Tasks

**Status**: UNKNOWN if performed

### Task 1: Comprehensive Security Review

**Frequency**: Quarterly

**Procedure**:
1. Review all security policies and procedures
2. Update based on lessons learned
3. Review compliance with FERPA, COPPA
4. Check for policy drift
5. Update documentation

**Current Capability**: Manual process

### Task 2: Penetration Test / Security Assessment

**Frequency**: Quarterly or annually

**Procedure**:
1. Engage third-party security firm OR conduct internal assessment
2. Scope: Application layer, infrastructure, IAM
3. Provide findings report
4. Remediate findings
5. Retest after remediation

**AWS Requirement**: Notify AWS for penetration testing (automated approval for most services)

**Current Capability**: UNKNOWN if ever conducted

### Task 3: Disaster Recovery Test

**Frequency**: Quarterly

**Procedure**:
1. Test backup restoration
2. Test failover procedures (if multi-region)
3. Measure actual RTO and RPO
4. Document findings
5. Update disaster recovery plan

**Current Capability**: UNKNOWN - See [DISASTER-RECOVERY-PLAN.md](DISASTER-RECOVERY-PLAN.md)

### Task 4: IAM Access Analyzer Review

**Frequency**: Quarterly

**Procedure**:
1. Enable IAM Access Analyzer (if not enabled)
2. Review findings for overly permissive resources
3. Review external access grants
4. Remediate findings
5. Archive resolved findings

**Current Capability**: UNKNOWN if Access Analyzer enabled

## Continuous Security Monitoring

**Status**: UNKNOWN if implemented

**Should Be Automated** (if not already):

### GuardDuty Monitoring

**If Enabled**:
- Real-time threat detection
- Alerts on suspicious activity
- Integration with Security Hub

**Current Status**: UNKNOWN if enabled

### AWS Config Continuous Compliance

**If Enabled**:
- Automated compliance checking
- Alert on configuration drift
- Remediation automation possible

**Current Status**: UNKNOWN if enabled

### CloudWatch Alarms

**Should Exist**:
- Root account usage
- IAM policy changes
- Security group changes
- CloudTrail disabled
- High API error rates
- Unusual API activity

**Current Status**: UNKNOWN if configured

## Security Incident Response

**For Security Incidents**: Follow [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md)

**Security Team Responsibilities**:
- Initial incident triage
- Forensic investigation
- Containment recommendations
- Recovery verification
- Post-incident security improvements

## Security Tools Quick Reference

### Enable Security Hub
```bash
aws securityhub enable-security-hub
```

### Enable GuardDuty
```bash
aws guardduty create-detector --enable
```

### Enable IAM Access Analyzer
```bash
aws accessanalyzer create-analyzer --analyzer-name default --type ACCOUNT
```

### Enable AWS Config
```bash
aws configservice put-configuration-recorder --configuration-recorder name=default,roleARN=arn:aws:iam::ACCOUNT:role/ConfigRole
aws configservice put-delivery-channel --delivery-channel name=default,s3BucketName=config-bucket
aws configservice start-configuration-recorder --configuration-recorder-name default
```

### Generate IAM Credential Report
```bash
aws iam generate-credential-report
aws iam get-credential-report --output text | base64 -d > credential-report.csv
```

### Search CloudTrail for Event
```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteBucket \
  --max-results 50
```

### Check Security Hub Findings
```bash
aws securityhub get-findings \
  --filters '{"SeverityLabel": [{"Value": "CRITICAL", "Comparison": "EQUALS"}]}'
```

## Security Hardening Checklist

**Should Be Completed** (current status UNKNOWN):

### Account Level
- [ ] Root account MFA enabled
- [ ] Root account access keys deleted
- [ ] CloudTrail enabled in all regions
- [ ] CloudTrail log file validation enabled
- [ ] CloudTrail logs centralized to S3
- [ ] S3 bucket for CloudTrail logs encrypted
- [ ] S3 bucket for CloudTrail logs versioned
- [ ] S3 bucket access restricted (no public access)
- [ ] AWS Config enabled
- [ ] Config rules for CIS benchmarks enabled
- [ ] Security Hub enabled
- [ ] GuardDuty enabled
- [ ] IAM password policy enforced
- [ ] MFA enforced for all users

### Network Security
- [ ] Default VPC deleted (if not used)
- [ ] VPC Flow Logs enabled
- [ ] Security groups follow least privilege
- [ ] No security groups allow 0.0.0.0/0 except HTTP/HTTPS
- [ ] Network ACLs configured
- [ ] AWS WAF deployed (for public endpoints)

### Data Protection
- [ ] S3 bucket encryption enabled (all buckets)
- [ ] S3 versioning enabled (for data buckets)
- [ ] S3 public access blocked (account level)
- [ ] DynamoDB encryption enabled
- [ ] RDS encryption enabled (if applicable)
- [ ] EBS encryption enabled by default
- [ ] Secrets Manager used for secrets (not hardcoded)

### Monitoring
- [ ] CloudWatch alarms for security events
- [ ] SNS topics for alerts configured
- [ ] On-call personnel receive alerts
- [ ] Log retention configured per policy
- [ ] Automated backup verification

## Security Metrics and Reporting

**Should Track** (current status UNKNOWN):
- Number of security findings (by severity)
- Mean time to remediate findings
- Number of IAM users without MFA
- Number of non-compliant resources
- Number of security incidents
- Time to detect security incidents
- Time to respond to security incidents

**Reporting**:
- Weekly security summary
- Monthly security metrics dashboard
- Quarterly security review presentation

**Current Status**: NO METRICS TRACKED

## Security Training

**Current Status**: UNDEFINED

**Should Exist**:
- Security awareness training for all staff
- Phishing simulation exercises
- Incident response tabletop exercises
- Frequency: Annually or upon hire

## Third-Party Security Tools

**Current Usage**: UNDEFINED

**May Be Used**:
- Vulnerability scanners
- SIEM (Security Information and Event Management)
- Log aggregation platforms
- Compliance automation tools

## Compliance-Specific Security Tasks

### FERPA Compliance

**Monthly**:
- [ ] Review access to student data
- [ ] Verify encryption in place
- [ ] Audit log review for unauthorized access

**Quarterly**:
- [ ] Review data retention compliance
- [ ] Verify data deletion procedures
- [ ] Update Data Processing Agreements

### COPPA Compliance (if applicable)

**Quarterly**:
- [ ] Review parental consent mechanisms
- [ ] Verify minimal data collection
- [ ] Check for unauthorized third-party data sharing

## Security Contact Information

**Current Status**: UNDEFINED

**Should Document**:
- Security team email
- Security incident hotline
- On-call security engineer
- Escalation contacts
- AWS Support contact for security issues

## Making This Runbook Operational

To implement these security operations:

1. **Assign Responsibilities**
   - Designate security team members
   - Define daily/weekly/monthly task owners
   - Establish on-call rotation

2. **Enable Security Services**
   - Enable Security Hub, GuardDuty, Config
   - Configure CloudTrail in all accounts
   - Set up IAM Access Analyzer

3. **Configure Monitoring**
   - Create CloudWatch alarms
   - Set up SNS notifications
   - Test alert delivery

4. **Create Checklists**
   - Daily task checklist
   - Weekly task checklist
   - Monthly task checklist
   - Document completion

5. **Automate Where Possible**
   - Automated security scans
   - Automated compliance checking
   - Automated reporting

6. **Train Team**
   - Security tools training
   - Incident response training
   - Regular practice exercises

## Related Documents

- [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md) - Respond to security incidents
- [ACCESS-CONTROL-IAM-POLICY.md](ACCESS-CONTROL-IAM-POLICY.md) - IAM security policies
- [MONITORING-RUNBOOK.md](MONITORING-RUNBOOK.md) - General monitoring procedures
- [COMPLIANCE-AUDIT-CHECKLIST.md](COMPLIANCE-AUDIT-CHECKLIST.md) - (To be created)

---

**CRITICAL**: This runbook describes what security operations SHOULD be performed. Current implementation is UNKNOWN. Security operations require dedicated resources and cannot be neglected. Lack of security operations leads to undetected breaches, compliance violations, and data loss.
