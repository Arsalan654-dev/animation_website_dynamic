import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: 'md' | 'lg' | 'xl'
}

const widths = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Drawer({ open, onClose, title, description, children, footer, width = 'lg' }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : 'Panel'}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={cn(
              'absolute right-0 top-0 flex h-full w-full flex-col border-l border-ink/10 bg-paper shadow-2xl',
              widths[width],
            )}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-ink/10 px-5 py-4">
              <div className="min-w-0">
                {title ? <h2 className="font-display text-2xl leading-tight text-ink">{title}</h2> : null}
                {description ? <p className="mt-1 text-xs leading-relaxed text-ink/50">{description}</p> : null}
              </div>
              <button type="button" onClick={onClose} className="btn-icon -mr-1 shrink-0" aria-label="Close panel">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer ? (
              <footer className="shrink-0 border-t border-ink/10 bg-cream/60 px-5 py-3">{footer}</footer>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
