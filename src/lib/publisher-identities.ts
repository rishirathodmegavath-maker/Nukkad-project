/**
 * The fixed set of BuildAdda publishing identities an admin can pick for a platform post. Exactly
 * one real admin account is ever behind any of these — no separate User row per identity. Mirrors
 * the backend's Post.PublisherIdentity enum exactly (same keys); adding one is a code change on
 * both sides, same idea as the Resources shelves.
 *
 * Deliberately no `@/types` import here (unlike resource-catalog.ts's equivalent) — this module
 * stays dependency-free so publisher-identities.test.ts can run it directly under the plain Node
 * test runner, which (see tsconfig.test.json) doesn't resolve the `@/` alias. `as const` gives the
 * array's own `key` values a precise literal type without a separately-declared union; `types/feed.ts`'s
 * `PublisherIdentityKey` mirrors these same six strings for typing `Post.publisherIdentity`.
 */
export const PUBLISHER_IDENTITIES = [
  { key: 'BUILDADDA', label: 'BuildAdda' },
  { key: 'BUILDADDA_INSIGHTS', label: 'BuildAdda Insights' },
  { key: 'BUILDADDA_GRANTS', label: 'BuildAdda Grants' },
  { key: 'BUILDADDA_COMMUNITY', label: 'BuildAdda Community' },
  { key: 'BUILDADDA_STARTUP_DESK', label: 'BuildAdda Startup Desk' },
  { key: 'BUILDADDA_EDITORIAL', label: 'BuildAdda Editorial' },
] as const

const DEFAULT_LABEL = 'BuildAdda'

/** The display name for a platform post's publisher identity. Falls back to plain "BuildAdda" for
 *  an absent/unrecognized key, so a historical platform post (or one that predates a newly-added
 *  identity) still shows something sensible instead of breaking. */
export function publisherIdentityLabel(key: string | undefined): string {
  return PUBLISHER_IDENTITIES.find((i) => i.key === key)?.label ?? DEFAULT_LABEL
}
