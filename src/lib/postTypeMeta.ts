import { Rocket, Lightbulb, Briefcase, CalendarDays } from 'lucide-react'
import type { Post } from '@/types'

/** Shared by PostCard (feed) and SavedPostsGrid (saved-posts tab) so both render the exact same
 *  icon/label/link for a startup_update/idea/opportunity/event post instead of duplicating it. */
export const typeMeta: Record<Post['type'], { icon: typeof Rocket; label: string; to?: (id: string) => string } | null> = {
  text: null,
  startup_update: { icon: Rocket, label: 'Startup update', to: (id) => `/startups/${id}` },
  idea: { icon: Lightbulb, label: 'New idea', to: (id) => `/ideas/${id}` },
  opportunity: { icon: Briefcase, label: 'Opportunity', to: (id) => `/opportunities/${id}` },
  event: { icon: CalendarDays, label: 'Event', to: (id) => `/events/${id}` },
}
