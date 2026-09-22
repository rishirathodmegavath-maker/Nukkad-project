import { Building2, CalendarDays, FolderOpen, Landmark, LineChart, Lightbulb, Eye, Trash2, Users, type LucideIcon } from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import {
  FIELD_LABEL,
  INITIAL_DRAFT,
  validateField,
  type CreateStartupDraft,
  type FieldErrors,
  type FieldKey,
} from '@/components/startup/create/create-startup-model'

export type SectionKey = 'basics' | 'story' | 'traction' | 'fundraising' | 'materials' | 'events' | 'team' | 'visibility' | 'delete'

export interface SectionMeta {
  key: SectionKey
  label: string
  /** One line under the label in the navigation. */
  hint: string
  icon: LucideIcon
}

/** The parts of a startup a founder or admin can manage, in the order they appear in the page's navigation. */
export const MANAGE_SECTIONS: SectionMeta[] = [
  { key: 'basics', label: 'Basic information', hint: 'Name, logo, tagline, website, stage', icon: Building2 },
  { key: 'story', label: 'Problem & solution', hint: 'What you build and who it’s for', icon: Lightbulb },
  { key: 'traction', label: 'Traction', hint: 'Revenue, customers, users, growth', icon: LineChart },
  { key: 'fundraising', label: 'Fundraising', hint: 'Round, target, raised, visibility', icon: Landmark },
  { key: 'materials', label: 'Materials', hint: 'Pitch deck, demo, links', icon: FolderOpen },
  { key: 'events', label: 'Events', hint: 'Events this startup takes part in', icon: CalendarDays },
  { key: 'team', label: 'Team', hint: 'Teammates, roles, join requests', icon: Users },
  { key: 'visibility', label: 'Visibility', hint: 'Who can see your startup', icon: Eye },
  { key: 'delete', label: 'Delete startup', hint: 'Permanently remove it', icon: Trash2 },
]

export function isSectionKey(value: string | null): value is SectionKey {
  return !!value && MANAGE_SECTIONS.some((s) => s.key === value)
}

/** The address of a startup's management page, optionally on a given section. */
export function managePath(startupId: string, section?: SectionKey): string {
  return section && section !== 'basics' ? `/startups/${startupId}/manage?section=${section}` : `/startups/${startupId}/manage`
}

/**
 * The same length and format rules the create flow uses (they are the size of the columns the values are stored in),
 * applied to one field of a section's values. A field the create flow doesn't know about has nothing to check.
 */
export function checkField(key: FieldKey, values: Partial<CreateStartupDraft>): string | undefined {
  if (key === 'name' && !(values.name ?? '').trim()) return 'Your startup needs a name.'
  return validateField(key, { ...INITIAL_DRAFT, ...values })
}

export function checkFields(keys: FieldKey[], values: Partial<CreateStartupDraft>): FieldErrors {
  const errors: FieldErrors = {}
  for (const key of keys) {
    const message = checkField(key, values)
    if (message) errors[key] = message
  }
  return errors
}

export interface SaveFailure {
  /** What to tell the person, in plain words. */
  message: string
  /** The fields the server named, so they can be marked where they are entered. */
  fields: FieldErrors
}

const FIELD_KEYS = Object.keys(FIELD_LABEL) as FieldKey[]

/**
 * Turns whatever the server said about a save into something a person can act on: a validation failure arrives as
 * "name: must not be blank; website: size must be between 0 and 500", a rule failure as a sentence such as
 * "Website is not a valid URL". Both are matched to the field they are about.
 */
export function describeSaveFailure(err: unknown): SaveFailure {
  // status 0 is how the API client reports a request that never got an answer (offline, server unreachable).
  if (!(err instanceof ApiError) || err.status === 0) {
    return { message: 'We couldn’t reach the server, so nothing was saved. Check your connection and try again. Your changes are still here.', fields: {} }
  }
  if (err.status === 403) {
    return { message: 'You no longer have permission to change this. Ask a founder of the startup.', fields: {} }
  }
  const fields: FieldErrors = {}
  if (err.errorCode === 'VALIDATION_ERROR') {
    const parts = err.message.split('; ').map((part) => {
      const [rawKey, ...rest] = part.split(': ')
      const key = FIELD_KEYS.find((k) => k === rawKey.replace(/\[.*$/, ''))
      if (!key) return part
      const sentence = `${FIELD_LABEL[key]}: ${rest.join(': ')}`
      fields[key] = sentence
      return sentence
    })
    return { message: parts.join('. '), fields }
  }
  const lower = err.message.toLowerCase()
  const named = FIELD_KEYS.find((k) => k !== 'visibility' && lower.startsWith(FIELD_LABEL[k].toLowerCase()))
  if (named) fields[named] = err.message
  if (lower.startsWith('unknown startup stage')) fields.stage = err.message
  return { message: err.message || 'We couldn’t save your changes. They are still here, so you can try again.', fields }
}

/** The whole-rupee amounts a fundraise takes: digits only, so nothing the server would refuse can be typed. */
export function parseAmount(raw: string): number | undefined {
  const digits = raw.replace(/[,\s₹]/g, '')
  return /^\d{1,15}$/.test(digits) ? Number(digits) : undefined
}
