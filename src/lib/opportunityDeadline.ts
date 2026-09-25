const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Whether the last day to apply has gone by. An application deadline is a date, not a moment: the forms send midnight
 * UTC of the chosen day and the page shows "Apply by <date>", so it means "up to the end of that day". This is the same
 * rule the server enforces (OpportunityService), so the button and the API agree.
 */
export function isApplicationDeadlinePassed(deadlineIso: string | undefined | null, now: number = Date.now()): boolean {
  if (!deadlineIso) return false
  const deadline = new Date(deadlineIso).getTime()
  if (Number.isNaN(deadline)) return false
  const startOfDeadlineDay = Math.floor(deadline / DAY_MS) * DAY_MS
  return now >= startOfDeadlineDay + DAY_MS
}
