import type { AnimationConfig, AnimationType, ResolvedAnimation } from '@/types'

export const easings: Record<string, [number, number, number, number]> = {
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 0.84, 0],
  easeInOut: [0.65, 0, 0.35, 1],
  linear: [0, 0, 1, 1],
}

export function initialForAnimation(
  type: AnimationType | string | undefined,
  config: AnimationConfig,
  reducedMotion: boolean,
): Record<string, number> {
  if (reducedMotion) {
    return { opacity: 0 }
  }

  switch (type) {
    case 'zoom':
      return { opacity: 0, scale: config.scale ?? 0.94 }
    case 'slide': {
      const distance = config.distance ?? 56
      const offsets: Record<string, Record<string, number>> = {
        left: { x: -distance },
        right: { x: distance },
        down: { y: -distance },
        up: { y: distance },
      }
      return { opacity: 0, ...(offsets[config.direction ?? 'up'] ?? offsets.up) }
    }
    case 'parallax':
      return { opacity: 0 }
    case 'fade_up':
    case 'stagger':
    default:
      return { opacity: 0, y: reducedMotion ? 0 : (config.distance ?? 40) }
  }
}

export function visibleForAnimation(): Record<string, number> {
  return { opacity: 1, x: 0, y: 0, scale: 1 }
}

export function transitionForAnimation(
  config: AnimationConfig,
  reducedMotion: boolean,
): Record<string, unknown> {
  const duration = reducedMotion ? Math.min(config.duration ?? 0.8, 0.35) : (config.duration ?? 0.8)
  const delay = config.delay ?? 0.05

  return {
    duration,
    delay,
    ease: config.easing === 'spring' ? undefined : (easings[config.easing ?? 'easeOut'] ?? easings.easeOut),
    type: config.easing === 'spring' ? 'spring' : undefined,
    stiffness: config.easing === 'spring' ? 120 : undefined,
    damping: config.easing === 'spring' ? 20 : undefined,
    staggerChildren: config.stagger ?? 0.12,
    delayChildren: delay,
  }
}

export function itemTransition(
  animation: ResolvedAnimation | null | undefined,
  index: number,
  reducedMotion: boolean,
): Record<string, unknown> {
  const config = animation?.config ?? {}
  const base = transitionForAnimation(config, reducedMotion)
  return {
    ...base,
    delay: (config.delay ?? 0.05) + index * (config.stagger ?? 0.1),
  }
}
