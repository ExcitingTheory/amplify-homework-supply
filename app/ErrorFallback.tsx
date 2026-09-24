'use client'

import { useEffect } from 'react'

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  useEffect(() => {
    console.error('[App error boundary]', error)
  }, [error])

  return (
    <main
      role="alert"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        color: '#1f2937',
        background: '#f8fafc',
      }}
    >
      <section style={{ maxWidth: 560, textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#64748b', fontWeight: 700 }}>Homework Supply</p>
        <h1 style={{ margin: '0.75rem 0', fontSize: '2rem' }}>Something went wrong</h1>
        <p style={{ margin: '0 0 1.5rem', lineHeight: 1.6 }}>
          This page hit an unexpected problem. You can retry the page or return to the home screen.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              border: 0,
              borderRadius: 6,
              padding: '0.7rem 1rem',
              color: '#fff',
              background: '#1976d2',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '0.7rem 1rem',
              color: '#1f2937',
              textDecoration: 'none',
              fontWeight: 700,
              background: '#fff',
            }}
          >
            Go home
          </a>
        </div>
      </section>
    </main>
  )
}
