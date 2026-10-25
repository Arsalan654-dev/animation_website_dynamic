import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Palette, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { mergeThemeTokens } from '@/lib/theme'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, PageLoader } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { ThemeTokenEditor } from '@/components/admin/theme/ThemeTokenEditor'
import { ThemePreview } from '@/components/admin/theme/ThemePreview'
import type { AnimationPreset, Theme, ThemeTokens } from '@/types'

interface ThemeForm {
  name: string
  description: string
  default_animation_preset_id: number | null
  is_active: boolean
  tokens: ThemeTokens
}

const fallbackTokens: ThemeTokens = {
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
  buttons: { radius: 999, style: 'outline', letterSpacing: 0.14, textTransform: 'uppercase' },
  ornaments: { divider: 'botanical', corner: 'branch', overlayMediaId: null },
  layout: { imageAspect: '4/5', gallery: 'masonry', align: 'center' },
  animation: { preset: 'fade-up', disabled: false },
}

function formFor(theme: Theme | null): ThemeForm {
  return {
    name: theme?.name ?? '',
    description: theme?.description ?? '',
    default_animation_preset_id: theme?.default_animation_preset_id ?? null,
    is_active: theme?.is_active ?? true,
    tokens: theme ? mergeThemeTokens(fallbackTokens, theme.tokens) : fallbackTokens,
  }
}

