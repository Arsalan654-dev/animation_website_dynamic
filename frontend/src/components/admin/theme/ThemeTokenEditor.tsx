import { Field, Input, Select } from '@/components/ui/Field'
import { FONT_OPTIONS } from '@/lib/theme'
import type { ThemeTokens } from '@/types'

interface ThemeTokenEditorProps {
  tokens: ThemeTokens
  onChange: (tokens: ThemeTokens) => void
}

export function ThemeTokenEditor({ tokens, onChange }: ThemeTokenEditorProps) {
  const setColors = <K extends keyof ThemeTokens['colors']>(key: K, value: ThemeTokens['colors'][K]) =>
    onChange({ ...tokens, colors: { ...tokens.colors, [key]: value } })

  const setTypography = <K extends keyof ThemeTokens['typography']>(
    key: K,
    value: ThemeTokens['typography'][K],
  ) => onChange({ ...tokens, typography: { ...tokens.typography, [key]: value } })

  const setSurfaces = <K extends keyof ThemeTokens['surfaces']>(key: K, value: ThemeTokens['surfaces'][K]) =>
    onChange({ ...tokens, surfaces: { ...tokens.surfaces, [key]: value } })

  const setButtons = <K extends keyof ThemeTokens['buttons']>(key: K, value: ThemeTokens['buttons'][K]) =>
    onChange({ ...tokens, buttons: { ...tokens.buttons, [key]: value } })

  const setOrnaments = <K extends keyof ThemeTokens['ornaments']>(key: K, value: ThemeTokens['ornaments'][K]) =>
    onChange({ ...tokens, ornaments: { ...tokens.ornaments, [key]: value } })

  const setLayout = <K extends keyof ThemeTokens['layout']>(key: K, value: ThemeTokens['layout'][K]) =>
    onChange({ ...tokens, layout: { ...tokens.layout, [key]: value } })

  return (
    <div className="space-y-7">
      <section>
        <h3 className="admin-label mb-3">Colours</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              ['primary', 'Primary'],
              ['secondary', 'Secondary'],
              ['accent', 'Accent'],
              ['surface', 'Surface'],
              ['surfaceAlt', 'Surface alt'],
              ['text', 'Text'],
              ['muted', 'Muted'],
              ['pageBackground', 'Page background'],
            ] as const
          ).map(([key, label]) => {
            const value =
              key === 'pageBackground' ? tokens.surfaces.pageBackground : tokens.colors[key as keyof ThemeTokens['colors']]
            return (
              <Field key={key} label={label}>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={toHex(value)}
                    onChange={(event) =>
                      key === 'pageBackground'
                        ? setSurfaces('pageBackground', event.target.value)
                        : setColors(key as keyof ThemeTokens['colors'], event.target.value)
                    }
                    className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-ink/15 bg-paper p-1"
                    aria-label={`${label} colour`}
                  />
                  <Input
                    className="px-2 text-[0.68rem]"
                    value={value}
                    onChange={(event) =>
                      key === 'pageBackground'
                        ? setSurfaces('pageBackground', event.target.value)
                        : setColors(key as keyof ThemeTokens['colors'], event.target.value)
                    }
                  />
                </div>
              </Field>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="admin-label mb-3">Typography</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Heading face">
            <Select value={tokens.typography.headingFont} onChange={(event) => setTypography('headingFont', event.target.value)}>
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Body face">
            <Select value={tokens.typography.bodyFont} onChange={(event) => setTypography('bodyFont', event.target.value)}>
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Script face">
            <Select value={tokens.typography.scriptFont} onChange={(event) => setTypography('scriptFont', event.target.value)}>
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Base size" hint="13–22 px">
            <Input
              type="number"
              min={13}
              max={22}
              value={tokens.typography.baseSize}
              onChange={(event) => setTypography('baseSize', Number(event.target.value))}
            />
          </Field>
          <Field label="Line height">
            <Input
              type="number"
              step={0.05}
              min={1.2}
              max={2.2}
              value={tokens.typography.bodyLineHeight}
              onChange={(event) => setTypography('bodyLineHeight', Number(event.target.value))}
            />
          </Field>
          <Field label="Letter spacing" hint="In em units">
            <Input
              type="number"
              step={0.01}
              min={0}
              max={0.3}
              value={tokens.typography.letterSpacing}
              onChange={(event) => setTypography('letterSpacing', Number(event.target.value))}
            />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="admin-label mb-3">Surfaces & rhythm</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Card radius" hint="0–40 px">
            <Input
              type="number"
              min={0}
              max={40}
              value={tokens.surfaces.cardRadius}
              onChange={(event) => setSurfaces('cardRadius', Number(event.target.value))}
            />
          </Field>
          <Field label="Section spacing">
            <Input
              type="number"
              min={40}
              max={200}
              value={tokens.surfaces.sectionSpacing}
              onChange={(event) => setSurfaces('sectionSpacing', Number(event.target.value))}
            />
          </Field>
          <Field label="Content width">
            <Input
              type="number"
              min={800}
              max={1600}
              step={20}
              value={tokens.surfaces.contentWidth}
              onChange={(event) => setSurfaces('contentWidth', Number(event.target.value))}
            />
          </Field>
          <Field label="Paper texture">
            <Select
              value={tokens.surfaces.paperTexture}
              onChange={(event) => setSurfaces('paperTexture', event.target.value as ThemeTokens['surfaces']['paperTexture'])}
            >
              <option value="grain">Grain</option>
              <option value="linen">Linen</option>
              <option value="plain">Plain</option>
            </Select>
          </Field>
          <Field label="Texture opacity" hint="0–1">
            <Input
              type="number"
              step={0.01}
              min={0}
              max={1}
              value={tokens.surfaces.paperTextureOpacity}
              onChange={(event) => setSurfaces('paperTextureOpacity', Number(event.target.value))}
            />
          </Field>
          <Field label="Shadow">
            <Select
              value={tokens.surfaces.shadow}
              onChange={(event) => setSurfaces('shadow', event.target.value as ThemeTokens['surfaces']['shadow'])}
            >
              <option value="soft">Soft</option>
              <option value="deep">Deep</option>
              <option value="none">None</option>
            </Select>
          </Field>
        </div>
      </section>

      <section>
        <h3 className="admin-label mb-3">Buttons & ornaments</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Button style">
            <Select
              value={tokens.buttons.style}
              onChange={(event) => setButtons('style', event.target.value as ThemeTokens['buttons']['style'])}
            >
              <option value="outline">Outline</option>
              <option value="fill">Filled</option>
              <option value="text">Text</option>
            </Select>
          </Field>
          <Field label="Button radius">
            <Input
              type="number"
              min={0}
              max={999}
              value={tokens.buttons.radius}
              onChange={(event) => setButtons('radius', Number(event.target.value))}
            />
          </Field>
          <Field label="Button tracking">
            <Input
              type="number"
              step={0.01}
              min={0}
              max={0.4}
              value={tokens.buttons.letterSpacing}
              onChange={(event) => setButtons('letterSpacing', Number(event.target.value))}
            />
          </Field>
          <Field label="Divider ornament">
            <Select
              value={tokens.ornaments.divider}
              onChange={(event) => setOrnaments('divider', event.target.value as ThemeTokens['ornaments']['divider'])}
            >
              <option value="botanical">Botanical</option>
              <option value="line">Line</option>
              <option value="diamond">Diamond</option>
              <option value="none">None</option>
            </Select>
          </Field>
          <Field label="Corner ornament">
            <Select
              value={tokens.ornaments.corner}
              onChange={(event) => setOrnaments('corner', event.target.value as ThemeTokens['ornaments']['corner'])}
            >
              <option value="branch">Branch</option>
              <option value="floral">Floral</option>
              <option value="none">None</option>
            </Select>
          </Field>
          <Field label="Image aspect">
            <Select
              value={tokens.layout.imageAspect}
              onChange={(event) => setLayout('imageAspect', event.target.value)}
            >
              <option value="1/1">Square · 1:1</option>
              <option value="4/5">Portrait · 4:5</option>
              <option value="3/4">Portrait · 3:4</option>
              <option value="2/3">Tall · 2:3</option>
              <option value="16/10">Landscape · 16:10</option>
            </Select>
          </Field>
          <Field label="Gallery layout">
            <Select
              value={tokens.layout.gallery}
              onChange={(event) => setLayout('gallery', event.target.value as ThemeTokens['layout']['gallery'])}
            >
              <option value="masonry">Masonry</option>
              <option value="grid">Grid</option>
            </Select>
          </Field>
          <Field label="Text alignment">
            <Select
              value={tokens.layout.align}
              onChange={(event) => setLayout('align', event.target.value as ThemeTokens['layout']['align'])}
            >
              <option value="center">Centred</option>
              <option value="left">Left</option>
            </Select>
          </Field>
        </div>
      </section>
    </div>
  )
}

function toHex(value: string): string {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value
      .slice(1)
      .split('')
      .map((char) => char + char)
      .join('')}`
  }
  return '#4a1f2c'
}
