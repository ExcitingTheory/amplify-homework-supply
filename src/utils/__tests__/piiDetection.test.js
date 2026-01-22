/**
 * Tests for PII Detection and Scrubbing
 */

import { describe, test, expect } from 'vitest';
import {
  detectPII,
  scrubPII,
  hasPII,
  scrubPIIFromObject,
  generatePIIReport,
  validatePIIFree,
  PII_TEST_CASES,
} from '../piiDetection';

describe('PII Detection', () => {
  describe('detectPII', () => {
    test('detects email addresses', () => {
      const detected = detectPII(PII_TEST_CASES.email);
      expect(detected).toHaveLength(1);
      expect(detected[0].type).toBe('email');
      expect(detected[0].value).toBe('john.doe@example.com');
    });

    test('detects phone numbers', () => {
      const detected = detectPII(PII_TEST_CASES.phone);
      expect(detected.length).toBeGreaterThanOrEqual(2);
      expect(detected.every(d => d.type === 'phone')).toBe(true);
    });

    test('detects SSN', () => {
      const detected = detectPII(PII_TEST_CASES.ssn);
      expect(detected).toHaveLength(1);
      expect(detected[0].type).toBe('ssn');
    });

    test('detects credit card numbers', () => {
      const detected = detectPII(PII_TEST_CASES.creditCard);
      expect(detected).toHaveLength(1);
      expect(detected[0].type).toBe('creditCard');
    });

    test('detects IP addresses', () => {
      const detected = detectPII(PII_TEST_CASES.ipAddress);
      expect(detected).toHaveLength(1);
      expect(detected[0].type).toBe('ipAddress');
    });

    test('detects street addresses', () => {
      const detected = detectPII(PII_TEST_CASES.address);
      expect(detected.some(d => d.type === 'streetAddress')).toBe(true);
    });

    test('detects names when enabled', () => {
      const detected = detectPII(PII_TEST_CASES.name, { includeNames: true });
      expect(detected.some(d => d.type === 'name')).toBe(true);
    });

    test('does not detect names by default', () => {
      const detected = detectPII(PII_TEST_CASES.name);
      expect(detected.every(d => d.type !== 'name')).toBe(true);
    });

    test('returns empty array for clean text', () => {
      const detected = detectPII(PII_TEST_CASES.clean);
      expect(detected).toHaveLength(0);
    });

    test('detects multiple PII types', () => {
      const detected = detectPII(PII_TEST_CASES.mixed, { includeNames: true });
      const types = new Set(detected.map(d => d.type));
      expect(types.has('email')).toBe(true);
      expect(types.has('phone')).toBe(true);
    });
  });

  describe('scrubPII', () => {
    test('scrubs email addresses', () => {
      const scrubbed = scrubPII(PII_TEST_CASES.email);
      expect(scrubbed).toContain('[EMAIL_REDACTED]');
      expect(scrubbed).not.toContain('john.doe@example.com');
    });

    test('scrubs phone numbers', () => {
      const scrubbed = scrubPII(PII_TEST_CASES.phone);
      expect(scrubbed).toContain('[PHONE_REDACTED]');
      expect(scrubbed).not.toContain('555-123-4567');
    });

    test('scrubs SSN', () => {
      const scrubbed = scrubPII(PII_TEST_CASES.ssn);
      expect(scrubbed).toContain('[SSN_REDACTED]');
      expect(scrubbed).not.toContain('123-45-6789');
    });

    test('scrubs credit card', () => {
      const scrubbed = scrubPII(PII_TEST_CASES.creditCard);
      expect(scrubbed).toContain('[CARD_REDACTED]');
    });

    test('scrubs IP addresses', () => {
      const scrubbed = scrubPII(PII_TEST_CASES.ipAddress);
      expect(scrubbed).toContain('[IP_REDACTED]');
      expect(scrubbed).not.toContain('192.168.1.1');
    });

    test('preserves clean text', () => {
      const scrubbed = scrubPII(PII_TEST_CASES.clean);
      expect(scrubbed).toBe(PII_TEST_CASES.clean);
    });

    test('supports custom replacements', () => {
      const scrubbed = scrubPII(PII_TEST_CASES.email, {
        customReplacements: { email: '***REDACTED***' },
      });
      expect(scrubbed).toContain('***REDACTED***');
      expect(scrubbed).not.toContain('[EMAIL_REDACTED]');
    });

    test('scrubs names when enabled', () => {
      const scrubbed = scrubPII(PII_TEST_CASES.name, { includeNames: true });
      expect(scrubbed).toContain('[NAME_REDACTED]');
    });
  });

  describe('hasPII', () => {
    test('returns true for text with PII', () => {
      expect(hasPII(PII_TEST_CASES.email)).toBe(true);
      expect(hasPII(PII_TEST_CASES.phone)).toBe(true);
      expect(hasPII(PII_TEST_CASES.mixed)).toBe(true);
    });

    test('returns false for clean text', () => {
      expect(hasPII(PII_TEST_CASES.clean)).toBe(false);
    });
  });

  describe('scrubPIIFromObject', () => {
    test('scrubs PII from object properties', () => {
      const data = {
        name: 'John Smith',
        email: 'test@example.com',
        message: 'Call me at 555-1234',
      };

      const scrubbed = scrubPIIFromObject(data, { includeNames: true });

      expect(scrubbed.email).toBe('[EMAIL_REDACTED]');
      expect(scrubbed.message).toContain('[PHONE_REDACTED]');
    });

    test('scrubs nested objects', () => {
      const data = {
        user: {
          contact: {
            email: 'test@example.com',
          },
        },
      };

      const scrubbed = scrubPIIFromObject(data);
      expect(scrubbed.user.contact.email).toBe('[EMAIL_REDACTED]');
    });

    test('scrubs arrays', () => {
      const data = [
        { email: 'test1@example.com' },
        { email: 'test2@example.com' },
      ];

      const scrubbed = scrubPIIFromObject(data);
      expect(scrubbed[0].email).toBe('[EMAIL_REDACTED]');
      expect(scrubbed[1].email).toBe('[EMAIL_REDACTED]');
    });

    test('excludes specified fields', () => {
      const data = {
        id: '123-45-6789', // Looks like SSN but should be excluded
        ssn: '987-65-4321', // Should be scrubbed
      };

      const scrubbed = scrubPIIFromObject(data, {
        excludeFields: ['id'],
      });

      expect(scrubbed.id).toBe('123-45-6789'); // Preserved
      expect(scrubbed.ssn).toBe('[SSN_REDACTED]'); // Scrubbed
    });
  });

  describe('generatePIIReport', () => {
    test('generates report for clean text', () => {
      const report = generatePIIReport(PII_TEST_CASES.clean);
      expect(report.hasPII).toBe(false);
      expect(report.totalFindings).toBe(0);
      expect(report.riskLevel).toBe('low');
    });

    test('generates report for text with email', () => {
      const report = generatePIIReport(PII_TEST_CASES.email);
      expect(report.hasPII).toBe(true);
      expect(report.totalFindings).toBeGreaterThan(0);
      expect(report.byType.email).toBe(1);
      expect(report.riskLevel).toBe('high');
    });

    test('assigns critical risk for SSN/credit card', () => {
      const report = generatePIIReport(PII_TEST_CASES.ssn);
      expect(report.riskLevel).toBe('critical');
    });

    test('counts findings by type', () => {
      const report = generatePIIReport(PII_TEST_CASES.mixed, { includeNames: true });
      expect(report.byType).toBeDefined();
      expect(Object.keys(report.byType).length).toBeGreaterThan(0);
    });
  });

  describe('validatePIIFree', () => {
    test('validates clean text', () => {
      const result = validatePIIFree(PII_TEST_CASES.clean);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('invalidates text with PII', () => {
      const result = validatePIIFree(PII_TEST_CASES.email);
      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.message).toContain('email');
    });
  });

  describe('Edge cases', () => {
    test('handles null/undefined input', () => {
      expect(detectPII(null)).toEqual([]);
      expect(detectPII(undefined)).toEqual([]);
      expect(scrubPII(null)).toBe(null);
      expect(scrubPII(undefined)).toBe(undefined);
    });

    test('handles empty string', () => {
      expect(detectPII('')).toEqual([]);
      expect(scrubPII('')).toBe('');
    });

    test('handles non-string input', () => {
      expect(detectPII(123)).toEqual([]);
      expect(scrubPII(123)).toBe(123);
    });
  });
});
