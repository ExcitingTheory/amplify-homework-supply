# Compliance Audit Checklist

## Document Status

**Last Updated**: January 14, 2026  
**Status**: TEMPLATE - Actual compliance unknown  
**Owner**: Compliance Team / Infrastructure Team  

---

**NOTICE**: This checklist describes compliance requirements. Actual compliance status is UNKNOWN and must be verified.

---

## Purpose

This checklist helps verify compliance with FERPA, COPPA, and other applicable regulations for educational technology services.

## How to Use This Checklist

1. Review each item
2. Mark status: ✅ Compliant | ❌ Non-Compliant | ❓ Unknown | N/A Not Applicable
3. Document evidence for compliant items
4. Create remediation plan for non-compliant items
5. Conduct audit annually or before customer audits

## FERPA Compliance Checklist

**Family Educational Rights and Privacy Act**  
**Applies to**: All customer accounts in Institution OU

### Student Data Protection

- [ ] **Student data encrypted at rest**
  - Evidence: [REFERENCE TO ENCRYPTION CONFIGURATION]
  - Status: UNKNOWN
  
- [ ] **Student data encrypted in transit (TLS 1.2+)**
  - Evidence: [API GATEWAY/AMPLIFY CONFIGURATION]
  - Status: UNKNOWN

- [ ] **Access to student data restricted to authorized personnel only**
  - Evidence: [IAM POLICIES, ACCESS LOGS]
  - Status: UNKNOWN

- [ ] **Multi-factor authentication enforced for access to student data**
  - Evidence: [IAM MFA CONFIGURATION]
  - Status: UNKNOWN

- [ ] **Audit logging enabled for all access to student data**
  - Evidence: [CLOUDTRAIL CONFIGURATION]
  - Status: UNKNOWN

- [ ] **Audit logs retained for [TIMEFRAME]**
  - Evidence: [LOG RETENTION CONFIGURATION]
  - Status: UNDEFINED

### Data Processing Agreement

- [ ] **Data Processing Agreement signed with each educational institution**
  - Evidence: [EXECUTED DPA DOCUMENTS]
  - Status: UNKNOWN

- [ ] **DPA includes required FERPA provisions**
  - Reference: [DATA-PROCESSING-AGREEMENT.md](DATA-PROCESSING-AGREEMENT.md)
  - Status: TEMPLATE EXISTS, NOT EXECUTED

- [ ] **DPA specifies permitted uses of student data**
  - Status: TEMPLATE DEFINES, NOT EXECUTED

- [ ] **DPA prohibits unauthorized re-disclosure**
  - Status: TEMPLATE DEFINES, NOT EXECUTED

### Student and Parent Rights

- [ ] **Process exists for students/parents to access their data**
  - Evidence: [PROCEDURE DOCUMENTATION]
  - Status: UNDEFINED

- [ ] **Process exists for students/parents to correct inaccurate data**
  - Evidence: [PROCEDURE DOCUMENTATION]
  - Status: UNDEFINED

- [ ] **Process exists for students/parents to request deletion**
  - Evidence: [DELETION PROCEDURE, REQUEST FORM]
  - Status: UNDEFINED - See [DATA-RETENTION-POLICY.md](DATA-RETENTION-POLICY.md)

- [ ] **Requests processed within reasonable timeframe**
  - Target: [TIMEFRAME - UNDEFINED]
  - Status: UNDEFINED

### Data Breach Notification

- [ ] **Incident response plan includes FERPA breach notification procedures**
  - Reference: [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md)
  - Status: TEMPLATE EXISTS

- [ ] **Institutional contacts documented for breach notification**
  - Evidence: [CONTACT DATABASE]
  - Status: UNDEFINED

- [ ] **Breach notification template prepared**
  - Reference: [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md)
  - Status: TEMPLATE EXISTS

- [ ] **Staff trained on breach notification requirements**
  - Evidence: [TRAINING RECORDS]
  - Status: UNKNOWN

### Third-Party Disclosures

- [ ] **All sub-processors disclosed to institutions**
  - Evidence: [DPA EXHIBIT A]
  - Status: AWS LISTED IN TEMPLATE, NOT VERIFIED WITH INSTITUTIONS

