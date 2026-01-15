# Data Retention & Deletion Policy

## Document Status

**Last Updated**: January 14, 2026  
**Status**: TEMPLATE - Requires legal review and operational validation  
**Owner**: Infrastructure Team  
**Legal Review**: REQUIRED  

---

**NOTICE**: This is a template policy. Actual retention periods must be defined based on legal requirements, contractual obligations, and institutional policies. Do not implement without legal review.

---

## Purpose

This policy defines how long student education records and other data are retained, and procedures for secure deletion.

## Scope

This policy applies to:
- Student education records (FERPA-protected)
- Application logs containing student identifiers
- Audit logs (CloudTrail, CloudWatch)
- Backup copies of student data
- System metadata related to student accounts

## Legal and Regulatory Requirements

### FERPA (Family Educational Rights and Privacy Act)

**Requirement**: FERPA does not mandate specific retention periods. Retention is determined by:
1. Educational institution's records retention policy
2. State education records retention laws
3. Accreditation requirements
4. Litigation hold requirements

**Our Obligation**: As a service provider, we retain student records per institutional contract and delete upon institutional direction.

### State-Specific Requirements

**Status**: UNDEFINED - Varies by institution location

Examples of state requirements:
- Some states require 5+ years retention for certain education records
- Some states require permanent retention of transcripts
- Breach notification laws may require log retention during investigation

**Action Required**: Document applicable state requirements for each customer institution.

### Contractual Obligations

Retention periods defined in Data Processing Agreement with each institution:
- **During service term**: [TIMEFRAME - UNDEFINED]
- **After service termination**: [TIMEFRAME - UNDEFINED]
- **Upon institution request**: Delete within [TIMEFRAME - UNDEFINED]

See: [DATA-PROCESSING-AGREEMENT.md](DATA-PROCESSING-AGREEMENT.md)

## Data Categories and Retention

### Student Education Records

**Definition**: Records directly related to a student and maintained by us on behalf of educational institutions.

**Examples**:
- Student names, email addresses, IDs
- Learning progress data
- Assignment submissions
- Test scores and grades
- Course enrollment information
- [OTHER SPECIFIC DATA TYPES - UNDEFINED]

**Retention**:
- **Active students**: Retained while student is enrolled and uses the service
- **Withdrawn/graduated students**: [TIMEFRAME - UNDEFINED]
- **Institutional contract termination**: [TIMEFRAME - UNDEFINED]
- **Institution-requested deletion**: Within [TIMEFRAME - UNDEFINED]

**Current Status**: UNDEFINED - No automated deletion process verified

### User Account Data (Cognito)

**What It Contains**:
- Student email/username
- Password (hashed, not retrievable)
- MFA settings
- Login history

**Retention**:
- **Active accounts**: Retained while student uses service
- **Inactive accounts**: [TIMEFRAME - UNDEFINED, e.g., "Deleted after 365 days of inactivity"]
- **Upon deletion request**: Within [TIMEFRAME - UNDEFINED]

**Current Status**: UNDEFINED - Cognito retention settings unknown

### Application Data (DynamoDB, S3)

**What It Contains**:
- Student-generated content
- Application state
- File uploads

**Storage Locations**:
- Customer Account 1: us-east-1
- Customer Account 2: us-east-1 and/or ap-southeast-1

**Retention**:
- **Active data**: Retained while in use
- **Deleted data**: [SOFT DELETE vs HARD DELETE - UNDEFINED]
- **Soft-deleted data retention**: [TIMEFRAME - UNDEFINED]

**Current Status**: UNDEFINED - No verified deletion process

### Audit Logs (CloudTrail)

**What They Contain**:
- API calls (including user identifiers)
- Source IP addresses
- Timestamps
- Resources accessed

**FERPA Consideration**: Audit logs containing student identifiers are education records and must be protected accordingly.

