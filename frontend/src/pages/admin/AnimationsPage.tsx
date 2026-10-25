import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  ArrowUpRight,
  Copy,
  Layers,
  Mail,
  MoveRight,
  Play,
  Plus,
  Save,
  Sparkles,
  Trash2,
  ZoomIn,
} from 'lucide-react'
import { api, getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { initialForAnimation, transitionForAnimation } from '@/lib/animation'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, PageLoader, Tabs } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import type { AnimationConfig, AnimationPreset, AnimationType } from '@/types'

const TYPE_META: Record<
  AnimationType,
  { label: string; blurb: string; icon: typeof Sparkles }
> = {
  fade_up: { label: 'Fade up', blurb: 'A calm editorial entrance, rising gently into place.', icon: ArrowUpRight },
  stagger: { label: 'Stagger reveal', blurb: 'Cards and lines arrive one after another.', icon: Sparkles },
  zoom: { label: 'Soft zoom', blurb: 'Photography opens from a cinematic scale.', icon: ZoomIn },
  parallax: { label: 'Parallax', blurb: 'Layered scroll movement with depth.', icon: Layers },
  slide: { label: 'Slide in', blurb: 'Content arrives from the side with formality.', icon: MoveRight },
  envelope: { label: 'Envelope', blurb: 'The full wax-seal opening sequence.', icon: Mail },
}

const TYPES = Object.keys(TYPE_META) as AnimationType[]
const EASINGS: Array<NonNullable<AnimationConfig['easing']>> = ['easeOut', 'easeIn', 'easeInOut', 'linear', 'spring']

const BASE_DEFAULTS: AnimationConfig = {
  duration: 0.8,
  delay: 0.05,
  easing: 'easeOut',
  distance: 40,
  scale: 1,
  stagger: 0.12,
  once: true,
  direction: 'up',
  parallax: 0,
  mobile: true,
  reduced_motion: 'fade',
}

interface PresetForm {
  name: string
  description: string
  type: AnimationType
  defaults: AnimationConfig
  is_active: boolean
}

function formFor(preset: AnimationPreset | null): PresetForm {
  return {
    name: preset?.name ?? '',
    description: preset?.description ?? '',
    type: preset?.type ?? 'fade_up',
    defaults: { ...BASE_DEFAULTS, ...(preset?.defaults ?? {}) },
    is_active: preset?.is_active ?? true,
  }
}

