import { Avatar } from '@/components/ui/Avatar'

interface AvatarStackPerson {
  id: string
  name: string
  avatarUrl?: string
}

/** Overlapping avatars (`-space-x-2` + a ring so they read as separate circles, not one blob) — the
 *  same idiom PersonProfilePage's mutual-connections strip already used inline, extracted here so a
 *  "N people" row has one component instead of being re-hand-rolled per feature. */
export function AvatarStack({ people, max = 5, size = 'sm' }: { people: AvatarStackPerson[]; max?: number; size?: 'xs' | 'sm' | 'md' }) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length

  return (
    <div className="flex -space-x-2">
      {shown.map((p) => (
        <Avatar key={p.id} src={p.avatarUrl} name={p.name} size={size} className="ring-2 ring-surface" />
      ))}
      {extra > 0 && (
        <span className="flex size-8 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold text-fg-secondary ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </div>
  )
}
