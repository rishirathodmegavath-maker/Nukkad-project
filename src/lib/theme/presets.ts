import type { ThemePresetId } from '@/types'

export interface ThemePresetDef {
  id: ThemePresetId
  label: string
  /** Anchors scale step 600 exactly — i.e. this is the literal primary-button colour. */
  baseHex: string
}

// Every base colour below is pre-verified (>= 4.5:1 white-text contrast, WCAG AA) so no preset
// ever needs runtime auto-correction — see the contrast check performed before picking these.
export const THEME_PRESETS: ThemePresetDef[] = [
  { id: 'NUKKAD_INDIGO', label: 'Buildadda Indigo', baseHex: '#4f46e5' },
  { id: 'OCEAN_BLUE', label: 'Ocean Blue', baseHex: '#2563eb' },
  { id: 'TEAL', label: 'Teal', baseHex: '#0f766e' },
  { id: 'EMERALD', label: 'Emerald', baseHex: '#047857' },
  { id: 'VIOLET', label: 'Violet', baseHex: '#7c3aed' },
  { id: 'PURPLE', label: 'Purple', baseHex: '#9333ea' },
  { id: 'ROSE', label: 'Rose', baseHex: '#e11d48' },
  { id: 'AMBER', label: 'Amber', baseHex: '#b45309' },
  { id: 'ORANGE', label: 'Orange', baseHex: '#c2410c' },
  { id: 'RED', label: 'Red', baseHex: '#dc2626' },
  { id: 'PINK', label: 'Pink', baseHex: '#db2777' },
  { id: 'CYAN', label: 'Cyan', baseHex: '#0e7490' },
  { id: 'SLATE', label: 'Slate', baseHex: '#475569' },
  { id: 'NEUTRAL', label: 'Neutral', baseHex: '#52525b' },
]

const PRESET_MAP = new Map(THEME_PRESETS.map((p) => [p.id, p]))

export function getPresetDef(id: ThemePresetId): ThemePresetDef | undefined {
  return PRESET_MAP.get(id)
}

/** Resolves the effective anchor colour for a preset/custom selection, or null for the shipped default (no override). */
export function resolvePresetBaseColor(preset: ThemePresetId, customPrimaryColor: string | null): string | null {
  if (preset === 'NUKKAD_INDIGO') return null
  if (preset === 'CUSTOM') return customPrimaryColor
  return getPresetDef(preset)?.baseHex ?? null
}
