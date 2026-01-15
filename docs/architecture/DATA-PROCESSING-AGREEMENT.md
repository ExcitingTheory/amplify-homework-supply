# Data Processing Agreement (DPA)

## Document Status

**Last Updated**: January 14, 2026  
**Status**: TEMPLATE - Requires legal review  
**Type**: Legal contract for educational institutions  
**Legal Review**: REQUIRED before use  

---

**NOTICE**: This is a template Data Processing Agreement. It must be reviewed and approved by qualified legal counsel before execution. Do not execute this agreement without legal review.

---

# DATA PROCESSING AGREEMENT

This Data Processing Agreement ("DPA") is entered into as of \_\_\_\_\_\_\_\_\_\_ ("Effective Date") between:

**[COMPANY NAME - UNDEFINED]** ("Service Provider" or "Processor")  
Address: [ADDRESS - UNDEFINED]

and

**[EDUCATIONAL INSTITUTION NAME]** ("Institution" or "Controller")  
Address: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

## Recitals

WHEREAS, Institution is an educational institution subject to the Family Educational Rights and Privacy Act ("FERPA"), 20 U.S.C. § 1232g;

WHEREAS, Service Provider provides educational technology services to Institution;

WHEREAS, In providing services, Service Provider will process Student Education Records (as defined by FERPA) on behalf of Institution;

WHEREAS, The parties wish to define their respective responsibilities regarding the processing of Student Education Records;

NOW, THEREFORE, the parties agree as follows:

## 1. Definitions

**1.1 Student Education Records**: Records directly related to a student and maintained by Institution or a party acting on behalf of Institution, as defined in FERPA 34 CFR § 99.3.

