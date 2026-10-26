import { defaultThemeTokens, mergeThemeTokens } from '@/lib/theme'
import { asSections, assetUrl } from '@/lib/utils'
import { newSection } from '@/lib/componentRegistry'
import type {
  AnimationConfig,
  AnimationPreset,
  DesignConfig,
  DesignEffects,
  DesignPage,
  DesignSnapshot,
  DesignSnapshotSection,
  EnvelopeConfig,
  Invitation,
  InvitationDesign,
  MediaAsset,
  MediaRef,
  PublicEvent,
  PublicInvitation,
  PublicSection,
  ResolvedAnimation,
  SectionDesign,
  Settings,
  Template,
  Theme,
  ThemeTokens,
} from '@/types'

export const defaultDesignEffects: DesignEffects = {
  scroll_reveal: true,
  hover_lift: true,
  image_zoom: true,
  parallax: false,
  grain: true,
  sticky_nav: true,
  scroll_progress: false,
  cursor_glow: false,
}

export const defaultDesignPage: DesignPage = {
  background_image: null,
  overlay: 0,
  nav_style: 'glass',
}

export const defaultAnimationConfig: AnimationConfig = {
  duration: 0.8,
  delay: 0.05,
  easing: 'easeOut',
  distance: 40,
  scale: 1,
  stagger: 0.12,
  once: true,
  direction: 'up',
  parallax: 0.18,
  mobile: true,
  reduced_motion: 'fade',
}

export const defaultEnvelope: EnvelopeConfig = {
  enabled: true,
  style: 'classic',
  monogram: '',
  seal_text: '',
  prompt: 'Open the invitation',
  cover_media_id: null,
  card_media_id: null,
  seal_media_id: null,
  card_message: 'Together with their families',
}

export function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function normalizeDesignConfig(config?: DesignConfig | null): DesignConfig {
  const source = config ?? {}
  const animation = source.animation ?? {}
  const effects = { ...defaultDesignEffects, ...(source.effects ?? {}) }
  const page = { ...defaultDesignPage, ...(source.page ?? {}) }

  return {
    ...source,
    animation: {
      preset: animation.preset ?? 'fade-up',
      disabled: animation.disabled ?? false,
      overrides: animation.overrides ?? {},
    },
    theme_tokens: source.theme_tokens ?? {},
    effects,
    page,
    custom_css: source.custom_css ?? '',
  }
}

