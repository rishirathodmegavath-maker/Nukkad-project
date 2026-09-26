import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Pencil, Plus, Users } from 'lucide-react'
import { listAdminChapters } from '@/services/admin.service'
import { AdminChapterFormModal } from '@/components/domain/AdminChapterFormModal'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { EntityLogo } from '@/components/ui/EntityLogo'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { useUser } from '@/hooks/useUser'
import { formatRelativeTime } from '@/lib/utils'
import type { Chapter } from '@/types'

function PresidentCell({ userId }: { userId?: string }) {
  const { data: user } = useUser(userId)
  if (!userId) return <span className="text-fg-muted">—</span>
  if (!user) return <Skeleton className="h-4 w-24" />
  return <span className="text-fg">{user.name}</span>
}

/** Chapters are self-serve by default (a member creates one and becomes its president
 *  immediately); this is the admin's own path for standing one up directly — e.g. onboarding a
 *  campus/city chapter whose president is a known, existing member. */
export default function AdminChaptersPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [form, setForm] = useState<{ chapter?: Chapter } | null>(null)

  const filters = useMemo(() => ({ q: q || undefined, page, size: 20 }), [q, page])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'chapters', filters],
    queryFn: () => listAdminChapters(filters),
  })

  return (
    <div>
      <SearchFilterBar inline query={q} onQueryChange={(v) => { setQ(v); setPage(0) }} placeholder="Search chapters by name or city…">
        <Button className="sm:ml-auto" leftIcon={<Plus className="size-4" />} onClick={() => setForm({})}>
          Add chapter
        </Button>
      </SearchFilterBar>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : isError || !data ? (
        <ErrorState title="Couldn't load chapters" onRetry={refetch} />
      ) : data.content.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-5" />}
          title={q ? 'No chapters match' : 'No chapters yet'}
          description={q ? undefined : 'Stand up the first campus or city chapter.'}
          action={q ? undefined : <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => setForm({})}>Add chapter</Button>}
        />
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs font-semibold text-fg-muted uppercase tracking-wide">
                    <th className="w-full min-w-[16rem] px-4 py-3">Chapter</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">President</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Founded</th>
                    <th className="bg-surface px-4 py-3 md:sticky md:right-0" />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((chapter) => (
                    <tr key={chapter.id} className="group border-b border-border/60 last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="w-full min-w-[16rem] px-4 py-3 font-medium text-fg">
                        <div className="flex items-center gap-3">
                          <EntityLogo src={chapter.logoUrl} name={chapter.name} size="sm" />
                          <div className="min-w-0">
                            <span className="block truncate" title={chapter.name}>{chapter.name}</span>
                            <span className="mt-0.5 flex items-center gap-1.5">
                              {chapter.institution && <Badge tone="neutral">{chapter.institution}</Badge>}
                              {chapter.type && <Badge tone="accent">{chapter.type}</Badge>}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{[chapter.city, chapter.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><PresidentCell userId={chapter.presidentUserId} /></td>
                      <td className="px-4 py-3 text-fg-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="size-3.5" />
                          {chapter.memberCount ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                        {formatRelativeTime(chapter.foundedAt ?? chapter.createdAt)}
                      </td>
                      <td className="bg-surface px-4 py-3 text-right transition-colors group-hover:bg-surface-hover md:sticky md:right-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          aria-label={`Edit ${chapter.name}`}
                          leftIcon={<Pencil className="size-3.5" />}
                          onClick={() => setForm({ chapter })}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        </>
      )}

      {form && <AdminChapterFormModal chapter={form.chapter} onClose={() => setForm(null)} />}
    </div>
  )
}
