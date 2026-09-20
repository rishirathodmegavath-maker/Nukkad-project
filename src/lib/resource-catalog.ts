import { BookOpenCheck, FileText, GraduationCap, Landmark, LayoutTemplate, Link2, Presentation, Rocket, StickyNote, Video, Wrench, Newspaper, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Resource, ResourceCategory, ResourceType } from '@/types'

export interface CategoryMeta {
  key: ResourceCategory
  label: string
  blurb: string
  icon: LucideIcon
  /** Classes for the small coloured square that carries the icon. */
  chip: string
  /** Gradient classes for a card's placeholder image, so an image-less resource still looks filed. */
  gradient: string
}

/** The shelves, in the order the front page shows them. Colours are literal classes so Tailwind keeps them. */
export const RESOURCE_CATEGORIES: CategoryMeta[] = [
  {
    key: 'free-learning',
    label: 'Free Learning',
    blurb: 'Courses, videos, pitch decks and more',
    icon: GraduationCap,
    chip: 'bg-indigo-500/10 text-indigo-500',
    gradient: 'from-indigo-500/25 via-indigo-500/10 to-sky-500/10',
  },
  {
    key: 'templates',
    label: 'Templates',
    blurb: 'Ready-to-use documents and models',
    icon: LayoutTemplate,
    chip: 'bg-rose-500/10 text-rose-500',
    gradient: 'from-rose-500/25 via-rose-500/10 to-orange-500/10',
  },
  {
    key: 'playbooks',
    label: 'Playbooks',
    blurb: 'Step-by-step guides for builders',
    icon: BookOpenCheck,
    chip: 'bg-emerald-500/10 text-emerald-500',
    gradient: 'from-emerald-500/25 via-emerald-500/10 to-teal-500/10',
  },
  {
    key: 'programs',
    label: 'Startup Programs',
    blurb: 'Cohorts, mentorship and community',
    icon: Rocket,
    chip: 'bg-amber-500/10 text-amber-500',
    gradient: 'from-amber-500/25 via-amber-500/10 to-orange-500/10',
  },
  {
    key: 'tools',
    label: 'Tools & Utilities',
    blurb: 'Useful tools and calculators',
    icon: Wrench,
    chip: 'bg-violet-500/10 text-violet-500',
    gradient: 'from-violet-500/25 via-violet-500/10 to-fuchsia-500/10',
  },
  {
    key: 'government',
    label: 'Government & Schemes',
    blurb: 'Grants, policies and startup schemes',
    icon: Landmark,
    chip: 'bg-teal-500/10 text-teal-500',
    gradient: 'from-teal-500/25 via-teal-500/10 to-cyan-500/10',
  },
]

/** Used for a resource that isn't filed on any shelf. */
export const UNFILED_GRADIENT = 'from-slate-500/20 via-slate-500/10 to-slate-500/5'

export function categoryMeta(key: ResourceCategory | undefined): CategoryMeta | undefined {
  return RESOURCE_CATEGORIES.find((c) => c.key === key)
}

export function isCategory(value: string | null): value is ResourceCategory {
  return RESOURCE_CATEGORIES.some((c) => c.key === value)
}

interface TypeMeta {
  icon: LucideIcon
  /** What the call-to-action says for a link of this type ("Watch video"). */
  action: string
}

export const RESOURCE_TYPES: Record<ResourceType, TypeMeta> = {
  Video: { icon: Video, action: 'Watch video' },
  Article: { icon: Newspaper, action: 'Read article' },
  Guide: { icon: BookOpen, action: 'Read guide' },
  Course: { icon: GraduationCap, action: 'View course' },
  Deck: { icon: Presentation, action: 'View deck' },
  Tool: { icon: Wrench, action: 'Open tool' },
  Template: { icon: LayoutTemplate, action: 'Get template' },
  Document: { icon: FileText, action: 'View document' },
  Note: { icon: StickyNote, action: 'Read note' },
  Link: { icon: Link2, action: 'Open link' },
}

/** In the order the type pickers list them. */
export const RESOURCE_TYPE_ORDER: ResourceType[] = ['Video', 'Article', 'Guide', 'Course', 'Deck', 'Tool', 'Template', 'Document', 'Note', 'Link']

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif']
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov']

export function fileExtension(name: string | undefined): string {
  if (!name) return ''
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase()
}

/** The 11-character id of a YouTube watch / share / embed link, or null for anything else. */
export function youtubeId(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '')
  let id: string | null = null
  if (host === 'youtu.be') id = parsed.pathname.slice(1).split('/')[0] ?? null
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') id = parsed.searchParams.get('v')
    else {
      const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)
      id = match?.[1] ?? null
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
}

/** What kind of thing a hosted file is, for choosing how to show it on the detail page. */
export function hostedKind(resource: Pick<Resource, 'fileName'>): 'video' | 'image' | 'other' | null {
  if (!resource.fileName) return null
  const ext = fileExtension(resource.fileName)
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video'
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  return 'other'
}

/**
 * The image for a resource's card: the one an admin uploaded, else the poster of a YouTube link, else
 * the file itself when the resource is a hosted image. Null means "draw a placeholder".
 */
export function resourceThumbnail(resource: Resource): string | null {
  if (resource.thumbnailUrl) return resource.thumbnailUrl
  const id = youtubeId(resource.url)
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  if (hostedKind(resource) === 'image') return resource.url
  return null
}

/** "32 min" for anything under an hour, "1 h 30 min" above it. */
export function formatDuration(minutes: number | undefined): string | null {
  if (!minutes || minutes <= 0) return null
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
