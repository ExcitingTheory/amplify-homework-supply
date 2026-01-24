/**
 * Unit Tests for useAutoScroll Hook
 */

import { renderHook, act } from '@testing-library/react';
import { useAutoScroll } from '../hooks/useAutoScroll';

describe('useAutoScroll', () => {
  let mockContainer;

  beforeEach(() => {
    // Create mock container ref
    mockContainer = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 500,
      scrollTo: jest.fn(),
    };
  });

  describe('Initialization', () => {
    it('initializes with isAtBottom true', () => {
      const containerRef = { current: mockContainer };
      const { result } = renderHook(() => 
        useAutoScroll([], containerRef)
      );
      
      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.hasNewMessages).toBe(false);
    });

    it('scrolls to bottom on mount if messages exist', () => {
      const messages = [{ id: '1', text: 'Test' }];
      const containerRef = { current: mockContainer };
      
      renderHook(() => useAutoScroll(messages, containerRef));
      
      // Should call scrollTo on mount
      expect(mockContainer.scrollTo).toHaveBeenCalled();
    });
  });

  describe('checkIfAtBottom', () => {
    it('returns true when scrolled to bottom', () => {
      mockContainer.scrollTop = 500; // scrollHeight (1000) - clientHeight (500) = 500
      const containerRef = { current: mockContainer };
      const { result } = renderHook(() => 
        useAutoScroll([], containerRef)
      );
      
      act(() => {
        result.current.handleScroll();
      });
      
      expect(result.current.isAtBottom).toBe(true);
    });

    it('returns true when within bottomThreshold', () => {
      mockContainer.scrollTop = 475; // 25px from bottom, within 50px threshold
      const containerRef = { current: mockContainer };
      const { result } = renderHook(() => 
        useAutoScroll([], containerRef, { bottomThreshold: 50 })
      );
      
      act(() => {
        result.current.handleScroll();
      });
      
      expect(result.current.isAtBottom).toBe(true);
    });

    it('returns false when scrolled up beyond threshold', () => {
      mockContainer.scrollTop = 400; // 100px from bottom, beyond 50px threshold
      const containerRef = { current: mockContainer };
      const { result } = renderHook(() => 
        useAutoScroll([], containerRef, { bottomThreshold: 50 })
      );
      
      act(() => {
        result.current.handleScroll();
      });
      
      expect(result.current.isAtBottom).toBe(false);
    });
  });

  describe('Auto-scroll on New Messages', () => {
    it('auto-scrolls when new message added and already at bottom', () => {
      const containerRef = { current: mockContainer };
      const { rerender } = renderHook(
        ({ messages }) => useAutoScroll(messages, containerRef),
        { initialProps: { messages: [{ id: '1' }] } }
      );
      
      // User at bottom
      mockContainer.scrollTop = 500;
      
      // Add new message
      rerender({ messages: [{ id: '1' }, { id: '2' }] });
      
      // Should auto-scroll
      expect(mockContainer.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ top: mockContainer.scrollHeight })
      );
    });

    it('shows new messages indicator when scrolled up and new message arrives', () => {
      const containerRef = { current: mockContainer };
      const { result, rerender } = renderHook(
        ({ messages }) => useAutoScroll(messages, containerRef),
        { initialProps: { messages: [{ id: '1' }] } }
      );
      
      // Scroll up
      mockContainer.scrollTop = 100;
      act(() => {
        result.current.handleScroll();
      });
      
      // Add new message
      rerender({ messages: [{ id: '1' }, { id: '2' }] });
      
      // Should show indicator, NOT auto-scroll
      expect(result.current.hasNewMessages).toBe(true);
      expect(mockContainer.scrollTo).not.toHaveBeenCalledWith(
        expect.objectContaining({ top: mockContainer.scrollHeight })
      );
    });

    it('clears new messages indicator when user scrolls to bottom', () => {
      const containerRef = { current: mockContainer };
      const { result, rerender } = renderHook(
        ({ messages }) => useAutoScroll(messages, containerRef),
        { initialProps: { messages: [{ id: '1' }] } }
      );
      
      // Scroll up and add message
      mockContainer.scrollTop = 100;
      rerender({ messages: [{ id: '1' }, { id: '2' }] });
      
      expect(result.current.hasNewMessages).toBe(true);
      
      // User scrolls to bottom
      mockContainer.scrollTop = 500;
      act(() => {
        result.current.handleScroll();
      });
      
      expect(result.current.hasNewMessages).toBe(false);
    });
  });

  describe('scrollToBottom', () => {
    it('scrolls to bottom with smooth behavior by default', () => {
      const containerRef = { current: mockContainer };
      const { result } = renderHook(() => 
        useAutoScroll([], containerRef)
      );
      
      act(() => {
        result.current.scrollToBottom();
      });
      
      expect(mockContainer.scrollTo).toHaveBeenCalledWith({
        top: mockContainer.scrollHeight,
        behavior: 'smooth',
      });
    });

    it('scrolls instantly when force=true', () => {
      const containerRef = { current: mockContainer };
      const { result } = renderHook(() => 
        useAutoScroll([], containerRef)
      );
      
      act(() => {
        result.current.scrollToBottom(true);
      });
      
      expect(mockContainer.scrollTo).toHaveBeenCalledWith({
        top: mockContainer.scrollHeight,
        behavior: 'auto',
      });
    });

    it('respects smoothScroll option', () => {
      const containerRef = { current: mockContainer };
      const { result } = renderHook(() => 
        useAutoScroll([], containerRef, { smoothScroll: false })
      );
      
      act(() => {
        result.current.scrollToBottom();
      });
      
      expect(mockContainer.scrollTo).toHaveBeenCalledWith({
        top: mockContainer.scrollHeight,
        behavior: 'auto',
      });
    });

    it('updates isAtBottom state', () => {
      const containerRef = { current: mockContainer };
      const { result } = renderHook(() => 
        useAutoScroll([], containerRef)
      );
      
      // Scroll up
      mockContainer.scrollTop = 100;
      act(() => {
        result.current.handleScroll();
      });
      expect(result.current.isAtBottom).toBe(false);
      
      // Scroll to bottom programmatically
      act(() => {
        result.current.scrollToBottom();
      });
      
      expect(result.current.isAtBottom).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles null container ref', () => {
      const containerRef = { current: null };
      const { result } = renderHook(() => 
        useAutoScroll([], containerRef)
      );
      
      // Should not throw
      expect(() => {
        act(() => {
          result.current.handleScroll();
          result.current.scrollToBottom();
        });
      }).not.toThrow();
    });

    it('handles empty messages array', () => {
      const containerRef = { current: mockContainer };
      const { result } = renderHook(() => 
        useAutoScroll([], containerRef)
      );
      
      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.hasNewMessages).toBe(false);
    });

    it('handles message removal', () => {
      const containerRef = { current: mockContainer };
      const { rerender } = renderHook(
        ({ messages }) => useAutoScroll(messages, containerRef),
        { initialProps: { messages: [{ id: '1' }, { id: '2' }] } }
      );
      
      // Remove a message
      rerender({ messages: [{ id: '1' }] });
      
      // Should not show "new messages" indicator
      expect(mockContainer.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Options', () => {
    it('respects custom bottomThreshold', () => {
      const containerRef = { current: mockContainer };
      const { result } = renderHook(() => 
        useAutoScroll([], containerRef, { bottomThreshold: 100 })
      );
      
      // 75px from bottom should still be "at bottom" with 100px threshold
      mockContainer.scrollTop = 425;
      act(() => {
        result.current.handleScroll();
      });
      
      expect(result.current.isAtBottom).toBe(true);
    });
  });
});
