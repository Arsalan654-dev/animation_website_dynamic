export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor'
  is_active: boolean
  created_at?: string
}

export interface LoginResponse {
  user: User
  token: string
  expires_at: string | null
}

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  surface: string
  surfaceAlt: string
  text: string
  muted: string
  line: string
  onPrimary: string
}

export interface ThemeTypography {
  headingFont: string
  bodyFont: string
  scriptFont: string
  baseSize: number
  headingWeight: number
  bodyWeight: number
  headingScale: number
  bodyLineHeight: number
  letterSpacing: number
}

export interface ThemeSurfaces {
  pageBackground: string
  cardBackground: string
  cardBorder: string
  cardRadius: number
  paperTexture: 'grain' | 'linen' | 'plain'
  paperTextureOpacity: number
  shadow: 'soft' | 'deep' | 'none'
  sectionSpacing: number
  contentWidth: number
}

export interface ThemeButtons {
  radius: number
  style: 'outline' | 'fill' | 'text'
  letterSpacing: number
  textTransform: 'uppercase' | 'none' | 'capitalize'
}

export interface ThemeOrnaments {
  divider: 'botanical' | 'line' | 'diamond' | 'none'
  corner: 'branch' | 'floral' | 'none'
  overlayMediaId: number | null
}

export interface ThemeLayout {
  imageAspect: string
  gallery: 'masonry' | 'grid'
  align: 'left' | 'center'
}

export interface ThemeTokens {
  colors: ThemeColors
  typography: ThemeTypography
  surfaces: ThemeSurfaces
  buttons: ThemeButtons
  ornaments: ThemeOrnaments
  layout: ThemeLayout
  animation: {
    preset: string | null
    disabled: boolean
  }
}

export type AnimationType = 'fade_up' | 'stagger' | 'zoom' | 'parallax' | 'slide' | 'envelope'

export interface AnimationConfig {
  duration?: number
  delay?: number
  easing?: 'easeOut' | 'easeIn' | 'easeInOut' | 'linear' | 'spring'
  distance?: number
  scale?: number
  stagger?: number
  once?: boolean
  direction?: 'up' | 'down' | 'left' | 'right'
  parallax?: number
  mobile?: boolean
  reduced_motion?: 'fade' | 'none'
  disabled?: boolean
  overrides?: Omit<AnimationConfig, 'overrides'>
  [key: string]: unknown
}

export interface AnimationPreset {
  id: number
  name: string
  slug: string
  description: string | null
  type: AnimationType
  defaults: AnimationConfig
  config_schema: AnimationSchemaField[] | null
  is_active: boolean
  usage_count?: number
  created_at?: string
  updated_at?: string
}

export interface AnimationSchemaField {
  key: string
  label: string
  type: 'number' | 'select' | 'boolean'
  min?: number
  max?: number
  step?: number
  options?: string[]
}

export interface ResolvedAnimation {
  enabled: boolean
  preset_slug: string
  preset_type: AnimationType
  name: string
  config: AnimationConfig
}

export interface Theme {
  id: number
  name: string
  slug: string
  description: string | null
  preview_image_path: string | null
  preview_image_url: string | null
  tokens: ThemeTokens
  default_animation_preset_id: number | null
  default_animation_preset?: AnimationPreset | null
  is_active: boolean
  invitations_count?: number
  created_at?: string
  updated_at?: string
}

export type SectionHoverEffect = 'none' | 'lift' | 'zoom' | 'glow'

export interface SectionDesign {
  background_color?: string
  text_color?: string
  padding_y?: number
  max_width?: number
  background_image?: MediaRef | null
  overlay?: number
  align?: 'left' | 'center'
  hover_effect?: SectionHoverEffect
  hide_on_mobile?: boolean
  hide_on_tablet?: boolean
  hide_on_desktop?: boolean
  [key: string]: unknown
}

export interface TemplateSection {
  type: string
  title?: string | null
  content?: SectionContent
  design?: SectionDesign | null
  animation_config?: AnimationConfig | null
  is_visible?: boolean
  sort_order?: number
}

export interface Template {
  id: number
  name: string
  slug: string
  description: string | null
  category: string
  thumbnail_path: string | null
  thumbnail_url: string | null
  default_theme_id: number | null
  default_theme?: Theme | null
  layout: { sections?: TemplateSection[] } | TemplateSection[]
  is_active: boolean
  invitations_count?: number
  created_at?: string
  updated_at?: string
}

export interface MediaRef {
  mediaId?: number | null
  url?: string
  alt?: string | null
  caption?: string | null
  width?: number | null
  height?: number | null
}

export interface TimelineEntry {
  date?: string
  title?: string
  text?: string
}

export interface GalleryImage extends MediaRef {
  caption?: string
}

export interface PartyMember {
  name: string
  role?: string
  bio?: string
  mediaId?: number | null
  url?: string
  alt?: string
}