function MotionPreview({ type, config, playKey }: { type: AnimationType; config: AnimationConfig; playKey: number }) {
  const initial = initialForAnimation(type, config, false)
  const transition = transitionForAnimation(config, false)

  if (type === 'stagger') {
    return (
      <div key={playKey} className="flex h-full flex-col justify-center gap-2 px-6">
        {['Amelia', '& Noah', '12 · 09 · 2026'].map((line, index) => (
          <motion.p
            key={line}
            initial={initial}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ ...transition, delay: (config.delay ?? 0.05) + index * (config.stagger ?? 0.12) }}
            className={cn(
              'text-center text-cream',
              index === 1 ? 'font-script text-3xl text-gold' : 'font-display text-lg tracking-[0.18em]',
              index === 2 && 'text-[0.6rem] uppercase tracking-[0.32em] text-cream/60',
            )}
          >
            {line}
          </motion.p>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      key={playKey}
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={transition}
      className="flex h-full flex-col items-center justify-center px-6 text-center"
    >
      <span className="font-script text-3xl text-gold">A &amp; N</span>
      <span className="mt-2 font-display text-xl tracking-[0.2em] text-cream">AMELIA &amp; NOAH</span>
      <span className="mt-2 text-[0.55rem] uppercase tracking-[0.3em] text-cream/55">September 2026</span>
    </motion.div>
  )
}

export function AnimationsPage() {
  useDocumentTitle('Animations — Ever After Studio')
  const [editing, setEditing] = useState<AnimationPreset | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<AnimationPreset | null>(null)
  const [form, setForm] = useState<PresetForm>(() => formFor(null))
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | AnimationType>('all')
  const [playKeys, setPlayKeys] = useState<Record<number, number>>({})
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const presetsQuery = useQuery({
    queryKey: ['animation-presets'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AnimationPreset[] }>('/animation-presets')
      return data.data
    },
  })

  const presets = presetsQuery.data ?? []

  useEffect(() => {
    if (!editing && !creating) return
    setForm(formFor(editing))
    setError(null)
  }, [editing, creating])

  const filtered = useMemo(
    () =>
      presets.filter((preset) => {
        if (filter === 'active' && !preset.is_active) return false
        if (filter === 'inactive' && preset.is_active) return false
        if (typeFilter !== 'all' && preset.type !== typeFilter) return false
        return true
      }),
    [presets, filter, typeFilter],
  )

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        type: form.type,
        defaults: form.defaults,
        is_active: form.is_active,
      }
      if (editing) {
        const { data } = await api.patch(`/animation-presets/${editing.id}`, payload)
        return data.data as AnimationPreset
      }
      const { data } = await api.post('/animation-presets', payload)
      return data.data as AnimationPreset
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['animation-presets'] })
      setEditing(null)
      setCreating(false)
      toast({ title: editing ? 'Preset saved' : 'Preset created', description: saved.name, tone: 'success' })
    },
    onError: (err) => {
      const fields = getApiFieldErrors(err)
      setError(Object.values(fields)[0] ?? getApiErrorMessage(err))
      toast({ title: 'Could not save the preset', description: getApiErrorMessage(err), tone: 'error' })
    },
  })

  const duplicate = useMutation({
    mutationFn: async (preset: AnimationPreset) => {
      await api.post(`/animation-presets/${preset.id}/duplicate`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-presets'] })
      toast({ title: 'Preset duplicated', description: 'The copy is inactive until you activate it.', tone: 'success' })
    },
    onError: (err) => toast({ title: 'Could not duplicate the preset', description: getApiErrorMessage(err), tone: 'error' }),
  })

  const remove = useMutation({
    mutationFn: async (preset: AnimationPreset) => {
      await api.delete(`/animation-presets/${preset.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-presets'] })
      setDeleting(null)
      toast({ title: 'Preset deleted', tone: 'success' })
    },
    onError: (err) => {
      setDeleting(null)
      toast({ title: 'Could not delete the preset', description: getApiErrorMessage(err), tone: 'error' })
    },
  })

  const open = (preset: AnimationPreset | null) => {
    setEditing(preset)
    setCreating(!preset)
    setForm(formFor(preset))
    setError(null)
  }

  const updateDefault = <K extends keyof AnimationConfig>(key: K, value: AnimationConfig[K]) =>
    setForm((current) => ({ ...current, defaults: { ...current.defaults, [key]: value } }))

  const replay = (preset: AnimationPreset) =>
    setPlayKeys((current) => ({ ...current, [preset.id]: (current[preset.id] ?? 0) + 1 }))

  const drawerOpen = Boolean(editing || creating)
  const meta = TYPE_META[form.type]
  const needsDistance = ['fade_up', 'stagger', 'slide'].includes(form.type)
  const needsScale = form.type === 'zoom'
  const needsParallax = form.type === 'parallax'

  return (
    <div>
      <PageHeader
        eyebrow="The motion atelier"
        title={
          <>
            Animations,
            <span className="block italic text-wine">the breath between moments.</span>
          </>
        }
        description="Presets are reusable motion recipes: how a section enters, how quickly it settles, and how it behaves for guests who prefer reduced motion. Assign them to themes or individual sections."
        actions={
          <Button type="button" onClick={() => open(null)} icon={<Plus className="h-3.5 w-3.5" />}>
            New preset
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          tabs={[
            { value: 'all', label: 'All presets', count: presets.length },
            { value: 'active', label: 'Active', count: presets.filter((preset) => preset.is_active).length },
            { value: 'inactive', label: 'Inactive', count: presets.filter((preset) => !preset.is_active).length },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <div className="flex items-center gap-2">
          <span className="text-[0.6rem] uppercase tracking-[0.16em] text-ink/35">Motion type</span>
          <Select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'all' | AnimationType)}
            className="h-9 w-44"
            aria-label="Filter by motion type"
          >
            <option value="all">Every type</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_META[type].label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {presetsQuery.isLoading ? (
        <PageLoader label="Warming up the motion studio" />
      ) : presetsQuery.isError ? (
        <EmptyState
          title="Presets could not be loaded"
          description={getApiErrorMessage(presetsQuery.error)}
          action={<Button onClick={() => presetsQuery.refetch()}>Try again</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title={presets.length === 0 ? 'No motion presets yet' : 'No presets match this view'}
          description={
            presets.length === 0
              ? 'Create a preset to give entrances a consistent, considered rhythm.'
              : 'Try another filter, or create a new preset for this motion.'
          }
          action={<Button onClick={() => open(null)}>Create a preset</Button>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((preset) => {
            const presetMeta = TYPE_META[preset.type] ?? TYPE_META.fade_up
            const Icon = presetMeta.icon
            const playKey = playKeys[preset.id] ?? 0
            return (
              <article key={preset.id} className="group overflow-hidden rounded-2xl border border-ink/10 bg-cream/80">
                <div className="relative overflow-hidden bg-wine-deep">
                  <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:16px_16px]" />
                  <div className="relative h-44">
                    <MotionPreview type={preset.type} config={preset.defaults ?? {}} playKey={playKey} />
                  </div>
                  <button
                    type="button"
                    onClick={() => replay(preset)}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-cream/20 bg-ink/30 px-3 py-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-cream/80 backdrop-blur transition hover:border-gold/50 hover:text-cream"
                  >
                    <Play className="h-3 w-3" />
                    Replay
                  </button>
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-cream/20 bg-ink/25 px-2.5 py-1 text-[0.52rem] uppercase tracking-[0.16em] text-cream/70 backdrop-blur">
                    <Icon className="h-3 w-3" />
                    {presetMeta.label}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-2xl leading-tight text-ink">{preset.name}</h2>
                      <p className="mt-1 line-clamp-2 min-h-[2.2rem] text-xs leading-relaxed text-ink/45">
                        {preset.description ?? presetMeta.blurb}
                      </p>
                    </div>
                    <Badge tone={preset.is_active ? 'green' : 'neutral'}>{preset.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-ink/10 bg-paper px-2 py-0.5 text-[0.55rem] text-ink/45">
                      {preset.defaults?.duration ?? 0.8}s
                    </span>
                    <span className="rounded-full border border-ink/10 bg-paper px-2 py-0.5 text-[0.55rem] text-ink/45">
                      {preset.defaults?.easing ?? 'easeOut'}
                    </span>
                    {preset.defaults?.stagger ? (
                      <span className="rounded-full border border-ink/10 bg-paper px-2 py-0.5 text-[0.55rem] text-ink/45">
                        {preset.defaults.stagger}s stagger
                      </span>
                    ) : null}
                    <span className="rounded-full border border-ink/10 bg-paper px-2 py-0.5 text-[0.55rem] text-ink/45">
                      {preset.usage_count ?? 0} sections
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-ink/[0.07] pt-3">
                    <p className="text-[0.55rem] uppercase tracking-[0.14em] text-ink/30">
                      {preset.slug}
                    </p>
                    <div className="flex items-center gap-0.5">
                      <button type="button" className="btn-icon" onClick={() => open(preset)} aria-label="Edit preset">
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => duplicate.mutate(preset)}
                        aria-label="Duplicate preset"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-icon hover:text-[#9b3434]"
                        onClick={() => setDeleting(preset)}
                        aria-label="Delete preset"
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
        width="lg"
        title={editing ? `Edit ${editing.name}` : 'Create an animation preset'}
        description="These defaults are the starting point. Individual sections can still override them."
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
                {editing ? 'Save preset' : 'Create preset'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-ink/10 bg-wine-deep">
            <div className="pointer-events-none absolute" />
            <div className="h-40">
              <MotionPreview type={form.type} config={form.defaults} playKey={playKeys[-1] ?? 0} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preset name" required>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Fade Up"
              />
            </Field>
            <Field label="Motion type">
              <Select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AnimationType }))}
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TYPE_META[type].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder={meta.blurb}
              />
            </Field>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="admin-eyebrow mb-1">The recipe</p>
                <h3 className="font-display text-2xl leading-none">Motion defaults</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPlayKeys((current) => ({ ...current, [-1]: (current[-1] ?? 0) + 1 }))}
                icon={<Play className="h-3.5 w-3.5" />}
              >
                Preview
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Duration" hint="Seconds, 0.1–10.">
                <Input
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.05}
                  value={form.defaults.duration ?? 0.8}
                  onChange={(event) => updateDefault('duration', Number(event.target.value))}
                />
              </Field>
              <Field label="Delay" hint="Seconds before the entrance begins.">
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.05}
                  value={form.defaults.delay ?? 0.05}
                  onChange={(event) => updateDefault('delay', Number(event.target.value))}
                />
              </Field>
              <Field label="Easing">
                <Select
                  value={form.defaults.easing ?? 'easeOut'}
                  onChange={(event) => updateDefault('easing', event.target.value as AnimationConfig['easing'])}
                >
                  {EASINGS.map((easing) => (
                    <option key={easing} value={easing}>
                      {easing}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Stagger" hint="Delay between grouped items, in seconds.">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={form.defaults.stagger ?? 0.12}
                  onChange={(event) => updateDefault('stagger', Number(event.target.value))}
                />
              </Field>

              {needsDistance ? (
                <>
                  <Field label="Travel distance" hint="Pixels of movement.">
                    <Input
                      type="number"
                      min={0}
                      max={200}
                      step={2}
                      value={form.defaults.distance ?? 40}
                      onChange={(event) => updateDefault('distance', Number(event.target.value))}
                    />
                  </Field>
                  <Field label="Direction">
                    <Select
                      value={form.defaults.direction ?? 'up'}
                      onChange={(event) => updateDefault('direction', event.target.value as AnimationConfig['direction'])}
                    >
                      {['up', 'down', 'left', 'right'].map((direction) => (
                        <option key={direction} value={direction}>
                          {direction.charAt(0).toUpperCase() + direction.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </>
              ) : null}

              {needsScale ? (
                <Field label="Starting scale" hint="0.5–1.5. Lower feels more cinematic.">
                  <Input
                    type="number"
                    min={0.5}
                    max={1.5}
                    step={0.01}
                    value={form.defaults.scale ?? 0.94}
                    onChange={(event) => updateDefault('scale', Number(event.target.value))}
                  />
                </Field>
              ) : null}

              {needsParallax ? (
                <Field label="Parallax intensity" hint="0–1. Higher moves more.">
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={form.defaults.parallax ?? 0.18}
                    onChange={(event) => updateDefault('parallax', Number(event.target.value))}
                  />
                </Field>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-ink/10 bg-paper/60 p-4">
                <Switch
                  checked={form.defaults.once ?? true}
                  onChange={(value) => updateDefault('once', value)}
                  label="Play once"
                  hint="Reveal the section only the first time it enters the viewport."
                />
              </div>
              <div className="rounded-xl border border-ink/10 bg-paper/60 p-4">
                <Switch
                  checked={form.defaults.mobile ?? true}
                  onChange={(value) => updateDefault('mobile', value)}
                  label="Animate on mobile"
                  hint="Turn off for heavier motion that may feel distracting on small screens."
                />
              </div>
              <Field label="Reduced motion fallback">
                <Select
                  value={form.defaults.reduced_motion ?? 'fade'}
                  onChange={(event) =>
                    updateDefault('reduced_motion', event.target.value as AnimationConfig['reduced_motion'])
                  }
                >
                  <option value="fade">Gentle fade</option>
                  <option value="none">No animation</option>
                </Select>
              </Field>
            </div>
          </section>

          <div className="rounded-xl border border-gold/20 bg-gold/[0.06] p-4">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">How it is used</p>
            <p className="mt-2 text-xs leading-relaxed text-ink/50">
              Presets appear in the theme studio, the invitation design tab and every section's motion settings. A
              guest's reduced-motion preference always overrides these defaults.
            </p>
          </div>

          {error ? (
            <p className="rounded-lg border border-[#9b3434]/25 bg-[#9b3434]/10 px-3 py-2 text-xs text-[#8c2d2d]">{error}</p>
          ) : null}
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
        isLoading={remove.isPending}
        title="Delete this animation preset?"
        description={`“${deleting?.name ?? 'This preset'}” will be removed. Presets assigned to themes or sections cannot be deleted.`}
        confirmLabel="Delete preset"
      />
    </div>
  )
}
