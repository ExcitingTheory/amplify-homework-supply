# Access Control & IAM Policy

## Document Status

**Last Updated**: January 14, 2026  
**Status**: TEMPLATE - Actual IAM configuration unknown  
**Owner**: Infrastructure Team  

---

**NOTICE**: This document describes what access controls SHOULD exist. Actual IAM roles, policies, and configurations are UNKNOWN and must be verified.

---

## Purpose

This document defines Identity and Access Management (IAM) policies, role-based access controls, and security procedures for AWS accounts.

## Principle of Least Privilege

**Policy**: Users and services receive only the minimum permissions necessary to perform their function.

**Current Compliance**: UNKNOWN

## IAM Account Structure

### Root Account

**Policy**: Root account credentials must NEVER be used for day-to-day operations.

**Required Controls**:
- ✅ MFA enabled: [STATUS - UNKNOWN]
- ✅ Access keys deleted: [STATUS - UNKNOWN]
- ✅ Password stored securely: [STATUS - UNKNOWN]
- ✅ Only used for: Account recovery, billing access, support cases requiring root

**Current Status**: UNKNOWN if root account secured

**Audit**: Check root account activity in CloudTrail monthly

### IAM Users vs. Roles

**Policy**: 
- Human users: IAM users with MFA
- Applications/services: IAM roles (no long-lived credentials)
- Cross-account access: IAM roles (AssumeRole)

**Current Configuration**: UNKNOWN

## Human User Access Levels

**Status**: UNDEFINED - Roles not documented

**Should Be Defined**:

### Administrator Role

**Who**: Infrastructure team leads, senior engineers

**Permissions**:
- Full access to AWS services
- Create/modify IAM policies
- Create/delete resources
- Access billing information

**Restrictions**:
- MFA required
- Cannot disable CloudTrail
- Cannot modify Organization SCPs (management account only)
- Session duration: [UNDEFINED, recommend: 4-8 hours]

**Current Status**: UNKNOWN if defined

### Developer Role

**Who**: Application developers

**Permissions**:
- Read/write access to application resources (Lambda, DynamoDB, S3)
- Read CloudWatch logs
- Deploy via CI/CD pipeline
- Cannot modify IAM policies
- Cannot access other customer accounts

**Restrictions**:
- MFA required
- No access to production data directly (only via application)
- Cannot delete tables or buckets
- Session duration: [UNDEFINED]

**Current Status**: UNKNOWN if defined

### Read-Only Role

**Who**: Security auditors, compliance team, customer success (limited cases)

**Permissions**:
- Read-only access to AWS services
- View CloudTrail logs
- View CloudWatch metrics
- Cannot modify any resources
- Cannot view sensitive data (encryption keys, student PII)

**Restrictions**:
- MFA required
- Time-limited access
- Audit all access

**Current Status**: UNKNOWN if defined

### Billing Role

**Who**: Finance team

**Permissions**:
- Access to billing console
- View cost reports
- Set up billing alerts
- No access to technical resources

**Restrictions**:
- MFA required
- Management account only

**Current Status**: UNKNOWN if defined

## Service Accounts and Roles

**Status**: UNDEFINED

### CI/CD Pipeline Role

**Used By**: Shared Services account (et-shared) CI/CD pipeline

**Permissions**:
- AssumeRole into target accounts (Customer Account 1, Customer Account 2, etc.)
- Deploy Amplify applications
- Update Lambda functions
- Modify infrastructure defined in code

**Restrictions**:
- Cannot access student data
- Cannot modify IAM policies
- Cannot delete production resources manually (only via IaC)
- Temporary credentials only (STS)

**Trust Policy**: Allow AssumeRole from et-shared account with conditions

**Current Status**: UNKNOWN if configured

### Application Lambda Role

**Used By**: Lambda functions processing student data

**Permissions**:
- Read/write specific DynamoDB tables
- Read/write specific S3 buckets
- Read secrets from Secrets Manager
- Write logs to CloudWatch

**Restrictions**:
- Cannot access other customer accounts' data
- Cannot modify IAM
- Cannot access tables/buckets outside designated resources

**Current Status**: UNKNOWN - Specific Lambda role policies unknown

### Cognito Role

**Used By**: Authenticated students via Cognito

**Permissions**:
- Access own data only (user-specific prefix in DynamoDB/S3)
- Cannot access other students' data
- Cannot access application backend directly

**Implementation**: Cognito Identity Pools with fine-grained access control

**Current Status**: UNKNOWN if identity pool configured with restrictive policies

## Cross-Account Access

### Shared Services → Customer Accounts

**Purpose**: CI/CD pipeline deployment

**Method**: IAM role assumption (STS AssumeRole)

