import { Banknote, Bot, Briefcase, Megaphone, MessagesSquare, Package, Rocket, TrendingUp, Users, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface DiscussionTopicMeta {
  topic: string
  label: string
  icon: LucideIcon
  /** Classes for the coloured square that carries the icon — literal so Tailwind keeps them. */
  tone: string
}

/** One entry per Post.Topic on the backend (see Post.java) — a fixed, curated list, same idea as
 *  postTypeMeta.ts. Order here is also the default display order before any real counts are known. */
export const DISCUSSION_TOPICS: DiscussionTopicMeta[] = [
  { topic: 'AI_TECHNOLOGY', label: 'AI & Technology', icon: Bot, tone: 'bg-violet-500/10 text-violet-500' },
  { topic: 'PRODUCT', label: 'Product', icon: Package, tone: 'bg-rose-500/10 text-rose-500' },
  { topic: 'GROWTH', label: 'Growth', icon: TrendingUp, tone: 'bg-emerald-500/10 text-emerald-500' },
  { topic: 'FUNDRAISING', label: 'Fundraising', icon: Banknote, tone: 'bg-amber-500/10 text-amber-600' },
  { topic: 'COFOUNDERS', label: 'Co-founders', icon: Users, tone: 'bg-sky-500/10 text-sky-500' },
  { topic: 'MARKETING', label: 'Marketing', icon: Megaphone, tone: 'bg-pink-500/10 text-pink-500' },
  { topic: 'HIRING', label: 'Hiring', icon: Briefcase, tone: 'bg-orange-500/10 text-orange-500' },
  { topic: 'TOOLS_RESOURCES', label: 'Tools & Resources', icon: Wrench, tone: 'bg-cyan-500/10 text-cyan-600' },
  { topic: 'STARTUPS', label: 'Startups', icon: Rocket, tone: 'bg-brand-500/10 text-fg-brand' },
  { topic: 'GENERAL', label: 'General', icon: MessagesSquare, tone: 'bg-slate-500/10 text-slate-500' },
]

export function discussionTopicMeta(topic: string | undefined): DiscussionTopicMeta {
  return DISCUSSION_TOPICS.find((t) => t.topic === topic) ?? DISCUSSION_TOPICS[DISCUSSION_TOPICS.length - 1]
}
