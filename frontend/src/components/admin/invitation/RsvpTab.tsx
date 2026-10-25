import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ExternalLink, LockKeyhole, Mail, Plus, Save, Trash2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, getApiErrorMessage } from '@/lib/api'
import { slugify, utcToZonedInput, zonedInputToUtcIso } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { StatCard } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import type { Invitation, RsvpQuestion, RsvpSettings } from '@/types'

interface RsvpTabProps {
  invitation: Invitation
}

interface RsvpForm {
  enabled: boolean
  deadline: string
  max_guests_per_submission: number
  allow_decline: boolean
  require_guest_code: boolean
  collect_phone: boolean
  success_message: string
  questions: RsvpQuestion[]
}

function initialForm(invitation: Invitation): RsvpForm {
  const settings = invitation.rsvp_settings ?? ({} as RsvpSettings)
  return {
    enabled: settings.enabled ?? true,
    deadline: settings.deadline ? utcToZonedInput(settings.deadline, invitation.timezone) : '',
    max_guests_per_submission: settings.max_guests_per_submission ?? 6,
    allow_decline: settings.allow_decline ?? true,
    require_guest_code: settings.require_guest_code ?? false,
    collect_phone: settings.collect_phone ?? true,
    success_message: settings.success_message ?? '',
    questions: Array.isArray(settings.questions) ? settings.questions : [],
  }
}

