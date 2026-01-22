/**
 * Unit tests for hexToRgb.js
 * Tests hex color to RGB conversion
 */

import { describe, it, expect } from 'vitest';
import { hexToRgb } from '../hexToRgb.js';

describe('hexToRgb', () => {
  it('should convert standard 6-digit hex to RGB', () => {
    const result = hexToRgb('#FF0000');
    
    expect(result).toEqual({ r: 255, g: 0, b: 0 });
  });
  
  it('should convert various hex colors correctly', () => {
    const testCases = [
      { hex: '#000000', expected: { r: 0, g: 0, b: 0 } },          // Black
      { hex: '#FFFFFF', expected: { r: 255, g: 255, b: 255 } },   // White
      { hex: '#FF0000', expected: { r: 255, g: 0, b: 0 } },        // Red
      { hex: '#00FF00', expected: { r: 0, g: 255, b: 0 } },        // Green
      { hex: '#0000FF', expected: { r: 0, g: 0, b: 255 } },        // Blue
      { hex: '#808080', expected: { r: 128, g: 128, b: 128 } },    // Gray
      { hex: '#FF5733', expected: { r: 255, g: 87, b: 51 } },      // Orange
      { hex: '#A52A2A', expected: { r: 165, g: 42, b: 42 } },      // Brown
      { hex: '#FFC0CB', expected: { r: 255, g: 192, b: 203 } },    // Pink
    ];
    
    testCases.forEach(({ hex, expected }) => {
      const result = hexToRgb(hex);
      expect(result).toEqual(expected);
    });
  });
  
  it('should handle lowercase hex values', () => {
    const result = hexToRgb('#ff5733');
    
    expect(result).toEqual({ r: 255, g: 87, b: 51 });
  });
  
  it('should handle mixed case hex values', () => {
    const result = hexToRgb('#FfA5Cd');
    
    expect(result).toEqual({ r: 255, g: 165, b: 205 });
  });
  
  it('should return correct RGB object structure', () => {
    const result = hexToRgb('#123456');
    
    expect(result).toHaveProperty('r');
    expect(result).toHaveProperty('g');
    expect(result).toHaveProperty('b');
    expect(typeof result.r).toBe('number');
    expect(typeof result.g).toBe('number');
    expect(typeof result.b).toBe('number');
  });
  
  it('should handle edge case hex values', () => {
    const testCases = [
      { hex: '#010101', expected: { r: 1, g: 1, b: 1 } },
      { hex: '#FEFEFE', expected: { r: 254, g: 254, b: 254 } },
      { hex: '#00FF00', expected: { r: 0, g: 255, b: 0 } },
    ];
    
    testCases.forEach(({ hex, expected }) => {
      const result = hexToRgb(hex);
      expect(result).toEqual(expected);
    });
  });
  
  it('should convert hex with leading hash symbol', () => {
    const result = hexToRgb('#3498db');
    
    expect(result.r).toBe(52);
    expect(result.g).toBe(152);
    expect(result.b).toBe(219);
  });
  
  it('should handle common CSS colors', () => {
    const cssColors = [
      { name: 'Red', hex: '#FF0000', expected: { r: 255, g: 0, b: 0 } },
      { name: 'Lime', hex: '#00FF00', expected: { r: 0, g: 255, b: 0 } },
      { name: 'Blue', hex: '#0000FF', expected: { r: 0, g: 0, b: 255 } },
      { name: 'Yellow', hex: '#FFFF00', expected: { r: 255, g: 255, b: 0 } },
      { name: 'Cyan', hex: '#00FFFF', expected: { r: 0, g: 255, b: 255 } },
      { name: 'Magenta', hex: '#FF00FF', expected: { r: 255, g: 0, b: 255 } },
    ];
    
    cssColors.forEach(({ name, hex, expected }) => {
      const result = hexToRgb(hex);
      expect(result).toEqual(expected);
    });
  });
  
  it('should parse each color channel independently', () => {
    const result = hexToRgb('#AABBCC');
    
    expect(result.r).toBe(parseInt('AA', 16));
    expect(result.g).toBe(parseInt('BB', 16));
    expect(result.b).toBe(parseInt('CC', 16));
  });
  
  it('should handle hex values with all same digits', () => {
    const result = hexToRgb('#333333');
    
    expect(result).toEqual({ r: 51, g: 51, b: 51 });
  });
});
