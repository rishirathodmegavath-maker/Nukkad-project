import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, ExternalLink, Plus } from 'lucide-react'
import { listAdminPosts, setPostRemoved } from '@/services/admin.service'
import { memberAppUrl } from '@/lib/portal'
import { AdminRemoveContentModal } from '@/components/domain/AdminRemoveContentModal'
import { AdminPostFormModal } from '@/components/domain/AdminPostFormModal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/toast.store'
import { formatRelativeTime } from '@/lib/utils'
import { typeMeta } from '@/lib/postTypeMeta'
import { publisherIdentityLabel } from '@/lib/publisher-identities'
import type { PostType, PublisherIdentityKey } from '@/types'

export default function AdminFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [includeRemoved, setIncludeRemoved] = useState(searchParams.get('includeRemoved') === 'true')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0))
  const [target, setTarget] = useState<{ id: string; label: string; removed: boolean } | null>(null)
  const [adding, setAdding] = useState(false)
  const queryClient = useQueryClient()
  const filters = useMemo(() => ({ includeRemoved, page, size: 20 }), [includeRemoved, page])

  useEffect(() => {
    const next = new URLSearchParams()
    if (includeRemoved) next.set('includeRemoved', 'true')
    if (page > 0) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [includeRemoved, page, setSearchParams])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'feed', 'posts', filters],
    queryFn: () => listAdminPosts(filters),
  })

  const removeMutation = useMutation({
    mutationFn: (reason: string) => setPostRemoved(target!.id, !target!.removed, reason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feed', 'posts'] })
      toast.success(target?.removed ? 'Post restored' : 'Post removed')
      setTarget(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update this post'),
  })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer select-none">
          <Checkbox
            id="admin-feed-include-removed"
            name="admin-feed-include-removed"
            checked={includeRemoved}
            onChange={(e) => { setIncludeRemoved(e.target.checked); setPage(0) }}
          />
          Show removed posts too
        </label>
        <Button className="sm:ml-auto" leftIcon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
          Add post
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load posts" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState icon={<MessageSquare className="size-5" />} title="No posts match" />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.content.map((post) => (
              <Card key={post.id} className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge tone="neutral">{typeMeta[post.type as PostType]?.label ?? 'Update'}</Badge>
                    {post.postedAsPlatform && (
                      <Badge tone="accent">{publisherIdentityLabel(post.publisherIdentity as PublisherIdentityKey)}</Badge>
                    )}
                    {post.visibility === 'CONNECTIONS' && <Badge tone="neutral">Connections only</Badge>}
                    {post.removedByAdmin && <Badge tone="danger">Removed</Badge>}
                    <span className="text-xs text-fg-muted">{formatRelativeTime(post.createdAt)}</span>
                  </div>
                  <p className="text-sm text-fg-secondary line-clamp-2 max-w-xl">{post.content || <em>{post.linkUrl ? '(link only)' : '(attachment only)'}</em>}</p>
                  <p className="text-xs text-fg-muted mt-1">
                    {post.likesCount} likes
                    {!!post.platformEngagementCount && ` (+${post.platformEngagementCount} platform, shown as ${post.likesCount + post.platformEngagementCount})`}
                    {' '}· {post.commentsCount} comments
                    {post.removalReason && <span> — removed: "{post.removalReason}"</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a href={memberAppUrl(`/feed/${post.id}`)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-fg-brand hover:underline">
                    View <ExternalLink className="size-3 inline" />
                  </a>
                  <a href={memberAppUrl(`/people/${post.authorId}`)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-fg-brand hover:underline">
                    Author <ExternalLink className="size-3 inline" />
                  </a>
                  <Button
                    size="sm"
                    variant={post.removedByAdmin ? 'secondary' : 'danger-subtle'}
                    onClick={() => setTarget({ id: post.id, label: post.content.slice(0, 60) || 'this post', removed: post.removedByAdmin })}
                  >
                    {post.removedByAdmin ? 'Restore' : 'Remove'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        </>
      )}

      {target && (
        <AdminRemoveContentModal
          open
          onClose={() => setTarget(null)}
          itemLabel={target.label}
          targetRemoved={!target.removed}
          isPending={removeMutation.isPending}
          onConfirm={(reason) => removeMutation.mutate(reason)}
        />
      )}

      {adding && <AdminPostFormModal onClose={() => setAdding(false)} />}
    </div>
  )
}
