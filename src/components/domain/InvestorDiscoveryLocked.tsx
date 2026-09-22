import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Filter, Handshake, Lock, Search, SlidersHorizontal } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input, Select } from '@/components/ui/Input'
import { SearchFilterBar } from '@/components/domain/SearchFilterBar'
import { buttonClasses } from '@/components/ui/button-styles'

const FEATURES = [
  { icon: Search, label: 'Browse investors' },
  { icon: Filter, label: 'Filter by sector' },
  { icon: SlidersHorizontal, label: 'Filter by stage' },
  { icon: Eye, label: 'View investor profiles' },
  { icon: Handshake, label: 'Request introductions' },
]

/** Stands in for a real CatalogInvestorRow while blurred — same shape (avatar, two lines, an action-sized
 *  block), never a name or number that would look like a real investor. */
function RowSkeleton() {
  return (
    <Card padding="sm" className="flex flex-col gap-4 border border-border/80 shadow-2xs sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:items-center">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-lg sm:w-40" />
    </Card>
  )
}

/**
 * Shown instead of Investor Discovery to anyone without an active Startup Profile — the backend refuses
 * the underlying API calls too (InvestorCatalogService), so this is UX, not the real boundary.
 *
 * Rather than leaving the page blank, this renders the real page's own shape — its filter bar, and a
 * stack of row placeholders standing in for investor cards (never fabricated investor data) — blurred
 * and disabled behind a centered unlock card. `inert` drops that whole mock background from both the tab
 * order and the accessibility tree, so a keyboard or screen-reader user lands straight on the unlock
 * card's own buttons instead of tabbing through controls that don't work yet.
 */
export function InvestorDiscoveryLocked() {
  const [showWhy, setShowWhy] = useState(false)

  return (
    // min-h keeps the blurred background at least as tall as the unlock card can get (its "Why is this
    // locked?" answer expands it) — the card is absolutely positioned, so it wouldn't otherwise grow this
    // container and could spill past it on a short mock background.
    <div className="relative min-h-[640px]">
      <div inert className="pointer-events-none select-none blur-[3px] opacity-40">
        <SearchFilterBar query="" onQueryChange={() => {}} placeholder="Search investors by name, firm or thesis…">
          <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Select label="Type" value="" disabled onChange={() => {}}>
              <option value="">Any type</option>
            </Select>
            <Select label="Sector" value="" disabled onChange={() => {}}>
              <option value="">Any sector</option>
            </Select>
            <Select label="Stage" value="" disabled onChange={() => {}}>
              <option value="">Any stage</option>
            </Select>
            <Input label="Location" value="" disabled onChange={() => {}} placeholder="e.g. Bangalore" />
            <Input label="Country" value="" disabled onChange={() => {}} placeholder="e.g. India" />
            <Input label="Cheque size (₹)" type="number" value="" disabled onChange={() => {}} placeholder="e.g. 2000000" />
          </div>
        </SearchFilterBar>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card variant="elevated" padding="lg" className="w-full max-w-sm text-center shadow-xl">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-surface-sunken text-fg-muted shadow-xs">
            <Lock className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-fg">Unlock Investor Discovery</h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            Complete your Startup Profile to browse verified investors, filter by sector and stage, and request introductions.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <Link to="/startups/new" className={buttonClasses({ className: 'w-full' })}>
              Create Startup Profile
            </Link>
            <Button variant="secondary" className="w-full" aria-expanded={showWhy} onClick={() => setShowWhy((v) => !v)}>
              Why is this locked?
            </Button>
          </div>

          {showWhy && (
            <p className="mt-3 rounded-lg bg-surface-sunken p-3 text-left text-xs leading-relaxed text-fg-muted animate-in">
              Investors only see startups that are actually building — so Discovery opens up as soon as you've created
              your Startup Profile. It takes a couple of minutes and unlocks introductions in both directions.
            </p>
          )}

          <ul className="mt-5 flex flex-col gap-2 text-left">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-surface-sunken/60 px-3 py-2 text-sm text-fg-secondary"
              >
                <Icon className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                <Lock className="size-3.5 shrink-0 text-fg-muted" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