export function RsvpTab({ invitation }: RsvpTabProps) {
  const [form, setForm] = useState<RsvpForm>(() => initialForm(invitation))
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    setForm(initialForm(invitation))
  }, [invitation.id, invitation.updated_at])

  const update = <K extends keyof RsvpForm>(key: K, value: RsvpForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const setQuestion = (index: number, patch: Partial<RsvpQuestion>) =>
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, itemIndex) =>
        itemIndex === index ? { ...question, ...patch } : question,
      ),
    }))

  const addQuestion = () =>
    setForm((current) => ({
      ...current,
      questions: [
        ...current.questions,
        { id: `question-${current.questions.length + 1}`, label: '', type: 'text', required: false, options: [] },
      ],
    }))

  const save = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/invitations/${invitation.id}`, {
        rsvp_settings: {
          enabled: form.enabled,
          deadline: form.deadline ? zonedInputToUtcIso(form.deadline, invitation.timezone) : null,
          max_guests_per_submission: form.max_guests_per_submission,
          allow_decline: form.allow_decline,
          require_guest_code: form.require_guest_code,
          collect_phone: form.collect_phone,
          success_message: form.success_message || null,
          questions: form.questions.map((question) => ({
            ...question,
            id: slugify(question.id || question.label) || `question-${Math.random().toString(36).slice(2, 7)}`,
            options: question.type === 'select' ? question.options : [],
          })),
        },
      })
      return data.data as Invitation
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['invitation', invitation.id], updated)
      queryClient.invalidateQueries({ queryKey: ['invitation', invitation.id] })
      toast({ title: 'RSVP settings saved', tone: 'success' })
    },
    onError: (error) => {
      toast({ title: 'Could not save the RSVP settings', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const stats = invitation.stats

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Responses" value={stats?.rsvps_count ?? 0} icon={<Mail className="h-4 w-4" />} hint="Replies received" />
        <StatCard
          label="Attending"
          value={stats?.confirmed_guests ?? 0}
          icon={<Users className="h-4 w-4" />}
          hint="Confirmed seats"
        />
        <StatCard
          label="Guest list"
          value={stats?.guests_count ?? 0}
          icon={<LockKeyhole className="h-4 w-4" />}
          hint="Personal invitation codes"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <section className="admin-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                <Mail className="h-3.5 w-3.5" />
              </span>
              <div>
                <h2 className="font-display text-2xl leading-none">The reply experience</h2>
                <p className="mt-1 text-xs text-ink/40">What guests can share, and when the form closes.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-ink/10 bg-paper/60 p-4">
                <Switch
                  checked={form.enabled}
                  onChange={(value) => update('enabled', value)}
                  label="Accept RSVPs"
                  hint="Turn this off to keep the section visible but closed."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Reply deadline" hint="Local time in the invitation timezone. Leave blank for no deadline.">
                  <Input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(event) => update('deadline', event.target.value)}
                  />
                </Field>
                <Field label="Maximum guests per reply" hint="1–50, including the guest themselves.">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={form.max_guests_per_submission}
                    onChange={(event) => update('max_guests_per_submission', Number(event.target.value))}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-ink/10 bg-paper/60 p-4">
                  <Switch
                    checked={form.allow_decline}
                    onChange={(value) => update('allow_decline', value)}
                    label="Allow declines"
                    hint="Guests can send love from afar."
                  />
                </div>
                <div className="rounded-xl border border-ink/10 bg-paper/60 p-4">
                  <Switch
                    checked={form.collect_phone}
                    onChange={(value) => update('collect_phone', value)}
                    label="Ask for a phone number"
                    hint="Helpful for day-of coordination."
                  />
                </div>
                <div className="rounded-xl border border-ink/10 bg-paper/60 p-4 sm:col-span-2">
                  <Switch
                    checked={form.require_guest_code}
                    onChange={(value) => update('require_guest_code', value)}
                    label="Require a personal guest code"
                    hint="Only guests on your list can reply. Codes are managed in the Guests tab."
                  />
                </div>
              </div>

              <Field label="Success message" hint="Shown after a reply is received.">
                <Textarea
                  rows={3}
                  value={form.success_message}
                  onChange={(event) => update('success_message', event.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="admin-card p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl leading-none">Extra questions</h2>
                <p className="mt-1 text-xs text-ink/40">Meal choices, song requests, dietary notes — anything you need.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion} icon={<Plus className="h-3.5 w-3.5" />}>
                Add question
              </Button>
            </div>

            {form.questions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink/15 bg-cream/40 px-4 py-8 text-center text-xs text-ink/40">
                No extra questions yet. The form will ask for a name, email and attendance.
              </p>
            ) : (
              <div className="space-y-3">
                {form.questions.map((question, index) => (
                  <div key={index} className="rounded-xl border border-ink/10 bg-paper/40 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink/40">Question {index + 1}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            questions: current.questions.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                        className="btn-icon hover:text-[#9b3434]"
                        aria-label="Remove question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Question" className="sm:col-span-2">
                        <Input value={question.label} onChange={(event) => setQuestion(index, { label: event.target.value })} />
                      </Field>
                      <Field label="Answer type">
                        <Select
                          value={question.type}
                          onChange={(event) => setQuestion(index, { type: event.target.value as RsvpQuestion['type'] })}
                        >
                          <option value="text">Short text</option>
                          <option value="textarea">Long text</option>
                          <option value="select">Multiple choice</option>
                        </Select>
                      </Field>
                      <Field label="Question key" hint="A short internal identifier.">
                        <Input
                          value={question.id}
                          onChange={(event) => setQuestion(index, { id: slugify(event.target.value) })}
                        />
                      </Field>
                      {question.type === 'select' ? (
                        <Field label="Options" hint="Separate each option with a comma." className="sm:col-span-2">
                          <Input
                            value={question.options.join(', ')}
                            onChange={(event) =>
                              setQuestion(index, {
                                options: event.target.value
                                  .split(',')
                                  .map((option) => option.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                        </Field>
                      ) : null}
                      <div className="flex items-center sm:col-span-2">
                        <Switch
                          checked={question.required}
                          onChange={(value) => setQuestion(index, { required: value })}
                          label="Required"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-cream/95 px-4 py-3 shadow-lift backdrop-blur">
            <p className="text-xs text-ink/40">
              {invitation.rsvp_open ? (
                <span className="inline-flex items-center gap-1.5 text-[#3f6b4b]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Currently open for replies
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[#836426]">
                  <LockKeyhole className="h-3.5 w-3.5" /> Replies are currently closed
                </span>
              )}
            </p>
            <Button type="button" onClick={() => save.mutate()} isLoading={save.isPending} icon={<Save className="h-3.5 w-3.5" />}>
              Save RSVP settings
            </Button>
          </div>
        </div>

        <aside className="xl:col-span-4">
          <div className="sticky top-24 space-y-4">
            <section className="admin-card p-5">
              <h2 className="font-display text-2xl leading-none">The replies so far</h2>
              <p className="mt-1 text-xs text-ink/40">A snapshot for this invitation only.</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-ink/[0.07] pb-2 text-sm">
                  <span className="text-ink/50">Total responses</span>
                  <span className="font-display text-xl">{stats?.rsvps_count ?? 0}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-ink/[0.07] pb-2 text-sm">
                  <span className="text-ink/50">Attending replies</span>
                  <span className="font-display text-xl">{stats?.attending_count ?? 0}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink/50">Confirmed guests</span>
                  <span className="font-display text-xl">{stats?.confirmed_guests ?? 0}</span>
                </div>
              </div>
              <Link to={`/admin/rsvps?invitation_id=${invitation.id}`} className="btn-outline mt-5 w-full">
                Open the reply desk <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </section>

            <section className="rounded-2xl border border-gold/20 bg-gold/[0.06] p-5">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-ink/45">Good to know</p>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-ink/50">
                <li>Deadlines use the invitation timezone, currently {invitation.timezone.replace('_', ' ')}.</li>
                <li>Guest codes create personal links such as <code className="text-ink/70">?guest=CODE</code>.</li>
                <li>Answers are stored with each reply and included in the CSV export.</li>
              </ul>
            </section>
          </div>
        </aside>
      </div>
    </div>
  )
}
