'use client'

import { useEffect, useState } from 'react'
import { ErrorFallback } from './ErrorFallback'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [lang, setLang] = useState('en')

  useEffect(() => {
    const nextLang = document.documentElement?.lang || 'en'
    setLang(nextLang)
  }, [])

  return (
    <html lang={lang}>
      <body>
        <ErrorFallback error={error} reset={reset} />
      </body>
    </html>
  )
}