**Retention**:
- **Active logs**: [TIMEFRAME - UNDEFINED, recommended: 1-3 years]
- **Archived logs**: [TIMEFRAME - UNDEFINED]
- **Minimum for security**: 90 days (industry standard)
- **Extended for compliance**: [TIMEFRAME - UNDEFINED]

**Current Status**: UNKNOWN if CloudTrail enabled; retention period UNKNOWN

**Deletion**: Logs deleted per retention schedule UNLESS:
- Active investigation or litigation hold
- Required by institutional policy
- Required by applicable law

### Application Logs (CloudWatch)

**What They Contain**:
- Application errors
- Debug information
- May contain student identifiers in error messages

**Retention**:
- **Application logs**: [TIMEFRAME - UNDEFINED, typical: 30-90 days]
- **Error logs**: [TIMEFRAME - UNDEFINED, typical: 90-180 days]

**Current Status**: UNKNOWN - CloudWatch log retention not verified

### Backup Data

**What It Contains**:
- Complete copy of production student data

**Backup Types**:
- DynamoDB point-in-time recovery: [STATUS - UNKNOWN]
- S3 versioning: [STATUS - UNKNOWN]
- RDS snapshots: [IF APPLICABLE - UNKNOWN]
- Disaster recovery backups: [STATUS - UNKNOWN]

**Retention**:
- **Incremental backups**: [TIMEFRAME - UNDEFINED]
- **Full backups**: [TIMEFRAME - UNDEFINED]
- **Disaster recovery backups**: [TIMEFRAME - UNDEFINED]

**Current Status**: UNKNOWN - Backup configuration and retention not verified

**Deletion**: Backups deleted per retention schedule even if production data deleted earlier.

**Issue**: If production student data is deleted but backups retained, backups still contain student records and must be protected under FERPA.

### Metadata and Aggregated Data

**Definition**: De-identified or aggregated data that cannot identify individual students.

**Examples**:
- Usage statistics (number of logins, not who logged in)
- Performance metrics
- Aggregate learning outcomes

**Retention**: [TIMEFRAME - UNDEFINED, may be indefinite if truly de-identified]

**Requirements**:
- Must be truly de-identified (cannot re-identify students)
- If re-identification possible, treat as student education records
- Document de-identification process

**Current Status**: UNKNOWN if aggregated data collection exists

## Deletion Procedures

### Deletion Triggers

Student data deletion occurs when:
1. **Institution requests deletion** (per DPA Section 6.3)
2. **Service contract terminates** (per DPA)
3. **Retention period expires** (per this policy)
4. **Student/parent requests deletion** (via institution)
5. **Legal hold lifted** (if applicable)

### Deletion Timeframes

**Current Status**: UNDEFINED

**Should Be Defined**:
- Routine deletion: Within [X] days of trigger
- Institution-requested deletion: Within [X] days of request
- Emergency deletion (security incident): Within [X] hours

### Deletion Methods

**Secure Deletion Standards**:

**DynamoDB**:
- Delete items via DeleteItem API
- Data unrecoverable after deletion
- Point-in-time recovery retains deletions for [RETENTION PERIOD - UNKNOWN]

**S3**:
- Delete objects via DeleteObject API
- If versioning enabled: Delete all versions
- Empty and delete buckets if entire account decommissioned

**Cognito**:
- Delete user via AdminDeleteUser API
- User data permanently deleted

**RDS/Aurora** (if applicable):
- Delete records via SQL DELETE
- Snapshots must be deleted separately
- Final snapshot before deletion: [POLICY - UNDEFINED]

**Backups**:
- Delete DynamoDB backups
- Delete S3 object versions
- Delete RDS snapshots
- Delete EBS snapshots (if applicable)

**Audit Logs**:
- CloudTrail: Delete from S3 bucket (if legally permissible)
- CloudWatch: Delete log streams or let retention policy expire

**Current Status**: UNKNOWN - Deletion procedures not verified or automated

### Soft Delete vs. Hard Delete

