/**
 * BadgeClaimPanel — Storybook component that lets users claim
 * documentation badges earned through onboarding tasks.
 *
 * Flow:
 * 1. Reads onboarding progress from localStorage (OnboardingEventEmitter)
 * 2. User signs in with their Cognito account
 * 3. Authenticated page calls claimStorybookBadges mutation directly
 * 4. Lambda verifies identity via Cognito JWT and awards badges
 *
 * No server-side middleware needed — works on static Storybook (GitHub Pages).
 * Auth is handled by Amplify's Cognito integration.
 *
 * @module BadgeClaimPanel
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Amplify } from 'aws-amplify'
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/data'
import { getOnboardingEmitter } from '../code/onboarding-events'
import { ONBOARDING_TASKS } from '../code/onboarding-tasks'
import type { UserPersona } from '../code/onboarding-events'

const onboardingEvents = getOnboardingEmitter()

// ============================================================================
// Amplify Configuration
// ============================================================================

// Import amplify_outputs.json at build time (Storybook bundles this)
let amplifyConfigured = false

async function ensureAmplifyConfigured() {
  if (amplifyConfigured) return
  try {
    // Dynamic ESM import - the file is at the repo root
    const outputs = await import('../../amplify_outputs.json')
    Amplify.configure(outputs.default || outputs)
    amplifyConfigured = true
  } catch (err) {
    console.warn('[BadgeClaimPanel] Could not configure Amplify:', err)
  }
}

// ============================================================================
// GraphQL mutation
// ============================================================================

const CLAIM_STORYBOOK_BADGES = `mutation ClaimStorybookBadges($completedTasks: [String!]!, $completedPersonas: [String!]!) {
  claimStorybookBadges(completedTasks: $completedTasks, completedPersonas: $completedPersonas)
}`

// ============================================================================
// Types
// ============================================================================

interface PersonaProgress {
  persona: UserPersona
  label: string
  totalTasks: number
  completedTasks: number
  percentage: number
  completedTaskIds: string[]
}

interface ClaimResult {
  newBadges: string[]
  updatedBadges: string[]
  totalBadges: number
  message?: string
}

type PanelStatus = 'idle' | 'signing-in' | 'authenticated' | 'claiming' | 'success' | 'error'

// ============================================================================
// Styles (inline — no MUI in Storybook context)
// ============================================================================

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '24px',
    maxWidth: '560px',
    margin: '0 auto',
  } as React.CSSProperties,
  heading: {
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '8px',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    lineHeight: 1.5,
  } as React.CSSProperties,
  progressGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  } as React.CSSProperties,
  progressCard: (complete: boolean) => ({
    border: `2px solid ${complete ? '#4caf50' : '#e0e0e0'}`,
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center' as const,
    background: complete ? '#e8f5e9' : '#fafafa',
    transition: 'all 0.2s',
  }),
  progressLabel: {
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '4px',
  } as React.CSSProperties,
  progressBar: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#e0e0e0',
    overflow: 'hidden',
    marginTop: '6px',
  } as React.CSSProperties,
  progressFill: (pct: number) => ({
    width: `${pct}%`,
    height: '100%',
    borderRadius: '3px',
    background: pct === 100 ? '#4caf50' : '#2196f3',
    transition: 'width 0.3s',
  }),
  button: (primary: boolean, disabled?: boolean) => ({
    padding: '10px 24px',
    borderRadius: '6px',
    border: primary ? 'none' : '1px solid #ccc',
    background: disabled ? '#ccc' : primary ? '#1976d2' : '#fff',
    color: disabled ? '#999' : primary ? '#fff' : '#333',
    fontWeight: 600,
    fontSize: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.2s',
    marginRight: '8px',
  }),
  badge: (earned: boolean) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    background: earned ? '#4caf50' : '#e0e0e0',
    color: earned ? '#fff' : '#999',
    marginTop: '4px',
  }),
  alert: (type: 'success' | 'info' | 'error' | 'warning') => ({
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    marginTop: '12px',
    background: { success: '#e8f5e9', info: '#e3f2fd', error: '#fbe9e7', warning: '#fff3e0' }[type],
    color: { success: '#2e7d32', info: '#1565c0', error: '#c62828', warning: '#e65100' }[type],
    border: `1px solid ${{ success: '#a5d6a7', info: '#90caf9', error: '#ef9a9a', warning: '#ffcc80' }[type]}`,
  }),
  statusDot: (color: string) => ({
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: color,
    marginRight: '6px',
  }),
  section: {
    marginBottom: '20px',
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '12px',
  } as React.CSSProperties,
  badgeList: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '16px',
    lineHeight: 1.6,
  } as React.CSSProperties,
  input: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box' as const,
    marginBottom: '8px',
  } as React.CSSProperties,
  loginForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  } as React.CSSProperties,
} as const

// ============================================================================
// Component
// ============================================================================

export function BadgeClaimPanel() {
  const [status, setStatus] = useState<PanelStatus>('idle')
  const [username, setUsername] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Configure Amplify and check for existing session on mount
  useEffect(() => {
    ensureAmplifyConfigured().then(() => {
      getCurrentUser()
        .then(user => {
          setUsername(user.username || user.userId)
          setStatus('authenticated')
        })
        .catch(() => {
          // Not signed in — that's fine
        })
    })
  }, [])

  // Listen for onboarding events to refresh progress
  useEffect(() => {
    const unsub = onboardingEvents.on(() => setRefreshKey(k => k + 1))
    return unsub
  }, [])

  // Calculate progress per persona
  const personaProgress: PersonaProgress[] = useMemo(() => {
    const personas: UserPersona[] = ['instructor', 'learner', 'translator']
    return personas.map(persona => {
      const tasks = ONBOARDING_TASKS.filter(t => t.persona === persona || t.persona === 'all')
      const completedTaskIds = tasks
        .filter(t => onboardingEvents.isTaskCompleted(t.id, persona))
        .map(t => t.id)
      return {
        persona,
        label: persona.charAt(0).toUpperCase() + persona.slice(1),
        totalTasks: tasks.length,
        completedTasks: completedTaskIds.length,
        percentage: tasks.length > 0 ? Math.round((completedTaskIds.length / tasks.length) * 100) : 0,
        completedTaskIds,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  const totalCompleted = personaProgress.reduce((s, p) => s + p.completedTasks, 0)
  const anyStarted = totalCompleted > 0
  const allComplete = personaProgress.every(p => p.percentage === 100)

  // ── Sign In ──────────────────────────────────────────────────────────
  const handleSignIn = useCallback(async () => {
    setStatus('signing-in')
    setErrorMessage('')

    try {
      await ensureAmplifyConfigured()
      const result = await signIn({ username: email, password })
      if (result.isSignedIn) {
        const user = await getCurrentUser()
        setUsername(user.username || user.userId)
        setStatus('authenticated')
        setPassword('') // Clear password from state
      } else {
        throw new Error('Sign-in incomplete — check your credentials or confirm your account')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Sign-in failed')
      setStatus('error')
    }
  }, [email, password])

  // ── Sign Out ─────────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch { /* ignore */ }
    setUsername(null)
    setStatus('idle')
    setClaimResult(null)
  }, [])

  // ── Claim Badges ─────────────────────────────────────────────────────
  const handleClaimBadges = useCallback(async () => {
    if (!username) return
    setStatus('claiming')
    setErrorMessage('')
    setClaimResult(null)

    try {
      await ensureAmplifyConfigured()
      const client = generateClient({ authMode: 'userPool' })

      const completedTasks = personaProgress.flatMap(p => p.completedTaskIds)
      const completedPersonas = personaProgress
        .filter(p => p.percentage === 100)
        .map(p => p.persona)

      const { data, errors } = await client.graphql({
        query: CLAIM_STORYBOOK_BADGES,
        variables: { completedTasks, completedPersonas },
      }) as any

      if (errors?.length) {
        throw new Error(errors[0]?.message || 'GraphQL error')
      }

      const result = typeof data?.claimStorybookBadges === 'string'
        ? JSON.parse(data.claimStorybookBadges)
        : data?.claimStorybookBadges

      setClaimResult(result)
      setStatus('success')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to claim badges')
      setStatus('error')
    }
  }, [username, personaProgress])

  // ── Status indicator ─────────────────────────────────────────────────
  const statusConfig: Record<PanelStatus, { color: string; label: string }> = {
    idle: { color: '#999', label: 'Not signed in' },
    'signing-in': { color: '#ff9800', label: 'Signing in...' },
    authenticated: { color: '#4caf50', label: `Signed in as ${username}` },
    claiming: { color: '#ff9800', label: 'Claiming badges...' },
    success: { color: '#4caf50', label: 'Badges claimed!' },
    error: { color: '#f44336', label: 'Error' },
  }

  const { color: statusColor, label: statusLabel } = statusConfig[status]
  const isAuthenticated = status === 'authenticated' || status === 'claiming' || status === 'success'

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🏅 Claim Documentation Badges</h2>
      <p style={styles.subtitle}>
        Complete onboarding tasks, sign in with your account, and claim
        your badges directly.
      </p>

      {/* Status indicator */}
      <div style={{ marginBottom: '16px', fontSize: '13px' }}>
        <span style={styles.statusDot(statusColor)} />
        {statusLabel}
      </div>

      {/* Progress per persona */}
      <div style={styles.progressGrid}>
        {personaProgress.map(p => (
          <div key={p.persona} style={styles.progressCard(p.percentage === 100)}>
            <div style={styles.progressLabel}>{p.label}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {p.completedTasks} / {p.totalTasks} tasks
            </div>
            <div style={styles.progressBar}>
              <div style={styles.progressFill(p.percentage)} />
            </div>
            <span style={styles.badge(p.percentage === 100)}>
              {p.percentage === 100 ? '✓ Complete' : `${p.percentage}%`}
            </span>
          </div>
        ))}
      </div>

      {/* Badge mapping info */}
      <div style={styles.badgeList}>
        <strong>Badges you can earn:</strong><br />
        • <strong>Docs Explorer</strong> — Start any onboarding path<br />
        • <strong>Instructor Certified</strong> — Complete all instructor tasks<br />
        • <strong>Learner Certified</strong> — Complete all learner tasks<br />
        • <strong>Translator Certified</strong> — Complete all translator tasks<br />
        • <strong>Accessibility Champion</strong> — Complete a11y-related tasks<br />
        • <strong>Documentation Champion</strong> — Complete all three paths
      </div>

      {/* Auth section */}
      {!isAuthenticated && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Step 1: Sign In</div>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            Sign in with your Homework Supply account to claim badges.
          </p>
          <div style={styles.loginForm}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="current-password"
              onKeyDown={e => { if (e.key === 'Enter') handleSignIn() }}
            />
            <button
              style={styles.button(true, status === 'signing-in' || !email || !password)}
              onClick={handleSignIn}
              disabled={status === 'signing-in' || !email || !password}
            >
              {status === 'signing-in' ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>
      )}

      {/* Claim section */}
      {isAuthenticated && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            {status === 'success' ? 'Badges Claimed!' : 'Step 2: Claim Your Badges'}
          </div>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            Your completed tasks will be sent to the server for verification.
            The server determines which badges you&apos;ve earned.
          </p>

          <button
            style={styles.button(true, !anyStarted || status === 'claiming')}
            onClick={handleClaimBadges}
            disabled={!anyStarted || status === 'claiming'}
          >
            {status === 'claiming' ? 'Claiming...' : 'Claim Badges'}
          </button>

          <button
            style={styles.button(false)}
            onClick={handleSignOut}
          >
            Sign Out
          </button>

          {claimResult && (
            <div style={styles.alert(claimResult.newBadges.length > 0 ? 'success' : 'info')}>
              {claimResult.newBadges.length > 0
                ? `🎉 Earned ${claimResult.newBadges.length} new badge(s): ${claimResult.newBadges.join(', ')}`
                : claimResult.message || 'All badges already claimed.'}
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {status === 'error' && errorMessage && (
        <div style={styles.alert('error')}>
          {errorMessage}
        </div>
      )}

      {allComplete && !isAuthenticated && (
        <div style={styles.alert('info')}>
          All onboarding paths complete! Sign in to claim the Documentation Champion badge. 🏆
        </div>
      )}
    </div>
  )
}
