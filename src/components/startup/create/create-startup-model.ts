import { ApiError } from '@/lib/api-client'
import { STARTUP_STAGES } from '@/lib/startup-meta'
import type { CreateStartupInput } from '@/services/startups.service'
import type { StartupStage, StartupVisibility, User } from '@/types'

export const STEPS = [
  { key: 'basics', label: 'Basics' },
  { key: 'startup', label: 'Startup' },
  { key: 'business', label: 'Business' },
  { key: 'traction', label: 'Traction' },
  { key: 'team', label: 'Team' },
  { key: 'review', label: 'Review' },
] as const

export type StepKey = (typeof STEPS)[number]['key']

export type FieldKey =
  | 'name'
  | 'tagline'
  | 'location'
  | 'website'
  | 'chapterId'
  | 'sector'
  | 'stage'
  | 'problem'
  | 'solution'
  | 'targetCustomer'
  | 'businessModel'
  | 'whatBuilding'
  | 'needs'
  | 'revenue'
  | 'customers'
  | 'users'
  | 'growth'
  | 'otherTraction'
  | 'visibility'

export type FieldErrors = Partial<Record<FieldKey, string>>

/** Which step each field is entered on, so an error can send the person to the right place. */
export const FIELD_STEP: Record<FieldKey, StepKey> = {
  name: 'basics',
  tagline: 'basics',
  location: 'basics',
  website: 'basics',
  chapterId: 'basics',
  sector: 'startup',
  stage: 'startup',
  problem: 'startup',
  solution: 'startup',
  targetCustomer: 'business',
  businessModel: 'business',
  whatBuilding: 'business',
  needs: 'business',
  revenue: 'traction',
  customers: 'traction',
  users: 'traction',
  growth: 'traction',
  otherTraction: 'traction',
  visibility: 'review',
}

export const FIELD_LABEL: Record<FieldKey, string> = {
  name: 'Startup name',
  tagline: 'Tagline',
  location: 'Location',
  website: 'Website',
  chapterId: 'Chapter',
  sector: 'Sector',
  stage: 'Stage',
  problem: 'Problem',
  solution: 'Solution',
  targetCustomer: 'Target customer',
  businessModel: 'Business model',
  whatBuilding: 'What you’re building',
  needs: 'Looking for',
  revenue: 'Revenue',
  customers: 'Customers',
  users: 'Users',
  growth: 'Growth',
  otherTraction: 'Other traction',
  visibility: 'Visibility',
}

/** The longest each field may be: the size of the column it is stored in, so a value that fits here always saves. */
export const LIMITS = {
  name: 200,
  tagline: 300,
  location: 200,
  website: 500,
  sector: 100,
  problem: 5000,
  solution: 5000,
  targetCustomer: 5000,
  businessModel: 5000,
  whatBuilding: 5000,
  revenue: 200,
  customers: 200,
  users: 200,
  growth: 200,
  otherTraction: 5000,
  need: 100,
} as const

export type TeamRoleChoice = 'MEMBER' | 'ADMIN'

export interface TeammateDraft {
  user: User
  role: TeamRoleChoice
}

export interface LogoDraft {
  /** The cropped picture, uploaded once the startup exists. */
  file: File
  /** A local address for previewing it. Revoked when the logo is replaced or the flow closes. */
  previewUrl: string
}

export interface CreateStartupDraft {
  name: string
  logo: LogoDraft | null
  tagline: string
  location: string
  website: string
  /** undefined until the person chooses: then their own chapter (if any) is used. */
  chapterId: string | undefined
  sector: string
  stage: StartupStage
  problem: string
  solution: string
  targetCustomer: string
  businessModel: string
  whatBuilding: string
  needs: string[]
  revenue: string
  customers: string
  users: string
  growth: string
  otherTraction: string
  teammates: TeammateDraft[]
  visibility: StartupVisibility
  fundraisingVisible: boolean
}

