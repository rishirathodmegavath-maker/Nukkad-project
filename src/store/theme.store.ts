import { create } from 'zustand'
import { applyBrandOverride, type ThemeMode } from '@/lib/theme/apply'
import { resolvePresetBaseColor } from '@/lib/theme/presets'
import { clearAdvancedOverrides as clearAdvancedOverridesApi, resetAppearanceSettings, updateAppearanceSettings } from '@/services/appearance.service'
import type { AppearanceSettings, ThemePresetId } from '@/types'

export type ThemePreference = 'light' | 'dark' | 'system'

export interface AdvancedOverrides {
  sidebarColor: string | null
  pageBgColor: string | null
  cardBgColor: string | null
  headerBgColor: string | null
  borderColor: string | null
  secondarySurfaceColor: string | null
}

const EMPTY_OVERRIDES: AdvancedOverrides = {
  sidebarColor: null,
  pageBgColor: null,
  cardBgColor: null,
  headerBgColor: null,
  borderColor: null,
  secondarySurfaceColor: null,
}

let customColorPersistTimer: ReturnType<typeof setTimeout> | undefined

const THEME_KEY = 'nukkad.theme'
const CACHE_KEY = 'nukkad.appearance.cache'
const RECENT_COLORS_KEY = 'nukkad.recentColors'
const MAX_RECENT_COLORS = 8

interface AppearanceCache {
  preset: ThemePresetId
  customPrimaryColor: string | null
  overrides: AdvancedOverrides
}

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function resolveTheme(preference: ThemePreference): ThemeMode {
  return preference === 'system' ? getSystemTheme() : preference
}

function applyDataTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme)
}

function getCachedAppearance(): AppearanceCache {
  if (typeof window === 'undefined') return { preset: 'NUKKAD_INDIGO', customPrimaryColor: null, overrides: EMPTY_OVERRIDES }
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return { preset: 'NUKKAD_INDIGO', customPrimaryColor: null, overrides: EMPTY_OVERRIDES }
    const parsed = JSON.parse(raw) as Partial<AppearanceCache>
    return {
      preset: parsed.preset ?? 'NUKKAD_INDIGO',
      customPrimaryColor: parsed.customPrimaryColor ?? null,
      overrides: { ...EMPTY_OVERRIDES, ...parsed.overrides },
    }
  } catch {
    return { preset: 'NUKKAD_INDIGO', customPrimaryColor: null, overrides: EMPTY_OVERRIDES }
  }
}

function cacheAppearance(cache: AppearanceCache) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

function getStoredRecentColors(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_COLORS_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : []
  } catch {
    return []
  }
}

/** Applies the effective brand colour (preset default = no override, i.e. shipped Buildadda Indigo) + advanced overrides for the given mode. */
function applyEffectiveTheme(mode: ThemeMode, preset: ThemePresetId, customPrimaryColor: string | null, overrides: AdvancedOverrides) {
  applyBrandOverride(resolvePresetBaseColor(preset, customPrimaryColor), mode)

  const root = document.documentElement.style
  const advancedMap: [keyof AdvancedOverrides, string][] = [
    ['sidebarColor', '--nav-surface'],
    ['pageBgColor', '--surface-canvas'],
    ['cardBgColor', '--surface-base'],
    ['headerBgColor', '--header-surface'],
    ['borderColor', '--border-default'],
    ['secondarySurfaceColor', '--surface-sunken'],
  ]
  for (const [key, cssVar] of advancedMap) {
    const value = overrides[key]
    if (value) root.setProperty(cssVar, value)
    else root.removeProperty(cssVar)
  }
}

interface ThemeState {
  themePreference: ThemePreference
  theme: ThemeMode
  preset: ThemePresetId
  customPrimaryColor: string | null
  overrides: AdvancedOverrides
  recentColors: string[]
  hydrated: boolean
  setThemePreference: (preference: ThemePreference) => void
  setPreset: (preset: ThemePresetId) => void
  setCustomColor: (hex: string) => void
  setAdvancedOverride: (key: keyof AdvancedOverrides, hex: string) => void
  hydrateFromServer: (settings: AppearanceSettings) => void
  addRecentColor: (hex: string) => void
  clearRecentColors: () => void
  resetToDefault: () => Promise<void>
  resetTheme: () => void
  resetCustomisation: () => Promise<void>
}

const initialPreference = getStoredPreference()
const initialTheme = resolveTheme(initialPreference)
const initialCache = getCachedAppearance()