- [ ] **No unauthorized third-party access to student data**
  - Evidence: [IAM POLICIES, NETWORK CONFIGURATION]
  - Status: UNKNOWN

- [ ] **Sub-processors bound by similar data protection obligations**
  - Evidence: [AWS BAA, OTHER AGREEMENTS]
  - Status: AWS BAA - STATUS UNKNOWN

### Data Retention and Deletion

- [ ] **Data retention policy documented**
  - Reference: [DATA-RETENTION-POLICY.md](DATA-RETENTION-POLICY.md)
  - Status: TEMPLATE EXISTS, NOT IMPLEMENTED

- [ ] **Student data deleted upon institutional request**
  - Evidence: [DELETION LOGS]
  - Status: PROCEDURE UNDEFINED

- [ ] **Backups included in deletion procedures**
  - Evidence: [BACKUP DELETION LOGS]
  - Status: PROCEDURE UNDEFINED

- [ ] **Data deletion verified and certified**
  - Evidence: [DELETION CERTIFICATES]
  - Status: PROCEDURE UNDEFINED

## COPPA Compliance Checklist

**Children's Online Privacy Protection Act**  
**Applies if**: Service used by children under 13

### Verifiable Parental Consent

- [ ] **School consent obtained under "school official" exception**
  - Evidence: [INSTITUTIONAL AGREEMENTS]
  - Status: UNKNOWN

- [ ] **School authorized to provide consent on behalf of parents**
  - Evidence: [DPA OR SERVICE AGREEMENT]
  - Status: DPA TEMPLATE INCLUDES

- [ ] **Not collecting personal information directly from children without school consent**
  - Evidence: [APPLICATION DESIGN, TERMS OF SERVICE]
  - Status: UNKNOWN

### Data Minimization

- [ ] **Collect only information necessary for educational purposes**
  - Evidence: [DATA INVENTORY, PRIVACY POLICY]
  - Status: UNKNOWN - NO DATA INVENTORY

- [ ] **No tracking of children for advertising**
  - Evidence: [PRIVACY POLICY, CODE REVIEW]
  - Status: ASSUMED NO ADVERTISING, NOT VERIFIED

- [ ] **No sharing children's information with third parties**
  - Evidence: [PRIVACY POLICY, TECHNICAL CONTROLS]
  - Status: PRIVACY POLICY TEMPLATE STATES, NOT VERIFIED

### Parental Rights

- [ ] **Parents can review child's information through institution**
  - Evidence: [PROCEDURE DOCUMENTATION]
  - Status: UNDEFINED

- [ ] **Parents can request deletion of child's information**
  - Evidence: [DELETION PROCEDURE]
  - Status: UNDEFINED

- [ ] **Parents can refuse further collection of child's information**
  - Evidence: [OPT-OUT PROCEDURE]
  - Status: UNDEFINED

### Security Safeguards

- [ ] **Enhanced security for children's data**
  - Evidence: [SAME AS ADULT DATA - ENCRYPTION, ACCESS CONTROLS]
  - Status: UNKNOWN

- [ ] **No collection of more data than necessary**
  - Evidence: [APPLICATION DESIGN REVIEW]
  - Status: UNKNOWN

## General Data Protection Compliance

### Data Security

- [ ] **Encryption at rest implemented for all sensitive data**
  - Services: DynamoDB, S3, RDS (if applicable)
  - Status: UNKNOWN

- [ ] **Encryption in transit implemented (TLS 1.2+)**
  - Services: All APIs, Amplify, AppSync
  - Status: UNKNOWN

- [ ] **Access controls based on principle of least privilege**
  - Evidence: [IAM POLICIES REVIEW]
  - Status: UNKNOWN

- [ ] **Regular access reviews conducted**
  - Frequency: [UNDEFINED]
  - Last Review: NEVER
  - Status: UNDEFINED

### Monitoring and Logging

- [ ] **CloudTrail enabled in all accounts**
  - Evidence: [CLOUDTRAIL STATUS PER ACCOUNT]
  - Status: UNKNOWN

- [ ] **CloudTrail logs centralized and secured**
  - Evidence: [S3 BUCKET CONFIGURATION]
  - Status: UNKNOWN

- [ ] **Log integrity validation enabled**
  - Evidence: [CLOUDTRAIL CONFIGURATION]
  - Status: UNKNOWN

