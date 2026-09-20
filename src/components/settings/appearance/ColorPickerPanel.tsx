import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Copy, Check, AlertTriangle, Trash2 } from 'lucide-react'
import { useThemeStore } from '@/store/theme.store'
import { resolvePresetBaseColor } from '@/lib/theme/presets'
import { checkPrimaryContrast } from '@/lib/theme/apply'
import {
  hexToHsv,
  hsvToHex,
  hexToHsl,
  hslToHex,
  hexToRgb,
  rgbToHex,
  normalizeHex,
  type Hsv,
} from '@/lib/theme/color'
import { toast } from '@/store/toast.store'
import { cn } from '@/lib/utils'

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function SaturationValueSquare({
  hue,
  s,
  v,
  onChange,
  onCommit,
}: {
  hue: number
  s: number
  v: number
  onChange: (s: number, v: number) => void
  onCommit: (hex: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Tracks the last applied colour synchronously (refs don't wait for a render), so pointerup
  // always commits the value actually shown — even if it fires before React re-renders.
  const latestHexRef = useRef(hsvToHex({ h: hue, s, v }))

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = clamp01((clientX - rect.left) / rect.width)
      const y = clamp01((clientY - rect.top) / rect.height)
      const newS = x * 100
      const newV = (1 - y) * 100
      latestHexRef.current = hsvToHex({ h: hue, s: newS, v: newV })
      onChange(newS, newV)
    },
    [onChange, hue],
  )

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromPoint(e.clientX, e.clientY)
  }
  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return
    updateFromPoint(e.clientX, e.clientY)
  }
  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    updateFromPoint(e.clientX, e.clientY)
    onCommit(latestHexRef.current)
  }

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-40 rounded-lg cursor-crosshair touch-none select-none border border-border/60"
      style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hue}, 100%, 50%)` }}
      role="slider"
      aria-label="Saturation and brightness"
      aria-valuenow={Math.round(s)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
    >
      <div
        className="absolute size-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ left: `${s}%`, top: `${100 - v}%`, backgroundColor: hsvToHex({ h: hue, s, v }) }}
      />
    </div>
  )
}

function HueSlider({
  hue,
  s,
  v,
  onChange,
  onCommit,
}: {
  hue: number
  s: number
  v: number
  onChange: (h: number) => void
  onCommit: (hex: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const latestHexRef = useRef(hsvToHex({ h: hue, s, v }))

  const updateFromPoint = useCallback(
    (clientX: number) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = clamp01((clientX - rect.left) / rect.width)
      const newHue = x * 360
      latestHexRef.current = hsvToHex({ h: newHue, s, v })
      onChange(newHue)
    },
    [onChange, s, v],
  )

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromPoint(e.clientX)
  }
  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return
    updateFromPoint(e.clientX)
  }
  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    updateFromPoint(e.clientX)
    onCommit(latestHexRef.current)
  }

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-4 rounded-full cursor-pointer touch-none select-none"
      style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
      role="slider"
      aria-label="Hue"
      aria-valuenow={Math.round(hue)}
      aria-valuemin={0}
      aria-valuemax={360}
      tabIndex={0}
    >
      <div
        className="absolute top-1/2 size-5 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ left: `${(hue / 360) * 100}%`, backgroundColor: `hsl(${hue}, 100%, 50%)` }}
      />
    </div>
  )
}

function NumberField({ label, value, max, onCommit }: { label: string; value: number; max: number; onCommit: (n: number) => void }) {
  const rounded = String(Math.round(value))
  const [text, setText] = useState(rounded)
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setText(rounded)
  }

  // label is always one of the literal "R"/"G"/"B"/"H"/"S%"/"L%" call sites below, so a
  // sanitized-label id is stable and unique across the six fields rendered on this panel.
  const fieldId = `color-channel-${label.replace(/[^a-z0-9]/gi, '').toLowerCase()}`
  return (
    <label className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <input
        type="number"
        id={fieldId}
        name={fieldId}
        min={0}
        max={max}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = clamp01(Number(text) / max) * max
          if (Number.isFinite(n)) onCommit(Math.round(n))
          setText(String(Math.round(clamp01(Number(text) / max) * max)))
        }}
        className="w-full rounded-md border border-border/80 bg-surface px-1.5 py-1 text-center text-xs text-fg focus-visible:outline-none focus-visible:border-brand-500"
      />
      <span className="text-[10px] text-fg-muted uppercase tracking-wide">{label}</span>
    </label>
  )
}

export function ColorPickerPanel() {
  const preset = useThemeStore((s) => s.preset)
  const customPrimaryColor = useThemeStore((s) => s.customPrimaryColor)
  const setCustomColor = useThemeStore((s) => s.setCustomColor)
  const recentColors = useThemeStore((s) => s.recentColors)
  const addRecentColor = useThemeStore((s) => s.addRecentColor)
  const clearRecentColors = useThemeStore((s) => s.clearRecentColors)

  const seedHex = resolvePresetBaseColor(preset, customPrimaryColor) ?? '#4f46e5'
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(seedHex) ?? { h: 243, s: 65, v: 90 })
  const [hexInput, setHexInput] = useState(seedHex)
  const [hexError, setHexError] = useState(false)
  const [copied, setCopied] = useState(false)

  const currentHex = hsvToHex(hsv)

  // Re-seed the working colour when the store's effective colour changes from elsewhere
  // (a preset click, hydration from another device, or a recent-colour pick).
  const [lastSeedHex, setLastSeedHex] = useState(seedHex)
  if (seedHex !== lastSeedHex) {
    setLastSeedHex(seedHex)
    const next = hexToHsv(seedHex)
    if (next) setHsv(next)
    setHexInput(seedHex)
    setHexError(false)
  }

  function applyLive(nextHsv: Hsv) {
    setHsv(nextHsv)
    const hex = hsvToHex(nextHsv)
    setHexInput(hex)
    setHexError(false)
    setCustomColor(hex)
  }

  function commitRecent(hex: string) {
    addRecentColor(hex)
  }

  function handleHexInputChange(value: string) {
    setHexInput(value)
    const normalized = normalizeHex(value)
    if (normalized) {
      setHexError(false)
      const nextHsv = hexToHsv(normalized)
      if (nextHsv) {
        setHsv(nextHsv)
        setCustomColor(normalized)
      }
    } else if (value.trim().length > 0) {
      setHexError(true)
    }
  }

  function handleHexCommit() {
    const normalized = normalizeHex(hexInput)
    if (normalized) {
      addRecentColor(normalized)
      setHexInput(normalized)
    } else {
      // Invalid input on commit — fall back gracefully to the last valid colour instead of leaving garbage.
      setHexInput(currentHex)
      setHexError(false)
    }
  }

  function handleRgbCommit(channel: 'r' | 'g' | 'b', value: number) {
    const rgb = hexToRgb(currentHex) ?? { r: 0, g: 0, b: 0 }
    const nextHex = rgbToHex({ ...rgb, [channel]: value })
    const nextHsv = hexToHsv(nextHex)
    if (nextHsv) applyLive(nextHsv)
    addRecentColor(nextHex)
  }

  function handleHslCommit(channel: 'h' | 's' | 'l', value: number) {
    const hsl = hexToHsl(currentHex) ?? { h: 0, s: 0, l: 50 }
    const nextHex = hslToHex({ ...hsl, [channel]: value })
    const nextHsv = hexToHsv(nextHex)
    if (nextHsv) applyLive(nextHsv)
    addRecentColor(nextHex)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(currentHex)
      setCopied(true)
      toast.success('Colour copied to clipboard')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  const rgb = hexToRgb(currentHex) ?? { r: 0, g: 0, b: 0 }
  const hsl = hexToHsl(currentHex) ?? { h: 0, s: 0, l: 50 }
  const contrast = checkPrimaryContrast(currentHex)

  return (
    <div className="flex flex-col gap-4">
      <SaturationValueSquare hue={hsv.h} s={hsv.s} v={hsv.v} onChange={(s, v) => applyLive({ ...hsv, s, v })} onCommit={commitRecent} />
      <HueSlider hue={hsv.h} s={hsv.s} v={hsv.v} onChange={(h) => applyLive({ ...hsv, h })} onCommit={commitRecent} />

      <div className="flex items-center gap-3">
        <span className="size-10 rounded-full border border-border shrink-0" style={{ backgroundColor: currentHex }} />
        <div className="flex-1 flex items-center gap-1.5">
          <input
            type="text"
            id="custom-color-hex"
            name="custom-color-hex"
            value={hexInput}
            onChange={(e) => handleHexInputChange(e.target.value)}
            onBlur={handleHexCommit}
            onKeyDown={(e) => e.key === 'Enter' && handleHexCommit()}
            spellCheck={false}
            className={cn(
              'w-28 rounded-md border bg-surface px-2 py-1.5 text-sm font-mono text-fg focus-visible:outline-none',
              hexError ? 'border-danger-500' : 'border-border/80 focus-visible:border-brand-500',
            )}
          />
          <button
            type="button"
            onClick={handleCopy}
            className="flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-surface-hover hover:text-fg cursor-pointer transition-colors"
            aria-label="Copy hex colour"
          >
            {copied ? <Check className="size-4 text-success-500" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>
      {hexError && <p className="text-xs text-danger-500 -mt-2">Not a valid hex colour — keep the last valid value or try e.g. #4287f5.</p>}

      <div className="flex gap-2">
        <NumberField label="R" value={rgb.r} max={255} onCommit={(n) => handleRgbCommit('r', n)} />
        <NumberField label="G" value={rgb.g} max={255} onCommit={(n) => handleRgbCommit('g', n)} />
        <NumberField label="B" value={rgb.b} max={255} onCommit={(n) => handleRgbCommit('b', n)} />
      </div>
      <div className="flex gap-2">
        <NumberField label="H" value={hsl.h} max={360} onCommit={(n) => handleHslCommit('h', n)} />
        <NumberField label="S%" value={hsl.s} max={100} onCommit={(n) => handleHslCommit('s', n)} />
        <NumberField label="L%" value={hsl.l} max={100} onCommit={(n) => handleHslCommit('l', n)} />
      </div>

      {!contrast.passesAA && (
        <div className="flex items-start gap-2 rounded-lg border border-warning-500/30 bg-warning-100/40 px-3 py-2.5 text-xs text-fg">
          <AlertTriangle className="size-3.5 text-warning-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>
              This colour has low contrast ({contrast.ratio.toFixed(1)}:1) for white button text. WCAG AA recommends at least 4.5:1.
            </p>
            {contrast.suggestedHex && (
              <button
                type="button"
                className="mt-1.5 font-medium text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                onClick={() => {
                  const suggested = contrast.suggestedHex!
                  const nextHsv = hexToHsv(suggested)
                  if (nextHsv) applyLive(nextHsv)
                  addRecentColor(suggested)
                }}
              >
                Use a safer shade ({contrast.suggestedHex})
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-fg-secondary">Recent colours</span>
          {recentColors.length > 0 && (
            <button
              type="button"
              onClick={clearRecentColors}
              className="flex items-center gap-1 text-[11px] text-fg-muted hover:text-fg cursor-pointer"
            >
              <Trash2 className="size-3" /> Clear
            </button>
          )}
        </div>
        {recentColors.length === 0 ? (
          <p className="text-xs text-fg-muted">Colours you pick will show up here.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentColors.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => {
                  const nextHsv = hexToHsv(hex)
                  if (nextHsv) applyLive(nextHsv)
                }}
                className="size-7 rounded-full border border-border shadow-xs cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: hex }}
                aria-label={`Use recent colour ${hex}`}
                title={hex}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
