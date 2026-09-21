import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { feedTagPath, splitHashtags } from '@/lib/hashtags'

/** A post's text with every #hashtag turned into a link to the feed for that tag. Everything else stays plain text. */
export function HashtagText({ text }: { text: string }) {
  return (
    <>
      {splitHashtags(text).map((part, i) =>
        part.tag ? (
          <Link key={i} to={feedTagPath(part.tag)} className="font-semibold text-fg-brand hover:underline">
            {part.text}
          </Link>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  )
}
