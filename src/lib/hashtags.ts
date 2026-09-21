/**
 * #hashtags in a post's text, by the same rules as the server (feed/service/Hashtags.java), so a tag that is
 * drawn as a link is a tag the server recorded: "#" then 2 to 50 letters (with their combining marks), digits or
 * underscores, at least one letter, not glued to a preceding word or "#", and only the first 10 different tags.
 */
const TAG = /#([\p{L}\p{M}\p{N}_]{2,50})(?![\p{L}\p{M}\p{N}_])/gu
const WORD_CHARACTER = /[\p{L}\p{M}\p{N}_#]/u
const HAS_LETTER = /\p{L}/u

export const MAX_TAGS_PER_POST = 10

export interface TextPart {
  text: string
  /** Set (lowercase, without "#") when this part is a hashtag. */
  tag?: string
}

/** The text cut into plain parts and hashtag parts, in order; joining every part's text gives the original text back. */
export function splitHashtags(text: string): TextPart[] {
  const parts: TextPart[] = []
  const seen = new Set<string>()
  let last = 0
  for (const match of text.matchAll(TAG)) {
    const start = match.index ?? 0
    const before = start > 0 ? text.charAt(start - 1) : ''
    const tag = match[1].toLowerCase()
    const glued = before !== '' && WORD_CHARACTER.test(before)
    if (glued || !HAS_LETTER.test(match[1])) continue
    if (!seen.has(tag) && seen.size >= MAX_TAGS_PER_POST) continue
    seen.add(tag)
    if (start > last) parts.push({ text: text.slice(last, start) })
    parts.push({ text: match[0], tag })
    last = start + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

/** Where a tag leads: the feed, showing only posts that use it. */
export function feedTagPath(tag: string): string {
  return `/feed?tag=${encodeURIComponent(tag)}`
}
