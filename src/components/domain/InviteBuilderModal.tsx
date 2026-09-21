import { useRef, useState } from 'react'
import { Check, Copy, Mail, MessageCircle, Share2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from '@/store/toast.store'

/** The sign-up page of this site (so it is the right address on production, staging and locally). */
function inviteLink(): string {
  return `${window.location.origin}/signup`
}

function inviteMessage(link: string): string {
  return `I’m building on BuildAdda, where builders meet. Come join me: ${link}`
}

/**
 * "Invite a builder": a link to the sign-up page with ways to send it: copy it, WhatsApp, email, or the phone's own
 * share sheet where the browser has one. Nothing is sent from here; the person chooses where the invite goes.
 */
export function InviteBuilderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const link = inviteLink()
  const message = inviteMessage(link)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // No clipboard permission (or an insecure page): select the link so it can be copied by hand.
      inputRef.current?.select()
      toast.info('Press Ctrl+C (or Cmd+C) to copy the link')
      return
    }
    setCopied(true)
    toast.success('Invite link copied')
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareNatively() {
    try {
      await navigator.share({ title: 'Join me on BuildAdda', text: 'I’m building on BuildAdda, where builders meet.', url: link })
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  }

  const optionClasses =
    'flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-fg transition-colors hover:border-border-strong hover:bg-surface-hover cursor-pointer'

  return (
    <Modal open={open} onClose={onClose} size="md" title="Invite a builder" description="Know someone building something? Invite them to BuildAdda.">
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="invite-link" className="mb-1.5 block text-sm font-medium text-fg-secondary">
            Your invite link
          </label>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              id="invite-link"
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface-sunken/60 px-3.5 text-sm text-fg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
            <Button onClick={copy} leftIcon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}>
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={optionClasses}
          >
            <MessageCircle className="size-4 text-emerald-500" aria-hidden="true" />
            Share on WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent('Join me on BuildAdda')}&body=${encodeURIComponent(message)}`}
            className={optionClasses}
          >
            <Mail className="size-4 text-fg-brand" aria-hidden="true" />
            Send by email
          </a>
          {canShare && (
            <button type="button" onClick={shareNatively} className={`${optionClasses} sm:col-span-2`}>
              <Share2 className="size-4 text-fg-brand" aria-hidden="true" />
              More ways to share
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
