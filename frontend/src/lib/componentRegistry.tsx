import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  CalendarDays,
  Clock,
  Columns2,
  Gift,
  Heart,
  Images,
  LayoutTemplate,
  MailOpen,
  MapPin,
  Minus,
  Phone,
  Plane,
  Play,
  Send,
  Sparkles,
  Type,
  Users,
} from 'lucide-react'
import { SECTION_LIBRARY } from '@/lib/constants'
import type { SectionContent, SectionDesign } from '@/types'

export type ComponentCategory = 'Opening' | 'Story' | 'Celebration' | 'Guests' | 'Design' | 'Global'

export type ComponentFieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'color'
  | 'number'
  | 'switch'
  | 'select'
  | 'image'
  | 'gallery'
  | 'list'

export interface ComponentField {
  key: string
  label: string
  type: ComponentFieldType
  placeholder?: string
  hint?: string
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: string; label: string }>
  itemLabel?: string
  itemFields?: ComponentField[]
  defaultItem?: Record<string, unknown>
  aspect?: 'square' | 'video' | 'portrait' | 'wide'
}

export interface ComponentElement {
  key: string
  label: string
}

export interface ComponentDefinition {
  type: string
  label: string
  description: string
  category: ComponentCategory
  icon: LucideIcon
  /** Global pieces are edited in the page panel instead of the section list. */
  global?: boolean
  defaults: {
    title?: string
    content: SectionContent
    design?: SectionDesign
    animation?: Record<string, unknown>
  }
  fields: ComponentField[]
  elements?: ComponentElement[]
  supports: {
    animation: boolean
    visibility: boolean
    background: boolean
    layout: boolean
    responsive: boolean
  }
}

function baseContent(type: string): SectionContent {
  const item = SECTION_LIBRARY.find((entry) => entry.type === type)
  return item ? JSON.parse(JSON.stringify(item.content)) : {}
}

const text = (key: string, label: string, placeholder?: string): ComponentField => ({
  key,
  label,
  type: 'text',
  placeholder,
})

const textarea = (key: string, label: string, placeholder?: string): ComponentField => ({
  key,
  label,
  type: 'textarea',
  placeholder,
})

const image = (key: string, label: string, aspect: ComponentField['aspect'] = 'wide'): ComponentField => ({
  key,
  label,
  type: 'image',
  aspect,
})

const toggle = (key: string, label: string, hint?: string): ComponentField => ({
  key,
  label,
  type: 'switch',
  hint,
})

const number = (key: string, label: string, min: number, max: number, step = 1): ComponentField => ({
  key,
  label,
  type: 'number',
  min,
  max,
  step,
})

const select = (key: string, label: string, options: Array<{ value: string; label: string }>): ComponentField => ({
  key,
  label,
  type: 'select',
  options,
})

const ctaFields: ComponentField[] = [
  text('cta.label', 'Button label', 'Read more'),
  text('cta.href', 'Button link', '#'),
]

const timelineFields: ComponentField[] = [
  text('date', 'Date or year', '2022'),
  text('title', 'Title', 'The first hello'),
  textarea('text', 'Details', 'Where it all began.'),
]

const memberFields: ComponentField[] = [
  image('url', 'Portrait', 'portrait'),
  text('name', 'Name', 'Name'),
  text('role', 'Role', 'Maid of Honour'),
  textarea('bio', 'A short note', 'A line about them.'),
]

const linkFields: ComponentField[] = [
  text('label', 'Label', 'Registry'),
  text('url', 'URL', 'https://'),
]

const hotelFields: ComponentField[] = [
  text('name', 'Hotel', 'The Grand'),
  textarea('description', 'Description', 'A short note about the stay.'),
  text('address', 'Address', 'Street, city'),
  text('url', 'Booking URL', 'https://'),
]

const contactFields: ComponentField[] = [
  text('name', 'Name', 'Name'),
  text('role', 'Role', 'Wedding planner'),
  text('phone', 'Phone', '+92 300 0000000'),
  text('email', 'Email', 'hello@example.com'),
]

