const store = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000
const MAX_REQUESTS = 10

export function rateLimit(
  key: string,
  max: number = MAX_REQUESTS,
  windowMs: number = WINDOW_MS
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const record = store.get(key)

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }

  if (record.count >= max) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }

  record.count++
  return { allowed: true, remaining: max - record.count, resetAt: record.resetAt }
}

export function rateLimitMiddleware(
  request: Request,
  max?: number,
  windowMs?: number
): { allowed: boolean; headers: Record<string, string> } {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || "unknown"
  const key = `${request.method}:${new URL(request.url).pathname}:${ip}`
  const result = rateLimit(key, max, windowMs)

  return {
    allowed: result.allowed,
    headers: {
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    },
  }
}