- [ ] **Security monitoring and alerting configured**
  - Evidence: [CLOUDWATCH ALARMS, SECURITY HUB]
  - Status: UNKNOWN

- [ ] **Logs reviewed regularly for security incidents**
  - Frequency: [UNDEFINED]
  - Evidence: [REVIEW LOGS]
  - Status: UNDEFINED

### Backup and Disaster Recovery

- [ ] **Regular backups of student data**
  - Evidence: [BACKUP CONFIGURATION]
  - Status: UNKNOWN

- [ ] **Backups tested for restoration**
  - Frequency: [UNDEFINED]
  - Last Test: NEVER
  - Status: NEVER TESTED

- [ ] **Disaster recovery plan documented**
  - Reference: [DISASTER-RECOVERY-PLAN.md](DISASTER-RECOVERY-PLAN.md)
  - Status: TEMPLATE EXISTS, NEVER TESTED

- [ ] **RTO and RPO defined and achievable**
  - RTO: UNDEFINED
  - RPO: UNDEFINED
  - Status: NOT DEFINED

### Incident Response

- [ ] **Incident response plan documented**
  - Reference: [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md)
  - Status: TEMPLATE EXISTS, NEVER TESTED

- [ ] **Incident response team identified**
  - Evidence: [TEAM ROSTER, CONTACT INFO]
  - Status: UNDEFINED

- [ ] **Incident response procedures tested**
  - Last Test: NEVER
  - Status: NEVER TESTED

- [ ] **Staff trained on incident response**
  - Evidence: [TRAINING RECORDS]
  - Status: UNKNOWN

## AWS Security Best Practices

### Account Security

- [ ] **Root account MFA enabled (all accounts)**
  - Status per account: UNKNOWN

- [ ] **Root account not used for daily operations**
  - Evidence: [CLOUDTRAIL LOGS]
  - Status: UNKNOWN

- [ ] **IAM users have MFA enabled**
  - Evidence: [IAM CREDENTIAL REPORT]
  - Status: UNKNOWN

- [ ] **IAM password policy meets requirements**
  - Requirements: 14+ chars, complexity, 90 day expiration
  - Status: UNKNOWN

- [ ] **No long-lived access keys for human users**
  - Evidence: [IAM CREDENTIAL REPORT]
  - Status: UNKNOWN

### Network Security

- [ ] **Security groups follow least privilege**
  - Evidence: [SECURITY GROUP AUDIT]
  - Status: UNKNOWN

- [ ] **No security groups allow 0.0.0.0/0 except HTTP/HTTPS**
  - Evidence: [SECURITY GROUP AUDIT]
  - Status: UNKNOWN

- [ ] **VPC Flow Logs enabled**
  - Status: UNKNOWN

- [ ] **AWS WAF deployed for public endpoints**
  - Status: UNKNOWN

### Service Configuration

- [ ] **S3 buckets not publicly accessible (unless intended)**
  - Evidence: [S3 BUCKET POLICIES]
  - Status: UNKNOWN

- [ ] **S3 bucket versioning enabled for data buckets**
  - Evidence: [S3 CONFIGURATION]
  - Status: UNKNOWN

- [ ] **DynamoDB point-in-time recovery enabled**
  - Evidence: [DYNAMODB CONFIGURATION]
  - Status: UNKNOWN

- [ ] **Secrets stored in Secrets Manager (not hardcoded)**
  - Evidence: [CODE REVIEW, SECRETS MANAGER]
  - Status: UNKNOWN

### Compliance Services

- [ ] **AWS Config enabled**
  - Status: UNKNOWN

- [ ] **Config rules for compliance checking deployed**
  - Status: UNKNOWN

- [ ] **Security Hub enabled**
  - Status: UNKNOWN

- [ ] **GuardDuty enabled for threat detection**
  - Status: UNKNOWN

- [ ] **IAM Access Analyzer enabled**
  - Status: UNKNOWN

## Operational Compliance

### Change Management

- [ ] **Change management process documented**
  - Reference: [CHANGE-MANAGEMENT-PROCESS.md](CHANGE-MANAGEMENT-PROCESS.md)
  - Status: TEMPLATE EXISTS, NOT IMPLEMENTED

