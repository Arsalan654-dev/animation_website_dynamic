import type { SectionContent } from '@/types'

export const TIMEZONES = [
  'Asia/Karachi',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC',
]

export const STATUS_META = {
  draft: { label: 'Draft', tone: 'neutral' },
  published: { label: 'Published', tone: 'green' },
  archived: { label: 'Archived', tone: 'amber' },
} as const

export interface SectionLibraryItem {
  type: string
  label: string
  description: string
  category: 'Story' | 'Celebration' | 'Guests' | 'Design'
  content: SectionContent
}

export const SECTION_LIBRARY: SectionLibraryItem[] = [
  {
    type: 'hero',
    label: 'Hero & cover',
    description: 'The opening names, date and full-height cover image.',
    category: 'Story',
    content: {
      eyebrow: 'Together with their families',
      subheading: 'invite you to celebrate their wedding',
      show_countdown: true,
      primary_cta: { label: 'RSVP', href: '#rsvp' },
      overlay_opacity: 0.4,
    },
  },
  {
    type: 'story',
    label: 'Couple story',
    description: 'A split image and letter, with an optional timeline.',
    category: 'Story',
    content: {
      heading: 'Our Story',
      intro: 'A short introduction to the two of you.',
      body: 'Tell the story of how you met, the little moments that mattered, and the life you are building together.',
      timeline: [{ date: '2022', title: 'The first hello', text: 'Where it all began.' }],
    },
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'A quiet editorial moment for a favourite line.',
    category: 'Story',
    content: { quote: 'I have found the one whom my soul loves.', attribution: 'Song of Solomon' },
  },
  {
    type: 'events',
    label: 'Events & schedule',
    description: 'All of your ceremonies, with times, venues and dress codes.',
    category: 'Celebration',
    content: {
      heading: 'The Celebrations',
      intro: 'Join us for the moments that make up our wedding week.',
      note: 'Directions and timing details are included with each event.',
    },
  },
  {
    type: 'countdown',
    label: 'Countdown',
    description: 'A live countdown to the wedding moment.',
    category: 'Celebration',
    content: {
      heading: 'Counting Down to Forever',
      intro: 'Every second brings us closer.',
      completed_message: 'Today is the day. We cannot wait to celebrate with you.',
    },
  },
  {
    type: 'gallery',
    label: 'Photo gallery',
    description: 'A masonry or grid gallery with a keyboard-friendly lightbox.',
    category: 'Story',
    content: {
      heading: 'Moments',
      intro: 'A few of our favourite memories.',
      layout: 'masonry',
      images: [],
    },
  },
  {
    type: 'venue',
    label: 'Venue & directions',
    description: 'Address, map link and a considered note for guests.',
    category: 'Celebration',
    content: {
      heading: 'The Venue',
      notes: 'Parking and arrival details.',
    },
  },
  {
    type: 'rsvp',
    label: 'RSVP',
    description: 'The complete RSVP experience wired to the dashboard.',
    category: 'Guests',
    content: {
      heading: 'Will You Join Us?',
      intro: 'Please let us know if you can celebrate with us.',
      note: 'Kindly reply before the deadline.',
    },
  },
  {
    type: 'text',
    label: 'Text block',
    description: 'A flexible editorial paragraph or note.',
    category: 'Story',
    content: { eyebrow: 'A note', heading: 'A few words', body: 'Write anything you like here.', align: 'center' },
  },
  {
    type: 'image_text',
    label: 'Image & text',
    description: 'A photograph paired with a considered block of text.',
    category: 'Design',
    content: {
      eyebrow: 'The beginning',
      heading: 'A place that means something',
      body: 'Tell the story behind the photograph.',
      image_position: 'left',
      cta: { label: 'Read more', href: '#' },
    },
  },
  {
    type: 'wedding_party',
    label: 'Wedding party',
    description: 'Introduce the people standing beside you.',
    category: 'Guests',
    content: {
      heading: 'Our Favourite People',
      intro: 'The friends and family standing beside us.',
      members: [{ name: 'Name', role: 'Maid of Honour', bio: 'A line about them.' }],
    },
  },
  {
    type: 'gifts',
    label: 'Gifts',
    description: 'A graceful note about gifts or a registry.',
    category: 'Guests',
    content: {
      heading: 'With Gratitude',
      body: 'Your presence is the greatest gift.',
      note: 'There will be a card box at the reception.',
      links: [],
    },
  },
  {
    type: 'travel',
    label: 'Travel & stay',
    description: 'Accommodation, travel guidance and local notes.',
    category: 'Guests',
    content: {
      heading: 'Travel & Stay',
      body: 'A little guidance for guests joining us from out of town.',
      hotels: [],
      note: '',
    },
  },
  {
    type: 'video',
    label: 'Video',
    description: 'A YouTube or Vimeo moment.',
    category: 'Design',
    content: { heading: 'A Film', intro: 'A little something to watch.', provider: 'youtube', video_url: '', caption: '' },
  },
  {
    type: 'contact',
    label: 'Contact',
    description: 'Who to call for help on the day.',
    category: 'Guests',
    content: { heading: 'With a Little Help', intro: 'For any questions, please reach out.', contacts: [] },
  },
  {
    type: 'divider',
    label: 'Ornamental divider',
    description: 'A small breathing space with a botanical mark.',
    category: 'Design',
    content: {},
  },
]

export const SECTION_LABEL = Object.fromEntries(SECTION_LIBRARY.map((item) => [item.type, item.label])) as Record<
  string,
  string
>

export const NAV_SECTION_TYPES = [
  { type: 'story', label: 'Our Story' },
  { type: 'events', label: 'Events' },
  { type: 'gallery', label: 'Gallery' },
  { type: 'venue', label: 'Venue' },
  { type: 'travel', label: 'Travel' },
  { type: 'rsvp', label: 'RSVP' },
]

export const EVENT_PRESETS = ['Mehndi', 'Nikah', 'Baraat', 'Walima', 'Reception', 'Engagement', 'Sangeet']

export const TEMPLATE_CATEGORIES = ['classic', 'modern', 'garden', 'destination', 'minimal', 'destination']
