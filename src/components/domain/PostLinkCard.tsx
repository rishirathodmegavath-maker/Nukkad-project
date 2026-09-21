import { ExternalLink, Link2, X } from 'lucide-react'
import { linkHost, safeHref } from '@/lib/links'
import { youtubeId } from '@/lib/resource-catalog'

/**
 * A link attached to a post, drawn as a card: the site name, the address, and the video poster when it is a
 * YouTube link. On a post it opens in a new tab; in the composer (onRemove given) it has a remove button.
 * Only http(s) links become real links, so a bad value can never turn into a script link.
 */
export function PostLinkCard({ url, onRemove }: { url: string; onRemove?: () => void }) {
  const href = safeHref(url)
  const video = youtubeId(url)

  const body = (
    <>
      {video ? (
        <img src={`https://i.ytimg.com/vi/${video}/mqdefault.jpg`} alt="" className="h-full w-28 shrink-0 object-cover" loading="lazy" />
      ) : (
        <span className="m-3 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Link2 className="size-5" />
        </span>
      )}
      <span className="min-w-0 flex-1 py-3 pr-3">
        <span className="block truncate text-sm font-semibold text-fg group-hover:text-fg-brand transition-colors">{linkHost(url)}</span>
        <span className="block truncate text-xs text-fg-muted">{url}</span>
      </span>
      {!onRemove && <ExternalLink className="mr-3 size-4 shrink-0 self-center text-fg-muted" aria-hidden="true" />}
    </>
  )

  const cardClasses =
    'group flex min-h-16 items-stretch overflow-hidden rounded-xl border border-border/80 bg-surface-sunken/40 transition-colors hover:border-border-strong hover:bg-surface-hover'

  if (!href) {
    return <div className={cardClasses}>{body}</div>
  }

  return (
    <div className="relative">
      <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc" className={cardClasses} aria-label={`Open link: ${linkHost(url)}`}>
        {body}
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove link"
          className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-neutral-900/70 text-white transition-colors hover:bg-neutral-900 cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
