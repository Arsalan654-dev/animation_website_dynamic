import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Origin that serves uploaded media and demo assets (the Laravel host). */
export function apiOrigin(): string {
  const configured = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
  try {
    return new URL(configured).origin
  } catch {
    return 'http://localhost:8000'
  }
}

/**
 * Normalise media URLs coming from the API. Relative paths are resolved
 * against the Laravel host, absolute URLs are passed through untouched.
 */
export function assetUrl(url?: string | null): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
  return `${apiOrigin()}${url.startsWith('/') ? '' : '/'}${url}`
}

export function invitationPublicUrl(slug: string): string {
  return `${window.location.origin}/i/${slug}`
}

export function googleCalendarUrl(options: {
  title: string
  startIso: string
  endIso?: string
  details?: string
  location?: string
  timezone?: string
}): string {
  const start = options.startIso.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const end = (options.endIso ?? new Date(new Date(options.startIso).getTime() + 2 * 3600_000).toISOString())
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: options.title,
    dates: `${start}/${end}`,
    details: options.details ?? '',
    location: options.location ?? '',
    ctz: options.timezone ?? 'UTC',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function extractIframeSource(embed?: string | null): string | null {
  if (!embed) return null
  const match = embed.match(/<iframe[^>]+src=["']([^"']+)["']/i)
  const candidate = match?.[1] ?? (/^https?:\/\//i.test(embed.trim()) ? embed.trim() : null)
  if (!candidate) return null
  return safeExternalUrl(candidate)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}


export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 140)
}

export function initials(one: string, two: string): string {
  return `${(one.trim()[0] ?? 'A').toUpperCase()} & ${(two.trim()[0] ?? 'B').toUpperCase()}`
}

export function splitParagraphs(value?: string | null): string[] {
  if (!value) return []
  return value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function formatDate(value?: string | null, timezone?: string): string {
  if (!value) return 'Date to be announced'
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    }).format(new Date(value))
  } catch {
    return 'Date to be announced'
  }
}

export function formatShortDate(value?: string | null, timezone?: string): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

export function relativeTime(value: string): string {
  const date = new Date(value).getTime()
  const diff = Date.now() - date
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatShortDate(value)
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function asSections(layout: { sections?: unknown } | unknown): unknown[] {
  if (Array.isArray(layout)) return layout
  if (layout && typeof layout === 'object' && Array.isArray((layout as { sections?: unknown }).sections)) {
    return (layout as { sections: unknown[] }).sections
  }
  return []
}

export interface CountdownValue {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

export function computeCountdown(targetIso: string | null | undefined, now = Date.now()): CountdownValue {
  if (!targetIso) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }
  const target = new Date(targetIso).getTime()
  if (Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }
  const diff = target - now
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  }
}

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function zonedParts(date: Date, timezone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value ?? '0'
    return Number(value)
  }

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

export function utcToZonedInput(iso: string | null | undefined, timezone: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = zonedParts(date, timezone)
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`
}

export function zonedInputToUtcIso(value: string, timezone: string): string | null {
  if (!value) return null
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return null
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) return null

  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  const zoned = zonedParts(new Date(wallClockAsUtc), timezone)
  const zonedAsUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute)
  const offset = zonedAsUtc - wallClockAsUtc
  return new Date(wallClockAsUtc - offset).toISOString()
}

export function safeExternalUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString()
    return null
  } catch {
    return null
  }
}

export function youtubeEmbedUrl(url?: string | null): string | null {
  const safe = safeExternalUrl(url)
  if (!safe) return null
  try {
    const parsed = new URL(safe)
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v')
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`
      const embedMatch = parsed.pathname.match(/\/embed\/([^/]+)/)
      if (embedMatch?.[1]) return `https://www.youtube-nocookie.com/embed/${embedMatch[1]}`
    }
    return null
  } catch {
    return null
  }
}

export function vimeoEmbedUrl(url?: string | null): string | null {
  const safe = safeExternalUrl(url)
  if (!safe) return null
  try {
    const parsed = new URL(safe)
    if (!parsed.hostname.includes('vimeo.com')) return null
    const match = parsed.pathname.match(/(\d+)/)
    return match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : null
  } catch {
    return null
  }
}
