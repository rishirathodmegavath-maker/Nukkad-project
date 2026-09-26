import { Link } from 'react-router-dom'
import { Building2, Calendar, Crown, MapPin, Pencil, Tag } from 'lucide-react'
import type { Chapter, User } from '@/types'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-fg-muted">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium text-fg">{children}</span>
    </div>
  )
}

/**
 * The chapter detail page's right-sidebar "About this Chapter" card: institution, location,
 * founded date, president and its optional type/focus-area tags — every field either already on
 * `Chapter` or the three new ones (institution/type/focusAreas), never invented data. Edit opens
 * the existing ChapterEditModal, shown only to the chapter's own president (same guard the update
 * endpoint itself enforces).
 */
export function AboutChapterCard({
  chapter,
  president,
  canEdit,
  onEdit,
}: {
  chapter: Chapter
  president?: User
  canEdit: boolean
  onEdit: () => void
}) {
  const location = [chapter.city, chapter.country].filter(Boolean).join(', ')
  // A real founding date if the chapter has one (backfilled by an admin, or set by its own
  // president) — otherwise fall back to when the record itself was created.
  const founded = new Date(chapter.foundedAt ?? chapter.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-fg">About this Chapter</h2>
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit chapter"
            className="flex size-7 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg cursor-pointer"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {chapter.institution && (
          <InfoRow icon={<Building2 className="size-3.5" />} label="Institution">
            {chapter.institution}
          </InfoRow>
        )}
        {location && (
          <InfoRow icon={<MapPin className="size-3.5" />} label="Location">
            {location}
          </InfoRow>
        )}
        <InfoRow icon={<Calendar className="size-3.5" />} label="Founded">
          {founded}
        </InfoRow>
        {chapter.type && (
          <InfoRow icon={<Tag className="size-3.5" />} label="Type">
            {chapter.type}
          </InfoRow>
        )}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-fg-muted">
            <Crown className="size-3.5" />
            President
          </span>
          {president ? (
            <Link to={`/people/${president.id}`} className="flex items-center gap-1.5 font-medium text-fg hover:underline">
              <Avatar src={president.avatarUrl} name={president.name} size="xs" />
              {president.name}
            </Link>
          ) : (
            <Skeleton className="h-4 w-20" />
          )}
        </div>
      </div>

      {chapter.focusAreas && chapter.focusAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
          {chapter.focusAreas.map((area) => (
            <Badge key={area} tone="neutral">
              {area}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}
