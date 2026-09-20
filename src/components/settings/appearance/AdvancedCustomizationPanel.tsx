import { useState } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { useThemeStore, type AdvancedOverrides } from '@/store/theme.store'

const FIELDS: { key: keyof AdvancedOverrides; label: string; cssVar: string }[] = [
  { key: 'sidebarColor', label: 'Sidebar background', cssVar: '--nav-surface' },
  { key: 'pageBgColor', label: 'Page background', cssVar: '--surface-canvas' },
  { key: 'cardBgColor', label: 'Card / surface background', cssVar: '--surface-base' },
  { key: 'headerBgColor', label: 'Header / topbar background', cssVar: '--header-surface' },
  { key: 'borderColor', label: 'Border colour', cssVar: '--border-default' },
  { key: 'secondarySurfaceColor', label: 'Secondary surface', cssVar: '--surface-sunken' },
]

function resolveCurrentColor(cssVar: string): string {
  if (typeof window === 'undefined') return '#ffffff'
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff'
}

export function AdvancedCustomizationPanel() {
  const overrides = useThemeStore((s) => s.overrides)
  const setAdvancedOverride = useThemeStore((s) => s.setAdvancedOverride)
  const resetCustomisation = useThemeStore((s) => s.resetCustomisation)
  const [resetting, setResetting] = useState(false)

  async function handleReset() {
    setResetting(true)
    try {
      await resetCustomisation()
    } finally {
      setResetting(false)
    }
  }

  return (
    <details className="group">
      <summary className="flex items-center justify-between cursor-pointer list-none py-1 select-none">
        <span className="text-sm font-medium text-fg">Advanced customisation</span>
        <ChevronDown className="size-4 text-fg-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="pt-4 flex flex-col gap-3">
        <p className="text-xs text-fg-muted -mt-1">Fine-tune specific surfaces. Most people won't need this.</p>
        {FIELDS.map(({ key, label, cssVar }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-sm text-fg-secondary">{label}</span>
            <input
              type="color"
              id={`theme-color-${key}`}
              name={`theme-color-${key}`}
              value={overrides[key] ?? resolveCurrentColor(cssVar)}
              onChange={(e) => setAdvancedOverride(key, e.target.value)}
              className="size-8 rounded-md border border-border/80 cursor-pointer bg-transparent p-0"
              aria-label={label}
            />
          </div>
        ))}
        <button
          type="button"
          disabled={resetting}
          onClick={handleReset}
          className="self-start mt-1 flex items-center gap-1.5 text-xs font-medium text-fg-muted hover:text-fg cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="size-3" /> Reset customisation
        </button>
      </div>
    </details>
  )
}