- [ ] **Infrastructure changes deployed via code (IaC)**
  - Evidence: [CDK CODE IN REPOSITORY]
  - Status: CODE EXISTS, DEPLOYMENT PROCESS UNKNOWN

- [ ] **Changes reviewed and approved before deployment**
  - Evidence: [CHANGE REQUEST RECORDS]
  - Status: UNDEFINED

### Access Management

- [ ] **Access provisioning process documented**
  - Reference: [ACCESS-CONTROL-IAM-POLICY.md](ACCESS-CONTROL-IAM-POLICY.md)
  - Status: TEMPLATE EXISTS, NOT IMPLEMENTED

- [ ] **Access removed promptly upon termination**
  - Evidence: [OFFBOARDING RECORDS]
  - Status: UNDEFINED

- [ ] **Regular access reviews conducted**
  - Frequency: Quarterly
  - Last Review: NEVER
  - Status: NOT CONDUCTED

### Security Operations

- [ ] **Daily security tasks performed**
  - Reference: [SECURITY-OPERATIONS-RUNBOOK.md](SECURITY-OPERATIONS-RUNBOOK.md)
  - Status: UNKNOWN

- [ ] **Weekly security tasks performed**
  - Status: UNKNOWN

- [ ] **Monthly security tasks performed**
  - Status: UNKNOWN

- [ ] **Security metrics tracked and reported**
  - Status: NO METRICS TRACKED

## Documentation Compliance

### Required Documentation

- [ ] **Privacy Policy published**
  - Reference: [PRIVACY-POLICY.md](PRIVACY-POLICY.md)
  - Status: TEMPLATE EXISTS, REQUIRES LEGAL REVIEW

- [ ] **Data Processing Agreement template**
  - Reference: [DATA-PROCESSING-AGREEMENT.md](DATA-PROCESSING-AGREEMENT.md)
  - Status: TEMPLATE EXISTS, REQUIRES LEGAL REVIEW

- [ ] **Incident Response Plan**
  - Reference: [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md)
  - Status: TEMPLATE EXISTS, NEVER TESTED

- [ ] **Disaster Recovery Plan**
  - Reference: [DISASTER-RECOVERY-PLAN.md](DISASTER-RECOVERY-PLAN.md)
  - Status: TEMPLATE EXISTS, NEVER TESTED

- [ ] **Data Retention Policy**
  - Reference: [DATA-RETENTION-POLICY.md](DATA-RETENTION-POLICY.md)
  - Status: TEMPLATE EXISTS, NOT IMPLEMENTED

- [ ] **Security policies documented**
  - Reference: [ACCESS-CONTROL-IAM-POLICY.md](ACCESS-CONTROL-IAM-POLICY.md), [SECURITY-OPERATIONS-RUNBOOK.md](SECURITY-OPERATIONS-RUNBOOK.md)
  - Status: TEMPLATES EXIST, NOT IMPLEMENTED

### Documentation Currency

- [ ] **All policies reviewed within last 12 months**
  - Status: NEWLY CREATED (January 2026)

- [ ] **Policies reflect actual practices**
  - Status: NO - Templates describe ideal state, not current state

- [ ] **Contact information current**
  - Status: UNDEFINED IN DOCUMENTS

## Training and Awareness

- [ ] **Security awareness training provided to all staff**
  - Frequency: [UNDEFINED]
  - Last Training: UNKNOWN
  - Status: UNKNOWN

- [ ] **FERPA training provided to staff with student data access**
  - Evidence: [TRAINING RECORDS]
  - Status: UNKNOWN

- [ ] **Incident response training conducted**
  - Evidence: [TRAINING RECORDS]
  - Status: UNKNOWN

- [ ] **Tabletop exercises conducted**
  - Frequency: [UNDEFINED]
  - Last Exercise: NEVER
  - Status: NEVER CONDUCTED

## Vendor Management

### AWS (Sub-processor)

- [ ] **AWS BAA signed (if handling PHI) or equivalent for FERPA**
  - Status: UNKNOWN

- [ ] **AWS compliance certifications verified**
  - SOC 2, ISO 27001, FERPA compliance
  - Status: ASSUMED (AWS publicly certified), NOT VERIFIED

