import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listOpportunities } from '@/services/opportunities.service'
import { getCurrentUserId } from '@/services/users.service'
import type { Opportunity } from '@/types'

/**
 * The real, applyable opportunities attributed to a startup: its hiring system. (The legacy `startup_roles` teaser is
 * separate; only the join-request role picker still reads it.)
 *
 * The public listing only returns APPROVED postings, to everyone, the poster included, so on its own it would tell a
 * founder "No open positions" while their own role is still waiting for review. A manager therefore also asks for their
 * own postings (the API lets a poster see them when the query is filtered to postedByUserId=self) and the two lists are
 * merged. Public visitors never make that second request, and the moderation rules are untouched.
 */
export function useStartupOpenPositions(startupId: string | undefined, canManage: boolean) {
  const myUserId = getCurrentUserId()

  const publicQuery = useQuery({
    queryKey: ['startup', startupId, 'opportunities'],
    queryFn: () => listOpportunities({ startupId, size: 50 }),
    enabled: !!startupId,
  })
  const ownQuery = useQuery({
    queryKey: ['startup', startupId, 'opportunities', 'mine'],
    queryFn: () => listOpportunities({ startupId, postedByUserId: myUserId, size: 50 }),
    enabled: !!startupId && canManage && !!myUserId,
  })

  const positions = useMemo(() => {
    const byId = new Map<string, Opportunity>()
    for (const opp of publicQuery.data ?? []) byId.set(opp.id, opp)
    for (const opp of ownQuery.data ?? []) {
      // A rejected posting is not an open position (it has its own "Not approved" state under Posted by Me);
      // closed and admin-removed ones are already excluded by the API.
      if (opp.moderationStatus === 'REJECTED') continue
      byId.set(opp.id, opp)
    }
    return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [publicQuery.data, ownQuery.data])

  return {
    positions,
    myUserId,
    isLoading: publicQuery.isLoading || ownQuery.isLoading,
    isError: publicQuery.isError,
  }
}
