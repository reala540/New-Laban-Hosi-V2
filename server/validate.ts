/**
 * Server-side validation helpers. The browser validates too, but nothing the
 * browser sends is ever trusted — every field is re-checked here before it
 * touches the database.
 */

export function asString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > maxLength) return null
  return trimmed
}

/**
 * Optional string: missing/empty becomes null; a present value that is the
 * wrong type or too long returns undefined (caller must reject with 400).
 */
export function asOptionalString(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed.length > maxLength) return undefined
  return trimmed.length === 0 ? null : trimmed
}

export function isEmail(value: string): boolean {
  // Deliberately simple: something@something.something, sane length.
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isPhone(value: string): boolean {
  return /^[0-9+\-\s()]{7,20}$/.test(value)
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

export function isDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime())
}

export function isBoolean(value: unknown): value is boolean {
  return value === true || value === false
}

export function asSortOrder(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(9999, Math.trunc(n)))
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null
}

/**
 * Uploaded-media URLs must point at our own /api/media endpoint. Anything
 * else (external URL, javascript:, data:, path traversal) is rejected, so
 * stored content can never become an XSS or open-redirect vector.
 */
export function asMediaUrl(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const match = /^\/api\/media\?id=([0-9a-f-]{36})$/i.exec(value.trim())
  return match ? `/api/media?id=${match[1].toLowerCase()}` : undefined
}
