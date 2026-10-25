import type { CSSProperties } from 'react'
import type { ThemeTokens } from '@/types'

const fontFallbacks: Record<string, string> = {
  'Cormorant Garamond': '"Cormorant Garamond", Georgia, serif',
  'Playfair Display': '"Playfair Display", Georgia, serif',
  'EB Garamond': '"EB Garamond", Georgia, serif',
  Cinzel: 'Cinzel, Georgia, serif',
  Lora: 'Lora, Georgia, serif',
  'Libre Baskerville': '"Libre Baskerville", Georgia, serif',
  'Great Vibes': '"Great Vibes", cursive',
  'Pinyon Script': '"Pinyon Script", cursive',
  Allura: 'Allura, cursive',
  Jost: 'Jost, system-ui, sans-serif',
  Inter: 'Inter, system-ui, sans-serif',
  Montserrat: 'Montserrat, system-ui, sans-serif',
  'Source Sans 3': '"Source Sans 3", system-ui, sans-serif',
  Manrope: 'Manrope, system-ui, sans-serif',
  'DM Sans': '"DM Sans", system-ui, sans-serif',
}

export const FONT_OPTIONS = Object.keys(fontFallbacks)

export function fontStack(font: string | undefined): string {
  if (!font) return fontFallbacks['Cormorant Garamond']
  return fontFallbacks[font] ?? `"${font}", Georgia, serif`
}

export type ThemeCssProperties = CSSProperties & Record<`--w-${string}`, string>

export type ThemeTokenOverrides = {
  [Group in keyof ThemeTokens]?: Partial<ThemeTokens[Group]>
}

export function themeCssVars(tokens: ThemeTokens): ThemeCssProperties {
  return {
    '--w-primary': tokens.colors.primary,
    '--w-secondary': tokens.colors.secondary,
    '--w-accent': tokens.colors.accent,
    '--w-surface': tokens.colors.surface,
    '--w-surface-alt': tokens.colors.surfaceAlt,
    '--w-text': tokens.colors.text,
    '--w-muted': tokens.colors.muted,
    '--w-line': tokens.colors.line,
    '--w-on-primary': tokens.colors.onPrimary,
    '--w-page-bg': tokens.surfaces.pageBackground,
    '--w-card-bg': tokens.surfaces.cardBackground,
    '--w-card-border': tokens.surfaces.cardBorder,
    '--w-card-radius': `${tokens.surfaces.cardRadius}px`,
    '--w-paper-opacity': String(tokens.surfaces.paperTextureOpacity),
    '--w-section-spacing': `${tokens.surfaces.sectionSpacing}px`,
    '--w-content-width': `${tokens.surfaces.contentWidth}px`,
    '--w-heading-font': fontStack(tokens.typography.headingFont),
    '--w-body-font': fontStack(tokens.typography.bodyFont),
    '--w-script-font': fontStack(tokens.typography.scriptFont),
    '--w-base-size': `${tokens.typography.baseSize}px`,
    '--w-heading-weight': String(tokens.typography.headingWeight),
    '--w-body-weight': String(tokens.typography.bodyWeight),
    '--w-line-height': String(tokens.typography.bodyLineHeight),
    '--w-letter-spacing': `${tokens.typography.letterSpacing}em`,
    '--w-btn-radius': `${tokens.buttons.radius}px`,
    '--w-btn-spacing': `${tokens.buttons.letterSpacing}em`,
    '--w-btn-transform': tokens.buttons.textTransform,
    '--w-image-aspect': tokens.layout.imageAspect.replace('/', ' / '),
  }
}

export function mergeThemeTokens(base: ThemeTokens, overrides?: ThemeTokenOverrides | null): ThemeTokens {
  if (!overrides) return base
  return {
    colors: { ...base.colors, ...(overrides.colors ?? {}) },
    typography: { ...base.typography, ...(overrides.typography ?? {}) },
    surfaces: { ...base.surfaces, ...(overrides.surfaces ?? {}) },
    buttons: { ...base.buttons, ...(overrides.buttons ?? {}) },
    ornaments: { ...base.ornaments, ...(overrides.ornaments ?? {}) },
    layout: { ...base.layout, ...(overrides.layout ?? {}) },
    animation: { ...base.animation, ...(overrides.animation ?? {}) },
  }
}

export const defaultThemeTokens: ThemeTokens = {
  colors: {
    primary: '#4a1f2c',
    secondary: '#6d6b4e',
    accent: '#b99358',
    surface: '#f7f1e6',
    surfaceAlt: '#efe5d5',
    text: '#2c211b',
    muted: '#6f6154',
    line: 'rgba(74, 31, 44, 0.18)',
    onPrimary: '#fffaf2',
  },
  typography: {
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Jost',
    scriptFont: 'Great Vibes',
    baseSize: 16,
    headingWeight: 500,
    bodyWeight: 400,
    headingScale: 1.5,
    bodyLineHeight: 1.75,
    letterSpacing: 0.02,
  },
  surfaces: {
    pageBackground: '#f7f1e6',
    cardBackground: 'rgba(255, 251, 244, 0.72)',
    cardBorder: 'rgba(74, 31, 44, 0.16)',
    cardRadius: 4,
    paperTexture: 'grain',
    paperTextureOpacity: 0.32,
    shadow: 'soft',
    sectionSpacing: 96,
    contentWidth: 1160,
  },
  buttons: {
    radius: 999,
    style: 'outline',
    letterSpacing: 0.14,
    textTransform: 'uppercase',
  },
  ornaments: {
    divider: 'botanical',
    corner: 'branch',
    overlayMediaId: null,
  },
  layout: {
    imageAspect: '4/5',
    gallery: 'masonry',
    align: 'center',
  },
  animation: {
    preset: 'fade-up',
    disabled: false,
  },
}