**Trust Policy** (in Customer Accounts):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::238809176525:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "[UNIQUE_EXTERNAL_ID]"
        }
      }
    }
  ]
}
```

**Current Status**: UNKNOWN if configured

### Customer Accounts → Management Account

**Purpose**: Audit log delivery (CloudTrail)

**Method**: S3 bucket policy allowing log delivery

**Current Status**: UNKNOWN if configured

### No Cross-Account Access Between Customer Accounts

**Policy**: Customer Account 1 CANNOT access Customer Account 2 resources.

**Enforcement**: 
- No IAM roles allowing cross-customer access
- Separate AWS accounts ensure isolation
- Verified via IAM Access Analyzer (if configured)

**Current Status**: Assumed correct by architecture, not verified

## Multi-Factor Authentication (MFA)

**Policy**: MFA REQUIRED for all human IAM users.

**Enforcement**:
- IAM policy denies actions if MFA not present
- Console access requires MFA
- API/CLI access with MFA required for sensitive operations

**Example IAM Policy** (should be attached to all human users):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyAllExceptListedIfNoMFA",
      "Effect": "Deny",
      "NotAction": [
        "iam:CreateVirtualMFADevice",
        "iam:EnableMFADevice",
        "iam:GetUser",
        "iam:ListMFADevices",
        "iam:ListVirtualMFADevices",
        "iam:ResyncMFADevice",
        "sts:GetSessionToken"
      ],
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

**Current Status**: UNKNOWN if MFA enforced

**MFA Devices**:
- Virtual MFA (Google Authenticator, Authy): Allowed
- Hardware MFA tokens: Allowed
- SMS MFA: NOT ALLOWED (insecure)

## Password Policy

**Current Status**: UNKNOWN

**Required Password Policy**:
- Minimum length: 14 characters
- Require uppercase letters
- Require lowercase letters
- Require numbers
- Require symbols
- Password expiration: 90 days
- Password reuse prevention: Last 24 passwords
- Allow users to change password: Yes

**Setting via CLI**:
```bash
aws iam update-account-password-policy \
  --minimum-password-length 14 \
  --require-symbols \
  --require-numbers \
  --require-uppercase-characters \
  --require-lowercase-characters \
  --max-password-age 90 \
  --password-reuse-prevention 24 \
  --allow-users-to-change-password
```

**Verification Required**: Check actual password policy per account

## Access Key Management

**Policy**: Minimize use of long-lived access keys.

**Rules**:
- No access keys for root account
- Access keys rotated every 90 days maximum
- Unused access keys deleted
- Access keys never committed to code repositories
- Service accounts use IAM roles instead of access keys when possible

**Current Status**: UNKNOWN

**Monitoring** (should exist):
- Alert on access keys older than 90 days
- Alert on unused access keys
- Alert on root account access key creation
- Regular IAM credential report review

## Service Control Policies (SCPs)

**Management Account Only**

**Purpose**: Organizational guardrails preventing dangerous actions across all accounts

**Current Status**: UNKNOWN if SCPs configured

**Recommended SCPs**:

### Prevent CloudTrail Deletion
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "cloudtrail:StopLogging",
        "cloudtrail:DeleteTrail"
      ],
      "Resource": "*"
    }
  ]
}
```

### Prevent Region Usage Outside Approved Regions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "NotAction": [
        "cloudfront:*",
        "iam:*",
        "route53:*",
        "support:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": [
            "us-east-1",
            "ap-southeast-1"
          ]
        }
      }
    }
  ]
}
```

### Require MFA for Sensitive Actions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "ec2:TerminateInstances",
        "rds:DeleteDBInstance",
        "s3:DeleteBucket",
        "dynamodb:DeleteTable"
      ],
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

**Current Status**: UNKNOWN if any SCPs deployed

## Resource-Based Policies

### S3 Bucket Policies

**Policy**: All S3 buckets must have policies enforcing:
- Encryption in transit (deny non-HTTPS)
- Encryption at rest
- No public access (unless explicitly required and approved)

**Example Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::BUCKET_NAME",
        "arn:aws:s3:::BUCKET_NAME/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

**Current Status**: UNKNOWN if enforced on all buckets

### DynamoDB Table Policies

**Policy**: Fine-grained access control using IAM conditions

**Example** (Cognito users can only access their own data):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:REGION:ACCOUNT:table/TABLE_NAME",
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": [
            "${cognito-identity.amazonaws.com:sub}"
          ]
        }
      }
    }
  ]
}
```

**Current Status**: UNKNOWN if implemented

## Access Request and Provisioning

**Current Status**: UNDEFINED

**Should Be Defined**:

### New User Onboarding

1. Manager submits access request via [SYSTEM - UNDEFINED]
2. Security team reviews and approves
3. IAM user created with appropriate role
4. MFA device configured before any access granted
5. User completes security training: [TRAINING - UNDEFINED]
6. Access logged and audited

### Access Modification

1. Request submitted for role change
2. Security team reviews
3. Old permissions removed
4. New permissions granted
5. Change logged

### User Offboarding

1. HR notifies security team of departure
2. Access disabled within [TIMEFRAME - UNDEFINED, recommend: immediately]
3. Access keys deactivated
4. MFA device disassociated
5. User account deactivated (not deleted for audit trail)
6. Access to shared accounts reviewed and updated

## Access Reviews

**Current Status**: UNKNOWN if conducted

**Should Be Conducted**:

### Quarterly Access Review

