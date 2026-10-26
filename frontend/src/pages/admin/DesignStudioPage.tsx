import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  Cloud,
  Download,
  Eye,
  Monitor,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Redo2,
  Save,
  Smartphone,
  Tablet,
  Undo2,
  X,
} from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useDesignHistory } from '@/hooks/useDesignHistory'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, PageLoader } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { InvitationSite } from '@/components/invitation/InvitationSite'
import { ComponentLibrary } from '@/components/studio/ComponentLibrary'
import { StudioInspector } from '@/components/studio/StudioInspector'
import { StudioNavigator } from '@/components/studio/StudioNavigator'
import { elementFieldKeys, newSection } from '@/lib/componentRegistry'
import {
  applyTemplateToSnapshot,
  applyThemeToSnapshot,
  buildPublicInvitationFromDesign,
  snapshotFromDesign,
} from '@/lib/design'
import {
  activateInvitationDesign,
  deleteInvitationDesign,
  downloadDesignExport,
  duplicateInvitationDesign,
  fetchDesignVersions,
  fetchInvitationDesign,
  fetchInvitationDesigns,
  restoreDesignVersion,
  updateInvitationDesign,
} from '@/lib/designApi'
import { cn, invitationPublicUrl, slugify } from '@/lib/utils'
import type {
  AnimationPreset,
  ApiEnvelope,
  DesignSnapshot,
  Invitation,
  InvitationDesignVersion,
  MediaAsset,
  PaginationMeta,
  Settings,
  Template,
  Theme,
} from '@/types'

type Device = 'desktop' | 'tablet' | 'mobile'

const DEVICES: Record<Device, { label: string; width: number; height: number }> = {
  desktop: { label: 'Desktop', width: 1440, height: 900 },
  tablet: { label: 'Tablet', width: 834, height: 1024 },
  mobile: { label: 'Mobile', width: 390, height: 844 },
}

interface MediaListResponse {
  data: MediaAsset[]
  meta: PaginationMeta
}

function cleanSnapshot(snapshot: DesignSnapshot): DesignSnapshot {
  return {
    theme_id: snapshot.theme_id,
    design_config: snapshot.design_config,
    envelope: snapshot.envelope,
    cover_image_path: snapshot.cover_image_path,
    sections: snapshot.sections.map((section) => ({
      type: section.type,
      title: section.title,
      content: section.content,
      design: section.design,
      animation_preset_id: section.animation_preset_id,
      animation_config: section.animation_config,
      sort_order: section.sort_order,
      is_visible: section.is_visible,
    })),
  }
}

