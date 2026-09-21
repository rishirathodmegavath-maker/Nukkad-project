import { Check } from 'lucide-react'
import { THEME_PRESETS } from '@/lib/theme/presets'
import { useThemeStore } from '@/store/theme.store'
import { cn } from '@/lib/utils'
import type { ThemePresetId } from '@/types'

export function PresetGrid() {
  const preset = useThemeStore((s) => s.preset)
  const setPreset = useThemeStore((s) => s.setPreset)

  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
      {THEME_PRESETS.map((p) => {
        const isSelected = preset === p.id
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id as ThemePresetId)}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
            aria-label={`Use ${p.label} theme`}
            aria-pressed={isSelected}
          >
            <span
              className={cn(
                'flex size-10 items-center justify-center rounded-full border-2 transition-all',
                isSelected ? 'border-fg shadow-md scale-105' : 'border-transparent group-hover:scale-105',
              )}
              style={{ backgroundColor: p.baseHex }}
            >
              {isSelected && <Check className="size-4 text-white drop-shadow-sm" strokeWidth={3} />}
            </span>
            <span className="text-xs font-medium text-fg-secondary text-center leading-tight">{p.label}</span>
          </button>
        )
      })}
    </div>
  )
}
