# Incident Response Plan

## Document Status

**Last Updated**: January 14, 2026  
**Status**: DRAFT - Requires operational validation  
**Owner**: Infrastructure Team  
**Review Frequency**: Quarterly

## Purpose

This document defines the incident response procedures for security and operational incidents across AWS accounts.

## Scope

This plan applies to:
- All AWS accounts in the organization (Management, Shared Services, Consumer, Institution, Hosting OUs)
- Security incidents involving unauthorized access, data breaches, or compliance violations
- Operational incidents affecting service availability

## Incident Classification

### Severity Levels

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|----------|
| **P0 - Critical** | Production service down, potential data breach, FERPA violation | Immediate | Unauthorized access to student data, complete service outage |
| **P1 - High** | Degraded service, potential security vulnerability | 1 hour | CloudTrail disabled, elevated error rates |
| **P2 - Medium** | Minor service impact, security concern | 4 hours | Single component failure with redundancy, security scan findings |
| **P3 - Low** | No immediate impact | 24 hours | Non-critical configuration drift, documentation issues |

## Current Detection Mechanisms

### What Exists Now

- **CloudTrail**: Logs enabled (status: unknown if actually configured)
- **CloudWatch**: Available (specific alarms: undefined)
- **AWS Config**: Available (specific rules: undefined)
- **Security Hub**: Available (integration status: unknown)

### What Does NOT Exist

- ❌ Automated alerting to on-call personnel
- ❌ Defined monitoring thresholds
- ❌ Automated anomaly detection
- ❌ Real-time security event correlation
- ❌ Defined escalation contacts

**Action Required**: Verify and document actual CloudTrail, CloudWatch, and Security Hub configurations.

## Incident Response Procedures

### Phase 1: Detection & Identification

**Current Capabilities**:
- Manual review of AWS Console
- CloudTrail log inspection (if configured)

**Steps**:
1. Identify incident through available monitoring tools
2. Document initial observations with timestamps
3. Classify severity based on table above
4. DO NOT modify affected systems until assessment is complete

### Phase 2: Containment

**For Security Incidents**:
1. Identify compromised IAM credentials or resources
2. Disable compromised credentials immediately via IAM console
3. Apply restrictive security group rules to affected resources
4. Preserve logs before any modifications (CloudTrail, CloudWatch, application logs)
5. Take EBS/RDS snapshots of affected systems for forensics

**For Data Breach (FERPA-relevant)**:
1. Identify scope: which student records were accessed
2. Preserve all audit logs (CloudTrail entries showing access)
3. Do NOT delete or modify any logs
4. Isolate affected account/resources using security groups or SCPs
5. Document exact time range of potential unauthorized access

### Phase 3: Investigation

**Required Evidence Collection**:
- CloudTrail events (all API calls in affected timeframe)
- CloudWatch logs (application and system logs)
- VPC Flow Logs (if enabled - status unknown)
- AWS Config history (if enabled - status unknown)
- IAM credential reports
- Screenshots of AWS Console showing affected resources

**Analysis**:
- Determine root cause
- Identify all affected resources and accounts
- Calculate timeline of incident
- Assess whether student data was accessed (for FERPA)

### Phase 4: Eradication

1. Remove attacker access (revoke credentials, close security group rules)
2. Patch vulnerabilities that allowed incident
3. Update IAM policies to prevent recurrence
4. Rotate all potentially compromised credentials
5. Deploy infrastructure changes via CI/CD pipeline (et-shared account)

**Do NOT**:
- Deploy untested fixes directly to production
- Make changes without documenting in change log
- Assume incident is resolved without verification

### Phase 5: Recovery

1. Restore services from known-good state
2. Verify service functionality
3. Monitor for recurrence (increased monitoring for 72 hours)
4. Confirm no ongoing unauthorized access

### Phase 6: Post-Incident Review

**Required within 5 business days**:
1. Document complete incident timeline
2. Identify root cause
3. List all affected systems and data
4. Document remediation steps taken
5. Create action items to prevent recurrence

## FERPA Breach Notification Requirements

### Legal Obligation

If student education records are accessed by unauthorized parties, notification is required.

### Notification Criteria

**Must Notify If**:
- Unauthorized person accessed student records
- Student PII was disclosed without consent
- Breach of security safeguards for student data

### Notification Timeline

- **Internal**: Immediate (within 1 hour of confirmation)
- **Affected Institution**: Within 24 hours of confirmation
- **Students/Parents**: As required by institutional policy and state law (typically 45 days maximum)
- **Regulators**: As required by state breach notification laws

### Required Information in Notification

1. Date/time of breach discovery
2. Types of student records involved
3. Number of students affected
4. How breach occurred (without technical details that could aid attackers)
5. Steps taken to contain and remediate
6. Resources available to affected parties
7. Contact information for questions

### Current Notification Contacts

**Status**: UNDEFINED

**Action Required**: Document the following before any incident occurs:
- Primary contact for each customer institution
- Backup contacts with phone/email
- Legal counsel contact information
- PR/communications team (if exists)
- Regulatory notification requirements per state

## Escalation Matrix

### Current Status: UNDEFINED

**Action Required**: Define and document:

