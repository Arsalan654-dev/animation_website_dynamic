export function getByPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, source)
}

export function setByPath<T>(source: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const root: Record<string, unknown> = {
    ...((source && typeof source === 'object' ? source : {}) as Record<string, unknown>),
  }
  let cursor = root

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value
      return
    }

    const current = cursor[key]
    cursor[key] = {
      ...((current && typeof current === 'object' ? current : {}) as Record<string, unknown>),
    }
    cursor = cursor[key] as Record<string, unknown>
  })

  return root as T
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}
