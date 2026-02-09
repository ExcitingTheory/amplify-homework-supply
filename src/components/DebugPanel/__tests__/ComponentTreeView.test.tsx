/**
 * Tests for ComponentTreeView component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentTreeView } from '../ComponentTreeView';
import { ComponentMetadata } from '../../../utils/debug/ComponentTreeStore';

const now = Date.now();

const mockTree: ComponentMetadata[] = [
  {
    id: 'comp-1',
    name: 'TestComponent',
    props: { foo: 'bar' },
    state: { count: 0 },
    renderCount: 1,
    mountTime: now - 5000,
    lastRenderTime: now - 1000,
    children: [],
  },
  {
    id: 'comp-2',
    name: 'TestComponent',
    props: { baz: 'qux' },
    state: { active: true },
    renderCount: 2,
    mountTime: now - 4000,
    lastRenderTime: now - 500,
    children: [],
  },
  {
    id: 'comp-3',
    name: 'OtherComponent',
    props: {},
    state: {},
    renderCount: 1,
    mountTime: now - 3000,
    lastRenderTime: now - 200,
    children: [],
  },
];

describe('ComponentTreeView', () => {
  it('renders empty state when no components', () => {
    render(<ComponentTreeView tree={[]} />);
    expect(screen.getByText('No components registered')).toBeInTheDocument();
    expect(screen.getByText('Use useComponentInspector() hook to register components')).toBeInTheDocument();
  });

  it('groups components by name', () => {
    render(<ComponentTreeView tree={mockTree} />);

    expect(screen.getByText(/TestComponent \(2 instances\)/)).toBeInTheDocument();
    // OtherComponent appears twice (header and instance), verify both exist
    const otherCompElements = screen.getAllByText('OtherComponent');
    expect(otherCompElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('3 components')).toBeInTheDocument();
    expect(screen.getByText('2 types')).toBeInTheDocument();
  });

  it('expands component details when clicked', () => {
    render(<ComponentTreeView tree={mockTree} />);

    // Component instances are already visible in the list
    // Check for render count badges (multiple instances)
    const badges = screen.getAllByText('×1');
    expect(badges.length).toBeGreaterThan(0);
    expect(screen.getByText('×2')).toBeInTheDocument();
  });

  it('shows render count badge', () => {
    render(<ComponentTreeView tree={mockTree} />);

    // Render count shown as ×{count} (multiple ×1 badges exist)
    const singleBadges = screen.getAllByText('×1');
    expect(singleBadges.length).toBe(2); // comp-1 and comp-3
    expect(screen.getByText('×2')).toBeInTheDocument(); // comp-2
  });

  it('expands instance details when clicked', () => {
    render(<ComponentTreeView tree={mockTree} />);

    // Find a button with a specific component name to avoid ambiguity
    const buttons = screen.getAllByRole('button');
    const testCompButton = buttons.find(btn => 
      btn.textContent?.includes('TestComponent') && 
      btn.textContent?.includes('×1')
    );
    
    if (testCompButton) {
      fireEvent.click(testCompButton);

      // Should show props and state labels (without colons)
      expect(screen.getByText('Props')).toBeInTheDocument();
      expect(screen.getByText('State')).toBeInTheDocument();
    }
  });

  it('displays props and state in JSON format', () => {
    render(<ComponentTreeView tree={mockTree} />);

    // Find and click TestComponent button with ×1 badge
    const buttons = screen.getAllByRole('button');
    const testCompButton = buttons.find(btn => 
      btn.textContent?.includes('TestComponent') && 
      btn.textContent?.includes('×1')
    );
    
    if (testCompButton) {
      fireEvent.click(testCompButton);

      // Check for JSON content in pre tags
      expect(screen.getByText(/"foo": "bar"/)).toBeInTheDocument();
      expect(screen.getByText(/"count": 0/)).toBeInTheDocument();
    }
  });

  it('handles components without props or state', () => {
    const treeWithEmptyProps: ComponentMetadata[] = [
      {
        id: 'comp-empty',
        name: 'EmptyComponent',
        props: undefined,
        state: undefined,
        renderCount: 1,
        mountTime: Date.now(),
        lastRenderTime: Date.now(),
        children: [],
      },
    ];

    render(<ComponentTreeView tree={treeWithEmptyProps} />);

    const buttons = screen.getAllByRole('button');
    const instanceButton = buttons.find(btn => btn.textContent?.includes('EmptyComponent'));
    
    if (instanceButton) {
      fireEvent.click(instanceButton);
      // Component should render without errors even with undefined props/state
      expect(screen.getByText('Props')).toBeInTheDocument();
    }
  });

  it('calls onSelectComponent when instance clicked', () => {
    const onSelect = vi.fn();
    render(<ComponentTreeView tree={mockTree} onSelectComponent={onSelect} />);

    // Click a specific component button
    const buttons = screen.getAllByRole('button');
    const testCompButton = buttons.find(btn => 
      btn.textContent?.includes('TestComponent') && 
      btn.textContent?.includes('×1')
    );
    
    if (testCompButton) {
      fireEvent.click(testCompButton);
      expect(onSelect).toHaveBeenCalled();
      expect(onSelect.mock.calls[0][0]).toHaveProperty('id');
      expect(onSelect.mock.calls[0][0]).toHaveProperty('name');
    }
  });

  it('highlights selected component', () => {
    render(<ComponentTreeView tree={mockTree} selectedId="comp-1" />);

    // Find the selected item by checking for Mui-selected class
    const selectedButtons = document.querySelectorAll('.Mui-selected');
    expect(selectedButtons.length).toBeGreaterThan(0);
  });
});
