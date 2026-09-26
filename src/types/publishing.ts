/** Matches the backend's shared `com.nukkad.common.publishing.PublisherIdentity` enum constants
 *  exactly — see lib/publisher-identities.ts for display labels. A fixed, closed set; never free
 *  text. Reused by every content type an admin can create (Feed, Ideas, Startups, Opportunities,
 *  Grants, Events, Resources, Discussions). */
export type PublisherIdentityKey = 'BUILDADDA' | 'ARJUN_MEHTA' | 'KARAN_SHAH' | 'NEEL_KAPOOR' | 'VIKRAM_RAO'
