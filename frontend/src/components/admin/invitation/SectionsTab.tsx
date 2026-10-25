import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  LayoutList,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { SECTION_LABEL, SECTION_LIBRARY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Badge, EmptyState } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { SectionEditorDrawer } from '@/components/admin/invitation/SectionEditorDrawer'
import type { AnimationPreset, Invitation, InvitationSection } from '@/types'

interface SectionsTabProps {
  invitation: Invitation
  presets: AnimationPreset[]
}

const CATEGORY_ORDER = ['Story', 'Celebration', 'Guests', 'Design'] as const

function SortableSection({
  section,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
  busy,
}: {
  section: InvitationSection
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggle: () => void
  busy: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-3 rounded-xl border bg-cream/80 p-3 transition',
        isDragging ? 'z-20 border-gold shadow-lift' : 'border-ink/10 hover:border-ink/20',
        !section.is_visible && 'opacity-60',
      )}
    >
      <button
        type="button"
        className="btn-icon cursor-grab touch-none active:cursor-grabbing"
        aria-label={`Reorder ${SECTION_LABEL[section.type] ?? section.type}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 font-display text-lg text-wine">
        {(SECTION_LABEL[section.type] ?? section.type).slice(0, 1)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-display text-lg leading-tight text-ink">
            {section.title || SECTION_LABEL[section.type] || section.type}
          </p>
          {!section.is_visible ? <Badge tone="amber">Hidden</Badge> : null}
          {section.animation_preset ? <Badge tone="gold">{section.animation_preset.name}</Badge> : null}
        </div>
        <p className="mt-0.5 truncate text-[0.62rem] uppercase tracking-[0.14em] text-ink/35">
          {SECTION_LABEL[section.type] ?? section.type}
          {typeof section.content.heading === 'string' && section.content.heading
            ? ` · ${section.content.heading}`
            : ''}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" className="btn-icon" onClick={onToggle} aria-label={section.is_visible ? 'Hide section' : 'Show section'} disabled={busy}>
          {section.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button type="button" className="btn-icon" onClick={onEdit} aria-label="Edit section">
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" className="btn-icon" onClick={onDuplicate} aria-label="Duplicate section">
          <Copy className="h-4 w-4" />
        </button>
        <button type="button" className="btn-icon hover:text-[#9b3434]" onClick={onDelete} aria-label="Delete section">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function SectionsTab({ invitation, presets }: SectionsTabProps) {
  const [sections, setSections] = useState<InvitationSection[]>(() =>
    [...invitation.sections].sort((a, b) => a.sort_order - b.sort_order),
  )
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [editing, setEditing] = useState<InvitationSection | null>(null)
  const [draftType, setDraftType] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<InvitationSection | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    setSections([...invitation.sections].sort((a, b) => a.sort_order - b.sort_order))
  }, [invitation.sections, invitation.updated_at])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invitation', invitation.id] })
    queryClient.invalidateQueries({ queryKey: ['invitations'] })
  }

  const reorder = useMutation({
    mutationFn: async (next: InvitationSection[]) => {
      await api.post(`/invitations/${invitation.id}/sections/reorder`, {
        sections: next.map((section, index) => ({ id: section.id, sort_order: index })),
      })
    },
    onSuccess: () => {
      invalidate()
      toast({ title: 'Section order saved', tone: 'success' })
    },
    onError: (error) => {
      setSections([...invitation.sections].sort((a, b) => a.sort_order - b.sort_order))
      toast({ title: 'Could not save the order', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const action = useMutation({
    mutationFn: async ({ type, section }: { type: 'toggle' | 'duplicate' | 'delete'; section: InvitationSection }) => {
      if (type === 'toggle') {
        await api.patch(`/invitations/${invitation.id}/sections/${section.id}`, { is_visible: !section.is_visible })
      } else if (type === 'duplicate') {
        await api.post(`/invitations/${invitation.id}/sections/${section.id}/duplicate`)
      } else {
        await api.delete(`/invitations/${invitation.id}/sections/${section.id}`)
      }
      return type
    },
    onSuccess: (type) => {
      invalidate()
      setDeleting(null)
      toast({
        title:
          type === 'delete'
            ? 'Section deleted'
            : type === 'duplicate'
              ? 'Section duplicated'
              : 'Section visibility updated',
        tone: 'success',
      })
    },
    onError: (error) => {
      setDeleting(null)
      toast({ title: 'Could not update the section', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((section) => section.id === active.id)
    const newIndex = sections.findIndex((section) => section.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(sections, oldIndex, newIndex)
    setSections(next)
    reorder.mutate(next)
  }

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: SECTION_LIBRARY.filter((item) => item.category === category),
      })),
    [],
  )

  const visibleCount = sections.filter((section) => section.is_visible).length

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl leading-none">The story flow</h2>
          <p className="mt-1 text-xs text-ink/40">
            {sections.length} section{sections.length === 1 ? '' : 's'} · {visibleCount} visible · drag to reorder
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" onClick={() => setLibraryOpen(true)} icon={<Plus className="h-3.5 w-3.5" />}>
            Add section
          </Button>
        </div>
      </div>

      {sections.length === 0 ? (
        <EmptyState
          icon={<LayoutList className="h-5 w-5" />}
          title="A blank page, ready for your story"
          description="Add a hero, tell your story, introduce the celebrations and finish with an RSVP. You can reorder everything later."
          action={
            <Button type="button" onClick={() => setLibraryOpen(true)} icon={<Plus className="h-3.5 w-3.5" />}>
              Add the first section
            </Button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  busy={action.isPending}
                  onEdit={() => setEditing(section)}
                  onDuplicate={() => action.mutate({ type: 'duplicate', section })}
                  onDelete={() => setDeleting(section)}
                  onToggle={() => action.mutate({ type: 'toggle', section })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/[0.06] p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="text-xs leading-relaxed text-ink/50">
          Guests move through the invitation in this order. Hidden sections stay saved but never appear on the public
          site. The hero section works best at the top.
        </p>
      </div>

      <Modal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        title="Add a section"
        description="Every section is optional. Compose the invitation that feels like you."
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
                    onClick={() => {
                      setLibraryOpen(false)
                      setDraftType(item.type)
                    }}
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

      <SectionEditorDrawer
        open={Boolean(editing || draftType)}
        onClose={() => {
          setEditing(null)
          setDraftType(null)
        }}
        invitation={invitation}
        section={editing}
        draftType={draftType}
        presets={presets}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && action.mutate({ type: 'delete', section: deleting })}
        isLoading={action.isPending}
        title="Delete this section?"
        description={`“${deleting?.title || (deleting ? SECTION_LABEL[deleting.type] : 'This section')}” will be removed from the invitation. This cannot be undone.`}
        confirmLabel="Delete section"
      />
    </div>
  )
}
