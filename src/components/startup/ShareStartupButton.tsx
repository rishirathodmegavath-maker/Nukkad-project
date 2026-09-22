import { Link2, Share2, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu'
import { toast } from '@/store/toast.store'

/** The address of a startup's profile: always the plain profile, never a particular tab or filter. */
function startupProfileUrl(startupId: string): string {
  return `${window.location.origin}/startups/${startupId}`
}

/**
 * "Share": copies the profile link. On a device whose browser has its own share sheet (most phones) it also offers
 * "Share via…". Nothing is stored or sent from here.
 */
export function ShareStartupButton({ startupId, startupName }: { startupId: string; startupName: string }) {
  const url = startupProfileUrl(startupId)
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Profile link copied')
    } catch {
      // No clipboard permission (or an insecure page): show the link so it can still be copied by hand.
      toast.info(`Copy this link: ${url}`)
    }
  }

  async function shareNatively() {
    try {
      await navigator.share({ title: startupName, text: `${startupName} on BuildAdda`, url })
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  }

  const label = (
    <Button variant="secondary" leftIcon={<Share2 className="size-4" />} onClick={canNativeShare ? undefined : copyLink}>
      Share
    </Button>
  )

  if (!canNativeShare) return label

  return (
    <DropdownMenu align="left" trigger={label}>
      <DropdownItem icon={<Link2 className="size-4" />} onClick={copyLink}>
        Copy link
      </DropdownItem>
      <DropdownItem icon={<Send className="size-4" />} onClick={shareNatively}>
        Share via…
      </DropdownItem>
    </DropdownMenu>
  )
}