- [ ] **AWS regions used documented**
  - Regions: us-east-1, ap-southeast-1
  - Status: DOCUMENTED IN ARCHITECTURE

### Other Vendors

- [ ] **All vendors with student data access identified**
  - Status: UNDEFINED

- [ ] **Data processing agreements with all vendors**
  - Status: UNDEFINED

- [ ] **Vendor security posture reviewed**
  - Status: UNDEFINED

## Audit Trail

### Last Internal Audit

- **Date**: NEVER CONDUCTED
- **Auditor**: N/A
- **Findings**: N/A
- **Remediation Status**: N/A

### Last External Audit

- **Date**: NEVER CONDUCTED
- **Auditor**: N/A
- **Type**: N/A
- **Findings**: N/A
- **Remediation Status**: N/A

### Regulatory Inspections

- **FERPA Complaint**: None known
- **COPPA Complaint**: None known
- **State Privacy Law Complaint**: None known

## Risk Assessment Summary

**Current Compliance Risk Level**: HIGH

**Reasons**:
- Most controls UNKNOWN or NOT IMPLEMENTED
- No testing of incident response or disaster recovery
- No security operations conducted regularly
- Documentation exists but not operationalized
- No audit trail of compliance verification

## Remediation Priority

**Critical (P0)** - Implement immediately:
1. Verify CloudTrail enabled in all accounts
2. Enable MFA for all IAM users
3. Verify encryption at rest for all data stores
4. Execute Data Processing Agreements with institutions
5. Define and document contact information for breaches

**High (P1)** - Implement within 30 days:
1. Configure security monitoring and alerts
2. Implement access review process
3. Test backup restoration
4. Conduct staff security training
5. Define data retention periods

**Medium (P2)** - Implement within 90 days:
1. Enable Security Hub, GuardDuty, Config
2. Implement automated compliance checking
3. Conduct disaster recovery test
4. Implement change management process
5. Complete privacy policy (legal review + publish)

**Low (P3)** - Implement within 180 days:
1. Implement full security operations runbook
2. Conduct external security audit
3. Implement automated remediation where possible
4. Comprehensive documentation review

## Ongoing Compliance Program

To maintain compliance:

1. **Quarterly**: Review this checklist and update status
2. **Annually**: Full compliance audit (internal or external)
3. **Continuously**: Monitor and alert on security events
4. **As needed**: Update documentation when practices change
5. **Before customer audits**: Complete this checklist and prepare evidence

## Related Documents

All compliance-related documents created:
- [ACCOUNT-ARCHITECTURE.md](ACCOUNT-ARCHITECTURE.md)
- [DATA-FLOW-DIAGRAMS.md](DATA-FLOW-DIAGRAMS.md)
- [PRIVACY-POLICY.md](PRIVACY-POLICY.md)
- [DATA-PROCESSING-AGREEMENT.md](DATA-PROCESSING-AGREEMENT.md)
- [INCIDENT-RESPONSE-PLAN.md](INCIDENT-RESPONSE-PLAN.md)
- [MONITORING-RUNBOOK.md](MONITORING-RUNBOOK.md)
- [DATA-RETENTION-POLICY.md](DATA-RETENTION-POLICY.md)
- [DISASTER-RECOVERY-PLAN.md](DISASTER-RECOVERY-PLAN.md)
- [ACCESS-CONTROL-IAM-POLICY.md](ACCESS-CONTROL-IAM-POLICY.md)
- [CHANGE-MANAGEMENT-PROCESS.md](CHANGE-MANAGEMENT-PROCESS.md)
- [SECURITY-OPERATIONS-RUNBOOK.md](SECURITY-OPERATIONS-RUNBOOK.md)
- [BUSINESS-CONTINUITY-PLAN.md](BUSINESS-CONTINUITY-PLAN.md) - (To be created)

---

**CRITICAL**: This checklist reveals significant compliance gaps. Most items are UNKNOWN or NOT IMPLEMENTED. This represents substantial risk for FERPA violations, data breaches, and loss of customer trust. Immediate action required to verify actual compliance status and implement missing controls.

**DO NOT** represent compliance to customers until items are verified and remediated. Misrepresenting compliance status can result in contract termination, regulatory penalties, and legal liability.
