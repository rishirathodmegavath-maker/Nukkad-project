import {
  Banknote,
  BookOpen,
  Briefcase,
  CalendarDays,
  CircleHelp,
  Hammer,
  Handshake,
  Lightbulb,
  Megaphone,
  MessageSquareQuote,
  MessagesSquare,
  PackageCheck,
  Rocket,
  Trophy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Post, PostType } from '@/types'

/** Shared by PostCard (feed) and SavedPostsGrid (saved-posts tab) so both render the exact same
 *  icon/label/link for a post's kind instead of duplicating it. `to` (where present) is only used for a
 *  post that points at an entity through its relatedId. */
export const typeMeta: Record<Post['type'], { icon: LucideIcon; label: string; to?: (id: string) => string } | null> = {
  text: null,
  startup_update: { icon: Rocket, label: 'Startup update', to: (id) => `/startups/${id}` },
  idea: { icon: Lightbulb, label: 'Idea', to: (id) => `/ideas/${id}` },
  opportunity: { icon: Briefcase, label: 'Opportunity', to: (id) => `/opportunities/${id}` },
  event: { icon: CalendarDays, label: 'Event', to: (id) => `/events/${id}` },
  discussion: { icon: MessagesSquare, label: 'Discussion' },
  build_update: { icon: Hammer, label: 'Build update' },
  question: { icon: CircleHelp, label: 'Question' },
  milestone: { icon: Trophy, label: 'Achievement' },
  feedback: { icon: MessageSquareQuote, label: 'Looking for feedback' },
  cofounder: { icon: Handshake, label: 'Looking for co-founder' },
  announcement: { icon: Megaphone, label: 'Announcement' },
  resource: { icon: BookOpen, label: 'Resource' },
  hiring: { icon: Briefcase, label: 'Hiring' },
  fundraising: { icon: Banknote, label: 'Fundraising' },
  product_launch: { icon: PackageCheck, label: 'Product launch' },
}

/** One kind of post a member can write in the Create a Post dialog. */
export interface PostKind {
  key: PostType
  /** The tile's title. */
  label: string
  /** The tile's one-line description. */
  blurb: string
  /** The chip in the feed's filter row. */
  filterLabel: string
  /** Shown in the empty text box. */
  placeholder: string
  /** "No {emptyHint} yet" when a filter has no posts. */
  emptyHint: string
  icon: LucideIcon
  /** Classes for the coloured square that carries the icon (literal so Tailwind keeps them). */
  tone: string
  /** A pointer to the fuller form for kinds that also have their own page. */
  help?: { text: string; to: string; cta: string }
}

/** A post with no kind chosen: a plain update. It has no tile; it is what you get when nothing is picked. */
export const generalPostKind: PostKind = {
  key: 'text',
  label: 'Update',
  blurb: 'Share what is on your mind',
  filterLabel: 'Updates',
  placeholder: 'What’s on your mind?',
  emptyHint: 'updates',
  icon: MessagesSquare,
  tone: 'bg-slate-500/10 text-slate-500',
}