**Soft Delete** (Mark as deleted, retain data temporarily):
- **Use Case**: Allow recovery from accidental deletion
- **Duration**: [TIMEFRAME - UNDEFINED]
- **Implementation**: [METHOD - UNDEFINED, e.g., "Add 'deleted' flag to DynamoDB item"]

**Hard Delete** (Permanent removal):
- **Use Case**: Final deletion after soft delete period or immediate deletion upon request
- **Implementation**: Actual deletion from all systems including backups

**Current Policy**: UNDEFINED

### Deletion Verification

**Process** (UNDEFINED - not known if exists):
1. Execute deletion procedures
2. Verify data removed from production systems
3. Verify data removed from backups
4. Search for residual data (CloudTrail logs, CloudWatch logs)
5. Document deletion completion
6. Provide deletion certificate to institution (if requested)

**Current Status**: No verification process documented

### Deletion Exceptions (Legal Hold)

**When Deletion is Suspended**:
- Active litigation or investigation
- Government request or subpoena
- Data breach investigation in progress
- Regulatory audit in progress

**Procedure**:
1. Legal counsel determines legal hold requirements
2. Place hold flag on affected data
3. Document hold reason and scope
4. Suspend automated deletion for held data
5. Resume deletion when hold lifted

**Current Status**: UNDEFINED - No legal hold process documented

## Data Retention by Account

### Management Account (et-mgmt)

**Data Stored**:
- Organization-wide CloudTrail logs
- Billing data
- Organization structure metadata

**Retention**:
- CloudTrail: [TIMEFRAME - UNDEFINED]
- Billing: [TIMEFRAME - UNDEFINED, likely 7 years for tax purposes]

### Shared Services Account (et-shared)

**Data Stored**:
- CI/CD logs
- Deployment artifacts
- Build logs

**Retention**:
- Build logs: [TIMEFRAME - UNDEFINED]
- Artifacts: [TIMEFRAME - UNDEFINED]

**Student Data**: NO student data in this account

### Customer Accounts (Institution OU)

**Data Stored**:
- Student education records
- Application data
- Account-specific CloudTrail logs
- Application logs

**Retention**: Per institution contract and this policy

### Hosting Account (neopros-life-prod)

**Data Stored**: [UNDEFINED - depends on use case]

**Retention**: [UNDEFINED]

## Automated vs. Manual Deletion

**Current Status**: UNKNOWN - No automation verified

**Should Be Automated**:
- Log rotation and expiration (CloudWatch)
- Soft-deleted record hard deletion after period
- Old backup deletion per retention schedule
- Inactive account cleanup

**Must Be Manual** (requires human review):
- Institution-requested deletion (verify authorization)
- Legal hold determination
- Emergency deletion during security incident

## Student and Parent Rights (FERPA)

### Right to Request Deletion

Students (or parents for students under 18) may request deletion through the educational institution.

**Our Process**:
1. Institution submits deletion request on student's behalf
2. We verify request authenticity from institution
3. We execute deletion within [TIMEFRAME - UNDEFINED]
4. We provide deletion confirmation to institution

**Limitations**:
- We cannot accept deletion requests directly from students (only through institution)
- Deletion may be denied if required by law or institutional policy
- Some records may need to be retained for legal compliance

### Right to Data Portability

Before deletion, students may request a copy of their data through the institution.

**Our Process**:
1. Institution requests data export
2. We generate export in [FORMAT - UNDEFINED, e.g., "JSON, CSV"]
3. We provide export to institution within [TIMEFRAME - UNDEFINED]
4. Institution provides data to student

## Monitoring and Compliance

**Status**: UNDEFINED

**Should Be Monitored**:
- Deletion requests processed on time
- Retention periods enforced
- Backups rotated per schedule
- Log retention compliance
- Legal hold tracking

**Reporting**:
- Quarterly report on data retention compliance
- Annual audit of retention practices
- Exception reports for missed deletions

