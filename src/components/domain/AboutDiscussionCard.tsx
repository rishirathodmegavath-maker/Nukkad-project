import { Link } from 'react-router-dom'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Clock3, Eye, MessageCircle, Users } from 'lucide-react'
import type { Discussion, User } from '@/types'
import { listDiscussionParticipants, toggleFollowDiscussion } from '@/services/discussions.service'
import { getUser } from '@/services/users.service'
import { discussionTopicMeta } from '@/lib/discussionTopicMeta'
import { useUser } from '@/hooks/useUser'
import { formatRelativeTime } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { AvatarStack } from '@/components/ui/AvatarStack'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/store/toast.store'

const MAX_SHOWN_AVATARS = 6

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-fg-muted">
        {icon}
        {label}
      </span>
      <span className="font-semibold text-fg tabular-nums">{value}</span>
    </div>
  )
}

/**
 * The detail page's "About this Discussion" sidebar card: who started it, its topic, when it was
 * posted and when it last had activity, and its real reply/view/participant counts. Every number is
 * the same one already on the DiscussionDto — this card doesn't fetch anything the page doesn't
 * already have, except the participants list (for the avatar row).
 */
export function AboutDiscussionCard({ discussion }: { discussion: Discussion }) {
  const queryClient = useQueryClient()
  const { data: author } = useUser(discussion.authorId)
  const meta = discussionTopicMeta(discussion.topic)
  const { data: participantIds } = useQuery({
    queryKey: ['discussions', discussion.id, 'participants'],
    queryFn: () => listDiscussionParticipants(discussion.id),
  })

  const followMutation = useMutation({
    mutationFn: () => toggleFollowDiscussion(discussion.id),
    onSuccess: (result) => {
      queryClient.setQueryData<Discussion>(['discussions', discussion.id], (prev) => (prev ? { ...prev, isFollowing: result.following } : prev))
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update follow'),
  })

  const shownIds = (participantIds ?? []).slice(0, MAX_SHOWN_AVATARS)
  const shownUsers = useQueries({
    queries: shownIds.map((id) => ({ queryKey: ['user', id], queryFn: () => getUser(id), staleTime: 60_000 })),
  })
    .map((q) => q.data)
    .filter((u): u is User => !!u)
  const extra = discussion.participantCount - shownIds.length

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-sm font-bold text-fg">About this Discussion</h2>

      <div className="flex items-center gap-3">
        {author ? <Avatar src={author.avatarUrl} name={author.name} size="sm" /> : <Skeleton className="size-8 rounded-full" />}
        <div className="min-w-0">
          <p className="text-xs text-fg-muted">Started by</p>
          {author ? (
            <Link to={`/people/${author.id}`} className="text-sm font-semibold text-fg hover:underline">
              {author.name}
            </Link>
          ) : (
            <Skeleton className="h-4 w-24" />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <StatRow icon={<meta.icon className="size-3.5" />} label="Topic" value={meta.label} />
        <StatRow icon={<CalendarClock className="size-3.5" />} label="Posted" value={formatRelativeTime(discussion.createdAt)} />
        <StatRow icon={<Clock3 className="size-3.5" />} label="Last activity" value={formatRelativeTime(discussion.lastActivityAt)} />
        <StatRow icon={<MessageCircle className="size-3.5" />} label="Replies" value={discussion.commentsCount} />
        <StatRow icon={<Eye className="size-3.5" />} label="Views" value={discussion.viewsCount} />
        <StatRow icon={<Users className="size-3.5" />} label="Participants" value={discussion.participantCount} />
      </div>

      {shownUsers.length > 0 && (
        <div className="flex items-center gap-2 border-t border-border/60 pt-3">
          <AvatarStack people={shownUsers} size="sm" max={MAX_SHOWN_AVATARS} />
          {extra > 0 && <span className="text-xs font-medium text-fg-muted">+{extra} more</span>}
        </div>
      )}

      <Button
        variant={discussion.isFollowing ? 'soft' : 'secondary'}
        isLoading={followMutation.isPending}
        aria-pressed={discussion.isFollowing}
        onClick={() => followMutation.mutate()}
        className="w-full"
      >
        {discussion.isFollowing ? 'Following' : 'Follow this discussion'}
      </Button>
    </Card>
  )
}
