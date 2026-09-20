import { Rocket, Lightbulb, Briefcase, CalendarDays, MessagesSquare, Hammer, CircleHelp, Trophy } from 'lucide-react'
import type { Post, PostType } from '@/types'

/** Shared by PostCard (feed) and SavedPostsGrid (saved-posts tab) so both render the exact same
 *  icon/label/link for a startup_update/idea/opportunity/event post instead of duplicating it. */
export const typeMeta: Record<Post['type'], { icon: typeof Rocket; label: string; to?: (id: string) => string } | null> = {
  text: null,
  startup_update: { icon: Rocket, label: 'Startup update', to: (id) => `/startups/${id}` },
  idea: { icon: Lightbulb, label: 'New idea', to: (id) => `/ideas/${id}` },
  opportunity: { icon: Briefcase, label: 'Opportunity', to: (id) => `/opportunities/${id}` },
  event: { icon: CalendarDays, label: 'Event', to: (id) => `/events/${id}` },
  discussion: { icon: MessagesSquare, label: 'Discussion' },
  build_update: { icon: Hammer, label: 'Build update' },
  question: { icon: CircleHelp, label: 'Question' },
  milestone: { icon: Trophy, label: 'Milestone' },
}

/** The kinds of post a member can write, in the order the composer and the feed filter list them. */
export const memberPostKinds: { key: PostType; label: string; placeholder: string; emptyHint: string }[] = [
  { key: 'text', label: 'Update', placeholder: 'Share an update, ask for feedback, or celebrate a milestone…', emptyHint: 'updates' },
  { key: 'discussion', label: 'Discussion', placeholder: 'Start a conversation — what is on your mind?', emptyHint: 'discussions' },
  { key: 'build_update', label: 'Build update', placeholder: 'What did you ship or learn this week?', emptyHint: 'build updates' },
  { key: 'question', label: 'Question', placeholder: 'What do you need help with?', emptyHint: 'questions' },
  { key: 'milestone', label: 'Milestone', placeholder: 'What did you just achieve?', emptyHint: 'milestones' },
]