export const COMPONENT_REGISTRY: ComponentDefinition[] = [
  {
    type: 'envelope',
    label: 'Envelope & wax seal',
    description: 'The opening moment, wax seal and envelope artwork.',
    category: 'Opening',
    icon: MailOpen,
    global: true,
    defaults: { content: {} },
    fields: [],
    supports: { animation: true, visibility: false, background: false, layout: false, responsive: false },
  },
  {
    type: 'hero',
    label: 'Hero & cover',
    description: 'The opening names, date and full-height cover image.',
    category: 'Opening',
    icon: Sparkles,
    defaults: { content: baseContent('hero') },
    fields: [
      text('eyebrow', 'Eyebrow', 'Together with their families'),
      text('heading', 'Names', 'Ayesha & Hamza'),
      text('subheading', 'Subheading', 'invite you to celebrate their wedding'),
      text('date_label', 'Date label', 'Saturday, 12 December'),
      image('background', 'Cover image', 'wide'),
      number('overlay_opacity', 'Image overlay', 0, 0.9, 0.05),
      toggle('show_countdown', 'Show countdown'),
      text('primary_cta.label', 'Button label', 'RSVP'),
      text('primary_cta.href', 'Button link', '#rsvp'),
    ],
    elements: [
      { key: 'eyebrow', label: 'Eyebrow' },
      { key: 'heading', label: 'Names' },
      { key: 'subheading', label: 'Subheading' },
      { key: 'date', label: 'Date and venue' },
      { key: 'countdown', label: 'Countdown' },
      { key: 'cta', label: 'Buttons' },
      { key: 'background', label: 'Cover image' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'story',
    label: 'Couple story',
    description: 'A split image and letter, with an optional timeline.',
    category: 'Story',
    icon: BookOpen,
    defaults: { content: baseContent('story') },
    fields: [
      text('eyebrow', 'Eyebrow', 'Our beginning'),
      text('heading', 'Heading', 'Our Story'),
      textarea('intro', 'Introduction', 'A short introduction to the two of you.'),
      textarea('body', 'Story', 'Tell the story of how you met...'),
      image('image', 'Portrait', 'portrait'),
      select('image_position', 'Image position', [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ]),
      text('signature', 'Signature', 'With love'),
      {
        key: 'timeline',
        label: 'Timeline',
        type: 'list',
        itemLabel: 'Moment',
        itemFields: timelineFields,
        defaultItem: { date: '2022', title: 'The first hello', text: 'Where it all began.' },
        hint: 'Add the moments that shaped your story.',
      },
    ],
    elements: [
      { key: 'image', label: 'Portrait' },
      { key: 'heading', label: 'Heading' },
      { key: 'body', label: 'Story' },
      { key: 'timeline', label: 'Timeline' },
      { key: 'signature', label: 'Signature' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'quote',
    label: 'Quote card',
    description: 'A quiet editorial moment for a favourite line.',
    category: 'Story',
    icon: Heart,
    defaults: { content: baseContent('quote') },
    fields: [
      textarea('quote', 'Quote', 'I have found the one whom my soul loves.'),
      text('attribution', 'Attribution', 'Song of Solomon'),
    ],
    elements: [
      { key: 'quote', label: 'Quote' },
      { key: 'attribution', label: 'Attribution' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'events',
    label: 'Events & schedule',
    description: 'All of your ceremonies, with times, venues and dress codes.',
    category: 'Celebration',
    icon: CalendarDays,
    defaults: { content: baseContent('events') },
    fields: [
      text('eyebrow', 'Eyebrow', 'The celebrations'),
      text('heading', 'Heading', 'The Celebrations'),
      textarea('intro', 'Introduction', 'Join us for the moments that make up our wedding week.'),
      textarea('note', 'Closing note', 'Directions and timing details are included with each event.'),
    ],
    elements: [
      { key: 'heading', label: 'Heading' },
      { key: 'events', label: 'Event cards' },
      { key: 'note', label: 'Closing note' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'countdown',
    label: 'Countdown',
    description: 'A live countdown to the wedding moment.',
    category: 'Celebration',
    icon: Clock,
    defaults: { content: baseContent('countdown') },
    fields: [
      text('eyebrow', 'Eyebrow', 'Counting down'),
      text('heading', 'Heading', 'Counting Down to Forever'),
      textarea('intro', 'Introduction', 'Every second brings us closer.'),
      text('completed_message', 'Message on the day', 'Today is the day.'),
    ],
    elements: [
      { key: 'heading', label: 'Heading' },
      { key: 'countdown', label: 'Countdown' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'gallery',
    label: 'Gallery & collage',
    description: 'A masonry or grid gallery with a keyboard-friendly lightbox.',
    category: 'Story',
    icon: Images,
    defaults: { content: baseContent('gallery') },
    fields: [
      text('eyebrow', 'Eyebrow', 'A few favourite moments'),
      text('heading', 'Heading', 'Moments'),
      textarea('intro', 'Introduction', 'A few of our favourite memories.'),
      select('layout', 'Layout', [
        { value: 'masonry', label: 'Masonry collage' },
        { value: 'grid', label: 'Grid' },
      ]),
      { key: 'images', label: 'Photographs', type: 'gallery', hint: 'Choose as many photographs as you like.' },
    ],
    elements: [
      { key: 'heading', label: 'Heading' },
      { key: 'images', label: 'Photographs' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'venue',
    label: 'Venue & directions',
    description: 'Address, map link and a considered note for guests.',
    category: 'Celebration',
    icon: MapPin,
    defaults: { content: baseContent('venue') },
    fields: [
      text('eyebrow', 'Eyebrow', 'Where we will celebrate'),
      text('heading', 'Heading', 'The Venue'),
      textarea('intro', 'Introduction', 'A little about the place.'),
      text('name', 'Venue name', 'The Grand Ballroom'),
      text('address', 'Address', 'Karachi, Pakistan'),
      text('map_url', 'Map link', 'https://maps.google.com'),
      textarea('map_embed', 'Map embed code or URL', 'Paste a Google Maps embed URL'),
      image('image', 'Venue image', 'wide'),
      textarea('notes', 'Notes for guests', 'Parking and arrival details.'),
    ],
    elements: [
      { key: 'image', label: 'Venue image' },
      { key: 'details', label: 'Venue details' },
      { key: 'map', label: 'Map' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'rsvp',
    label: 'RSVP form',
    description: 'The complete RSVP experience wired to the dashboard.',
    category: 'Guests',
    icon: Send,
    defaults: { content: baseContent('rsvp') },
    fields: [
      text('eyebrow', 'Eyebrow', 'Your presence means the world'),
      text('heading', 'Heading', 'Will You Join Us?'),
      textarea('intro', 'Introduction', 'Please let us know if you can celebrate with us.'),
      text('note', 'Deadline note', 'Kindly reply before the deadline.'),
    ],
    elements: [
      { key: 'heading', label: 'Heading' },
      { key: 'form', label: 'RSVP form' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'text',
    label: 'Rich text',
    description: 'A flexible editorial paragraph, note or custom information.',
    category: 'Story',
    icon: Type,
    defaults: { content: baseContent('text') },
    fields: [
      text('eyebrow', 'Eyebrow', 'A note'),
      text('heading', 'Heading', 'A few words'),
      textarea('intro', 'Introduction', 'An optional introduction.'),
      textarea('body', 'Body', 'Write anything you like here.'),
      select('align', 'Alignment', [
        { value: 'center', label: 'Center' },
        { value: 'left', label: 'Left' },
      ]),
      ...ctaFields,
    ],
    elements: [
      { key: 'heading', label: 'Heading' },
      { key: 'body', label: 'Body' },
      { key: 'cta', label: 'Button' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'image_text',
    label: 'Image & text',
    description: 'A photograph paired with a considered block of text.',
    category: 'Design',
    icon: Columns2,
    defaults: { content: baseContent('image_text') },
    fields: [
      text('eyebrow', 'Eyebrow', 'The beginning'),
      text('heading', 'Heading', 'A place that means something'),
      textarea('intro', 'Introduction', 'An optional introduction.'),
      textarea('body', 'Body', 'Tell the story behind the photograph.'),
      image('image', 'Photograph', 'portrait'),
      select('image_position', 'Image position', [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ]),
      ...ctaFields,
    ],
    elements: [
      { key: 'image', label: 'Photograph' },
      { key: 'heading', label: 'Heading' },
      { key: 'body', label: 'Body' },
      { key: 'cta', label: 'Button' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'wedding_party',
    label: 'Wedding party',
    description: 'Introduce the people standing beside you.',
    category: 'Guests',
    icon: Users,
    defaults: { content: baseContent('wedding_party') },
    fields: [
      text('eyebrow', 'Eyebrow', 'Standing beside us'),
      text('heading', 'Heading', 'Our Favourite People'),
      textarea('intro', 'Introduction', 'The friends and family standing beside us.'),
      {
        key: 'members',
        label: 'People',
        type: 'list',
        itemLabel: 'Person',
        itemFields: memberFields,
        defaultItem: { name: 'Name', role: 'Maid of Honour', bio: 'A line about them.' },
      },
    ],
    elements: [
      { key: 'heading', label: 'Heading' },
      { key: 'members', label: 'People' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'gifts',
    label: 'Gifts & registry',
    description: 'A graceful note about gifts or a registry.',
    category: 'Guests',
    icon: Gift,
    defaults: { content: baseContent('gifts') },
    fields: [
      text('eyebrow', 'Eyebrow', 'With gratitude'),
      text('heading', 'Heading', 'With Gratitude'),
      textarea('intro', 'Introduction', 'An optional introduction.'),
      textarea('body', 'Body', 'Your presence is the greatest gift.'),
      textarea('note', 'Note', 'There will be a card box at the reception.'),
      {
        key: 'links',
        label: 'Registry links',
        type: 'list',
        itemLabel: 'Link',
        itemFields: linkFields,
        defaultItem: { label: 'Registry', url: 'https://' },
      },
    ],
    elements: [
      { key: 'heading', label: 'Heading' },
      { key: 'body', label: 'Body' },
      { key: 'links', label: 'Registry links' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'travel',
    label: 'Travel & stay',
    description: 'Accommodation, travel guidance and local notes.',
    category: 'Guests',
    icon: Plane,
    defaults: { content: baseContent('travel') },
    fields: [
      text('eyebrow', 'Eyebrow', 'For guests from near & far'),
      text('heading', 'Heading', 'Travel & Stay'),
      textarea('intro', 'Introduction', 'An optional introduction.'),
      textarea('body', 'Body', 'A little guidance for guests joining us from out of town.'),
      {
        key: 'hotels',
        label: 'Places to stay',
        type: 'list',
        itemLabel: 'Hotel',
        itemFields: hotelFields,
        defaultItem: { name: 'The Grand', description: 'A short note about the stay.', address: 'Street, city', url: 'https://' },
      },
      text('note', 'Closing note', ''),
    ],
    elements: [
      { key: 'heading', label: 'Heading' },
      { key: 'hotels', label: 'Hotels' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'video',
    label: 'Video',
    description: 'A YouTube or Vimeo moment.',
    category: 'Design',
    icon: Play,
    defaults: { content: baseContent('video') },
    fields: [
      text('eyebrow', 'Eyebrow', 'A film'),
      text('heading', 'Heading', 'A Film'),
      textarea('intro', 'Introduction', 'A little something to watch.'),
      select('provider', 'Provider', [
        { value: 'youtube', label: 'YouTube' },
        { value: 'vimeo', label: 'Vimeo' },
      ]),
      text('video_url', 'Video URL', 'https://youtube.com/watch?v=...'),
      text('caption', 'Caption', ''),
    ],
    elements: [
      { key: 'video', label: 'Video' },
      { key: 'caption', label: 'Caption' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'contact',
    label: 'Contact & footer note',
    description: 'Who to call for help on the day.',
    category: 'Guests',
    icon: Phone,
    defaults: { content: baseContent('contact') },
    fields: [
      text('eyebrow', 'Eyebrow', 'Here to help'),
      text('heading', 'Heading', 'With a Little Help'),
      textarea('intro', 'Introduction', 'For any questions, please reach out.'),
      {
        key: 'contacts',
        label: 'Contacts',
        type: 'list',
        itemLabel: 'Contact',
        itemFields: contactFields,
        defaultItem: { name: 'Name', role: 'Wedding planner', phone: '+92 300 0000000', email: 'hello@example.com' },
      },
    ],
    elements: [
      { key: 'heading', label: 'Heading' },
      { key: 'contacts', label: 'Contacts' },
    ],
    supports: { animation: true, visibility: true, background: true, layout: true, responsive: true },
  },
  {
    type: 'divider',
    label: 'Floral divider',
    description: 'A small breathing space with a botanical mark.',
    category: 'Design',
    icon: Minus,
    defaults: { content: {} },
    fields: [],
    elements: [{ key: 'ornament', label: 'Ornament' }],
    supports: { animation: true, visibility: true, background: true, layout: false, responsive: true },
  },
  {
    type: 'footer',
    label: 'Footer & contact',
    description: 'The closing names, date, hashtag and contact details.',
    category: 'Global',
    icon: LayoutTemplate,
    global: true,
    defaults: { content: {} },
    fields: [],
    supports: { animation: false, visibility: false, background: true, layout: false, responsive: false },
  },
]

const ELEMENT_FIELD_ALIASES: Record<string, Record<string, string[]>> = {
  hero: {
    date: ['date_label'],
    countdown: ['show_countdown'],
    cta: ['primary_cta.label', 'primary_cta.href'],
  },
  venue: {
    details: ['name', 'address', 'notes'],
    map: ['map_embed', 'map_url'],
  },
  video: {
    video: ['video_url'],
  },
  text: {
    cta: ['cta.label', 'cta.href'],
  },
  image_text: {
    cta: ['cta.label', 'cta.href'],
  },
  rsvp: {
    form: ['heading', 'intro', 'note'],
  },
  events: {
    events: [],
  },
  countdown: {
    countdown: [],
  },
  divider: {
    ornament: [],
  },
}

export function elementFieldKeys(type: string, elementKey: string): string[] {
  return ELEMENT_FIELD_ALIASES[type]?.[elementKey] ?? [elementKey]
}

export const COMPONENT_MAP = new Map(COMPONENT_REGISTRY.map((component) => [component.type, component]))

export function componentFor(type: string): ComponentDefinition | undefined {
  return COMPONENT_MAP.get(type)
}

export function componentLabel(type: string): string {
  return COMPONENT_MAP.get(type)?.label ?? type.replace(/_/g, ' ')
}

export function sectionComponents(): ComponentDefinition[] {
  return COMPONENT_REGISTRY.filter((component) => !component.global)
}

export function defaultSectionContent(type: string): SectionContent {
  const component = componentFor(type)
  return component ? JSON.parse(JSON.stringify(component.defaults.content)) : {}
}

export function defaultSectionDesign(): SectionDesign {
  return {
    align: 'center',
    padding_y: 96,
    max_width: 1160,
    overlay: 0,
    hover_effect: 'none',
    hide_on_mobile: false,
    hide_on_tablet: false,
    hide_on_desktop: false,
  }
}

export function newSection(type: string): {
  type: string
  title: string | null
  content: SectionContent
  design: SectionDesign
  animation_preset_id: null
  animation_config: null
  sort_order: number
  is_visible: boolean
  studioKey: string
} {
  const component = componentFor(type)
  return {
    type,
    title: component?.label ?? type,
    content: defaultSectionContent(type),
    design: { ...defaultSectionDesign(), ...(component?.defaults.design ?? {}) },
    animation_preset_id: null,
    animation_config: null,
    sort_order: 0,
    is_visible: true,
    studioKey: `section-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }
}
