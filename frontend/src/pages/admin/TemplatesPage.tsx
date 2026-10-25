import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronDown,
  Copy,
  Eye,
  GripVertical,
  LayoutTemplate,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { api, getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { SECTION_LABEL, SECTION_LIBRARY } from '@/lib/constants'
import { defaultThemeTokens, themeCssVars } from '@/lib/theme'
import { asSections, assetUrl, cn } from '@/lib/utils'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, PageLoader, SectionHeading } from '@/components/ui/Primitives'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { ImageField } from '@/components/media/ImageField'
import type { SectionContent, Template, TemplateSection, Theme, ThemeTokens } from '@/types'

const CATEGORIES = ['classic', 'modern', 'garden', 'destination', 'minimal'] as const

interface TemplateForm {
  name: string
  description: string
  category: string
  thumbnail_path: string | null
  default_theme_id: number | null
  is_active: boolean
  sections: TemplateSection[]
}

function templateSections(template: Template | null): TemplateSection[] {
  if (!template) return []
  return asSections(template.layout).map((section) => section as TemplateSection)
}

function formFor(template: Template | null): TemplateForm {
  return {
    name: template?.name ?? '',
    description: template?.description ?? '',
    category: template?.category ?? 'classic',
    thumbnail_path: template?.thumbnail_path ?? null,
    default_theme_id: template?.default_theme_id ?? template?.default_theme?.id ?? null,
    is_active: template?.is_active ?? true,
    sections: templateSections(template),
  }
}

function sectionLabel(type: string): string {
  return SECTION_LABEL[type] ?? type.replace(/_/g, ' ')
}

function themeFor(template: Template | null, themes: Theme[]): Theme | null {
  if (!template) return null
  return template.default_theme ?? themes.find((theme) => theme.id === template.default_theme_id) ?? null
}

function tokensFor(theme: Theme | null): ThemeTokens {
  return theme?.tokens ?? defaultThemeTokens
}

const PREVIEW_TYPES = new Set(['hero', 'story', 'events', 'gallery', 'countdown', 'rsvp', 'quote', 'venue'])