- [ ] Review all IAM users and their assigned roles
- [ ] Verify users still require access
- [ ] Check for overly permissive policies
- [ ] Review unused credentials (access keys, passwords)
- [ ] Document review results

### Annual Comprehensive Audit

- [ ] Review all IAM roles and policies
- [ ] Check for policy drift from standards
- [ ] Review cross-account trust relationships
- [ ] Review service control policies
- [ ] Update this document

### Continuous Monitoring (if configured)

- IAM Access Analyzer: Detect overly permissive policies
- CloudWatch alarms: Unusual IAM activity
- Config rules: IAM compliance checks

## Temporary Access (Break-Glass)

**Purpose**: Emergency access when normal procedures fail

**Current Status**: UNDEFINED

**Should Exist**:
- Emergency admin account with highly privileged access
- Credentials stored securely (sealed envelope, password manager)
- Usage triggers immediate alert and review
- All actions logged and audited
- Access disabled after emergency resolved

## Federated Access

**Current Status**: UNKNOWN if implemented

**Option**: AWS SSO or third-party identity provider (Okta, Azure AD)

**Benefits**:
- Single sign-on for users
- Centralized user management
- Temporary credentials only
- Better audit trail

**Current Implementation**: UNKNOWN

## Security Best Practices Compliance

### AWS IAM Best Practices Checklist

- [ ] Root account MFA enabled
- [ ] Root account not used for day-to-day
- [ ] IAM users have MFA enabled
- [ ] No long-lived access keys for human users
- [ ] Access keys rotated regularly
- [ ] Least privilege policies
- [ ] Separate IAM users per person (no shared accounts)
- [ ] IAM roles for cross-account access
- [ ] IAM roles for EC2/Lambda instead of embedded credentials
- [ ] Regular access reviews conducted
- [ ] Password policy enforced
- [ ] CloudTrail logging IAM actions
- [ ] IAM Access Analyzer enabled

**Current Compliance**: UNKNOWN

## Monitoring and Alerting

**Should Alert On** (status UNKNOWN if configured):

| Event | Severity | Action |
|-------|----------|--------|
| Root account usage | P0 | Immediate investigation |
| IAM policy created/modified | P1 | Review change |
| MFA disabled for user | P1 | Verify authorized |
| New IAM user created | P2 | Verify authorized |
| Failed login attempts (>5) | P2 | Potential brute force |
| Access key older than 90 days | P3 | Rotate or delete |
| Unused IAM user (90+ days) | P3 | Disable user |

See: [MONITORING-RUNBOOK.md](MONITORING-RUNBOOK.md)

## IAM Quick Reference

### List All IAM Users
```bash
aws iam list-users
```

### Check If MFA Enabled for User
```bash
aws iam list-mfa-devices --user-name USERNAME
```

### Generate IAM Credential Report
```bash
aws iam generate-credential-report
aws iam get-credential-report --output text | base64 -d > credential-report.csv
```

### List Access Keys for User
```bash
aws iam list-access-keys --user-name USERNAME
```

### Deactivate Access Key
```bash
aws iam update-access-key --access-key-id KEYID --status Inactive --user-name USERNAME
```

### Check IAM Password Policy
```bash
aws iam get-account-password-policy
```

### List Roles and Their Policies
```bash
aws iam list-roles
aws iam list-attached-role-policies --role-name ROLE_NAME
```

### Review AssumeRole Trust Relationship
```bash
aws iam get-role --role-name ROLE_NAME --query 'Role.AssumeRolePolicyDocument'
```

## Making This Policy Operational

To implement this policy:

1. **Audit Current State**
   - Generate IAM credential report for all accounts
   - List all users, roles, and policies
   - Check MFA status
   - Check password policy
   - Identify deviations from this policy

2. **Define Missing Roles**
   - Create role definitions (Admin, Developer, Read-Only)
   - Document required permissions
   - Create IAM policies for each role

3. **Implement Controls**
   - Enable MFA for all users
   - Set password policy
   - Rotate old access keys
   - Remove unused users
   - Implement SCPs in management account

4. **Configure Monitoring**
   - CloudWatch alarms for IAM events
   - IAM Access Analyzer
   - Config rules for IAM compliance

5. **Document Procedures**
   - User onboarding process
   - Access request workflow
   - Offboarding process
   - Emergency access procedures

6. **Train Users**
   - Security awareness training
   - MFA setup instructions
   - Access key management
   - Incident reporting

## Related Documents

- [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md) - Response to compromised credentials
- [MONITORING-RUNBOOK.md](MONITORING-RUNBOOK.md) - IAM monitoring and alerts
- [SECURITY-OPERATIONS-RUNBOOK.md](SECURITY-OPERATIONS-RUNBOOK.md) - (To be created)
- [ACCOUNT-ARCHITECTURE.md](ACCOUNT-ARCHITECTURE.md) - Account structure

---

**CRITICAL**: This document describes what access controls SHOULD exist, not what DOES exist. Verify actual IAM configuration before assuming any security controls are in place. Improper IAM configuration is a leading cause of cloud security breaches.
