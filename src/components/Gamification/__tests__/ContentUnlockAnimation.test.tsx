/**
 * Tests for ContentUnlockAnimation component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import React from 'react'
import { ContentUnlockAnimation } from '../ContentUnlockAnimation'

describe('ContentUnlockAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when show is false', () => {
    const { container } = render(
      <ContentUnlockAnimation show={false} title="Unit 1" />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders overlay when show is true', () => {
    render(<ContentUnlockAnimation show={true} title="Unit 1" />)
    // In shake phase, overlay should be visible
    expect(screen.queryByText(/Unit 1 Unlocked/)).toBeNull()
    // After 600ms → open phase, title appears
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(screen.getByText(/Unit 1 Unlocked/)).toBeInTheDocument()
  })

  it('progresses through shake → open → shimmer → done phases', () => {
    const onComplete = vi.fn()
    const { container } = render(
      <ContentUnlockAnimation show={true} title="Vocab Lesson" onComplete={onComplete} />,
    )

    // Phase: shake (0ms–600ms) — overlay visible, no title text yet
    expect(container.querySelector('[class]')).toBeTruthy()

    // Phase: open (600ms)
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(screen.getByText(/Vocab Lesson Unlocked/)).toBeInTheDocument()

    // Phase: shimmer (1200ms)
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(screen.getByText(/Vocab Lesson Unlocked/)).toBeInTheDocument()

    // Phase: done (2400ms) — onComplete fires, component disappears
    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
    // After done, nothing rendered
    expect(container.innerHTML).toBe('')
  })

  it('resets to idle when show goes back to false', () => {
    const { container, rerender } = render(
      <ContentUnlockAnimation show={true} title="Unit 2" />,
    )

    // Advance a bit so we're in shake phase
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Turn off
    rerender(<ContentUnlockAnimation show={false} title="Unit 2" />)
    expect(container.innerHTML).toBe('')
  })

  it('cleans up timers on unmount', () => {
    const onComplete = vi.fn()
    const { unmount } = render(
      <ContentUnlockAnimation show={true} title="Test" onComplete={onComplete} />,
    )

    // Unmount before animation completes
    unmount()

    // Advance past all timers — onComplete should NOT fire (timers cleared)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onComplete).not.toHaveBeenCalled()
  })
})
