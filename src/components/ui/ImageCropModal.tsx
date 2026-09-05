import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ImageOff, ZoomIn } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Offset {
  x: number
  y: number
}

interface ImageCropModalProps {
  file: File | null
  aspect: number
  shape?: 'rect' | 'circle'
  title?: string
  outputWidth?: number
  onCancel: () => void
  onConfirm: (file: File) => void
}

function clamp(offset: Offset, dispW: number, dispH: number, vw: number, vh: number): Offset {
  const maxX = Math.max(0, (dispW - vw) / 2)
  const maxY = Math.max(0, (dispH - vh) / 2)
  return { x: Math.min(maxX, Math.max(-maxX, offset.x)), y: Math.min(maxY, Math.max(-maxY, offset.y)) }
}

function ImageCropModalInner({
  file,
  aspect,
  shape = 'rect',
  title = 'Crop photo',
  outputWidth = 1200,
  onCancel,
  onConfirm,
}: ImageCropModalProps & { file: File }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number } | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; startOffset: Offset } | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Created and revoked within the same effect run (rather than a useState initializer +
  // cleanup-only effect) so React StrictMode's dev-only mount->cleanup->mount cycle can't
  // revoke a blob URL that the visible mount is still using — each cycle gets its own URL.
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setObjectUrl(url) // oxlint-disable-line react/set-state-in-effect -- synchronizing with an external system (the blob URL registry) is exactly what this effect is for.
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const box = entries[0].contentRect
      setViewportSize({ w: box.width, h: box.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ready = !!naturalSize && !!viewportSize
  const baseScale = ready ? Math.max(viewportSize!.w / naturalSize!.w, viewportSize!.h / naturalSize!.h) : 1
  const dispW = ready ? naturalSize!.w * baseScale * zoom : 0
  const dispH = ready ? naturalSize!.h * baseScale * zoom : 0

  function updateZoom(next: number) {
    setZoom(next)
    if (!ready) return
    const w = naturalSize!.w * baseScale * next
    const h = naturalSize!.h * baseScale * next
    setOffset((o) => clamp(o, w, h, viewportSize!.w, viewportSize!.h))
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffset: offset }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !ready) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const next = { x: dragRef.current.startOffset.x + dx, y: dragRef.current.startOffset.y + dy }
    setOffset(clamp(next, dispW, dispH, viewportSize!.w, viewportSize!.h))
  }

  function onPointerUp() {
    dragRef.current = null
  }

  function handleConfirm() {
    const img = imgRef.current
    if (!img || !ready || !file) return
    const scaleFactor = baseScale * zoom
    const imgLeft = viewportSize!.w / 2 - dispW / 2 + offset.x
    const imgTop = viewportSize!.h / 2 - dispH / 2 + offset.y
    const srcX = -imgLeft / scaleFactor
    const srcY = -imgTop / scaleFactor
    const srcW = viewportSize!.w / scaleFactor
    const srcH = viewportSize!.h / scaleFactor

    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = Math.round(outputWidth / aspect)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)
    const outputName = file.name.replace(/\.\w+$/, '.jpg')
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        onConfirm(new File([blob], outputName, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.92,
    )
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!ready}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div
          ref={viewportRef}
          style={{ aspectRatio: aspect }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="relative w-full overflow-hidden rounded-lg bg-surface-sunken cursor-grab active:cursor-grabbing touch-none select-none"
        >
          {objectUrl && !loadError && (
            <img
              ref={imgRef}
              src={objectUrl}
              alt=""
              draggable={false}
              onLoad={(e) => setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              onError={() => setLoadError(true)}
              style={ready ? { width: dispW, height: dispH, transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none pointer-events-none"
            />
          )}
          {loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <ImageOff className="size-6 text-fg-muted" />
              <p className="text-sm text-fg-secondary">This file couldn't be loaded as an image. Try a different file.</p>
            </div>
          )}
          {shape === 'circle' && !loadError && (
            <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <ZoomIn className="size-4 text-fg-muted shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => updateZoom(Number(e.target.value))}
            className={cn('w-full accent-brand-500 cursor-pointer')}
          />
        </div>
        <p className="text-xs text-fg-muted -mt-1">Drag to reposition, use the slider to zoom.</p>
      </div>
    </Modal>
  )
}

/** Pan/zoom crop step shown before any avatar or cover-photo upload, so the saved image always matches the display box's aspect ratio instead of being squashed/cropped unpredictably. */
export function ImageCropModal(props: ImageCropModalProps) {
  if (!props.file) return null
  return <ImageCropModalInner key={`${props.file.name}-${props.file.lastModified}`} {...props} file={props.file} />
}
