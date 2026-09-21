import { useEffect, useRef } from 'react'

/** A compact set of emoji that fit a founder community's posts: reactions, work, money, growth, celebration. */
const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '🙂', '😉', '😍', '🥰', '😎', '🤩', '🥳',
  '🤔', '😮', '😢', '😭', '😡', '🙄', '😴', '🤯',
  '👍', '👎', '👏', '🙌', '🙏', '💪', '🤝', '👋',
  '🔥', '⭐', '✨', '🎉', '🏆', '🚀', '💡', '🎯',
  '📈', '📊', '💰', '💸', '🧠', '⚡', '🌱', '🌍',
  '❤️', '💙', '💚', '🧡', '✅', '❌', '📣', '📢',
  '🛠️', '📌', '📎', '📝', '📅', '☕', '🇮🇳', '🤞',
]

/**
 * A small popover grid of emoji. Picking one calls onPick and leaves the popover open so several can be added;
 * a click outside it, or Escape, closes it. Escape is handled in the capture phase and stopped, so it closes only
 * the picker and not the dialog it sits in.
 */
export function EmojiPicker({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      // The button that opens the picker toggles it itself; don't close-then-reopen.
      if ((target as Element).closest?.('[data-emoji-trigger]')) return
      onClose()
    }
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Choose an emoji"
      className="absolute bottom-full right-0 z-20 mb-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-border bg-surface p-2 shadow-lg animate-in"
    >
      <div className="grid grid-cols-8 gap-0.5">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick(emoji)}
            aria-label={emoji}
            className="flex size-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-surface-hover cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
