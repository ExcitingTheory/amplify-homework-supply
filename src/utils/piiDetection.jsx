/**
 * PII (Personally Identifiable Information) Detection and Scrubbing Utility
 * 
 * Detects and removes sensitive information to protect student privacy and ensure FERPA compliance.
 * 
 * Detects:
 * - Email addresses
 * - Phone numbers (various formats)
 * - Names (via pattern matching)
 * - Social Security Numbers
 * - Credit card numbers
 * - IP addresses
 * - Street addresses (partial)
 * 
 * Usage:
 * ```javascript
 * import { detectPII, scru bPII, hasPII } from '@/utils/piiDetection';
 * 
 * const text = "Contact me at john.doe@email.com or 555-123-4567";
 * const detected = detectPII(text);
 * const scrubbed = scubPII(text);
 * const containsPII = hasPII(text);
 * ```
 */

/**
 * PII Detection Patterns
 */
export const PII_PATTERNS = {
  // Email: standard email format
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL_REDACTED]',
    type: 'email'
  },

  // Phone: US/International formats
  // Matches: (555) 123-4567, 555-123-4567, 555.123.4567, +1 555 123 4567, etc.
  phone: {
    pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: '[PHONE_REDACTED]',
    type: 'phone'
  },

  // SSN: 123-45-6789 or 123456789
  ssn: {
    pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    replacement: '[SSN_REDACTED]',
    type: 'ssn'
  },

  // Credit Card: 16-digit numbers (with optional spaces/dashes)
  creditCard: {
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replacement: '[CARD_REDACTED]',
    type: 'creditCard'
  },

  // IP Address: IPv4
  ipAddress: {
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: '[IP_REDACTED]',
    type: 'ipAddress'
  },

  // Street Address: number followed by street name
  // Simple pattern - catches "123 Main St" but not perfect
  streetAddress: {
    pattern: /\b\d{1,5}\s+([A-Z][a-z]+\s+){1,3}(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b/gi,
    replacement: '[ADDRESS_REDACTED]',
    type: 'streetAddress'
  },

  // Potential Names: Capitalized words (2-3 words) - less aggressive
  // Only detects when there's a clear name pattern like "John Smith" or "Mary Jane Doe"
  name: {
    pattern: /\b([A-Z][a-z]{2,}\s+){1,2}[A-Z][a-z]{2,}\b/g,
    replacement: '[NAME_REDACTED]',
    type: 'name',
    // This is aggressive and may have false positives
    aggressive: true
  },
};

/**
 * Detect PII in text
 * @param {string} text - Text to scan for PII
 * @param {Object} options - Detection options
 * @param {boolean} options.includeNames - Include name detection (may have false positives)
 * @param {boolean} options.includeAddresses - Include address detection
 * @returns {Array<Object>} - Array of detected PII items
 */
export function detectPII(text, options = {}) {
  const {
    includeNames = false,
    includeAddresses = true,
  } = options;

  if (!text || typeof text !== 'string') {
    return [];
  }

  const detected = [];

  Object.entries(PII_PATTERNS).forEach(([key, config]) => {
    // Skip aggressive patterns unless explicitly enabled
    if (config.aggressive && key === 'name' && !includeNames) {
      return;
    }
    if (key === 'streetAddress' && !includeAddresses) {
      return;
    }

    const matches = text.matchAll(config.pattern);
    for (const match of matches) {
      detected.push({
        type: config.type,
        value: match[0],
        index: match.index,
        length: match[0].length,
      });
    }
  });

  // Sort by index for easier processing
  return detected.sort((a, b) => a.index - b.index);
}

/**
 * Scrub (redact) PII from text
 * @param {string} text - Text to scrub
 * @param {Object} options - Scrubbing options
 * @param {boolean} options.includeNames - Scrub names (may have false positives)
 * @param {boolean} options.includeAddresses - Scrub addresses
 * @param {Object} options.customReplacements - Custom replacement text per type
 * @returns {string} - Scrubbed text
 */
