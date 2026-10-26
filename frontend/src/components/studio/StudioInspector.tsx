import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Layers, SlidersHorizontal, Sparkles, Type } from 'lucide-react'
import { Tabs } from '@/components/ui/Primitives'
import { Field, Input } from '@/components/ui/Field'
import { ComponentFields } from '@/components/studio/ComponentFields'
import { StudioMotionPanel } from '@/components/studio/StudioMotionPanel'
import { StudioPagePanel } from '@/components/studio/StudioPagePanel'
import { StudioStylePanel } from '@/components/studio/StudioStylePanel'
import { componentFor, elementFieldKeys } from '@/lib/componentRegistry'
import { updateSectionAt } from '@/lib/design'
import { cn } from '@/lib/utils'
import type {
  AnimationPreset,
  DesignSnapshot,
  DesignSnapshotSection,
  Invitation,
  InvitationDesignVersion,
  MediaAsset,
  SectionContent,
  SectionDesign,
  Template,
  Theme,
} from '@/types'

type InspectorTab = 'content' | 'style' | 'motion' | 'page'

interface StudioInspectorProps {
  invitation: Invitation
  snapshot: DesignSnapshot
  selectedKey: string | null
  focusRequest?: { sectionKey: string; fieldKeys: string[]; nonce: number } | null
  onSelect: (key: string | null) => void
  onSnapshotChange: (snapshot: DesignSnapshot, options?: { force?: boolean }) => void
  themes: Theme[]
  templates: Template[]
  presets: AnimationPreset[]
  mediaAssets: MediaAsset[]
  versions: InvitationDesignVersion[]
  versionsLoading?: boolean
  designName: string
  onDesignNameChange: (name: string) => void
  onApplyTheme: (theme: Theme) => void
  onApplyTemplate: (template: Template, mode: 'preserve' | 'replace') => void
  onRestoreVersion: (version: InvitationDesignVersion) => void
  onDownload?: () => void
}

function scrollToField(keys: string | string[]): boolean {
  const root = document.getElementById('studio-inspector-scroll')
  if (!root) return false
  const list = Array.isArray(keys) ? keys : [keys]
  let target: HTMLElement | null = null
  for (const key of list) {
    target =
      root.querySelector<HTMLElement>(`[data-studio-field="${key}"]`) ??
      root.querySelector<HTMLElement>(`[data-studio-field^="${key}."]`) ??
      root.querySelector<HTMLElement>(`[data-studio-field*="${key}"]`) ??
      null
    if (target) break
  }
  if (!target) return false
  root.querySelectorAll('.studio-field-focus').forEach((node) => node.classList.remove('studio-field-focus'))
  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  target.classList.add('studio-field-focus')
  target.querySelector<HTMLElement>('input, textarea, select, button')?.focus({ preventScroll: true })
  window.setTimeout(() => target?.classList.remove('studio-field-focus'), 1600)
  return true
}