**1.2 Personally Identifiable Information (PII)**: Information that, alone or in combination, is linked to a specific student and includes:
- Student name
- Parent/guardian name
- Student or family address
- Personal identifier (SSN, student ID number)
- Indirect identifiers (date of birth, place of birth, mother's maiden name)
- Other information that makes student's identity traceable

**1.3 Services**: The educational technology services described in the Master Services Agreement between the parties, specifically: [SERVICES DESCRIPTION - UNDEFINED]

**1.4 Sub-processor**: Third party engaged by Service Provider to process Student Education Records. Current sub-processors listed in Exhibit A.

## 2. Service Provider's Role Under FERPA

**2.1 School Official Status**: Service Provider acts as a "school official" with "legitimate educational interests" as those terms are defined under FERPA 34 CFR § 99.31(a)(1).

**2.2 Limited Purpose**: Service Provider may access Student Education Records solely to perform the Services and for no other purpose.

**2.3 Prohibition on Re-disclosure**: Service Provider shall not re-disclose Student Education Records or PII to any third party except:
- To Sub-processors listed in Exhibit A
- As directed by Institution in writing
- As required by applicable law with notice to Institution (unless legally prohibited)

## 3. Data Processing Obligations

**3.1 Permitted Processing**: Service Provider shall process Student Education Records only:
- To provide the Services to Institution
- To maintain and improve the Services' functionality
- To ensure system security and prevent fraud  
- To comply with applicable legal obligations
- [OTHER SPECIFIC PURPOSES - UNDEFINED]

**3.2 Prohibited Processing**: Service Provider shall NOT:
- Use Student Education Records for advertising or marketing
- Create profiles of students for non-educational purposes
- Sell or rent Student Education Records to third parties
- Disclose Student Education Records to third parties except as permitted in Section 2.3
- Retain Student Education Records beyond the period specified in Section 6

**3.3 Data Minimization**: Service Provider shall process only the minimum Student Education Records necessary to provide the Services.

## 4. Security Measures

**4.1 Required Safeguards**: Service Provider shall implement and maintain appropriate technical and organizational measures to protect Student Education Records, including:

**Technical Measures** (Current Status - See ACCOUNT-ARCHITECTURE.md):
- Encryption in transit using TLS 1.2 or higher
- Encryption at rest for databases and file storage
- Secure authentication mechanisms
- Access logging and monitoring
- [OTHER MEASURES - UNDEFINED]

**Organizational Measures** (Current Status - UNDEFINED):
- Role-based access controls
- Background checks for personnel with data access: [IF IMPLEMENTED - UNDEFINED]
- Security awareness training: [FREQUENCY - UNDEFINED]
- Incident response procedures (see INCIDENT-RESPONSE-PLAN.md)
- [OTHER MEASURES - UNDEFINED]

**4.2 Industry Standards**: Service Provider represents that its security measures meet or exceed industry standards for protecting student data, including but not limited to:
- SOC 2 Type II controls: [STATUS - UNDEFINED]
- ISO 27001 certification: [STATUS - UNDEFINED]
- NIST Cybersecurity Framework: [STATUS - UNDEFINED]

**4.3 Security Limitations**: Service Provider acknowledges:
- Student Education Records are NOT end-to-end encrypted (Service Provider can technically access data)
- Sub-processors (including AWS) can technically access data
- No security system is 100% secure

**4.4 Security Assessments**: Service Provider shall:
- Conduct security assessments: [FREQUENCY - UNDEFINED]
- Provide summary results to Institution upon request
- Remediate identified vulnerabilities: [TIMEFRAME - UNDEFINED]

## 5. Sub-processors

**5.1 Current Sub-processors**: Service Provider currently engages the sub-processors listed in Exhibit A.

**5.2 New Sub-processors**: Service Provider shall:
- Notify Institution at least 30 days before engaging a new sub-processor
- Provide Institution with information about the sub-processor's data processing activities
- Obtain Institution's written consent before engagement (consent not unreasonably withheld)

**5.3 Sub-processor Obligations**: Service Provider shall ensure that each sub-processor:
- Is subject to written obligations substantially similar to this DPA
- Implements appropriate security measures
- Does not use Student Education Records for unauthorized purposes

**5.4 Liability**: Service Provider remains fully liable to Institution for sub-processor's acts or omissions.

## 6. Data Retention and Deletion

**6.1 Retention During Service Term**: Service Provider shall retain Student Education Records during the term of the Services.

**6.2 Retention After Termination**: 
- Standard retention: [TIMEFRAME - UNDEFINED] after service termination
- Institution may request earlier deletion
- Backups retained for: [TIMEFRAME - UNDEFINED]

**6.3 Deletion Procedures**: Upon termination or Institution's written request, Service Provider shall:
- Delete all Student Education Records within: [TIMEFRAME - UNDEFINED]
- Provide written certification of deletion
- Deletion method: Secure overwriting using [METHOD - UNDEFINED]

**6.4 Legal Hold Exception**: Service Provider may retain Student Education Records if required by applicable law, and shall:
- Notify Institution of legal retention requirement
- Delete data promptly when legal obligation ends
- Continue to protect retained data under this DPA

## 7. Student and Parent Rights

**7.1 Right to Access**: Service Provider shall, within [TIMEFRAME - UNDEFINED] of Institution's request:
- Provide access to a student's education records for Institution's review
- Provide data in a usable electronic format

**7.2 Right to Correction**: Service Provider shall, within [TIMEFRAME - UNDEFINED] of Institution's request:
- Correct inaccurate Student Education Records as directed by Institution

**7.3 Right to Deletion**: Service Provider shall, within [TIMEFRAME - UNDEFINED] of Institution's request:
- Delete specified Student Education Records
- Provide written confirmation of deletion

**7.4 Institution Responsibility**: Institution is responsible for:
- Receiving and responding to student/parent requests
- Determining whether requests should be granted under applicable law
- Directing Service Provider's actions in response to requests

## 8. Data Breach Notification

**8.1 Breach Definition**: A "Data Breach" means unauthorized access to, acquisition of, or disclosure of Student Education Records that compromises the security or privacy of such records.

**8.2 Notification Obligations**: In the event of a Data Breach, Service Provider shall:

**Immediate Actions** (within 1 hour of discovery):
- Contain the breach
- Preserve evidence for investigation
- Begin investigation to determine scope

**Institution Notification** (within 24 hours of discovery):
- Notify Institution's designated contact: [CONTACT - TO BE PROVIDED BY INSTITUTION]
- Provide known details: date of breach, affected records, cause, remediation steps
- Provide updates as investigation progresses

**8.3 Required Information**: Notification shall include:
- Description of the Data Breach
- Types of Student Education Records involved
- Number of students affected (or good faith estimate)
- Steps Service Provider is taking to investigate and remediate
- Contact information for Institution's questions
- Whether law enforcement has been notified

**8.4 Student/Parent Notification**: Service Provider shall:
- NOT notify students or parents directly (Institution's responsibility)
- Cooperate with Institution's notification efforts
- Provide information Institution needs for its notifications

**8.5 Regulatory Notification**: 
- Institution is responsible for regulatory notifications required by FERPA and state breach notification laws
- Service Provider shall cooperate and provide necessary information

**8.6 Costs**: Service Provider shall bear the costs of:
- Breach investigation and remediation
- Required notifications
- Credit monitoring or identity protection services: [IF APPLICABLE - UNDEFINED]

**8.7 No Waiver**: This section does not constitute a waiver of Institution's rights or remedies for Data Breach.

## 9. Compliance and Audits

**9.1 Compliance with Laws**: Service Provider shall comply with:
- FERPA (20 U.S.C. § 1232g and 34 CFR Part 99)
- COPPA (15 U.S.C. §§ 6501-6506) if applicable
- Applicable state student privacy laws
- [OTHER APPLICABLE LAWS - UNDEFINED]

**9.2 Audit Rights**: Institution or its designated auditor may:
- Audit Service Provider's compliance with this DPA
- Frequency: No more than once per year (unless Data Breach occurs)
- Notice: At least 30 days' written notice
- Timing: During Service Provider's normal business hours
- Scope: Systems and processes related to Student Education Records

**9.3 Audit Cooperation**: Service Provider shall:
- Cooperate with audit requests
- Provide access to relevant systems, logs, and documentation
- Respond to audit findings within: [TIMEFRAME - UNDEFINED]

**9.4 Audit Reports**: Service Provider may provide SOC 2 Type II or similar audit reports in lieu of Institution-conducted audit, if acceptable to Institution.

**9.5 Costs**: Each party bears its own audit costs unless audit reveals material non-compliance, in which case Service Provider bears reasonable audit costs.

## 10. Data Location and Transfers

**10.1 Data Storage Locations**: Student Education Records are stored in the following AWS regions:
- us-east-1 (US East - Virginia, United States)
- ap-southeast-1 (Asia Pacific - Singapore) [if applicable to Institution]

**10.2 Cross-Border Transfers**: 
- Data does NOT automatically transfer between regions
- Institution data stored in: [SPECIFIC REGION - TO BE SPECIFIED]

**10.3 International Transfer Safeguards** (if applicable):
- AWS Privacy Shield certification: [STATUS - UNDEFINED]
- Standard Contractual Clauses: [IF IMPLEMENTED - UNDEFINED]
- Institution consent required for data transfer outside United States

## 11. Transparency and Reporting

**11.1 Annual Report**: Service Provider shall provide Institution with an annual report including:
- Confirmation of compliance with this DPA
- Summary of security measures
- Any Data Breaches or security incidents
- Changes to sub-processors
- [OTHER INFORMATION - UNDEFINED]

**11.2 Incident Reports**: Service Provider shall report security incidents (even if not a Data Breach) within [TIMEFRAME - UNDEFINED].

**11.3 Access Logs**: Service Provider shall maintain logs of access to Student Education Records and provide to Institution upon request.

## 12. Term and Termination

**12.1 Term**: This DPA is effective as of the Effective Date and continues while Service Provider processes Student Education Records on behalf of Institution.

**12.2 Termination**: This DPA terminates upon the later of:
- Termination of the Master Services Agreement
- Deletion of all Student Education Records per Section 6

**12.3 Survival**: Sections 4 (Security), 6 (Data Retention), 8 (Breach Notification), and 13 (Liability) survive termination.

## 13. Liability and Indemnification

**13.1 Service Provider Liability**: Service Provider is liable for:
- Unauthorized use or disclosure of Student Education Records caused by Service Provider
- Data Breaches caused by Service Provider's negligence or willful misconduct
- Violation of this DPA

**13.2 Indemnification**: Service Provider shall indemnify and hold harmless Institution from:
- Claims arising from Service Provider's violation of FERPA or this DPA
- Claims arising from Data Breach caused by Service Provider
- Costs of breach notification and remediation
- Regulatory fines or penalties resulting from Service Provider's non-compliance

**13.3 Limitation**: [LIMITATION OF LIABILITY TERMS - SUBJECT TO NEGOTIATION AND LEGAL REVIEW]

## 14. General Provisions

**14.1 Governing Law**: This DPA is governed by the laws of [STATE - UNDEFINED].

**14.2 Amendment**: This DPA may be amended only by written agreement signed by both parties.

**14.3 Entire Agreement**: This DPA, together with the Master Services Agreement, constitutes the entire agreement regarding Student Education Records.

**14.4 Severability**: If any provision is found invalid, the remaining provisions remain in effect.

**14.5 Notices**: All notices under this DPA shall be sent to:

**For Institution**:  
[TO BE COMPLETED BY INSTITUTION]

**For Service Provider**:  
[NAME - UNDEFINED]  
[ADDRESS - UNDEFINED]  
[EMAIL - UNDEFINED]

**14.6 Order of Precedence**: In case of conflict between this DPA and the Master Services Agreement, this DPA controls regarding Student Education Records.

## 15. Special Provisions for COPPA (if applicable)

If students under 13 years old will use the Services:

**15.1 School Consent**: Service Provider relies on Institution's consent under the "school official" exception to COPPA.

**15.2 No Unauthorized Disclosure**: Service Provider shall not disclose children's personal information to third parties (except sub-processors).

**15.3 Parental Rights**: Service Provider shall cooperate with Institution to facilitate parental:
- Review of child's information
- Deletion of child's information
- Refusal to permit further collection of child's information

**15.4 Data Minimization**: Service Provider collects only information necessary for educational purposes.

## Signatures

**[COMPANY NAME - UNDEFINED]** (Service Provider)

By: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Name: [UNDEFINED]  
Title: [UNDEFINED]  
Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**[EDUCATIONAL INSTITUTION NAME]** (Institution)

By: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Title: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

# EXHIBIT A: SUB-PROCESSORS

## Current Sub-processors

### Amazon Web Services (AWS)

**Entity Name**: Amazon Web Services, Inc.  
**Service Provided**: Cloud infrastructure and hosting  
**Data Processed**: All Student Education Records stored in Service Provider's systems  
**Data Location**: 
- us-east-1 (US East - Virginia, United States)
- ap-southeast-1 (Asia Pacific - Singapore) [if applicable]

**Privacy Policy**: https://aws.amazon.com/privacy/  
**Compliance**: SOC 2, ISO 27001, FERPA-compliant  
**Additional Information**: https://aws.amazon.com/compliance/ferpa/

### [OTHER SUB-PROCESSORS - UNDEFINED]

**Status**: Define any other third-party services that process student data:
- Analytics services
- Error tracking services
- Customer support tools
- Backup services
- etc.

For each sub-processor, include:
- Entity name and contact information
- Service provided
- What student data is accessed
- Data location
- Privacy policy link
- Compliance certifications

---

# EXHIBIT B: TECHNICAL AND ORGANIZATIONAL MEASURES

## Current Security Measures

See [ACCOUNT-ARCHITECTURE.md](ACCOUNT-ARCHITECTURE.md) and [DATA-FLOW-DIAGRAMS.md](DATA-FLOW-DIAGRAMS.md) for detailed technical architecture.

### Data Encryption

**In Transit**:
- TLS 1.2 or higher for all data transmission
- HTTPS for all web endpoints
- VPC endpoints for AWS service communication

**At Rest**:
- DynamoDB encryption: [AWS managed keys or Customer managed KMS keys - UNDEFINED]
- S3 encryption: [SSE-S3 or SSE-KMS - UNDEFINED]
- RDS encryption: [If applicable - UNDEFINED]
- EBS encryption: [If applicable - UNDEFINED]

### Access Controls

**Authentication**:
- Cognito User Pools for student authentication
- IAM for administrative access
- Multi-factor authentication: [STATUS - UNDEFINED]

**Authorization**:
- Role-based access control (RBAC)
- Principle of least privilege
- Segregation of customer data by AWS account

### Logging and Monitoring

**Audit Logging**:
- CloudTrail for API activity: [STATUS - UNDEFINED]
- CloudWatch for application logs: [STATUS - UNDEFINED]
- Log retention: [TIMEFRAME - UNDEFINED]
- Log integrity validation: [STATUS - UNDEFINED]

**Monitoring**:
- CloudWatch alarms: [SPECIFIC ALARMS - UNDEFINED]
- Security Hub: [STATUS - UNDEFINED]
- AWS Config: [STATUS - UNDEFINED]

### Network Security

- Security Groups: Restrictive inbound/outbound rules
- Network ACLs: [IF CONFIGURED - UNDEFINED]
- AWS WAF: [IF CONFIGURED - UNDEFINED]
- DDoS protection via CloudFront: [IF CONFIGURED - UNDEFINED]

### Organizational Measures

**Personnel**:
- Background checks: [IF CONDUCTED - UNDEFINED]
- Security training: [FREQUENCY - UNDEFINED]
- Access provisioning/de-provisioning: [PROCESS - UNDEFINED]

**Policies**:
- Incident response procedures: See INCIDENT-RESPONSE-PLAN.md
- Change management: [PROCESS - UNDEFINED]
- Backup and disaster recovery: [PROCESS - UNDEFINED]

### Physical Security

Handled by AWS data centers:
- 24/7 security personnel
- Biometric access controls
- Video surveillance
- Environmental controls

See: https://aws.amazon.com/compliance/data-center/controls/

### Backup and Disaster Recovery

**Backup**:
- DynamoDB point-in-time recovery: [STATUS - UNDEFINED]
- S3 versioning: [STATUS - UNDEFINED]
- RDS automated backups: [IF APPLICABLE - UNDEFINED]
- Backup retention: [TIMEFRAME - UNDEFINED]

**Disaster Recovery**:
- Recovery Time Objective (RTO): [UNDEFINED]
- Recovery Point Objective (RPO): [UNDEFINED]
- Failover procedures: [UNDEFINED]

---

# EXHIBIT C: INSTITUTIONAL DATA CONTACT INFORMATION

To be completed by Institution:

**Primary Contact for Data Matters**:  
Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Title: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Email: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Phone: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Data Breach Notification Contact** (24/7 availability):  
Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Email: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Phone: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Alternate Phone: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Legal/Compliance Contact**:  
Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Title: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Email: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
Phone: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## Template Completion Checklist

Before executing this DPA:

- [ ] Legal review by qualified education law attorney
- [ ] Complete all [UNDEFINED] fields
- [ ] Verify security measures are accurately described
- [ ] Complete Exhibit A with all sub-processors
- [ ] Verify Exhibit B technical measures match actual implementation
- [ ] Define retention and deletion timeframes
- [ ] Define breach notification timeframes
- [ ] Define audit and reporting timeframes
- [ ] Establish limitation of liability terms (legal review required)
- [ ] Verify state law compliance
- [ ] Obtain executive approval for signature
- [ ] Provide to Institution for review before execution

---

**CRITICAL**: This is a template only. It requires legal review, substantial customization, and approval before execution. Do not execute this agreement without qualified legal counsel review. FERPA compliance failures can result in loss of federal education funding for institutions and legal liability for service providers.