export function normalizeSnapshot(snapshot?: Partial<DesignSnapshot> | null): DesignSnapshot {
  const sections = Array.isArray(snapshot?.sections) ? snapshot.sections : []

  return {
    theme_id: snapshot?.theme_id ?? null,
    design_config: normalizeDesignConfig(snapshot?.design_config),
    envelope: { ...defaultEnvelope, ...(snapshot?.envelope ?? {}) },
    cover_image_path: snapshot?.cover_image_path ?? null,
    sections: sections
      .map((section, index) => ({
        type: section.type,
        title: section.title ?? null,
        content: section.content ?? {},
        design: section.design ?? null,
        animation_preset_id: section.animation_preset_id ?? null,
        animation_config: section.animation_config ?? null,
        sort_order: index,
        is_visible: section.is_visible ?? true,
        studioKey: section.studioKey ?? `section-${section.type}-${index}`,
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  }
}

export function designSnapshotFromInvitation(invitation: Invitation): DesignSnapshot {
  return normalizeSnapshot({
    theme_id: invitation.theme_id,
    design_config: invitation.design_config,
    envelope: invitation.envelope,
    cover_image_path: invitation.cover_image_path,
    sections: [...(invitation.sections ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((section) => ({
        type: section.type,
        title: section.title,
        content: section.content,
        design: section.design,
        animation_preset_id: section.animation_preset_id,
        animation_config: section.animation_config,
        sort_order: section.sort_order,
        is_visible: section.is_visible,
        studioKey: `section-${section.id}`,
      })),
  })
}

export function snapshotFromDesign(design: InvitationDesign): DesignSnapshot {
  return normalizeSnapshot(design.snapshot)
}

function hydrateMediaValue<T>(value: T, assets: Map<number, MediaAsset>): T {
  if (Array.isArray(value)) {
    return value.map((item) => hydrateMediaValue(item, assets)) as T
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  const source = value as Record<string, unknown>
  const next: Record<string, unknown> = { ...source }
  const mediaId = typeof source.mediaId === 'number' ? source.mediaId : null
  const asset = mediaId ? assets.get(mediaId) : null

  if (asset) {
    next.url = next.url ?? asset.url
    next.alt = next.alt ?? asset.alt_text
    next.width = next.width ?? asset.width
    next.height = next.height ?? asset.height
  }

  for (const [key, item] of Object.entries(next)) {
    if (item && typeof item === 'object') {
      next[key] = hydrateMediaValue(item, assets)
    }
  }

  return next as T
}

function mediaRefFromAsset(asset?: MediaAsset | null): MediaRef | null {
  if (!asset) return null
  return {
    mediaId: asset.id,
    url: asset.url,
    alt: asset.alt_text,
    width: asset.width,
    height: asset.height,
  }
}

function envelopeImages(envelope: EnvelopeConfig, assets: Map<number, MediaAsset>): EnvelopeConfig {
  const cover = envelope.cover_media_id ? assets.get(envelope.cover_media_id) : null
  const card = envelope.card_media_id ? assets.get(envelope.card_media_id) : null
  const seal = envelope.seal_media_id ? assets.get(envelope.seal_media_id) : null

  return {
    ...envelope,
    cover_image: envelope.cover_image ?? mediaRefFromAsset(cover),
    card_image: envelope.card_image ?? mediaRefFromAsset(card),
    seal_image: envelope.seal_image ?? mediaRefFromAsset(seal),
  }
}

function animationOverrides(config?: AnimationConfig | null): AnimationConfig {
  if (!config) return {}
  const nested = config.overrides && typeof config.overrides === 'object' ? config.overrides : {}
  const rest = { ...config }
  delete rest.preset
  delete rest.preset_slug
  delete rest.disabled
  delete rest.overrides
  return { ...rest, ...nested }
}

function resolveAnimation({
  section,
  theme,
  presets,
  invitationConfig,
  themeConfig,
  animationsEnabled,
}: {
  section: DesignSnapshotSection
  theme: Theme | undefined
  presets: AnimationPreset[]
  invitationConfig: DesignConfig['animation']
  themeConfig: ThemeTokens['animation']
  animationsEnabled: boolean
}): ResolvedAnimation {
  const themePreset =
    theme?.default_animation_preset ??
    presets.find((preset) => preset.id === theme?.default_animation_preset_id) ??
    presets.find((preset) => preset.slug === (themeConfig.preset ?? 'fade-up'))

  const invitationPreset = invitationConfig?.preset
    ? presets.find((preset) => preset.slug === invitationConfig.preset)
    : null

  const sectionPreset = section.animation_preset_id
    ? presets.find((preset) => preset.id === section.animation_preset_id)
    : null

  const preset =
    sectionPreset ??
    invitationPreset ??
    themePreset ??
    presets.find((item) => item.slug === 'fade-up') ??
    null

  const resolved = {
    ...defaultAnimationConfig,
    ...(preset?.defaults ?? {}),
    ...animationOverrides(themeConfig),
    ...animationOverrides(invitationConfig),
    ...animationOverrides(section.animation_config),
  }

  const disabled =
    !animationsEnabled ||
    Boolean(themeConfig.disabled) ||
    Boolean(invitationConfig?.disabled) ||
    Boolean(section.animation_config?.disabled)

  return {
    enabled: !disabled,
    preset_slug: preset?.slug ?? 'fade-up',
    preset_type: preset?.type ?? 'fade_up',
    name: preset?.name ?? 'Fade Up',
    config: resolved,
  }
}

export function buildPublicInvitationFromDesign({
  invitation,
  snapshot: rawSnapshot,
  themes,
  presets,
  mediaAssets,
  settings,
}: {
  invitation: Invitation
  snapshot: DesignSnapshot
  themes: Theme[]
  presets: AnimationPreset[]
  mediaAssets: MediaAsset[]
  settings?: Settings | null
}): PublicInvitation {
  const snapshot = normalizeSnapshot(rawSnapshot)
  const designConfig = snapshot.design_config
  const theme = themes.find((item) => item.id === snapshot.theme_id) ?? themes[0]
  const tokens = mergeThemeTokens(theme?.tokens ?? defaultThemeTokens, designConfig.theme_tokens)
  const assets = new Map(mediaAssets.map((asset) => [asset.id, asset]))
  const hydrated = hydrateMediaValue(snapshot, assets)
  const envelope = envelopeImages({ ...defaultEnvelope, ...(hydrated.envelope ?? {}) }, assets)
  const animationsEnabled = settings?.animations_enabled ?? true
  const themeConfig = tokens.animation ?? defaultThemeTokens.animation

  const sections: PublicSection[] = hydrated.sections.map((section, index) => ({
    id: index + 1,
    type: section.type,
    title: section.title,
    content: section.content,
    design: section.design,
    is_visible: section.is_visible,
    sort_order: index,
    studioKey: section.studioKey ?? `section-${index}`,
    animation: resolveAnimation({
      section,
      theme,
      presets,
      invitationConfig: designConfig.animation,
      themeConfig,
      animationsEnabled,
    }),
  }))

  const events: PublicEvent[] = (invitation.events ?? []).map((event) => {
    const image =
      event.image ??
      (event.image_media_id ? mediaAssets.find((asset) => asset.id === event.image_media_id) : null) ??
      null

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      timezone: event.timezone,
      venue_name: event.venue_name,
      venue_address: event.venue_address,
      map_url: event.map_url,
      dress_code: event.dress_code,
      rsvp_enabled: event.rsvp_enabled,
      image: mediaRefFromAsset(image),
    }
  })

  const rsvpSettings = invitation.rsvp_settings
  const deadline = rsvpSettings?.deadline ?? null
  const deadlinePassed = deadline ? new Date(deadline).getTime() < Date.now() : false
  const rsvpOpen = Boolean(invitation.rsvp_open && rsvpSettings?.enabled && !deadlinePassed)

  return {
    id: invitation.id,
    title: invitation.title,
    slug: invitation.slug,
    status: invitation.status,
    published_at: invitation.published_at,
    cover_image: assetUrl(snapshot.cover_image_path),
    theme: {
      id: theme?.id ?? null,
      name: theme?.name ?? 'Classic',
      slug: theme?.slug ?? 'classic',
      tokens,
      preview_image_url: theme?.preview_image_url ?? assetUrl(theme?.preview_image_path),
    },
    couple: invitation.couple_details,
    monogram: envelope.monogram,
    event: invitation.event,
    venue: {
      name: invitation.venue_name,
      address: invitation.venue_address,
      map_url: invitation.venue_map_url,
      map_embed: invitation.venue_map_embed,
    },
    envelope,
    design: designConfig,
    events,
    sections,
    rsvp: {
      enabled: Boolean(rsvpSettings?.enabled),
      open: rsvpOpen,
      deadline,
      deadline_passed: deadlinePassed,
      max_guests_per_submission: rsvpSettings?.max_guests_per_submission ?? 6,
      allow_decline: rsvpSettings?.allow_decline ?? true,
      require_guest_code: rsvpSettings?.require_guest_code ?? false,
      collect_phone: rsvpSettings?.collect_phone ?? true,
      questions: rsvpSettings?.questions ?? [],
      success_message: rsvpSettings?.success_message ?? null,
    },
    animations_enabled: animationsEnabled,
    site_name: settings?.site_name ?? 'Ever After Studio',
  }
}

export function applyThemeToSnapshot(snapshot: DesignSnapshot, theme: Theme): DesignSnapshot {
  return {
    ...snapshot,
    theme_id: theme.id,
    design_config: {
      ...snapshot.design_config,
      theme_tokens: {},
      animation: {
        ...snapshot.design_config.animation,
        preset: theme.tokens.animation.preset ?? snapshot.design_config.animation?.preset ?? 'fade-up',
      },
    },
  }
}

export function applyTemplateToSnapshot(
  snapshot: DesignSnapshot,
  template: Template,
  mode: 'preserve' | 'replace',
): DesignSnapshot {
  const current = [...snapshot.sections]
  const used = new Set<number>()
  const templateSections = asSections(template.layout) as Array<Record<string, unknown>>

  const next: DesignSnapshotSection[] = templateSections.map((raw, index) => {
    const type = typeof raw.type === 'string' ? raw.type : 'text'
    const matchIndex =
      mode === 'preserve'
        ? current.findIndex((section, sectionIndex) => !used.has(sectionIndex) && section.type === type)
        : -1

    if (matchIndex >= 0) {
      used.add(matchIndex)
      const match = current[matchIndex]
      return {
        ...match,
        sort_order: index,
        is_visible: match.is_visible,
        studioKey: match.studioKey ?? `section-${type}-${index}`,
      }
    }

    const created = newSection(type)
    return {
      ...created,
      title: (raw.title as string | null | undefined) ?? created.title,
      content: (raw.content as DesignSnapshotSection['content'] | undefined) ?? created.content,
      design: (raw.design as SectionDesign | null | undefined) ?? created.design,
      animation_config: (raw.animation_config as AnimationConfig | null | undefined) ?? null,
      is_visible: (raw.is_visible as boolean | undefined) ?? true,
      sort_order: index,
      studioKey: created.studioKey,
    }
  })

  if (mode === 'preserve') {
    current.forEach((section, index) => {
      if (!used.has(index)) {
        next.push({ ...section, sort_order: next.length })
      }
    })
  }

  const themeId =
    mode === 'replace' && template.default_theme_id ? template.default_theme_id : snapshot.theme_id

  return normalizeSnapshot({
    ...snapshot,
    theme_id: themeId,
    sections: next,
  })
}

export function updateSectionAt(
  snapshot: DesignSnapshot,
  studioKey: string,
  updater: (section: DesignSnapshotSection) => DesignSnapshotSection,
): DesignSnapshot {
  return {
    ...snapshot,
    sections: snapshot.sections.map((section) =>
      section.studioKey === studioKey ? updater(section) : section,
    ),
  }
}