export function StudioInspector({
  invitation,
  snapshot,
  selectedKey,
  focusRequest,
  onSelect,
  onSnapshotChange,
  themes,
  templates,
  presets,
  mediaAssets,
  versions,
  versionsLoading,
  designName,
  onDesignNameChange,
  onApplyTheme,
  onApplyTemplate,
  onRestoreVersion,
  onDownload,
}: StudioInspectorProps) {
  const [tab, setTab] = useState<InspectorTab>(selectedKey ? 'content' : 'page')
  const [layerHint, setLayerHint] = useState<string | null>(null)
  const previousKeyRef = useRef<string | null>(selectedKey)
  const selectedSection = snapshot.sections.find((section) => section.studioKey === selectedKey) ?? null
  const component = selectedSection ? componentFor(selectedSection.type) : undefined
  const isGlobal = Boolean(selectedKey?.startsWith('global:'))
  const globalLabel =
    selectedKey === 'global:envelope'
      ? 'Envelope & wax seal'
      : selectedKey === 'global:footer'
        ? 'Footer & contact'
        : 'Design settings'

  useEffect(() => {
    if (!selectedKey || selectedKey.startsWith('global:')) {
      setTab('page')
      previousKeyRef.current = selectedKey
      return
    }
    const previous = previousKeyRef.current
    previousKeyRef.current = selectedKey
    if (!previous || previous.startsWith('global:')) setTab('content')
  }, [selectedKey])

  useEffect(() => {
    if (!focusRequest || focusRequest.sectionKey !== selectedKey) return
    setTab('content')
    const timer = window.setTimeout(() => {
      if (scrollToField(focusRequest.fieldKeys)) {
        setLayerHint(null)
        return
      }
      setLayerHint('This layer follows the invitation’s project settings rather than a single field.')
      window.setTimeout(() => setLayerHint(null), 3500)
    }, 90)
    return () => window.clearTimeout(timer)
  }, [focusRequest, selectedKey])

  const updateSection = (section: DesignSnapshotSection, options?: { force?: boolean }) => {
    if (!section.studioKey) return
    onSnapshotChange(updateSectionAt(snapshot, section.studioKey, () => section), options)
  }

  const updateContent = (content: Record<string, unknown>) => {
    if (!selectedSection) return
    updateSection({ ...selectedSection, content: content as SectionContent })
  }

  const applyStyleToAll = (design: SectionDesign) => {
    onSnapshotChange({
      ...snapshot,
      sections: snapshot.sections.map((section) => ({
        ...section,
        design: { ...design },
      })),
    }, { force: true })
  }

  const tabs: Array<{ value: InspectorTab; label: string }> = [
    { value: 'content', label: 'Content' },
    { value: 'style', label: 'Style' },
    { value: 'motion', label: 'Motion' },
    { value: 'page', label: 'Page' },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <div className="border-b border-ink/10 px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-gold">
              {selectedSection ? component?.label ?? selectedSection.type : globalLabel}
            </p>
            <p className="mt-0.5 truncate font-display text-lg leading-tight text-ink">
              {selectedSection?.title || (selectedSection ? component?.label : designName)}
            </p>
          </div>
          {selectedSection ? (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="btn-icon shrink-0"
              aria-label="Back to design settings"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
          ) : null}
        </div>
        <Tabs tabs={tabs} value={tab} onChange={setTab} className="!bg-cream/80" />
      </div>

      <div id="studio-inspector-scroll" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === 'content' ? (
          selectedSection ? (
            <div className="space-y-4">
              <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Type className="h-4 w-4 text-gold" />
                  <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
                    Section
                  </h3>
                </div>
                <Field label="Section title" hint="A private label for the navigator. It does not appear on the invitation.">
                  <Input
                    value={selectedSection.title ?? ''}
                    onChange={(event) => updateSection({ ...selectedSection, title: event.target.value || null })}
                  />
                </Field>
                <p className="mt-2 text-[0.65rem] leading-relaxed text-ink/40">{component?.description}</p>
              </section>

              {component?.elements?.length ? (
                <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-gold" />
                    <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
                      Layers
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {component.elements.map((element) => (
                      <button
                        key={element.key}
                        type="button"
                        onClick={() => {
                          const keys = selectedSection
                            ? elementFieldKeys(selectedSection.type, element.key)
                            : [element.key]
                          if (!scrollToField(keys)) {
                            setLayerHint(
                              'This layer follows the invitation’s project settings rather than a single field.',
                            )
                            window.setTimeout(() => setLayerHint(null), 3500)
                          } else {
                            setLayerHint(null)
                          }
                        }}
                        className={cn(
                          'rounded-full border border-ink/10 bg-paper/70 px-2.5 py-1 text-[0.58rem] font-medium text-ink/55 transition hover:border-gold hover:text-ink',
                        )}
                      >
                        {element.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[0.6rem] leading-relaxed text-ink/35">
                    Choose a layer to jump to its controls.
                  </p>
                  {layerHint ? (
                    <p className="mt-2 rounded-lg border border-gold/20 bg-gold/[0.08] px-2 py-1.5 text-[0.6rem] leading-relaxed text-ink/55">
                      {layerHint}
                    </p>
                  ) : null}
                </section>
              ) : null}

              <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-gold" />
                  <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
                    Words & media
                  </h3>
                </div>
                <ComponentFields
                  fields={component?.fields ?? []}
                  value={selectedSection.content as Record<string, unknown>}
                  onChange={updateContent}
                />
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-ink/15 bg-cream/40 p-5 text-center">
                <Sparkles className="mx-auto h-5 w-5 text-gold" />
                <p className="mt-2 font-display text-xl text-ink">Choose a section to edit</p>
                <p className="mt-1 text-xs leading-relaxed text-ink/45">
                  Select a section on the canvas or in the navigator, or shape the whole design from the Page tab.
                </p>
              </div>
              {isGlobal ? (
                <div className="rounded-xl border border-gold/20 bg-gold/[0.06] p-3 text-xs leading-relaxed text-ink/50">
                  This is a global piece. Its content follows the invitation and theme; use the Page tab for envelope,
                  effects and canvas settings.
                </div>
              ) : null}
            </div>
          )
        ) : null}

        {tab === 'style' ? (
          selectedSection ? (
            <StudioStylePanel
              section={selectedSection}
              onChange={updateSection}
              onApplyStyleToAll={applyStyleToAll}
            />
          ) : (
            <StudioPagePanel
              invitation={invitation}
              snapshot={snapshot}
              themes={themes}
              templates={templates}
              mediaAssets={mediaAssets}
              versions={versions}
              versionsLoading={versionsLoading}
              designName={designName}
              onDesignNameChange={onDesignNameChange}
              onChange={onSnapshotChange}
              onApplyTheme={onApplyTheme}
              onApplyTemplate={onApplyTemplate}
              onRestoreVersion={onRestoreVersion}
              onDownload={onDownload}
            />
          )
        ) : null}

        {tab === 'motion' ? (
          <StudioMotionPanel
            snapshot={snapshot}
            section={selectedSection}
            presets={presets}
            onSectionChange={updateSection}
            onPageChange={onSnapshotChange}
          />
        ) : null}

        {tab === 'page' ? (
          <StudioPagePanel
            invitation={invitation}
            snapshot={snapshot}
            themes={themes}
            templates={templates}
            mediaAssets={mediaAssets}
            versions={versions}
            versionsLoading={versionsLoading}
            designName={designName}
            onDesignNameChange={onDesignNameChange}
            onChange={onSnapshotChange}
            onApplyTheme={onApplyTheme}
            onApplyTemplate={onApplyTemplate}
            onRestoreVersion={onRestoreVersion}
            onDownload={onDownload}
          />
        ) : null}
      </div>
    </div>
  )
}
