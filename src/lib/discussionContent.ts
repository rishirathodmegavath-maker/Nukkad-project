// Kept short enough that the bolded title never wraps to more than a line or two on a phone.
const TITLE_MAX = 88

/**
 * A discussion has no separate "title" field — the backend's DiscussionDto only has free-text
 * `content` (see types/discussion.ts). This splits that one real field into a bold headline and an
 * optional remainder for display, without inventing any new data: an explicit first line (the common
 * case — most discussions are written as a question or topic on its own line, then detail below)
 * becomes the title; otherwise a long single paragraph is broken at the nearest sentence end, or
 * failing that a word boundary, so the headline never lands mid-word. Shared by DiscussionCard (list)
 * and DiscussionDetailPage so the two never derive a different title for the same discussion.
 */
export function splitDiscussionContent(content: string): { title: string; preview?: string } {
  const trimmed = content.trim()
  if (!trimmed) return { title: 'Discussion' }

  const newlineIndex = trimmed.indexOf('\n')
  if (newlineIndex > 0) {
    const title = trimmed.slice(0, newlineIndex).trim()
    const preview = trimmed.slice(newlineIndex + 1).trim()
    return preview ? { title, preview } : { title }
  }

  if (trimmed.length <= TITLE_MAX) return { title: trimmed }

  const window = trimmed.slice(0, TITLE_MAX)
  const sentenceEnd = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '))
  const hasCleanBreak = sentenceEnd > 20
  const cut = hasCleanBreak ? sentenceEnd + 1 : window.lastIndexOf(' ')
  const safeCut = cut > 0 ? cut : TITLE_MAX

  return {
    title: trimmed.slice(0, safeCut).trim() + (hasCleanBreak ? '' : '…'),
    preview: trimmed.slice(safeCut).trim(),
  }
}
