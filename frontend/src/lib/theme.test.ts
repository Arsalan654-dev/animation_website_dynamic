import { describe, expect, it } from 'vitest'
import { defaultThemeTokens, fontStack, mergeThemeTokens, themeCssVars } from './theme'

describe('theme tokens', () => {
  it('deep-merges per-invitation overrides over the theme defaults', () => {
    const merged = mergeThemeTokens(defaultThemeTokens, {
      colors: { primary: '#123456' },
      typography: { headingFont: 'Playfair Display' },
    })

    expect(merged.colors.primary).toBe('#123456')
    expect(merged.colors.text).toBe(defaultThemeTokens.colors.text)
    expect(merged.typography.headingFont).toBe('Playfair Display')
    expect(merged.typography.bodyFont).toBe(defaultThemeTokens.typography.bodyFont)
    expect(merged.surfaces).toEqual(defaultThemeTokens.surfaces)
  })

  it('returns the base tokens when there are no overrides', () => {
    expect(mergeThemeTokens(defaultThemeTokens, null)).toBe(defaultThemeTokens)
  })

  it('maps tokens to the CSS variables used by the public renderer', () => {
    const vars = themeCssVars(defaultThemeTokens)

    expect(vars['--w-primary']).toBe('#4a1f2c')
    expect(vars['--w-page-bg']).toBe('#f7f1e6')
    expect(vars['--w-card-radius']).toBe('4px')
    expect(vars['--w-section-spacing']).toBe('96px')
    expect(vars['--w-image-aspect']).toBe('4 / 5')
    expect(vars['--w-heading-font']).toContain('Cormorant Garamond')
    expect(vars['--w-body-font']).toContain('Jost')
  })

  it('resolves registered fonts and falls back safely for unknown fonts', () => {
    expect(fontStack('Great Vibes')).toBe('"Great Vibes", cursive')
    expect(fontStack('Unknown Font')).toBe('"Unknown Font", Georgia, serif')
    expect(fontStack(undefined)).toContain('Cormorant Garamond')
  })
})