export const useThemeStore = create<ThemeState>((set, get) => ({
  themePreference: initialPreference,
  theme: initialTheme,
  preset: initialCache.preset,
  customPrimaryColor: initialCache.customPrimaryColor,
  overrides: initialCache.overrides,
  recentColors: getStoredRecentColors(),
  hydrated: false,

  setThemePreference: (preference) => {
    const resolved = resolveTheme(preference)
    applyDataTheme(resolved)
    localStorage.setItem(THEME_KEY, preference)
    const { preset, customPrimaryColor, overrides } = get()
    applyEffectiveTheme(resolved, preset, customPrimaryColor, overrides)
    set({ theme: resolved, themePreference: preference })

    const backendMode = preference.toUpperCase() as 'LIGHT' | 'DARK' | 'SYSTEM'
    updateAppearanceSettings({ themeMode: backendMode }).catch(() => {
      // Not fatal — localStorage still holds the preference for this device.
    })
  },

  setPreset: (preset) => {
    const { theme, customPrimaryColor, overrides } = get()
    applyEffectiveTheme(theme, preset, customPrimaryColor, overrides)
    cacheAppearance({ preset, customPrimaryColor, overrides })
    set({ preset })

    updateAppearanceSettings({ themePreset: preset }).catch(() => {
      // Not fatal — localStorage still holds the preference for this device.
    })
  },

  setCustomColor: (hex) => {
    const { theme, overrides } = get()
    applyEffectiveTheme(theme, 'CUSTOM', hex, overrides)
    cacheAppearance({ preset: 'CUSTOM', customPrimaryColor: hex, overrides })
    set({ preset: 'CUSTOM', customPrimaryColor: hex })

    if (customColorPersistTimer) clearTimeout(customColorPersistTimer)
    customColorPersistTimer = setTimeout(() => {
      updateAppearanceSettings({ themePreset: 'CUSTOM', customPrimaryColor: hex }).catch(() => {
        // Not fatal — localStorage still holds the preference for this device.
      })
    }, 400)
  },

  setAdvancedOverride: (key, hex) => {
    const { theme, preset, customPrimaryColor, overrides } = get()
    const nextOverrides = { ...overrides, [key]: hex }
    applyEffectiveTheme(theme, preset, customPrimaryColor, nextOverrides)
    cacheAppearance({ preset, customPrimaryColor, overrides: nextOverrides })
    set({ overrides: nextOverrides })

    updateAppearanceSettings({ [key]: hex }).catch(() => {
      // Not fatal — localStorage still holds the preference for this device.
    })
  },

  hydrateFromServer: (settings) => {
    const overrides: AdvancedOverrides = {
      sidebarColor: settings.sidebarColor,
      pageBgColor: settings.pageBgColor,
      cardBgColor: settings.cardBgColor,
      headerBgColor: settings.headerBgColor,
      borderColor: settings.borderColor,
      secondarySurfaceColor: settings.secondarySurfaceColor,
    }
    const preference = settings.themeMode.toLowerCase() as ThemePreference
    const resolved = resolveTheme(preference)

    applyDataTheme(resolved)
    applyEffectiveTheme(resolved, settings.themePreset, settings.customPrimaryColor, overrides)
    localStorage.setItem(THEME_KEY, preference)
    cacheAppearance({ preset: settings.themePreset, customPrimaryColor: settings.customPrimaryColor, overrides })

    set({
      themePreference: preference,
      theme: resolved,
      preset: settings.themePreset,
      customPrimaryColor: settings.customPrimaryColor,
      overrides,
      hydrated: true,
    })
  },

  addRecentColor: (hex) => {
    const current = get().recentColors.filter((c) => c.toLowerCase() !== hex.toLowerCase())
    const next = [hex, ...current].slice(0, MAX_RECENT_COLORS)
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(next))
    set({ recentColors: next })
  },

  clearRecentColors: () => {
    localStorage.removeItem(RECENT_COLORS_KEY)
    set({ recentColors: [] })
  },

  resetToDefault: async () => {
    const settings = await resetAppearanceSettings()
    get().hydrateFromServer(settings)
  },

  /** "Reset Theme" — back to Buildadda Indigo, keeping mode and advanced overrides untouched. */
  resetTheme: () => {
    const { theme, overrides } = get()
    applyEffectiveTheme(theme, 'NUKKAD_INDIGO', null, overrides)
    cacheAppearance({ preset: 'NUKKAD_INDIGO', customPrimaryColor: null, overrides })
    set({ preset: 'NUKKAD_INDIGO', customPrimaryColor: null })

    updateAppearanceSettings({ themePreset: 'NUKKAD_INDIGO' }).catch(() => {
      // Not fatal — localStorage still holds the preference for this device.
    })
  },

  /** "Reset Customisation" — clears only the 6 advanced-override colours. */
  resetCustomisation: async () => {
    const settings = await clearAdvancedOverridesApi()
    get().hydrateFromServer(settings)
  },
}))

// Apply theme immediately on module load, before first paint of the app shell — matches the
// cached mode AND any cached preset/custom colour, so returning users don't flash back to
// Buildadda Indigo before the backend round-trip in AppShell's hydration effect completes.
if (typeof document !== 'undefined') {
  applyDataTheme(initialTheme)
  applyEffectiveTheme(initialTheme, initialCache.preset, initialCache.customPrimaryColor, initialCache.overrides)
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useThemeStore.getState()
    if (state.themePreference === 'system') {
      const resolved = getSystemTheme()
      applyDataTheme(resolved)
      applyEffectiveTheme(resolved, state.preset, state.customPrimaryColor, state.overrides)
      useThemeStore.setState({ theme: resolved })
    }
  })
}
