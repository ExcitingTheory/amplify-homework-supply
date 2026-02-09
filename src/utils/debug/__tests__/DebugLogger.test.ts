import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import DebugLogger, { LogLevel, LogEntry } from '../DebugLogger';

describe('DebugLogger', () => {
  let logger: DebugLogger;
  let originalConsole: typeof console;

  beforeEach(() => {
    // Save original console methods
    originalConsole = { ...console };
    
    // Create fresh logger instance
    logger = new DebugLogger();
  });

  afterEach(() => {
    // Restore original console methods
    logger.restore();
  });

  describe('console interception', () => {
    it('should capture console.log messages', () => {
      console.log('Test message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('log');
      expect(logs[0].message).toBe('Test message');
    });

    it('should capture console.warn messages', () => {
      console.warn('Warning message');
      
      const logs = logger.getLogs();
      expect(logs[0].level).toBe('warn');
      expect(logs[0].message).toBe('Warning message');
    });

    it('should capture console.error messages', () => {
      console.error('Error message');
      
      const logs = logger.getLogs();
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toBe('Error message');
    });

    it('should capture console.info messages', () => {
      console.info('Info message');
      
      const logs = logger.getLogs();
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Info message');
    });

    it('should capture console.debug messages', () => {
      console.debug('Debug message');
      
      const logs = logger.getLogs();
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Debug message');
    });

    it('should capture multiple arguments as JSON string', () => {
      console.log('User:', { id: 1, name: 'John' }, 'logged in');
      
      const logs = logger.getLogs();
      expect(logs[0].message).toContain('User:');
      expect(logs[0].message).toContain('id');
      expect(logs[0].message).toContain('John');
      expect(logs[0].message).toContain('logged in');
    });

    it('should capture stack trace for error messages', () => {
      console.error('Error message with stack');
      
      const logs = logger.getLogs();
      expect(logs[0].stack).toBeDefined();
      expect(typeof logs[0].stack).toBe('string');
    });

    it('should not capture stack for non-error messages', () => {
      console.log('Regular message');
      
      const logs = logger.getLogs();
      // stack is null for non-error messages
      expect(logs[0].stack).toBeNull();
    });
  });

  describe('getLogs filtering', () => {
    beforeEach(() => {
      console.log('Log message 1');
      console.warn('Warning message');
      console.error('Error message');
      console.log('Log message 2');
    });

    it('should return all logs when no filter provided', () => {
      const logs = logger.getLogs();
      expect(logs).toHaveLength(4);
    });

    it('should filter by log level', () => {
      const errorLogs = logger.getLogs({ level: 'error' });
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Error message');
    });

    it('should filter by search term', () => {
      const warningLogs = logger.getLogs({ search: 'Warning' });
      expect(warningLogs).toHaveLength(1);
      expect(warningLogs[0].message).toBe('Warning message');
    });

    it('should filter by timestamp (since)', async () => {
      const now = Date.now();
      
      // Wait a bit and add another log
      await new Promise(resolve => setTimeout(resolve, 10));
      console.log('New log');
      
      const recentLogs = logger.getLogs({ since: now });
      expect(recentLogs.length).toBeGreaterThan(0);
      expect(recentLogs[recentLogs.length - 1].message).toContain('New log');
    });

    it('should combine multiple filters', () => {
      const filtered = logger.getLogs({ level: 'log', search: 'message 2' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].message).toBe('Log message 2');
    });

    it('should return empty array when no logs match filter', () => {
      const filtered = logger.getLogs({ search: 'nonexistent' });
      expect(filtered).toEqual([]);
    });
  });

  describe('subscribe', () => {
    it('should call subscriber when new log is added', () => {
      const subscriber = vi.fn();
      logger.subscribe(subscriber);
      
      console.log('New log');
      
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(expect.objectContaining({ 
        message: 'New log',
        level: 'log'
      }));
    });

    it('should support multiple subscribers', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      
      logger.subscribe(subscriber1);
      logger.subscribe(subscriber2);
      
      console.log('Test');
      
      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const subscriber = vi.fn();
      const unsubscribe = logger.subscribe(subscriber);
      
      console.log('Message 1');
      expect(subscriber).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      subscriber.mockClear();
      
      console.log('Message 2');
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should remove all captured logs', () => {
      console.log('Test 1');
      console.log('Test 2');
      console.log('Test 3');
      
      expect(logger.getLogs()).toHaveLength(3);
      
      logger.clear();
      
      expect(logger.getLogs()).toHaveLength(0);
    });

    it('should notify subscribers after clearing', () => {
      console.log('Test');
      
      const subscriber = vi.fn();
      logger.subscribe(subscriber);
      
      logger.clear();
      
      // clear() calls notifyListeners(null)
      expect(subscriber).toHaveBeenCalledWith(null);
    });
  });

  describe('exportJSON', () => {
    it('should export logs as JSON string', () => {
      console.log('Test message');
      
      const json = logger.exportJSON();
      
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include all log entries in export', () => {
      console.log('Log 1');
      console.warn('Warning');
      console.error('Error');
      
      const exported = JSON.parse(logger.exportJSON());
      
      expect(exported.logs).toHaveLength(3);
      expect(exported.logs[0].message).toBe('Log 1');
      expect(exported.logs[1].message).toBe('Warning');
      expect(exported.logs[2].message).toBe('Error');
    });

    it('should include metadata in export', () => {
      console.log('Test');
      
      const exported = JSON.parse(logger.exportJSON());
      
      expect(exported.timestamp).toBeDefined();
      expect(exported.metadata.totalLogs).toBe(1);
      expect(exported.metadata.version).toBeDefined();
    });
  });

  describe('restore', () => {
    it('should restore original console methods', () => {
      const originalLog = console.log;
      
      // Logger intercepts console
      logger = new DebugLogger();
      expect(console.log).not.toBe(originalLog);
      
      // Restore original
      logger.restore();
      expect(console.log).toBe(originalLog);
    });

    it('should stop capturing logs after restore', () => {
      logger.restore();
      
      console.log('After restore');
      
      // Should not capture this log
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('max log limit', () => {
    it('should enforce max log limit of 1000', () => {
      // Add 1100 logs
      for (let i = 0; i < 1100; i++) {
        console.log(`Log ${i}`);
      }
      
      const logs = logger.getLogs();
      
      // Should only keep last 1000
      expect(logs).toHaveLength(1000);
      expect(logs[0].message).toBe('Log 100'); // First 100 dropped
      expect(logs[999].message).toBe('Log 1099');
    });
  });

  describe('edge cases', () => {
    it('should handle logging objects with circular references', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      expect(() => {
        console.log('Circular:', circular);
      }).not.toThrow();
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('Circular:');
    });

    it('should handle logging undefined', () => {
      console.log(undefined);
      
      const logs = logger.getLogs();
      expect(logs[0].message).toContain('undefined');
    });

    it('should handle logging null', () => {
      console.log(null);
      
      const logs = logger.getLogs();
      expect(logs[0].message).toContain('null');
    });

    it('should handle logging errors', () => {
      const error = new Error('Test error');
      console.error(error);
      
      const logs = logger.getLogs();
      // JSON.stringify(Error) returns '{}', but stack should be captured
      expect(logs[0].level).toBe('error');
      expect(logs[0].stack).toBeDefined();
    });
  });
});
