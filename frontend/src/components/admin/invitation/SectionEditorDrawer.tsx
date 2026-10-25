import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Plus, Save, Trash2 } from 'lucide-react'
import { api, getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { SECTION_LABEL, SECTION_LIBRARY } from '@/lib/constants'
import { mediaAssetMap, resolveMediaRef } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { GalleryField, ImageField } from '@/components/media/ImageField'
import type {
  AnimationConfig,
  AnimationPreset,
  ContactEntry,
  GalleryImage,
  HotelEntry,
  Invitation,
  InvitationSection,
  LinkEntry,
  PartyMember,
  SectionContent,
  TimelineEntry,
} from '@/types'

interface SectionEditorDrawerProps {
  open: boolean
  onClose: () => void
  invitation: Invitation
  section: InvitationSection | null
  draftType: string | null
  presets: AnimationPreset[]
}

interface FormState {
  title: string
  content: SectionContent
  presetId: number | null
  animation: AnimationConfig
  isVisible: boolean
}

function initialState(section: InvitationSection | null, draftType: string | null): FormState {
  if (section) {
    return {
      title: section.title ?? '',
      content: { ...section.content },
      presetId: section.animation_preset_id,
      animation: section.animation_config ?? {},
      isVisible: section.is_visible,
    }
  }
  const library = SECTION_LIBRARY.find((item) => item.type === draftType)
  return {
    title: library?.label ?? 'Section',
    content: { ...(library?.content ?? {}) },
    presetId: null,
    animation: {},
    isVisible: true,
  }
}

const alignOptions = [
  { value: 'center', label: 'Centred' },
  { value: 'left', label: 'Left aligned' },
]

const textField = (
  label: string,
  value: string | undefined,
  onChange: (value: string) => void,
  options?: { placeholder?: string; hint?: string; className?: string; rows?: number },
) => (
  <Field label={label} hint={options?.hint} className={options?.className}>
    {options?.rows ? (
      <Textarea
        rows={options.rows}
        className={options.rows > 4 ? 'min-h-40' : undefined}
        value={value ?? ''}
        placeholder={options?.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    ) : (
      <Input value={value ?? ''} placeholder={options?.placeholder} onChange={(event) => onChange(event.target.value)} />
    )}
  </Field>
)

export function SectionEditorDrawer({ open, onClose, invitation, section, draftType, presets }: SectionEditorDrawerProps) {
  const [form, setForm] = useState<FormState>(() => initialState(section, draftType))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const mediaMap = useMemo(() => mediaAssetMap(invitation.media_assets), [invitation.media_assets])

  useEffect(() => {
    if (!open) return
    setForm(initialState(section, draftType))
    setErrors({})
  }, [open, section, draftType])

  const type = section?.type ?? draftType ?? 'text'
  const content = form.content

  const set = <K extends keyof SectionContent>(key: K, value: SectionContent[K]) =>
    setForm((current) => ({ ...current, content: { ...current.content, [key]: value } }))

  const setList = <T,>(key: keyof SectionContent, list: T[]) =>
    setForm((current) => ({ ...current, content: { ...current.content, [key]: list } }))

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type,
        title: form.title || null,
        content: form.content,
        animation_preset_id: form.presetId,
        animation_config: form.animation,
        is_visible: form.isVisible,
      }
      if (section) {
        const { data } = await api.put(`/invitations/${invitation.id}/sections/${section.id}`, payload)
        return data.data as InvitationSection
      }
      const { data } = await api.post(`/invitations/${invitation.id}/sections`, payload)
      return data.data as InvitationSection
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitation', invitation.id] })
      toast({
        title: section ? 'Section saved' : 'Section added',
        description: section ? 'Your changes are ready to preview.' : 'It is waiting at the end of your story.',
        tone: 'success',
      })
      onClose()
    },
    onError: (error) => {
      setErrors(getApiFieldErrors(error))
      toast({ title: 'Could not save the section', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const image = resolveMediaRef(mediaMap, content.image)
  const background = resolveMediaRef(mediaMap, content.background)
  const gallery = Array.isArray(content.images)
    ? content.images.map((item) => ({ ...item, ...(resolveMediaRef(mediaMap, item) ?? {}) }))
    : []
  const timeline = Array.isArray(content.timeline) ? content.timeline : []
  const members = Array.isArray(content.members) ? content.members : []
  const links = Array.isArray(content.links) ? content.links : []
  const hotels = Array.isArray(content.hotels) ? content.hotels : []
  const contacts = Array.isArray(content.contacts) ? content.contacts : []

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="xl"
      title={section ? `Edit ${SECTION_LABEL[type] ?? type}` : `Add ${SECTION_LABEL[type] ?? 'section'}`}
      description="Write the content, choose the imagery and give the section its own movement."
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={form.isVisible}
              onChange={(value) => setForm((current) => ({ ...current, isVisible: value }))}
              label="Visible"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => mutation.mutate()}
              isLoading={mutation.isPending}
              icon={<Save className="h-3.5 w-3.5" />}
            >
              {section ? 'Save section' : 'Add section'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Internal title" hint="Only shown in the section builder.">
            <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </Field>
          <Field label="Animation preset">
            <Select
              value={form.presetId ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, presetId: event.target.value ? Number(event.target.value) : null }))
              }
            >
              <option value="">Inherit from the invitation</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </Select>
          </Field>
        </section>

        {type === 'hero' ? (
          <section className="space-y-4">
            <h3 className="admin-label !mb-0">Hero content</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {textField('Eyebrow', content.eyebrow, (value) => set('eyebrow', value), {
                placeholder: 'Together with their families',
              })}
              {textField('Names heading', content.heading, (value) => set('heading', value), {
                placeholder: 'Leave blank to use the couple names',
              })}
              {textField('Subheading', content.subheading, (value) => set('subheading', value), {
                className: 'sm:col-span-2',
                placeholder: 'invite you to celebrate their wedding',
              })}
              {textField('Date label', content.date_label, (value) => set('date_label', value), {
                hint: 'Leave blank to use the wedding date.',
              })}
              <Field label="Overlay darkness" hint="0.1 light · 0.8 dramatic">
                <Input
                  type="number"
                  step={0.05}
                  min={0.1}
                  max={0.85}
                  value={content.overlay_opacity ?? 0.4}
                  onChange={(event) => set('overlay_opacity', Number(event.target.value))}
                />
              </Field>
              <ImageField
                label="Background image"
                aspect="wide"
                value={background}
                onChange={(value) => set('background', value ?? undefined)}
              />
              <div className="rounded-xl border border-ink/10 bg-paper/60 p-4">
                <Switch
                  checked={content.show_countdown !== false}
                  onChange={(value) => set('show_countdown', value)}
                  label="Show countdown"
                  hint="A compact countdown sits beneath the date."
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                {textField('Button label', content.primary_cta?.label, (value) =>
                  set('primary_cta', { ...(content.primary_cta ?? {}), label: value }),
                )}
                {textField('Button link', content.primary_cta?.href, (value) =>
                  set('primary_cta', { ...(content.primary_cta ?? {}), href: value }),
                )}
              </div>
            </div>
          </section>
        ) : null}

        {type === 'story' ? (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {textField('Eyebrow', content.eyebrow, (value) => set('eyebrow', value))}
              {textField('Heading', content.heading, (value) => set('heading', value))}
              {textField('Intro', content.intro, (value) => set('intro', value), { className: 'sm:col-span-2', rows: 2 })}
              {textField('The story', content.body, (value) => set('body', value), {
                className: 'sm:col-span-2',
                rows: 8,
                hint: 'Separate paragraphs with a blank line.',
              })}
              {textField('Signature', content.signature, (value) => set('signature', value))}
              <Field label="Image position">
                <Select value={content.image_position ?? 'left'} onChange={(event) => set('image_position', event.target.value as 'left' | 'right')}>
                  <option value="left">Image on the left</option>
                  <option value="right">Image on the right</option>
                </Select>
              </Field>
              <ImageField label="Story portrait" aspect="portrait" value={image} onChange={(value) => set('image', value ?? undefined)} />
            </div>

            <div className="rounded-xl border border-ink/10 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="admin-label !mb-0">Timeline</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setList<TimelineEntry>('timeline', [...timeline, { date: '', title: '', text: '' }])}
                  icon={<Plus className="h-3 w-3" />}
                >
                  Add moment
                </Button>
              </div>
              <div className="space-y-3">
                {timeline.map((entry, index) => (
                  <div key={index} className="rounded-lg border border-ink/[0.07] bg-paper/40 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink/40">Moment {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => setList<TimelineEntry>('timeline', timeline.filter((_, i) => i !== index))}
                        className="text-ink/30 transition hover:text-[#9b3434]"
                        aria-label="Remove moment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        placeholder="Date"
                        value={entry.date ?? ''}
                        onChange={(event) =>
                          setList<TimelineEntry>(
                            'timeline',
                            timeline.map((item, i) => (i === index ? { ...item, date: event.target.value } : item)),
                          )
                        }
                      />
                      <Input
                        placeholder="Title"
                        value={entry.title ?? ''}
                        onChange={(event) =>
                          setList<TimelineEntry>(
                            'timeline',
                            timeline.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)),
                          )
                        }
                      />
                      <Input
                        placeholder="A short line"
                        value={entry.text ?? ''}
                        onChange={(event) =>
                          setList<TimelineEntry>(
                            'timeline',
                            timeline.map((item, i) => (i === index ? { ...item, text: event.target.value } : item)),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {type === 'quote' ? (
          <section className="space-y-4">
            {textField('Quote', content.quote, (value) => set('quote', value), {
              rows: 4,
              className: 'sm:col-span-2',
              hint: 'Leave blank to use the couple quote from Overview.',
            })}
            {textField('Attribution', content.attribution, (value) => set('attribution', value))}
          </section>
        ) : null}

        {['events', 'countdown', 'rsvp', 'gifts', 'travel', 'video', 'contact', 'wedding_party', 'gallery'].includes(type) ? (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {textField('Eyebrow', content.eyebrow, (value) => set('eyebrow', value))}
              {textField('Heading', content.heading, (value) => set('heading', value))}
              {textField('Intro', content.intro, (value) => set('intro', value), { className: 'sm:col-span-2', rows: 2 })}
            </div>
          </section>
        ) : null}

        {type === 'events' ? (
          <section className="space-y-4">
            {textField('Closing note', content.note, (value) => set('note', value), {
              rows: 2,
              hint: 'Events themselves are managed in the Events tab.',
            })}
          </section>
        ) : null}

        {type === 'countdown' ? (
          <section className="space-y-4">
            {textField('Completed message', content.completed_message, (value) => set('completed_message', value), {
              rows: 3,
              hint: 'Shown once the wedding moment has passed.',
            })}
          </section>
        ) : null}

        {type === 'gallery' ? (
          <section className="space-y-4">
            <Field label="Layout">
              <Select value={content.layout ?? 'masonry'} onChange={(event) => set('layout', event.target.value as 'masonry' | 'grid')}>
                <option value="masonry">Masonry</option>
                <option value="grid">Grid</option>
              </Select>
            </Field>
            <GalleryField
              label="Photographs"
              images={gallery as GalleryImage[]}
              onChange={(images) => set('images', images)}
              hint="Captions appear on hover in the masonry layout."
            />
          </section>
        ) : null}

        {type === 'venue' ? (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {textField('Venue name', content.name, (value) => set('name', value), {
                hint: 'Leave blank to use the venue from Overview.',
              })}
              {textField('Address', content.address, (value) => set('address', value))}
              {textField('Google Maps URL', content.map_url, (value) => set('map_url', value))}
              {textField('Map embed', content.map_embed, (value) => set('map_embed', value), {
                hint: 'Paste an iframe embed or a direct map URL.',
              })}
              {textField('Notes', content.notes, (value) => set('notes', value), { className: 'sm:col-span-2', rows: 3 })}
              <ImageField label="Venue photograph" aspect="wide" value={image} onChange={(value) => set('image', value ?? undefined)} />
            </div>
          </section>
        ) : null}

        {type === 'rsvp' ? (
          <section className="space-y-4">
            {textField('Closing note', content.note, (value) => set('note', value), { rows: 2 })}
            {textField('Success message', content.success_message, (value) => set('success_message', value), {
              rows: 3,
              hint: 'Shown after a guest sends their reply. The RSVP settings live in the RSVP tab.',
            })}
          </section>
        ) : null}

        {type === 'text' ? (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {textField('Eyebrow', content.eyebrow, (value) => set('eyebrow', value))}
              {textField('Heading', content.heading, (value) => set('heading', value))}
              {textField('Intro', content.intro, (value) => set('intro', value), { className: 'sm:col-span-2', rows: 2 })}
              {textField('Body', content.body, (value) => set('body', value), { className: 'sm:col-span-2', rows: 7 })}
              <Field label="Alignment">
                <Select value={content.align ?? 'center'} onChange={(event) => set('align', event.target.value as 'center' | 'left')}>
                  {alignOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                {textField('Button label', content.cta?.label, (value) => set('cta', { ...(content.cta ?? {}), label: value }))}
                {textField('Button link', content.cta?.href, (value) => set('cta', { ...(content.cta ?? {}), href: value }))}
              </div>
            </div>
          </section>
        ) : null}

        {type === 'image_text' ? (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {textField('Eyebrow', content.eyebrow, (value) => set('eyebrow', value))}
              {textField('Heading', content.heading, (value) => set('heading', value))}
              {textField('Intro', content.intro, (value) => set('intro', value), { className: 'sm:col-span-2', rows: 2 })}
              {textField('Body', content.body, (value) => set('body', value), { className: 'sm:col-span-2', rows: 6 })}
              <Field label="Image position">
                <Select value={content.image_position ?? 'left'} onChange={(event) => set('image_position', event.target.value as 'left' | 'right')}>
                  <option value="left">Image on the left</option>
                  <option value="right">Image on the right</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                {textField('Button label', content.cta?.label, (value) => set('cta', { ...(content.cta ?? {}), label: value }))}
                {textField('Button link', content.cta?.href, (value) => set('cta', { ...(content.cta ?? {}), href: value }))}
              </div>
              <ImageField label="Photograph" aspect="portrait" value={image} onChange={(value) => set('image', value ?? undefined)} />
            </div>
          </section>
        ) : null}

        {type === 'wedding_party' ? (
          <section className="space-y-4">
            <div className="rounded-xl border border-ink/10 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="admin-label !mb-0">The people</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setList<PartyMember>('members', [...members, { name: '', role: '', bio: '' }])}
                  icon={<Plus className="h-3 w-3" />}
                >
                  Add person
                </Button>
              </div>
              <div className="space-y-3">
                {members.map((member, index) => (
                  <div key={index} className="rounded-lg border border-ink/[0.07] bg-paper/40 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink/40">Person {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => setList<PartyMember>('members', members.filter((_, i) => i !== index))}
                        className="text-ink/30 transition hover:text-[#9b3434]"
                        aria-label="Remove person"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Name"
                        value={member.name}
                        onChange={(event) =>
                          setList<PartyMember>(
                            'members',
                            members.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)),
                          )
                        }
                      />
                      <Input
                        placeholder="Role"
                        value={member.role ?? ''}
                        onChange={(event) =>
                          setList<PartyMember>(
                            'members',
                            members.map((item, i) => (i === index ? { ...item, role: event.target.value } : item)),
                          )
                        }
                      />
                      <Textarea
                        className="min-h-20 sm:col-span-2"
                        placeholder="A short introduction"
                        value={member.bio ?? ''}
                        onChange={(event) =>
                          setList<PartyMember>(
                            'members',
                            members.map((item, i) => (i === index ? { ...item, bio: event.target.value } : item)),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {type === 'gifts' ? (
          <section className="space-y-4">
            {textField('Body', content.body, (value) => set('body', value), { rows: 5 })}
            {textField('Note', content.note, (value) => set('note', value), { rows: 2 })}
            <div className="rounded-xl border border-ink/10 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="admin-label !mb-0">Registry links</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setList<LinkEntry>('links', [...links, { label: '', url: '' }])}
                  icon={<Plus className="h-3 w-3" />}
                >
                  Add link
                </Button>
              </div>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Input
                      placeholder="Label"
                      value={link.label}
                      onChange={(event) =>
                        setList<LinkEntry>(
                          'links',
                          links.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)),
                        )
                      }
                    />
                    <Input
                      placeholder="https://"
                      value={link.url}
                      onChange={(event) =>
                        setList<LinkEntry>(
                          'links',
                          links.map((item, i) => (i === index ? { ...item, url: event.target.value } : item)),
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setList<LinkEntry>('links', links.filter((_, i) => i !== index))}
                      className="btn-icon shrink-0"
                      aria-label="Remove link"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {type === 'travel' ? (
          <section className="space-y-4">
            {textField('Body', content.body, (value) => set('body', value), { rows: 4 })}
            {textField('Note', content.note, (value) => set('note', value), { rows: 2 })}
            <div className="rounded-xl border border-ink/10 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="admin-label !mb-0">Where to stay</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setList<HotelEntry>('hotels', [...hotels, { name: '', description: '', address: '', url: '' }])}
                  icon={<Plus className="h-3 w-3" />}
                >
                  Add stay
                </Button>
              </div>
              <div className="space-y-3">
                {hotels.map((hotel, index) => (
                  <div key={index} className="rounded-lg border border-ink/[0.07] bg-paper/40 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink/40">Stay {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => setList<HotelEntry>('hotels', hotels.filter((_, i) => i !== index))}
                        className="text-ink/30 transition hover:text-[#9b3434]"
                        aria-label="Remove stay"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Hotel name"
                        value={hotel.name}
                        onChange={(event) =>
                          setList<HotelEntry>(
                            'hotels',
                            hotels.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)),
                          )
                        }
                      />
                      <Input
                        placeholder="Address"
                        value={hotel.address ?? ''}
                        onChange={(event) =>
                          setList<HotelEntry>(
                            'hotels',
                            hotels.map((item, i) => (i === index ? { ...item, address: event.target.value } : item)),
                          )
                        }
                      />
                      <Input
                        placeholder="https://"
                        value={hotel.url ?? ''}
                        onChange={(event) =>
                          setList<HotelEntry>(
                            'hotels',
                            hotels.map((item, i) => (i === index ? { ...item, url: event.target.value } : item)),
                          )
                        }
                      />
                      <Input
                        placeholder="A short note"
                        value={hotel.description ?? ''}
                        onChange={(event) =>
                          setList<HotelEntry>(
                            'hotels',
                            hotels.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {type === 'video' ? (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Provider">
                <Select value={content.provider ?? 'youtube'} onChange={(event) => set('provider', event.target.value as 'youtube' | 'vimeo')}>
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                </Select>
              </Field>
              {textField('Video URL', content.video_url, (value) => set('video_url', value), { placeholder: 'https://youtube.com/watch?v=…' })}
              {textField('Caption', content.caption, (value) => set('caption', value), { className: 'sm:col-span-2' })}
            </div>
          </section>
        ) : null}

        {type === 'contact' ? (
          <section className="space-y-4">
            <div className="rounded-xl border border-ink/10 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="admin-label !mb-0">Contacts</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setList<ContactEntry>('contacts', [...contacts, { name: '', role: '', phone: '', email: '' }])}
                  icon={<Plus className="h-3 w-3" />}
                >
                  Add contact
                </Button>
              </div>
              <div className="space-y-3">
                {contacts.map((contact, index) => (
                  <div key={index} className="rounded-lg border border-ink/[0.07] bg-paper/40 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink/40">Contact {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => setList<ContactEntry>('contacts', contacts.filter((_, i) => i !== index))}
                        className="text-ink/30 transition hover:text-[#9b3434]"
                        aria-label="Remove contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          ['name', 'Name'],
                          ['role', 'Role'],
                          ['phone', 'Phone'],
                          ['email', 'Email'],
                        ] as const
                      ).map(([key, placeholder]) => (
                        <Input
                          key={key}
                          placeholder={placeholder}
                          value={contact[key] ?? ''}
                          onChange={(event) =>
                            setList<ContactEntry>(
                              'contacts',
                              contacts.map((item, i) => (i === index ? { ...item, [key]: event.target.value } : item)),
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {type === 'divider' ? (
          <div className="rounded-xl border border-dashed border-ink/15 bg-paper/50 p-8 text-center">
            <ImagePlus className="mx-auto h-5 w-5 text-ink/25" />
            <p className="mt-2 text-sm text-ink/50">A quiet ornamental pause. No content required.</p>
          </div>
        ) : null}

        <section className="rounded-xl border border-ink/10 p-4">
          <h3 className="admin-label">Section motion overrides</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Duration">
              <Input
                type="number"
                step={0.1}
                min={0.1}
                max={10}
                value={form.animation.duration ?? 0.8}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    animation: { ...current.animation, duration: Number(event.target.value) },
                  }))
                }
              />
            </Field>
            <Field label="Delay">
              <Input
                type="number"
                step={0.05}
                min={0}
                max={5}
                value={form.animation.delay ?? 0.05}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    animation: { ...current.animation, delay: Number(event.target.value) },
                  }))
                }
              />
            </Field>
            <Field label="Easing">
              <Select
                value={String(form.animation.easing ?? 'easeOut')}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    animation: { ...current.animation, easing: event.target.value as AnimationConfig['easing'] },
                  }))
                }
              >
                <option value="easeOut">Ease out</option>
                <option value="easeIn">Ease in</option>
                <option value="easeInOut">Ease in out</option>
                <option value="linear">Linear</option>
                <option value="spring">Spring</option>
              </Select>
            </Field>
          </div>
          {errors.content ? <p className={cn('mt-2 text-xs text-[#9b3434]')}>{errors.content}</p> : null}
        </section>
      </div>
    </Drawer>
  )
}
