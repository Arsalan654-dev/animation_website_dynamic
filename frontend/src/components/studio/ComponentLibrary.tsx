import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { COMPONENT_REGISTRY, type ComponentCategory } from '@/lib/componentRegistry'
import { cn } from '@/lib/utils'

const CATEGORY_ORDER: ComponentCategory[] = ['Opening', 'Story', 'Celebration', 'Guests', 'Design']

export function ComponentLibrary({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (type: string) => void
}) {
  const [search, setSearch] = useState('')

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase()
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: COMPONENT_REGISTRY.filter(
        (component) =>
          !component.global &&
          component.category === category &&
          (!query ||
            component.label.toLowerCase().includes(query) ||
            component.description.toLowerCase().includes(query)),
      ),
    })).filter((group) => group.items.length > 0)
  }, [search])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a section"
      description="Every piece is data-driven. Add it, then shape its words, style and movement."
      size="lg"
    >
      <div className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search the component library"
            className="admin-input pl-9"
            aria-label="Search components"
          />
        </div>

        {grouped.map((group) => (
          <section key={group.category}>
            <h3 className="admin-label">{group.category}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.items.map((component) => {
                const Icon = component.icon
                return (
                  <button
                    key={component.type}
                    type="button"
                    onClick={() => {
                      onAdd(component.type)
                      onClose()
                    }}
                    className={cn(
                      'group flex items-start gap-3 rounded-xl border border-ink/10 bg-cream/70 p-3 text-left transition',
                      'hover:border-gold hover:bg-gold/[0.06]',
                    )}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-wine">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-display text-lg leading-tight text-ink">{component.label}</span>
                        <Plus className="h-3.5 w-3.5 shrink-0 text-gold" />
                      </span>
                      <span className="mt-1 block text-[0.65rem] leading-relaxed text-ink/45">
                        {component.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}

        {!grouped.length ? (
          <p className="rounded-xl border border-dashed border-ink/15 bg-cream/40 p-6 text-center text-sm text-ink/45">
            No components match “{search}”.
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
