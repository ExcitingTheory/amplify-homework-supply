/**
 * Sanitization utilities for debug data
 * 
 * Converts complex types to serializable strings for debugging
 * Handles circular references, React elements, and large objects
 */

import React from 'react';

/**
 * Sanitize props to avoid circular references and large objects
 * Converts complex types to descriptive strings for debugging
 * 
 * @param props - Component props to sanitize
 * @returns Sanitized props safe for JSON serialization
 */
export function sanitizeProps(props: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!props) return {};
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function') {
      sanitized[key] = '[Function]';
    } else if (React.isValidElement(value)) {
      sanitized[key] = '[ReactElement]';
    } else if (value instanceof HTMLElement) {
      sanitized[key] = '[HTMLElement]';
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      sanitized[key] = `[Array(${value.length})]`;
    } else if (value && typeof value === 'object') {
      // Check for common object types
      const constructor = (value as { constructor?: { name?: string } }).constructor;
      if (constructor && constructor.name !== 'Object') {
        sanitized[key] = `[${constructor.name}]`;
      } else {
        sanitized[key] = `[Object: ${Object.keys(value).length} keys]`;
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize state object
 * Similar to sanitizeProps but handles state-specific patterns
 * 
 * @param state - Component state to sanitize
 * @returns Sanitized state safe for JSON serialization
 */
export function sanitizeState(state: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!state) return {};
  
  // State is similar to props, use same sanitization
  return sanitizeProps(state);
}

/**
 * Sanitize a DataStore model for debugging
 * Removes large data fields while keeping structure and metadata
 * 
 * @param model - DataStore model instance
 * @returns Sanitized model safe for debugging
 */
export function sanitizeModel(model: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!model) return null;
  
  const sanitized = { ...model };
  
  // Remove large binary/JSON data fields
  const largeFields = ['data', 'audio', 'video', 'content', 'body'];
  largeFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string' && (sanitized[field] as string).length > 100) {
      sanitized[field] = `[${typeof sanitized[field]}: ${(sanitized[field] as string).length} chars]`;
    }
  });
  
  // Keep only essential fields
  const essential: Record<string, unknown> = {
    id: sanitized.id,
    _version: sanitized._version,
    _lastChangedAt: sanitized._lastChangedAt,
    _deleted: sanitized._deleted,
  };
  
  // Include other non-sensitive, small fields
  Object.keys(sanitized).forEach(key => {
    if (
      !key.startsWith('_') && 
      !['id', 'data', 'audio', 'video', 'content', 'body'].includes(key) &&
      ['string', 'number', 'boolean'].includes(typeof sanitized[key])
    ) {
      essential[key] = sanitized[key];
    }
  });
  
  return essential;
}

/**
 * Sanitize an error object for serialization
 * 
 * @param error - Error to sanitize
 * @returns Serializable error representation
 */
export function sanitizeError(error: Error | null | undefined): Record<string, unknown> | null {
  if (!error) return null;
  
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: (error as { code?: string | number }).code,
    type: error.constructor?.name || 'Error',
  };
}
