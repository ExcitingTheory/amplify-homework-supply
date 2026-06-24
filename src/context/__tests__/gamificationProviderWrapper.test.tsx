/**
 * Tests for GamificationProviderWrapper
 *
 * Validates cohortId derivation from Cognito groups, no-auth passthrough,
 * and correct prop forwarding to GamificationProvider.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// ============================================================================
// Mocks
// ============================================================================

// Track props passed to GamificationProvider
const providerSpy = vi.fn()

vi.mock('../gamificationContext', () => ({
  GamificationProvider: ({ children, ...props }: any) => {
    providerSpy(props)
    return <div data-testid="gamification-provider">{children}</div>
  },
}))

vi.mock('../../components/Gamification/GamificationToastLayer', () => ({
  GamificationToastLayer: () => <div data-testid="toast-layer" />,
}))

vi.mock('../../utils/amplifyClient', () => ({
  getAmplifyClient: () => ({ __mock: true }),
}))

// We need to provide AuthContext values, so we import it and wrap our component
import AuthContext from '../authContext'
import { GamificationProviderWrapper } from '../gamificationProviderWrapper'

// ============================================================================
// Helpers
// ============================================================================

function renderWithAuth(authValue: Record<string, any>) {
  return render(
    <AuthContext.Provider value={authValue as any}>
      <GamificationProviderWrapper cohortId={undefined}>
        <div data-testid="child">Hello</div>
      </GamificationProviderWrapper>
    </AuthContext.Provider>,
  )
}

// ============================================================================
// Tests
// ============================================================================

describe('GamificationProviderWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children directly when no user is logged in', () => {
    renderWithAuth({ user: null, session: null })

    expect(screen.getByTestId('child')).toBeDefined()
    // GamificationProvider is always rendered so hooks never read static defaults
    expect(screen.getByTestId('gamification-provider')).toBeDefined()
    expect(providerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: '',
      }),
    )
  })

  it('wraps children in GamificationProvider when user exists', () => {
    renderWithAuth({
      user: { username: 'student-1' },
      session: { groups: [] },
    })

    expect(screen.getByTestId('gamification-provider')).toBeDefined()
    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByTestId('toast-layer')).toBeDefined()
    expect(providerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: 'student-1',
      }),
    )
  })

  it('derives cohortId from learner section group', () => {
    renderWithAuth({
      user: { username: 'student-1' },
      session: { groups: ['section-abc123-learners'] },
    })

    expect(providerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: 'student-1',
        cohortId: 'abc123',
      }),
    )
  })

  it('derives cohortId from instructor section group', () => {
    renderWithAuth({
      user: { username: 'instructor-1' },
      session: { groups: ['Admins', 'section-myClass-instructors', 'Instructors'] },
    })

    expect(providerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: '',
        cohortId: 'myClass',
      }),
    )
  })

  it('returns first matching section group as cohortId', () => {
    renderWithAuth({
      user: { username: 'student-1' },
      session: {
        groups: ['section-first-learners', 'section-second-learners'],
      },
    })

    expect(providerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        cohortId: 'first',
      }),
    )
  })

  it('passes undefined cohortId when no section groups match', () => {
    renderWithAuth({
      user: { username: 'student-1' },
      session: { groups: ['SomeOtherGroup'] },
    })

    expect(providerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: 'student-1',
        cohortId: undefined,
      }),
    )
  })

  it('handles missing session.groups gracefully', () => {
    renderWithAuth({
      user: { username: 'student-1' },
      session: {},
    })

    expect(providerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        cohortId: undefined,
      }),
    )
  })

  it('falls back to user.attributes.sub when username is missing', () => {
    renderWithAuth({
      user: { attributes: { sub: 'sub-uuid-123' } },
      session: { groups: [] },
    })

    expect(providerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: 'sub-uuid-123',
      }),
    )
  })

  it('handles section IDs with hyphens in the group name', () => {
    renderWithAuth({
      user: { username: 'student-1' },
      session: { groups: ['section-my-class-2026-learners'] },
    })

    // Non-greedy match should capture 'my-class-2026'
    expect(providerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        cohortId: 'my-class-2026',
      }),
    )
  })
})
