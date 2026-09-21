/**
 * The link the way it should be stored and opened: an absolute http(s) URL, or null when what was typed can't be one.
 * "example.com/page" gets "https://" put in front, because that is what a person means when they type it.
 */
export function normalizeLink(input: string): string | null {
  const typed = input.trim()
  if (!typed || /\s/.test(typed)) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(typed) ? typed : `https://${typed}`
  let parsed: URL
  try {
    parsed = new URL(withScheme)
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  // "https://" and "https://localhost" style inputs: require a real-looking host (a dot, and no stray punctuation).
  if (!parsed.hostname.includes('.') || parsed.hostname.startsWith('.') || parsed.hostname.endsWith('.')) return null
  return withScheme.length > 500 ? null : withScheme
}

/** The site name to show on a link card: "www.example.com" → "example.com". */
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** The URL if it is safe to put in an href (http or https only); null otherwise. */
export function safeHref(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}
