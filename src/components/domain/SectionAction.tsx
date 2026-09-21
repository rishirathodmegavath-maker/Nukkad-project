import type { LucideIcon } from 'lucide-react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/**
 * The "Edit" / "Add" control in a profile card's header. One look everywhere, a real target size
 * (bigger still on touch screens) and a name that says which section it belongs to, so a screen
 * reader doesn't hear the same bare "Edit" five times.
 */
export function SectionAction({
  label,
  section,
  icon: Icon = Pencil,
  onClick,
}: {
  label: string
  section: string
  icon?: LucideIcon
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-mr-2 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
      leftIcon={<Icon className="size-3.5" aria-hidden="true" />}
      aria-label={`${label} ${section.toLowerCase()}`}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}
