import { Link } from 'react-router-dom'
import { Users, MapPin } from 'lucide-react'
import type { Chapter } from '@/types'
import { Card } from '@/components/ui/Card'
import { CoverImage } from '@/components/ui/CoverImage'
import { pluralize } from '@/lib/utils'

export function ChapterCard({ chapter }: { chapter: Chapter }) {
  const location = [chapter.city, chapter.country].filter(Boolean).join(', ')

  return (
    <Card interactive padding="none" className="overflow-hidden rounded-xl border border-border/80 shadow-xs hover:border-border-strong transition-all flex flex-col bg-surface">
      <Link to={`/chapters/${chapter.id}`} className="flex flex-col h-full">
        <div className="h-32 w-full overflow-hidden bg-surface-sunken relative">
          <CoverImage src={chapter.coverImageUrl} alt="" className="size-full object-cover" />
        </div>
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-fg text-base leading-snug truncate">{chapter.name}</h3>
            <p className="text-sm text-fg-muted line-clamp-2 mt-1 leading-relaxed">{chapter.description}</p>
          </div>
          <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border/60 text-xs text-fg-secondary font-medium">
            <span className="flex items-center gap-1.5 shrink-0">
              <Users className="size-3.5" /> {pluralize(chapter.memberCount ?? 0, 'member')}
            </span>
            {location && (
              <span className="flex items-center gap-1.5 min-w-0">
                <MapPin className="size-3.5 shrink-0" /> <span className="truncate">{location}</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  )
}