function TemplateStructurePreview({
  name,
  sections,
  theme,
}: {
  name: string
  sections: TemplateSection[]
  theme: Theme | null
}) {
  const tokens = tokensFor(theme)

  return (
    <div
      className="overflow-hidden rounded-xl border border-ink/10"
      style={{ ...themeCssVars(tokens), background: tokens.surfaces.pageBackground, color: tokens.colors.text }}
    >
      <div className="border-b border-[var(--w-card-border)] px-6 py-8 text-center">
        <p
          className="text-[0.55rem] uppercase tracking-[0.28em] text-[var(--w-muted)]"
          style={{ fontFamily: tokens.typography.bodyFont }}
        >
          {theme?.name ?? 'House theme'}
        </p>
        <h3
          className="mt-2 text-3xl leading-tight"
          style={{ fontFamily: tokens.typography.headingFont, color: tokens.colors.primary }}
        >
          {name || 'Untitled template'}
        </h3>
        <div className="mx-auto mt-4 h-px w-16" style={{ background: tokens.colors.accent }} />
        <p className="mt-3 text-[0.6rem] uppercase tracking-[0.2em] text-[var(--w-muted)]">
          {sections.length} section{sections.length === 1 ? '' : 's'} in this layout
        </p>
      </div>

      <div className="max-h-[55vh] space-y-0 overflow-y-auto">
        {sections.length === 0 ? (
          <p className="px-6 py-12 text-center text-xs text-[var(--w-muted)]">
            Add sections to see how this template will open for a couple.
          </p>
        ) : (
          sections.map((section, index) => {
            const content = (section.content ?? {}) as SectionContent
            const heading = content.heading ?? content.quote ?? section.title ?? sectionLabel(section.type)
            return (
              <div
                key={`${section.type}-${index}`}
                className={cn(
                  'border-b border-[var(--w-card-border)] px-6 py-5 last:border-0',
                  section.type === 'hero' && 'py-8 text-center',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.5rem] uppercase tracking-[0.24em] text-[var(--w-accent)]">
                    {String(index + 1).padStart(2, '0')} · {sectionLabel(section.type)}
                  </p>
                  {PREVIEW_TYPES.has(section.type) ? (
                    <span className="rounded-full border border-[var(--w-card-border)] px-2 py-0.5 text-[0.45rem] uppercase tracking-[0.14em] text-[var(--w-muted)]">
                      styled section
                    </span>
                  ) : null}
                </div>
                <p
                  className={cn(
                    'mt-2 text-xl leading-snug',
                    section.type === 'quote' && 'italic',
                    section.type === 'hero' && 'text-2xl',
                  )}
                  style={{
                    fontFamily:
                      section.type === 'quote' ? tokens.typography.scriptFont : tokens.typography.headingFont,
                    color: section.type === 'quote' ? tokens.colors.secondary : tokens.colors.primary,
                  }}
                >
                  {heading}
                </p>
                {content.intro || content.body || content.attribution ? (
                  <p className="mt-1.5 line-clamp-2 text-[0.7rem] leading-relaxed text-[var(--w-muted)]">
                    {content.intro ?? content.body ?? content.attribution}
                  </p>
                ) : null}
                {section.type === 'gallery' ? (
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {[0, 1, 2].map((item) => (
                      <span
                        key={item}
                        className="aspect-[4/3] rounded-sm"
                        style={{ background: tokens.colors.surfaceAlt }}
                      />
                    ))}
                  </div>
                ) : null}
                {section.type === 'countdown' ? (
                  <div className="mt-3 flex gap-2">
                    {['Days', 'Hours', 'Mins'].map((unit) => (
                      <span
                        key={unit}
                        className="flex-1 border border-[var(--w-card-border)] px-2 py-1.5 text-center text-[0.55rem] uppercase tracking-[0.14em] text-[var(--w-muted)]"
                      >
                        {unit}
                      </span>
                    ))}
                  </div>
                ) : null}
                {section.type === 'rsvp' ? (
                  <span
                    className="mt-3 inline-flex px-4 py-1.5 text-[0.5rem] uppercase tracking-[0.18em]"
                    style={{
                      borderRadius: `${tokens.buttons.radius}px`,
                      border: `1px solid ${tokens.colors.primary}`,
                      color: tokens.colors.primary,
                    }}
                  >
                    RSVP
                  </span>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function SortableTemplateSection({
  section,
  index,
  expanded,
  onToggle,
  onRemove,
  onTitleChange,
  onContentChange,
}: {
  section: TemplateSection
  index: number
  expanded: boolean
  onToggle: () => void
  onRemove: () => void
  onTitleChange: (value: string) => void
  onContentChange: (key: keyof SectionContent, value: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${section.type}-${index}`,
  })
  const content = (section.content ?? {}) as SectionContent

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'rounded-xl border bg-cream/70 transition',
        isDragging ? 'z-20 border-gold shadow-lift' : 'border-ink/10',
      )}
    >
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          className="btn-icon cursor-grab touch-none active:cursor-grabbing"
          aria-label={`Reorder ${sectionLabel(section.type)}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 font-display text-sm text-wine">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.6rem] uppercase tracking-[0.14em] text-ink/40">
            {sectionLabel(section.type)}
          </p>
          <Input
            value={section.title ?? ''}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder={sectionLabel(section.type)}
            className="mt-0.5 h-8 border-transparent bg-transparent px-1 text-sm"
            aria-label={`Section ${index + 1} title`}
          />
        </div>
        <button
          type="button"
          className="btn-icon"
          onClick={onToggle}
          aria-label={expanded ? 'Hide section content' : 'Edit section content'}
        >
          <ChevronDown className={cn('h-4 w-4 transition', expanded && 'rotate-180')} />
        </button>
        <button
          type="button"
          className="btn-icon hover:text-[#9b3434]"
          onClick={onRemove}
          aria-label="Remove section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded ? (
        <div className="grid gap-3 border-t border-ink/10 p-3 sm:grid-cols-2">
          <Field label="Eyebrow">
            <Input
              value={content.eyebrow ?? ''}
              onChange={(event) => onContentChange('eyebrow', event.target.value)}
              placeholder="Together with their families"
            />
          </Field>
          <Field label="Heading">
            <Input
              value={content.heading ?? ''}
              onChange={(event) => onContentChange('heading', event.target.value)}
              placeholder={sectionLabel(section.type)}
            />
          </Field>
          <Field label="Intro" className="sm:col-span-2">
            <Textarea
              rows={2}
              value={content.intro ?? ''}
              onChange={(event) => onContentChange('intro', event.target.value)}
              placeholder="A short line to set the scene."
            />
          </Field>
          <Field label="Body" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={content.body ?? ''}
              onChange={(event) => onContentChange('body', event.target.value)}
              placeholder="The words couples can personalise."
            />
          </Field>
          <Field label="Quote">
            <Input
              value={content.quote ?? ''}
              onChange={(event) => onContentChange('quote', event.target.value)}
              placeholder="A favourite line"
            />
          </Field>
          <Field label="Attribution">
            <Input
              value={content.attribution ?? ''}
              onChange={(event) => onContentChange('attribution', event.target.value)}
              placeholder="Author or family"
            />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <Input
              value={content.note ?? ''}
              onChange={(event) => onContentChange('note', event.target.value)}
              placeholder="A gentle note for guests"
            />
          </Field>
        </div>
      ) : null}
    </div>
  )
}

export function TemplatesPage() {
  useDocumentTitle('Templates — Ever After Studio')
  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Template | null>(null)
  const [previewing, setPreviewing] = useState<Template | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(0)
  const [form, setForm] = useState<TemplateForm>(() => formFor(null))
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Template[] }>('/templates')
      return data.data
    },
  })

  const themesQuery = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Theme[] }>('/themes')
      return data.data
    },
  })

  const templates = templatesQuery.data ?? []
  const themes = themesQuery.data ?? []

  useEffect(() => {
    if (!editing && !creating) return
    setForm(formFor(editing))
    setExpanded(editing ? 0 : null)
    setError(null)
  }, [editing, creating])

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        category: form.category,
        thumbnail_path: form.thumbnail_path,
        default_theme_id: form.default_theme_id,
        is_active: form.is_active,
        layout: {
          sections: form.sections.map((section) => ({
            type: section.type,
            title: section.title || null,
            content: section.content ?? {},
          })),
        },
      }
      if (editing) {
        const { data } = await api.patch(`/templates/${editing.id}`, payload)
        return data.data as Template
      }
      const { data } = await api.post('/templates', payload)
      return data.data as Template
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setEditing(null)
      setCreating(false)
      toast({
        title: editing ? 'Template saved' : 'Template created',
        description: `${saved.name} · ${form.sections.length} sections`,
        tone: 'success',
      })
    },
    onError: (err) => {
      const fields = getApiFieldErrors(err)
      setError(Object.values(fields)[0] ?? getApiErrorMessage(err))
      toast({ title: 'Could not save the template', description: getApiErrorMessage(err), tone: 'error' })
    },
  })

  const duplicate = useMutation({
    mutationFn: async (template: Template) => {
      await api.post(`/templates/${template.id}/duplicate`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast({ title: 'Template duplicated', description: 'The copy is inactive until you activate it.', tone: 'success' })
    },
    onError: (err) => toast({ title: 'Could not duplicate the template', description: getApiErrorMessage(err), tone: 'error' }),
  })

  const remove = useMutation({
    mutationFn: async (template: Template) => {
      await api.delete(`/templates/${template.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setDeleting(null)
      toast({ title: 'Template deleted', tone: 'success' })
    },
    onError: (err) => {
      setDeleting(null)
      toast({ title: 'Could not delete the template', description: getApiErrorMessage(err), tone: 'error' })
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const open = (template: Template | null) => {
    setEditing(template)
    setCreating(!template)
    setForm(formFor(template))
    setExpanded(template ? 0 : null)
    setError(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = form.sections.findIndex((section, index) => `${section.type}-${index}` === active.id)
    const newIndex = form.sections.findIndex((section, index) => `${section.type}-${index}` === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    setForm((current) => ({ ...current, sections: arrayMove(current.sections, oldIndex, newIndex) }))
    setExpanded(newIndex)
  }

  const updateSection = (index: number, patch: Partial<TemplateSection>) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, itemIndex) =>
        itemIndex === index ? { ...section, ...patch } : section,
      ),
    }))
  }

  const updateContent = (index: number, key: keyof SectionContent, value: string) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, itemIndex) =>
        itemIndex === index
          ? { ...section, content: { ...(section.content ?? {}), [key]: value } }
          : section,
      ),
    }))
  }

  const addSection = (type: string) => {
    const library = SECTION_LIBRARY.find((item) => item.type === type)
    if (!library) return
    setForm((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          type: library.type,
          title: library.label,
          content: { ...library.content },
        },
      ],
    }))
    setExpanded(form.sections.length)
    setLibraryOpen(false)
  }

  const grouped = useMemo(
    () =>
      (['Story', 'Celebration', 'Guests', 'Design'] as const).map((category) => ({
        category,
        items: SECTION_LIBRARY.filter((item) => item.category === category),
      })),
    [],
  )

  const drawerOpen = Boolean(editing || creating)
  const previewTheme = themeFor(previewing, themes)
  const formTheme = themes.find((theme) => theme.id === form.default_theme_id) ?? null

  return (
    <div>
      <PageHeader
        eyebrow="The layout library"
        title={
          <>
            Templates,
            <span className="block italic text-wine">a beginning already considered.</span>
          </>
        }
        description="Templates are the architectural bones of an invitation: the order of sections, the default words, and the theme a couple starts from. Every invitation can still change everything."
        actions={
          <Button type="button" onClick={() => open(null)} icon={<Plus className="h-3.5 w-3.5" />}>
            New template
          </Button>
        }
      />

      {templatesQuery.isLoading ? (
        <PageLoader label="Opening the layout library" />
      ) : templatesQuery.isError ? (
        <EmptyState
          title="Templates could not be loaded"
          description={getApiErrorMessage(templatesQuery.error)}
          action={<Button onClick={() => templatesQuery.refetch()}>Try again</Button>}
        />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="h-5 w-5" />}
          title="No templates yet"
          description="Create a layout once, then give every new invitation a beautiful place to begin."
          action={<Button onClick={() => open(null)}>Create a template</Button>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const sections = templateSections(template)
            const theme = themeFor(template, themes)
            const thumbnail = assetUrl(template.thumbnail_url)
            return (
              <article key={template.id} className="group overflow-hidden rounded-2xl border border-ink/10 bg-cream/80">
                <div className="relative aspect-[16/10] overflow-hidden bg-paper-deep">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={template.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[var(--w-surface)]" style={themeCssVars(tokensFor(theme))}>
                      <span className="font-script text-5xl text-[var(--w-primary)]/60">
                        {template.name.slice(0, 1)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-cream/65">
                        {template.category}
                      </p>
                      <h2 className="mt-1 truncate font-display text-2xl leading-tight text-cream">{template.name}</h2>
                    </div>
                    <Badge tone={template.is_active ? 'green' : 'neutral'}>{template.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPreviewing(template)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-cream/95 text-ink shadow transition hover:bg-cream"
                      aria-label={`Preview ${template.name}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicate.mutate(template)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-cream/95 text-ink shadow transition hover:bg-cream"
                      aria-label={`Duplicate ${template.name}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 min-h-[2.4rem] text-xs leading-relaxed text-ink/45">
                    {template.description ?? 'A considered starting point for a celebration.'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.58rem] uppercase tracking-[0.14em] text-ink/35">
                    <span>{sections.length} sections</span>
                    <span>·</span>
                    <span>{template.invitations_count ?? 0} invitations</span>
                    {theme ? (
                      <>
                        <span>·</span>
                        <span>{theme.name}</span>
                      </>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-ink/[0.07] pt-3">
                    <div className="flex gap-1">
                      {[tokensFor(theme).colors.primary, tokensFor(theme).colors.secondary, tokensFor(theme).colors.accent].map(
                        (color) => (
                          <span
                            key={color}
                            className="h-4 w-4 rounded-full border border-black/10"
                            style={{ background: color }}
                            title={color}
                          />
                        ),
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button type="button" className="btn-icon" onClick={() => setPreviewing(template)} aria-label="Preview template">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button type="button" className="btn-icon" onClick={() => open(template)} aria-label="Edit template">
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-icon hover:text-[#9b3434]"
                        onClick={() => setDeleting(template)}
                        aria-label="Delete template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setEditing(null)
          setCreating(false)
        }}
        width="xl"
        title={editing ? `Edit ${editing.name}` : 'Create a template'}
        description="Set the structure and starting words. Couples personalise the content; the layout gives them a confident beginning."
        footer={
          <div className="flex items-center justify-between gap-3">
            <Switch
              checked={form.is_active}
              onChange={(value) => setForm((current) => ({ ...current, is_active: value }))}
              label="Active"
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setEditing(null)
                  setCreating(false)
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => save.mutate()}
                isLoading={save.isPending}
                disabled={!form.name.trim()}
                icon={<Save className="h-3.5 w-3.5" />}
              >
                {editing ? 'Save template' : 'Create template'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <Field label="Template name" required>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="The Heritage Envelope"
              />
            </Field>
            <Field label="Category">
              <Select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="A formal celebration layout with countdown, story, schedule and gallery."
              />
            </Field>
            <Field label="Default theme">
              <Select
                value={form.default_theme_id ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    default_theme_id: event.target.value ? Number(event.target.value) : null,
                  }))
                }
              >
                <option value="">No default theme</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:row-span-2">
              <ImageField
                label="Cover thumbnail"
                value={form.thumbnail_path ? { url: form.thumbnail_path } : null}
                onChange={(value) =>
                  setForm((current) => ({ ...current, thumbnail_path: value?.url ?? null }))
                }
                aspect="video"
                hint="Shown on the template card and in the invitation creator."
              />
            </div>
          </section>

          <section>
            <SectionHeading
              eyebrow="The story flow"
              title="Sections in this layout"
              description="Drag to reorder. Each section arrives with thoughtful starter copy the couple can rewrite."
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLibraryOpen(true)}
                  icon={<Plus className="h-3.5 w-3.5" />}
                >
                  Add section
                </Button>
              }
            />

            {form.sections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink/15 bg-cream/40 px-4 py-8 text-center">
                <p className="font-display text-xl text-ink">A blank layout</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink/45">
                  Start with a hero, then add the moments you want every couple to have.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setLibraryOpen(true)}
                  icon={<Plus className="h-3.5 w-3.5" />}
                >
                  Add the first section
                </Button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={form.sections.map((section, index) => `${section.type}-${index}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {form.sections.map((section, index) => (
                      <SortableTemplateSection
                        key={`${section.type}-${index}`}
                        section={section}
                        index={index}
                        expanded={expanded === index}
                        onToggle={() => setExpanded(expanded === index ? null : index)}
                        onRemove={() =>
                          setForm((current) => ({
                            ...current,
                            sections: current.sections.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                        onTitleChange={(value) => updateSection(index, { title: value })}
                        onContentChange={(key, value) => updateContent(index, key, value)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>

          <section className="rounded-xl border border-gold/20 bg-gold/[0.06] p-4">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">A quiet preview</p>
            <div className="mt-3">
              <TemplateStructurePreview name={form.name || 'Untitled template'} sections={form.sections} theme={formTheme} />
            </div>
          </section>

          {error ? (
            <p className="rounded-lg border border-[#9b3434]/25 bg-[#9b3434]/10 px-3 py-2 text-xs text-[#8c2d2d]">{error}</p>
          ) : null}
        </div>
      </Drawer>

      <Modal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        title="Add a section"
        description="Every section is optional. The layout is a beginning, never a cage."
        size="lg"
      >
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.category}>
              <h3 className="admin-label">{group.category}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addSection(item.type)}
                    className="rounded-xl border border-ink/10 bg-cream/70 p-3 text-left transition hover:border-gold hover:bg-gold/[0.06]"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-lg leading-tight text-ink">{item.label}</span>
                      <Plus className="h-3.5 w-3.5 text-gold" />
                    </span>
                    <span className="mt-1 block text-[0.65rem] leading-relaxed text-ink/45">{item.description}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Modal>

      <Modal
        open={Boolean(previewing)}
        onClose={() => setPreviewing(null)}
        title={previewing ? `${previewing.name} — structure preview` : 'Template preview'}
        description="A reading of the layout with its default theme. The couple's own names, dates and photographs fill it in."
        size="lg"
      >
        {previewing ? (
          <div className="space-y-4">
            <TemplateStructurePreview
              name={previewing.name}
              sections={templateSections(previewing)}
              theme={previewTheme}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-cream/60 p-3">
              <p className="text-xs text-ink/45">
                {templateSections(previewing).length} sections · {previewTheme?.name ?? 'No default theme'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewing(null)
                  open(previewing)
                }}
              >
                Edit this template
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
        isLoading={remove.isPending}
        title="Delete this template?"
        description={`“${deleting?.name ?? 'This template'}” will be removed from the layout library. Templates already used by invitations cannot be deleted.`}
        confirmLabel="Delete template"
      />
    </div>
  )
}
