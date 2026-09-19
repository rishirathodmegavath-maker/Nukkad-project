import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, ExternalLink } from 'lucide-react'
import { listAdminPosts, setPostRemoved } from '@/services/admin.service'
import { AdminRemoveContentModal } from '@/components/domain/AdminRemoveContentModal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/toast.store'
import { formatRelativeTime } from '@/lib/utils'

export default function AdminFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [includeRemoved, setIncludeRemoved] = useState(searchParams.get('includeRemoved') === 'true')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 0))
  const [target, setTarget] = useState<{ id: string; label: string; removed: boolean } | null>(null)
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
          <input
            type="checkbox"
            checked={includeRemoved}
            onChange={(e) => { setIncludeRemoved(e.target.checked); setPage(0) }}
            className="size-3.5 rounded border-border accent-brand-600"
          />
          Show removed posts too
        </label>
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
                    <Badge tone="neutral">{post.type}</Badge>
                    {post.removedByAdmin && <Badge tone="danger">Removed</Badge>}
                    <span className="text-xs text-fg-muted">{formatRelativeTime(post.createdAt)}</span>
                  </div>
                  <p className="text-sm text-fg-secondary line-clamp-2 max-w-xl">{post.content || <em>(attachment only)</em>}</p>
                  <p className="text-xs text-fg-muted mt-1">
                    {post.likesCount} likes · {post.commentsCount} comments
                    {post.removalReason && <span> — removed: "{post.removalReason}"</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link to={`/people/${post.authorId}`} className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                    Author <ExternalLink className="size-3 inline" />
                  </Link>
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
    </div>
  )
}
