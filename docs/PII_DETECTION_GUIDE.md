# PII Detection and Scrubbing System

## Overview

The PII (Personally Identifiable Information) detection and scrubbing system protects student privacy by identifying and removing sensitive information from user-generated content. This is critical for FERPA compliance in educational contexts.

**Location**: [src/utils/piiDetection.js](../src/utils/piiDetection.js)

## Detected PII Types

### High-Priority (Always Detected)
- ✅ **Email addresses**: `john.doe@example.com`
- ✅ **Phone numbers**: `(555) 123-4567`, `555-123-4567`, `+1 555 123 4567`
- ✅ **SSN**: `123-45-6789`
- ✅ **Credit card numbers**: `4532 1234 5678 9010`
- ✅ **IP addresses**: `192.168.1.1`

### Optional (Opt-in)
- ⚠️ **Names**: `John Smith` (may have false positives, disabled by default)
- ⚠️ **Street addresses**: `123 Main Street` (opt-in with `includeAddresses: true`)

## Quick Start

### Basic Usage

```javascript
import { detectPII, scrubPII, hasPII } from '@/utils/piiDetection';

// Check if content contains PII
const text = "Contact me at john.doe@email.com or 555-123-4567";
const containsPII = hasPII(text); // true

// Get detailed detection results
const detected = detectPII(text);
// [
//   { type: 'email', value: 'john.doe@email.com', index: 14, length: 20 },
//   { type: 'phone', value: '555-123-4567', index: 38, length: 12 }
// ]

// Scrub PII from text
const scrubbed = scrubPII(text);
// "Contact me at [EMAIL_REDACTED] or [PHONE_REDACTED]"
// OR replace with custom placeholders like a a placeholder email or phone number, are there issues if we did 1:1 replacements?
```

### Scrub Objects

```javascript
import { scrubPIIFromObject } from '@/utils/piiDetection';

const gradeData = {
  studentAnswer: "My email is student@school.edu and phone 555-1234",
  metadata: {
    contact: "teacher@school.edu"
  }
};

const scrubbedGrade = scrubPIIFromObject(gradeData);
// {
//   studentAnswer: "My email is [EMAIL_REDACTED] and phone [PHONE_REDACTED]",
//   metadata: { contact: "[EMAIL_REDACTED]" }
// }
```

### Generate Reports

```javascript
import { generatePIIReport } from '@/utils/piiDetection';

const report = generatePIIReport(text);
// {
//   hasPII: true,
//   totalFindings: 2,
//   byType: { email: 1, phone: 1 },
//   findings: [...],
//   riskLevel: 'high' // 'low' | 'medium' | 'high' | 'critical'
// }
```

## Integration Patterns

### Before Saving Student Work

```javascript
import { hasPII, scrubPII } from '@/utils/piiDetection';
import { DataStore } from 'aws-amplify/datastore';
import { Grade } from '@/models';

async function saveStudentGrade(gradeData) {
  // Check for PII
  if (hasPII(gradeData.studentAnswer)) {
    console.warn('[PII Detected] Student submission contains PII');
    
    // Option 1: Scrub automatically
    gradeData.studentAnswer = scrubPII(gradeData.studentAnswer);
    
    // Option 2: Warn instructor
    // notifyInstructor('PII detected in student submission');
  }

  await DataStore.save(new Grade(gradeData));
}
```

### Export Data with Privacy

```javascript
import { scrubPIIFromObject } from '@/utils/piiDetection';

async function exportGrades(sectionId) {
  const grades = await DataStore.query(Grade, g => g.sectionID.eq(sectionId));
  
  // Scrub all PII before export
  const scrubbedGrades = grades.map(grade => 
    scrubPIIFromObject(grade, {
      excludeFields: ['id', 'createdAt', 'owner'], // Preserve metadata
      includeNames: true, // Be extra cautious on export
    })
  );

  return scrubbedGrades;
}
```

### Validation Before Sharing

```javascript
import { validatePIIFree } from '@/utils/piiDetection';

function canSharePublicly(content) {
  const validation = validatePIIFree(content, {
    includeNames: true,
    includeAddresses: true,
  });

  if (!validation.valid) {
    return {
      canShare: false,
      reason: validation.message,
      violations: validation.violations,
    };
  }

  return { canShare: true };
}
```

## Advanced Options

### Custom Replacements

```javascript
const scrubbed = scrubPII(text, {
  customReplacements: {
    email: '***REDACTED_EMAIL***',
    phone: '***REDACTED_PHONE***',
  }
});
```

### Exclude Specific Fields

```javascript
const scrubbed = scrubPIIFromObject(data, {
  excludeFields: ['id', 'createdAt', 'updatedAt', '_version'],
  includeNames: true,
});
```

### Name Detection (Use with Caution)

