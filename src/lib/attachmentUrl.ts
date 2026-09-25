/**
 * A chat attachment's download URL is presigned by the backend and expires
 * (ConversationService.ATTACHMENT_URL_TTL — one hour). It is never persisted anywhere: it lives only in the
 * in-memory query cache, and once it is old the client asks the backend for a fresh one
 * (GET /conversations/{id}/messages/{messageId}/attachment) rather than trusting the stale link.
 */
export const ATTACHMENT_URL_TTL_MS = 60 * 60 * 1000

/** Refresh a little before the real expiry, so a click on an old link never races it. */
export const ATTACHMENT_URL_REFRESH_AFTER_MS = 45 * 60 * 1000

/** True when a URL minted at `issuedAt` (epoch ms) is old enough to replace before it's used. An unknown
 * issue time is treated as stale: better one extra request than a link that has silently expired. */
export function isAttachmentUrlStale(issuedAt: number | undefined, now: number = Date.now()): boolean {
  if (issuedAt === undefined) return true
  return now - issuedAt >= ATTACHMENT_URL_REFRESH_AFTER_MS
}
