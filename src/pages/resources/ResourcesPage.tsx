import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronRight, FolderOpen, Search, X } from 'lucide-react'
import { listResources, listResourcesPage } from '@/services/resources.service'
import { ResourceCard } from '@/components/domain/ResourceCard'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { PillTabs } from '@/components/ui/Tabs'
import { Pagination } from '@/components/ui/Pagination'
import { CardSkeletonGrid } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { RESOURCE_CATEGORIES, RESOURCE_TYPE_ORDER, categoryMeta, isCategory } from '@/lib/resource-catalog'
import { cn } from '@/lib/utils'
import type { ResourceType } from '@/types'

const PAGE_SIZE = 12
const GRID = 'grid sm:grid-cols-2 xl:grid-cols-3 gap-5'

/**
 * The resource library. The front page shows the shelves, a "featured" row and what's new; picking a shelf
 * (or searching) switches to a browsable, filterable, paged grid. All state lives in the URL
 * (`?category=free-learning&type=Video&q=deck&page=1`), so a shelf can be linked to and the back button works.
 * Resources are curated by the BuildAdda team, so there is no upload action anywhere here.
 */
export default function ResourcesPage() {
  const [params, setParams] = useSearchParams()
  const categoryParam = params.get('category')
  const qParam = params.get('q') ?? ''
  const typeParam = params.get('type') ?? ''
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0)

  const category = isCategory(categoryParam) ? categoryParam : undefined
  const type = RESOURCE_TYPE_ORDER.includes(typeParam as ResourceType) ? (typeParam as ResourceType) : undefined
  const browsing = categoryParam !== null || qParam !== ''
  const meta = categoryMeta(category)

  // Applies changes to whatever the URL holds *now*, so a delayed update (the search debounce) can't undo a newer one.
  const update = (changes: Record<string, string | null>, replace = false) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '') next.delete(key)
          else next.set(key, value)
        }
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace },
    )
  }

  // The search box is typed into freely and pushed to the URL once typing pauses.
  const [text, setText] = useState(qParam)
  const lastPushed = useRef(qParam)
  useEffect(() => {
    if (qParam !== lastPushed.current) {
      lastPushed.current = qParam
      setText(qParam)
    }
  }, [qParam])
  useEffect(() => {
    const trimmed = text.trim()
    if (trimmed === lastPushed.current) return
    const timer = window.setTimeout(() => {
      lastPushed.current = trimmed
      update({ q: trimmed }, true)
    }, 250)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const featured = useQuery({
    queryKey: ['resources', 'featured'],
    queryFn: () => listResources({ featured: true, size: 3 }),
    enabled: !browsing,
  })
  const latest = useQuery({
    queryKey: ['resources', 'latest'],
    queryFn: () => listResources({ size: 12 }),
    enabled: !browsing,
  })
  const filters = useMemo(() => ({ query: qParam || undefined, type, category, size: PAGE_SIZE }), [qParam, type, category])
  const results = useQuery({
    queryKey: ['resources', 'browse', filters, page],
    queryFn: () => listResourcesPage(filters, page),
    enabled: browsing,
    placeholderData: (previous) => previous,
  })

  const featuredList = useMemo(() => featured.data ?? [], [featured.data])
  const latestList = useMemo(() => {
    const featuredIds = new Set(featuredList.map((r) => r.id))
    return (latest.data ?? []).filter((r) => !featuredIds.has(r.id)).slice(0, 6)
  }, [latest.data, featuredList])

  const frontLoading = featured.isLoading || latest.isLoading
  const frontError = featured.isError && latest.isError
  const frontEmpty = !frontLoading && !frontError && featuredList.length === 0 && latestList.length === 0

  return (
    <div className="flex flex-col gap-8">
      <header>
        {browsing ? (
          <div>
            <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
              <Link to="/resources" className="hover:text-fg transition-colors">
                Resources
              </Link>
              <ChevronRight className="size-3.5" />
              <span className="text-fg">{meta ? meta.label : qParam && !categoryParam ? 'Search' : 'All resources'}</span>
            </nav>
            <h1 className="text-3xl font-black tracking-tight text-fg">{meta ? meta.label : 'All resources'}</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-fg-muted">
              {meta ? meta.blurb : 'Everything the BuildAdda team has put in the library.'}
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-4xl font-black tracking-tight text-fg sm:text-5xl">Resources</h1>
            <p className="mt-1 text-xl font-semibold text-fg sm:text-2xl">Learn. Build. Grow.</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-muted">
              Templates, guides, courses and tools curated by the BuildAdda team to help you at every stage of your startup journey.
            </p>
          </div>
        )}
      </header>

      <div key="search" className="relative max-w-2xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-fg-muted" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search resources (e.g. pitch deck, YC, template…)"
          aria-label="Search resources"
          className="w-full rounded-2xl border border-border/80 bg-surface py-3 pl-11 pr-10 text-sm text-fg shadow-2xs outline-none transition-all placeholder:text-fg-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        {text && (
          <button
            type="button"
            onClick={() => setText('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {browsing ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <PillTabs
              items={[{ key: 'all', label: 'All' }, ...RESOURCE_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))]}
              value={category ?? 'all'}
              onChange={(key) => update({ category: key })}
            />
            <Select
              aria-label="Filter by type"
              value={type ?? ''}
              onChange={(e) => update({ type: e.target.value })}
              className="w-full sm:w-44"
            >
              <option value="">All types</option>
              {RESOURCE_TYPE_ORDER.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          {results.isLoading ? (
            <CardSkeletonGrid count={6} />
          ) : results.isError || !results.data ? (
            <ErrorState title="Couldn't load resources" onRetry={() => results.refetch()} />
          ) : results.data.content.length > 0 ? (
            <div className={cn('flex flex-col gap-6 transition-opacity', results.isPlaceholderData && 'opacity-60')}>
              <div className={GRID}>
                {results.data.content.map((r) => (
                  <ResourceCard key={r.id} resource={r} />
                ))}
              </div>
              <Pagination
                page={results.data.page}
                totalPages={results.data.totalPages}
                totalElements={results.data.totalElements}
                onPageChange={(p) => update({ page: String(p) })}
              />
            </div>
          ) : (
            <EmptyState
              icon={<FolderOpen className="size-5" />}
              title={qParam || type ? 'No resources match' : 'Nothing here yet'}
              description={
                qParam || type
                  ? 'Try a different search, or clear the filters.'
                  : 'The BuildAdda team is adding to this shelf. Check back soon.'
              }
              action={
                qParam || type || category ? (
                  <Button variant="secondary" onClick={() => { setText(''); setParams({ category: 'all' }) }}>
                    Show all resources
                  </Button>
                ) : undefined
              }
            />
          )}
        </>
      ) : (
        <>
          <section aria-label="Browse by shelf" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {RESOURCE_CATEGORIES.map((c) => {
              const Icon = c.icon
              return (
                <Link
                  key={c.key}
                  to={`/resources?category=${c.key}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-border/80 bg-surface p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
                >
                  <span className={cn('flex size-10 items-center justify-center rounded-xl', c.chip)}>
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold leading-snug text-fg">{c.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-fg-muted">{c.blurb}</span>
                  </span>
                </Link>
              )
            })}
          </section>

          <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-brand-500/20 bg-brand-500/10 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-fg">Learn from the best. Build with the right people.</h2>
              <p className="mt-1 text-sm text-fg-secondary">Free to read, open and download — everything here is picked by the BuildAdda team.</p>
            </div>
            <Button size="lg" rightIcon={<ArrowRight className="size-4" />} onClick={() => update({ category: 'all' })}>
              Start exploring
            </Button>
          </section>

          {frontLoading ? (
            <CardSkeletonGrid count={3} />
          ) : frontError ? (
            <ErrorState title="Couldn't load resources" onRetry={() => { featured.refetch(); latest.refetch() }} />
          ) : frontEmpty ? (
            <EmptyState
              icon={<FolderOpen className="size-5" />}
              title="No resources yet"
              description="The BuildAdda team is putting together templates, guides and links for builders. Check back soon."
            />
          ) : (
            <>
              {featuredList.length > 0 && (
                <section aria-labelledby="featured-heading">
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <h2 id="featured-heading" className="text-xl font-bold tracking-tight text-fg">Featured resources</h2>
                      <p className="text-sm text-fg-muted">Handpicked for you</p>
                    </div>
                    <Link to="/resources?category=all" className="inline-flex items-center gap-1 text-sm font-semibold text-fg-brand hover:underline">
                      View all <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                  <div className={GRID}>
                    {featuredList.map((r) => (
                      <ResourceCard key={r.id} resource={r} />
                    ))}
                  </div>
                </section>
              )}
              {latestList.length > 0 && (
                <section aria-labelledby="latest-heading">
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <h2 id="latest-heading" className="text-xl font-bold tracking-tight text-fg">
                      {featuredList.length > 0 ? 'New in the library' : 'Latest resources'}
                    </h2>
                    <Link to="/resources?category=all" className="inline-flex items-center gap-1 text-sm font-semibold text-fg-brand hover:underline">
                      View all <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                  <div className={GRID}>
                    {latestList.map((r) => (
                      <ResourceCard key={r.id} resource={r} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