export interface LinkEntry {
  label: string
  url: string
}

export interface HotelEntry {
  name: string
  description?: string
  address?: string
  url?: string
}

export interface ContactEntry {
  name: string
  role?: string
  phone?: string
  email?: string
}

export interface SectionContent {
  eyebrow?: string
  heading?: string
  subheading?: string
  intro?: string
  body?: string
  message?: string
  note?: string
  quote?: string
  attribution?: string
  signature?: string
  date_label?: string
  notes?: string
  completed_message?: string
  success_message?: string
  name?: string
  address?: string
  map_url?: string
  map_embed?: string
  overlay_opacity?: number
  show_countdown?: boolean
  show_all?: boolean
  align?: 'left' | 'center'
  layout?: 'masonry' | 'grid'
  image_position?: 'left' | 'right'
  provider?: 'youtube' | 'vimeo'
  video_url?: string
  caption?: string
  background?: MediaRef
  image?: MediaRef
  primary_cta?: { label?: string; href?: string }
  cta?: { label?: string; href?: string }
  images?: GalleryImage[]
  timeline?: TimelineEntry[]
  members?: PartyMember[]
  links?: LinkEntry[]
  hotels?: HotelEntry[]
  contacts?: ContactEntry[]
  [key: string]: unknown
}

export interface InvitationSection {
  id: number
  invitation_id: number
  type: string
  title: string | null
  content: SectionContent
  design: SectionDesign | null
  animation_preset_id: number | null
  animation_preset?: AnimationPreset | null
  animation_config: AnimationConfig | null
  sort_order: number
  is_visible: boolean
  created_at?: string
  updated_at?: string
}

export interface PublicSection {
  id: number
  type: string
  title: string | null
  content: SectionContent
  design: SectionDesign | null
  is_visible: boolean
  sort_order: number
  animation: ResolvedAnimation | null
  /** Client-only key used by the studio canvas; ignored by the public renderer. */
  studioKey?: string
}

export interface DatePayload {
  iso: string
  local_iso: string
  date: string
  time: string
  formatted: string
  short_date: string
  time_formatted: string
  day: string
  month: string
  year: string
  timezone: string
}

export interface InvitationEvent {
  id: number
  title: string
  description: string | null
  event_at: string | null
  event_at_local?: string | null
  date: DatePayload | null
  timezone: string
  venue_name: string | null
  venue_address: string | null
  map_url: string | null
  dress_code: string | null
  image_media_id: number | null
  image?: MediaAsset | null
  rsvp_enabled: boolean
  sort_order: number
}

export interface CoupleDetails {
  partner_one: string
  partner_two: string
  title?: string | null
  subtitle?: string | null
  hashtag?: string | null
  quote?: string | null
  message?: string | null
  families?: string | null
  story_heading?: string | null
  story_body?: string | null
  story_image_id?: number | null
  [key: string]: unknown
}

export interface RsvpQuestion {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select'
  required: boolean
  options: string[]
}

export interface RsvpSettings {
  enabled: boolean
  deadline: string | null
  max_guests_per_submission: number
  allow_decline: boolean
  require_guest_code: boolean
  collect_phone: boolean
  questions: RsvpQuestion[]
  success_message: string | null
}

export interface EnvelopeConfig {
  enabled: boolean
  style: string
  monogram: string
  seal_text: string
  prompt: string
  cover_media_id: number | null
  card_media_id: number | null
  seal_media_id: number | null
  card_message: string
  cover_image?: MediaRef | null
  card_image?: MediaRef | null
  seal_image?: MediaRef | null
}

export interface DesignEffects {
  scroll_reveal: boolean
  hover_lift: boolean
  image_zoom: boolean
  parallax: boolean
  grain: boolean
  sticky_nav: boolean
  scroll_progress: boolean
  cursor_glow: boolean
}

export interface DesignPage {
  background_image: MediaRef | null
  overlay: number
  nav_style: 'glass' | 'solid' | 'transparent'
}

export interface DesignConfig {
  animation?: {
    preset?: string | null
    disabled?: boolean
    overrides?: AnimationConfig
  }
  theme_tokens?: Partial<ThemeTokens>
  effects?: Partial<DesignEffects>
  page?: Partial<DesignPage>
  custom_css?: string
}

export interface DesignSnapshotSection {
  type: string
  title: string | null
  content: SectionContent
  design: SectionDesign | null
  animation_preset_id: number | null
  animation_config: AnimationConfig | null
  sort_order: number
  is_visible: boolean
  /** Client-only stable key used by the studio. */
  studioKey?: string
}

export interface DesignSnapshot {
  theme_id: number | null
  design_config: DesignConfig
  envelope: EnvelopeConfig
  cover_image_path: string | null
  sections: DesignSnapshotSection[]
}