/** The eight tiles shown first, in the order shown. */
export const mainPostKinds: PostKind[] = [
  {
    key: 'idea',
    label: 'Idea',
    blurb: 'Share a startup idea',
    filterLabel: 'Ideas',
    placeholder: 'Describe your idea: the problem, who it is for, and how you would solve it.',
    emptyHint: 'ideas',
    icon: Lightbulb,
    tone: 'bg-amber-500/10 text-amber-500',
    help: { text: 'Want to recruit a team for it? Post the full idea too.', to: '/ideas/new', cta: 'Post the full idea' },
  },
  {
    key: 'build_update',
    label: 'Build Update',
    blurb: 'Share progress',
    filterLabel: 'Build updates',
    placeholder: 'What did you ship or learn this week?',
    emptyHint: 'build updates',
    icon: Hammer,
    tone: 'bg-sky-500/10 text-sky-500',
  },
  {
    key: 'discussion',
    label: 'Discussion',
    blurb: 'Start a conversation',
    filterLabel: 'Discussions',
    placeholder: 'Start a conversation. What is on your mind?',
    emptyHint: 'discussions',
    icon: MessagesSquare,
    tone: 'bg-indigo-500/10 text-indigo-500',
  },
  {
    key: 'question',
    label: 'Question',
    blurb: 'Ask the community',
    filterLabel: 'Questions',
    placeholder: 'What do you need help with?',
    emptyHint: 'questions',
    icon: CircleHelp,
    tone: 'bg-red-500/10 text-red-500',
  },
  {
    key: 'feedback',
    label: 'Looking for Feedback',
    blurb: 'Get input',
    filterLabel: 'Feedback',
    placeholder: 'What would you like feedback on? Add a link or a file so people can take a look.',
    emptyHint: 'requests for feedback',
    icon: MessageSquareQuote,
    tone: 'bg-blue-500/10 text-blue-500',
  },
  {
    key: 'cofounder',
    label: 'Looking for Co-founder',
    blurb: 'Find your co-founder',
    filterLabel: 'Co-founder',
    placeholder: 'Who are you looking for? Describe the skills, your stage and how you like to work.',
    emptyHint: 'co-founder posts',
    icon: Handshake,
    tone: 'bg-orange-500/10 text-orange-500',
  },
  {
    key: 'announcement',
    label: 'Announcement',
    blurb: 'Share news',
    filterLabel: 'Announcements',
    placeholder: 'What is the news?',
    emptyHint: 'announcements',
    icon: Megaphone,
    tone: 'bg-rose-500/10 text-rose-500',
  },
  {
    key: 'milestone',
    label: 'Achievement',
    blurb: 'Celebrate milestones',
    filterLabel: 'Achievements',
    placeholder: 'What did you just achieve?',
    emptyHint: 'achievements',
    icon: Trophy,
    tone: 'bg-yellow-500/10 text-yellow-600',
  },
]

/** Behind "More options". */
export const morePostKinds: PostKind[] = [
  {
    key: 'resource',
    label: 'Resource',
    blurb: 'Share something useful',
    filterLabel: 'Resources',
    placeholder: 'What did you find useful, and why should others read or watch it? Add the link below.',
    emptyHint: 'resources',
    icon: BookOpen,
    tone: 'bg-emerald-500/10 text-emerald-500',
  },
  {
    key: 'hiring',
    label: 'Hiring',
    blurb: 'Find teammates',
    filterLabel: 'Hiring',
    placeholder: 'Who are you hiring? Add the role, what they will do and how to reach you.',
    emptyHint: 'hiring posts',
    icon: Briefcase,
    tone: 'bg-violet-500/10 text-violet-500',
    help: { text: 'Have a specific role? Post it on Opportunities so people can apply.', to: '/opportunities/new', cta: 'Post an opportunity' },
  },
  {
    key: 'fundraising',
    label: 'Fundraising',
    blurb: 'Announce a round',
    filterLabel: 'Fundraising',
    placeholder: 'Tell people about your round: the stage, the amount and who you would like to meet.',
    emptyHint: 'fundraising posts',
    icon: Banknote,
    tone: 'bg-teal-500/10 text-teal-500',
  },
  {
    key: 'product_launch',
    label: 'Product Launch',
    blurb: 'Launch something new',
    filterLabel: 'Product launches',
    placeholder: 'What did you launch? Say what it does and who it is for.',
    emptyHint: 'product launches',
    icon: PackageCheck,
    tone: 'bg-fuchsia-500/10 text-fuchsia-500',
  },
  {
    key: 'event',
    label: 'Event',
    blurb: 'Invite the community',
    filterLabel: 'Events',
    placeholder: 'What is the event? Add the date, the place and who should come.',
    emptyHint: 'events',
    icon: CalendarDays,
    tone: 'bg-cyan-500/10 text-cyan-600',
    help: { text: 'Have a date and a place? Create the event so people can register.', to: '/events/new', cta: 'Create an event' },
  },
]

/** Everything a member can write, general update first: the order of the feed's filter chips. */
export const memberPostKinds: PostKind[] = [generalPostKind, ...mainPostKinds, ...morePostKinds]

export function postKind(key: PostType): PostKind {
  return memberPostKinds.find((k) => k.key === key) ?? generalPostKind
}
