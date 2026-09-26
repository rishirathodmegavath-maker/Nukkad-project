/**
 * The fixed set of public display identities an admin can pick when publishing content as the
 * platform rather than as themselves — reused across every content type an admin can create (Feed,
 * Ideas, Startups, Opportunities, Grants, Events, Resources, Discussions). Exactly one real admin
 * account is ever behind any of these — no separate User row per identity, and the BuildAdda logo
 * stays the avatar (see PostCard.tsx and its equivalents). Mirrors the backend's shared
 * `com.nukkad.common.publishing.PublisherIdentity` enum exactly (same keys); adding one is a code
 * change on both sides, same idea as the Resources shelves.
 *
 * Deliberately no `@/types` import here (unlike resource-catalog.ts's equivalent) — this module
 * stays dependency-free so publisher-identities.test.ts can run it directly under the plain Node
 * test runner, which (see tsconfig.test.json) doesn't resolve the `@/` alias. `as const` gives the
 * array's own `key` values a precise literal type without a separately-declared union;
 * `PublisherIdentityKey` (in `types/`) mirrors these same five strings.
 */
export const PUBLISHER_IDENTITIES = [
  { key: 'BUILDADDA', label: 'BuildAdda' },
  { key: 'ARJUN_MEHTA', label: 'Arjun Mehta' },
  { key: 'KARAN_SHAH', label: 'Karan Shah' },
  { key: 'NEEL_KAPOOR', label: 'Neel Kapoor' },
  { key: 'VIKRAM_RAO', label: 'Vikram Rao' },
] as const

const DEFAULT_LABEL = 'BuildAdda'

/** The display name for a platform post's publisher identity. Falls back to plain "BuildAdda" for
 *  an absent/unrecognized key, so a historical platform post (or one that predates a newly-added
 *  identity) still shows something sensible instead of breaking. */
export function publisherIdentityLabel(key: string | undefined): string {
  return PUBLISHER_IDENTITIES.find((i) => i.key === key)?.label ?? DEFAULT_LABEL
}