## Related Policies

- [DATA-PROCESSING-AGREEMENT.md](DATA-PROCESSING-AGREEMENT.md) - Contractual obligations
- [PRIVACY-POLICY.md](PRIVACY-POLICY.md) - Customer-facing retention disclosure
- [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md) - Log retention for incident investigation

## Implementing This Policy

To make this policy operational:

1. **Define Retention Periods**
   - Consult with legal counsel
   - Review institutional contracts
   - Check state-specific requirements
   - Document in this policy

2. **Configure Retention Settings**
   - Set CloudWatch Logs retention periods
   - Configure S3 lifecycle policies
   - Set DynamoDB point-in-time recovery window
   - Configure backup retention

3. **Implement Deletion Procedures**
   - Create deletion scripts/tools
   - Document step-by-step procedures
   - Test deletion process
   - Train staff on procedures

4. **Automate Where Possible**
   - S3 lifecycle policies for old backups
   - CloudWatch Logs expiration
   - Lambda functions for automated cleanup
   - Scheduled deletion jobs

5. **Establish Monitoring**
   - Track deletion requests
   - Monitor retention compliance
   - Alert on missed deletions
   - Regular audit of retention

6. **Document and Test**
   - Document all procedures
   - Test deletion procedures quarterly
   - Update based on test results
   - Train new staff

## Deletion Request Form Template

**For Internal Use**: Institutional deletion request template

```
STUDENT DATA DELETION REQUEST

Requesting Institution: _______________________
Institution Contact: __________________________
Contact Email: ________________________________
Contact Phone: ________________________________

Request Date: _________________________________
Urgency: [ ] Standard [ ] Urgent [ ] Emergency

Student Information:
Student Name: _________________________________
Student ID: ___________________________________
Student Email: ________________________________

Scope of Deletion:
[ ] All student data
[ ] Specific records (describe): ______________

Reason for Deletion:
[ ] Student withdrawn
[ ] Parent request (FERPA)
[ ] Contract termination
[ ] Other: ____________________________________

Requested Completion Date: ____________________

Authorization:
I certify that I am authorized to request this deletion on behalf of the institution.

Signature: ____________________________________
Name: _________________________________________
Title: ________________________________________
Date: _________________________________________

---
FOR INTERNAL USE ONLY

Received by: __________________________________
Date: _________________________________________

Deletion Completed by: ________________________
Date: _________________________________________

Verification:
[ ] Production data deleted
[ ] Backups deleted
[ ] Cognito account deleted
[ ] Logs reviewed for residual data
[ ] Deletion certificate provided to institution

Notes: ________________________________________
```

## Recommended Retention Periods (Legal Review Required)

**These are EXAMPLES only, not legal advice**:

| Data Type | Suggested Retention | Rationale |
|-----------|---------------------|-----------|
| Active student records | Duration of enrollment + contract period | FERPA, contract |
| Inactive student records | 1-3 years after inactivity | Allow for re-enrollment |
| CloudTrail logs | 1-3 years | Security investigation, compliance audit |
| Application logs | 30-90 days | Debugging, short-term analysis |
| Backups | 30-90 days | Disaster recovery |
| Audit reports | 7 years | Legal/regulatory requirement |
| Billing records | 7 years | Tax law requirement |

**Critical**: These are examples only. Actual retention must be based on legal requirements, institutional policies, and contractual obligations.

---

## Policy Review and Updates

**Review Frequency**: Annually or when:
- Laws change (new state privacy laws)
- Contracts change
- Technology changes (new data storage systems)
- After data breach or audit finding

**Last Reviewed**: January 14, 2026  
**Next Review**: January 14, 2027

---

**CRITICAL**: This is a template policy. It requires legal review, definition of all UNDEFINED timeframes, and operational validation before implementation. Improper data retention or deletion can result in FERPA violations, breach of contract, or destruction of records needed for legal defense.