export function scrubPII(text, options = {}) {
  const {
    includeNames = false,
    includeAddresses = true,
    customReplacements = {},
  } = options;

  if (!text || typeof text !== 'string') {
    return text;
  }

  let scrubbedText = text;

  Object.entries(PII_PATTERNS).forEach(([key, config]) => {
    // Skip aggressive patterns unless explicitly enabled
    if (config.aggressive && key === 'name' && !includeNames) {
      return;
    }
    if (key === 'streetAddress' && !includeAddresses) {
      return;
    }

    const replacement = customReplacements[config.type] || config.replacement;
    scrubbedText = scrubbedText.replace(config.pattern, replacement);
  });

  return scrubbedText;
}

/**
 * Check if text contains PII
 * @param {string} text - Text to check
 * @param {Object} options - Check options
 * @returns {boolean} - True if PII detected
 */
export function hasPII(text, options = {}) {
  const detected = detectPII(text, options);
  return detected.length > 0;
}

/**
 * Scrub PII from objects (recursively processes string values)
 * @param {Object|Array} data - Object or array to scrub
 * @param {Object} options - Scrubbing options
 * @param {Array<string>} options.excludeFields - Field names to skip (e.g., ['id', 'createdAt'])
 * @returns {Object|Array} - New object with scrubbed values
 */
export function scrubPIIFromObject(data, options = {}) {
  const { excludeFields = ['id', 'createdAt', 'updatedAt', '_version'], ...scrubOptions } = options;

  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => scrubPIIFromObject(item, options));
  }

  // Handle objects
  if (typeof data === 'object') {
    const scrubbed = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip excluded fields
      if (excludeFields.includes(key)) {
        scrubbed[key] = value;
        continue;
      }

      // Recursively process nested objects/arrays
      if (typeof value === 'object' && value !== null) {
        scrubbed[key] = scrubPIIFromObject(value, options);
      }
      // Scrub string values
      else if (typeof value === 'string') {
        scrubbed[key] = scrubPII(value, scrubOptions);
      }
      // Pass through other types
      else {
        scrubbed[key] = value;
      }
    }
    return scrubbed;
  }

  // Handle primitives
  if (typeof data === 'string') {
    return scrubPII(data, scrubOptions);
  }

  return data;
}

/**
 * Generate a PII detection report
 * @param {string} text - Text to analyze
 * @param {Object} options - Detection options
 * @returns {Object} - Report with statistics and findings
 */
export function generatePIIReport(text, options = {}) {
  const detected = detectPII(text, options);

  const report = {
    hasPII: detected.length > 0,
    totalFindings: detected.length,
    byType: {},
    findings: detected,
    riskLevel: 'low',
  };

  // Count by type
  detected.forEach(item => {
    report.byType[item.type] = (report.byType[item.type] || 0) + 1;
  });

  // Determine risk level
  if (detected.some(d => ['ssn', 'creditCard'].includes(d.type))) {
    report.riskLevel = 'critical';
  } else if (detected.some(d => ['email', 'phone', 'streetAddress'].includes(d.type))) {
    report.riskLevel = 'high';
  } else if (detected.some(d => ['name', 'ipAddress'].includes(d.type))) {
    report.riskLevel = 'medium';
  }

  return report;
}

/**
 * Validate that text is PII-free (for testing/validation)
 * @param {string} text - Text to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export function validatePIIFree(text, options = {}) {
  const detected = detectPII(text, options);

  return {
    valid: detected.length === 0,
    violations: detected,
    message: detected.length === 0
      ? 'No PII detected'
      : `Found ${detected.length} PII item(s): ${[...new Set(detected.map(d => d.type))].join(', ')}`,
  };
}

/**
 * Example usage and test cases
 */
export const PII_TEST_CASES = {
  email: 'Contact me at john.doe@example.com for details',
  phone: 'Call me at (555) 123-4567 or 555-987-6543',
  ssn: 'SSN: 123-45-6789',
  creditCard: 'Card number: 4532 1234 5678 9010',
  ipAddress: 'Server IP: 192.168.1.1',
  address: 'Lives at 123 Main Street',
  name: 'John Smith submitted the assignment',
  mixed: 'John Doe (john.doe@email.com, 555-123-4567) lives at 456 Oak Avenue',
  clean: 'This is just regular educational content about Japanese vocabulary',
};