function withStudioKeys(next: DesignSnapshot, previous: DesignSnapshot): DesignSnapshot {
  return {
    ...next,
    sections: next.sections.map((section, index) => ({
      ...section,
      studioKey: previous.sections[index]?.studioKey ?? section.studioKey,
    })),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function DesignStudioPage() {
  const { id = '' } = useParams()
  const invitationId = Number(id)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const requestedDesignId = Number(searchParams.get('design') ?? 0)
  const [device, setDevice] = useState<Device>('desktop')
  const [zoom, setZoom] = useState(0.7)
  const [fit, setFit] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [designName, setDesignName] = useState('')
  const [savedName, setSavedName] = useState('')
  const [savedJson, setSavedJson] = useState('')
  const [loadedDesignId, setLoadedDesignId] = useState<number | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [pendingDesignId, setPendingDesignId] = useState<number | null>(null)
  const [showNavigator, setShowNavigator] = useState(false)
  const [showInspector, setShowInspector] = useState(false)
  const [focusRequest, setFocusRequest] = useState<{
    sectionKey: string
    fieldKeys: string[]
    nonce: number
  } | null>(null)
  const [downloading, setDownloading] = useState(false)

  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasScrollRef = useRef<HTMLDivElement>(null)
  const deviceMeta = DEVICES[device]

  const invitationQuery = useQuery({
    queryKey: ['invitation', invitationId],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Invitation>>(`/invitations/${invitationId}`)
      return data.data
    },
    enabled: Number.isFinite(invitationId) && invitationId > 0,
  })

  const designsQuery = useQuery({
    queryKey: ['invitation-designs', invitationId],
    queryFn: () => fetchInvitationDesigns(invitationId),
    enabled: Number.isFinite(invitationId) && invitationId > 0,
  })

  const designs = designsQuery.data ?? []
  const activeDesign = designs.find((design) => design.is_active)
  const designId =
    requestedDesignId && designs.some((design) => design.id === requestedDesignId)
      ? requestedDesignId
      : activeDesign?.id ?? designs[0]?.id ?? 0

  const designQuery = useQuery({
    queryKey: ['invitation-design', invitationId, designId],
    queryFn: () => fetchInvitationDesign(invitationId, designId),
    enabled: designId > 0,
  })

  const themesQuery = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Theme[]>>('/themes')
      return data.data
    },
  })

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Template[]>>('/templates')
      return data.data
    },
  })

  const presetsQuery = useQuery({
    queryKey: ['animation-presets'],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<AnimationPreset[]>>('/animation-presets')
      return data.data
    },
  })

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Settings>>('/settings')
      return data.data
    },
  })

  const mediaQuery = useQuery({
    queryKey: ['media', { studio: true }],
    queryFn: async () => {
      const { data } = await api.get<MediaListResponse>('/media', { params: { page: 1 } })
      return data.data
    },
  })

  const versionsQuery = useQuery({
    queryKey: ['invitation-design-versions', invitationId, designId],
    queryFn: () => fetchDesignVersions(invitationId, designId),
    enabled: designId > 0,
  })

  const themes = themesQuery.data ?? []
  const templates = templatesQuery.data ?? []
  const presets = presetsQuery.data ?? []
  const settings = settingsQuery.data ?? null
  const mediaAssets = mediaQuery.data ?? []
  const versions = versionsQuery.data?.data ?? []
  const invitation = invitationQuery.data ?? null
  const currentDesign = designQuery.data ?? null

  const { snapshot, update, reset, undo, redo, canUndo, canRedo } = useDesignHistory(null)

  useDocumentTitle(
    invitation
      ? `${designName || 'Design studio'} · ${invitation.title} — Ever After Studio`
      : 'Design studio — Ever After Studio',
  )

  useEffect(() => {
    if (!designQuery.data) return
    if (loadedDesignId === designQuery.data.id) return
    const next = snapshotFromDesign(designQuery.data)
    reset(next)
    setDesignName(designQuery.data.name)
    setSavedName(designQuery.data.name)
    setSavedJson(JSON.stringify(cleanSnapshot(next)))
    setSelectedKey(next.sections[0]?.studioKey ?? null)
    setLoadedDesignId(designQuery.data.id)
  }, [designQuery.data, loadedDesignId, reset])

  useEffect(() => {
    if (!fit) return
    const node = viewportRef.current
    if (!node) return
    const updateZoom = () => {
      const availableWidth = node.clientWidth - 64
      const availableHeight = node.clientHeight - 48
      const next = Math.min(1, availableWidth / deviceMeta.width, availableHeight / deviceMeta.height)
      setZoom(Number(clamp(next, 0.2, 1).toFixed(3)))
    }
    updateZoom()
    const observer = new ResizeObserver(updateZoom)
    observer.observe(node)
    return () => observer.disconnect()
  }, [fit, deviceMeta.width, deviceMeta.height])

  const dirty = useMemo(() => {
    if (!snapshot) return false
    return JSON.stringify(cleanSnapshot(snapshot)) !== savedJson || designName.trim() !== savedName
  }, [snapshot, savedJson, designName, savedName])

  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const publicInvitation = useMemo(() => {
    if (!invitation || !snapshot) return null
    return buildPublicInvitationFromDesign({
      invitation,
      snapshot,
      themes,
      presets,
      mediaAssets,
      settings,
    })
  }, [invitation, snapshot, themes, presets, mediaAssets, settings])

  const saveMutation = useMutation({
    mutationFn: async ({ publish }: { publish?: boolean }) => {
      if (!snapshot) throw new Error('There is no design to save yet.')
      const saved = await updateInvitationDesign(invitationId, designId, {
        name: designName.trim() || 'Untitled design',
        snapshot: cleanSnapshot(snapshot),
        label: publish ? 'Published from the studio' : 'Studio save',
      })
      if (publish) {
        return activateInvitationDesign(invitationId, designId)
      }
      return saved
    },
    onSuccess: (design, variables) => {
      const normalized = snapshotFromDesign(design)
      const merged = snapshot ? withStudioKeys(normalized, snapshot) : normalized
      update(merged, { history: false })
      setSavedJson(JSON.stringify(cleanSnapshot(merged)))
      setSavedName(design.name)
      setDesignName(design.name)
      setLoadedDesignId(design.id)
      queryClient.invalidateQueries({ queryKey: ['invitation-designs', invitationId] })
      queryClient.invalidateQueries({ queryKey: ['invitation-design', invitationId, designId] })
      queryClient.invalidateQueries({ queryKey: ['invitation-design-versions', invitationId, designId] })
      queryClient.invalidateQueries({ queryKey: ['invitation', invitationId] })
      queryClient.invalidateQueries({ queryKey: ['invitation-preview', invitationId] })
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      queryClient.invalidateQueries({ queryKey: ['designs'] })
      queryClient.invalidateQueries({ queryKey: ['public-invitation'] })
      toast({
        title: variables.publish ? 'Design published' : 'Draft saved',
        description: variables.publish
          ? 'This design is now live on the invitation.'
          : 'Your changes are safe. Publish when you are ready.',
        tone: 'success',
      })
    },
    onError: (error) => {
      toast({
        title: 'Could not save the design',
        description: getApiErrorMessage(error),
        tone: 'error',
      })
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!snapshot) throw new Error('There is no design to duplicate yet.')
      if (dirty) {
        await updateInvitationDesign(invitationId, designId, {
          name: designName.trim() || 'Untitled design',
          snapshot: cleanSnapshot(snapshot),
          label: 'Before duplicate',
        })
      }
      return duplicateInvitationDesign(invitationId, designId)
    },
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['invitation-designs', invitationId] })
      queryClient.invalidateQueries({ queryKey: ['designs'] })
      toast({ title: 'Design duplicated', description: `“${copy.name}” is ready to edit.`, tone: 'success' })
      setActionsOpen(false)
      switchDesign(copy.id)
    },
    onError: (error) => {
      toast({ title: 'Could not duplicate the design', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvitationDesign(invitationId, designId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitation-designs', invitationId] })
      queryClient.invalidateQueries({ queryKey: ['designs'] })
      setDeleteOpen(false)
      toast({ title: 'Design deleted', tone: 'success' })
      const remaining = designs.filter((design) => design.id !== designId)
      const next = remaining.find((design) => design.is_active) ?? remaining[0]
      if (next) {
        switchDesign(next.id)
      } else {
        navigate(`/admin/invitations/${invitationId}/edit?tab=designs`, { replace: true })
      }
    },
    onError: (error) => {
      toast({ title: 'Could not delete the design', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (version: InvitationDesignVersion) => restoreDesignVersion(invitationId, designId, version.id),
    onSuccess: (design) => {
      const next = snapshotFromDesign(design)
      reset(next)
      setSelectedKey(next.sections[0]?.studioKey ?? null)
      setSavedJson(JSON.stringify(cleanSnapshot(next)))
      setSavedName(design.name)
      setDesignName(design.name)
      queryClient.invalidateQueries({ queryKey: ['invitation-designs', invitationId] })
      queryClient.invalidateQueries({ queryKey: ['invitation-design', invitationId, designId] })
      queryClient.invalidateQueries({ queryKey: ['invitation-design-versions', invitationId, designId] })
      queryClient.invalidateQueries({ queryKey: ['invitation', invitationId] })
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      queryClient.invalidateQueries({ queryKey: ['public-invitation'] })
      toast({
        title: 'Version restored',
        description: 'The design and the live invitation now use this version.',
        tone: 'success',
      })
    },
    onError: (error) => {
      toast({ title: 'Could not restore the version', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const switchDesign = useCallback(
    (nextId: number) => {
      const next = new URLSearchParams(searchParams)
      next.set('design', String(nextId))
      setSearchParams(next)
      setShowInspector(false)
      setShowNavigator(false)
    },
    [searchParams, setSearchParams],
  )

  const requestDesign = (nextId: number) => {
    if (nextId === designId) return
    if (dirty) {
      setPendingDesignId(nextId)
      return
    }
    switchDesign(nextId)
  }

  const selectSection = (key: string | null) => {
    setSelectedKey(key)
    setFocusRequest(null)
    if (!key || key.startsWith('global:')) return
    window.setTimeout(() => {
      const node = canvasScrollRef.current?.querySelector<HTMLElement>(`[data-studio-key="${key}"]`)
      node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  const focusElement = (sectionKey: string, elementKey: string) => {
    const section = snapshot?.sections.find((item) => item.studioKey === sectionKey)
    if (!section) return
    setSelectedKey(sectionKey)
    setShowInspector(true)
    setFocusRequest({
      sectionKey,
      fieldKeys: elementFieldKeys(section.type, elementKey),
      nonce: Date.now(),
    })
  }

  const changeSnapshot = useCallback(
    (next: DesignSnapshot, options?: { force?: boolean }) => {
      update(next, options)
    },
    [update],
  )

  const addSection = (type: string) => {
    if (!snapshot) return
    const section = newSection(type)
    const next: DesignSnapshot = {
      ...snapshot,
      sections: [...snapshot.sections, { ...section, sort_order: snapshot.sections.length }],
    }
    update(next, { force: true })
    setSelectedKey(section.studioKey)
    window.setTimeout(() => {
      const node = canvasScrollRef.current?.querySelector<HTMLElement>(`[data-studio-key="${section.studioKey}"]`)
      node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const applyTheme = (theme: Theme) => {
    if (!snapshot) return
    update(applyThemeToSnapshot(snapshot, theme), { force: true })
    toast({
      title: 'Theme applied',
      description: `${theme.name} now shapes the colours, type and surfaces. Your content stayed in place.`,
      tone: 'success',
    })
  }

  const applyTemplate = (template: Template, mode: 'preserve' | 'replace') => {
    if (!snapshot) return
    const next = applyTemplateToSnapshot(snapshot, template, mode)
    update(next, { force: true })
    setSelectedKey(next.sections[0]?.studioKey ?? null)
    toast({
      title: 'Template applied',
      description:
        mode === 'preserve'
          ? 'The template arrangement is in place and your compatible content was preserved.'
          : 'The template arrangement and content replaced the current sections.',
      tone: 'success',
    })
  }

  const download = async () => {
    if (!snapshot) return
    setDownloading(true)
    try {
      if (dirty) {
        await saveMutation.mutateAsync({})
      }
      const filename = `${invitation?.slug ?? 'invitation'}-${slugify(designName) || 'design'}.html`
      await downloadDesignExport(invitationId, designId, filename)
      setActionsOpen(false)
      toast({
        title: 'Website downloaded as HTML',
        description: 'The complete invitation website is in one .html file. Open it anywhere; the Bootstrap and Google Fonts CDN links are live.',
        tone: 'success',
      })
    } catch (error) {
      toast({ title: 'Could not download the design', description: getApiErrorMessage(error), tone: 'error' })
    } finally {
      setDownloading(false)
    }
  }

  const goBack = () => {
    if (dirty) {
      setLeaveOpen(true)
      return
    }
    navigate(`/admin/invitations/${invitationId}/edit?tab=designs`)
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey
      if (!meta) {
        if (event.key === 'Escape') setPreviewOpen(false)
        return
      }
      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      }
      if (key === 's') {
        event.preventDefault()
        if (snapshot) saveMutation.mutate({})
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, snapshot, saveMutation])

  if (invitationQuery.isLoading || designsQuery.isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-paper">
        <PageLoader label="Opening the design studio" />
      </div>
    )
  }

  if (invitationQuery.isError || designsQuery.isError) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-paper p-6">
        <EmptyState
          title="The studio could not be opened"
          description={getApiErrorMessage(invitationQuery.error ?? designsQuery.error)}
          action={
            <Link to={`/admin/invitations/${invitationId}/edit?tab=designs`}>
              <Button type="button">Back to the invitation</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-paper p-6">
        <EmptyState
          title="Invitation not found"
          description="This invitation may have been deleted or you may not have access to it."
          action={
            <Link to="/admin/invitations">
              <Button type="button">Back to invitations</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (!designId) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-paper p-6">
        <EmptyState
          title="No design yet"
          description="A default design is created when you open the invitation. Try the invitation's Designs tab."
          action={
            <Link to={`/admin/invitations/${invitationId}/edit?tab=designs`}>
              <Button type="button">Open Designs</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (designQuery.isLoading || !snapshot) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-paper">
        <PageLoader label="Opening the design canvas" />
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#241c19] text-ink">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#1d1714] px-3 text-cream sm:px-4">
        <button
          type="button"
          onClick={goBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cream/65 transition hover:bg-white/10 hover:text-cream"
          aria-label="Back to invitation"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="hidden min-w-0 sm:block">
          <p className="text-[0.5rem] font-semibold uppercase tracking-[0.22em] text-gold">Design studio</p>
          <div className="flex items-center gap-2">
            <p className="max-w-[14rem] truncate font-display text-lg leading-tight text-cream">{designName || 'Untitled design'}</p>
            {currentDesign?.is_active ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#7ca486]/30 bg-[#7ca486]/15 px-2 py-0.5 text-[0.48rem] font-semibold uppercase tracking-[0.14em] text-[#a9d1b2]">
                <span className="h-1 w-1 rounded-full bg-[#a9d1b2]" /> Live
              </span>
            ) : (
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[0.48rem] font-semibold uppercase tracking-[0.14em] text-cream/40">
                Draft
              </span>
            )}
          </div>
        </div>

        <select
          value={designId}
          onChange={(event) => requestDesign(Number(event.target.value))}
          className="h-9 max-w-[11rem] rounded-full border border-white/15 bg-white/5 px-3 text-[0.68rem] font-medium text-cream outline-none transition hover:border-white/25 focus:border-gold sm:max-w-[15rem]"
          aria-label="Choose a design"
        >
          {designs.map((design) => (
            <option key={design.id} value={design.id} className="bg-[#1d1714] text-cream">
              {design.name}
              {design.is_active ? ' · Live' : ''}
            </option>
          ))}
        </select>

        <div className="hidden items-center gap-0.5 sm:flex">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="flex h-9 w-9 items-center justify-center rounded-full text-cream/55 transition hover:bg-white/10 hover:text-cream disabled:opacity-25"
            aria-label="Undo"
            title="Undo (Ctrl/Cmd+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="flex h-9 w-9 items-center justify-center rounded-full text-cream/55 transition hover:bg-white/10 hover:text-cream disabled:opacity-25"
            aria-label="Redo"
            title="Redo (Shift+Ctrl/Cmd+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowNavigator((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-cream/55 transition hover:bg-white/10 hover:text-cream lg:hidden"
            aria-label="Toggle sections panel"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowInspector((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-cream/55 transition hover:bg-white/10 hover:text-cream xl:hidden"
            aria-label="Toggle properties panel"
          >
            <PanelRight className="h-4 w-4" />
          </button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!text-cream/65 hover:!bg-white/10 hover:!text-cream"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => setPreviewOpen(true)}
          >
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!text-cream/65 hover:!bg-white/10 hover:!text-cream"
            icon={<Download className="h-3.5 w-3.5" />}
            isLoading={downloading}
            onClick={download}
            title="Download the complete website as a single .html file"
            aria-label="Download website as HTML"
          >
            <span className="hidden md:inline">Download .html</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="!border-white/20 !text-cream hover:!bg-white/10"
            icon={<Save className="h-3.5 w-3.5" />}
            isLoading={saveMutation.isPending && !saveMutation.variables?.publish}
            onClick={() => saveMutation.mutate({})}
          >
            <span className="hidden sm:inline">Save draft</span>
          </Button>
          <Button
            type="button"
            variant="gold"
            size="sm"
            icon={<Cloud className="h-3.5 w-3.5" />}
            isLoading={saveMutation.isPending && Boolean(saveMutation.variables?.publish)}
            onClick={() => saveMutation.mutate({ publish: true })}
          >
            Publish
          </Button>
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-cream/55 transition hover:bg-white/10 hover:text-cream"
            aria-label="More design actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            'w-72 shrink-0 border-r border-ink/10',
            showNavigator ? 'fixed inset-y-14 left-0 z-50 block shadow-2xl' : 'hidden lg:block',
          )}
        >
          <StudioNavigator
            snapshot={snapshot}
            selectedKey={selectedKey}
            invitationTitle={invitation.title}
            onSelect={selectSection}
            onFocusElement={focusElement}
            onChange={changeSnapshot}
            onOpenLibrary={() => setLibraryOpen(true)}
          />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-[#e9dfd0]">
          <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-ink/10 bg-[#f3ebdf] px-3 sm:px-4">
            <div className="flex items-center gap-1">
              {(
                [
                  ['desktop', Monitor, 'Desktop'],
                  ['tablet', Tablet, 'Tablet'],
                  ['mobile', Smartphone, 'Mobile'],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setDevice(value)
                    setFit(true)
                  }}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] transition',
                    device === value ? 'bg-ink text-cream' : 'text-ink/45 hover:bg-ink/[0.06] hover:text-ink',
                  )}
                  aria-label={`Preview on ${label}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="hidden text-[0.52rem] uppercase tracking-[0.14em] text-ink/30 md:inline">
                Click a section to edit
              </span>
              <div className="flex items-center gap-0.5 rounded-full border border-ink/10 bg-cream/70 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setFit(false)
                    setZoom((current) => clamp(Number((current - 0.1).toFixed(2)), 0.2, 1.2))
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-ink/55 transition hover:bg-ink/[0.06] hover:text-ink"
                  aria-label="Zoom out"
                >
                  −
                </button>
                <span className="min-w-[3rem] text-center text-[0.58rem] font-semibold tabular-nums text-ink/55">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFit(false)
                    setZoom((current) => clamp(Number((current + 0.1).toFixed(2)), 0.2, 1.2))
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-ink/55 transition hover:bg-ink/[0.06] hover:text-ink"
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setFit(true)}
                  className={cn(
                    'h-7 rounded-full px-2 text-[0.52rem] font-semibold uppercase tracking-[0.1em] transition',
                    fit ? 'bg-ink text-cream' : 'text-ink/45 hover:bg-ink/[0.06] hover:text-ink',
                  )}
                >
                  Fit
                </button>
              </div>
            </div>
          </div>

          <div ref={viewportRef} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
            <div
              className="overflow-hidden rounded-xl border border-ink/20 bg-paper shadow-[0_30px_90px_-30px_rgba(20,14,12,0.55)]"
              style={{ width: deviceMeta.width, height: deviceMeta.height, zoom } as CSSProperties}
            >
              <div className="flex h-9 items-center gap-2 border-b border-ink/10 bg-[#efe5d5] px-3">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#c9796b]" />
                  <span className="h-2 w-2 rounded-full bg-[#d8b26a]" />
                  <span className="h-2 w-2 rounded-full bg-[#88a97e]" />
                </span>
                <span className="ml-1 min-w-0 flex-1 truncate rounded-full bg-cream/80 px-3 py-1 text-[0.52rem] text-ink/40">
                  {invitation.slug}
                </span>
                <span className="text-[0.48rem] font-semibold uppercase tracking-[0.14em] text-ink/30">
                  {deviceMeta.label}
                </span>
              </div>
              <div ref={canvasScrollRef} className="studio-canvas studio-canvas-frame h-[calc(100%-2.25rem)] overflow-y-auto bg-paper">
                {publicInvitation ? (
                  <InvitationSite
                    invitation={publicInvitation}
                    preview
                    startOpened
                    editor={{ selectedKey, onSelect: selectSection }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </main>

        <aside
          className={cn(
            'w-[22rem] shrink-0 border-l border-ink/10',
            showInspector ? 'fixed inset-y-14 right-0 z-50 block max-w-[92vw] shadow-2xl' : 'hidden xl:block',
          )}
        >
          <StudioInspector
            invitation={invitation}
            snapshot={snapshot}
            selectedKey={selectedKey}
            focusRequest={focusRequest}
            onSelect={selectSection}
            onSnapshotChange={changeSnapshot}
            themes={themes}
            templates={templates}
            presets={presets}
            mediaAssets={mediaAssets}
            versions={versions}
            versionsLoading={versionsQuery.isLoading}
            designName={designName}
            onDesignNameChange={setDesignName}
            onApplyTheme={applyTheme}
            onApplyTemplate={applyTemplate}
            onRestoreVersion={(version) => restoreMutation.mutate(version)}
            onDownload={download}
          />
        </aside>
      </div>

      <ComponentLibrary open={libraryOpen} onClose={() => setLibraryOpen(false)} onAdd={addSection} />

      {previewOpen && publicInvitation ? (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-[var(--w-page-bg)]">
          <div className="fixed right-4 top-4 z-[100] flex items-center gap-1 rounded-full border border-white/15 bg-[#1d1714]/90 p-1.5 text-cream shadow-2xl backdrop-blur">
            {(
              [
                ['desktop', Monitor, 'Desktop'],
                ['tablet', Tablet, 'Tablet'],
                ['mobile', Smartphone, 'Mobile'],
              ] as const
            ).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDevice(value)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition',
                  device === value ? 'bg-gold text-ink' : 'text-cream/60 hover:bg-white/10 hover:text-cream',
                )}
                aria-label={`Preview on ${label}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-white/15" />
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-cream/70 transition hover:bg-white/10 hover:text-cream"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div
            className="mx-auto min-h-[100dvh] bg-[var(--w-page-bg)] shadow-2xl"
            style={{ width: deviceMeta.width, maxWidth: '100%' }}
          >
            <InvitationSite invitation={publicInvitation} preview startOpened={false} forceEnvelope />
          </div>
        </div>
      ) : null}

      <Modal
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        title="Design actions"
        description="Everything here acts on this save slot."
        size="sm"
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
            className="flex w-full items-center justify-between rounded-xl border border-ink/10 bg-cream/60 px-3 py-3 text-left transition hover:border-gold hover:bg-gold/[0.06] disabled:opacity-50"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">Duplicate this design</span>
              <span className="mt-0.5 block text-[0.65rem] text-ink/45">Create another save slot from the current state.</span>
            </span>
            <Check className="h-4 w-4 text-gold" />
          </button>
          <button
            type="button"
            onClick={download}
            disabled={downloading}
            className="flex w-full items-center justify-between rounded-xl border border-ink/10 bg-cream/60 px-3 py-3 text-left transition hover:border-gold hover:bg-gold/[0.06] disabled:opacity-50"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">Download website (.html)</span>
              <span className="mt-0.5 block text-[0.65rem] text-ink/45">The full site — envelope, every section, gallery and RSVP — in one file.</span>
            </span>
            <Download className="h-4 w-4 text-gold" />
          </button>
          <a
            href={invitationPublicUrl(invitation.slug)}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-between rounded-xl border border-ink/10 bg-cream/60 px-3 py-3 text-left transition hover:border-gold hover:bg-gold/[0.06]"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">Open the live invitation</span>
              <span className="mt-0.5 block text-[0.65rem] text-ink/45">See the active design on the public site.</span>
            </span>
            <Eye className="h-4 w-4 text-gold" />
          </a>
          <button
            type="button"
            onClick={() => {
              setActionsOpen(false)
              setDeleteOpen(true)
            }}
            disabled={designs.length <= 1}
            className="flex w-full items-center justify-between rounded-xl border border-[#9b3434]/20 bg-[#9b3434]/[0.05] px-3 py-3 text-left transition hover:border-[#9b3434]/40 disabled:opacity-40"
          >
            <span>
              <span className="block text-sm font-semibold text-[#8c2d2d]">Delete this design</span>
              <span className="mt-0.5 block text-[0.65rem] text-ink/45">
                {designs.length <= 1 ? 'Keep at least one design for this invitation.' : 'This save slot will be removed.'}
              </span>
            </span>
            <X className="h-4 w-4 text-[#8c2d2d]" />
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDesignId)}
        onClose={() => setPendingDesignId(null)}
        onConfirm={() => {
          if (pendingDesignId) switchDesign(pendingDesignId)
          setPendingDesignId(null)
        }}
        title="Discard unsaved changes?"
        description="Switching designs will discard the changes you have not saved. Save a draft first if you want to keep them."
        confirmLabel="Discard & switch"
      />

      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => navigate(`/admin/invitations/${invitationId}/edit?tab=designs`)}
        title="Leave the studio?"
        description="You have unsaved changes. Leaving now will discard them."
        confirmLabel="Leave studio"
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete this design?"
        description={`“${designName || 'This design'}” will be removed from the library. This cannot be undone.`}
        confirmLabel="Delete design"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