```javascript
// Names are NOT detected by default (high false positive rate)
const detected = detectPII(text, { includeNames: true });
const scrubbed = scrubPII(text, { includeNames: true });
```

**Warning**: Name detection may flag:
- Proper nouns (cities, products)
- Japanese romanization: "Tanaka Hiroshi"
- Multi-word concepts: "Main Street"

Only enable for high-security contexts (exports, public sharing).

## Risk Levels

The `generatePIIReport()` function assigns risk levels:

- **Critical**: SSN or credit card detected
- **High**: Email, phone, or address detected
- **Medium**: Names or IP addresses detected
- **Low**: No PII detected

## Testing

Unit tests: [src/utils/__tests__/piiDetection.test.js](../src/utils/__tests__/piiDetection.test.js)

```bash
npm test piiDetection.test.js
```

Test cases cover:
- All PII types
- Edge cases (null, undefined, empty)
- Nested objects and arrays
- Custom replacements
- Exclusion patterns

## FERPA Compliance Notes

### Educational Records Protection

FERPA requires protecting student educational records. PII in student work qualifies as educational records.

**Required Actions**:
1. ✅ Detect PII before sharing student work publicly
2. ✅ Scrub PII from exports and reports
3. ✅ Log PII detection events for auditing
4. ✅ Provide instructor tools to review flagged content

### Recommended Workflows

**Student Submissions**:
```javascript
// Scan on save, warn instructor if detected
if (hasPII(grade.studentAnswer)) {
  grade.piiDetected = true; // Flag for instructor review
  logAuditEvent('pii_detected', { gradeId: grade.id });
}
```

**Public Sharing**:
```javascript
// Always scrub before making content public
const publicContent = scrubPIIFromObject(content, {
  includeNames: true, // Be aggressive for public sharing
  includeAddresses: true,
});
```

**Data Exports**:
```javascript
// Generate PII report before allowing export
const report = generatePIIReport(exportData);
if (report.riskLevel === 'critical') {
  throw new Error('Cannot export: Critical PII detected');
}
```

## Integration with Moderation System

PII detection complements the existing content moderation system ([CONTENT_MODERATION.md](./CONTENT_MODERATION.md)):

- **Moderation**: Checks for inappropriate/harmful content
- **PII Detection**: Checks for sensitive personal information

Both should be used together:

```javascript
import { moderateContent } from '@/utils/moderateContent';
import { detectPII, scrubPII } from '@/utils/piiDetection';

async function validateContent(text) {
  // Check for inappropriate content
  const moderation = await moderateContent(text);
  
  // Check for PII
  const pii = detectPII(text);

  return {
    safe: !moderation.flagged && pii.length === 0,
    moderation,
    pii,
  };
}
```

## Future Enhancements

- [ ] ML-based name detection (fewer false positives)
- [ ] Student ID pattern detection (configurable per institution)
- [ ] Date of birth detection
- [ ] Automatic scrubbing on model save hooks
- [ ] Admin dashboard for PII audit logs
- [ ] Batch PII scanning for legacy data
- [ ] International phone number formats
- [ ] Address parsing for non-US formats

## API Reference

### `detectPII(text, options)`
Scans text and returns array of detected PII items.

**Parameters**:
- `text` (string): Text to scan
- `options` (object):
  - `includeNames` (boolean): Enable name detection. Default: `false`
  - `includeAddresses` (boolean): Enable address detection. Default: `true`

**Returns**: `Array<{ type, value, index, length }>`

### `scrubPII(text, options)`
Replaces PII with redaction placeholders.

**Parameters**:
- `text` (string): Text to scrub
- `options` (object):
  - `includeNames` (boolean): Scrub names. Default: `false`
  - `includeAddresses` (boolean): Scrub addresses. Default: `true`
  - `customReplacements` (object): Custom placeholder text per type

**Returns**: `string`

### `hasPII(text, options)`
Quick check if text contains PII.

**Returns**: `boolean`

### `scrubPIIFromObject(data, options)`
Recursively scrubs PII from object/array.

**Parameters**:
- `data` (object|array): Data to scrub
- `options` (object):
  - `excludeFields` (array): Field names to skip. Default: `['id', 'createdAt', 'updatedAt', '_version']`
  - Plus all options from `scrubPII()`

**Returns**: New object with scrubbed values

### `generatePIIReport(text, options)`
Analyzes text and generates detailed PII report.

**Returns**: `{ hasPII, totalFindings, byType, findings, riskLevel }`

### `validatePIIFree(text, options)`
Validates that text contains no PII.

**Returns**: `{ valid, violations, message }`

## Support

For questions or issues:
- Review test cases in `__tests__/piiDetection.test.js`
- Check FERPA compliance requirements for your institution
- Consult security team for custom PII patterns
