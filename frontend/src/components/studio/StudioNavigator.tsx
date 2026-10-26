import { useState } from 'react'
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
  LayoutTemplate,
  MailOpen,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { componentFor } from '@/lib/componentRegistry'
import { cloneValue } from '@/lib/design'
import { cn } from '@/lib/utils'
import type { DesignSnapshot, DesignSnapshotSection } from '@/types'

interface StudioNavigatorProps {
  snapshot: DesignSnapshot
  selectedKey: string | null
  invitationTitle: string
  onSelect: (key: string | null) => void
  onFocusElement?: (sectionKey: string, elementKey: string) => void
  onChange: (snapshot: DesignSnapshot, options?: { force?: boolean }) => void
  onOpenLibrary: () => void
}

function SortableSectionRow({
  section,
  selected,
  onSelect,
  onChange,
  onDelete,
}: {
  section: DesignSnapshotSection
  selected: boolean
  onSelect: () => void
  onChange: (section: DesignSnapshotSection) => void
  onDelete: () => void
}) {
  const key = section.studioKey ?? section.type
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: key })
  const component = componentFor(section.type)
  const Icon = component?.icon ?? LayoutTemplate

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-start gap-2 rounded-xl border bg-cream/80 p-2.5 transition',
        isDragging ? 'z-20 border-gold shadow-lift' : 'border-ink/10 hover:border-ink/20',
        selected && 'border-gold bg-gold/[0.08] ring-1 ring-gold/25',
        !section.is_visible && 'opacity-55',
      )}
    >
      <button
        type="button"
        className="btn-icon mt-0.5 cursor-grab touch-none active:cursor-grabbing"
        aria-label={`Reorder ${component?.label ?? section.type}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <button type="button" onClick={onSelect} className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-wine">
        <Icon className="h-3.5 w-3.5" />
      </button>

      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span className="block truncate font-display text-[0.95rem] leading-tight text-ink">
          {section.title || component?.label || section.type}
        </span>
        <span className="mt-0.5 block truncate text-[0.52rem] uppercase tracking-[0.14em] text-ink/35">
          {component?.label ?? section.type}
          {typeof section.content.heading === 'string' && section.content.heading
            ? ` · ${section.content.heading}`
            : ''}
        </span>
      </button>

      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <button
          type="button"
          className="btn-icon"
          onClick={() => onChange({ ...section, is_visible: !section.is_visible })}
          aria-label={section.is_visible ? 'Hide section' : 'Show section'}
        >
          {section.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          className="btn-icon hover:text-[#9b3434]"
          onClick={onDelete}
          aria-label="Delete section"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function StudioNavigator({
  snapshot,
  selectedKey,
  invitationTitle,
  onSelect,
  onFocusElement,
  onChange,
  onOpenLibrary,
}: StudioNavigatorProps) {
  const [deleting, setDeleting] = useState<DesignSnapshotSection | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const sections = [...snapshot.sections].sort((a, b) => a.sort_order - b.sort_order)
  const selectedSection = sections.find((section) => section.studioKey === selectedKey) ?? null
  const component = selectedSection ? componentFor(selectedSection.type) : undefined
  const visibleCount = sections.filter((section) => section.is_visible).length

  const reorder = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((section) => section.studioKey === active.id)
    const newIndex = sections.findIndex((section) => section.studioKey === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
      ...section,
      sort_order: index,
    }))
    onChange({ ...snapshot, sections: next }, { force: true })
  }

  const updateSection = (section: DesignSnapshotSection) => {
    if (!section.studioKey) return
    onChange(
      {
        ...snapshot,
        sections: snapshot.sections.map((item) =>
          item.studioKey === section.studioKey ? section : item,
        ),
      },
      { force: true },
    )
  }

  const duplicateSection = (section: DesignSnapshotSection) => {
    const index = sections.findIndex((item) => item.studioKey === section.studioKey)
    const copy = cloneValue(section)
    copy.studioKey = `section-${section.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    copy.title = `${section.title || componentFor(section.type)?.label || 'Section'} copy`
    const next = [...sections]
    next.splice(index + 1, 0, copy)
    onChange(
      { ...snapshot, sections: next.map((item, itemIndex) => ({ ...item, sort_order: itemIndex })) },
      { force: true },
    )
    onSelect(copy.studioKey ?? null)
  }

  const removeSection = (section: DesignSnapshotSection) => {
    const next = sections.filter((item) => item.studioKey !== section.studioKey)
    onChange(
      { ...snapshot, sections: next.map((item, itemIndex) => ({ ...item, sort_order: itemIndex })) },
      { force: true },
    )
    if (selectedKey === section.studioKey) onSelect(null)
    setDeleting(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f6efe4]">
      <div className="border-b border-ink/10 px-4 py-4">
        <p className="text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-gold">Design studio</p>
        <h2 className="mt-1 truncate font-display text-xl leading-tight text-ink">{invitationTitle}</h2>
        <p className="mt-1 text-[0.58rem] uppercase tracking-[0.14em] text-ink/35">
          {sections.length} sections · {visibleCount} visible
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onSelect('global:envelope')}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition',
              selectedKey === 'global:envelope'
                ? 'border-gold bg-gold/[0.1] text-ink'
                : 'border-ink/10 bg-cream/70 text-ink/60 hover:border-ink/20',
            )}
          >
            <MailOpen className="h-4 w-4 text-gold" />
            <span className="flex-1 text-xs font-semibold">Envelope & wax seal</span>
            <span className="text-[0.5rem] uppercase tracking-[0.12em] text-ink/30">Global</span>
          </button>

          <button
            type="button"
            onClick={() => onSelect('global:footer')}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition',
              selectedKey === 'global:footer'
                ? 'border-gold bg-gold/[0.1] text-ink'
                : 'border-ink/10 bg-cream/70 text-ink/60 hover:border-ink/20',
            )}
          >
            <LayoutTemplate className="h-4 w-4 text-gold" />
            <span className="flex-1 text-xs font-semibold">Footer & contact</span>
            <span className="text-[0.5rem] uppercase tracking-[0.12em] text-ink/30">Global</span>
          </button>
        </div>

        <div className="my-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-ink/10" />
          <span className="text-[0.5rem] font-semibold uppercase tracking-[0.18em] text-ink/30">Story flow</span>
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder}>
          <SortableContext
            items={sections.map((section) => section.studioKey ?? section.type)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {sections.map((section) => (
                <SortableSectionRow
                  key={section.studioKey ?? section.type}
                  section={section}
                  selected={selectedKey === section.studioKey}
                  onSelect={() => onSelect(section.studioKey ?? null)}
                  onChange={updateSection}
                  onDelete={() => setDeleting(section)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {!sections.length ? (
          <div className="rounded-xl border border-dashed border-ink/15 bg-cream/40 p-4 text-center">
            <p className="font-display text-lg text-ink">A blank page</p>
            <p className="mt-1 text-xs text-ink/45">Add a hero, a story and an RSVP to begin.</p>
          </div>
        ) : null}

        {selectedSection && component?.elements?.length ? (
          <div className="mt-4 rounded-xl border border-ink/10 bg-cream/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-ink/40">Layers</p>
              <button
                type="button"
                onClick={() => duplicateSection(selectedSection)}
                className="inline-flex items-center gap-1 text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-ink/35 transition hover:text-wine"
              >
                <Copy className="h-3 w-3" /> Duplicate
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {component.elements.map((element) => (
                <button
                  key={element.key}
                  type="button"
                  onClick={() => {
                    onSelect(selectedSection.studioKey ?? null)
                    if (selectedSection.studioKey) {
                      onFocusElement?.(selectedSection.studioKey, element.key)
                    }
                  }}
                  className="rounded-full border border-ink/10 bg-paper/70 px-2 py-0.5 text-[0.52rem] font-medium text-ink/50 transition hover:border-gold hover:text-ink"
                >
                  {element.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-ink/10 p-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={onOpenLibrary}
        >
          Add section
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeSection(deleting)}
        title="Delete this section?"
        description={`“${deleting?.title || (deleting ? componentFor(deleting.type)?.label : 'This section')}” will be removed from this design. You can undo this change before saving.`}
        confirmLabel="Delete section"
      />
    </div>
  )
}
