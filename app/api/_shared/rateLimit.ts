const windows = new Map<string, { count: number; windowStart: number }>()

const WINDOW_MS = 60_000
const MAX_ENTRIES = 10_000

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export function checkAiRateLimit(
  key: string,
  limit = 30,
  now = Date.now(),
): RateLimitResult {
  if (key === 'unknown') return { allowed: true, retryAfterSeconds: 0 }

  const current = windows.get(key)
  if (!current || now - current.windowStart >= WINDOW_MS) {
    if (windows.size >= MAX_ENTRIES) {
      const oldestKey = windows.keys().next().value
      if (oldestKey) windows.delete(oldestKey)
    }
    windows.set(key, { count: 1, windowStart: now })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - current.windowStart)) / 1000)),
    }
  }

  current.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(JSON.stringify({ error: 'Too many AI requests. Please try again shortly.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfterSeconds),
    },
  })
}
