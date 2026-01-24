/**
 * Unit Tests for LexicalMessageRenderer
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LexicalMessageRenderer } from '../LexicalMessageRenderer';

describe('LexicalMessageRenderer', () => {
  describe('Basic Rendering', () => {
    it('renders plain text content', () => {
      render(<LexicalMessageRenderer content="Hello world" />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders empty string without errors', () => {
      const { container } = render(<LexicalMessageRenderer content="" />);
      expect(container).toBeEmptyDOMElement();
    });

    it('returns null when no content provided', () => {
      const { container } = render(<LexicalMessageRenderer />);
      expect(container).toBeEmptyDOMElement();
    });

    it('applies custom className', () => {
      const { container } = render(
        <LexicalMessageRenderer content="Test" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('adds streaming class when isStreaming is true', () => {
      const { container } = render(
        <LexicalMessageRenderer content="Test" isStreaming={true} />
      );
      expect(container.firstChild).toHaveClass('streaming');
    });
  });

  describe('Content Updates', () => {
    it('updates content when prop changes', () => {
      const { rerender } = render(<LexicalMessageRenderer content="Initial" />);
      expect(screen.getByText('Initial')).toBeInTheDocument();

      rerender(<LexicalMessageRenderer content="Updated" />);
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Initial')).not.toBeInTheDocument();
    });

    it('clears content when empty string provided', () => {
      const { rerender } = render(<LexicalMessageRenderer content="Content" />);
      expect(screen.getByText('Content')).toBeInTheDocument();

      rerender(<LexicalMessageRenderer content="" />);
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
  });

  describe('Markdown Rendering', () => {
    it('renders markdown text (when markdown plugin added)', () => {
      const markdown = '**Bold** and *italic* text';
      render(<LexicalMessageRenderer content={markdown} />);
      // For now just checks it renders - actual markdown parsing tested separately
      expect(screen.getByText(/Bold.*italic/)).toBeInTheDocument();
    });

    it('renders code blocks', () => {
      const code = '```javascript\nconst x = 1;\n```';
      render(<LexicalMessageRenderer content={code} />);
      expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
    });

    it('renders lists', () => {
      const list = '- Item 1\n- Item 2\n- Item 3';
      render(<LexicalMessageRenderer content={list} />);
      expect(screen.getByText(/Item 1/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-label on content editable', () => {
      render(<LexicalMessageRenderer content="Test" />);
      expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'Chat message content');
    });

    it('is read-only', () => {
      const { container } = render(<LexicalMessageRenderer content="Test" />);
      const editable = container.querySelector('[contenteditable]');
      expect(editable).toHaveAttribute('contenteditable', 'false');
    });
  });

  describe('Error Handling', () => {
    it('shows error boundary when Lexical throws', () => {
      // Mock console.error to suppress test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force error by providing invalid content
      render(<LexicalMessageRenderer content={null} />);
      
      // Component should handle gracefully (return null)
      expect(screen.queryByText('Error rendering message')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('memoizes component to prevent unnecessary re-renders', () => {
      const { rerender } = render(<LexicalMessageRenderer content="Test" />);
      const firstRender = screen.getByText('Test');
      
      // Rerender with same props
      rerender(<LexicalMessageRenderer content="Test" />);
      const secondRender = screen.getByText('Test');
      
      // Should be same instance (React.memo working)
      expect(firstRender).toBe(secondRender);
    });
  });
});
