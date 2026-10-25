import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AtSign,
  Check,
  Save,
  Server,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { API_URL, api, getApiErrorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Field, Input, Switch } from '@/components/ui/Field'
import { Badge, PageHeader, PageLoader, SectionHeading } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import type { ApiEnvelope, Settings } from '@/types'

interface SettingsForm {
  site_name: string
  animations_enabled: boolean
}

export function SettingsPage() {
  useDocumentTitle('Settings — Ever After Studio')
  const { user } = useAuth()
  const [form, setForm] = useState<SettingsForm>({ site_name: '', animations_enabled: true })
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const canEdit = user?.role === 'admin'

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Settings>>('/settings')
      return data.data
    },
  })

  useEffect(() => {
    if (!settingsQuery.data) return
    setForm({
      site_name: settingsQuery.data.site_name,
      animations_enabled: settingsQuery.data.animations_enabled,
    })
  }, [settingsQuery.data])

  const save = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<ApiEnvelope<Settings>>('/settings', {
        site_name: form.site_name.trim(),
        animations_enabled: form.animations_enabled,
      })
      return data.data
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(['settings'], settings)
      queryClient.invalidateQueries({ queryKey: ['public-invitation'] })
      setError(null)
      toast({ title: 'Studio settings saved', description: 'The changes are live for every invitation.', tone: 'success' })
    },
    onError: (err) => {
      const message = getApiErrorMessage(err)
      setError(message)
      toast({ title: 'Could not save the settings', description: message, tone: 'error' })
    },
  })

  if (settingsQuery.isLoading) {
    return <PageLoader label="Opening the studio settings" />
  }

  return (
    <div>
      <PageHeader
        eyebrow="The studio ledger"
        title={
          <>
            Settings,
            <span className="block italic text-wine">the quiet details behind every invitation.</span>
          </>
        }
        description="The studio name, the global motion preference, and the account you are signed in with. These settings apply across every invitation and theme."
      />

      {settingsQuery.isError ? (
        <div className="mb-5 rounded-xl border border-[#9b3434]/25 bg-[#9b3434]/10 px-4 py-3 text-sm text-[#8c2d2d]">
          {getApiErrorMessage(settingsQuery.error)}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <section className="admin-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-2xl leading-none">Studio identity</h2>
                <p className="mt-1 text-xs text-ink/40">The name guests see in the page title and public footer.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Studio name"
                hint="Used on the public invitation and in the admin header."
                required
                className="sm:col-span-2"
              >
                <Input
                  value={form.site_name}
                  onChange={(event) => setForm((current) => ({ ...current, site_name: event.target.value }))}
                  placeholder="Ever After Studio"
                  maxLength={120}
                  disabled={!canEdit}
                />
              </Field>
            </div>

            <div className="mt-5 rounded-xl border border-ink/10 bg-paper/60 p-4">
              <p className="text-[0.55rem] uppercase tracking-[0.18em] text-ink/35">A small preview</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-wine font-script text-xl text-cream">
                  {(form.site_name.trim()[0] ?? 'E').toUpperCase()}
                </span>
                <div>
                  <p className="font-display text-2xl leading-tight text-ink">{form.site_name.trim() || 'Ever After Studio'}</p>
                  <p className="text-[0.58rem] uppercase tracking-[0.22em] text-ink/35">Invitation atelier</p>
                </div>
              </div>
            </div>
          </section>

          <section className="admin-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-2xl leading-none">Motion</h2>
                <p className="mt-1 text-xs text-ink/40">A studio-wide switch for entrance animations.</p>
              </div>
            </div>

            <div className="rounded-xl border border-ink/10 bg-paper/60 p-4">
              <Switch
                checked={form.animations_enabled}
                onChange={(value) => setForm((current) => ({ ...current, animations_enabled: value }))}
                label="Enable entrance animations"
                hint="When off, every invitation renders its final state immediately. Guest reduced-motion preferences are still respected."
                disabled={!canEdit}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className={cn('rounded-xl border p-4', form.animations_enabled ? 'border-[#4f7a58]/25 bg-[#4f7a58]/[0.06]' : 'border-ink/10 bg-paper/40')}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">Motion on</p>
                  {form.animations_enabled ? <Check className="h-4 w-4 text-[#3f6b4b]" /> : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink/45">
                  Sections fade, rise and settle as guests scroll. The envelope sequence plays in full.
                </p>
              </div>
              <div className={cn('rounded-xl border p-4', !form.animations_enabled ? 'border-[#4f7a58]/25 bg-[#4f7a58]/[0.06]' : 'border-ink/10 bg-paper/40')}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">Motion off</p>
                  {!form.animations_enabled ? <Check className="h-4 w-4 text-[#3f6b4b]" /> : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink/45">
                  A calm, immediate read. Useful for accessibility reviews or a quieter guest experience.
                </p>
              </div>
            </div>
          </section>

          {!canEdit ? (
            <p className="rounded-xl border border-gold/25 bg-gold/[0.08] px-4 py-3 text-xs leading-relaxed text-ink/55">
              Only studio administrators can change these settings. You can still review them here.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-[#9b3434]/25 bg-[#9b3434]/10 px-4 py-3 text-xs text-[#8c2d2d]">{error}</p>
          ) : null}

          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-cream/95 px-4 py-3 shadow-lift backdrop-blur">
            <p className="text-xs text-ink/40">
              {settingsQuery.data ? `Site name · ${settingsQuery.data.site_name}` : 'Loading settings'}
            </p>
            <Button
              type="button"
              onClick={() => save.mutate()}
              isLoading={save.isPending}
              disabled={!canEdit || !form.site_name.trim()}
              icon={<Save className="h-3.5 w-3.5" />}
            >
              Save settings
            </Button>
          </div>
        </div>

        <aside className="space-y-5 xl:col-span-4">
          <section className="admin-card p-5">
            <SectionHeading eyebrow="Your account" title="Signed in as" />
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-wine font-display text-lg text-cream">
                {(user?.name?.[0] ?? 'A').toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-xl leading-tight text-ink">{user?.name ?? 'Studio admin'}</p>
                <p className="truncate text-xs text-ink/40">{user?.email}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2.5 border-t border-ink/[0.07] pt-4 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-ink/40">
                  <ShieldCheck className="h-3.5 w-3.5" /> Role
                </dt>
                <dd>
                  <Badge tone={user?.role === 'admin' ? 'wine' : 'neutral'}>{user?.role ?? 'editor'}</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-ink/40">
                  <AtSign className="h-3.5 w-3.5" /> Email
                </dt>
                <dd className="max-w-[12rem] truncate text-ink/65">{user?.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-ink/40">
                  <UserRound className="h-3.5 w-3.5" /> Member since
                </dt>
                <dd className="text-ink/65">{user?.created_at ? formatDateTime(user.created_at) : '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-gold/20 bg-gold/[0.06] p-5">
            <p className="inline-flex items-center gap-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">
              <Server className="h-3.5 w-3.5" /> Studio plumbing
            </p>
            <dl className="mt-3 space-y-2 text-[0.68rem] leading-relaxed">
              <div>
                <dt className="text-ink/35">API endpoint</dt>
                <dd className="break-all font-mono text-[0.62rem] text-ink/60">{API_URL}</dd>
              </div>
              <div>
                <dt className="text-ink/35">Admin creation</dt>
                <dd className="font-mono text-[0.62rem] text-ink/60">php artisan app:create-admin</dd>
              </div>
            </dl>
            <p className="mt-3 text-[0.62rem] leading-relaxed text-ink/45">
              Sessions use a bearer token held in this browser tab. Signing out revokes it immediately.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