| Role | Responsibility | Contact Method | Response Time |
|------|---------------|----------------|---------------|
| On-Call Engineer | First responder | [UNDEFINED] | Immediate |
| Security Lead | Security incidents | [UNDEFINED] | 15 minutes |
| Infrastructure Lead | Service outages | [UNDEFINED] | 15 minutes |
| CTO/Technical Lead | P0/P1 incidents | [UNDEFINED] | 30 minutes |
| Legal Counsel | Data breaches, FERPA | [UNDEFINED] | 1 hour |
| Customer Success | Customer notification | [UNDEFINED] | As needed |

## Communication Templates

### Internal Incident Notification

```
SUBJECT: [P0/P1/P2/P3] Incident: [Brief Description]

Severity: [P0/P1/P2/P3]
Status: [Investigating/Contained/Resolved]
Affected Systems: [Account name, service, region]
Impact: [Description of customer/service impact]
Student Data Involved: [YES/NO/UNKNOWN]

Timeline:
- [Time] Incident detected
- [Time] Response initiated
- [Time] Containment completed
- [Time] Expected resolution

Next Update: [Time]

Incident Commander: [Name]
```

### Customer Notification (Non-Breach)

```
SUBJECT: Service Incident Notification - [Date]

We are writing to inform you of a service incident that occurred on [date/time].

What Happened:
[Factual description without speculation]

Impact:
[What services were affected, for how long]

Student Data:
No student data was accessed or compromised.

Resolution:
[What was done to resolve]

Prevention:
[What is being done to prevent recurrence]

Questions: [Contact email/phone]
```

### FERPA Breach Notification Template

```
SUBJECT: REQUIRED NOTIFICATION - Data Security Incident

[Institution Name],

We are required to notify you of a data security incident involving student education records.

INCIDENT DETAILS:
Date of Discovery: [Date/Time]
Nature of Incident: [Unauthorized access/disclosure/other]
Records Involved: [Type of student data - be specific]
Number of Students Affected: [Number or "under investigation"]

TIMELINE:
- [Time] Incident occurred
- [Time] Incident detected
- [Time] Containment completed
- [Time] Investigation completed

STUDENT DATA ACCESSED:
[Specific data elements: names, IDs, grades, etc.]
[DO NOT include data elements that were NOT accessed]

CAUSE:
[Root cause without technical details]

REMEDIATION:
[Specific steps taken to prevent recurrence]

RESOURCES FOR AFFECTED INDIVIDUALS:
[If applicable: credit monitoring, support services]

YOUR RESPONSIBILITIES:
As the educational institution, you may have notification obligations under FERPA and state breach notification laws.

CONTACT:
[Name, Title]
[Email, Phone]
[Available hours]

We are committed to protecting student data and deeply regret this incident.
```

## Post-Incident Action Items

**After Each Incident**:

1. Update this document with lessons learned
2. Add new detection mechanisms for this incident type
3. Update monitoring thresholds
4. Add automated alerts if possible
5. Conduct tabletop exercise of similar scenario within 30 days
6. Update customer communication if procedures changed

## Testing & Drills

### Current Status: NO TESTING CONDUCTED

**Action Required**:
- Conduct quarterly tabletop exercises
- Test backup restoration procedures
- Verify CloudTrail log accessibility
- Test incident notification contact list
- Practice FERPA breach notification within legal review

## Document Limitations

**What This Document Does NOT Cover**:
- Specific AWS service configurations (CloudTrail, Config, Security Hub) - status unknown
- Automated incident response - not implemented
- Integration with ticketing systems - not defined
- On-call rotation schedule - not established
- Actual contact information - not documented
- Tested and validated procedures - no testing conducted

**Next Steps to Make This Operational**:
1. Verify all AWS security services are actually configured
2. Define and test monitoring alerts
3. Establish on-call rotation and contacts
4. Conduct tabletop exercise to validate procedures
5. Document actual service configurations
6. Establish customer notification contact database
7. Review with legal counsel for FERPA compliance

## Related Documents

- [ACCOUNT-ARCHITECTURE.md](ACCOUNT-ARCHITECTURE.md) - AWS account structure
- DATA-FLOW-DIAGRAMS.md - (To be created)
- MONITORING-RUNBOOK.md - (To be created)
- PRIVACY-POLICY.md - (To be created)

## Appendix: AWS Service Quick Reference

### Disable Compromised IAM User
```bash
aws iam update-access-key --access-key-id AKIA... --status Inactive --user-name USERNAME
aws iam delete-access-key --access-key-id AKIA... --user-name USERNAME
```

### Review CloudTrail Events
```bash
aws cloudtrail lookup-events --lookup-attributes AttributeKey=Username,AttributeValue=USERNAME --start-time 2026-01-14T00:00:00Z --max-results 50
```

### Create Forensic Snapshot
```bash
aws ec2 create-snapshot --volume-id vol-xxx --description "Forensic snapshot - Incident YYYY-MM-DD"
aws rds create-db-snapshot --db-instance-identifier dbname --db-snapshot-identifier incident-YYYY-MM-DD
```

### Block IP Address via Security Group
```bash
# Remove overly permissive rules
aws ec2 revoke-security-group-ingress --group-id sg-xxx --ip-permissions IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges='[{CidrIp=0.0.0.0/0}]'
```

---

**CRITICAL**: This document is a template. It requires operational validation, testing, and customization with actual contact information and verified AWS configurations before it can be used in a real incident.