export const INITIAL_DRAFT: CreateStartupDraft = {
  name: '',
  logo: null,
  tagline: '',
  location: '',
  website: '',
  chapterId: undefined,
  sector: '',
  stage: 'Idea',
  problem: '',
  solution: '',
  targetCustomer: '',
  businessModel: '',
  whatBuilding: '',
  needs: [],
  revenue: '',
  customers: '',
  users: '',
  growth: '',
  otherTraction: '',
  teammates: [],
  visibility: 'Public',
  fundraisingVisible: true,
}

/** True once the person has typed or chosen anything, so leaving the page would throw work away. */
export function isDraftDirty(draft: CreateStartupDraft): boolean {
  return (
    !!draft.logo ||
    draft.teammates.length > 0 ||
    draft.needs.length > 0 ||
    draft.chapterId !== undefined ||
    (
      [
        'name', 'tagline', 'location', 'website', 'sector', 'problem', 'solution', 'targetCustomer', 'businessModel',
        'whatBuilding', 'revenue', 'customers', 'users', 'growth', 'otherTraction',
      ] as const
    ).some((key) => draft[key].trim() !== '') ||
    draft.stage !== INITIAL_DRAFT.stage ||
    draft.visibility !== INITIAL_DRAFT.visibility ||
    draft.fundraisingVisible !== INITIAL_DRAFT.fundraisingVisible
  )
}

