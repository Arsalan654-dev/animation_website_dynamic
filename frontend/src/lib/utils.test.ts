import { describe, expect, it } from 'vitest'
import {
  assetUrl,
  computeCountdown,
  extractIframeSource,
  googleCalendarUrl,
  initials,
  safeExternalUrl,
  slugify,
  utcToZonedInput,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
  zonedInputToUtcIso,
} from './utils'

describe('assetUrl', () => {
  it('resolves relative media paths against the API origin', () => {
    expect(assetUrl('/demo/hero-couple.jpg')).toBe('http://localhost:8000/demo/hero-couple.jpg')
    expect(assetUrl('demo/garden.jpg')).toBe('http://localhost:8000/demo/garden.jpg')
  })

  it('leaves absolute and inline URLs untouched', () => {
    expect(assetUrl('https://cdn.example.com/image.jpg')).toBe('https://cdn.example.com/image.jpg')
    expect(assetUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
    expect(assetUrl('blob:https://example.com/id')).toBe('blob:https://example.com/id')
  })

  it('returns null for missing values', () => {
    expect(assetUrl(null)).toBeNull()
    expect(assetUrl(undefined)).toBeNull()
    expect(assetUrl('')).toBeNull()
  })
})

describe('computeCountdown', () => {
  it('splits the remaining time into days, hours, minutes and seconds', () => {
    const now = Date.UTC(2027, 0, 1, 0, 0, 0)

    expect(computeCountdown('2027-01-02T01:02:03.000Z', now)).toEqual({
      days: 1,
      hours: 1,
      minutes: 2,
      seconds: 3,
      expired: false,
    })
  })

  it('marks past, missing and invalid dates as expired', () => {
    const expired = { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }

    expect(computeCountdown('2020-01-01T00:00:00.000Z', Date.UTC(2027, 0, 1))).toEqual(expired)
    expect(computeCountdown(null)).toEqual(expired)
    expect(computeCountdown('not-a-date')).toEqual(expired)
  })
})

describe('timezone helpers', () => {
  it('converts a wall-clock input to UTC for the invitation timezone', () => {
    expect(zonedInputToUtcIso('2027-02-14T19:00', 'Asia/Karachi')).toBe('2027-02-14T14:00:00.000Z')
  })

  it('converts a UTC timestamp back to the invitation wall clock', () => {
    expect(utcToZonedInput('2027-02-14T14:00:00.000Z', 'Asia/Karachi')).toBe('2027-02-14T19:00')
  })

  it('returns empty values for missing or invalid input', () => {
    expect(zonedInputToUtcIso('', 'Asia/Karachi')).toBeNull()
    expect(zonedInputToUtcIso('not-a-date', 'Asia/Karachi')).toBeNull()
    expect(utcToZonedInput(null, 'Asia/Karachi')).toBe('')
    expect(utcToZonedInput('not-a-date', 'Asia/Karachi')).toBe('')
  })
})

describe('external URL safety', () => {
  it('allows only http and https URLs', () => {
    expect(safeExternalUrl('https://example.com/invite')).toBe('https://example.com/invite')
    expect(safeExternalUrl('http://example.com')).toBe('http://example.com/')
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(safeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeExternalUrl(null)).toBeNull()
  })

  it('extracts a safe iframe source and rejects executable embeds', () => {
    expect(
      extractIframeSource('<iframe src="https://maps.google.com/maps?q=Karachi"></iframe>'),
    ).toBe('https://maps.google.com/maps?q=Karachi')
    expect(extractIframeSource('https://maps.google.com/maps?q=Karachi')).toBe(
      'https://maps.google.com/maps?q=Karachi',
    )
    expect(extractIframeSource('<iframe src="javascript:alert(1)"></iframe>')).toBeNull()
    expect(extractIframeSource('not an embed')).toBeNull()
  })

  it('builds privacy-friendly YouTube and Vimeo embeds', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=abc123')).toBe(
      'https://www.youtube-nocookie.com/embed/abc123',
    )
    expect(youtubeEmbedUrl('https://youtu.be/abc123')).toBe('https://www.youtube-nocookie.com/embed/abc123')
    expect(youtubeEmbedUrl('https://example.com/video')).toBeNull()
    expect(youtubeEmbedUrl('javascript:alert(1)')).toBeNull()
    expect(vimeoEmbedUrl('https://vimeo.com/123456789')).toBe('https://player.vimeo.com/video/123456789')
    expect(vimeoEmbedUrl('https://example.com/123')).toBeNull()
  })
})

describe('calendar links', () => {
  it('formats the start, default two-hour end, timezone and details', () => {
    const url = new URL(
      googleCalendarUrl({
        title: 'Maheen & Uzair — Nikah',
        startIso: '2027-02-14T14:00:00.000Z',
        timezone: 'Asia/Karachi',
        location: 'Karachi',
      }),
    )

    expect(url.origin).toBe('https://calendar.google.com')
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('text')).toBe('Maheen & Uzair — Nikah')
    expect(url.searchParams.get('dates')).toBe('20270214T140000Z/20270214T160000Z')
    expect(url.searchParams.get('ctz')).toBe('Asia/Karachi')
    expect(url.searchParams.get('location')).toBe('Karachi')
  })
})

describe('display helpers', () => {
  it('creates stable slugs and monograms', () => {
    expect(slugify('Ayesha & Hamza — The Wedding')).toBe('ayesha-hamza-the-wedding')
    expect(initials('Ayesha', 'Hamza')).toBe('A & H')
    expect(initials('', '')).toBe('A & B')
  })
})
