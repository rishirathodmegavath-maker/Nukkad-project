import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Megaphone } from 'lucide-react'
import { getStartupUpdates, postStartupUpdate } from '@/services/startups.service'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { SectionCard } from '@/components/ui/SectionCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Input'
import { RichText } from '@/components/startup/ProfileParts'
import { formatRelativeTime } from '@/lib/utils'
import { toast } from '@/store/toast.store'

const MAX_UPDATE_LENGTH = 2000

/**
 * Updates the team has posted. Any active team member may post one (that is the server's rule, unchanged); everyone
 * who can see the startup can read them.
 */
export function StartupUpdatesTab({ startupId, canPost }: { startupId: string; canPost: boolean }) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')

  const query = useQuery({
    queryKey: ['startup', startupId, 'updates'],
    queryFn: () => getStartupUpdates(startupId),
  })

  const post = useMutation({
    mutationFn: () => postStartupUpdate(startupId, draft.trim()),
    onSuccess: () => {
      setDraft('')
      queryClient.invalidateQueries({ queryKey: ['startup', startupId, 'updates'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not post this update'),
  })

  const updates = query.data ?? []

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {canPost && (
        <SectionCard title="Post an update" description="Share news with everyone who follows this startup.">
          <Textarea
            id="startup-update-draft"
            name="startup-update-draft"
            aria-label="Update"
            rows={3}
            maxLength={MAX_UPDATE_LENGTH}
            placeholder="What’s new? A launch, a milestone, a hire…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-fg-muted">
              {draft.length}/{MAX_UPDATE_LENGTH}
            </span>
            <Button size="sm" disabled={!draft.trim()} isLoading={post.isPending} onClick={() => post.mutate()}>
              Post update
            </Button>
          </div>
        </SectionCard>
      )}

      {query.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : query.isError ? (
        <ErrorState title="Couldn’t load updates" onRetry={() => query.refetch()} />
      ) : updates.length > 0 ? (
        <SectionCard title="Updates" icon={<Megaphone className="size-4" />}>
          <ol className="flex flex-col gap-5">
            {updates.map((update) => (
              <li key={update.id} className="relative border-l-2 border-brand-500/30 pl-4">
                <span aria-hidden="true" className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-brand-500" />
                <RichText className="text-[15px]">{update.content}</RichText>
                <p className="mt-1.5 text-xs text-fg-muted">{formatRelativeTime(update.createdAt)}</p>
              </li>
            ))}
          </ol>
        </SectionCard>
      ) : (
        <EmptyState
          as="h3"
          className="py-12"
          icon={<Megaphone className="size-5" />}
          title="No updates yet"
          description={canPost ? 'Post the first update to keep followers in the loop.' : 'Follow this startup to hear when they share news.'}
        />
      )}
    </div>
  )
}
