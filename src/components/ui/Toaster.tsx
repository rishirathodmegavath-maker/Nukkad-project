import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore, type ToastTone } from '@/store/toast.store'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const toneStyles: Record<ToastTone, { icon: typeof CheckCircle2; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'text-success-500' },
  error: { icon: XCircle, classes: 'text-danger-500' },
  info: { icon: Info, classes: 'text-info-500' },
}

/** The short "new message" banner at the top of the screen. One at a time; tapping it opens that exact
 *  conversation (by id — never guessed from the sender's name). */
function MessageToastBanner() {
  const messageToast = useToastStore((s) => s.messageToast)
  const dismissMessage = useToastStore((s) => s.dismissMessage)
  const navigate = useNavigate()

  if (!messageToast) return null

  return (
    // Sits just under the sticky 4rem header (top-[4.5rem]) so it never covers the menu, search or
    // bell while it is up. pointer-events-none on the full-width wrapper so the empty space beside the
    // card never blocks the page underneath; only the card itself is tappable.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-[110] flex justify-center px-3"
    >
      <button
        key={messageToast.id}
        type="button"
        onClick={() => {
          dismissMessage(messageToast.id)
          navigate(`/messages/${messageToast.conversationId}`)
        }}
        aria-label={`New message from ${messageToast.senderName}. Open the conversation.`}
        className="pointer-events-auto animate-in flex w-full max-w-sm items-center gap-3 rounded-lg border border-border/80 bg-surface px-4 py-3 text-left shadow-xl backdrop-blur-md transition-colors hover:bg-surface-hover cursor-pointer"
      >
        <Avatar src={messageToast.avatarUrl} name={messageToast.senderName} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-fg">{messageToast.senderName}</span>
          <span className="block truncate text-sm text-fg-muted">{messageToast.preview}</span>
        </span>
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <>
      <MessageToastBanner />
      {toasts.length > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[100] flex flex-col gap-2 sm:left-auto sm:max-w-sm lg:bottom-5 lg:right-5">
          {toasts.map((t) => {
            const { icon: Icon, classes } = toneStyles[t.tone]
            return (
              <div
                key={t.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border border-border/80 bg-surface shadow-xl px-4 py-3.5 animate-in backdrop-blur-md',
                )}
              >
                <Icon className={cn('size-5 shrink-0 mt-0.5', classes)} />
                <p className="text-sm font-medium text-fg flex-1 leading-snug">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="text-fg-muted hover:text-fg rounded-lg p-1 hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
