import { contrastRatio, ensureContrast, hexToHsl, hslToHex, type Hsl, WCAG_AA_NORMAL_TEXT } from './color'

export type ThemeMode = 'light' | 'dark'

const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const
export type ScaleStep = (typeof SCALE_STEPS)[number]

// Target lightness offsets from the anchor (step 600 = the user's chosen colour, since
// Button.tsx's primary variant renders bg-brand-600 as the actual visible button fill).
const LIGHTNESS_OFFSET: Record<ScaleStep, number> = {
  900: -24,
  800: -16,
  700: -8,
  600: 0,
  500: 8,
  400: 18,
  300: 30,
  200: 42,
  100: 52,
  50: 60,
}

// Desaturate the lightest tints slightly so they read as soft accents, not neon pastels.
const SATURATION_MULTIPLIER: Partial<Record<ScaleStep, number>> = {
  50: 0.8,
  100: 0.8,
  200: 0.88,
  300: 0.95,
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/**
 * Generates a full 50-900 scale anchored so that step 600 equals `baseHex` exactly (the colour
 * the user actually picked), matching how tokens.css's brand-600 is the real "Primary Action" fill.
 */
export function generateScale(baseHex: string): Record<ScaleStep, string> {
  const baseHsl = hexToHsl(baseHex)
  const scale = {} as Record<ScaleStep, string>
  if (!baseHsl) {
    SCALE_STEPS.forEach((step) => (scale[step] = baseHex))
    return scale
  }
  for (const step of SCALE_STEPS) {
    const l = clamp(baseHsl.l + LIGHTNESS_OFFSET[step], 4, 99)
    const s = clamp(baseHsl.s * (SATURATION_MULTIPLIER[step] ?? 1), 0, 100)
    const hsl: Hsl = { h: baseHsl.h, s, l }
    scale[step] = hslToHex(hsl)
  }
  return scale
}

export interface ContrastCheck {
  ratio: number
  passesAA: boolean
  suggestedHex?: string
}

/** Checks white-text-on-primary contrast (the common case: Button primary variant uses text-white). */
export function checkPrimaryContrast(primaryHex: string): ContrastCheck {
  const ratio = contrastRatio(primaryHex, '#ffffff')
  const passesAA = ratio >= WCAG_AA_NORMAL_TEXT
  if (passesAA) return { ratio, passesAA }
  return { ratio, passesAA, suggestedHex: ensureContrast(primaryHex, '#ffffff', WCAG_AA_NORMAL_TEXT) }
}

function hexToRgbTriplet(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

const BRAND_VAR_PREFIX = '--color-brand-'
const DERIVED_VARS = ['--surface-selected', '--text-brand', '--nav-text-active', '--nav-surface-active', '--shadow-focus'] as const

/**
 * Applies a custom brand colour app-wide by writing inline CSS custom properties on <html>,
 * which outrank tokens.css's `:root`/`[data-theme]` rules. Pass `null` to clear all overrides
 * and fall back to the shipped BuildAdda Indigo default.
 */
export function applyBrandOverride(baseHex: string | null, mode: ThemeMode): void {
  const root = document.documentElement.style

  if (!baseHex) {
    for (const step of SCALE_STEPS) root.removeProperty(`${BRAND_VAR_PREFIX}${step}`)
    for (const name of DERIVED_VARS) root.removeProperty(name)
    return
  }

  const scale = generateScale(baseHex)
  for (const step of SCALE_STEPS) root.setProperty(`${BRAND_VAR_PREFIX}${step}`, scale[step])

  root.setProperty('--text-brand', mode === 'dark' ? scale[400] : scale[600])
  root.setProperty('--nav-text-active', mode === 'dark' ? scale[400] : scale[600])

  if (mode === 'dark') {
    root.setProperty('--surface-selected', `rgb(${hexToRgbTriplet(scale[500])} / 0.15)`)
    root.setProperty('--shadow-focus', `0 0 0 3px rgb(${hexToRgbTriplet(scale[500])} / 0.35)`)
    // Dark mode's active-nav background is intentionally a neutral surface in the shipped
    // design (text colour alone signals "active") — don't tint it, matches existing behaviour.
    root.removeProperty('--nav-surface-active')
  } else {
    root.setProperty('--surface-selected', scale[100])
    root.setProperty('--nav-surface-active', scale[100])
    root.setProperty('--shadow-focus', `0 0 0 3px rgb(${hexToRgbTriplet(scale[500])} / 0.20)`)
  }
}