/** A website may be typed with or without "https://"; the server adds it when it is missing, so this mirrors that. */
export function normalizeWebsite(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** A real-looking web address: a host with a dot in it and no spaces. (The server has the final say.) */
export function isValidWebsite(raw: string): boolean {
  const candidate = normalizeWebsite(raw)
  if (!candidate) return true
  if (/\s/.test(candidate)) return false
  try {
    const host = new URL(candidate).hostname
    return host.includes('.') && !host.startsWith('.') && !host.endsWith('.')
  } catch {
    return false
  }
}

function tooLong(label: string, value: string, limit: number): string | undefined {
  const length = value.trim().length
  return length > limit ? `${label} is too long: ${length} of ${limit} characters. Please shorten it.` : undefined
}

/** What is wrong with one field right now, or nothing. */
export function validateField(key: FieldKey, draft: CreateStartupDraft): string | undefined {
  switch (key) {
    case 'name':
      if (!draft.name.trim()) return 'Give your startup a name to continue.'
      return tooLong('The name', draft.name, LIMITS.name)
    case 'tagline':
      return tooLong('The tagline', draft.tagline, LIMITS.tagline)
    case 'location':
      return tooLong('The location', draft.location, LIMITS.location)
    case 'website':
      if (!draft.website.trim()) return undefined
      if (normalizeWebsite(draft.website).length > LIMITS.website) return tooLong('The website address', normalizeWebsite(draft.website), LIMITS.website)
      return isValidWebsite(draft.website) ? undefined : 'Enter a valid website, like yourstartup.com or https://yourstartup.com.'
    case 'sector':
      return tooLong('The sector', draft.sector, LIMITS.sector)
    case 'stage':
      return (STARTUP_STAGES as string[]).includes(draft.stage) ? undefined : 'Choose the stage your startup is at.'
    case 'problem':
      return tooLong('The problem', draft.problem, LIMITS.problem)
    case 'solution':
      return tooLong('The solution', draft.solution, LIMITS.solution)
    case 'targetCustomer':
      return tooLong('The target customer', draft.targetCustomer, LIMITS.targetCustomer)
    case 'businessModel':
      return tooLong('The business model', draft.businessModel, LIMITS.businessModel)
    case 'whatBuilding':
      return tooLong('This', draft.whatBuilding, LIMITS.whatBuilding)
    case 'revenue':
      return tooLong('Revenue', draft.revenue, LIMITS.revenue)
    case 'customers':
      return tooLong('Customers', draft.customers, LIMITS.customers)
    case 'users':
      return tooLong('Users', draft.users, LIMITS.users)
    case 'growth':
      return tooLong('Growth', draft.growth, LIMITS.growth)
    case 'otherTraction':
      return tooLong('This', draft.otherTraction, LIMITS.otherTraction)
    default:
      return undefined
  }
}

const STEP_FIELDS: Record<StepKey, FieldKey[]> = {
  basics: ['name', 'tagline', 'location', 'website'],
  startup: ['sector', 'stage', 'problem', 'solution'],
  business: ['targetCustomer', 'businessModel', 'whatBuilding'],
  traction: ['revenue', 'customers', 'users', 'growth', 'otherTraction'],
  team: [],
  review: [],
}

export function fieldsOfStep(step: StepKey): FieldKey[] {
  return STEP_FIELDS[step]
}

export function validateStep(step: StepKey, draft: CreateStartupDraft): FieldErrors {
  const errors: FieldErrors = {}
  for (const key of STEP_FIELDS[step]) {
    const message = validateField(key, draft)
    if (message) errors[key] = message
  }
  return errors
}

/** Every step at once: the last check before the startup is created. */
export function validateAll(draft: CreateStartupDraft): FieldErrors {
  const errors: FieldErrors = {}
  for (const { key } of STEPS) Object.assign(errors, validateStep(key, draft))
  return errors
}

/** The draft as the create call wants it. Text is trimmed; anything left empty is simply not sent, and "0" is kept. */
export function buildCreateInput(draft: CreateStartupDraft, fallbackChapterId: string): CreateStartupInput {
  const text = (value: string) => value.trim() || undefined
  return {
    name: draft.name.trim(),
    tagline: text(draft.tagline),
    location: text(draft.location),
    website: text(draft.website),
    chapterId: draft.chapterId ?? (fallbackChapterId || undefined),
    sector: text(draft.sector),
    stage: draft.stage,
    problem: text(draft.problem),
    solution: text(draft.solution),
    targetCustomer: text(draft.targetCustomer),
    businessModel: text(draft.businessModel),
    whatBuilding: text(draft.whatBuilding),
    needs: draft.needs,
    revenue: text(draft.revenue),
    customers: text(draft.customers),
    users: text(draft.users),
    growth: text(draft.growth),
    otherTraction: text(draft.otherTraction),
    visibility: draft.visibility,
    fundraisingVisible: draft.fundraisingVisible,
  }
}

export interface CreateFailure {
  /** What to tell the person, in plain words. */
  message: string
  /** The fields the server named, so they can be marked where they are entered. */
  fields: FieldErrors
}

const FIELD_KEYS = Object.keys(FIELD_LABEL) as FieldKey[]

/**
 * Turns whatever the server said into something a person can act on. A validation failure arrives as
 * "name: must not be blank; website: size must be between 0 and 500", a rule failure as a sentence such as
 * "Website is not a valid URL"; both are matched to the field they are about.
 */
export function describeCreateFailure(err: unknown): CreateFailure {
  // status 0 is how the API client reports a request that never got an answer (offline, server unreachable).
  if (!(err instanceof ApiError) || err.status === 0) {
    return { message: 'We couldn’t reach the server to create your startup. Check your connection and try again. Your answers are still here.', fields: {} }
  }
  const fields: FieldErrors = {}
  if (err.errorCode === 'VALIDATION_ERROR') {
    const parts = err.message.split('; ').map((part) => {
      const [rawKey, ...rest] = part.split(': ')
      const key = FIELD_KEYS.find((k) => k === rawKey.replace(/\[.*$/, ''))
      const detail = rest.join(': ')
      if (!key) return part
      const sentence = `${FIELD_LABEL[key]}: ${detail}`
      fields[key] = sentence
      return sentence
    })
    return { message: parts.join('. '), fields }
  }
  const lower = err.message.toLowerCase()
  const named = FIELD_KEYS.find((k) => k !== 'visibility' && lower.startsWith(FIELD_LABEL[k].toLowerCase()))
  if (named) fields[named] = err.message
  if (lower.startsWith('unknown startup stage')) fields.stage = err.message
  return { message: err.message || 'We couldn’t create your startup. Your answers are still here, so you can try again.', fields }
}

/** "42 / 300 characters" once a value is close to its limit; before that the ordinary helper text. */
export function hintWithCount(helper: string | undefined, value: string, limit: number): string | undefined {
  const length = value.trim().length
  if (length >= Math.floor(limit * 0.8)) return `${length} / ${limit} characters${helper ? ` · ${helper}` : ''}`
  return helper
}
