/** Small unread-count badge, positioned over the top-right corner of its (relatively positioned) parent. */
export function NotificationDot({ count }: { count: number }) {
  if (!count) return null
  return (
    <span
      aria-hidden="true"
      className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white"
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}
