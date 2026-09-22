import type { BadgeTone } from '@/components/ui/Badge'
import type { StartupStage } from '@/types'

/** The stages a startup can be at, in order. The labels are the values the API stores and filters by. */
export const STARTUP_STAGES: StartupStage[] = ['Idea', 'MVP', 'Early Traction', 'Growth', 'Scaling']

/** How a stage is coloured wherever it appears as a badge. */
export const STAGE_TONE: Record<StartupStage, BadgeTone> = {
  Idea: 'neutral',
  MVP: 'info',
  'Early Traction': 'primary',
  Growth: 'success',
  Scaling: 'success',
}

/** 1240 -> "1.2K": for counts on cards and metric tiles. Small numbers are shown as they are. */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

/** Only web links become real links; anything else a founder typed is shown as plain text. */
export function safeHref(url: string | undefined): string | undefined {
  if (!url) return undefined
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : undefined
}
