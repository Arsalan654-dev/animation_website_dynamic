import { ChevronDown, ChevronUp, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { GalleryField, ImageField } from '@/components/media/ImageField'
import type { ComponentField } from '@/lib/componentRegistry'
import { asBoolean, asNumber, asString, getByPath, setByPath } from '@/lib/object'
import { cn } from '@/lib/utils'
import type { GalleryImage, MediaRef } from '@/types'

interface FieldControlProps {
  field: ComponentField
  value: unknown
  onChange: (value: unknown) => void
}

export function ColorControl({ value, onChange }: { value: unknown; onChange: (value: string) => void }) {
  const current = asString(value)
  const isHex = /^#[0-9a-f]{6}$/i.test(current)
  const pickerValue = isHex ? current : '#f7f1e6'

  return (
    <div className="flex items-center gap-2">
      <span
        className="h-9 w-9 shrink-0 rounded-lg border border-ink/15 shadow-inner"
        style={{ background: current || 'transparent' }}
      />
      <input
        type="color"
        value={pickerValue}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-ink/10 bg-cream p-0.5"
        aria-label="Choose a colour"
      />
      <Input value={current} onChange={(event) => onChange(event.target.value)} placeholder="#f7f1e6 or rgba(...)" />
    </div>
  )
}

function ListControl({ field, value, onChange }: FieldControlProps) {
  const items = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []
  const subFields = field.itemFields ?? []
  const defaultItem = field.defaultItem ?? {}

  const updateItem = (index: number, next: Record<string, unknown>) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? next : item)))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-ink/10 bg-paper/50 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
              {field.itemLabel ?? 'Item'} {index + 1}
            </p>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="btn-icon"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move item up"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Move item down"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="btn-icon hover:text-[#9b3434]"
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                aria-label="Remove item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {subFields.map((subField) => (
              <FieldControl
                key={subField.key}
                field={subField}
                value={getByPath(item, subField.key)}
                onChange={(next) => updateItem(index, setByPath(item, subField.key, next))}
              />
            ))}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        icon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => onChange([...items, { ...defaultItem }])}
      >
        Add {field.itemLabel?.toLowerCase() ?? 'item'}
      </Button>
    </div>
  )
}

export function FieldControl({ field, value, onChange }: FieldControlProps) {
  if (field.type === 'switch') {
    return (
      <div className="rounded-xl border border-ink/10 bg-paper/50 p-3">
        <Switch
          checked={asBoolean(value)}
          onChange={onChange}
          label={field.label}
          hint={field.hint}
        />
      </div>
    )
  }

  if (field.type === 'image') {
    return (
      <ImageField
        label={field.label}
        hint={field.hint}
        aspect={field.aspect}
        value={(value as MediaRef | null) ?? null}
        onChange={(next) => onChange(next)}
      />
    )
  }

  if (field.type === 'gallery') {
    return (
      <GalleryField
        label={field.label}
        hint={field.hint}
        images={(Array.isArray(value) ? value : []) as GalleryImage[]}
        onChange={(next) => onChange(next)}
      />
    )
  }

  if (field.type === 'list') {
    return (
      <Field label={field.label} hint={field.hint}>
        <ListControl field={field} value={value} onChange={onChange} />
      </Field>
    )
  }

  if (field.type === 'color') {
    return (
      <Field label={field.label} hint={field.hint}>
        <ColorControl value={value} onChange={onChange} />
      </Field>
    )
  }

  if (field.type === 'select') {
    return (
      <Field label={field.label} hint={field.hint}>
        <Select value={asString(value)} onChange={(event) => onChange(event.target.value)}>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
    )
  }

  if (field.type === 'textarea') {
    return (
      <Field label={field.label} hint={field.hint} className="sm:col-span-2">
        <Textarea
          rows={4}
          value={asString(value)}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
    )
  }

  if (field.type === 'number') {
    return (
      <Field label={field.label} hint={field.hint}>
        <Input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={asNumber(value)}
          onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
        />
      </Field>
    )
  }

  if (field.type === 'url') {
    return (
      <Field label={field.label} hint={field.hint}>
        <Input
          type="url"
          value={asString(value)}
          placeholder={field.placeholder ?? 'https://'}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
    )
  }

  return (
    <Field label={field.label} hint={field.hint}>
      <Input
        value={asString(value)}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

export function ComponentFields({
  fields,
  value,
  onChange,
}: {
  fields: ComponentField[]
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  if (!fields.length) {
    return (
      <div className="rounded-xl border border-dashed border-ink/15 bg-paper/40 p-4 text-xs leading-relaxed text-ink/45">
        This piece is controlled by the page and theme settings. Use the Style and Page panels to shape it.
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const fullWidth =
          field.type === 'textarea' ||
          field.type === 'list' ||
          field.type === 'gallery' ||
          field.type === 'image'
        return (
          <div
            key={field.key}
            id={`studio-field-${field.key.replace(/\./g, '-')}`}
            data-studio-field={field.key}
            className={fullWidth ? 'sm:col-span-2' : undefined}
          >
            <FieldControl
              field={field}
              value={getByPath(value, field.key)}
              onChange={(next) => onChange(setByPath(value, field.key, next))}
            />
          </div>
        )
      })}
    </div>
  )
}

export function EmptyFieldsHint({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/[0.06] p-3">
      <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <p className={cn('text-xs leading-relaxed text-ink/50')}>{label}</p>
    </div>
  )
}