export function ThemesPage() {
  useDocumentTitle('Themes — Ever After Studio')
  const [editing, setEditing] = useState<Theme | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Theme | null>(null)
  const [form, setForm] = useState<ThemeForm>(() => formFor(null))
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const themesQuery = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Theme[] }>('/themes')
      return data.data
    },
  })

  const presetsQuery = useQuery({
    queryKey: ['animation-presets'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AnimationPreset[] }>('/animation-presets')
      return data.data
    },
  })

  const themes = themesQuery.data ?? []
  const presets = presetsQuery.data ?? []

  useEffect(() => {
    if (!editing && !creating) return
    setForm(formFor(editing))
    setError(null)
  }, [editing, creating])

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        default_animation_preset_id: form.default_animation_preset_id,
        is_active: form.is_active,
        tokens: form.tokens,
      }
      if (editing) {
        const { data } = await api.patch(`/themes/${editing.id}`, payload)
        return data.data as Theme
      }
      const { data } = await api.post('/themes', payload)
      return data.data as Theme
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] })
      setEditing(null)
      setCreating(false)
      toast({ title: editing ? 'Theme saved' : 'Theme created', tone: 'success' })
    },
    onError: (err) => {
      setError(getApiErrorMessage(err))
      toast({ title: 'Could not save the theme', description: getApiErrorMessage(err), tone: 'error' })
    },
  })

  const duplicate = useMutation({
    mutationFn: async (theme: Theme) => {
      await api.post(`/themes/${theme.id}/duplicate`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] })
      toast({ title: 'Theme duplicated', description: 'The copy is inactive until you publish it.', tone: 'success' })
    },
    onError: (err) => toast({ title: 'Could not duplicate the theme', description: getApiErrorMessage(err), tone: 'error' }),
  })

  const remove = useMutation({
    mutationFn: async (theme: Theme) => {
      await api.delete(`/themes/${theme.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] })
      setDeleting(null)
      toast({ title: 'Theme deleted', tone: 'success' })
    },
    onError: (err) => {
      setDeleting(null)
      toast({ title: 'Could not delete the theme', description: getApiErrorMessage(err), tone: 'error' })
    },
  })

  const open = (theme: Theme | null) => {
    setEditing(theme)
    setCreating(!theme)
    setForm(formFor(theme))
    setError(null)
  }

  const drawerOpen = Boolean(editing || creating)

  return (
    <div>
      <PageHeader
        eyebrow="The design atelier"
        title={
          <>
            Themes,
            <span className="block italic text-wine">the world each invitation lives in.</span>
          </>
        }
        description="Six house themes, each with its own colours, type and ornament. Duplicate one to make it yours, or create a new world from scratch."
        actions={
          <Button type="button" onClick={() => open(null)} icon={<Plus className="h-3.5 w-3.5" />}>
            New theme
          </Button>
        }
      />

      {themesQuery.isLoading ? (
        <PageLoader label="Opening the theme library" />
      ) : themesQuery.isError ? (
        <EmptyState
          title="Themes could not be loaded"
          description={getApiErrorMessage(themesQuery.error)}
          action={<Button onClick={() => themesQuery.refetch()}>Try again</Button>}
        />
      ) : themes.length === 0 ? (
        <EmptyState
          icon={<Palette className="h-5 w-5" />}
          title="No themes yet"
          description="Create your first theme to give invitations a distinct visual world."
          action={<Button onClick={() => open(null)}>Create a theme</Button>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {themes.map((theme) => (
            <article key={theme.id} className="group overflow-hidden rounded-2xl border border-ink/10 bg-cream/80">
              <div className="relative">
                <ThemePreview tokens={theme.tokens} name={theme.name} compact />
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => open(theme)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-cream/95 text-ink shadow transition hover:bg-cream"
                    aria-label={`Edit ${theme.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicate.mutate(theme)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-cream/95 text-ink shadow transition hover:bg-cream"
                    aria-label={`Duplicate ${theme.name}`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-2xl leading-tight text-ink">{theme.name}</h2>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink/45">{theme.description ?? 'A house theme.'}</p>
                  </div>
                  <Badge tone={theme.is_active ? 'green' : 'neutral'}>{theme.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.58rem] uppercase tracking-[0.14em] text-ink/35">
                  <span>{theme.invitations_count ?? 0} invitations</span>
                  {theme.default_animation_preset ? <span>· {theme.default_animation_preset.name}</span> : null}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-ink/[0.07] pt-3">
                  <div className="flex gap-1">
                    {[theme.tokens.colors.primary, theme.tokens.colors.secondary, theme.tokens.colors.accent, theme.tokens.colors.surfaceAlt].map(
                      (color) => (
                        <span key={color} className="h-4 w-4 rounded-full border border-black/10" style={{ background: color }} title={color} />
                      ),
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button type="button" className="btn-icon" onClick={() => open(theme)} aria-label="Edit theme">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon hover:text-[#9b3434]"
                      onClick={() => setDeleting(theme)}
                      aria-label="Delete theme"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setEditing(null)
          setCreating(false)
        }}
        width="xl"
        title={editing ? `Edit ${editing.name}` : 'Create a theme'}
        description="These tokens flow into every invitation that uses the theme. Invitations can still refine them individually."
        footer={
          <div className="flex items-center justify-between gap-3">
            <Switch
              checked={form.is_active}
              onChange={(value) => setForm((current) => ({ ...current, is_active: value }))}
              label="Active"
            />
            <div className="flex gap-2">
              <Button variant="ghost" type="button" onClick={() => { setEditing(null); setCreating(false) }}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => save.mutate()}
                isLoading={save.isPending}
                disabled={!form.name.trim()}
                icon={<Save className="h-3.5 w-3.5" />}
              >
                {editing ? 'Save theme' : 'Create theme'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Theme name" required>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </Field>
            <Field label="Default animation">
              <Select
                value={form.default_animation_preset_id ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    default_animation_preset_id: event.target.value ? Number(event.target.value) : null,
                  }))
                }
              >
                <option value="">No default</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </Field>
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ThemeTokenEditor
                tokens={form.tokens}
                onChange={(tokens) => setForm((current) => ({ ...current, tokens }))}
              />
            </div>
            <div className="lg:col-span-2">
              <div className="sticky top-4">
                <p className="admin-label">Preview</p>
                <ThemePreview tokens={form.tokens} name={form.name || 'New theme'} />
                <p className="mt-2 text-[0.62rem] leading-relaxed text-ink/40">
                  The preview uses the same tokens the public invitation reads. Changes are not saved until you choose
                  Save theme.
                </p>
              </div>
            </div>
          </div>
          {error ? <p className="rounded-lg border border-[#9b3434]/25 bg-[#9b3434]/10 px-3 py-2 text-xs text-[#8c2d2d]">{error}</p> : null}
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
        isLoading={remove.isPending}
        title="Delete this theme?"
        description={`“${deleting?.name ?? 'This theme'}” will be removed. Themes that are assigned to invitations cannot be deleted.`}
        confirmLabel="Delete theme"
      />
    </div>
  )
}
