import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listUsers } from '@/services/users.service'
import { listIdeas } from '@/services/ideas.service'
import { listStartups } from '@/services/startups.service'
import { listOpportunities } from '@/services/opportunities.service'
import { listEvents } from '@/services/events.service'
import { listGrants } from '@/services/grants.service'
import { hasInvestorDiscoveryAccess, listCatalogInvestors } from '@/services/investor-catalog.service'
import { listIndustries } from '@/services/industries.service'

const SUGGESTIONS_PER_CATEGORY = 5
const DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2

export function useSearchSuggestions(rawQuery: string) {
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const trimmed = rawQuery.trim()
    const timer = setTimeout(() => setDebounced(trimmed), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [rawQuery])

  const enabled = debounced.length >= MIN_QUERY_LENGTH

  const people = useQuery({
    queryKey: ['search-suggestions', 'people', debounced],
    queryFn: () => listUsers({ query: debounced, size: SUGGESTIONS_PER_CATEGORY }),
    enabled,
  })
  const ideas = useQuery({
    queryKey: ['search-suggestions', 'ideas', debounced],
    queryFn: () => listIdeas({ query: debounced, size: SUGGESTIONS_PER_CATEGORY }),
    enabled,
  })
  const startups = useQuery({
    queryKey: ['search-suggestions', 'startups', debounced],
    queryFn: () => listStartups({ query: debounced, size: SUGGESTIONS_PER_CATEGORY }),
    enabled,
  })
  const opportunities = useQuery({
    queryKey: ['search-suggestions', 'opportunities', debounced],
    queryFn: () => listOpportunities({ query: debounced, size: SUGGESTIONS_PER_CATEGORY }),
    enabled,
  })
  const events = useQuery({
    queryKey: ['search-suggestions', 'events', debounced],
    queryFn: () => listEvents({ query: debounced, size: SUGGESTIONS_PER_CATEGORY }),
    enabled,
  })

  const grants = useQuery({
    queryKey: ['search-suggestions', 'grants', debounced],
    queryFn: () => listGrants({ query: debounced, size: SUGGESTIONS_PER_CATEGORY }),
    enabled,
  })
  // Investor Discovery requires an active Startup Profile. Checked once with the same query key the
  // Investors page/profile use, so it's shared/cached rather than a second request, and investor results
  // are never even fetched — not just hidden — for a viewer who isn't eligible to see them.
  const investorAccess = useQuery({ queryKey: ['investor-catalog', 'access'], queryFn: hasInvestorDiscoveryAccess, enabled })
  const investors = useQuery({
    queryKey: ['search-suggestions', 'investors', debounced],
    queryFn: async () => (await listCatalogInvestors({ query: debounced })).content.slice(0, SUGGESTIONS_PER_CATEGORY),
    enabled: enabled && investorAccess.data === true,
  })
  const industries = useQuery({
    queryKey: ['search-suggestions', 'industries', debounced],
    queryFn: async () => (await listIndustries({ q: debounced })).slice(0, SUGGESTIONS_PER_CATEGORY),
    enabled,
  })

  const queries = [people, ideas, startups, opportunities, events, grants, investors, industries]
  const isLoading = enabled && queries.some((q) => q.isLoading)
  const isError = queries.some((q) => q.isError)
  const totalCount =
    (people.data?.length ?? 0) +
    (ideas.data?.length ?? 0) +
    (startups.data?.length ?? 0) +
    (opportunities.data?.length ?? 0) +
    (events.data?.length ?? 0) +
    (grants.data?.length ?? 0) +
    (investors.data?.length ?? 0) +
    (industries.data?.length ?? 0)

  return {
    debounced,
    enabled,
    isLoading,
    isError,
    hasResults: totalCount > 0,
    people: people.data ?? [],
    ideas: ideas.data ?? [],
    startups: startups.data ?? [],
    opportunities: opportunities.data ?? [],
    events: events.data ?? [],
    grants: grants.data ?? [],
    investors: investors.data ?? [],
    industries: industries.data ?? [],
  }
}
