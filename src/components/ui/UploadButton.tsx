import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UploadCloud, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonClasses, type ButtonSize, type ButtonVariant } from '@/components/ui/button-styles'

export type UploadPhase = 'idle' | 'uploading' | 'done'

interface UploadButtonProps {
  phase: UploadPhase
  idleLabel: ReactNode
  uploadingLabel?: string
  doneLabel?: string
  leftIcon?: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  type?: 'button' | 'submit'
}

/** On light (secondary/outline/ghost) fills a dark bar reads better than a white one. */
const progressBarClasses: Record<ButtonVariant, string> = {
  primary: 'bg-white/30',
  secondary: 'bg-fg/12',
  accent: 'bg-white/30',
  outline: 'bg-fg/12',
  soft: 'bg-fg/12',
  ghost: 'bg-fg/12',
  danger: 'bg-white/30',
  'danger-subtle': 'bg-danger-500/20',
}

const textVariants = {
  initial: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  appear: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
}

/**
 * Button that morphs through idle → uploading (sweeping indeterminate bar) → done
 * (bar fills + checkmark draws in) for any real upload/save mutation. Visual language
 * (text swap, bottom progress sweep, draw-in check) is shared across every upload
 * surface in the app; only labels/colors are per-call-site.
 */
export function UploadButton({
  phase,
  idleLabel,
  uploadingLabel = 'Uploading…',
  doneLabel = 'Done',
  leftIcon,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
}: UploadButtonProps) {
  return (
    <motion.button
      type={type}
      layout
      disabled={disabled || phase !== 'idle'}
      onClick={onClick}
      // Same look as every other button (one shared style table); the upload phases stay fully opaque while disabled.
      className={cn(buttonClasses({ variant, size, className: 'disabled:opacity-100' }), 'relative overflow-hidden', className)}
      transition={{ layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {phase === 'idle' && (
          <motion.span
            key="idle"
            variants={textVariants}
            initial="hidden"
            animate="initial"
            exit="hidden"
            className="relative z-10 inline-flex items-center gap-1.5"
          >
            {leftIcon}
            {idleLabel}
          </motion.span>
        )}
        {phase === 'uploading' && (
          <motion.span
            key="uploading"
            variants={textVariants}
            initial="hidden"
            animate="appear"
            exit="hidden"
            className="relative z-10 inline-flex items-center gap-1.5"
          >
            <motion.span
              className="inline-flex"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: [1, 1.45, 1], opacity: 1 }}
              transition={{
                scale: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 0.2 },
              }}
            >
              <UploadCloud className="size-4" />
            </motion.span>
            {uploadingLabel}
          </motion.span>
        )}
        {phase === 'done' && (
          <motion.span
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 inline-flex items-center gap-1.5"
          >
            <motion.span
              className="inline-flex"
              initial={{ scale: 1.6 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Check className="size-4" />
            </motion.span>
            {doneLabel}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Sweeping/filling progress bar along the bottom edge */}
      <motion.div
        className={cn('absolute bottom-0 left-0', progressBarClasses[variant])}
        initial={false}
        animate={
          phase === 'uploading'
            ? { width: '85%', height: 3, transition: { duration: 1.6, ease: [0.7, 0, 0.2, 1] } }
            : phase === 'done'
              ? { width: '100%', height: '100%', transition: { duration: 0.5, ease: [0.7, 0, 0.2, 1] } }
              : { width: 0, height: 3, transition: { duration: 0.15 } }
        }
      />
    </motion.button>
  )
}

/**
 * Overlay for icon-only upload targets (an avatar, a thumbnail chip). The upload
 * icon grows while the file is in flight and shrinks down to a checkmark once done,
 * mirroring UploadButton's icon so every upload surface reads the same way.
 */
export function UploadSpinnerOverlay({ phase }: { phase: UploadPhase }) {
  const show = phase === 'uploading' || phase === 'done'
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-black/45"
        >
          {phase === 'uploading' ? (
            <motion.div
              className="text-white"
              initial={{ scale: 0.7 }}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            >
              <UploadCloud className="size-5" />
            </motion.div>
          ) : (
            <motion.div
              className="text-white"
              initial={{ scale: 1.7 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Check className="size-5" />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