export interface InvitationDesignSummary {
  id: number
  invitation_id: number
  name: string
  description: string | null
  is_active: boolean
  version: number
  section_count: number
  theme_id: number | null
  cover_image_path: string | null
  published_at: string | null
  created_at: string | null
  updated_at: string | null
  invitation?: {
    id: number
    title: string
    slug: string
    status: string
  } | null
  creator?: { id: number; name: string } | null
  updater?: { id: number; name: string } | null
}

export interface InvitationDesign extends InvitationDesignSummary {
  snapshot: DesignSnapshot
  versions_count?: number
}

export interface InvitationDesignVersion {
  id: number
  version: number
  label: string | null
  created_at: string | null
  created_by?: { id: number; name: string } | null
  snapshot?: DesignSnapshot
}

export interface InvitationStats {
  rsvps_count: number
  attending_count: number
  confirmed_guests: number
  guests_count: number
}

export interface InvitationSummary {
  id: number
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  theme_id: number | null
  theme?: Theme | null
  template_id: number | null
  cover_image_path?: string | null
  couple_details: CoupleDetails
  event: DatePayload | null
  timezone: string
  venue_name: string | null
  published_at: string | null
  sections_count?: number
  rsvps_count?: number
  confirmed_guests?: number
  public_url: string
  updated_at?: string
}

export interface Invitation extends InvitationSummary {
  cover_image_path: string | null
  envelope: EnvelopeConfig
  event_at: string | null
  event_at_local: string | null
  venue_address: string | null
  venue_map_url: string | null
  venue_map_embed: string | null
  rsvp_settings: RsvpSettings
  rsvp_open: boolean
  design_config: DesignConfig
  archived_at: string | null
  sections: InvitationSection[]
  events: InvitationEvent[]
  media_assets?: MediaAsset[]
  stats?: InvitationStats
  template?: Template | null
  created_at?: string
}

export interface MediaAsset {
  id: number
  url: string
  disk: string
  path: string
  original_name: string
  mime_type: string
  size: number
  width: number | null
  height: number | null
  alt_text: string | null
  caption: string | null
  is_image: boolean
  created_at?: string
}

export interface PublicEvent {
  id: number
  title: string
  description: string | null
  date: DatePayload | null
  timezone: string
  venue_name: string | null
  venue_address: string | null
  map_url: string | null
  dress_code: string | null
  rsvp_enabled: boolean
  image: MediaRef | null
}

export interface PublicInvitation {
  id: number
  title: string
  slug: string
  status: string
  published_at: string | null
  cover_image: string | null
  theme: {
    id: number | null
    name: string
    slug: string
    tokens: ThemeTokens
    preview_image_url: string | null
  }
  couple: CoupleDetails
  monogram: string
  event: DatePayload | null
  venue: {
    name: string | null
    address: string | null
    map_url: string | null
    map_embed: string | null
  }
  envelope: EnvelopeConfig
  design: DesignConfig
  events: PublicEvent[]
  sections: PublicSection[]
  rsvp: {
    enabled: boolean
    open: boolean
    deadline: string | null
    deadline_passed: boolean
    max_guests_per_submission: number
    allow_decline: boolean
    require_guest_code: boolean
    collect_phone: boolean
    questions: RsvpQuestion[]
    success_message: string | null
  }
  animations_enabled: boolean
  site_name: string
}

export interface RsvpSubmission {
  id: number
  invitation_id: number
  invitation?: { id: number; title: string; slug: string }
  guest_name: string
  email: string | null
  phone: string | null
  attendance: 'attending' | 'declined'
  guest_count: number
  message: string | null
  answers: Record<string, string> | null
  guest_code: string | null
  source: string
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface InvitationGuest {
  id: number
  invitation_id: number
  name: string
  email: string | null
  phone: string | null
  code: string
  max_guests: number
  is_allowed: boolean
  notes: string | null
  rsvp_submission_id: number | null
  invitation_link: string
  created_at: string
}

export interface Activity {
  id: number
  type: string
  description: string
  meta: Record<string, unknown> | null
  user?: { id: number; name: string }
  invitation?: { id: number; title: string; slug: string } | null
  created_at: string
}

export interface DashboardMetrics {
  invitations: { total: number; draft: number; published: number; archived: number }
  rsvps: {
    total: number
    attending_responses: number
    declined_responses: number
    confirmed_guests: number
  }
  attendance_rate: number
  recent_rsvps: RsvpSubmission[]
  recent_activity: Activity[]
  invitation_breakdown: Array<{
    id: number
    title: string
    slug: string
    status: string
    rsvps_count: number
    attending_responses_count: number
    confirmed_guests: number
  }>
}

export interface RsvpSummary {
  total_responses: number
  attending_responses: number
  declined_responses: number
  confirmed_guests: number
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface Settings {
  animations_enabled: boolean
  site_name: string
}

export interface ApiEnvelope<T> {
  data: T
  message?: string
  preview?: boolean
}
